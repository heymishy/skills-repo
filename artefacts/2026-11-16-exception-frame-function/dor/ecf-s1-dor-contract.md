# Contract Proposal - Send a function name on every stack frame so PostHog groups the error into an issue

**What will be built:**
- `src/web-ui/modules/error-capture.js`: `scrubFrame` always sets `g.function`: the input name when it is a string matching the existing identifier pattern, otherwise the fixed value `<anonymous>`. A new constant holds the placeholder (beside `REDACTED_FILENAME`). Nothing else in the file changes.
- `tests/fixtures/ecf-s1-posthog-frames.json` (new): real frame shapes captured from production on 2026-11-15.
- `tests/check-ecf-s1-frame-function.js` (new, T1 to T5).
- `tests/check-coha-s5-error-capture.js`: the two assertions in `scrubEvent_function_identifierShapedOnly` that expect `undefined` now expect `<anonymous>`. No other edit.

**What will NOT be built:**
- No change to the fingerprint, route label, code allow-list, message scrubbing or any other part of `scrubEvent`; no change to issue titles or bodies (`eit-s1`); no wiring of the commit result page (`scr-s1`); no reprocessing of stored events; no new npm dependency.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 | unit |
| AC2 | T2 | unit |
| AC3 | T3 | unit |
| AC4 | T4 | unit |
| AC5 | T5 (real fixture and negative control) | unit |
| AC6 | existing coha-s5 suite plus the one edited expectation; full suite | regression |
| AC7 | Scenario 7 | live (production-observed) |

**Assumptions:** PostHog's `serde error: missing field 'function'` (read from `$cymbal_errors` on the 7 stored events) is the reason those events were not grouped; the placeholder string is accepted as a function name (proved by AC7); the scrubber is the only place frames are shaped before sending (confirmed: `before_send: scrubEvent`).

`schemaDepends: []`. **Estimated touch points:** Files: `src/web-ui/modules/error-capture.js`, `tests/check-coha-s5-error-capture.js` (two assertions), `tests/check-ecf-s1-frame-function.js` (new), `tests/fixtures/ecf-s1-posthog-frames.json` (new). Services: none. APIs: none.
