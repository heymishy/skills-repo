# AC Verification Script: Paginate the signals panel to handle real-world signal volume

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s3.md
**Technical test plan:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep2-s3-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open the web UI signals panel at `/signals`, signed in.
2. This repo's own real signal count is in the thousands (over 5,000 at the time this story was written), so the page you land on by default is page 1 — you will not see every signal at once.

**Reset between scenarios:** Reload `/signals` (no `page` in the address bar) between scenarios, unless a scenario says otherwise.

---

## Scenarios

---

### Scenario 1: The page shows a bounded list, not everything at once

**Covers:** AC1

**Steps:**
1. Open `/signals` with nothing after it in the address bar (no `?page=...`).
2. Count how many signal cards are on the page (or check the position text from Scenario 4 below, which states the count directly).

**Expected outcome:**
> The page shows a fixed, bounded number of signals (a few dozen, not thousands). The signals are in the same order they always were — nothing has been re-sorted or re-arranged, just cut off at a page boundary.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Clicking Next and Previous moves between real pages, and the address bar updates

**Covers:** AC2

**Steps:**
1. On page 1, click the "Next" link at the bottom of the signals list.
2. Look at the address bar — it should now end in `?page=2`.
3. Copy that exact address bar URL, open it in a new tab (or reload the page).
4. Click "Previous".

**Expected outcome:**
> After step 1, you see a different set of signals than page 1 had, and the address bar reads `?page=2`. After step 3, reloading or re-opening that exact same address shows the exact same page-2 content — it doesn't reset back to page 1. After step 4, you're back on page 1's own original content.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The first and last pages don't offer a link that would go nowhere

**Covers:** AC3

**Steps:**
1. On page 1, look for a "Previous" link.
2. Click "Next" repeatedly until you reach the last page (the position text from Scenario 4 will tell you when you're on it — or just keep clicking until "Next" disappears).
3. On that last page, look for a "Next" link.

**Expected outcome:**
> On page 1, there is no "Previous" link to click (you're already as far back as you can go). On the last page, there is no "Next" link to click, and the page's own text confirms it's the last page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The page always tells you the real total and where you are in it

**Covers:** AC5

**Steps:**
1. On any page, look for text near the top or bottom of the signals list stating a count.

**Expected outcome:**
> The page states the real total number of signals (a specific number, not "many" or "lots") and which range you're currently looking at — for example, something like "Signals 1–50 of 5,293". The total shown should match the real, current number of signals in this repo, not a rounded or placeholder figure.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: A broken or made-up page number doesn't break the page

**Covers:** AC4

**Steps:**
1. Ask the coding agent to confirm this was tested with made-up `page` values typed directly into the address bar (e.g. `?page=abc`, `?page=0`, `?page=-1`, and a number far beyond the real last page like `?page=9999`) — this isn't practical to trigger by hand for every case, but you can personally try at least one: type `/signals?page=9999` into the address bar yourself and press enter.

**Expected outcome:**
> You do NOT see an error page, a blank screen, or a confusing empty page. You land on a real, normal-looking page of signals (specifically, the real last page) — exactly as if you'd clicked "Previous" all the way from the end, not as if something broke.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Everything that already worked on the signals panel still works on a single page

**Covers:** AC6

**Steps:**
1. Look through the signals on your current page for one with a visibly different style — a highlighted left border, slightly different background (this marks a signal the system couldn't parse correctly from its source file).
2. Confirm every other signal still shows its normal source, type, text, and a working CTA button.

**Expected outcome:**
> If a "couldn't parse" signal appears on your current page, it's still visually distinguished exactly as it was before pagination existed. Every normal signal's CTA button still works exactly as before (clicking it starts a new session for that signal, same as always). Nothing about a single signal's own appearance or behaviour has changed just because pagination now exists around it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Keyboard-only navigation works on a real page, not just a small test page

**Covers:** AC7

**Steps:**
1. Ask the coding agent to confirm this was verified with a real, automated keyboard-only (Tab key) walkthrough of a real page of `/signals` — using this repo's own real signal data, not a small made-up test list — and that it completed normally rather than hanging or timing out.

**Expected outcome:**
> The automated check confirms a person using only the Tab key (no mouse) can reach every button and link on a single real page of signals, and this completes in normal time. (Before this story, this same check on the full unpaginated list of thousands of signals actually timed out — this scenario confirms that specific, real problem is now fixed, not just that a small test page happens to work.)

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Bounded list, not everything at once | | |
| Scenario 2 — Next/Previous navigation, bookmarkable | | |
| Scenario 3 — No dead-end links at the boundaries | | |
| Scenario 4 — Real total and position always visible | | |
| Scenario 5 — Broken page numbers don't break the page | | |
| Edge case — ep2-s1's own behaviour still works on a page | | |
| Edge case — Keyboard navigation works at real scale | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
