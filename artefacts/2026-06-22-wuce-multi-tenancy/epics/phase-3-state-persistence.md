# Epic: Phase 3 — State Persistence

**Feature:** wuce-multi-tenancy
**Epic slug:** phase-3-state-persistence
**Status:** Deferred — pending OQ7 resolution
**Slicing strategy:** Risk-first (within Phase 3: Postgres journey store before Redis, as journey data is the higher-risk persistence target)

## Rationale

Phase 2 establishes filesystem and session-store isolation. The remaining durability gap is the in-memory journey store — process restarts lose all in-flight journeys and active sessions. Phase 3 replaces both with managed Postgres (journey store) and Redis (auth-session + viewer-activity). Neither story can be fully specified until the operator selects a vendor for managed Postgres and Redis.

## Deferral reason — OQ7

Discovery open question OQ7: "Phase 3 stories cannot be fully specified until the operator confirms the managed service vendor (Fly Postgres + Upstash Redis? Render Postgres + Render Redis?)." The injectable adapter interface can be written without a vendor, but the concrete adapter (connection string format, TLS requirements, migration tooling) is vendor-specific. Writing unstable ACs now produces implementation churn when the vendor is chosen. **Resolve OQ7 before running /definition for Phase 3.**

## Stories (deferred — not yet written)

| Story | Title | Complexity | Scope stability |
|-------|-------|------------|----------------|
| p3.1 | Postgres journey store adapter (injectable, same interface as current in-memory store) | 3 | Unstable — pending vendor |
| p3.2 | Redis auth-session and viewer-activity store adapter (injectable, TTL eviction) | 3 | Unstable — pending vendor |
| p3.3 | Concurrency tests (two tenants interleaved, no state bleed) + restart-survival test | 2 | Stable |

## Metric linkage

- **M2** (Cross-tenant journey data leakage prevention): Phase 3 adds restart-survival and concurrent-request isolation — necessary for M2's full production guarantee
