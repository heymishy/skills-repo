# Decisions: fake database versus real Postgres (dfp-s1)

**2026-11-18 | DECISION | The real-Postgres leg runs only in CI; locally it skips loudly**
**Context:** the operator chose CI as the representative environment. A local Postgres would be a second environment to keep in step with CI.
**Decision:** the harness runs the Postgres leg when `DIFF_DATABASE_URL` is set. CI sets it and `DIFF_REQUIRE_PG=1`. Without the URL locally, it prints that the leg was skipped and exits 0; with `DIFF_REQUIRE_PG=1` and no URL it exits non-zero.
**Rationale:** one reference environment, and a skip that cannot pass for a result.

**2026-11-18 | DECISION | The schema is copied from the app's sources and guarded by a drift check**
**Context:** the users and products tables are created in `src/web-ui/server.js`, `src/web-ui/modules/product-repo.js` and `src/web-ui/routes/products.js`. Importing those modules from the harness would re-boot the server, a known hang.
**Decision:** `tests/differential/schema.js` carries the statements, each tagged with its source. A check reads each source and fails if a statement is no longer there verbatim.
**Rationale:** the copy cannot drift without the check failing.

**2026-11-18 | DECISION | Generated ids are compared by shape, not value**
**Context:** the fake issues `fake-product-N`; Postgres issues a uuid. Their values can never match.
**Decision:** both are normalised to one placeholder, and the check requires a non-empty string on each side.
**Rationale:** the question is whether the app can use the id, which both answer; the value is not part of the contract.

**2026-11-18 | DECISION | A new workflow file, not a new job in e2e.yml**
**Context:** `tests/check-b2-ci-gate-config.js` guards the job list in `e2e.yml`. The core browser workflow was also a separate file for the same reason.
**Decision:** `.github/workflows/fake-db-differential.yml`, one job, not required until it has been green on real pull requests.
