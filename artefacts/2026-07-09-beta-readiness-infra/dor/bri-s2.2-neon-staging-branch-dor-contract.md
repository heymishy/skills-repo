# DoR Contract Proposal: Provision a Neon staging branch for Postgres

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.2-neon-staging-branch.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.2-neon-staging-branch-test-plan.md
**Date:** 2026-07-10

---

## What will be built

A Neon copy-on-write branch off the prod schema, dedicated to staging, wired to `wuce-staging` via a Fly-secret `DATABASE_URL` distinct from prod's. In-repo, the work is protective: confirm no environment-conditional schema fork exists (schema init stays unconditional across `DATABASE_URL` targets) and no hardcoded connection string exists anywhere in tracked source. A connection-readiness helper (assumed new, e.g. `waitForDbReady(timeoutMs)`) is introduced to bound Neon's autosuspend cold-start behind the 10-second budget with a clear, named timeout error rather than an indefinite hang.

## What will NOT be built (explicit exclusions)

- No automatic nightly re-branching from prod (per story Out of Scope) — branch created once for MVP
- No migration of dev/local Postgres data into this branch (per story Out of Scope) — S2.4's seed script covers staging data
- No live schema-identity or write-isolation proof in the automated suite — these require two real Neon connection strings and are handled as manual scenarios
- No change to prod's Neon project/branch

## AC → Test-approach table

| AC | Test approach |
|----|----------------|
| AC1 — schema-identical staging branch | Unit: no environment-conditional schema-forking branch exists in `server.js` (T1, regression guard). Manual: Scenario 1 — live `information_schema` comparison between staging and prod (External-dependency gap, acknowledged) |
| AC2 — write isolation | Unit: no hardcoded Postgres connection string in tracked source (T2, regression guard). Manual: Scenario 2 — write to staging, confirm absent from prod (External-dependency gap, acknowledged) |
| AC3 — cold-start reconnection within 10s | Integration: IT1 (delayed-but-within-budget connect succeeds), IT2 (over-budget connect surfaces a bounded, named error). Manual: Scenario 3 — real-world timing after 5+ min idle (External-dependency gap, acknowledged) |
| NFR-Performance | IT1/IT2 (mocked timing) + Scenario 3 (real-world) |
| NFR-Security | Static scan for a literal Neon connection string pattern in tracked source |

## Assumptions

- The implementation introduces a connection-readiness/retry helper distinct from `pg.Pool`'s own defaults; if implementation instead configures `pg.Pool`'s `connectionTimeoutMillis` directly, IT1/IT2's target module name is retargeted at implementation time — the intent (bounded, non-hanging behaviour within 10s) is the binding contract, not the specific helper name.
- The 10-second budget (sourced from Neon's published latency benchmarks, verified 2026-07-09, superseding an earlier ungrounded "30 seconds" figure resolved at review Run 2) remains the reference figure used by S2.5/S2.6 and Epic 3's Playwright config.
- Neon's free tier (100 CU-hours/month, 0.5GB/project, autosuspend after 5 min idle) is confirmed sufficient per `decisions.md` — no paid-tier contingency is in scope.

## Estimated touch points

- Fly secrets for `wuce-staging` (`DATABASE_URL`) — not a repo file
- Possibly a new connection-readiness helper module (exact path implementation-defined; likely alongside `src/web-ui/adapters/journey-store-pg.js` or `server.js`'s DB bootstrap)
- `tests/` — new test file for T1/T2/IT1/IT2 (e.g. `tests/check-bri-s2.2-neon-staging-branch.js`)
- No change expected to `journey-store-pg.js`'s existing query logic — only connection-establishment timing/retry behaviour is in scope

## Contract Review

Checked against the story's 3 ACs and the test plan's AC Coverage table — no mismatch found. Note: the test plan itself flags that IT1/IT2 assume a helper that doesn't exist in the codebase today; this is disclosed as an assumption (not a hidden gap) and is carried into this contract's Assumptions section. No hard block from contract review.
