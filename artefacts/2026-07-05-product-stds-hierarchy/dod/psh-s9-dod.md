# Definition of Done: psh-s9 — Org-level standard promotion and per-product opt-out

**PR:** https://github.com/heymishy/skills-repo/pull/441 | **Merged:** 2026-07-05
**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s9.md
**Test plan:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s9-test-plan.md
**DoR artefact:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s9-dor.md
**Assessed by:** Claude Code (Sonnet 4.6) / Hamish King
**Date:** 2026-07-05

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (promotion — visibility updated product→org, HTTP 200) | ✅ | T1: PUT promotes standard; visibility changes to 'org'; HTTP 200 | `tests/check-psh-s9-promotion-optout.js` T1 — automated test, CI pass | None |
| AC2 (org standard visible in all products with [Org] badge) | ✅ | T2: org-level standard appears in standards list for all products in tenant with [Org] badge | `tests/check-psh-s9-promotion-optout.js` T2 — automated test, CI pass | None |
| AC3 (opt-out — standard_product_optouts row inserted, standard inactive for that product) | ✅ | T3: opt-out inserts row; opted-out standard absent from product standards list and injection queries | `tests/check-psh-s9-promotion-optout.js` T3 — automated test, CI pass | None |
| AC4 (opt-out reversal — optout row deleted, standard active again) | ✅ | T4: reversal deletes optout row; standard reappears in product list | `tests/check-psh-s9-promotion-optout.js` T4 — automated test, CI pass | None |
| AC5 (public visibility guard — HTTP 400 for visibility='public') | ✅ | T5: POST/PUT with visibility='public' returns HTTP 400 with reason:public_visibility_not_available; no update | `tests/check-psh-s9-promotion-optout.js` T5 — automated test, CI pass | None |
| AC6 (standard_product_optouts table created, idempotent) | ✅ | T6: migration creates table with all required columns and UNIQUE constraint; re-run does not error | `tests/check-psh-s9-promotion-optout.js` T6 — automated test, CI pass | None |

**6 / 6 ACs satisfied. No deviations.**

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8
**Tests passing in CI:** 8 / 8

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1: Promotion to org | ✅ | ✅ | |
| T2: Org standard in all product lists | ✅ | ✅ | |
| T3: Opt-out | ✅ | ✅ | |
| T4: Opt-out reversal | ✅ | ✅ | |
| T5: Public visibility guard | ✅ | ✅ | |
| T6: standard_product_optouts migration + idempotency | ✅ | ✅ | |
| T7: Idempotent promotion (already-org standard is no-op) | ✅ | ✅ | NFR — idempotency |
| T8: Cross-tenant isolation (opt-out scoped to tenant) | ✅ | ✅ | Security NFR |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security: tenantId from req.session.tenantId only | ✅ | T8 asserts cross-tenant isolation |
| Idempotency: already-org standard promotion is no-op | ✅ | T7 asserts promoting a visibility='org' standard does not error |
| ADR-003: new migration is additive | ✅ | standard_product_optouts uses CREATE TABLE IF NOT EXISTS |
| No new npm dependencies | ✅ | Code review |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M4a: Standards library adoption rate (secondary) | ✅ | Immediately post-deploy | Org-level promotion makes each standard more valuable; M4a observation window continues |
| M4b: Standards injection rate | ✅ | Post psh-s10 deploy | Opt-out data model (AC3/AC4) is the prerequisite for correct standards injection in psh-s10 |

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

None.
