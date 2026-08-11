# AC Verification Script: Extend the artefact-fetcher adapter to read arbitrary repo files and folders

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s1-extend-artefact-fetcher-arbitrary-paths.md
**Technical test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s1-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. This story has no direct UI — verification is done by running the automated test suite (`node tests/check-wugs-s1-*.js` once written) and, for the folder-listing scenario, a real GitHub API check.
2. No special environment setup needed beyond a valid GitHub personal access token for the manual real-API check.

**Reset between scenarios:** Not applicable — each scenario is independent.

---

## Scenarios

---

### Scenario 1: Fetching a known single file returns its real content

**Covers:** AC1

**Steps:**
1. Run the fetch function against a known file path in a real repo (e.g. `.github/architecture-guardrails.md` in this repo itself).

**Expected outcome:**
> The returned text matches the real file's content exactly — the same words you'd see opening the file directly on GitHub.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Fetching a folder returns a list of its contents, not file text

**Covers:** AC2

**Steps:**
1. Run the fetch function against a known folder path (e.g. `standards/` in this repo).

**Expected outcome:**
> You get back a list of entries (like a directory listing) — names such as `data`, `devops`, `ux` — not a wall of file text.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Fetching a path that doesn't exist gives a clear "not found" error

**Covers:** AC3

**Steps:**
1. Run the fetch function against a path that doesn't exist (e.g. `nonexistent-file.md`).

**Expected outcome:**
> You get a clear "not found" error, not a crash or an empty/blank result.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Using the fetch capability before it's set up gives a clear error, not silence

**Covers:** AC5

**Steps:**
1. In a fresh test environment, call the fetch function before any real implementation has been "plugged in."

**Expected outcome:**
> You see an error message saying something wasn't set up yet — you do NOT get an empty result that looks like "nothing found" when really the whole mechanism was never connected.

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
