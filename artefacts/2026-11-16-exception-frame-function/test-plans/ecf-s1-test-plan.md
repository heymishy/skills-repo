## Test Plan: Send a function name on every stack frame so PostHog groups the error into an issue

**Story reference:** artefacts/2026-11-16-exception-frame-function/stories/ecf-s1-frame-function.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-ecf-s1-frame-function.js`, using the real `scrubEvent` from `src/web-ui/modules/error-capture.js` and a new fixture `tests/fixtures/ecf-s1-posthog-frames.json` (real shapes captured from production on 2026-11-15, the same approach as `tests/fixtures/sff-s1-posthog-frames.json`). One existing test is updated (AC6).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Anonymous frame gets `<anonymous>`, other fields kept | 1 (T1) | - | - | - | - | 🟢 |
| AC2 | Identifier-shaped names kept | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | Non-identifier names replaced, no original text leaks | 1 (T3) | - | - | - | - | 🟢 |
| AC4 | Frames of any shape always yield string filename and function | 1 (T4) | - | - | - | - | 🟢 |
| AC5 | Real captured shapes pass the check; old logic fails it (negative control) | 1 (T5) | - | - | - | - | 🟢 |
| AC6 | Existing tests pass; one expectation updated | - | 1 (existing coha-s5 suite, 89 tests, with the one edit) | - | - | - | 🟢 |
| AC7 | Live: the failing route becomes a PostHog issue and a GitHub issue | - | - | - | 1 | Live-only | 🟡 |
| NFR | Never throws; no new tenant text reaches the output | 1 (T4, T3) | - | - | - | - | 🟢 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs the deployed app and PostHog's own processing | AC7 | Live-only | Verification scenario 7; `production-observed` |
| PostHog's full schema is not published | AC5 | Environmental | The check encodes only the two rules PostHog itself reported (`filename` and `function` present as strings); if PostHog reports another missing field, a new story follows (stated in Out of Scope) |

No AC depends on CSS layout; no B2 classification needed.

## Test Data Strategy

**Source:** Real. The fixture holds the first frame and the `process.processTicksAndRejections` frame exactly as they were sent to PostHog on 2026-11-15 (an anonymous arrow function at `src/web-ui/server.js` line 3775 with no `function` key; a named frame with a `[redacted]` filename). Other inputs are synthetic. **PCI/sensitivity:** No (repository paths and function names only; the fixture contains no tenant data). **Owner:** self-contained.

## Unit Tests (new file `tests/check-ecf-s1-frame-function.js`)

- **T1 (AC1).** A frame `{ filename: '/app/src/web-ui/server.js', lineno: 3775, colno: 39, in_app: true, platform: 'node:javascript' }` (no function): output `function` is `<anonymous>`; filename `src/web-ui/server.js`, lineno, colno, in_app and platform are as before. Fails today (function is `undefined`).
- **T2 (AC2).** `handleGetResultHtml`, `Object.handle`, `process.processTicksAndRejections`, `async.fn`: each kept unchanged.
- **T3 (AC3).** `a b`, `a@b`, `f for tenant`, `/tenants/acme/x.js`, a name with a newline, and a canary string: each becomes `<anonymous>`, and the serialised event contains none of the original text.
- **T4 (AC4, NFR).** Frames `null`, `'str'`, `42`, `[]`, `{}`, `{ function: 123 }`, `{ function: null }`, `{ function: '' }`: scrubbing does not throw and every output frame is an object with string `filename` and string `function`.
- **T5 (AC5).** Every frame of every real captured shape in the fixture passes `everyFrameHasFilenameAndFunction` after scrubbing. Negative control: the same fixture run through the previous `scrubFrame` logic (copied into the test as a local function) fails the check; this proves the check can fail for the right reason.

## Existing test updated

- **`scrubEvent_function_identifierShapedOnly` in `tests/check-coha-s5-error-capture.js`:** the two assertions `fn('a@b') === undefined` and `fn('a b') === undefined` become `'<anonymous>'`; the identifier case is unchanged. The test's own comment (a pure identifier cannot carry tenant text; anything else is dropped) stays true: the original text is still dropped.

## NFR Tests
- Privacy: T3 (no original text). Reliability: T4. Performance: none.

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| PostHog might need further fields not yet reported | Its schema is not published | AC7 live check proves the whole path; the cymbal error text names any further field |

**Total automated tests:** 5 new (T1 to T5) plus the 1 edited existing test and the unchanged coha-s5 suite.
