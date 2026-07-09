# AC Verification Script: Provision a Neon staging branch for Postgres

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.2-neon-staging-branch.md
**Technical test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.2-neon-staging-branch-test-plan.md
**Script version:** 1 (update version if ACs change post-implementation)
**Verified by:** ______________ | **Date:** ______________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Get access to the Neon dashboard (console.neon.tech) for the project this app uses, or ask Hamish for a screen-share.
2. Have both the staging and prod connection strings available (via Fly secrets — `fly secrets list --app wuce-staging` and `fly secrets list --app wuce-prod` will show which secrets are set, though not their values; ask Hamish to retrieve the actual connection strings via the Neon dashboard if you need to run queries directly).
3. A SQL client (e.g. `psql`, or Neon's own web-based SQL editor) is useful for Scenarios 1 and 2.

**Reset between scenarios:** No reset needed between Scenarios 1 and 2 (read-only or clearly-labeled test writes). Scenario 3 requires waiting for a natural idle period — no manual reset possible.

---

## Scenarios

### Scenario 1: All prod tables are present and structurally identical in staging

**Covers:** AC1

**Steps:**
1. Open the Neon dashboard and confirm a staging branch exists, created as a copy-on-write branch off the prod schema.
2. Using a SQL client connected to the staging branch, list all tables (e.g. `\dt` in `psql`, or the Neon web editor's table browser).
3. Compare the list against the known prod tables: `products`, `credits`, `user_roles`, `github_first_login`, `users`, and any others present in prod.

**Expected outcome:**
> Every table that exists in prod also exists in staging, with the same columns, types, and constraints. Nothing is missing and nothing is a hand-maintained approximation — the staging branch was created by Neon's own branching mechanism, not manually recreated.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A write to staging never appears in prod

**Covers:** AC2

**Steps:**
1. Connect to the staging Neon branch using a SQL client.
2. Insert a clearly-labeled test row, e.g. `INSERT INTO products (tenant_id, name) VALUES ('verification-test-tenant', 'verification-test-product');` (adjust column names to match the actual `products` schema).
3. Connect to the prod Neon project/branch using a SQL client.
4. Search for the same test row: `SELECT * FROM products WHERE tenant_id = 'verification-test-tenant';`
5. Clean up: delete the test row from staging.

**Expected outcome:**
> The test row exists in staging (step 2 confirms the insert succeeded) but the search in prod (step 4) returns zero rows. The two databases are genuinely separate — not the same database with two labels.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Staging reconnects within 10 seconds after autosuspend

**Covers:** AC3

**Steps:**
1. Confirm `wuce-staging` has been idle (no requests) for at least 5 minutes, long enough for Neon's autosuspend to trigger.
2. Make a single request to `wuce-staging` (e.g. load its `*.fly.dev` URL in a browser, or `curl` a health-check endpoint).
3. Time how long it takes for the response to come back.

**Expected outcome:**
> The request succeeds within 10 seconds of being sent — it does not hang indefinitely and does not return a connection error. A short delay (Neon's typical cold-start range is 500ms–3.1s) is expected and acceptable; the request should not need to be retried manually.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — schema identical | | |
| Scenario 2 — write isolation | | |
| Scenario 3 — cold-start within 10s | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
