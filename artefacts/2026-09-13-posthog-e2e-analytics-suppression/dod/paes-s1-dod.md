# Definition of Done: Suppress PostHog analytics capture for E2E/synthetic test traffic

**PR:** https://github.com/heymishy/skills-repo/pull/874 | **Merged:** 2026-09-13T00:51:25Z
**Merge commit:** 6d4c6ce8c57334cf87be382a53071cc50a217969
**Story:** artefacts/2026-09-13-posthog-e2e-analytics-suppression/stories/paes-s1-suppress-e2e-test-analytics.md
**Test plan:** artefacts/2026-09-13-posthog-e2e-analytics-suppression/test-plans/paes-s1-test-plan.md
**DoR:** artefacts/2026-09-13-posthog-e2e-analytics-suppression/dor/paes-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-09-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `capture()` no-ops for an `e2e-test-`-prefixed `distinctId`, case-insensitive — `H1`/`H2` tests, re-run fresh against merged master | Automated behavioural test (`unit`) | None |
| AC2 | ✅ | `capture()` no-ops when a `groups` value is `e2e-test-`-prefixed, even with a real `distinctId` — `H3` test | Automated behavioural test (`unit`) | None |
| AC3 | ✅ | `identify()` and `captureException()` no-op for an `e2e-test-`-prefixed `distinctId` — `H4`/`H5` tests | Automated behavioural test (`unit`) | None |
| AC4 | ✅ | `groupIdentify()` no-ops for an `e2e-test-`-prefixed `groupKey` — `H6` test | Automated behavioural test (`unit`) | None |
| AC5 | ✅ | All pre-existing tests in `check-pla-s1-posthog-module.js` (groups A-G, N1-N2) re-run unmodified — 24/24 total (17 pre-existing + 7 new), no behavioural change for non-synthetic identities | Automated regression test (`unit`) | None |
| AC6 | ✅ | With `POSTHOG_KEY` unset and an `e2e-test-`-prefixed identity, `capture()` still no-ops without throwing — `H7` test | Automated behavioural test (`unit`) | None |

**All 6 ACs satisfied.** 24/24 tests re-run fresh against merged master (commit `6d4c6ce8`), 0 failures.

**Verification strength:** 6 unit, 0 integration-real-code, 6 live-verified (upgraded post-merge), 0 production-observed. Initially recorded as unit-only at DoD time (the guard's HTTP-mock harness asserts up to the network boundary, but not the real PostHog receipt). Upgraded the same day: a real E2E run against `wuce-staging` (PR #875, see DoD Observation 2 below) confirmed via PostHog's own Activity view that the `e2e-test-`-prefixed person this run created has zero `$identify`/`$groupidentify`/`$exception`/custom capture events, and a 24-hour `Group identify` filter shows zero `e2e-test-`-prefixed groups. All 6 ACs now carry direct live evidence, not just unit-test evidence.

---

## Scope Deviations

None. The merged diff (`src/web-ui/modules/posthog-server.js`, `tests/check-pla-s1-posthog-module.js`, 3 new artefacts under `artefacts/2026-09-13-posthog-e2e-analytics-suppression/`, and `.github/pipeline-state.json`) maps directly to the story.

---

## Test Plan Coverage

**Tests passing:** 24/24, re-run fresh 2026-09-13 against merged master (commit `6d4c6ce8`) — `tests/check-pla-s1-posthog-module.js` (T1-T8 from the test plan map to the new Group H tests H1-H7, one test plan case per AC plus the non-regression full-suite re-run).

**Gaps:** None against the story's own ACs.

**Full regression suite:** 650 files run, 1 failure — `tests/check-p3.5-validate-trace.js` (`ps1-exits-0-on-valid-repo-with-ci-flag`), the pre-existing documented resource-contention flake tracked in this repo's own baseline. No new regressions.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — cheap string-prefix check, no network/filesystem call on the hot path | ✅ | `isE2ETestIdentity()` is a single `typeof` + `toLowerCase().indexOf()` check; no new I/O introduced |
| Security — no new external input surface | ✅ N/A | Guard only inspects values already passed to these functions today |
| Audit — POSTHOG_KEY never logged | ✅ | Pre-existing `N2` test re-run and still passing; no new logging added |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track feature (per the story's own Benefit Linkage field). Directly requested by the operator to stop E2E/synthetic test traffic from polluting the real PostHog project's analytics.

---

## Outcome

**COMPLETE**

No deviations, no test gaps, no NFR gaps.

---

## DoD Observations

1. **CI trace-validation gap caught mid-delivery, corrected before merge**: the initial PR push had the pipeline-state.json feature/story registration land on `master` (via a separate bookkeeping commit) but not on the PR branch itself, so the branch's own `Validate traceability chain` CI check failed with "not registered in pipeline-state" against the branch's own snapshot of `pipeline-state.json`. Fixed by merging `master` into the feature branch before merge, bringing the registration onto the branch too — consistent with CLAUDE.md's own "bundle first" guidance for state/artefact updates, which this instance under-applied on the first attempt (registered on master pre-emptively, rather than on the branch alongside the code). No skill or process change proposed — a one-off execution-order slip, self-corrected within the same PR before merge, not a repeated pattern yet.
2. **Follow-up Action closed same-day via a real live check.** The operator requested a live E2E run specifically to close this gap. A throwaway documentation-only PR (#875, capture-log entry) was opened purely to trigger the `pull_request`-gated Scenario A/B staging E2E jobs (paes-s1's own PR branch had already been deleted post-merge, and `e2e.yml` has no `workflow_dispatch` trigger) — both jobs passed against real `wuce-staging`. Checked PostHog's real Activity view (project 10908) immediately after: the `e2e-test-bri-s3-4-a-...@example.test` person created by that run shows exactly one event total, `Feature flag called` (the separate, out-of-scope feature-flag evaluation pathway via `posthog-config.js`/posthog-node's own auto-capture) — zero `$identify`, `$groupidentify`, `$exception`, or custom capture events. A `Group identify` filter across the full last-24-hours window (spanning multiple real CI runs) returned exactly one entry, the pre-existing real `$tenant_heymishy` group (from `tgid-s1`), and zero `e2e-test-`-prefixed groups. This directly confirms the guard suppresses real traffic through `posthog-server.js`'s capture path, verification strength upgraded from `unit`-only to `live-verified` for this claim. The `Feature flag called` noise is real but was already explicitly out of scope for this story (see story's Architecture Constraints) — recorded as a new, separate Follow-up Action below.
3. **New Follow-up Action — `posthog-config.js`'s feature-flag evaluation pathway still sends `e2e-test-` traffic to PostHog.** Every `isFeatureEnabled()` call (via the real posthog-node client wired in `posthog-config.js`) auto-emits a `$feature_flag_called` event, and this is NOT covered by paes-s1's guard (which only touches `posthog-server.js`'s hand-rolled `capture`/`identify`/`groupIdentify`/`captureException`). Confirmed via this same live check: dozens of `Feature flag called` events for `e2e-test-`-prefixed persons appear in the last 24 hours alone, one per real E2E/CI run. If the operator wants this pollution eliminated too (not just the analytics-capture path this story addressed), it needs its own short-track story against `posthog-config.js`'s `evaluateFlag()` wiring — out of scope for paes-s1 by explicit story design, not an oversight.
