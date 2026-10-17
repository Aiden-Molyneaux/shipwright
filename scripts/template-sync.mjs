#!/usr/bin/env node
// Three-way merge Shipwright template changes into a project's filled copies.
// Run from the project's own session. Design: docs/template-sync.md.
//
//   node <shipwright>/scripts/template-sync.mjs            sync every mapped file to Shipwright main
//   node <shipwright>/scripts/template-sync.mjs --dry-run  merge into a scratch folder, write nothing here
//   node <shipwright>/scripts/template-sync.mjs --check    how far behind; exit 1 when anything is
//   node <shipwright>/scripts/template-sync.mjs --accept   move resolved files' base to their pending commit
//
// Options: --project <dir> (default: cwd), --manifest <file> (default: <project>/.claude/shipwright.json),
// --to <rev> (default: main), --out <dir> (dry run only).
// No dependencies beyond Node and git. Never commits; the project's session does that.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ADOPTING_HEADING = /^## Adopting this template\s*$/;
const PLACEHOLDER = /\{\{([A-Z0-9_]+)\}\}/g;
const MARKER = /^(<{7}|\|{7}|>{7})( |$)/m;

function usage(message) {
  if (message) console.error(`template-sync: ${message}`);
  console.error('usage: template-sync.mjs [--dry-run [--out <dir>] | --check | --accept] [--project <dir>] [--manifest <file>] [--to <rev>]');
  process.exit(2);
}

function parseArgs(argv) {
  const opts = { mode: 'sync', project: process.cwd(), manifest: null, to: 'main', out: null };
  const modes = { '--dry-run': 'dry-run', '--check': 'check', '--accept': 'accept' };
  const valued = { '--project': 'project', '--manifest': 'manifest', '--to': 'to', '--out': 'out' };
  let modeSet = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (modes[arg]) {
      if (modeSet) usage('pick one of --dry-run, --check, --accept');
      opts.mode = modes[arg];
      modeSet = true;
    } else if (valued[arg]) {
      if (i + 1 >= argv.length) usage(`${arg} needs a value`);
      opts[valued[arg]] = argv[++i];
    } else if (arg === '--help' || arg === '-h') {
      usage();
    } else {
      usage(`unknown argument ${arg}`);
    }
  }
  if (opts.out && opts.mode !== 'dry-run') usage('--out is for --dry-run only');
  opts.project = path.resolve(opts.project);
  opts.manifest = path.resolve(opts.manifest ?? path.join(opts.project, '.claude', 'shipwright.json'));
  return opts;
}

function git(cwd, args, { allowFail = false } = {}) {
  const r = spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) {
    if (allowFail) return null;
    throw new Error(`git ${args.join(' ')} failed: ${(r.stderr || '').trim()}`);
  }
  return r.stdout;
}

const toLf = (text) => text.replace(/\r\n/g, '\n');

// The template file at a commit, LF, or null when the commit does not have it.
function templateAt(shipwright, rev, template) {
  const text = git(shipwright, ['show', `${rev}:${template}`], { allowFail: true });
  return text === null ? null : toLf(text);
}

// Drop the "Adopting this template" section, then fill every placeholder the project recorded.
function render(text, fills) {
  const lines = text.split('\n');
  const kept = [];
  let dropping = false;
  for (const line of lines) {
    if (ADOPTING_HEADING.test(line)) { dropping = true; continue; }
    if (dropping && /^#{1,2} /.test(line)) dropping = false;
    if (!dropping) kept.push(line);
  }
  return kept.join('\n').replace(PLACEHOLDER, (match, name) => (name in fills ? fills[name] : match));
}

function unfilled(text) {
  return [...new Set([...text.matchAll(PLACEHOLDER)].map((m) => m[1]))];
}

function mergeFile(tmp, ours, base, theirs, labels) {
  const files = ['ours', 'base', 'theirs'].map((n) => path.join(tmp, n));
  fs.writeFileSync(files[0], ours);
  fs.writeFileSync(files[1], base);
  fs.writeFileSync(files[2], theirs);
  const r = spawnSync('git', ['merge-file', '-p', '--diff3',
    '-L', labels[0], '-L', labels[1], '-L', labels[2], ...files], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status === null || r.status < 0 || r.status > 127 || (r.status !== 0 && !r.stdout)) {
    throw new Error(`git merge-file failed: ${(r.stderr || '').trim()}`);
  }
  return { merged: r.stdout, conflicts: r.status };
}

function readManifest(file) {
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    usage(`cannot read manifest ${file}: ${err.message}`);
  }
  if (!manifest.files || typeof manifest.files !== 'object') usage(`${file} has no "files" map`);
  manifest.fills ??= {};
  manifest.skip ??= [];
  return manifest;
}

function shipwrightRoot(manifest, manifestFile) {
  const fromManifest = manifest.shipwright && path.resolve(path.dirname(manifestFile), manifest.shipwright);
  return fromManifest || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

function short(shipwright, rev) {
  const sha = git(shipwright, ['rev-parse', '--verify', '--quiet', '--short=7', `${rev}^{commit}`], { allowFail: true });
  if (!sha) usage(`${rev} is not a commit in ${shipwright}`);
  return sha.trim();
}

// Templates Shipwright lists at <to> that the project neither maps nor skips.
function unmapped(shipwright, to, manifest) {
  const listed = git(shipwright, ['show', `${to}:templates.json`], { allowFail: true });
  if (listed === null) return { list: [], note: `templates.json not found at ${to}` };
  const known = new Set([...Object.keys(manifest.files), ...manifest.skip]);
  return { list: JSON.parse(listed).templates.filter((t) => !known.has(t)), note: null };
}

function writeManifest(file, manifest) {
  fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
}

function check(opts, manifest, shipwright, to) {
  let behind = 0;
  const lines = [];
  for (const [template, entry] of Object.entries(manifest.files)) {
    const count = Number(git(shipwright, ['rev-list', '--count', `${entry.base}..${to}`, '--', template]).trim());
    const pending = entry.pending ? `, pending ${entry.pending}` : '';
    if (count > 0) behind++;
    lines.push(`  ${count > 0 ? `${count} behind` : 'current '.padEnd(9)}  ${template} (base ${entry.base}${pending})`);
  }
  const extra = unmapped(shipwright, to, manifest);
  console.log(`Shipwright ${to}: ${behind} of ${Object.keys(manifest.files).length} files behind, ${extra.list.length} templates not adopted or skipped`);
  for (const line of lines) console.log(line);
  for (const t of extra.list) console.log(`  new        ${t}`);
  if (extra.note) console.log(`  note: ${extra.note}`);
  return behind > 0 || extra.list.length > 0 ? 1 : 0;
}

function accept(opts, manifest) {
  let open = 0;
  let moved = 0;
  for (const [template, entry] of Object.entries(manifest.files)) {
    if (!entry.pending) continue;
    const text = fs.readFileSync(path.join(opts.project, entry.local), 'utf8');
    const problems = [];
    if (MARKER.test(text)) problems.push('conflict markers');
    const left = unfilled(text);
    if (left.length) problems.push(`placeholders ${left.map((n) => `{{${n}}}`).join(', ')}`);
    if (problems.length) {
      open++;
      console.log(`  still open  ${entry.local}: ${problems.join('; ')}`);
      continue;
    }
    console.log(`  accepted    ${entry.local}: base ${entry.base} -> ${entry.pending}`);
    entry.base = entry.pending;
    delete entry.pending;
    moved++;
  }
  if (moved) writeManifest(opts.manifest, manifest);
  if (!moved && !open) console.log('Nothing pending.');
  return open ? 1 : 0;
}

function sync(opts, manifest, shipwright, to) {
  const dry = opts.mode === 'dry-run';
  const out = dry ? path.resolve(opts.out ?? fs.mkdtempSync(path.join(os.tmpdir(), 'template-sync-'))) : null;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'template-sync-merge-'));
  const rows = [];
  let conflicted = 0;
  let changed = false;

  try {
    for (const [template, entry] of Object.entries(manifest.files)) {
      const fills = { ...manifest.fills, ...(entry.fills ?? {}) };
      const localPath = path.join(opts.project, entry.local);
      const row = (status, detail = '') => rows.push({ status, template, local: entry.local, detail });

      if (entry.pending) { row('pending', `resolve, then --accept (pending ${entry.pending})`); conflicted++; continue; }
      if (!fs.existsSync(localPath)) { row('missing', 'no local file'); continue; }
      const baseRaw = templateAt(shipwright, entry.base, template);
      if (baseRaw === null) { row('error', `not in Shipwright at base ${entry.base}`); continue; }
      const theirsRaw = templateAt(shipwright, to, template);
      if (theirsRaw === null) { row('gone', `removed or renamed upstream by ${to}; local copy left alone`); continue; }
      if (entry.base === to) { row('current'); continue; }

      if (!dry) {
        const dirty = git(opts.project, ['status', '--porcelain', '--', entry.local], { allowFail: true });
        if (dirty && dirty.trim()) { row('skipped', 'uncommitted changes in the local copy; commit or set them aside first'); continue; }
      }

      const rawOurs = fs.readFileSync(localPath, 'utf8');
      const crlf = rawOurs.includes('\r\n');
      const ours = toLf(rawOurs);
      const base = render(baseRaw, fills);
      const theirs = render(theirsRaw, fills);
      const { merged, conflicts } = mergeFile(tmp, ours, base, theirs,
        [entry.local, `shipwright ${entry.base}`, `shipwright ${to}`]);
      const missingFills = unfilled(theirs).filter((n) => !unfilled(ours).includes(n));
      const fillNote = missingFills.length ? `; no fill for ${missingFills.map((n) => `{{${n}}}`).join(', ')}` : '';

      const written = crlf ? merged.replace(/\n/g, '\r\n') : merged;
      if (dry) {
        const target = path.join(out, entry.local);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, written);
      } else if (written !== rawOurs) {
        fs.writeFileSync(localPath, written);
      }

      if (conflicts > 0) {
        conflicted++;
        if (!dry) { entry.pending = to; changed = true; }
        row('conflict', `${conflicts} hunk${conflicts === 1 ? '' : 's'}${fillNote}`);
      } else {
        if (!dry) { entry.base = to; changed = true; }
        row(theirs === base ? 'unchanged' : merged === ours ? 'already-in' : 'merged', fillNote.replace(/^; /, ''));
      }
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  if (changed) writeManifest(opts.manifest, manifest);

  const extra = unmapped(shipwright, to, manifest);
  console.log(`${dry ? 'Dry run: ' : ''}${path.basename(opts.project)} to Shipwright ${to}`);
  for (const r of rows) {
    console.log(`  ${r.status.padEnd(10)} ${r.template} -> ${r.local}${r.detail ? `  (${r.detail})` : ''}`);
  }
  for (const t of extra.list) console.log(`  new        ${t}  (not adopted or skipped; adopt it by hand, then map it)`);
  if (extra.note) console.log(`  note: ${extra.note}`);
  if (dry) console.log(`Merged copies: ${out}`);
  else if (conflicted) console.log('Resolve the conflict markers (Murr reviews), then run --accept.');
  return conflicted ? 1 : 0;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const manifest = readManifest(opts.manifest);
  if (opts.mode === 'accept') return accept(opts, manifest);
  const shipwright = shipwrightRoot(manifest, opts.manifest);
  const to = short(shipwright, opts.to);
  for (const entry of Object.values(manifest.files)) entry.base = short(shipwright, entry.base);
  return opts.mode === 'check' ? check(opts, manifest, shipwright, to) : sync(opts, manifest, shipwright, to);
}

try {
  process.exitCode = main();
} catch (err) {
  console.error(`template-sync: ${err.message}`);
  process.exitCode = 2;
}
