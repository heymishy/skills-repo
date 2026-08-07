## Test Plan: Automatically reflect a web-UI journey stage completion in pipeline-state.json

**Story reference:** artefacts/2026-08-07-cross-surface-state-sync/stories/css-s2-web-ui-journey-reflects-on-pipeline-state.md
**Epic reference:** artefacts/2026-08-07-cross-surface-state-sync/epics/css-e1-cross-surface-state-sync.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Stage completion writes to `pipeline-state.json` via Contents API using the authenticated user's own token; commit author matches | 2 tests | 1 test | — | 1 scenario | External-dependency | 🟡 |
| AC2 | Additional latency is no more than 2x `das-s1`'s own artefact-commit latency | 1 test | — | — | — | — | 🟢 |
| AC3 | Retries exhausted → stage completion still succeeds, gap logged, no credential persisted | 2 tests | 1 test | — | — | — | 🟢 |
| AC4 | No corresponding `pipeline-state.json` entry → no write attempted, not an error | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| Real GitHub Contents API commit-author verification | AC1 | External-dependency | The real GitHub API and OAuth token exchange cannot run inside the automated suite — asserting the *actual* commit author identity in GitHub history requires a real API call | Automated tests mock the Contents API call and assert the correct token/header is passed; a manual scenario (below) verifies the real commit author in GitHub history post-merge, per ADR-020's own stated DoD requirement |

---

## Test Data Strategy

**Source:** Mixed — synthetic + mocked externals
**PCI/sensitivity in scope:** No
**Availability:** Available now for automated tests; the manual AC1 scenario requires a real authenticated web-UI session (available once staging exists)
**Owner:** Self-contained (automated); Hamish King (manual scenario, post-merge)

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A mocked `req.session.accessToken`; a mocked GitHub Contents API client capturing the `Authorization` header and commit payload | Synthetic + mocked HTTP client | Mocked token value only, never real | Never a real token in test fixtures |
| AC2 | Simulated latency values for `das-s1`'s artefact-commit call and this story's `pipeline-state.json` write call | Synthetic timing fixtures | None | |
| AC3 | Mocked Contents API client configured to fail N times, then either succeed or exhaust the retry budget | Synthetic + mocked HTTP client | None | |
| AC4 | A synthetic `pipeline-state.json` fixture with no entry for the journey's feature slug | Synthetic fixture | None | |

### PCI / sensitivity constraints

None. Mocked token values only — never a real OAuth token in any committed fixture.

### Gaps

None beyond the AC1 manual-verification gap already noted above.

---

## Unit Tests

### pipelineStateCommitWriter_usesAuthenticatedUserToken_notServiceAccount

- **Verifies:** AC1 (ADR-020 compliance)
- **Precondition:** A mocked `req.session.accessToken` set to a test token value; mocked Contents API client
- **Action:** Call the new write-adapter with the session token and a `pipeline-state.json` update payload
- **Expected result:** The mocked HTTP client's captured `Authorization` header contains the session token — not any hardcoded service-account or `GITHUB_TOKEN` value
- **Edge case:** No

### pipelineStateCommitWriter_stubThrows_whenNotWired

- **Verifies:** D37 (injectable adapter rule)
- **Precondition:** The adapter's default (unwired) stub is called directly, without `setPipelineStateCommitWriter()` having been called
- **Action:** Invoke the stub
- **Expected result:** Throws an `Error` naming the adapter and instructing the caller to wire a real implementation — does not silently return a success-shaped value
- **Edge case:** Yes — misconfiguration path

### pipelineStateCommitWriter_logsReconciliationGap_afterRetriesExhausted

- **Verifies:** AC3
- **Precondition:** Mocked Contents API client configured to fail on every call within the retry budget
- **Action:** Call the write-adapter and let all retries exhaust
- **Expected result:** A reconciliation-gap log entry is recorded in `sync_log` with `entry_type = 'gap'`, the feature slug, and the gate name; no exception propagates to the caller (the artefact-commit flow must continue)
- **Edge case:** Yes — retry-exhaustion path

### pipelineStateCommitWriter_neverPersistsTokenAfterRequestCompletes

- **Verifies:** AC3 (no credential storage)
- **Precondition:** Same as above — retries exhausted
- **Action:** After the write-adapter call completes (success or exhaustion), inspect all objects written to any persistent store (`sync_log`, in-memory state surviving the request)
- **Expected result:** No field anywhere in the written records contains the session token or any credential-shaped value
- **Edge case:** No

### pipelineStateCommitWriter_skipsWrite_whenNoMatchingFeatureSlugEntry

- **Verifies:** AC4
- **Precondition:** A synthetic `pipeline-state.json` fixture with no entry for the journey's feature slug
- **Action:** Call the write-adapter for that journey's stage completion
- **Expected result:** No Contents API call is made; the function returns successfully with no error

---

## Integration Tests

### stageCompletionRequest_writesPipelineStateJson_withinSameRequestLifetime

- **Verifies:** AC1
- **Components involved:** `src/web-ui/routes/journey.js` (`handlePostGateConfirm`), `das-s1`'s existing artefact-commit-writer.js, the new pipeline-state-commit-writer adapter, mocked Contents API
- **Precondition:** A repo-connected journey completing a stage; mocked Contents API returns success
- **Action:** Send the stage-completion request end-to-end through the route handler
- **Expected result:** By the time the HTTP response is sent back to the client, the mocked Contents API has already recorded exactly one write call for `pipeline-state.json` with the authenticated user's token — not scheduled for later

### stageCompletionRequest_succeedsForOperator_evenWhenPipelineStateWriteFails

- **Verifies:** AC3
- **Components involved:** Same as above, with the mocked Contents API configured to fail all `pipeline-state.json` write attempts (but the artefact-commit write itself still succeeds)
- **Precondition:** Retry budget exhausted for the `pipeline-state.json` write specifically
- **Action:** Send the stage-completion request
- **Expected result:** The HTTP response still reports success to the operator (stage completion is not blocked by this write's failure); the artefact-commit itself is unaffected; a reconciliation-gap log entry exists

---

## NFR Tests

### pipelineStateWrite_addsNoMoreThan2xDasS1Latency

- **NFR addressed:** Performance
- **Measurement method:** Simulate `das-s1`'s artefact-commit call at a fixed mocked latency (e.g. 200ms); measure the total request latency with this story's `pipeline-state.json` write added (also mocked, sequenced after the artefact commit)
- **Pass threshold:** Total added latency for this story's write is ≤ 2x the simulated `das-s1` latency (i.e. ≤ 400ms in the 200ms baseline case) — a relative bound, not an invented absolute number, per this story's own AC2
- **Tool:** `scripts/run-all-tests.js` timing assertion

### commitAuthor_isAuthenticatedUser_notServiceAccount

- **NFR addressed:** Security (ADR-020)
- **Measurement method:** Assert the captured `Authorization` header in the mocked Contents API call matches the test session token, not any service-account credential constant present elsewhere in the codebase
- **Pass threshold:** Exact match to the session token; zero occurrences of a service-account token pattern
- **Tool:** `scripts/run-all-tests.js` assertion

### reconciliationGapLog_isQueryable

- **NFR addressed:** Audit
- **Measurement method:** After a retry-exhaustion test case, query the mocked `sync_log` store for entries with `entry_type = 'gap'` matching the test's feature slug
- **Pass threshold:** Exactly one matching entry exists with `feature_slug`, `entry_type`, and `created_at` populated
- **Tool:** `scripts/run-all-tests.js` assertion

---

## Out of Scope for This Test Plan

- Real GitHub Contents API commit-author verification in automated tests — covered by the manual scenario below and by ADR-020's own DoD requirement (compare commit author in real GitHub history against the authenticated user's login).
- Background/queued retry beyond the request's lifetime — explicitly out of scope for this story per the Step 1.5 architecture decision; nothing to test here since it does not exist.
- Any gate type beyond what exercises the write path generically — full-vocabulary coverage is css-s4's test plan.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real commit-author identity in GitHub history | Requires a real authenticated web-UI session and a real GitHub repo — not available inside the automated test suite | Manual verification scenario (Scenario 1, AC1) run post-merge on staging, matching ADR-020's own stated DoD check |
| Real `das-s1` baseline latency for the 2x threshold | `das-s1`'s own overhead has not yet been measured in a real environment — PR #674 still blocked on the GitHub Actions outage | Re-verify the NFR test's simulated baseline against real measurements once staging is reachable, per `nfr-profile.md`'s own flagged gap |
