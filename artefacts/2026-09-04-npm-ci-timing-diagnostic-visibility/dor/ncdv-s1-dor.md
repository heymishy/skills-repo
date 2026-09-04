# Definition of Ready: Stream npm lifecycle-script output in the two slow staging-deploy.yml jobs

**Story:** artefacts/2026-09-04-npm-ci-timing-diagnostic-visibility/stories/ncdv-s1-stream-npm-lifecycle-script-output-in-slow-jobs.md
**Test plan:** artefacts/2026-09-04-npm-ci-timing-diagnostic-visibility/test-plans/ncdv-s1-test-plan.md
**Contract:** artefacts/2026-09-04-npm-ci-timing-diagnostic-visibility/dor/ncdv-s1-dor-contract.md
**Date:** 2026-09-04
**Track:** Short-track (test-plan -> DoR -> coding agent; discovery through review skipped per CLAUDE.md)

---

## Checklist

- [x] Acceptance criteria are testable (AC1-AC3 automated; AC4 real-world recurrence-dependent, RISK-ACCEPTed)
- [x] Test plan exists and maps every AC to at least one test
- [x] DoR contract scope verified against the test plan's own required touchpoints -- no conflict
- [x] The one related regression risk (`cpco-s1`'s own regex) directly checked, confirmed tolerant of the added flag, not assumed
- [x] Risk rated (1, lowest of this session), RISK-ACCEPT logged for the one untestable-locally AC
- [x] No architectural decision requiring a `decisions.md` entry beyond the one RISK-ACCEPT already logged

## Proceed: Yes

## Notes

Deliberately scoped as diagnostic-visibility only, per the operator's own explicit choice ("get real diagnostic data first") after a direct local check (`node_modules/bcrypt/prebuilds/linux-x64/bcrypt.glibc.node` already present) put the earlier bcrypt-compilation hypothesis in genuine tension rather than confirming it. This story does not attempt a fix -- it exists solely to make the next real occurrence of the slow pattern legible, since today's own logs could not distinguish "cold start," "bcrypt compiling," "registry throttling," or anything else.
