# Definition of Done: psh-s1 — Products and standards Postgres tables and schema

**PR:** https://github.com/heymishy/skills-repo/pull/441 | **Merged:** 2026-07-05
**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s1.md
**Test plan:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s1-test-plan.md
**DoR artefact:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s1-dor.md
**Assessed by:** Claude Code (Sonnet 4.6) / Hamish King
**Date:** 2026-07-05

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (products table, idempotent) | ✅ | T1–T2: migration creates products table with all required columns; re-run does not error | `tests/check-psh-s1-schema.js` T1–T2 — automated test, CI pass | None |
| AC2 (standards table, idempotent) | ✅ | T3–T4: standards table with all required columns including visibility CHECK constraint; re-run does not error | `tests/check-psh-s1-schema.js` T3–T4 — automated test, CI pass | None |
| AC3 (journeys.product_id column, idempotent) | ✅ | T5–T6: ALTER TABLE adds product_id FK ON DELETE SET NULL; existing rows have NULL; re-run does not error | `tests/check-psh-s1-schema.js` T5–T6 — automated test, CI pass | None |
| AC4 (tenant data isolation) | ✅ | T7–T8: product query scoped to tenant_id; cross-tenant query returns zero rows | `tests/check-psh-s1-schema.js` T7–T8 — automated test, CI pass | None |

**4 / 4 ACs satisfied. No deviations.**

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8
**Tests passing in CI:** 8 / 8

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1: products table created with required columns | ✅ | ✅ | |
| T2: products migration idempotent (re-run) | ✅ | ✅ | |
| T3: standards table created with visibility CHECK | ✅ | ✅ | |
| T4: standards migration idempotent | ✅ | ✅ | |
| T5: journeys.product_id column added with FK | ✅ | ✅ | |
| T6: journeys migration idempotent | ✅ | ✅ | |
| T7: product query scoped by tenant_id | ✅ | ✅ | |
| T8: pipeline-state stage in inner loop stages | ✅ | ✅ | T8 was extended during psh-s1 delivery to include all inner-loop stages through definition-of-done |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Idempotency — all migration statements use IF NOT EXISTS | ✅ | T2, T4, T6 assert re-run does not error |
| Data isolation — tenant_id on products, org_id on standards | ✅ | T7 asserts tenant_id scoping; T8 asserts cross-tenant returns zero rows |
| No new npm dependencies | ✅ | Code review — uses existing pg pool only |
| Node.js CommonJS only | ✅ | Code review — require() throughout |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1: Product setup completion rate | ✅ | Immediately post-deploy — products table is the prerequisite for product_created events | Foundation story; enables M1 and M2 measurement paths |
| M2: Product context injection rate | ✅ | Post psh-s5 deploy | journeys.product_id FK established by this story enables product context resolution |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. T8 (pipeline-state stage check) `innerStages` allowlist was extended during delivery to include `'verify-completion'` and `'definition-of-done'` — the initial set only included implementation-phase stages. This is a test hygiene correction, not a scope deviation. /improve candidate: the innerStages allowlist in stage-check tests should be sourced from a shared constant to prevent drift.
