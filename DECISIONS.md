# DECISIONS.md — Package 1 (Foundations: lean doc graph + starter-kit + lifecycle playbook)

What was chosen, assumed, deliberately deferred, and what needs the owner's input. The deliverable
lives in [`starter-kit/`](starter-kit/). Later packages (skills, testing kit, dashboard) should
append their own sections to this file.

## What I chose

- **The doc set (8 living docs + generated dashboard):** `00-INDEX` · `product-spec` ·
  `api-contract` *(deletable)* · `ui-requirements` · `design-system` · `CONVENTIONS` · `roadmap` ·
  `decisions` · `open-questions`, plus generated `HEALTH.md`. That's 9 with a backend, 8 without —
  inside the "~8" target. What got cut from InGame's ~15: `testing-strategy` (folded to a
  CONVENTIONS "Discipline" section; the testing kit package can re-add a doc if it earns it),
  `design-process` + `component-map` + `SCREEN-STATUS` (folded into `design-system` §5 and
  `ui-requirements` §2), `ui-design-requirements`/`design-spec` split (merged — the split only pays
  when a second design agent owns the design-spec), per-file `decisions/` (→ one append-only log;
  InGame's numbered-file collisions and cross-file greps argue for a single file at starter scale),
  `road-to-market` + `implementation-plan` (→ one `roadmap`).
- **Acceptance criteria live inline**: per surface in `ui-requirements` §3 (with an inherited
  always-on set in §1 to prevent restating lifecycle/a11y criteria 20 times), per phase in
  `roadmap` §3, per task in the CONVENTIONS DoD. This is the "define the quality bar explicitly"
  leg of the philosophy.
- **SCREEN-STATUS is reborn as `ui-requirements` §2** with columns Surface/State/Implements-from/
  AC/Spec/Contract — same tripwire mechanic (converged-but-unformalized = tracked debt), one file
  fewer, and the health check parses it by column name.
- **The health check is config-free**: it derives the doc register from 00-INDEX §1 itself (any
  row with a backticked `.md` path + a `**vX.Y**` cell is registered), so deleting `api-contract.md`
  + its row needs no script edit. Added a fourth check InGame doesn't have: a **placeholder scan**
  (`{{…}}` in living docs) that keeps health red until Day-One scaffolding is actually finished —
  this makes "scaffold complete" a gate instead of a vibe.
- **Placeholders are `{{TOKEN}}`-style** and the scaffold rule is "fill it or delete the line" —
  deletion is explicitly part of the design (backend-less apps drop the contract file, CONVENTIONS
  rules 2–4, the Contract column).
- **`decisions.md` gains a `[LOCK]` marker** for owner-signed, painful-to-reverse entries — the
  generalization of InGame's 0046 gate-G-A pattern without a decisions-directory ceremony.
- **The lifecycle playbook is 7 stages (0–6)** with a uniform row contract (entry · produces ·
  guardrail · owner gate · DoD · dashboard), and the reviewer trio referenced generically
  (Burt-class / Parvati-class / Murr-class) since the skills ship in a later package. Arc C
  (Release) and Arc D (Live) are real stages with light inline templates (a release checklist and
  a live-ops digest), not separate docs.
- **AGENTS.md is a thin mirror of CLAUDE.md** (the InGame pattern) and carries the **no-skill-harness
  fallback**: a manual equivalent for each guardrail (the health script runs anywhere; the three
  reviews become documented manual walks). This satisfies the harness-portability requirement
  without duplicating rule text.

## What I assumed

- Delivery location: `toolkit/` at the InGame repo root (untracked; not committed). The toolkit is
  a separate product from InGame and should eventually move to its own repo — I put it here because
  it's the session's working directory and later packages need a shared home.
- The brainstorming skill's interactive gates were overridden by the brief's explicit latitude +
  unattended operation (the skill's own instruction-priority rule); this file is the assumption
  record it would otherwise have produced.
- Health dashboard filename: `docs/HEALTH.md` (shorter than PROJECT-HEALTH.md; one dashboard, one
  name). The register carries it so nobody hand-edits it.
- The starter kit assumes a git repo + Node available for the health script (no other runtime
  dependencies anywhere).

## What I deliberately deferred

- **Skill implementations** (reviewer trio, cognitive skills, /health wrapper) — Package(s) TBD;
  the playbook + AGENTS.md reference them generically so nothing breaks when they land.
- **Testing-kit depth** — CONVENTIONS holds the posture (risk-based, test-first on risk domains,
  no coverage-chasing); the dedicated package decides whether that grows back into a doc.
- **Arc C/D depth** — store-specific checklists (App Store privacy labels, Play data safety),
  monitoring stack choices, incident-response runbooks. The stage templates hold their place.
- **Owner-dashboard package** — `HEALTH.md` is deliberately the only dashboard for now.
- **A worked example** (the kit instantiated for a sample app) — valuable as a fixture/eval for the
  skills package; premature before the skills exist.

## Needs owner input

1. **Where the toolkit lives long-term** — ✅ **RULED (2026-07-03): its own repo, `shipwright`**
   (`C:personalshipwright`, GitHub `Aiden-Molyneaux/shipwright`). *(Originally: uncommitted at
   `toolkit/` in InGame.)*
2. **The merged `ui-requirements`** is the one real structural bet away from InGame's proven shape
   (InGame keeps design-requirements and design-spec separate because two different agents own
   them). If the toolkit should support a dedicated design agent as a first-class role, the split
   should come back — say the word and it's a small change.
3. **Single-file `decisions.md`** trades InGame's per-decision files for lighter ceremony; at ~50+
   decisions the file gets long. Acceptable, or prefer per-file from the start?

---

# Package 2 — The reviewer trio (burt · parvati · murr) + britch + the SKILL template

Deliverable: [`skills/`](skills/) — `burt/`, `parvati/`, `murr/`, `britch/`, `_TEMPLATE/SKILL.md`,
and `README.md` (the lane table + install + "how to write a new reviewer skill"). Package-1 files
updated to wire them in (starter-kit README ×3, lifecycle-playbook trio + Stage-0 entry,
CLAUDE.md self-verify rule).

## What I chose

- **Burt and Parvati are ported, not copied.** Everything InGame-specific became a read of the
  project's own doc graph: Burt's hardcoded F-01..F-09/type-scale/token text → "read
  `design-system.md` §1–§5 and cite *those* rules"; his `preflight.sh` → an in-skill recipe for
  **deriving the grep gauntlet from the §3 token table + the §1 never-list** (a static script
  can't be portable when the rules are per-project; the derivation rule can). Parvati's
  milestone-DoD/SCREEN-STATUS/review-notes references → `roadmap.md` §3 + `ui-requirements.md`
  §2/§3 (the AC now live inline, so she gained "the surface AC" as an explicit fourth reference).
  Kept verbatim because they're the earned lessons: candidates-not-findings, presence-is-not-
  placement, the coherence axis (sanity-check counts), default-to-EXPECTED, run-inline-because-
  subagents-can't-see-images, report-not-edit + fix-then-re-run.
- **Murr's design** anchors on the brief's bar ("would have caught a hardly-works,
  hard-to-refactor rubber-stamped sprint") with three mechanisms: **(1)** a mandatory **concrete
  failure scenario** per runtime finding ("fails when X → Y" — no scenario, no finding; it demotes
  to debt or dies), **(2)** the **anti-rubber-stamp law** — a SOUND verdict must enumerate the
  attack surfaces actually probed, and "probed clean" may list only what was attacked, **(3)**
  **a diff-only review is invalid** — call sites must be opened (that's where races and violated
  assumptions live). Checklist priority: 7 runtime families (edge cases → null/undefined → races →
  error handling → 4xx-not-500 → authz → contract fidelity) before 2 refactorability families
  (coupling, dead code), plus a **test-honesty step** (can the test fail? does the mock hide the
  claimed bug class?) — the rubber stamp is usually the test suite. Severity ladder: 🔴/🟠/🟡 +
  🧹 debt (refactorability, never outranks runtime) + 🤔 owner-call.
- **Britch** (per the owner's rename instruction) generalizes the `validate-idea` command
  (`~/.claude/commands/validate-idea.md`) into a house-style skill: kept the five-question
  interrogation, weakest-assumption naming, Kill/Sharpen/Proceed, "the real point," and the
  PROCEED kill-criteria; stripped the Aiden/Versaterm-specific context to a generic "cite the
  owner's past failure pattern when on record"; added the crisp trigger boundary (task-type: an
  owner weighing a NEW build; anti-scope: features in an existing project → the change protocol),
  an **unattended mode** (interrogate the written brief; unanswered questions push toward
  SHARPEN), and the handoff (a PROCEED's real-point + kill criteria seed `product-spec.md` §1 and
  the first `decisions.md` entry).
- **The template is annotated, not blank** — `_TEMPLATE/SKILL.md` explains each section's job
  inline; the 7 house rules (lane-first, trigger-dense description + negative scope, authority
  order, step-0 method, adversarial self-check, fixed report + verified-clean, explicit anti-
  scope) live in `skills/README.md` beside the lane table.
- **Britch installs user-scoped** (`~/.claude/skills/`), the trio project-scoped
  (`<repo>/.claude/skills/`) — he runs before a repo exists.

## What I assumed

- "Rename validate-idea to Britch" meant: include the generalized skill in this package under
  that name. I did **not** touch the owner's personal `~/.claude/commands/validate-idea.md`.
- The harness-fallback requirement is satisfied by (a) each SKILL.md being an executable
  checklist a non-skill harness can be pointed at directly, and (b) the starter kit's AGENTS.md
  manual-equivalents section — no separate fallback scripts (Burt's grep gauntlet is derived
  per-project, so a static script would be wrong).
- Parvati keeps her name (the brief's trio is Burt · Parvati · Murr; only validate-idea was
  renamed).

## Deferred / needs owner input

- **No cognitive-skill family yet** (the "make Opus think to the bar by default" leg) — that read
  as a later package; the template + house rules are ready for it.
- **No eval fixtures** (a deliberately-broken mockup/diff per reviewer to prove each catches its
  seed miss — the bad-PR-corpus idea). Recommended as part of the worked-example package.
- Whether Murr should also be wired as the project's `/code-review` replacement or run alongside
  the built-in — owner's call at first real use.

---

# Package 3 — The acceptance-criteria spine (ac-author + acceptance-walkthrough)

Deliverable: [`skills/ac-author/`](skills/ac-author/SKILL.md) +
[`skills/acceptance-walkthrough/`](skills/acceptance-walkthrough/SKILL.md), plus the AC namespace
and the two standing behaviors wired through the starter kit (00-INDEX §3, ui-requirements §1/§3,
roadmap §3, CONVENTIONS DoD, lifecycle-playbook intro/Stage-2/Stage-4, AGENTS.md fallbacks,
skills/README.md, starter-kit README). Health check re-verified after the template edits.

## What I chose

- **AC get their own stable-ID namespace (as recommended): `AC-<SCOPE>-n`** — scope = a surface
  slug declared in its §3 header (`AC-COL-3`), a phase (`AC-P2-1`), or `GLOBAL` (the inherited
  always-on set). Scoped-not-global numbering keeps numbering local (parallel tracks don't collide
  the way a single `AC-NNN` counter would) and makes the ID self-locating. Same laws as behavior
  IDs: append-only, greppable (criterion ↔ walkthrough step ↔ E2E flow name), every AC cites the
  behavior ID it verifies. Registered in 00-INDEX §3 as a second namespace riding the first.
- **Storage stays inline** (per the brief): `- [ ] **AC-<SCOPE>-n** — do X → expect Y (SPEC-ID)`
  checkbox lines in the owning doc — no new file, doc count unchanged. The inherited set became
  `AC-GLOBAL-1..4` so surfaces stop restating lifecycle/confirm/a11y/DS criteria.
- **ac-author is an *author*, not a reviewer** — the one skill so far allowed to edit the doc
  graph, and only under the change protocol (version bump, changelog, register cell, §2 AC
  column). Its core is the six craft laws (observable · binary · one-behavior · cites-spec-ID ·
  unhappy-paths-included · phase-honest) plus two kill-tests per criterion ("could this pass with
  the feature broken?" / "could two reviewers disagree?") and a completeness pass against the
  states board + contract. Guardrail kept hard: it never specs-by-AC — unspecced behavior goes to
  open-questions first.
- **acceptance-walkthrough splits per-criterion into GUIDED vs AUTOMATED** — mechanical,
  regression-worthy criteria become E2E flows *named for the AC IDs they demonstrate* (the
  testing-strategy "thin E2E" cap respected: automate what re-fires at later gates, not
  everything); taste/device-feel/real-money stay guided **always** (the InGame §11 insight: gates
  exist precisely where automation is blind). Judgment prompts are staged as ☆ lines with **no AC
  ID** — mixing taste into criteria poisons both. Automated legs run before the sitting; an
  automated FAIL blocks booking the owner's time.
- **Failure semantics:** a FAIL is a flag routed back to the build lanes; **the gate does not pass
  with open FAILs unless the owner waives — and a waiver is a `decisions.md` entry naming the AC
  ID.** Pass/fail is recorded per criterion, giving gates an audit trail.
- **The two behaviors got teeth, not just prose:** (1) surfaced-work-verifies-first went into the
  CONVENTIONS **DoD line** ("the touched surface's AC self-verified (parvati); an AC you can't yet
  meet is declared, never silently skipped") — the DoD is what every task is held to; (2)
  offer-the-walkthrough went into the playbook as a standing behavior + into the G-4.n gate row
  itself, so the gate *is* the walkthrough rather than having one available.

## What I assumed

- Endpoint AC live in the **delivering phase's** roadmap block (citing endpoint + spec ID) rather
  than a third storage location in api-contract — the contract already owns shapes/codes; a
  separate per-endpoint AC section would duplicate it. Revisit if API-only phases become common.
- The E2E tool is project-chosen (Maestro is the worked example, not a requirement) — the skill
  binds flows to AC IDs by *naming convention*, which survives any tool swap.
- Surface slugs are declared in the §3 block header (`### 3.1 Collection (\`COL\`)`) rather than a
  new §2 table column — keeps the health check's §2 parser untouched.

## Deferred / needs owner input

- **Health-check enforcement of AC** (e.g. red when a ✅-AC column row's §3 block contains no
  `AC-<slug>` lines) — deliberately left out to keep the script's parsing simple; the §2 AC column
  + parvati already carry the tripwire. Add it if the pilot shows the column being ticked
  dishonestly.
- **A walkthrough-results ledger** (where past sittings accumulate) — currently "keep the script
  for the next re-fire" + the decisions entry on pass/waiver; a dedicated file felt like a ninth
  doc without proven need. The dashboard package may want to surface last-gate results instead.

## Owner-directed amendment (same session): the two-pass model

The first cut had ac-author running once, at converge — the owner correctly flagged that AC
should *lead* design, not trail it. Amended across ac-author (new "Two passes" section + method
step 0), the playbook Stage 2 Produces (per-surface order: brief + pass-1 behavioral AC → drafts
judged against them at the pick → converge → pass-2 presentation-borne AC appended → frozen),
ui-requirements §3 intro, and skills/README. The rule as encoded: **pass 1 (behavioral, from
spec+contract) exists before any draft and is the bar the drafts are picked against; pass 2 (at
converge) only absorbs what the settled design legitimately added — never inverted, or the
drawing defines the bar it's measured by.**

---

# Package 4 — The cognitive-skill family (ui-craft · spec-elicitation · failure-first)

Deliverable: [`skills/_TEMPLATE/COGNITIVE-SKILL.md`](skills/_TEMPLATE/COGNITIVE-SKILL.md) (the
class template), [`skills/ui-craft/`](skills/ui-craft/SKILL.md) (the required flagship),
[`skills/spec-elicitation/`](skills/spec-elicitation/SKILL.md) (+ `references/question-banks.md`)
and [`skills/failure-first/`](skills/failure-first/SKILL.md) (the two exemplars), the class
section + roster in `skills/README.md`, and playbook/README/AGENTS wiring.

## What I chose

- **The trigger-boundary mechanism** (the latitude item): three parts, encoded in the template
  and every member. (1) **Artifact-anchored triggers** — a cognitive skill loads when the next
  output IS an instance of its artifact ("about to design a screen"), never on topic keywords
  ("the user mentioned UI"); the test each skill carries: *is the next output an instance of the
  artifact?* (2) an explicit **quiet-list** in every description naming the adjacent activities
  it must NOT load for (reviewing → the reviewer's lane; debugging → the debugging discipline;
  discussing/planning → nothing). (3) **deference laws** that make misfires cheap even when they
  happen: the project's docs outrank the skill, and it adds no process — so a wrongly-loaded
  cognitive skill can't derail work, only pad it.
- **The class laws:** inline-and-silent (better work, not checklist narration; trade-offs named
  in the receipt; below-bar work declared, never silent) · project-docs-outrank-generic-craft
  (so cognitive skills never fight burt/the CONVENTIONS) · **reviewer pairing** as the quality
  mechanism — ui-craft↔burt, failure-first↔murr, stated in both directions: "if the reviewer
  would flag it, the cognitive skill should have prevented it."
- **ui-craft** holds both bars at once per the brief: the app-agnostic senior-designer set
  (hierarchy/one-primary-action, affordance, 44pt/48dp targets, the full state matrix as the #1
  generalist omission, motion-with-purpose, cognitive load incl. the low-frequency three-week
  re-learn test, an accessibility floor, platform conventions) AND the project's aesthetic
  profile — with the profile's bold/conventional split treated as law ("novelty spent on
  wayfinding is the signature junior move").
- **Exemplar picks:** `spec-elicitation` (owed — the owner commissioned its design last turn:
  five moves, question banks + baseline surface taxonomy in a references file, the coverage
  ledger in `docs/planning/spec-ledger.md`, ledger-driven nudges, "the map has no unexplored
  rooms" exit) and `failure-first` (highest-leverage for the build phase and the natural
  murr-upstream, completing the pairing symmetry). Deliberately NOT built: the rest of the
  shortlist — data-modeling, api-contract-design, accessibility-deep, performance — stamped from
  the template when a pilot shows the need, per the anti-goal of skills that auto-load too
  broadly.
- **Naming convention formalized:** person names = summoned colleagues (reviewers/gates);
  craft names = ambient cognitive skills (nobody needs to remember a name for them to fire).

## What I assumed

- spec-elicitation belongs to the cognitive class (a conversation harness, not a reviewer) and
  is project-scoped — it works a repo's doc graph and ledger.
- Its ledger lives at `docs/planning/spec-ledger.md` as working state OUTSIDE the 8-doc graph
  (no 00-INDEX register row — it's scratch, not truth; the durable output is the spec + inbox).
- ui-craft covers the accessibility *floor*; a dedicated accessibility-deep member remains on
  the shortlist rather than bloating the flagship.

## Deferred / needs owner input

- The four shortlist members (data-modeling · api-contract-design · accessibility-deep ·
  performance) — stamp on demand from the template.
- Whether spec-elicitation should also fire during Stage 6 live-ops feature waves (it says
  "reloads whenever a later discovery reopens spec territory" — pilot will show if that trigger
  is crisp enough).

---

# Package 5 — Sturdy-legs testing kit

Deliverable: [`testing-kit/`](testing-kit/) (README + 5 files: `defineRoute.ts` ·
`authz-coverage.test.ts` · `concurrency.ts` · `pg-harness.ts` · `destructive-guard.ts`), the
[`starter-kit/docs/testing-strategy.md`](starter-kit/docs/testing-strategy.md) template (doc #9),
murr's anti-padding tripwire, and the health check's risk-ID coverage line — all verified
(register sync green with the new row; coverage line dormant with no tests, and correctly
reporting "2/3 tagged — missing: SYS-02" in an active-path scratch test).

## What I chose

- **testing-strategy rejoins the graph as doc #9** (Package 1 had folded it into CONVENTIONS and
  explicitly deferred this call to this package). The brief demands a real template; a §3 the
  health check can machine-read needs a stable home; and backend-less apps keep it too (client
  testing still applies — only the kit's *code* is backend-only). Register row added; the
  config-free health check picked it up with zero script changes.
- **The kit is ported code with the mechanism as the contract.** `defineRoute` and
  `destructive-guard` are near-verbatim generalizations of InGame's (they were already generic —
  InGame-isms like F30/SYS-07/G-C comments became toolkit language); `pg-harness` extracts the
  repeated beforeAll/afterAll block from InGame's six integration slices into `startTestDb({
  migrate })`; `concurrency` codifies the Promise.all race pattern into `race()` +
  `expectOneWinner()` — which asserts the under-appreciated third clause from InGame's suite:
  **zero 500s** (the race loser must be a handled, typed refusal). Stack-swappability = each file
  header states the mechanism as a spec + names its single swap seam (`mountRoutes` for the
  framework; the container class for the DB; plain-Error asserts for the runner).
- **The honesty chain, stated as architecture** (testing-kit README): (1) `defineRoute` — can't
  *define* an unguarded route (boot-time throw; kept InGame's `crossPrincipal` read-side flag,
  not just `mutates`); (2) `authz-coverage.test.ts` — can't *merge* a phantom guard (registry
  ids diffed against the suite source); (3) **murr** — the named test must be *honest* (mechanics
  can't read intent; the last mile is the reviewer). This mirrors InGame's lint architecture with
  the lint layer replaced by a portable template test.
- **Murr's anti-padding tripwire = four named patterns**, each with a tell:
  constant-asserted-against-itself · trivial restatements · mock-echo · cross-layer duplication —
  plus the severity twist that matters: padding is 🧹 delete-it debt, **except on a §3 risk
  domain, where a padded test masquerading as required coverage is 🟠 major** (it satisfies the
  coverage grep while guarding nothing — worse than absent).
- **Risk-ID coverage is a presence line, never a % gate** (per the brief): the health check
  extracts spec-ID tokens from testing-strategy §3 (excluding OQ-/AC-/D- namespaces), greps all
  `*.test.*`/`*.spec.*` files, and reports per-ID gaps as 🟠 info — with two honest dormant
  states (§3 unfilled · no test files yet) so it never nags before P1.

## What I assumed

- The kit lives as a third sibling package (`toolkit/testing-kit/`), installed at P1 per the
  roadmap (whose P1 exit now also requires the destructive guard **seen firing once** — a guard
  nobody has watched fire is a hope; InGame's G-C insight, generalized).
- InGame's rule-4 CI lint (inventory-diff as a lint with bad-PR fixtures) is intentionally
  simplified to a template *test* for portability; a project can graduate it to a lint later.
- The "test-audit findings" study item was best served by the live suite itself (defineRoute,
  the F36 races, gate G-E's atomic-rollback test) — those patterns are what got generalized.

## Deferred / needs owner input

- **The bad-fixture corpus** (a deliberately-padded test per tripwire pattern + a meta-test that
  murr/the lint rejects it — InGame's F22 self-test idea) — again deferred to the worked-example
  package, where it doubles as the reviewer eval set.
- Client-side test helpers (RTL harness, component-test conventions) — the kit is API-side where
  InGame's validated patterns live; client patterns should be extracted once the pilot builds
  screens.
- Whether the authz-coverage test should also *fail on* authzTest ids whose test never makes an
  actor-B request (detectable heuristically: the id's `it` block contains no second-actor setup)
  — left to murr for now; a heuristic that false-positives would erode trust in the mechanism.

---

# Package 6 — The Owner dashboard (lifecycle cockpit)

Deliverable: [`dashboard/`](dashboard/) — `server.mjs` (dep-free Node: adapter-based doc-graph
read layer + the trace engine + mockup/doc serving) + `index.html` (single-file UI: Pre-dev /
In-dev / Post-dev / ID-trace tabs) + README. Registered in InGame's `.claude/launch.json` as
`dashboard` (port 8791). **Verified live against InGame's real graph**, not just built: header
detects M3 from the branch + 🟢 from PROJECT-HEALTH; Pre-dev renders the vision, 6 personas
(Curator★), the M0–M8 strip, and an Owner Decision Ledger of 11 PENDING owner calls with their
blocking stages; In-dev finds the M3 acceptance suite (0/54 boxes), the Up-next queue, and the
full surface table with working mockup links; Post-dev shows the 7 stubs; the trace endpoint
fans CARD-15 across spec(6)→api(1)→design(7)→mockup(33)→code(2)→test(1)→decision(17); mockup
serving works and path traversal is blocked. Four parse bugs found-and-fixed during live
verification (leading-`#` titles, leading-dash queue items, decisions README.md sorting first,
"gated" matching the stage regex).

## What I chose

- **Stack: dependency-free Node + one static HTML file** — the house pattern (health-check.mjs,
  standalone mockups). No npm install, no build step, runs the week it ships (`node
  toolkit/dashboard/server.mjs`). A framework buys nothing at this size and costs the
  clone-and-run property.
- **The dashboard is a pure READ of the doc graph** — no database, no own state, never writes.
  The docs remain the single truth; this is their human-readable projection (the brief's
  "human-readable counterpart to the Claude-first doc graph", taken literally). Refresh = re-parse.
- **Generic read layer via two auto-detected adapters** (`ingame` when SCREEN-STATUS.md exists,
  else `starter`) — one adapter object per layout, every parser reads through it; a third layout
  is a third object. Parsers are individually best-effort so one odd doc never blanks the cockpit.
- **Owner Decision Ledger = a projection, not a new file.** PENDING is derived from open OQs
  whose text signals an owner ruling (owner/gate/bless/ratify) + the blocking stage extracted
  (M3, G-D, gate-3…); DECIDED is the decisions log. No new doc to maintain — the ledger can never
  drift from the inbox because it IS the inbox, filtered. (Found 11 real pending owner calls in
  InGame on first run — the panel earned its place immediately.)
- **Single-ID trace as a live grep, not an index** — walks the project per request (skipping
  node_modules etc.), buckets hits by path into the canonical order spec→api→design→mockup→code→
  test→decision. No index to go stale; repo-scale cost is negligible. The `(→ metric)` tail
  arrives when post-dev JSON exists.
- **Post-dev stubs wired by file-drop contract:** `.dashboard/<panel>.json` — any flat JSON
  lights the panel. That keeps Arc C/D "provisional but real": the adapter seam is defined now,
  the exporters (Sentry, analytics, store) arrive with their stages.
- **Current-phase heuristic:** `.dashboard/config.json` override → git branch (`m3`→M3) → unknown.

## What I assumed

- InGame's `.claude/launch.json` gains the `dashboard` entry (small, additive, and it's how the
  owner + agent tooling will actually run it). Everything else stays in `toolkit/`.
- Raw-doc links (`/doc/<path>`) serve markdown as plain text for now — "readable render" is done
  by the panels; a full markdown renderer in the raw view is polish, not spine.
- The In-dev "walkthrough status" reads checkbox progress from the phase's acceptance/build doc
  (InGame: `m3-acceptance-suite.md`) — the acceptance-walkthrough skill's scripts are markdown
  checklists, so this works for both layouts without a new format.

## Deferred / needs owner input

- **Preview screenshots wedged** (known environment quirk) and headless-Edge raced the model
  fetch — visual verification is by accessibility snapshot + DOM evals, which prove structure
  and data but not pixels. Worth one manual look at http://localhost:8791 (server left running).
- Post-dev exporters (the scripts that produce `.dashboard/*.json` from Sentry/PostHog/store
  APIs) — Arc C/D work, stubbed by design per the brief.
- Auto-refresh / file-watching (it re-parses per request; a `watch` mode is trivial later).
- The trace's `code` bucket currently keys on `apps/|src/|packages/` — revisit if a project uses
  a different source layout (make it part of the adapter).

# DECISIONS.md — doctor-nick + the QA lessons ladder (2026-07-05)

Generalized from InGame decision 0065, after agents there kept burning QA time on dev-server /
preview workflow friction with no capture loop.

## What I chose

- **The lessons ladder:** QA-workflow lessons graduate through tiers — captured in
  `docs/qa-runbook.md` (Symptom → Diagnosis → Fix → Verified → Hits, agents append directly),
  **promoted at Hits ≥ 2** into the dev supervisor's `doctor` verb (deterministic, read-only,
  prescribes the exact fix), **canonized** into CLAUDE.md only when they're standing environment
  invariants (owner-gated). CLAUDE.md stays short because the runbook + doctor absorb the churn.
- **Enforcement is a skill, not prose:** `skills/doctor-nick/` — preflight (`up` + `doctor`
  before any QA), the stuck rule (doctor → runbook → investigate), the retro rule (every QA
  receipt answers "workflow friction this run?"). Parvati's capture preflight points at it.
- **The supervisor contract is documented, not implemented:** the starter-kit specifies
  `up`/`status`/`doctor` (CLAUDE.md QA-loop section) but ships no supervisor code — stacks vary
  too much; InGame's `dev-stack.mjs` is the reference implementation.
- **The runbook is operational, not registered:** like HEALTH.md it carries no version/changelog
  and no 00-INDEX row — registering it would put append-mid-task friction on the exact loop that
  must be zero-ceremony.

## Deliberately deferred

- `doctor --fix` (auto-remediation) — YAGNI until prescriptions prove stable across projects.
- Runbook analytics beyond the in-file Hits counter.

# Package 7 — The roster (sigmund + agents/) (2026-10-14)

Built from `docs/roster-spec.md` (approved 2026-10-13) and `docs/roster-build-plan.md`. Sources:
InThink's Spez skill and its murr/parvati wrappers, InProgress's CLAUDE.md routing and its four
agents, and the review lessons from InProgress's routing pilot.

## What I chose

- **One facilitator skill, four agent wrappers, same shape in every project.** Sigmund holds the
  lifecycle, the model routing and the overrides, so a project's CLAUDE.md keeps one line and
  orchestrator or research sessions never load routing they don't use.
- **Names:** Sigmund (was Spez in InThink, CLAUDE.md Roles/Routing in InProgress), Sev (was
  implementer), Moh (was explorer), Murr (was code-reviewer in InProgress; kept over Ellie because
  InThink and InGame already use him), Parvati (was screen-reviewer). cad-dev-loop keeps its own
  Sigmund and Sev; ours name the repo and leave Jira, tickets and ledgers out, so the description
  is the only guard against the trigger collision.
- **Edit points as `{{UPPER_SNAKE}}` in `[edit]` sections,** the starter kit's convention, so an
  adopting project can grep for what it still has to fill.
- **Parvati ships as two wrapper files,** one per mode (isolated build by default), rather than one
  file with two frontmatters: a template that is valid as copied beats one that needs surgery.
- **Superpowers stays the method inside the phases** (Aiden, 2026-10-14): brainstorming in phase
  0, writing-plans in phase 2, subagent-driven-development in phase 3, requesting-code-review in
  phase 5, finishing-a-development-branch in phase 8. Sigmund owns the lifecycle around them.
- **No em dashes in the new templates.** InProgress's test suite forbids them in every file, and
  the templates are copied verbatim. The pre-existing murr and parvati skills keep theirs;
  projects with the guard strip them on copy.

## What I assumed

- Claude Code loads `skills:` in agent frontmatter (InThink's wrappers rely on it) and reads
  `omitClaudeMd`, `effort` and `maxTurns` as the spec's table uses them.
- `/sigmund` resolves to the project's skill and `/cad-dev-loop:sigmund` to the plugin's; a loose
  phrase ("drive this to done") is the only case where the two compete.

## Deferred / needs owner input

- The trigger-collision test (spec §5): in a project that has both Sigmunds, ask "drive this to
  done" and see which loads. Runs after the first adoption (InProgress).
- A per-project checklist script for adoption (grep for `{{`, frontmatter shape). Greps in the
  build plan cover it for now.
- InGame: the wrappers and Sigmund beside its existing skills, after InThink and InProgress.

# Package 7a — Doctor Nick joins the roster (2026-10-14)

Step #431. Aiden asked for a roster doctor before InProgress lands the roster; the source is
InGame's `doctor-nick` skill and decision 0065, by way of the generic skill above.

## What I chose

- **Rebuilt in place, not added beside.** `skills/doctor-nick/SKILL.md` keeps its name and its
  ladder (capture, automate at Hits 2 or more, law on the owner's say-so) and becomes a roster
  template: `[edit]` sections for Preflight, the Runbook and Boundaries, and five new edit points
  (`{{PREFLIGHT}}`, `{{DOCTOR_COMMAND}}`, `{{KNOWN_ISSUES_FILE}}`, `{{RUNBOOK}}`,
  `{{PROTECTED_LANES}}`), listed in `docs/roster-build-plan.md`. Ported the way burt and parvati
  were (Package 2): InGame's dev-stack script, its ports and its Metro lane became edit points.
- **Wider lane.** InGame's skill covered QA-workflow friction only. Doctor Nick covers a broken
  environment of any kind: a server that won't start, a red deploy or rollback, a check that
  fails before it reaches the code, a runner that reports nonsense. Product bugs stay with
  systematic-debugging.
- **Three parts, two homes.** The runbook (symptom, first probe, where the fix lives) is an
  `[edit]` section of the skill and changes only through the project's own session. The
  known-issues log is a project file that any session appends to on the first solve, so it grows
  without anyone editing a skill. That keeps the 2026-10-14 ruling: no agent edits agent files
  on its own.
- **No agent wrapper.** He runs inline in the session that hit the problem, which already holds
  the error text; a dispatch would cost more than it saves. Subagents that hit a broken
  environment stop and report the doctor's output.
- **A doctor check is a change.** Promotion at Hits 2 or more is proposed in the receipt and runs
  through Sigmund, instead of being added mid-triage.
- **Wiring:** Parvati's capture preflight now names doctor-nick's Preflight section and tells her
  to report a red as a blocker. Sigmund names Doctor Nick in the roster paragraph, at verify (UI
  work starts with his preflight; an environment failure goes to him first), in the receipt, and
  after the merge gate (a red deploy or rollback goes to him before any retry). The roster spec
  gains his row. The retro question reads "environment friction this run?".

## What I assumed

- The starter kit's `docs/qa-runbook.md` stays the known-issues log under its old name, so
  InGame keeps its file and new projects need no rename.

## Deferred / needs owner input

- A propose-only retro loop over the roster itself is #432, not this package.
- InGame and InThink adopt the template through their own sessions; InProgress first, on
  `roster-plan`.

# Package 7b — The roster's retro loop (2026-10-14)

Step #432. Aiden ruled on 2026-10-14 that the roster gets a self-improvement loop that is
propose-only: no agent edits agent files on its own. The worked example is InProgress's roster
review the same day, where an Opus reviewer found four majors in workflow files (Murr told to run
e2e with no port, the context nudge citing a removed CLAUDE.md section, Moh's description invalid
as YAML, non-change sessions losing the routing), all fixed locally, with template follow-ups
going to Shipwright by hand.

## What I chose

- **Two parts.** Capture lives in Sigmund: a `## Workflow notes [edit]` section, one receipt item
  and one anti-scope line. Analysis lives in a new template, `skills/retro/SKILL.md`. Capture has
  to be nearly free in every session; analysis is rare and can afford to read.
- **One line per friction, keyed.** `workflow note [<key>] <kind>: <what> · <cost, or none
  measured> · <fixed locally | open>`, with five kinds: misfire, dispatch, miss, lie, defect (a
  reviewer- or owner-found friction is `defect` whatever else it is). The key is the file's repo
  path plus `#<section>` for a rule, and `{{WORKFLOW_FILES}}` lists each one, so a repeat is a
  string match. A note is held until a write the session already makes (InProgress: the next
  scribe brief; no tracker: one appended line in a file), the receipt at the latest; it never
  gets its own read, search or dispatch, and there is no "none" line. Where it goes is one edit
  point, `{{WORKFLOW_NOTES}}`, shared with the retro. The Sigmund section is kept to about 25
  lines because every change session reads it.
- **A local fix still writes the note.** The four review findings were fixed on the branch, which
  is right; the note is what carries the lesson to the template the file came from.
- **Environment friction stays with Doctor Nick.** A server that will not start goes to his
  known-issues log; a check whose definition is wrong is a workflow note, even when the runner's
  output is nonsense. Sigmund's verify phase, Doctor Nick's description and his Boundaries all
  carry that tie-break. Doctor Nick's "retro rule" keeps its name.
- **Trigger, not schedule.** A second note on a key, a `defect` note, a pilot window closing, or
  the owner asking. A `watch` ruling keeps its note in the count; `proposed` and `no change`
  clear it. Ruling lines take their own prefix (`workflow ruling [<key>] ...`) so they never
  count as notes. Sigmund names only the `defect` trigger, in his receipt, and proposes the retro
  as its own session; he never looks for repeats (that would cost a read per note) and never runs
  it mid-change. The owner, or whoever the notes' fill names, reads the home for repeats at each
  pilot or phase close. The retro's description lists only its invocation phrases, not its
  triggers, so it cannot start inside the change session.
- **Inputs cheapest first.** Notes, pilot log, the cost report, then transcripts through
  superpowers' `diagnosing-superpowers`, at most one session per retro unless the owner asks,
  and only where the rest does not explain a session. That skill always runs all seven analysts
  and writes its own report, so the retro states its cost first, hands it a written problem
  statement, and cites its findings.
- **The worked example lives in `docs/retro-worked-example.md`,** not in the template, so
  adopting projects do not load InProgress's history in every retro.
- **Every proposal names its home.** Template, fill, or both; `{{WORKFLOW_FILES}}` maps each
  project workflow file to the template it came from so the retro can grep for the same line.
  The adversarial self-check kills one-offs, proposals that cost more per session than the
  friction did, and new rules where a rule already exists.
- **Landing is not the retro's.** An approved template diff lands in Shipwright from a Shipwright
  session with Murr's review, then reaches each project through its own session; a fill diff
  runs through the project's Sigmund. Declined proposals are recorded against their key.
- **Eight edit points** (`{{WORKFLOW_NOTES}}`, `{{RETRO_TRIGGERS}}`, `{{PILOT_LOG}}`,
  `{{COST_REPORT}}`, `{{TRANSCRIPTS}}`, `{{WORKFLOW_FILES}}`, `{{PROPOSALS_HOME}}`,
  `{{APPROVAL}}`), listed in `docs/roster-build-plan.md`.

## What I assumed

- The name `retro` is a craft name, like `failure-first`, because it loads on a trigger rather
  than being summoned by name. A person name is Aiden's call.
- InProgress's scribe can read a standing step's log to report a repeated key; its search tool
  covers nodes and resources, not logs. The InProgress fill settles how.

## Deferred / needs owner input

- The InProgress fill (Sigmund's `{{WORKFLOW_NOTES}}` and the retro's eight points, with
  `node scripts/session-cost.mjs` as its cost report and the #291 pilot log) is a follow-up
  through InProgress's own session, after `roster-plan` lands.
- InThink and InGame adopt the retro through their own sessions.

# Package 7c — Roster template fixes from InProgress's adoption (2026-10-14)

InProgress copied the roster from `24dabdb` on its `roster-plan` branch and fixed the copies
locally (its commits `c8a58fb` and `39864da`). These are the template-side fixes, so the next
project to adopt does not hit the same things.

## What I chose

- **Moh's description is double-quoted.** It holds ": ", which a plain YAML scalar cannot, and
  an agent whose frontmatter fails to parse never loads. Shipwright has no test suite, so the
  check lives where adopters run it: a grep in `agents/README.md`'s install list, beside the
  `{{` grep. The plan's frontmatter constraint says the same.
- **Sigmund's boundary with the playbook is worded for any project.** The description and the
  anti-scope named "Stages 1 to 3 (spec, design, plan)" as fixed text, which read as if Sigmund
  never plans, against phase 2 where he owns the plan. Both now say "the project-level spec,
  design and architecture work that comes before a change"; the playbook stages are a
  parenthetical where the project follows the playbook, the anti-scope bullet is marked
  `[edit]`, and both say a change's own plan is his.
- **Murr and Parvati say what replaces each doc-graph reference.** Their `[edit]` sections
  already covered the spec, contract and DoD; they now also map CONVENTIONS, spec IDs, roadmap
  §3 and phase exits, testing-strategy and `open-questions.md` (a gap becomes an owner-call in
  the report, for the main session to route). Fill points were not added: the substitutions are
  the same for every project without the doc graph, so prose is enough and the placeholder list
  stays as it is.
- **Parvati's wrappers own their preflight.** Both say their Setup is the preflight; the isolated
  one confirms its server answers before driving it and reports a failed start instead of
  debugging the build. The skill's own preflight line is left to the Doctor Nick port.
- **Murr runs no check that builds or serves the app.** His wrapper reuses `{{CHECKS}}`, which
  in a UI project includes e2e. He has no port lane, and a build can rewrite output a running
  Parvati is serving, so the wrapper now limits him to static checks and unit tests.
- **Small things.** The `{{REPO_MAP}}` and murr's `{{HOUSE_RULE_FILES}}` fill sites end the
  sentence themselves. Murr's and Parvati's report headings lose their em dash, so a project
  that strips em dashes no longer gets a heading with two colons.

## Deferred / needs owner input

- Sigmund's roster paragraph and phase 4 still name Doctor Nick as fixed text; a project that
  has not adopted him edits phase 4 (it is `[edit]`) and the paragraph by hand.

# Package 7d — The session rhythm: context nudge, autocompact and Sigmund's "Across the session" (2026-10-16)

InProgress's compaction rules become templates, so InThink (#458) and InGame adopt them from
Shipwright instead of copying InProgress (#456). Aiden chose on 2026-10-16 that InThink takes
them with the roster, and that template changes reach projects by recorded commit plus
`git merge-file` (#457).

## What I chose

- **`starter-kit/scripts/context-nudge.mjs`** is InProgress's hook with a few words changed: the
  lines say "the owner" where InProgress says Aiden, and the post-compaction line asks for the
  plan file and "your step in the tracker" instead of InProgress's step block. Its mechanics
  (state file, compaction detection, silence in subagents, exit 0) are unchanged. The lines cite
  only Sigmund's skill path, never a CLAUDE.md section, after InProgress's copy cited a heading
  its adoption removed (`docs/retro-worked-example.md`). The header marks `LINES` and
  `COMPACTED` as the only edit points, so a sync merges the mechanics cleanly.
- **The settings live in `starter-kit/.claude/settings.json`**, a real file holding only
  `autoCompactWindow: 250000` and the `PostToolBatch` hook entry. A snippet in a doc was the
  alternative; a file wins because Day One's "copy this directory" brings it along working, and
  a later sync has a template file to merge against. An existing project merges the two keys
  into its own settings by hand; the starter kit README says so.
- **Sigmund's "Across the session" ships InProgress's rhythm as default prose**, still `[edit]`,
  and `{{SESSION_RHYTHM}}` is retired (struck through in `docs/roster-build-plan.md`'s table,
  with the date). Every project on the roster has the same context limits, so a placeholder
  only made each adopter rewrite the same text. Kept: the nudge, one step one session, what a
  clean point is, the 150k and post-compaction moves, the six reasons to hand off, mid-session
  requests as queued steps. Dropped as InProgress's own fill: the scribe, Mip reports, the
  rulings file, `Claim --take-over`, and the session-title prefixes (#455).
- `{{HANDOFF}}` stays a placeholder: where a handoff is saved is per project.
- No lane changes. `skills/README.md`'s facilitator section says the two files pair with
  Sigmund, and his adoption paragraph says to take them.

## What I assumed

- The thresholds (150k, 200k, 250k) suit every project. They sit in one script and one
  settings key; the script's header says to change them together.
- `node` is on PATH wherever the hook runs, as InProgress already assumes.

## Deferred / needs owner input

- InProgress's own copies differ from the template only in its fill. When it records an
  adoption commit for the sync (#457), the base is this package's commit.
- The session-title prefixes (#455) could become template prose once a second project wants
  them.
- #420 (the session-cost script in the starter kit) stays out of scope.

# Package 7e — The template sync: recorded commit, fills and `git merge-file` (2026-10-16)

A workflow change made once in Shipwright now reaches every project that adopted the templates,
through that project's own session (#457). Aiden chose approach B on 2026-10-16 (full filled
copies per project, a recorded adoption commit, a three-way merge) over A (Shipwright as a
plugin with per-project overlays), and approved this design the same day. Design and the first
dry sync: `docs/template-sync.md`.

## What I chose

- **`scripts/template-sync.mjs`**, plain Node with no dependencies. It reads base and theirs
  from Shipwright's object store (`git show <rev>:<template>`), so Shipwright's working tree and
  branch never matter, and merges each with `git merge-file --diff3` into the project's copy.
  It never commits; the project's session commits the merged files and the manifest together.
  Modes: sync, `--dry-run` (writes only into a scratch folder), `--check` (exit 1 when behind),
  `--accept` (moves a resolved file's base forward).
- **`.claude/shipwright.json` holds a base per file**, not one per project. InProgress already
  has two adoption commits (`24dabdb`, `9ced8b4`), and a per-file base lets clean files move
  forward while a conflicted one waits as `pending`.
- **Fills are recorded and rendered into both sides** before the merge. Without them every
  template edit to a line holding a placeholder conflicts in every project. A placeholder the
  template retires is left unfilled in base, so the project's text conflicts with the new default
  instead of being replaced by it; the first build lost InProgress's "Across the session" to
  #456's prose that way, and the dry run caught it.
- **CRLF is read as LF and restored on write.** Without it each Windows copy was one whole-file
  conflict.
- **The "Adopting this template" section is dropped** from both sides, since every adopter
  deletes it.
- **`[edit]` sections still conflict** when both sides change them: that is the project
  deliberately differing, and its session weighs the template's change with the old text shown.
- **`templates.json`** lists the syncable templates, #456's context nudge and settings included.
  A package that adds a template adds it there. The sync reports a listed template a project
  neither maps nor skips.
- **Murr's review (one major, eight minors) is folded in.** The manifest is saved even when a
  later file fails, so a file written with markers never loses `pending`; entries are validated
  per file; the sync refuses untracked, ignored or modified copies and fails closed when git
  cannot answer; the Adopting drop ignores headings inside code fences; BOMs and the dominant line
  ending are restored; `--check` reports templates gone upstream apart from "behind"; and a new
  placeholder with no fill goes `pending` (his owner-call, which matches the design's promise
  that `--accept` gates on `{{`). The manifest is written back with only the moved bases changed.
- **`scripts/template-sync.test.mjs`**, `node --test scripts/`: Shipwright's first test file,
  because this script writes into other repos. Throwaway repos in the OS temp folder, no
  dependencies. Four of its guards were checked by mutating the script and watching the test fail.
- `agents/README.md`'s install list gains step 6, record the manifest. Sigmund's and Doctor
  Nick's "Adopting this template" sections are unchanged: they are dropped on adoption and would
  need their own sync to change.

## What I assumed

- `git` 2.x with `merge-file --diff3` is on PATH wherever a project runs the sync.
- One Shipwright clone per machine, named by the manifest's `shipwright` path.
- Fills for a placeholder are the same across files unless a per-file override says otherwise.

## Deferred / needs owner input

- InProgress's backfill, its first real sync, and a "behind Shipwright" line in Mip's digest:
  proposed as steps in project `inprogress`, for its own session.
- A `--learn` mode that derives fills from a project's copies. The InProgress backfill used a
  scratch version of it; InThink's adoption (#458) writes its manifest as it fills, so it does
  not need one.
- Retro's `{{WORKFLOW_FILES}}` repeats what the manifest records; pointing it at the manifest
  waits for the retro's first real run.
- `--accept` ignores a bare `=======`, which is also a setext heading underline, so a stray
  separator from a careless resolution passes. Murr's review of the sync commit covers it.
- Pushing `main` to origin stays with Aiden.

# Package 7f — InProgress's #442 and #455 Sigmund rules, upstream (2026-10-17)

InProgress added these rules to its own Sigmund under #442 (one step, one session; a review ask
at phase 7) and #455 (a status prefix on the session title), and Murr reviewed them there. #471
brings them into `skills/sigmund/SKILL.md` so every project receives them through the template
sync (#457). Aiden approved each rule's home on 2026-10-17. The source is InProgress's final
form: 40a2a8c's Sigmund hunks, and b95656e with Murr's fixes 09c7fe5, 4c57418 and 7cf2d02.

## What I chose

- **All seven rules are template text; no new placeholder.** Once "Aiden" becomes "the owner"
  and "brief the scribe" becomes "in InProgress", the wording fits every project; the template
  already names InProgress as the continuity layer. A new placeholder would go `pending` in
  every project for text nobody needs to vary. The one real difference between projects, where
  the gate ends, is handled in the Phase 8 wording below.
- **Phase 7:** before stopping, in a tracked session, raise a `review` ask on the step with one
  line on what is ready, then set `REVIEW` (or `BLOCKED` while another ask waits, which the
  title rule already says wins). Phase 7 has no `[edit]` marker, so the rule merges clean
  wherever a project left the section alone.
- **Phase 8:** a line above `{{MERGE_GATE}}` says the go-ahead drops `REVIEW`, and a line after
  it marks the step done with its outcome and sets `DONE`. They sit outside the fill so that no
  project's fill has to change. "Merged, deployed and pushed" became "the gate above is through
  (merged, plus any deploy and push it names), or, where it ends on the owner's own action (a
  merge click, a batched release), once you have handed that action over". Without the second
  half a session whose gate ends on the owner's click (InThink's release PR) would sit with no
  prefix until a merge days later, usually seen from another session (Murr).
- **"In a tracked session"** qualifies the review ask and the mark-done line, as it already
  does the template's other InProgress writes. The title prefix applies either way.
- **"Across the session":** helper sessions claim without `--take-over`; a successor's handoff
  opens `Claim #<id> --take-over`, is attached to its step, has its path printed and is offered
  as a chip where the session can start one; Mip hears through InProgress only; and the session
  title rule, whole: `REVIEW`, `BLOCKED` (which wins), `DONE`, no prefix while working, a handoff
  clears its prefix, the two `ccd_session_mgmt` tools on `"self"`, main session only, silent
  skip outside the desktop app. The chip line names no tool, because the desktop app's
  session-starting tool has been renamed before.
- **This reverses part of Package 7d,** which kept the Mip reports, `Claim --take-over` and the
  title prefixes out as InProgress's own fill and deferred the prefixes until a second project
  wanted them. The deciding facts: every project on the roster is tracked in InProgress, and
  the title rule skips without comment outside the desktop app, so it costs nothing where it
  does not apply.
- **Kept out:** the rulings file in `docs/superpowers/rulings/` (InProgress only), and the
  "through the scribe" wording, which the template already says as "in InProgress". The
  compaction rhythm came over in 7d.
- `docs/template-sync.md`'s "worth upstreaming" note now names #471, and the Sigmund row in
  `skills/README.md` mentions the review ask and the title prefix.

## What I assumed

- Every project that adopts Sigmund tracks its steps in InProgress, whose ask kinds are
  `question`, `permission` and `review`.
- `mcp__ccd_session_mgmt__get_session` and `set_session_title` keep those names. Where they are
  missing the rule skips without comment, so a rename costs a missed prefix, not an error.

## Deferred / needs owner input

- InProgress's next sync (#460) conflicts in Phase 7 and "Across the session", where its text
  already holds these rules; its session keeps its own wording. Phase 8 can merge without a
  marker: InProgress's `{{MERGE_GATE}}` fill already opens with the `REVIEW` drop and is
  followed by its own `DONE` line, so the template's two lines may land clean beside them and
  repeat the rule (Murr's simulation from bases `24dabdb` and `ef45c2b`). Its session deletes
  the template's duplicates, or records a fill without those clauses. The fill table in
  `docs/roster-build-plan.md` now says a fill holds neither.
- InThink's dry run (`--to 078aa18`) conflicts in one hunk, Phase 7, where it rewrote "Then stop"
  for its two go-aheads; Phase 8 and the title rule merge clean. **Owner-call for Aiden before
  InThink syncs:** what "done" means for an InThink step, landed on `staging` or released to
  `main`. "Handed over" fits either reading, so InThink's session writes the answer into its
  Phase 8, which is `[edit]`.
- InGame receives the rules on its next sync, through its own session.
- Pushing `main` to origin stays with Aiden.
