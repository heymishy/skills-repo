## Test Plan: Fix the Standards tab's missing sidebar nav and duplicate breadcrumb

**Story reference:** artefacts/2026-08-11-standards-tab-nav-and-breadcrumb-fix/stories/rapp-s2-standards-tab-nav-and-breadcrumb.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-11

---

## AC Coverage

| AC | Description | Unit | Gap type | Risk |
|----|-------------|------|----------|------|
| AC1 | products-nav section renders real product names | 1 test | — | 🟢 |
| AC2 | "See all products" link points at /dashboard | 1 test | — | 🟢 |
| AC3 | zero-products state renders real empty state, no fabrication | 1 test | — | 🟢 |
| AC4 | current product marked active in sidebar (activeProductId wired) | 1 test | — | 🟢 |
| AC5 | exactly one breadcrumb bar, duplicate manual link gone | 1 test | — | 🟢 |
| AC6 | Standards H1 heading still present | 1 test | — | 🟢 |
| AC7 | JSON API branch unaffected (regression guard) | 1 test | — | 🟢 |

---

## Coverage gaps

None blocking. This is a server-rendered-HTML wiring fix (no new client-side interactivity), so unit-level assertions against the real, unmodified `handleGetProductStandardsTab` handler fully cover the fix's behavior. A brief live-Chrome confirmation on staging after deploy is still planned, matching this session's established convention of live-verifying UI fixes beyond what unit tests can prove.

---

## Test Data Strategy

**Source:** Direct mock-pool session construction against the real, unmodified `handleGetProductStandardsTab` handler — matches `check-jcn-s1-journey-page-nav-products.js`'s own established convention for products-nav wiring tests (same mock-pool query-shape matching for `getProductsNavSummary`'s three underlying queries).
**PCI/sensitivity in scope:** No.
**Availability:** Available now — no real staging or credits dependency.
**Owner:** Self-contained.

---

## Unit Tests

### check-rapp-s2-standards-tab-nav-and-breadcrumb.js

- **Verifies:** AC1–AC7
- **Scenario:** Seven tests directly rendering the Standards tab via `handleGetProductStandardsTab` with varying nav-product-list, current-product, and zero-products state, asserting the exact server-rendered HTML markers each fix is responsible for (products-nav content, See-all-products link, breadcrumb count, H1 presence, JSON branch parity).
- **Tooling:** Node, no external dependencies — matches every other `check-*.js` file's convention in this repo.

## Regression Tests

- `check-smug-s1-standards-tab-and-query-fix.js` — the Standards tab's own existing suite (promote/opt-out list rendering, JSON API semantics), re-run unmodified: 6/6 passing.
- `check-jcn-s1-journey-page-nav-products.js` — the products-nav wiring pattern this story mirrors, re-run unmodified to confirm no drift in the shared `getProductsNavSummary` helper: 5/5 passing.
- Broader `products.js`-touching suite spot-checked for drift: `check-pan-s1-product-aware-navigation.js`, `check-psh-s4-navigation.js`, `check-psh-s6-product-kanban.js`, `check-psh-s7-org-kanban.js`, `check-prc-s4.1-edit-product.js`, `check-prc-s4.2-delete-product.js`.

---

## Out of Scope for This Test Plan

- A real-staging Playwright variant — live Chrome-driven confirmation on staging is planned as part of this story's own completion, not a new automated spec, per the story's own Out of Scope section.
- Coverage for `_renderRoadmapTab`'s identical duplicate-breadcrumb pattern — out of scope for this story per its own Out of Scope section; not tested here.

---

## Test Gaps and Risks

None identified as blocking.
