# 00 — Documentation Index & Working Agreement

> This is the **map**. It defines what each document owns, which document wins when they disagree,
> how changes flow between them, and how a handful of living documents stay in sync for the life of
> the project. Read this before editing anything else. Where this file and any other doc disagree
> about *process*, this file wins.

**Maintainer:** {{OWNER_NAME}} (product) + the build agent (spec/engineering)

---

## 1. The documents and who owns the truth (the register)

Each concern has **exactly one document that owns the truth**. Other documents *reference* that
truth by stable ID — they never restate it. The **Version** column below is the canonical current
version of each doc; the health check (`scripts/health-check.mjs`) fails red if a doc's own
`Version:` header and this register ever disagree.

| Document | Owns the truth for | Version |
|---|---|---|
| `00-INDEX.md` (this file) | Process, the ID scheme, the change protocol | — |
| `product-spec.md` | Behavior, data model, rules — *what the app does* | **v0.1** |
| `api-contract.md` | Endpoint + payload shapes — the frontend↔backend seam *(delete this row for a backend-less app)* | **v0.1** |
| `testing-strategy.md` | How we test — the trophy, the risk shortlist, the kit's mechanisms | **v0.1** |
| `ui-requirements.md` | What each surface must let users *do*, + its **acceptance criteria** and design status | **v0.1** |
| `design-system.md` | The aesthetic profile, foundation rules, tokens, and component names | **v0.1** |
| `../CONVENTIONS.md` | How code is written — the rulebook every change is held to | — (active) |
| `roadmap.md` | Build order: phases, each with entry criteria + Definition of Done | **v0.1** |
| `decisions.md` | **Why** we chose what we chose (append-only, dated) | — |
| `open-questions.md` | The **inbox** of unresolved questions — the only free-append file | — |
| `HEALTH.md` | *(generated — never hand-edit; run the health check to refresh)* | — |

Two process references live outside the graph: `../CLAUDE.md` (the agent working agreement) and
`../lifecycle-playbook.md` (the Day-One→live spine — which stage you're in and what its gate is).

### The pipeline

```
product-spec ──derives──▶ ui-requirements ──▶ mockups (HTML) ──▶ converged states boards
     ▲                                                                  │
     └───────── behavior changes loop back up (see §4) ◀────────────────┘
     │
api-contract (the FE↔BE seam — referenced by ui-requirements and the build)
     │
     └────────▶ roadmap ──▶ code (governed by CONVENTIONS.md)
```

---

## 2. Truth precedence (who wins a conflict)

1. **Behavior / data / rules** → `product-spec.md` wins.
2. **Endpoint or payload shape** → `api-contract.md` wins.
3. **Layout / flow / visual / interaction** → `ui-requirements.md` + `design-system.md` win.

A document may never silently contradict its owner. If the design *needs* something the spec
doesn't allow, that is a **spec change request** handled by §4 — not a quiet edit downstream.

## 3. Stable feature IDs — the glue

Every discrete behavior gets a **stable ID** (`PREFIX-NN`) the first time it is specified. Every
other document — and every test, commit, and decision — references the behavior by that ID instead
of re-describing it. To trace the ripple of any change, grep the ID across the repo.

Define the prefixes for **your** app's domains at scaffold time (edit this table; two cross-cutting
prefixes are standard):

| Prefix | Domain |
|---|---|
| `SYS-` | Cross-cutting / system (security, config, platform) |
| `AUTH-` | Authentication & account identity *(if the app has accounts)* |
| `{{PREFIX_1}}-` | {{DOMAIN_1}} |
| `{{PREFIX_2}}-` | {{DOMAIN_2}} |
| `{{PREFIX_3}}-` | {{DOMAIN_3}} |

IDs are **append-only**: never renumber. A retired behavior is marked `(removed)` with a changelog
note, keeping the number burned so old references stay unambiguous.

**A second namespace rides on the first: acceptance criteria** — `AC-<SCOPE>-n`, where SCOPE is a
surface slug (`ui-requirements.md` §3), a phase (`AC-P2-n`, `roadmap.md` §3), or `GLOBAL` (the
inherited set, `ui-requirements.md` §1). Same laws: append-only, greppable (an AC ID connects the
criterion, the walkthrough step, and any E2E flow that demonstrates it), and every AC cites the
behavior ID it verifies. Authored by the `ac-author` skill.

## 4. The change protocol (capture → formalize → resolve)

**Step 0 — Triage. Behavior or presentation?**
- *Presentation* (a layout/flow/visual choice) → lives in `ui-requirements.md` / `design-system.md`.
- *Behavior / data / rules* → touches `product-spec.md` (and `api-contract.md` if shapes change).

**Step 1 — Capture (don't break flow).** Append a one-liner to `open-questions.md`. It is the only
file anyone may freely append to, at any time. Nothing is lost; flow isn't interrupted.

**Step 2 — Formalize (a batched pass by the spec owner).** The spec owner:
1. Assigns a stable ID.
2. Edits the **owning document first**, then downstream docs that reference it.
3. Bumps the doc version + adds a **changelog** line: *what changed, why, impacted IDs*.
4. Updates that doc's **Version cell in the §1 register** so the register never lags.

**Step 3 — Resolve.** Move the item out of `open-questions.md` into an entry in `decisions.md`,
linked to its ID. A recorded decision is never re-litigated without a new entry.

**Step 4 — Re-sync.** Whoever is downstream pulls the updated docs and continues.

> **The one rule that prevents drift:** *anyone captures and the owner decides, but the spec has
> exactly one editor.* Never hand-patch behavior into a downstream doc mid-task. Batch related
> items so the spec owner integrates them coherently in one pass, not piecemeal.

## 5. Versioning & git conventions

- Each versioned doc carries a `**Version:**` header line and a **Changelog** section at its end.
- Bumps: `0.x` while drafting; `1.0` when the doc is considered build-ready.
- **Every commit message names the IDs touched**, e.g. `spec: add CORE-12 (draft autosave); ripple api-contract`.
- Run `node scripts/health-check.mjs` after touching any doc in the §1 register; clear red before
  declaring doc work done. The dashboard it writes (`docs/HEALTH.md`) is generated — never hand-edit it.
