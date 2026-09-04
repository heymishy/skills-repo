# Definition of Ready: Dockerfile production stage actually copies artefacts/ and .github/ into the image

**Story:** artefacts/2026-09-05-docker-artefacts-copy-fix/stories/dcfx-s1-dockerfile-copy-artefacts-and-github.md
**Test plan:** artefacts/2026-09-05-docker-artefacts-copy-fix/test-plans/dcfx-s1-test-plan.md
**Contract:** artefacts/2026-09-05-docker-artefacts-copy-fix/dor/dcfx-s1-dor-contract.md
**Date:** 2026-09-05
**Track:** Short-track (test-plan -> DoR -> coding agent; discovery through review skipped per CLAUDE.md)

---

## Checklist

- [x] Acceptance criteria are testable (AC1-AC4 automated; AC5 real-deploy-dependent, RISK-ACCEPTed with mandatory post-merge live re-check)
- [x] Test plan exists and maps every AC to at least one test
- [x] DoR contract scope verified against the test plan's own required touchpoints -- no conflict
- [x] The one related existing test file confirmed to have zero collision risk, by direct reading not assumption
- [x] Risk rated, RISK-ACCEPT logged for the one untestable-locally AC
- [x] No architectural decision requiring a `decisions.md` entry beyond the one RISK-ACCEPT already logged

## Proceed: Yes

## Notes

This story exists to correct a real gap in a previously-merged, DoD-marked-COMPLETE story (`daga-s1`). Found via a live, authenticated production check performed today at the operator's own request, following through on `daga-s1`'s own DoD follow-up action #2 ("a REAL live-page check is the recommended confirmation... given the whole point of this story is a gap those same automated tests could not detect") -- which turned out to be exactly the right call: the automated tests all passed, the DoD was marked COMPLETE, and the feature still did not work in production, for a reason (Dockerfile COPY gap) that no automated test in either story's own test plan could have caught, since neither test plan included a real Docker build. This DoR's own T6 is written to actually close that gap this time, not defer it again.
