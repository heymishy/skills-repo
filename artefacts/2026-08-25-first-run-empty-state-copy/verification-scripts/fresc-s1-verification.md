# AC Verification Script: fresc-s1 — Add orientation copy to two first-run empty states, and gate the Modules card on feature count

**Story reference:** `artefacts/2026-08-25-first-run-empty-state-copy/stories/fresc-s1-product-and-modules-clarity-copy.md`
**Technical test plan:** `artefacts/2026-08-25-first-run-empty-state-copy/test-plans/fresc-s1-test-plan.md`
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Sign in to the app (staging or production) with an account of your own, or use a fresh test account for Scenario 3.
2. For Scenario 1 and 2 you'll need one product with 0 or 1 features and one product with 2 or more features — create a throwaway product and add/remove features as needed, or pick two existing products that already differ in feature count.
3. For Scenario 3 you'll need an account with zero products (a brand-new account, or the staging E2E auth-stub if you're a developer with access to it).

**Reset between scenarios:** No shared state — each scenario uses an independent product or account.

---

## Scenarios

---

### Scenario 1: Modules section is hidden on a product with 0 or 1 features

**Covers:** AC1

**Steps:**
1. Open a product's detail page that has zero features (a brand-new product), or exactly one feature.
2. Look at the area below the product's sync/repo status and above the features list.

**Expected outcome:**
> No "Modules" card, module list, or "Add module" button appears anywhere on the page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Modules section appears, with an explanation, once a product has more than one feature

**Covers:** AC2, AC4

**Steps:**
1. Open a product's detail page that has 2 or more features.
2. Look for the "Modules" card.
3. Read the text directly under the "Modules" heading.
4. Type a name into the "New module name" field and click "Add module".
5. Rename the module you just created, then delete it.

**Expected outcome:**
> A "Modules" card is visible, with a short line of text explaining what modules are for (something like "Group related features together for easier organization"). Creating, renaming, and deleting a module all work exactly as before — no errors, the module list updates correctly each time.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A brand-new, zero-product account sees an explanation of what a "product" is

**Covers:** AC3

**Steps:**
1. Sign in with an account that has zero products.
2. Go to the main dashboard (products list view).
3. Read the empty-state message.
4. Switch to the board view (the "Board" toggle, or `/dashboard?view=board`) and read its empty-state message too.

**Expected outcome:**
> Both the list view and the board view show "No products yet", a short explanatory line describing what a product is (something like "A product is a connected GitHub repo — its epics, features, and journeys all live under it here"), and a "Create your first product →" button. The wording should match on both screens.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Existing behaviour for tenants with products is unaffected

**Covers:** AC4 (non-regression)

**Steps:**
1. Open the products list view for an account that already has at least one product.
2. Confirm the "No products yet" message and its explanation do NOT appear.
3. Open a product with 2+ features whose Modules card you did not touch in Scenario 2. Confirm its existing modules (if any) still list correctly.

**Expected outcome:**
> The empty-state message and explanation are never shown when products already exist. Existing modules on unrelated products display exactly as they did before this change.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
