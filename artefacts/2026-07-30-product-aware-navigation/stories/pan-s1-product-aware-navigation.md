# Story: List products directly in the sidebar; remove the redundant "Run a Skill" and "Journeys" nav items

**Epic reference:** None — short-track (bounded UX/nav change, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope was validated via an operator-approved design mockup (see Benefit Linkage)
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **an operator navigating between products and their journeys**,
I want **my products listed directly in the left sidebar, with the redundant "Run a Skill" and "Journeys" top-level nav items removed**,
So that **I land on a specific product's own journeys in one click, instead of routing through a generic Home page or a flat cross-product journey list that duplicates what the product's own List/Board view already shows**.

## Benefit Linkage

**Metric moved:** None formal (short-track UX fix, no benefit-metric artefact) — operator-identified navigation friction, validated via an approved design mockup (published artifact `eec7406c-b509-424d-a5b8-2dcb0715935a`, 2026-07-30).
**How:** Two redundancies confirmed by direct investigation of the current codebase: (1) "Run a Skill" (`/skills`) lets an operator launch any skill standalone, completely bypassing the journey/product structure this platform exists to enforce — the one nav path that skips the governed pipeline entirely; (2) "Journeys" (`/journey`) duplicates information already available via each product's own List/Board views (`/products/:id`, already fully built and shell-wrapped), just unscoped and harder to scan — the operator's own words: "journey as a left hand nav is redundant given there's the board and list views". This story removes both as primary nav items and replaces them with a direct, scannable products list in the sidebar.

## Architecture Constraints

- **Extends `src/web-ui/utils/html-shell.js`'s `renderSidebar`/`renderShell`** with a new optional `products` parameter (`Array<{productId, name, journeyCount}>`) and `activeProductId` — when omitted (the default), the sidebar renders exactly as it does today minus the two removed `NAV_ITEMS` entries. This is a deliberate, bounded scope decision: **only 3 call sites are wired with real product data in this story** — `handleGetDashboard` (products.js), `handleGetProductView` (products.js), and `handleGetJourney` (journey.js). The other ~60 `renderShell` call sites across this codebase (skill-session chat views, admin pages, artefact views, roadmap page, etc.) are explicitly NOT touched — they keep today's sidebar unchanged (no products list rendered, since none is passed). Wiring the remaining call sites is a natural follow-up, not silently deferred without note (see Out of Scope).
- **Reuses `handleGetDashboard`'s existing products query** (`SELECT product_id, name, created_at FROM products WHERE tenant_id = $1`, plus its existing per-product `featureCount` computation) — extracted into a small shared helper function rather than duplicated three times.
- **`NAV_ITEMS`** (html-shell.js): the `skills` and `journey` entries are removed from the array entirely — matching this repo's own established precedent for dead/redundant nav-item removal (the earlier `/features`, `/actions`, `/status` removal). The underlying `/skills` and `/journey` routes are **not deleted** — `/skills` remains reachable directly by URL for any existing bookmarks/power-user flows; `/journey` is repurposed (not removed) per AC4 below.
- **No new route for "See all products"** — `/dashboard` already renders exactly this (products list/board, `handleGetDashboard`); the sidebar's "See all products →" link points there directly.
- **`handleGetProductKanban`'s existing bare-fragment kanban renderer is unchanged** — it already renders inside `_renderProductView`'s own List/Board toggle (confirmed via investigation); this story does not touch that internal wiring, only the persistent sidebar around it.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a tenant with 2 or more products, When any of the 3 wired pages (`/dashboard`, `/products/:id`, `/journey`) is loaded, Then the sidebar's Products section lists each product by name with its journey count, and the currently-active product (if any) is visually marked as active.

**AC2:** Given the sidebar's Products list, When an operator clicks a product row, Then they land on that product's own page (`/products/:id`) — already fully built, unchanged by this story.

**AC3:** Given the `NAV_ITEMS` array, When the sidebar is rendered on any page, Then neither "Run a Skill" nor "Journeys" appears as a top-level nav item — confirmed by a structural check of the array itself, not just visual absence on one page.

**AC4 (the "No product" bucket — `/journey`'s repurposed role):** Given `GET /journey`, When the page loads, Then it lists only journeys with no `productId` set (today's flat query changes from "every journey" to "journeys where `product_id IS NULL`"), and the sidebar shows a permanent "No product" entry (with its own journey count) linking to this same page — journeys without a product remain a fully supported, non-error case (e.g. solo/personal-project use), not something this story disallows.

**AC5 (regression guard — unwired pages unaffected):** Given a page that does NOT pass a `products` array to `renderShell` (e.g. `/settings`, `/admin/credits`, a skill-session chat view), When it renders, Then the sidebar shows no Products section at all and every other existing sidebar behaviour (Org board, Settings, Admin credits, user row, impersonation banner) is byte-for-byte unchanged from before this story.

**AC6 (regression guard — journey creation unaffected):** Given the existing "start a new feature" form on `/journey` (no product picker added — per Out of Scope), When a feature is created from this page, Then it is created with no `productId`, exactly as today; features created from within a specific product's own page (`handlePostProductFeature`, already existing and unchanged) continue to set `productId` exactly as today.

## Out of Scope

- Wiring the live products sidebar list into the ~60 other `renderShell` call sites (skill-session chat views, admin pages, artefact views, the roadmap page, etc.) — explicitly deferred; those pages keep today's sidebar unchanged. A natural, separate follow-up once this pattern is proven on the 3 primary pages.
- Adding a product picker to `/journey`'s own "new feature" form — out of scope; that page is now specifically the "no product" bucket, so its creation flow intentionally stays product-less. Moving a feature to a product after creation (if ever needed) is a separate, unscoped capability.
- Any change to `handleGetProductKanban`'s internal rendering, `/org/kanban`, or `/dashboard?view=board` — confirmed unrelated to this story's scope during investigation.
- Pagination or search within the sidebar's Products list for tenants with very many products — the mockup's "See all products →" link to `/dashboard` is the accepted overflow path for this MVP; a tenant with dozens of products may want a more scalable sidebar treatment later.

## NFRs

- **Performance:** The 3 wired pages each gain one additional lightweight query (or reuse an existing one, in `handleGetDashboard`'s case) to fetch the tenant's product list — negligible cost, same query shape already proven in production.
- **Security:** None new — the products query is already tenant-scoped (`WHERE tenant_id = $1`), matching the existing, already-audited pattern.
- **Accessibility:** Product rows in the sidebar are rendered as real `<a href>` elements (keyboard-navigable), matching this repo's own established convention (see `renderFleetPanel`'s own accessibility requirements from the pipeline-viz dashboard).
- **Audit:** None new — no change to what's logged for page views.

## Complexity Rating

**Rating:** 3 — touches a shared, widely-used rendering function (`renderShell`/`renderSidebar`) plus three separate route handlers, with a genuine, deliberate scope boundary (3 wired pages vs ~60 unwired) that must be verified, not just implemented. The underlying data and routes already exist and are well-understood; the complexity is in careful, additive-only wiring across multiple files without regressing the other ~60 call sites.
**Scope stability:** Stable — scope was fully validated via an operator-approved mockup before this story was written.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
