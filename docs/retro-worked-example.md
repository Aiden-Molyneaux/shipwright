# Retro worked example: the InProgress roster review, 2026-10-14

InProgress adopted the roster on branch `roster-plan` (step #421). The branch review, an Opus
`code-reviewer` pass (Murr's predecessor), found four majors, all in workflow files, all fixed on
the branch (source: `~/.inprogress/resources/shipwright/2026-10-14-land-the-roster.md`, lines
19 to 23 and 42). Written as Sigmund's workflow notes, they would have been:

    workflow note [.claude/agents/murr.md] defect: Murr's CHECKS fill included the e2e check, and Murr has no port of his own · none measured · fixed locally
    workflow note [scripts/context-nudge.mjs] defect: both nudges cite CLAUDE.md Session rhythm, which the adoption removed · none measured · fixed locally
    workflow note [.claude/agents/moh.md] defect: the description holds ": " in a plain YAML scalar, so Moh might not load · none measured · fixed locally
    workflow note [CLAUDE.md#Routing] defect: routing moved into Sigmund, who loads only for change work, so non-change sessions lost it · none measured · fixed locally

All four are reviewer findings, so all four are `defect`, whatever else they are (the nudge is
also a misfire, the e2e case also a lie). Each one is a trigger on its own. The retro's sort:

| Key | Home | Proposal |
|---|---|---|
| `.claude/agents/murr.md` | both | Template: `agents/murr.md` takes the project's whole check list, so every project that fills it with a port-bound check repeats this. Proposed: give Murr only the checks that need no port. Fill: done locally (typecheck and unit). |
| `scripts/context-nudge.mjs` | fill | Fixed locally. The template has no line that cites a CLAUDE.md section, so there is no template twin. A possible proposal for the adoption section: grep the project for each CLAUDE.md heading the adoption removes. Proposed only if a second project hits it. |
| `.claude/agents/moh.md` | both | Template: `agents/moh.md` has the same unquoted ": ". Proposed: quote it, and add a frontmatter parse to the adoption checks. Fill: done locally, and the project's agent test now fails on an unquoted description. |
| `CLAUDE.md#Routing` | both | Template: `starter-kit/CLAUDE.md` says routing lives in Sigmund; a session that is not change work never loads him. Proposed: the line keeps Model routing in force for every session. Fill: done locally (a house-rule bullet). |

The same session had a fifth, quieter note: the Opus reviewer hit its 40-turn limit and reported
only when asked, at 54% of the session's cost.

    workflow note [.claude/agents/code-reviewer.md] dispatch: hit the 40-turn limit, reported when asked · 54% of the session's cost · open

One hit, no repeat: a watch, not a proposal. A watch keeps its note in the count, so the next
note on that key is the second, and would make raising `maxTurns`, or splitting the pass, a
proposal with two sessions of cost behind it.

In the event, the template follow-ups went to Shipwright by hand the same day. With the retro in
place they would arrive as one proposal file, approved per item.
