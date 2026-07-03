#!/usr/bin/env node
// Owner dashboard — the lifecycle cockpit. Dep-free Node server: parses the project's doc graph
// into a JSON model and serves the single-file UI (index.html).
//
//   node <shipwright>/dashboard/server.mjs [projectRoot] [--port 8791]
//
// READ LAYER: generic, adapter-based. Two layouts auto-detected:
//   - "ingame":  docs/spec/*, docs/design/SCREEN-STATUS.md, docs/decisions/*.md, road-to-market.md
//   - "starter": docs/* flat (the starter kit), ui-requirements.md §2, decisions.md, roadmap.md
// Every parser is best-effort (returns null on a miss) — one odd doc never kills the model.
//
// Endpoints:  GET /            the UI
//             GET /api/model   the parsed doc graph
//             GET /api/trace?id=CARD-15   single-ID trace across spec→api→design→mockup→code→test→decision
//             GET /mockup/<rel>           serves a mockup file (standalone HTML) from the mockups dir
//
// Post-dev panels read <projectRoot>/.dashboard/<panel>.json when present (release · crashes ·
// retention · economy · modqueue · support · cost) — drop a JSON file, the panel lights up.

import { createServer } from 'node:http';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, normalize, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const portIx = args.indexOf('--port');
const PORT = portIx >= 0 ? Number(args[portIx + 1]) : 8791;
const ROOT = normalize(args.find((a) => !a.startsWith('--') && a !== String(PORT)) ?? process.cwd());

const read = (p) => { try { return readFileSync(join(ROOT, p), 'utf8'); } catch { return null; } };
const attempt = (fn) => { try { return fn(); } catch { return null; } };

// ---- adapter -----------------------------------------------------------------------------------
const isInGame = existsSync(join(ROOT, 'docs/design/SCREEN-STATUS.md'));
const A = isInGame
  ? {
      layout: 'ingame',
      productSpec: 'docs/spec/product-spec.md',
      apiContract: 'docs/spec/api-contract.md',
      surfacesDoc: 'docs/design/SCREEN-STATUS.md',
      roadmap: 'docs/planning/road-to-market.md',
      health: 'docs/PROJECT-HEALTH.md',
      openQuestions: 'docs/open-questions.md',
      decisionsDir: 'docs/decisions',
      mockupsDir: 'docs/design/mockups',
    }
  : {
      layout: 'starter',
      productSpec: 'docs/product-spec.md',
      apiContract: 'docs/api-contract.md',
      surfacesDoc: 'docs/ui-requirements.md',
      roadmap: 'docs/roadmap.md',
      health: 'docs/HEALTH.md',
      openQuestions: 'docs/open-questions.md',
      decisionsFile: 'docs/decisions.md',
      mockupsDir: 'docs/design/mockups',
    };

// ---- tiny md/table utils -------------------------------------------------------------------------
const section = (body, headingRe) => {
  if (!body) return null;
  const m = body.split(headingRe);
  return m.length > 1 ? m[1].split(/^#{1,2} /m)[0] : null;
};
const tableRows = (text) => {
  if (!text) return [];
  const rows = [];
  for (const l of text.split('\n')) {
    const t = l.trim();
    if (!t.startsWith('|')) continue;
    if (/^\|[-\s|:]+\|?$/.test(t)) continue;
    rows.push(t.split('|').slice(1, -1).map((c) => c.trim()));
  }
  return rows;
};
const plain = (s) =>
  (s ?? '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/<[^>]+>/g, '')
    .trim();

// ---- parsers -------------------------------------------------------------------------------------
function parseVision() {
  const body = read(A.productSpec);
  const sec = section(body, /^## 1\.[^\n]*\n/m);
  return sec ? plain(sec).slice(0, 2000) : null;
}

function parsePersonas() {
  const body = read(A.productSpec);
  const sec = section(body, /^## 2\.[^\n]*\n/m);
  const rows = tableRows(sec).filter((r) => r.length >= 2 && !/^Persona/i.test(r[0]));
  return rows.map((r) => ({ name: plain(r[0]), loves: plain(r[1]), returns: plain(r[2] ?? '') }));
}

function parseSurfaces() {
  const body = read(A.surfacesDoc);
  if (!body) return { rows: [], upNext: [] };
  const rows = [];
  if (isInGame) {
    for (const r of tableRows(body)) {
      if (r.length < 8 || /^§$/.test(r[0]) || !/^\d/.test(r[0])) continue;
      rows.push({
        id: r[0], screen: plain(r[1]), state: plain(r[2]),
        implementsFrom: plain(r[4]).replace(/^—$/, ''),
        designSpec: plain(r[6]).slice(0, 24), api: plain(r[7]).slice(0, 24),
      });
    }
  } else {
    const sec = section(body, /^## 2\.[^\n]*\n/m);
    for (const r of tableRows(sec)) {
      if (r.length < 7 || /^#$/.test(r[0]) || !/^\d/.test(r[0])) continue;
      rows.push({
        id: r[0], screen: plain(r[1]), state: plain(r[2]),
        implementsFrom: plain(r[3]).replace(/^—$/, ''),
        ac: r[4], designSpec: r[5], api: r[6],
      });
    }
  }
  const upSec = section(body, /^## Up next[^\n]*\n/mi) ?? section(body, /\*\*Up next:?\*\*/i);
  const upNext = (upSec ?? '')
    .split('\n')
    .filter((l) => l.trim().startsWith('-'))
    .slice(0, 6)
    .map((l) => plain(l.replace(/^\s*-\s*/, '')).slice(0, 240));
  return { rows, upNext };
}

function currentPhase() {
  const cfg = attempt(() => JSON.parse(read('.dashboard/config.json') ?? 'null'));
  if (cfg?.currentPhase) return cfg.currentPhase;
  const branch = attempt(() =>
    execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim(),
  );
  const m = branch?.match(/^([mp])(\d+)/i);
  return m ? m[1].toUpperCase() + m[2] : null;
}

function parseRoadmap() {
  const body = read(A.roadmap);
  if (!body) return { phases: [], current: currentPhase() };
  const sec = isInGame ? section(body, /^## 4\.[^\n]*\n/m) : section(body, /^## 2\.[^\n]*\n/m);
  const phases = [];
  for (const r of tableRows(sec)) {
    if (r.length < 4 || /^ID$/i.test(plain(r[0]))) continue;
    const id = plain(r[0]);
    if (!/^[MP]\d/i.test(id)) continue;
    phases.push({
      id, goal: plain(r[1]).slice(0, 120),
      exit: plain(isInGame ? r[3] : r[3]).slice(0, 400),
      ownerGate: plain(r[isInGame ? 5 : 4] ?? ''),
    });
  }
  return { phases, current: currentPhase() };
}

function parsePhaseDetail(current) {
  if (!current) return null;
  if (isInGame) {
    const n = current.replace(/\D/g, '');
    for (const f of [`docs/planning/m${n}-acceptance-suite.md`, `docs/planning/m${n}-build-task.md`, `docs/planning/m${n}-entry-plan.md`]) {
      const body = read(f);
      if (!body) continue;
      const done = (body.match(/- \[x\]/gi) ?? []).length;
      const open = (body.match(/- \[ \]/g) ?? []).length;
      return { source: f, title: plain((body.split('\n')[0] ?? f).replace(/^#+\s*/, '')), done, open };
    }
    return null;
  }
  const body = read(A.roadmap);
  const sec = section(body, new RegExp(`^### ${current}[^\\n]*\\n`, 'm'));
  if (!sec) return null;
  const done = (sec.match(/- \[x\]/gi) ?? []).length;
  const open = (sec.match(/- \[ \]/g) ?? []).length;
  const acs = [...sec.matchAll(/\*\*(AC-[A-Z0-9]+-\d+)\*\*/g)].map((m) => m[1]);
  return { source: A.roadmap, title: `${current} Definition of Done`, done, open, acs };
}

function parseHealth() {
  const body = read(A.health);
  if (!body) return null;
  const overall = (body.match(/\*\*Overall:\*\*\s*([^\n]+)/) ?? [])[1] ?? '?';
  const generated = (body.match(/\*\*Generated:\*\*\s*([^·\n]+)/) ?? [])[1]?.trim() ?? '';
  const attn = (section(body, /^## ⚠[^\n]*\n/m) ?? '')
    .split('\n').filter((l) => l.trim().startsWith('-')).map((l) => plain(l).slice(0, 200));
  return { overall: plain(overall), generated, attention: attn, red: overall.includes('🔴') };
}

function parseOpenQuestions() {
  const body = read(A.openQuestions);
  if (!body) return [];
  const sec = section(body, /^## Open\s*\n/m) ?? body;
  const items = [];
  let cur = null;
  for (const l of sec.split('\n')) {
    const m = l.match(/^- (OQ-\d+)[:\s]/);
    if (m) { if (cur) items.push(cur); cur = { id: m[1], text: l }; }
    else if (cur && /^\s+\S/.test(l)) cur.text += ' ' + l.trim();
  }
  if (cur) items.push(cur);
  return items.map((q) => {
    const stage = (q.text.match(/\b(M\d+(?:-window)?|P\d+|gate-\d+|G-[A-Z0-9]+)\b/) ?? [])[1] ?? null;
    return {
      id: q.id,
      resolved: /RESOLVED/i.test(q.text),
      ownerCall: /owner|gate|bless|ruling|ratif/i.test(q.text),
      blocks: stage,
      text: plain(q.text.replace(/^- OQ-\d+:?\s*/, '')).slice(0, 420),
    };
  });
}

function parseDecisions() {
  if (isInGame) {
    const out = [];
    const dir = join(ROOT, A.decisionsDir);
    const files = attempt(() => readdirSync(dir).filter((f) => /^\d{3,5}-.*\.md$/.test(f)).sort().reverse()) ?? [];
    for (const f of files.slice(0, 200)) {
      const body = attempt(() => readFileSync(join(dir, f), 'utf8')) ?? '';
      const title = plain(body.split('\n')[0]?.replace(/^#\s*/, '') ?? f);
      const date = (body.match(/\*\*Date:\*\*\s*([0-9-]+)/) ?? [])[1] ?? '';
      out.push({ id: f.replace(/\.md$/, ''), title: title.slice(0, 160), date, file: `${A.decisionsDir}/${f}` });
    }
    return out;
  }
  const body = read(A.decisionsFile);
  if (!body) return [];
  return [...body.matchAll(/^## (D-\d+) — ([^\n]+)/gm)].map((m) => ({
    id: m[1], title: plain(m[2]).slice(0, 160), date: (m[2].match(/\(([0-9{}A-Za-z_-]+)\)\s*$/) ?? [])[1] ?? '',
    file: A.decisionsFile,
  }));
}

function parsePostDev() {
  const panels = ['release', 'crashes', 'retention', 'economy', 'modqueue', 'support', 'cost'];
  const out = {};
  for (const p of panels) out[p] = attempt(() => JSON.parse(read(`.dashboard/${p}.json`) ?? 'null'));
  return out;
}

function buildModel() {
  const surfaces = attempt(parseSurfaces) ?? { rows: [], upNext: [] };
  const roadmap = attempt(parseRoadmap) ?? { phases: [], current: null };
  return {
    root: ROOT,
    layout: A.layout,
    generatedAt: new Date().toISOString(),
    appName: attempt(() => plain((read(A.productSpec) ?? '').split('\n')[0].replace(/^#\s*/, ''))) ?? 'Project',
    vision: attempt(parseVision),
    personas: attempt(parsePersonas) ?? [],
    surfaces: surfaces.rows,
    upNext: surfaces.upNext,
    roadmap,
    phaseDetail: attempt(() => parsePhaseDetail(roadmap.current)),
    health: attempt(parseHealth),
    openQuestions: attempt(parseOpenQuestions) ?? [],
    decisions: attempt(parseDecisions) ?? [],
    postDev: attempt(parsePostDev) ?? {},
  };
}

// ---- single-ID trace ------------------------------------------------------------------------------
const TRACE_SKIP = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.expo', '.next', 'toolkit']);
const TRACE_EXT = new Set(['.md', '.html', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.yaml', '.yml', '.sql']);

function bucketOf(rel) {
  const p = rel.replace(/\\/g, '/');
  if (/\.(test|spec)\.[a-z]+$/i.test(p) || /\/test(s)?\//.test(p)) return 'test';
  if (p.includes('decisions')) return 'decision';
  if (p.includes('product-spec')) return 'spec';
  if (p.includes('api-contract')) return 'api';
  if (p.includes('mockups/')) return 'mockup';
  if (p.startsWith('docs/design') || p.includes('ui-requirements') || p.includes('design-system')) return 'design';
  if (p.startsWith('docs/')) return 'docs';
  if (/^(apps|src|packages)\//.test(p)) return 'code';
  return 'other';
}

function trace(id) {
  const rx = new RegExp(`(^|[^A-Z0-9-])${id}([^0-9]|$)`);
  const hits = {};
  const walk = (dir) => {
    let entries;
    try { entries = readdirSync(join(ROOT, dir)); } catch { return; }
    for (const f of entries) {
      if (TRACE_SKIP.has(f) || f.startsWith('.')) continue;
      const rel = join(dir, f);
      let st; try { st = statSync(join(ROOT, rel)); } catch { continue; }
      if (st.isDirectory()) { walk(rel); continue; }
      if (!TRACE_EXT.has(extname(f)) || st.size > 3_000_000) continue;
      const body = read(rel);
      if (!body || !body.includes(id)) continue;
      const lines = body.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].includes(id) || !rx.test(lines[i])) continue;
        const b = bucketOf(rel);
        (hits[b] ??= []).push({ file: rel.replace(/\\/g, '/'), line: i + 1, text: plain(lines[i]).slice(0, 220) });
        if (hits[b].length >= 40) break;
      }
    }
  };
  walk('.');
  const order = ['spec', 'api', 'design', 'mockup', 'docs', 'code', 'test', 'decision', 'other'];
  return { id, buckets: order.filter((b) => hits[b]?.length).map((b) => ({ bucket: b, hits: hits[b] })) };
}

// ---- http ----------------------------------------------------------------------------------------
const MIME = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.js': 'text/javascript' };
const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(body);
};

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (url.pathname === '/' ) {
      return send(res, 200, readFileSync(join(HERE, 'index.html'), 'utf8'), MIME['.html']);
    }
    if (url.pathname === '/api/model') return send(res, 200, JSON.stringify(buildModel()));
    if (url.pathname === '/api/trace') {
      const id = (url.searchParams.get('id') ?? '').trim();
      if (!/^[A-Za-z][A-Za-z0-9]{0,9}-[A-Za-z0-9]{1,10}$/.test(id) && !/^\d{4}$/.test(id))
        return send(res, 400, JSON.stringify({ error: 'id must look like PREFIX-NN, AC-SLUG-n, OQ-nnn, or a 4-digit decision' }));
      return send(res, 200, JSON.stringify(trace(id)));
    }
    if (url.pathname.startsWith('/mockup/')) {
      const rel = decodeURIComponent(url.pathname.slice('/mockup/'.length));
      const abs = normalize(join(ROOT, A.mockupsDir, rel));
      if (!abs.startsWith(normalize(join(ROOT, A.mockupsDir)))) return send(res, 403, '{"error":"forbidden"}');
      if (!existsSync(abs)) return send(res, 404, '{"error":"not found"}');
      return send(res, 200, readFileSync(abs), MIME[extname(abs)] ?? 'text/html; charset=utf-8');
    }
    if (url.pathname.startsWith('/doc/')) {
      // raw doc view (owner-readable enough for now; the UI renders summaries, this is the source)
      const rel = decodeURIComponent(url.pathname.slice('/doc/'.length));
      const abs = normalize(join(ROOT, rel));
      if (!abs.startsWith(ROOT) || !abs.endsWith('.md') || !existsSync(abs)) return send(res, 404, '{"error":"not found"}');
      return send(res, 200, readFileSync(abs, 'utf8'), 'text/plain; charset=utf-8');
    }
    send(res, 404, '{"error":"unknown route"}');
  } catch (e) {
    send(res, 500, JSON.stringify({ error: String(e?.message ?? e) }));
  }
}).listen(PORT, () => {
  console.log(`Owner dashboard · ${A.layout} layout · root ${ROOT}`);
  console.log(`  http://localhost:${PORT}`);
});
