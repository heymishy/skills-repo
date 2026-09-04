# Definition of Ready: promote-to-prod writes the real version stamp before deploying

**Story:** artefacts/2026-09-05-promote-to-prod-version-stamp/stories/ptvs-s1-promote-to-prod-writes-version-stamp.md
**Test plan:** artefacts/2026-09-05-promote-to-prod-version-stamp/test-plans/ptvs-s1-test-plan.md
**Contract:** artefacts/2026-09-05-promote-to-prod-version-stamp/dor/ptvs-s1-dor-contract.md
**Date:** 2026-09-05
**Track:** Short-track (test-plan -> DoR -> coding agent; discovery through review skipped per CLAUDE.md)

---

## Checklist

- [x] Acceptance criteria are testable (AC1-AC5 automated; AC6 real-deploy-dependent, RISK-ACCEPTed with mandatory manual re-check)
- [x] Test plan exists and maps every AC to at least one test
- [x] DoR contract scope verified against the test plan's own required touchpoints -- no conflict
- [x] The one related existing test file confirmed to have zero collision risk, by direct reading not assumption
- [x] Risk rated (1, mechanical mirror of an already-proven pattern), RISK-ACCEPT logged for the one untestable-locally AC
- [x] No architectural decision requiring a `decisions.md` entry beyond the one RISK-ACCEPT already logged

## Proceed: Yes

## Notes

Small, well-scoped fix found during today's own `dcfx-s1` investigation and explicitly deferred there as a distinct, lower-severity finding. This story closes it out: `promote-to-prod`'s own job gets the same version-stamping steps `deploy-staging` has had all along, so `GET /version` finally answers "which build is this?" correctly for real production deploys, not just staging.
