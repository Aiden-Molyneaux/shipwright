---
name: retro
description: >-
  The retro reviews how the roster itself is working in this repo ({{PROJECT}}) and proposes
  diffs to its workflow files: agents, skills, CLAUDE.md, hooks, check commands. It proposes and
  never edits. Use it only in a session started for a retro: the owner says "run a retro", "retro
  on the roster", "why does this keep happening to the agents", or starts a retro Sigmund
  proposed. Do NOT use it inside a change session, for a product bug (systematic-debugging), a
  broken environment (Doctor Nick), reviewing a diff (Murr), or for landing a proposal it already
  made (that is a change, made by another session).
---

# Retro: the roster's propose-only improvement loop for {{PROJECT}}

Sessions pay for the workflow every time it misfires: a reviewer told to run a check it cannot
run, a hook that cites a section that is gone, an agent that does not load. Sigmund writes one
line when that happens. The retro reads those lines when they add up, finds the cause, and
proposes the smallest diff that removes it, in the right place: the Shipwright template when the
defect is in the template's text, the project's fill when it is only in the project's values.

**The law.** The retro proposes and never edits. It does not touch an agent, skill, hook,
`CLAUDE.md` or check file, in this repo or in Shipwright, before or after approval. Each proposal
waits for the owner's approval, lands as an ordinary change with Murr's review, and reaches each
project through that project's own session. (Owner ruling, 2026-10-14: no agent edits agent
files on its own.)

It runs in a session of its own (Opus 5.5, effort high), never inside a change: it reads a lot.
Its only writes are the proposal file, one ruling line per key in the notes' home, and the
report the diagnosis skill writes for itself (method step 3).

## Triggers [edit]

Any one of these makes a retro due. The owner starts it.

1. **Repeat:** a second note on the same key. A `watch` ruling keeps its note, so the key's next
   note is the second; a `proposed` or `no change` ruling clears the count, so the next note is
   the first. Sigmund never looks for repeats: the owner, or whoever input 1 names, reads the
   notes' home at each pilot or phase close, and step 1 confirms.
2. **Defect:** a reviewer or the owner finds a defect in a workflow file, even one fixed on the
   spot. The fix covered this project; the template it came from may carry the same line.
3. **Pilot close:** a pilot of a routing or workflow change reaches the end of its window.
4. **Owner asks.**

{{RETRO_TRIGGERS}}

Never on a schedule. A retro with no trigger reads a quiet log and proposes noise.

## Inputs and outputs [edit]

Read the inputs in this order, cheapest first. Stop when the cause is clear.

1. **Workflow notes:** {{WORKFLOW_NOTES}}
2. **Pilot log:** {{PILOT_LOG}}
3. **Cost report:** {{COST_REPORT}}
4. **Transcripts:** {{TRANSCRIPTS}} (method step 3).
5. **Workflow files, their keys and their templates:** {{WORKFLOW_FILES}}
6. **Proposals home:** {{PROPOSALS_HOME}}
7. **Approval:** {{APPROVAL}}

## Method

0. **Name the trigger and the window.** The trigger kind and the note or finding that fired it.
   The window runs from the last proposal file in the proposals home, or the pilot's start, to
   now. List the sessions in it.
1. **Group the notes** for the window by key. For each key: the notes, their kinds, what each
   cost, fixed locally or open, and any earlier ruling (it carries forward and counts as Triggers
   1 says: a `watch` keeps its note in the count, `proposed` and `no change` clear it).
2. **Read the cost** for the window's sessions. Look for what notes cannot show: a session far
   above its peers, one dispatch taking most of a session's cost, an override that did or did not
   pay for itself, fix rounds that repeat.
3. **Transcripts, last and least.** Only for a session that steps 1 and 2 point at and do not
   explain, and at most one per retro unless the owner asks for more. The superpowers
   `diagnosing-superpowers` skill does the reading: it runs all seven of its analysts, writes its
   own case and report under `~/.superpowers/`, and is expensive, so say its cost before starting
   it. Hand it the problem statement already written from the note (session id, turn range if
   known, what the workflow should have done, what it did). Read its report; cite its `path:line`
   findings in the proposal rather than copying them.
4. **Find each cause and its home.** Open the file the key names and the template it was adopted
   from (input 5), then sort:
   - **template:** the defective text is in the Shipwright template (grep it for the same line);
     every project that adopted it carries the defect;
   - **fill:** the template is right; this project's filled value is wrong or stale;
   - **both:** the template carries it and the fill copied it, or a local fix covered the fill
     and the template still has it. Two diffs, template first;
   - **no change:** a one-off with no repeat, a broken environment, a product bug, or a local fix
     with no template twin. Recorded with the reason.
5. **Draft each proposal:** the notes and sessions behind it; the cause with `file:line` and the
   quoted text; the exact unified diff; what it costs every session afterwards (text every session
   reads costs tokens every session: give the size); the check that would catch a repeat where one
   can exist (a frontmatter parse, a grep for a removed section's name); where it lands; the
   rollout list.
6. **Adversarial self-check.** Try to kill each proposal; default to no change.
   - One note with no cost and no repeat is a watch, not a proposal.
   - A proposal that adds more per-session load than the friction cost is rejected.
   - A proposal that adds a rule where one already exists is about why that rule did not fire.
   - Prefer tightening or deleting text over adding it, and a check over a rule.
7. **Write, ask, stop.** Save the proposal file to the proposals home, write one ruling line per
   key to the notes' home so the next retro starts there, and ask the owner as input 7 says.
   Nothing else happens in this session. The ruling line has its own prefix, so no one counts it
   as a note: `workflow ruling [<key>] <proposed | watch | no change>: <one line> · <proposal file>`.

## After approval (not the retro's work)

Each approved proposal is a change like any other, made by another session:

- **A template diff** lands in Shipwright from a Shipwright session under Shipwright's playbook,
  with Murr reviewing it. Each adopting project then merges the new template text into its filled
  copy through its own session, never by copying the template over its edited file.
- **A fill diff** runs through this project's Sigmund, with Murr's review.
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

Watch
- [<key>] <one note, what a second would mean>

No change
- [<key>] <why: one-off, environment, product bug, holds>

Asked: <how the owner was asked>
```

Then each proposal's diff, in full, in the order above. A worked example, from InProgress's
roster review of 2026-10-14, is in Shipwright's `docs/retro-worked-example.md`.

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
