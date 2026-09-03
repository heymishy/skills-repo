# Story: Grouped item rows show the parent feature's own name instead of repeating the epic group header, and the epic-grouped view becomes the default when a product has more than one epic

**Epic reference:** None — short-track (bug fix + small enhancement, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the operator-reported/live-verified defect below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **Platform maintainer browsing a product page's grouped feature list**,
I want **each item row to show which feature it belongs to, not a repeat of the epic group header already above it, and the epic-grouped view to be the default whenever a product genuinely has more than one epic**,
So that **the list reads as useful, non-redundant information instead of the same phrase repeated on every row, and multi-epic products lead with their real structure by default**.

## Benefit Linkage

**Metric moved:** Time to First Actionable Content — the same metric `dashboard-triage` (`pdt-s1`–`pdt-s4`) and `ppg-s1` targeted, closing a second, distinct redundant-info gap in the same grouped list view `ppg-s1` fixed the module-gating for.
**How:** Live-verified on `skills-framework.fly.dev` production (2026-09-03/04) immediately after `fal-s1` made epic-nested stories' artefact pages reachable for the first time. Viewing the `cli-deterministic-governance` feature's "By Phase" tab showed the epic group header "Phase 2 — skills advance, web UI gate enforcement, and chain-hash trace (5) ✓ Healthy", followed by 5 child story rows (`cdg.3`–`cdg.7`), each one individually repeating the identical "Phase 2 — skills advance, web UI gate enforcement, and chain-hash trace" text as its own sub-label — the exact same phrase shown once already in the group header directly above them. Root cause, confirmed via direct code reading: `_renderPvcItemRow` (`src/web-ui/routes/products.js` line 303) computes `subLabel = item.stage || item.epicName || ''` — a sensible fallback in an ungrouped context (no group header exists to be redundant against), but inside the "By Phase" grouped tab specifically, the group header itself already shows that exact `epicName`, so every child row repeating it is pure duplication. Separately, `_renderConsolidatedFeaturesSection`'s own `defaultTab` logic (`ppg-s1`) chooses "By Module" vs "By Phase" based solely on custom-Module count, never epic count — so a product with several real epics but also some custom Modules lands on "By Module" by default, where epic structure isn't shown at all unless the operator manually clicks the "By Phase" tab.

## Architecture Constraints

- **Fix 1 — `computeTaxonomyRollup` (`src/web-ui/modules/product-rollup.js`):** the epic-nested item mapping gains a new `featureName: feature.name` field, alongside the existing `slug` and `featureSlug` (added by `fal-s1`). No change to the existing `slug`/`featureSlug` fields or any other function in this file. `groupItemsByPhase` requires no change — it pushes each item object through unchanged, so the new field survives bucketing automatically (confirmed via direct code reading).
- **Fix 2 — `_renderPvcItemRow` (`src/web-ui/routes/products.js`):** gains a third, optional parameter (`preferFeatureName`); when truthy, `subLabel` becomes `item.stage || item.featureName || ''` instead of `item.stage || item.epicName || ''`. Existing 2-argument call sites (`By Module`, `All` tabs, and every existing test calling `_renderPvcItemRow(item)` or `_renderPvcItemRow(item, includeCheckbox)`) are unaffected — the new parameter defaults to falsy, preserving today's exact `epicName`-fallback behaviour everywhere except the one call site changed below.
- **Fix 3 — `_renderConsolidatedFeaturesSection`'s own `byPhaseHtml` construction:** the two `.map(...)` calls that currently pass `_renderPvcItemRow` directly (line 430–431) are changed to pass a thin wrapper (`_renderPvcItemRowForPhase`, matching the existing `_renderPvcItemRowWithCheckbox` convention) that calls `_renderPvcItemRow(item, false, true)`. No other tab's row rendering changes.
- **Fix 4 — `defaultTab` logic:** changes from `modules.length === 0 ? 'phase' : 'module'` to consider the already-computed `byPhase.byPhase.length` (no new computation — reuses the existing `groupItemsByPhase` call already made earlier in the same function): `byPhase.byPhase.length > 1 ? 'phase' : (modules.length === 0 ? 'phase' : 'module')`. Epic-group count takes priority over module count; the existing module-count-based fallback is otherwise unchanged for the ≤1-epic-group case.
- No new npm dependencies. No database schema or query change — `feature.name` is already present in `pipeline-state.json` and already read into memory by `computeTaxonomyRollup`'s own existing `feature.forEach` loop.

## Dependencies

- **Upstream:** `fal-s1` (added `featureSlug` resolution to the same rollup function this story extends; merged, DoD-complete), `ppg-s1` (introduced `defaultTab` and the By Phase tab's own grouped rendering; merged, DoD-complete), `shb-s1` (established the `featureSlug`-onto-item convention this story's `featureName` field follows the same pattern as; merged, DoD-complete).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the "By Phase" (epic-grouped) tab, When an epic group contains one or more items, Then each item row's sub-label shows the item's parent feature's own name — not the epic name already shown in that group's own header directly above.

**AC2 (regression guard):** Given the "By Module" tab or the "All" tab, When an item row renders, Then its sub-label behaviour is completely unchanged from today (`item.stage || item.epicName || ''`) — this story only changes the "By Phase" tab's own row rendering.

**AC3:** Given a product whose real, computed epic-group count (`groupItemsByPhase`'s own `byPhase.byPhase.length`) is greater than 1, When the product page renders, Then "By Phase" is the default active tab — regardless of how many custom Modules that product also has.

**AC4 (regression guard):** Given a product whose epic-group count is 0 or 1, When the product page renders, Then `defaultTab` selection is exactly what it was before this story (`ppg-s1`'s own module-count-based logic, unchanged).

**AC5 (regression guard):** Given `computeTaxonomyRollup`'s existing consumers (`fal-s1`'s `featureSlug`-based artefact-lookup resolution, `shb-s1`'s health-inheritance), When the new `featureName` field is added, Then neither consumer's own behaviour changes — the new field is additive only.

## Out of Scope

- Any change to the epic group header's own text/content (still shows `epicName`, unchanged) — only the child rows underneath it change.
- A dedicated, authored "what does this product do" summary/blurb at the top of the page — the operator's own clarification confirmed the ask is a per-feature-name label on grouped rows, not new authored prose content. A separate, distinct enhancement if wanted later.
- Deduplicating identical epic names that happen to occur across two different features in the same product (a pre-existing `groupItemsByPhase` behaviour, unaffected and unchanged by this story).
- Any change to how `_renderPvcItemRowWithCheckbox` (the By Module tab's own bulk-assign row variant) computes its sub-label — that call path is untouched.

## NFRs

- **Performance:** No new computation — `feature.name` is already loaded into memory by `computeTaxonomyRollup`'s existing loop; `byPhase.byPhase.length` reuses the `groupItemsByPhase` call `_renderConsolidatedFeaturesSection` already makes today, just reads its `.length` where it wasn't read before.
- **Security:** None identified — no new external input, no new query.
- **Accessibility:** None identified — sub-label remains plain text inside the same existing markup structure; no new interactive element.
- **Audit:** None identified — no new data write or access path.

## Complexity Rating

**Rating:** 1 — both fixes reuse existing, already-tested data (`feature.name`, `groupItemsByPhase`'s existing bucketing) and an established parameter-threading convention (`_renderPvcItemRowWithCheckbox`'s own precedent for a context-specific row-renderer wrapper); no new data source, no new query, narrow and precisely diagnosed via direct code reading and a live, pasted production example.
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
