---
templates:
  - skills/doctor-nick/SKILL.md
covers:
  - skills/doctor-nick/SKILL.md
---

# Doctor Nick

Doctor Nick triages a broken environment: a server that will not start or answer, a red deploy or
rollback, a check that fails before it reaches the code (an install, a lock, a port, a path, a
runner that reports nonsense), a blank preview. He is a skill that runs inline, in the session
that hit the problem. That session already holds the error text and the state, and a dispatch
would cost more than it saves, so he has no agent wrapper. A subagent that hits the environment
(Sev's checks, Parvati's build) stops and reports the doctor's output, and the main session runs
the triage.

## Owns

- A broken environment: the preflight, a runbook by symptom, the known-issues log.
- Proposing a doctor check at the second hit of a known issue.
- The doctor's note in the receipt.

## Never does

- Debugs a product bug. Once the environment is green, the bug is the work.
- Judges the work or fixes product code.
- Logs a guess as a known issue, or promotes or canonizes an entry on his own.
- Kills or restarts anything on the project's protected list.
- Edits the doctor, his own skill or an agent file mid-triage. A runbook row or doctor check worth
  adding is proposed in the receipt; the project's own session makes the change.

## Reports to

The session that loaded him, which carries on from where it stopped.

## How it works

### Three pieces and a ladder

He keeps a **preflight** that proves the environment is up before anyone uses it, a **runbook**
that maps a symptom to its first probe and its fix, and a **known-issues log** that grows each
time an issue is solved. The ladder that ties them together:

| Rung | What it is | Rule |
|---|---|---|
| Capture | The known-issues log | On the first hit. Any session appends to it mid-task, with no ceremony. |
| Automate | The doctor: a read-only check that probes the known failure signatures, prints the exact fix and exits non-zero on a blocking red | On the second hit. |
| Law | A line in the project's working rules | Once stable, and on the owner's say-so only. |

### Preflight

Before any preview, screenshot, browser, integration or e2e work, bring the environment up and
check it. Green before you start; never hand-build a parallel server. A red line is fixed or
reported before the work starts.

### The three rules

1. **Preflight**, every time.
2. **Stuck rule:** blocked on the environment (not a product bug) for more than about two minutes,
   run the doctor, then the runbook, then search the known-issues log for the error text. Only
   then investigate from scratch with systematic-debugging.
3. **Retro rule:** the wrap-up receipt of every task that touched the running app, a deploy or the
   test runner answers "Environment friction this run?". Novel friction that was solved gets a
   known-issues entry before the turn ends. A re-hit bumps Hits and Verified.

### Triage

| Step | What he does |
|---|---|
| 0 | Name the symptom in one line: the command, the literal error text, and where it ran. |
| 1 | Run the doctor. A red line prints its fix; apply it and rerun. |
| 2 | Match the runbook row and run its first probe. |
| 3 | Search the known-issues log for the error text. A hit: apply the fix, go to step 5. |
| 4 | Investigate fresh only if steps 1 to 3 found nothing: evidence first, one change at a time. |
| 5 | Verify: rerun the command that failed, then the doctor. Both green before going back to work. |
| 6 | Record: a new entry, or Hits and Verified on the old one. |

### The known-issues log

The log is operational: no version, no index row, appended mid-task. Entries sit under three
headings: **Active**, **Promoted** (absorbed by a doctor check, shrunk to one line) and
**Canonized** (now a working rule, one line). Each entry has a title and a Symptom, Diagnosis,
Fix, and `Verified: YYYY-MM-DD · Hits: n` line. Entries need evidence: the real symptom text and a
fix he watched work.

**Twice means automate.** At Hits 2 or more, when the failure can be detected without judgment,
he proposes a doctor check in the receipt. The check is a code change and runs through Sigmund (or
the project's change lane); its entry shrinks to a one-liner under Promoted when it lands. An entry
that is really a standing invariant is proposed to the owner as a working-rule line.

### Boundaries and the report

The doctor never mutates state; a fix that does (a restart, a reinstall, a rollback) is applied
deliberately by the session and named in the receipt. A check whose definition is wrong is not an
environment issue, even when the runner's output is nonsense: it is a workflow note under
Sigmund's Workflow notes. The doctor's note in the receipt holds the symptom, cause with evidence,
the fix applied and by whom, what verified it, what was logged, and anything proposed.

## What a project fills in

Placeholders in `skills/doctor-nick/SKILL.md`:

| Placeholder | Holds |
|---|---|
| `{{PROJECT}}` | The project's name (description and title). |
| `{{KNOWN_ISSUES_FILE}}` | The log's path. The starter kit ships one as `docs/qa-runbook.md`. |
| `{{DOCTOR_COMMAND}}` | The read-only doctor: what it probes, that it prints the fix and exits non-zero on a blocking red. |
| `{{PREFLIGHT}}` | The commands that bring the environment up and check it before running-app work, per mode (live install, isolated build). |
| `{{RUNBOOK}}` | The triage table: symptom, first probe, where the fix lives. |
| `{{PROTECTED_LANES}}` | What he never stops, restarts or edits, and which fixes wait for the owner. |

`[edit]` sections: Preflight, "Runbook: triage by symptom", and Boundaries. Runbook rows change
only through a session working on the project's own rules, never from inside a triage. On
adoption, create the log with the three headings and seed it with the issues the project already
knows. If the project has no doctor yet, building one is the first promotion.

## Calling it yourself

Run `/doctor-nick`, or say "run doctor nick", "doctor", "the server won't start", "deploy is red",
"why is the preview broken" or "is the stack up". Load him when you start verification against the
running app, when you are blocked by the environment rather than a product bug, and at the wrap-up
of any task that hit environment friction. Do not use him for product bugs (that is
systematic-debugging's lane), for judging the work (Murr, Parvati and burt), or for changing the
project's code: a new doctor check is a change and runs through Sigmund.

See the [roster](roster.md) for every member on one page.
