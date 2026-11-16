# Contract Proposal - Retire the dead /answer form route so it answers 410 Gone instead of a server error

**What will be built:**
- `src/web-ui/routes/skills.js`: `handleAnswerRetiredHtml(req, res)` (410, HTML via `renderShell`, ids from `req.params` escaped with the file's `escHtml`, link to the chat page, never throws), exported.
- `src/web-ui/server.js`: the `POST /api/skills/:name/sessions/:id/answer` route calls `authGuard` and then `handleAnswerRetiredHtml` instead of `handlePostAnswerHtml`; the import line gains the new name.
- `tests/check-sub-s1-answer-route-retired.js` (new, T1 to T6).

**What will NOT be built:**
- No change to `handlePostAnswerHtml`, `setSubmitAnswer`, the adapter stub (it keeps throwing), the question page, the chat page's form markup, or any wuce.24 test; no wiring of `submitAnswer`; no deletion; no new npm dependency.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 | integration (real route table) |
| AC2 | T2 | integration |
| AC3 | T3 | integration |
| AC4 | T4 | integration |
| AC5 | T5 and the wuce.24 tests | integration |
| AC6 | Scenario 7 | live |

**Assumptions:** the route in `server.js` is registered at `pathname.match(/^\/api\/skills\/[^/]+\/sessions\/[^/]+\/answer$/) && req.method === 'POST'` with `req.params = { name: parts[3], id: parts[5] }` and `authGuard` then `requireNonViewer` then `handlePostAnswerHtml` (read at `server.js` around lines 3866 to 3875); `handlePostAnswerHtml` stays exported from `routes/skills.js` so the wuce.24 tests still import it; the DoR contract exclusion list has zero assertions against it (B1/D1): `server.js` and `routes/skills.js` are required touchpoints.

`schemaDepends: []`. **Estimated touch points:** Files: `src/web-ui/routes/skills.js`, `src/web-ui/server.js`, `tests/check-sub-s1-answer-route-retired.js` (new). Services: none. APIs: one route answers 410 instead of 500.
