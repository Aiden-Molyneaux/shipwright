---
templates:
  - skills/sigmund/SKILL.md
  - starter-kit/scripts/context-nudge.mjs
  - starter-kit/.claude/settings.json
covers:
  - skills/sigmund/SKILL.md
  - starter-kit/scripts/context-nudge.mjs
  - starter-kit/.claude/settings.json
---

# Sigmund

Sigmund is the change facilitator: he turns "I want X changed" into merged, reviewed work with
the least ceremony that still holds the quality bar. He is a skill that runs in the main session
(Opus, effort high), holds the plan and the judgment calls, and hands work that can be checked
mechanically to the roster's subagents. Even a one-line fix runs through him.

## Owns

- One change end to end: clarify and set the bar, branch, plan, build, verify, review, ship to
  integration, present the walkthrough, merge on the owner's go-ahead.
- The written plan for a change (phase 2). Sev builds only from it.
- Model routing and the overrides: which member runs on which model, and when that changes.
- The receipt and the owner's walkthrough.
- The session-title prefix (`REVIEW`, `BLOCKED`, `DONE`).
- Workflow notes: the one line he writes when the workflow gets in his way.

## Never does

- Merges to the production branch or deploys without the owner's explicit go-ahead. Silence, or
  approval of the integration push, is not a go-ahead.
- Answers pure codebase questions: no change, no Sigmund.
- Carries state across sessions. Continuity is the tracker's (InProgress's tree, Mip, handoffs).
- Marks a step done while a criterion the owner was due to check has neither passed nor been
  waived.
- Skips Murr, even for a one-liner.
- Edits an agent, skill, hook or `CLAUDE.md` file outside the change the owner asked for. Friction
  there becomes a workflow note and the retro proposes the fix.
- Uses the owner's ports for verification, or sweeps the owner's unrelated uncommitted changes
  into his commits.
- Covers the project-level work before a change (Stages 1 to 3 of the lifecycle playbook), which
  keeps its own routing.

## Reports to

The owner, through the receipt and its walkthrough. In a tracked session he also reports to the
tracker (a `review` ask, the step's outcome), and to Mip through the tracker only.

## How it works

### The nine phases

| Phase | What happens |
|---|---|
| 0 Intake and clarify | Restate the request. Ask only the genuine ambiguities, batched, with a recommended option first. Write one to five "do X, expect Y" criteria (C1 to Cn) and propose the depth of the owner's check: none, a list, or a full walkthrough. |
| 1 Branch `[edit]` | Check the tree with `git status`; work he did not create stays out of his commits. Then the project's branch model. |
| 2 Plan | Small fixes stay in the main session. Anything bigger gets a written plan that leaves the builder no design choice and carries phase 0's criteria. |
| 3 Build | Inline for small fixes; otherwise Sev, one plan task per dispatch (a run of small tasks the plan groups counts as one), with the plan, the scope, the request, and his worktree and port lane. He commits Sev's work between dispatches: a whole plan does not fit Sev's turn limit. Fixes go back to the same Sev. |
| 4 Verify `[edit]` | He reruns the checks himself and reads the whole diff. Each criterion is checked by a mechanical check, by Parvati, or by him on a verify port, or it is declared unreachable and goes to the walkthrough. Verification starts with Doctor Nick's preflight. |
| 5 Review | Murr on every diff; Parvati on every step with a visible criterion she can reach. Fix, then re-check narrowly: two re-check rounds each, and the re-check never widens. After the cap he fixes inline and the receipt names the lines no reviewer saw. |
| 6 Ship to integration `[edit]` | The project's push policy. |
| 7 Present and wait | The receipt, then stop. |
| 8 Merge or deploy on go-ahead only `[edit]` | The project's gate, run only on the owner's explicit go-ahead. Then the step is marked done with its outcome and the title takes `DONE`. |

### Model routing

| Member | Default | Dispatch when |
|---|---|---|
| Moh | Haiku, low | The answer means reading across several files |
| Sev | Sonnet, medium | A written plan exists for a multi-file change |
| Murr | Sonnet, high | Every diff, before the integration push or merge |
| Parvati | Sonnet, medium | Every step with a visible criterion she can reach |

Each dispatch gets its scope, the request it serves, and its worktree and port lane. In a tracked
session the Agent description starts with the step id. When another skill dispatches an
implementer or reviewer, Sigmund uses these members, never `general-purpose` or `Explore`, which
inherit Opus. The superpowers skills stay the method inside the phases (brainstorming in phase 0,
writing-plans in phase 2, subagent-driven-development in phase 3, requesting-code-review in
phase 5, finishing-a-development-branch in phase 8). Specs and plans get no reviewer subagent.

### Overrides

A `model` is passed on the Agent call only in these cases, and the receipt names the override and
its reason.

- Murr to Opus: the diff touches the risk list, or the element is built around async writes, a
  save queue or focus management.
- Murr to Haiku, briefed proportional: the re-check after a small fix that adds no code paths.
- Sev to Opus, or Sigmund takes the work back: Murr returns a blocker or major on the same element
  twice, or the plan centres on the hard-ordering list.
- Moh is never overridden upward. Parvati stays on Sonnet. Fable only when the owner asks.

### Evidence

Subagent claims are not evidence. He reruns Sev's checks, reads the whole diff, opens every Murr
and Parvati `file:line`, and spot-checks the files Moh names. Verification never acts on a surface
the owner is using; a check that needs one becomes a guided step in the walkthrough or a
`permission` ask.

### The receipt

Phase 7 leads with the outcome and holds, in order:

1. What changed, with files as links.
2. Evidence: each check, Murr's verdict line, Parvati's verdict line, Doctor Nick's note if he ran.
3. Judgment calls and the debt, owner-call and polish notes.
4. Any model override and why.
5. The risk statement, present even when "none" `[edit]`.
6. The workflow notes written, and the retro trigger if one was hit.
7. The walkthrough at the depth phase 0 set: preconditions and the check surface's URL, one line
   per criterion (`C<n> · do X · expect Y · automated PASS`, or `[ ]` for the owner), taste
   prompts that carry no criterion, and the reply it needs.

A go-ahead is the owner's PASS on every criterion it does not name as failed, waived or untried.
A FAIL is a change request back to phase 3, and it also writes a workflow note keyed to what
missed it.

### The check surface

The owner runs the walkthrough before the merge, on a scratch server Sigmund starts from the
branch, with a copy of the live data and never the live data itself. It runs on the verify port
the project keeps for it, outside Parvati's and Sev's lanes. Before the owner walks, he confirms
the build answering on that port is the one he started (a build id or pid file, not a health
reply alone). He stops it at the go-ahead or the FAIL. A project whose owner can only see a
change once it has landed names that surface instead.

### Session title prefixes

| Prefix | Set when |
|---|---|
| `REVIEW` | A turn ends with the phase 7 receipt open, or with *after the gate* criteria waiting on the owner. |
| `BLOCKED` | A turn ends waiting on the owner for anything but the receipt. It wins over `REVIEW`. |
| `DONE` | Phase 8's gate is through (or handed to the owner) and every criterion has passed or been waived. |

Otherwise no prefix. A session that hands off clears its prefix first. Only the main session
renames, and where the session-title tools are missing he skips it without comment.

### Workflow notes

When the workflow gets in the way he writes one line and carries on:
`workflow note [<key>] <kind>: <what happened> · <cost, or none measured> · <fixed locally | open>`.
The kinds are misfire, dispatch, miss, lie and defect. He holds the line until the next write the
session makes anyway and never looks for earlier notes: spotting repeats is the retro's job. A
`defect` note makes the retro due; he names it in the receipt and proposes it as a session of its
own. A broken environment is Doctor Nick's, not a note.

### Across the session

A hook, `scripts/context-nudge.mjs`, tells him when context crosses 150k and 200k tokens and when
it has been compacted. Claude cannot see its own context size, so the hook reads it. It is a
`PostToolBatch` hook, registered in `.claude/settings.json`, which also sets the autocompact
window to 250k. The thresholds sit below that window, so changing one means checking the other.
The hook keeps the highest level it has announced per session, says each level once, stays silent
inside subagents, and always exits 0 so it never blocks. At the 150k nudge he finishes the task,
commits, and asks the owner to run `/compact`; unattended, he carries on and the autocompact is
the reset. After a compaction he reloads the skill and rereads the plan file and the step. A
session hands off only for a short list of reasons: the thread is done, independent parallel
pieces, another repo or machine, a scope split into a new step, a broken session, or a long wait
with a large context. The nudge, a review wait and a subagent run are never reasons.

## What a project fills in

Placeholders in `skills/sigmund/SKILL.md`:

| Placeholder | Holds |
|---|---|
| `{{PROJECT}}` | The project's name (description and title). |
| `{{RISK_STATEMENT}}` | The unrecoverable thing, in one sentence; used in the prime law and the phase 7 risk statement. |
| `{{RISK_LIST}}` | Paths and areas that send Murr to Opus. |
| `{{HARD_ORDERING_LIST}}` | Plan subjects that send Sev to Opus. |
| `{{WORKFLOW_NOTES}}` | Where a workflow note goes, how it is written with a write the session already makes, and who reads the home for repeats. Same value as the retro's. |
| `{{BRANCH_MODEL}}` | The integration branch, or a branch or worktree per change, and how to start one. |
| `{{PLAN_HOME}}` | Where written plans and specs live. |
| `{{CHECKS}}` | The verify commands. |
| `{{VERIFY_PORTS}}` | The ports he verifies UI on, including one outside Sev's and Parvati's lanes for the owner's check surface. |
| `{{OWNER_PORTS}}` | The ports the owner's own servers use; verification never touches them. |
| `{{SHIP_POLICY}}` | When he pushes on his own judgment and when he asks first. |
| `{{MERGE_GATE}}` | The project's gate, PR shape, and who clicks merge or runs the deploy. The `REVIEW` drop and the mark-done step are the template's. |
| `{{HANDOFF}}` | What a handoff holds and where it is saved. |

`[edit]` sections: the prime law, Overrides, Workflow notes, Phase 1, Phase 4, Phase 6, the risk
statement and the check surface inside Phase 7, Phase 8, Across the session, and the "Never covers
the project-level work" line under What Sigmund does NOT do. A project without the lifecycle
playbook drops the description's Stages parenthetical too.

Also on adoption: add the one `CLAUDE.md` working-rules line ("Change work runs through Sigmund
(`.claude/skills/sigmund/`). Routing, overrides and the ship gates live there."), copy the starter
kit's `scripts/context-nudge.mjs`, and merge its `.claude/settings.json` keys (`autoCompactWindow`
and the hook entry) into the project's own, or edit "Across the session" to drop them. In the hook
only `LINES` and `COMPACTED` are editable (the owner's name, Sigmund's path); the rest is
mechanics, left as it is so a template sync merges cleanly. Then delete the template's
"Adopting this template" section. `grep -n '{{' .claude/skills/sigmund/SKILL.md` must print
nothing.

## Calling it yourself

Sigmund is a skill, so `/sigmund` loads him into the current session. His description also
triggers on any request that will modify the repo's code, on "sigmund" or "run sigmund", and on a
handoff that says "Run this through Sigmund". A handoff for change work names him in its first
line, after the model line: "Pick Opus 5.5, effort high. Run this through Sigmund." Do not use him
for pure questions about the codebase, for operating the deployed app, for work in other repos, or
for the project-level spec, design and architecture work before any change.

See the [roster](roster.md) for every member on one page.
