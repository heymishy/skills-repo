# Story: Product page row links use the resolved feature slug, not the raw (potentially colliding) story slug

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the finding below, made while designing a redesign of the feature artefact page
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **Platform maintainer clicking a story row on a product page**,
I want **the link to go directly to that story's real parent feature, using data the page has already resolved**,
So that **I land on the right feature's artefacts even when two different features happen to use the same story slug — without depending on a server-side resolver to guess the right one from an ambiguous slug alone**.

## Benefit Linkage

**Metric moved:** Time to First Actionable Content — the same metric this whole investigation thread (`ppg-s1`, `fal-s1`, `pefl-s1`, `aada-s1`) has targeted.
**How:** Found while designing a mockup of the feature artefact page and confirming real data for `2026-04-14-skills-platform-phase3`. `p3.3` exists as two different stories in two different features (`2026-04-14-skills-platform-phase3`'s own "Platform Structural Integrity" epic, and `2026-06-22-wuce-multi-tenancy`'s "Phase 3 — State Persistence" epic) — a genuine slug collision `fal-s1`'s own story explicitly named as a known, out-of-scope limitation ("the resolver returns the first match found"). Confirmed via direct code reading that `_renderPvcItemRow` (`src/web-ui/routes/products.js`) builds every row's link as `href="/features/" + item.slug` — the raw story slug — even though `computeTaxonomyRollup` (`product-rollup.js`, extended by `fal-s1`/`pefl-s1`) already resolves and carries the correct `item.featureSlug` on every epic-nested item by the time this function runs. The page already knows the right answer; the link just doesn't use it. Using `item.featureSlug` when present sidesteps the ambiguous-slug resolver entirely for the primary navigation path (clicking from the product page), rather than requiring `handleGetFeatureArtefacts`'s own reverse-taxonomy-scan to guess correctly after the fact.

## Architecture Constraints

- **Fix — `_renderPvcItemRow` (`src/web-ui/routes/products.js`):** the row link's `href` changes from `'/features/' + _escapeHtml(item.slug)` to `'/features/' + _escapeHtml(item.featureSlug || item.slug)`. For epic-nested items, `item.featureSlug` is already populated and correct (`fal-s1`/`pefl-s1`); for top-level (non-epic-nested, `ungrouped[]`) items, `item.featureSlug` is not set by `computeTaxonomyRollup`, so the fallback to `item.slug` is exact — for those items, the story's own slug already IS the real feature slug.
- No change to `computeTaxonomyRollup`, `groupItemsByModule`, or `groupItemsByPhase` — this story only changes which already-available field the link uses, not what data is computed.
- No change to the server-side resolver in `handleGetFeatureArtefacts` (`fal-s1`'s own taxonomy-scan fallback) — it remains in place for any navigation path that doesn't originate from a product-page row click (a typed URL, an old bookmark, a search-engine-indexed link), where this story's own fix doesn't apply.
- No new npm dependencies. No schema or query change — this is a template-only fix using data already computed.

## Dependencies

- **Upstream:** `fal-s1` (added the `featureSlug` field this story now reads; merged, DoD-complete), `pefl-s1` (added the analogous `featureName` field via the same mechanism, confirming the pattern; merged, DoD-complete), `aada-s1` (Story 1 of this same 3-story sequence; merged, DoD-complete).
- **Downstream:** The planned "one page per feature" redesign (Story 3 of this sequence) will build on this story's own corrected links when it adds per-story anchors — but does not require this story to be merged first architecturally, only sequenced first by agreement with the operator.

## Acceptance Criteria

**AC1:** Given an epic-nested item whose `featureSlug` differs from its own `slug` (the real-world `p3.3` collision case), When its row renders on the product page, Then the row's link `href` uses `featureSlug`, not `slug`.

**AC2 (regression guard):** Given a top-level (non-epic-nested) item with no `featureSlug` field set, When its row renders, Then the row's link `href` falls back to `item.slug` exactly as it does today — unaffected by this change.

**AC3:** Given the real, confirmed `p3.3` collision (one story under `2026-04-14-skills-platform-phase3`'s "Platform Structural Integrity" epic, a different story under `2026-06-22-wuce-multi-tenancy`'s "Phase 3 — State Persistence" epic), When the product-page row for the `skills-platform-phase3` epic's own `p3.3` renders, Then its link `href` is `/features/2026-04-14-skills-platform-phase3` — not the ambiguous `/features/p3.3` that could resolve to either feature depending on scan order.

## Out of Scope

- Any change to `handleGetFeatureArtefacts`'s own server-side resolver (`fal-s1`'s taxonomy-scan fallback) — it remains the correct, necessary fallback for non-product-page navigation paths; not being removed or altered.
- Per-story anchors/fragments (`#p3.3`) in the link — the artefact page doesn't yet do anything with such a fragment (that's the planned Story 3 redesign); adding an inert anchor now would be speculative, not fixing a real, present gap.
- The feature-page redesign itself (one page per feature, accordion, feature-level-only resume) — a separate, larger, already-agreed follow-up story.

## NFRs

- **Performance:** No new computation — `item.featureSlug` is already present on every relevant item by the time this function runs; this is a field-read change only.
- **Security:** None identified — `featureSlug` is already trusted, sourced from the same `pipeline-state.json` read that produces `item.slug` today.
- **Accessibility:** None identified — the link's own `aria-label` and visible text are unchanged; only the `href` target changes.
- **Audit:** None identified — no new data write.

## Complexity Rating

**Rating:** 1 — single field-read change in one function, exercising already-computed, already-tested data.
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
