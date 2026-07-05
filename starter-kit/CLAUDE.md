# CLAUDE.md — {{APP_NAME}}

{{APP_NAME}} is {{ONE_LINE_PITCH — platform, audience, the one thing it must be great at}}.

## Collaboration rules

1. **Ask, don't assume.** If something is unclear, ask before writing a line. When running
   unattended, pick the most reasonable interpretation, proceed, and **record the assumption**
   (an `ASSUMPTION(OQ-xxx)` tag + an open-questions entry) rather than blocking — except the
   STOP-and-file classes in `CONVENTIONS.md` rule 6, which are never assumed.
2. **Simplest solution for simple problems; better solutions for hard ones.** No speculative
   flexibility.
3. **Don't touch unrelated code** — but do surface smells you find so they become separate issues.
4. **Flag uncertainty explicitly.** Confidence without certainty causes more damage than admitting
   a gap; a small, low-risk experiment beats a guess.
5. **If you see a clearly better approach, say so before implementing** (the trade-off in 2–4
   bullets), then proceed unless the alternative avoids serious risk or wasted work.

## Current stage

**{{Stage per lifecycle-playbook.md — e.g. "Stage 1 · Specify".}}** Read
[`lifecycle-playbook.md`](lifecycle-playbook.md) for what this stage produces, its guardrails, and
its exit gate. Update this line when a stage gate passes.

## Read this first

**[`docs/00-INDEX.md`](docs/00-INDEX.md)** is the working agreement — which document owns which
truth, the stable-ID scheme, and the change protocol. The summary below is convenience; 00-INDEX wins.

| Concern | Document |
|---|---|
| Behavior, rules, data model | `docs/product-spec.md` ← the authority |
| Endpoint/payload shapes | `docs/api-contract.md` {{(delete if backend-less)}} |
| What each surface does + its acceptance criteria + design status | `docs/ui-requirements.md` |
| Aesthetic profile, foundation rules, tokens, component names | `docs/design-system.md` |
| How code is written (the per-PR rulebook) | `CONVENTIONS.md` |
| Build order + per-phase Definition of Done | `docs/roadmap.md` |
| Why a decision was made | `docs/decisions.md` (append-only) |
| Unresolved items (the inbox) | `docs/open-questions.md` |
| Project health | `docs/HEALTH.md` — generated; refresh with `node scripts/health-check.mjs` |
| QA workflow lessons (symptom → fix) | `docs/qa-runbook.md` — operational; agents append directly |

## Working rules (non-negotiable)

1. **Each spec doc has exactly ONE editor.** Never hand-patch behavior into a downstream doc. New
   or changed behavior → edit the owning doc, assign a **stable ID**, bump version + changelog
   (00-INDEX §4).
2. **Triage first:** behavior/data/rules → `product-spec` (+ `api-contract`); pure look/flow →
   `ui-requirements` / `design-system`. A design need that contradicts the spec is a *spec change*,
   not a quiet edit.
3. **Capture, don't lose:** mid-task ideas/questions → append to `docs/open-questions.md`.
4. **Reference behavior by ID** — don't restate it. **Commit messages name the IDs touched.**

## Every task: grounded, healthy, receipted

1. **Ground first.** Know which roadmap phase the task serves and which surface + stable IDs are in
   scope before substantial work.
2. **Stay healthy.** Run `node scripts/health-check.mjs` after touching any registered doc; clear
   red before declaring doc/design work done. Never hand-edit `docs/HEALTH.md`.
3. **Self-verify before the owner sees it.** Design files → **burt**; built screens → **parvati**
   (vs mockup + phase DoD + surface AC); code → **murr** + the checks in `CONVENTIONS.md`
   (`.claude/skills/`; manual fallbacks in `AGENTS.md`). The owner reviews *direction*, not slips
   a reviewer should have caught.
4. **Leave a receipt** at the end of every substantial task: **(a)** what changed — files + IDs +
   downstream docs chain-updated; **(b)** what you assumed or decided, and why; **(c)** what needs
   the owner's eyes.

## The QA loop (lessons ladder)

QA-workflow friction (dev servers, preview, ports, env) is captured and compounded, never
re-solved from scratch — the **doctor-nick** skill owns the loop:

1. **Preflight:** QA starts with the dev supervisor — `up` then `doctor` — green board before any
   preview/screenshot/test work.
2. **Stuck on workflow?** `doctor` → `docs/qa-runbook.md` → only then investigate. Product bugs
   are exempt (that's real QA).
3. **Retro:** task receipts answer "workflow friction this run?" — novel lessons are appended to
   the runbook; at **Hits ≥ 2** they're promoted into a `doctor` check; standing invariants
   become law in this file (owner-gated).

**The supervisor contract:** one standing script (e.g. `scripts/dev-stack.mjs`) exposing
`up` (idempotent ensure-everything: DB, API, client dev server, pre-warm), `status` (one-shot
health JSON), and `doctor` (**read-only** diagnose-and-prescribe over the known failure
signatures — never mutates, never touches owner-protected lanes). Build it with the first
runnable slice; grow `doctor` only by promotion from the runbook.

## Design-phase workflow

**HTML deliverables only — never image files** (the owner reviews by opening the HTML directly;
self-verification screenshots are deleted before the turn ends). Convention + states-board rules:
[`docs/design/mockups/README.md`](docs/design/mockups/README.md). After every draft pass, update
the surface dashboard (`docs/ui-requirements.md` §2) and surface the changed rows to the owner.

## Tech direction

{{STACK — client, server (or "no backend"), data layer, key libraries. Lock it as a decisions.md
[LOCK] entry before the first feature phase; until then it's a proposal.}}

## Build / run

{{Filled in as the scaffold lands: the dev-loop commands, test commands, seed data. Keep current.}}
