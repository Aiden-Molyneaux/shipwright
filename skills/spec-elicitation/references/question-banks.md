# spec-elicitation — question banks + the baseline surface taxonomy

Read during the moves; don't recite at the owner. These are the questions the agent asks
**itself** (and the owner, when only the owner can answer) so the hard ones come by default.

## §1 · Baseline surface taxonomy (the surface-storm primer)

Almost every app has most of these; naming them kills the cold-start. Provisional by design —
strike what doesn't apply, and expect the specialized surfaces (the ones that make THIS app
itself) to emerge from walks, not from this list.

| Surface | Prompt |
|---|---|
| Entry / auth | How does someone get in? Accounts at all? Guest mode? |
| Onboarding / first-run | What must a new user do/feel in the first 2 minutes? What seeds their empty world? |
| Home — the core-object view | The screen the app IS: the collection/list/feed/canvas of the central noun. |
| Detail view | One instance of the core noun, in full. |
| Create / edit flow | How the core noun comes to exist and changes. |
| Search / browse | How anything is found once there's more than a screenful. |
| Profile / identity | Who am I here? Public vs private self? *(multi-user)* |
| Social / sharing | Who sees my stuff, how? *(if at all)* |
| Notifications | What reaches out to the user, and where do taps land? |
| Settings + help/feedback/legal | Preferences · account actions · contact/report · ToS/privacy. |
| Commerce | Store / purchase / wallet, if money exists. |
| Admin / moderation | Who cleans up? What tools do they need? *(UGC apps — always forgotten)* |

## §2 · Per-surface walk bank (the workhorse questions)

- **Verbs:** what can the user DO here? (List them; a surface with no verbs is a report, fine —
  but say so.)
- **Leads-to:** for each verb — where does the user land afterward? *(the discovery engine: every
  answer is a surface or flow that must exist)*
- **Data:** what feeds this screen? Where did that data come from — which surface created it?
- **First-run/empty:** what does this look like with zero data? What's the user's move from there?
- **Extremes:** 1 item · 1,000 items · the 40-character name — does the surface's concept survive?
- **Personas:** for each — what do THEY do standing here? What do they wish this screen did?
- **Failure:** what does the user see when the load fails / they're offline?
- **Abuse:** what's the worst thing a hostile user does with this surface? Who cleans it up?
  *(any UGC or social feature)*
- **Absence:** if this surface didn't exist, what breaks? *(a "nothing" answer is a cut candidate
  for G-1)*

## §3 · Per-feature bank (run at candidate capture)

- Which persona does this serve, concretely? (No persona → why is it here?)
- Does it create a **return trigger**, serve a session, or serve setup? (Tag it.)
- What does it demand of the data model? Of other surfaces?
- What's the cheapest version that tests the value? What's the expensive part, and is it needed
  on day one? *(priority evidence for P0/P1/P2)*
- What new failure/abuse surface does it open?

## §4 · Persona journey bank (move 3)

- **Day-one:** install → first payoff. Where's the friction? Where's the first "oh nice"?
- **Return-trigger:** what *specifically* brings them back Tuesday week 3 — and does a
  notification/feature actually fire for it, or are we hoping?
- **Power path:** after 6 months and 500 items — what do they need that day-one them didn't?
- **Exit:** they leave / delete their account — what do they expect happens to their data?

## §5 · Big-ideas interlude prompts (move 4)

- "Five outside-the-box ideas for <domain> — no feasibility filter, capture-only."
- "What would the 10× version of this feature be? The zero-UI version?"
- "What's the feature nobody's asking for that would make someone tell a friend?"
- "Steal shamelessly: which app does <job> best, and what's its trick translated here?"
- Then, always: triage the batch — inbox each keeper as an OQ, park or drop the rest, spec none.
