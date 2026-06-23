# Epic: Phase 4 — Performance Isolation

**Feature:** wuce-multi-tenancy
**Epic slug:** phase-4-performance-isolation
**Status:** Not started (implementation blocked on Phase 3 complete — prompt-cache scoping requires session persistence to be meaningful)
**Slicing strategy:** Risk-first (within Phase 4: single story)

## Rationale

After Phase 3, sessions and journeys survive restarts. Phase 4 ensures that one tenant's API usage cannot degrade another tenant's experience. The two main vectors are: prompt-cache keys (currently scoped to session ID only — a session ID collision across tenants could produce a cache hit from the wrong tenant's context) and API rate limits (currently scoped to process-level or IP-level — a high-volume tenant could exhaust the limit for all tenants).

## Stories

| Story | Title | Complexity |
|-------|-------|------------|
| p4.1 | Prompt-cache key scoping per tenant+session; per-tenant API rate-limit isolation | 2 |

## Metric linkage

- **M2** (Cross-tenant journey data leakage prevention): prompt-cache key collision between tenants is a data leakage vector — a cache hit from the wrong tenant's context could expose prior session content
