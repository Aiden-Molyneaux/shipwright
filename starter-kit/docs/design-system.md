# {{APP_NAME}} — Design System

> The visual source of truth: the **aesthetic profile**, the **foundation rules**, the **tokens**,
> and the **component map** (design name → code symbol). Every mockup and every built screen is
> audited against this file — the design reviewer's findings cite rules by number (`F-01`), never
> taste. What each surface must *do* lives in [`ui-requirements.md`](ui-requirements.md).

**Version:** 0.1 · **Last updated:** {{DATE}} · **Owner:** the spec owner; direction picked by {{OWNER_NAME}}

---

## 1. Aesthetic profile (filled at scaffold, refined in the design stage)

The paragraph that makes taste reviewable. Be specific enough that a reviewer can say "this
violates the profile" — mood boards are optional, adjectives with teeth are not.

- **Mood in five words:** {{e.g. "retro arcade trophy case" / "calm clinical utility"}}
- **Bold where:** {{the 1–3 surfaces/moments where delight lives and novelty is welcome}}
- **Conventional where:** {{navigation, forms, dense lists — wayfinding is never a puzzle}}
- **References:** {{apps/games/objects the aesthetic descends from}}
- **Never:** {{the anti-list — e.g. "no gradients, no skeuomorphic leather, no stock icon fonts"}}

## 2. Foundation rules (F-01..F-0n)

The short list of **numbered, checkable laws** every screen obeys. These are the audit contract:
each rule states the law, then *what a reviewer checks*, so violations are findable mechanically.
Start with 4–8; grow only when a real recurring miss earns a rule. Two worked examples — replace
with your own:

- **F-01 — One type scale.** On-screen text uses only the sizes in §3 ({{e.g. 21/15/11/9}}px), each
  with a named role. → *Check: every `font-size` is on the ladder.* The most common miss in
  practice is a stray 13px — audit sizes, not vibes.
- **F-02 — {{Accent color means one thing.}}** {{e.g. "gold appears only on value/purchase actions;
  the neutral accent carries everything else."}} → *Check: every use of `--{{accent}}` maps to its
  meaning.*
- **F-03 — {{...}}**

## 3. Tokens

Single source for values; mockups and code both read these (in code: a theme module — no literals).

| Token | Value | Role |
|---|---|---|
| `--bg` | {{#...}} | {{...}} |
| `--ink` | {{#...}} | {{...}} |
| `--accent` | {{#...}} | {{...}} |
| type scale | {{21 / 15 / 11 / 9}} | {{display / emphasis / body / micro}} |
| fonts | {{one or two, named}} | {{which surface each owns (F-0x)}} |
| spacing step | {{4 or 8}} | all gaps are multiples |

## 4. Lifecycle grammar (state components, built once)

Loading, empty, error, offline{{, unavailable}} are **one named component family**, designed once
and reused on every surface — never re-improvised per screen. Every converged states board renders
them (see `design/mockups/README.md`).

| State | Component | Notes |
|---|---|---|
| Loading | `Skeleton` | {{...}} |
| Empty | `EmptyState` | inviting, with a next action — never a dead end |
| Error | `LoadError` | always carries retry |
| Transient failure | `Toast` | non-blocking; retry where the action is safely repeatable |

## 5. Component map (design name → code)

The naming bridge, so the build implements each shared component **once**. Law: **one code symbol
per name, verbatim; variants are props, never new components** (`Button/primary` ⇒
`variant="primary"`). A new component starts here, then lands in code — code-first components go to
`open-questions.md` first. Mockup CSS class names are throwaway evidence, never the API.

| Component | Variants | Code symbol | Status |
|---|---|---|---|
| {{Button}} | {{primary / secondary}} | `{{Button}}` | ⬜ |
| `Skeleton` / `EmptyState` / `LoadError` / `Toast` | — | same | ⬜ |

---

## Changelog

- **0.1** ({{DATE}}) — initial scaffold from the starter kit.
