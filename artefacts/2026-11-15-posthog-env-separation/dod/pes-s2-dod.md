# Definition of Done: Send the environment-specific fingerprint as a string, because PostHog rejects an array

**PR:** https://github.com/heymishy/skills-repo/pull/1100 (merge commit f0a8489d6) | **Merged:** 2026-11-15 (05:22 UTC)
**Story:** artefacts/2026-11-15-posthog-env-separation/stories/pes-s2-string-fingerprint.md
**Test plan:** artefacts/2026-11-15-posthog-env-separation/test-plans/pes-s2-test-plan.md
**DoR artefact:** artefacts/2026-11-15-posthog-env-separation/dor/pes-s2-dor.md
**Assessed by:** Claude (Sonnet 5.5), with the merge confirmed by the operator
**Date:** 2026-11-15

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Criterion: the fingerprint is the string `environment|code|route` with exactly two separators. Evidence: pes_UT1 and pes_UT5 (all fail on the array) | `unit` | None |
| AC2 | ✅ | Criterion: environments differ. Evidence: pes_UT2 | `unit` | None |
| AC3 | ✅ | Criterion: no canary; incoming fingerprint ignored; unknown environment. Evidence: pes_UT3, pes_UT4, pes_IT1 (real createApp child process) | `unit` and `integration-real-code` | None |
| AC4 | ✅ | Criterion: staging events accepted, new issue id, new issue listed. Evidence: after the staging deploy (v1303, 2026-11-15 05:23 UTC) 9 new `$exception` events (05:24:42 to 05:25:40) carry the string fingerprint `staging|tenant_admin_bootstrap_failed|/auth/:p`, 0 of 9 carry a `$cymbal_errors` value, all share the NEW issue id 01a1ddaa-6101-72c3-8c5d-7e30ae1f1aa0 (not 01a1dd12-795d-7763-827f-9a246fad8d00, which stays at 55 occurrences), and Error Tracking lists the new issue | `live-verified` (staging) | None |
| AC5 | ✅ | Criterion: a real production error creates its own issue, the alert fires, the bridge opens one GitHub issue (and the workflow one record pull request). Evidence: 2026-11-15 05:51 UTC the operator logged in to production again; the login-time tenant_admin_bootstrap_failed (tenantId heymishy, reason "inconsistent types deduced for parameter $1") was captured with the string fingerprint production|tenant_admin_bootstrap_failed|/auth/:p, no cymbal rejection, as NEW issue 01a1ddc2-f17b-7c23-900b-0558af68b822 (05:51:32); PostHog fired the alert and the bridge created GitHub issue #1101 at 05:51:47 (first seen 2026-11-15T05:51:44.780317+00:00, label production-error, body marker present, author heymishy); the coha-s7 workflow (run 43682885575) recorded it as "open new issue #1101" and opened record pull request #1102 on branch incident/posthog-01a1ddc2-f17b-7c23-900b-0558af68b822. End to end in about 30 seconds, no manual step. | `production-observed` | None |

---

## Scope Deviations
None.

## Test Plan Coverage
**Tests implemented:** 1 new (UT5) plus 5 edited; 89 of 89 locally. PR checks passed before the operator merged. **Gaps:** none against the plan.

## NFR Status
| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security and privacy: unchanged fixed inputs | ✅ | pes_UT3 canaries; unknown environments become `unknown` |
| Cost | ✅ | none |
| Performance | ✅ | one string join per event |

## Metric Signal
Metric 4 lists no contributing stories; no signal recorded. Its first measurement needs the first real production error to reach GitHub (AC5).

---

## Outcome

**COMPLETE**

All five acceptance criteria are satisfied: AC1 to AC3 on unit and integration evidence, AC4 live on staging and AC5 production-observed on 2026-11-15 05:51 UTC (real production error, issue #1101, record pull request #1102).

**Follow-up actions:**
1. Operator: approve "Promote to production" in Staging Deploy run 43680823878 (staging proof is in), then repeat the known production login error once. Expected: a new production issue, `$error_tracking_issue_created`, one GitHub issue labelled `production-error`, one record pull request (close it if it is only a test).
2. Optional hardening story: `RE_REPO_PATH` accepts `..` segments (existing behaviour).

## DoD Observations
1. **Fixed by checking the wire, not the docs.** The reference page lists a String; the earlier build's rejection message said so explicitly. AC4 is the check that matters and it is a live PostHog query.
2. **Second wire-type miss in one feature** (sff-s1 filename, pes-s1 array): a third-party call needs a real accepted example before its tests are written (learning D62).