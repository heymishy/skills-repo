# AC Verification Script: Add a fetch timeout to the shared GitHub Contents API adapter

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s14-fetch-timeout.md
**Technical test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s14-fetch-timeout-test-plan.md
**Script version:** 1
**Verified by:** Claude (agent), via automated test suite | **Date:** 2026-08-14 | **Context:** [x] Pre-code (TDD RED) [x] Post-merge (automated, this run) [ ] Demo

---

## Note on verification method

This story is a backend adapter change with no rendering behaviour — every AC (AC1: Acceptance Criterion 1 — timeout fires with a clear error; AC2: Acceptance Criterion 2 — normal fast response unaffected; AC3: Acceptance Criterion 3 — no dangling timer either way; AC4: Acceptance Criterion 4 — both callers inherit the fix identically) has 1:1 direct automated test coverage against a mocked `global.fetch`, matching this file's own established test convention. No manual browser walkthrough applies.

---

## Scenarios

---

### Scenario 1: Hanging request aborts and throws a clear timeout error

**Covers:** AC1

**Steps:**
1. Run `node tests/check-wugs-s14-fetch-timeout.js`.
2. Check the `AC1: fetchGithubContentsResponse_requestHangs_abortsAndThrowsClearTimeoutError` result.

**Expected outcome:**
> With a mock `fetch` that never resolves and a short `timeoutMs` override, `fetchGithubContentsResponse` throws an `ArtefactFetchError` whose message clearly states a timeout occurred — not a generic network error, not an unhandled rejection.

**Result:** [x] Pass  [ ] Fail
**Notes:** Independently confirmed by a spec-compliance review — the `AbortError` branch is distinguished from the generic network-error branch inside the same `catch` block.

---

### Scenario 2: Normal fast response is unaffected

**Covers:** AC2

**Steps:**
1. Run `node tests/check-wugs-s14-fetch-timeout.js`.
2. Check the `AC2: fetchGithubContentsResponse_normalFastResponse_behaviourUnchanged` result.

**Expected outcome:**
> With a mock `fetch` that resolves immediately, the function returns exactly the same value as before this story — no observable difference for the normal case, and existing callers (`fetchArtefact`, `realFetchRepoPath`) remain unaffected since `timeoutMs` is a trailing optional parameter.

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed no existing call site was broken — `export-data-source.js` and `routes/journey.js` both call `fetchArtefact` with their pre-existing argument count.

---

### Scenario 3: No dangling timer on either path

**Covers:** AC3

**Steps:**
1. Run `node tests/check-wugs-s14-fetch-timeout.js`.
2. Check the `AC3a: fetchGithubContentsResponse_normalResponse_timeoutTimerCleared` and `AC3b: fetchGithubContentsResponse_timeoutFires_noDoubleErrorOrLateResolution` results.

**Expected outcome:**
> `clearTimeout` fires on both the success path and the timeout path (via a `finally` block wrapping the fetch call), and no second error or late resolution occurs after a timeout has already been thrown.

**Result:** [x] Pass  [ ] Fail
**Notes:** Code-quality review confirmed the `finally`-block cleanup is more robust than per-branch clear calls, and the `unhandledRejection` listener used by the AC3b test is correctly added/removed via `try/finally` with no cross-test leak risk.

---

### Scenario 4: Both callers inherit the timeout identically

**Covers:** AC4

**Steps:**
1. Run `node tests/check-wugs-s14-fetch-timeout.js`.
2. Check the `AC4: bothCallers_fetchArtefactAndRealFetchRepoPath_inheritTimeoutIdentically` result.

**Expected outcome:**
> Both `fetchArtefact` and `realFetchRepoPath` throw the same `ArtefactFetchError` timeout shape when given a hanging mock, confirming the fix lives in the shared `fetchGithubContentsResponse` helper with no per-caller duplication.

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed no separate timeout logic exists in either caller.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1) | Pass | |
| Scenario 2 (AC2) | Pass | |
| Scenario 3 (AC3) | Pass | |
| Scenario 4 (AC4) | Pass | |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

None.
