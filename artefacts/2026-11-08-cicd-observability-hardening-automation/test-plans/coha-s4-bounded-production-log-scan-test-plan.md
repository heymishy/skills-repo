# Test Plan: Bounded production-log scan with pattern-match notification

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s4-bounded-production-log-scan.md
**Epic reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/epics/coha-e1-detect-and-alert.md
**Test plan author:** Claude Sonnet 5
**Date:** 2026-11-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Scheduled scan runs `flyctl logs --since <window>`, scans, exits — never a standing process | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Match found → exactly one notification with timestamp/pattern/excerpt | 2 tests | 1 test | — | — | — | 🟢 |
| AC3 | No match → no notification, clean exit | 1 test | — | — | — | — | 🟢 |
| AC4 | First-month baseline measurement recorded on confirmed defect | — | — | — | 1 scenario | External-dependency | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| AC4's baseline measurement depends on a real production defect actually occurring and being confirmed by some independent means, then compared against the scan's real detection timestamp | AC4 | External-dependency | This is an observational/operational event, not a deterministic code path — no fixture can "simulate" a real-world first occurrence in a way that tests the measurement-recording mechanism meaningfully beyond its arithmetic | Manual scenario in the verification script (🟡) — the *mechanism* for recording the gap (timestamp diff → benefit-metric.md baseline) is unit-tested with synthetic timestamps; only the *real-world triggering event* is manual, per the story's own benefit-metric.md baseline deferral |

---

## Test Data Strategy

**Source:** Fixtures
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A fixture `flyctl logs` text output (real line shape, synthetic content), plus a mock for the `flyctl` CLI invocation itself | Fixture, shaped from the real `flyctl logs` output format used elsewhere in this repo's scripts | None | The `flyctl` invocation is a new external-command dependency — the implementation plan names wiring/testing it as its own task, per the story's own Architecture Constraints |
| AC2 | A fixture log line containing the known `tenant_admin_bootstrap_failed` pattern, with a realistic timestamp | Fixture, grounded in the real, already-confirmed `capture-log.md` incident (`productionErrorInvestigation`) | None | |
| AC3 | A fixture log output containing zero matches against the known-pattern list | Fixture | None | |
| AC4 | Two synthetic timestamps (a "defect appeared" timestamp and a "scan detected" timestamp) to test the diff-recording arithmetic only | Synthetic | None | The real first-occurrence event itself is out of scope for an automated test — see Coverage gaps |

### PCI / sensitivity constraints

None. Log excerpts used in fixtures are synthetic or drawn from the already-public `capture-log.md` incident description, containing no customer PII.

### Gaps

None beyond the AC4 external-dependency gap already recorded above.

---

## Unit Tests

### scanInvokesFlyctlLogsWithBoundedWindow_andExitsAfterScan

- **Verifies:** AC1
- **Precondition:** Mocked `flyctl` CLI invocation returning a fixture log output; window parameter set to an hours-to-a-day value.
- **Action:** Run the scan function.
- **Expected result:** The invocation uses `flyctl logs --since <window>` with the configured bounded window (not approaching the 7-day retention limit without re-confirmation); the function returns/exits after processing — no listener, timer, or open handle is left running after the call completes.
- **Edge case:** No.

### detectsKnownErrorPattern_inLogOutput

- **Verifies:** AC2
- **Precondition:** Fixture log output containing a line matching `tenant_admin_bootstrap_failed` (the real, confirmed incident pattern).
- **Action:** Run the pattern-matching logic against the fixture.
- **Expected result:** A match is detected and reported, including the timestamp, the matched pattern name, and the log excerpt — sufficient for a human to investigate without re-running the scan.
- **Edge case:** No — this is the primary detection contract, grounded in a real, already-confirmed incident.

### sendsExactlyOneNotificationPerScanRun_onMatch

- **Verifies:** AC2
- **Precondition:** Fixture log output with exactly one matching line; mocked `coha-s1` adapter.
- **Action:** Run the full scan-to-notification path.
- **Expected result:** Exactly one adapter call recorded, with the message content including timestamp, pattern, and excerpt.
- **Edge case:** Yes — confirms the single-notification-per-run guarantee, distinct from AC3's zero-match case below.

### sendsNoNotification_whenNoMatchFound

- **Verifies:** AC3
- **Precondition:** Fixture log output with zero matches against the known-pattern list; mocked `coha-s1` adapter.
- **Action:** Run the full scan-to-notification path.
- **Expected result:** Zero adapter calls recorded; the function returns cleanly (no error, no hang).
- **Edge case:** Yes — the explicit false-positive-prevention guarantee ("a quiet period must never produce a false-positive notification").

---

## Integration Tests

### scanRunsAgainstRealFlyctlCliShape_inScheduledWorkflowContext

- **Verifies:** AC1
- **Components involved:** The scan script, the real `flyctl` CLI binary (or a faithful test double matching its real CLI contract if the real binary isn't available in the test environment), the scheduled-workflow invocation point.
- **Precondition:** `FLY_API_TOKEN` present as a test-scoped credential (never a real production token) if a real `flyctl` call is exercised in CI; otherwise a CLI-contract-faithful double.
- **Action:** Invoke the scan as it will run inside the scheduled GitHub Actions workflow.
- **Expected result:** The scan completes, exits with a clean process (confirmable via process-exit assertions in the test harness), and does not leave any background process running — directly verifying the "triggered and bounded, never a standing process" mandatory constraint (`product/constraints.md` #11), not merely trusting the workflow YAML's `schedule:` trigger by convention.

### notificationDispatchIsCiGateVerifiable_onKnownBadLogLine

- **Verifies:** AC2
- **Components involved:** Scan logic, `coha-s1`'s real send function (HTTP layer mocked at the boundary, shared with coha-s1's own integration tests), the `tenant_admin_bootstrap_failed` fixture.
- **Precondition:** Fixture log containing the known-bad line, run through the real adapter call path.
- **Action:** Run the full scan-to-notification path against the fixture.
- **Expected result:** The mock webhook listener receives exactly one POST containing the timestamp/pattern/excerpt — the CI-gate-verifiable assertion `product/constraints.md` #13 requires, confirming the scan "would notify on a known-bad log line," not just that the script doesn't throw on empty input.

---

## NFR Tests

### scanCompletesWithinScheduledJobTimeout

- **NFR addressed:** Performance — scan must complete within the scheduled job's own timeout
- **Measurement method:** Time the scan function against a realistically-sized fixture log output (bounded window's expected volume).
- **Pass threshold:** Completes well within the scheduled job's configured timeout.
- **Tool:** `node scripts/run-all-tests.js`, timing assertion.

### flyApiTokenNeverLoggedOrIncludedInNotificationPayload

- **NFR addressed:** Security — Fly.io API token never logged, never included in the notification payload
- **Measurement method:** Run the scan with a test token value present; capture all logged output and the notification payload sent to the mocked adapter; assert the token value never appears in either.
- **Pass threshold:** Zero occurrences of the token value in captured logs or the notification payload.
- **Tool:** `node scripts/run-all-tests.js`, string-search assertion.

### everyScanRunIsLogged_matchOrNoMatch

- **NFR addressed:** Audit — every scan run (match or no match) logged, supporting the detection-latency measurement method
- **Measurement method:** Run the scan once with a match fixture and once with a no-match fixture; assert a log entry exists for each run, including outcome (match/no-match) and a timestamp.
- **Pass threshold:** One log entry per run regardless of outcome.
- **Tool:** `node scripts/run-all-tests.js`, log-capture assertion.

---

## Out of Scope for This Test Plan

- Any remediation or auto-fix action triggered by a detected pattern — detection and notification only.
- A configurable/extensible pattern-definition UI — the known-pattern list is a static, code-maintained list for this MVP.
- Any observability vendor integration beyond `flyctl logs`.
- The real first-month baseline-establishing event itself (see Coverage gaps, AC4) — the diff-recording arithmetic is unit-tested; the real-world trigger is a manual/operational event.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC4's baseline measurement requires a real production defect to actually occur and be independently confirmed | This is an observational event the test suite cannot manufacture meaningfully | Manual verification scenario (🟡) records the real first instance when it happens, per the benefit-metric.md's own explicit baseline deferral — not treated as a silently-skipped gap |
| `flyctl` CLI behaviour in CI (auth, rate limits, real retention edge cases) cannot be fully reproduced without hitting the real Fly.io API | Third-party CLI/API outside this repo's control | Integration test uses a CLI-contract-faithful double where the real binary/credentials aren't available in CI; a post-merge smoke test (verification script) confirms real behaviour against the real app |
