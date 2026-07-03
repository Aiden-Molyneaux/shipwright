---
name: ui-craft
description: >-
  ui-craft makes UI/UX work reason like a senior product designer who also knows THIS app's
  aesthetic — unprompted. Use whenever you are about to design or modify anything a user will see
  or touch: drafting or editing a screen mockup, composing a new surface or flow, building or
  restyling UI components in code, designing an empty/error/onboarding state, choosing an
  interaction pattern (sheet vs push, gesture vs button), or answering "how should this screen
  work/look". It holds the work to BOTH bars at once: app-agnostic UX quality (hierarchy,
  affordance, touch targets, the full state matrix, motion-with-purpose, cognitive load,
  accessibility, platform conventions) and the project's own aesthetic profile + foundation rules
  (docs/design-system.md — which OUTRANK this skill's generic guidance wherever they overlap).
  Stay quiet when the task merely mentions UI without producing it: auditing a finished mockup
  (burt's lane), parity-reviewing a built screen (parvati's lane), debugging a layout defect,
  pure copy edits, or backend work that happens to serve a screen. ui-craft shapes the work
  inline — it produces no reports and gates nothing; burt audits the artifact after.
---

# ui-craft — think like a senior product designer, by default

The gap this closes: given a generic UI task, a generalist produces a *plausible* screen — the
happy state, centered, everything the same size, an icon-only button, a toast for a fixable error.
A senior product designer produces a screen that knows what it's *for*: one clear primary action,
states for every way reality can disappoint, targets a thumb can hit, and the app's own voice.
ui-craft makes the second version the default — applied silently while designing, not delivered
as a lecture.

**Class rules:** shapes work **inline** — no reports, no gates. **The project's
`docs/design-system.md` outranks it**: the aesthetic profile (§1), foundation rules (§2), tokens
(§3), lifecycle grammar (§4), and component map (§5) win wherever they overlap this skill's
generic guidance — ui-craft supplies the *craft*, the profile supplies the *taste*. Its reviewer
partner is **burt**: he audits the finished file; if burt would flag it, ui-craft should have
prevented it. Pass-1 acceptance criteria (`AC-*`) are requirements, not suggestions — a design
with no home for one fails before taste enters.

## Loads / stays quiet

**Loads:** designing/editing a mockup or states board · composing a new surface/flow · building
or restyling components in code · designing empties, errors, onboarding · choosing interaction
patterns · "how should this screen work".
**Stays quiet:** auditing a finished mockup (burt) · reviewing a built screen (parvati) ·
debugging an existing layout defect · pure copy edits · backend work behind a screen. The test:
*is the next output something a user will see or touch?* No → quiet.

## The bar

A stranger who hasn't opened the app in three weeks can land on this screen and know, within a
second, where they are, what matters most, and what to do — including when the data is empty, the
network is gone, or their last action failed. Every interactive element looks interactive, sits
where the platform taught them to expect it, and is comfortably hittable. The screen has exactly
one visual voice — this app's — and its boldness is spent where the profile says delight lives,
never on wayfinding.

## Considerations — think through these while designing

**Hierarchy & layout**
- One primary action per screen. If two things scream, neither is heard — demote or split.
- Importance is *encoded*: size, weight, contrast, position. If everything is 15px in a row of
  equal boxes, the design has abdicated.
- Scan order: does the eye land on identity → status → action in that order? Walk it.
- Group by relatedness, separate by difference — proximity is the cheapest hierarchy tool.

**Affordance & interaction**
- Tappable must *look* tappable; the design system's button/control components exist — compose,
  don't invent flat text that secretly acts.
- Disabled states explain themselves (what unlocks this?), never just gray mystery.
- Every gesture has a visible alternative (a gesture-only affordance is invisible UI); gestures
  are accelerators, not the only door.
- Destructive actions: visually distinct, physically separated from common actions, and always
  confirmed (`AC-GLOBAL`).

**Touch & ergonomics**
- Targets ≥ 44pt (iOS) / 48dp (Android); *spacing* between adjacent targets matters as much as
  size — especially destructive-next-to-common.
- Thumb reach: primary actions low on phone screens; danger out of the resting zone.

**The state matrix — design ALL of it (the #1 generalist omission)**
- Every screen exists in: loading · empty/first-run · partial (1 item, 999 items) · error-with-
  retry · offline — the project's lifecycle grammar (design-system §4) names the components; a
  design showing only the full-happy state is a fragment, not a design.
- Empties are *inviting*: what does the user DO from here? A dead empty state is a design bug.
- Long/extreme content: the 40-character name, the 4-digit count — where does it truncate, wrap,
  or scale?

**Motion & feedback**
- Motion explains — spatial relationships, state changes, where a thing went. Decoration-only
  motion is cut, and everything respects reduced-motion.
- Every action acknowledges within ~100ms (pressed state, optimistic echo, spinner *with an
  escape*). A strandable spinner is a failure state, not a loading state.

**Cognitive load**
- Recognition over recall: show options, don't demand memory — especially for low-frequency apps
  (the three-week re-learn test).
- Progressive disclosure: the 20% case on top, the rest a level down. Good defaults over required
  choices.
- Copy is part of the UI: labels say what things do ("Save changes", not "OK"); errors say what
  happened and what to do next, in the app's voice.

**Accessibility (designed in, never bolted on)**
- Contrast: 4.5:1 body / 3:1 large text — *check the actual token pairs*, on-brand-but-unreadable
  is a classic.
- Meaning never rides color alone; dynamic type won't shatter the layout; interactive elements
  carry labels for assistive tech (an icon-button without a name is invisible).

**Platform conventions & the bold/conventional split**
- Navigation, back behavior, sheets vs pushes, system pickers: follow the platform unless the
  aesthetic profile explicitly claims that surface for boldness.
- The profile's split is law: **bold where delight lives** (its named surfaces/moments),
  **conventional where wayfinding lives** (nav, forms, dense lists, checkout). Spending novelty
  on navigation is the signature junior move.

## Classic mistakes — the tells

- **Happy-state-only design** — the mockup has one artboard → design the matrix or it isn't done.
- **Mystery-meat navigation** — icon-only controls nobody can name → label or use the platform
  pattern.
- **Everything centered, everything equal** — no hierarchy → pick the primary, size accordingly.
- **Toast for a fixable error** — the field knows what's wrong; say it *at the field*; toasts are
  for transient, non-actionable news.
- **On-brand, unreadable** — accent-on-accent text failing contrast → check the token pair, not
  the vibe.
- **Gesture-only affordances** — swipe with no visible alternative → add the button; keep the
  gesture as the accelerator.
- **Dead empty states** — "No items." → what's the user's next move? Put it there.
- **Novelty spent on wayfinding** — a creative nav bar → re-read the profile's
  bold/conventional split; boldness belongs where the profile says.
- **Reinvented components** — a near-dupe of a §5 component with a new name → compose from the
  map; a genuinely new component gets flagged for the map, not smuggled in.

## How this shows up in the work

- Apply silently; the output is a better screen, not commentary about this checklist.
- A real trade-off (density vs touch targets, platform convention vs profile boldness) is named
  in the receipt in one line — not narrated during.
- Where the profile and this skill disagree, follow the profile without remark.
- A knowingly-below-bar state (a stubbed empty state, a deferred animation) is **declared** in
  the receipt, never silent.

## What ui-craft does NOT do

- No reports, no gates, no audit — **burt** audits the file after; **parvati** reviews the build.
- Never overrides `design-system.md` — profile, rules, tokens, and component names outrank it.
- Never invents behavior to make a screen richer — unspecced behavior goes to
  `open-questions.md` (the change protocol), then gets designed.
- Never expands scope — "this screen also needs a settings page" is an inbox line, not a detour.
