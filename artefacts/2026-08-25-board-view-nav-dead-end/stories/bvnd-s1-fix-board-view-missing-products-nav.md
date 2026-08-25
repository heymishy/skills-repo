## Story: Fix `/dashboard?view=board` silently dropping the Products nav section, stranding users with no way forward

**Epic reference:** none (short-track, single story)
**Discovery reference:** none (short-track — see `CLAUDE.md` short-track flow)
**Benefit-metric reference:** `2026-06-29-beta-entry-experience` (M1 activation) — this is a live-confirmed activation blocker for a real, paying external beta user

**Domain:** wuce / web-ui-navigation

## User Story

As a `wuce` user who lands on `/dashboard?view=board` (via a bookmark, shared link, or the List/Board toggle)
I want the full sidebar navigation (Products list, "See all products," "+ New product") to render exactly as it does on every other page
So that I am never stranded with no way to create a product, view my products, or navigate anywhere else in the app

## Benefit Linkage

Live-confirmed, real-user-blocking bug. A real, paying external beta user (Abhijeet Singh, `abhijeet-qsofte` — see `artefacts/feedback/beta-001/002/005.md` and `workspace/capture-log.md` 2026-08-25 entries) reported being unable to navigate anywhere from `/dashboard?view=board` — screenshot confirmed an empty kanban board with no visible way to create a product or feature. Root-caused directly against source: `handleGetDashboard`'s `?view=board` branch (`src/web-ui/routes/products.js`) calls `renderShell()` without the `products` parameter. `html-shell.js`'s `renderProductsSection()` has a hard early return (`if (!products) return '';`) that omits the ENTIRE Products sidebar section — including "See all products" and the `+` "New product" button — whenever `products` is not supplied. Per `pan-s1`'s own design decision (`artefacts/2026-07-30-product-aware-navigation/decisions.md`), "See all products" (inside that same section) is now **the only remaining route into `/dashboard` or `/products/new`** — the old top-level "Dashboard"/"Home"/"Journeys"/"Skills" nav items were deliberately removed. This makes `?view=board`'s missing `products` param a complete, unrecoverable-from-the-UI dead end for any user who lands there with zero existing products, not just Abhi.

## Architecture Constraints

- Mirror the exact pattern the non-board branch of `handleGetDashboard` already uses (`_renderProductDashboard`'s `renderShell()` call, lines ~171-180 of `products.js`) — call `getProductsNavSummary(_pool, tenantId)` and pass `products: navSummary.products`, `activeProductId: null` (tenant-wide board has no single active product), `noProductJourneyCount: navSummary.noProductJourneyCount` into the board branch's `renderShell()` call.
- Add an empty-board CTA (mirroring `_renderProductDashboard`'s existing "No products yet → Create your first product →" pattern) when the tenant has zero products AND zero no-product journeys — do not invent a new visual pattern.
- Do not change `buildTenantKanbanColumns`, `renderKanban()`, or any per-column empty-state rendering (the `kb-empty`/"—" placeholders) — those are correct and unrelated; the fix is scoped to the missing sidebar wiring plus a whole-board empty-state.
- Do not touch the non-board branch (`_renderProductDashboard`) — it already works correctly and is the reference pattern being mirrored, not something being changed.

## Dependencies

None.

## Acceptance Criteria

**AC1**
Given a tenant with at least one existing product
When a signed-in user requests `GET /dashboard?view=board`
Then the rendered page's sidebar includes the full Products section (product list rows, "See all products," and the `+` "New product" button) — identical in content to what the non-board `/dashboard` path renders for the same tenant

**AC2**
Given a tenant with zero products and zero no-product journeys (a brand-new tenant, matching Abhi's actual state)
When a signed-in user requests `GET /dashboard?view=board`
Then the page shows an explicit empty-state call-to-action ("Create your first product" or equivalent, linking to `/products/new`) in addition to the empty kanban columns — not just empty columns with no path forward

**AC3**
Given the fix is applied
When compared against the non-board branch's existing `renderShell()` call
Then the same `products`/`activeProductId`/`noProductJourneyCount` data-fetching pattern (`getProductsNavSummary`) is reused, not a second, divergent implementation

**AC4**
Given the fix is applied
When the existing kanban board rendering (columns, cards, per-column empty states) is compared before and after
Then it is byte-for-byte unchanged except for the added sidebar/empty-state content — no regression to the board's own rendering

## Out of Scope

- Fixing `beta-002.md`'s separately-flagged two-deployment confusion (`wuce-staging` vs `skills-framework`) — a distinct, already-logged, unresolved question.
- The `POSTHOG_KEY` vs `POSTHOG_KEY_STAGING` naming gap found in the same investigation — unrelated code path, tracked separately in `workspace/capture-log.md`.
- Restoring the removed top-level "Dashboard"/"Home"/"Journeys"/"Skills" NAV_ITEMS entries — `pan-s1`'s removal was a deliberate design decision; this story fixes a bug in that redesign's own execution, not the redesign's premise.
- Investigating why Abhi landed on `?view=board` in the first place (bookmark vs. browser autocomplete vs. a shared link) — not knowable from server-side evidence, and not necessary to close this bug regardless of the cause.

## NFRs

None beyond existing rendering-correctness expectations. No new external dependency, no schema change.

## Complexity Rating

**Complexity:** 1 (well understood — the fix is a direct mirror of an already-working, adjacent code path in the same file)
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] Acceptance criteria are testable
- [x] No architectural decision requiring `decisions.md` (bug fix mirroring an existing pattern, not a new architectural choice)
- [x] No CSS-layout-dependent ACs (the fix is about which elements render, not their visual layout/styling)
- [x] No injectable adapter introduced
