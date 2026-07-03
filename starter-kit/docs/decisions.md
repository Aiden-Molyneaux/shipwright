# Decisions — the append-only log

> **Why we chose what we chose.** One entry per decision, newest first, numbered `D-NNN`
> append-only (never renumber, never delete — a reversed decision gets a *new* entry that cites the
> old one). Every resolved item in `open-questions.md` must trace to an entry here (the health
> check enforces it). Keep entries short: the ruling and the why, not an essay. A decision that
> locks something painful to reverse (architecture, auth model, money, destructive migration) is
> flagged **[LOCK]** and needs the owner's explicit sign-off recorded in the entry.

**Format:**

```
## D-NNN — <title>  (<date>)
**IDs:** <stable IDs touched> · **Resolves:** <OQ-refs, if any> · **Owner:** <signed-off? [LOCK]?>
<The ruling in 1–3 sentences. The why in 1–3 more. What was rejected and why, if it matters.>
```

---

## D-001 — {{First decision title}} ({{DATE}})
**IDs:** — · **Resolves:** — · **Owner:** —
{{The scaffold's first real entry is usually the architecture/stack lock — record it here before
the first line of feature code.}}
