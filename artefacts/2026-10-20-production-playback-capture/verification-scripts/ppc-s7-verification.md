# AC Verification Script: Record an in-app sign-off decision on captured evidence

**Story reference:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s7-sign-off-recording.md
**Technical test plan:** artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s7-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Log in to the product as a tenant Product Owner with a feature that has some captured evidence.
2. Make sure you know how many of that feature's ACs currently have captured evidence (e.g. "5 of 7").

**Reset between scenarios:** Scenarios 1–4 build on each other using the same feature (don't refresh away a recorded decision until Scenario 4 is done). Scenario 5 needs a second tenant/account.

---

## Scenarios

---

### Scenario 1: You can see a clear decision area with no decision recorded yet

**Covers:** AC1, AC6

**Steps:**
1. Open the capture-evidence page for a feature that has never had a sign-off decision recorded.
2. Look for the sign-off area (near the coverage line).

**Expected outcome:**
> You see two clearly different buttons — "Approve" and "Needs changes" — plus an optional comment box. Above or near them, it says something like "No decision recorded yet" — not a blank space, and nothing that looks like an existing "Approved" badge.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Recording a decision shows up immediately, with your name and the comment

**Covers:** AC2, AC3

**Steps:**
1. Type a short comment, e.g. "Looks good, matches the brief."
2. Click "Approve".
3. Reload the page.

**Expected outcome:**
> After reloading, you see a green "Approved" badge, your own name (or login), today's date/time, your comment exactly as you typed it, and the coverage count at the time you approved (e.g. "Approved against 7 of 7 ACs").

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A comment with unusual characters doesn't break the page

**Covers:** AC2, AC3 (security)

**Steps:**
1. On a feature with no decision yet, type a comment containing a quote mark and something that looks like code, e.g.: `Looks "mostly" done <script>test</script>`
2. Click "Needs changes".
3. Reload the page.

**Expected outcome:**
> Your comment displays back exactly as you typed it, as plain readable text — it does not break the page layout, trigger a pop-up, or disappear. (If you open the browser's developer console, there should be no script execution or error related to this.)

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A decision made earlier stays visible but is clearly marked as "older" once new evidence is captured

**Covers:** AC4

**Steps:**
1. Using the feature from Scenario 2 (already "Approved"), capture evidence for one more AC that didn't have any yet (so total coverage changes).
2. Reload the page.

**Expected outcome:**
> The "Approved" decision from Scenario 2 is still shown, but it still says the coverage count AT THE TIME you approved it (e.g. "Approved against 5 of 7 ACs") — it does NOT update to claim it covers the new evidence you just captured.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: You can't record a decision on someone else's feature

**Covers:** AC5

**Steps:**
1. Log in as a different tenant/account (or ask the engineer running this session to simulate it).
2. Try to submit a sign-off decision for the first tenant's feature (e.g. by guessing or reusing the URL).

**Expected outcome:**
> The request is rejected — you see an error or "not found," not a success message, and nothing changes on the original tenant's feature.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1, AC6) | | |
| Scenario 2 (AC2, AC3) | | |
| Scenario 3 (AC2, AC3 security) | | |
| Scenario 4 (AC4) | | |
| Scenario 5 (AC5) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
