# AC Verification Script: The feature artefact-index page renders every document's real status, using the canonical trace

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s4-features-page-integration.md
**Technical test plan:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s4-features-page-integration-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Load `.env` and start the local server:
   ```powershell
   # PowerShell — load .env then start server
   Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
   node src/web-ui/server.js
   ```
   ```bash
   # bash/zsh
   export $(grep -v '^#' .env | xargs) && node src/web-ui/server.js
   ```
2. In a browser, log in and go to `https://<your-local-host>/features/2026-04-19-skills-platform-phase4`.

**Reset between scenarios:** Refresh the page between scenarios — no other reset needed, this is a read-only page.

---

## Scenarios

### Scenario 1: Opening a never-registered feature shows all of its real documents

**Covers:** AC1

**Steps:**
1. Open the page for `2026-04-19-skills-platform-phase4`.
2. Count the documents shown, or scroll to the bottom to see if a total count is displayed.

**Expected outcome:**
> All 205 real documents for this feature appear on the page. They're grouped into sensible sections where their names suggest a grouping — not dumped into one long undifferentiated list, and none are missing.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A document that was never registered has a clearly visible "Unregistered" label

**Covers:** AC2

**Steps:**
1. On the same page, find any document.
2. Look for a small label/badge next to it.

**Expected outcome:**
> Any document that isn't registered in the tracking system shows a badge with the word "Unregistered" written on it — not just a color, so it's still clear even without color vision.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A registered story with no actual files shows a different, clearly distinct message

**Covers:** AC3

**Steps:**
1. Find a story section on the page that has no documents under it (a "ghost" registration).
2. Compare its appearance to the "Unregistered" badge from Scenario 2.

**Expected outcome:**
> This case looks and reads differently from the "Unregistered" badge — for example, it might say something like "Registered, but no files found" instead. You should be able to tell these two problems apart just by looking.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A feature that was already working correctly looks exactly the same as before

**Covers:** AC4

**Steps:**
1. Open this repo's own feature page: `/features/2026-09-06-feature-artefact-document-matrix`.
2. Compare it to how it looked before this story shipped (screenshot or memory of the existing table/matrix design).

**Expected outcome:**
> The page looks and behaves exactly as it did before — same table, same matrix, same layout. Nothing visibly changed for a feature that was already fully and correctly registered.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A feature whose data hasn't finished syncing shows a clear waiting message, not an error

**Covers:** AC5

**Steps:**
1. If a test/staging tenant with an unsynced checkout is available, open its feature page. Otherwise, ask engineering to trigger this state in a test environment.
2. Observe what the page shows.

**Expected outcome:**
> The page shows a clear message like "Still syncing — check back shortly." It does not show a blank page, a server error page, or the "Unregistered" badge from Scenario 2.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — phase4 shows all 205 documents | | |
| Scenario 2 — Unregistered badge visible | | |
| Scenario 3 — orphaned-registration distinct message | | |
| Scenario 4 — already-correct feature unchanged | | |
| Edge case — not-yet-synced message | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
