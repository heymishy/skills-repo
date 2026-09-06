# Contract Proposal: The feature artefact-index page renders every document's real status, using the canonical trace

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s4-features-page-integration.md
**Test plan reference:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s4-features-page-integration-test-plan.md
**Date:** 2026-09-06

---

## What will be built

`src/web-ui/routes/features.js`'s `/features/:slug` handler rewired to call `buildArtefactTrace` + `classifyDivergence` (`cat-s1`/`cat-s3`) instead of `feature-story-structure.js`'s `getFeatureStoryStructure`. `renderGroupedArtefactIndexHtml` extended to accept the classified trace shape and render: (a) an "Unregistered" `.sw-pill` for `unregistered` documents, reusing `fadm-s1`'s existing pill CSS with a distinct text-labeled variant; (b) a distinct empty/gap-state block for `orphaned-registration` stories; (c) a feature-level "still syncing" message when the trace status is `not-yet-synced`. Labels come from `cat-s2`'s `resolveLabel`/`resolveColumnKey`.

## What will NOT be built

- `/artefact/:slug/:type`'s own fetch/resolve logic — `cat-s5`'s scope.
- Sorting, filtering, or search — explicitly out of scope per discovery.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test asserting all 205 `phase4` documents appear, grouped where inferred | unit |
| AC2 | Unit test asserting `.sw-pill` "Unregistered" text renders regardless of inference success | unit |
| AC3 | Unit test asserting a distinct, non-conflated gap-state marker for `orphaned-registration` | unit |
| AC4 | Byte-identical golden-fixture comparison against `fadm-s1`'s current output for the fully-registered common case | unit + integration |
| AC5 | Unit test asserting a "still syncing" message, no 500, no `unregistered` flag conflation | unit |

## Assumptions

- The AC4 golden-fixture snapshot is captured from the pre-change codebase as the first implementation step — before any of `cat-s1`-`cat-s3`'s code lands — or the "byte-identical" comparison is meaningless (flagged in the test plan's own Test Gaps and Risks table).
- No new CSS classes are introduced beyond the "Unregistered" pill and gap-state marker — both reuse `fadm-s1`'s existing token set (`--surface`, `--line`, `--ink`, `--muted`, `--accent`) per the story's own Architecture Constraints.

## Estimated touch points

**Files:** `src/web-ui/routes/features.js` (modified), `src/web-ui/utils/html-shell.js` (possibly extended with 1-2 new CSS rules for the gap-state marker, if `fadm-s1`'s existing pill variants don't already cover it), `tests/check-cat-s4-features-page-integration.js` (new)
**Services:** None
**APIs:** None — internal route handler only

## Cross-story schema dependency (H8-ext)

**schemaDepends:** `["stage", "reviewStatus"]` — depends on `cat-s1`, `cat-s2`, `cat-s3` (`Dependencies: Upstream: cat-s1, cat-s2, cat-s3`) each reaching at least `stage: "test-plan"` with `reviewStatus: "passed"`; both fields exist in `pipeline-state.schema.json`.
