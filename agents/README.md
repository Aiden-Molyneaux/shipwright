# Agents: the roster's subagent wrappers

Four members of the roster run as Claude Code subagents, so their reasoning stays out of the main
session's context. Sigmund (`skills/sigmund/`) dispatches them; each also works on its own. The
spec is `docs/roster-spec.md`. Doctor Nick (`skills/doctor-nick/`) is on the roster too but has
no wrapper: he triages the environment inline, in the session that hit the problem. A subagent
that hits a broken environment stops and reports the doctor's output.

## The roster

| Member | Lane | Model | File |
|---|---|---|---|
| **Sev** | Builds exactly what an approved plan says. Stops at any question. | `claude-sonnet-5-5`, medium | `sev.md` |
| **Moh** | Read-only lookup across files: callers, usages, inventories, pattern sweeps. | `claude-haiku-5-5`, low | `moh.md` |
| **Murr** | Adversarial code review, runtime bugs first, then debt. | `claude-sonnet-5-5`, high | `murr.md` + the `murr` skill |
| **Parvati** | A built screen against intent: Flag, Expected, Polish. | `claude-sonnet-5-5`, medium | `parvati-isolated.md` or `parvati-shared.md` + the `parvati` skill |

What each one never does:

- **Sev** never plans, designs or picks an approach, and never commits, pushes, stashes, resets,
  checks out or deploys. (cad-dev-loop's Sev proposes approaches; this one does not.)
- **Moh** never edits, suggests fixes or judges quality.
- **Murr** never edits, never reviews visuals, and never passes a diff without naming what he
  probed.
- **Parvati** never edits, never clicks anything that writes data, and never reviews code
  correctness. A screen reviewed only at rest is labelled a partial review.

Shared law: reviewers report, the main session fixes. Subagent claims are not evidence.

## The wrapper shape

Frontmatter (name, description, full model ID, effort, maxTurns, color, tools, and
`omitClaudeMd` where the house rules never change the answer), then only the rules for running as
a subagent. Where a skill holds the method (Murr, Parvati), the wrapper preloads it with
`skills: <name>` and says the skill is the source of truth.

| | Sev | Moh | Murr | Parvati |
|---|---|---|---|---|
| tools | Read, Write, Edit, Glob, Grep, Bash, PowerShell | Read, Glob, Grep | Read, Glob, Grep, Bash (read-only commands) | isolated: Read, Write (scratch only), Glob, Grep, Bash, PowerShell; shared: Read, Glob, Grep and the Claude Browser tools |
| maxTurns | 60 | 20 | 40 | 50 |
| color | green | cyan | red | purple |
| omitClaudeMd | no | yes | no | isolated: yes; shared: no |
| report | Status, Files changed, Checks (raw output), Deviations, Open questions | findings with `file:line`, then "searched, not found" | the `murr` skill's format | the `parvati` skill's format, plus the states not reached |

## Install

1. Copy `sev.md`, `moh.md` and `murr.md` into the project's `.claude/agents/`.
2. Copy one Parvati wrapper as `.claude/agents/parvati.md`: `parvati-isolated.md` by default
   (see below), `parvati-shared.md` when the owner keeps a dev pair running.
3. Copy `skills/murr/` and `skills/parvati/` into `.claude/skills/` if the project does not have
   them yet; the wrappers preload them by name.
4. Fill every `{{…}}` in the copied files and reword each `[edit]` section where the project's
   rules differ. The placeholder list is in `docs/roster-build-plan.md`.
   `grep -rn '{{' .claude/agents .claude/skills` must print nothing when you are done.
   An agent's `description:` is one line; double-quote it if it holds ": " (Moh's does),
   because a plain YAML scalar cannot, and an agent whose frontmatter fails to parse never
   loads. `grep -n '^description: [^">|].*: ' .claude/agents/*.md` must print nothing.
5. Projects whose tests forbid em dashes (InProgress) strip them from the copied `murr` and
   `parvati` skills; the wrappers and Sigmund carry none.

Adopt from these templates, never by copying another project's edited files (spec section 6).

## Parvati's two modes

- **Isolated build** (default): she builds the branch into a scratch folder, runs it on a port
  from her lane with scratch data, seeds through the API, and drives it with Playwright. Needed
  when parallel sessions would otherwise share one preview.
- **Shared preview**: a dev pair the owner keeps running on reserved ports. She drives it with
  the Claude Browser tools, signs in with an in-page fetch, and never starts servers.

In both, the wrapper overrides the skill's "run inline" note (she captures her own screenshots),
she lists every interactive state before opening the app, opens each at every viewport, and lists
the states she could not reach at the top of her report.

## Calling them yourself

Every member works without Sigmund.

- Any of the four: name it in a request ("have Moh find every caller of X", "get Murr on this
  diff") or @-mention it. It runs on its pinned model and hands back a report.
- Murr and Parvati also run inline, because their method lives in a skill: `/murr` or `/parvati`
  loads it into the current session, on that session's model. Use it to watch the review happen;
  use the agent when only the report matters.
- Sev and Moh have no skill, so there is no `/sev` or `/moh`: running them inline would be the
  main session doing the work itself.
- `/sigmund` loads Sigmund. cad-dev-loop's is always `/cad-dev-loop:sigmund`.
