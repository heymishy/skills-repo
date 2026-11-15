# Definition of Done: Give every captured error an environment-specific fingerprint so a production error never joins a staging error group

**PR:** https://github.com/heymishy/skills-repo/pull/1099 (merge commit 7e70671e0) | **Merged:** 2026-11-15 (04:33 UTC)
**Story:** artefacts/2026-11-15-posthog-env-separation/stories/pes-s1-environment-specific-error-fingerprint.md
**Test plan:** artefacts/2026-11-15-posthog-env-separation/test-plans/pes-s1-test-plan.md
**DoR artefact:** artefacts/2026-11-15-posthog-env-separation/dor/pes-s1-dor.md
**Assessed by:** Claude (Sonnet 5.5), with the merge confirmed by the operator
**Date:** 2026-11-15

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ⚠️ | Criterion: fingerprint is `[environment, code, route]`. Evidence: pes_UT1 and pes_UT4 passed, but they asserted an ARRAY | `unit` | Wrong wire type: PostHog requires a string and rejected the array ("invalid type: sequence, expected a string"). Corrected by pes-s2 |
| AC2 | ✅ | Criterion: staging and production fingerprints differ. Evidence: pes_UT2; still true under pes-s2's string form | `unit` | None |
| AC3 | ✅ | Criterion: no canary text; incoming fingerprint ignored. Evidence: pes_UT3 plus the unchanged canary tests; still passing under pes-s2 | `unit` | None |
| AC4 | ⚠️ | Criterion: end to end through the real createApp. Evidence: pes_IT1 passed, asserting the array | `integration-real-code` | Same wrong wire type; the sink accepts anything, PostHog does not. Corrected by pes-s2 |
| AC5 | ⚠️ | Criterion: staging events accepted with a new issue id. Evidence: live query after the deploy (v1299): 9 of 9 new staging events rejected by PostHog, none got an issue id | `live-verified` (failed) | The live check did its job and failed; fixed and re-verified by pes-s2 AC4 |
| AC6 | ⚠️ | Criterion: production error creates its own issue and alerts. Evidence: not run (deliberately withheld after AC5 failed) | none | Moved to pes-s2 AC5 |

---

## Scope Deviations

None against the story's Out of Scope list. The defect is in the story's own specification (an array), not in scope creep.

## Test Plan Coverage

**Tests implemented:** 5 new tests plus the edited key-list test; 88 of 88 passed in CI and locally. **Gaps:** none against the plan, but the tests could not establish what PostHog accepts (see Observations).

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security and privacy: fixed inputs only | ✅ | pes_UT3, pes_UT4 canaries and odd environments |
| Cost: none | ✅ | No new project or event |
| Performance | ✅ | One array literal per event; capture-bound tests unchanged |

## Metric Signal

Metric 4 lists no contributing stories; no signal recorded, as for coha-s5, coha-s6 and sff-s1.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

The code merged as specified, but the specification used the wrong wire type for PostHog, so the live proof (AC5) failed and error capture was rejected again on staging and production between about 04:35 and 05:24 UTC. Story pes-s2 corrected it and AC4 of pes-s2 passed live on staging at 05:24 UTC (new issue 01a1ddaa-6101-72c3-8c5d-7e30ae1f1aa0). This DoD's AC1, AC4 and AC5 are closed by pes-s2.

**Follow-up actions:** (1) pes-s2 AC5: the known production login error, after the operator approves promotion; (2) none further.

## DoD Observations

1. **A documentation example was trusted over the wire.** One PostHog page showed a list; the property's own reference says String. The unit tests asserted my own mock shape. Tag: /improve candidate and learning D62: for any value sent to a third party, find one real accepted example (or accept it live in staging) before writing tests that fix its type.
2. **The live check worked.** Because acceptance criterion 5 was a real staging query, the defect was found within minutes of the deploy and before the production error test was spent. Production was exposed (v186) but no production error arrived in the window.