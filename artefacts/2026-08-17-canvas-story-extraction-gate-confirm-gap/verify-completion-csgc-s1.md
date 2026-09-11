# Verify Completion: Add a regression test for /definition story-extraction and investigate the unexplained gate-confirm 400 (csgc-s1)

**Story:** artefacts/2026-08-17-canvas-story-extraction-gate-confirm-gap/stories/csgc-s1-story-extraction-regression-test-and-gate-confirm-investigation.md

---

## AC verification

| AC | Status | Evidence |
|----|--------|----------|
| AC1 | ✅ | `extractStoryIdsFromDefinitionArtefact` run against the real `definition.success.json` fixture returns `["mock-fixture.1"]` |
| AC2 | ✅ | `handlePostGateConfirm` redirects straight to review (303, `/skills/review/sessions/...`) and sets the full real-fixture-extracted story list via `setStoryList` |
| AC3 | ✅ (outcome b) | T3a: real streaming path (`handlePostTurnStreamHtml`, fully awaited) → `handlePostGateConfirm` does NOT 400 (got 303). T3b (contrast): `session.done` forced false (simulating an out-of-sequence call) → DOES 400. Conclusion: the original observation was an artifact of the debug script's own premature call, not a real production bug — the real client path (which only calls gate-confirm after the SSE stream visibly completes) cannot reach it. |

**New test file:** `tests/check-csgc-s1-story-extraction-and-gate-confirm.js` — 7/7 passing.

## Full suite

`NODE_ENV=test npm test`: 639 files run, 3 failed — `tests/check-bjs-s1-billing-journey-staging-safe.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-s6.1-cache-scope-session-threading.js`. Identical to the 3 pre-existing failures confirmed on both `ibg-s1` and `vcb-s1` earlier this session (1 already in `known-baseline-failures.json`, 2 confirmed baseline drift). **0 new failures** — this story's diff is a single new test file, touching no production code and no other test file.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
