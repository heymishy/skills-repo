# Test Plan: ep1-s1 — Add GET /status Route

**Story ID:** wsap-s3-verify-s1
**Title:** Add GET /status route returning { status: "ok" }
**Date:** 2026-09-15
**Test Framework:** Node.js `assert` + async test helpers
**Test Runner Command:** `npm test`

---

## Test Data Strategy

**Strategy:** Synthetic — tests generate their own route handler and mock request/response objects in setup/teardown.

**Data sourcing:** No external data, fixtures, or database required. Route returns a hardcoded response `{ status: "ok" }`.

**PCI/Sensitivity:** None — route contains no sensitive data.

---

## AC Coverage Table

| AC | Test Type | Coverage | Notes |
|---|---|---|---|
| AC1 | Unit | ✓ | Response shape and status code assertion |
| AC2 | Unit | ✓ | Route registration in server.js via direct handler call |
| AC3 | Unit | ✓ | JSON validity via `JSON.parse()` |

**Gap Table:** No gaps. All ACs are unit-testable.

---

## Unit Tests

### Test 1: GET /status Returns Correct Response Shape
**AC covered:** AC1
**Precondition:** Route handler is imported and callable
**Action:** Invoke route handler with mock request object; capture response
**Expected result:** Response status is 200; body when parsed is `{ status: "ok" }`
**Edge case:** None identified

### Test 2: GET /status Route is Registered in server.js
**AC covered:** AC2
**Precondition:** `src/web-ui/server.js` is loaded
**Action:** Inspect server route table (or make a direct HTTP call if server is running); verify `/status` route exists
**Expected result:** Route exists and is reachable without authentication headers
**Edge case:** Route should not require `req.session` or bearer token

### Test 3: GET /status Response is Valid JSON
**AC covered:** AC3
**Precondition:** Route handler returns a response
**Action:** Call `JSON.parse()` on the response body
**Expected result:** Parse succeeds with no syntax error; result is an object with a `status` field
**Edge case:** Malformed JSON would throw `SyntaxError`; test verifies this does NOT happen

### Test 4: GET /status Response Body Structure
**AC covered:** AC1 (implicit — verifies exact shape match)
**Precondition:** Route handler returns a response
**Action:** Parse response body and inspect field names and types
**Expected result:** Response object has exactly one field: `status` (type: string, value: "ok")
**Edge case:** Response should not include extra fields (e.g. no `timestamp`, `version`, or other fields yet)

---

## Integration Tests

### Integration Test 1: GET /status Route Accessible via HTTP
**Precondition:** Web UI server (`src/web-ui/server.js`) is running on localhost
**Action:** Make HTTP GET request to `http://localhost:3000/status`
**Expected result:** Response status is 200; body is valid JSON with `{ status: "ok" }`
**Edge case:** Verify request succeeds without authentication (no `Authorization` header required)

---

## NFR Tests

**Story NFRs:** None stated in the story artefact.

**Result:** No NFR tests written. Story confirmed: NFRs = None.

---

## AC Verification Script

### Setup
1. Ensure the web UI server is running: `npm run dev` (or equivalent `node src/web-ui/server.js`)
2. Server should start on `http://localhost:3000` (or output its actual URL)

### Scenario 1: Verify /status Route Returns Correct Response (AC1 + AC3)
1. Open a terminal and run: `curl -s http://localhost:3000/status`
2. Inspect the output — it should be: `{"status":"ok"}`
3. Confirm the output is valid JSON (no syntax errors)
4. **Expected:** HTTP 200 response; JSON body with `status: "ok"`

### Scenario 2: Verify Route is Reachable Without Authentication (AC2)
1. From the same terminal, run: `curl -i http://localhost:3000/status` (include headers)
2. Inspect the response headers — should see `HTTP/1.1 200 OK` or equivalent
3. Confirm no `Authorization` header was required to reach the route
4. **Expected:** No 401 or 403 response; route is public

### Scenario 3: Verify Response Shape (AC1 Detailed)
1. Run: `curl -s http://localhost:3000/status | jq .`
2. Inspect the parsed JSON output — confirm it matches exactly: `{ "status": "ok" }`
3. Confirm no additional fields are present (e.g. no `version`, `uptime`, or timestamps yet)
4. **Expected:** Single field `status` with string value `"ok"`

---

## Quality Checks

✓ Every AC has at least one test
✓ Every test has a specific expected result
✓ Test data strategy: Synthetic (no external dependencies)
✓ PCI/sensitivity: None
✓ NFR tests: None (story has no NFRs)
✓ Gap table: No gaps
✓ Verification script: Plain language, curl-based, operator-runnable
✓ All tests written to fail (no route exists yet)

---