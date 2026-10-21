---
covers:
  - starter-kit/lifecycle-playbook.md
  - skills/sigmund/SKILL.md
  - skills/README.md
---

# The Shipwright lifecycle

Shipwright runs on two lifecycles, one inside the other.

- **The project lifecycle** takes an app from an idea to live, in seven stages with an owner gate
  at the end of each. Its source is `starter-kit/lifecycle-playbook.md`.
- **The change lifecycle** takes one change from request to merge, in nine phases run by Sigmund.
  It starts at Stage 4, once code exists, and repeats for every change from then on. Its source
  is `skills/sigmund/SKILL.md`.

The idea behind both is the same: write the quality bar down first, make the agent work to it,
make the agent check its own work against it before the owner sees anything, and hand the owner
a walkthrough at every gate so reviewing never means guessing.

## The project lifecycle

Stages overlap; gates do not. No gate passes out of order, and no code is written before G-3.

| Stage | Produces | Who guards it | Owner gate |
|---|---|---|---|
| **0 Scaffold** | The repo, filled from the starter kit after the profile interview | **britch** before it starts (a PROCEED is the entry); the health check's placeholder scan | **G-0**: vision, personas and principles blessed |
| **1 Specify** | A build-ready product spec with stable feature IDs; the API contract for P0 | **spec-elicitation** drives the conversation; open questions go to `open-questions.md`, never invented | **G-1**: keep, cut or defer on the full feature list |
| **2 Design** | The design system, then per surface: a brief and behavioural criteria, 2 or 3 drafts, one converged states board | **ac-author** writes the criteria before design; **ui-craft** while designing; **burt** on every mockup before a gate | **G-2**: a draft picked and each converged board blessed |
| **3 Plan and lock** | Architecture locks in `decisions.md`, ratified conventions, roadmap phases with their criteria | The lock discipline: amending a lock reopens the gate | **G-3**: the lock set and conventions signed |
| **4 Build** | Working software, phase by phase | **Sigmund** on every change, with **murr** on every diff and **parvati** on every screen; **ui-craft** and **failure-first** while working; **doctor-nick** when the environment breaks | **G-4.n**: each phase exit, run as an **acceptance-walkthrough** |
| **5 Release** | A shipped app, through the release checklist | The checklist and one full parity pass over every launch surface | **G-5**: the owner does the last manual pass and presses the button |
| **6 Live** | A healthy live app, its feedback triaged back into Stage 1 | The same gates as Stage 4; destructive-data and money changes stay owner-gated | **G-6**: a recurring review of the live-ops digest |

Two behaviours hold at every stage: work that misses its written criteria does not reach the
owner, and at every gate the agent offers the walkthrough without being asked.

When a stage keeps failing its gate, the fix is usually one stage up: a G-4 taste bounce means
Stage 2's criteria were vague; a G-2 bounce means Stage 1's spec was thin.

## The change lifecycle

From Stage 4 on, every change runs through Sigmund, even a one-line fix. Stages 1 to 3 keep the
playbook's own routing, because Sigmund's phases assume code exists. Sections marked *[edit]*
are filled per project when it adopts the template.

| Phase | What happens | Who |
|---|---|---|
| **0 Intake and clarify** | Restate the request; ask only the genuine ambiguities, batched, with a recommendation. Set the bar: one to five "do X, expect Y" criteria and how deep the owner's check goes (none, a list, a full walkthrough). | Sigmund, with the owner |
| **1 Branch** *[edit]* | Check the tree; the project's branch model (an integration branch, or a worktree per change). | Sigmund |
| **2 Plan** | Small fixes stay inline. Anything bigger gets a written plan that leaves the builder no design choice. | Sigmund |
| **3 Build** | Inline for small fixes; otherwise Sev, from the plan. | Sev, or Sigmund |
| **4 Verify** *[edit]* | Sigmund reruns every check himself and reads the whole diff. Each criterion is checked or declared unreachable. | Sigmund; Doctor Nick if the environment breaks |
| **5 Review** | Murr on every diff; Parvati on every step with a visible criterion. Fix, then re-check the fix only, two rounds at most. | Murr, Parvati |
| **6 Ship to integration** *[edit]* | The project's push policy: what Sigmund pushes on his own judgment, and what he asks about first. | Sigmund |
| **7 Present and wait** | The receipt: what changed, the evidence, judgment calls, the risk statement, and the owner's walkthrough on a check surface. Then stop. | Sigmund, to the owner |
| **8 Merge on go-ahead** *[edit]* | Only on the owner's explicit go-ahead. Done once the gate is through and every criterion has passed or been waived. | Sigmund |

Across a session, Sigmund keeps a status prefix on its title (`REVIEW`, `BLOCKED`, `DONE`),
compacts at the context nudge rather than handing off, and writes a one-line **workflow note**
when the workflow itself gets in the way. Repeated notes, or a reviewer finding a defect in a
workflow file, make a **retro** due: a session of its own that proposes the fix and waits for
the owner.

## Where the roster sits

The [roster page](roster.md) lists every member with what it owns and never does. In short:

- **Before code**: britch, spec-elicitation, ac-author, ui-craft, burt.
- **Every change**: Sigmund, who dispatches Sev to build, Moh to look things up, Murr and Parvati
  to review, and loads Doctor Nick when the environment breaks; ui-craft loads when the work is UI,
  and failure-first when it can fail or race.
- **Every gate**: acceptance-walkthrough.
- **When the workflow itself needs fixing**: retro.

## Keeping a project in step

A project copies the templates once and fills its edit points. Later template changes reach it
through the template sync, run from the project's own session. See
[Template sync](../template-sync.md).
