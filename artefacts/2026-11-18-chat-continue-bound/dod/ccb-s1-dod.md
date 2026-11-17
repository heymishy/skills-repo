# ccb-s1 Definition of Done

Date: 2026-11-18. Story: the chat page stops sending hidden "continue" turns after a few, and shows the operator what it has. Pull request #1150 merged 2026-11-18 (`a3e3e1442`). It closes issue #1148 (verified closed).

## Result: COMPLETE

All five acceptance criteria are covered by `tests/check-ccb-s1-continue-bound.js` (8 tests, run against the real page script in jsdom, the same harness as `check-icv-s1`) and by CI on the pull request (10 of 10 checks green, including the three required ones).

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 (statement replies: at most 2 hidden continues, then notice, button re-enabled, last reply visible) | ✅ | T1a and T1b: 3 turns in all, notice once, last reply visible, send button enabled. Before the change the same test sent 23 turns | automated | none |
| AC2 (truncated replies: at most 5; a chain that ends done within the cap is unchanged) | ✅ | T2a: 6 turns then notice. T2b: two truncated then a done artefact reply, artefact shown, no notice | automated | none |
| AC3 (a repeated reply stops at once) | ✅ | T3: an identical continue reply stops the chain at 2 turns with the notice | automated | none |
| AC4 (a message the operator sends restarts the count) | ✅ | T4: after the cap, a typed message starts a fresh count and may be followed by its own continues | automated | none |
| AC5 (question, done and ideate replies send no continue; existing chat-page tests unchanged) | ✅ | T5a, T5b, T5c; the 68 tests that read the chat-page script or stream handler pass. `check-sccf-s1` needed the new variables moved to the top of the script (see `decisions.md`); the test itself is unchanged | automated | none |

## Observations and follow-ups

- **Caps are a product decision, not tuned against real model behaviour.** 2 and 5 are conservative; a real model that needs more than 2 continues to produce a question will now stop and hand the input back. The operator merged with the caps stated in the pull request body.
- **Not verified in production.** The change is client script only and was verified in jsdom and in the browser suite (core plus `ep2-s1` and `dsh-s3`: 130 passed, 0 failed). A production check would be a discovery session where the model answers with a statement; nobody has run one yet.
- **Corrected earlier work in the same pull request.** The branch-relative "no product code changed" checks (T5 of `check-lpw-s4-seed-team-member` and of `check-lpw-s5-stub-turn-ends-on-question`) were removed because they would fail any later pull request touching `routes/`, `modules/` or `public/`. Recorded in `decisions.md`.
- **Still open, unconfirmed:** the repeat-artefact "Minor change" bubble reported from production. It needs a production journey id or a signed-in browser tab to reproduce.

## Scope Deviations

- Test count: the pipeline-state entry was registered with 9 planned tests; the test file has 8. State is now `totalTests=8`, `passing=8`.
