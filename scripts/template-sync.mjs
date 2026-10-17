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
// Exit codes: 0 all done, 1 something needs the session (a conflict, a fill, a skipped or failed file), 2 usage.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ADOPTING_HEADING = /^## Adopting this template\s*$/;
const PLACEHOLDER = /\{\{([A-Z0-9_]+)\}\}/g;
// `=======` is left out on purpose: it is also a setext heading underline.
const MARKER = /^(<{7}|\|{7}|>{7})( |$)/m;
const DONE = new Set(['merged', 'unchanged', 'already-in', 'current']);

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

// Drop the "Adopting this template" section (up to the next level 1 or 2 heading outside a code
// fence), then fill every placeholder the project recorded.
function render(text, fills) {
  const kept = [];
  let dropping = false;
  let fence = null;
  for (const line of text.split('\n')) {
    const opener = line.match(/^\s*(`{3,}|~{3,})/);
    if (opener) {
      if (!fence) fence = opener[1][0];
      else if (opener[1][0] === fence) fence = null;
    }
    if (!fence && !opener) {
      if (ADOPTING_HEADING.test(line)) { dropping = true; continue; }
      if (dropping && /^#{1,2} /.test(line)) dropping = false;
    }
    if (!dropping) kept.push(line);
  }
  return kept.join('\n').replace(PLACEHOLDER, (match, name) => (name in fills ? fills[name] : match));
}

function unfilled(text) {
  return [...new Set([...text.matchAll(PLACEHOLDER)].map((m) => m[1]))];
}

// How a local file is laid out, so the merge can work in LF and write the file back the same way.
function splitLayout(raw) {
  const bom = raw.startsWith('﻿');
  const body = bom ? raw.slice(1) : raw;
  const crlf = (body.match(/\r\n/g) ?? []).length;
  const lf = (body.match(/\n/g) ?? []).length - crlf;
  return { bom, crlf: crlf > lf, text: toLf(body) };
}

function joinLayout({ bom, crlf }, text) {
  return (bom ? '﻿' : '') + (crlf ? text.replace(/\n/g, '\r\n') : text);
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

// The manifest as written (kept for writing back untouched apart from base and pending) and the
// fills and skip list with their defaults.
function readManifest(file) {
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    usage(`cannot read manifest ${file}: ${err.message}`);
  }
  if (!raw || typeof raw.files !== 'object' || raw.files === null) usage(`${file} has no "files" map`);
  const fills = Object.fromEntries(Object.entries(raw.fills ?? {}).map(([k, v]) => [k, toLf(String(v))]));
  return { raw, fills, skip: raw.skip ?? [] };
}

function writeManifest(file, raw) {
  fs.writeFileSync(file, `${JSON.stringify(raw, null, 2)}\n`);
}

function shipwrightRoot(raw, manifestFile) {
  const fromManifest = raw.shipwright && path.resolve(path.dirname(manifestFile), raw.shipwright);
  return fromManifest || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

function shortSha(shipwright, rev) {
  const sha = git(shipwright, ['rev-parse', '--verify', '--quiet', '--short=7', `${rev}^{commit}`], { allowFail: true });
  return sha ? sha.trim() : null;
}

// One entry's problems before anything is read or written: its shape, and a local path inside the project.
function entryProblem(project, entry) {
  if (!entry || typeof entry !== 'object') return 'entry is not an object';
  if (typeof entry.local !== 'string' || !entry.local) return 'no "local" path';
  if (typeof entry.base !== 'string' || !entry.base) return 'no "base" commit';
  if (entry.fills !== undefined && (typeof entry.fills !== 'object' || entry.fills === null)) return '"fills" is not an object';
  const rel = path.relative(project, path.resolve(project, entry.local));
  if (!rel || rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) return `"local" ${entry.local} is outside the project`;
  return null;
}

// Templates Shipwright lists at <to> that the project neither maps nor skips.
function unmapped(shipwright, to, raw, skip) {
  const listed = git(shipwright, ['show', `${to}:templates.json`], { allowFail: true });
  if (listed === null) return { list: [], note: `templates.json not found at ${to}` };
  const known = new Set([...Object.keys(raw.files), ...skip]);
  return { list: JSON.parse(listed).templates.filter((t) => !known.has(t)), note: null };
}

function check(opts, m, shipwright, to) {
  let behind = 0;
  let attention = 0;
  const lines = [];
  for (const [template, entry] of Object.entries(m.raw.files)) {
    const problem = entryProblem(opts.project, entry);
    const base = problem ? null : shortSha(shipwright, entry.base);
    if (!base) { attention++; lines.push(`  error      ${template} (${problem ?? `base ${entry.base} is not a commit in Shipwright`})`); continue; }
    const pending = entry.pending ? `, pending ${entry.pending}` : '';
    if (entry.pending) attention++;
    if (templateAt(shipwright, to, template) === null) {
      attention++;
      lines.push(`  gone       ${template} (removed or renamed upstream by ${to}; unmap or remap it)`);
      continue;
    }
    const count = Number(git(shipwright, ['rev-list', '--count', `${base}..${to}`, '--', template]).trim());
    if (count > 0) behind++;
    lines.push(`  ${(count > 0 ? `${count} behind` : 'current').padEnd(10)} ${template} (base ${base}${pending})`);
  }
  const extra = unmapped(shipwright, to, m.raw, m.skip);
  console.log(`Shipwright ${to}: ${behind} of ${Object.keys(m.raw.files).length} files behind, ${extra.list.length} templates not adopted or skipped`);
  for (const line of lines) console.log(line);
  for (const t of extra.list) console.log(`  new        ${t}`);
  if (extra.note) console.log(`  note: ${extra.note}`);
  return behind || attention || extra.list.length ? 1 : 0;
}

function accept(opts, m) {
  let open = 0;
  let moved = 0;
  for (const [template, entry] of Object.entries(m.raw.files)) {
    if (!entry || !entry.pending) continue;
    const problem = entryProblem(opts.project, entry);
    const localPath = problem ? null : path.resolve(opts.project, entry.local);
    const problems = [];
    if (problem) problems.push(problem);
    else if (!fs.existsSync(localPath)) problems.push('local file missing');
    else {
      const text = fs.readFileSync(localPath, 'utf8');
      if (MARKER.test(text)) problems.push('conflict markers');
      const left = unfilled(text);
      if (left.length) problems.push(`placeholders ${left.map((n) => `{{${n}}}`).join(', ')}`);
    }
    if (problems.length) {
      open++;
      console.log(`  still open  ${entry.local ?? template}: ${problems.join('; ')}`);
      continue;
    }
    console.log(`  accepted    ${entry.local}: base ${entry.base} -> ${entry.pending}`);
    entry.base = entry.pending;
    delete entry.pending;
    moved++;
  }
  if (moved) writeManifest(opts.manifest, m.raw);
  if (!moved && !open) console.log('Nothing pending.');
  return open ? 1 : 0;
}

// Refuse to merge over anything git could not give back: untracked, ignored, modified, or no repo at all.
function notSafeToWrite(project, local) {
  if (git(project, ['ls-files', '--error-unmatch', '--', local], { allowFail: true }) === null) {
    return 'not tracked by git here (or git failed); commit the local copy first';
  }
  const status = git(project, ['status', '--porcelain', '--', local], { allowFail: true });
  if (status === null) return 'git status failed';
  if (status.trim()) return 'uncommitted changes in the local copy; commit or set them aside first';
  return null;
}

function syncOne(ctx, template, entry) {
  const { opts, m, shipwright, to, dry, out, tmp } = ctx;
  const problem = entryProblem(opts.project, entry);
  if (problem) return { status: 'error', detail: problem };
  const base = shortSha(shipwright, entry.base);
  if (!base) return { status: 'error', detail: `base ${entry.base} is not a commit in Shipwright` };
  if (entry.pending) return { status: 'pending', detail: `resolve, then --accept (pending ${entry.pending})` };

  const localPath = path.resolve(opts.project, entry.local);
  if (!fs.existsSync(localPath)) return { status: 'missing', detail: 'no local file' };
  const baseRaw = templateAt(shipwright, base, template);
  if (baseRaw === null) return { status: 'error', detail: `not in Shipwright at base ${base}` };
  const theirsRaw = templateAt(shipwright, to, template);
  if (theirsRaw === null) return { status: 'gone', detail: `removed or renamed upstream by ${to}; local copy left alone` };
  if (base === to) return { status: 'current' };
  if (!dry) {
    const refusal = notSafeToWrite(opts.project, entry.local);
    if (refusal) return { status: 'skipped', detail: refusal };
  }

  const fills = { ...m.fills };
  for (const [k, v] of Object.entries(entry.fills ?? {})) fills[k] = toLf(String(v));
  const rawOurs = fs.readFileSync(localPath, 'utf8');
  const layout = splitLayout(rawOurs);
  const ours = layout.text;
  // A placeholder the template retired (in base, gone from theirs) is not filled in base, so the
  // project's fill reads as a local edit: the template's replacement text then conflicts with it
  // instead of silently overwriting it.
  const theirsNames = unfilled(render(theirsRaw, {}));
  const retired = unfilled(render(baseRaw, {})).filter((n) => !theirsNames.includes(n) && n in fills);
  const baseFills = Object.fromEntries(Object.entries(fills).filter(([n]) => !retired.includes(n)));
  const baseText = render(baseRaw, baseFills);
  const theirs = render(theirsRaw, fills);
  const { merged, conflicts } = mergeFile(tmp, ours, baseText, theirs,
    [entry.local, `shipwright ${base}`, `shipwright ${to}`]);
  const missingFills = unfilled(merged).filter((n) => !unfilled(ours).includes(n));
  const notes = [];
  if (conflicts > 0) notes.push(`${conflicts} hunk${conflicts === 1 ? '' : 's'}`);
  if (missingFills.length) notes.push(`no fill for ${missingFills.map((n) => `{{${n}}}`).join(', ')}`);
  if (retired.length) notes.push(`retired upstream: ${retired.map((n) => `{{${n}}}`).join(', ')}, its fill kept as a local edit`);

  const written = joinLayout(layout, merged);
  if (dry) {
    const target = path.join(out, path.relative(opts.project, localPath));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, written);
  } else if (written !== rawOurs) {
    fs.writeFileSync(localPath, written);
  }

  // A conflict, or a new placeholder with no fill, waits for the session and --accept.
  const status = conflicts > 0 ? 'conflict' : missingFills.length ? 'needs-fill'
    : theirs === baseText ? 'unchanged' : merged === ours ? 'already-in' : 'merged';
  if (!dry) {
    if (DONE.has(status)) entry.base = to;
    else entry.pending = to;
    ctx.changed = true;
  }
  return { status, detail: notes.join('; ') };
}

function sync(opts, m, shipwright, to) {
  const dry = opts.mode === 'dry-run';
  const out = dry ? path.resolve(opts.out ?? fs.mkdtempSync(path.join(os.tmpdir(), 'template-sync-'))) : null;
  const ctx = { opts, m, shipwright, to, dry, out, changed: false,
    tmp: fs.mkdtempSync(path.join(os.tmpdir(), 'template-sync-merge-')) };
  const rows = [];
  try {
    for (const [template, entry] of Object.entries(m.raw.files)) {
      let result;
      try {
        result = syncOne(ctx, template, entry);
      } catch (err) {
        result = { status: 'error', detail: err.message };
      }
      rows.push({ template, local: entry?.local ?? '?', ...result });
    }
  } finally {
    fs.rmSync(ctx.tmp, { recursive: true, force: true });
    // Saved even when a later file failed, so a file already written with markers keeps its pending.
    if (ctx.changed) writeManifest(opts.manifest, m.raw);
  }

  const extra = unmapped(shipwright, to, m.raw, m.skip);
  console.log(`${dry ? 'Dry run: ' : ''}${path.basename(opts.project)} to Shipwright ${to}`);
  for (const r of rows) {
    console.log(`  ${r.status.padEnd(10)} ${r.template} -> ${r.local}${r.detail ? `  (${r.detail})` : ''}`);
  }
  for (const t of extra.list) console.log(`  new        ${t}  (not adopted or skipped; adopt it by hand, then map it)`);
  if (extra.note) console.log(`  note: ${extra.note}`);
  const open = rows.filter((r) => !DONE.has(r.status));
  if (dry) console.log(`Merged copies: ${out}`);
  else if (open.some((r) => ['conflict', 'needs-fill', 'pending'].includes(r.status))) {
    console.log('Resolve the conflict markers and fill any {{…}} (Murr reviews), record new fills in the manifest, then run --accept.');
  }
  return open.length ? 1 : 0;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const m = readManifest(opts.manifest);
  if (opts.mode === 'accept') return accept(opts, m);
  const shipwright = shipwrightRoot(m.raw, opts.manifest);
  const to = shortSha(shipwright, opts.to);
  if (!to) usage(`${opts.to} is not a commit in ${shipwright}`);
  return opts.mode === 'check' ? check(opts, m, shipwright, to) : sync(opts, m, shipwright, to);
}

try {
  process.exitCode = main();
} catch (err) {
  console.error(`template-sync: ${err.message}`);
  process.exitCode = 2;
}
