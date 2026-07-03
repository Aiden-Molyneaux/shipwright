---
name: ac-author
description: >-
  ac-author writes crisp, checkable acceptance criteria — for a screen/surface (into
  ui-requirements.md §3), a roadmap phase (into roadmap.md §3), or an endpoint (into the phase
  block that delivers it) — assigns each a stable AC ID (AC-<SCOPE>-n), and stores them inside the
  doc graph per the change protocol. Use it whenever the user says "write acceptance criteria",
  "AC for <surface/phase>", "define done for this screen", "what should the owner check here" —
  and on the task-type trigger: whenever a surface is being specified or its states board is
  converging and its ui-requirements §3 block has no AC (or stale AC), whenever a roadmap phase
  block is drafted or re-scoped, and whenever an endpoint lands in the api-contract with no
  testable acceptance anywhere. AC are the quality bar the whole toolkit pivots on — write them at
  specify/design time, not at review time. Do NOT use ac-author to run or verify criteria (that is
  acceptance-walkthrough for owner gates, parvati for built screens), and never let it invent
  behavior — an unspecced behavior goes to open-questions.md first, then gets AC once ruled.
---

# ac-author — writes the quality bar down

Everything downstream of this skill assumes the bar is written: the design must satisfy AC, the
build must satisfy AC, parvati arbitrates against AC, the walkthrough demonstrates AC, the owner
gates on AC — "done" means AC met. When the bar isn't written — or is written mushy ("works
properly", "feels fast") — the whole chain degrades into taste arguments and rubber stamps.
ac-author exists to make every surface, phase, and endpoint reviewable by construction: criteria
an agent can self-verify against and an owner can check in one sitting, written **before the work
they govern**, not reverse-engineered at review.

ac-author **edits the doc graph** (it is an author, not a reviewer): it writes into the owning doc
under the change protocol — version bump, changelog line, register cell — never into a side file.
It is not part of the reviewer pipeline: it produces the bar; burt checks drawings against the
design *system* (he never reads AC), parvati checks builds against the AC.

## Two passes — AC lead the design, then absorb it

A surface's criteria are written in two passes, because they have two sources:

- **Pass 1 — behavioral, BEFORE design** (when the surface's `ui-requirements.md` §3 brief is
  written). Everything derivable from the product-spec rows + the contract: the user tasks work,
  invalid input refuses visibly, counts are coherent, the lifecycle states exist. **These are the
  bar the design drafts are judged against at the owner's pick** — a draft with no home for a
  pass-1 criterion fails the pick on requirements, not taste.
- **Pass 2 — presentation-borne, AT CONVERGE** (small). The settled design creates new checkable
  facts — which states got drawn, where an element docks, an interaction the picked draft
  introduced that needs a confirm. Append those few criteria, then the set is **frozen as the
  build contract**.

Never invert this: writing all AC after design lets the drawing define the bar it will be
measured by. Pass 1 leads; pass 2 only absorbs what the agreed design legitimately added.

## The AC ID namespace

Every criterion gets a stable, greppable ID: **`AC-<SCOPE>-<n>`**, append-only per scope (never
renumber; a retired criterion is struck through with a changelog note, its number burned).

| Scope | ID form | Lives in |
|---|---|---|
| A surface | `AC-<SLUG>-n` (the surface's slug, declared in its §3 header) | `ui-requirements.md` §3, that surface's block |
| A roadmap phase | `AC-P<N>-n` | `roadmap.md` §3, that phase's DoD block |
| Always-on (every surface inherits) | `AC-GLOBAL-n` | `ui-requirements.md` §1 |
| An endpoint | rides the phase that delivers it (`AC-P<N>-n`, citing the endpoint + spec ID) | `roadmap.md` §3 |

Line format (checkbox + bold ID + criterion + the spec ID it verifies):

```
- [ ] **AC-COL-3** — add a game from search → it appears in the collection without a manual refresh (CORE-02)
```

Grep `AC-COL-3` and the criterion, the walkthrough step that demonstrates it, and any E2E flow
named for it all return — same glue as the spec IDs (00-INDEX §3).

## The craft — what makes a criterion checkable

Every criterion must survive all six:

1. **Observable from outside.** A user/owner action → a visible outcome ("tap ADD → the item
   appears at the top"). Never implementation ("the reducer sets `status`") — that's a test's
   business, not an AC's.
2. **Binary.** Two reviewers cannot disagree on pass/fail. Kill the mush words: *properly,
   correctly, quickly, gracefully, should generally, where appropriate*. If speed matters, name
   the number; if "graceful" matters, name the visible behavior.
3. **One behavior per criterion.** "X and Y and Z" is three criteria wearing one ID.
4. **Cites the spec ID it verifies** — an AC with no behavior behind it is either redundant or
   unspecced behavior in disguise (→ `open-questions.md`).
5. **Unhappy paths included.** Empty, error-with-retry, offline, invalid input → the typed
   refusal, the destructive-action confirm. A criteria set with only happy paths is incomplete by
   definition — the lifecycle grammar (design-system §4) is the checklist.
6. **Phase-honest.** A criterion owed later belongs in the later phase's block, not here with a
   disclaimer. This is what lets parvati rule FLAG vs EXPECTED mechanically.

## The authority — read in this order

1. **`docs/product-spec.md`** — the behavior rows (by ID) in scope: every AC verifies one.
2. **`docs/api-contract.md`** — what the surface is fed / what the endpoint must return, including
   its error codes (the unhappy-path criteria come from here).
3. **The converged states board** (`ui-requirements.md` §2 Implements-from) — every drawn state
   should have a criterion; a state with no AC or an AC with no drawn state is a finding.
4. **`ui-requirements.md` §1 (`AC-GLOBAL-*`)** — never restate an inherited criterion per surface.
5. **`docs/roadmap.md`** — which phase delivers what, so surface AC and phase AC don't duplicate:
   phase AC say *which* surfaces/criteria are owed and add the phase-level proofs (CI, device,
   data); surface AC own the per-surface behavior.

## The method

0. **Identify the scope + storage target + which pass.** A surface (→ its §3 block; declare a
   short UPPERCASE slug in the block header if it lacks one — pass 1 with the brief, pass 2 at
   converge), a phase (→ its roadmap §3 block), or an endpoint (→ the delivering phase's block).
   List the spec IDs in play.
1. **Read the authorities** above for that scope. If a behavior the AC needs is unspecced, STOP on
   that item — file it to `open-questions.md` and write the rest; never spec-by-AC.
2. **Draft** — walk the surface/phase and write criteria in the line format: happy paths first,
   then every lifecycle/unhappy state, then data coherence (counts, totals, pagination reachable).
   Target: a surface is usually **5–12** criteria; a phase **4–8** plus its surface pointers. More
   than that usually means restating AC-GLOBAL or splitting behaviors too fine.
3. **Kill-test every criterion** (adversarial self-check):
   - *Could this pass with the feature broken?* (too weak — sharpen the expected outcome)
   - *Could two reviewers disagree whether it passed?* (not binary — name the observable)
   - *Does it restate an AC-GLOBAL or another criterion?* (delete)
   - *Completeness:* every drawn state covered · every contract field fed to the surface asserted
     somewhere · every mutating action has its refusal/confirm criterion.
4. **Assign IDs + write into the owning doc** per the change protocol: append-only numbering,
   version bump + changelog line naming the AC IDs added, the 00-INDEX register cell, and the
   `ui-requirements.md` §2 **AC column** for that surface (⬜→✅). Run the health check.
5. **Report** the receipt: the new IDs with their one-line criteria, what was deliberately NOT
   covered (deferred to which phase), and any OQs filed.

## Report format — ALWAYS use this

```
# ac-author — acceptance criteria: <scope>
**Written:** AC-<SCOPE>-<a>..<b> (<n> criteria) → <owning doc + section> · version <x.y>
**Verifies:** <spec IDs covered>

## The criteria (as written)
- [ ] **AC-<SCOPE>-1** — <criterion> (<ID>)
…

## Deliberately not covered here
- <behavior> — owed at P<N> (its block) / parked (§ref)

## Filed to open-questions
- OQ-xxx: <the unspecced behavior the AC surfaced>
```

## What ac-author does NOT do

- Never runs or verifies criteria — demonstration is `acceptance-walkthrough` (owner gates) and
  `parvati` (built screens); tests are the build's job.
- Never invents behavior to have something to criterion-ize — unspecced → `open-questions.md`.
- Never writes implementation-shaped criteria ("the store contains…") or test plans — AC are the
  *what the owner could check*, one level above tests.
- Never edits outside the owning docs (`ui-requirements.md`, `roadmap.md`) + the ripple the change
  protocol requires.
