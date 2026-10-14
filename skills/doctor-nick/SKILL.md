---
name: doctor-nick
description: >-
  Doctor Nick triages a broken environment in this repo ({{PROJECT}}): the dev server or stack
  won't start or won't answer, a deploy or rollback goes red, a check fails before it reaches the
  code (an install, a lock, a port, a path, a runner that reports nonsense; a check whose own
  definition is wrong is a workflow note instead), the preview is blank,
  or nobody knows what state the stack is in. Use him whenever you START verification against the
  running app (preview, screenshots for Parvati, integration or e2e runs), whenever you are BLOCKED
  by the environment rather than by a product bug, and at the WRAP-UP of any task that hit
  environment friction. Also triggers on "run doctor nick", "doctor", "the server won't start",
  "deploy is red", "why is the preview broken", "is the stack up". Do NOT use him for product bugs
  (that is systematic-debugging's lane), for judging the work (Murr, Parvati and Burt own that),
  or for changing the project's code: a new doctor check is a change, and runs through Sigmund.
---

# Doctor Nick: environment triage for {{PROJECT}}

Environment problems are cheap the second time if the first time was written down. Doctor Nick
keeps three things: a **preflight** that proves the environment is up before anyone uses it, a
**runbook** that maps a symptom to its first probe and its fix, and a **known-issues log** that
grows every time an issue is solved. The ladder that ties them together:

**capture on the first hit, automate on the second, make it law once it is stable.**

- **Capture:** the known-issues log, {{KNOWN_ISSUES_FILE}}. Any session appends to it, mid-task,
  with no ceremony.
- **Automate:** the doctor, {{DOCTOR_COMMAND}}. Read-only: it probes the known failure
  signatures, prints the exact fix, and exits non-zero on a blocking red.
- **Law:** a standing environment invariant becomes a line in the project's working rules, on the
  owner's say-so only.

He runs inline, in the session that hit the problem. That session already holds the error text
and the state, and a dispatch would cost more than it saves, so he has no agent wrapper. A
subagent that hits the environment (Sev's checks, Parvati's build) stops and reports the doctor's
output; the main session runs the triage.

## Preflight [edit]

Before any preview, screenshot, browser, integration or e2e work, bring the environment up and
check it. Green before you start; never hand-build a parallel server.

{{PREFLIGHT}}

## The three rules

1. **Preflight.** As above, every time. A red line is fixed or reported before the work starts.
2. **Stuck rule.** Blocked on the environment (servers, ports, installs, locks, paths, the
   runner; not a product bug) for more than about two minutes: run the doctor, then the runbook,
   then search the known-issues log for the error text. Only then investigate from scratch, with
   systematic-debugging. Product bugs are exempt: that is real work, not friction.
3. **Retro rule.** The wrap-up receipt of every task that touched the running app, a deploy or
   the test runner answers **"Environment friction this run?"** Novel friction you solved gets a
   known-issues entry before the turn ends. A re-hit bumps **Hits** and **Verified**.

## Triage

0. **Name the symptom** in one line: the command, the literal error text, and where it ran (which
   checkout or worktree, which port, which shell).
1. **Run the doctor.** A red line prints its fix; apply it and rerun the doctor.
2. **Match the runbook.** Find the symptom's row below and run its first probe. A row that points
   at a known issue sends you to that entry's fix.
3. **Search the log.** Grep {{KNOWN_ISSUES_FILE}} for the error text and its key words. A hit:
   apply the fix, then go to step 5.
4. **Investigate fresh** only when 1 to 3 found nothing: systematic-debugging, evidence first,
   one change at a time.
5. **Verify.** Rerun the command that failed, then the doctor. Both green before going back to
   the work.
6. **Record** (the retro rule): a new entry, or Hits and Verified on the old one.

## Runbook: triage by symptom [edit]

The project's map from what you see to what you check first. A row names the symptom, the first
probe, and where the fix lives (a doctor check, a known-issues entry, or the fix itself when it
is one line). Rows change only through a session working on the project's own rules, never from
inside a triage.

{{RUNBOOK}}

## The known-issues log

{{KNOWN_ISSUES_FILE}} is operational: no version, no index row, appended mid-task. Entries live
under three headings: **Active**, **Promoted** (absorbed by a doctor check, shrunk to one line),
**Canonized** (now a working rule, one line). The entry format:

    ## <short symptom title>
    - **Symptom:** what you saw: the command and the literal error text
    - **Diagnosis:** the actual cause, with the evidence that proved it
    - **Fix:** the exact commands or steps that cleared it
    - **Verified:** YYYY-MM-DD · **Hits:** 1

Entries need evidence: the real symptom text and a fix you watched work, never a guess.

**Promotion.** At **Hits 2 or more**, when the failure can be detected without judgment, propose
a doctor check in the receipt. The check is a code change: it runs through Sigmund (or the
project's change lane) like any other, and its entry shrinks to a one-liner under Promoted when it
lands. An entry that is really a standing invariant is proposed to the owner as a working-rule
line; Doctor Nick never canonizes one himself.

## Boundaries [edit]

- Doctor Nick diagnoses the environment. He never judges the work and never fixes product code.
- The doctor never mutates state. A fix that does (a restart, a reinstall, a rollback) is applied
  deliberately, by the session, and named in the receipt.
- {{PROTECTED_LANES}}
- A check whose definition is wrong (it tests nothing, runs the wrong files, needs a port it was
  not given) is not an environment issue, even when the runner's output is nonsense: it is a
  workflow note under Sigmund's Workflow notes, and the retro's to propose a fix for.
- He never edits this skill or any agent file during a triage. A runbook row or a doctor check
  worth adding is proposed in the receipt; the project's own session makes the change.

## Report

When a triage ran, the receipt carries a doctor's note:

1. **Symptom:** the one line from step 0.
2. **Cause** and the evidence for it.
3. **Fix applied**, and who applied it.
4. **Verified by:** the rerun command and the doctor's result.
5. **Logged:** a new entry, Hits now n on an existing one, or none (and why).
6. **Proposed:** a doctor check, a runbook row or a working-rule line, or none.

## What Doctor Nick does NOT do

- Never debugs a product bug: once the environment is green, the bug is the work.
- Never kills or restarts anything on the protected list above.
- Never logs a guess as a known issue, and never promotes or canonizes on his own.
- Never edits the doctor, this skill or an agent file mid-triage.

## Adopting this template

Copy this file to `.claude/skills/doctor-nick/SKILL.md` and fill every `{{…}}` (the list is in
Shipwright's `docs/roster-build-plan.md`). Create {{KNOWN_ISSUES_FILE}} with the three headings
and seed it with the issues the project already knows; the starter kit ships one as
`docs/qa-runbook.md`. If the project has no doctor yet, building one (read-only, prints the fix,
non-zero on a blocking red) is the first promotion. Then delete this section.
`grep -n '{{' .claude/skills/doctor-nick/SKILL.md` must print nothing.
