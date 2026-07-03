# Mockups — the directory convention

> How design deliverables live in this repo. The convention exists so the owner can review any
> mockup by **opening the HTML file directly**, so drafts and the converged truth never blur, and
> so the build always knows exactly which file it implements from.

## The rules

1. **HTML only — never image files.** Every mockup is a **standalone HTML artboard**: inline CSS,
   no external dependencies (fonts may load from a CDN with a fallback), renders by double-click.
   Agent screenshots are for self-verification only and are **deleted before the turn ends** — no
   `.png`/`.jpg` artifacts are ever committed.
2. **One subfolder per surface** (`mockups/<surface>/`), matching the `ui-requirements.md` §2 rows.
   Cross-surface specimens (the design-system catalog, token sheets) live at the mockups root.
3. **Drafts explore; the states board is the truth.**
   - Exploration files are named `<surface>-draft-<x>-<idea>.html` — typically **2–3 genuinely
     distinct interaction models** (different models, not palette swaps) for the owner's pick.
   - When the owner picks a direction, it converges into **one canonical
     `<surface>-states.html`** — the full board: every core state **plus the complete lifecycle
     matrix** (loading · empty · error · offline{{...}}, per `design-system.md` §4). This is the
     only file the build composes from; `ui-requirements.md` §2 records it in **Implements-from**.
4. **Retired files are kept for history, banner'd.** A superseded draft/board gets a one-line
   `<!-- RETIRED <date>: superseded by <file> -->` banner at the top; never silently deleted, never
   used as a build source.
5. **Design-system conformance is audited, not assumed.** Before any mockup reaches the owner (a
   gate, a converge, a presentation), run the design-file reviewer against `design-system.md` §2
   foundation rules. The recurring misses are the small ones — off-ladder type, accent misuse — so
   run it even for one-line changes.
6. **Behavior questions raised while designing go to `open-questions.md`** — never drawn into the
   mockup as invented behavior, never patched into a spec.

## After every draft pass

Update `ui-requirements.md` §2 (the surface dashboard) — state, implements-from, AC/spec/contract
columns — and surface the changed rows to the owner in the wrap-up.
