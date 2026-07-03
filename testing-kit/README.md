# testing-kit — the sturdy-legs mechanisms

The reusable code behind `docs/testing-strategy.md` §6 (the starter kit's doc — the *policy*;
this directory is the *machinery*). Installed at the tooling phase (P1), backend projects only —
a backend-less app keeps the strategy doc (client testing still applies) and skips these files.

**The point of the kit:** the disciplines that matter — every mutating route has an authz test,
every once-only invariant is race-tested, destructive runners can't hit prod, risk domains carry
ID-tagged tests — decay when they depend on remembering. Each mechanism here makes one of them
**structural**: the app throws at boot, the guard fails closed, the health check counts the tags.

## Contents → where they land

| File | Mechanism | Install to |
|---|---|---|
| `defineRoute.ts` | routes are a data structure; a mutating/**cross-principal** route **throws at construction** without a named authz test | `src/http/` (or equivalent) |
| `authz-coverage.test.ts` | the inventory-vs-suite diff: every named authz test exists in the suite (no phantom guards) — TEMPLATE, fix its two import paths | the integration-test dir |
| `concurrency.ts` | the race harness: N parallel identical calls → exactly one winner, typed-4xx losers, **zero 500s** | test helpers |
| `pg-harness.ts` | throwaway containerized Postgres + real migrations per suite | test helpers |
| `destructive-guard.ts` | fail-closed allowlist: destructive runners refuse any DB not positively marked disposable | `src/db/` — called FIRST in every reset/truncate/seed runner |

Plus one convention that needs no code: **ID-tagged describes** —
`describe('SYS-07: actor B cannot touch actor A', …)` — which the starter kit's health check
greps against the strategy doc's §3 risk shortlist and reports per-ID (a presence line, never a
coverage %).

## The honesty chain (who guards what)

1. `defineRoute` — you can't **define** an unguarded route (boot-time throw).
2. `authz-coverage.test.ts` — you can't **merge** a phantom guard (the named test must exist).
3. **murr's anti-padding tripwire** — the named test must be **honest** (it really hits the route
   as actor-B and asserts the 4xx/limited shape; a name-match around a 200 is padding). Mechanics
   can't read intent — the last mile is the reviewer.

## Stack-swapping (keep the mechanism, replace the flavor)

These files are TypeScript + Express + vitest-style + Postgres because the reference project is —
but each mechanism is a *spec* its header comment states plainly. Swap points:

- **Framework:** only `mountRoutes()` (and the handler type) knows Express — rewrite that one
  function for Fastify/Hono/Koa; `defineRoute`'s invariant ports untouched.
- **Test runner:** nothing here is vitest-specific except the template test's imports;
  `concurrency.ts` throws plain Errors on purpose (works under jest/node:test unchanged).
- **Database:** `pg-harness` swaps to any testcontainers module (or a raw `docker run` +
  ready-poll); `destructive-guard` only parses a URL — adjust the name-prefix regex to taste.
- **Language:** for a non-TS stack, port the four header-comment specs; the mechanism (inventory
  as data · construction-time throw · allowlist guard · parallel-fire assert) is the deliverable,
  not the syntax.

## Install checklist (P1)

1. Copy the five files per the table; fix `authz-coverage.test.ts`'s two paths.
2. Wire `assertDisposableDb()` as the FIRST line of every destructive runner — then **watch it
   fire once** against a fake prod URL (a guard nobody has seen fire is a hope, not a guard).
3. Define every route through `defineRoute` from the first endpoint — retrofitting is the thing
   this kit exists to avoid.
4. Fill `docs/testing-strategy.md` §3 (the risk shortlist) and run the health check — its
   risk-ID line goes live as soon as test files exist.
