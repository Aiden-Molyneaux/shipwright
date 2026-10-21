---
shelf: roster
covers:
  - agents/**
  - skills/*/SKILL.md
  - skills/README.md
  - docs/roster-spec.md
---

# The roster

Who does what, in one table. Each row is an agent or skill Shipwright ships: what it owns, what
it never does, and who gets its output. The member pages hold the detail; this page is meant to
answer "who does X?" without opening them.

**Who updates the InProgress scribe?** The main session, and nobody else. In change work that
is Sigmund (phase 7's review ask, the done outcome, workflow notes); in planning it is Mip. Both
brief the `inprogress-scribe` agent in the background, and the scribe is the only thing that
writes the task tree. Sev, Moh, Murr and Parvati never brief it: they report to Sigmund, and
Sigmund decides what reaches the tree. The rules for when to brief come from two places: the
InProgress session briefing (every tracked session) and the tracked-session lines in the
project's filled Sigmund. See [Tracking in InProgress](#tracking-in-inprogress) below.

## The change roster

The members that carry a change from request to merge. All seven are templates a project adopts
and keeps in step through the template sync.

| Member | Runs as | Owns | Never does | Reports to |
|---|---|---|---|---|
| **Sigmund** | Skill in the main session (Opus, high) | One change end to end: clarify and set the bar, branch, plan, build, verify, review, ship to integration, present the walkthrough, merge on go-ahead. Model routing and overrides. The session-title prefix. | Merges or deploys without the owner's go-ahead. Answers pure codebase questions. Carries state across sessions. Edits a workflow file outside the change asked for. | The owner (the receipt and its walkthrough) |
| **Sev** | Subagent (Sonnet, medium) | Building exactly what Sigmund's written plan says, in the worktree his brief names, and running the checks it names. | Plans, designs or picks an approach. Commits, pushes, stashes, resets, checks out or deploys. Guesses past an ambiguity: he stops and asks. | Sigmund |
| **Moh** | Subagent (Haiku, low) | Read-only lookups across files: callers, usages, inventories, pattern sweeps, with `file:line` quotes. | Edits, suggests fixes or judges quality. | Sigmund, or whichever main session asked |
| **Murr** | Subagent wrapper plus the `murr` skill (Sonnet, high; Opus on the risk list) | Adversarial code review of every diff: runtime bugs first, then refactorability debt. | Edits. Reviews visuals. Passes a diff without naming what he probed. | Sigmund |
| **Parvati** | Subagent wrapper plus the `parvati` skill (Sonnet, medium) | A built screen against intent: every state listed first, each driven at every viewport, a FLAG / EXPECTED / POLISH punch-list and PASS or FAIL per criterion. | Edits. Clicks anything that writes data. Reviews code correctness. | Sigmund |
| **Doctor Nick** | Skill, inline in the session that hit the problem | A broken environment: preflight, a runbook by symptom, the known-issues log, a doctor check proposed at the second hit. | Debugs a product bug. Logs a guess as a known issue. Edits the doctor, his own skill or an agent file mid-triage. | The session that loaded him, which carries on from where it stopped |
| **Retro** | Skill, in a session of its own, on a trigger | Reading the workflow notes Sigmund logs (plus the pilot log, session cost, transcripts) and proposing the smallest diff to the workflow files. | Edits any workflow file, here or in a project, approved or not. Runs on a schedule or inside a change. | The owner, who approves each proposal |

## The reviewers and gates

Shipwright's lifecycle skills outside a single change. Each reports; none edits the thing it
judges.

| Skill | Owns | Never does | Reports to |
|---|---|---|---|
| **britch** | The idea gate before a repo exists: hard questions, the weakest assumption, one verdict (KILL, SHARPEN FIRST, PROCEED with kill criteria). | Brainstorms features, plans, designs or scaffolds. Softens a KILL. | The owner |
| **burt** | Design-system conformance of mockup files (`docs/design/mockups/**`), with `file:line` and the exact fix. | Judges behaviour, data or design direction. Reviews the running app. Invents rules. | The working agent, before an owner gate |
| **ac-author** | Writing acceptance criteria with stable `AC-<SCOPE>-n` IDs into the doc graph, under the change protocol. | Runs or verifies criteria. Invents behaviour to criterion-ize. Writes test plans. | The doc graph (`ui-requirements.md`, `roadmap.md`) and the owner gate that reads it |
| **acceptance-walkthrough** | Turning a gate's criteria into a guided owner sitting or an automated run, and recording PASS or FAIL per criterion. | Writes criteria. Rules on taste. Waives a failure. | The owner; failures go back to the build lanes as flags |

## The cognitive skills

Loaded on the kind of work, not by name. They shape the work while it happens and produce no
report.

| Skill | Owns | Never does | Reports to |
|---|---|---|---|
| **ui-craft** | Anything a user sees or touches, held to UX quality and the project's aesthetic at once. | Audits or gates (burt and parvati do). Overrides the design system. Expands scope. | No one: trade-offs go in the working session's receipt |
| **spec-elicitation** | The product-spec conversation: five moves, question banks, a coverage ledger. | Edits the spec mid-conversation. Validates the idea or designs screens. Declares coverage by fatigue. | The spec, through consolidation |
| **failure-first** | Operations that can fail or race: failure modes before the happy path, idempotency, state machines. | Reports or gates (murr audits after). Debugs existing defects. Invents behaviour. | No one: its success is murr finding nothing |

## Tracking in InProgress

In a project tracked in InProgress, two more members sit beside the roster. They live in the
InProgress repo (`claude/agents/inprogress-scribe.md`, `claude/skills/mip-orc/SKILL.md`), not in
Shipwright's templates.

| Member | Runs as | Owns | Never does | Reports to |
|---|---|---|---|---|
| **inprogress-scribe** | Background subagent (Sonnet, low) | Writing the task tree: steps, statuses and outcomes, asks, logs, resources, session focus, applied from a brief. | Writes anything the brief does not state. Guesses a step id. Acts without a brief from the main session. | The main session that briefed it, as a one-line notice |
| **Mip** (`mip-orc`) | Skill in an orchestrator session | Planning and handing out work: the digest, reconciling the plan, what to start next, handoffs. | Edits code, commits, builds, dispatches implementers or claims a step. Changes the tree except through the scribe. | The owner |

Who briefs the scribe, and when:

- **Every tracked session's main session**, following the InProgress briefing: a new
  deliverable, a step starting, finishing or blocking, an ask for the owner, an answer, a
  resource.
- **Sigmund** adds the change lifecycle's own briefs on top: workflow notes logged on the step,
  the `review` ask in phase 7, and the done outcome after the merge.
- **Mip** briefs it for the reconcile batch the owner approves.
- **Subagents never do.** Their reports reach the main session, which briefs.

To change how Sigmund briefs the scribe, the edit goes in the tracked-session parts of a
project's filled Sigmund (its Workflow notes, phase 7 and phase 8 sections) or in the InProgress
briefing (`src/server/briefing.ts` in the InProgress repo), not in the scribe's own file: the
scribe only applies what it is told.
