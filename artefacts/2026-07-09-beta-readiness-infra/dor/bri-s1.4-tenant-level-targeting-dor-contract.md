# Contract Proposal: Wire tenant-level flag targeting via PostHog group analytics

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.4-tenant-level-targeting.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.4-tenant-level-targeting-test-plan.md

---

## What will be built

- A tenant-group-identification call (e.g. `identifyTenantGroup(tenantId)`), wired through S1.1's same injectable adapter (`posthog.group('tenant', tenantId)`), invoked ahead of `isEnabled()` calls during session bootstrap (S1.3).
- The `tenantId` used for both group identification and flag evaluation context is read exclusively from `req.session.tenantId` — never from `req.body`/`req.query` — consistent with the existing ADR-025 tenant-isolation guard.
- Group-registration failure or delay (e.g. first-time group-type registration) does not throw or crash the request; `isEnabled()` falls back to S1.1's safe default (`false`) if group state could not be confirmed in time.
- No special-casing for solo-tenant customers — the same call path and context shape are used regardless of tenant size.

## What will NOT be built (scope boundary)

- Per-team-member overrides within a tenant — targeting is tenant-wide only.
- Retroactive re-targeting of flags previously evaluated at the user level — no historical flag-evaluation migration.
- Real PostHog Group Analytics billing/limits verification — an operational concern tracked in `decisions.md`, not a functional AC.

## AC → test-approach table

| AC | Description | Test approach |
|----|--------------|----------------|
| AC1 | Two users, same tenant, identical `isEnabled()` result | Unit (1) + Integration (1) |
| AC2 | Flag targeted at a specific tenant: targeted tenant gets `true`, others get `false` | Integration (1) |
| AC3 | First-time group registration doesn't error; falls back to safe default if delayed/fails | Unit (1) + Integration (1) |
| AC4 | Solo-tenant uses identical mechanism, no special-casing | Unit (1) |

Plus a Security-NFR unit/NFR test pair confirming `tenantId` is always session-derived, never client-supplied (body/query), and a Performance-NFR test confirming group identification adds ≤100ms within S1.3's 200ms budget.

## Assumptions

- Group Analytics is enabled in the PostHog project per `decisions.md`'s validated ASSUMPTION entry (2026-07-09) — usage-based, $0 within the free tier at this scale.
- The group-identification call is invoked from within S1.3's bootstrap flow, not as an independent session hook — this story's wiring point is inside S1.3's existing bootstrap step, not a new entry point.
- `tenantId` field name and session-storage location match the existing ADR-025 tenant-isolation guard already used elsewhere in the app (no new identity scheme introduced).

## Estimated touch points

- Extension to `src/web-ui/modules/posthog-flags.js` (S1.1) or a new `src/web-ui/modules/tenant-group.js` module for the `identifyTenantGroup()` call
- `src/web-ui/routes/journey.js` (or wherever S1.3's bootstrap step lives) — invoke group identification ahead of flag resolution
- New: `tests/check-bri-s1.4-tenant-level-targeting.js`
- No changes to `server.js`'s core PostHog client construction (that's S1.1/S1.2) beyond enabling Group Analytics in the PostHog dashboard (operational, not code)
