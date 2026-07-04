# Definition of Ready — psh-s4: Product-aware dashboard and navigation

**Feature:** 2026-07-05-product-stds-hierarchy
**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s4.md
**Review:** PASS — Run 1, 2026-07-05 (1 LOW)
**Test plan:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s4-test-plan.md — 7 tests
**Verification script:** artefacts/2026-07-05-product-stds-hierarchy/verification-scripts/psh-s4-verification.md
**Date:** 2026-07-05

---

## Hard Block Results

| Block | Result | Note |
|-------|--------|------|
| H1 | ✅ PASS | |
| H2 | ✅ PASS | 5 ACs in Given/When/Then |
| H3 | ✅ PASS | 7 tests covering AC1–AC5 |
| H4 | ✅ PASS | |
| H5 | ✅ PASS | M1 |
| H6 | ✅ PASS | Rating 2, Stable |
| H7 | ✅ PASS | 0 HIGH |
| H8 | ✅ PASS | AC5 deletion gap explicitly acknowledged in test plan gap table |
| H8-ext | ✅ PASS | Upstream psh-s1, psh-s3; schemaDepends: [] |
| H9 | ✅ PASS | ADR-024, ADR-011, MC-SEC-01, ADR-018, Node.js CommonJS |
| H-E2E | ✅ PASS | No AC typed CSS-layout-dependent in test plan; dashboard layout classified in contract with Playwright E2E spec `tests/e2e/psh-s4-dashboard-layout.spec.js` per CLAUDE.md B2 |
| H-NFR | ✅ PASS | |
| H-NFR2 | ✅ PASS | |
| H-NFR3 | ✅ PASS | Internal |
| H-NFR-profile | ✅ PASS | |
| H-GOV | ✅ PASS | Hamish King — Platform operator / product owner |
| H-ADAPTER | ✅ PASS | No adapters |
| H-INF | ✅ N/A | |
| H-MIG | ✅ N/A | |

**Result: 19/19 PASS**

---

## Warnings

All clear. 1 LOW (1-L2: AC5 deletion reference — test plan acknowledges gap explicitly).

---

## Oversight Level

**Medium** (psh-e2). Self-confirmed on solo project.

---

## ✅ Definition of ready: PROCEED — psh-s4

Hard blocks: 19/19 | Warnings: 0 | Oversight: Medium

---

## Coding Agent Instructions

**Story:** psh-s4 — Product-aware dashboard and navigation
**Contract:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s4-dor-contract.md
**Test file:** `tests/check-psh-s4-navigation.js` + `tests/e2e/psh-s4-dashboard-layout.spec.js`
**Verification:** `node tests/check-psh-s4-navigation.js` + `npx playwright test tests/e2e/psh-s4-dashboard-layout.spec.js`

### Acceptance Criteria to implement

- AC1: Dashboard product cards with name, featureCount, lastUpdated
- AC2: Product view lists features with stage and health
- AC3: New feature — journey INSERT with product_id + journey_created PostHog event
- AC4: No-products CTA for new accounts
- AC5: Feature count accurate (reads from DB each request, no cache)
- CSS layout: Playwright E2E screenshot comparison

### Implementation task order

1. Write failing unit/integration tests (7 tests)
2. Update dashboard handler — query products + journey counts for tenantId
3. Add `GET /products/:productId` handler
4. Add `POST /products/:productId/features` handler with PostHog event
5. Write Playwright E2E spec `tests/e2e/psh-s4-dashboard-layout.spec.js`
6. Run all tests

### Architecture guardrails (enforced)

- ADR-024: `GET /api/journey/:id` shape — `productId` added but `turns`, `stages`, `completedStages`, `stage`, `ownerId`, `activeSkill` must remain
- Verify with `node tests/check-wsm*.js` before PR open
- MC-SEC-01: product name HTML-escaped before DOM insertion
- `req.session.tenantId` is the sole authoritative source — never trust productId from request body for tenant scoping
- No new npm dependencies
