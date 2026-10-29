# AC Verification Script: Classify the 5 journey-related E2E seed endpoints as redundant or legitimate

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s4-journey-seed-endpoint-classification.md
**Technical test plan:** artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s4-journey-seed-endpoint-classification-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root.
2. No server needs to be running — this is a document review, not a running system.
3. Have the classification artefact open alongside `src/web-ui/server.js` so you can cross-check each verdict against the real handler code.

**Reset between scenarios:** None needed.

---

## Scenarios

### Scenario 1: Every endpoint has a clear, justified verdict — and it holds up against the real code

**Covers:** AC1

**Steps:**
1. Open the classification artefact.
2. For each of the 5 endpoints listed (`seed-approval-journey`, `seed-board-journey`, `seed-actr-s2-journey`, `seed-ppc-s5-journey`, `seed-journey-gate-session`), read its stated verdict and the reasoning given.
3. Open `src/web-ui/server.js` and find that endpoint's real handler code.
4. Judge whether the stated reasoning actually matches what the handler code does.

**Expected outcome:**
> Each of the 5 endpoints has exactly one verdict — "redundant" or "legitimately different" — with reasoning that, when you check it against the real handler code, actually holds up. No endpoint is left unclassified or classified with reasoning that doesn't match the code.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Redundant endpoints come with a real, sized plan — not a vague note

**Covers:** AC2

**Steps:**
1. Check whether any endpoint was marked "redundant" in Scenario 1.
2. If yes, read that endpoint's fast-follow entry in the artefact.

**Expected outcome:**
> If any endpoint is marked redundant, its fast-follow entry names exactly which other endpoint it's redundant with and how many callers would need to change — not a generic "needs consolidation" note with no specifics. (If no endpoint was marked redundant, this scenario is not applicable — skip to Scenario 3.)

**Result:** [ ] Pass  [ ] Fail  [ ] N/A (no redundant endpoints)
**Notes:**

---

### Scenario 3: If nothing needs consolidating, the artefact says so plainly

**Covers:** AC3

**Steps:**
1. If Scenario 2 was N/A (no redundant endpoints), read the artefact's closing section.

**Expected outcome:**
> The artefact states plainly that no endpoint was found redundant and that no further action is needed — the question is closed, not left open-ended. (If Scenario 2 found redundant endpoints, this scenario is not applicable.)

**Result:** [ ] Pass  [ ] Fail  [ ] N/A (redundant endpoints were found)
**Notes:**

---

### Scenario 4: The benefit-metric document points to the right file

**Covers:** AC4

**Steps:**
1. Open `artefacts/2026-10-30-test-fixture-hardening-continuation/benefit-metric.md`.
2. Find Metric 4 and check which file path it references as the evidence for this classification.
3. Confirm that path is exactly where the classification artefact actually ended up.

**Expected outcome:**
> The path named in Metric 4 matches the real location of the classification artefact exactly — no broken link, no placeholder text left in its place.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Scenario 4 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
