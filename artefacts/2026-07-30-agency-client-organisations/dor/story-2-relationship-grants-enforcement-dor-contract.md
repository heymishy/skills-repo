# Contract Proposal — Agency-Client relationships, shared-access grants, and read-only enforcement

**What will be built:**
Two new tables (`agency_client_relationships`, `shared_access_grants`) and a single, dedicated grant-check adapter function (no ad hoc queries scattered across route handlers, per the story's own Guardrail). Every new read path protected by this guard, extending the existing `requireJourneyAccess`/`isSameTenant` guard pattern to the relationship-scoped shape. Revocation sets `revoked_at`, checked live on every grant-check call (no cache/TTL layer introduced).

**What will NOT be built:**
The Agency-side UI/flow for actually creating a relationship and granting access (Story 3's job) — this story is the data model and enforcement guard only. No bidirectional (Client-to-Agency) sharing.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|----------------|------|
| AC1 | Unit + integration: grant created scoped to `relationship_id` | Unit, Integration |
| AC2 | Unit + integration (×2): two-Agency/one-Client fixture, both directions | Unit, Integration |
| AC3 | Unit + integration: mutation route rejects a read-grant holder (403) | Unit, Integration |
| AC4 | Unit + integration: no-grant direct-ID access → 404 not 403 | Unit, Integration |
| AC5 | Unit + integration: revocation denies access on the very next request, no delay | Unit, Integration |
| AC6 | Integration: full pre-existing `bri-s3.4` suite re-run unmodified | Integration (regression) |

**Assumptions:**
The existing tenant-isolation guard (`isSameTenant`) remains the FIRST check on every route; the new grant-check guard is an ADDITIONAL check layered on top for Client-org requesters specifically, never a replacement. No caching layer exists anywhere in the current grant-check path to worry about invalidating — AC5's "immediate" requirement is satisfied by construction (direct query, no cache) rather than requiring new cache-invalidation logic.

**Estimated touch points:**
Files: new adapter module (e.g. `adapters/agency-client-grants-pg.js`), `middleware/journey-access.js` (or equivalent, extended), route handlers reading shared products/features, `tests/check-story2-relationship-grants-enforcement.js`.
Services: none new.
APIs: none new — additive DB tables + guard extension.
