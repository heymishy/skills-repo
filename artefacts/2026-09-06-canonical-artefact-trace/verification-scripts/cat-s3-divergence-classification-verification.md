# AC Verification Script: Classify every divergence case the audit found, not just the common one

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s3-divergence-classification.md
**Technical test plan:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s3-divergence-classification-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root.
2. Run `node tests/check-cat-s3-divergence-classification.js` and read the printed PASS/FAIL lines.

**Reset between scenarios:** No reset needed.

---

## Scenarios

### Scenario 1: A document nobody registered is clearly flagged, and grouped sensibly if possible

**Covers:** AC1

**Steps:**
1. Run the test file.
2. Find the lines checking an unregistered document with a recognizable filename pattern, and one without.

**Expected outcome:**
> A document that was never registered is always marked as "unregistered." If its filename looks like it belongs with other documents (a recognizable pattern), it's also grouped with them. If not, it's still shown — never silently dropped.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A story that was registered but has no actual files is told apart from an unregistered document

**Covers:** AC2

**Steps:**
1. Run the test file.
2. Find the line checking a registered story slug with zero matching files.

**Expected outcome:**
> This case gets its own distinct label — different from "unregistered." An operator looking at these two labels can tell "this was never registered" apart from "this was registered but its files are missing."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A feature that hasn't finished syncing shows one clear message, not a confusing mix of flags

**Covers:** AC3

**Steps:**
1. Run the test file.
2. Find the line checking a "not yet synced" feature.

**Expected outcome:**
> When a feature's data hasn't synced yet, every document in it shows the same "still syncing" state — none of them show "unregistered" or "missing files" instead, since that data can't be trusted yet either way.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A correctly set-up document shows no warning at all

**Covers:** AC4

**Steps:**
1. Run the test file.
2. Find the line checking a fully correct, already-registered document.

**Expected outcome:**
> A document that matches its registration correctly shows no flag or warning of any kind — it's simply marked as registered and nothing else is shown about it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — unregistered document, with/without inference | | |
| Scenario 2 — registered slug with no files | | |
| Scenario 3 — not-yet-synced precedence | | |
| Scenario 4 — clean registered case, no flag | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
