## Test Plan: Build the branch + PR creation adapter for guardrail/standard edits

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s6-branch-pr-creation-adapter.md
**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-2-pr-gated-add-edit.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-11

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | new file: branch+commit+PR, never writes default branch | 1 test | — | — | — | — | 🟡 |
| AC2 | existing file: SHA-based update, conflict surfaced | 1 test | — | — | — | — | 🟡 |
| AC3 | success returns PR number/URL | 1 test | — | — | — | — | 🟢 |
| AC4 | step failure surfaced clearly | 1 test | — | — | — | — | 🟢 |
| AC5 | unwired adapter throws explicit error | 1 test | — | — | — | — | 🟢 |
| AC6 | two distinguishable outcomes for two distinguishable inputs (D37 req. 4) | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None automated-untestable, but AC1/AC2 are flagged 🟡 (External-dependency risk, not CSS-layout) — see Test Gaps and Risks; mitigated by mocked-fetch unit coverage plus a documented manual real-sandbox-repo check before this story is considered done.

---

## Test Data Strategy

**Source:** Mocked external services (GitHub branch/Contents/Pulls API `fetch` responses)
**PCI/sensitivity in scope:** No
**Availability:** Available now for mocked tests; a real sandbox GitHub repo is recommended (not required) for one manual pre-merge confirmation — see Test Gaps and Risks
**Owner:** Self-contained (mocked); manual sandbox check owned by the implementer

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mocked responses for: get default branch SHA, create ref, create file, create PR (4 sequential mocked calls) | Mocked fetch | None | Shape verified against real GitHub API docs and, ideally, one live sandbox call before merge |
| AC2 | Mocked responses for: get file (returns SHA), update file using that SHA | Mocked fetch | None | |
| AC2 (conflict) | Mocked 409/422 response simulating a stale SHA | Mocked fetch | None | |
| AC3 | Mocked successful PR-creation response with `number`/`html_url` | Mocked fetch | None | |
| AC4 | Mocked failure at each of the 4 steps, tested separately | Mocked fetch | None | |
| AC5 | No mock — module required fresh | N/A | None | |
| AC6 | Two mocked successful full sequences with different content/paths | Mocked fetch | None | |

### PCI / sensitivity constraints

None.

### Gaps

Real GitHub API shape confirmation — see Test Gaps and Risks.

---

## Unit Tests

### guardrailPrAdapter_newFile_createsBranchCommitsAndOpensPr

- **Verifies:** AC1
- **Precondition:** Mocked responses for all 4 sequential API calls (default-branch SHA, create ref, create file, create PR), all succeeding
- **Action:** Call the adapter with new-file content and a path
- **Expected result:** All 4 calls fire in the correct order; the `PUT`/`POST` for file creation targets the new branch ref, never `master`/default directly
- **Edge case:** No

### guardrailPrAdapter_existingFile_usesShaForUpdate

- **Verifies:** AC2
- **Precondition:** Mocked "get file" response returns a known SHA; mocked update call expects that SHA in its payload
- **Action:** Call the adapter with edit content for an existing path
- **Expected result:** The update call's payload includes the fetched SHA; if the mocked update response is a 409/422 (stale SHA), the adapter throws a clearly-named conflict error
- **Edge case:** Yes — the conflict branch is the critical edge case

### guardrailPrAdapter_success_returnsPrNumberAndUrl

- **Verifies:** AC3
- **Precondition:** All mocked calls succeed, PR-creation response includes `number: 42`, `html_url: '...'`
- **Action:** Call the adapter
- **Expected result:** Return value includes `prNumber: 42` and the real URL
- **Edge case:** No

### guardrailPrAdapter_stepFailure_surfacesWhichStepFailed

- **Verifies:** AC4
- **Precondition:** Mocked failure at each of the 4 steps individually (4 separate test cases)
- **Action:** Call the adapter
- **Expected result:** Thrown error message identifies which step failed (e.g. "branch creation failed", not a generic error)
- **Edge case:** Yes — 4 distinct failure points, each its own case

### guardrailPrAdapter_unwired_throwsExplicitError

- **Verifies:** AC5
- **Precondition:** Module required fresh, no `setGuardrailPrAdapter()` call
- **Action:** Call the adapter function
- **Expected result:** Throws `'Adapter not wired: guardrailPrAdapter. Call setGuardrailPrAdapter() with a real implementation before use.'`
- **Edge case:** No

---

## Integration Tests

### realWiring_twoDifferentContentChanges_produceTwoDifferentCorrectPrs

- **Verifies:** AC6 (D37 requirement 4 — differentiating outcome, not just wiring)
- **Components involved:** `server.js`'s real `setGuardrailPrAdapter` wiring, the adapter itself (mocked GitHub calls at the network boundary only)
- **Precondition:** Two distinct, known content+path submissions
- **Action:** Submit both through the real wired path
- **Expected result:** Two separate PR-creation calls fire, each with the correct, individually-distinct content and path — not the same content twice, not a wiring-only assertion (`server.js wires setX to someFunction` is explicitly insufficient per CLAUDE.md's D37 rule)
- **Edge case:** No

---

## NFR Tests

### Token is never logged

- **NFR addressed:** Security
- **Measurement method:** Assert no captured log output contains the raw OAuth token value during a full adapter run
- **Pass threshold:** Token string never appears in log capture
- **Tool:** Node, log-capture assertion

### PR creation is audit-logged

- **NFR addressed:** Audit
- **Measurement method:** Assert a PostHog `guardrail_pr_opened` capture fires with tenant_id, product_id, repo, PR number on success
- **Pass threshold:** Capture call present with correct properties
- **Tool:** Node, mock PostHog client assertion

---

## Out of Scope for This Test Plan

- Merging the PR — out of scope per the story itself.
- Rate-limit retry logic — not built in this story.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real GitHub branch/Contents/Pulls API response shapes not verified by an automated test | All tests use mocked fetch responses; a wrong mock shape would pass every test while being wrong in production (the `tir-s5` failure mode) | Implementer performs one real, manual test against a sandbox GitHub repo before this story is considered done — recorded in the AC verification script as a required manual step, not optional |
