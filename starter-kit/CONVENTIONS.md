# CONVENTIONS.md — the rules every change is held to

> The rulebook for the {{APP_NAME}} build. **Every PR is reviewed against this.** Behavior lives in
> the specs (`docs/`); this governs *how code is written*, not what the app does. Ratify it with
> the owner as a `decisions.md` **[LOCK]** entry before the first feature phase, then hold every
> change to it. Rules marked **[LINT]** should become mechanical CI checks as soon as the tooling
> phase can carry them — a stated rule with no teeth decays.
>
> *Scaffold note: delete the rules that don't apply (no backend → drop 2–4; no money → drop the
> economy change-class) rather than leaving them as dead weight.*

## The non-negotiables

1. **Layered architecture.** {{e.g. `routes → controllers → services → repositories`}} — no layer
   reaches past its neighbor. **[LINT]** {{e.g. a raw DB query outside the repository layer fails CI}}.

2. **Every read/write of user-owned data is ownership-scoped** (SYS-01) through one scoped-query
   helper — the actor's id is non-optional; an unlisted table is treated as user-owned and fails
   closed. *(Multi-user backend only.)* **[LINT]**

3. **Every input is validated at the trust boundary** (SYS-02) with schemas shared between client
   and server where the stack allows — the shared schema **is** the `api-contract` payload,
   transcribed field-for-field, never a paraphrase. Every user-supplied string is length-bounded.
   The server-side parse is the security boundary; client-side validation is UX, never enforcement.

4. **Every mutating or cross-principal endpoint has a standing cross-user authorization test**
   (actor B hits actor A's resource → expects 4xx / the limited shape). Structural, not
   remembered: routes register through the kit's `defineRoute` construct, which **throws at
   construction** if such a route lacks its named authz test (`docs/testing-strategy.md` §6).
   Coverage counts only when the test hits the real route as actor B and asserts the 4xx — a
   name-match satisfied by a 200 is padding (murr's tripwire). *(Multi-user backend only.)*

5. **Every risk-domain test is spec-ID-tagged.** Grep a stable ID → spec + test + code all return.

6. **Behavior is never invented in code.** A needed rule/shape that isn't specced → file it to
   `docs/open-questions.md`. A trivial, reversible gap may be `// ASSUMPTION(OQ-xxx)`-tagged, filed,
   and proceeded on — but **auth/authorization, money, and destructive-migration behavior are
   STOP-and-file, never assumed.**

7. **No new dependency (runtime *or* dev) without written justification** in the PR: why it's
   needed, why no stdlib/existing path suffices, provenance. New manifest entries surface at each
   phase exit for a 30-second owner yes.

8. **Tokens, not literals, in UI code.** Every color/size/spacing reads from the theme module
   (`docs/design-system.md` §3); the foundation rules are enforced in review, not vibes.

## Discipline

- **Test-first for the risk domains** (the `docs/testing-strategy.md` §3 shortlist); targeted
  test-after for UI once screens settle. No coverage-chasing, no trivial tests; a slow suite is a
  bug; padding is deleted, not tolerated. The strategy doc owns the details; its §6 mechanisms
  (race harness · real-DB harness · destructive guard) are the toolkit's `testing-kit/`.
- **Error model:** one error hierarchy → one middleware/handler → the `api-contract` error codes.
- **Migrations:** generated + committed + reviewed in the PR; expand-contract for column changes;
  tested against a real database, not mocked.
- **Verify before claiming done** — run the checks, read the result; never report green you didn't see.
- **See your own UI before reporting a screen done** — render it, compare against its
  `*-states.html` board + the surface AC, fix the obvious gaps first. Building UI blind is the main
  cause of weak first passes.

## Definition of Done (every task)

Spec-ID referenced · tests for any risk-domain behavior · cross-user authz test if the endpoint
mutates · validated input · `api-contract` updated in the same PR if the seam changed · CI green ·
**the touched surface's `AC-*` self-verified (parvati) before the work surfaces — an AC you can't
yet meet is declared, never silently skipped** · no new dependency without written justification ·
receipt left for the owner (CLAUDE.md).

## The merge gate (the spine)

`{{main}}` is branch-protected: no direct pushes, **required green CI + review** on every change —
docs and code alike, nobody bypasses it. CI per PR: {{typecheck → lint → unit → integration →
secret-scan → dependency-scan}}.

## Changes that need OWNER approval (everything else = agent review + green CI)

1. **Destructive / irreversible migrations** (drop/rewrite data).
2. **Auth / authorization** changes.
3. **Money** — payments, ledger, entitlements, pricing. *(Delete if N/A.)*
4. {{Add your own — the classes where agent review is blind.}}
