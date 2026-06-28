## Summary

- New module `src/web-ui/modules/tenant-plan.js`: `checkJourneyCap(tenantId, count, repoRoot)` resolves the cap from `MAX_JOURNEYS_PER_TENANT` env var, with per-tenant overrides via `{repoRoot}/tenant-caps.json`
- `handlePostJourney` now checks the cap before creating a journey; returns HTTP 402 with a user-facing HTML error if the tenant is at or above cap
- No cap configured (env var absent) = unlimited (safe default, backward compatible)
- Cap is per `session.tenantId` — after Sprint 0 (s0.2) this equals `user.login` for individual users, so each beta user has their own independent counter

## Usage

Set `MAX_JOURNEYS_PER_TENANT=10` in the deployment env to cap all users at 10 journeys each. To give a specific user more capacity, create `{repoRoot}/tenant-caps.json`:

```json
{ "hamish": 50 }
```

The per-tenant file entry takes priority over the global env var.

## Test plan

`node tests/check-s2.1-preflight-gate.js` — 10 passed, 0 failed

- AC1: below cap (4 of 5) → journey created
- AC2: at cap (5 of 5) → 402 with user-facing message
- AC3: no env var configured → unlimited (no blocking)
- AC4: per-tenant override in tenant-caps.json beats global env var
- AC5: cap is per-tenantId — bob not affected by alice being at cap
- AC6: unauthenticated → 302 (existing behaviour preserved)

## Notes

- Depends on Sprint 0 (merged) — cap key is `session.tenantId` which is now always `user.login` for individual users after s0.2
- Sprint 1 (Postgres/Redis persistence) and OQ7 vendor decision are independent of this PR
- Per-skill AI-call metering deferred — journey cap is sufficient for beta cost control
