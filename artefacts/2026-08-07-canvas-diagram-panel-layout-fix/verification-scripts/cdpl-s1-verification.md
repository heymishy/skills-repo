# AC Verification Script: Stop the artefact panel squeezing the diagram panel, and fix the dead "maximise canvas" button

**Story reference:** artefacts/2026-08-07-canvas-diagram-panel-layout-fix/stories/cdpl-s1-fix-canvas-panel-squeeze-and-maximise.md
**Technical test plan:** artefacts/2026-08-07-canvas-diagram-panel-layout-fix/test-plans/cdpl-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Start a `/design` or `/definition` session in the web UI (staging or local).
2. Run `npm test` first to confirm the automated suite passes before doing manual verification.

**Reset between scenarios:** Start a fresh session for each scenario.

---

## Scenarios

---

### Scenario 1: The diagram panel stays a usable size even with a long artefact draft

**Covers:** AC1, AC2, AC5

**Steps:**
1. Run a `/design` or `/definition` session until the artefact draft panel has a long amount of text (or reproduce the reported staging behaviour with whatever session produced it originally).
2. Look at the "Diagrams" section below the artefact draft.

**Expected outcome:**
> The diagram panel is a reasonable, readable size — not squeezed down to a sliver — even though the artefact draft above it is long. The artefact draft panel itself scrolls independently once it hits its own height limit, rather than growing to push everything else down.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: You can expand the diagram to fill the screen

**Covers:** AC3

**Steps:**
1. In the same session, find the new expand/maximise control on the "Diagrams" section header.
2. Click it.
3. Click it again.

**Expected outcome:**
> The first click makes the diagram panel fill the whole screen. The second click brings back the normal split view with the artefact draft and diagrams side by side (vertically stacked).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The ideate layout's "Maximise canvas" button now actually works

**Covers:** AC4

**Steps:**
1. Start an `/ideate` session instead.
2. Find the "Maximise canvas" button (⊞) next to the Canvas section header.
3. Click it.

**Expected outcome:**
> The canvas section expands to fill the screen — it does not silently do nothing (which is what happens today).

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
