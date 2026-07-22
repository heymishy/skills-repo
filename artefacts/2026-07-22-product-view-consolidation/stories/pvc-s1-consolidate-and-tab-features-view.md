# Story: Consolidate the product view's two module-grouped sections into one, with By Module / By Phase / All tabs and health/search filtering

**Epic reference:** None — short-track (per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`), direct follow-on from tmc-s1 and the original a4/Epic A (Product View Redesign) work.
**Discovery reference:** None — short-track skips discovery; root cause confirmed by direct operator observation of the deployed staging page this session.
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below.

## Background

After tmc-s1 shipped, the product view renders **two separate "grouped by module" sections** on the same page, back to back:
1. tmc-s1's taxonomy-based section ("Features by module") — built from the product's real, GitHub-synced ~115 features (`product_rollups.taxonomy`), correctly showing all 9 modules and an Unclassified bucket.
2. a4's original journeys-based section (unlabelled, bottom of page, showing `▾`-collapsible module rows) — built from the `journeys` table, which for `skills-framework` holds only 2 stray placeholder rows (`new-feature-aa349dd1`, `new-feature-f3765c1a`).

Both sections render the same 9 modules, back to back, driven by two different underlying data sources the operator has no reason to know are different. This reads as broken/duplicated even though each section is individually correct. Additionally, the product view has never implemented the tabbed/filtered UI from the original product-view design exploration (an Artifact mockup reviewed earlier this epic, never built as real app code) — the shipped a4/tmc-s1 rendering is a flat expand/collapse list only, with no way to switch between "by module," "by phase" (the pre-existing epic/phase grouping), or a flat "all" view, and no way to filter by health status or search by name.

## User Story

As **an operator viewing a product with a connected repo and curated modules**,
I want **one consolidated features section — combining both real synced features and any in-flight, not-yet-synced features — with tabs to view it grouped by module, by phase, or as a flat list, and filters to narrow by health status or search text**,
So that **the page shows one coherent, navigable view of "everything about this product's features," not two visually-identical-but-differently-sourced sections that look like a bug**.

## Benefit Linkage

**Metric moved:** Usability/legibility of the product view shipped across Epic A + tmc-s1 — the current duplicated rendering directly undermines operator trust in the feature (the operator's own reaction: "doesn't seem correct").
**How:** Removing the duplication and adding real navigation (tabs) and narrowing (filters) makes the single most information-dense page in the app usable at the 100+ feature scale this platform is explicitly built for, rather than requiring the operator to scroll past two near-identical, confusingly-separate module listings plus a still-separate, coincidentally-named Test Coverage "Epics" breakdown.

## Architecture Constraints

- Checked against `.github/architecture-guardrails.md` — no conflicting ADR found.
- Reuses this app's own already-proven tab pattern exactly: `settings.js`'s `sw-settings-tabs`/`sw-settings-tab`/`sw-tab-panel` CSS classes and `swShowSettingsTab(name)` JS function (c1 story). This story's tabs use distinctly namespaced classes (`pvc-tab*`) and its own JS function (`pvcShowTab`) to avoid any collision if both pages are ever open in the same document context, but follow the identical visual/interaction convention — not a new tab pattern invented from scratch.
- Data merge, not data replacement: `journeys` and `product_rollups.taxonomy` remain two separate underlying tables/sources exactly as today (no schema change) — this story only merges them at the *render* layer into one item list, deduplicated by `feature_slug`, with taxonomy's richer metadata (name, epicName, discoveryArtefact) taking precedence when the same slug exists in both sources.
- Reuses tmc-s1's existing `feature_module_assignments` map and `modules` list — no new persistence.
- Follows a4's existing collapsible-module-section markup/JS (`_renderModuleSection`, `a4ToggleModule`) for the "By Module" tab panel rather than inventing new collapse behaviour.

## Dependencies

- **Upstream:** a1 (modules CRUD), a4 (module-grouped rendering + health/coverage enrichment), tmc-s1 (`feature_module_assignments`, `groupTaxonomyByModule`) — all merged and in production.
- **Downstream:** None yet.

## Acceptance Criteria

**AC1 (single consolidated section, no duplication):** Given a product with both taxonomy-sourced features and journeys-sourced features, When the product view renders, Then exactly ONE features section appears on the page (not two) — the pre-existing separate a4 journeys-module-section and tmc-s1 taxonomy-module-section are both removed and replaced by one consolidated section — verified by a test asserting the rendered HTML contains each module name exactly once as a section/tab-related heading, not twice.

**AC2 (merge by feature_slug, taxonomy takes precedence for metadata):** Given a feature_slug exists in both `journeys` and the synced taxonomy, When the merged item list is built, Then exactly one item appears for that slug, using the taxonomy item's name/epicName/discoveryArtefact (the richer, synced metadata) while still surfacing the journey's own stage if present — verified by a test with an overlapping slug in both sources.

**AC3 (journeys-only items surface too):** Given a feature_slug exists only in `journeys` (not yet synced to the taxonomy), When the merged item list is built, Then that item still appears in the merged list, tagged with its journey stage — verified by a test with a journeys-only slug (e.g. a placeholder like the real `new-feature-aa349dd1`/`new-feature-f3765c1a` rows).

**AC4 (By Module tab, default):** Given the consolidated item list, modules, and the feature-module assignment map, When the product view renders, Then the "By Module" tab is selected by default and shows one collapsible section per module (even empty ones, matching a4's existing convention) plus an Unclassified bucket — reusing tmc-s1's `groupTaxonomyByModule`-equivalent bucketing logic, generalized to operate on the merged item list instead of raw taxonomy groups/ungrouped.

**AC5 (By Phase tab):** Given the consolidated item list, When the operator switches to the "By Phase" tab, Then items are grouped by their epic/phase name (the pre-existing epic-grouping convention), with an "Other features" bucket for items with no epic — matching the pre-tmc-s1 taxonomy Epics/Other-features grouping shape, but now covering the merged (taxonomy + journeys) item set, not just taxonomy.

**AC6 (All tab, flat list):** Given the consolidated item list, When the operator switches to the "All" tab, Then every item appears exactly once in a single flat list with no grouping — verified by a count-parity test (All tab's item count equals the sum of every module/phase bucket's item count, with no double-counting).

**AC7 (health filter):** Given a set of health-status filter chips (All / Healthy / Warning / Blocked / Unknown), When the operator selects one, Then only items matching that health status remain visible across whichever tab is currently active — implemented client-side (no server round-trip), verified by a test asserting the rendered HTML includes the filter chip markup and each item row carries a `data-health` attribute the filter script can match against.

**AC8 (search filter):** Given a search input above the tab content, When the operator types text, Then only items whose slug or name contains that text (case-insensitive) remain visible — implemented client-side, verified by a test asserting the search input and each item row's `data-search` attribute (lowercased slug+name) are present in the rendered HTML.

**AC9 (zero-module fallback preserved):** Given a product with zero modules created, When the product view renders, Then the page shows the same pre-tmc-s1 flat/simple fallback behaviour (no tabs, no module concept introduced) — this story does not change the zero-modules experience tmc-s1 and a4 already established.

## Out of Scope

- Any change to the Test Coverage breakdown's own "Epics" heading/grouping (`_renderGroupedCoverageBreakdown`) — that is a separate, pre-existing feature (pr-s7) that coincidentally shares a heading name; not touched by this story.
- Server-side filtering/pagination — filters operate client-side over the already-rendered DOM; if a product's feature count grows enough that this becomes a real performance concern, that's a separate future story (already flagged as a known scale gap in tmc-s1's decisions.md).
- Any new left-hand navigation or Settings-page changes — the earlier design exploration also covered nav/Settings, but this story is scoped to the product view's features section only.
- Any change to the module CRUD UI (`_renderModulesManagement`) itself — untouched.

## NFRs

- **Performance:** Client-side filtering only; no new server round-trips. Rendering the merged/grouped item list server-side is a linear pass over the same data already fetched today — no new queries added beyond what tmc-s1 already introduced.
- **Accessibility:** Tabs use `role="tablist"`/`role="tab"`/`aria-selected`, matching the exact convention already used and verified in `settings.js`'s Settings page. Filter chips are real `<button>` elements (keyboard-operable), not divs with click handlers.
- **Security:** No new mutating routes — this is a pure rendering consolidation. Existing `_escapeHtml` convention applied to all item names/slugs.
- **Scale:** Verified with a 100+ item merged list fixture (matching tmc-s1's own 100s-of-features NFR bar) to confirm the grouping/tab logic doesn't degrade or mis-render at realistic scale.

## Complexity Rating

**Rating:** 2 — some ambiguity in exactly how to merge/dedupe two previously-independent render paths, but the pattern (tabs, filters, module bucketing) either directly reuses (tabs) or generalizes (bucketing) code already proven elsewhere in this repo.
**Scope stability:** Stable — bounded by the ACs above; explicitly excludes server-side filtering and nav/Settings changes.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
