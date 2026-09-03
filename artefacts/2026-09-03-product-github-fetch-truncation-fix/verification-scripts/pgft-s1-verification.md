# AC Verification Script: Retry the GitHub Contents API fetch on transient/parse failure, with diagnostic error detail on exhaustion

**Story reference:** artefacts/2026-09-03-product-github-fetch-truncation-fix/stories/pgft-s1-retry-github-fetch-truncation.md
**Technical test plan:** artefacts/2026-09-03-product-github-fetch-truncation-fix/test-plans/pgft-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to `skills-framework` on `skills-framework.fly.dev` (production) or `wuce-staging.fly.dev` (staging) — the product connected to `heymishy/skills-repo`, the repo whose `pipeline-state.json` triggered the original incident.
2. Have `flyctl logs --app skills-framework` (or `--app wuce-staging`) available to watch server-side logs during the scenario.

**Reset between scenarios:** Reload the product page fresh before each scenario.

---

## Scenarios

---

### Scenario 1: Refresh succeeds without a "no data change" surprise

**Covers:** AC1, AC2, AC3, AC4

**Steps:**
1. Click "Refresh" on the `skills-framework` product page.
2. Wait for the page to auto-reload (per `pst-s1`'s own polling mechanism).
3. Check the "Last synced" timestamp.

**Expected outcome:**
> "Last synced" now shows a recent time (not the prior stale value). If a transient GitHub fetch failure occurs during this sync, it should now self-recover via retry rather than surfacing as a failed sync with no data change.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: If a sync still fails, the server log is now diagnosable

**Covers:** AC2

**Steps:**
1. If Scenario 1 produces a sync that still doesn't update "Last synced", check `flyctl logs --app skills-framework` for a `[product-sync] background sync failed` line.

**Expected outcome:**
> If the failure is a JSON-parse failure, the log message now includes the number of bytes actually received and the response's Content-Length header value — not just the bare "Unexpected end of JSON input" text from before this story.

**Result:** [ ] Pass  [ ] Fail  [ ] N/A (no failure occurred)
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
