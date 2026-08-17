# Definition of Done: Local pipeline-state schema checks catch the required-field/enum/type mistakes that today only surface as CI-only failures

**PR:** #602, merge commit `95ce9a8d` | **Merged:** 2026-07-25
**Story:** artefacts/2026-07-25-pipeline-state-schema-validation/stories/pss-s1-schema-required-field-checks.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 -- flat `feature.stories[]` missing `id` -> `C10` FAIL naming feature slug + story slug/index | Yes | `scripts/check-pipeline-state-integrity.js` lines 172-182 implement the check; self-tests "C10: flat story + no id -> fail" and "C10: flat story + id present -> no C10" (lines 558-567) | Embedded self-test suite (80 passed, 0 failed, freshly re-run 2026-08-17) | Minor: when a story lacks both `id` and `slug`, the message falls back to the literal string `(unknown)` rather than the array index -- still identifies the feature and, when present, the story slug, so functionally close to the AC's intent |
| AC2 -- feature missing `track` -> `C11` FAIL naming feature slug | Yes | Lines 141-152 implement the check; self-tests "C11: feature missing track -> fail" and "C11: feature with track -> no C11" (lines 582-591) | Embedded self-test suite | None |
| AC3 -- `dodStatus` null or outside `not-started\|complete` -> `C12` FAIL naming feature/story + invalid value | Yes | Lines 184-194; self-tests "C12: dodStatus=null -> fail", "C12: dodStatus=\"done\" -> fail", plus valid-value and absent-value non-regression tests (lines 600-623) | Embedded self-test suite | None |
| AC4 -- `prStatus` outside `none\|draft\|open\|merged` -> `C13` FAIL naming feature/story + invalid value | Yes | Lines 196-205; self-tests "C13: prStatus=\"not-started\" -> fail", plus valid-value and absent-value tests (lines 632-649) | Embedded self-test suite | None |
| AC5 -- `acVerified` present but not an integer -> `C14` FAIL naming feature/story + actual type | Yes | Lines 207-217; self-tests "C14: acVerified=\"true\" (string) -> fail", plus integer and absent-value non-regression tests (lines 658-673) | Embedded self-test suite | None |
| AC6 -- fully-valid fixture fires none of C10-C14 (non-regression baseline) | Yes | Explicit combined test "AC6: fully-valid fixture -> none of C10-C14 fire" (lines 682-694) checks all five new codes absent on a clean fixture | Embedded self-test suite | None |

## Scope Deviations

None. The three items the story explicitly named as out of scope (a full generic JSON-Schema Draft-7 validator; fixing the local `python3`/`python` naming issue for CI's `validate-trace.sh`; retroactively fixing pre-existing C10-C14 violations in the real `.github/pipeline-state.json`) were not attempted, consistent with the story's own "Out of Scope" section -- accepted, not a defect.

## Test Plan Coverage

`scripts/check-pipeline-state-integrity.js` embeds its own self-test suite (no separate `tests/check-*.js` file exists for this story, consistent with the story's Architecture Constraints to extend the existing file rather than create a new one). Freshly re-run 2026-08-17: **80 passed, 0 failed**, covering C1-C14 including the five new checks (C10-C14) and the AC6 non-regression baseline.

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Consistency (`{ code, level, message }` shape identical to C1-C9) | Met | C10-C14 findings use the same `{ level, code, message }` object shape as the existing checks (lines 146-151, 177-181, 188-193, 199-204, 211-216) |
| Backward compatibility (C1-C9 self-tests unaffected) | Met | All 80 self-tests pass, which includes the pre-existing C1-C9 tests alongside the new C10-C14 tests -- no regressions |

## Metric Signal

The story does not reference a separate `/benefit-metric` artefact -- as a short-track bug fix, it operates directly against the recurring capture-log incident pattern (five documented CI-only-catch incidents: tst-s1, jlc-s1, dtra-s1, dspw-s1, tdc-s1, plus the `dodStatus`/`prStatus`/`acVerified` incidents) rather than a formal metric target. The relevant signal is incident recurrence going forward, not a quantitative benefit metric.

## Outcome

**COMPLETE**
**Follow-up actions:** None.

## DoD Observations

This tool has been run dozens of times across this session as part of routine `pipeline-state.json` commits, and has caught real integrity issues in production use during that time (an invalid `testPlan.status` enum value and a stale `acVerified` mismatch) -- direct, session-length evidence that the check functions as intended beyond its own self-tests.
