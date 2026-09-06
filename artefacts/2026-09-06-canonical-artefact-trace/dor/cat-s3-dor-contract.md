# Contract Proposal: Classify every divergence case the audit found, not just the common one

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s3-divergence-classification.md
**Test plan reference:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s3-divergence-classification-test-plan.md
**Date:** 2026-09-06

---

## What will be built

`classifyDivergence(traceResult, pipelineState)` added to `src/web-ui/adapters/artefact-trace.js` (same module as `cat-s1`, run as an extra step inside `buildArtefactTrace`'s existing single pass — no second directory walk). For a `traceResult` with `status: 'not-yet-synced'`, short-circuits and returns that status unchanged (feature-level precedence, per AC3). Otherwise, for each artefact: marks `registered` if it matches a `pipelineState` entry; `unregistered` if not, attempting a filename-pattern inference to attach it to an existing inferred grouping. For each `pipelineState` story entry with zero matching artefacts: marks that story `orphaned-registration`.

## What will NOT be built

- Any rendering of these classification states — `cat-s4`'s scope.
- Any auto-correction or write-back to `pipeline-state.json` for an `orphaned-registration` case.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests: unregistered document with and without a matching inference pattern, plus the real `phase4` fixture | unit |
| AC2 | Unit tests: synthetic `orphaned-registration` fixture, plus explicit non-conflation assertion against AC1's `unregistered` value | unit |
| AC3 | Unit test asserting feature-level `not-yet-synced` precedence over a contrived conflicting per-document case; integration test confirming zero additional directory reads | unit + integration |
| AC4 | Unit test against the real, fully-registered `feature-artefact-document-matrix` fixture | unit |

## Assumptions

- `classifyDivergence` operates purely on the in-memory structure `buildArtefactTrace` already produced — no new filesystem access, per the story's own Performance NFR.
- The inference logic for AC1's "attach to an inferred grouping" reuses whatever pattern-matching approach the `phase4`-facing UI already informally uses (directory-name/filename-prefix matching) — no new inference algorithm is invented beyond what's needed to pass the fixture tests.

## Estimated touch points

**Files:** `src/web-ui/adapters/artefact-trace.js` (extended, not new), `tests/check-cat-s3-divergence-classification.js` (new)
**Services:** None
**APIs:** None

## Cross-story schema dependency (H8-ext)

**schemaDepends:** `["stage", "reviewStatus"]` — depends on `cat-s1` (`Dependencies: Upstream: cat-s1`) reaching at least `stage: "test-plan"` with `reviewStatus: "passed"` before this story's implementation begins; both fields exist in `pipeline-state.schema.json`.
