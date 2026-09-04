# Contract Proposal: The feature artefact page groups files by story within one page per feature, instead of one flat list per story slug

**Story reference:** artefacts/2026-09-04-feature-artefact-page-story-grouping/stories/fapg-s1-group-artefacts-by-story-one-page-per-feature.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-04

---

## What will be built

1. **New function `getFeatureStoryStructure(repoRoot, featureSlug)`** (new file `src/web-ui/adapters/feature-story-structure.js`, or added to `artefact-list.js` — final placement decided during implementation, matching existing module boundaries): reads `path.join(repoRoot, '.github', 'pipeline-state.json')` via `fs.readFileSync` + `JSON.parse`. Returns `null` if the file doesn't exist or the feature isn't found. Otherwise finds `state.features.find(f => f.slug === featureSlug)` and returns `{ epics: [{ epicName, epicSlug, storySlugs: string[] }] , flatStorySlugs: string[] }` — `epics` populated from `feature.epics[]` (each story slug extracted via `typeof story === 'string' ? story : (story.slug || story.id)`, matching `fal-s1`'s own established handling), `flatStorySlugs` populated from `feature.stories[]` when present (same extraction). A feature with neither is treated as 0 stories.
2. **New function `groupArtefactsByStory(artefacts, storyStructure)`** (pure, synchronous): given the flat artefact list from `_listArtefacts` and the structure from (1), classifies each artefact by matching its basename against the full story-slug list (collected from both `epics[].storySlugs` and `flatStorySlugs`, sorted longest-first) — a basename starting with `{storySlug}-` belongs to that story; everything else is feature-level. Returns `{ featureLevel: Artefact[], epics: [{ epicName, epicSlug, stories: [{ slug, artefacts: Artefact[] }] }], flatStories: [{ slug, artefacts: Artefact[] }] }`.
3. **New rendering function `renderGroupedArtefactIndexHtml(grouped, featureSlug, resumeLookup)`**: renders `grouped.featureLevel` using the exact same per-type-grouped rendering `renderArtefactIndexHtml` already does today (extracted into a small shared helper so both functions call it, rather than duplicating the markup), then renders `grouped.epics`/`grouped.flatStories` as native `<details class="epic">`/`<details class="story-row">` elements — each story's own artefacts rendered via the same shared per-artefact-list helper.
4. **`handleGetFeatureArtefacts` wiring**: after fetching `artefacts` (unchanged), call `getFeatureStoryStructure(repoRoot, resolvedSlug)`. If it returns `null`, or its total story count is ≤ 1, render via the existing, unchanged `renderArtefactIndexHtml` (AC2/AC4). Otherwise call `groupArtefactsByStory` and render via the new `renderGroupedArtefactIndexHtml` (AC1).
5. Writes the 8 tests from the test plan (AC1–AC6, with AC1/AC3/AC4 each covering both a data-layer and route-level half).

## What will NOT be built

- Any change to `fal-s1`'s own `_resolveFeatureContext` (the tenant-scoped Postgres taxonomy-scan resolver) — untouched, remains solely for raw-slug-to-feature resolution.
- A GitHub-API-based fallback for reading `pipeline-state.json` when no local checkout exists — `getFeatureStoryStructure` returns `null` in that case; the page falls back to today's flat rendering (AC4), full stop.
- The fuller visual redesign (pipeline-stage timeline, feature header card, promoted resume buttons) — explicitly out of scope per the story.
- Any change to `_resolveResumeLinksForFeature` or its own `resumeLookup` shape — reused as-is.
- Any change to `_renderStoryBreadcrumb` or `_resolveFeatureContext`'s own breadcrumb-producing logic — unchanged (AC6).

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Data-layer: `groupArtefactsByStory` classifies real filenames correctly. Route-level: `handleGetFeatureArtefacts` renders the accordion for a 2-epic, 2-story fixture | unit |
| AC2 | Route-level: 1-story fixture renders with no accordion elements | unit (regression guard) |
| AC3 | Data-layer: `getFeatureStoryStructure` reads a real temp-repo `pipeline-state.json` correctly, including bare-string story shapes | unit |
| AC4 | Data-layer: returns `null` for a missing file. Route-level: handler falls back to unchanged flat rendering | unit (regression guard) |
| AC5 | Route-level: a feature-level artefact with a resolvable session still shows its resume link inside the new layout | unit (regression guard) |
| AC6 | Reuses `check-pdt-s4-story-breadcrumb.js` unmodified | unit (regression guard) |

## Assumptions

- The story-slug-prefix classification (`{storySlug}-` basename match) is unambiguous once the real slug list is known, confirmed by sorting candidate slugs longest-first before matching (e.g. checking `p3.1a` before `p3.1` so a `p3.1a-*.md` file is never mis-attributed to `p3.1`'s own group).
- `fs.readFileSync` + `JSON.parse` of a ~1.36MB `pipeline-state.json` on local disk is materially cheaper than the Postgres taxonomy query it replaces for this purpose — confirmed via direct comparison: `bin/skills advance` and every CLI command in this pipeline already perform this exact operation routinely, with no reported latency concern in this session's own extensive use of it.
- A feature whose real story count is exactly 1 does not need the accordion, per the operator's own confirmed preference — `renderArtefactIndexHtml`'s existing output remains the correct, complete rendering for that case.

## Estimated touch points

Files: `src/web-ui/routes/features.js` (`handleGetFeatureArtefacts`, `renderArtefactIndexHtml` refactored to share a helper, new `renderGroupedArtefactIndexHtml`), a new module for `getFeatureStoryStructure`/`groupArtefactsByStory` (exact file TBD during implementation — either a new `src/web-ui/adapters/feature-story-structure.js` or added to the existing `artefact-list.js`), `tests/check-fapg-s1-*.js` (new).
Services: None new.
APIs: None new — reads an already-locally-available file, no new query or external call.
