## Test Plan: Cleanup scripts for local disk and staging-DB test-generated data

**Story reference:** artefacts/2026-07-24-test-data-cleanup/stories/tdc-s1-cleanup-scripts.md

## AC Coverage

| AC | Description | Integration | Manual | Risk |
|----|-------------|-------------|--------|------|
| AC1 | Local script dry-run lists candidates, deletes nothing | 1 test | — | 🟢 |
| AC2 | Local script --delete removes exactly the listed candidates | 1 test | — | 🟢 |
| AC3 | Staging script dry-run lists matched rows, deletes nothing | — | 1 (needs real Postgres) | 🟡 |
| AC4 | Staging script --confirm deletes exactly the matched rows | — | 1 (needs real Postgres) | 🟡 |
| AC5 | Missing DATABASE_URL -> clear error, no crash | 1 test | — | 🟢 |

## Coverage gap

AC3/AC4 require a real Postgres connection (mocked `pg.Pool` is acceptable and used for the automated test; the operator's own manual run against real staging is the final confirmation, per the operator's own choice to run the deletion themselves).

## Integration Tests

### localScriptDryRunListsCandidatesDeletesNothing
- **Verifies:** AC1
- **Precondition:** A temp directory tree containing 1 recognised test-fixture folder (bare discovery.md) and 1 real, multi-file feature folder
- **Action:** Run the script's core scan function against the temp tree, no delete flag
- **Expected result:** Returns the test-fixture folder as a candidate, does NOT return the real feature folder, and the temp tree is unchanged on disk

### localScriptDeleteRemovesOnlyListedCandidates
- **Verifies:** AC2
- **Action:** Same as above, with delete=true
- **Expected result:** The candidate folder no longer exists; the real feature folder still exists, untouched

### stagingScriptDryRunListsMatchedRowsOnly
- **Verifies:** AC3
- **Precondition:** A mock `pg.Pool` returning a mix of `e2e-test-`-tagged and real-looking journeys
- **Action:** Run the script's core query function, no confirm flag
- **Expected result:** Only `e2e-test-`-tagged rows appear in the report; no DELETE query is issued

### stagingScriptConfirmDeletesOnlyMatchedRows
- **Verifies:** AC4
- **Action:** Same mock, with confirm=true
- **Expected result:** DELETE issued for `artefacts` (by matched journey_id) then `journeys`, scoped by the exact `e2e-test-` prefix predicate; real-looking rows never appear in any DELETE query's parameters

### missingDatabaseUrlExitsCleanly
- **Verifies:** AC5
- **Action:** Run the staging script with `DATABASE_URL` unset
- **Expected result:** Clear error message printed, non-zero exit code, no stack trace, no connection attempt
