# Definition of Ready: purge-e2e-tenants uses batched deletes instead of per-tenant sequential loops

**Story:** artefacts/2026-09-05-purge-e2e-tenants-batch-delete/stories/pebd-s1-batch-delete-purge-e2e-tenants.md
**Test plan:** artefacts/2026-09-05-purge-e2e-tenants-batch-delete/test-plans/pebd-s1-test-plan.md
**Contract:** artefacts/2026-09-05-purge-e2e-tenants-batch-delete/dor/pebd-s1-dor-contract.md
**Date:** 2026-09-05
**Track:** Short-track (test-plan -> DoR -> coding agent; discovery through review skipped per CLAUDE.md)

---

## Checklist

- [x] Acceptance criteria are testable (AC1-AC5 automated; AC6 real-backlog-dependent, RISK-ACCEPTed with mandatory post-merge observation)
- [x] Test plan exists and maps every AC to at least one test
- [x] DoR contract scope verified against the test plan's own required touchpoints -- no conflict
- [x] The one related existing test file confirmed to have zero collision risk, by direct grep not assumption
- [x] Risk rated, RISK-ACCEPT logged for the one untestable-locally AC
- [x] No architectural decision requiring a `decisions.md` entry beyond the one RISK-ACCEPT already logged

## Proceed: Yes

## Notes

Scoped urgently: real, currently-active production data-hygiene problem (2260+ orphaned `e2e-test-` tenant rows in Neon, confirmed growing across two real runs 9 minutes apart, with no successful clearing mechanism currently running). `stcs-s1`'s own connection-retry/timeout work remains correct and untouched -- this story fixes the actual architectural bottleneck (sequential per-tenant queries) that timeout tuning alone cannot solve at this backlog size.
