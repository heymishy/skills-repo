# NFR Profile: Web UI Experience Redesign — Product View, Navigation, Settings, and Admin Impersonation

**Feature:** 2026-07-21-web-ui-experience-redesign
**Created:** 2026-07-21
**Last updated:** 2026-07-21
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Module CRUD response time | Under 500ms for a product with up to 200 epics | Manual timing at DoD | a1 |
| Module reassignment reflect time | Under 200ms | Manual timing at DoD | a2 |
| Per-feature health computation | Same sync-time budget as existing aggregate — no order-of-magnitude slowdown | `/product-sync` timing before/after comparison | a3 |
| Product view initial render | Under 2 seconds for a 150-story, 48-epic product | Manual timing on `wuce-staging` (this session's own established baseline environment) | a4 |
| Roadmap artefact scan | Under 1 second for up to 100 feature folders | Manual timing | a5 |
| Settings/Billing/Credits page loads | Same budget as other shell-wrapped pages — no new concern | Manual timing | c1, c2, c3 |
| Impersonation session start | Under 1 second | Manual timing | d1 |
| Audit list load | Under 1 second for up to 1,000 historical sessions | Manual timing | d3 |

**Source:** Story ACs (this feature has no product-level performance SLOs defined in `product/constraints.md` beyond what's stated per-story above)

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Tenant scoping | Module records and reassignments scoped by `product_id`/`tenant_id` — no cross-tenant visibility | ADR-025 (multi-tenancy at the application layer) | a1, a2 |
| XSS prevention | All operator-authored content (module/epic names) passed through `_escapeHtml` before rendering | This repo's own established convention, applied throughout `products.js` | a1, a4 |
| CSRF preservation | Existing CSRF token flow (`sec-perf-s3`) preserved exactly through the Credits tab restyle | Existing `generateCsrfToken`/`csrfField` mechanism | c3 |
| Canonical session field | `req.session.accessToken` only, never `.token` | CLAUDE.md's own established repo-wide grep check | d1 |
| Effective-role visibility | Every admin-gated surface (existing and new) checks the impersonated session's effective role, never the real admin's underlying role | Discovery's flagged highest risk; this feature's core security property | d2, d4 |
| Session-swap integrity | No residual real-admin state survives into an impersonated session; no residual target-user state survives after exit; no inconsistent state under concurrent requests during the swap | Verified by explicit review, not test coverage alone | d1, d2, d4 |
| Admin-only API gating | Audit log and all admin-only routes rejected server-side for non-admins, not just hidden client-side | Existing `requireAdmin` convention | b2, c3, d3 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (product/epic/module data, account settings)
- [x] Confidential — the impersonation audit log records real admin/user identity pairs and reasons; treated as confidential, admin-visible only

**Source:** This repo's own established security conventions (`req.session.accessToken` canonical field rule, `requireAdmin` gating, ADR-025 tenant scoping) — no external OWASP/regulatory standard named, since `context.yml` confirms `regulated: false`.

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| N/A | N/A | Not applicable — this platform has no data residency requirement (`regulated: false`, no named compliance framework) | N/A |

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| N/A | Not defined | N/A | This feature has no dedicated uptime SLA beyond the existing `wuce-staging`/`skills-framework` Fly.io deployment's own established availability characteristics |

**Source:** Not defined — no SLA agreement exists for this solo-operator platform.

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| None | N/A | N/A | N/A |

**Named sign-off required?**
- [x] Not required — `context.yml` confirms `regulated: false`, no compliance framework applies.

_Note: while no formal compliance sign-off is required, D4's NFR-security review functions as the equivalent internal gate for Epic D specifically, per discovery's own flagged risk. This is a risk-management sign-off, not a compliance one._

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Security (Epic D) | The exact session-swap mechanism has not been designed at the code level as of /definition — d1's Architecture Constraints flag this as an implementation-blocking investigation | Hamish King (Founder/Operator) | Before d1 implementation begins |
| Performance (a3) | The real source signal for per-feature health has not been confirmed at the code level — a3's own investigation may reveal additional performance considerations once the actual computation is understood | Hamish King (Founder/Operator) | Before a3 implementation begins |

_All other NFR areas have no open gaps as of 2026-07-21._
