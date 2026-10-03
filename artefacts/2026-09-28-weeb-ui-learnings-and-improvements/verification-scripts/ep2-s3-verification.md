# AC Verification Script: Paginate the signals panel to handle real-world signal volume

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s3.md
**Technical test plan:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep2-s3-test-plan.md
**Script version:** 1
**Verified by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A) | **Date:** 2026-10-04 | **Context:** [x] Pre-code (pre-merge, on branch `feature/ep2-s3-wuli`)

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

**Result:** [x] Pass  [ ] Fail
**Notes:** Live-verified with Claude-in-Chrome against a real running dev server, real auth session, real unseeded `getSignals()` data: `document.querySelectorAll('.signal-item').length` returned exactly `50` on page 1, out of this repo's own real total of `5324` signals at the time of this check (this repo's own count has naturally grown since `ep2-s1`'s own 5,293 finding, itself a small piece of corroborating evidence this is live, real data, not a static fixture). Order preservation confirmed by code inspection (`paginateSignals` never sorts, only slices) and the real screenshot showing the final visible signal before the pagination bar was a genuine, recognisable real entry (a `pipeline-state` feature-status signal), not reordered content.

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

**Result:** [x] Pass  [ ] Fail
**Notes:** Live-verified with Claude-in-Chrome: clicked the real "Next" button on page 1, the browser's own address bar genuinely navigated to `/signals?page=2` (confirmed via `location.pathname + location.search`), and the real DOM showed `"Signals 51–100 of 5324"` with both `["Previous", "Next"]` links present (correctly, since page 2 is neither first nor last) — real server-side query-param routing, not client-side JS state.

---

### Scenario 3: The first and last pages don't offer a link that would go nowhere

**Covers:** AC3

**Steps:**
1. On page 1, look for a "Previous" link.
2. Click "Next" repeatedly until you reach the last page (the position text from Scenario 4 will tell you when you're on it — or just keep clicking until "Next" disappears).
3. On that last page, look for a "Next" link.

**Expected outcome:**
> On page 1, there is no "Previous" link to click (you're already as far back as you can go). On the last page, there is no "Next" link to click, and the page's own text confirms it's the last page.

**Result:** [x] Pass  [ ] Fail
**Notes:** Live-verified with Claude-in-Chrome: on page 1, the real pagination bar's own link list was exactly `["Next"]` — no "Previous" present at all. Last-page behaviour confirmed at the automated-test tier (`tests/check-ep2-s3-signals-pagination.js`'s own integration test asserting no "Next" text on the real computed last page) plus direct code inspection of `_paginationBar`'s `isLastPage` branch, which appends "(last page)" to the position text — not independently re-clicked all the way to the real last page live (thousands of signals, ~107 pages at 50/page), since the automated test already exercises this exact boundary deterministically against a real last-page fixture.

---

### Scenario 4: The page always tells you the real total and where you are in it

**Covers:** AC5

**Steps:**
1. On any page, look for text near the top or bottom of the signals list stating a count.

**Expected outcome:**
> The page states the real total number of signals (a specific number, not "many" or "lots") and which range you're currently looking at — for example, something like "Signals 1–50 of 5,293". The total shown should match the real, current number of signals in this repo, not a rounded or placeholder figure.

**Result:** [x] Pass  [ ] Fail
**Notes:** Live-verified with Claude-in-Chrome: real page 1 showed "Signals 1–50 of 5324"; real page 2 showed "Signals 51–100 of 5324" — both the real, current total (not a rounded/placeholder figure) and the correct range for the current page, visually confirmed in a real screenshot and via direct DOM text extraction.

---

### Scenario 5: A broken or made-up page number doesn't break the page

**Covers:** AC4

**Steps:**
1. Ask the coding agent to confirm this was tested with made-up `page` values typed directly into the address bar (e.g. `?page=abc`, `?page=0`, `?page=-1`, and a number far beyond the real last page like `?page=9999`) — this isn't practical to trigger by hand for every case, but you can personally try at least one: type `/signals?page=9999` into the address bar yourself and press enter.

**Expected outcome:**
> You do NOT see an error page, a blank screen, or a confusing empty page. You land on a real, normal-looking page of signals (specifically, the real last page) — exactly as if you'd clicked "Previous" all the way from the end, not as if something broke.

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed at the strongest automated tier: 4 integration tests in `tests/check-ep2-s3-signals-pagination.js` dispatch real requests with `page=abc`, `page=0`, `page=-1`, and `page=9999` against the real handler and assert a real `200` response for each (never an error status). Not independently re-tried live in the browser — AC4 was explicitly classified NOT CSS-layout-dependent at test-plan time (a status-code/DOM-presence concern, not a visual one), and the automated coverage is already comprehensive and deterministic across all 4 malformed-input shapes.

---

### Edge case: Everything that already worked on the signals panel still works on a single page

**Covers:** AC6

**Steps:**
1. Look through the signals on your current page for one with a visibly different style — a highlighted left border, slightly different background (this marks a signal the system couldn't parse correctly from its source file).
2. Confirm every other signal still shows its normal source, type, text, and a working CTA button.

**Expected outcome:**
> If a "couldn't parse" signal appears on your current page, it's still visually distinguished exactly as it was before pagination existed. Every normal signal's CTA button still works exactly as before (clicking it starts a new session for that signal, same as always). Nothing about a single signal's own appearance or behaviour has changed just because pagination now exists around it.

**Result:** [x] Pass  [ ] Fail
**Notes:** `tests/check-ep2-s1-signals-panel.js`'s own 11 tests (covering the parse-error marker, CTA rendering, empty state, and security escaping) re-run completely unmodified and pass 11/11. The live browser check also showed real, varying CTA labels across signals ("Review", "Open feature") exactly matching `ep2-s1`'s own per-source `cta.label` design, confirming no regression to per-signal rendering within a paginated page.

---

### Edge case: Keyboard-only navigation works on a real page, not just a small test page

**Covers:** AC7

**Steps:**
1. Ask the coding agent to confirm this was verified with a real, automated keyboard-only (Tab key) walkthrough of a real page of `/signals` — using this repo's own real signal data, not a small made-up test list — and that it completed normally rather than hanging or timing out.

**Expected outcome:**
> The automated check confirms a person using only the Tab key (no mouse) can reach every button and link on a single real page of signals, and this completes in normal time. (Before this story, this same check on the full unpaginated list of thousands of signals actually timed out — this scenario confirms that specific, real problem is now fixed, not just that a small test page happens to work.)

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed via a real Playwright E2E test (`tests/e2e/ep2-s3-signals-pagination.spec.js`) against this repo's own real, unmodified `getSignals()` data (no fixture seeding) — completes normally. Also independently re-verified this session, deliberately run together with `ep2-s1`'s own existing Accessibility spec in the exact sequential order that would expose a real cross-spec test-isolation bug found and fixed during this story's own implementation (a leaked fixture override from `ep2-s1`'s spec) — both pass, confirming the fix holds and this test genuinely validates against real, unseeded data, not a leaked small fixture.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Bounded list, not everything at once | Pass | Live Claude-in-Chrome check against real, unseeded data |
| Scenario 2 — Next/Previous navigation, bookmarkable | Pass | Live Claude-in-Chrome check, real query-param routing |
| Scenario 3 — No dead-end links at the boundaries | Pass | Live check (page 1) + automated test (last page) |
| Scenario 4 — Real total and position always visible | Pass | Live Claude-in-Chrome check, real counts |
| Scenario 5 — Broken page numbers don't break the page | Pass | Automated integration tests (4 malformed inputs) |
| Edge case — ep2-s1's own behaviour still works on a page | Pass | ep2-s1's 11 tests unmodified + live CTA-label confirmation |
| Edge case — Keyboard navigation works at real scale | Pass | Real E2E spec, independently re-verified against the fixed cross-spec leak |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
