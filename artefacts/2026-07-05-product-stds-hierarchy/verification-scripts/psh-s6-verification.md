# AC Verification Script: psh-s6 — Per-product kanban board

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s6.md
**Test plan reference:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s6-test-plan.md
**Date:** 2026-07-05

---

## Setup

```
node tests/check-psh-s6-product-kanban.js   ← unit/integration
npm run test:e2e -- tests/e2e/psh-s6-product-kanban.spec.js   ← layout
```

Start the server and log in. Navigate to a product that has features across multiple pipeline stages.

---

## Scenario 1 — 8 stage columns all visible (AC1)

1. Open a product's kanban view.

**Expected:** You see 8 columns across the board, labelled:
Discovery · Benefit Metric · Definition · Review · Test Plan · Definition of Ready · Implementation · Definition of Done

Each feature appears under its current stage. Features from other products are not shown.

**Broken behaviour:** Fewer than 8 columns, features in wrong columns, or features from other products mixed in.

---

## Scenario 2 — Stage update moves a feature (AC2)

1. Note which column a feature is in (e.g. "Review").
2. Advance the feature to the next stage (e.g. use `/workflow` or manually advance it).
3. Refresh the kanban.

**Expected:** The feature now appears in its new stage column ("Test Plan"). It is gone from "Review".

**Broken behaviour:** Feature still shown in "Review" after advancement.

---

## Scenario 3 — Blocked feature shows icon or text, not just colour (AC3)

1. Look for a feature card that is in a "red" or "blocked" health state.

**Expected:** The card shows a visual indicator of the problem that is NOT colour alone — either a text label ("Blocked", "At Risk") or an icon (⚠, 🔴, etc.) alongside any colour treatment.

**Broken behaviour:** Only a coloured border or background is shown with no text or icon.

---

## Scenario 4 — Empty stage column stays visible (AC4)

1. Look at a stage column with no features in it (e.g. "Benefit Metric" if no features are at that stage).

**Expected:** The column is still visible with an empty-state message like "No features at this stage". The column is not hidden or removed from the board.

**Broken behaviour:** Column disappears when empty, or no empty-state message appears.

---

## Scenario 5 — PostHog event fires on kanban view (AC5)

1. Open the product kanban. Check PostHog Live Events.

**Expected:** A `kanban_viewed` event appears with:
- `view: "product"`
- `productId`: the current product's ID
- `tenantId`: your tenant's ID
- `featureCount`: the number of features shown on the board

**Broken behaviour:** No `kanban_viewed` event, or `view` is missing/wrong.

---

## Scenario 6 — 🔴 CSS layout: 8 columns fit without horizontal scrolling (AC6)

> This scenario requires visual verification in a browser.

1. Open the product kanban in a browser window approximately 1280 pixels wide.
2. Do NOT scroll horizontally.

**Expected:** All 8 stage column headers are visible. The page does not require horizontal scrolling to see all columns. If the browser window is narrowed, columns may stack or scroll within a contained area — but the page body itself does not scroll horizontally.

**Broken behaviour:** One or more columns are cut off, the page requires horizontal scrolling to see all columns, or the layout breaks at common laptop screen widths.
