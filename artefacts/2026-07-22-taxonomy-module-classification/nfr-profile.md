# NFR Profile: Taxonomy-to-Module Classification

**Feature:** 2026-07-22-taxonomy-module-classification
**Created:** 2026-07-22
**Last updated:** 2026-07-22
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Assignment-map fetch | Exactly 1 query per product render, regardless of feature count | Query-count assertion in test (U1) | tmc-s1 |
| Bulk-assign round trip | Exactly 1 query regardless of batch size (tested at 2 and 250 slugs) | Query-count assertion in test (U2) | tmc-s1 |
| Product view render with module grouping | No order-of-magnitude slowdown vs. today's existing taxonomy render (a4's own budget: under 2 seconds for a 150-story, 48-epic product) | Manual timing on `wuce-staging`, same baseline environment a4 used | tmc-s1 |

**Source:** Operator's own explicit framing for this story ("scale to multi tenants, multi products orgs that have products with 100s of features and 100s of users") plus a4's existing product-view render budget in `2026-07-21-web-ui-experience-redesign/nfr-profile.md`.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| Tenant scoping | Every `feature_module_assignments` query/mutation scoped by `(product_id, tenant_id)` — no cross-tenant read or write | ADR-025 (multi-tenancy at the application layer, same as a1/a2) | tmc-s1 |
| CSRF preservation | New bulk-assign route uses the existing `csrfGuard` middleware, same as every other module-mutating route (a1's own fix-forward) | Existing `generateCsrfToken`/`csrfField`/`csrfGuard` mechanism | tmc-s1 |
| XSS prevention | Feature slugs and module names rendered through `_escapeHtml`, same convention as a1/a4 | Existing repo-wide convention | tmc-s1 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (feature/module classification data, no PII).

**Source:** This repo's own established security conventions (ADR-025 tenant scoping, CSRF guard, `_escapeHtml`) — no external OWASP/regulatory standard named, `context.yml` confirms `regulated: false`.

---

## Scale / Multi-tenancy

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Feature volume per product | Correct, non-degrading behaviour at 100s of features per product (tested at 300) | Unit test fixture size (U1, U2) | tmc-s1 |
| Bulk classification | Operator can classify a large batch of features in one action, not one-by-one | AC3, tested at 250-slug batch | tmc-s1 |
| Cross-tenant isolation | Zero read or write leakage between tenants, even when a caller supplies another tenant's `product_id` | Dedicated isolation test (IT2/IT3), same bar as `tests/check-bri-s3.4-cross-tenant-isolation.js` | tmc-s1 |
| Applies generically to any product | The join mechanism (keyed by `product_id` + stable `feature_slug`) works identically for any product with a connected repo — not a one-off fix scoped to a single product | Verified by design (no product-specific logic anywhere in the adapter/render join) | tmc-s1 |

**Source:** Direct operator instruction: "it must cater to NFRs, scale to multi tenants, multi products orgs that have products with 100s of features and 100s of users."

---

## Data residency

| Requirement | Region / boundary | Regulatory basis | Applies to story |
|-------------|------------------|-----------------|-----------------|
| N/A | N/A | Not applicable — `regulated: false`, no named compliance framework | N/A |

---

## Availability

| NFR | Target | Measurement window | Notes |
|-----|--------|--------------------|-------|
| N/A | Not defined | N/A | No dedicated uptime SLA beyond the existing `wuce-staging`/production Fly.io deployment |

---

## Compliance

| Framework / regulation | Relevant clause(s) | Obligation | Applies to story |
|-----------------------|-------------------|-----------|-----------------|
| None | N/A | N/A | N/A |

**Named sign-off required?**
- [x] Not required — `context.yml` confirms `regulated: false`.

---

## Gaps and open questions

| NFR area | Gap | Owner | Due |
|----------|-----|-------|-----|
| Performance (UI-layer at extreme scale) | Rendering an "Unclassified" bucket with 1000+ items has no pagination/virtualization plan — explicitly deferred in the story's Out of Scope | Hamish King (Founder/Operator) | Revisit if any real product's feature count grows an order of magnitude beyond the 100s-scale target this story covers |

_All other NFR areas have no open gaps as of 2026-07-22._
