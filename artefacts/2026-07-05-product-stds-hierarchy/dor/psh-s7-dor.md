# Definition of Ready — psh-s7: Org-level kanban with product grouping and filter

**Feature:** 2026-07-05-product-stds-hierarchy
**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s7.md
**Review:** PASS — Run 1, 2026-07-05 (1 LOW)
**Test plan:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s7-test-plan.md — 8 tests
**Verification script:** artefacts/2026-07-05-product-stds-hierarchy/verification-scripts/psh-s7-verification.md
**Date:** 2026-07-05

---

## Hard Block Results

| Block | Result | Note |
|-------|--------|------|
| H1 | ✅ PASS | |
| H2 | ✅ PASS | AC1–AC5 in Given/When/Then; AC6 is CSS-layout classification |
| H3 | ✅ PASS | 8 tests: AC1–AC5 integration + AC6 E2E Playwright |
| H4 | ✅ PASS | |
| H5 | ✅ PASS | M3a (render correctness) + M3b (weekly view rate) |
| H6 | ✅ PASS | Rating 2, Stable |
| H7 | ✅ PASS | 0 HIGH |
| H8 | ✅ PASS | |
| H8-ext | ✅ PASS | Upstream psh-s6; schemaDepends: [] |
| H9 | ✅ PASS | ADR-018, MC-A11Y-01/02, MC-SEC-01, Node.js CommonJS |
| H-E2E | ✅ PASS | AC6 typed CSS-layout-dependent; Playwright installed; spec `tests/e2e/psh-s7-org-kanban.spec.js` named in contract and test plan |
| H-NFR | ✅ PASS | |
| H-NFR2 | ✅ PASS | |
| H-NFR3 | ✅ PASS | Internal |
| H-NFR-profile | ✅ PASS | |
| H-GOV | ✅ PASS | Hamish King — Platform operator / product owner |
| H-ADAPTER | ✅ PASS | No adapters |
| H-INF | ✅ N/A | |
| H-MIG | ✅ N/A | |

**Result: 19/19 PASS**

**ADR-018-playwright-e2e guardrail: RESOLVED → `status: "met"` — Playwright E2E spec named for AC6**

---

## Warnings

All clear.

---

## Oversight Level

**Medium** (psh-e4). Self-confirmed on solo project.

---

## ✅ Definition of ready: PROCEED — psh-s7

Hard blocks: 19/19 | Warnings: 0 | Oversight: Medium

---

## Coding Agent Instructions

**Story:** psh-s7 — Org-level kanban with product grouping and filter
**Contract:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s7-dor-contract.md
**Test files:** `tests/check-psh-s7-org-kanban.js` + `tests/e2e/psh-s7-org-kanban.spec.js`
**Verification:** `node tests/check-psh-s7-org-kanban.js` + `npx playwright test tests/e2e/psh-s7-org-kanban.spec.js`

### Acceptance Criteria to implement

- AC1: All features across all products, product-grouped with stage columns
- AC2: Product filter hides other products
- AC3: Filter reset restores all products
- AC4: Feature card navigates to feature's active stage
- AC5: PostHog `kanban_viewed` with view='org', productCount, featureCount
- AC6: CSS column/group layout — Playwright E2E screenshot comparison

### Implementation task order

1. Write failing integration tests `tests/check-psh-s7-org-kanban.js` (5 integration tests)
2. Extend `GET /kanban` (or create new route) for org-level aggregated view
3. Create org-kanban view template — product group headers, stage columns, filter dropdown
4. Filter: keyboard-accessible dropdown controlling product group visibility
5. Feature card navigation — link to active stage
6. PostHog event emission
7. Write Playwright E2E spec `tests/e2e/psh-s7-org-kanban.spec.js`
8. Run all tests

### Architecture guardrails (enforced)

- MC-A11Y-01: Product filter dropdown keyboard-accessible
- MC-A11Y-02: Health indicators use icon/text alongside colour
- MC-SEC-01: Product and feature names HTML-escaped
- `req.session.tenantId` is sole scope — no cross-tenant data
- No new npm dependencies

### Performance NFR

Org kanban renders in < 3 seconds for tenants with ≤ 10 products and ≤ 100 features total.
