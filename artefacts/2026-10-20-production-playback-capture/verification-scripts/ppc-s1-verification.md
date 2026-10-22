# AC Verification Script: Walking skeleton — tenant-scoped surface and single-AC capture via session-reuse auth

**Story reference:** `artefacts/2026-10-20-production-playback-capture/stories/ppc-s1.md`
**Technical test plan:** `artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s1-test-plan.md`
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. You need two test tenant accounts — Tenant A and Tenant B — each with their own product and at least one feature.
2. Tenant A's feature must already be marked DoD-complete (its delivery record shows a completed "definition-of-done" stage).
3. For the tenant-isolation scenarios (6 and 7), ask whoever set up the test environment for: (a) a second feature belonging to Tenant B that deliberately shares the exact same internal name/slug as Tenant A's feature, and (b) the direct web address of one of Tenant B's own features.

**Reset between scenarios:** No reset needed between scenarios 1–5 — they build on each other naturally (set a target, then capture it, then view it). Log out and log back in as the other tenant before scenarios 6 and 7.

---

## Scenarios

---

### Scenario 1: The playback-review page only shows my own tenant's DoD-complete feature

**Covers:** AC1

**Steps:**
1. Log in as Tenant A's Product Owner.
2. Open the new playback-review page for your DoD-complete feature.

**Expected outcome:**
> You see a list of that feature's acceptance criteria. You do not see any feature belonging to Tenant B anywhere on the page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Setting a capture target for an AC

**Covers:** AC2

**Steps:**
1. On the playback-review page, find an acceptance criterion that has no capture target set yet.
2. Click "Set capture target".
3. Enter the page's web address and a CSS selector for the element that should be captured.
4. Save.

**Expected outcome:**
> The acceptance criterion now shows the target is saved. If you reload the page, the saved target is still there — you don't have to enter it again.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Capturing evidence for an AC that already has a target

**Covers:** AC3

**Steps:**
1. Find an acceptance criterion that already has a capture target set (from Scenario 2).
2. Click "Capture evidence".

**Expected outcome:**
> The page shows a loading or working indicator, then a screenshot appears for that acceptance criterion. You are not asked to log in again or enter any credentials at any point during this process.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: An AC with no target shows a clear message

**Covers:** AC4

**Steps:**
1. Find an acceptance criterion with no capture target set.
2. Look at how it's displayed on the page.

**Expected outcome:**
> It clearly says "Capture target not set" (or equivalent wording). It does not look broken, show a blank space, or display an error.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Captured screenshot displays inline

**Covers:** AC5

**Steps:**
1. After Scenario 3's capture finishes, look at that acceptance criterion's row again.

**Expected outcome:**
> The screenshot is shown directly on the page, right next to the acceptance criterion's text. You do not have to click a separate download link or open another page to see it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: Two tenants with a feature of the same name never see each other's data

**Covers:** AC6

**Steps:**
1. Confirm with your test administrator that Tenant A and Tenant B each have a feature sharing the exact same internal name/slug (set up in advance — see Setup).
2. Log in as Tenant A's Product Owner.
3. Open the playback-review page for that feature.

**Expected outcome:**
> You see only Tenant A's own acceptance criteria, capture targets, and screenshots. Nothing from Tenant B appears anywhere on the page — not in the list, not in any screenshot, not in any text.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 7: Trying to open another tenant's feature directly is blocked

**Covers:** AC7

**Steps:**
1. Log in as Tenant A's Product Owner.
2. Get the web address for one of Tenant B's features from your test administrator.
3. Paste that address into your browser's address bar while still logged in as Tenant A.

**Expected outcome:**
> You see a "not found" or "access denied" page. You do not see Tenant B's feature name, its acceptance criteria, or any other detail about it — not even a hint that it exists.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 8: Two different people's captures never cross over

**Covers:** AC8

**Steps:**
1. Log in as Tenant A's Product Owner and capture evidence for one acceptance criterion.
2. Log in as a different person — either Tenant B's Product Owner, or a second person on Tenant A's own team — and capture evidence for one of their own acceptance criteria.

**Expected outcome:**
> Each person's captured screenshot shows their own session's view only. Nothing from one person's capture appears in the other's result — if it did, that would mean the underlying session-handling broke and started mixing people up.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Keyboard-only navigation

**Covers:** NFR — Accessibility

**Steps:**
1. Without using a mouse, use only the Tab key (and Enter/Space) to move around the playback-review page.
2. Try to reach and operate the "Set capture target" and "Capture evidence" buttons this way.

**Expected outcome:**
> You can reach and activate every button and interactive element using only the keyboard — nothing requires a mouse click. Status (such as "captured" or "not set") is shown with text or icons, not colour alone.

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
| Scenario 6 | | |
| Scenario 7 | | |
| Scenario 8 | | |
| Edge case (keyboard) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
