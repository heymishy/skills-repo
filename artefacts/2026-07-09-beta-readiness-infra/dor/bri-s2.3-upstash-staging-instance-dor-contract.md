# DoR Contract Proposal: Provision an Upstash staging instance for Redis

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.3-upstash-staging-instance.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.3-upstash-staging-instance-test-plan.md
**Date:** 2026-07-10

---

## What will be built

A separate free-tier Upstash Redis instance dedicated to staging, wired to `wuce-staging` via distinct Fly secrets (`UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`) from prod's. The existing `session-redis.js`/`skill-session-redis.js` client factories already derive credentials exclusively from these two env vars with no hardcoded fallback — this story's in-repo work is confirming that pattern holds (regression guard) plus a module-reload test proving no client-config bleed-through across differing credential sets within a process.

## What will NOT be built (explicit exclusions)

- No Redis persistence/backup configuration for staging (per story Out of Scope) — session data is disposable
- No shared Redis instance between staging and future preview/PR environments (per story Out of Scope) — exactly one staging instance
- No live cross-instance isolation proof or live usage-ceiling tracking in the automated suite — both require real Upstash REST endpoints and are handled as manual scenarios

## AC → Test-approach table

| AC | Test approach |
|----|----------------|
| AC1 — distinct staging credentials | Unit: T1 — client factories derive credentials exclusively from env vars, no hardcoded fallback (regression guard). Unit: T2 — no hardcoded Upstash literal anywhere in tracked source. Manual: Scenario 1 — confirm Fly secrets match staging (not prod) Redis DB (External-dependency gap, acknowledged) |
| AC2 — write isolation | Unit: T3 — module-level client singleton doesn't bleed across differing credential configs on reload. Manual: Scenario 2 — write in staging, confirm absent from prod (External-dependency gap, acknowledged) |
| AC3 — usage stays within free-tier ceiling | Manual only: Scenario 3 — Upstash dashboard usage review after ~1 week of CI cadence (External-dependency gap, 🔴 highest risk — no automatable substitute, flagged for a scheduled dashboard check) |
| NFR-Security | T2 (static scan for hardcoded Upstash URL/token literals) |

## Assumptions

- The existing env-var-only client factory pattern in `session-redis.js`/`skill-session-redis.js` is confirmed correct today — T1/T2/T3 are protective regression guards, not new application logic; the actual new work is Upstash-side provisioning and Fly secret assignment, not code changes.
- Upstash's free tier (500K commands/month, 256MB, 10GB bandwidth) is confirmed sufficient per `decisions.md` — no paid-tier contingency is in scope for MVP.

## Estimated touch points

- Fly secrets for `wuce-staging` (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) — not a repo file
- `tests/` — new test file for T1–T3 (e.g. `tests/check-bri-s2.3-upstash-staging-instance.js`)
- No expected changes to `session-redis.js`/`skill-session-redis.js` application logic — provisioning-only story

## Contract Review

Checked against the story's 3 ACs and the test plan's AC Coverage table — no mismatch found. AC3's usage-ceiling risk is the highest-risk item across all 6 Epic 2 stories (🔴 vs 🟡/🟢 elsewhere) since it has no automatable substitute at all — flagged for operator attention in the DoR Warnings, not treated as a hidden gap. No hard block from contract review.
