# Definition of Done: Bounded production-log scan with pattern-match notification

**PR:** https://github.com/heymishy/skills-repo/pull/1069 | **Merged:** 2026-11-11 (merge commit 264b46819)
**Story:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s4-bounded-production-log-scan.md
**Test plan:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s4-bounded-production-log-scan-test-plan.md
**DoR artefact:** artefacts/2026-11-08-cicd-observability-hardening-automation/dor/coha-s4-bounded-production-log-scan-dor.md
**Assessed by:** Claude (against merged code on master at d0a3ad048, read-only; GitHub Actions run history used as evidence)
**Date:** 2026-11-12

---

## AC Coverage

Verification-strength tags: `unit` = against mocked or stubbed dependencies; `integration-real-code` = exercises real production source (here the real `scripts/production-log-scan.js` and real coha-s1 adapter, with the `flyctl` command runner and the webhook HTTP layer faked) but not a live environment; `live-verified` = confirmed against a real running instance; `production-observed` = confirmed by observing real production behaviour or data.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ❌ | AC1 (Acceptance Criterion 1: the scheduled workflow runs `flyctl logs --since <window>`, scans the output for known patterns, and exits). The bounded, exit-after-scan structure is real: `.github/workflows/production-log-scan.yml` has a `schedule:` cron trigger (every 6 hours) and a 5-minute timeout, and `scripts/production-log-scan.js` calls `process.exit` after one scan. Unit and integration tests pass (12/12). BUT the real scheduled runs on master all failed (3 of 3 runs: 42970834935 at 2026-11-11T06:12Z, 43018145512 at 12:11Z, 43074779676 at 18:07Z), each ending in `[production-log-scan] error flyctl logs exited 1`. The script invokes `flyctl logs --since 24h --no-tail`, and `flyctl logs --help` (local flyctl) lists only `--app`, `--config`, `--json`, `--machine`, `--no-tail`, `--region`, `--select` flags: there is no `--since` flag, so flyctl exits non-zero before any logs are fetched. Strength: `unit` and `integration-real-code` pass against a mocked command runner that never validates real flags; `production-observed` evidence (the real GitHub Actions runs) contradicts it. | Automated test `check-coha-s4-production-log-scan` (12/12), plus `gh run list` / `gh run view --log-failed` on the real scheduled runs | The shipped scan has never successfully scanned production logs. AC1's own wording specifies `--since <window>`, so the story's AC itself prescribes a flag flyctl does not support, which is a story-level defect carried into the code, not only an implementation slip. The mock command runner accepts any args, so no test could catch it. See Follow-up 1. |
| AC2 | ⚠️ | AC2 (Acceptance Criterion 2: on a match, exactly one notification is sent via the coha-s1 adapter with timestamp, pattern and excerpt). `sendsExactlyOneNotificationPerScanRun_onMatch`, `detectsKnownErrorPattern_inLogOutput` and `notificationDispatchIsCiGateVerifiable_onKnownBadLine` pass fresh on merged master. The payload built by `buildNotificationPayload` carries timestamp, pattern name and excerpt, and one send happens per run even when several lines match. Strength: `integration-real-code` (real scan logic and real coha-s1 send function, webhook HTTP layer mocked). The claim is about a real notification arriving in Teams, which no test reaches. Additionally, every real workflow run logged `TEAMS_WEBHOOK_URL:` as empty, which indicates the repository secret `TEAMS_WEBHOOK_URL` is not configured, so a real match could not currently notify even once flyctl is fixed. Also note the `timestamp` in each match is the scan time (`new Date()`), not the timestamp parsed from the log line. | Automated tests plus read of `scripts/production-log-scan.js` and the run logs | Real-world effect (a Teams message arriving) unverified, and likely blocked by an unset secret. Marked ⚠️ rather than ✅ per this skill's verification-strength rule. See Follow-ups 2 and 3. |
| AC3 | ⚠️ | AC3 (Acceptance Criterion 3: no match produces no notification and a clean exit). `sendsNoNotification_whenNoMatchFound` passes fresh: zero adapter calls, clean return, audit line `no-match scan completed, 0 matches`. Strength: `unit` against a fake command runner returning fixture output. In production the clean no-match path has never been reached, because every real run exited 1 at the flyctl step before scanning. | Automated test plus run logs | The logic is sound at `unit` strength but the real scheduled job has never produced a clean exit; it currently exits 1 every run, which means a quiet period today is reported as a failed workflow, not a clean run. Dependent on the AC1 fix. |
| AC4 | ⚠️ | AC4 (Acceptance Criterion 4: the first confirmed defect-to-detection gap is recorded as the metric's first real measurement). `recordBaselineMeasurement_computesGapFromSyntheticTimestamps` passes fresh and proves the arithmetic only (`gapMs` and an hours string from two timestamps). Strength: `unit`. The test plan's own Coverage gaps section classifies the real-world trigger as an External-dependency manual scenario. No real defect has been detected by the scan, no baseline has been recorded, and the feature's metric `m4` (Production-defect detection latency) is still `not-yet-measured`. | Automated test plus the feature's `metrics[]` in pipeline-state.json | The real measurement event has not occurred and cannot until the scan works (AC1). Not a code defect, an open operational follow-up. See Follow-up 4. |

**Verification strength summary:** AC1 `unit` and `integration-real-code` passing but contradicted by `production-observed` failure; AC2 `integration-real-code`; AC3 `unit`; AC4 `unit`; 0 `live-verified`; 1 `production-observed` (negative: the scheduled workflow actually fired and failed).

---

## Scope Deviations

None. `gh pr diff 1069 --name-only` lists exactly: `.github/workflows/production-log-scan.yml` (new), `scripts/production-log-scan.js` (new), `tests/check-coha-s4-production-log-scan.js` (new), the implementation plan artefact, and `.github/pipeline-state.json` (bookkeeping). The story's out-of-scope items were respected: no remediation or auto-fix action, a static code-maintained pattern list (one pattern, `tenant_admin_bootstrap_failed`) with no editable UI, and no observability vendor beyond `flyctl logs`.

---

## Test Plan Coverage

**Tests from plan implemented:** 11 / 11 named plan tests (4 unit, 2 integration, 3 NFR, 1 AC4 arithmetic test, plus one extra open-handle test `scanDoesNotLeaveAnOpenHandleRunning`; 12 in the file)
**Tests passing:** 12 / 12 (run locally on merged master at d0a3ad048: `node tests/check-coha-s4-production-log-scan.js` printed "All 12 tests passed.")

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| scanInvokesFlyctlLogsWithBoundedWindow_andExitsAfterScan (AC1) | ✅ | ✅ | Asserts the args against the script's own constant, so it cannot detect an invalid real flag |
| scanRunsAgainstRealFlyctlCliShape_inScheduledWorkflowContext (AC1) | ✅ | ✅ | Name claims real CLI shape but uses a command double; the real binary is never invoked |
| detectsKnownErrorPattern_inLogOutput (AC2) | ✅ | ✅ | |
| sendsExactlyOneNotificationPerScanRun_onMatch (AC2) | ✅ | ✅ | |
| notificationDispatchIsCiGateVerifiable_onKnownBadLine (AC2) | ✅ | ✅ | |
| sendsNoNotification_whenNoMatchFound (AC3) | ✅ | ✅ | |
| recordBaselineMeasurement_computesGapFromSyntheticTimestamps (AC4) | ✅ | ✅ | |
| scanCompletesWithinScheduledJobTimeout (NFR) | ✅ | ✅ | |
| flyApiTokenNeverLoggedOrIncludedInNotificationPayload (NFR) | ✅ | ✅ | |
| everyScanRunIsLogged_matchOrNoMatch (NFR) | ✅ | ✅ | |
| scanDoesNotLeaveAnOpenHandleRunning (AC1, extra) | ✅ | ✅ | |

**Gaps (tests not implemented):** None among planned automated tests. The test plan's named post-merge smoke test ("confirms real behaviour against the real app", Test Gaps and Risks table) was not performed before this DoD and is the check that would have exposed the invalid flag. The first scheduled runs have effectively served as that smoke test and failed.

**Coverage-gap audit:** no `CSS-layout-dependent` gaps in the test plan. One External-dependency gap (AC4 real baseline) and one third-party-CLI gap (real `flyctl` behaviour) are recorded; the latter materialised as the defect above.

---

## NFR Status

Feature-level `nfr-profile.md` exists (Status: Active). Not set to Verified, since not all NFRs are evidenced.

| NFR | Addressed? | Evidence |
|-----|------------|----------|
| Performance: scan completes within the scheduled job timeout | ⚠️ | Workflow sets `timeout-minutes: 5`; real runs finished in 18 to 29 seconds, but only because they failed at the flyctl step, so the real scan duration is unmeasured. `scanCompletesWithinScheduledJobTimeout` passes at `unit` strength. |
| Security: Fly.io API token stays in GitHub secrets, never logged or in the payload | ✅ | Token is read from `secrets.FLY_API_TOKEN` and the run log masks it as `***`. `flyApiTokenNeverLoggedOrIncludedInNotificationPayload` passes. Whether the token is logs-read scoped was not verified. |
| Security: structural verifiability of dispatch (`product/constraints.md` #13) | ✅ | `notificationDispatchIsCiGateVerifiable_onKnownBadLine` asserts one POST on a known-bad fixture line. |
| Audit: every scan run (match or no match) is logged | ⚠️ | `everyScanRunIsLogged_matchOrNoMatch` passes, and the real runs did log an `error` audit line. The error line records only the exit status, not flyctl's stderr, so the root cause was not visible in the log without reading the CLI's own help (see Observation 1). |
| Availability: none defined | ✅ | Not applicable per the profile. |

---

## Metric Signal

No metric in the feature's `metrics[]` array lists `coha-s4` under `contributingStories` (only `m1` lists `coha-s1`; `m4`, Production-defect detection latency, has an empty list, although the story's Benefit Linkage names this metric). Strictly, Step 6 has nothing to record for this story. Recording for the metric the story itself names:

> **Production-defect detection latency (m4)**
> Signal: not-yet-measured
> Evidence note: The scan has never run successfully on master (3 of 3 scheduled runs on 2026-11-11 failed at the flyctl step), so no detection event or baseline exists. No defect has been surfaced by the scan, and the baseline remains `[UNKNOWN BASELINE]`.
> Date measured: null

Observation 3 notes the missing `contributingStories` linkage.

---

## Outcome

**INCOMPLETE**

ACs satisfied: 0/4 fully (AC1 is ❌, AC2, AC3 and AC4 are ⚠️). Deviations: 4 recorded. Test gaps: none among planned tests, one named post-merge smoke test not performed. Verification strength: 3 unit-class passes plus 1 real-code integration, 0 live-verified, 1 production-observed (negative).

**Cause of the Production Log Scan workflow failures (read-only investigation):** this is directly related to coha-s4, not a separate issue. The `Production Log Scan` workflow is the coha-s4 deliverable. All three scheduled runs on 2026-11-11 (06:12Z, 12:11Z, 18:07Z) fail identically with `error flyctl logs exited 1`. The probable cause is the invalid `--since` flag in `scripts/production-log-scan.js` (`['logs', '--since', LOOKBACK_WINDOW, '--no-tail']`), not supported by `flyctl logs`. This is inferred from `flyctl logs --help`, not reproduced against a real invocation; the script discards flyctl's stderr, so the CI log does not show the flyctl error text itself. Alternative contributors not ruled out: an invalid or under-scoped `FLY_API_TOKEN`, or the app resolved from `fly.toml` (`skills-framework`) not matching the intended production app. A second, independent problem is that `TEAMS_WEBHOOK_URL` appears empty in the run environment.

**Follow-up actions (for humans to action, not created by this skill):**
1. Fix the scan's flyctl invocation. Options: drop `--since` and filter lines by timestamp in the script, or use `--no-tail` with a time filter on the output. Capture and log flyctl's stderr (redacting the token) so failures are diagnosable. Update AC1's wording, since the AC itself prescribes `--since`. Owner: operator, via short-track or a fix story.
2. Add a test that fails if the script passes a flag flyctl does not support (for example, assert the args against an allowlist of flyctl logs flags), because the current mock accepts any arguments.
3. Confirm the GitHub Actions secrets `FLY_API_TOKEN` (logs-read scoped if possible) and `TEAMS_WEBHOOK_URL` are configured and valid, then dispatch the workflow manually (`workflow_dispatch`) and confirm one clean run and one notification arriving in Teams from a deliberately injected known-bad line. That live check upgrades AC2 and AC3 evidence to `live-verified`.
4. After the scan works, record the first real defect-to-detection gap against metric `m4` and replace its `[UNKNOWN BASELINE]`. Also add `coha-s4` to `m4`'s `contributingStories`.
5. Until fixed, the scheduled workflow fails every 6 hours and sends failed-run emails; consider disabling the schedule or fixing promptly.

---

## DoD Observations

1. **The mock-based test suite verified internal consistency, not the real CLI contract.** All 12 tests pass while the real command fails every run. The "CLI-contract-faithful double" the test plan called for was not faithful: it accepts any argument list. The test plan's own risk row ("`flyctl` CLI behaviour in CI cannot be fully reproduced") was mitigated by a post-merge smoke test that was never run. Tag: `/improve` candidate, any story depending on a third-party CLI should validate flag names against the real `--help` output or a recorded fixture at test-plan time.
2. **Scan-time stamping.** `scanLogLines` sets each match's `timestamp` to `new Date()` at scan time rather than the log line's own timestamp, so the notification does not show when the defect appeared. AC4's defect-to-detection gap would therefore need the log timestamp read manually from the excerpt. Not an AC2 deviation as written (AC2 says "timestamp"), but it weakens the latency measurement. Tag: `/improve` candidate.
3. **Metric linkage gap.** The story's Benefit Linkage names Production-defect detection latency, but `m4.contributingStories` is empty, so `/definition-of-done` Step 6 and `/trace` cannot connect them mechanically.
4. **The failing workflow's audit line hides the cause.** `[production-log-scan] error flyctl logs exited 1` records no stderr, so the failure needed a read of flyctl's own help to explain. Related to Follow-up 1.

---

## Not verified by this DoD

- No live call to Teams, Fly.io, staging or production was made; no secrets were inspected (whether `FLY_API_TOKEN` and `TEAMS_WEBHOOK_URL` are set was inferred only from the masked and empty env lines in the run log).
- A real `flyctl logs --since 24h --no-tail` invocation was not run (attempted locally, and not permitted); the "no `--since` flag" finding rests on `flyctl logs --help` from the local flyctl installation, which may differ in version from the one `superfly/flyctl-actions/setup-flyctl@master` installs on the runner.
- The post-merge smoke test named in the test plan was not performed.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Bounded production-log scan with pattern-match notification".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
