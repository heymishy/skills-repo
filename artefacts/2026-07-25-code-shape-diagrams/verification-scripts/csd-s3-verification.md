# AC Verification Script: /design//definition produce System Architecture + Program Design diagrams

**Story reference:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s3-design-produces-architecture-and-program-diagrams.md
**Technical test plan:** artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s3-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Run `/design` (or `/definition`) for a real, throwaway test feature.
2. Have a multi-story feature ready to test the granularity behaviour (or create a small 2-story one).

**Reset between scenarios:** Use a fresh feature slug for each scenario to avoid cross-contamination.

---

## Scenarios

---

### Scenario 1: Completing System Architecture gives you a diagram, not just prose

**Covers:** AC1

**Steps:**
1. Run `/design` for a test feature.
2. Complete the System Architecture section as you normally would.
3. Look at what got saved.

**Expected outcome:**
> Alongside the usual written description, there is a rendered System Architecture diagram — a picture showing how the components/services connect — saved as part of the same artefact.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Completing Program Design gives you a diagram too

**Covers:** AC2

**Steps:**
1. In the same session, complete the Program Design section.
2. Look at what got saved.

**Expected outcome:**
> A Program Design diagram (showing file structure / call flow) appears alongside the written description, saved the same way as the System Architecture diagram.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: One feature, multiple stories, one diagram set — not one per story

**Covers:** AC3

**Steps:**
1. Take a feature with 2 or more stories.
2. Complete `/design` for the first story. Note the diagram set.
3. Complete `/design` for the second story.
4. Look at the diagram set again.

**Expected outcome:**
> There is still only one System Architecture diagram set and one Program Design diagram set for the whole feature — updated/refreshed after the second story, not duplicated into a second copy.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
