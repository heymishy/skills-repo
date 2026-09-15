# Test Plan: ep1-s3 — Add Uptime Field to /status Response

**Story ID:** wsap-s3-verify-s3
**Title:** Add Uptime Field to /status Response
**Date:** 2026-09-15
**Test Framework:** Node.js `assert` + async test helpers
**Test Runner Command:** `npm test`

---

## Test Data Strategy

**Strategy:** Synthetic — tests generate their own route handler with mock request/response objects in setup/teardown; server startup time is tracked in-memory.

**Data sourcing:** No external data, fixtures, or database required. Route computes uptime from process startup time captured at server initialization.

**PCI/Sensitivity:** None — route contains no sensitive data.

---

## AC Coverage Table

| AC | Test Type | Coverage | Notes |
|---|---|---|---|
| AC1 | Unit | ✓ | Response shape with uptime field; uptime is non-negative integer |
| AC2 | Unit | ✓ | Uptime field type and value (non-negative integer) |
| AC3 | Integration | ✓ | Uptime increases on successive calls with delay |
| AC4 | Unit | ✓ | JSON validity via `JSON.parse()` |

**Gap Table:** No gaps. All ACs are testable at unit or integration level.

---

## Unit Tests

### Test 1: GET /status Returns Correct Response Shape with Uptime
**AC covered:** AC1
**Precondition:** Route handler is imported and callable; extends from stories 1 and 2
**Action:** Invoke route handler with mock request object; capture response
**Expected result:** Response status is 200; body when parsed is `{ status: "ok", version: "1.0.0", uptime: <number> }` where uptime is a non-negative integer
**Edge case:** Ensure uptime field is present (not omitted); uptime value is ≥ 0

### Test 2: Uptime Field is Non-Negative Integer
**AC covered:** AC2
**Precondition:** Route handler returns a response with uptime field
**Action:** Parse response body and extract uptime field; verify type and sign
**Expected result:** `typeof uptime === "number"` and `uptime % 1 === 0` (integer) and `uptime >= 0`
**Edge case:** Uptime should not be a float, negative number, string, or object; should be zero or greater

### Test 3: GET /status Response is Valid JSON
**AC covered:** AC4
**Precondition:** Route handler returns a response
**Action:** Call `JSON.parse()` on the response body
**Expected result:** Parse succeeds with no syntax error; result is an object with `status`, `version`, and `uptime` fields
**Edge case:** Malformed JSON would throw `SyntaxError`; test verifies this does NOT happen

### Test 4: GET /status Response Body Has Only Expected Fields
**AC covered:** AC1 (implicit — verifies exact shape match)
**Precondition:** Route handler returns a response
**Action:** Parse response body and inspect all field names
**Expected result:** Response object has exactly three fields: `status` (string: "ok"), `version` (string: "1.0.0"), and `uptime` (non-negative integer); no additional fields present
**Edge case:** Response should not include extra fields; should preserve fields from stories 1 and 2

### Test 5: Uptime Field Coexists with Status and Version
**AC covered:** AC1
**Precondition:** Route handler returns a response with status and version fields
**Action:** Parse response body and assert all three fields exist
**Expected result:** Response object includes `status`, `version`, and `uptime` fields all present simultaneously
**Edge case:** Verify this is an extension of stories 1 and 2, not a replacement (all three fields must coexist)

### Test 6: Uptime Field is Computed from Process Startup Time
**AC covered:** AC2
**Precondition:** Route handler captures process startup time at initialization
**Action:** Invoke route handler immediately after startup; verify uptime is small (near zero)
**Expected result:** First call returns uptime near 0 (e.g., 0–2 seconds); second call returns uptime > first call's value
**Edge case:** Verify uptime is derived from process lifetime, not a fixed constant

### Test 7: Uptime Increases on Successive Calls
**AC covered:** AC3
**Precondition:** Route handler is invoked, then invoked again with a delay
**Action:** Make first GET request to route; record uptime; wait 100ms; make second GET request; record uptime
**Expected result:** `uptime2 > uptime1` (second uptime is strictly greater than first)
**Edge case:** Uptime should increase monotonically (or stay same if calls are very fast); never decrease

### Test 8: Uptime Rounded to Seconds (No Sub-Second Precision)
**AC covered:** AC2
**Precondition:** Route handler computes uptime
**Action:** Parse uptime field; verify it is an integer (no decimal places)
**Expected result:** `uptime % 1 === 0` (uptime is a whole number)
**Edge case:** Uptime should not be 1.5, 0.123, or any fractional value; should be 0, 1, 2, etc.

---

## Integration Tests

### Integration Test 1: GET /status Route Accessible via HTTP with All Three Fields
**Precondition:** Web UI server (`src/web-ui/server.js`) is running on localhost
**Action:** Make HTTP GET request to `http://localhost:3000/status`
**Expected result:** Response status is 200; body is valid JSON with `{ status: "ok", version: "1.0.0", uptime: <number> }` where uptime is a non-negative integer
**Edge case:** Verify request succeeds without authentication (no `Authorization` header required); all three fields present

### Integration Test 2: Uptime Increases Across Multiple HTTP Requests with Delay
**Precondition:** Web UI server is running
**Action:** Make first HTTP GET request to `http://localhost:3000/status`; record uptime; wait 500ms; make second request; record uptime
**Expected result:** Both responses contain uptime field as a non-negative integer; second uptime > first uptime
**Edge case:** Verify uptime increases reliably with real delays; verify monotonic increase (never decreases)

### Integration Test 3: Uptime Persists Across Server Lifetime
**Precondition:** Web UI server is running for >5 seconds
**Action:** Make multiple GET requests spread over 5+ seconds
**Expected result:** Each response contains a valid uptime; uptime values form a non-decreasing sequence
**Edge case:** Verify uptime does not reset between requests or exhibit clock skew

---

## NFR Tests

**Story NFRs:** None stated in the story artefact.

**Result:** No NFR tests written. Story confirmed: NFRs = None.

---

## AC Verification Script

### Setup
1. Ensure the web UI server is running: `npm run dev` (or equivalent `node src/web-ui/server.js`)
2. Server should start on `http://localhost:3000` (or output its actual URL)
3. Note the start time for reference

### Scenario 1: Verify /status Route Returns All Three Fields (AC1 + AC2 + AC4)
1. Open a terminal and run: `curl -s http://localhost:3000/status`
2. Inspect the output — it should be: `{"status":"ok","version":"1.0.0","uptime":<number>}`
3. Confirm the output is valid JSON (no syntax errors)
4. Confirm all three fields are present: `status`, `version`, and `uptime`
5. Confirm uptime is a number (not a string, object, or null)
6. **Expected:** HTTP 200 response; JSON body with `status: "ok"`, `version: "1.0.0"`, and `uptime` as a non-negative integer

### Scenario 2: Verify Uptime Field is Non-Negative Integer (AC2)
1. From the same terminal, run: `curl -s http://localhost:3000/status | jq '.uptime'`
2. Inspect the output — should be a non-negative integer (e.g., `5`, `12`, `0`)
3. Confirm it is NOT a float (e.g., should not be `1.5` or `0.123`)
4. Confirm it is NOT negative
5. Confirm it is a number, not a string
6. **Expected:** Numeric output (no quotes), non-negative, whole number (e.g., `5`, not `"5"` or `5.5`)

### Scenario 3: Verify Uptime Increases on Successive Calls (AC3)
1. Run: `curl -s http://localhost:3000/status | jq '.uptime'` and note the output (e.g., `10`)
2. Wait 2–3 seconds
3. Run the same command again: `curl -s http://localhost:3000/status | jq '.uptime'`
4. Compare the two values — the second should be larger than the first
5. **Expected:** First call uptime (e.g., `10`), wait, second call uptime (e.g., `13` or higher); monotonically increasing

### Scenario 4: Verify Response Shape Includes All Three Fields (AC1 Detailed)
1. Run: `curl -s http://localhost:3000/status | jq .`
2. Inspect the parsed JSON output — confirm it matches exactly: `{ "status": "ok", "version": "1.0.0", "uptime": <number> }`
3. Confirm no additional fields are present
4. Confirm this extends stories 1 and 2's response (all three fields present together)
5. **Expected:** Three fields only: `status`, `version`, and `uptime`

### Scenario 5: Verify Route Still Reachable Without Authentication (AC1 Implicit)
1. Run: `curl -i http://localhost:3000/status` (include headers)
2. Inspect the response headers — should see `HTTP/1.1 200 OK` or equivalent
3. Confirm no `Authorization` header was required
4. **Expected:** No 401 or 403 response; route remains public

### Scenario 6: Verify Uptime Continues to Increase Over Time (AC3 Extended)
1. Run the verification loop three times with 1-second delays:
   ```bash
   curl -s http://localhost:3000/status | jq '.uptime'
   sleep 1
   curl -s http://localhost:3000/status | jq '.uptime'
   sleep 1
   curl -s http://localhost:3000/status | jq '.uptime'
   ```
2. Record all three uptime values
3. Confirm they form a strictly increasing sequence (each > previous)
4. **Expected:** Three increasing values (e.g., `20`, `21`, `22` or similar progression)

---

## Quality Checks

✓ Every AC has at least one test
✓ Every test has a specific expected result
✓ Test data strategy: Synthetic (process uptime tracking in-memory)
✓ PCI/sensitivity: None
✓ NFR tests: None (story has no NFRs)
✓ Gap table: No gaps
✓ Verification script: Plain language, curl-based, operator-runnable
✓ All tests written to fail (uptime field does not exist yet; tests assume it does)
✓ Integration test covers real server HTTP requests + successive calls with delay
✓ Test 7 explicitly covers AC3 (uptime increases on successive calls)