#!/usr/bin/env node
// Project-health check — the single source of check logic for the health dashboard.
// Run from the repo root:  node scripts/health-check.mjs
// Regenerates docs/HEALTH.md and prints an exception-first summary. Exits non-zero on red.
// No dependencies — plain Node ESM + fs. Read-only except for writing the dashboard.
//
// Checks (all deterministic, all driven by the docs themselves — no per-project config):
//   1. Scaffold complete   — no unresolved {{placeholder}} tokens in living docs.        [gate]
//   2. Docs in sync        — each doc's Version header vs its 00-INDEX §1 register cell. [gate]
//   3. Decision trace      — every Resolved OQ cites a D-NNN or appears in decisions.md. [gate]
//   4. Acceptance debt     — converged ui-requirements §2 rows owing AC/Spec/Contract.   [info]
//   5. Risk-ID coverage    — each testing-strategy §3 shortlist ID has a tagged test.    [info]
//      (a per-ID presence line, NEVER a coverage % — dormant until test files exist)
// Design/app/code conformance is the reviewer skills' job — linked, not run here.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, normalize } from 'node:path';

const ROOT = process.cwd();
const read = (p) => { try { return readFileSync(join(ROOT, p), 'utf8'); } catch { return null; } };

// ---- 1. Scaffold complete: no {{placeholders}} left in living docs -----------------------------
function listDocs(dir) {
  const out = [];
  try {
    for (const f of readdirSync(join(ROOT, dir))) {
      const rel = join(dir, f);
      if (statSync(join(ROOT, rel)).isDirectory()) out.push(...listDocs(rel));
      else if (f.endsWith('.md') && f !== 'HEALTH.md') out.push(rel.replace(/\\/g, '/'));
    }
  } catch { /* dir missing */ }
  return out;
}
function checkPlaceholders() {
  const files = ['CLAUDE.md', 'AGENTS.md', 'CONVENTIONS.md', 'lifecycle-playbook.md', ...listDocs('docs')];
  const findings = [];
  for (const f of files) {
    const body = read(f);
    if (!body) continue;
    const n = (body.match(/\{\{/g) || []).length;
    if (n) findings.push({ doc: f, detail: `${n} unresolved {{placeholder}} token(s)` });
  }
  return { findings, ok: findings.length === 0 };
}

// ---- 2. Docs in sync: 00-INDEX §1 register cell vs each doc's own Version header ----------------
function checkDocsSync() {
  const index = read('docs/00-INDEX.md');
  if (!index) return { findings: [{ doc: '00-INDEX.md', detail: 'file not found' }], ok: false };
  const findings = [];
  for (const line of index.split('\n')) {
    const path = (line.match(/`([^`]+\.md)`/) || [])[1];
    const registerV = (line.match(/\*\*v(\d+\.\d+)\*\*/) || [])[1];
    if (!path || !registerV) continue; // unversioned rows (decisions, inbox, CONVENTIONS) are exempt
    const file = normalize(path.startsWith('../') ? path.slice(3) : join('docs', path)).replace(/\\/g, '/');
    const body = read(file);
    if (!body) { findings.push({ doc: file, detail: 'registered in 00-INDEX §1 but not found' }); continue; }
    const actualV = (body.split('\n').slice(0, 20).join('\n').match(/Version[:*\s]+v?(\d+\.\d+)/i) || [])[1];
    if (!actualV) findings.push({ doc: file, detail: 'no "Version:" header line found' });
    else if (actualV !== registerV)
      findings.push({ doc: file, detail: `register says v${registerV} but the doc is v${actualV} — fix the 00-INDEX §1 cell` });
  }
  return { findings, ok: findings.length === 0 };
}

// ---- 3. Decision traceability: resolved OQs → a decisions.md entry -----------------------------
function checkTraceability() {
  const oq = read('docs/open-questions.md');
  if (!oq) return { findings: [], ok: true };
  const resolved = oq.split(/^##\s+Resolved\s*$/m)[1];
  if (!resolved) return { findings: [], ok: true };
  const decisions = read('docs/decisions.md') || '';
  const findings = [];
  let cur = null;
  const flush = () => {
    if (!cur) return;
    if (!/D-\d+/.test(cur.text) && !decisions.includes(cur.id))
      findings.push({ id: cur.id, detail: 'resolved but cites no D-NNN and appears in no decisions.md entry' });
  };
  for (const l of resolved.split('\n')) {
    const m = l.match(/^- (OQ-\d+)/);
    if (m) { flush(); cur = { id: m[1], text: l }; }
    else if (cur) cur.text += '\n' + l;
  }
  flush();
  return { findings, ok: findings.length === 0 };
}

// ---- 4. Acceptance debt: converged ui-requirements §2 rows still owing AC/Spec/Contract ---------
function checkDebt() {
  const ui = read('docs/ui-requirements.md');
  if (!ui) return { rows: [] };
  const lines = ui.split('\n');
  const headerIdx = lines.findIndex((l) => l.includes('| Surface') && l.includes('| State') && l.includes('| AC'));
  if (headerIdx < 0) return { rows: [], note: 'no surface table header found in ui-requirements.md §2' };
  const cols = lines[headerIdx].split('|').map((c) => c.trim());
  const col = (name) => cols.indexOf(name);
  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const l = lines[i];
    if (!l.trim().startsWith('|')) break;
    if (/^\|[-\s|]+\|?$/.test(l.trim())) continue;
    const cells = l.split('|').map((c) => c.trim());
    if (!/✅|converged/i.test(cells[col('State')] || '')) continue; // only a converged surface can owe
    const owed = ['AC', 'Spec', 'Contract'].filter((k) => col(k) >= 0 && /[⬜🔶]/.test(cells[col(k)] || ''));
    if (owed.length) rows.push({ surface: cells[col('Surface')] || '?', owed: owed.join(' + ') });
  }
  return { rows };
}

// ---- 5. Risk-ID coverage: testing-strategy §3 shortlist IDs vs ID-tagged tests ------------------
function checkRiskCoverage() {
  const ts = read('docs/testing-strategy.md');
  if (!ts) return { state: 'absent' };
  const sec = (ts.split(/^## 3\./m)[1] ?? '').split(/^## /m)[0];
  const ids = [...new Set(sec.match(/\b[A-Z][A-Z0-9]{1,7}-\d+\b/g) ?? [])].filter(
    (id) => !/^(OQ|AC|D)-/.test(id),
  );
  if (!ids.length) return { state: 'unfilled' };

  const SKIP = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.expo', '.next']);
  const testFiles = [];
  const walk = (dir) => {
    let entries;
    try { entries = readdirSync(join(ROOT, dir)); } catch { return; }
    for (const f of entries) {
      if (SKIP.has(f)) continue;
      const rel = join(dir, f);
      if (statSync(join(ROOT, rel)).isDirectory()) walk(rel);
      else if (/\.(test|spec)\.[a-z]+$/i.test(f)) testFiles.push(rel);
    }
  };
  walk('.');
  if (!testFiles.length) return { state: 'dormant', ids };

  const suite = testFiles.map((f) => read(f) ?? '').join('\n');
  const missing = ids.filter((id) => !suite.includes(id));
  return { state: 'active', ids, missing, testFileCount: testFiles.length };
}

// ---- render -------------------------------------------------------------------------------------
const scaffold = checkPlaceholders();
const sync = checkDocsSync();
const trace = checkTraceability();
const debt = checkDebt();
const risk = checkRiskCoverage();

const riskLight =
  risk.state === 'active'
    ? risk.missing.length
      ? '🟠 gaps'
      : '🟢'
    : '⚪ ' + ({ absent: 'no strategy doc', unfilled: '§3 not filled', dormant: 'no tests yet' }[risk.state] ?? risk.state);
const riskDetail =
  risk.state === 'active'
    ? risk.missing.length
      ? `${risk.ids.length - risk.missing.length}/${risk.ids.length} shortlist IDs tagged — missing: ${risk.missing.join(', ')}`
      : `all ${risk.ids.length} shortlist IDs have tagged tests (${risk.testFileCount} test files)`
    : 'testing-strategy §3 shortlist IDs vs ID-tagged describes — activates when test files exist';

const light = (ok) => (ok ? '🟢' : '🔴');
const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
const overallRed = !scaffold.ok || !sync.ok || !trace.ok;
const overall = overallRed ? '🔴 needs attention' : (debt.rows.length ? '🟢 healthy · debt tracked' : '🟢 healthy');

const attention = [];
if (!scaffold.ok)
  attention.push(`- 🔴 **Scaffold incomplete** — ${scaffold.findings.map((f) => `\`${f.doc}\` (${f.detail})`).join(' · ')}. Fill or delete each \`{{…}}\`.`);
for (const f of sync.ok ? [] : sync.findings) attention.push(`- 🔴 **Docs in sync** — \`${f.doc}\`: ${f.detail}`);
if (!trace.ok)
  attention.push(`- 🟠 **Decision traceability** — ${trace.findings.map((f) => f.id).join(', ')}: add/extend a decisions.md entry citing them.`);

const out = [
  '# Project Health',
  '',
  '> **Generated by `scripts/health-check.mjs` — do not edit by hand.** Re-run the script to refresh.',
  '',
  `**Generated:** ${stamp} · **Overall:** ${overall}`,
  '',
  '## ⚠ Needs attention',
  attention.length ? attention.join('\n') : '_Nothing — all clear._ ✅',
  '',
  '## Checks',
  '| Light | Check | Detail |',
  '|---|---|---|',
  `| ${light(scaffold.ok)} | Scaffold complete | no unresolved {{placeholder}} tokens in living docs |`,
  `| ${light(sync.ok)} | Docs in sync | each doc's Version header vs its 00-INDEX §1 register cell |`,
  `| ${light(trace.ok)} | Decision traceability | every Resolved OQ traces to a decisions.md entry |`,
  `| ${debt.rows.length ? '🟠 tracked' : '🟢'} | Acceptance debt | ${debt.rows.length} converged surface(s) owing AC/Spec/Contract${debt.note ? ` (${debt.note})` : ''} |`,
  `| ${riskLight} | Risk-ID coverage | ${riskDetail} |`,
  '| ⚪ manual | Design / app / code conformance | run the reviewer skills (see lifecycle-playbook.md) |',
  '',
  '## Acceptance debt — tracked outstanding work (not drift)',
  debt.rows.length
    ? ['| Surface | Owed |', '|---|---|', ...debt.rows.map((r) => `| ${r.surface} | ${r.owed} |`)].join('\n')
    : '_None — every converged surface is fully formalized._ ✅',
  '',
].join('\n') + '\n';

writeFileSync(join(ROOT, 'docs/HEALTH.md'), out, 'utf8');

console.log(`Overall: ${overall}`);
console.log(`  Scaffold complete:     ${light(scaffold.ok)}${scaffold.ok ? '' : '  -> ' + scaffold.findings.map((f) => f.doc).join(', ')}`);
console.log(`  Docs in sync:          ${light(sync.ok)}${sync.ok ? '' : '  -> ' + sync.findings.map((f) => f.doc).join(', ')}`);
console.log(`  Decision traceability: ${light(trace.ok)}${trace.ok ? '' : '  -> ' + trace.findings.map((f) => f.id).join(', ')}`);
console.log(`  Acceptance debt:       ${debt.rows.length ? '🟠 ' + debt.rows.length + ' tracked' : '🟢 none'}`);
console.log(`  Risk-ID coverage:      ${riskLight}${risk.state === 'active' && risk.missing.length ? '  -> ' + risk.missing.join(', ') : ''}`);
console.log('Dashboard written: docs/HEALTH.md');
process.exit(overallRed ? 1 : 0);
