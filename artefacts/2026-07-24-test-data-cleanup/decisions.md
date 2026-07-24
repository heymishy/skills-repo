# Decisions: Test Data Cleanup

## RESOLVED — two safe, dry-run-by-default cleanup scripts built (2026-07-24)

**Context:** Operator finding: repeated test/dev runs accumulate clutter with no way to remove it — both locally on disk and in the real staging database via E2E test runs.

**Investigation:** Confirmed CI unit/integration tests never touch a real database (no `DATABASE_URL` in `assurance-gate.yml`/`pr-checks.yml`). E2E tests hit the real deployed `wuce-staging` app, which has a real Postgres (`journeys`, `artefacts` tables). `tests/e2e/fixtures/staging-auth.js` tags every E2E-generated identity with an `e2e-test-` prefix; since `tenant_id`/`owner_id` are both set from the signed-in user's own login (`auth.js`/`auth-stub.js`: `req.session.tenantId = user.login`), matching that exact prefix on either column safely identifies every E2E-created row with no false-positive risk.

**Critical correction made during build (local script):** The first pass of `clean-local-test-artefacts.js`'s "bare discovery.md" heuristic matched 6 directories that turned out to be TRACKED in git — real, committed (if abandoned) discovery artefacts for actual past features, not test cruft. Caught via `git ls-files` before any deletion, and the script was tightened to only ever consider UNTRACKED directories as candidates. This is a real example of why the "no blind file deletion" convention matters — shape alone (a bare discovery.md) was not a sufficient signal; trackedness in git was the actual dividing line between "abandoned real work" and "test run scratch".

**Decision:**
- `scripts/clean-local-test-artefacts.js` — dry-run by default, `--delete` to act. Matches only UNTRACKED `artefacts/*/` directories whose sole file is `discovery.md`, and UNTRACKED `workspace/test-tmp-*` directories.
- `scripts/clean-e2e-staging-data.js` — dry-run by default, `--confirm` to act. Reads `DATABASE_URL` from the environment (never hardcoded, never logged in full). Matches only `journeys` rows where `tenant_id LIKE 'e2e-test-%' OR owner_id LIKE 'e2e-test-%'`; deletes `artefacts` rows first (by `journey_id` FK), then `journeys` rows. Exits with a clear, non-stack-trace error if `DATABASE_URL` is unset.

**Per the operator's own explicit choice this session:** the staging script is built and tested here (against a mocked `pg.Pool`), but the operator runs it themselves against the real staging database — this session does not invoke it against real staging data.

**Verified by:** `tests/check-tdc-s1-clean-local-test-artefacts.js` (3/3 passing, including a real temp-git-repo fixture proving the tracked/untracked distinction) and `tests/check-tdc-s1-clean-e2e-staging-data.js` (4/4 passing, mocked `pg.Pool`, confirms the exact `e2e-test-%` predicate, FK-respecting delete order, and the missing-`DATABASE_URL` error path).
**Accepted by:** Hamish King, Founder/Operator, 2026-07-24.
