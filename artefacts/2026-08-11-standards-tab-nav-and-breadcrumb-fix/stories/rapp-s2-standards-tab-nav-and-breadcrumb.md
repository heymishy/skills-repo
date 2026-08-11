## Story: Fix the Standards tab's missing sidebar nav and duplicate breadcrumb

**Epic reference:** None — short-track (found via a live operator review of the Standards tab on staging, immediately after the client-org verification sweep)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gaps below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator viewing a product's Standards tab**,
I want **the same left-hand Products/Journeys/Run-a-Skill sidebar every other product page has, and a single, correct breadcrumb instead of two that say the same thing**,
So that **I can navigate away from the Standards tab without using the back button, and the page looks finished rather than half-wired**.

## Benefit Linkage

**Metric moved:** Direct UX-defect fix (short-track, no formal benefit-metric artefact) — found live by the operator: "that standards button looks incomplete." Investigation (this session) confirmed and precisely diagnosed two distinct bugs:

1. **Missing products-nav sidebar.** `handleGetProductStandardsTab` never adopted `pan-s1`'s products-nav wiring — calling `_renderStandardsTab` without a `products` argument. `renderShell`'s `renderProductsSection()` treats `products: undefined` as "render nothing," so the whole Products/Journeys/Run-a-Skill sidebar section is empty on this one tab while present on every sibling tab (Roadmap, Kanban). Same root cause and same fix as `jcn-s1`'s journey-page nav gap.
2. **Duplicate breadcrumb.** `_renderStandardsTab`'s own body manually rendered a `'<a href="/products/'+productId+'">'+productName+'</a> &rsaquo;'` link, while ALSO passing `crumbs: [productName, 'Standards']` to `renderShell` — which renders its own real, visible `.sw-crumbs` breadcrumb bar from that same data. Both rendered the identical "productName" text, one directly above the other.

**How:** (1) Compute `navSummary` via the existing `getProductsNavSummary(pool, tenantId)` helper in `handleGetProductStandardsTab`, exactly as the canonical caller pattern (`_renderProductView`'s handler) already does, and thread `navProducts`/`noProductJourneyCount` into `_renderStandardsTab`. (2) Remove the manual breadcrumb `<div>` from `_renderStandardsTab`'s body, keeping only the `<h1>Standards</h1>` heading — the real `.sw-crumbs` bar (via `crumbs: [productName, 'Standards']`) already provides the navigation context.

## Architecture Constraints

- **No new persistence or query mechanism** — `getProductsNavSummary` already exists and is already correctly used by three other handlers (`_renderProductView`, `handleGetJourneyStageView`, `handleGetJourneyComplete`). This story only wires it into a fourth call site that was missed.
- **`activeProductId` is the current product's own id** — Standards is a genuinely product-scoped page (unlike journey pages, which pass `null`), matching `_renderProductView`'s own convention.
- **Roadmap's identical duplicate-breadcrumb pattern is explicitly NOT touched here** — `_renderRoadmapTab` has the same manual-link-plus-crumbs-prop duplication, found during this story's investigation, but fixing it is out of scope (see below) to keep this story narrowly scoped to the operator's actual complaint.

## Dependencies

- **Upstream:** `pan-s1` (products-nav sidebar mechanism), `smug-s1` (the Standards tab itself, merged) — both already shipped; this story only completes `smug-s1`'s handler wiring.
- **Downstream:** None known. Directly relevant background for the separate, larger "architectural guardrails" outer-loop feature being scoped next — that feature will build a real standards-creation UI on top of this now-correctly-wired tab.

## Acceptance Criteria

**AC1:** Given a product with other products existing in the tenant, When the Standards tab is rendered, Then the response HTML contains the other products' real names in the sidebar nav section.

**AC2:** Given the Standards tab is rendered, When inspected, Then a "See all products" link pointing at `href="/dashboard"` is present, matching every other product-page sidebar.

**AC3:** Given a tenant with zero other products, When the Standards tab is rendered, Then the nav section renders its real empty state — no fabricated product data.

**AC4:** Given the Standards tab for product P, When rendered, Then the current product P appears as a real, clickable nav entry (`/products/P`) — confirming `activeProductId` is wired to the current product, not `null`.

**AC5:** Given the Standards tab is rendered, When inspected, Then exactly one `.sw-crumbs` breadcrumb bar is present, the product name appears exactly once (inside that bar), and the previously-duplicated manual breadcrumb link (its distinctive `&rsaquo;` separator) is gone.

**AC6:** Given the Standards tab is rendered, When inspected, Then the `<h1>Standards</h1>` page heading is still present (removing the duplicate breadcrumb must not remove page-title context entirely).

**AC7:** Given the existing JSON API branch of `handleGetProductStandardsTab` (`res.json` present, used by non-HTML test callers), When invoked, Then its response is unaffected by the HTML-only nav/breadcrumb wiring — regression guard.

## Out of Scope

- **Fixing `_renderRoadmapTab`'s identical duplicate-breadcrumb pattern** — found during this story's investigation, confirmed to be the same bug shape, but not part of the operator's reported complaint. Flagged here as a known follow-up candidate, not silently expanded into this story's scope.
- **Standards creation UI** ("No standards yet — create one via the API" messaging) — confirmed via `smug-s1`'s own story to be deliberate MVP scoping, not a bug. Directly relevant to the separate, larger architectural-guardrails outer-loop feature requested alongside this fix, but not addressed here.
- **Any change to the promote/opt-out HTTP handler contracts** (`standards.js`'s existing routes) — unaffected by this story's changes.

## NFRs

- **Correctness:** The nav data rendered must be the real, current tenant's product list — no caching or staleness beyond what `getProductsNavSummary`'s existing query behavior already provides (unchanged by this story).
- **No regression to `smug-s1`'s existing Standards-tab behavior** — the promote/opt-out list rendering, JSON API branch, and existing `check-smug-s1-standards-tab-and-query-fix.js` suite must remain green, unmodified.

## Complexity Rating

**Rating:** 1 — a single, well-understood fix mirroring an already-proven pattern (`jcn-s1`'s own products-nav wiring fix), touching one handler and one render function.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
