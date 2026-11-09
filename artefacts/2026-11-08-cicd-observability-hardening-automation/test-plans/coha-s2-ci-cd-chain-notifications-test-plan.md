# Test Plan: CI/CD chain notifications (announce, status, auto-retry visibility)

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s2-ci-cd-chain-notifications.md
**Epic reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/epics/coha-e1-detect-and-alert.md
**Test plan author:** Claude Sonnet 5
**Date:** 2026-11-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Patch-announce notification sent before build/deploy steps run | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Exactly one status notification per completed run, never zero/duplicate | 2 tests | 1 test | — | — | — | 🟢 |
| AC3 | Genuine eviction + rerun fires → auto-retry notification sent with reason | 1 test | 1 test | — | — | — | 🟢 |
| AC4 | Genuine failure (not eviction), no rerun → no misleading retry notification | 1 test | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. All four ACs concern workflow-step wiring and notification dispatch counts, both testable by invoking the relevant script/step logic directly and asserting against a mocked `coha-s1` adapter call record.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A synthetic commit/PR identifier | Synthetic (test setup) | None | |
| AC2 | Synthetic workflow-run outcome objects: success and failure | Synthetic (test setup) | None | |
| AC3 | A fixture matching `deploy-group-auto-rerun.yml`'s real `workflow_run` `completed`/`cancelled` event shape, with `isDeployGroupEviction()` returning `true` | Fixture, shaped from the real existing workflow's event contract | None | Per `product/constraints.md` #13, assert the adapter mock actually recorded a call — not that the workflow YAML merely contains a notify step |
| AC4 | Same fixture shape as AC3, but `isDeployGroupEviction()` returns `false` | Fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### sendsPatchAnnounceNotification_beforeDeployStepsRun

- **Verifies:** AC1
- **Precondition:** A mocked `coha-s1` send function (the real module, with its HTTP layer mocked — not a bare jest.fn() standing in for the whole adapter); a synthetic commit/PR identifier.
- **Action:** Invoke the announce step's logic with the commit/PR identifier, simulating the point in `staging-deploy.yml` before build/deploy begins.
- **Expected result:** The mocked adapter recorded exactly one call, and the message content identifies the given commit/PR.
- **Edge case:** No.

### sendsExactlyOneStatusNotification_onSuccess

- **Verifies:** AC2
- **Precondition:** Mocked adapter; a synthetic "workflow succeeded" outcome.
- **Action:** Invoke the status-notification logic with the success outcome.
- **Expected result:** Exactly one adapter call recorded, reflecting success — not zero, not two.
- **Edge case:** No.

### sendsExactlyOneStatusNotification_onFailure

- **Verifies:** AC2
- **Precondition:** Mocked adapter; a synthetic "workflow failed" outcome.
- **Action:** Invoke the status-notification logic with the failure outcome.
- **Expected result:** Exactly one adapter call recorded, reflecting failure.
- **Edge case:** Yes — confirms the "never zero, never more than one" guarantee holds for the failure path too, not just success.

### sendsRetryNotificationWithReason_whenGenuineEviction

- **Verifies:** AC3
- **Precondition:** Fixture `workflow_run` event where `isDeployGroupEviction()` (the real, unmodified function) returns `true`; mocked adapter.
- **Action:** Invoke the retry-notification logic with this fixture.
- **Expected result:** Exactly one adapter call recorded, with message content stating an auto-retry occurred and naming the reason (deploy-group eviction).
- **Edge case:** No.

### sendsNoRetryNotification_whenGenuineFailureNotEviction

- **Verifies:** AC4
- **Precondition:** Fixture `workflow_run` event where `isDeployGroupEviction()` returns `false`; mocked adapter.
- **Action:** Invoke the retry-notification logic with this fixture.
- **Expected result:** Zero adapter calls recorded — no "auto-retry occurred" notification is ever produced for a genuine failure.
- **Edge case:** Yes — this is the negative-space guarantee the story explicitly calls out ("must never notify about a retry that didn't actually happen").

---

## Integration Tests

### announceStepCallsRealAdapterPath_inStagingDeployWorkflowLogic

- **Verifies:** AC1
- **Components involved:** The announce step's script/logic, `coha-s1`'s real send function (HTTP layer mocked at the boundary, per coha-s1's own test plan), the workflow step's invocation point.
- **Precondition:** The announce logic is wired exactly as it will run inside `staging-deploy.yml`.
- **Action:** Simulate a merge-to-master trigger end-to-end through the announce step.
- **Expected result:** A mock webhook listener (shared boundary with coha-s1's integration tests) receives exactly one POST identifying the commit/PR — this is the CI-gate-verifiable assertion `product/constraints.md` #13 requires, not a check that the workflow YAML merely references a notify step.

### statusNotificationFiresExactlyOnce_acrossRealWorkflowCompletionPaths

- **Verifies:** AC2
- **Components involved:** Status-notification logic, `coha-s1` adapter, synthetic success and failure outcome fixtures run through the same code path used by both `staging-deploy.yml` and `e2e.yml`.
- **Precondition:** Both workflows' final-status hook points call the same shared status-notification function.
- **Action:** Run the shared function once per outcome type.
- **Expected result:** One notification per run, confirmed via the mock listener's call count — never a double-fire from both workflows' hooks for the same run.

### retryVisibilityRespectsRealIsDeployGroupEvictionGate_endToEnd

- **Verifies:** AC3, AC4
- **Components involved:** `isDeployGroupEviction()` (real, unmodified), the retry-notification logic, `coha-s1` adapter, the `if:` gate semantics from `deploy-group-auto-rerun.yml`.
- **Precondition:** Two fixtures (eviction=true, eviction=false) run through the actual decision function, not a re-implemented stand-in.
- **Action:** Run both fixtures through the full decision-to-notification path.
- **Expected result:** Eviction=true produces exactly one adapter call with retry context; eviction=false produces zero adapter calls — confirming the notification logic defers entirely to the existing, unmodified gate rather than re-deciding anything.

---

## NFR Tests

### notificationCallDoesNotBlockDeployStepProgression

- **NFR addressed:** Performance — notification must not add meaningful latency to the deploy pipeline
- **Measurement method:** Measure wall-clock time of the announce/status step with the notification call present vs. a no-op stand-in; assert the added latency is within `coha-s1`'s own bounded-timeout design (does not block beyond that bound).
- **Pass threshold:** Added latency attributable to the notification step does not exceed `coha-s1`'s bounded timeout (≤10s), and the step is structured as non-blocking where the workflow allows.
- **Tool:** `node scripts/run-all-tests.js`, timing assertion.

### notificationDispatchIsLoggedForMetric1Measurement

- **NFR addressed:** Audit — dispatch logged to support Metric 1's CI-run-count-vs-dispatch-count measurement
- **Measurement method:** Trigger announce, status, and retry paths; assert a log entry exists for each dispatch attempt.
- **Pass threshold:** One log entry per dispatch attempt across all three notification types.
- **Tool:** `node scripts/run-all-tests.js`, log-capture assertion.

---

## Out of Scope for This Test Plan

- `isDeployGroupEviction()`'s own decision logic — tested as a pre-existing, unmodified dependency, not re-verified here.
- Live GitHub Actions execution of `staging-deploy.yml`/`e2e.yml`/`deploy-group-auto-rerun.yml` — covered by unit/integration tests against the extracted notification logic; full workflow-YAML execution is validated by the real CI run post-merge, not by this test plan.
- PR-branch (non-master) notification — explicitly out of scope per the story.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real GitHub Actions `workflow_run` event delivery timing/ordering is not fully reproducible in a unit/integration test | GitHub's own event delivery is outside this repo's control | Post-merge smoke test (verification script Scenario 3/4) confirms real behaviour against a real cancelled run |
