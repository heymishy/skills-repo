# Test Plan: Outbound Teams chat-notification adapter

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s1-outbound-teams-notification-adapter.md
**Epic reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/epics/coha-e1-detect-and-alert.md
**Test plan author:** Claude Sonnet 5
**Date:** 2026-11-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Send function POSTs to `TEAMS_WEBHOOK_URL` secret, returns success/failure | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | Webhook failure (network error, non-2xx) reported explicitly, never swallowed | 2 tests | 1 test | — | — | — | 🟢 |
| AC3 | Unwired stub default throws `Error('Adapter not wired: teamsNotifyAdapter...')` | 1 test | — | — | — | — | 🟢 |
| AC4 | Wiring test asserts behavioural correctness (two payloads → two distinct POST bodies) | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. This story has no UI surface — every AC is a pure function/HTTP-call concern, fully testable with a mocked HTTP layer.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A message payload object (`{text: string}` or equivalent); a mock webhook endpoint recording calls | Synthetic (test setup) | None | `TEAMS_WEBHOOK_URL` is set to a local mock server URL in test env, never a real secret |
| AC2 | A mock endpoint configured to return a network error and a non-2xx (e.g. 500) response on demand | Synthetic (test setup) | None | |
| AC3 | No data — tests the stub path before any setter is called | N/A | None | |
| AC4 | Two distinct message payloads | Synthetic (test setup) | None | Per `product/constraints.md` #13, the mock webhook endpoint must be a real (in-process) HTTP listener recording actual received bodies — not a jest.fn() that only records it was "called," so the assertion is CI-gate-verifiable against real dispatch, not trusted by instruction |

### PCI / sensitivity constraints

None — no payment or personal data anywhere in this story.

### Gaps

None.

---

## Unit Tests

### throwsWhenAdapterNotWired_beforeAnySetterCalled

- **Verifies:** AC3
- **Precondition:** Module freshly loaded (or adapter reset to default stub); `setTeamsNotifyAdapter` has not been called.
- **Action:** Call the outbound send function directly.
- **Expected result:** Throws `Error('Adapter not wired: teamsNotifyAdapter. Call setTeamsNotifyAdapter() with a real implementation before use.')`. Does not return a resolved promise with a fake success value.
- **Edge case:** No — this is the primary stub-safety contract, not an edge case.

### returnsSuccessResult_whenWebhookRespondsWith2xx

- **Verifies:** AC1
- **Precondition:** Adapter wired to a test implementation pointed at a mock HTTP listener that returns 200.
- **Action:** Call the send function with a valid message payload.
- **Expected result:** Returns a result object indicating success (e.g. `{ ok: true }` or equivalent); the mock listener recorded exactly one POST.
- **Edge case:** No.

### readsWebhookUrlFromSecretEnvVar_neverHardcoded

- **Verifies:** AC1
- **Precondition:** `TEAMS_WEBHOOK_URL` env var set to the mock listener's URL; no hardcoded URL anywhere in the adapter module.
- **Action:** Call the send function.
- **Expected result:** The POST target matches `process.env.TEAMS_WEBHOOK_URL` exactly; grep of the adapter source confirms no literal webhook URL string is present.
- **Edge case:** Yes — confirms the credential-sourcing constraint (`product/constraints.md` #12) at the unit level, not just by convention.

### reportsFailureExplicitly_onNetworkError

- **Verifies:** AC2
- **Precondition:** Adapter wired to an implementation pointed at a listener configured to simulate a connection refusal.
- **Action:** Call the send function with a valid payload.
- **Expected result:** Returns a result object indicating failure (e.g. `{ ok: false, error: <reason> }`) or rejects with a descriptive error — never resolves as if it succeeded.
- **Edge case:** Yes — network-layer failure, distinct from an HTTP-level failure.

### reportsFailureExplicitly_onNon2xxResponse

- **Verifies:** AC2
- **Precondition:** Mock listener configured to return 500.
- **Action:** Call the send function.
- **Expected result:** Returns a failure result distinguishable from success; failure is never silently coerced into a truthy/success value.
- **Edge case:** Yes.

---

## Integration Tests

### dispatchReachesRealOutboundPath_viaMockWebhookListener

- **Verifies:** AC1
- **Components involved:** The send function, the wired HTTP client it uses internally, a real in-process mock HTTP listener (not a jest.fn() stub).
- **Precondition:** Mock listener running on a local port; `TEAMS_WEBHOOK_URL` points at it; adapter wired via the real (non-test-only) wiring path used in production.
- **Action:** Call the send function with a message payload.
- **Expected result:** The mock listener's recorded request body matches the payload sent; this is the CI-gate-verifiable assertion `product/constraints.md` #13 requires — the dispatch provably happened, not merely that a function was invoked.

### reportedFailurePropagatesToCaller_onWebhookDown

- **Verifies:** AC2
- **Components involved:** Send function, HTTP client, mock listener (closed/unreachable port).
- **Precondition:** Mock listener port closed before the call.
- **Action:** Call the send function; inspect what the caller receives.
- **Expected result:** Caller receives an explicit failure signal it can branch on (not an unhandled rejection that silently fails the whole process, and not a result that looks like success).

### wiringProducesBehaviourallyDistinctOutcomes_forTwoDifferentPayloads

- **Verifies:** AC4 — the D37 wiring-correctness test. The story's own AC4 already specifies this exact standard (two different payloads → two distinctly different POST bodies), so this test is written to match AC4 verbatim rather than the weaker "was `setTeamsNotifyAdapter` called" shape that failed in `tir-s1`.
- **Components involved:** The real wired implementation (as wired in the CI workflow entry point), mock webhook listener.
- **Precondition:** Adapter wired via the production wiring path (not a test-only mock of the adapter itself — the mock is at the HTTP boundary, one layer below).
- **Action:** Call the send function twice with two distinct payloads (e.g. a "patch announce" message and a "vulnerability found" message).
- **Expected result:** The mock listener records two POSTs with two distinct, individually-correct bodies — each body's content matches its respective input payload. A test that only asserted "the setter was called with a function" would pass even if the wired function ignored its input; this test fails in that case, satisfying D37's behavioural-correctness bar.

---

## NFR Tests

### sendCallTimesOutWithinBoundedWindow

- **NFR addressed:** Performance — outbound notification timeout (bounded, e.g. 10s)
- **Measurement method:** Mock listener configured to never respond; measure wall-clock time until the send function returns/rejects.
- **Pass threshold:** Returns within the bounded timeout (≤10s) rather than hanging indefinitely.
- **Tool:** `node scripts/run-all-tests.js` (project test runner), fake/advanced timers where the runner supports them to avoid a genuinely slow test.

### webhookUrlNeverAppearsInLogsOrErrorOutput

- **NFR addressed:** Security — credential exposure
- **Measurement method:** Trigger both a success and a failure path; capture all logged output and any error message/object surfaced to the caller; assert the literal webhook URL string never appears in either.
- **Pass threshold:** Zero occurrences of the webhook URL value in captured log output or error payloads.
- **Tool:** `node scripts/run-all-tests.js`, string-search assertion against captured console/log output.

### everySendAttemptIsLoggedServerSide

- **NFR addressed:** Audit — every send attempt (success or failure) logged with a timestamp
- **Measurement method:** Trigger a success and a failure call; assert a log entry was written for each, each containing a timestamp field.
- **Pass threshold:** One log entry per send attempt, success or failure, each with a parseable timestamp.
- **Tool:** `node scripts/run-all-tests.js`, log-capture assertion.

---

## Out of Scope for This Test Plan

- Slack or any other chat-platform adapter — Teams-only per the story's own Out of Scope.
- Message formatting conventions for coha-s2/s3/s4's specific payload content — those are tested in their own test plans against this adapter's generic contract.
- Real Teams webhook delivery against Microsoft's actual service — covered by a mock HTTP listener only; no test depends on live Teams infrastructure.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| No test confirms the real production `TEAMS_WEBHOOK_URL` secret is correctly configured in GitHub Actions | Secret values are never available to this repo's test environment, by design (`product/constraints.md` #12) | Covered by DoR wiring verification/smoke check against the real secret post-deploy, not by this test plan |
