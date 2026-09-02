## Story: Fix the Story-Detail Dead End With a Breadcrumb and Back Link

**Epic reference:** artefacts/2026-09-02-product-dashboard-triage/epics/dashboard-triage.md
**Discovery reference:** artefacts/2026-09-02-product-dashboard-triage/discovery.md
**Benefit-metric reference:** artefacts/2026-09-02-product-dashboard-triage/benefit-metric.md

## User Story

As a **Platform maintainer / product owner**,
I want a story's detail page to show a breadcrumb back to its product and phase/epic,
So that clicking into a story never leaves me at a dead end with no way back.

## Benefit Linkage

**Metric moved:** Time to First Actionable Content
**How:** A dead-end detail page with no way back costs an operator real time re-navigating (browser back, re-finding the product, re-scrolling to the same item) — the same "time to reach actionable content" the metric already tracks, measured after a click rather than before one. Confirmed live: clicking a story today can land on a bare `/features/dic.5` page reading only "No artefacts found for this feature," with no context at all.

## Architecture Constraints

- **[Revised after /review, confirmed via code reading]** `/features/:id` (`handleGetFeatureArtefacts`, `src/web-ui/routes/features.js`) takes only the slug from the URL — there is no upstream referrer/context passed through today; the route is directly bookmarkable/shareable and must resolve everything itself.
- **Product segment — already trivially available:** `journeyForPage = _journeyStore.getJourneyByFeatureSlug(featureSlug)` already resolves `journeyForPage.productId` (the same field `alrf-s10`'s own delete-redirect logic already uses) — no new lookup needed for this part of the breadcrumb.
- **Phase/Epic segment — genuinely new work:** a story-level identifier (e.g. `dic.5`, `pmf.1`) is not itself a `journeyStore` feature slug — it's a story ID nested inside some other feature's `epics[].stories[]` in `pipeline-state.json`. `getJourneyByFeatureSlug` does not resolve this case (confirmed live: navigating directly to `/features/dic.5` returns "No artefacts found" with `journeyForPage` unresolved). Resolving "which feature/epic does story ID X belong to" requires a genuinely new reverse lookup across `pipeline-state.json`'s `features[].epics[].stories[]` tree — there is no existing mechanism for this today.
- No new npm dependencies.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a story's feature slug resolves to a real journey with a `productId` (the common case — top-level features created via a product), When the operator loads its detail page, Then it shows a breadcrumb reading "Product Name › Story ID", using the already-available `journeyForPage.productId`.

**AC1a [Added after /review — Phase/Epic is separately-resolvable work, not bundled into AC1's guarantee]:** Given a story is a nested story ID within some other feature's `epics[].stories[]` (e.g. `dic.5`), When its detail page loads, Then the breadcrumb includes the resolved Phase/Epic name if a reverse lookup finds it, or gracefully omits that segment (falling back to AC1's Product-only breadcrumb, or a bare "Back to product list" link if even the product can't be resolved) — never a silent failure or a broken/blank breadcrumb.

**AC2:** Given the breadcrumb is showing a Product segment, When the operator clicks the product name in it, Then they are taken back to that product's page.

**AC3:** Given a story genuinely has no artefacts yet, When its detail page loads, Then it still shows whatever breadcrumb segments ARE resolvable (per AC1/AC1a) and an honest "No artefacts found for this feature yet" message — never a bare, context-free page as it does today.

## Out of Scope

- Redesigning the artefact-content display itself once a story does have real artefacts to show — only the missing breadcrumb/back-link and the bare-dead-end case are in scope.

## NFRs

- **Performance:** None identified — the parent context is already resolved upstream of this route.
- **Security:** None — no new data is exposed beyond what's already shown on the product page this story was reached from.
- **Accessibility:** Breadcrumb links must be keyboard-navigable, with clear focus states.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 2 [Revised after /review, was 1 — the Phase/Epic breadcrumb segment requires genuinely new reverse-lookup logic across pipeline-state.json, not just threading through already-available context]
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->
