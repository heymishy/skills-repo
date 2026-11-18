## Story: The in-memory test database and real Postgres give the same answers for the users and products queries the browser suite relies on

**Epic reference:** None - short-track (test infrastructure, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: the fake's own header (`src/web-ui/adapters/fake-test-db.js`) says it supports exactly the `users` and `products` query shapes and nothing else, and that it is "NOT a general SQL engine"; the CI workflow `.github/workflows/e2e.yml` already runs a real Postgres 16 service for the Scenario jobs.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [tests] [web-ui] [data]

## User Story

As **the developer whose browser suite runs against the in-memory test database**,
I want **a check that runs the same statements against that database and against real Postgres and fails when they disagree**,
So that **a passing local browser run is evidence about the product's SQL, not only about a stand-in that was written to match the author's reading of it**.

## Benefit Linkage

**Metric moved:** None formal. The in-memory database answers the signup and product queries the browser suite uses. Its answers are hand-written, so a difference from Postgres (a duplicate-key code, an ordering, a missing column, a `RETURNING` value) passes locally and shows only in CI's Scenario jobs or in production.
**How:** a scenario file of statements in the order the app issues them, run against both. Results are compared after normalising only what cannot match by design (the generated id's value, timestamps). Row count, column names and values must match. A separate job runs the real-Postgres leg in CI, where the service container is the reference.

## Architecture Constraints

- The real-Postgres leg runs in CI only (a `postgres:16` service container in its own workflow). Locally, the harness prints a skip line and exits 0 unless `DIFF_REQUIRE_PG=1` is set, which CI sets. A skip must never look like a pass.
- The schema is the app's real schema. The app creates it in several places (`src/web-ui/server.js`, `src/web-ui/modules/product-repo.js`, `src/web-ui/routes/products.js`) and the app's own module cannot be required in the harness (a second boot of the server module is known to hang; see `workspace/learnings.md`). So the harness carries a copy of the statements, and a drift check reads each source file and fails if its copy is no longer in that file.
- The harness only drops and recreates a schema it names itself (`fake_diff`). It never touches `public` or any other schema.
- No change to the fake database's behaviour in this story. A divergence found is recorded, not fixed here, unless the fix is one line and the scenario that exposed it is kept.

## Dependencies

- **Upstream:** bri-s3.2 (the fake database), the Scenario jobs in `.github/workflows/e2e.yml` (the existing Postgres service pattern).
- **Downstream:** dfp-s2 (the session turns and journeys shapes, a later increment), dfp-s3 (a flake policy), dfp-s4 (commit verification stamp).

## Acceptance Criteria

**AC1:** Given the scenario file for users (insert, duplicate insert, lookup by email, lookup of a missing email) and products (insert, list by tenant in creation order, lookup of name and repository columns by product id), When the harness runs each statement against the fake and against Postgres, Then every result has the same row count, the same column names and the same values after normalisation, or the same error code.
**AC2:** Given the fake's generated product id and Postgres's uuid, When results are compared, Then both are normalised to one placeholder, and the check still requires a non-empty string on each side.
**AC3:** Given the harness copy of the schema, When the drift check runs, Then every statement in the copy appears verbatim in the source file it mirrors, and the check fails naming any statement that does not.
**AC4:** Given `DIFF_REQUIRE_PG` is not set and no Postgres URL is given, When the harness runs, Then it prints a line saying the real-Postgres leg was skipped and why, and exits 0. Given `DIFF_REQUIRE_PG=1` and no URL, Then it exits non-zero.
**AC5:** Given the CI workflow, When a pull request changes the fake database, the harness, or the scenario file, Then the job runs the real-Postgres leg against a `postgres:16` service container and fails on any divergence.
**AC6:** Given a divergence the harness finds, When the story closes, Then the divergence is recorded in its DoD with the statement, both results, and a decision: fix now, or record as a known difference with the reason.

## Out of Scope

- Any other table the fake supports (journeys, session turns, pods, personas and the rest): a later increment, dfp-s2.
- Changing the fake database's behaviour, beyond the one-line exception in the Architecture Constraints.
- Making the new job a required check (the operator decides, after it has been green on real pull requests).
- Testing the app's own migrations or the startup races noted in `e2e.yml`.

## NFRs

- **Reliability:** no sleeps; the harness creates its own schema and drops it at the start; results are deterministic given the same statements.
- **Security:** the Postgres URL is the throwaway CI service only; the job has `permissions: contents: read`.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
