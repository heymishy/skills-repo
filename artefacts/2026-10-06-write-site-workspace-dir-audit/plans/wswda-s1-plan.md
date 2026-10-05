# Implementation Plan: wswda-s1

**Story:** artefacts/2026-10-06-write-site-workspace-dir-audit/stories/wswda-s1-mkdir-before-write-strategy-metrics-and-ideas.md
**Mode:** Implemented directly in-session via `/tdd`, not dispatched to a subagent — single-task, mechanical scope, matching `dswf-s1`'s own precedent.

## Task 1 (only task)

1. Create `src/web-ui/utils/fs-safe-write.js` exporting `writeFileEnsuringDir(filePath, content, encoding)`.
2. Route `strategy-metrics.js`'s two `fs.writeFileSync` calls (`initMetricsFile`, `recordMetrics`) through it.
3. Route `features.js`'s `_writeIdeasFile` through it; export `_writeIdeasFile` for the call-site assertion test.
4. New test file `tests/check-wswda-s1-mkdir-before-write.js` (4 tests: AC1, AC3 on the helper directly, AC2 call-site assertion, AC3 on the real `features.js` call site).
5. Extend `tests/check-sdg6-metrics-recording.js` with T11 (AC1 direct on `recordMetrics`).
6. Full regression: `tests/check-idp-s1-persist-ideas-in-postgres.js` (6/6) + `tests/check-sdg6-metrics-recording.js` (11/11) + full suite.

**Result:** All new tests pass; all pre-existing tests in both touched files' own suites pass unchanged.
