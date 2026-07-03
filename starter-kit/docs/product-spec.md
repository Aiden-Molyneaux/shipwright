# {{APP_NAME}} — Product Specification

> The behavioral source of truth: **what {{APP_NAME}} does**, its data model and rules. Surfaces
> and visuals are owned by `ui-requirements.md` + `design-system.md`; endpoint shapes by
> `api-contract.md`. This document references those by ID. See [`00-INDEX.md`](00-INDEX.md) for
> the working agreement.

**Version:** 0.1 (draft) · **Last updated:** {{DATE}} · **Owner:** the spec owner (one editor)

---

## 1. Vision

{{2–4 sentences: what the app is, who it's for, and its center of gravity — the one thing it must
be great at. Write this before anything else; every trade-off below appeals back to it.}}

### Defining constraint

{{The single usage-pattern fact that shapes everything — e.g. "low-frequency, high-investment: users
open it weekly, so every session must pay off fast" or "used one-handed in the field, offline-first."
Name it explicitly; it is the tiebreaker for a hundred later decisions.}}

## 2. Personas

Name 2–5 personas and mark the **north star** — the one you favor when trading off. Most real users
are a blend; naming them keeps each feature honest about who it serves.

| Persona | Loves | Return trigger |
|---|---|---|
| **{{PERSONA_1}}** *(north star)* | {{...}} | {{what brings them back}} |
| **{{PERSONA_2}}** | {{...}} | {{...}} |

## 3. Core principles

Number them; reference them in decisions ("per principle 2"). Aim for 3–6.

1. **{{NORTH_STAR_PERSONA}}-first.** When trading off, favor {{...}}.
2. {{...}}

## 4. Glossary

Define the app's nouns once, each tagged with its ID prefix. Everything else uses these terms verbatim.

- **{{Term}}** — {{one-line definition}} (`{{PREFIX}}-`).

## 5. Feature specification

Priority: **P0** = core, can't ship without · **P1** = important to the vision · **P2** = valuable
fast-follow. One table per domain (one per ID prefix from 00-INDEX §3). Each row is one discrete,
testable behavior — the unit tests, commits, and decisions will cite.

### 5.1 System & cross-cutting (`SYS-`)

| ID | Pri | Behavior |
|---|---|---|
| SYS-01 | P0 | All data access is **ownership-scoped**: a user can only read/modify their own data. *(Keep for any multi-user backend; delete for purely local apps.)* |
| SYS-02 | P0 | All write requests are **validated server-side** (types, ranges, lengths) before persistence. |
| SYS-03 | P0 | Base URLs and all secrets are **environment-configured**, never hardcoded. |
| SYS-04 | P0 | An **automated test harness + CI** exist before feature code (see `../CONVENTIONS.md`). |

### 5.2 {{DOMAIN_1}} (`{{PREFIX_1}}-`)

| ID | Pri | Behavior |
|---|---|---|
| {{PREFIX_1}}-01 | P0 | {{...}} |

## 6. Data model

The entities and their relationships — names, key fields, ownership. Keep it conceptual (the schema
lives in code/migrations); this section is what the migrations must agree with.

## 7. Out of scope / parked

What v1 deliberately does **not** do, so it never creeps back in silently. Reversing a parked item
is a `decisions.md` entry, not an edit here.

- {{...}}

---

## Changelog

- **0.1** ({{DATE}}) — initial scaffold from the starter kit.
