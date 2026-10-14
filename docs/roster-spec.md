# Agent roster spec

Status: approved by Aiden (step #416, 2026-10-13). The templates are built from it
(#417 Sigmund, #418 the four agents) and the review lessons fold into Murr and Parvati (#419).

The roster is five members that every codebase carries in the same shape. Shipwright holds the
templates; each project copies them and fills in its own edit points. Decisions and their sources
are in r218 on #415 (`2026-10-13-agent-roster-decisions.md`).

## 1. The roster

| Member | Lane | Runs as | Default | Lives at (in a project) |
|---|---|---|---|---|
| **Sigmund** | Facilitates one change end to end: clarify, plan, build, verify, review, ship. Holds model routing and the overrides. | Skill, loaded into the main session | Main session on Opus 5.5, effort high | `.claude/skills/sigmund/SKILL.md` |
| **Sev** | Builds exactly what an approved plan says. Stops at any question. | Subagent | `claude-sonnet-5-5`, medium | `.claude/agents/sev.md` |
| **Moh** | Read-only lookup across files: callers, usages, inventories, pattern sweeps. | Subagent | `claude-haiku-5-5`, low | `.claude/agents/moh.md` |
| **Murr** | Adversarial code review, runtime bugs first, then debt. | Thin agent wrapper + the `murr` skill | `claude-sonnet-5-5`, high | `.claude/agents/murr.md` + `.claude/skills/murr/` |
| **Parvati** | A built screen against intent: Flag, Expected, Polish. | Thin agent wrapper + the `parvati` skill | `claude-sonnet-5-5`, medium | `.claude/agents/parvati.md` + `.claude/skills/parvati/` |
| **Doctor Nick** | Triages a broken environment: preflight, a runbook by symptom, a known-issues log that grows with each fix. | Skill, loaded inline in the session that hit the problem; no wrapper | The session's own model | `.claude/skills/doctor-nick/SKILL.md` + the project's known-issues file |

What each one never does:

- **Sigmund** never merges to the production branch or deploys without the owner's explicit
  go-ahead, never answers pure codebase questions (no change, no Sigmund), and never carries
  state across sessions. Continuity belongs to InProgress (the tree and mip-orc).
- **Sev** never plans, designs or picks an approach. If the plan is ambiguous, contradicts the
  code, or needs something it does not name (a dependency, a migration, a deletion), Sev stops
  and reports the question. Never commits, pushes, stashes, resets, checks out or deploys.
- **Moh** never edits, suggests fixes or judges quality. A question that needs judgment is not
  Moh's; it goes back to the main session.
- **Murr** never edits, never reviews visuals, and never passes a diff without naming what he
  probed. A diff-only review (call sites unopened) is not a valid Murr run.
- **Parvati** never edits, never clicks anything that writes data, and never reviews code
  correctness. A screen reviewed only at rest is a partial review and is labelled as one.
- **Doctor Nick** never debugs a product bug, never logs a guess as a known issue, and never
  edits the doctor, his own skill or an agent file mid-triage: a new doctor check is a change and
  runs through Sigmund. (Added 2026-10-14, step #431.)

Shared law, unchanged from the reviewer trio: reviewers report, the main session fixes. Subagent
claims are not evidence. Sigmund reruns Sev's checks and reads the diff, opens every Murr and
Parvati `file:line` before acting on it, and spot-checks the files Moh names.

## 2. Sigmund

### Description (the router)

Sigmund is the front door for all change work in the repo: fixes, tweaks, features, refactors,
"the X page looks wrong". Even a one-line fix runs through him, because the lifecycle is the
point, not the ceremony. Negative scope: pure questions about the codebase, operating the deployed
app, work in other repos, and Stages 1 to 3 of the lifecycle playbook (spec, design, plan), which
keep the playbook's own routing.

### Phases

The template keeps Spez's shape, generalised. Phases marked **[edit]** carry project sections.

0. **Intake and clarify.** Restate the request. Ask only genuine ambiguities (scope, UX choices
   with several defensible answers, data-model choices and their migration cost), batched, with
   a recommended option first. Read the code instead of asking what it answers. Triage per the
   project's working rules: a behavior change is a spec change first.
1. **Branch** **[edit]**. Check the tree is clean of work Sigmund didn't create. Then the
   project's branch model: work on an integration branch (InThink's `staging`) or a branch or
   worktree per change (InProgress).
2. **Plan.** Small fixes stay in the main session; a dispatch costs more than it saves. Anything
   bigger gets a written plan that Sigmund owns: the approach, the files, the checks. Sev builds
   only from that plan.
3. **Build.** In the main session, or Sev with the plan, the scope and the port lane.
4. **Verify** **[edit]**. Sigmund reruns the checks himself and reads the whole diff. The
   project's verify commands; UI verification only on the project's verify ports.
5. **Review.** Murr on every diff, always. Parvati on meaningful UI work (a new page, section or
   reworked layout; not trivial tweaks). Fix red and orange findings, re-run to clean. Debt,
   owner-calls and polish notes go in the receipt, not silently dropped.
6. **Ship to integration** **[edit]**. The project's push policy: when Sigmund pushes on his own
   judgment and when he asks first (InThink: migrations, deletions, scope growth, auth and the
   data machinery).
7. **Present and wait.** The receipt: what changed (files as links), evidence (check output,
   Murr's verdict, Parvati's verdict), judgment calls, any model override and its reason, and
   the risk statement **[edit]**, present even when "none". Then stop.
8. **Merge or deploy on go-ahead only** **[edit]**. The project's gate (InThink's backup gate),
   PR shape and who clicks merge. Silence, or approval of the integration push, is never merge
   approval.

### Model routing (lives in Sigmund only)

| Member | Default | Dispatch when |
|---|---|---|
| Moh | Haiku, low | The answer means reading across several files |
| Sev | Sonnet, medium | A written plan exists for a multi-file change |
| Murr | Sonnet, high | Every diff, before the integration push or merge |
| Parvati | Sonnet, medium | Meaningful UI work, before the integration push or merge |

Dispatch rules:

- When another skill dispatches an implementer or reviewer (superpowers'
  subagent-driven-development, requesting-code-review), use these members, never
  `general-purpose` or `Explore`: both inherit the main session's Opus.
- Give each dispatch its scope, the request it serves, and its worktree and port lane where the
  project has them. Send fixes back to the same Sev with SendMessage rather than spawning a new
  one.
- Agent frontmatter pins full model IDs. Overrides on the Agent call use aliases only (`haiku`,
  `sonnet`, `opus`, `fable`).

### Overrides

The generic rules are fixed in the template. The two lists they reference are project edit points.

- **Murr to `opus`** when the diff touches anything on the project's **risk list** (§4), and for
  his main pass on any element built around async writes, a save queue, or focus management.
  Display-only UI, CLI output, docs, tests and scripts stay on Sonnet.
- **Murr to `haiku`**, brief says *proportional*, for the re-check after fixing his findings, when
  the fix diff is small and adds no code paths.
- **Sev to `opus`**, or Sigmund takes the work back, when Murr returns a blocker or major on the
  same element twice, or when the plan centres on anything on the project's **hard-ordering
  list** (§4).
- **Moh is never overridden upward.** Judgment goes to the main session.
- **Parvati stays on Sonnet.** Her safeguard is listing every state first, not a bigger model.
- **Fable** only when the owner asks.

Every override is named, with its reason, in the receipt (phase 7). A tracked session also logs
it on its step.

### The CLAUDE.md line

Routing leaves CLAUDE.md so that orchestrator and research sessions never load it. CLAUDE.md
keeps one line, in its working rules:

> Change work runs through Sigmund (`.claude/skills/sigmund/`). Routing, overrides and the ship
> gates live there.

Handoffs for change work name Sigmund in their first line, after the model line (for example:
"Pick Opus 5.5, effort high. Run this through Sigmund."). A side effect: Sev's and Murr's
prompts no longer need InProgress's "CLAUDE.md's routing sections are for the main session"
caveat.

## 3. The four agents

All four follow the thin-wrapper shape: frontmatter (model, effort, maxTurns, color, tools),
then only the rules for running as a subagent. Where a skill holds the method, the wrapper
preloads it (`skills: murr`) and says the skill is the source of truth.

| | Sev | Moh | Murr | Parvati |
|---|---|---|---|---|
| tools | Read, Write, Edit, Glob, Grep, Bash, PowerShell | Read, Glob, Grep | Read, Glob, Grep, Bash (read-only commands) | mode-dependent, below |
| maxTurns | 60 | 20 | 40 | 50 |
| color | green | cyan | red | purple |
| omitClaudeMd | no (house rules apply to him) | yes | no (house rules are what he checks) | yes in isolated mode |
| report | Status, Files changed, Checks (raw output), Deviations, Open questions | findings with `file:line`, then "searched, not found" | the `murr` skill's format | the `parvati` skill's format |

Sev's description says plainly that he does not propose approaches, so nobody confuses him with
cad-dev-loop's Sev (§5).

**Parvati's two modes.** The template carries both; a project keeps one.

- **Shared preview** (InThink): a dev pair the owner keeps running on reserved ports. She drives
  it with the Claude Browser tools, signs in with an in-page fetch, never starts servers.
- **Isolated build** (InProgress): she builds the branch into a scratch folder, runs it on a port
  from her lane with scratch data, seeds through the API, and drives it with Playwright. Needed
  when parallel sessions would otherwise share one preview. Tools: Read, Write (scratch folder
  only), Glob, Grep, Bash, PowerShell.

In both, the wrapper overrides the skill's "run inline" note (she captures her own screenshots),
opens every interactive state at every viewport, and lists the states she could not reach.

**Calling them yourself.** Every member works without Sigmund.

- Any of the four agents: name it in a request ("have Moh find every caller of X", "get Murr on
  this diff") or @-mention it. It runs as a subagent on its pinned model and hands back a report.
- Murr and Parvati can also run inline, because their method lives in a skill: `/murr` or
  `/parvati` loads it into the current session, on that session's model. Use it to watch the
  review happen; use the agent when only the report matters.
- Sev and Moh have no skill, so there is no `/sev` or `/moh`. Running them inline would just be
  the main session doing the work itself.
- `/sigmund` loads Sigmund. cad-dev-loop's is always `/cad-dev-loop:sigmund`.

## 4. Edit points per project

What a project fills in when it adopts the templates. Each template marks these sections the same
way the starter kit does (`{{…}}` placeholders inside clearly headed project sections).

| Edit point | Where it lands | InThink | InProgress |
|---|---|---|---|
| **Paths**: repo map, house-rule files, excluded dirs | Sev "Before writing code", Moh's opening line and exclusions | `server/`, `web/`; `web/CLAUDE.md` for UI | `src/*`, `web/src`; skip `dist`, `.build`, worktrees |
| **Ports**: owner's, verify, per-agent lanes | Sigmund verify, Sev rules, Parvati setup | owner 3000/5173; alt pair 3010/5180 | Parvati 4400-4409; Sev e2e 4410-4419 |
| **Checks**: verify commands | Sigmund verify, Sev checks, Murr's read-only list | `npm test -w server/web`, `tsc` | `npm run typecheck`, `npm test`, named e2e |
| **Deploy target and ship gates** | Sigmund phases 1, 6, 8 | push `staging`; Railway deploys `main`; backup gate | branch per change; `npm run deploy` after merge |
| **Risk statement**: the unrecoverable thing | Sigmund prime law and phase 7 | production SQLite on Railway | `~/.inprogress` and the live window |
| **Risk list** (Murr to Opus) | Sigmund overrides, Murr skill's project risks | migrations, auth, backups, ops/data | db, hooks, MCP, concurrency, focus and keyboard |
| **Hard-ordering list** (Sev to Opus) | Sigmund overrides | async ordering, multi-step writes, gesture state | hook ordering, transactions, migrations, cross-session races |
| **Design authority** | Parvati's skill authority order, Sev's UI rules | `web/CLAUDE.md` (Marathon) and sibling pages | the window's existing screens (no mockups) |
| **Parvati mode, viewports, sign-in** | Parvati wrapper | shared preview; 1920×1080, 402×874; in-page login | isolated build; 520×900, 1440×900; none |
| **Forbidden commands** | Sev and Murr rules | destructive SQL on `data/inthink.db` | `deploy`, `claude:install`, live server |

A project without Shipwright's doc graph (InProgress, InThink) edits the authority sections of
the `murr` and `parvati` skills to point at what it does have. That is already how InThink's
copies work.

## 5. Naming against cad-dev-loop

cad-dev-loop (vps-claude-skills) stays as it is. Same names, different scope:

| Shipwright | cad-dev-loop | Difference |
|---|---|---|
| Sigmund: one change, one session | Sigmund: Delivery Lead, one Jira task across sessions via per-task ledgers | Shipwright leaves continuity to InProgress; no ledgers |
| Sev: builds from Sigmund's approved plan | Sev: explores, proposes the approach, then implements | Approach and design belong to Shipwright's Sigmund |
| Murr: code review | Ellie: Genero4GL convention review for CAD | Murr kept: InThink and InGame already use him |
| Moh, Parvati | none | |

**Trigger collision.** cad-dev-loop is a user-scope plugin, so `cad-dev-loop:sigmund` is visible
in every repo, beside a project's own `sigmund`. Its description triggers on generic phrases
("drive this to done", "what's next on this task"). Shipwright's description should name the
repo ("change work in this repo") and leave Jira, tickets and ledgers out, so a non-Versaterm
repo routes to the local one. cad-dev-loop stays enabled everywhere (Aiden, 2026-10-13), so the
description is the only guard. The collision touches loose phrasing only: agents and skills are
separate namespaces (Sigmund dispatching `sev` can never reach cad-dev-loop's Sev skill), and a
handoff that names Sigmund in its first line loads the local one on purpose. Worth one test after
#417 lands: ask "drive this to done" in InThink and see which loads.

## 6. Where the templates live in Shipwright

- `skills/sigmund/SKILL.md`: a fourth class beside the reviewers, the AC spine and the cognitive
  skills, the facilitator. Gets its own section and row in `skills/README.md`.
- `agents/{sev,moh,murr,parvati}.md`: a new top-level package, installed by copying into
  `.claude/agents/`. Gets a row in the root README's package table.
- `skills/murr`, `skills/parvati`: existing; #419 folds in the review lessons (list every UI state
  before reading code; open every interactive surface; isolated-build mode).
- `starter-kit/CLAUDE.md` gets the one Sigmund line; `starter-kit/AGENTS.md` gets the manual
  fallback for Sigmund, Sev and Moh.
- `skills/doctor-nick/SKILL.md`: the existing QA-loop skill, rebuilt as a roster template
  (2026-10-14, #431). No agent wrapper: he runs in the session that hit the problem.
- `DECISIONS.md` gets one entry per template package, as usual.

Rollout to InThink, InProgress and InGame goes through each project's own session, from the
templates, never by copying over their edited files (order in r218).

## 7. Review decisions (Aiden, 2026-10-13)

1. **Parvati's default mode:** isolated build; shared preview is the documented alternative.
2. **Sigmund before Stage 4:** no. Sigmund covers code changes from Stage 4 on. Stages 1 to 3
   (spec, design, plan) keep the playbook's own routing (spec-elicitation, ac-author, burt), since
   Sigmund's lifecycle assumes code exists.
3. **Fable:** only when the owner asks.
4. **Moh's `omitClaudeMd`:** `true`. His own file carries the short repo map; the house rules
   never change a lookup's answer.
5. **cad-dev-loop:** left as is, enabled in every repo.
