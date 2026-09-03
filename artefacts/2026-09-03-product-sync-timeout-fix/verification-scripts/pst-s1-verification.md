# AC Verification Script: Make product sync fire-and-forget with client-side polling

**Story reference:** artefacts/2026-09-03-product-sync-timeout-fix/stories/pst-s1-make-product-sync-async-with-polling.md
**Technical test plan:** artefacts/2026-09-03-product-sync-timeout-fix/test-plans/pst-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to a product connected to a real GitHub repo with a reasonably large `pipeline-state.json` (ideally similar in size to the one that reproduced the original bug — `skills-framework`, ~1.3MB).
2. Load the product's page in a browser with developer tools open (so you can watch Network requests).

**Reset between scenarios:** Reload the product page fresh before each scenario.

---

## Scenarios

---

### Scenario 1: Clicking Refresh no longer produces a crash, even for a large repo

**Covers:** AC1, AC2, AC3

**Steps:**
1. Click the "Refresh" button on the product page.

**Expected outcome:**
> The button immediately changes to "Syncing…" and becomes un-clickable — within roughly a second, not after a long wait. No error popup ("Unexpected end of JSON input" or anything similar) appears, no matter how long the sync actually takes underneath.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The page updates itself once the sync genuinely finishes

**Covers:** AC4

**Steps:**
1. Click "Refresh" and leave the tab open, watching it.
2. Wait without touching anything.

**Expected outcome:**
> The page automatically reloads on its own once the sync completes — you do not have to manually refresh the browser yourself. The "Last synced" text at the top updates to reflect the new sync time.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Reloading the page mid-sync still shows the correct "Syncing…" state

**Covers:** AC5 (regression guard)

**Steps:**
1. Click "Refresh".
2. Before it finishes, manually reload the browser tab yourself (e.g. press the browser's own refresh button).

**Expected outcome:**
> The page still shows the Refresh button as disabled and labelled "Syncing…" — it does not look available to click again, even though you reloaded the page mid-sync.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A sync that fails underneath still leaves the page usable

**Covers:** AC3, NFR-Accessibility

**Steps:**
1. If possible, trigger a sync failure (e.g. temporarily using an invalid/expired GitHub token, or a repo the app can't currently reach) — this may need an engineer's help to simulate.
2. Watch what happens on the page.

**Expected outcome:**
> The "Syncing…" state eventually clears back to a clickable "Refresh" button rather than staying stuck forever — the page remains usable, even though the sync itself didn't succeed this time. Check the server logs separately to confirm the actual failure reason was recorded there (not visible on the page itself, by design — this is a developer-facing diagnostic, not a user-facing error).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
