# AC Verification Script: Structured diagnostic for invalid mermaid syntax inside a diagram

**Story reference:** artefacts/2026-08-29-diagram-validation-and-types/stories/s2-mermaid-syntax-diagnostic.md
**Technical test plan:** artefacts/2026-08-29-diagram-validation-and-types/test-plans/s2-mermaid-syntax-diagnostic-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:**
1. Start a `/design` session where a System Architecture, Program Design, or Data Model diagram is expected.
2. Have a way to inject a diagram whose mermaid content is broken (e.g. an incomplete `flowchart` string) — via developer console or by asking the model to intentionally produce one.

**Reset between scenarios:** Start a fresh diagram for each scenario.

---

## Scenarios

### Scenario 1: A broken diagram shows the specific reason it failed

**Covers:** AC1

**Steps:**
1. Trigger a diagram whose mermaid content is invalid (e.g. missing a closing element).
2. Look at where the diagram would normally appear.

**Expected outcome:**
> Instead of just "System Architecture diagram failed to render," you see the specific reason — e.g. a parse error naming roughly where in the diagram text the problem is.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The reason is readable as text, not just a red box

**Covers:** AC2

**Steps:**
1. Trigger the same broken diagram as Scenario 1.
2. Click "View diagram source (text alternative)" if present, or otherwise inspect the error message text.

**Expected outcome:**
> The specific failure reason is present as actual readable text — not conveyed only by the box turning red or showing a warning icon with no explanation.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: One broken diagram doesn't break its neighbours

**Covers:** AC3

**Steps:**
1. Trigger a turn that produces two diagrams — make one broken and leave the other valid.

**Expected outcome:**
> The broken one shows its specific error; the valid one renders completely normally, right next to it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Normal diagrams are unaffected

**Covers:** AC4

**Steps:**
1. Trigger a normal, correctly-formed System Architecture, Program Design, or Data Model diagram.

**Expected outcome:**
> The diagram renders exactly as it always has — no error UI, no change in appearance.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
