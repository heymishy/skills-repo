# Contract Proposal: Build the canonical artefact trace from real disk structure for any feature

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s1-core-trace-builder.md
**Test plan reference:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s1-core-trace-builder-test-plan.md
**Date:** 2026-09-06

---

## What will be built

A new module, `src/web-ui/adapters/artefact-trace.js`, exporting a single function `buildArtefactTrace(repoRoot, featureSlug)`. Internally it:
1. Resolves the feature directory (`artefacts/<slug>` then `artefacts/archived/<slug>` — one fallback branch, not three).
2. If neither path exists on disk at all *and* `repoRoot` itself doesn't exist, returns `{ status: 'not-yet-synced' }`.
3. If neither path exists but `repoRoot` does, returns `{ status: 'not-found' }`.
4. Otherwise walks the resolved directory once (`fs.readdirSync` recursive), collecting every file into an `artefacts[]` array with `path` and inferred `type` (subdirectory name).
5. Cross-references `pipeline-state.json` (read via the existing `readPipelineState()` helper) for the same slug's epics/stories, attaching each artefact to a matching story slug where the filename matches an existing convention (`<story-slug>-<suffix>.md`).
6. Returns `{ status: 'found', epics: [...], stories: [...], artefacts: [...] }`.

## What will NOT be built

- Any label/subdirectory display-name resolution (`cat-s2`'s own scope) — this module returns raw subdirectory names as `type`, not display labels.
- Divergence classification (`unregistered`/`orphaned-registration`/`not-yet-synced` per-document states beyond the two feature-level status codes above) — `cat-s3`'s own scope.
- Any write to `pipeline-state.json` — this function is read-only.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test diffing `buildArtefactTrace`'s output against `getFeatureStoryStructure`'s existing output for the same fully-registered fixture feature | unit |
| AC2 | Unit test asserting `artefacts.length === 205` for the real `phase4` fixture with an empty `pipelineState` | unit |
| AC3 | Unit test against a synthetic fixture present only under `artefacts/archived/<slug>/` | unit |
| AC4 | Unit test asserting a typed `{status: 'not-found'}` result (not null, not thrown) for a nonexistent slug | unit |
| AC5 | Unit test asserting a distinct `{status: 'not-yet-synced'}` result for a `repoRoot` that itself doesn't exist, compared against the AC4 result | unit |

## Assumptions

- `pipeline-state.json` is read via the repo's existing `readPipelineState()` helper (or equivalent) — not re-implemented.
- The exact field names in the returned structure (`epics`, `stories`, `artefacts`) are pinned during implementation per review finding `1-L1` (not fully specified in the story's own AC1 text) — the implementer names them to match `getFeatureStoryStructure`'s existing shape as closely as possible, documented via a code comment if any field is renamed.
- `WUCE_TENANT_ROOT_BASE`'s "not yet synced" condition is approximated as "the resolved `repoRoot` path does not exist on disk at all" — the simplest faithful signal available, per the `/clarify`-resolved decision that no stronger guarantee exists to check against.

## Estimated touch points

**Files:** `src/web-ui/adapters/artefact-trace.js` (new), `tests/check-cat-s1-core-trace-builder.js` (new)
**Services:** None
**APIs:** None — pure filesystem + existing `pipeline-state.json` read helper

## Cross-story schema dependency (H8-ext)

**schemaDepends:** none — `Dependencies: Upstream: None` per the story artefact. No upstream schema-field dependency declaration required.
