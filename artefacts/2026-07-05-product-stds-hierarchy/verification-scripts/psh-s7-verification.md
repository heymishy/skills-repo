# AC Verification Script: psh-s7 — Org-level kanban with product grouping and filter

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s7.md
**Test plan reference:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s7-test-plan.md
**Date:** 2026-07-05

---

## Setup

```
node tests/check-psh-s7-org-kanban.js   ← unit/integration
npm run test:e2e -- tests/e2e/psh-s7-org-kanban.spec.js   ← layout
```

Navigate to the org-level kanban (top-level board view, not a single product's board).

---

## Scenario 1 — All products and features visible with grouping (AC1)

1. Open the org kanban ("All products" selected).

**Expected:** Features from all your products appear, grouped by product name. Within each product group, features are arranged by their pipeline stage. Each product group is clearly labelled.

**Broken behaviour:** Features from only one product shown, grouping absent, or features from other tenants visible.

---

## Scenario 2 — Product filter shows one product only (AC2)

1. Click the product filter dropdown. Select one specific product (e.g. "Product Alpha").

**Expected:** Only features from "Product Alpha" are shown. Other products' features disappear. The "Product Alpha" group header remains visible.

**Broken behaviour:** Other products' features still visible after filtering.

---

## Scenario 3 — "All products" resets the filter (AC3)

1. With a product filter active, select "All products" from the dropdown.

**Expected:** All product groups and all features reappear.

**Broken behaviour:** Some products remain filtered out after selecting "All products".

---

## Scenario 4 — Clicking a feature card navigates to its active stage (AC4)

1. Click any feature card on the org kanban.

**Expected:** You are taken to that feature's current pipeline stage view (e.g. if it's in Review, you land on the Review page for that feature).

**Broken behaviour:** Navigation goes to the wrong stage, a 404, or the feature's home page rather than the active stage.

---

## Scenario 5 — PostHog event fires on org kanban view (AC5)

1. Open the org kanban. Check PostHog Live Events.

**Expected:** A `kanban_viewed` event with:
- `view: "org"`
- `tenantId`
- `productCount`: number of products shown
- `featureCount`: total features shown

**Broken behaviour:** No event, or `view = "product"` instead of `"org"`.

---

## Scenario 6 — 🔴 CSS layout: product groups visible without horizontal scroll (AC6)

> Visual verification required.

1. Open the org kanban in a browser window approximately 1280 pixels wide.

**Expected:** Product group headers and stage columns are visible without horizontal scrolling. Each product group is visually distinct.

**Broken behaviour:** Product groups overflow the viewport, the page requires horizontal scrolling, or the product labels are cut off.
