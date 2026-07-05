---
name: doctor-nick
description: >-
  Doctor Nick owns the QA-workflow loop — the lessons ladder that keeps agents from burning time
  on dev-server/preview friction instead of doing QA. Use Doctor Nick whenever you START QA or
  verification against the running app (preview, screenshot capture for parvati, integration-test
  runs), whenever you are BLOCKED by workflow failures rather than product bugs (server not
  responding, unknown server state, blank preview, port confusion, env/CORS login failures), and
  at the WRAP-UP of any task that involved QA. Also triggers on "run doctor nick", "doctor", "why
  is the preview broken", "is the stack up". Do NOT use him for product bugs found BY QA (the
  debugging discipline's lane) or to judge the app's output (parvati/murr/burt own that).
---

# Doctor Nick — the QA lessons ladder

QA workflow problems are cheap the second time IF the first time was captured. The ladder:
**capture instantly in prose → twice = automate → stable = law.**

- **Tier 1 — capture:** `docs/qa-runbook.md` (Symptom → Diagnosis → Fix → Verified → Hits).
- **Tier 2 — automate:** the project's dev supervisor `doctor` verb (see CLAUDE.md Build/run) —
  read-only; probes every known failure signature, prints the exact fix, exit non-zero on
  blocking reds. Never mutates state.
- **Tier 3 — law:** CLAUDE.md environment invariants.

**The supervisor contract** (what the project must provide — see the starter-kit QA-loop
section): one supervisor script exposing `up` (idempotent ensure-everything), `status` (one-shot
health JSON), `doctor` (read-only diagnose + prescribe). If the project lacks a `doctor` verb
yet, building it is the first promotion (tier 2) this skill triggers.

## The three rules

1. **Preflight.** Before ANY preview/screenshot/browser/integration-test work: supervisor `up`
   then `doctor`. Green board before QA. Never hand-build parallel servers.
2. **Stuck rule.** Blocked on *workflow* (servers, ports, env, preview — NOT a product bug) for
   more than ~2 minutes → run `doctor` → check the runbook's Active lessons → only then
   investigate from scratch. Product bugs are exempt — that's real QA.
3. **Retro rule.** The wrap-up receipt of every QA-involving task answers: **"Workflow friction
   this run?"** — Novel friction you solved → append a runbook entry before ending the turn.
   Re-hit → increment **Hits** + update **Verified**. **Hits ≥ 2** and deterministically
   checkable → promote to a `doctor` check, shrink the entry to a Promoted one-liner. A standing
   environment invariant → propose a CLAUDE.md line to the owner (don't self-canonize).

## Boundaries

- Doctor Nick diagnoses the *workflow*; he never judges the *work* (parvati/burt/murr lanes) and
  never fixes product code.
- `doctor` never kills or restarts anything an owner lane depends on (each project's CLAUDE.md
  names its protected lanes).
- Runbook entries need evidence — the actual symptom text and the verified fix, not a guess.
