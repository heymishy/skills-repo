# Decisions: Fix bare-slug story-file grouping

---

## RISK-ACCEPT: W4 — AC verification script not walked through by a domain expert before DoR sign-off

**Date:** 2026-09-05
**Context:** `/definition-of-ready`'s W4 check requires the AC verification script (`bsgm-s1-verification.md`) to be reviewed by a domain expert before sign-off. It has not been walked through scenario-by-scenario in this session.
**Decision:** Proceed to DoR sign-off without a pre-code walkthrough; the script remains available for its other two designed purposes (post-merge smoke test, delivery-review script).
**Rationale:** Same solo-operator rationale as this session's other RISK-ACCEPTs of this type — the operator is also the sole domain expert, has directly reviewed the story/test-plan/DoR artefacts in this same session, and the fix itself is a single, fully-tested 1-line predicate extension with low risk.
