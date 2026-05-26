# Test Plan: Workforce chat interface — intelligence server

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.16.md
**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-planning-dashboard.md
**Test plan author:** Copilot
**Date:** 2026-05-27

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | GET /workforce-chat → 200 HTML with chat interface, tier toggles, nav link | — | 1 test | — | 1 scenario (visual chat layout) | CSS-layout-dependent | 🟡 |
| AC2 | POST /api/workforce-chat/turn body shape; assembles context tiers; calls adapter; returns { response, tiersUsed } | 4 tests | — | — | — | — | 🟢 |
| AC3 | POST /api/workforce-chat/turn-stream → SSE stream, Content-Type: text/event-stream, Cache-Control: no-cache | — | 2 tests | — | — | — | 🟢 |
| AC4 | In test mode with stub not wired → throws "Adapter not wired: workforceQueryExecutor" | 2 tests | — | — | — | — | 🟢 |
| AC5 | __getAdapters() export (NODE_ENV=test) returns non-stub after wiring | 2 tests | — | — | — | — | 🟢 |
| AC6 | T1 context: always included — full teams.json + summarised roster (name, teamId, skills) | 3 tests | — | — | — | — | 🟢 |
| AC7 | T2 context: on 14 keywords OR includeTier2:true; initiative-map note if absent; allocation-input.json silently omitted if absent | 4 tests | — | — | — | — | 🟢 |
| AC8 | T3 context: on includeFullRoster:true; T3 = full roster.json; tiersUsed includes "T3" | 3 tests | — | — | — | — | 🟢 |
| AC9 | Bearer token uses req.session.accessToken; must not use req.session.token | 2 tests | — | — | — | — | 🟢 |
| AC10 | Nav link `<a href="/workforce-chat">Ask a question</a>` on all intelligence pages | — | 1 test | — | — | — | 🟢 |
| NFR-SEC | authGuard all 3 routes; body size 128KB limit; 413 on oversize | 4 tests | — | — | — | — | 🟢 |
| NFR-PII | T1 roster context is summarised only — name, teamId, skills (no startDate, endDate, status) | 2 tests | — | — | — | — | 🟢 |
| NFR-COMPAT | 1280px viewport — chat interface no horizontal scroll | — | — | — | 1 scenario | CSS-layout-dependent | 🔴 RISK-ACCEPT |

---

## Coverage gaps

| Gap | AC | Gap type | Handling |
|-----|----|-----------|---------| 
| Visual chat layout (message bubbles, toggle switches styling) | AC1 | CSS-layout-dependent | Manual scenario 1b |
| 1280px horizontal scroll | NFR-COMPAT | CSS-layout-dependent | RISK-ACCEPT in decisions |

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup
**Adapter pattern:** `_workforceQueryExecutor` and `_workforceQueryExecutorStream` injected via `setWorkforceQueryExecutorAdapter()` and `setWorkforceQueryExecutorStreamAdapter()` in test setup
**Stub defaults MUST throw** (per D37) — test AC4 explicitly verifies throws before wiring
**`__getAdapters()` available when `NODE_ENV=test`** — test AC5 verifies wiring produces non-stub
**T1 PII constraint:** Only `name`, `teamId`, `skills` fields included in context — `startDate`, `endDate`, `status` must NOT appear in context string

---

## Unit Tests

### POST /api/workforce-chat/turn — T1 context always assembled

- **Verifies:** AC2, AC6
- **Precondition:** Stub adapter wired (returns `{ response: "ok", tiersUsed: ["T1"] }`); request body `{ message: "hello", history: [], includeFullRoster: false, includeTier2: false }`
- **Action:** Call route handler
- **Expected result:** Adapter called; context argument passed to adapter contains full `teams.json` content AND summarised roster; `tiersUsed` in response includes `"T1"`
- **Edge case:** No

### POST /api/workforce-chat/turn — returns { response, tiersUsed } shape

- **Verifies:** AC2
- **Precondition:** Stub adapter wired
- **Action:** POST /api/workforce-chat/turn with valid body
- **Expected result:** Response body has both `response` string and `tiersUsed` array
- **Edge case:** No

### POST /api/workforce-chat/turn — request body shape validation (missing message field)

- **Verifies:** AC2
- **Precondition:** POST body missing `message` field: `{ history: [], includeFullRoster: false, includeTier2: false }`
- **Action:** POST /api/workforce-chat/turn
- **Expected result:** HTTP 400; error message indicates missing `message` field
- **Edge case:** Yes — invalid input

### POST /api/workforce-chat/turn — context forwarded to adapter

- **Verifies:** AC2
- **Precondition:** Spy adapter that captures the context argument; T1 fixture data loaded
- **Action:** POST with `{ message: "who handles java?", history: [], includeFullRoster: false, includeTier2: false }`
- **Expected result:** Adapter called with `{ context, message, history }`; context is non-empty string containing T1 data
- **Edge case:** No

### stub throws "Adapter not wired: workforceQueryExecutor" before wiring

- **Verifies:** AC4
- **Precondition:** `NODE_ENV=test`; do NOT call `setWorkforceQueryExecutorAdapter()` (leave stub default)
- **Action:** POST /api/workforce-chat/turn
- **Expected result:** Request results in an error containing `"Adapter not wired: workforceQueryExecutor"`; HTTP 500 or thrown error logged; no silent null/undefined response
- **Edge case:** Yes — D37 compliance

### stub throws for streaming adapter before wiring

- **Verifies:** AC4
- **Precondition:** `NODE_ENV=test`; do NOT call `setWorkforceQueryExecutorStreamAdapter()`
- **Action:** POST /api/workforce-chat/turn-stream
- **Expected result:** Error thrown matching `"Adapter not wired: workforceQueryExecutorStream"`
- **Edge case:** Yes — D37 compliance (streaming adapter)

### __getAdapters() returns stub before wiring (NODE_ENV=test)

- **Verifies:** AC5
- **Precondition:** `NODE_ENV=test`; no `setWorkforceQueryExecutorAdapter()` called
- **Action:** Import module; call `__getAdapters()`
- **Expected result:** Returns object with `workforceQueryExecutor` function; that function throws when called
- **Edge case:** No

### __getAdapters() returns non-stub after setWorkforceQueryExecutorAdapter called

- **Verifies:** AC5
- **Precondition:** `NODE_ENV=test`; call `setWorkforceQueryExecutorAdapter(customFn)` with a real (non-throwing) function
- **Action:** Call `__getAdapters()`
- **Expected result:** `workforceQueryExecutor` is `customFn`; does NOT throw when called
- **Edge case:** No

### T1 — full teams.json included in context

- **Verifies:** AC6
- **Precondition:** `teams.json` has team `{ teamId: "team-alpha", name: "Alpha Squad" }`; spy adapter captures context
- **Action:** POST /api/workforce-chat/turn
- **Expected result:** Context string contains `"team-alpha"` and `"Alpha Squad"` (full teams.json content)
- **Edge case:** No

### T1 — roster summarised to name, teamId, skills only (PII safeguard)

- **Verifies:** AC6, NFR-PII
- **Precondition:** Roster member has fields: `name, teamId, skills, startDate, endDate, status`; spy adapter captures context
- **Action:** POST /api/workforce-chat/turn
- **Expected result:** Context string contains `name`, `teamId`, `skills`; does NOT contain `startDate`, `endDate`, `status` values from roster
- **Edge case:** No

### T1 — summarised roster in context does not include raw roster JSON fields

- **Verifies:** NFR-PII
- **Precondition:** Spy captures context; roster has `status: "active"` and `startDate: "2023-01-15"`
- **Action:** POST /api/workforce-chat/turn (no T2/T3 flags)
- **Expected result:** Context string does NOT contain `"startDate"` or `"status"` as keys in the roster data section
- **Edge case:** No

### T2 — triggered by keyword in message

- **Verifies:** AC7
- **Precondition:** POST body `{ message: "which initiatives need java skills?" }` (contains keyword "initiatives")
- **Action:** POST /api/workforce-chat/turn; spy on context assembly
- **Expected result:** Context includes T2 data (initiative-map.json content or allocation-input.json content); `tiersUsed` includes `"T2"`
- **Edge case:** No

### T2 — triggered by includeTier2:true flag

- **Verifies:** AC7
- **Precondition:** POST body `{ message: "hello", includeTier2: true }` (no keywords)
- **Action:** POST /api/workforce-chat/turn
- **Expected result:** T2 included; `tiersUsed` includes `"T2"`
- **Edge case:** No

### T2 — initiative-map note added when initiative-map.json absent

- **Verifies:** AC7
- **Precondition:** `initiative-map.json` file absent; T2 triggered
- **Action:** POST /api/workforce-chat/turn with `includeTier2: true`
- **Expected result:** Context includes a note such as "No initiative-map.json found"; no crash; `tiersUsed` includes `"T2"`
- **Edge case:** Yes — graceful missing file

### T2 — allocation-input.json silently omitted when absent

- **Verifies:** AC7
- **Precondition:** `allocation-input.json` file absent; T2 triggered
- **Action:** POST /api/workforce-chat/turn with `includeTier2: true`
- **Expected result:** Context assembled without allocation-input data; no error thrown; no note added about absent allocation-input; `tiersUsed` still includes `"T2"`
- **Edge case:** Yes — silent omission (contrast with initiative-map which adds a note)

### T3 — full roster included when includeFullRoster:true

- **Verifies:** AC8
- **Precondition:** POST body `{ message: "list everyone", includeFullRoster: true }`; spy adapter
- **Action:** POST /api/workforce-chat/turn
- **Expected result:** Context includes full roster.json (all fields, not just T1 summary); `tiersUsed` includes `"T3"`
- **Edge case:** No

### T3 — tiersUsed includes T3 only when requested

- **Verifies:** AC8
- **Precondition:** POST body with `includeFullRoster: true` and `includeTier2: false`
- **Action:** POST /api/workforce-chat/turn
- **Expected result:** `tiersUsed` includes `"T3"`; also includes `"T1"` (T1 always present)
- **Edge case:** No

### T3 absent — full roster not in context when includeFullRoster:false

- **Verifies:** AC8
- **Precondition:** POST body `{ message: "hello", includeFullRoster: false, includeTier2: false }`; roster has startDate fields
- **Action:** POST /api/workforce-chat/turn
- **Expected result:** Context does NOT contain the full raw roster (no `startDate` fields); `tiersUsed` does NOT include `"T3"`
- **Edge case:** No

### accessToken — Bearer token uses req.session.accessToken

- **Verifies:** AC9
- **Precondition:** `req.session.accessToken = "test-token-abc"`; spy adapter captures the authorization header or credentials passed
- **Action:** POST /api/workforce-chat/turn
- **Expected result:** Adapter receives or the route assembles a Bearer header using `"test-token-abc"`
- **Edge case:** No

### accessToken — must not use req.session.token

- **Verifies:** AC9
- **Precondition:** `req.session.token = "wrong-token-xyz"` (set wrong field); `req.session.accessToken` absent
- **Action:** Check source code statically: grep for `req.session.token[^A]` must return zero results in workforce server
- **Expected result:** Zero occurrences of `req.session.token` (without `Access`) in src/workforce-ui/server.js; any reference would be a defect
- **Edge case:** Yes — canonical field name enforcement

### authGuard blocks all 3 unauthenticated routes

- **Verifies:** NFR-SEC
- **Precondition:** No session cookie
- **Action:** GET /workforce-chat; POST /api/workforce-chat/turn; POST /api/workforce-chat/turn-stream — all without auth
- **Expected result:** All 3 return non-200 (redirect or 401)
- **Edge case:** No

### body size limit 128KB — POST /api/workforce-chat/turn returns 413 on oversize

- **Verifies:** NFR-SEC
- **Precondition:** POST body with 130KB+ payload (large history array)
- **Action:** POST /api/workforce-chat/turn
- **Expected result:** HTTP 413
- **Edge case:** Yes — security boundary

### body size limit 128KB — POST /api/workforce-chat/turn-stream returns 413 on oversize

- **Verifies:** NFR-SEC
- **Precondition:** POST body with 130KB+ payload
- **Action:** POST /api/workforce-chat/turn-stream
- **Expected result:** HTTP 413
- **Edge case:** Yes

---

## Integration Tests

### GET /workforce-chat returns 200 HTML with required interface elements

- **Verifies:** AC1
- **Components involved:** HTTP server, HTML response generation
- **Precondition:** Authenticated session
- **Action:** GET /workforce-chat; parse HTML
- **Expected result:** Status 200; Content-Type: text/html; contains chat input field; contains tier toggle controls for T2/T3; contains `<a href="/workforce-chat">Ask a question</a>` nav link (AC10 also checked here); no external CDN

### POST /api/workforce-chat/turn-stream returns SSE headers

- **Verifies:** AC3
- **Components involved:** HTTP server, streaming response
- **Precondition:** Streaming adapter wired with a stub that emits 3 chunks then closes; authenticated session
- **Action:** POST /api/workforce-chat/turn-stream with valid body
- **Expected result:** Response headers: `Content-Type: text/event-stream`; `Cache-Control: no-cache`; `Connection: keep-alive`

### POST /api/workforce-chat/turn-stream emits SSE data events

- **Verifies:** AC3
- **Components involved:** HTTP server, streaming response
- **Precondition:** Streaming adapter emits chunks `["Hello", " world", "!"]`; authenticated session
- **Action:** POST /api/workforce-chat/turn-stream; read full stream
- **Expected result:** Response body contains `data:` prefixed SSE lines; chunks in order; stream closes after adapter finishes

### Nav link on all intelligence HTML pages

- **Verifies:** AC10
- **Components involved:** All 4 intelligence HTML routes
- **Precondition:** Authenticated session
- **Action:** GET /intelligence/heat-map, /intelligence/bottlenecks, /intelligence/temporal-risk, /intelligence/scenarios
- **Expected result:** All 4 responses contain `<a href="/workforce-chat">Ask a question</a>` (or equivalent nav link)
