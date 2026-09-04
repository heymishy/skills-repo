# Decisions: Dockerfile production stage actually copies artefacts/ and .github/ into the image

---

## RISK-ACCEPT: AC5 (real production fix confirmation) cannot be verified by a local automated test

**Date:** 2026-09-05
**Context:** No `docker build`/`docker run` execution is available in this local test environment -- the same documented gap `daga-s1`'s own test plan already named. Whether this fix actually resolves the empty-artefact-page bug can only be confirmed by a real production deploy and a real authenticated page load.
**Decision:** AC1-AC4 (the Dockerfile's own text shape) are covered by automated tests. AC5 (does the live page actually show real content afterward) is confirmed via a mandatory manual re-check after merge and promotion, using the exact authenticated procedure already validated once today -- not a new or unproven method.
**Rationale:** This is the second time in two consecutive stories (`daga-s1`, now `dcfx-s1`) that a real live-page check is the only thing that can actually prove the fix works. `daga-s1`'s own DoD explicitly named this as its most important follow-up action and it was not acted on with enough rigor before that DoD was marked COMPLETE -- this decision entry exists specifically so that mistake is not repeated: T6 in this story's own test plan is treated as mandatory, not optional, and the coding-agent instructions say so explicitly.
