---
templates:
  - skills/retro/SKILL.md
covers:
  - skills/retro/SKILL.md
  - docs/retro-worked-example.md
---

# Retro

The retro reviews how the roster itself is working in a project and proposes the smallest diff
that fixes what it finds in the workflow files: agents, skills, `CLAUDE.md`, hooks, check
commands. It is a skill that runs in a session of its own (Opus, effort high), started for the
purpose and never inside a change, because it reads a lot. It proposes and never edits.

## Owns

- Reading the workflow notes Sigmund logs, plus the pilot log, the session cost report and, last,
  transcripts.
- Finding each cause and its home: the Shipwright template, the project's fill, both, or no
  change.
- Proposing the smallest diff, with the evidence behind it, as a proposal file.
- One ruling line per key in the notes' home, so the next retro starts there.

## Never does

- Edits any agent, skill, hook, `CLAUDE.md` or check file, here or in Shipwright, before or after
  approval. Landing a proposal is another session's change.
- Runs on a schedule or inside a change.
- Proposes from a guess: no note, finding or cost line behind it, no proposal.
- Judges product code or fixes the environment. Those are Murr's and Doctor Nick's.
- Rolls a template change into a project from another project's session.
- Re-proposes a declined change without new evidence.

## Reports to

The owner, who approves each proposal.

## How it works

### The law

The retro proposes and never edits. Its only writes are the proposal file, one ruling line per key
in the notes' home, and the report the diagnosis skill writes for itself. Each proposal waits for
the owner's approval, lands as an ordinary change with Murr's review, and reaches each project
through that project's own session (owner ruling, 2026-10-14).

### Triggers

Any one makes a retro due, and the owner starts it:

1. **Repeat:** a second note on the same key. A `watch` ruling keeps its note, so the next note is
   the second; a `proposed` or `no change` ruling clears the count.
2. **Defect:** a reviewer or the owner finds a defect in a workflow file, even one fixed on the
   spot. The template it came from may carry the same line.
3. **Pilot close:** a pilot of a routing or workflow change reaches the end of its window.
4. **Owner asks.**

A project may add more of its own. Never on a schedule.

### Inputs, cheapest first

Stop when the cause is clear.

| # | Input |
|---|---|
| 1 | Workflow notes, and how the retro reads every note and ruling line in its window |
| 2 | The pilot log |
| 3 | The cost report for the window's sessions |
| 4 | Transcripts, for one session at most unless the owner asks for more |
| 5 | The workflow files, their note keys and the templates they were adopted from |
| 6 | The proposals home |
| 7 | How the owner is asked for approval |

### The method

| Step | What happens |
|---|---|
| 0 | Name the trigger and the window (from the last proposal file or the pilot's start, to now). List the sessions in it. |
| 1 | Group the notes by key, with kinds, costs, whether fixed locally, and any earlier ruling. |
| 2 | Read the cost, looking for what notes cannot show: a session far above its peers, one dispatch taking most of a session, an override that did or did not pay, fix rounds that repeat. |
| 3 | Transcripts, last and least: only for a session steps 1 and 2 do not explain. The superpowers `diagnosing-superpowers` skill does the reading; it is expensive, so the retro says its cost before starting. |
| 4 | Find each cause and its home: template, fill, both (two diffs, template first), or no change. |
| 5 | Draft each proposal: the notes behind it, the cause with `file:line` and quoted text, the exact unified diff, what it costs every session afterwards, the check that would catch a repeat, where it lands, the rollout list. |
| 6 | Adversarial self-check, defaulting to no change. One note with no cost and no repeat is a watch. A proposal that adds more per-session load than the friction cost is rejected. Prefer tightening or deleting text over adding it, and a check over a rule. |
| 7 | Write the proposal file, write one ruling line per key, ask the owner, stop. |

The ruling line is
`workflow ruling [<key>] <proposed | watch | no change>: <one line> · <proposal file>`. It has its
own prefix so no one counts it as a note.

### How a proposal lands

After the owner approves, each proposal is a change made by another session. A template diff
lands in Shipwright from a Shipwright session, with Murr reviewing it, and each adopting project
then merges the new text into its filled copy through its own session, never by copying the
template over its edited file. A fill diff runs through the project's Sigmund, with Murr's review.
A declined proposal is recorded as declined against its key.

### The report

The proposal file and the same text in chat: the trigger and window, the inputs read, then the
numbered proposals (key, home, evidence, cause, diff, per-session cost, the check that catches a
repeat, where it lands, rollout), then Watch, No change, and how the owner was asked. Each
proposal's diff follows in full. `docs/retro-worked-example.md` shows the format on four defect
notes from InProgress's roster review of 2026-10-14, and the one note that stayed a watch.

## What a project fills in

Placeholders in `skills/retro/SKILL.md`:

| Placeholder | Holds |
|---|---|
| `{{PROJECT}}` | The project's name. |
| `{{RETRO_TRIGGERS}}` | The project's triggers beyond the four, or "none". |
| `{{WORKFLOW_NOTES}}` | Where a workflow note goes and how the session writes it. Must match the value in Sigmund's Workflow notes. |
| `{{WORKFLOW_NOTES_READ}}` | How the retro reads every note and ruling line in its window, verbatim, and the read's limits. The retro's alone. |
| `{{PILOT_LOG}}` | Where the pilot log lives and what it records, or "none". |
| `{{COST_REPORT}}` | The command that prices the window's sessions, or "none". |
| `{{TRANSCRIPTS}}` | Where the project's session transcripts live. |
| `{{WORKFLOW_FILES}}` | Each workflow file, its note key, and the Shipwright template it was adopted from, or "project-only". |
| `{{PROPOSALS_HOME}}` | Where proposal files are saved. |
| `{{APPROVAL}}` | How the retro asks the owner to approve each proposal. |

`[edit]` sections: Triggers, and Inputs and outputs. On adoption the template's "Adopting this
template" section is deleted once `grep -n '{{' .claude/skills/retro/SKILL.md` prints nothing.

## Calling it yourself

Start a session for it and run `/retro`, or say "run a retro", "retro on the roster" or "why does
this keep happening to the agents", or start a retro Sigmund proposed. Do not use it inside a
change session, for a product bug (systematic-debugging), a broken environment (Doctor Nick),
reviewing a diff (Murr), or for landing a proposal it already made.

See the [roster](roster.md) for every member on one page.
