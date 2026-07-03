# {{APP_NAME}} — UI Requirements & Surface Status

> For each surface: *what the user must be able to do* (referenced to stable IDs in
> [`product-spec.md`](product-spec.md)), the design direction, and — **inline, per surface — the
> acceptance criteria** the built screen is verified against. This file is also the live **surface
> dashboard** (§2): design state, the converged mockup each build composes from, and whether the
> AC and contract are current. The health check reads §2 and flags converged surfaces still owing
> AC/spec/contract sync.

**Version:** 0.1 · **Last updated:** {{DATE}} · **Owner:** the spec owner (one editor); anyone may
propose via `open-questions.md`

---

## 1. Global direction & always-on patterns

- **Art direction in one line:** {{bold where delight lives; conventional where wayfinding lives —
  name which surfaces get which}}. The full aesthetic profile lives in
  [`design-system.md`](design-system.md) §1.
- **Navigation model:** {{tabs / drawer / stack — locked early, referenced everywhere}}.
- **Always-on acceptance criteria (`AC-GLOBAL-*` — every surface inherits these; never restate
  them per surface):**
  - [ ] **AC-GLOBAL-1** — every state in the **lifecycle grammar** is designed and built: loading ·
    empty (inviting, never dead) · error-with-retry · offline {{(delete offline if N/A)}}.
  - [ ] **AC-GLOBAL-2** — destructive actions always confirm.
  - [ ] **AC-GLOBAL-3** — accessibility floor: {{dynamic type / contrast / touch-target minimums}}.
  - [ ] **AC-GLOBAL-4** — conforms to the design-system foundation rules (audited, not eyeballed).

## 2. Surface status (the dashboard — update after every design/build pass)

**State:** ⬜ not started · 🔶 in pass · ✅ converged. **AC / Spec / Contract:** ✅ current for the
converged board · 🔶 partially · ⬜ owed · — not applicable.
**Implements-from** is filled at converge and names the exact `*-states.html` board the build
composes from (see `design/mockups/README.md`).

| # | Surface | State | Implements-from | AC | Spec | Contract |
|---|---|---|---|---|---|---|
| 1 | {{SURFACE_1}} | ⬜ | — | ⬜ | ⬜ | ⬜ |
| 2 | {{SURFACE_2}} | ⬜ | — | ⬜ | ⬜ | ⬜ |

**Up next:** {{the queue — what's in pass, what the owner reads first}}

## 3. Surfaces

One block per surface, in the §2 order. The **acceptance criteria are the quality bar**: the
design drafts are judged against them at the owner's pick, the build self-verifies against them
(parvati) before anything surfaces, and the owner checks them via the acceptance walkthrough at
gates. Written by the `ac-author` skill **in two passes — behavioral criteria BEFORE design (with
this brief), presentation-borne criteria appended at converge** — then frozen as the build
contract. Each criterion is **observable and binary**, carries a stable **`AC-<SLUG>-n`** ID
(append-only — the slug is declared in the block header), and cites the spec ID it verifies.

### 3.1 {{SURFACE_1}} (`{{SLUG_1}}`)

**Purpose:** {{one line — which persona, which job}}
**User must be able to:** {{verb phrases, each citing an ID — e.g. "add an item ({{PREFIX_1}}-02)"}}
**Design direction:** {{2–4 lines of intent, not pixels}}
**Acceptance criteria:**
- [ ] **AC-{{SLUG_1}}-1** — {{do X → expect Y, e.g. "add an item from search → it appears in the list without a manual refresh"}} ({{PREFIX_1}}-02)
- [ ] **AC-{{SLUG_1}}-2** — {{an unhappy path: invalid input → the typed refusal, visibly}} ({{PREFIX_1}}-0x)
- Inherits `AC-GLOBAL-*` (§1) — not restated.

**Open items:** {{OQ-refs or —}}

### 3.2 {{SURFACE_2}} (`{{SLUG_2}}`)

…

---

## Changelog

- **0.1** ({{DATE}}) — initial scaffold from the starter kit.
