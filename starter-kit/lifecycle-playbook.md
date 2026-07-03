# Lifecycle Playbook — Day One → launched → live

> The spine of the whole project: which stage you're in, what that stage produces, which guardrail
> verifies the work before the owner sees it, and what gate ends the stage. `CLAUDE.md` points its
> "Current stage" line here; update that line when a gate passes. This file is a static reference —
> project-specific state lives in the docs it names, never here.
>
> **The philosophy every stage serves:** define the quality bar explicitly (acceptance criteria,
> authored by `ac-author` as greppable `AC-*` IDs) → make the agent think to that bar by default
> (cognitive skills) → force the agent to self-verify against the bar (the reviewer trio)
> **before** the owner ever sees the work → at each gate, hand the owner an **acceptance
> walkthrough** ("do X → expect Y — that's AC-n") so reviewing never means guessing. The owner
> reviews *direction* at a few well-chosen gates; the pipeline carries everything else.
>
> **Two standing behaviors, every stage:** (1) work that misses its written AC does not surface —
> the agent verifies first and declares any AC it can't yet meet; (2) at every owner gate, the
> agent offers the `acceptance-walkthrough` unprompted (guided sitting and/or automated E2E).

**The reviewer trio** (the toolkit's `skills/` package, installed at scaffold; each *reports,
never edits*):
- **`burt`** — audits mockup *files* against the design-system foundation rules.
- **`parvati`** — reviews the *running app* (screenshots) against its mockup, the phase DoD, the
  surface AC, and the data contract; triages every gap into *🚩 owed now / ✅ deferred / 🎨 polish*.
- **`murr`** — adversarial code review of the diff, runtime-bugs-first, held to `CONVENTIONS.md`;
  never rubber-stamps (a verdict must enumerate what it probed).

Plus the gate before all of them: **`britch`**, the adversarial idea validator (Kill / Sharpen /
Proceed) that Stage 0's entry criterion requires. *(No skill harness? `AGENTS.md` lists the manual
equivalent for each.)*

---

## Stage 0 — Scaffold (Day One)

| | |
|---|---|
| **Entry** | A validated idea worth building — you know what it is, it survived the **`britch`** gate with a PROCEED, and you know your end goal (the "Before you scaffold" checklist in `README.md`). |
| **Produces** | This repo, filled in: the profile interview answered, every `{{…}}` placeholder resolved or deleted, N/A files removed (see `README.md` for the procedure). |
| **Guardrail** | `node scripts/health-check.mjs` — its placeholder scan stays red until the scaffold is complete. |
| **Owner gate** | **G-0:** the owner reads the filled `product-spec.md` §1–3 (vision, personas, principles) and blesses them. Everything downstream leans on these. |
| **DoD** | Health check green (no placeholders, register in sync); vision/personas/principles owner-blessed; git initialized with the first commit. |
| **Dashboard** | `docs/HEALTH.md` — the scaffold-complete light. |

## Stage 1 — Specify

| | |
|---|---|
| **Entry** | G-0 passed. |
| **Produces** | `product-spec.md` to a build-ready draft: every feature a stable-ID row with priority; the data model; out-of-scope parked. `api-contract.md` drafted for the P0 set. The ID prefixes registered in `00-INDEX.md` §3. |
| **Guardrail** | The **`spec-elicitation`** harness drives the conversation (the five moves, the question banks, the coverage ledger — coverage by map, not fatigue). The change protocol (00-INDEX §4): everything uncertain flows through `open-questions.md` → `decisions.md`, never invented in place. Health check after every doc pass. |
| **Owner gate** | **G-1 (scope):** the owner rules keep/cut/defer on the full feature list *before* design effort is spent. Recorded as a `decisions.md` entry. |
| **DoD** | Every P0 behavior has an ID; open questions triaged (none blocking P0); health green. |
| **Dashboard** | `HEALTH.md` (docs-in-sync, decision traceability) + the spec changelog. |

## Stage 2 — Design

| | |
|---|---|
| **Entry** | G-1 ruled. |
| **Produces** | `design-system.md` filled for real (aesthetic profile → foundation rules → tokens → component map). Per surface, in this order: the `ui-requirements.md` §3 brief + **pass-1 behavioral AC** (`ac-author` — the bar the drafts must satisfy) → 2–3 distinct drafts, judged against those AC at the owner's pick → one converged `<surface>-states.html` → **pass-2 AC** appended at converge (the few criteria the settled design added), set frozen as the build contract. The §2 dashboard current. |
| **Guardrail** | **`ui-craft`** loads while designing (senior-designer defaults + the aesthetic profile, upstream); **`burt`** audits every built/edited mockup downstream, always before an owner gate — the recurring misses are the small ones. Behavior questions raised while designing → `open-questions.md`, never drawn in. |
| **Owner gate** | **G-2 (direction, per surface):** the owner picks between drafts and blesses each converged board. The owner judges *taste and direction* — conformance was already audited. |
| **DoD** | Every launch surface ✅ converged in `ui-requirements.md` §2 with AC/spec/contract columns current (the health check flags the debt); foundation rules stable. |
| **Dashboard** | `ui-requirements.md` §2 + `HEALTH.md` (formalization-debt list). |

## Stage 3 — Plan & lock

| | |
|---|---|
| **Entry** | Enough of Stage 2 converged to see the build shape (it may still be finishing tail surfaces — stages overlap; gates don't). |
| **Produces** | The architecture decisions that are cheap now and expensive later (repo shape, stack, data, auth model, env/secrets, migration policy), each a `decisions.md` **[LOCK]** entry; `CONVENTIONS.md` ratified; `roadmap.md` phases with entry/DoD/AC and the owner-gate register. |
| **Guardrail** | The [LOCK] discipline: locks are owner-signed, and amending one re-opens the gate. Anything auth/money/irreversible left ambiguous is a flagged owner decision, never a default. |
| **Owner gate** | **G-3 (architecture lock-in):** the owner signs the lock set + CONVENTIONS before the scaffold of real code. |
| **DoD** | Locks signed; roadmap phases each have a DoD; CONVENTIONS ratified. |
| **Dashboard** | `roadmap.md` §4 (the gate register) + `decisions.md`. |

## Stage 4 — Build (loops once per roadmap phase)

| | |
|---|---|
| **Entry** | G-3 signed. Each phase's own entry criteria: `roadmap.md` §2. |
| **Produces** | Working software, phase by phase — tooling first (P1), then a styled vertical slice (P2), then features. Every change rides the merge gate. |
| **Guardrails** | While working: the cognitive skills load on task-type (**`ui-craft`** on UI work, **`failure-first`** on anything that can fail or race). Per task: `CONVENTIONS.md` DoD + **`murr`** on every diff + verify-before-done. Per screen: see your own UI, then **`parvati`** against the states board + phase DoD + surface AC before reporting done. Per doc touch: health check. The owner-approval change-classes (CONVENTIONS) never ride an unwatched merge. |
| **Owner gates** | **G-4.n (phase exit):** the roadmap's per-phase gate — placed where agent review is blind (taste, real money, auth under load, device feel). The gate runs as an **acceptance walkthrough** over the phase's `AC-P<N>-*` + in-scope `AC-<SLUG>-*` (automated legs run before the sitting; ☆ judgment prompts staged for the owner); parvati's triaged punch-list is the brief. A FAIL blocks the gate unless the owner waives it in `decisions.md`. |
| **DoD** | The phase's `roadmap.md` §3 block, verbatim. |
| **Dashboard** | CI + `HEALTH.md` + `ui-requirements.md` §2 (surfaces flip to built-and-verified). |

## Stage 5 — Release (Arc C)

| | |
|---|---|
| **Entry** | The launch feature set is phase-exit-green. Long-lead provisioning (store accounts, signing, domains) should have started back in P1 — it's the critical path, not a Stage-5 discovery. |
| **Produces** | A shipped app. The checklist below, instantiated for this project as the final roadmap phase. |
| **Guardrail** | The release checklist itself + one full pass of the app-parity reviewer over every launch surface on the real target. |
| **Owner gate** | **G-5 (ship):** the owner personally does the last manual pass (real purchase flow if any, store listing, the irreversible submit). |
| **DoD** | Checklist complete; rollback path stated; the owner pressed the button. |
| **Dashboard** | The release checklist in `roadmap.md`'s final phase. |

**Release checklist template** (trim to fit — store app vs. web deploy):
- [ ] Distribution accounts/signing/certificates live (started in P1).
- [ ] Env separation proven: prod secrets only in prod; a staging run of the full deploy.
- [ ] Data safety: backups automated + **one restore actually drilled** before real users.
- [ ] Store/platform compliance: privacy policy + ToS, data-collection labels, age rating,
      content-moderation/report path if there's UGC. {{Delete what's N/A.}}
- [ ] Crash/error reporting + basic analytics wired and verified receiving.
- [ ] Staged rollout plan: internal → beta → public; each stage's audience + abort criteria.
- [ ] Rollback: how a bad release is pulled/reverted, written down before it's needed.

## Stage 6 — Live (Arc D — the standing loop)

| | |
|---|---|
| **Entry** | G-5 shipped. This stage doesn't end; it loops. |
| **Produces** | A healthy live app: monitoring watched, incidents logged, user feedback triaged into `open-questions.md` — which feeds Stage 1/2 for the next cycle. The doc graph keeps governing: live changes are still spec-first. |
| **Guardrail** | The same merge gate + reviewer trio as Stage 4 — being live raises the bar, it doesn't relax it. Destructive-data and money changes remain owner-gated forever. |
| **Owner gate** | **G-6 (cadence):** a recurring owner review — {{weekly at first}} — of the live-ops digest below. |
| **DoD** | (per cycle) digest reviewed; incidents have entries; the inbox is triaged, not silting. |
| **Dashboard** | `HEALTH.md` + the live-ops digest. |

**Live-ops digest template** (an agent fills this each cadence; keep it one screen):
- **Health:** crash-free rate · error-tracker top 3 · uptime {{· store rating}}.
- **Usage:** {{the 2–3 numbers that matter to this app's north star}}.
- **Incidents since last review:** what broke · user impact · fix · the `decisions.md`/OQ ref.
- **Feedback triage:** new user-reported items → OQ numbers assigned.
- **Recommendation:** the one thing to do next cycle.

---

## Using the playbook

- **Stages overlap; gates don't.** Design can start while the spec tail is finishing — but no gate
  passes out of order, and no code phase starts before G-3.
- **When lost, re-ground:** read the Current-stage line in `CLAUDE.md`, this stage's row, and the
  stage's dashboard surface. That's always enough to know what to do next.
- **When a stage keeps failing its gate**, the fix is usually upstream: a G-4 taste bounce means
  Stage 2's AC were too vague; a G-2 bounce means Stage 1's spec was thin. Fix the doc, not just
  the artifact.
