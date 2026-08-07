## Test Plan: Don't show "could not be retrieved" for an artefact that simply doesn't exist yet

**Story reference:** artefacts/2026-08-07-artefact-not-found-vs-fetch-failed/stories/anvf-s1-distinguish-not-found-from-fetch-failed.md
**Epic reference:** None — short-track
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | A 404 (artefact genuinely doesn't exist) shows the ordinary "No artefact content found" message | 1 new test | — | — | — | — | 🟢 |
| AC2 | A real fetch failure (non-404) still shows "could not be retrieved" | — (existing test) | — | — | — | — | 🟢 |
| AC3 | Distinction is via `instanceof`, not message-string-matching | 1 new test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. AC2 is already covered by the existing `bothLocalAndGitMissing_honestErrorMessage` test in `tests/check-das-s1-commit-artefact-git-fallback.js` (mocks a 500 response) — this story re-verifies it still passes after the fix, no new test needed for that AC.

---

## Test Data Strategy

**Source:** Synthetic (extends the existing `tests/check-das-s1-commit-artefact-git-fallback.js`'s established mocking pattern: `global.fetch` override, `createMockPool` for the Postgres-backed repo resolution)
**PCI/sensitivity in scope:** No
**Availability:** Available now — no new fixtures needed
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A mocked `global.fetch` returning `{ ok: false, status: 404, ... }` (matching `fetchArtefact`'s own `ArtefactNotFoundError` trigger) | Existing mock pattern from `bothLocalAndGitMissing_honestErrorMessage`, changing only the status code | None | |
| AC3 | A mocked `fetchArtefact` (not `global.fetch` directly) that throws a plain `Error('Artefact not found: x/y')` — text resembling `ArtefactNotFoundError`'s own message but NOT actually an instance of that class | Direct module mock, not HTTP mock | None | Proves the fix checks the class, not the message text |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### artefactNotFound404_showsOrdinaryNotFoundMessage

- **Verifies:** AC1
- **Precondition:** Same setup as the existing `bothLocalAndGitMissing_honestErrorMessage` test (stage completed, local file deleted, repo connected via mocked pool), but `global.fetch` mocked to return `{ ok: false, status: 404, json: async () => ({ message: 'Not Found' }) }` — matching `fetchArtefact`'s own documented 404 → `ArtefactNotFoundError` trigger
- **Action:** Call `handleGetJourneyStageView`
- **Expected result:** The response body includes "No artefact content found" and does NOT include "could not be retrieved"
- **Edge case:** Yes — this is the exact regression this story exists to fix; this test fails against today's unmodified code (proving the bug is real) and passes after the fix

### genericErrorResemblingNotFoundText_stillTreatedAsRealFailure

- **Verifies:** AC3
- **Precondition:** Mock the `artefact-fetcher` module's `fetchArtefact` function directly (not via `global.fetch`) to throw a plain `new Error('Artefact not found: some/thing')` — text that superficially resembles `ArtefactNotFoundError`'s own message but is NOT an instance of that class
- **Action:** Call `handleGetJourneyStageView`
- **Expected result:** The response body includes "could not be retrieved" (treated as a real failure) — proving the fix's distinction is `instanceof ArtefactNotFoundError`, not a check against the error's message text, which would have incorrectly matched this generic error
- **Edge case:** Yes — this is the negative-control test proving the fix isn't a fragile string-matching shortcut

---

## Integration Tests

None new — the existing `stageCompletionEndToEnd_dualWriteThenResumeConversation` integration test in the same file already exercises the full read path end-to-end and continues to pass unmodified after this fix (it never hits either error branch, since it flows through the successful case).

---

## NFR Tests

None — this is a pure error-handling correctness fix with no new performance, security, or audit surface. "None — confirmed" per the story's own NFR section.

---

## Out of Scope for This Test Plan

- Any change to `artefact-fetcher.js` itself — it is already correct and untested changes here would be out of this story's scope.
- The `handlePostGateConfirm` (write/commit) path — confirmed unaffected by this story's Out of Scope section.

---

## Test Gaps and Risks

None identified.
