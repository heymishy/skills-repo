# Contract Proposal: The two existing non-trace consumers of artefact fetching keep working unchanged

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s6-regression-verification.md
**Test plan reference:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s6-regression-verification-test-plan.md
**Date:** 2026-09-06

---

## What will be built

No production code changes. A new integration test file exercising `journey.js`'s real gate-confirm call site and `export-data-source.js`'s real SaaS export call site (both via `fetchArtefact`, now internally backed by `cat-s5`'s trace-based resolution) to confirm neither call site's observable behaviour changed. Also runs the existing `bsgm-s1`/`sri-s1`/`adlr-s1`/`fadm-s1` regression suites and the full repo suite, diffing against the two documented pre-existing baseline failures.

## What will NOT be built

- Any fix to either of the two known pre-existing baseline failures.
- Any change to `journey.js`'s or `export-data-source.js`'s own code — if a real defect surfaces, it becomes a new, separate story, not folded into this one.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration test calling `journey.js`'s real exported gate-confirm function directly (not a mock), comparing content before/after | integration |
| AC2 | Integration test calling `export-data-source.js`'s real export function with a `repoOverride` fixture matching its actual current production shape, asserting cross-tenant isolation | integration |
| AC3 | Run the four named prior suites unmodified, assert 100% pass | integration |
| AC4 | Run `node scripts/run-all-tests.js`, diff failures against the two documented baseline failures | integration |

## Assumptions

- Per CLAUDE.md's `tir-s5` lesson (cited by this story's own Architecture Constraints), the `repoOverride` fixture shape for AC2 is confirmed by reading `export-data-source.js`'s real current wiring code before the fixture is written — not assumed from the function signature.
- The two baseline failures (`check-p3.5-validate-trace.js`, `check-pcr-s1-test-runner.js`) are still the only pre-existing failures at the time this story executes; if a third pre-existing failure has appeared since, it is treated as a new baseline entry to confirm against, not a false positive for this story.

## Estimated touch points

**Files:** `tests/check-cat-s6-regression-verification.js` (new) — no production files touched
**Services:** None
**APIs:** None

## Cross-story schema dependency (H8-ext)

**schemaDepends:** `["stage", "reviewStatus"]` — depends on `cat-s5` (`Dependencies: Upstream: cat-s5`) reaching at least `stage: "test-plan"` with `reviewStatus: "passed"`; both fields exist in `pipeline-state.schema.json`.
