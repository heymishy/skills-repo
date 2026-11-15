# Contract Proposal - Put the error type and route in the issue title, and keep the real error code

**What will be built:**
- `src/web-ui/modules/error-capture.js`: `ALLOWED_CODES` gains `http_5xx` and `unhandled_rejection`; in `scrubEvent`, an exception that is not an allow-listed fixed message gets the value `<code>: <Type> at <route>` (code, type and route all already computed and scrubbed in the same function); allow-listed messages keep their value. Nothing else in the file changes (fingerprint, route label, frame scrubbing, key filtering).
- `tests/check-eit-s1-issue-title.js` (new, T1 to T6).
- `tests/check-coha-s5-error-capture.js`: the assertions that expect the bare code as the value are updated (named in the test plan).

**What will NOT be built:**
- No change to the issue body, labels, the bridge route, the incident script, or the PostHog alert destination; no fetching of extra detail; no retitling of existing issues; no new npm dependency.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 | unit |
| AC2 | T2 | unit |
| AC3 | T3 | unit |
| AC4 | T4 | unit |
| AC5 | T5 (real bridge handler and `codeProblem`) | integration |
| AC6 | T6 | unit |
| AC7 | Scenario 7 | live (production-observed) |

**Assumptions:** the PostHog destination's body template sends `event.properties.$exception_values[1]` as the webhook `code`, which the bridge uses verbatim as the GitHub title (read from the destination configuration on 2026-11-16 and from `error-bridge.js` `createIssue({ title: f.code ... })`); the bridge and incident script accept titles up to 120 characters without control characters (read from their sources); PostHog groups issues by the explicit fingerprint, not the value.

`schemaDepends: []`. **Estimated touch points:** Files: `src/web-ui/modules/error-capture.js`, `tests/check-eit-s1-issue-title.js` (new), `tests/check-coha-s5-error-capture.js` (a few assertions). Services: none. APIs: none.
