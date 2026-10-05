# Implementation Plan: spdr-s1 + spdr-s2

**Mode:** Implemented directly in-session via `/tdd`, not dispatched to a subagent — both stories are small, mechanical scope, matching `dswf-s1`/`wswda-s1`'s own precedent.

## Task 1 — spdr-s1: disable dismiss/undismiss button on submit

1. Add `onsubmit="this.querySelector('button').disabled=true;"` to `_dismissControl()`'s `<form>` tag in `src/web-ui/views/signals-panel-view.js`.
2. New test (markup assertion, AC1) + no new test needed for AC2 (covered by pre-existing regression).
3. Full `tests/check-sptu-s4-signals-dismiss.js` run: 17/17 (16 pre-existing + 1 new).

## Task 2 — spdr-s2: Playwright timing spec for Metric 1

1. Extend `src/web-ui/server.js`'s `/test/seed-signals` to accept an optional `signals` array, falling back to the existing uniform generator.
2. New spec `tests/e2e/spdr-s2-metric1-timing.spec.js`: seeds a custom 15-signal fixture (3 parse-error + 12 dated), drives the real filter→dismiss×10 flow, measures Node-process wall-clock duration, asserts persistence and a <15s ceiling, restores `workspace/dismissed-signals.json` to its exact pre-test state in a `finally` block.
3. Ran in isolation: 1/1 passed, 10.9s measured.
4. Re-ran `ep2-s1-signals-panel.spec.js` and `ep2-s3-signals-pagination.spec.js` to confirm AC4 — both pass individually; found (and logged as an out-of-scope RISK-ACCEPT) a pre-existing worker-parallel race between those two specs when run together, unrelated to this story's own changes.

**Result:** All new tests pass; full `npm test` regression run to confirm no unrelated breakage.
