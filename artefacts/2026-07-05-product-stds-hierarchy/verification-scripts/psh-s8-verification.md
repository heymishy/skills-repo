# AC Verification Script: psh-s8 — Standards definition and management per product

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s8.md
**Test plan reference:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s8-test-plan.md
**Date:** 2026-07-05

---

## Setup

```
node tests/check-psh-s8-standards-management.js
```

Start the server, log in, navigate to a product's "Standards" tab (or equivalent in the product view).

---

## Scenario 1 — Create a standard and it appears in the list (AC1, AC3)

1. On the standards page for a product, click "Add standard" (or equivalent).
2. Enter a name (e.g. "Coding Guide") and content (e.g. "Use 2-space indentation. No trailing whitespace.").
3. Click Save.

**Expected:** The standard appears in the standards list for this product. It shows the name "Coding Guide", a "Product" visibility badge, and today's date. HTTP 201 was returned (visible in network tab if needed).

**Broken behaviour:** Standard not saved, list empty after save, or wrong visibility badge.

---

## Scenario 2 — PostHog standard_created event fires (AC2)

1. After creating a standard (Scenario 1), check PostHog Live Events.

**Expected:** A `standard_created` event appears with:
- `standardId`: the new standard's ID
- `productId`: the current product's ID
- `tenantId`: your tenant ID
- `visibility: "product"`

**Broken behaviour:** No event, or `visibility` is wrong.

---

## Scenario 3 — Edit a standard updates its content (AC4)

1. Click edit on an existing standard.
2. Change the name or content and save.

**Expected:** The updated name/content appears in the list. The last-updated date is refreshed to now.

**Broken behaviour:** Edit not saved, old content persists, or updated_at not refreshed.

---

## Scenario 4 — XSS: script tag in name is safe (AC5)

1. Create a standard with the name: `<script>alert("test")</script>`

**Expected:** The name appears in the standards list as the literal text `<script>alert("test")</script>`. No alert dialog appears. The page HTML is not broken.

**Broken behaviour:** Alert dialog pops up, or the page layout breaks.

---

## Scenario 5 — Path traversal blocked (AC6)

Using a REST client, attempt to create a standard with a name that contains `../`:

```bash
curl -X POST http://localhost:3000/products/PROD_ID/standards \
  -H "Cookie: <session>" \
  -d '{"name": "../../../evil", "content": "test"}'
```

**Expected:** HTTP 400 returned. No file written outside the permitted directory.

**Broken behaviour:** HTTP 201 or a file appearing at an unexpected path.
