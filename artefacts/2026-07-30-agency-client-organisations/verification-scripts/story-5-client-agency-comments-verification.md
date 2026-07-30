# AC Verification Script: Client-org lightweight collaboration — comments only

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-5-client-agency-comments.md
**Technical test plan:** artefacts/2026-07-30-agency-client-organisations/test-plans/story-5-client-agency-comments-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a Client-org user with access to a shared product/feature (via an existing grant) and an Agency-org user with access to the same resource.

**Reset between scenarios:** No reset needed — scenarios build on the same thread in sequence.

---

## Scenarios

---

### Scenario 1: A client can comment on something shared with them

**Covers:** AC1

**Steps:**
1. Sign in as the Client-org user.
2. Open the shared product/feature.
3. Type a comment and submit it.

**Expected outcome:**
> Your comment appears on the page, showing your name/organisation and the time you posted it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A client cannot comment on something not shared with them

**Covers:** AC2

**Steps:**
1. As the Client-org user, try to reach a product/feature that was never shared with your organisation (e.g. by guessing its address).
2. Try to submit a comment there.

**Expected outcome:**
> You can't reach the page at all (it behaves as "not found") — there's no comment box to use.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: An agency can see and reply to a client's comment

**Covers:** AC3

**Steps:**
1. Sign in as the Agency-org user with access to the same product/feature.
2. Open it.
3. Confirm you can see the Client's comment from Scenario 1.
4. Type a reply and submit it.
5. Sign back in as the Client-org user and open the same page.

**Expected outcome:**
> As the Agency user, you see the Client's original comment. After replying, sign back in as the Client and confirm you can see the Agency's reply too — the conversation goes both ways.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
