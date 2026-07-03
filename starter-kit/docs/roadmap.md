# {{APP_NAME}} — Roadmap

> Build order from first code to launched-and-live: the phases, and — the part that matters — each
> phase's **entry criteria, Definition of Done, and acceptance criteria**. This is a planning
> artifact, not a source of truth: it references behavior by stable ID and is **non-authoritative
> where it disagrees with the specs, decisions, or CONVENTIONS**. Which *lifecycle stage* you're in
> (specify / design / build / release / live) is the playbook's job
> ([`../lifecycle-playbook.md`](../lifecycle-playbook.md)); this file sequences the **build** stage.

**Version:** 0.1 · **Last updated:** {{DATE}} · **Owner:** {{OWNER_NAME}}

---

## 1. The map (hold this in your head)

```
P1 Tooling gate ──▶ P2 Foundation + first vertical slice ──▶ P3..Pn feature phases ──▶ Release ──▶ Live
     (CI + harness       (★ the early tangible win —              (each: usable increment,
      before features)    something real on a device/screen)       owner gate where agents are blind)
Spine: every change rides the merge gate (green CI + review). Owner sign-off classes: see CONVENTIONS.
```

Rules of thumb baked into this shape:
- **P1 is always tooling** — harness, CI, lint, scaffold — before any feature code.
- **P2 always ends in a vertical slice** rendered in the app's real aesthetic, not a login form.
  The danger zone is a long plumbing stretch with nothing visible; no phase runs dark for weeks.
- **Release in stages, not all at once** — something installable/deployed early, a beta at the
  emotional-payoff phase, public when complete.
- **Owner gates sit exactly where agent review is blind**: taste, real money, auth under load,
  irreversible data. Everything else is agent review + green CI.

## 2. The phases

Fill the table, then give each phase a DoD block below. Keep phases coarse (4–8 total); each ends
in something a user could touch.

| ID | Goal | Entry | Exit / DoD (summary) | Owner gate? | IDs delivered |
|---|---|---|---|---|---|
| **P1** | Tooling gate | architecture decided (`decisions.md`) | scaffold + CI green on a hello-world slice; local↔CI parity; the testing-kit mechanisms installed (`testing-strategy.md` §6) + the destructive guard **seen firing once** | small (one-time loop check + the guard demo) | SYS-03/04 |
| **P2** | Foundation + first vertical slice | P1 green | {{auth/data layer}}; one end-to-end slice styled per the design system, running on {{device/target}} | **YES** {{(auth/authz)}} | {{...}} |
| **P3** | {{first core feature phase}} | P2 | {{...}} | {{...}} | {{PREFIX_1}}-* |
| **P{{n}}** | Release readiness | all feature phases green | the Release-stage checklist (playbook, Arc C) | **YES** (ship) | — |

## 3. Per-phase Definition of Done + acceptance criteria

The DoD is the quality bar the phase-exit review (parvati + the owner's walkthrough) verifies
against. Phase-level criteria carry **`AC-P<N>-n`** IDs (append-only, authored by `ac-author`);
point at the per-surface `AC-<SLUG>-*` in `ui-requirements.md` §3 — don't restate them. At the
phase's owner gate, the agent offers an **acceptance walkthrough** over exactly these IDs.

### P2 — Foundation + first vertical slice
**Done means:**
- [ ] **AC-P2-1** — every task met the per-task DoD in `../CONVENTIONS.md` (CI green, tests on risk domains, IDs cited).
- [ ] **AC-P2-2** — surfaces in scope ({{list}}): each passes its `ui-requirements.md` §3 `AC-<SLUG>-*`.
- [ ] **AC-P2-3** — the slice runs on {{the real target — device / browser / deploy env}}, in the real aesthetic.
- [ ] **AC-P2-4** — owner gate passed via the walkthrough: {{what the owner personally verifies}}.

### P3 — {{...}}
…

## 4. Owner-gate register

Every gate in one place, so nothing rides an unwatched merge. (The three standing owner-approval
change-classes live in `../CONVENTIONS.md` and apply in every phase.)

| Gate | Where | The owner personally verifies |
|---|---|---|
| G-1 | P2 exit | {{e.g. auth seam + smoke test on a real device}} |
| G-2 | {{phase}} | {{e.g. the aesthetic — the product's soul; agents are blind to taste}} |
| G-3 | Release | the Arc-C checklist (playbook §Release) |

---

## Changelog

- **0.1** ({{DATE}}) — initial scaffold from the starter kit.
