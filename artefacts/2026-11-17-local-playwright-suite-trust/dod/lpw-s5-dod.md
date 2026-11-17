# lpw-s5 Definition of Done

Date: 2026-11-18. Story: the model-session browser specs run against the test server without the chat page looping, and join the browser suite. Pull request #1149 merged 2026-11-18 (`a36464e42`). It closes no issue. The change touches the test-mode stub in `src/web-ui/server.js`, one spec, the capability matrix and one new test.

## Result: COMPLETE

All five acceptance criteria (AC, Acceptance Criterion) were verified by 5 new automated tests, the browser specs and CI before merge. All 10 checks on the final commit passed, including the three required jobs.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 (the stub's streamed turn is not done, contains a question, and still sends its canvas blocks) | ✅ | `check-lpw-s5-stub-turn-ends-on-question` T1a: against the real test server a streamed turn ends `done:false` and its text contains `?`; T1b: it still carries a `system-architecture` and a `program-design` canvas block. Red first against master's stub (T1a failed) | automated (real server) | none |
| AC2 (a fresh page sends at most one stream request and enables its button) | ✅ | T2, in real chromium: before the change the page sent 7 stream requests in 10 seconds with the button disabled; after, at most 1 and enabled | automated (real browser) | none |
| AC3 (the four specs pass alone and in core order) | ✅ | the four specs alone: 9 tests, 58 seconds; the whole core in CI order twice, 128 passed, 3 skipped, 0 failed, and in CI (Core browser tests green) | live (CI) | `ep2-s1` needed more than the stub line: the lpw-s4 roster helper, identity-string ids (`Hamish`, `Susan`) in place of `hamish-uuid`, `susan-uuid`, and the pod roles it adds |
| AC4 (matrix) | ✅ | T4a: the four specs are out of quarantine; `design-definition-canvas-render`, `ep2-s2` and `rdac-s1` are core (about 27 seconds together), `ep2-s1` extended (about 32 seconds, mostly a deliberate wait); matrix guards unchanged and passing. Lanes now: core 36, extended 37, scenario 6, quarantined 16 | automated | none |
| AC5 (only the test-mode stub changed in product code) | ✅ | T5: the only `src/` file changed is `src/web-ui/server.js` | automated | none |

## Observations and follow-ups

- **The original quarantine reason was wrong, and the first fix attempt would have been wrong too.** The matrix said the specs "wait for a real model turn; the CI job has no model gateway". `ep2-s2` passed alone locally in 20 seconds with no gateway, and the mock gateway is active whenever `NODE_ENV=test`. The real cause was the test-mode stub (older than the gateway) ending without a question mark and the page's unbounded auto-continue. Recorded as a correction in `decisions.md`.
- **Product weakness left in place: issue #1148.** The chat page re-sends hidden continue turns whenever a streamed turn is not done and has no question mark, with no bound; a real model answering without a question mark can start the same loop. Not fixed here.
- **Noise worth knowing about, not fixed:** the test server logs a non-fatal `urpv-s3 ... Adapter not wired: fetchRepoPath` warning during feature creation.
- **Still quarantined:** 16 spec files, review date 2026-12-15. Left: `ep3-s1-regression` (#1042), `bmau-s1`, `kbsf-s1`, `pnfc-s1`, `bri-s3.6` (state shared with other specs), `dsa-s2`, `ep1-s3-stage-panel`, `jcx-s6`, `ep1-s4` (product differences not yet decided), `fpd-s4`, `fpux.1`, `iwu2`, `wuce18-keyboard-nav`, `frsr-s1`, `reference-upload`, `dsda-s1`.

## Scope Deviations

- AC3's `ep2-s1` work was larger than the story anticipated (roster helper, id strings, pod roles), still test-only.
