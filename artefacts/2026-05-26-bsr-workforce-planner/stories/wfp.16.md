## Story wfp.16: Natural-language workforce query via GPT-4o Copilot chat — intelligence server

**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-planning-dashboard.md
**Discovery reference:** artefacts/2026-05-26-bsr-workforce-planner/discovery.md
**Benefit-metric reference:** artefacts/2026-05-26-bsr-workforce-planner/benefit-metric.md
**Phase:** 2 (Intelligence Layer)
**Prerequisite:** wfp.12 DoD-complete (introduces `src/workforce-ui/server.js`).

## User Story

As a **Head of Engineering**,
I want to ask natural-language questions about the current workforce allocation and receive a synthesised answer backed by the live data files,
So that I can get rapid, context-aware answers during planning sessions without having to formulate JSON queries or interpret raw allocation maps myself.

## Benefit Linkage

**Metric moved:** M1 (Workforce and Initiative Reconciliation Time) and M2 (Pre-GM Initiative FTE Cross-Check Coverage)
**How:** Complex cross-cutting questions — "Which teams have no Java coverage?", "How many people roll off in Q3?", "Who should I assign to Initiative X given its required tags?" — currently require the operator to manually cross-reference multiple JSON files. The NL query interface answers these in a single conversational turn by providing GPT-4o with a structured, privacy-tiered context window drawn from the live workforce data files. This reduces M1 (reconciliation cycle time) by replacing manual data lookups with synthesised answers, and advances M2 (pre-GM cross-check coverage) by enabling rapid confirmation of allocation quality without opening each portfolio slug individually.

## Architecture Constraints

- Delivered in the existing standalone intelligence server at `src/workforce-ui/server.js` introduced in wfp.12. No new server file.
- Three routes: `GET /workforce-chat` (returns chat HTML), `POST /api/workforce-chat/turn` (non-streaming turn), `POST /api/workforce-chat/turn-stream` (SSE streaming turn). All three routes require `authGuard`.
- Uses an injectable adapter pattern — two adapters:
  - `setWorkforceQueryExecutorAdapter(fn)` — sets the non-streaming executor.
  - `setWorkforceQueryExecutorStreamAdapter(fn)` — sets the SSE streaming executor.
  Both are exported from the handler module. **Stub defaults MUST throw**, not return empty or null (per D37 rule — see Architecture Constraints below).
- Production wiring in `src/workforce-ui/server.js`:
  ```js
  const { workforceQueryExecutor, workforceQueryExecutorStream } = require('../modules/workforce-query-executor');
  const { setWorkforceQueryExecutorAdapter, setWorkforceQueryExecutorStreamAdapter } = require('./routes/workforce-chat');
  setWorkforceQueryExecutorAdapter(workforceQueryExecutor);
  setWorkforceQueryExecutorStreamAdapter(workforceQueryExecutorStream);
  ```
- The `workforce-query-executor` module calls `api.githubcopilot.com/chat/completions` (same API host as the main web UI's skill turn executor). Bearer token is read from `req.session.accessToken` — **never** `req.session.token`.
- SSE streaming format: server sends `data: { chunk, draftChunk, done, artefactContent, error }` events. Client reads via `r.body.getReader()` — same pattern as the main web UI chat.
- Chat is accessible from the main nav of the workforce-ui (`GET /workforce-chat` link appears in all intelligence view pages).
- `src/web-ui/server.js`, `src/web-ui/routes/skills.js`, and all Phase 1 route handlers are not modified by this story.

### D37 Adapter stub rule
The stub defaults for both adapters MUST throw with a descriptive error, not return an empty or null response:
```js
let _workforceQueryExecutor = () => { throw new Error('Adapter not wired: workforceQueryExecutor. Call setWorkforceQueryExecutorAdapter() with a real implementation before use.'); };
let _workforceQueryExecutorStream = () => { throw new Error('Adapter not wired: workforceQueryExecutorStream. Call setWorkforceQueryExecutorStreamAdapter() with a real implementation before use.'); };
```
This prevents a misconfigured server from silently returning an empty response that looks like a successful NL query.

## 3-Tier Context Window Strategy

The context window sent to GPT-4o on each turn is assembled from three tiers:

**Tier 1 — Always-on (every turn):**
- Full `workforce/teams.json` content.
- Summarised roster: array of `{ name, teamId, skills }` objects from `workforce/roster.json` — excludes all other fields (employment type, cost, endDate, etc.) to minimise PII in every turn.
- Current quarter (derived from server date) — used to ground temporal questions.

**Tier 2 — On-demand (included when the query warrants it):**
- `workforce/initiative-map.json` — included when the query contains keywords related to initiatives, allocations, FTE, coverage, or assignment (keyword detection is a simple string match on the user's message — no semantic classification required in Phase 2).
- `workforce/allocation-input.json` — included alongside initiative-map.json when keywords suggest the operator is asking about proposed rather than computed allocations.

**Tier 3 — Confirm (operator explicitly requests full roster detail):**
- Full `workforce/roster.json` content including all fields (employment type, cost, endDate, location, etc.).
- Requires the operator to click "Include full roster details" in the chat UI before the turn is submitted. A visual warning is shown: "Full roster data including cost and contract details will be sent to the AI model for this turn."
- Tier 3 is opt-in per turn — it does not persist to subsequent turns. Tier 3 is only available in non-test mode.

## Example Queries and Expected Response Shapes

| Query | Tier(s) used | Expected response shape |
|-------|-------------|------------------------|
| "Which teams have no Java coverage?" | T1 | List of team names + member counts |
| "How many people roll off in Q3?" | T1 | Count + names grouped by team |
| "Which initiatives are at risk of under-coverage next quarter?" | T1+T2 | List of initiative slugs + missing tags |
| "Who should I assign to initiative-x given its required tags?" | T1+T2 | Ranked team suggestions with match scores |
| "What is the total FTE cost of the Platform Engineering group?" | T1+T3 | FTE count + estimated cost (operator confirmed T3) |

## Acceptance Criteria

**AC1 (route registration — GET /workforce-chat):** Given an authenticated operator navigates to `GET /workforce-chat`, then the server returns `200 text/html` containing a chat interface. The interface includes: a message input field, a send button, a streaming response area, an "Include full roster details" toggle (unchecked by default), and a nav link back to the intelligence dashboard. The chat HTML is an inline single-file response — no external CSS or JS files.

**AC2 (route registration — POST /api/workforce-chat/turn, non-streaming):** Given an authenticated `POST /api/workforce-chat/turn` with body `{ "message": "...", "history": [...], "includeFullRoster": false }`, when the handler processes the request, then it assembles the context window (Tier 1 always; Tier 2 if message keywords match; Tier 3 only if `includeFullRoster: true`), calls `_workforceQueryExecutor` with the assembled prompt and conversation history, and returns `200 application/json { response: "...", tiersUsed: ["T1"] }`. If `_workforceQueryExecutor` throws, the response is `500 application/json { error: "Workforce query failed. Check server logs." }` — raw error messages are not forwarded to the client.

**AC3 (route registration — POST /api/workforce-chat/turn-stream, SSE streaming):** Given an authenticated `POST /api/workforce-chat/turn-stream` with the same body shape as AC2, when the handler processes the request, then it sets response headers `Content-Type: text/event-stream` and `Cache-Control: no-cache`, and calls `_workforceQueryExecutorStream` to stream SSE events in the format `data: { "chunk": "...", "draftChunk": "...", "done": false }` (same format as the main web UI chat). The final event has `"done": true`. If streaming fails after headers are sent, the server sends `data: { "error": "Stream interrupted", "done": true }` as the final event.

**AC4 (D37 adapter wiring verification — test mode):** Given `NODE_ENV === 'test'` and neither adapter has been wired via the setter (both are still the default stub), when a test calls the handler function directly with a mock request, then the handler throws (or returns a 500 response wrapping the thrown error) with message containing "Adapter not wired: workforceQueryExecutor". This test confirms the stub throws rather than returning silently.

**AC5 (D37 production wiring verification):** Given `NODE_ENV !== 'test'` and the server has started via `npm run workforce`, when a test inspects the module state after server boot, then `_workforceQueryExecutor` and `_workforceQueryExecutorStream` are not the default stub functions (i.e. they have been replaced by `setWorkforceQueryExecutorAdapter` and `setWorkforceQueryExecutorStreamAdapter` respectively in `server.js`). This is verified by a smoke test that confirms the adapters are non-stub after server initialisation.

**AC6 (Tier 1 context always included):** Given any `POST /api/workforce-chat/turn` or `turn-stream` call, when the context window is assembled, then `teams.json` (full content) and the summarised roster (`{ name, teamId, skills }` only) are always included regardless of the message content or `includeFullRoster` value.

**AC7 (Tier 2 on-demand inclusion):** Given a `POST /api/workforce-chat/turn` body where `message` contains at least one of the keywords: "initiative", "allocation", "FTE", "assigned", "coverage", "map", when the context window is assembled, then `workforce/initiative-map.json` content is included. If `initiative-map.json` does not exist, a note is added to the context: "Note: initiative-map.json is not present. Run workforce-map to generate it." The `tiersUsed` response field includes `"T2"`.

**AC8 (Tier 3 opt-in):** Given `includeFullRoster: true` in the request body, when the context window is assembled, then the full `workforce/roster.json` content (all fields) is included in addition to Tier 1 content. The `tiersUsed` response field includes `"T3"`. Given `includeFullRoster: false` or the field is absent, then only the summarised roster is included and `tiersUsed` does not include `"T3"`.

**AC9 (Bearer token from accessToken):** Given a request to either turn endpoint, when the handler constructs the API call to `api.githubcopilot.com/chat/completions`, then the Authorization header is `Bearer ${req.session.accessToken}`. The handler must not reference `req.session.token`. A test confirms that a request with `req.session.token` set but `req.session.accessToken` absent causes the API call to fail with a meaningful error (token missing) rather than silently sending a null token.

**AC10 (nav link from all intelligence pages):** Given any of the intelligence HTML views (heat-map, bottlenecks, temporal-risk, scenarios) is rendered by the server, then each page includes a nav link `<a href="/workforce-chat">Ask a question</a>` in the page header. This is verified by a test that checks the HTML response of each route for the presence of this anchor.

## Out of Scope

- Persisting chat history to disk or session storage.
- Multi-session or multi-user chat threads.
- System prompt customisation via UI.
- Tier 3 full-roster access in automated test mode (`NODE_ENV === 'test'`).
- Writing to any `workforce/` or `portfolio/` file as a result of a chat turn.
- Modifying `src/web-ui/server.js`, `src/web-ui/routes/skills.js`, or any Phase 1 route handlers.
- Response streaming to mobile or narrow viewports — 1280px desktop Chrome and Firefox only.

## NFRs

- **Security:** All three routes require `authGuard`. `req.session.accessToken` is the canonical token field. The Tier 3 full-roster payload must not be included when `includeFullRoster` is absent or false. Raw file paths must not appear in client-visible error responses. Request body size for turn endpoints is limited to 128 KB server-side (`413` response if exceeded).
- **PII:** Tier 1 summarised roster excludes employment type, cost, endDate, location, and any field not in `{ name, teamId, skills }`. This is the only roster data sent to GPT-4o on every turn. Tier 3 full-roster data is sent only on explicit opt-in per turn.
- **Performance:** `POST /api/workforce-chat/turn` (non-streaming) must return a complete response within 30 seconds. `POST /api/workforce-chat/turn-stream` must deliver the first SSE chunk within 5 seconds of the request being received.
- **Observability:** The server logs (to stderr) the tiers used per request and the token count of the assembled context window (approximate). No API response content is logged. If the GPT-4o API call fails, the error code and message are logged to stderr but not forwarded to the client.

## Complexity Rating

**Rating:** 3
**Rationale:** Injectable adapter pattern with D37 stub-throws-not-empty requirement; 3-tier context window assembly with keyword-based tier promotion; SSE streaming with the same event format as the main web UI; Bearer token from `req.session.accessToken` (session field correctness is a known failure mode in this codebase); production wiring in server.js with test-mode verification; nav link injection across all existing intelligence page routes. The GPT-4o API call itself is straightforward (reuses established pattern from skill-turn-executor). The complexity is in the integration correctness — adapter wiring, token field, tier assembly, and SSE format all have specific requirements.
**Scope stability:** Stable. Context window tiers and adapter pattern are fully specified. Example queries define expected behaviour without requiring machine-learning accuracy — the GPT-4o model handles response quality; this story specifies the wiring and context assembly only.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
