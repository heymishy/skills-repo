# Story: Module-less products get the full grouped/collapsed/filterable features UI, and health counts render in one place, not three

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the operator-reported/live-verified gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **Platform maintainer / product owner scanning a large product's health**,
I want the collapsed-groups, tabs, health-filter chips, and search that `pdt-s1`'s own redesign built to actually apply to my product even when I haven't created any custom Modules for it, and health counts to appear once instead of three times,
So that the redesign's whole point — scanning a 40+ group product in one screenful instead of scrolling past a flat, ungrouped, duplicated dump — is actually true for every product, not only ones an operator has already gone and set up Modules for.

## Benefit Linkage

**Metric moved:** Time to First Actionable Content — the same metric the original `dashboard-triage` epic (`pdt-s1`–`pdt-s4`) targeted. This story closes a real gap in that redesign's own coverage, found via live production verification immediately after the `pst-s1`/`pgft-s1`/`psbf-s1` sync-fix chain finally made `skills-framework`'s own real data visible for the first time.
**How:** Live-verified on `skills-framework.fly.dev` production (2026-09-03), immediately after `psbf-s1`'s fix resolved the sync incident and the product's real 477-story data loaded for the first time. The page showed a single flat, ungrouped list of every item with no collapse, no tabs, no filters, no search — none of `pdt-s1`'s own design. Root cause, confirmed via direct code reading of `_renderConsolidatedFeaturesSection` (`src/web-ui/routes/products.js`): the entire tabbed/grouped/collapsed/filterable UI (`pdt-s1`, plus the underlying `pvc-s1`/`a4`/`bmau-s1` work it built on) is gated behind `modules.length > 0` — a product with zero *custom* Modules created (via the "Add module" control) falls into a much older code path (a bare early-return, predating `pdt-s1` entirely) that renders one flat `<ul>` of every item with none of the redesign's own benefits. `skills-framework` has zero custom Modules, so it never benefited from any of `pdt-s1`'s own work despite being the exact product that motivated it. Separately, the same live verification found the same health-count numbers (e.g. "Warning: 27") rendered in three separate places on one page: the "Overall:" summary line's own per-status breakdown, `pdt-s2`'s own separate triage-strip chip, and (uncounted) the health-filter chip bar inside the features section — real, confirmed duplication, not a subjective aesthetic complaint.

## Architecture Constraints

- Confirmed via code reading: `groupItemsByPhase` (`src/web-ui/modules/product-rollup.js`) has no dependency on custom Modules at all — it groups purely by each item's own `epicName`, already present regardless of module count. `groupItemsByModule` already has a well-defined, already-tested behaviour for zero modules: every item lands in its own `unclassified` bucket (`byModule: [], unclassified: <all items>`), which `_renderModuleSection`'s own existing "Unclassified" rendering path (already used today whenever `byModule.unclassified.length > 0`) already handles correctly. **No changes to `product-rollup.js` are needed** — this story is a template/gating fix in `products.js` only, reusing existing, already-tested grouping and rendering functions exactly as they already behave for zero modules.
- `_renderConsolidatedFeaturesSection`'s current `if (modules.length === 0) { return <flat ul> }` early return (predating `pdt-s1`) is removed — the tabs/filter-bar/collapsed-groups markup renders unconditionally. When `modules.length === 0`: the "By Module" tab shows exactly one collapsed "Unclassified (N)" group (no bulk-assign bar, since there is nothing to assign to yet); "By Phase" becomes the default active tab instead of "By Module" (a lone Unclassified bucket is a materially worse first view than the real phase breakdown a module-less product already has available). When `modules.length > 0`, all existing behaviour (default tab, bulk-assign bar, named module sections) is unchanged.
- Health-count consolidation: the health-filter chip bar already inside `_renderConsolidatedFeaturesSection` (`healthChips`, driving the existing `pvcFilterByHealth` mechanism already reused by every tab) gains real counts per status (e.g. "Warning (27)"), using the same `healthCounts` data already computed once in `_renderProductView` — no new computation. `pdt-s2`'s own separate `triageStripHtml` block is removed; its function (clickable, above-the-list Blocked/Warning triage) is now served by the same enhanced chip bar, which — after this story's own Fix 1 — appears on every product page regardless of module count, not just some. The "Overall:" summary line keeps only its single derived label (e.g. "Overall: ⚠ Warning"); its own redundant per-status breakdown (the four `Healthy: N / Warning: N / Blocked: N / Unknown: N` spans) is removed, since that exact information is now available, with the same counts, on the interactive chip bar directly above the list it filters.
- No new npm dependencies. No database schema change — this is a rendering/template story only.

## Dependencies

- **Upstream:** `pdt-s1`/`pdt-s2`/`pdt-s3` (all merged, DoD-complete) — this story fixes a real coverage gap in that epic's own shipped design, discovered post-merge via live production verification, not a defect introduced by this story's own new code.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a product with zero custom Modules, When the operator loads `/products/:id`, Then the By Module/By Phase/All tabs, the health-filter chip bar, and the search box all render — the same interactive UI a product WITH modules already gets — instead of one flat, ungrouped `<ul>` of every item.

**AC2:** Given a product with zero custom Modules, When the operator views the "By Module" tab, Then it shows exactly one collapsed group titled "Unclassified" with the correct item count and rolled-up health signal, and no bulk-assign bar (there is nothing to assign to yet).

**AC3:** Given a product with zero custom Modules, When the page first loads, Then "By Phase" is the default active tab, not "By Module" — a product WITH at least one custom Module continues to default to "By Module", unchanged from today.

**AC4:** Given the page's health-count information, When it renders, Then each status's count appears in exactly one place: the interactive health-filter chip bar (e.g. "Warning (27)", clickable, filtering the current tab's list) — the separate, non-interactive per-status breakdown previously duplicated on the "Overall:" line is removed, and `pdt-s2`'s own separate triage-strip block is removed.

**AC5:** Given the "Overall:" summary line, When it renders, Then it shows only its single derived label (e.g. "Overall: ⚠ Warning" or "Overall: ✓ Healthy"), with no repeated per-status count breakdown alongside it.

**AC6 (regression guard):** Given a product WITH at least one custom Module, When the operator loads its page, Then the By Module tab's default-active state, its bulk-assign bar, and its named module sections all render exactly as they do today — only the zero-modules case and the health-count consolidation change.

## Out of Scope

- Auto-creating a synthetic "Default" Module for every product — considered and explicitly rejected: it would introduce fake data with no real operator intent behind it, and is strictly redundant with the existing, already-tested "Unclassified" bucket this story reuses instead.
- Any change to how items are assigned to Modules, or the bulk-assign mechanism's own logic (`bmau-s1`) — only whether its bar renders at all when there is nothing to assign to.
- Persisting which tab (By Module/By Phase/All) was last viewed across page reloads — every load uses this story's own default-tab rule (By Phase for zero modules, By Module otherwise), matching `pdt-s1`'s own prior "no persistence" scope decision for collapse state.
- Any change to `computeHealthCounts`, `computeOverallHealthSignal`, or any other rollup-computation function — this story only touches how already-computed counts are rendered and where.

## NFRs

- **Performance:** Negligible — reuses already-computed `healthCounts`/`groupItemsByPhase`/`groupItemsByModule` data; removes one rendering branch (the flat-list early return) rather than adding new computation.
- **Security:** None identified — no new external input, no new attack surface, pure rendering/template change.
- **Accessibility:** The consolidated health-filter chips must remain real, keyboard-operable `<button>` elements (already true today) with their counts included in the same accessible label, not conveyed by a separate, non-focusable text element. The default-active-tab change (By Phase vs By Module) must set `aria-selected`/`role="tab"` state correctly for the tab that is actually active by default, matching the existing tab-switching script's own convention.
- **Audit:** None identified — no new data write.

## Complexity Rating

**Rating:** 2 — the underlying grouping functions already behave correctly for zero modules with no changes needed (confirmed via code reading), but this story coordinates a template change across code paths built by several previously-independent stories (`pdt-s1`, `pdt-s2`, `pvc-s1`, `a4`, `bmau-s1`), so there is real risk of a narrow regression in one of those stories' own existing test coverage if the consolidation isn't precise.
**Scope stability:** Stable.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
