## Test Plan: Extend the artefact-fetcher adapter to read arbitrary repo files and folders

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s1-extend-artefact-fetcher-arbitrary-paths.md
**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-1-repo-backed-viewing.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-11

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | fetch a single file returns decoded content | 1 test | — | — | — | — | 🟢 |
| AC2 | fetch a folder returns an array of entries | 1 test | — | — | — | — | 🟢 |
| AC3 | missing path throws ArtefactNotFoundError | 1 test | — | — | — | — | 🟢 |
| AC4 | non-404 GitHub error throws ArtefactFetchError | 1 test | — | — | — | — | 🟢 |
| AC5 | unwired adapter throws explicit error | 1 test | — | — | — | — | 🟢 |
| AC6 | real wiring — two distinguishable outcomes (D37 req. 4) | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Mocked external services (GitHub Contents API `fetch` responses)
**PCI/sensitivity in scope:** No
**Availability:** Available now — no real GitHub dependency for unit tests
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A mocked single-file Contents API response (`{content: base64, ...}`) | Mocked fetch | None | Shape verified against `artefact-fetcher.js`'s existing `fetchArtefact` response handling before trusting the mock (CLAUDE.md mock-shape rule) |
| AC2 | A mocked folder-listing Contents API response (array of `{name, path, type}`) | Mocked fetch | None | This shape is the genuinely new unknown this story introduces — mock must be checked against a real GitHub API call at least once during implementation, not assumed from documentation alone |
| AC3 | Mocked 404 response | Mocked fetch | None | |
| AC4 | Mocked 500/rate-limit response | Mocked fetch | None | |
| AC5 | No mock needed — module required fresh, adapter not wired | N/A | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### fetchRepoPath_singleFile_returnsDecodedContent

- **Verifies:** AC1
- **Precondition:** Mocked `fetch` returns a Contents API single-file response with base64-encoded content
- **Action:** Call the new fetch function with a file path
- **Expected result:** Returns the decoded UTF-8 string matching the mock's real content
- **Edge case:** No

### fetchRepoPath_folder_returnsEntryArray

- **Verifies:** AC2
- **Precondition:** Mocked `fetch` returns a Contents API array response for a directory path
- **Action:** Call the new fetch function with a folder path (e.g. `standards/`)
- **Expected result:** Returns an array; each entry has `name`, `path`, `type` fields matching the mock
- **Edge case:** Yes — this is the folder-vs-file branching logic itself

### fetchRepoPath_missingPath_throwsArtefactNotFoundError

- **Verifies:** AC3
- **Precondition:** Mocked `fetch` returns HTTP 404
- **Action:** Call the new fetch function with a nonexistent path
- **Expected result:** Throws `ArtefactNotFoundError` (the existing, reused error class from `artefact-fetcher.js`)
- **Edge case:** No

### fetchRepoPath_apiError_throwsArtefactFetchError

- **Verifies:** AC4
- **Precondition:** Mocked `fetch` returns HTTP 500 with an error body
- **Action:** Call the new fetch function
- **Expected result:** Throws `ArtefactFetchError` with the underlying message preserved
- **Edge case:** Yes — network-level failure vs. HTTP-level failure should both be covered

### fetchRepoPath_unwiredAdapter_throwsExplicitError

- **Verifies:** AC5
- **Precondition:** Module required fresh, no `setFetchRepoPath()` call made
- **Action:** Call the function directly
- **Expected result:** Throws `'Adapter not wired: fetchRepoPath. Call setFetchRepoPath() with a real implementation before use.'`
- **Edge case:** No

---

## Integration Tests

### realWiring_twoDifferentPaths_returnTwoDifferentCorrectContents

- **Verifies:** AC6 (D37 requirement 4 — differentiating outcome, not just wiring)
- **Components involved:** `server.js`'s real `setFetchRepoPath` wiring, the extended `artefact-fetcher.js` function (mocked GitHub calls at the network boundary only)
- **Precondition:** Two distinct, known file paths with distinct mocked content
- **Action:** Fetch both through the real wired path
- **Expected result:** Each call returns its own correct, individually-distinct content — not the same content twice, not a wiring-only assertion
- **Edge case:** No

### artefactFetcher_existingFetchArtefact_unaffectedByExtension

- **Verifies:** Regression guard — this story's out-of-scope statement ("no change to `fetchArtefact()`'s existing behaviour")
- **Components involved:** `artefact-fetcher.js`'s existing `fetchArtefact` export, its existing callers
- **Precondition:** Existing `check-*.js` tests covering `fetchArtefact` and its callers (`export-data-source.js`, artefact viewer) already exist
- **Action:** Re-run existing regression suite unmodified after this story's changes
- **Expected result:** All pre-existing tests still pass — zero behavioural change to the single-file path

---

## NFR Tests

- **Performance:** None — no NFR stated beyond GitHub API's own latency, no hard target to test.
- **Security:** None — token handling is identical to the existing, already-tested `fetchArtefact` pattern; no new test needed.

None — confirmed with story owner (no new NFR beyond what `fetchArtefact` already covers).

---

## Out of Scope for This Test Plan

- Live GitHub API calls — all tests use mocked `fetch`; the folder-shape verification against a real API is an implementation-time manual check (see Test Data Strategy note on AC2), not an automated test.
- Testing `wugs-s2`/`wugs-s3`/`wugs-s4`'s consumption of this function — covered in their own test plans.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real GitHub folder-listing response shape not verified by an automated test | Automated tests can only assert against a mock, which could itself be wrong (the exact `tir-s5` failure mode) | Implementer must make one real, manual GitHub API call to a folder path during implementation and confirm the mock matches — noted in Architecture Constraints and this plan's Test Data Strategy |
