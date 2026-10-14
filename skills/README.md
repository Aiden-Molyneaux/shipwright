# Skills — the guardrail reviewers + the idea gate

The toolkit's skill family. Each is **project-scoped**: it reads the project's own doc graph
(`docs/design-system.md`, `docs/roadmap.md`, `docs/ui-requirements.md`, `docs/api-contract.md`,
`CONVENTIONS.md`) and cites *those* rules — nothing app-specific is hardcoded. Install by copying
each skill's directory into the project repo's `.claude/skills/`.

## The lanes — four reviewers, four artifacts, zero overlap

| Skill | Looks at | Judges | Never touches |
|---|---|---|---|
| **britch** | the **idea** (before the repo exists) | should this be built at all — Kill / Sharpen / Proceed | design, features, implementation, anything after "proceed" |
| **burt** | the **design files** (`docs/design/mockups/**`) | design-system rule conformance (foundation rules, tokens, type, component names) | the running app, behavior/data, design *direction* |
| **parvati** | the **running app** (screenshots) | parity vs the mockup + the phase DoD + the surface AC + the data contract | mockup files, code correctness, pixel-fidelity crusades |
| **murr** | the **code** (a diff or module) | runtime correctness + robustness first, refactorability second | visuals, taste, spec authoring, style nits a linter owns |

Shared law: **reviewers report, they never edit.** Each self-checks adversarially (default "not a
problem" unless confirmed), cites `file:line` evidence, and uses a fixed report format so the
working agent can act without re-reading the authority docs. If a reviewer is asked to *fix* its
own findings, it applies them and **re-runs itself** to a clean verdict before handing back.

## The AC spine — the author and the guide

Two more skills make the quality bar itself first-class. These are not reviewers: `ac-author`
**edits the doc graph** (under the change protocol), and `acceptance-walkthrough` **demonstrates
and records** (but never rules, fixes, or waives).

| Skill | Does | Feeds |
|---|---|---|
| **ac-author** | writes crisp, binary acceptance criteria with stable `AC-<SCOPE>-n` IDs — per surface (`ui-requirements.md` §3, **two passes: behavioral before design, presentation-borne at converge**), per phase (`roadmap.md` §3), inherited (`AC-GLOBAL-*`, §1) | the bar the design drafts are picked against, parvati verifies, the walkthrough demonstrates |
| **acceptance-walkthrough** | turns a gate's AC into a guided owner sitting ("do X → expect Y — that's AC-n") and/or automated E2E flows named for the AC they demonstrate; records PASS/FAIL per criterion | every owner gate; failures route back to the build lanes as flags |

The two standing behaviors they encode (also written into the playbook + CONVENTIONS DoD):
**(1)** nothing surfaces to the owner until its AC are self-verified (burt/parvati/murr enforce
per layer); **(2)** at every owner gate, the agent offers the walkthrough unprompted.

## The QA loop — doctor-nick

Neither a reviewer nor a cognitive skill: **doctor-nick** is the *process* skill for the QA lane.
Reviewers judge the work; doctor-nick keeps the *workflow to reach the work* cheap — the lessons
ladder (capture in `docs/qa-runbook.md` → **twice = automate** into the dev supervisor's
read-only `doctor` verb → stable invariants become CLAUDE.md law) plus three enforcement rules
(preflight `up`+`doctor` · doctor-then-runbook-then-investigate when workflow-blocked · a retro
line in every QA receipt). Parvati's screenshot-capture preflight points here; the supervisor
contract (`up`/`status`/`doctor`) lives in the starter-kit CLAUDE.md QA-loop section.

## The cognitive class — think-smarter skills

The third class: skills that **upgrade the thinking while the work happens**. Where reviewers
gate and report *after*, a cognitive skill loads *during* and shapes the output — no reports, no
gates, no added process. Template: [`_TEMPLATE/COGNITIVE-SKILL.md`](_TEMPLATE/COGNITIVE-SKILL.md).

Class laws:
- **Trigger on the artifact, not the topic.** A cognitive skill loads when the next output IS an
  instance of its artifact (a screen design, a mutation, a spec conversation) — never because a
  keyword appeared. Each description carries an explicit **quiet-list** naming the adjacent
  activities it must NOT load for (reviewing → the reviewer's lane; debugging → the debugging
  discipline; discussing → nothing). This is the misfire stopper.
- **The project's docs outrank the skill.** Generic craft yields to the aesthetic profile, the
  CONVENTIONS, the contract — a cognitive skill supplies the *craft*, the project supplies the
  *taste and law*. So cognitive skills never fight the reviewers.
- **Each has a reviewer partner** where one exists, and the pairing is the quality mechanism:
  the cognitive skill shapes upstream what the reviewer audits downstream — *if the reviewer
  would flag it, the cognitive skill should have prevented it.*
- **Inline, silent, declared.** Better work, not checklist narration; real trade-offs named in
  the receipt; knowingly-below-bar work declared, never silent.

| Member | Artifact it shapes | Reviewer partner |
|---|---|---|
| **ui-craft** | anything a user sees or touches — mockups, surfaces, components, states, interaction patterns; holds work to app-agnostic UX quality **and** the project's aesthetic profile at once | burt (files) / parvati (build) |
| **spec-elicitation** | the product-spec conversation — five moves (surface storm · surface walks · persona journeys · big-ideas interludes · consolidation) + question banks + a coverage ledger | — (its output meets britch's verdict upstream and ac-author downstream) |
| **failure-first** | any operation that can fail or race — enumerate failure modes before the happy path; idempotency, state machines, typed refusals, the user's side of every failure | murr |

**Next members to stamp** (from the same template, when a project's pilot shows the need):
data-modeling (entities/ownership/migration-friendliness before the first table) ·
api-contract-design (shapes, error registries, pagination, versioning) · accessibility-deep
(beyond ui-craft's floor: audits, assistive-tech flows) · performance (budgets, N+1s, bundle/
render cost — with murr gaining the matching lens).

**Naming convention across classes:** person names for skills you *summon like colleagues*
(reviewers + gates: burt, parvati, murr, britch); craft names for ambient cognitive skills
(ui-craft, failure-first) — they load on task-type, so nobody needs to remember a name to get
them.

Where they sit in the lifecycle (`starter-kit/lifecycle-playbook.md`): **britch** gates Stage 0
(scaffold entry) · **ac-author** runs at authoring time (a surface's behavioral AC land with its
brief, before design; the presentation-borne remainder at converge; a phase's at its drafting) ·
**burt** guards Stage 2 (every mockup before an owner
gate) · **parvati** + **murr** guard Stage 4 (every screen and every diff before phase exit) ·
**acceptance-walkthrough** runs every owner gate from Stage 4 on — all staying on duty through
Stage 6.

## The facilitator — sigmund

A fourth class with one member. **sigmund** is not a reviewer and not a cognitive skill: he is the
lifecycle for one change, loaded into the main session, and he holds the model routing and the
overrides that used to sit in a project's CLAUDE.md. Stages 1 to 3 (spec, design, plan) keep the
playbook's routing; Sigmund covers code changes from Stage 4 on.

| Skill | Does | Dispatches |
|---|---|---|
| **sigmund** | one change end to end: clarify → branch → plan → build → verify → review → ship to integration → present → merge on go-ahead; names where the superpowers skills fit inside those phases | **sev** (build), **moh** (lookup), **murr** (code), **parvati** (screen) from [`agents/`](../agents/README.md) |

Projects adopt him by copying `sigmund/SKILL.md` and filling its `[edit]` sections (the edit
points are listed in `docs/roster-build-plan.md`), then adding one line to their CLAUDE.md:
*"Change work runs through Sigmund (`.claude/skills/sigmund/`). Routing, overrides and the ship
gates live there."* The spec is [`docs/roster-spec.md`](../docs/roster-spec.md).

## Installing into a project

```
<your-repo>/.claude/skills/
  burt/SKILL.md
  parvati/SKILL.md
  murr/SKILL.md
  ac-author/SKILL.md
  acceptance-walkthrough/SKILL.md
  ui-craft/SKILL.md
  spec-elicitation/SKILL.md   (+ references/)
  failure-first/SKILL.md
  sigmund/SKILL.md            (+ agents/ → .claude/agents/, see agents/README.md)
```

`britch` runs *before* a repo exists, so it belongs in your **user** scope
(`~/.claude/skills/britch/`) rather than per-project.

**Tailor on copy — re-anchor the doc paths.** Every SKILL.md cites authority docs by starter-kit
path (`docs/product-spec.md`, `docs/roadmap.md`, `docs/testing-strategy.md`, …). The target
project's `docs/00-INDEX.md` owns the real locations — if it relocates or renames them (InGame
keeps specs under `docs/spec/`, its roadmap is `road-to-market.md`), update the copied skill's
paths and any project-convention terms (phase → milestone, etc.). A skill with dead authority
paths fails silently: the reviewer skips the doc instead of erroring. This is how murr first
shipped into InGame with paths pointing at nothing (caught 2026-08-01).

**Harness note:** skills are a Claude Code mechanism. Harnesses that don't support them (OpenCode,
Codex, etc. — they read `AGENTS.md` instead) get the manual fallback: each SKILL.md's method is a
self-contained checklist an agent can be pointed at directly ("read `.claude/skills/murr/SKILL.md`
and execute it against this diff"), and the starter kit's `AGENTS.md` lists the one-line manual
equivalent of each lane.

## Writing a new skill (the house rules)

Two templates: [`_TEMPLATE/SKILL.md`](_TEMPLATE/SKILL.md) for reviewers/gates,
[`_TEMPLATE/COGNITIVE-SKILL.md`](_TEMPLATE/COGNITIVE-SKILL.md) for cognitive members. The rules
that make the reviewer class work:

1. **Lane first.** Name the *artifact* it reviews (a file type, the running app, a diff, an idea).
   If an existing reviewer already owns that artifact, extend it — don't create an overlap. Add the
   new lane to the table above the same day.
2. **Trigger-dense description with a negative scope.** The YAML `description` names the literal
   phrases that should invoke it *and* what it must NOT be used for (usually: the neighboring
   lane). A cognitive skill triggers on a **task-type**, not a command name, and needs a crisp
   boundary so it stays quiet when irrelevant.
3. **Authority before method.** "Read these, in this order" — the project docs whose rules the
   skill cites. A reviewer that judges from taste instead of a citable rule is broken; if a finding
   maps to no rule, it's an "owner-call" note, never a violation.
4. **Method starts at step 0** (identify the target/scope) and ends at the report. Mechanical
   pre-flight passes (greps) produce *candidates*, never findings — every candidate is confirmed by
   reading the cited line.
5. **Adversarial self-check.** Before reporting, try to kill each finding; default to "not a
   problem" unless confirmed. A reviewer that cries wolf trains the owner to ignore it.
6. **Fixed report format** ("Report format — ALWAYS use this"), findings ranked by a severity
   ladder, each with `file:line` + the offending value + the exact fix. Include a "verified clean"
   section — a verdict must show what was checked, not just what failed.
7. **End with "What X does NOT do."** The anti-scope is what keeps four reviewers from becoming
   one mushy reviewer.
