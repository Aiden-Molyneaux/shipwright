---
covers:
  - scripts/template-sync.mjs
  - templates.json
---

# Template sync

How a workflow change made once in Shipwright reaches every project that adopted the templates
(InProgress and InThink now, InGame next). Approach B (Aiden, 2026-10-16): each project keeps
full filled copies, records what it adopted from, and a sync three-way merges the template
changes since then into its copies. The sync runs in the project's own session, and that
project's Murr reviews the result. Nothing in Shipwright ever writes into a project.

Status: built (`scripts/template-sync.mjs`, `templates.json`); design approved by Aiden on
2026-10-16 (#457). InProgress and InThink keep manifests; InGame is next.

## How a change reaches a project

1. **The template changes in Shipwright first.** A Shipwright session makes the change, Murr
   reviews it, it merges on the owner's go-ahead, and `DECISIONS.md` records it.
2. **Each project keeps a manifest**, `.claude/shipwright.json` (below): per adopted file, the
   template it came from, its `base` (the Shipwright commit it was last synced from), the
   project's fills, and a `skip` list.
3. **A sync step in the project's own session** runs
   `node <shipwright>/scripts/template-sync.mjs`. Per file it fills the old and the new template
   with the project's recorded values, so lines that hold a fill do not conflict, then runs
   `git merge-file --diff3` against the project's copy. A clean merge moves the file's `base`
   forward; a conflict, or a new placeholder with no fill, marks the file `pending`.
4. **The session resolves the conflicts and the project's Murr reviews the result.** `--accept`
   moves each pending file's `base` once no conflict markers or unfilled placeholders are left.
   The project commits the merged files and the manifest together and ships them through its own
   gates (for InProgress and InThink, Sigmund).

The modes: `--dry-run` previews the merge into a scratch folder; `--check` reports how many
Shipwright commits each file is behind. With `--json` (#532), `--check` prints the per-file state,
the commits behind, the fills and the last sync for a project as JSON, and `--diff <template>`
prints the adaptation and upstream diffs and the conflicting hunks of a dry-run merge. Both exit 0
whenever they could report, and 2 with the reason when they could not. InProgress's Library reads
both for its Sync view, so "which projects are behind" is a page rather than a command.

Where it still falls short:

- **Nothing syncs on its own.** A Shipwright change reaches a project only when someone files a
  sync step for it there. The Library's Sync view (and, with #461, Mip's digest) shows who is
  behind; neither runs the sync.
- **Default paragraphs can slip through.** An `[edit]` paragraph the template adds inside a
  section can merge clean over a default the project needs to change, so the sync session reads
  each one by name. In Sigmund they are the prime law and phase 7's risk statement (the fill
  table's `{{RISK_STATEMENT}}` row in `docs/roster-build-plan.md`), phase 7's check surface (named
  in the prose under that table) and the "Never covers" line (named nowhere yet).

## The manifest

Each project holds `.claude/shipwright.json`:

```json
{
  "shipwright": "C:/personal/shipwright",
  "fills": {
    "PROJECT": "InProgress",
    "CHECKS": "`npm run typecheck`, `npm test`"
  },
  "files": {
    "agents/sev.md":            { "local": ".claude/agents/sev.md",     "base": "24dabdb" },
    "agents/parvati-isolated.md": { "local": ".claude/agents/parvati.md", "base": "24dabdb" },
    "skills/doctor-nick/SKILL.md": { "local": ".claude/skills/doctor-nick/SKILL.md", "base": "9ced8b4",
                                     "fills": { "CHECKS": "..." } }
  },
  "skip": ["agents/parvati-shared.md", "skills/retro/SKILL.md"]
}
```

- **`base` is per file**, not one commit for the project. InProgress already proves the need:
  the roster came from `24dabdb` and Doctor Nick from `9ced8b4`. A per-file base also lets a
  file that merged clean move forward while another waits on a conflict.
- **`fills`** records each placeholder's value, once for the project, with a per-file override
  where a fill site was worded differently. See "Why fills are recorded".
- **`skip`** lists templates the project chose not to take. A template in neither `files` nor
  `skip` is reported as new.

## Which templates sync

`templates.json` at Shipwright's root lists every file a project can adopt and sync: the five
agent wrappers (sev, moh, murr and both Parvati modes), the roster skills (sigmund, murr, parvati, doctor-nick, retro), and the starter
kit files #456 adds. A package that adds a template adds it there in the same commit. The sync
uses the list only to report templates a project has not mapped or skipped.

## The merge, per mapped file

Run from the project's session: `node <shipwright>/scripts/template-sync.mjs [--to main]`.

1. **base** is `git show <base>:<template>`, **theirs** is `git show <to>:<template>`, both read
   from Shipwright's object store, so its working tree and current branch do not matter. `--to`
   defaults to `main`.
2. Both are **rendered**: the "Adopting this template" section is removed, then every `{{X}}`
   with a recorded fill is replaced. A placeholder with no fill is left as it is.
3. **ours** is the project's file with CRLF read as LF. The original line ending is written back.
4. `git merge-file --diff3 ours base theirs`, so a conflict shows the old template text between
   the two sides and the resolver can see what each side changed.
5. Clean merge: the file is written and its `base` moves to `<to>`. Conflict, or a new
   placeholder with no fill: the file is written as merged and gets `"pending": "<to sha>"`;
   `base` stays. The manifest is saved even when a later file fails, so a file already written
   with markers never loses its `pending`.
6. The report lists, per file: unchanged upstream, merged clean, conflicts (with hunk count), and
   any new placeholder in theirs that has no fill. Then templates that are new, renamed or gone
   upstream. It exits 1 when any file needs the session (a conflict, a fill, a skipped or failed
   file).

Before writing a file the sync checks that git can give the old version back: the local copy
must be tracked and unmodified, or the file is skipped. Each entry is validated first (a `local`
path inside the project, a `base` that is a commit), and a bad entry becomes an error row for
that file, not a failed run.

After the session resolves the markers (with Murr reviewing, as for any change),
`template-sync.mjs --accept` checks each pending file has no markers and no `{{`, then moves its
`base` to `pending`. Nothing is committed by the script; the project's session commits the
merged files and the manifest together, through its own gates.

**`--dry-run`** does steps 1 to 4 into a scratch folder and prints the report. It writes nothing
in the project. **`--check`** prints, per file, how many Shipwright commits touched its template
since `base`, plus templates gone upstream and the unmapped ones, and exits 1 when anything is
behind, pending, gone or unmapped. That is what a "behind Shipwright" line in Mip's digest would
call.

Tests: `node --test scripts/` builds throwaway Shipwright and project repos under the OS temp
folder and covers the merge, conflicts and `--accept`, CRLF and BOM, retired and new
placeholders, the Adopting drop, the refusals, the dry run and `--check`.

## The cases

**CRLF.** Projects on Windows check out with `autocrlf`, so every line of ours differs from the
LF template and the first dry merge turned each file into one whole-file conflict. The merge
reads ours as LF and restores its ending on write.

**Filled placeholders.** A filled line looks like a local edit. That is harmless while the
template leaves the line alone, but the first dry run against InProgress showed it is often not
left alone: Moh's description gained quotes, Murr's checks line was reworded, and each of those
lines also holds a fill, so each conflicted. Rendering base and theirs with the project's fills
first makes the fill part of both sides, and the template change merges clean.

**Why fills are recorded.** The alternative, merging raw templates and accepting the
conflicts, means every template edit to a line with a placeholder lands as a conflict in every
project forever. Recording fills is a one-time cost per project, and the fill table already
exists in `docs/roster-build-plan.md`. When a template changes what a fill must contain (Package
7c made the `{{REPO_MAP}}` site end its own sentence), the merge conflicts and the session updates
the fill. That is the right outcome.

**`[edit]` sections a project rewrote.** These conflict whenever the template changes the same
lines. That stays: an `[edit]` section is the project deliberately differing, and a template
change there (Package 7c's Murr checks rule, for one) is exactly what the project's session
should weigh, with the old text shown by `--diff3`. A different rule (keep ours silently, report
the template diff as advice) would let real fixes slip past. The cost is the occasional
adjacency conflict, where the template adds lines next to a rewritten block.

**Inline `[edit]` paragraphs added upstream.** A paragraph marked `[edit]` inside a section that
is not (Sigmund phase 7's check surface, #480) merges clean into any project copy that did not
touch the lines around it, so the report says "merged clean" over a default the project may need
to change. The session that runs the sync reads each such paragraph by name; "How a change reaches a
project" above lists Sigmund's four.

**Sections deleted on adoption.** Only Sigmund's "Adopting this template" is deleted by
instruction today. The renderer drops any `## Adopting this template` section from base and
theirs, so changes to it never reach the project. Any other section a project deleted on its
own behaves like an `[edit]` rewrite: a template change inside it conflicts against the empty
side, and the session decides.

**New templates and templates not taken.** A template in `templates.json` that is in neither
`files` nor `skip` is reported as new, with its path, and nothing is copied. The project adopts
it the normal way (copy, fill, map it in the manifest). A template deleted or renamed upstream
is reported, and the local copy is left alone.

**Convergent fixes.** InProgress fixed its copies locally (its `c8a58fb` and `39864da`) and
Package 7c made the template-side version of the same fixes, worded differently. The first sync
from `24dabdb` conflicts on those lines; the resolution is usually to keep InProgress's wording
or take the template's with the fill. Em dashes are the same story: InProgress stripped them from
its murr and parvati copies, so any template change to a line with an em dash conflicts. No
mechanical transform is proposed for that; it recurs only where the template edits such a line.

**Retired placeholders.** #456 replaced `{{SESSION_RHYTHM}}` with default prose. A project's
fill for it is its own text, so rendering base with that fill would make the region look
untouched locally, and the merge would silently swap the project's rhythm for the template's
(the first build did exactly that to InProgress's Sigmund). A placeholder that is in base but
gone from theirs is therefore left unfilled in base: the fill reads as a local edit, the
template's new text conflicts with it, and the report names the retired placeholder.

**New placeholders.** A placeholder in theirs that the project has no fill for stays as `{{X}}`
in the merged file, the report says "no fill for {{X}}", and the file goes `pending` even when
it merged clean. `--accept` refuses a file that still holds one, so the session records the fill
in the manifest and fills the site before the base moves.

**Line endings and BOMs.** Ours is read as LF with any BOM stripped, and written back with the
BOM and whichever ending most of its lines used. Fill values are read as LF too.

**Conflict markers left behind.** `--accept` looks for `<<<<<<<`, `|||||||` and `>>>>>>>`. It does
not look for `=======`, which is also a setext heading underline, so a stray separator from a
careless resolution passes; Murr's review of the sync commit is the check for that.

**Settings files.** `starter-kit/.claude/settings.json` is listed, because a project started
from the starter kit copied it whole and can sync it. A project that merged its two keys into
its own settings by hand puts it in `skip`; a line merge into a different settings file would
only make noise.

**Local changes worth upstreaming.** A project's own improvements survive the sync as local
edits. Proposing them back to Shipwright stays the retro's job. InProgress's #442 and #455
Sigmund rules (the review ask, the session title prefix) went upstream as a step of their own,
#471 (Package 7f). InProgress's next sync conflicts on most of those lines, and keeping its own
wording resolves them; in Phase 8 the template's two lines can merge clean beside its fill's
own `REVIEW` and `DONE` clauses, so its session deletes the duplicates.

## Backfilling a manifest

A project that adopted before the manifest existed needs its bases and fills written once.
Bases come from its adoption commits (InProgress's say "from Shipwright 24dabdb" and "From
Shipwright 9ced8b4"). Fills come from its own copies: for a placeholder inside a line, match
the template line with the placeholder as a wildcard; for a placeholder on its own line, take
what sits between the nearest unique lines above and below it. That covered most of InProgress's
fill sites mechanically; the rest were picked by hand. A fill site the project rewrote
(InProgress's Parvati build line) is left without a fill: it is a local edit, and it conflicts
when the template changes it.

## The first sync, from InProgress (dry)

`template-sync.mjs --dry-run --to template-sync` with a backfilled manifest, against
InProgress `main` at `2658cc3`, read-only. Nine mapped files and three skipped: `parvati-shared`, the starter kit's `settings.json`, and
the retro, which InProgress has not adopted yet.

| Result | Files |
|---|---|
| merged clean | sev, moh, murr wrapper, doctor-nick |
| unchanged upstream | `scripts/context-nudge.mjs` (adopted at #456's commit) |
| conflict | parvati wrapper (2 hunks), sigmund (3), murr skill (2), parvati skill (2) |

The nine hunks, by cause:

- **Convergent 7c fixes** (6): InProgress fixed its copies, and Package 7c made the same fix in
  the template with other words. The Parvati wrapper's build and preflight lines, the Murr and
  Parvati report headings (InProgress swapped the em dash for a colon, the template dropped it),
  Parvati's preflight sentence, and Murr's house-rules line.
- **Template additions next to a local block** (2): Sigmund's "a check whose definition is
  wrong" sentence after a paragraph InProgress kept, and his receipt item 6 after an item 5
  InProgress rewrote.
- **The retired `{{SESSION_RHYTHM}}`** (1): InProgress's "Across the session" against #456's
  default prose.

Before the fills and the section drop, the same merge gave 15 hunks; before CRLF handling,
every file was one whole-file conflict. Two new fills are reported: `{{WORKFLOW_NOTES}}`
(Sigmund's Workflow notes, from the retro loop) and `{{BUILD_AND_RUN}}` (the rewritten site).

## What changes in InProgress (through its own session)

Proposed as steps in project `inprogress`, not done from here:

1. Backfill `.claude/shipwright.json`: the nine files, their bases, the fills taken from its
   copies, and `skip` for `parvati-shared`, the starter kit's `settings.json` and the retro (until
   InProgress adopts it).
2. Run the first real sync and resolve it with Murr.
3. A "behind Shipwright" line in Mip's digest from `template-sync.mjs --check`.

## Decided on review (Aiden, 2026-10-16)

1. Per-file `base` with `pending`, instead of one project commit that moves only when every file
   merged.
2. Recording `fills` in the manifest, so filled lines stop conflicting.
3. `[edit]` sections keep conflicting when both sides change them.
4. A `templates.json` list in Shipwright rather than inferring templates from the folder layout.
5. Retro's `{{WORKFLOW_FILES}}` already records which template each file came from. Deferred:
   point it at the manifest instead of repeating it.
