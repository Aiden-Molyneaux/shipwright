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

function runJson(project, ...args) {
  const r = spawnSync(process.execPath, [SCRIPT, '--project', project, ...args], { encoding: 'utf8' });
  return { code: r.status, stdout: r.stdout, err: r.stderr };
}

const json = (r) => {
  assert.equal(r.code, 0, r.err);
  return JSON.parse(r.stdout);
};

// Every file under the project, .git included, with its bytes: what "writes nothing" compares.
function snapshot(dir) {
  const out = {};
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else out[path.relative(dir, p)] = fs.readFileSync(p).toString('base64');
    }
  };
  walk(dir);
  return out;
}

function setManifest(project, edit, message = 'manifest') {
  const m = manifestOf(project);
  edit(m);
  write(project, '.claude/shipwright.json', JSON.stringify(m, null, 2));
  git(project, 'commit', '-q', '-am', message);
  return git(project, 'rev-parse', '--short=7', 'HEAD');
}

test('--check --json prints each file\'s state, the skip list, what is not adopted and the fills', () => {
  const s = setup({ template: 'a\n', local: 'a\n', fills: { P: 'Acme' },
    extra: { 'u.md': 'u\n', 'g.md': 'g\n', 'p.md': 'p\n', 'm.md': 'm\n', 's.md': 's\n', 'n.md': 'n\n' } });
  setManifest(s.project, (m) => {
    m.files['t.md'].fills = { F: 'one' };
    m.files['u.md'] = { local: '.claude/u.md', base: s.base };
    m.files['g.md'] = { local: '.claude/g.md', base: s.base };
    m.files['p.md'] = { local: '.claude/p.md', base: s.base, pending: s.base };
    m.files['m.md'] = { local: '.claude/m.md', base: s.base };
    m.files['e.md'] = { local: '.claude/e.md', base: 'fffffff' };
    m.skip = ['s.md'];
  });
  commit(s.project, { '.claude/u.md': 'u\n', '.claude/g.md': 'g\n', '.claude/p.md': 'p\n' });
  const c1 = commit(s.sw, { 't.md': 'a\nb\n' });
  git(s.sw, 'commit', '-q', '--allow-empty', '-m', 'unrelated');
  git(s.sw, 'rm', '-q', 'g.md');
  git(s.sw, 'commit', '-q', '-m', 'rm g');
  const head = git(s.sw, 'rev-parse', '--short=7', 'HEAD');

  const out = json(runJson(s.project, '--check', '--json'));
  assert.deepEqual(out.shipwright, { head, date: out.shipwright.date, subject: 'rm g' });
  assert.match(out.shipwright.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(out.project, s.project.split(path.sep).join('/'));
  assert.deepEqual(out.skip, ['s.md']);
  assert.deepEqual(out.notAdopted, ['n.md']);
  assert.deepEqual(out.fills, { P: 'Acme' });
  const by = Object.fromEntries(out.files.map((f) => [f.template, f]));
  assert.deepEqual(Object.keys(by), ['t.md', 'u.md', 'g.md', 'p.md', 'm.md', 'e.md'], 'manifest order');
  assert.deepEqual(by['t.md'], { template: 't.md', local: '.claude/t.md', base: s.base, state: 'behind', behind: 1,
    commits: [{ sha: c1, date: by['t.md'].commits[0].date, subject: 'c' }], fills: { F: 'one' }, detail: null });
  assert.deepEqual([by['u.md'].state, by['u.md'].behind, by['u.md'].commits, by['u.md'].fills], ['current', 0, [], {}]);
  assert.equal(by['g.md'].state, 'gone');
  assert.match(by['g.md'].detail, /removed or renamed upstream/);
  assert.equal(by['p.md'].state, 'pending');
  assert.match(by['p.md'].detail, new RegExp(`pending ${s.base}`));
  assert.equal(by['m.md'].state, 'missing');
  assert.equal(by['e.md'].state, 'error');
  assert.match(by['e.md'].detail, /not a commit/);
});

test('--check --json exits 0 when the check ran, and 2 with stderr when it could not', () => {
  const s = setup({ template: 'a\n', local: 'a\n' });
  commit(s.sw, { 't.md': 'a\nb\n' });
  assert.equal(runJson(s.project, '--check', '--json').code, 0);
  assert.equal(run(s.project, '--check').code, 1, 'the text check still exits 1 when behind');
  const bad = runJson(path.join(s.root, 'nowhere'), '--check', '--json');
  assert.equal(bad.code, 2);
  assert.equal(bad.stdout, '');
  assert.match(bad.err, /cannot read manifest/);
  assert.equal(runJson(s.project, '--dry-run', '--json').code, 2);
});

test('lastSync is the newest commit that moved a base, not a later manifest edit or an adoption', () => {
  const s = setup({ template: 'a\n', local: 'a\n', extra: { 'u.md': 'u\n' } });
  assert.equal(json(runJson(s.project, '--check', '--json')).lastSync, null, 'a manifest that never moved a base');
  const to = commit(s.sw, { 't.md': 'a\nb\n' });
  const sync = setManifest(s.project, (m) => { m.files['t.md'].base = to; }, 'sync to shipwright');
  setManifest(s.project, (m) => { m.files['u.md'] = { local: '.claude/u.md', base: to }; }, 'adopt u');
  setManifest(s.project, (m) => { m.fills = { P: 'reworded' }; }, 'refactor the manifest');
  const { lastSync } = json(runJson(s.project, '--check', '--json'));
  assert.equal(lastSync.sha, sync);
  assert.equal(lastSync.subject, 'sync to shipwright');
  assert.match(lastSync.date, /^\d{4}-\d{2}-\d{2}$/);
});

test('--diff --json gives the adaptation, the upstream change and the hunks that would conflict', () => {
  const s = setup({ template: 'Name: {{P}}\nkeep\nrule\nmore\n\n\n\n\n\nend\n',
    local: 'Name: Acme\nkeep\nlocal rule\nmore\n\n\n\n\n\nend\n', fills: { P: 'Acme' } });
  const to = commit(s.sw, { 't.md': 'Name: {{P}}\nkeep\nnew rule\nmore\n\n\n\n\n\nend\nadded\n' });
  const before = snapshot(s.project);
  const out = json(runJson(s.project, '--diff', 't.md', '--json'));
  assert.deepEqual(Object.keys(out).sort(), ['adaptation', 'conflicts', 'upstream']);
  assert.match(out.adaptation, new RegExp(`^--- t\\.md @ ${s.base}$`, 'm'));
  assert.match(out.adaptation, /^\+\+\+ \.claude\/t\.md$/m);
  assert.match(out.adaptation, /^-rule$/m);
  assert.match(out.adaptation, /^\+local rule$/m);
  assert.doesNotMatch(out.adaptation, /^[-+]Name/m, 'fills are not an adaptation');
  assert.match(out.upstream, new RegExp(`^\\+\\+\\+ t\\.md @ ${to}$`, 'm'));
  assert.match(out.upstream, /^\+new rule$/m);
  assert.match(out.upstream, /^\+added$/m);
  assert.equal(out.conflicts.length, 1, 'the added line merges clean');
  assert.deepEqual(out.conflicts[0].base, { start: 3, lines: 1 });
  assert.deepEqual(out.conflicts[0].upstream, { start: 3, lines: 1 });
  assert.deepEqual(out.conflicts[0].local, { start: 3, lines: 1 });
  assert.deepEqual(out.conflicts[0].hunks, [0]);
  assert.deepEqual(snapshot(s.project), before);
});

test('lastSync names the commit on the branch, not its merge, for a project in a subfolder of its repo', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tsync-test-'));
  const sw = path.join(root, 'sw');
  const repo = path.join(root, 'repo');
  const project = path.join(repo, 'sub dir');
  fs.mkdirSync(sw);
  fs.mkdirSync(project, { recursive: true });
  git(sw, 'init', '-q', '-b', 'main');
  git(repo, 'init', '-q', '-b', 'main');
  const b0 = commit(sw, { 't.md': 'a\n', 'templates.json': JSON.stringify({ templates: ['t.md'] }) });
  const b1 = commit(sw, { 't.md': 'a\nb\n' });
  const manifest = (base, fills = {}) => JSON.stringify({ shipwright: sw, fills, files: { 't.md': { local: '.claude/t.md', base } } }, null, 2);
  commit(repo, { 'sub dir/.claude/t.md': 'a\n', 'sub dir/.claude/shipwright.json': manifest(b0) });
  git(repo, 'checkout', '-q', '-b', 'sync');
  write(project, '.claude/shipwright.json', manifest(b1));
  git(repo, 'commit', '-q', '-am', 'sync on a branch');
  const sync = git(repo, 'rev-parse', '--short=7', 'HEAD');
  git(repo, 'checkout', '-q', 'main');
  commit(repo, { 'other.txt': 'x\n' });
  git(repo, 'merge', '-q', '--no-ff', 'sync', '-m', 'merge sync');
  write(project, '.claude/shipwright.json', manifest(b1, { P: 'x' }));
  git(repo, 'commit', '-q', '-am', 'refactor');
  const { lastSync } = json(runJson(project, '--check', '--json'));
  assert.equal(lastSync?.sha, sync);
});

test('--diff --json finds a conflict on lines that start with ++', () => {
  const s = setup({ template: 'a\nb\nc\n', local: 'a\n++x\nc\n' });
  commit(s.sw, { 't.md': 'a\n++y\nc\n' });
  const out = json(runJson(s.project, '--diff', 't.md', '--json'));
  assert.equal(out.conflicts.length, 1);
  assert.deepEqual(out.conflicts[0].local, { start: 2, lines: 1 });
  assert.deepEqual(out.conflicts[0].upstream, { start: 2, lines: 1 });
});

test('--diff --json marks only the upstream hunk that conflicts, not one whose context a local edit reaches', () => {
  const lines = Array.from({ length: 30 }, (_, i) => `b${i}`);
  const local = [...lines.slice(0, 8), 'X', ...lines.slice(15)];
  const theirs = lines.map((l, i) => (i === 9 || i === 17 ? `${l} new` : l));
  const s = setup({ template: `${lines.join('\n')}\n`, local: `${local.join('\n')}\n` });
  commit(s.sw, { 't.md': `${theirs.join('\n')}\n` });
  const out = json(runJson(s.project, '--diff', 't.md', '--json'));
  assert.equal((out.upstream.match(/^@@/gm) ?? []).length, 2);
  assert.equal(out.conflicts.length, 1);
  assert.deepEqual(out.conflicts[0].base, { start: 9, lines: 7 });
  assert.deepEqual(out.conflicts[0].hunks, [0]);
});

test('--diff --json on a current file has no upstream change and no conflicts', () => {
  const s = setup({ template: 'a\nb\n', local: 'a\nb2\n' });
  const out = json(runJson(s.project, '--diff', 't.md', '--json'));
  assert.equal(out.upstream, '');
  assert.deepEqual(out.conflicts, []);
  assert.match(out.adaptation, /^\+b2$/m);
});

test('--diff refuses a template the manifest does not map, and needs a template', () => {
  const s = setup({ template: 'a\n', local: 'a\n' });
  const r = runJson(s.project, '--diff', 'nope.md', '--json');
  assert.equal(r.code, 2);
  assert.match(r.err, /nope\.md is not in the manifest/);
  assert.equal(runJson(s.project, '--diff').code, 2);
});

test('--check --json and --diff --json write nothing into the project', () => {
  const s = setup({ template: 'a\nrule\nc\n', local: 'a\nlocal rule\nc\n' });
  commit(s.sw, { 't.md': 'a\nnew rule\nc\n' });
  const before = snapshot(s.project);
  json(runJson(s.project, '--check', '--json'));
  json(runJson(s.project, '--diff', 't.md', '--json'));
  assert.deepEqual(snapshot(s.project), before);
});
