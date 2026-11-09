# AC Verification Script: Auto-sync a product's pipeline-state.json immediately on repo connection

**Story reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s1-auto-sync-on-repo-connect.md
**Technical test plan:** artefacts/2026-11-08-unified-reactive-proactive-visibility/test-plans/urpv-s1-auto-sync-on-repo-connect-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Load the web-ui server with its environment variables (see commands below), logged in as a tenant admin for a test product that has no repo connected yet.
2. Have a real or test GitHub repo available to connect (one that contains a `.github/pipeline-state.json` file with at least one feature entry).
3. Open the product's detail page in a browser tab, ready to reload it after connecting.

**Reset between scenarios:** Disconnect the repo (or use a fresh test product) before starting Scenario 2, so each scenario starts from "no repo connected."

```powershell
# PowerShell — load .env then start server
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
node src/web-ui/server.js
```
```bash
# bash/zsh
export $(grep -v '^#' .env | xargs) && node src/web-ui/server.js
```

---

## Scenarios

---

### Scenario 1: Connecting a repo shows the connection succeed immediately, without waiting

**Covers:** AC1

**Steps:**
1. On the product's page, click "Connect Repo."
2. Type the test repo's owner/name into the connection form.
3. Click "Connect."

**Expected outcome:**
> The connection confirmation appears within a second or two — it does not hang or spin while GitHub data loads in the background.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Reconnecting while a sync is already running does not break anything

**Covers:** AC2

**Steps:**
1. Immediately after Scenario 1's connect click (within the same few seconds, while the background sync may still be running), click "Connect Repo" again for the same product and repo.
2. Submit the connection form again.

**Expected outcome:**
> The second connection attempt also succeeds (no error message) — it does not start a second, duplicate data pull, and the page does not show any error about a sync already running.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A failed background sync does not break the connection or show an error to the user

**Covers:** AC3

**Steps:**
1. Connect a repo that GitHub cannot actually reach (e.g. a repo name that does not exist, or temporarily revoke the test token's access to it).
2. Watch the page response.

**Expected outcome:**
> The connection still reports success to the user (the repo is marked "Connected") — no error is shown on screen about the failed data pull. (A server-side log entry recording the failure is expected, but that is checked separately, not from the browser.)

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The product page shows real data right after connecting, without clicking Refresh

**Covers:** AC4

**Steps:**
1. Connect a repo that has a real, readable `.github/pipeline-state.json` with at least one feature.
2. Wait about 10 seconds (do not click any Refresh button).
3. Reload the product's detail page.

**Expected outcome:**
> The consolidated features section shows the real feature(s) from that repo's `pipeline-state.json` — names, stages, health — not an empty list and not a "no data yet" message.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Large repo does not delay the connection confirmation

**Covers:** NFR-Performance

**Steps:**
1. Connect a repo with a large `pipeline-state.json` (many features), or one known to be slow to fetch from GitHub.
2. Time how long the "Connected" confirmation takes to appear.

**Expected outcome:**
> The confirmation appears quickly (within a couple of seconds) regardless of how long the background data pull takes — the two are not tied together.

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
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
