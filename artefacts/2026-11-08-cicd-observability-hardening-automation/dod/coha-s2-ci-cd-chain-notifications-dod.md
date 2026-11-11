# Definition of Done: CI/CD chain notifications (announce, status, auto-retry visibility)

**PR:** https://github.com/heymishy/skills-repo/pull/1068 | **Merged:** 2026-11-11 (merge commit 73a30f1ca)
**Story:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s2-ci-cd-chain-notifications.md
**Test plan:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s2-ci-cd-chain-notifications-test-plan.md
**DoR artefact:** artefacts/2026-11-08-cicd-observability-hardening-automation/dor/coha-s2-ci-cd-chain-notifications-dor.md
**Assessed by:** Claude (against merged code on master at d0a3ad048, which contains merge commit 73a30f1ca)
**Date:** 2026-11-12

---

## AC Coverage

Verification-strength tags: `unit` = against mocked or stubbed dependencies; `integration-real-code` = exercises real production source (the real notify logic, the real coha-s1 adapter against a local mock webhook listener, the real `isDeployGroupEviction()`) or a static read of the real workflow YAML, but not a live GitHub Actions run; `live-verified` = confirmed against a real running instance; `production-observed` = observed in real production behaviour. No AC below has `live-verified` or `production-observed` evidence. No live checks (Teams, GitHub Actions secrets, staging, production) were performed in this assessment.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ⚠️ | AC1 (Acceptance Criterion 1: on a push to master, `staging-deploy.yml` sends a patch-announce notification via coha-s1's adapter before build/deploy, identifying the commit/PR). Tests `sendsPatchAnnounceNotification_beforeDeployStepsRun` and `announceStepCallsRealAdapterPath_inStagingDeployWorkflowLogic` pass (re-run on merged master). The workflow has an `Announce patch (coha-s2)` step placed after checkout and before the deploy steps, calling `node scripts/notify-ci-chain.js announce`. Strength: `integration-real-code`. The claim is a real Teams message arriving from a real workflow run, which no evidence here shows. | `integration-real-code` (claim requires `live-verified`) | The step carries no `env: TEAMS_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}` mapping (the adapter reads only `process.env.TEAMS_WEBHOOK_URL`; the sibling workflows `vulnerability-check.yml` and `production-log-scan.yml` do map it). Even once the secret exists, this step will report "not configured" and `continue-on-error` hides it. Also the commit is sent but `pr` is hard-coded `null`, so the PR is not identified. See Follow-up Actions 1 and 2. |
| AC2 | ⚠️ | AC2 (Acceptance Criterion 2: when `staging-deploy.yml` or `e2e.yml` completes, exactly one status notification reflects the outcome, never zero and never more than one). Tests `sendsExactlyOneStatusNotification_onSuccess`, `sendsExactlyOneStatusNotification_onFailure` and `statusNotificationFiresExactlyOnce_acrossRealWorkflowCompletionPaths` pass. The new `ci-chain-status-notify.yml` fires once per `workflow_run` completed event for both named workflows. Strength: `integration-real-code`. The once-per-run guarantee depends on GitHub's real event delivery, which the test plan itself names as unreproducible in tests. | `integration-real-code` (claim requires `live-verified`) | Same missing `TEAMS_WEBHOOK_URL` env mapping in `ci-chain-status-notify.yml`, so no notification can arrive from this workflow as written. Any non-success conclusion (including `cancelled`) is reported as "failure", so a cancelled-then-auto-retried run produces a failure message. `e2e.yml` itself was not edited; coverage is through the new workflow. See Follow-up Actions 1 and 3. |
| AC3 | ⚠️ | AC3 (Acceptance Criterion 3: when `isDeployGroupEviction()` confirms an eviction and the rerun fires, a notification states an auto-retry occurred and why). Tests `sendsRetryNotificationWithReason_whenGenuineEviction` and `retryVisibilityRespectsRealIsDeployGroupEvictionGate_endToEnd` pass, using the real unmodified `isDeployGroupEviction()`. `deploy-group-auto-rerun.yml` gains a `Notify auto-retry occurred (coha-s2)` step gated on the same `if: steps.decide.outputs.is_eviction == 'true'` as the rerun, placed directly after it. Strength: `integration-real-code`. A real notification arriving after a real cancelled run is not evidenced. | `integration-real-code` (claim requires `live-verified`) | Same missing `TEAMS_WEBHOOK_URL` env mapping in the new step. The test plan's own gap (post-merge check against a real cancelled run, verification script Scenarios 3 and 4) has not been performed. See Follow-up Actions 1 and 4. |
| AC4 | ✅ | AC4 (Acceptance Criterion 4: when `isDeployGroupEviction()` says genuine failure and no rerun fires, no misleading retry notification is sent). Tests `sendsNoRetryNotification_whenGenuineFailureNotEviction` (zero adapter calls) and `retryVisibilityRespectsRealIsDeployGroupEvictionGate_endToEnd` pass. In the YAML the notify step shares the rerun step's exact `if:` condition and no notify step exists on the not-an-eviction path, read directly from the merged diff. Strength: `integration-real-code`, adequate because the claim is a negative (nothing is sent), which the real code path and the YAML condition demonstrate directly. | `integration-real-code` | None |

**Verification strength summary:** AC1, AC2, AC3 `integration-real-code`, marked ⚠️ because each claim is a real external effect; AC4 `integration-real-code`, adequate at that strength; 0 `unit`-only; 0 `live-verified`; 0 `production-observed`.

---

## Scope Deviations

One recorded deviation, probably unintended.

- **Notifications can fire for PR-branch runs (story Out of Scope item 2: "Notifying on PR-branch (non-master) CI runs").** `e2e.yml` triggers on `pull_request` (types opened and synchronize), and the new `ci-chain-status-notify.yml` listens to every completed run of `E2E Tests (Playwright)` with no branch filter. So a PR's E2E run would produce a status notification. The story scopes notifications to master-merge events. Not confirmed at runtime; this is a read of the trigger configuration only.

Otherwise clean. `gh pr diff 1068 --name-only` shows: `.github/workflows/ci-chain-status-notify.yml` (new), `.github/workflows/deploy-group-auto-rerun.yml` (one added step), `.github/workflows/staging-deploy.yml` (one added step), `scripts/lib/ci-chain-notify.js` (new), `scripts/notify-ci-chain.js` (new), `tests/check-coha-s2-ci-chain-notifications.js` (new), the implementation plan artefact, and `.github/pipeline-state.json` bookkeeping. `scripts/lib/is-deploy-group-eviction.js` was not touched, so the first out-of-scope item (no change to the decision logic) held. `e2e.yml` was not edited.

---

## Test Plan Coverage

**Tests from plan implemented:** 10 / 10 (5 unit, 3 integration, 2 NFR)
**Tests passing:** 10 / 10 (re-run locally on merged master: `node tests/check-coha-s2-ci-chain-notifications.js` gave `10 passed, 0 failed`). I did not independently view the CI run on PR #1068.

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| sendsPatchAnnounceNotification_beforeDeployStepsRun (AC1) | ✅ | ✅ | |
| sendsExactlyOneStatusNotification_onSuccess (AC2) | ✅ | ✅ | |
| sendsExactlyOneStatusNotification_onFailure (AC2) | ✅ | ✅ | |
| sendsRetryNotificationWithReason_whenGenuineEviction (AC3) | ✅ | ✅ | |
| sendsNoRetryNotification_whenGenuineFailureNotEviction (AC4) | ✅ | ✅ | |
| announceStepCallsRealAdapterPath_inStagingDeployWorkflowLogic (AC1) | ✅ | ✅ | Tests the notify script, not the workflow YAML step wiring |
| statusNotificationFiresExactlyOnce_acrossRealWorkflowCompletionPaths (AC2) | ✅ | ✅ | |
| retryVisibilityRespectsRealIsDeployGroupEvictionGate_endToEnd (AC3, AC4) | ✅ | ✅ | |
| notificationCallDoesNotBlockDeployStepProgression (NFR performance) | ✅ | ✅ | |
| notificationDispatchIsLoggedForMetric1Measurement (NFR audit) | ✅ | ✅ | |

**Gaps (tests not implemented):** None among the 10 planned tests.

**Coverage-gap audit:** the test plan has no `CSS-layout-dependent` gaps. It has one external-dependency gap (real GitHub Actions `workflow_run` delivery), mitigated by a post-merge smoke test (verification script Scenarios 3 and 4). That smoke test has not been run and is carried as Follow-up Action 4. `decisions.md` records no RISK-ACCEPT for this story; the only entry touching it is the shared W4 (verification script domain-expert review) acknowledgement. A structural note: none of the 10 tests parse the three workflow YAML files, so nothing in CI would have caught the missing secret mapping.

---

## NFR Status

Feature-level `nfr-profile.md` exists (Status: Active); not set to Verified because gaps remain.

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: notification must not add meaningful latency to the deploy pipeline | ✅ | `notificationCallDoesNotBlockDeployStepProgression` passes; the announce step and the retry step use `continue-on-error`, and the adapter has coha-s1's bounded timeout. The profile sets no numeric SLO. Strength: `unit` / `integration-real-code`. |
| Audit: dispatch logged to support Metric 1's CI-run-count-vs-dispatch-count measurement | ✅ | `notificationDispatchIsLoggedForMetric1Measurement` passes; the log lines `announce-attempt`, `status-attempt`, `retry-attempt` are visible in the test output. Note the dispatch log lives in CI step logs, and no counting mechanism exists yet. |
| Security: credential only in GitHub Actions secrets, never logged or in payloads (`product/constraints.md` #12) | ⚠️ | No credential is logged or placed in a payload (read of the notify code). But the secret is not wired into any of the three new steps, so the credential path is unexercised and currently broken. |
| Security: structural verifiability of dispatch (`product/constraints.md` #13) | ⚠️ | CI asserts the adapter mock is called by the notify logic, but nothing asserts the workflow steps pass the needed environment. The mock-based proof does not cover the production wiring. |

---

## Metric Signal

No metric in the feature's `metrics[]` lists `coha-s2` in `contributingStories`. Only `m1` lists a story (`coha-s1`), and m2 through m5-tier3 have empty `contributingStories`. Step 6 therefore has nothing to record for this story strictly as written.

Observation for the operator: the story's own Benefit Linkage names "CI/CD chain notification coverage" (m1) and "Manual CI toil reduction for known-flaky patterns" (m2) as the metrics it moves, but the pipeline state does not list `coha-s2` as a contributor to either. If the state is corrected, both would be recorded as:

> **CI/CD chain notification coverage (m1)**
> Signal: not-yet-measured
> Evidence note: no notification from these workflows has been observed arriving in Teams; the three new steps do not map `TEAMS_WEBHOOK_URL` from secrets, and the secret's presence in GitHub Actions was not checked. The coverage percentage cannot be measured until both are resolved.
> Date measured: null
>
> **Manual CI toil reduction for known-flaky patterns (m2)**
> Signal: not-yet-measured
> Evidence note: the auto-retry visibility step has never fired against a real cancelled run, so no reduction in manual re-verification has been observed.
> Date measured: null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

ACs satisfied: 1/4 fully (AC4); 3/4 marked ⚠️ (AC1, AC2, AC3) on `integration-real-code` evidence for real-world-effect claims. Nothing is `❌`. Scope deviations: 1 (possible PR-branch notifications). Test gaps: none. Verification strength: 4 integration-real-code, 0 unit-only, 0 live-verified, 0 production-observed. UI-evidence gate: N/A, no browser-observable ACs.

**Follow-up actions:**
1. **Add the secret mapping to all three steps.** Add `env: TEAMS_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}` to the `Announce patch (coha-s2)` step in `staging-deploy.yml`, the `Send status notification (coha-s2)` step in `ci-chain-status-notify.yml`, and the `Notify auto-retry occurred (coha-s2)` step in `deploy-group-auto-rerun.yml`, and confirm the repository secret exists. Owner: operator. Via short-track pipeline (workflow changes go via branch and PR). Strongly suggest adding a test that parses the three YAML files for the mapping.
2. **Identify the PR in the announce message (AC1).** The announce step hard-codes `pr: null`; either resolve the PR number from the push commit or amend AC1's wording to "commit only". Owner: operator.
3. **Decide how `cancelled` runs are reported (AC2).** Currently any non-success conclusion is reported as "failure", so a cancelled run that is then auto-retried yields a "failure" notification followed by a retry notice. Owner: operator.
4. **Run the live check.** After items 1 and 2, trigger one real master merge and confirm one announce and one status message arrive in Teams, then confirm one retry message for a real eviction-cancelled run (verification script Scenarios 3 and 4) and zero for a genuine failure. This upgrades AC1 to AC3 from ⚠️ to ✅. Owner: operator.
5. **Add a branch filter to `ci-chain-status-notify.yml`** so PR-branch E2E runs do not notify (the scope deviation above), or record a RISK-ACCEPT if PR notifications are acceptable.

---

## DoD Observations

1. **All three notification steps use `continue-on-error`, so the missing secret mapping fails silently.** The coha-s1 DoD already carried a follow-up that no `TEAMS_WEBHOOK_URL` is configured; that follow-up was aimed at the secret's existence, and this story's wiring would not have picked the secret up even if it existed. Tag: `/improve` candidate (a workflow-wiring check for secrets that adapters read from `process.env`).
2. **The test plan's integration tests exercise the notify scripts, not the workflow YAML.** `product/constraints.md` #13 asks that CI assert the notification step ran for a given outcome; here the assertion covers the logic, while the step wiring (conditions, env, triggers) is read by humans only. Tag: `/improve` candidate.
3. **`ci-chain-status-notify.yml` is a separate workflow rather than a hook inside `e2e.yml`**, which keeps the once-per-run guarantee simple but is a design choice not recorded in `decisions.md`. Tag: `/improve` candidate (log as an ARCH decision).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "CI/CD chain notifications (announce, status, auto-retry visibility)".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
