# AC Verification Script: psh-s4 — Product-aware dashboard and navigation

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s4.md
**Test plan reference:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s4-test-plan.md
**Date:** 2026-07-05

---

## Setup

Start the server and log in. Navigate to the main dashboard (home page after login).

---

## Scenario 1 — Dashboard shows product cards with feature counts (AC1)

1. Log in to an account that has at least one product with features.
2. Look at the dashboard.

**Expected:** You see product cards, each showing: the product name, the number of features in it (e.g. "3 features"), and the date of the most recently updated feature (e.g. "Last updated: 2 days ago" or similar).

**Broken behaviour:** Products are missing, feature count shows "0" for products with features, or the old flat feature list appears instead of product cards.

---

## Scenario 2 — Clicking a product card shows its features (AC2)

1. Click a product card on the dashboard.

**Expected:** You are taken to that product's view, showing a list of its features. Each feature shows its current pipeline stage (e.g. "Definition", "Review") and its health status (e.g. "Green", "Blocked").

**Broken behaviour:** Features from other products appear, or stage/health are missing.

---

## Scenario 3 — Creating a new feature from the product view sets product_id (AC3)

1. From a product's view, click "New feature".

**Expected:** A new feature is created and you are taken to the Discovery stage for it. Back on the product's dashboard, the new feature appears in that product's feature list. Check PostHog Live Events — a `journey_created` event should appear with `productId` set to this product's ID.

**Broken behaviour:** New feature appears in the wrong product's list, or no `journey_created` event in PostHog, or `productId` is missing from the event.

---

## Scenario 4 — New account sees "Create your first product" (AC4)

1. Log in to a brand-new account (no products, no previous features).
2. Navigate to the dashboard.

**Expected:** Instead of an empty features list, you see a clear call-to-action: "Create your first product" (or similar wording). No empty product list is shown.

**Broken behaviour:** Empty product list displayed, or old flat feature list shown with no product context.

---

## Scenario 5 — Feature count stays accurate (AC5)

1. Note the feature count on a product card (e.g. "4 features").
2. Open that product and advance one of its features to a new pipeline stage.
3. Go back to the dashboard (full page reload).

**Expected:** The product card now shows the updated feature count if a feature was removed, or the same count if only the stage changed. The count is not stale — it reflects the live DB state.

**Broken behaviour:** Feature count still shows the old number after a change.
