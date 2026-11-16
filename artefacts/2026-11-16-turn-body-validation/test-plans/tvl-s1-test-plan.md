## Test Plan: Reject malformed, empty and oversized skill turns before they reach the model

**Story reference:** artefacts/2026-11-16-turn-body-validation/stories/tvl-s1-turn-body-validation.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-tvl-s1-turn-body-validation.js`. It drives `handlePostTurnHtml` and `handlePostTurnStreamHtml` directly with mock requests (a readable stream of the raw bytes, so the size limit is exercised for real), a session registered with `_setHtmlSession`, and counting stubs for the model turn executor (`setSkillTurnExecutorAdapter`, `setSkillTurnExecutorStreamAdapter`) and the credits adjuster. The existing turn tests (about 30 files, listed in the contract) are left unchanged and must keep passing.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Malformed, empty or non-object body: 400 INVALID_BODY; no model call, no credits, no lock left | - | 1 (T1) | - | - | - | 🟢 |
| AC2 | Missing, non-string, empty or whitespace answer: 400 INVALID_ANSWER; `__init__` accepted | - | 1 (T2) | - | - | - | 🟢 |
| AC3 | Over 100000 characters or over 262144 bytes: 413; reader stops buffering | 1 (T3a reader) | 1 (T3b) | - | - | - | 🟢 |
| AC4 | Wrong skill name in the URL: 404 | - | 1 (T4) | - | - | - | 🟢 |
| AC5 | Same on `/turn-stream`, before SSE headers | - | 1 (T5) | - | - | - | 🟢 |
| AC6 | Valid turns unchanged; existing tests pass | - | 1 (T6) plus the existing suite | - | - | - | 🟢 |
| AC7 | No error report, one log line without body content | - | 1 (T7) | - | - | - | 🟢 |
| AC8 | Live on staging: replay the garbage set | - | - | - | 1 | Live-only | 🟡 |
| NFR | Validation never throws; lock never left set | 1 (T8) | - | - | - | - | 🟢 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs the deployed staging app | AC8 | Live-only | Verification scenario 9; `production-observed` on staging |

No AC depends on CSS layout; no B2 classification needed.

## Test Data Strategy

**Source:** Synthetic requests with the exact bad shapes seen on staging. **PCI/sensitivity:** No. **Owner:** self-contained.

## Tests (new file `tests/check-tvl-s1-turn-body-validation.js`)

- **T1 (AC1).** For each of `{"answer": `, empty body, `[1]`, `42`, `"x"`, `null`: status 400, body exactly `{"error":"INVALID_BODY"}`, the model stub called 0 times, the credits stub called 0 times, and the linked journey's `turnInProgress` still falsy. Fails today (200 and a model call).
- **T2 (AC2).** `{}`, `{"answer":42}`, `{"answer":{"a":1}}`, `{"answer":null}`, `{"answer":""}`, `{"answer":"   "}`: 400 `INVALID_ANSWER`, zero calls. `{"answer":"__init__"}` is accepted (model stub called once). Fails today.
- **T3a (AC3).** The limited body reader given a stream larger than 262144 bytes stops reading at the limit (counts the bytes consumed) and reports too large.
- **T3b (AC3).** An answer of 100001 characters answers 413 `ANSWER_TOO_LARGE`; a raw body of 300000 bytes answers 413; zero model calls. An answer of exactly 100000 characters is accepted. Fails today.
- **T4 (AC4).** Session skill `discovery`, URL skill `not-a-skill` and `..%2F..%2Fetc`: 404 `{"error":"Session not found"}`, zero model calls. Fails today.
- **T5 (AC5).** The T1 to T4 inputs on `/turn-stream`: same status and JSON body, and the response never sets `Content-Type: text/event-stream`. Fails today.
- **T6 (AC6).** An ordinary sentence, a unicode sentence and `__init__` on both endpoints behave as before: 200 (turn) or an SSE stream ending in a done event (stream), credits adjusted once each.
- **T7 (AC7).** A recording capture client shows zero reports for every rejection; the captured log lines contain the reason code and no part of the input.
- **T8 (NFR).** The validator returns a rejection (never throws) for `undefined`, a throwing getter body, and a stream that errors mid-read.

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| About 30 existing tests drive these handlers | They may send bodies the new validation rejects (for example an empty answer) | Run them all after the change; a test that relied on an invalid body is edited minimally and listed in the evidence |

**Total automated tests:** 9 (T1, T2, T3a, T3b, T4, T5, T6, T7, T8) plus AC8 live.
