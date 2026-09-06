# AC Verification Script: Build the canonical artefact trace from real disk structure for any feature

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s1-core-trace-builder.md
**Technical test plan:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s1-core-trace-builder-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root.
2. No server needs to be running for this story — the trace builder is a backend function, tested directly by running its own test file.
3. Run `node tests/check-cat-s1-core-trace-builder.js` and read the printed PASS/FAIL lines.

**Reset between scenarios:** No reset needed — each scenario is an independent test case within the same run.

---

## Scenarios

### Scenario 1: A fully set-up feature shows all its epics, stories, and documents correctly

**Covers:** AC1

**Steps:**
1. Run the test file.
2. Find the line for the feature `2026-09-06-feature-artefact-document-matrix`.

**Expected outcome:**
> The test reports that every epic, story, and document this feature already has shows up correctly — matching what the site already shows for this feature today. Nothing new is missing or wrong for a feature that was already fully set up.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A feature that was never "registered" still shows all its real documents

**Covers:** AC2

**Steps:**
1. Run the test file.
2. Find the line checking the `2026-04-19-skills-platform-phase4` feature (205 real files, never registered in the tracking system).

**Expected outcome:**
> All 205 real documents for this feature are found and counted — none are silently missing, even though this feature was never formally registered.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A feature that has been archived is still found automatically

**Covers:** AC3

**Steps:**
1. Run the test file.
2. Find the line checking an archived-feature fixture.

**Expected outcome:**
> The tool automatically checks the "archived" location when a feature isn't in the normal location, and finds it there without any extra steps.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Asking for a feature that truly doesn't exist gives a clear "not found" answer

**Covers:** AC4

**Steps:**
1. Run the test file.
2. Find the line checking a made-up, nonexistent feature name.

**Expected outcome:**
> The tool clearly says this feature was not found — it doesn't crash, and it doesn't pretend the feature exists with an empty result. "Not found" and "found but empty" look different.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A feature that hasn't finished syncing yet is not confused with a feature that doesn't exist

**Covers:** AC5

**Steps:**
1. Run the test file.
2. Find the line comparing the "not yet synced" result against the "not found" result.

**Expected outcome:**
> These two situations produce two different, clearly distinguishable answers — "still syncing, check back" is never shown or treated the same as "this feature doesn't exist."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — fully registered feature | | |
| Scenario 2 — never-registered feature (phase4) | | |
| Scenario 3 — archived feature | | |
| Scenario 4 — nonexistent feature | | |
| Edge case — not-yet-synced vs not-found | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
