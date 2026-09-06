# Contract Proposal: Collapse five independent label tables into one shared, corrected table

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s2-unified-label-table.md
**Test plan reference:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s2-unified-label-table-test-plan.md
**Date:** 2026-09-06

---

## What will be built

A new module, `src/web-ui/adapters/artefact-labels.js`, exporting `resolveLabel(subdir, filename)` and `resolveColumnKey(subdir, filename)`. `resolveColumnKey` for the `dor` subdirectory delegates directly to `features.js`'s existing exported `_deriveMatrixColumn` (imported, not reimplemented) to preserve the `-dor-contract.md` vs `-dor.md` split it already implements correctly. A lookup table covers all 14 recognised subdirectories (`stories, epics, test-plans, verification-scripts, dor, plans, dod, trace, coverage, reference, research, review, decisions, spikes`). `CLAUDE.md`'s own directory-tree list (in the "Artefact storage" section) is updated in the same change to add `review/`, `decisions/`, `spikes/`.

## What will NOT be built

- Any change to which folder an artefact type is physically stored in — labeling/keying only.
- Any UI rendering change — this module is consumed by `cat-s4`'s rendering, not rendered directly here.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test, table-driven over all 14 subdirectories, asserting each resolves to a defined, non-generic label | unit |
| AC2 | Unit test comparing `resolveColumnKey`'s dor-contract vs plain-dor output against `features.js`'s own `_deriveMatrixColumn` for equivalent inputs | unit |
| AC3 | Manual verification scenario (markdown prose edit has no automated assertion convention in this repo) | manual |
| AC4 | Integration test: full-repo grep for the 5 old table names, then run `node scripts/run-all-tests.js` and confirm no affected test fails silently or unexplained | integration |

## Assumptions

- The full-repo grep for affected tests (per the story's own Implementation note) is performed before any old table is deleted, so the affected-test list is known before AC4's verification runs.
- `features.js`'s `_deriveMatrixColumn` remains exported (it already is, per `fadm-s1`'s shipped code) — no signature change needed to import it from the new module.

## Estimated touch points

**Files:** `src/web-ui/adapters/artefact-labels.js` (new), `CLAUDE.md` (edit), the 5 old table locations (`artefact-labels.js`-equivalent legacy names if distinct, `plain-language-labels.js`, `artefact-list.js`, `artefact-fetcher.js`, `features.js`'s `SUBDIR_KEY`) — each old table's call sites redirected to the new module, `tests/check-cat-s2-unified-label-table.js` (new), any existing test file identified by the grep (updated in place with an explanatory note per AC4)
**Services:** None
**APIs:** None

## Cross-story schema dependency (H8-ext)

**schemaDepends:** `["stage", "reviewStatus"]` — this story's implementation should not begin ahead of `cat-s1` (`Dependencies: Upstream: cat-s1`) reaching `stage: "test-plan"` or later with `reviewStatus: "passed"`; both fields exist in `pipeline-state.schema.json` under `features.epics.stories`.
