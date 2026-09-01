# AC Verification Script: Error Handling and Graceful Degradation

**Story reference:** artefacts/new-feature-af17f555/stories/ep1-s5.md
**Technical test plan:** artefacts/new-feature-af17f555/test-plans/ep1-s5-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a test feature you can deliberately break — e.g. one whose `discovery.md` file you can temporarily rename or delete.

**Reset between scenarios:** Restore any file you rename/delete before moving to the next scenario.

---

## Scenarios

---

### Scenario 1: A missing artefact file doesn't stop you from continuing a feature

**Covers:** AC1

**Steps:**
1. Temporarily rename `discovery.md` for your test feature (e.g. to `discovery.md.bak`).
2. Click "Continue" on that feature in the Web UI.

**Expected outcome:**
> The session still starts normally. You're not blocked. Somewhere near the top you see a short message like "Feature history incomplete — some prior artefacts could not be loaded." — not a crash, not a blank page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

3. Restore the file (rename it back to `discovery.md`) before continuing.

---

### Edge case: Everything failing at once still lets you continue

**Covers:** AC1

**Steps:**
1. If you can, simulate several failures at once for a test feature (e.g. rename multiple artefact files).
2. Continue the feature.

**Expected outcome:**
> You still land in a working session. You see one clear disclosure message, not several repeated ones stacked on top of each other.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

3. Restore all files afterward.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |

---

*Written 2026-09-01 alongside the technical test plan, as part of getting the whole `new-feature-af17f555` feature to DoR-ready level.*
