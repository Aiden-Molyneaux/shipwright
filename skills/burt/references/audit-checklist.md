# Burt — layered audit checklist (template)

The per-layer structure behind SKILL.md step 2. This is the **generic skeleton**: each layer names
*what to check*; the project's `design-system.md` supplies the values. Instantiate it per project —
fill each layer with the project's actual tokens, sizes, and rules, and delete layers the project
has no rules for. A fully-instantiated example lives in each adopting project's own skill copy.

Order the pass: **Type → Tokens/Fonts → Components → Interaction affordances → Lifecycle → Hygiene**.
Name the project's exempt chrome up front (doc frames, captions, print plates — whatever is *not*
app UI) and keep it exempt in every layer.

## 0 · Fixed component sizes — enumerated, not derived
If the catalog fixes component sizes (cards, tiles, avatars), the blessed sizes are an **enumerated
list, not a ratio**: a correct aspect ratio at a non-catalog size is still off-guide. Check the real
rendered dimension against the list. An in-between size is a finding — snap to the nearest catalog
size, or raise a new size as an **owner-ratification** call (never a silent custom size).

> INSTANTIATE: the size table (name · dims · use), and the grep in `scripts/preflight.sh`.

## 1 · Type scale — the most-missed layer
On-surface type sizes are **only** the §3 ladder. Build two aids per project:
- the **role map** (px → role → used-for), so a fix names the right target, and
- the **culprit map** — the off-scale values that keep appearing and where each snaps
  (e.g. `13 → body-or-emphasis`, `16/17 → emphasis-or-display`).
Decide the default for empty-state / error titles once, and write it down. Exempt chrome keeps its
tiny print sizes.

## 2 · Colour tokens — flag off-token colour
Use the token variables / catalog hexes; flag raw off-token colour on-surface. List the project's
**restricted tokens** (an accent that belongs to one surface, a value-colour reserved for one
meaning): for each, *every* appearance is confirmed against its rule, not just eyeballed. Name the
**load-bearing distinctions** — the pairs of similar-looking tokens whose swap is a real defect,
not a style choice — and check them explicitly.

## 3 · Fonts — exactly the blessed voices
The §3 fonts and no others: no system-font fallbacks (beyond the ones the token defs themselves
declare), no icon fonts, no surprise third voice. If the project prescribes a loading pattern
(e.g. `media="print" onload` + a `<noscript>` fallback), its **absence** is the finding. If assets
must be inline (hand-drawn SVG only), external image/icon references are findings too.

## 4 · Locked component names — compose, don't reinvent
A new screen composes from the catalog's locked component names. A genuinely-new component is
allowed but must be **flagged for owner ratification** — never silently dropped in as a near-dupe
of an existing one. Keep the roster current from the catalog; note in-flight renames (an old name
may linger in prose while the new grammar is already binding on pixels).

> INSTANTIATE: the component roster, grouped the way the catalog groups them.

## 5 · Interaction affordances — the press/selection grammar
Whatever the owner has ratified for pressed/selected/disabled states is law: flat vs raised,
travel vs no-travel, which marker means selection. Two things matter beyond the rule itself:
- the **exceptions** — surfaces that legitimately keep a different physics (write them here so
  they're never flagged), and
- the **restricted-intent colours** — a token that encodes intent (e.g. "this colour = this class
  of action") checked against the intent, not just the palette.

## 6 · Lifecycle / states — if the board claims them
A converged states board renders the full lifecycle family; a draft may defer them **with a note**.
Check against the project's state grammar (loading, retryable error, terminal error, offline —
whatever §4 defines): the visual grammar per state, that retryable vs terminal copy matches, and
that any gating (e.g. offline write-gating) actually renders — dimmed affordances, not just prose.

## 7 · Standalone-file hygiene
Whatever the mockup format's hygiene rules are: self-contained (inline styles, inline assets), no
raster artifacts, no external deps beyond the blessed hosts, no leftover self-check screenshots.
Absence-checks belong here too (a required fallback or meta block that must exist).

## 8 · Pre-flight grep patterns — the mechanical net
`scripts/preflight.sh` (adapt the nets to §3) runs before the read-through. **Every hit is a
candidate, not a confirmed violation** — greps can't read intent; exempt chrome and blessed
exceptions hit the same patterns. The net only says where to look. Watch substring traps (a
leading space or `\b` so `8px` doesn't match inside `18px`) and keep each net's exclusion list
next to the net.

## Judgment calls — don't over-flag
- A restricted token used as **decoration** (a trophy glyph, a rank chip) where sibling grammar
  already established it → **owner-ratification**, not a violation — unless it's a *control*.
- **"It matches the sibling board"** is not a conformance argument — peer boards carry known
  drift. Audit to the catalog + in-flight directives, never to a neighbour.
- A finding already logged in the project's open-questions → report as **"known — <id>"**: still
  listed (the owner sees it's tracked), never presented as a fresh surprise.
