# Definition of Ready: purge-e2e-tenants tolerates Neon cold-start and gets a scheduled backstop

**Story:** artefacts/2026-09-04-staging-cold-start-correctness-gap/stories/stcs-s1-purge-e2e-tenants-cold-start-retry-and-scheduled-backstop.md
**Test plan:** artefacts/2026-09-04-staging-cold-start-correctness-gap/test-plans/stcs-s1-test-plan.md
**Contract:** artefacts/2026-09-04-staging-cold-start-correctness-gap/dor/stcs-s1-dor-contract.md
**Date:** 2026-09-04
**Track:** Short-track (test-plan -> DoR -> coding agent; discovery through review skipped per CLAUDE.md)

---

## Checklist

- [x] Acceptance criteria are testable (AC1-AC3/AC5/AC6 automated or direct-inspection; AC4's on-schedule firing GitHub-native, RISK-ACCEPTed with manual post-merge verification)
- [x] Test plan exists and maps every AC to at least one test
- [x] DoR contract scope verified against the test plan's own required touchpoints -- no conflict
- [x] The one related existing test file confirmed unaffected by direct reading, not assumption
- [x] Risk rated, RISK-ACCEPT logged for the one untestable-locally AC
- [x] No architectural decision requiring a `decisions.md` entry beyond the one RISK-ACCEPT already logged

## Proceed: Yes

## Notes

This story is the second of two stories scoped directly from the same performance deep-dive (2026-09-04) that produced `cpco-s1`. Deliberately kept separate from `cpco-s1` since it is a different root cause (correctness/data-hygiene risk from a cold-start-induced silent cleanup failure, not install-time inefficiency) with its own distinct regression surface (`scripts/purge-e2e-tenants.js` and a new scheduled workflow, versus `cpco-s1`'s five existing CI workflow files). The DoR contract's own careful reading of the existing job-step `timeout-minutes: 2` (a detail not obvious from the story's own problem statement alone) directly shaped AC2's chosen default (90000ms, not 120000ms) -- confirming CLAUDE.md's own "verify assumptions before sign-off" practice caught a real timing-conflict risk before implementation, not after.
