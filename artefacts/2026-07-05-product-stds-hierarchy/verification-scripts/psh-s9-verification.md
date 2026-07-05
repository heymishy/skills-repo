# AC Verification Script: psh-s9 — Org-level standard promotion and per-product opt-out

**Story reference:** artefacts/2026-07-05-product-stds-hierarchy/stories/psh-s9.md
**Test plan reference:** artefacts/2026-07-05-product-stds-hierarchy/test-plans/psh-s9-test-plan.md
**Date:** 2026-07-05

---

## Setup

```
node tests/check-psh-s9-standard-promotion.js
```

Start the server and log in. You need at least one product with a standard defined (psh-s8 complete).

---

## Scenario 1 — Promote a standard to org-level (AC1, AC2)

1. Open a product's standards list. Find a standard with "Product" badge.
2. Click "Promote to org" (or equivalent).

**Expected:** The badge changes from "Product" to "Org". When you open a different product's standards list (same org/tenant), the promoted standard appears there with the "Org" badge — you didn't have to create it again.

**Broken behaviour:** Standard doesn't change badge, or doesn't appear in other products' lists.

---

## Scenario 2 — Opt out of an org standard on one product (AC3)

1. On Product B's standards list, find an org-level standard.
2. Click "Opt out" (or equivalent).

**Expected:** The org standard disappears from Product B's active standards list. It still appears in other products' lists with the "Org" badge.

**Broken behaviour:** Standard still appears in Product B after opting out, or disappears from all products.

---

## Scenario 3 — Reverse the opt-out (AC4)

1. After opting out (Scenario 2), find the opt-out setting for that standard on Product B.
2. Click "Opt back in" or "Remove opt-out".

**Expected:** The org standard reappears in Product B's active standards list.

**Broken behaviour:** Standard stays excluded even after removing the opt-out.

---

## Scenario 4 — Setting visibility=public is blocked (AC5)

Using a REST client, attempt to set `visibility = "public"` directly:

```bash
curl -X PUT http://localhost:3000/standards/STD_ID \
  -H "Cookie: <session>" \
  -d '{"visibility": "public"}'
```

**Expected:** HTTP 400 with body containing `"reason": "public_visibility_not_available"`. The standard's visibility is unchanged.

**Broken behaviour:** HTTP 200, or visibility is set to "public" in the database.
