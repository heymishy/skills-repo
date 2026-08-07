## Definition of Ready: Register product-feature journeys in the shared in-memory store

**Story reference:** `artefacts/2026-07-22-journey-registration-fix/stories/jrf-s2-register-product-feature-journeys.md`
**Test plan reference:** `artefacts/2026-07-22-journey-registration-fix/test-plans/jrf-s2-test-plan.md`
**Assessed by:** Claude (agent)
**Date:** 2026-07-22

---

**CONTRACT REVIEW:** Contract Proposal reviewed against all 5 ACs and the test plan. No mismatches found. ✅ Contract review passed.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | "an operator (or any user) who clicks 'New feature' from a product page" |
| H2 | At least 3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has at least one test | ✅ | AC1-AC5 covered (IT1-IT5, U1) |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | Data-integrity/correctness — journeys usable end-to-end |
| H6 | Complexity rated | ✅ | Rating 1 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS, Run 1, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None declared — modifies existing, already-merged code directly |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 3 constraints, reusing an already-proven pattern |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | Pure server-side logic |
| H-NFR | NFR profile / story NFR field | ✅ | Story's own NFR section populated |
| H-ADAPTER | N/A | ✅ N/A | No new adapter — extends an existing one's SQL |

**All hard blocks pass.** H-MIG/H-INF: N/A — no schema change (`product_id` column already exists).

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Register product-feature journeys in the shared in-memory store — artefacts/2026-07-22-journey-registration-fix/stories/jrf-s2-register-product-feature-journeys.md
Test plan: artefacts/2026-07-22-journey-registration-fix/test-plans/jrf-s2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope beyond the ACs.

Constraints:
- Rewrite handlePostProductFeature to call _journeyStore.createJourney()
  FIRST (letting it generate journeyId), derive featureSlug from THAT id,
  then call _journeyStore.setJourneyFields(journeyId, {featureSlug,
  ownerId, tenantId, productId}) -- mirroring handlePostJourney's already-
  correct pattern exactly. Remove the raw direct SQL INSERT entirely.
- Extend journey-store-pg.js's saveJourney() SQL to write journey.productId
  into the real product_id column (INSERT list + ON CONFLICT DO UPDATE SET),
  defaulting to null for any existing caller that never sets it.
- New tests must import and call the REAL exported handlePostProductFeature
  from routes/products.js -- do NOT hand-copy its logic into the test file
  (this is exactly the mistake jrf-s1's own test file made, which is why
  this bug went uncaught).
- Read .github/architecture-guardrails.md before implementing.
- Open a draft PR when tests pass -- do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only (solo-operator context)
**Signed off by:** Hamish King (Founder/Operator) — the operator's own live bug report is the direct trigger and confirmation of scope for this story
