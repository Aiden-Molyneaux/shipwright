# Owner dashboard — the lifecycle cockpit

The one place the owner looks. A small local web app that parses the project's **doc graph**
(never a database, never its own state — the docs stay the truth; this renders them
human-readable) and shows where the project is across pre-dev, in-dev, and post-dev.

## Run

```
node <path-to-shipwright>/dashboard/server.mjs [projectRoot] [--port 8791]
```

Defaults: project root = cwd, port 8791. Register it in a project's `.claude/launch.json` (as
InGame does — entry `dashboard`) so agent preview tooling can start it. Zero
dependencies — plain Node, one server file, one HTML file.

## What it shows

**Header (always):** app name · the health light (parsed from the generated health file) ·
"you are here: \<phase\>" · which layout it detected.

**Pre-dev:** the idea one-pager (product-spec §1) · personas · the roadmap phase strip with the
current phase highlighted (hover a phase for its exit criteria) · the **Owner Decision Ledger** —
every open question flagged as an owner call, PENDING with the stage it blocks, above the
recently-DECIDED list · readable renders of the full open-questions inbox and the decision log
(each links to its source doc).

**In-dev:** health + its needs-attention items · the current phase's DoD/walkthrough checklist
progress (checked vs unchecked boxes in the phase's acceptance/build doc) with its `AC-*` chips ·
"what's next" (the surface dashboard's queue) · the **surface table — click a mockup to open the
finished states board** (served standalone, exactly as the owner reviews them).

**Post-dev (stubs, wired later):** release status · crash rate · per-persona retention · economy
health · mod queue · support inbox · run cost. Each panel's wiring contract: drop
`<projectRoot>/.dashboard/<panel>.json` (any flat JSON) and the panel renders it — the file is
the adapter seam for Sentry/analytics/store exports when Arc C/D arrive.

**The superpower — single-ID trace:** every stable ID rendered anywhere (spec IDs, `AC-*`,
`OQ-*`) is clickable → a full-project trace grouped **spec → api → design → mockup → code →
test → decision**, each hit `file:line` + snippet. Also works from the trace tab's search box
(4-digit decision numbers too).

## The read layer (generic by adapter)

`server.mjs` auto-detects the layout:

| | `ingame` layout | `starter` layout (the starter kit) |
|---|---|---|
| spec | `docs/spec/product-spec.md` | `docs/product-spec.md` |
| surfaces | `docs/design/SCREEN-STATUS.md` | `docs/ui-requirements.md` §2 |
| roadmap | `docs/planning/road-to-market.md` §4 | `docs/roadmap.md` §2 + §3 checkboxes |
| decisions | `docs/decisions/*.md` | `docs/decisions.md` (`## D-NNN`) |
| health | `docs/PROJECT-HEALTH.md` | `docs/HEALTH.md` |

Current phase = `.dashboard/config.json` `{ "currentPhase": "M3" }` if present, else the git
branch (`m3` → M3), else unknown. To support a third layout, add an adapter object at the top of
`server.mjs` — every parser reads through it.

## Boundaries

- **Read-only.** It never writes a doc, never runs the health check, never edits state — the
  change protocol stays the only pen. Stale health? Run the health check and hit refresh.
- Parsers are best-effort: a panel that can't parse says so and the rest renders (one odd doc
  never blanks the cockpit).
- Mockup/doc serving is clamped to the project root (traversal guarded); it binds to localhost.
