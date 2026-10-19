---
name: acceptance-walkthrough
description: >-
  acceptance-walkthrough turns a scope's acceptance criteria (AC-<SCOPE>-n IDs from
  ui-requirements.md and roadmap.md) into either a GUIDED owner test — an ordered journey script
  of "do X → expect Y — that's AC-n" steps the owner runs in one sitting — or an AUTOMATED E2E run
  (the project's E2E tool, e.g. Maestro flows named for the AC they demonstrate), and records
  pass/fail per criterion. Use it at every owner gate — a phase exit, a design converge, the
  release checklist — where the agent should OFFER the walkthrough unprompted when presenting
  gate-ready work; and on demand: "walk me through it", "acceptance walkthrough", "how do I review
  this", "demo the AC", "give me the test script". It kills "I don't know how to review this" and
  "is this button supposed to be missing?" — every step names its criterion, so the owner checks
  the bar, not their memory of it. Do NOT use it to WRITE criteria (ac-author), to triage a built
  screen's gaps outside a gate (parvati), or to audit code (murr) — and it never waives a failing
  criterion (only the owner can, as a decisions.md entry).
---

# acceptance-walkthrough — turns the bar into a sitting

The owner's scarcest resource is review attention, and the worst way to spend it is staring at a
screen wondering *"what am I supposed to be checking? is this button supposed to be missing?"*
The walkthrough answers that by construction: it collects every acceptance criterion owed at the
gate, orders them into one natural journey through the app, and hands the owner a script where
every step is **"do X → expect Y — that's AC-n"**. What can be demonstrated by a machine runs
automated *before* the sitting; what needs human judgment (taste, device feel, real money) is
clearly staged for the owner. The gate stops being an open-ended stare and becomes a checklist
with an audit trail.

The walkthrough **demonstrates and records — it never rules.** A failing criterion is a flag back
to the build lane; a pass is recorded; a waiver is the owner's act, written to `decisions.md`.

## When to run

- **At every owner gate — offered unprompted.** When presenting gate-ready work (a phase exit, a
  converged board, the release checklist), the working agent offers the walkthrough as part of the
  hand-off; the self-verification (parvati/murr/burt green) must already be done — the walkthrough
  is how the *owner* checks, not a substitute for the agent checking first.
- In Sigmund's phase 7 receipt, for every change the owner will see: phase 0's "do X, expect Y"
  criteria stand in for AC IDs (a project without the doc graph has none), and the depth phase
  0 set decides how long the script is. Sigmund writes those criteria himself: do not run
  `ac-author` for them, and a waiver is named in the step's outcome, not `decisions.md`. The
  self-verification is Sigmund's phases 4 and 5.
- On demand: "walk me through it", "how do I review this", "demo the AC".
- Re-run after gate failures are fixed — only the failed criteria, plus any journey steps needed
  to reach them.

## The authority — read in this order

1. **The gate** — `docs/roadmap.md` §4 (which gate, what the owner personally verifies) + the
   phase's §3 DoD block (`AC-P<N>-*`). This defines the walkthrough's scope.
2. **The surfaces' criteria** — `docs/ui-requirements.md` §3 blocks for every surface in scope
   (`AC-<SLUG>-*`) + §1 (`AC-GLOBAL-*`, checked once per walkthrough, not per surface).
3. **The states boards** (§2 Implements-from) — how to *reach* each state the criteria assert
   (what to tap, what data provokes the empty/error state).
4. **The data contract / seed** — what account, seed data, or environment the journey needs as
   preconditions (a walkthrough that starts "first, hand-create 45 records" is broken).
5. **Prior walkthrough results** for this gate, if any — re-verify failures, don't re-run passes
   unless the code under them changed.

## The method

0. **Identify the gate + collect the criteria.** Enumerate every AC ID owed at this gate (phase AC
   + each in-scope surface's AC + AC-GLOBAL). Anything unwritten → run `ac-author` first; a gate
   without written criteria cannot be walked.
1. **Split by mode, per criterion:**
   - **AUTOMATED** — mechanically checkable and worth pinning against regression (CRUD outcomes,
     refusals, navigation, counts). Written as E2E flows in the project's tool (e.g. Maestro),
     **one flow per journey leg, named for the AC IDs it demonstrates** (`p2-collection-add.yaml
     # AC-COL-1..4`). Keep the suite thin — automate the criteria that will be re-checked at every
     later gate, not everything (slow, flaky E2E is a liability).
   - **GUIDED** — judgment and blind-spot criteria: aesthetics/feel, device fit, haptics,
     real-money flows, anything the E2E harness can't see. These are *always* guided — automation's
     documented blind spots stay human.
   A typical gate mixes both: automated runs first and its results head the script.
2. **Order the guided steps into one natural journey** — minimal navigation, state built
   progressively (create the account → add the item → *now* the count criterion is checkable),
   destructive steps last. State the **preconditions** up front: device/target, account, seed
   data, how to reset.
3. **Write the script** (format below). Each step: the action, the expected outcome, the AC ID, a
   checkbox. **Owner-judgment prompts are labeled ☆ and carry no AC ID** — "does the shelf feel
   like a trophy case?" is the owner's gate, not a criterion, and mixing the two poisons both.
4. **Run the automated half**; mark its results in the script before the owner sits down. An
   automated FAIL stops the hand-off — fix before booking the owner's time.
5. **Record the sitting.** Every criterion → PASS / FAIL / SKIPPED (why). Failures become 🚩 flags
   routed to the build lane (murr for logic, the working agent for UI — parvati's triage format).
   **The gate does not pass with open FAILs** unless the owner explicitly waives — a waiver is a
   `decisions.md` entry naming the AC ID. A full pass is recorded against the gate
   (roadmap §4 / a decisions entry), and the walkthrough script is kept for the next re-fire.

## Script + report format — ALWAYS use this

```
# Walkthrough — <gate>: <scope> (phase P<N>)
**Covers:** AC-P<N>-1..a · AC-<SLUG>-1..b · AC-GLOBAL-1..c   (<n> criteria: <m> automated · <k> guided)
**Preconditions:** <target/device · account · seed · reset-how>
**Automated results (ran <when>):** <m>/<m> PASS ✅ | <list FAILs — sitting blocked until fixed>

## Leg 1 — <journey name, e.g. "first game into the collection">
1. [ ] Do <action> → expect <outcome> — **AC-COL-1**
2. [ ] Do <action> → expect <outcome> — **AC-COL-2**
   ☆ Owner judgment (no AC): <the taste question, plainly asked>

## Leg 2 — <e.g. "the unhappy paths">
3. [ ] Turn off the network, reopen the screen → expect <the offline state, not a spinner> — **AC-GLOBAL-3**
…

## Results (filled at the sitting)
| AC | Result | Note |
|---|---|---|
| AC-COL-1 | PASS/FAIL | <…> |
**Verdict:** GATE PASSED ✅ | <n> FAILS → flags filed: <where> | waived: <AC-x, decisions.md D-nnn>
```

## What acceptance-walkthrough does NOT do

- Never **writes** criteria — a gap in the AC set is `ac-author`'s job (run it, then walk).
- Never **rules on taste** — it stages ☆ judgment prompts; the owner answers them.
- Never **waives a failing criterion** — only the owner, recorded in `decisions.md`.
- Never substitutes for self-verification — parvati/murr/burt run *before* work is called
  gate-ready; the walkthrough is the owner's check, not the agent's first look.
- Never bloats the E2E suite — it automates the re-checkable core and leaves one-off
  demonstrations guided; a flaky walkthrough is worse than none.
