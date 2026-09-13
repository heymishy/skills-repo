# Definition of Done: Suppress PostHog feature-flag-evaluation analytics noise for E2E/synthetic test traffic

**PR:** https://github.com/heymishy/skills-repo/pull/877 | **Merged:** 2026-09-13T07:26:39Z
**Merge commit:** 616eca76e8bf3d5d910f8522ad1f7d55252ca657
**Story:** artefacts/2026-09-13-posthog-e2e-analytics-suppression/stories/paes-s2-suppress-feature-flag-eval-e2e-noise.md
**Test plan:** artefacts/2026-09-13-posthog-e2e-analytics-suppression/test-plans/paes-s2-test-plan.md
**DoR:** artefacts/2026-09-13-posthog-e2e-analytics-suppression/dor/paes-s2-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-09-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `evaluateFlag(key, {tenantId: 'e2e-test-abc'})` calls `isFeatureEnabled` with `sendFeatureFlagEvents: false` — `P1`/`P2` tests, re-run fresh against merged master | Automated behavioural test (`unit`) | None |
| AC2 | ✅ | `evaluateFlag` with a real tenantId, or no tenantId at all, never sets `sendFeatureFlagEvents` — `P3`/`P4` tests | Automated regression test (`unit`) | None |
| AC3 | ✅ | `groupIdentify('tenant', 'e2e-test-tenant')` never calls `groupIdentifyImmediate` and resolves cleanly — `P5`/`P6` tests | Automated behavioural test (`unit`) | None |
| AC4 | ✅ | `groupIdentify('tenant', 'real-tenant')` still calls `groupIdentifyImmediate` with the correct fields — `P7` test | Automated regression test (`unit`) | None |
| AC5 | ✅ | `posthog-config.js` imports `isE2ETestIdentity` from `posthog-server.js`, with zero duplicate `'e2e-test-'` literals in its own source — `P8` test | Automated source-inspection test (`unit`) | None |

**All 5 ACs satisfied.** 8/8 new tests + 12/12 pre-existing tests (20/20 total in `check-bri-s1.2-staging-prod-separation.js`) re-run fresh against merged master (commit `616eca76`), 0 failures.

**Verification strength:** 5 unit, 0 integration-real-code, 0 live-verified, 0 production-observed. This story's core claim — "e2e-test- feature-flag evaluations no longer emit `Feature flag called` events in the real PostHog project" — is an external-effect claim in the sense of `dvlg-s1`'s verification-strength rule, and has NOT yet been live-verified against the real PostHog project (unlike `paes-s1`/`rpiw-s1`, which both got same-day live checks). Recorded as a Follow-up Action below rather than silently treated as fully proven.

---

## Scope Deviations

None. The merged diff (`src/web-ui/modules/posthog-config.js`, `src/web-ui/modules/posthog-server.js` — a one-line export addition, `tests/check-bri-s1.2-staging-prod-separation.js`, 3 new artefacts, `.github/pipeline-state.json`) maps directly to the story. `posthog-flags.js` was left untouched exactly as scoped.

---

## Test Plan Coverage

**Tests passing:** 8/8 new, 20/20 total, re-run fresh 2026-09-13 against merged master (commit `616eca76`) — `tests/check-bri-s1.2-staging-prod-separation.js`.

**Gaps:** None against the story's own ACs.

**Full regression suite:** 651 files run, 1 failure — `tests/check-p3.5-validate-trace.js` (`ps1-exits-0-on-valid-repo-with-ci-flag`), the pre-existing documented resource-contention flake. No new regressions.

**Real-world validation beyond the test plan itself:** this story is the direct, applied fix for a finding from this same session's live-verification work — `rpiw-s1`'s own live PostHog check (using the Activity view, filtering to `e2e-test-` persons) found dozens of `Feature flag called` events across a 24-hour window, confirming the noise this story targets is real and currently ongoing, not hypothetical.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no new I/O, a single cheap string-prefix check per call | ✅ | `isE2ETestIdentity()` reused unchanged from `paes-s1`; no new network or filesystem calls |
| Security | ✅ N/A | No new external input surface — only inspects values already passed to these functions today |
| Audit | ✅ N/A | No new logging introduced |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track feature (per the story's own Benefit Linkage field). Directly closes a Follow-up Action recorded in `paes-s1`'s own DoD, itself grounded in real, observed PostHog noise found during this session's live-verification work.

---

## Outcome

**COMPLETE**

No deviations, no test gaps, no NFR gaps.

---

## DoD Observations

1. **Follow-up Action — not yet live-verified against the real PostHog project.** Unlike `paes-s1` and `rpiw-s1`, this story's fix has not yet had a same-day live check confirming zero new `Feature flag called` events for `e2e-test-` persons in the real PostHog project. The next time a real E2E/CI run executes against staging (or the operator wants to spot-check), filter PostHog's Activity view to `Feature flag called` events for an `e2e-test-`-prefixed person created after this story's merge time (`2026-09-13T07:26:39Z`) and confirm none appear — closing this loop the same way `paes-s1`'s and `rpiw-s1`'s live checks did.
2. **Together, `paes-s1` and `paes-s2` now cover both real PostHog pathways in this codebase** — `posthog-server.js`'s hand-rolled capture client and `posthog-config.js`'s posthog-node-SDK-backed feature-flag client — closing the full scope of the operator's original "stop e2e test data going to PostHog" request from earlier in this session.
