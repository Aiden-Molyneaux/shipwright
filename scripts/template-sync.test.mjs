// Tests for template-sync.mjs: throwaway Shipwright and project repos under the OS temp folder.
// Run: node --test scripts/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'template-sync.mjs');

function git(cwd, ...args) {
  const r = spawnSync('git', ['-C', cwd, '-c', 'core.autocrlf=false', '-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
}

function write(dir, file, text) {
  fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  fs.writeFileSync(path.join(dir, file), text);
}

function commit(dir, files) {
  for (const [file, text] of Object.entries(files)) write(dir, file, text);
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'c');
  return git(dir, 'rev-parse', '--short=7', 'HEAD');
}

// A Shipwright with t.md at commit `base`, and a project with its filled copy at .claude/t.md.
function setup({ template, local, fills = {}, extra = {} }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tsync-test-'));
  const sw = path.join(root, 'sw');
  const project = path.join(root, 'project');
  fs.mkdirSync(sw);
  fs.mkdirSync(project);
  git(sw, 'init', '-q', '-b', 'main');
  git(project, 'init', '-q', '-b', 'main');
  const base = commit(sw, { 't.md': template, 'templates.json': JSON.stringify({ templates: ['t.md', ...Object.keys(extra)] }), ...extra });
  const manifest = { shipwright: sw, fills, files: { 't.md': { local: '.claude/t.md', base } } };
  commit(project, { '.claude/t.md': local, '.claude/shipwright.json': JSON.stringify(manifest, null, 2) });
  return { root, sw, project, base };
}

function run(project, ...args) {
  const r = spawnSync(process.execPath, [SCRIPT, '--project', project, ...args], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout + r.stderr };
}

const manifestOf = (project) => JSON.parse(fs.readFileSync(path.join(project, '.claude/shipwright.json'), 'utf8'));
const localOf = (project) => fs.readFileSync(path.join(project, '.claude/t.md'), 'utf8');

test('a template change merges into a filled copy and moves base', () => {
  const s = setup({ template: 'Name: {{P}}\n\nrule one\n', local: 'Name: Acme\n\nrule one\n', fills: { P: 'Acme' } });
  const to = commit(s.sw, { 't.md': 'Name: {{P}}\n\nrule one\nrule two\n' });
  const r = run(s.project);
  assert.equal(r.code, 0, r.out);
  assert.equal(localOf(s.project), 'Name: Acme\n\nrule one\nrule two\n');
  assert.equal(manifestOf(s.project).files['t.md'].base, to);
});

test('a filled line the template rewords merges clean', () => {
  const s = setup({ template: 'Use {{P}} here\nb\n', local: 'Use Acme here\nb\n', fills: { P: 'Acme' } });
  commit(s.sw, { 't.md': 'Use "{{P}}" here\nb\n' });
  assert.equal(run(s.project).code, 0);
  assert.equal(localOf(s.project), 'Use "Acme" here\nb\n');
});

test('a conflict leaves markers and pending; --accept refuses until resolved', () => {
  const s = setup({ template: 'a\nrule\nc\n', local: 'a\nlocal rule\nc\n' });
  const to = commit(s.sw, { 't.md': 'a\nnew rule\nc\n' });
  const r = run(s.project);
  assert.equal(r.code, 1, r.out);
  assert.match(localOf(s.project), /<<<<<<< [\s\S]*\|\|\|\|\|\|\| [\s\S]*>>>>>>> /);
  assert.equal(manifestOf(s.project).files['t.md'].pending, to);
  assert.equal(run(s.project, '--accept').code, 1);
  write(s.project, '.claude/t.md', 'a\nlocal rule, new\nc\n');
  assert.equal(run(s.project, '--accept').code, 0);
  const entry = manifestOf(s.project).files['t.md'];
  assert.equal(entry.base, to);
  assert.equal(entry.pending, undefined);
});

test('CRLF copies merge line by line and stay CRLF; a BOM survives', () => {
  const s = setup({ template: 'a\nb\nc\nd\n', local: '﻿a\r\nb\r\nc\r\nd\r\n' });
  commit(s.sw, { 't.md': 'a\nb\nc\nd2\n' });
  assert.equal(run(s.project).code, 0);
  assert.equal(localOf(s.project), '﻿a\r\nb\r\nc\r\nd2\r\n');
});

test('a retired placeholder conflicts instead of replacing the fill', () => {
  const s = setup({ template: 'top\n\n{{RHYTHM}}\n\nend\n', local: 'top\n\nour own rhythm\n\nend\n', fills: { RHYTHM: 'our own rhythm' } });
  commit(s.sw, { 't.md': 'top\n\ndefault rhythm prose\n\nend\n' });
  const r = run(s.project);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /retired upstream: \{\{RHYTHM\}\}/);
  assert.doesNotMatch(r.out, /no fill for/);
  assert.match(localOf(s.project), /our own rhythm[\s\S]*default rhythm prose/);
});

test('a new placeholder with no fill goes pending', () => {
  const s = setup({ template: 'a\nb\n', local: 'a\nb\n' });
  commit(s.sw, { 't.md': 'a\nb\nSee {{NEW}}.\n' });
  const r = run(s.project);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /needs-fill .*no fill for \{\{NEW\}\}/);
  assert.ok(manifestOf(s.project).files['t.md'].pending);
});

test('the Adopting section is dropped, code fences and all', () => {
  const adopt = (n) => `## Adopting this template\n\nCopy it.\n\n\`\`\`sh\n# install ${n}\n\`\`\`\n\nThen delete this section.\n`;
  const s = setup({ template: `# T\n\nbody\n\n${adopt('a')}\n## Next\n\nmore\n`, local: '# T\n\nbody\n\n## Next\n\nmore\n' });
  commit(s.sw, { 't.md': `# T\n\nbody\n\n${adopt('b').replace('Then delete', 'Afterwards delete')}\n## Next\n\nmore\n` });
  assert.equal(run(s.project).code, 0);
  assert.equal(localOf(s.project), '# T\n\nbody\n\n## Next\n\nmore\n');
});

test('uncommitted or untracked local copies are refused', () => {
  const s = setup({ template: 'a\n', local: 'a\n' });
  commit(s.sw, { 't.md': 'a\nb\n' });
  write(s.project, '.claude/t.md', 'a edited\n');
  const r = run(s.project);
  assert.equal(r.code, 1);
  assert.match(r.out, /skipped .*uncommitted/);
  assert.equal(localOf(s.project), 'a edited\n');
  git(s.project, 'rm', '-q', '--cached', '.claude/t.md');
  assert.match(run(s.project).out, /skipped .*not tracked/);
  write(s.project, '.gitignore', '.claude/t.md\n');
  assert.match(run(s.project).out, /skipped .*not tracked/);
  fs.rmSync(path.join(s.project, '.git'), { recursive: true, force: true });
  assert.match(run(s.project).out, /skipped .*not tracked/);
  assert.equal(localOf(s.project), 'a edited\n');
});

test('a manifest entry with no local path is an error row, not a failed run', () => {
  const s = setup({ template: 'a\n', local: 'a\n' });
  commit(s.sw, { 't.md': 'a\nb\n' });
  const m = manifestOf(s.project);
  m.files['u.md'] = { loacl: 'x', base: m.files['t.md'].base };
  write(s.project, '.claude/shipwright.json', JSON.stringify(m));
  git(s.project, 'commit', '-q', '-am', 'typo');
  const r = run(s.project);
  assert.equal(r.code, 1);
  assert.match(r.out, /error +u\.md .*no "local"/);
  assert.match(r.out, /merged +t\.md/);
});

test('a file that fails to write keeps an earlier conflict pending', () => {
  const s = setup({ template: 'a\nrule\nc\n', local: 'a\nlocal rule\nc\n', extra: { 'u.md': 'x\n' } });
  const m = manifestOf(s.project);
  m.files['u.md'] = { local: '.claude/u.md', base: m.files['t.md'].base };
  write(s.project, '.claude/shipwright.json', JSON.stringify(m));
  commit(s.project, { '.claude/u.md': 'x\n' });
  commit(s.sw, { 't.md': 'a\nnew rule\nc\n', 'u.md': 'x\ny\n' });
  fs.chmodSync(path.join(s.project, '.claude/u.md'), 0o444);
  const r = run(s.project);
  fs.chmodSync(path.join(s.project, '.claude/u.md'), 0o644);
  assert.equal(r.code, 1);
  assert.match(r.out, /conflict +t\.md/);
  assert.match(r.out, /error +u\.md/);
  assert.ok(manifestOf(s.project).files['t.md'].pending);
  assert.match(localOf(s.project), /<<<<<<< /);
});

test('a fill missing from the manifest is not flagged when the copy already has its words', () => {
  const s = setup({ template: 'Use {{FV}}\n\nb\n', local: 'Use our words\n\nb\n' });
  commit(s.sw, { 't.md': 'Use {{FV}}\n\nb\nc\n' });
  const r = run(s.project);
  assert.equal(r.code, 0, r.out);
  assert.equal(localOf(s.project), 'Use our words\n\nb\nc\n');
});

test('--dry-run writes nothing in the project', () => {
  const s = setup({ template: 'a\n', local: 'a\n' });
  commit(s.sw, { 't.md': 'a\nb\n' });
  const before = fs.readFileSync(path.join(s.project, '.claude/shipwright.json'), 'utf8');
  const out = path.join(s.root, 'out');
  assert.equal(run(s.project, '--dry-run', '--out', out).code, 0);
  assert.equal(localOf(s.project), 'a\n');
  assert.equal(fs.readFileSync(path.join(s.project, '.claude/shipwright.json'), 'utf8'), before);
  assert.equal(fs.readFileSync(path.join(out, '.claude/t.md'), 'utf8'), 'a\nb\n');
});

test('--check counts commits behind, reports gone and new templates', () => {
  const s = setup({ template: 'a\n', local: 'a\n', extra: { 'n.md': 'new\n' } });
  assert.equal(run(s.project, '--check').code, 1, 'n.md is neither mapped nor skipped');
  const m = manifestOf(s.project);
  m.skip = ['n.md'];
  write(s.project, '.claude/shipwright.json', JSON.stringify(m));
  assert.equal(run(s.project, '--check').code, 0);
  commit(s.sw, { 't.md': 'a\nb\n' });
  assert.match(run(s.project, '--check').out, /1 behind +t\.md/);
  git(s.sw, 'rm', '-q', 't.md');
  git(s.sw, 'commit', '-q', '-m', 'rm');
  assert.match(run(s.project, '--check').out, /gone +t\.md/);
});
