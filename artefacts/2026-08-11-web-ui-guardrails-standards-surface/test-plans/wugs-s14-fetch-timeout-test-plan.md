## Test Plan: Add a fetch timeout to the shared GitHub Contents API adapter

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s14-fetch-timeout.md
**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-1-repo-backed-viewing.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-14

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | timeout fires, clear error thrown | 1 test | — | — | — | — | 🟢 |
| AC2 | normal fast response unaffected | 1 test | — | — | — | — | 🟢 |
| AC3 | no dangling timer either way | 2 tests | — | — | — | — | 🟢 |
| AC4 | both callers inherit the fix | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic (mocked `global.fetch`, matching this file's own existing test convention from `check-wugs-s1-extend-artefact-fetcher-arbitrary-paths.js`)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A mock `fetch` that never resolves (or resolves after a delay longer than a short test-scoped timeout override) | Mock `global.fetch` | None | Timeout duration must be overridable per-call so this test doesn't take 10 real seconds |
| AC2/AC4 | A mock `fetch` that resolves immediately with a valid Contents API response shape | Mock `global.fetch` | None | Reuses this file's own existing mock response shapes |
| AC3 | Jest/Node fake timers, or a real-but-short timeout with `jest`-style timer-leak detection | Mock `global.fetch` + timer inspection | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### fetchGithubContentsResponse_requestHangs_abortsAndThrowsClearTimeoutError

- **Verifies:** AC1
- **Precondition:** Mock `global.fetch` returns a Promise that never resolves; timeout override set to a short test value (e.g. 50ms) rather than the real 10s default
- **Action:** Call `fetchGithubContentsResponse` (or `realFetchRepoPath`/`fetchArtefact` through it) with the short timeout
- **Expected result:** After the short timeout window, an `ArtefactFetchError` is thrown with a message clearly stating a timeout occurred (not a generic "network error" or an unhandled promise rejection)
- **Edge case:** No

### fetchGithubContentsResponse_normalFastResponse_behaviourUnchanged

- **Verifies:** AC2
- **Precondition:** Mock `global.fetch` resolves immediately with a valid Contents API response
- **Action:** Call `fetchGithubContentsResponse` with the timeout mechanism in place
- **Expected result:** The response is returned exactly as before this story — no observable difference in return value, timing, or error state for the normal case
- **Edge case:** No

### fetchGithubContentsResponse_normalResponse_timeoutTimerCleared

- **Verifies:** AC3 (successful-response side)
- **Precondition:** Mock `global.fetch` resolves immediately
- **Action:** Call the function, then assert (via Node's own timer-handle inspection, or a spy on `clearTimeout`) that the timeout's own timer was cleared after the response arrived
- **Expected result:** `clearTimeout` (or equivalent) is called once the real response arrives — no dangling timer left running past request completion
- **Edge case:** Yes — this is the story's own explicit resource-cleanup guarantee (AC3)

### fetchGithubContentsResponse_timeoutFires_noDoubleErrorOrLateResolution

- **Verifies:** AC3 (timeout side)
- **Precondition:** Mock `global.fetch` never resolves; short timeout override
- **Action:** Call the function, let the timeout fire, then wait past where the (never-resolving) original fetch "would have" resolved
- **Expected result:** Exactly one error is thrown (the timeout error) — no second, late resolution or a second thrown error from the original fetch promise attempting to settle after the function has already returned/thrown
- **Edge case:** Yes

### bothCallers_fetchArtefactAndRealFetchRepoPath_inheritTimeoutIdentically

- **Verifies:** AC4
- **Precondition:** Mock `global.fetch` that never resolves; short timeout override applied identically to both call paths
- **Action:** Call `fetchArtefact(...)` and separately `realFetchRepoPath(...)`, both against the same hanging mock
- **Expected result:** Both throw the same `ArtefactFetchError` timeout shape, confirming the fix lives in the shared helper and required no per-caller special-casing
- **Edge case:** No

---

## Integration Tests

None — this story's scope is fully covered by unit tests against the shared helper; no route/handler-level integration test is needed since `_fetchGuardrailsSectionPiece`'s own existing error-handling (already tested by `wugs-s2`'s test suite) requires no changes.

---

## NFR Tests

- **Performance:** This story IS the NFR test — AC1/AC3 directly verify the timeout mechanism `nfr-profile.md`'s own Gaps table specifies.

---

## Out of Scope for This Test Plan

- Configurable timeout value, retry-on-timeout — not built, per the story's own Out of Scope section.

---

## Test Gaps and Risks

None identified as blocking.
