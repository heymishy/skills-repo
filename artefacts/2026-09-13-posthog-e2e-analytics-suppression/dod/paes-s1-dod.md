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

**Verification strength:** 6 unit, 0 integration-real-code, 0 live-verified, 0 production-observed. This story's own claim ("PostHog receives zero events for `e2e-test-`-prefixed traffic") is an external-effect claim in the sense of `dvlg-s1`'s new AC3 rule — but the mechanism being verified (an HTTP call is or isn't made) is fully and deterministically observable via the existing `installHttpsMock()` harness, which asserts on the real code path up to (and stopping exactly at) the network boundary. A live check against the real PostHog project was not performed, since the guard's own logic is the entire surface area — there is no additional real-world behaviour beyond "the HTTP request object is never constructed" for the suppressed case, which the unit tests directly assert. Recorded as a Follow-up Action below rather than silently treated as fully live-verified.

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
2. **Follow-up Action — no live verification against the real PostHog project.** This story's guard was verified entirely via the existing `installHttpsMock()` unit-test harness (asserting the HTTP request is never constructed for a synthetic identity), not via a real PostHog receipt check (e.g. confirming zero new events appear in PostHog's Activity view when an `e2e-test-`-prefixed CI run executes). Given `dvlg-s1`'s own new verification-strength rule (merged in this same session, PR #873), a claim about a real external effect ideally gets a live check or an explicit Follow-up Action — recording this as the latter: the next time a real E2E/CI run against staging executes with an `e2e-test-`-prefixed identity, spot-check PostHog's Activity view to confirm no corresponding event landed, closing this gap opportunistically rather than blocking this fix on a dedicated staging-verification pass.
