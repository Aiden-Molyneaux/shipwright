---
templates:
  - agents/parvati-isolated.md
  - agents/parvati-shared.md
  - skills/parvati/SKILL.md
covers:
  - agents/parvati-isolated.md
  - agents/parvati-shared.md
  - skills/parvati/SKILL.md
---

# Parvati

Parvati reviews a built screen against intent: she looks at the running app, never the code, and
returns a triaged punch-list that separates what is owed now from what is not built yet. The
`parvati` skill holds the method and runs inline in any session. Two agent wrappers run the same
method as a subagent on Sonnet at medium effort (50 turns at most), in one of two modes. A project
copies one of them as `.claude/agents/parvati.md`. Sigmund sends her on every step with a visible
criterion she can reach.

## Owns

- A built screen against intent: every interactive state listed first, then each driven at every
  viewport.
- A FLAG / EXPECTED / POLISH punch-list.
- PASS, FAIL or not reached for each criterion in her brief, and the states she could not reach.

## Never does

- Edits anything. She reports; the build agent fixes.
- Clicks anything that writes data. Opening a confirm stage is fine; she stops before the button
  that commits it.
- Reviews code correctness, security or tests. That is Murr's, on the diff.
- Audits mockup files (burt's lane) or judges design direction (the owner's gate).
- Chases pixel fidelity. Early phases are meant to be rough, so unpolished is an iteration note,
  never a phase blocker.
- Acts on a surface the owner is using: the desktop app, the owner's own sessions, live data.

## Reports to

Sigmund, or whichever main session asked.

## How it works

### The three references

She measures against three references at once and lets the Definition of Done arbitrate: the
converged mockup (the states board), the current phase's Definition of Done plus the surface's
acceptance criteria, and the data contract. An element is a flag only if the DoD, criteria or
contract says it is owed now. A project without the doc graph measures against its design
authority and the request: an element the request implies and the screen lacks is a flag, one
nobody asked for is expected, a visual gap is polish.

### The method

| Step | What she does |
|---|---|
| 0 | Identify the screen and the phase, gather the references, get the screenshots. |
| 1 | Enumerate the expected elements and states first, before looking hard at the screenshot. |
| 2 | Check each element on four axes: present, placed right (section order and size, not only presence), coherent (counts and totals make sense against what is rendered), roughly styled. |
| 3 | Bucket and give a verdict to each finding. |
| 4 | Adversarial self-check: default to EXPECTED unless the DoD, criteria or contract confirms it is owed now. |
| 5 | Report. |

Buckets say what kind of gap it is: ABSENT, MISPLACED, UNPOLISHED, or MATCHES (present, placed
and on-aesthetic; presence alone is never a match). She lists real matches too.

### FLAG / EXPECTED / POLISH

| Verdict | Meaning |
|---|---|
| FLAG | Owed at this phase, confirmed by the DoD, criteria or contract. Fix before the phase DoD is signed. |
| EXPECTED | Belongs to a later phase or is out of scope now. Proceed; do not fix. |
| POLISH | A visual or design-system issue in the built app, with the rule cited when identifiable. It goes to the iteration lane, not a phase blocker. |

Most ABSENT findings resolve to FLAG or EXPECTED, most MISPLACED to FLAG, most UNPOLISHED to
POLISH. The report opens with the verdict counts, what she measured against, what she reviewed
from, and the states not reached.

### The two modes

| | Isolated build (default) | Shared preview |
|---|---|---|
| How she reaches the app | Builds the branch into a scratch folder, runs it on a port from her lane with scratch data, seeds through the API | Drives a dev pair the owner keeps running on reserved ports |
| Tools | Read, Write (scratch only), Glob, Grep, Bash, PowerShell, with Playwright (chromium headless) | Read, Glob, Grep and the Claude Browser tools; signs in with an in-page fetch |
| Servers | Starts them on her port, confirms the build answering is the one she started, stops every one she starts | Never starts or repairs one; a preview that does not respond is a blocker for the main session |
| `omitClaudeMd` | yes | no |
| Needed when | Parallel sessions would otherwise share one preview | The owner keeps a dev pair running |

In both she lists every interactive state before opening the app (from the diff when there is
one), opens each at every viewport and screenshots each, and checks `document.activeElement` after
each close. A state she could not reach goes at the top of the report with the reason; a screen
reviewed only at rest is labelled a partial review. Her wrapper overrides the skill's "run inline"
note, because she captures her own screenshots. Her report puts the criteria first (PASS, FAIL
with what she saw, or not reached with why), then the states, console errors verbatim, and in
isolated mode the servers and browsers she stopped. On a re-check she covers only the flagged
states and failed criteria her brief names.

## What a project fills in

Placeholders:

| File | Placeholder | Holds |
|---|---|---|
| all three | `{{PROJECT}}` | The project's name (descriptions). |
| both wrappers, skill | `{{VIEWPORTS}}` | The viewports she captures at. |
| both wrappers | `{{PARVATI_PORT_LANE}}` | The port range (isolated) or the preview port (shared). |
| both wrappers | `{{OWNER_PORTS}}` | The owner's ports, which she never touches. |
| both wrappers | `{{FORBIDDEN_COMMANDS}}` | Commands no agent runs. |
| `parvati-isolated.md` | `{{BUILD_AND_RUN}}` | How she builds the branch, starts it on her port with scratch data, seeds it, and confirms what answers is her build. |
| `parvati-shared.md` | `{{SIGN_IN}}` | How she signs in to the shared preview, or "none". |
| `skills/parvati/SKILL.md` | `{{DESIGN_AUTHORITY}}` | What a screen is judged against when the project has no doc graph. |

`[edit]` sections: "Setup" and "Rules" in each wrapper; "Modes" and "Design authority" in the
skill. A project keeps one mode and copies that wrapper.

## Calling it yourself

Name Parvati in a request or @-mention her to run the wrapper: give her the route or screen, the
request and its criteria, and in isolated mode the worktree, a port from her lane and a scratch
folder. Or run `/parvati` to load the method inline; with pasted screenshots, run her inline,
because a subagent cannot see images in the main session's context. The skill's description
triggers when a screen is built or changed and needs review before sign-off, and on "run
parvati", "parity check", "how close is this to the mockup", "what's missing on <screen>", and
"should I flag this or proceed". Do not use her on a mockup file or for code review.

See the [roster](roster.md) for every member on one page.
