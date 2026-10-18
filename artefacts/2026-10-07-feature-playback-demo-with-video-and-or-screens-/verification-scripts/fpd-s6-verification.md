# AC Verification Script: Add an at-a-glance coverage summary to the top of the playback review page

**Story reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s6-review-page-status-summary.md
**Technical test plan:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/test-plans/fpd-s6-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Start the local web server with the real `.env` loaded (PowerShell: `Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }` then `node src/web-ui/server.js`; bash: `export $(grep -v '^#' .env | xargs) && node src/web-ui/server.js`)
2. Sign in as an authenticated user
3. Open `/playback/2026-10-11-journey-cx-redesign` in a browser — this feature already has a mix of ACs with and without captured evidence, suitable for Scenarios 1 and 2 below without any extra setup

**Reset between scenarios:** No reset needed — Scenarios 1 and 2 use two different existing features (see each scenario's own Setup note); nothing is written or changed by viewing the page.

---

## Scenarios

---

### Scenario 1: Partial-coverage summary shows the real "M of N" count

**Covers:** AC1

**Steps:**
1. Open `/playback/2026-10-11-journey-cx-redesign`
2. Look at the top of the page, just below the Scope and Benefit section and above the first story section

**Expected outcome:**
> A short summary line is visible stating how many ACs have captured evidence out of the total — e.g. "10 of 54 ACs have captured evidence" (exact numbers will match whatever has been captured for this feature at the time you check). It appears before you reach any individual story's own AC list, not buried further down the page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Zero-coverage summary is stated plainly, not hidden or misleading

**Covers:** AC2

**Steps:**
1. Open `/playback/` and pick any DoD-complete feature that has never had a real capture run against it (check a feature's own review page first — if it already shows a nonzero count, pick a different one)
2. Look at the same summary position as Scenario 1

**Expected outcome:**
> The summary states "0 of [N] ACs have captured evidence yet" (or equivalent wording naming zero explicitly) — it does not disappear, show blank space, or imply the package is complete.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Full-coverage summary reads differently from a partial one

**Covers:** AC3

**Steps:**
1. If a fully-captured feature exists, open its own `/playback/:slug` page and look at the summary. If none exists yet, this scenario can be verified pre-code by reading the test plan's own AC3 unit test instead, and re-run live once a feature reaches full coverage.
2. Compare the wording to what you saw in Scenario 1 (partial coverage)

**Expected outcome:**
> The full-coverage summary uses noticeably different wording from the partial case — e.g. "Full coverage — 10 of 10 ACs have captured evidence" rather than silently showing "10 of 10" in the exact same sentence shape as "3 of 10" would. The difference should be obvious from the words alone, not just a colour change.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Existing per-story and per-AC content is unchanged

**Covers:** AC4

**Steps:**
1. Open `/playback/2026-10-11-journey-cx-redesign`
2. Scroll down past the new summary line into the per-story sections
3. Check one story section you already know the content of (e.g. `jcx-s6`'s own AC2 section, which should show a real screenshot captured earlier)

**Expected outcome:**
> Every story and AC section below the summary looks exactly as it did before this change — same headings, same AC text, same screenshots/videos where present, same "No evidence captured for this AC yet." text where not. Nothing below the summary has moved, disappeared, or changed content.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1 — partial count) | | |
| Scenario 2 (AC2 — zero case) | | |
| Scenario 3 (AC3 — full case) | | |
| Scenario 4 (AC4 — no regression) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
