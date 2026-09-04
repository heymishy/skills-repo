# Decisions: promote-to-prod writes the real version stamp before deploying

---

## RISK-ACCEPT: AC6 (real production /version confirmation) cannot be verified by a local automated test

**Date:** 2026-09-05
**Context:** No real Fly deploy is available in this local test environment -- whether `GET /version` actually returns real data after the next production promotion can only be confirmed by a real deploy.
**Decision:** AC1-AC5 (the workflow's own text shape) are covered by automated tests. AC6 (does the live endpoint actually show real data afterward) is confirmed via a mandatory manual re-check after the next real promotion.
**Rationale:** Matches the same precedent already established this session (`sdsb-s1`, `cpco-s1`, `stcs-s1`, `ncdv-s1`, `dcfx-s1`) for GitHub-native or deploy-dependent behaviour that cannot be simulated locally.
