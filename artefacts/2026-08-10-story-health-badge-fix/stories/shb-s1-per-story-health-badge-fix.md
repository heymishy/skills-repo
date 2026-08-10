## Story: Epic-nested story rows always show "Unknown" health instead of their real health

**Epic reference:** None — short-track (bug fix, found via live Chrome-browser exploration of the operator's real `skills-framework` product page)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **product owner viewing a product's module-grouped or phase-grouped story list**,
I want **each individual story's health badge to reflect its real health**,
So that **I can tell at a glance which stories are actually healthy, warning, or blocked — instead of every story looking identically "Unknown" regardless of its real state**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — found live on `wuce-staging.fly.dev` (2026-08-10): the `skills-framework` product page's own top-of-page rollup correctly reports `Healthy: 53, Warning: 3, Blocked: 0, Unknown: 0`, but every one of the 624 individual story rows rendered underneath it (in both the "By Module" and "By Phase" grouped views) shows `? Unknown` — a direct, visible contradiction on the same page.

**How:** Root-caused via direct source read. `computeHealthCounts` (`src/web-ui/modules/product-rollup.js:67-81`, story `a3`) intentionally computes health **only at feature granularity** — its own doc comment states "Epics carry no independent health field of their own in this repo's real schema, so per-feature (not per-epic) is the correct granularity for this breakdown." `perFeature` is keyed by `feature.slug` (a feature-folder slug, e.g. `2026-07-05-product-stds-hierarchy`).

But `computeTaxonomyRollup` (`product-rollup.js:274-296`, story `tmc-s1`) flattens **epic-nested stories down to individual story items** for the module-classification UI — each item gets `{slug: story.slug || story.id}` (a story-level slug, e.g. `psh-s4`), with no reference back to its parent feature retained. `_flattenTaxonomy` (line 361) carries `epicSlug`/`epicName` onto each item but never `featureSlug`. `mergeFeatureSources` (line 388, story `pvc-s1`) preserves this same shape into `mergedItems`.

When `products.js:656` (story `a4`) does `healthBySlug.hasOwnProperty(item.slug) ? healthBySlug[item.slug] : 'unknown'`, it's checking a story-level slug (`psh-s4`) against a dictionary keyed by feature-level slugs (`2026-07-05-product-stds-hierarchy`) — these are two different slug namespaces that essentially never intersect for epic-nested stories, so nearly every row silently falls through to the `'unknown'` fallback the developer intended only for genuinely-unmatched data (per the comment at line 639-640: "No match falls back to 'unknown' health... never a fabricated value").

This directly violates story `a4`'s own AC2: "health (per A3) and test-coverage percentage are shown as two visually distinct indicators — never combined into a single value or color" — the health indicator is present but structurally incorrect for the majority of rendered items.

## Architecture Constraints

- **Do not change `computeHealthCounts`'s granularity.** Its own a3-era decision (documented in `artefacts/2026-07-21-web-ui-experience-redesign/decisions.md`, referenced in the doc comment) that epics/stories have no independent health field in the real `pipeline-state.json` schema still holds — this story does not invent new per-story health data. The fix is a story inheriting its **parent feature's** health, not a new health computation.
- **Thread `featureSlug` through the existing flattening pipeline**, alongside the already-carried `epicSlug`/`epicName` — `computeTaxonomyRollup` already has `feature` in scope when building epic-nested story items (`product-rollup.js:280-288`), so this is additive, not a new lookup.
- **Non-epic-nested items are unaffected.** `computeTaxonomyRollup`'s `ungrouped` branch (line 289-292) already pushes `feature.slug` directly as `item.slug` — those items already correctly match `healthBySlug` today and must keep doing so unchanged.
- **`products.js:656`'s lookup becomes `item.featureSlug || item.slug`** — falls back to the item's own slug when `featureSlug` isn't set (the non-epic-nested / journey-sourced case), preserving all current correct-match behaviour.

## Dependencies

- **Upstream:** None (fixes already-shipped `a3`/`a4`/`tmc-s1`/`pvc-s1` code).
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given a product whose `pipeline-state.json` feature has `epics[].stories[]` (epic-nested) and that feature's `health` is `'amber'`, When the product page renders that feature's stories in the module-grouped or phase-grouped view, Then every one of those story rows shows `⚠ Warning`, not `? Unknown`.

**AC2:** Given a product whose feature has NO epics (flat `stories[]` or a bare feature with no stories, the existing `ungrouped` taxonomy path), When the product page renders it, Then its health badge is unchanged from current behaviour (already correct — this is a regression guard, not new functionality).

**AC3:** Given a story genuinely has no resolvable parent feature health at all (e.g. the parent feature itself has no `health` field set, or is missing from `pipeline-state.json`), When the row renders, Then it still shows `? Unknown` — the fallback for genuinely-unmatched data is preserved, not silently hidden.

**AC4:** Given the top-of-page health rollup (`Overall: ... / Healthy: N / Warning: N / Blocked: N / Unknown: N`, computed independently by `computeHealthCounts`), When compared against the per-row badges rendered below it for the same product, Then a story belonging to a feature counted as Healthy/Warning/Blocked in the rollup shows the matching badge on its own row — no more direct on-page contradiction between the two.

## Out of Scope

- **Changing `computeHealthCounts`'s feature-only granularity** — out of scope; this story inherits health downward from feature to story, it does not add independent per-story health tracking.
- **The Standards tab and bulk-assign-to-module missing-UI findings** — separate, larger stories from the same investigation session, tracked independently.
- **Any change to how `pipeline-state.json` stores `feature.health`** — untouched.

## NFRs

- **Correctness:** Closes a real, currently-live, user-visible defect affecting every product with epic-nested stories in this repo's own self-tracked `skills-framework` product (624 of 624 rows affected).
- **Performance:** Negligible — one additional field carried through an existing flatten/merge pass, no new queries or loops.

## Complexity Rating

**Rating:** 1 — well-understood, clear path: thread one additional field through an existing data-flattening pipeline and change one lookup's key. The root cause is fully traced and the fix shape is unambiguous.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
