# AC Verification Script: Provision an Upstash staging instance for Redis

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.3-upstash-staging-instance.md
**Technical test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.3-upstash-staging-instance-test-plan.md
**Script version:** 1 (update version if ACs change post-implementation)
**Verified by:** ______________ | **Date:** ______________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Get access to the Upstash console (console.upstash.com) for the account this project uses, or ask Hamish for a screen-share.
2. Confirm two Redis databases are listed in the console: one for prod, one for staging.
3. Have a way to make HTTP requests to `wuce-staging` (e.g. a browser, or `curl`).

**Reset between scenarios:** No reset needed — Scenario 1 is a read-only startup check, Scenario 2 involves a clearly-labeled test key you delete afterward, and Scenario 3 is a passive week-long observation.

---

## Scenarios

### Scenario 1: wuce-staging connects using distinct staging Redis credentials

**Covers:** AC1

**Steps:**
1. Open the Upstash console and note the REST URL for the staging Redis database.
2. Open the Fly.io dashboard for `wuce-staging` and check its configured secrets (`fly secrets list --app wuce-staging` shows secret *names*, not values, but confirms `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set).
3. Ask Hamish to confirm (or confirm yourself if you have access) that the values set for `wuce-staging` match the staging Redis database's own URL/token — not the prod database's.

**Expected outcome:**
> `wuce-staging` has `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` secrets set, and their values correspond to the staging Redis database shown in the Upstash console — a different database from the one prod (`wuce-prod`) uses.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A session written to staging Redis never appears in prod Redis

**Covers:** AC2

**Steps:**
1. Trigger a Playwright test run (or any action that creates a session) against `wuce-staging`, so a session key gets written to staging Redis.
2. In the Upstash console, open the staging Redis database's data browser and confirm the new session key exists (keys are prefixed `session:`).
3. Open the prod Redis database's data browser in the Upstash console.
4. Search for the same session key in prod.

**Expected outcome:**
> The session key exists in the staging Redis database (step 2) but does not exist anywhere in the prod Redis database (step 4). The two instances are genuinely separate.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Staging Redis usage stays within the free-tier allowance after a week of CI

**Covers:** AC3

**Steps:**
1. Let CI run normally against `wuce-staging` (Playwright suite + smoke test on every merge to `main`) for approximately one week.
2. Open the Upstash console's usage/metrics page for the staging Redis database.
3. Check the monthly command count against the 500K commands/month free-tier allowance.

**Expected outcome:**
> The command count for the week, extrapolated to a full month at the same CI cadence, stays comfortably under 500K commands/month — no warning banner about approaching or exceeding the free-tier limit.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — distinct staging credentials | | |
| Scenario 2 — write isolation | | |
| Scenario 3 — usage within free tier | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
