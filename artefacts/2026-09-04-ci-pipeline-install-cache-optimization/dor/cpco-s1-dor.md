# Definition of Ready: CI jobs skip unneeded Playwright browser downloads and cache the browsers they do need

**Story:** artefacts/2026-09-04-ci-pipeline-install-cache-optimization/stories/cpco-s1-skip-unneeded-playwright-downloads-and-cache-browsers.md
**Test plan:** artefacts/2026-09-04-ci-pipeline-install-cache-optimization/test-plans/cpco-s1-test-plan.md
**Contract:** artefacts/2026-09-04-ci-pipeline-install-cache-optimization/dor/cpco-s1-dor-contract.md
**Date:** 2026-09-04
**Track:** Short-track (test-plan -> DoR -> coding agent; discovery through review skipped per CLAUDE.md)

---

## Checklist

- [x] Acceptance criteria are testable (AC1-AC3/AC5 automated; AC4/AC6 GitHub-native behaviour, RISK-ACCEPTed with manual verification per B2/`sdsb-s1` precedent)
- [x] Test plan exists and maps every AC to at least one test
- [x] DoR contract scope verified against the test plan's own required touchpoints -- no conflict
- [x] All three related existing governance tests confirmed unaffected by direct grep, not assumption
- [x] Risk rated, RISK-ACCEPT logged for the two untestable-locally ACs
- [x] No architectural decision requiring a `decisions.md` entry beyond the one RISK-ACCEPT already logged

## Proceed: Yes

## Notes

This story is based directly on a real performance deep-dive (fork investigation, 2026-09-04) that measured actual install-step durations against actual test/build/deploy durations across recent real CI runs -- not a hypothetical optimization. Scoped narrowly to the install/cache layer only; the Neon/Fly cold-start correctness gap surfaced by the same deep-dive is deliberately tracked as a separate story (`stcs-s1`) rather than bundled here, since it is a different root cause (correctness/data-hygiene, not install-time waste) and mixing the two would make this story's own regression surface harder to reason about.
