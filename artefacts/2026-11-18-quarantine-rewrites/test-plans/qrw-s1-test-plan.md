## Test Plan: Three quarantined browser specs are rewritten against the product as it is and join the core suite

**Story reference:** artefacts/2026-11-18-quarantine-rewrites/stories/qrw-s1-rewrite-three-quarantined-specs.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-18
**Test runner (read from package.json):** browser specs run with `NODE_ENV=test npx playwright test <files> --workers=1`; the matrix guards are plain Node scripts under `tests/` run by `npm test`. This story's tests are the three rewritten specs themselves; there is no new `tests/check-*.js` file (a check that reads the matrix would repeat `check-lpw-s2-capability-matrix`).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | reference-upload T9 to T15 reach the modal directly and pass; T15 asserts the listing | - | - | 7 (`reference-upload.spec.js`) | - | - | 🟢 |
| AC2 | dsda-s1 asserts the review redirect and edits the stories textarea | - | - | 1 (`dsda-s1-default-all-stories.spec.js`) | - | - | 🟢 |
| AC3 | iwu2 asserts the ideate assumption section and discovery's draft panel | - | - | 8 (`iwu2-right-panel-layout.spec.js`) | - | - | 🟢 |
| AC4 | Matrix entries in core, fields removed, 13 quarantined | - | existing `check-lpw-s2-capability-matrix`, `check-lpw-s3-matrix-reason` | - | - | - | 🟢 |
| AC5 | Core lane passes at 39 specs; nothing under `src/` changed | - | - | whole core lane | diff read | - | 🟢 |

Red-first, observed 2026-11-18: the three original files run together on master gave 15 failed and 1 passed (the unauthenticated redirect test in iwu2) across 16 tests. The rewrite turns them green; the evidence is that run and the run after the rewrite.
