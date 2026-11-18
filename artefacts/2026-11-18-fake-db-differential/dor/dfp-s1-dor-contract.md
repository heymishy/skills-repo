# Contract Proposal - The in-memory test database and real Postgres give the same answers for the users and products queries the browser suite relies on

**What will be built:**
- `tests/differential/scenarios.js`: the ordered statements for users and products, each with its parameters and the normalisation it needs.
- `tests/differential/schema.js`: the copied `CREATE TABLE` and `ALTER TABLE` statements for `users` and `products`, each tagged with the source file it mirrors.
- `tests/differential/run.js`: runs the scenarios against the fake (`createFakeTestDb` from `src/web-ui/adapters/fake-test-db.js`) and against Postgres (`DIFF_DATABASE_URL`, schema `fake_diff`), compares, prints the result, exits non-zero on divergence. Exports its normaliser and drift check.
- `tests/check-dfp-s1-fake-db-differential.js` (T1 to T4b): the unit leg.
- `.github/workflows/fake-db-differential.yml`: a `postgres:16` service container and one job running the harness with `DIFF_REQUIRE_PG=1`.
- A `decisions.md` entry and a Definition of Done, including the CI run link and any divergence record.

**What will NOT be built:**
- No change to the fake database's behaviour (beyond the one-line exception the story allows). No change to the app's schema or migrations. No new npm dependency (`pg` is already a dependency). No required-check change.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | differential run in CI | integration (CI) |
| AC2 | T2 | unit |
| AC3 | T3, reading the source files | unit |
| AC4 | T4a, T4b | unit |
| AC5 | CI run on the pull request, red-first with a deliberate divergence reverted before merge | CI |
| AC6 | DoD record | manual |

**Assumptions:** `pg` is available to the harness and to the CI job (dependency `^8.22.0`); the `postgres:16` service image accepts the harness's connection with the URL the job sets; the statements in `schema.js` match the sources at the time of writing, which T3 checks.

`schemaDepends: []`. **Estimated touch points:** Files: 4 plus one workflow and artefacts. Services: a CI service container.

**Exclusion list check (B1/D1):** the fake database and the app's schema sources are read, not changed, and no test asserts against their behaviour beyond the differential itself.
