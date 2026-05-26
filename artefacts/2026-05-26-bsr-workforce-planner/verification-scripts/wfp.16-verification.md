# AC Verification Script — wfp.16 Workforce chat interface

**Story:** wfp.16
**Run context:** After implementation, before PR
**Estimated duration:** ~7 minutes (excluding scale test)
**Test file:** `tests/workforce/check-wfp16-workforce-chat.js`
**Critical checks:** D37 adapter wiring (AC4, AC5), accessToken canonical field (AC9), T1 PII safeguard (NFR-PII)

---

## Pre-conditions

- Intelligence server starts without crashing in test mode (`NODE_ENV=test`)
- `setWorkforceQueryExecutorAdapter()` and `setWorkforceQueryExecutorStreamAdapter()` exported from server module
- `__getAdapters()` exported when `NODE_ENV=test`
- `workforce/teams.json`, `workforce/roster.json` exist

---

## Scenario 1a — GET /workforce-chat HTML structure

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp16-workforce-chat.js --scenario html-structure
```

**Steps:**
1. GET /workforce-chat (authenticated)
2. Parse HTML

**Expected:**
- Status 200
- Content-Type: text/html
- Contains chat input element (textarea or input[type=text])
- Contains T2 and T3 tier toggle controls
- Contains nav link `<a href="/workforce-chat">Ask a question</a>`
- No external CDN

**Pass/Fail indicator:** `[wfp.16-AC1] PASS` or `[wfp.16-AC1] FAIL: <reason>`

---

## Scenario 1b — Visual chat layout (manual — CSS-layout-dependent)

⚠️ **Manual step.**

1. Start `npm run workforce`; open `/workforce-chat` (logged in)
2. Verify:
   - Chat message area visible and scrollable
   - Tier toggle controls visible and labelled (T2, T3)
   - Input field and send button accessible at 1280px

**Outcome:** Record PASS / FAIL.

---

## Scenario 2 — Non-streaming turn response shape

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp16-workforce-chat.js --scenario turn-response-shape
```

**Steps:**
1. Wire stub adapter: `setWorkforceQueryExecutorAdapter(async () => ({ response: "ok", tiersUsed: ["T1"] }))`
2. POST /api/workforce-chat/turn `{ message: "hello", history: [], includeFullRoster: false, includeTier2: false }`
3. Check response shape

**Expected:**
- Status 200
- Body has `response` (string) and `tiersUsed` (array)
- `tiersUsed` includes `"T1"`

**Pass/Fail indicator:** `[wfp.16-AC2] PASS` or `[wfp.16-AC2] FAIL: <reason>`

---

## Scenario 3 — SSE streaming headers and events

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp16-workforce-chat.js --scenario sse-stream
```

**Steps:**
1. Wire streaming adapter that emits 3 chunks
2. POST /api/workforce-chat/turn-stream (authenticated); capture response headers and body

**Expected:**
- `Content-Type: text/event-stream`
- `Cache-Control: no-cache`
- Response body contains `data: ` prefixed lines
- Stream terminates after adapter completes

**Pass/Fail indicator:** `[wfp.16-AC3] PASS` or `[wfp.16-AC3] FAIL: <reason>`

---

## Scenario 4 — D37 stub throws before wiring (critical)

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp16-workforce-chat.js --scenario stub-throws
```

**Steps:**
1. `NODE_ENV=test`; do NOT call `setWorkforceQueryExecutorAdapter()` (stub default in place)
2. POST /api/workforce-chat/turn
3. Capture error

**Expected:**
- Error message contains `"Adapter not wired: workforceQueryExecutor"`
- NO silent null/empty response
- Server does not crash (error is caught and returned as 500 or logged)

**Step 4b:** Same for streaming adapter: POST /api/workforce-chat/turn-stream without wiring
**Expected:** Error message contains `"Adapter not wired: workforceQueryExecutorStream"`

**Pass/Fail indicator:** `[wfp.16-AC4] PASS` or `[wfp.16-AC4] FAIL: silent stub found (D37 violation)`

---

## Scenario 5 — __getAdapters() wiring verification

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp16-workforce-chat.js --scenario getadapters
```

**Steps:**
1. Import module with `NODE_ENV=test`
2. Call `__getAdapters()` before wiring → confirm adapter throws
3. Call `setWorkforceQueryExecutorAdapter(realFn)`
4. Call `__getAdapters()` again → confirm adapter is `realFn` (non-throwing)

**Expected:**
- Pre-wiring: `__getAdapters().workforceQueryExecutor` throws on call
- Post-wiring: `__getAdapters().workforceQueryExecutor === realFn`

**Pass/Fail indicator:** `[wfp.16-AC5] PASS` or `[wfp.16-AC5] FAIL: <reason>`

---

## Scenario 6 — T1 context assembled correctly

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp16-workforce-chat.js --scenario t1-context
```

**Steps:**
1. Spy adapter that captures context argument
2. POST with `{ message: "hello", includeFullRoster: false, includeTier2: false }`
3. Inspect context string

**Expected:**
- Context contains full teams.json content (e.g. team-alpha team name)
- Context contains summarised roster with `name`, `teamId`, `skills`
- Context does NOT contain `startDate`, `endDate`, `status` from roster

**Pass/Fail indicator:** `[wfp.16-AC6] PASS` or `[wfp.16-AC6] FAIL: <reason>`

---

## Scenario 7 — T2 context on keyword and flag

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp16-workforce-chat.js --scenario t2-context
```

**Steps:**
1. Spy adapter; POST with message containing keyword (e.g. "initiatives") → check T2 included
2. POST with `includeTier2: true` and no keyword → check T2 included
3. POST with no keyword and `includeTier2: false` → check T2 absent

**Expected:**
- Steps 1, 2: `tiersUsed` includes `"T2"`; context includes initiative-map data
- Step 3: `tiersUsed` does NOT include `"T2"`; context does NOT include initiative-map data

**Step 7b:** initiative-map.json absent; POST with `includeTier2: true`
**Expected:** Context includes "No initiative-map.json found" note; no crash

**Step 7c:** allocation-input.json absent; POST with `includeTier2: true`
**Expected:** Context assembled without allocation-input section; NO error or note about absent allocation-input

**Pass/Fail indicator:** `[wfp.16-AC7] PASS` or `[wfp.16-AC7] FAIL: <reason>`

---

## Scenario 8 — T3 full roster context

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp16-workforce-chat.js --scenario t3-context
```

**Steps:**
1. Spy adapter; POST with `{ includeFullRoster: true }`
2. Check context includes full roster.json (including `startDate` which is absent from T1)
3. POST with `{ includeFullRoster: false }` → check `startDate` absent from context

**Expected:**
- T3 request: context contains full roster fields including `startDate`; `tiersUsed` includes `"T3"` and `"T1"`
- Non-T3 request: context does NOT contain `startDate`; `tiersUsed` does NOT include `"T3"`

**Pass/Fail indicator:** `[wfp.16-AC8] PASS` or `[wfp.16-AC8] FAIL: <reason>`

---

## Scenario 9 — accessToken canonical field

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp16-workforce-chat.js --scenario access-token
```

**Step A — Runtime check:**
1. Set `req.session.accessToken = "test-token-abc"` in request; spy adapter captures args
2. POST /api/workforce-chat/turn
3. Verify context assembly or adapter call includes `"test-token-abc"` (not null/undefined)

**Expected:** Adapter receives token derived from `req.session.accessToken`

**Step B — Static grep check:**
```powershell
Select-String -Pattern "req\.session\.token[^A]" src/workforce-ui/server.js
```
**Expected:** Zero matches

**Pass/Fail indicator:** `[wfp.16-AC9] PASS` or `[wfp.16-AC9] FAIL: req.session.token found (canonical field violation)`

---

## Scenario 10 — Auth guard on all 3 routes

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp16-workforce-chat.js --scenario auth-guard
```

**Steps:**
1. GET /workforce-chat — no session → non-200
2. POST /api/workforce-chat/turn — no session → non-200
3. POST /api/workforce-chat/turn-stream — no session → non-200

**Pass/Fail indicator:** `[wfp.16-SEC-auth] PASS` or `[wfp.16-SEC-auth] FAIL: <route>`

---

## Scenario 11 — 128KB body size limit

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp16-workforce-chat.js --scenario body-size
```

**Steps:**
1. POST /api/workforce-chat/turn with 130KB+ body
2. POST /api/workforce-chat/turn-stream with 130KB+ body

**Expected:** Both return HTTP 413

**Pass/Fail indicator:** `[wfp.16-SEC-size] PASS` or `[wfp.16-SEC-size] FAIL: <reason>`

---

## Scenario 12 — Nav link on all intelligence pages

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp16-workforce-chat.js --scenario nav-link
```

**Steps:**
1. GET /intelligence/heat-map, /intelligence/bottlenecks, /intelligence/temporal-risk, /intelligence/scenarios (all authenticated)
2. Check each HTML response for nav link

**Expected:** All 4 contain `<a href="/workforce-chat">Ask a question</a>` (or equivalent)

**Pass/Fail indicator:** `[wfp.16-AC10] PASS` or `[wfp.16-AC10] FAIL: missing on <page>`

---

## Scenario 13 — T1 PII safeguard (NFR-PII)

**Command:**
```bash
NODE_ENV=test node tests/workforce/check-wfp16-workforce-chat.js --scenario pii-safeguard
```

**Steps:**
1. Roster member has: `{ name: "Alice", teamId: "team-alpha", skills: ["java"], startDate: "2023-01-15", endDate: null, status: "active" }`
2. Spy adapter; POST with `{ message: "hello", includeFullRoster: false, includeTier2: false }`
3. Check context string

**Expected:**
- Context contains `"Alice"`, `"team-alpha"`, `"java"`
- Context does NOT contain `"2023-01-15"` (startDate) or `"active"` (status) in any roster section

**Pass/Fail indicator:** `[wfp.16-NFR-PII] PASS` or `[wfp.16-NFR-PII] FAIL: PII field found in context`

---

## Scenario 14 — Compatibility: 1280px (manual — RISK-ACCEPT)

⚠️ **Manual — RISK-ACCEPT logged in decisions.md.**

1. Open `/workforce-chat` at 1280px viewport
2. Check no horizontal scrollbar

**Outcome:** Record PASS / FAIL.

---

## Summary

```
Automated scenarios: 1a, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13
Manual scenarios: 1b (visual layout), 14 (RISK-ACCEPT)
All automated scenarios must PASS before opening PR.
Scenario 4 (D37 stub throws) and Scenario 9B (grep for req.session.token) are hard compliance checks.
```
