**Feature:** 2026-09-06-canonical-artefact-trace
**Created:** 2026-09-06
**Last updated:** 2026-09-06
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Directory walk latency | < 50ms for a feature up to ~300 files | Direct timing in a unit test, matching the empirical measurement already done this session (`phase4`: 6ms, whole-repo: 229ms) | cat-s1 |
| Page render — no regression | Byte-identical output for the ~65% of features with no divergence | Regression test comparing pre/post output for a fully-registered feature | cat-s4 |

**Source:** Story AC (empirically established during `/clarify`, not assumed)

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Tenant isolation | Multi-tenant `WUCE_TENANT_ROOT_BASE` path resolution must not leak one tenant's disk checkout into another's trace | `mtrr-s1`'s existing cross-tenant isolation precedent | cat-s1, cat-s6 |
| No new input surface | `featureSlug` is already validated by existing route handlers before reaching the trace builder | Existing validation, unchanged | cat-s1 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (artefact filenames and pipeline metadata, no PII)

**Source:** `.github/architecture-guardrails.md` (ADR-025, multi-tenancy enforcement)

---

## Data residency

Not applicable — no new data storage, no data crosses a residency boundary; this feature only reads existing on-disk and Postgres data in place.

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| Graceful degradation (not-yet-synced) | 0 unhandled exceptions/500s for the multi-tenant not-yet-synced case | Verified in cat-s1's own AC5 | Resolved via `/clarify`, not assumed |

**Source:** Discovery Assumption 1, resolved via `/clarify`

---

## Compliance

Not applicable — `regulated: false` in `.github/context.yml`, no compliance frameworks configured for this repo.

**Named sign-off required?**
- [x] Not required

---

## Gaps and open questions

No NFR gaps identified at 2026-09-06.
