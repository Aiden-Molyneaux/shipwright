# QA Runbook — the lessons ladder (tier 1: capture)

Workflow lessons for the QA/verify lane (dev servers, preview, screenshot capture, test running).
Owned by the **doctor-nick** skill. This file is operational (like HEALTH.md) — not a registered
spec doc; agents append directly, mid-task, zero ceremony.

**The ladder:** capture instantly here → **twice = automate** into the dev supervisor's `doctor`
verb → stable invariants become CLAUDE.md law. When stuck on *workflow* (not product bugs): run
`doctor` → check this file → only then investigate from scratch.

**Entry format** (append under Active lessons):

    ## <short symptom title>
    - **Symptom:** what you observed (error text, blank page, hang…)
    - **Diagnosis:** actual cause
    - **Fix:** exact commands / steps that resolved it
    - **Verified:** YYYY-MM-DD · **Hits:** 1

Re-hit an existing entry → increment **Hits**, update **Verified**. At **Hits ≥ 2** and
deterministically checkable → promote to a `doctor` check and shrink the entry to a one-liner
under Promoted.

---

## Active lessons

*(none yet — first agent to hit novel QA friction appends here)*

## Promoted (owned by `doctor`)

*(none yet — entries move here when a doctor check absorbs them)*

## Canonized (CLAUDE.md law)

*(none yet — standing environment invariants, promoted with owner approval)*
