# Starter Kit — spec-first app development, Day One → live

This is the repo skeleton a new app clones on Day One so an agent (Claude/Opus in Claude Code, or
any harness that reads `AGENTS.md`) can drive it from idea to launched-and-live with spec-first,
design-first, robustness-first discipline — a solo owner reviewing at a few well-chosen gates while
the pipeline carries everything else.

**The core discipline, in one breath:** every truth has exactly one owning document · every
behavior has a stable ID · uncertainty is captured to an inbox and resolved to a decision log,
never improvised in place · the quality bar is written down as acceptance criteria · the agent
self-verifies against that bar before the owner ever looks · a deterministic health check keeps
the doc graph honest.

## Before you scaffold — what the owner should have in hand

The Day-One interview (below) works only if you can answer it with conviction. Don't scaffold to
*find* the idea; scaffold to *execute* one. Come with:

1. **You know what you want to build.** You can say what the app is and who it's for in a sentence
   or two, without hedging. If you can't, that conversation happens *before* this repo exists.
2. **The idea has survived an adversarial validation pass.** Run the toolkit's **britch** skill
   (the idea gate: hard questions → weakest assumption → Kill / Sharpen / Proceed) and only
   scaffold on a **PROCEED** — its "real point" + kill criteria seed `product-spec.md` §1 and the
   first `decisions.md` entry. Killing an idea costs a conversation; killing a scaffolded project
   costs a graveyard repo and momentum.
3. **You know your end goal.** Personal tool for yourself? Shipped store app? Revenue? This is the
   honest input behind the launch-shape, risk-domain, and cadence questions — and it decides how
   much of this kit's ceremony you keep (a just-for-me tool can delete more than a paid app can).
4. **Practicalities:** git + Node installed, and an agent harness (Claude Code, or anything that
   reads `AGENTS.md`).

You do **not** need: a feature list (Stage 1's job), a design (Stage 2's), or a stack decision
(question 7 accepts "propose one").

## What's in the box

| File | Role |
|---|---|
| `CLAUDE.md` / `AGENTS.md` | The agent working agreement (AGENTS.md mirrors it for non-Claude harnesses + carries the no-skill manual fallbacks) |
| `docs/00-INDEX.md` | The map: doc ownership, the version register, stable IDs, the change protocol |
| `docs/product-spec.md` | Behavior/data/rules — the authority |
| `docs/api-contract.md` | The FE↔BE seam *(delete for backend-less apps)* |
| `docs/ui-requirements.md` | Per-surface tasks + **inline acceptance criteria** + the live surface dashboard |
| `docs/design-system.md` | Aesthetic profile · foundation rules · tokens · component map |
| `docs/testing-strategy.md` | The trophy, the §3 risk shortlist (health-checked), the testing-kit mechanisms |
| `CONVENTIONS.md` | How code is written — the per-PR rulebook |
| `docs/roadmap.md` | Build phases, each with entry criteria + Definition of Done |
| `docs/decisions.md` | Append-only why-log (`D-NNN`) |
| `docs/open-questions.md` | The inbox (`OQ-NNN`) — the only free-append file |
| `docs/design/mockups/README.md` | The mockup convention (HTML-only, drafts → `*-states.html`) |
| `lifecycle-playbook.md` | The Day One → launch → live spine: stages, guardrails, gates |
| `scripts/health-check.mjs` | Deterministic doc-graph checks → generates `docs/HEALTH.md` |

Nine living docs + a generated dashboard — plus the toolkit's **`dashboard/`** (the Owner
cockpit: `node <shipwright>/dashboard/server.mjs` renders the whole graph human-readable — the owner
decision ledger, surface status with click-to-open mockups, phase progress, health, and
click-any-ID tracing; see its README). Two more sibling packages plug in: the toolkit's
**`testing-kit/`** (the code behind testing-strategy §6 — the boot-time authz-test enforcer, the
concurrency-race harness, the containerized real-DB harness, the fail-closed destructive-DB
guard) installs at phase P1, backend projects only. The *skills* live in the toolkit's sibling
`skills/` package, in three classes: the **reviewers** — burt (design files), parvati (running app), murr
(code) — plus the AC spine — ac-author (writes the `AC-*` criteria into the doc graph),
acceptance-walkthrough (turns a gate's AC into a guided owner sitting / E2E run); the **cognitive
members** that shape work while it happens — ui-craft (senior-designer defaults + the aesthetic
profile), spec-elicitation (the Stage-1 conversation harness), failure-first (failure modes
before happy paths); and **britch**, the pre-scaffold idea gate. Copy the project-scoped eight
into the new repo's `.claude/skills/` at scaffold time (britch stays user-scoped — it runs before
the repo exists). On a harness without skill support, `AGENTS.md` lists the manual equivalent of
each.

## Day One — the scaffold procedure (agent-driven, ~one session)

**1. Copy** this directory's contents into the new repo's root, and the toolkit's project-scoped
skills — `skills/{burt,parvati,murr,ac-author,acceptance-walkthrough,ui-craft,spec-elicitation,failure-first}`
— into `.claude/skills/`. `git init`, first commit.

**2. Interview the owner** (or take a written brief) — the per-project profile:

| # | Question | Lands in |
|---|---|---|
| 1 | App name + one-line pitch | everywhere (`{{APP_NAME}}`, `{{ONE_LINE_PITCH}}`) |
| 2 | Platform/target (mobile · web · desktop · CLI) + launch shape (store app? deploy?) | CLAUDE.md, roadmap, playbook Stage 5 |
| 3 | Backend, or local-only? Multi-user? | keeps/deletes `api-contract.md` + CONVENTIONS rules 2–4 |
| 4 | Personas (2–5) and which is the **north star** | product-spec §2–3 |
| 5 | The **defining constraint** (usage pattern that shapes everything) | product-spec §1 |
| 6 | Aesthetic profile: mood-in-five-words, bold-where/conventional-where, references, the never-list | design-system §1 |
| 7 | Stack — or "propose one, boring-on-purpose" | CLAUDE.md Tech direction (locked later at G-3) |
| 8 | The app's domains → 3–8 stable-ID prefixes | 00-INDEX §3 |
| 9 | Risk domains: real money? auth? UGC? irreversible data? | CONVENTIONS owner-approval classes, roadmap gates |
| 10 | Owner cadence: hours/week, review appetite, hard dates? | roadmap sizing |

**3. Propagate.** Resolve every `{{…}}` placeholder across every file — fill it or delete the line
it's on. **Delete what doesn't apply** (files, rules, checklist lines) instead of leaving dead
weight; deleting is part of the design. Register your ID prefixes; seed product-spec §1–3.

**4. Verify.** `node scripts/health-check.mjs` — the *Scaffold complete* light stays red until no
placeholder survives. Clear all red.

**5. Gate G-0.** The owner reads product-spec §1–3 (vision, personas, principles) and blesses them.
Set the **Current stage** line in `CLAUDE.md` to *Stage 1 · Specify* and follow
[`lifecycle-playbook.md`](lifecycle-playbook.md) from there.

## Principles this kit encodes (don't undo them)

- **One editor per truth; everyone else references by ID.** The change protocol (00-INDEX §4) is
  the whole ballgame — capture → formalize → resolve, batched.
- **Acceptance criteria live where the work lives** (inline per surface, per phase), so "done"
  is never a matter of opinion.
- **Owner gates sit only where agent review is blind** — taste, money, auth, irreversibility.
- **Generated dashboards are never hand-edited**; fix the underlying doc and re-run.
- **Lean by deletion:** this kit is the ~8-doc floor. Add a ninth doc only when a real recurring
  need earns it, and give it an owner row in the 00-INDEX register the same day.
