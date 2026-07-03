---
name: failure-first
description: >-
  failure-first makes code that touches unreliability get designed from its failure modes
  backward — enumerate the ways it fails BEFORE writing the happy path. Use whenever you are about
  to design or implement an operation that can fail or race: a network call, a mutation, an async
  flow, an upload, a background job, a payment/webhook, a cache, an optimistic update, a retry —
  or the client state that renders such an operation. It injects the failure-enumeration habit
  (timeout, duplicate fire, partial success, out-of-order, stale, offline, gone-mid-flight),
  idempotency-by-design, state machines over boolean soup, and the "what does the user see for
  each failure" discipline. Stay quiet for pure functions and deterministic local logic, for
  debugging an existing defect (the systematic-debugging discipline owns that), for reviewing
  finished code (murr's lane), and for docs/design work. failure-first shapes the work inline —
  no reports, no gates; murr audits the result after, and if murr would flag it, this skill
  should have prevented it.
---

# failure-first — design from the failure modes backward

The generalist habit is happy-path-first: write the flow that works, then wrap it in a
try/catch and move on. That's precisely backwards for any operation touching a network, a
database, time, or a second actor — in those, the failure modes ARE most of the design surface,
and bolting them on later is how the double-submit, the stranded spinner, and the
500-on-bad-input get built. failure-first inverts the order: enumerate how it fails, decide what
each failure means for the user and the data, *then* write the happy path as the special case
where nothing went wrong.

**Class rules:** shapes work **inline** — no reports, no gates. **The project's docs outrank
it**: `CONVENTIONS.md` (error model, validation, scoping) and `api-contract.md` (the typed error
codes) win wherever they overlap. Reviewer partner: **murr** — his runtime checklist (edge cases,
races, error handling, 4xx-not-500, authz) is this skill's checklist run in reverse; work shaped
here should give him nothing.

## Loads / stays quiet

**Loads:** designing/implementing network calls, mutations, async flows, jobs, webhooks, caches,
optimistic updates, retries — or the UI state that renders them.
**Stays quiet:** pure functions and deterministic local logic · debugging an existing defect ·
reviewing finished code (murr) · docs/design work. The test: *can this code's outcome differ run
to run for reasons outside it?* No → quiet.

## The bar

Before the happy path exists, the failure modes are enumerated and each has a decided fate — in
the data (rolled back? retried? reconciled?) and on the screen (what the user sees, whether their
input survives, whether retry is safe). Every mutation is idempotent or explicitly guarded
against double-fire. Every loading state has an exit. Invalid input dies at the boundary as the
contract's typed 4xx. Nothing catches an error just to hide it.

## Considerations — think through these while designing

**Enumerate first — the standard failure set for any unreliable operation**
- Timeout / no response (and: the request may still have *succeeded* server-side — then what?)
- Duplicate fire — double-tap, retry-after-timeout, webhook redelivery. What's the second
  execution's result?
- Partial success — 3 of 5 writes landed, the upload finished but the confirm didn't. Is there a
  transaction boundary, or a reconcile story?
- Out-of-order — the older response lands last. Does last-write-win corrupt state?
- Stale actor — token expired mid-flow, permission revoked, the resource deleted by another
  session. What does the in-flight operation do?
- Offline at start vs offline mid-flight — different states, often conflated.

**Idempotency & state, by design**
- Mutations idempotent by key/token where the transport can redeliver; if they can't be, a guard
  (disable-on-submit is UI courtesy, not a guarantee — the server enforces).
- Check-then-act is a race until proven otherwise (two requests both pass the balance check) —
  the invariant lives in the transaction/constraint, not the if-statement.
- Model async state as a **state machine** (`idle | loading | success | error`, one field), never
  boolean soup (`isLoading && !isError && hasData` has unrepresentable-state bugs by
  construction).
- Optimistic updates carry their rollback and their reconcile-on-refetch — an optimistic write
  with no undo path is a lie waiting for a timeout.

**The boundary**
- Validate at the trust boundary; invalid input → the contract's typed 4xx, never an unhandled
  500. New refusal = a registered error code (append to the contract), not an ad-hoc string.
- Error responses carry what the *client* needs, never internals (stacks, SQL, exact
  which-credential-failed).

**The user's side of every failure**
- For each enumerated failure: what renders? Is the user's input preserved? Is retry offered —
  and only where retry is *safe*?
- Fixable errors surface at the fix point (the field), transient news in transient chrome — and
  errors in the app's voice, saying what to do next.
- Every spinner has an exit: timeout to an error state with retry. A strandable spinner is a
  designed-in failure.
- Silent background failures (sync, autosave) still need a surfacing story — "it's been failing
  for a week" must be impossible.

## Classic mistakes — the tells

- **Happy-path-first, catch-later** — a bare `try { theWholeFlow() } catch (e) { toast(e) }` →
  the failures were never enumerated; start over from the list.
- **Boolean soup** — three flags encoding four legal states out of eight representable → one
  state field.
- **Catch-and-continue** — an empty or log-only catch on a mutation path → someone downstream
  now operates on a lie.
- **Retry on non-idempotent** — auto-retrying a POST that charges/creates → idempotency key
  first, retry second.
- **Optimistic with no rollback** — the UI shows success the server may refuse → pair the
  update with its undo.
- **The immortal spinner** — loading with no timeout branch → every await gets a failure exit.
- **Ordering by hope** — assuming responses land in request order → tag requests, drop stale.
- **Double-fire "prevented" in the UI** — a disabled button as the only guard → the server
  enforces; the button is UX.

## How this shows up in the work

- The failure enumeration happens in your head (or a receipt line for the risky ones) — the
  *output* is code whose structure shows it: state machines, guards, typed refusals, exits.
- A real trade-off (e.g. reconcile-on-refetch vs pessimistic UI) is named in the receipt in one
  line.
- Risk-domain operations (auth, money, irreversible data — per CONVENTIONS) get their
  enumeration written down as test cases *first* (the test-first posture) — failure-first
  scenarios are exactly what those tests assert.
- A knowingly-deferred failure mode (e.g. "offline queue is P4") is **declared** in the receipt
  and, if user-visible, filed to the inbox — never silent.

## What failure-first does NOT do

- No reports, no gates — **murr** audits after; this skill's success is murr finding nothing.
- Never overrides `CONVENTIONS.md` / `api-contract.md` — the project's error model and code
  registry outrank generic patterns.
- Never invents behavior — an unspecced refusal/policy ("what SHOULD happen when…") is an
  `open-questions.md` line, not an assumption (the STOP-classes doubly so).
- Doesn't debug existing defects — that's the debugging discipline; this shapes new work.
