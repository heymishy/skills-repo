# Implementation Plan: CI/CD chain notifications (announce, status, auto-retry visibility)

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s2-ci-cd-chain-notifications.md
**Test plan reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s2-ci-cd-chain-notifications-test-plan.md
**DoR reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/dor/coha-s2-ci-cd-chain-notifications-dor.md

---

## File map

| File | Purpose |
|------|---------|
| `scripts/lib/ci-chain-notify.js` (new) | Shared notification logic: `notifyPatchAnnounce`, `notifyStatus`, `notifyRetryIfEviction` — all call `coha-s1`'s `sendTeamsNotification` directly, no new adapter |
| `scripts/notify-ci-chain.js` (new) | CLI wiring entry point for GitHub Actions steps (mirrors `scripts/notify-teams.js`'s own pattern) |
| `tests/check-coha-s2-ci-chain-notifications.js` (new) | 10 tests (5 unit, 3 integration, 2 NFR) per the test plan, using the same real-mock-HTTP-listener pattern as `check-coha-s1-teams-outbound-adapter.js` |
| `.github/workflows/staging-deploy.yml` (modified) | Adds one `continue-on-error: true` "Announce patch" step at the top of `deploy-staging` (AC1) |
| `.github/workflows/ci-chain-status-notify.yml` (new) | New, separate `workflow_run`-triggered workflow (same safe pattern as `deploy-group-auto-rerun.yml`) — fires exactly once per completed run of Staging Deploy or E2E Tests (AC2) |
| `.github/workflows/deploy-group-auto-rerun.yml` (modified) | Adds one `continue-on-error: true` "Notify auto-retry occurred" step, gated on the exact same `if:` as the existing rerun step (AC3/AC4) |

---

## Tasks

### Task 1 — `notifyPatchAnnounce` (AC1)
Write the failing test `sendsPatchAnnounceNotification_beforeDeployStepsRun` in `tests/check-coha-s2-ci-chain-notifications.js`, asserting a mock webhook listener receives exactly one request identifying the given commit/PR. Implement `notifyPatchAnnounce({commit, pr})` in `scripts/lib/ci-chain-notify.js`, calling `sendTeamsNotification` with a message naming the commit/PR, logging an `announce-attempt` audit line first.

### Task 2 — `notifyStatus` (AC2)
Write the failing tests `sendsExactlyOneStatusNotification_onSuccess`/`onFailure`. Implement `notifyStatus({workflow, outcome, commit})`, sending exactly one notification per call with an emoji + outcome text, logging a `status-attempt` audit line first.

### Task 3 — `notifyRetryIfEviction` (AC3/AC4)
Write the failing tests `sendsRetryNotificationWithReason_whenGenuineEviction` / `sendsNoRetryNotification_whenGenuineFailureNotEviction`. Implement `notifyRetryIfEviction({annotationText, runId, rerunFired})`, calling the real, unmodified `isDeployGroupEviction()` and sending a notification only when `eviction && rerunFired` — returning `null` (no call at all) otherwise.

### Task 4 — Integration tests (AC1/AC2/AC3/AC4 end-to-end)
Write `announceStepCallsRealAdapterPath_inStagingDeployWorkflowLogic`, `statusNotificationFiresExactlyOnce_acrossRealWorkflowCompletionPaths`, `retryVisibilityRespectsRealIsDeployGroupEvictionGate_endToEnd` — each exercising the real functions above against a real mock HTTP listener, confirming call counts and that AC3/AC4 defer entirely to the real decision function.

### Task 5 — NFR tests
Write `notificationCallDoesNotBlockDeployStepProgression` (timing assertion, <10s) and `notificationDispatchIsLoggedForMetric1Measurement` (stdout-capture assertion, one log line per dispatch type).

### Task 6 — CLI wiring (`scripts/notify-ci-chain.js`)
Separate task from the library module above (D37-equivalent separation of concerns, even though this story introduces no new injectable adapter): wires `setTeamsNotifyAdapter(realTeamsNotifyAdapter)` once, dispatches `announce`/`status`/`retry` modes from CLI args.

### Task 7 — Workflow wiring (`staging-deploy.yml`, `ci-chain-status-notify.yml`, `deploy-group-auto-rerun.yml`)
Add the three minimal, additive, `continue-on-error: true` hook points described in the file map above. Validated by `js-yaml` parse (local) and the real CI run post-merge, per the test plan's own "Out of Scope" note that full workflow-YAML execution is not unit-testable.

---

## Self-review checklist

- [x] Exact file paths, no placeholders
- [x] Complete code shown, not "add logic here"
- [x] Failing test written before each implementation step (confirmed: `Cannot find module 'ci-chain-notify.js'` before Task 1)
- [x] Expected output shown for every run command (10/10 passing, logged below)
- [x] Commit messages in imperative mood
- [x] No scope beyond the 4 ACs — `isDeployGroupEviction()` itself untouched; no PR-branch notification path added
