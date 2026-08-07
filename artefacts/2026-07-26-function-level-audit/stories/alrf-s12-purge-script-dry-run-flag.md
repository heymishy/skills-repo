# alrf-s12: Add a --dry-run flag to scripts/purge-e2e-tenants.js

**Track:** Short-track (small, additive CLI enhancement to an already-shipped operational script) — CLAUDE.md short-track: /test-plan → /definition-of-ready → coding agent.

## Background

Follow-up to alrf-s11 (auto-purge e2e-test- tenants after every staging E2E run). The operator needs to run a one-off retroactive purge of the existing accumulated stale `e2e-test-*` tenants directly against staging (via `flyctl ssh console --app wuce-staging`), since this is a real, irreversible delete against production-adjacent data — they want to see exactly what would be deleted before running the real purge. The existing script had no read-only preview mode.

## User story

As the operator running a one-off manual purge of stale e2e-test tenants on staging, I want a `--dry-run` flag that lists what would be deleted without deleting anything, so that I can review the exact set of affected tenants before committing to an irreversible delete.

## Acceptance Criteria

- **AC1:** Given `node scripts/purge-e2e-tenants.js --dry-run` is run, when the database is reachable, then it prints the count and list of `e2e-test-*` tenant IDs that would be purged, and performs zero DELETE queries.
- **AC2:** Given the same command is run without `--dry-run`, when the database is reachable, then behaviour is unchanged from before this story — it performs the real purge and prints "Purged N e2e-test- tenant(s)".
- **AC3:** The dry-run output is textually distinguishable from the real-purge output (contains `[dry-run]`, never `Purged `), so a script or operator scanning the log cannot mistake one for the other.
- **AC4:** CI's existing always()-gated cleanup steps (e2e.yml, staging-deploy.yml) continue to call the script with no flag — unaffected by this change.

## Out of scope

- The actual retroactive purge run itself (an operational action the operator performs, not code).
- Any change to `findE2eTenantIds`/`purgeTenant`/`purgeE2eTenants`'s internal logic — this story only adds a new CLI entry-point branch around the existing, already-tested functions.

## Architecture constraints

No new pattern introduced. Follows the existing script's own D37 injectable-adapter convention (unchanged) and its "never throw, never block CI" CLI-entrypoint contract (unchanged for the non-dry-run path).

## Complexity

1 — well understood, small additive CLI branch around already-correct, already-tested functions.

## Scope stability

Stable.
