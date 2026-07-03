---
name: <kebab-case-name>
description: >-
  <WHAT it does in one clause, then WHEN — trigger-dense: name the literal phrases that should
  invoke it ("run <name>", "review the <artifact>", "is this <bar>-compliant") AND the task-type
  trigger (the situation that should invoke it even when nobody says the name — e.g. "whenever you
  have built or changed X and are about to present it / reach an owner gate"). End with the
  NEGATIVE scope: "Do NOT use <name> for <the neighboring lane> — that is <other skill>'s job."
  This field is the router: everything the harness uses to decide whether to load the skill lives
  here, so spend words on triggers, not on restating the method.
---

# <Name> — <the lane in five words>

<The mission paragraph: what question this skill answers, why it exists (the failure it prevents —
name the real miss that motivated it if there is one), and where it sits relative to its
neighbors. One paragraph. A reviewer's mission always includes: it REPORTS so the working agent
fixes — it never edits the artifact itself.>

<If this is a reviewer, add the lane sentence: "X reviews <artifact> only. <Adjacent concern A> is
<skill>'s lane; <adjacent concern B> goes to <doc/process>, never into X's report.">

## When to run

<The trigger boundary, spelled out: the moments it MUST run (before an owner gate, before claiming
done, on demand), and the moments it must stay quiet. If it's cheap, say "run it even for a
one-line change — the recurring misses are the small ones.">

## The authority — read in this order

<The project docs whose rules this skill cites, ordered, each with why. Reviewers judge against
citable rules, not taste. Include the "reconcile" step if living docs can override the stable
authority (in-flight directives, known-drift OQs): a finding already logged is reported as
"known — OQ-xxx", not a fresh surprise.>

1. **`docs/<owner-doc>.md`** — <the ground truth this skill enforces>.
2. **`docs/<living-doc>.md`** — <the in-flight direction that qualifies it>.
3. **`docs/open-questions.md`** — <known drift the owner is already resolving>.

## The method

0. **Identify the target.** <How scope is determined when not named: git diff, the changed files,
   the screen under review. Never audit "everything" by default.>
1. **<Mechanical pre-flight.>** <Greps/scripted checks that surface candidates. State the law:
   every hit is a CANDIDATE, not a finding — confirm each by reading the cited line.>
2. **<The rule-by-rule / element-by-element pass.>** <For each finding capture: rule · `file:line`
   · the offending value · the exact fix · severity.>
3. **<Optional thorough mode.>** <For high-stakes runs (owner gate, converge, merge): fan out one
   sub-reviewer per layer, then adversarially verify each finding before it reaches the report.>
4. **Adversarial self-check.** For each finding, try to kill it; default to "not a problem" unless
   confirmed. <State the skill-specific default, e.g. Parvati's "default to EXPECTED unless the DoD
   confirms it's owed now.">
5. **Report** in the fixed format below. <Reviewers: report-not-edit; if the working agent then
   asks you to fix, apply the fixes and RE-RUN yourself to a clean verdict before handing back.>

## Severity

<The ladder, defined concretely enough that two runs rank the same finding the same way. Always
include an "owner-call" tier for defensible judgment calls that map to no rule — listed separately
so they read as "your call," not "you broke a rule.">

## Report format — ALWAYS use this

```
# <Name> — <lane>: <target>
**Verdict:** <PASS/SOUND ✅ | NEEDS FIXES ⚠️ (<n> blocker · <m> major)>
**Measured against:** <the authorities actually used, incl. in-flight directives applied>

## 🔴 <top severity>
- [<rule>] `<file>:<line>` — <offending value> → <the exact fix>

## ✅ Verified clean
<what was actively checked and held — a verdict must show its work>

## 🤔 Owner-call (judgment, not violations)
- <...>
```

## What <Name> does NOT do

<The anti-scope, as bullets. Always include: the neighboring lanes (by skill name), the things
that go to the change protocol instead (behavior → open-questions.md), and "it does not invent
rules — a finding that maps to no rule is an owner-call note.">
