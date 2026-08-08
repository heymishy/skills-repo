## Test Plan: Make the landing page's learnings counter fail open instead of crashing the server

**Story reference:** artefacts/2026-08-08-learnings-count-crash-fix/stories/lccf-s1-fail-open-learnings-count.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-08

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | getLearningsCount() returns a fallback instead of throwing when file is missing | 1 test | — | — | — | — | 🟢 |
| AC2 | require('routes/public') succeeds and produces a numeric string when file is missing | 1 test | — | — | — | — | 🟢 |
| AC3 | getLearningsCount() returns the real count unchanged when file exists (happy path) | 1 test | — | — | — | — | 🟢 |
| AC4 | Existing lphf-s4 test suite passes unchanged | — | — | — | Full re-run | — | 🟢 |

---

## Coverage gaps

None. AC1–AC3 are pure-function/module-load unit tests against a temp-directory fixture (no filesystem mocking framework needed — a real missing/present file in a throwaway temp path is simpler and more faithful than mocking `fs`).

---

## Test Data Strategy

**Source:** Synthetic — a real temporary directory created/removed per test, containing (or not containing) a `learnings.md` fixture file.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

---

## Unit Tests

### getLearningsCount_returnsFallback_whenFileMissing

- **Verifies:** AC1
- **Precondition:** No `learnings.md` exists at the resolved path (point the module at a throwaway temp dir with no file, or delete the file in a scratch copy)
- **Action:** Call `getLearningsCount()`
- **Expected result:** Returns a non-negative integer (fallback, e.g. `0`); does not throw
- **Edge case:** Yes — this is the exact production failure condition

### publicRoutes_requireSucceeds_whenLearningsFileMissing

- **Verifies:** AC2
- **Precondition:** `learnings.md` missing at the resolved path
- **Action:** `require('../src/web-ui/routes/public')` (fresh require, cache cleared)
- **Expected result:** Require does not throw; `handleRoot`'s rendered body contains a numeric string in place of `<!--LEARNINGS_COUNT-->` (i.e. the placeholder was replaced with the fallback value, not left as literal placeholder text and not a crash)
- **Edge case:** Yes — this is the exact reproduction of the deployed crash

### getLearningsCount_returnsRealCount_whenFileExists

- **Verifies:** AC3
- **Precondition:** A real `learnings.md` fixture exists at the resolved path with a known number of `## ` headings
- **Action:** Call `getLearningsCount()`
- **Expected result:** Returns the exact count of `## `-level headings, matching pre-fix behaviour
- **Edge case:** No — happy-path regression guard

### lphf-s4 existing suite regression check

- **Verifies:** AC4
- **Action:** Re-run `tests/check-lphf-s4-*.js` (or equivalent existing test file for the learnings-count feature) unchanged
- **Expected result:** All pass, same count as before this fix
