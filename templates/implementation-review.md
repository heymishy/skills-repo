# Implementation Review: [Story Title]

<!--
  USAGE: Produced by /implementation-review.
  Two stages: spec compliance first, then code quality.
  Critical issues block progress. Important issues must be resolved before PR.
  
  This artefact is produced inline in the session — not saved as a separate file
  unless the team chooses to archive it.
  
  To evolve: update templates/implementation-review.md and open a PR.
-->

**Story reference:** [Link to story artefact]
**Review stage:** Post-task batch / Pre-PR / Pre-verify-completion
**Reviewed by:** Copilot / [human name]
**Date:** [YYYY-MM-DD]

---

## Stage 1 — Spec compliance

| AC | Status | Evidence | Notes |
|----|--------|----------|-------|
| AC1: [title] | ✅ Satisfied / ❌ Missing / ⚠️ Partial | [test name or observable behaviour] | |
| AC2: [title] | ✅ / ❌ / ⚠️ | | |
| AC3: [title] | ✅ / ❌ / ⚠️ | | |

**Extra scope detected:** [None — or describe anything implemented beyond the ACs]

**Outcome:** ✅ All ACs satisfied — proceed to Stage 2 / ❌ Fix required before Stage 2

---

## Stage 2 — Code quality

| Severity | Finding |
|----------|---------|
| 🔴 Critical | [Code crashes, security concern, tests don't verify claimed behaviour] |
| 🟡 Important | [Logic error, naming obscures intent, risky duplication] |
| ⚪ Minor | [Magic numbers, style inconsistency] |

**Critical:** [n] — must fix before proceeding
**Important:** [n] — must fix before opening PR
**Minor:** [n] — note and proceed

**Outcome:** ✅ No Critical or Important findings / ❌ Fix required

---

## Summary

> [One sentence: e.g. "Implementation review passed — 4 ACs confirmed, no critical findings, 1 minor style note."]

**Next step:** [/verify-completion — or — fix [finding] then re-run review]
