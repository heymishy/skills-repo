# AC Verification Script: Build an idempotent anonymized seed script for staging

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.4-anonymized-seed-script.md
**Technical test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.4-anonymized-seed-script-test-plan.md
**Script version:** 1 (update version if ACs change post-implementation)
**Verified by:** ______________ | **Date:** ______________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to the staging Neon branch (either via a SQL client, or ask Hamish to run the seed script and share the output).
2. Confirm the seed script exists in the repo (e.g. `scripts/seed-staging.js` — check with the implementer for the exact path).
3. No special environment variables are needed if running against a real staging branch that already has `DATABASE_URL` configured for it; do not run this against prod.

**Reset between scenarios:** Scenario 2 (idempotency) requires running the script twice in a row against the same database — do not reset the database between steps 1 and 2 of that scenario, that's the point of the test.

---

## Scenarios

### Scenario 1: Seeding produces at least 2 tenants with realistic data

**Covers:** AC1

**Steps:**
1. Run the seed script against a freshly-branched (empty) staging database.
2. Using a SQL client, run `SELECT DISTINCT tenant_id FROM products;` (or the equivalent tenant-scoped table).
3. For one of the returned tenant IDs, check that it also has rows in `credits` and `user_roles`.

**Expected outcome:**
> At least 2 distinct tenant IDs appear in the results. Each has at least one row in `products`, `credits`, and `user_roles` — enough for a cross-tenant isolation test to compare two real tenants against each other.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Running the seed script twice does not create duplicates or errors

**Covers:** AC2

**Steps:**
1. Note the row counts in `products`, `credits`, and `user_roles` after Scenario 1's run.
2. Run the seed script again, against the same (already-seeded) database.
3. Watch the terminal output for any errors.
4. Check the row counts again in the same three tables.

**Expected outcome:**
> The script completes without printing any error message (no unique-constraint violation, no crash). The row counts after the second run are exactly the same as after the first run — nothing was duplicated.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Seeded data contains no real customer information

**Covers:** AC3

**Steps:**
1. Open the `products`, `credits`, and `user_roles` tables in the staging database (via SQL client or dashboard).
2. Read through the tenant names, email addresses, and any other identifying fields.

**Expected outcome:**
> Every name, email, and identifier is obviously synthetic — for example `tenant-demo-1` or `engineer@example-staging.test` — not a real person's name, a real company name, or a real email address. Nothing in the seeded data would embarrass the business if it leaked publicly.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Seed runs automatically after a staging deploy, without Hamish having to remember to run it

**Covers:** AC4

**Steps:**
1. Merge a small, unrelated change to `main` that triggers a staging deploy (per S2.5's pipeline).
2. Watch the CI run's logs for the deploy step.
3. Confirm a seed step appears and runs automatically, without any manual trigger.

**Expected outcome:**
> The CI pipeline log shows the seed script executing as a step immediately after the staging deploy step completes, with no manual action taken by Hamish. The output includes a summary line reporting how many tenants/rows were seeded.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — 2+ tenants with realistic data | | |
| Scenario 2 — idempotent re-run | | |
| Scenario 3 — zero real PII | | |
| Scenario 4 — automatic post-deploy execution | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
