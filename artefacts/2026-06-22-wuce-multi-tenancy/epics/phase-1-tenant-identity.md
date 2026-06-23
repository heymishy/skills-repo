# Epic: Phase 1 — Tenant Identity

**Feature:** wuce-multi-tenancy
**Epic slug:** phase-1-tenant-identity
**Status:** Not started
**Slicing strategy:** Risk-first — identity boundary is the second risk after the authorization guard; establishes `tenantId` on sessions and journeys before any storage work begins
**Guardrails availability:** Same as Phase 0. Relevant constraint: injectable adapter rule (D37) applies to the org-fetch function in `oauth-adapter.js`.

## Rationale

Phase 0 closes the per-user ownership gap but does not establish a tenant concept. Phase 1 adds GitHub org resolution at OAuth callback, extends the session shape to carry `tenantId`, and makes `isSameTenant()` enforce a real boundary. After Phase 1, the authorization guard has all the information it needs to reject cross-tenant reads — even though storage is still not namespaced. The isolation guarantee at Phase 1 close: a user in org A cannot see journeys created by a user in org B (in-memory enforcement via the guard + `isSameTenant`).

## Stories

| Story | Title | Complexity |
|-------|-------|------------|
| p1.1 | `read:org` scope; tenantId resolution at OAuth callback; zero-match rejection | 2 |
| p1.2 | `tenantId` on session + journey; `isSameTenant()` real enforcement; 3→4 field fixture update | 2 |

## Out of scope for this epic

- Storage namespacing (Phase 2) — journeys for different tenants may still coexist in the same in-memory store; isolation is guard-enforced only until Phase 2
- Postgres/Redis persistence (Phase 3)
- Multi-org membership disambiguation beyond "first match in allowlist order" (open question OQ5 from discovery)

## Metric linkage

- **M2** (Cross-tenant journey data leakage prevention): minimum validation signal met at Phase 0; full target begins here when `isSameTenant()` enforces real boundary
