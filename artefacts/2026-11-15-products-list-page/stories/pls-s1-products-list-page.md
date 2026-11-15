## Story: Add a products list page so "See all products" shows all products

**Epic reference:** None - short-track (bounded product gap found by the operator in live use, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery; scope stated directly below. Parent: the product-aware navigation work (story pan-s1, artefacts/2026-07-30-product-aware-navigation/), which pointed "See all products" at `/dashboard` as Home's replacement. Found 2026-11-15: the operator clicked "See all products" and landed on the dashboard instead of a list of products.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As **a signed-in person with one or more products**,
I want **the "See all products" link to open a page that lists all of my products**,
So that **I can see and open any product (including one that is not the active one) without hunting through the dashboard**.

## Benefit Linkage

**Metric moved:** None formal - short-track convention. Closes a navigation gap: the link's label promises a product list, but it goes to `/dashboard` (src/web-ui/utils/html-shell.js lines 106-114), which is the home page; clicked while already on the dashboard it appears to do nothing. There is no standalone `/products` list route (`server.js` has only `/products/new` and `/products/:id...`).
**How:** add `GET /products`, a tenant-scoped list of the person's products (name, feature count, last updated), each linking to the existing product page, and point the link at it.

## Architecture Constraints

- **Same data as the sidebar and dashboard.** Use `getProductsNavSummary(pool, tenantId)` (src/web-ui/routes/products.js), which is already tenant-scoped (`WHERE tenant_id = $1`). Do not write a new query; this keeps the list consistent with the sidebar and dashboard.
- **Use the shared shell the repo requires.** Render through `renderShellWithNav` (CLAUDE.md "Reference implementation (web-ui shared shell)"; web-ui-patterns.md calls forgetting it the most common web-ui defect), with `active: 'products'` and the sidebar intact.
- **Design system.** Story has `hasDesignSystemTrack: true`: reuse the existing product-card markup and DESIGN.md tokens (`artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md`); no hard-coded colours. Layout is reused from the dashboard cards, so layout-dependent verification is a documented manual check classified at DoR (CLAUDE.md B2).
- **Tenant isolation (ADR-025).** A product belonging to another tenant must never be listed or linked; a test with two tenants proves it.
- **Existing tests that pin the old target change deliberately.** Any test asserting `See all products` links to `/dashboard` is updated in the same change. The List/Board toggle row stays pointing at `/dashboard` and `/dashboard?view=board` (the dashboard's own views), unchanged.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-025 (multi-tenancy at the application layer) is engaged as above; ADR-011 (artefact-first) is satisfied by this story's own chain; no other Active ADR is engaged.
- **Zero new npm dependencies.**

## Dependencies

- **Upstream:** pan-s1 and the products module (merged). None other.
- **Related, not blocking:** the operator reports the skills-framework product no longer appears in their product list. If its `tenant_id` no longer matches the session tenant, this list page shows the same absence; that is a data/tenant question investigated separately (read-only check, operator approval first) and tracked in decisions.md of this feature.

## Acceptance Criteria

**AC1:** Given a signed-in person whose tenant has products, When they open `GET /products`, Then the page lists every product of that tenant (name, feature count, last updated), each linking to its product page (`/products/<id>`).

**AC2:** Given a person whose tenant has no products, When they open `GET /products`, Then the page shows an empty state with a "Create your first product" link to `/products/new` (the same wording and target as the dashboard's empty state).

**AC3:** Given two tenants each with products, When a person from tenant A opens `/products`, Then no product, id or name from tenant B appears anywhere in the response.

**AC4:** Given the shared sidebar, When any page renders "See all products", Then it links to `/products` (not `/dashboard`); the List and Board sub-links still go to `/dashboard` and `/dashboard?view=board`.

**AC5:** Given an unauthenticated request, When `GET /products` is made, Then it is handled like other authenticated pages (redirected to login), not served.

**AC6:** Given the new page, When the sidebar renders on it, Then the Products section is present (the page was rendered through the shared shell), with "See all products" marked active.

**AC7 (live, after deploy):** Given the operator's session on production, When they click "See all products", Then the products page opens and lists the products their tenant owns. Evidence class `production-observed`.

## Out of Scope

- Changing the dashboard, the List/Board toggle or the product page itself.
- Investigating or repairing the "skills-framework product missing" report (separate read-only check, below).
- Search, sort, filter or paging of the list (a handful of products per tenant today).
- Plan limits or product creation changes.

## NFRs

- **Security:** tenant-scoped via the existing helper; HTML-escape product names (use the repo's existing escape helper); no other tenant's data in the response.
- **Performance:** `getProductsNavSummary` does one query per product for journey counts; fine for a handful of products, and the same cost the sidebar already pays on every page.
- **Accessibility:** semantic list/links, the same keyboard behaviour as the dashboard cards.

## Complexity Rating

**Rating:** 2 - small, but touches the shared shell link, a new route, and existing nav tests.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic