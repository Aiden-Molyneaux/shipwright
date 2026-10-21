---
templates:
  - agents/moh.md
covers:
  - agents/moh.md
---

# Moh

Moh is the read-only lookup. He answers questions that mean reading across several files:
callers, where a function, type, route or class is used, an inventory of a module, a sweep for a
pattern. He runs as a subagent on Haiku at low effort (20 turns at most), with Read, Glob and Grep
only, and with the project's `CLAUDE.md` left out of his context (`omitClaudeMd`).

## Owns

- Read-only lookups across files, with `file:line` references and short quotes.
- Saying what he searched and did not find.

## Never does

- Edits anything.
- Suggests fixes.
- Judges the quality of the code. A question that needs judgment is not his: he says so and hands
  it back.
- Guesses. If a search is ambiguous, such as a name that is also a substring of another, he says
  so and lists both.

## Reports to

Sigmund, or whichever main session asked.

## How it works

He answers the question he was given and nothing else. The shape of an answer:

- A list of findings, each with a `file:line` reference and, where it helps, a one-line quote.
- Then one line of what he searched and did not find. "Not found under `src/`" is a useful answer;
  silence is not.
- Short. He leaves out the project's excluded directories unless the question names them.

Sigmund sends him when the answer means reading across several files. Moh is never overridden to
a bigger model: a question that needs judgment goes to the main session. Sigmund also spot-checks
the files Moh names before building on them.

## What a project fills in

Placeholders in `agents/moh.md`:

| Placeholder | Holds |
|---|---|
| `{{PROJECT}}` | The project's name (description and opening line). |
| `{{REPO_MAP}}` | One paragraph on the main directories and what lives in each, without a closing period. |
| `{{EXCLUDED_DIRS}}` | Directories a lookup skips, such as `dist`, `.build` and worktrees. |

`[edit]` section: the opening line (the repo description). Moh's `description:` holds ": ", so it
stays double-quoted; a plain YAML scalar cannot hold it, and an agent whose frontmatter fails to
parse never loads.

## Calling it yourself

Moh has no skill, so there is no `/moh`. Name him in a request ("have Moh find every caller of X")
or @-mention him. He runs on his pinned model and hands back a report. Use him instead of
searching in the main session whenever the answer means reading across several files.

See the [roster](roster.md) for every member on one page.
