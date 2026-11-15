# AC Verification Script: valid tenant-admin bootstrap statement

**Story:** artefacts/2026-11-15-tenant-admin-bootstrap-fix/stories/tabf-s1-valid-bootstrap-statement.md

## Setup
1. Start Docker Desktop.
2. Start a throwaway database bound to this computer only: `docker run --rm -d --name tabf-pg -p 127.0.0.1:25432:5432 -e POSTGRES_PASSWORD=test postgres:16` (port 25432 because Windows reserves the 55xxx range).
3. In PowerShell: `$env:TAB_TEST_DATABASE_URL = 'postgres://postgres:test@127.0.0.1:25432/postgres'`
4. Run: `node tests/check-tabf-s1-bootstrap-real-postgres.js`. It prints one line per check and a total. Without step 3 it prints SKIPPED for six checks; a SKIPPED line is not a pass.
5. When finished, `docker stop tabf-pg` and clear the variable.

### Scenario 1: the real database rejects the old statement (AC1)
Find the line about the old statement. **Expected:** pass; the database says `inconsistent types deduced for parameter $1`. **Result:** [ ] Pass [ ] Fail [ ] Skipped

### Scenario 2: a new tenant's first user becomes admin (AC2)
**Expected:** pass; one bootstrap record and one admin membership. **Broken looks like:** the call throws the scenario 1 error. **Result:** [ ] Pass [ ] Fail

### Scenario 3: a second login does nothing (AC3)
**Expected:** pass; still one bootstrap record; the second person gets no admin. **Result:** [ ] Pass [ ] Fail

### Scenario 4: an existing admin is never replaced (AC4)
**Expected:** pass; no bootstrap record is created. **Result:** [ ] Pass [ ] Fail

### Scenario 5: another tenant is unaffected (AC5)
**Expected:** pass. **Result:** [ ] Pass [ ] Fail

### Scenario 6: two people logging in at once get exactly one admin
**Expected:** pass; one granted, one not. **Result:** [ ] Pass [ ] Fail

### Scenario 7: production login is clean (AC7, after merge and production deploy)
**Steps:** the operator logs in on production; the agent reads the production log and PostHog. **Expected:** no `tenant_admin_bootstrap_failed` line and no new error event; then the operator closes GitHub issue #1101. **Result:** [ ] Pass [ ] Fail