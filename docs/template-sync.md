# Template sync

How a workflow change made once in Shipwright reaches every project that adopted the templates
(InProgress now, InThink and InGame next). Approach B (Aiden, 2026-10-16): each project keeps
full filled copies, records what it adopted from, and a sync three-way merges the template
changes since then into its copies. The sync runs in the project's own session, and that
project's Murr reviews the result. Nothing in Shipwright ever writes into a project.

Status: design, for review on #457. Nothing below is built yet.

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

`templates.json` at Shipwright's root lists every file a project can adopt and sync: the four
agent wrappers, the roster skills (sigmund, murr, parvati, doctor-nick, retro), and the starter
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
5. Clean merge: the file is written and its `base` moves to `<to>`. Conflict: the file is written
   with markers and gets `"pending": "<to sha>"`; `base` stays.
6. The report lists, per file: unchanged upstream, merged clean, conflicts (with hunk count), and
   any new placeholder in theirs that has no fill. Then templates that are new, renamed or gone
   upstream.

After the session resolves the markers (with Murr reviewing, as for any change),
`template-sync.mjs --accept` checks each pending file has no markers and no `{{`, then moves its
`base` to `pending`. Nothing is committed by the script; the project's session commits the
merged files and the manifest together, through its own gates.

**`--dry-run`** does steps 1 to 4 into a scratch folder and prints the report. It writes nothing
in the project. **`--check`** prints, per file, how many Shipwright commits touched its template
since `base`, plus the unmapped templates, and exits 1 when anything is behind. That is what a
"behind Shipwright" line in Mip's digest would call.

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

**Local changes worth upstreaming.** A project's own improvements (InProgress's #442 and #455
Sigmund title rules) survive the sync as local edits. Proposing them back to Shipwright stays
the retro's job.

## The first sync, from InProgress (dry, from the scratch run)

Merging the eight InProgress files from their adoption commits to `6c95f0c`, with CRLF handled
but without fills, gives 15 conflict hunks across all eight files. By cause: filled lines the
template reworded (Moh, Sev, Murr wrapper, Parvati wrapper), convergent 7c fixes (Murr and
Parvati report headings, Parvati's preflight line, Doctor Nick's protected-lanes bullet),
`[edit]` sections both sides changed (Sigmund's risk statement and merge gate), and Sigmund's
"Adopting this template" section. Fills and the section drop should remove the first and last
groups; the build step reruns this with a backfilled manifest and records the numbers.

## What changes in InProgress (through its own session)

Proposed as steps in project `inprogress`, not done from here:

1. Backfill `.claude/shipwright.json`: the eight files, their bases, the fills taken from its
   copies, and `skip` for `parvati-shared` and `retro` (until it adopts the retro).
2. Run the first real sync and resolve it with Murr.
3. A "behind Shipwright" line in Mip's digest from `template-sync.mjs --check`.

## Open for review

1. Per-file `base` with `pending`, instead of one project commit that moves only when every file
   merged.
2. Recording `fills` in the manifest, so filled lines stop conflicting.
3. `[edit]` sections keep conflicting when both sides change them.
4. A `templates.json` list in Shipwright rather than inferring templates from the folder layout.
5. Retro's `{{WORKFLOW_FILES}}` already records which template each file came from. Deferred:
   point it at the manifest instead of repeating it.
