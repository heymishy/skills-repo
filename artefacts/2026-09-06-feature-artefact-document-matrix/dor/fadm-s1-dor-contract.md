# Contract Proposal — Replace the multi-story artefact accordion with a compact feature-level table and document matrix

**Story:** artefacts/2026-09-06-feature-artefact-document-matrix/stories/fadm-s1-replace-artefact-accordion-with-document-matrix.md
**Date:** 2026-09-06

---

## What will be built

**`src/web-ui/routes/features.js`**:
- A new `_renderFeatureLevelTable(artefacts, featureSlug, resumeLookup)` replacing the per-type-card branch of `_renderArtefactListByType` for the multi-story path only (the single-story path keeps calling the existing function unchanged, per AC5).
- A new `_deriveMatrixColumn(path)` helper: folder-based bucket first (`stories`→Story, `dod`→Definition of done, `plans`→Plan, `test-plans`→Test plan, `review`→Review, `verification-scripts`→Verification, `dor`→ further split by filename suffix into "Ready check" vs "Ready check contract" — the only folder needing sub-disambiguation, confirmed by direct inspection of every artefact-producing skill's naming convention this session).
- A new `renderArtefactMatrix(storyStructure, groupedArtefacts, featureSlug, resumeLookup)` building the matrix: columns as the sorted union of `_deriveMatrixColumn` results across all of this feature's own story artefacts; rows per story (epic-nested stories preceded by a non-interactive divider row naming the epic, with a link to the epic's own document when one exists); each present cell an `<a>` to that document (reusing `_relativeArtefactPath`/`encodeURIComponent`, `adlr-s1`'s own convention) plus a resume-conversation affordance when `resumeLookup` matches; each absent cell a dash.
- `renderGroupedArtefactIndexHtml` updated to call the new feature-level table + matrix instead of the old epic/story accordion (`renderStory`, `.sw-epic-group`/`.sw-story-row` markup) for the multi-story path.

**`src/web-ui/utils/html-shell.js`**: new CSS for `.doc-table`/`.doc-matrix` (table primitives), removing the now-unused `.sw-epic-group`/`.sw-story-row` block once confirmed genuinely dead (no other consumer references it).

**`tests/check-fapg-s1-group-artefacts-by-story.js`**: the one existing assertion checking for `sw-epic-group`/`sw-story-row` class presence is updated in place to assert the new matrix markup instead — this story's own supersession of that rendering, not a regression.

## What will NOT be built

- No change to single-story rendering (`renderArtefactIndexHtml`'s existing flat path).
- No change to `getFeatureStoryStructure`/`groupArtefactsByStory` (`feature-story-structure.js`).
- No sorting, filtering, or search UI within the matrix.
- No change to `deriveTypeFromPath`/`getLabel` (the existing shared type-label mapping) — the feature-level table continues to use it for its own Type column; the matrix's column derivation is a separate, dedicated function.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests: feature-level table renders all types, including an unlisted one | Unit |
| AC2 | Unit tests: dynamic column union, dash for gaps, correct link hrefs, epic-divider grouping | Unit |
| AC3 | Unit tests: DoR vs DoR Contract column separation, plus a standalone column-derivation test | Unit |
| AC4 | Unit tests: epic document linked from divider row, not duplicated; graceful when absent | Unit |
| AC5 | Unit test: single-story path unchanged | Unit (regression guard) |
| AC6 | Unit test: resume-conversation affordance preserved | Unit (regression guard) |
| AC7 | Manual verification scenario against 3 real, already-approved features, post-merge | Manual |

## Assumptions

- Every artefact-producing skill in this repo's own convention names its DoR contract file with a `-dor-contract` suffix distinct from the plain `-dor` suffix — confirmed by direct inspection of `psh`, `bsgm-s1`, `sri-s1`, and `adlr-s1`'s own artefact filenames this session; no counter-example found.
- The `.sw-epic-group`/`.sw-story-row` CSS becomes fully dead code after this story ships — verified by a repo-wide grep for any remaining reference before removal, not assumed.

## Estimated touch points

**Files:** `src/web-ui/routes/features.js`, `src/web-ui/utils/html-shell.js`, `tests/check-fapg-s1-group-artefacts-by-story.js` (one assertion updated in place), new `tests/check-fadm-s1-document-matrix.js`
**Services:** None
**APIs:** None
