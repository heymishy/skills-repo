# Epic: Phase 2 — Storage Isolation

**Feature:** wuce-multi-tenancy
**Epic slug:** phase-2-storage-isolation
**Status:** Not started
**Slicing strategy:** Risk-first — filesystem and session store are the durable record; in-memory guard isolation alone is insufficient once data persists to disk
**Guardrails availability:** Same as Phase 0. Critical: path-traversal guard standard (CLAUDE.md ougl) is mandatory for all disk writes whose path is derived from `tenantId`.

## Rationale

After Phase 1, the in-memory authorization guard prevents cross-tenant reads at the HTTP layer. But disk artefacts and session files are still written to a single shared directory tree. A filesystem scan of the storage root would reveal all tenants' data. Phase 2 moves the isolation boundary from the application layer to the filesystem, establishing the architectural guarantee required for a security audit: two tenants' data never coexist in the same directory.

## Stories

| Story | Title | Complexity |
|-------|-------|------------|
| p2.1 | Tenant-parameterised repoRoot; SESSION_STORE_PATH namespacing; featureSlug collision guard | 3 |
| p2.2 | Tenant-isolation test suite — two-tenant scenario, zero cross-read assertion | 2 |

## Out of scope for this epic

- Automated tenant directory provisioning (operator creates directories)
- Postgres/Redis persistence (Phase 3)
- Adversarial tenantId injection testing (Phase 5 — p5.1)
- Concurrent-request stress testing (Phase 3)
- In-memory journey store namespacing (the in-memory store is replaced by Postgres in Phase 3; this epic isolates at the filesystem and disk-session boundaries only)

## Metric linkage

- **M2** (Cross-tenant journey data leakage prevention): full filesystem-level target met at p2.2 completion — a filesystem scan of tenant A's directory reveals zero files from tenant B
