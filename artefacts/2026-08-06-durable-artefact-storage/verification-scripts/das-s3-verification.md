# AC Verification Script: Backfill already-completed stage artefacts to a repo at the moment it's connected

**Story reference:** artefacts/2026-08-06-durable-artefact-storage/stories/das-s3-backfill-artefacts-on-repo-connection.md
**Technical test plan:** artefacts/2026-08-06-durable-artefact-storage/test-plans/das-s3-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Create a product with no repo connected, and complete at least 2 stages of a journey against it (so real local artefact content exists).
2. Run `npm test` first to confirm the automated suite passes before doing manual verification.

**Reset between scenarios:** Use a fresh product/journey for each scenario.

---

## Scenarios

---

### Scenario 1: Connecting a repo after stages are already complete backfills them

**Covers:** AC1

**Steps:**
1. With a product that already has 2+ completed stages and no repo connected, connect a repo (via any of: creating a new repo, connecting an existing one, or editing the product's repo field).
2. Check the connected repo's GitHub history afterward.

**Expected outcome:**
> The artefact files for the already-completed stages now exist in the repo — you don't have to do anything else to get them there.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A response tells you what got backfilled

**Covers:** AC3

**Steps:**
1. Repeat Scenario 1, this time watching the network response (or the confirmation the app shows) when the repo connection completes.

**Expected outcome:**
> The response includes a count of how many stages were backfilled successfully, and names any that couldn't be (if applicable) — you're not left guessing whether it worked.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Connecting a repo to a fresh product with no completed stages works exactly as before

**Covers:** AC4

**Steps:**
1. Create a brand-new product with no journeys started yet.
2. Connect a repo to it right away (the normal, common flow).

**Expected outcome:**
> Nothing about this feels different from before — no extra delay, no unexpected messages. There's simply nothing to backfill.

**Result:** [ ] Pass  [ ] Fail
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
