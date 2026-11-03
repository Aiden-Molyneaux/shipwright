# shipwright

Shipwright is a toolkit for building an app with Claude Code, from the first idea to a live
release, when you are the only person reviewing the work. It gives the agent a lean set of
project docs to work from, skills that review its output, subagents that build and check a
change, and a few owner gates where you decide what ships.

I built it because an agent left to itself decides what "done" means, and the owner finds out at
review time. Shipwright writes the quality bar down before the work starts, makes the agent check
its own work against that bar before you see it, and saves your attention for the calls an agent
review can't make: taste, money, auth and anything irreversible.

**The philosophy, in one line:** define the quality bar explicitly (acceptance criteria), make
the agent think to that bar by default (cognitive skills), make it verify its own work against
the bar (the reviewers) before the owner ever sees it, and hand the owner a walkthrough at every
gate so reviewing never means guessing.

It started as the doc graph, guardrails and testing mechanisms of InGame, one of my spec-first
app projects. Shipwright is the general version: leaner (about nine living docs), fitted to any
app through a ten-question Day-One profile interview, and with nothing hardcoded from InGame.
I now use it across my own projects, which adopt its templates and pull later changes
through the template sync.

## The packages

| Package | What it is | Start at |
|---|---|---|
| [`starter-kit/`](starter-kit/README.md) | The repo skeleton a new app copies on Day One: the lean doc graph (spec, API contract, UI requirements with acceptance criteria, design system, conventions, roadmap, decisions, the open-questions inbox, testing strategy), CLAUDE.md and AGENTS.md, the mockup convention, the lifecycle playbook (Day One to live), the config-free health check, and the context-nudge hook with its `.claude/settings.json` | its README's scaffold procedure |
| [`skills/`](skills/README.md) | The **reviewers** (burt for design files, parvati for the running app, murr for code), the **AC spine** (ac-author, acceptance-walkthrough), the **cognitive family** (ui-craft, spec-elicitation, failure-first), **britch** (the idea gate before scaffolding), the roster's skills (**sigmund** runs one change end to end, **doctor-nick** fixes a broken environment, **retro** proposes fixes to the workflow itself), and two templates for writing new skills | the lane table |
| [`agents/`](agents/README.md) | The roster's subagent wrappers: **sev** (builds from an approved plan), **moh** (read-only lookup), **murr** and **parvati** (thin wrappers over their skills, parvati in isolated-build or shared-preview mode). They are copied into `.claude/agents/` and dispatched by sigmund | its install list |
| [`templates.json`](docs/template-sync.md) + [`scripts/template-sync.mjs`](scripts/template-sync.mjs) | The template sync. A project records the Shipwright commit and the fills each copy came from in `.claude/shipwright.json`, and the script three-way merges later template changes into its filled copies (`git merge-file`), run from that project's own session. `--check` says how far behind it is | [`docs/template-sync.md`](docs/template-sync.md) |
| [`testing-kit/`](testing-kit/README.md) | The sturdy-legs mechanisms: the boot-time authz-test enforcer (`defineRoute`), the concurrency-race harness, the containerized real-DB harness and the fail-closed destructive-DB guard | its install checklist (phase P1) |
| [`dashboard/`](dashboard/README.md) | The owner cockpit: a local web app with no dependencies that renders the doc graph for a human to read. It shows the owner decision ledger, surface status with click-to-open mockups, phase progress, health, and a trace for any stable ID (spec, API, design, mockup, code, test, decision) | `node dashboard/server.mjs <projectRoot>` |
| [`docs/`](docs/library/roster.md) | The reference pages: the roster (who owns what and what each member never does), the two lifecycles, one page per roster member, the roster spec and build plan, and the template sync design | [`docs/library/roster.md`](docs/library/roster.md) |

[`DECISIONS.md`](DECISIONS.md) is the build record: what each package chose, assumed, and
deliberately deferred.

## How the work runs

There are two lifecycles, one inside the other
([`docs/library/lifecycle.md`](docs/library/lifecycle.md)).

The project lifecycle takes an app from idea to live in seven stages (0 Scaffold to 6 Live), with
an owner gate at the end of each. No gate passes out of order, and no code is written before the
architecture lock at G-3.

From Stage 4 on, every change runs through Sigmund, even a one-line fix. He clarifies the request
and agrees with you what you will check, writes the plan, has Sev build it, reruns the checks
himself, sends the diff to Murr and each visible change to Parvati, then hands you a receipt with
a walkthrough and stops. The merge waits for your go-ahead, and the change is done once every
criterion has passed or you have waived it.

## Requirements

- Claude Code. The skills and agents are Claude Code features. A harness that reads `AGENTS.md`
  instead (OpenCode, Codex) can follow the starter kit and run each skill's method by hand.
- git and Node. The health check, dashboard and template sync are plain Node scripts with no
  dependencies.
- For the testing kit's real-DB harness: Docker, plus `testcontainers` and
  `@testcontainers/postgresql` as dev dependencies.
- The agent wrappers pin `claude-sonnet-5-5` and `claude-haiku-5-5`; Sigmund and Retro expect an
  Opus 5.5 main session. Sigmund's phases use the superpowers skills (brainstorming,
  writing-plans and others) where they fit.

Sigmund keeps no state between sessions. In my projects that continuity lives in
[InProgress](https://github.com/Aiden-Molyneaux/InProgress), and the templates' "tracked session"
lines only apply when a project uses it.

## Quick start (a new app)

1. Run the **britch** idea gate, and scaffold only on a PROCEED. Britch runs before the repo
   exists, so install it in your user scope (`~/.claude/skills/britch/`).
2. Copy `starter-kit/`'s contents into a fresh repo and the project-scoped skills into
   `.claude/skills/`, then follow its README's Day-One procedure (the ten-question interview,
   fill, health check green, gate G-0).
3. Follow [`starter-kit/lifecycle-playbook.md`](starter-kit/lifecycle-playbook.md) stage by
   stage. The testing kit installs at P1. Point the dashboard at the repo from day one.
4. Before the first change in Stage 4, adopt the roster: copy `skills/sigmund/`,
   `skills/doctor-nick/` and `skills/retro/` and the agent wrappers
   ([`agents/README.md`](agents/README.md) has the steps), fill every `{{…}}` and `[edit]`
   section, add Sigmund's one line to the project's CLAUDE.md, and record what you adopted in
   `.claude/shipwright.json` so the template sync can bring later changes in.

## Development

The template sync has a `node:test` suite, run with `node --test scripts/`. It builds throwaway
Shipwright and project repos in the OS temp folder.

## Licence

MIT
