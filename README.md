# shipwright

A portable toolkit that lets **Claude (Opus-class) drive an app from Day One to
launched-and-live** — spec-first, design-first, robustness-first — with a solo owner reviewing at
a few well-chosen gates while the pipeline carries everything else.

**The philosophy, in one line:** define the quality bar explicitly (acceptance criteria) → make
the agent think to that bar by default (cognitive skills) → force the agent to self-verify
against the bar (the reviewer trio) before the owner ever sees the work → hand the owner a
walkthrough at every gate so reviewing never means guessing.

Generalized from **InGame**, a real spec-first project whose doc graph, guardrails, and testing
mechanisms this toolkit distills — leaner (~9 living docs), parameterized to any app via a
Day-One profile interview, and never hardcoded to its source.

## The packages

| Package | What it is | Start at |
|---|---|---|
| [`starter-kit/`](starter-kit/README.md) | The repo skeleton a new app clones on Day One: the lean doc graph (spec · contract · ui-requirements+AC · design-system · conventions · roadmap · decisions · inbox · testing-strategy), CLAUDE.md/AGENTS.md, the mockup convention, the lifecycle playbook (Day One → live), and the config-free health check | its README's scaffold procedure |
| [`skills/`](skills/README.md) | Three classes: the **reviewers** (burt — design files · parvati — running app · murr — code) + the **AC spine** (ac-author · acceptance-walkthrough) + the **cognitive family** (ui-craft · spec-elicitation · failure-first), plus **britch** (the pre-scaffold idea gate) and both templates | the lane table |
| [`agents/`](agents/README.md) | The roster's subagent wrappers: **sev** (builds from an approved plan) · **moh** (read-only lookup) · **murr** and **parvati** (thin wrappers over their skills, parvati in isolated-build or shared-preview mode) — copied into `.claude/agents/` and dispatched by **sigmund** | its install list |
| [`testing-kit/`](testing-kit/README.md) | The sturdy-legs mechanisms: the boot-time authz-test enforcer (`defineRoute`), the concurrency-race harness, the containerized real-DB harness, the fail-closed destructive-DB guard | its install checklist (phase P1) |
| [`dashboard/`](dashboard/README.md) | The Owner cockpit: a dep-free local web app that renders the doc graph human-readable — owner decision ledger, surface status with click-to-open mockups, phase progress, health, and click-any-stable-ID tracing (spec → api → design → mockup → code → test → decision) | `node dashboard/server.mjs <projectRoot>` |

[`DECISIONS.md`](DECISIONS.md) is the build record: what each package chose, assumed, and
deliberately deferred.

## Quick start (a new app)

1. Run the **britch** idea gate; scaffold only on a PROCEED.
2. Copy `starter-kit/`'s contents into a fresh repo + the project-scoped skills into
   `.claude/skills/`; follow the README's Day-One procedure (the 10-question interview → fill →
   health-check green → gate G-0).
3. Follow [`starter-kit/lifecycle-playbook.md`](starter-kit/lifecycle-playbook.md) stage by
   stage; the testing-kit installs at P1; point the dashboard at the repo from day one.
