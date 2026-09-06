# Contract Proposal: Opening any single document resolves through the canonical trace, not independent logic

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s5-artefact-fetch-integration.md
**Test plan reference:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s5-artefact-fetch-integration-test-plan.md
**Date:** 2026-09-06

---

## What will be built

`src/web-ui/adapters/artefact-fetcher.js`'s `fetchArtefact` internal path-resolution logic rewired to consult `buildArtefactTrace`/`classifyDivergence`'s output instead of its own independent `ARTEFACT_SUBDIRS`-based bare-name probe. `src/web-ui/routes/artefact.js`'s `/artefact/:slug/:type` handler gets a new, distinct error branch for the `orphaned-registration` case (a real 404 with a message distinguishing it from `adlr-s1`'s existing never-registered 404). The existing `ArtefactNotFoundError`/`ArtefactFetchError` classes and their postgres-fallback/error-page call sites are unchanged — only what feeds into them changes.

## What will NOT be built

- Any change to `journey.js`'s or `export-data-source.js`'s own call sites — `cat-s6`'s verification scope, not this story's implementation scope.
- Any change to GitHub Contents API auth/timeout/retry behaviour.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Golden-fixture regression test: known-good `psh` link resolves identically before/after | unit + integration |
| AC2 | Unit test: `phase4` inference-only-locatable document resolves to real content, not 404; structural check confirming the old probe isn't called | unit |
| AC3 | Unit test: `orphaned-registration` fixture returns a 404 with a message distinct from the never-registered 404 | unit |
| AC4 | Source-contract check: `ArtefactNotFoundError`/`ArtefactFetchError` shape and call sites unchanged | unit |

## Assumptions

- The AC1 golden-fixture response is captured from the pre-change codebase (using `adlr-s1`'s own existing fixture) as the first implementation step.
- `artefact-fetcher.js`'s `ARTEFACT_SUBDIRS`-based probe remains present as dead code only if fully unreachable after the swap, or is removed entirely if confirmed unreachable — either is acceptable; the AC only requires it isn't the code path exercised.

## Estimated touch points

**Files:** `src/web-ui/adapters/artefact-fetcher.js` (modified), `src/web-ui/routes/artefact.js` (modified — new error branch), `tests/check-cat-s5-artefact-fetch-integration.js` (new)
**Services:** GitHub Contents API (unchanged usage, per AC4)
**APIs:** `/artefact/:slug/:type` (existing route, no URL shape change)

## Cross-story schema dependency (H8-ext)

**schemaDepends:** `["stage", "reviewStatus"]` — depends on `cat-s1` and `cat-s2` (`Dependencies: Upstream: cat-s1, cat-s2`) each reaching at least `stage: "test-plan"` with `reviewStatus: "passed"`; both fields exist in `pipeline-state.schema.json`.
