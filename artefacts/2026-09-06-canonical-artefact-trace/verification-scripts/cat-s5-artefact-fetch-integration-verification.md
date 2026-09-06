# AC Verification Script: Opening any single document resolves through the canonical trace, not independent logic

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s5-artefact-fetch-integration.md
**Technical test plan:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s5-artefact-fetch-integration-test-plan.md
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
2. Log in and open the feature page for `2026-07-05-product-stds-hierarchy` (`psh`) in one tab, and `2026-04-19-skills-platform-phase4` in another.

**Reset between scenarios:** No reset needed — each scenario opens a different link.

---

## Scenarios

### Scenario 1: A link that already worked correctly still works exactly the same

**Covers:** AC1

**Steps:**
1. On the `psh` feature page, click a document link that has always worked (e.g. a Definition of Ready document).

**Expected outcome:**
> The document opens and shows the same content it always has. Nothing changed for links that already worked.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A link that could only be found by "best guess" now actually opens

**Covers:** AC2

**Steps:**
1. On the `phase4` feature page, click a document that shows in an inferred group (a document that isn't formally registered but is grouped by its filename pattern).

**Expected outcome:**
> Clicking it opens the real document — it does not show a "not found" page. This was previously broken for many `phase4` documents; this is the fix.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Two different kinds of "not found" are told apart

**Covers:** AC3

**Steps:**
1. Click a link for a story that's registered but has no actual file ("orphaned-registration" case, see `cat-s4`'s Scenario 3 for where to find one).
2. Separately, click a link for something that was never registered at all and has no file.
3. Compare the two error messages.

**Expected outcome:**
> The two "not found" pages say different things — one clearly indicates "this was registered but the file is missing," the other says "this doesn't exist." An operator can tell which problem they're looking at.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Existing error pages still look and behave the same

**Covers:** AC4

**Steps:**
1. Try opening a link that's expected to fail in a way that's always failed the same way (e.g. a genuinely nonexistent artefact type on a real feature).

**Expected outcome:**
> The error page shown looks exactly like the error pages this site has always shown for this situation — no visible change in error handling.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — already-working link unchanged | | |
| Scenario 2 — inference-only link now opens | | |
| Scenario 3 — two distinct 404 messages | | |
| Scenario 4 — existing error pages unchanged | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
