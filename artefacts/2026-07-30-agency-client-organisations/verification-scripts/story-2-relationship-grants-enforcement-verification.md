# AC Verification Script: Agency-Client relationships, shared-access grants, and read-only enforcement

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-2-relationship-grants-enforcement.md
**Technical test plan:** artefacts/2026-07-30-agency-client-organisations/test-plans/story-2-relationship-grants-enforcement-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have three test accounts ready: Agency A, Agency B, and a Client org that has relationships with both agencies.
2. Have at least one product/feature each agency can share.

**Reset between scenarios:** Revoke any shares you create at the end of each scenario before starting the next, so scenarios don't interfere with each other.

---

## Scenarios

---

### Scenario 1: Sharing a product with a client makes it visible to that client

**Covers:** AC1

**Steps:**
1. Sign in as Agency A.
2. Share a specific product with the Client org.
3. Sign in as a user in the Client org.
4. Look at the list of products visible to you.

**Expected outcome:**
> The product Agency A shared appears in your list.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A client working with two agencies only sees what each one specifically shared

**Covers:** AC2

**Steps:**
1. As Agency A, share Product X with the Client org.
2. As Agency B (a separate agency working with the same Client org), do NOT share anything, or share a different Product Y only through your own relationship.
3. Sign in as the Client-org user.
4. Look at the list of products visible to you.

**Expected outcome:**
> You see Product X (shared by Agency A). You do NOT see Product Y or anything else Agency B has that wasn't specifically shared with you through Agency B's own relationship.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A client can view but never edit a shared product

**Covers:** AC3

**Steps:**
1. As the Client-org user, open a product that was shared with you.
2. Try to find and use any edit, save, or delete action on that product.

**Expected outcome:**
> You can view the product's details, but there's no way to edit, save changes to, or delete it — any attempt to do so is blocked (you'll see a "Forbidden" or access-denied response, not a successful save).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A client cannot see a product that was never shared with them, even by guessing a URL

**Covers:** AC4

**Steps:**
1. As the Client-org user, find or guess the web address of a product that was never shared with your organisation.
2. Visit that address directly.

**Expected outcome:**
> You see a "not found" page or message — exactly as if the product simply didn't exist. You do NOT see a "forbidden" or "access denied" message that would confirm the product exists but you're blocked from it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Revoking access takes effect immediately

**Covers:** AC5

**Steps:**
1. As Agency A, share a product with the Client org (if not already shared from Scenario 1).
2. As the Client-org user, confirm you can see it.
3. As Agency A, revoke/remove the share.
4. Immediately (no waiting), as the Client-org user, try to view that same product again.

**Expected outcome:**
> The product is no longer visible — it now behaves as "not found," immediately, with no delay or need to wait/refresh multiple times.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Existing cross-tenant protections still work

**Covers:** AC6

**Steps:**
1. As an unrelated, completely separate tenant (not an Agency or Client org, not connected via any relationship), try to access a product belonging to a different tenant by guessing its URL.

**Expected outcome:**
> Access is denied exactly as it always has been (before this feature existed) — this new feature has not weakened any existing protection between unrelated tenants.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Scenario 4 | | |
| Scenario 5 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
