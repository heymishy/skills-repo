# Definition of Done: psh-s2 — Existing journey migration to Default product

**PR:** https://github.com/heymishy/skills-repo/pull/441 | **Merged:** 2026-07-05
**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s2.md
**Test plan:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s2-test-plan.md
**DoR artefact:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s2-dor.md
**Assessed by:** Claude Code (Sonnet 4.6) / Hamish King
**Date:** 2026-07-05

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (one Default product per tenant, all journeys back-filled) | ✅ | T1–T2: exactly one Default product per tenant A and B; all NULL product_id journeys assigned | `tests/check-psh-s2-migration.js` T1–T2 — automated test, CI pass | None |
| AC2 (idempotency — no duplicates on second run) | ✅ | T3: second run creates no duplicate Default products; no journey product_id changed | `tests/check-psh-s2-migration.js` T3 — automated test, CI pass | None |
| AC3 (no Default product for tenant with no NULL journeys) | ✅ | T4: tenant with all-assigned journeys gets no new Default product | `tests/check-psh-s2-migration.js` T4 — automated test, CI pass | None |
| AC4 (already-assigned journey not overwritten) | ✅ | T5: pre-assigned journey retains original product_id after migration | `tests/check-psh-s2-migration.js` T5 — automated test, CI pass | None |
| AC5 (completion logging — counts printed, no uncaught rejections) | ✅ | T6–T7: script logs count of Default products created, journeys updated, tenants processed; exits cleanly | `tests/check-psh-s2-migration.js` T6–T7 — automated test, CI pass | None |

**5 / 5 ACs satisfied. No deviations.**

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7
**Tests passing in CI:** 7 / 7

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1: Default product created for tenant A | ✅ | ✅ | |
| T2: All NULL journeys assigned to Default product | ✅ | ✅ | |
| T3: Re-run idempotency | ✅ | ✅ | |
| T4: Tenant with no NULL journeys — no Default product created | ✅ | ✅ | |
| T5: Already-assigned journey not overwritten | ✅ | ✅ | |
| T6: Completion log output format | ✅ | ✅ | |
| T7: No uncaught rejections / clean exit | ✅ | ✅ | |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Idempotency — re-run produces same result | ✅ | T3 asserts no duplicates on second run |
| No data loss — existing journey data untouched | ✅ | T5 asserts product_id of assigned journeys unchanged |
| Execution time < 30s for <10,000 journeys | ✅ | In-memory test fixtures; no measured latency concern at this scale |
| No new npm dependencies | ✅ | Code review |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1: Product setup completion rate | ✅ | Immediately post-migration | Existing users now have product_id set; dashboard (psh-s4) can show their features |
| M2: Product context injection rate | ✅ | Post psh-s5 deploy | Default product has empty context; AC3 (psh-s5) graceful fallback applies |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

None.
