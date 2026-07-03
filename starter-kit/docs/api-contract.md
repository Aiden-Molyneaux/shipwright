# {{APP_NAME}} — API Contract

> The **frontend↔backend seam**: endpoints and payload shapes. Behavior lives in
> [`product-spec.md`](product-spec.md); shapes live here, referenced by stable ID. Refined
> alongside the design work, because surfaces reveal exactly what each call must return.
>
> **Backend-less app?** Delete this file, remove its row from the 00-INDEX §1 register, and skip
> every "contract" column/rule elsewhere — the health check adapts automatically.

**Version:** 0.1 (draft) · **Last updated:** {{DATE}} · **Owner:** the spec owner (one editor)

---

## Conventions

- **Base URL:** environment-configured (SYS-03). Paths below are relative to `{{/api}}`.
- **Auth:** {{e.g. `Authorization: Bearer <accessToken>`; short-lived access + refresh rotation — or "none, delete this line".}}
- **Ownership:** every authenticated endpoint is scoped to the caller (SYS-01); the server never
  trusts an id in a request body to identify the actor.
- **Validation:** all bodies validated server-side (SYS-02); invalid → `422`.
- **Errors:** one shape, `{ error: { code: string, message: string } }`. Codes are stable strings
  registered here (`VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`, `RATE_LIMITED`, `SERVER_ERROR`, …).
  New codes are **append-only** additions to this registry. A `SERVER_ERROR` body is generic — never
  the exception text (internals go to the error tracker).
- **Lists:** cursor pagination → `{ items: [...], nextCursor: string | null }`.
- **IDs:** {{UUIDs (string)}}. **Timestamps:** ISO-8601 UTC strings.

> **Make the contract executable if the stack allows it:** share the validation schemas (e.g. zod in
> a shared package) between client and server, transcribed field-for-field from this document — then
> the contract can't silently drift from the code (see `../CONVENTIONS.md` rule 3).

## {{DOMAIN_1}} (`{{PREFIX_1}}-`)

| Method | Path | Body → Response · notes |
|---|---|---|
| GET | `/{{resource}}` | → `{ items: [...] }` — {{what it returns, which IDs it serves}} ({{PREFIX_1}}-01) |
| POST | `/{{resource}}` | `{ ... }` → **201** created — {{...}} ({{PREFIX_1}}-02) |

---

## Changelog

- **0.1** ({{DATE}}) — initial scaffold from the starter kit.
