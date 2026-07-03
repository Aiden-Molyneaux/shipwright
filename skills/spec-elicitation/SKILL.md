---
name: spec-elicitation
description: >-
  spec-elicitation is the conversation harness for developing a product spec — the long,
  looping owner+agent dialogue that turns a validated idea into a build-ready product-spec.md.
  Use whenever the task is defining WHAT an app is: Stage 1 of the lifecycle playbook, "let's
  spec this out", "what screens/features does this app need", brainstorming the page inventory,
  walking surfaces to define functionality, persona definition and journeys — including when the
  conversation resumes days later mid-flight (re-ground from the coverage ledger first). It gives
  the agent five recurring MOVES (surface storm · surface walks · persona journeys · big-ideas
  interludes · consolidation), standing question banks so the hard questions get asked by
  default, and a coverage ledger so a weeks-long conversation never loses a thread. Stay quiet
  once the spec is build-ready and work shifts to designing screens (ui-craft/burt's territory),
  building (Stage 4), or ruling a single filed OQ (the change protocol handles that without a
  harness). It shapes the conversation — the spec itself only advances via the one-editor change
  protocol, in consolidation batches.
---

# spec-elicitation — the harness for the long spec conversation

A product spec worth building from is not written; it's *discovered* — through a long conversation
where the page inventory is provisional, features emerge from walking screens, personas emerge
from features, and their journeys expose screens nobody listed. The failure modes are equally
known: the conversation stalls at "what screens does an app even need," threads evaporate across
sessions, big ideas either get suppressed or leak straight into the spec unruled, and coverage is
declared by fatigue instead of by map. This skill structures the conversation **without
scripting it** — a map of moves and a ledger, not rails.

**Class rules:** it shapes the *conversation*, inline. The document only ever advances through the
change protocol (one editor, batched consolidation) — the harness never bypasses it. The owner's
rulings outrank every generic prompt here. Downstream partners: `ac-author` writes pass-1 AC from
what this produces; `britch` ran *before* this (a spec conversation without a PROCEED is
premature).

## Loads / stays quiet

**Loads:** Stage 1 spec development · page-inventory brainstorms · per-surface functionality
definition · persona work and journeys · resuming any of those mid-flight.
**Stays quiet:** the idea-validation gate before it (britch) · designing the screens it defined
(ui-craft) · ruling one filed OQ (plain change protocol) · build-phase work. The test: *is the
conversation defining what the app IS?* No → quiet.

## The ledger — the conversation's memory (maintain it always)

A section the agent keeps current in a planning scratch file (e.g.
`docs/planning/spec-ledger.md` — working state, not a graph doc):

```
SURFACES   <name> — stormed | walked | (new: discovered during <what>)
PERSONAS   <name> — drafted | journeyed (day-one? return-trigger?)
CANDIDATES <feature> — homed (ID'd) | inboxed (OQ-n) | parked
THREADS    <the dangling "we should come back to…" lines, dated>
```

Every session **opens by re-grounding from the ledger** and closes by updating it. The ledger
also powers the nudges (below) — it is what makes a months-long conversation feel like one
conversation.

## The five moves — a map, not a sequence

The conversation jumps between these freely; the agent's job is knowing which move it's in and
playing it well.

1. **Surface storm.** Brainstorm the page inventory, *explicitly provisional* — late-discovered
   pages are the process working, not churn. Prime with the **baseline surface taxonomy**
   (`references/question-banks.md` §1) so nobody starts from "what does a basic app even need."
   Seed from the personas: for each, "what's the first screen they'd want open?"
2. **Surface walks — the workhorse.** One surface at a time: what can the user **DO** here
   (verbs) · what data feeds it · and the discovery engine: **where does each action LEAD?**
   Run the per-surface question bank (§2). Each walk emits exactly three streams: feature
   candidates → ledger; new-surface candidates → back onto the inventory; questions →
   `open-questions.md`.
3. **Persona journeys.** Once most surfaces are walked: each persona end-to-end, **twice** — the
   day-one journey and the *return-trigger* journey (they expose different gaps; a
   low-frequency app lives or dies on the second). Gaps loop back to moves 1–2.
4. **Big-ideas interludes.** Explicitly licensed divergence, both directions — "give me five
   outside-the-box ideas for this domain, no feasibility filter" — under one hard discipline:
   **ideas land in the inbox or the ledger, never directly in the spec**, until the owner rules.
   The license is real *because* the capture path is safe.
5. **Consolidation passes.** Periodically (a domain's worth of material, or session-end), the
   spec editor formalizes the accumulated candidates into ID'd rows per the change protocol —
   version bump, changelog, register cell. The conversation stays loose; the document advances
   only in coherent batches.

## The nudges — what the ledger is for

Inject these when the ledger shows the pattern; this is the "extend the thinking" mechanism:

- **Silent persona:** "we haven't heard from the {{Completionist}} in a while — what do they do
  on the last three surfaces we walked?"
- **Orphan surface:** "X is defined but nothing links TO it — how does anyone arrive?"
- **Missing return trigger:** "no feature yet gives {{persona}} a reason to come back — is that
  persona real, or is the feature list incomplete?"
- **One-persona app:** "every feature so far serves the north star — are the secondary personas
  paying their way, or should they be cut from §2?"
- **Verb monotony:** "every surface so far is read-only browsing — where does the user *make*
  something?"
- **Stale thread:** surface a THREADS line older than two sessions: rule it or park it.

## Exit criteria — when the harness stands down

Not "the spec is complete" — **"the map has no unexplored rooms":** every inventoried surface
walked · every persona journeyed both ways · every candidate homed, inboxed, or parked · no
dangling threads · the parked list (§7) written. Then: `ac-author` pass-1 per surface, the G-1
scope ruling, and Stage 2. The harness reloads whenever a later discovery reopens spec territory.

## What spec-elicitation does NOT do

- Never edits the spec mid-conversation — capture → consolidate is the only path in (one editor).
- Never suppresses or auto-adopts big ideas — licensed divergence, gated capture.
- Never validates the idea itself (britch, already passed) or designs the screens (ui-craft) —
  it defines *what*, not *whether* or *how it looks*.
- Never declares coverage by fatigue — the ledger's map is the only "done."
