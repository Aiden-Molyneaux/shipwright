# {{APP_NAME}} — Testing Strategy

> How we test: where rigor concentrates, which mechanisms make the discipline structural, and the
> laws that keep the suite honest. Referenced from `../CONVENTIONS.md`; behavior under test is
> identified by the spec's stable IDs. The health check reads §3's shortlist and reports which
> risk IDs have tagged tests.

**Version:** 0.1 · **Last updated:** {{DATE}} · **Owner:** the spec owner (one editor)

---

## 1. Principles (read these first)

1. **Every test must earn its place.** The litmus: *if this test failed, would it reveal a bug a
   real user would care about?* If not, don't write it. No coverage-percentage chasing, ever.
2. **Risk-based, not uniform.** Rigor concentrates on the §3 shortlist — the expensive-to-break
   domains. Low-risk and cosmetic code gets light or manual treatment.
3. **Fast feedback is a feature.** A slow suite gets ignored, then trusted, then wrong. Budget for
   speed (parallelism, container reuse, per-test reset) and treat a slow suite as a bug.
4. **Don't over-test ahead of the product.** Exploratory UI is not locked down with tests before
   its shape settles; the risky core is tested early, UI gets targeted tests after converge.
5. **Test behavior and invariants, not implementation.** A test should survive a refactor that
   preserves behavior — assert outcomes and state, not call counts.
6. **The suite is curated, not append-only.** Delete tests that stop earning their keep. Padding
   is a defect murr flags for deletion (his anti-padding tripwire), not neutral clutter.

> Origin of 1, 4, and 6: a prior project accumulated ~300 trivial tests before any UI existed —
> slow suite, false confidence — and was abandoned. This document designs against that directly.

## 2. Shape — the testing trophy

A wide base of fast tests, a thin cap of slow ones. **Integration is the center of gravity**: for
a CRUD-plus-rules app it buys the most confidence per unit of effort, and it's the only layer that
proves the things that actually burn you (scoping, SQL, transactions, constraints).

| Layer | Covers | Tooling ({{swap per stack}}) | Volume |
|---|---|---|---|
| **Static** | types, lint, runtime input validation | {{TypeScript strict · ESLint · schema validators (the validators double as the living contract)}} | always on |
| **Unit** | pure logic: derivations, normalization, reducers/selectors | {{Vitest / Jest}} | many, fast |
| **Integration** ⭐ | the API at the HTTP boundary against a **real database** | {{supertest + the app + Testcontainers + real migrations}} — the kit's harness | the heart |
| **Component** | screens/forms behave (not pixels) | {{RN Testing Library / Testing Library}} | targeted, post-converge |
| **E2E** | critical journeys on the real target | {{Maestro / Playwright}} — flows named for the `AC-*` they demonstrate | thin (§5) |

**Why real-DB integration is central:** ownership-scoping, query correctness, transactions, and
unique-constraint races only prove out against a real database. A mocked repository *hides*
exactly the bug class the shortlist exists for.

## 3. The risk shortlist (machine-read by the health check)

These domains get **test-first, thorough** treatment; every ID below must appear in at least one
tagged `describe()` (§6.1). The health check greps the suite for each ID and reports the gaps —
a per-ID presence line, never a global %.

| ID(s) | Domain | The invariant that must not break |
|---|---|---|
| SYS-01, SYS-07 | Authorization | actor B can never read/write actor A's resource — asserted per route as actor-B → 4xx *(multi-user)* |
| SYS-02 | Boundary validation | invalid input dies at the boundary as the contract's typed 4xx, never a 500 |
| AUTH-{{xx}} | Auth/session | {{token rotation, expiry, reuse detection — if accounts exist}} |
| {{PREFIX}}-{{nn}} | {{money/ledger}} | {{the ledger reconciles; grants idempotent; concurrent spend → one winner}} |
| {{PREFIX}}-{{nn}} | {{irreversible data}} | {{deletes ripple correctly; nothing orphans}} |

## 4. TDD posture

- **Test-first for §3** — write the failing test from the spec ID, then implement. The
  `failure-first` skill's enumeration IS the test list for these domains.
- **Test-after, targeted, for UI** — once a screen's behavior settles (post-converge), not before.

## 5. End-to-end (kept thin)

A small set of high-value journeys only — slow, flaky E2E is a liability. Source them from the
acceptance walkthrough: **each flow is named for the `AC-*` IDs it demonstrates**, so the E2E
suite is the automated half of the owner gates, not a parallel invention. {{List the 3–5
journeys.}} Automation's blind spots (taste, device feel, real-money UX) stay in the guided
walkthrough — never faked in E2E.

## 6. The mechanisms (the toolkit's `testing-kit/` — installed at P1)

Discipline that depends on remembering decays; these make it structural:

1. **ID-tagged describes.** Every §3-domain test names its ID:
   `describe('SYS-07: actor B cannot touch actor A', …)`. Grep an ID → spec + tests + code all
   return; the health check counts these against §3.
2. **The un-forgettable authz test** (`defineRoute.ts`). Routes register through one construct
   carrying `{ mutates, crossPrincipal, authzTest, specIds }` — and it **throws at construction**
   if a mutating or cross-principal route lacks its named authz test. You cannot boot the app
   with an unguarded route. The companion inventory test diffs the registry against the suite.
   Coverage *counts* only when a test hits the real route as actor-B and asserts a 4xx — a
   name-match satisfied by a 200 is padding (murr's tripwire).
3. **The concurrency-race harness** (`concurrency.ts`). Fire N identical requests in parallel;
   assert exactly one winner and friendly (4xx, never 500) losers. Standing usage: every
   uniqueness constraint, every spend/claim, every "can only happen once."
4. **The real-DB harness** (`pg-harness.ts`). Throwaway containerized Postgres per suite: start →
   migrate (the real migrations) → per-test reset → stop.
5. **The destructive-guard** (`destructive-guard.ts`). Every destructive runner (reset, truncate,
   seed, migrate-fresh) first asserts the target DB is **positively marked disposable** —
   an allowlist sentinel, fail-closed, so a leaked production URL cannot be truncated from a test
   or an agent session.

## 7. The suite in CI

Per PR: {{typecheck → lint → unit → integration (real DB) → secret-scan → dependency-scan}} —
the merge-gate spine (`../CONVENTIONS.md`). E2E {{nightly / pre-gate}}. A flaky test is quarantined
same-day and fixed or deleted within the phase — a suite people re-run until green teaches people
to ignore red.

---

## Changelog

- **0.1** ({{DATE}}) — initial scaffold from the starter kit.
