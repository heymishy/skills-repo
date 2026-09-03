# AC Verification Script: Detect truncated Contents API content, fall back to Git Blobs API, and record diagnostics to logs + PostHog

**Story reference:** artefacts/2026-09-03-product-sync-blob-fallback-diagnostics/stories/psbf-s1-blob-fallback-diagnostics.md
**Technical test plan:** artefacts/2026-09-03-product-sync-blob-fallback-diagnostics/test-plans/psbf-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to `skills-framework` on `skills-framework.fly.dev` (production) — the exact product/repo this entire incident chain (`pst-s1` → `pgft-s1` → `psbf-s1`) was diagnosed against.
2. Have `flyctl logs --app skills-framework` available.
3. Have access to the PostHog project this app is configured against (same `POSTHOG_KEY` used by `posthog-server.js`), to check for the new `product_sync_content_truncated` event and any `$exception` events tagged with this story's diagnostic properties.

**Reset between scenarios:** Reload the product page fresh before each scenario.

---

## Scenarios

---

### Scenario 1: Refresh finally succeeds for the large connected repo

**Covers:** AC1, AC2, AC4

**Steps:**
1. Click "Refresh" on the `skills-framework` product page.
2. Wait for the page to auto-reload.
3. Check the "Last synced" timestamp and the health/coverage counts.

**Expected outcome:**
> "Last synced" now shows a recent time. Counts reflect real, current data (not the stale 45-day-old snapshot). This is the first time in this incident chain the sync actually completes successfully for this specific repo.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: PostHog shows the truncation event, confirming the root cause empirically

**Covers:** AC1, AC2

**Steps:**
1. After Scenario 1, check the PostHog project for a `product_sync_content_truncated` event (or `$exception` with matching properties) for the `skills-framework` product.

**Expected outcome:**
> The event exists, with properties showing a reported `size` around 1.3-1.4MB and a decoded length meaningfully shorter than that — the first direct, empirical confirmation of the exact truncation this whole incident chain has been chasing.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: If the fallback itself ever fails, it's now immediately diagnosable

**Covers:** AC3

**Steps:**
1. If Scenario 1 still fails, check `flyctl logs --app skills-framework` and PostHog for a fallback-failure event (`fallbackAttempted: true`).

**Expected outcome:**
> Unlike the two prior rounds of this incident, a continued failure is now immediately distinguishable as "the Blobs API fallback itself failed" rather than requiring another live-log investigation round-trip to even locate which layer is failing.

**Result:** [ ] Pass  [ ] Fail  [ ] N/A (Scenario 1 succeeded)
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
