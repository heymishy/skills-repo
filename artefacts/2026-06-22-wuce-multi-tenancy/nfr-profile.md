# NFR Profile — WUCE Multi-Tenancy

**Feature slug:** wuce-multi-tenancy
**Date:** 2026-06-22
**Status:** Active — reviewed at definition

---

## Performance

- `requireJourneyAccess()` and `asHttpResponse()` are synchronous with no I/O — no latency impact on route handlers for authorized callers
- Org pagination fetch (Phase 1, p1.1) must complete within 5 seconds on a normal GitHub API connection; log a warning if it exceeds 3 seconds
- `getRepoRoot(req)` (Phase 2, p2.1) must return in under 1ms — synchronous path resolution only
- Phase 2 tenant-isolation test suite (p2.2) must complete in under 10 seconds

## Security

- **NFR-sec-no-accesstoken-disk:** `accessToken` must never be written to disk — the strip-before-write invariant in `src/web-ui/adapters/session-store.js` must be preserved in all Phase 2 storage namespacing changes (p2.1, p2.2)
- **NFR-sec-existence-leak:** Cross-tenant and cross-owner journey reads must return HTTP 404 (not 403) via TENANT policy in `asHttpResponse()` — exposing whether a journey exists to an unauthorized caller is itself a data leak (p0.2)
- **NFR-sec-pathtraversal:** All disk write paths derived from `tenantId` or `featureSlug` must be guarded with `path.resolve(derived).startsWith(resolvedTenantRoot + path.sep)` — HTTP 400 on failure, no raw path logged in production (p2.1); adversarial re-audit at Phase 5 (p5.1)
- **NFR-sec-allowlist-disclosure:** The zero-match rejection error message in the OAuth flow (p1.1) must not expose the contents of `TENANT_ORG_ALLOWLIST` to the end user
- **NFR-sec-session-field:** `req.session.accessToken` is the canonical field name throughout — no other field name is acceptable

## Data classification

- **Journey data:** Internal — non-public, contains user's pipeline delivery artefacts. Not classified as Confidential (no PII, no financial data, no regulated information in scope for Phases 0–2).
- **Session data (`accessToken`):** Confidential — GitHub OAuth access token; must never be persisted to disk, committed to git, or logged.
- **`tenantId` (GitHub org login):** Internal — not sensitive, but must not appear in unguarded production log output (org login of a tenant is operational information, not public).

## Data residency

Not applicable for Phases 0–2. The platform runs in-process on operator-managed infrastructure; no cross-region data movement is introduced.

## Availability SLA

Not defined for solo-developer deployment. The authorization guard (Phase 0) must not reduce availability for the journey owner — authorized callers must see no change in response times or error rates.

## Compliance frameworks

None. The discovery constraints (C1–C6) are operational/security, not regulatory. No external compliance assessment is required before DoR sign-off on any story in this feature (Phases 0–2).

## Accessibility

No new UI introduced in Phases 0–2. Not applicable.

## Backward compatibility

- **Phase 0:** No behavior change for the journey owner; no session shape change
- **Phase 1:** `TENANT_ORG_ALLOWLIST` absent → no org check, single-user mode preserved
- **Phase 2:** `WUCE_TENANT_ROOT_BASE` absent → fall back to static repoRoot resolution (single-tenant mode preserved)
- Legacy journeys (ownerId null) remain accessible to any authenticated user throughout all phases
