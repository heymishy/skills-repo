## Test Plan: The in-memory test database and real Postgres give the same answers for the users and products queries the browser suite relies on

**Story reference:** artefacts/2026-11-18-fake-db-differential/stories/dfp-s1-fake-db-agrees-with-postgres-users-products.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-18
**Test runner (read from package.json):** the local unit leg is a plain Node check, `tests/check-dfp-s1-fake-db-differential.js`, run by `npm test`. The differential itself is `tests/differential/run.js`, run in CI by `.github/workflows/fake-db-differential.yml` against a `postgres:16` service container.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Every scenario step gives the same rows, columns, values or error code on both databases | - | 1 (differential, CI real-Postgres leg) | - | - | - | 🟡 (depends on the scenario list covering what the browser suite issues; coverage is reviewed, not measured) |
| AC2 | Generated ids normalised to one placeholder; a non-empty string required on each side | 1 (T2: normaliser unit test with a fake id and a uuid) | - | - | - | - | 🟢 |
| AC3 | Schema copy statements appear verbatim in their source files | 1 (T3: drift check reads each source) | - | - | - | - | 🟢 |
| AC4 | Local run prints a skip and exits 0; with `DIFF_REQUIRE_PG=1` and no URL, exits non-zero | 2 (T4a: skip line and exit 0; T4b: required-but-missing exits non-zero) | - | - | - | - | 🟢 |
| AC5 | CI job runs the real leg against the service container; a divergence fails the job | - | CI run on the pull request (red-first: a deliberate divergence scenario, reverted, in the DoD) | - | - | - | 🟡 |
| AC6 | Each divergence found is recorded with its statement, both results and a decision | - | - | - | DoD record | - | 🟢 |

## Red-first plan

The unit leg requires `tests/differential/run.js` and the normaliser and drift check it exports. Before they exist, `node tests/check-dfp-s1-fake-db-differential.js` fails at `require`; that is the recorded red state. The CI leg's red state is a deliberately wrong expectation in one scenario step, which must fail the job; it is reverted before merge and the run is linked in the DoD.
