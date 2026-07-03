# AGENTS.md — {{APP_NAME}} (agent working agreement)

> This repo's full working agreement lives in **`CLAUDE.md`**. This file exists so agent harnesses
> that read `AGENTS.md` by convention (OpenCode, Codex, etc.) pick up the same rules. **Read
> `CLAUDE.md`, `docs/00-INDEX.md`, and `CONVENTIONS.md` before doing any work** — they are
> authoritative; the summary below is convenience, and `CLAUDE.md` wins.

## Non-negotiables

- **Each spec doc has exactly ONE editor.** Never hand-patch behavior into a downstream doc. New or
  changed behavior → edit the owning doc, assign a stable ID, bump version + changelog
  (`docs/00-INDEX.md` §4).
- **Reference behavior by stable ID**; commit messages name the IDs touched.
- **Ask, don't assume** — and the `CONVENTIONS.md` rule-6 classes ({{auth · money · destructive
  migration}}) are STOP-and-file, never assumed. Trivial reversible gaps: `ASSUMPTION(OQ-xxx)`-tag,
  file, proceed.
- **Verify before you claim done**; see your own UI before reporting a screen done.
- Run **`node scripts/health-check.mjs`** after touching the doc graph; keep it green.
- **Leave a receipt** (what changed / what you assumed / what needs the owner) after every
  substantial task.

## If this harness has no skill support

The guardrail skills (design audit, app-parity review, code review) are Claude Code skills; in a
harness without them, run the equivalent manually and say so in your receipt:

- **Doc health:** `node scripts/health-check.mjs` (same script the skill wraps).
- **Design audit:** walk `docs/design-system.md` §2 foundation rules against the changed mockup,
  rule by rule, citing file:line for each finding.
- **App parity:** compare the running screen against its `*-states.html` board + its
  `docs/ui-requirements.md` §3 acceptance criteria + the phase DoD (`docs/roadmap.md` §3).
- **Code review:** hold the diff to every `CONVENTIONS.md` rule + the Definition of Done.
- **AC authoring:** write observable, binary criteria as `AC-<SCOPE>-n` lines into
  `docs/ui-requirements.md` §3 / `docs/roadmap.md` §3, each citing its spec ID and covering the
  unhappy paths (see `.claude/skills/ac-author/SKILL.md` for the craft laws).
- **Owner-gate walkthrough:** assemble the gate's `AC-*` into one ordered "do X → expect Y —
  that's AC-n" script (judgment prompts labeled ☆, no AC ID) and offer it with the gate-ready
  hand-off; record PASS/FAIL per criterion.
- **Cognitive skills** (`ui-craft`, `spec-elicitation`, `failure-first`): before starting that
  kind of work, read the matching `.claude/skills/<name>/SKILL.md` and work to its bar — they are
  self-contained think-smarter checklists, not harness magic.

## Where things are

- **Source of truth:** `docs/product-spec.md` · `docs/api-contract.md` · `docs/ui-requirements.md`
  · `docs/design-system.md`.
- **Why decisions were made:** `docs/decisions.md` (append-only; take the next free number —
  parallel tracks collide).
- **Build plan + phase DoD:** `docs/roadmap.md` (non-authoritative where it disagrees with
  specs/decisions/CONVENTIONS).
- **The rulebook every PR is held to:** `CONVENTIONS.md`.
- **Current stage:** see the "Current stage" line in `CLAUDE.md` + `lifecycle-playbook.md`.
