#!/usr/bin/env node
// Three-way merge Shipwright template changes into a project's filled copies.
// Run from the project's own session. Design: docs/template-sync.md.
//
//   node <shipwright>/scripts/template-sync.mjs            sync every mapped file to Shipwright main
//   node <shipwright>/scripts/template-sync.mjs --dry-run  merge into a scratch folder, write nothing here
//   node <shipwright>/scripts/template-sync.mjs --check    how far behind; exit 1 when anything is
//   node <shipwright>/scripts/template-sync.mjs --accept   move resolved files' base to their pending commit
//   node <shipwright>/scripts/template-sync.mjs --check --json        per-file state and the last sync, as JSON
//   node <shipwright>/scripts/template-sync.mjs --diff <template> [--json]
//        the project's adaptation (its copy against the filled template at base), the upstream change
//        (base to --to) and the base ranges where a merge would conflict, from a merge in a temp folder
//
// Options: --project <dir> (default: cwd), --manifest <file> (default: <project>/.claude/shipwright.json),
// --to <rev> (default: main), --out <dir> (dry run only), --json (with --check or --diff).
// No dependencies beyond Node and git. Never commits; the project's session does that.
// Exit codes: 0 all done, 1 something needs the session (a conflict, a fill, a skipped or failed file), 2 usage.
// --check --json and --diff exit 0 whenever they could report (behind or not), and 2 with the reason on
// stderr when they could not; stdout then holds nothing. Neither writes into the project.

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
  console.error('usage: template-sync.mjs [--dry-run [--out <dir>] | --check [--json] | --diff <template> [--json] | --accept] [--project <dir>] [--manifest <file>] [--to <rev>]');
  process.exit(2);
}

function parseArgs(argv) {
  const opts = { mode: 'sync', project: process.cwd(), manifest: null, to: 'main', out: null, json: false, template: null };
  const modes = { '--dry-run': 'dry-run', '--check': 'check', '--accept': 'accept', '--diff': 'diff' };
  const valued = { '--project': 'project', '--manifest': 'manifest', '--to': 'to', '--out': 'out' };
  let modeSet = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (modes[arg]) {
      if (modeSet) usage('pick one of --dry-run, --check, --diff, --accept');
      opts.mode = modes[arg];
      modeSet = true;
      if (arg === '--diff') {
        if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) usage('--diff needs a template path');
        opts.template = argv[++i];
      }
    } else if (valued[arg]) {
      if (i + 1 >= argv.length) usage(`${arg} needs a value`);
      opts[valued[arg]] = argv[++i];
    } else if (arg === '--json') {
      opts.json = true;
    } else if (arg === '--help' || arg === '-h') {
      usage();
    } else {
      usage(`unknown argument ${arg}`);
    }
  }
  if (opts.out && opts.mode !== 'dry-run') usage('--out is for --dry-run only');
  if (opts.json && !['check', 'diff'].includes(opts.mode)) usage('--json is for --check or --diff only');
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

// Commits as { sha, date, subject }, newest first. `range` is a rev or a range; `paths` limits them.
// Throws when git fails, unless allowFail, which returns null.
function commitsOf(cwd, range, paths = [], extra = [], { allowFail = false } = {}) {
  const out = git(cwd, ['log', ...extra, '--format=%h%x1f%ad%x1f%s%x1e', '--date=short', range, '--', ...paths], { allowFail });
  if (out === null) return null;
  return out.split('\x1e').map((r) => r.trim()).filter(Boolean).map((r) => {
    const [sha, date, subject] = r.split('\x1f');
    return { sha, date, subject };
  });
}

// What every file's check reads from Shipwright, fetched once: each base's short sha and the paths
// in <to>'s tree. A git spawn costs a quarter to half a second on Windows and InProgress kills a
// check at 20 seconds, so a check spends one spawn per file (its commit list) and a handful in all.
function checkContext(shipwright, to) {
  const shas = new Map();
  return {
    shipwright,
    to,
    sha: (rev) => {
      if (!shas.has(rev)) shas.set(rev, shortSha(shipwright, rev));
      return shas.get(rev);
    },
    tree: new Set(git(shipwright, ['ls-tree', '-r', '-z', '--name-only', to]).split('\0').filter(Boolean)),
  };
}

// One mapped file's state, the same for --check and --check --json: error, gone, missing, pending,
// behind or current. `behind` counts the commits that touch the template from base to <to>.
function fileState(opts, ctx, template, entry) {
  const { shipwright, to } = ctx;
  const row = { template, local: entry?.local ?? null, base: entry?.base ?? null, state: null, behind: null,
    commits: [], fills: entry?.fills ?? {}, detail: null };
  const problem = entryProblem(opts.project, entry);
  const base = problem ? null : ctx.sha(entry.base);
  if (!base) return { ...row, state: 'error', detail: problem ?? `base ${entry.base} is not a commit in Shipwright` };
  row.base = base;
  if (!ctx.tree.has(template)) {
    return { ...row, state: 'gone', detail: `removed or renamed upstream by ${to}; unmap or remap it` };
  }
  row.commits = commitsOf(shipwright, `${base}..${to}`, [template]);
  row.behind = row.commits.length;
  if (!fs.existsSync(path.resolve(opts.project, entry.local))) return { ...row, state: 'missing', detail: 'no local file' };
  if (entry.pending) return { ...row, state: 'pending', detail: `resolve, then --accept (pending ${entry.pending})` };
  return { ...row, state: row.behind > 0 ? 'behind' : 'current' };
}

// The project's newest commit that moved a base: an entry in both the commit and its parent, with a
// different base. A manifest edit that leaves every base alone is not a sync, and neither is an
// adoption (an entry the parent did not have). Merge commits are left out: the sync is the commit
// on the branch, not the merge that brought it in. A sync that only set `pending` moves its base at
// the --accept commit, so that commit is the one named. Null when nothing moved; null with a warning
// on stderr when git cannot read the manifest's history. Three spawns however long the history: the
// manifest's commits, its path in the repo, and every version of it through one cat-file --batch.
function lastSync(manifestFile) {
  const dir = path.dirname(manifestFile);
  const name = path.basename(manifestFile);
  const commits = commitsOf(dir, 'HEAD', [`./${name}`], ['--no-merges'], { allowFail: true });
  const prefix = commits && git(dir, ['rev-parse', '--show-prefix'], { allowFail: true });
  if (commits === null || prefix === null) {
    console.error(`template-sync: git cannot read the history of ${manifestFile}, so lastSync is null`);
    return null;
  }
  const file = `${prefix.trim()}${name}`;
  const specs = commits.flatMap((c) => [`${c.sha}:${file}`, `${c.sha}^:${file}`]);
  if (!specs.length) return null;
  const r = spawnSync('git', ['-C', dir, 'cat-file', '--batch'], { input: `${specs.join('\n')}\n`, maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`git cat-file --batch failed: ${String(r.stderr).trim()}`);
  // Each answer is "<oid> <type> <size>\n<content>\n", or "<spec> missing\n" (a root commit's parent).
  const texts = [];
  let at = 0;
  while (texts.length < specs.length) {
    const eol = r.stdout.indexOf(10, at);
    const header = r.stdout.subarray(at, eol).toString('utf8').match(/^[0-9a-f]{40,64} \w+ (\d+)$/);
    at = eol + 1;
    if (!header) {
      texts.push(null);
      continue;
    }
    const size = Number(header[1]);
    texts.push(r.stdout.subarray(at, at + size).toString('utf8'));
    at += size + 1;
  }
  const basesIn = (text) => {
    try {
      return Object.fromEntries(Object.entries(JSON.parse(text).files).map(([t, e]) => [t, e?.base]));
    } catch {
      return null;
    }
  };
  for (const [i, c] of commits.entries()) {
    const now = basesIn(texts[2 * i]);
    const before = basesIn(texts[2 * i + 1]);
    if (now && before && Object.entries(now).some(([t, b]) => t in before && before[t] !== b)) return c;
  }
  return null;
}

function checkJson(opts, m, shipwright, to) {
  const ctx = checkContext(shipwright, to);
  const [head] = commitsOf(shipwright, to, [], ['-1']);
  const extra = unmapped(shipwright, to, m.raw, m.skip);
  if (extra.note) console.error(`template-sync: ${extra.note}`);
  const result = {
    shipwright: { head: to, date: head.date, subject: head.subject },
    project: opts.project.split(path.sep).join('/'),
    lastSync: lastSync(opts.manifest),
    files: Object.entries(m.raw.files).map(([template, entry]) => fileState(opts, ctx, template, entry)),
    skip: m.skip,
    notAdopted: extra.list,
    fills: m.fills,
  };
  console.log(JSON.stringify(result, null, 2));
  return 0;
}

function check(opts, m, shipwright, to) {
  if (opts.json) return checkJson(opts, m, shipwright, to);
  const ctx = checkContext(shipwright, to);
  let behind = 0;
  let attention = 0;
  const lines = [];
  for (const [template, entry] of Object.entries(m.raw.files)) {
    const f = fileState(opts, ctx, template, entry);
    if (['error', 'gone', 'missing'].includes(f.state)) {
      attention++;
      lines.push(`  ${f.state.padEnd(10)} ${template} (${f.detail})`);
      continue;
    }
    const pending = entry.pending ? `, pending ${entry.pending}` : '';
    if (entry.pending) attention++;
    if (f.behind > 0) behind++;
    lines.push(`  ${(f.behind > 0 ? `${f.behind} behind` : 'current').padEnd(10)} ${template} (base ${f.base}${pending})`);
  }
  const extra = unmapped(shipwright, to, m.raw, m.skip);
  const synced = lastSync(opts.manifest);
  console.log(`Shipwright ${to}: ${behind} of ${Object.keys(m.raw.files).length} files behind, ${extra.list.length} templates not adopted or skipped`);
  if (synced) console.log(`Last sync: ${synced.sha} ${synced.date} ${synced.subject}`);
  for (const line of lines) console.log(line);
  for (const t of extra.list) console.log(`  new        ${t}`);
  if (extra.note) console.log(`  note: ${extra.note}`);
  return behind || attention || extra.list.length ? 1 : 0;
}

// A unified diff from `a` to `b` under the given labels, or '' when they match. Written to and run
// in `tmp`, never in the project. Myers without the indent heuristic, as `git merge-file` diffs.
function unifiedDiff(tmp, a, b, labels, context = 3) {
  fs.writeFileSync(path.join(tmp, 'a'), a);
  fs.writeFileSync(path.join(tmp, 'b'), b);
  const r = spawnSync('git', ['-c', 'core.autocrlf=false', '-c', 'core.quotepath=false', 'diff', '--no-index',
    '--no-color', '--no-ext-diff', '--no-textconv', '--no-indent-heuristic', '--diff-algorithm=myers',
    `-U${context}`, '--', 'a', 'b'], { cwd: tmp, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status === 0) return '';
  if (r.status !== 1) throw new Error(`git diff failed: ${(r.stderr || '').trim()}`);
  const lines = r.stdout.split('\n');
  const from = lines.findIndex((l) => l.startsWith('--- '));
  return [`--- ${labels[0]}`, `+++ ${labels[1]}`, ...lines.slice(from + 2)].join('\n');
}

// Hunks of a unified diff: the old range as a 0-based [start, end), the new start, and the new lines.
function hunksOf(diff) {
  const hunks = [];
  for (const line of diff.split('\n')) {
    const h = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (h) {
      const [os, oc, ns, nc] = [h[1], h[2] ?? '1', h[3], h[4] ?? '1'].map(Number);
      // A zero-length side names the line before it, so its 0-based start is the number itself.
      const start = oc ? os - 1 : os;
      hunks.push({ start, end: start + oc, newStart: nc ? ns - 1 : ns, added: [] });
    } else if (hunks.length && line.startsWith('+')) {
      // A line that starts `++` is content: the file headers all come before the first @@.
      hunks.at(-1).added.push(line.slice(1));
    }
  }
  return hunks;
}

const touches = (aLo, aHi, bLo, bHi) => (aLo === aHi || bLo === bHi ? aLo <= bHi && bLo <= aHi : aLo < bHi && bLo < aHi);

// Where a three-way merge of ours and theirs over base would conflict, in base lines. The merge runs
// in `tmp` and decides whether anything conflicts; the ranges group the two sides' changes the way
// git merge-file does, where overlapping or adjacent changes from both sides are one conflict, and
// drop a group both sides changed the same way. `upstream` is the -U3 diff the ranges point into;
// a conflict's `hunks` are the ones holding its upstream changes, not every hunk whose context it
// reaches. A merge that conflicts where no range accounts for it throws: a conflict never reads as
// clean.
function conflictsOf(tmp, ours, base, theirs, upstream) {
  const { conflicts } = mergeFile(tmp, ours, base, theirs, ['ours', 'base', 'theirs']);
  if (conflicts === 0) return [];
  const sides = { local: hunksOf(unifiedDiff(tmp, base, ours, ['a', 'b'], 0)), upstream: hunksOf(unifiedDiff(tmp, base, theirs, ['a', 'b'], 0)) };
  const changes = Object.entries(sides).flatMap(([side, hunks]) => hunks.map((h) => ({ side, ...h })))
    .sort((x, y) => x.start - y.start || x.end - y.end);
  const groups = [];
  for (const c of changes) {
    const g = groups.at(-1);
    if (g && c.start <= g.end) {
      g.end = Math.max(g.end, c.end);
      g.changes.push(c);
    } else {
      groups.push({ start: c.start, end: c.end, changes: [c] });
    }
  }
  const baseLines = base.split('\n');
  const upstreamHunks = hunksOf(upstream);
  const result = [];
  for (const g of groups) {
    const range = {};
    for (const side of ['local', 'upstream']) {
      const own = g.changes.filter((c) => c.side === side);
      if (!own.length) break;
      const text = [];
      let at = g.start;
      for (const c of own) {
        text.push(...baseLines.slice(at, c.start), ...c.added);
        at = c.end;
      }
      text.push(...baseLines.slice(at, g.end));
      range[side] = { start: own[0].newStart - (own[0].start - g.start) + 1, lines: text.length, text: text.join('\n') };
    }
    if (!range.local || !range.upstream || range.local.text === range.upstream.text) continue;
    result.push({
      base: { start: g.start + 1, lines: g.end - g.start },
      upstream: { start: range.upstream.start, lines: range.upstream.lines },
      local: { start: range.local.start, lines: range.local.lines },
      hunks: upstreamHunks.flatMap((h, i) => (g.changes.some((c) => c.side === 'upstream'
        && touches(h.start, h.end, c.start, c.end)) ? [i] : [])),
    });
  }
  if (!result.length) throw new Error(`the merge reports ${conflicts} conflict(s) that no base range accounts for`);
  return result;
}

// --diff: one mapped file's adaptation and upstream change, and where syncing it would conflict.
// The texts are the ones the sync merges: base and theirs rendered with the project's fills (a
// retired placeholder left unfilled in base), ours the local copy in LF. The adaptation fills base
// with every fill, so a filled placeholder never reads as the project's own change.
function diff(opts, m, shipwright, to) {
  const template = opts.template;
  if (!Object.hasOwn(m.raw.files, template)) usage(`${template} is not in the manifest's files`);
  const entry = m.raw.files[template];
  const problem = entryProblem(opts.project, entry);
  if (problem) throw new Error(`${template}: ${problem}`);
  const base = shortSha(shipwright, entry.base);
  if (!base) throw new Error(`${template}: base ${entry.base} is not a commit in Shipwright`);
  const localPath = path.resolve(opts.project, entry.local);
  if (!fs.existsSync(localPath)) throw new Error(`${template}: no local file ${entry.local}`);
  const baseRaw = templateAt(shipwright, base, template);
  if (baseRaw === null) throw new Error(`${template}: not in Shipwright at base ${base}`);
  const theirsRaw = templateAt(shipwright, to, template);
  if (theirsRaw === null) throw new Error(`${template}: removed or renamed upstream by ${to}`);

  const fills = { ...m.fills };
  for (const [k, v] of Object.entries(entry.fills ?? {})) fills[k] = toLf(String(v));
  const theirsNames = unfilled(render(theirsRaw, {}));
  const retired = unfilled(render(baseRaw, {})).filter((n) => !theirsNames.includes(n) && n in fills);
  const baseText = render(baseRaw, Object.fromEntries(Object.entries(fills).filter(([n]) => !retired.includes(n))));
  const theirs = render(theirsRaw, fills);
  const ours = splitLayout(fs.readFileSync(localPath, 'utf8')).text;

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'template-sync-diff-'));
  let result;
  try {
    const upstream = unifiedDiff(tmp, baseText, theirs, [`${template} @ ${base}`, `${template} @ ${to}`]);
    result = {
      adaptation: unifiedDiff(tmp, render(baseRaw, fills), ours, [`${template} @ ${base}`, entry.local]),
      upstream,
      conflicts: upstream ? conflictsOf(tmp, ours, baseText, theirs, upstream) : [],
    };
  } finally {
    // A virus scanner or the indexer can hold a file just written; a leftover temp folder is not
    // worth losing the answer over.
    try {
      fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    } catch (err) {
      console.error(`template-sync: could not remove ${tmp}: ${err.message}`);
    }
  }
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
    return 0;
  }
  console.log(`## Adaptation: ${entry.local} against ${template} at ${base}, filled\n`);
  console.log(result.adaptation || '(none)');
  console.log(`\n## Upstream: ${template} from ${base} to ${to}\n`);
  console.log(result.upstream || '(none)');
  console.log(`\n## Conflicts: ${result.conflicts.length}`);
  for (const c of result.conflicts) {
    console.log(`  base lines ${c.base.start}+${c.base.lines}, upstream ${c.upstream.start}+${c.upstream.lines}, local ${c.local.start}+${c.local.lines}`);
  }
  return 0;
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
  // Placeholders the merged file gains, leaving out diff3's old-template sections of each conflict.
  const resultText = merged.replace(/^\|{7}[^\n]*\n[\s\S]*?(?=^={7}$)/gm, '');
  const missingFills = unfilled(resultText).filter((n) => !unfilled(ours).includes(n));
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
  if (opts.mode === 'check') return check(opts, m, shipwright, to);
  if (opts.mode === 'diff') return diff(opts, m, shipwright, to);
  return sync(opts, m, shipwright, to);
}

try {
  process.exitCode = main();
} catch (err) {
  console.error(`template-sync: ${err.message}`);
  process.exitCode = 2;
}
