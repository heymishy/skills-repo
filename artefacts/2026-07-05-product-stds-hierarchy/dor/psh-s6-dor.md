# Definition of Ready — psh-s6: Per-product kanban board

**Feature:** 2026-07-05-product-stds-hierarchy
**Story:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s6.md
**Review:** PASS — Run 1, 2026-07-05 (1 LOW)
**Test plan:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s6-test-plan.md — 8 tests
**Verification script:** artefacts/2026-07-05-product-stds-hierarchy/verification-scripts/psh-s6-verification.md
**Date:** 2026-07-05

---

## Hard Block Results

| Block | Result | Note |
|-------|--------|------|
| H1 | ✅ PASS | |
| H2 | ✅ PASS | AC1–AC5 in Given/When/Then; AC6 is CSS-layout-dependent classification (not a testable AC) |
| H3 | ✅ PASS | 8 tests: AC1–AC5 integration + AC6 E2E Playwright |
| H4 | ✅ PASS | |
| H5 | ✅ PASS | M3a (render correctness) + M3b (weekly view rate) |
| H6 | ✅ PASS | Rating 2, Stable |
| H7 | ✅ PASS | 0 HIGH |
| H8 | ✅ PASS | |
| H8-ext | ✅ PASS | Upstream psh-s1, psh-s4; schemaDepends: [] |
| H9 | ✅ PASS | ADR-018, MC-A11Y-01/02, MC-SEC-01, ADR-003, Node.js CommonJS |
| H-E2E | ✅ PASS | AC6 typed CSS-layout-dependent; Playwright installed (@playwright/test devDependency); E2E spec `tests/e2e/psh-s6-product-kanban.spec.js` named in contract and test plan |
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

## ✅ Definition of ready: PROCEED — psh-s6

Hard blocks: 19/19 | Warnings: 0 | Oversight: Medium

---

## Coding Agent Instructions

**Story:** psh-s6 — Per-product kanban board
**Contract:** artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s6-dor-contract.md
**Test files:** `tests/check-psh-s6-product-kanban.js` + `tests/e2e/psh-s6-product-kanban.spec.js`
**Verification:** `node tests/check-psh-s6-product-kanban.js` + `npx playwright test tests/e2e/psh-s6-product-kanban.spec.js`

### Acceptance Criteria to implement

- AC1: Features shown in correct stage columns (8 columns always visible)
- AC2: Stage accuracy on kanban refresh
- AC3: Health indicator — icon/text label alongside colour (never colour-only)
- AC4: Empty stage column visible with empty-state label
- AC5: PostHog `kanban_viewed` event with view='product', productId, tenantId, featureCount
- AC6: CSS column layout — Playwright E2E screenshot comparison

### Implementation task order

1. Write failing integration tests `tests/check-psh-s6-product-kanban.js` (5 integration tests)
2. Create `GET /products/:productId/kanban` route
3. Create kanban view template — 8 stage columns, health indicator with icon/text, HTML-escaped names
4. Add PostHog event emission
5. Write Playwright E2E spec `tests/e2e/psh-s6-product-kanban.spec.js`
6. Run all tests

### Architecture guardrails (enforced)

- MC-A11Y-02: Health indicator MUST use icon or text label alongside colour — `health: 'red'` → ⚠ or "Blocked" text, not red background alone
- MC-A11Y-01: Kanban interactive elements keyboard-accessible (tab + Enter/Space)
- MC-SEC-01: Feature names HTML-escaped before DOM insertion
- ADR-003: If any new pipeline-state.json field is needed for kanban rendering, add to pipeline-state.schema.json in the same commit
- No new npm dependencies

### Performance NFR

Kanban renders in < 2 seconds for products with ≤ 50 features.
