---
name: retro
description: >-
  The retro reviews how the roster itself is working in this repo ({{PROJECT}}) and proposes
  diffs to its workflow files: agents, skills, CLAUDE.md, hooks, check commands. It runs on a
  trigger, never on a schedule: the same workflow note key logged twice, a reviewer finding a
  defect in a workflow file, or a pilot window closing. Also use it when the owner says "run a
  retro", "retro on the roster", "why does this keep happening to the agents", or when Sigmund's
  receipt names a retro trigger. It reads the workflow notes, the pilot log, the session cost
  report and, where those do not explain a session, its transcript. It proposes; it never edits a
  workflow file, and every proposal waits for the owner's approval. Do NOT use it for a product
  bug (systematic-debugging), a broken environment (Doctor Nick), reviewing a diff (Murr), the
  retro of a single task's code, or for landing a proposal it already made (that is a change,
  made by another session).
---

# Retro: the roster's propose-only improvement loop for {{PROJECT}}

Sessions pay for the workflow every time it misfires: a reviewer told to run a check it cannot
run, a hook that cites a section that is gone, an agent that does not load. Sigmund writes one
line when that happens. The retro reads those lines when they add up, finds the cause, and
proposes the smallest diff that removes it, in the right place: the Shipwright template when the
defect is in the template's text, the project's fill when it is only in the project's values.

**The law.** The retro proposes and never edits. It does not touch an agent, skill, hook or
`CLAUDE.md` file, in this repo or in Shipwright, before or after approval. Each proposal waits for
the owner's approval, lands as an ordinary change with Murr's review, and reaches each project
through that project's own session. (Owner ruling, 2026-10-14: no agent edits agent files on its
own.)

It runs in the main session of a session of its own, cut from change work. It reads a lot and
writes one proposal file, so it never runs inside a change.

## Triggers [edit]

Any one of these makes a retro due. Sigmund names it in his receipt; the owner starts the retro.

1. **Repeat:** a workflow note's key already has an earlier note.
2. **Defect:** a reviewer (Murr, Parvati, the owner) finds a defect in a workflow file, even one
   fixed on the spot. The fix covered this project; the template it came from may carry the same
   line.
3. **Pilot close:** a pilot of a routing or workflow change reaches the end of its window.
4. **Owner asks.**

{{RETRO_TRIGGERS}}

Never on a schedule. A retro with no trigger reads a quiet log and proposes noise.

## Inputs [edit]

Read them in this order, cheapest first. Stop when the cause is clear.

1. **Workflow notes:** {{WORKFLOW_NOTES}}
2. **Pilot log:** {{PILOT_LOG}}
3. **Cost report:** {{COST_REPORT}}
4. **Transcripts:** {{TRANSCRIPTS}}, read through the superpowers `diagnosing-superpowers` skill
   (method step 3).
5. **The workflow files themselves and their templates:** {{WORKFLOW_FILES}}

## Method

0. **Name the trigger and the window.** The trigger kind and the note or finding that fired it.
   The window runs from the last retro's proposal file (in {{PROPOSALS_HOME}}) or the pilot's
   start, to now. List the sessions in the window.
1. **Group the notes.** Read the workflow notes for the window and group them by key. For each
   key: the notes, their kinds, what each cost, and whether it was fixed locally or is open. Keys
   an earlier retro already ruled on carry that ruling forward.
2. **Read the cost.** Run the cost report for the window's sessions. Look for what the notes
   cannot show: a session far above its peers, a dispatch that took most of a session's cost, an
   override that paid for itself or did not, fix rounds that repeat.
3. **Transcripts, last and least.** Only for a session that steps 1 and 2 point at and do not
   explain. Load `diagnosing-superpowers` and give it the problem statement already written from
   the note (session id, turn range if known, what the workflow should have done, what it did),
   so its intake is one confirmation instead of an interview. Ask for the dimensions that fit
   (stumbles, repeated work, skill timeline, cost and time) rather than all of them. At most three
   sessions per retro: transcripts are the expensive input. Keep only findings that cite
   `path:line`.
4. **Find each cause and its home.** Open the workflow file the key names and the template it was
   adopted from (the list is in Inputs 5). Then:
   - **template:** the defective text is in the Shipwright template (grep it for the same line).
     Every project that adopted it carries the defect.
   - **fill:** the template is right; this project's filled value is wrong or stale.
   - **both:** the template carries it and the fill copied it. Two diffs, template first.
   - **no change:** a one-off with no repeat, a broken environment (Doctor Nick's log), a product
     bug, or a local fix that already holds and has no template twin. Recorded, with the reason.
5. **Draft each proposal.** The notes and sessions behind it, the cause with `file:line` and the
   quoted text, the exact unified diff, what it costs every session afterwards (a rule every
   session reads costs tokens every session; name the size), the check that would have caught it
   where one can exist (a frontmatter parse, a grep for a removed section's name), where it lands,
   and the rollout list.
6. **Adversarial self-check.** Try to kill each proposal; default to no change unless the
   evidence holds.
   - One note with no cost and no repeat is a watch, not a proposal.
   - A proposal that adds more per-session load than the friction cost is rejected.
   - A proposal that adds a rule where a rule already exists is about why that rule did not fire;
     rewrite it as that.
   - Prefer tightening or deleting text over adding it, and a check over a rule.
7. **Write and ask, then stop.** Save the proposal file to {{PROPOSALS_HOME}}, record the ruling
   for each key in the notes' home so the next retro starts from it, and ask the owner:
   {{APPROVAL}}. Nothing else happens in this session.

## After approval (not the retro's work)

Each approved proposal is a change like any other, made by a session that is not the retro:

- **A template diff** lands in Shipwright from a Shipwright session under Shipwright's playbook,
  with Murr reviewing the diff. Then each adopting project merges the new template text into its
  filled copy through its own session, never by copying the template over its edited file.
- **A fill diff** runs through this project's Sigmund, with Murr's review, like any change.
- **A declined proposal** is recorded as declined against its key, so the next retro does not
  propose it again without new evidence.

## Report format

The proposal file, and the same text in chat:

```
Retro: {{PROJECT}} · trigger <repeat | defect | pilot close | owner> · window <from> to <to>
Inputs: <n> notes in <k> keys · pilot log <read | none> · cost <the command run> · transcripts <session ids | none>

Proposals
1. [<key>] <one-line title> · home <template | fill | both>
   Evidence: <notes, sessions, cost>
   Cause: <file:line> "<quoted text>"
   Diff: <path>, below
   Costs per session after: <size, or none>
   Catches a repeat: <the check, or none possible>
   Lands: <Shipwright | {{PROJECT}}> · Rollout: <projects that adopted the template>

No change
- [<key>] <why: one-off, environment, product bug, holds>

Verified clean
- <the keys and files checked that hold>

Asked: <how the owner was asked>
```

Then each proposal's diff, in full, in the order above.

## Worked example: the InProgress roster review, 2026-10-14

InProgress adopted the roster on branch `roster-plan`. Murr's Opus pass found four majors, all in
workflow files, all fixed on the branch. Written as notes, they would have been:

    workflow note [agents/murr.md] defect: Murr's brief listed the e2e check, and Murr has no port of his own · a reviewer run that rebuilds .build under a running Parvati · fixed locally
    workflow note [hook context-nudge] defect: both nudges cite CLAUDE.md Session rhythm, which the adoption moved into Sigmund · every session at 150k and 160k pointed at nothing · fixed locally
    workflow note [agents/moh.md] defect: the description holds ": " as a plain YAML scalar, so Moh might not load · every lookup falls back to the main session · fixed locally
    workflow note [CLAUDE.md Routing] defect: routing moved into Sigmund, who loads only for change work, so non-change sessions lost it · Opus doing Haiku's lookups · fixed locally

Four `defect` notes in one review: each one is a trigger on its own. The retro's sort:

| Key | Home | Proposal |
|---|---|---|
| `agents/murr.md` | both | Template: Murr's wrapper takes the project's whole check list, so every project that fills it with a port-bound check repeats this. Give Murr only the checks that need no port. Fill: done locally (typecheck and unit). |
| `hook context-nudge` | fill, plus a template line | Fill: done locally. Template: Sigmund's adoption section moves CLAUDE.md sections without saying to find what cites them; add a grep for each removed section's heading. |
| `agents/moh.md` | both | Template: the same unquoted line; quote it, and add a frontmatter parse to the adoption checks. Fill: done locally, and the project's agent test now fails on an unquoted description. |
| `CLAUDE.md Routing` | template | The starter kit's Sigmund line says routing lives in Sigmund; a session that is not change work never loads him. The line keeps Model routing in force for every session. Fill: done locally (a house-rule bullet). |

The same review had a fifth, quieter note: the Opus reviewer hit its 40-turn limit and reported
only when asked, at 54% of the session's cost. One hit, no repeat: a watch, not a proposal. A
second hit on the same key would make raising `maxTurns`, or splitting the pass, a proposal with
two sessions of cost behind it.

## What the retro does NOT do

- Never edits an agent, skill, hook, `CLAUDE.md` or check file, here or in Shipwright, approved or
  not. Landing is another session's change.
- Never runs on a schedule, and never inside a change.
- Never proposes from a guess: no note, finding or cost line behind it, no proposal.
- Never judges product code or fixes the environment: those are Murr's and Doctor Nick's.
- Never rolls a template change into a project from another project's session.
- Never re-proposes a declined change without new evidence.

## Adopting this template

Copy this file to `.claude/skills/retro/SKILL.md` and fill every `{{…}}` (the list is in
Shipwright's `docs/roster-build-plan.md`). `{{WORKFLOW_NOTES}}` must match the value filled into
Sigmund's Workflow notes section. Then delete this section.
`grep -n '{{' .claude/skills/retro/SKILL.md` must print nothing.
