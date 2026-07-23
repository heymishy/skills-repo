# Test Plan: icv-s1 — Stop /ideate's unbounded "continue" chain

## Scope

New automated test file: `tests/check-icv-s1-ideate-canvas-turn2-render-fix.js`.

This exercises the REAL, generated inline client script (extracted from a real `handleGetChatHtml()` render, not a hand-written stand-in) inside a `jsdom` window, wired so every `fetch()` call routes into the REAL `handlePostTurnStreamHtml()` — only the underlying model call (`skillTurnExecutorStream`) is stubbed via the existing D37 injectable adapter (`setSkillTurnExecutorStreamAdapter`). This is a behavioural test per CLAUDE.md's wiring-test-discipline note: it asserts an observable, differentiating outcome (executor call counts, rendered `.canvas-block` counts, submit-button `disabled` state) — not merely that some code path exists.

## Preconditions

- `NODE_ENV=test` (session/auth guards bypassed per existing test-mode conventions).
- `routes.setSkillTurnExecutorStreamAdapter(...)` stubs the model call per test — no real network or mock-gateway file I/O required (isolates the client-script defect from the fixture-file layer entirely).
- Each test uses a unique session ID (`uniqueId()`) and closes its `jsdom` window in a `finally` block, since the pre-fix behaviour under test is a genuine infinite loop that must not bleed pending timers into later tests.

## Test Cases

| ID | AC | Scenario | Expected | Type |
|----|----|----------|----------|------|
| T1 | AC1 | `/ideate` turn 1: response has a canvas marker, no "?", no artefact marker | Exactly 1 executor call; exactly 1 `.canvas-block` rendered | Behavioural (jsdom + real handler) |
| T2 | AC2 | Same as T1 | Submit button `disabled === false` after the stream settles | Behavioural |
| T3 | AC3 | `/ideate`: turn 1 completes, then a genuine second form submit is dispatched | Exactly 2 total executor calls; canvas block count grows to 2 (not frozen at 1) | Behavioural |
| T4 | AC4 | `discovery` (non-ideate) turn 1: response has no "?", no artefact marker; turn 2 (auto-continued) contains a real artefact | Exactly 2 executor calls (the real turn + the a10b32a3 hidden continuation) — proves the fix is `IS_IDEATE`-scoped, not a blanket regression | Behavioural (contrast case) |
| T5 | AC5 | Full `npm test` | No new regressions vs. `tests/known-baseline-failures.json` | Full suite |
| T6 | AC6 | Real `wuce-staging`, `tests/e2e/a3-product-feature-ideate-canvas.spec.js` AC3 | Passes against real staging | E2E (manual dispatch, reported in `decisions.md`) |

## TDD Discipline

T1–T4 were written and run against the pre-fix code FIRST (via `git stash` isolating the one-line fix in `skills.js`), confirming:
- T1: **RED** — 5 executor calls observed in a 600ms settle window (not 1) — reproducing the runaway "continue" chain.
- T2: implied RED by T1's failure (test aborts before reaching the button-state assertion in that combined test).
- T3: **RED** — 5 canvas blocks observed after "turn 1" alone (not 1) — reproducing the real CI log's "frozen at 30" pattern at smaller scale (shorter settle window than the real 20s E2E poll).
- T4: **PASSED even pre-fix** — confirming the contrast case (non-ideate skills) was never broken; this is the correct baseline for a scoped fix.

Then the fix (`!IS_IDEATE &&` gate in `skills.js`'s `sendTurn` inline script) was applied and the SAME test file re-run, confirming all 4 cases **GREEN**.

## Data/Fixture Notes

AC4's contrast case necessarily produces a real `---ARTEFACT-START---`/`---ARTEFACT-END---` turn, which the real handler auto-saves to disk at `artefacts/<slug>/discovery.md`. An explicit `---SLUG---` line pins this to a disposable, obviously-test-only slug (`zzz-test-icv-s1-disposable-artefact`) so the test can never collide with (and overwrite) a real dated artefact directory such as `artefacts/YYYY-MM-DD-discovery/` — the test's `finally` block removes this directory after each run, and the run entrypoint removes it up front too in case a prior run was interrupted. (This exact collision was hit and manually corrected once while developing this test — see `decisions.md`.)

## Out of Scope for this Test Plan

- Real mock-gateway fixture-file I/O (isolated out via the executor-stub adapter — this test is about the CLIENT's turn-completion heuristic, not the fixture layer, which is already covered by `tests/check-bri-s3.1-mock-llm-gateway.js` and `tests/check-inc4-canvas-panel.js`).
- Real staging E2E re-verification (AC6) — covered by a manual dispatch step, reported in `decisions.md`, not by this Node test file.
