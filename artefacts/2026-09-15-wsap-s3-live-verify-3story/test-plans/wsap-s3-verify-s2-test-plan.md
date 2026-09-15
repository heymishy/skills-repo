# Test Plan: ep1-s2 — Add Version Field to /status Response

**Story ID:** wsap-s3-verify-s2
**Title:** Add Version Field to /status Response
**Date:** 2026-09-15
**Test Framework:** Node.js `assert` + async test helpers
**Test Runner Command:** `npm test`

---

## Test Data Strategy

**Strategy:** Synthetic — tests generate their own route handler and mock request/response objects in setup/teardown.

**Data sourcing:** No external data, fixtures, or database required. Route returns a hardcoded response with version field "1.0.0".

**PCI/Sensitivity:** None — route contains no sensitive data.

---

## AC Coverage Table

| AC | Test Type | Coverage | Notes |
|---|---|---|---|
| AC1 | Unit | ✓ | Response shape with version field and status code assertion |
| AC2 | Unit | ✓ | Version field is string "1.0.0" assertion |
| AC3 | Unit | ✓ | JSON validity via `JSON.parse()` |

**Gap Table:** No gaps. All ACs are unit-testable.

---

## Unit Tests

### Test 1: GET /status Returns Correct Response Shape with Version
**AC covered:** AC1
**Precondition:** Route handler is imported and callable; extends from story 1
**Action:** Invoke route handler with mock request object; capture response
**Expected result:** Response status is 200; body when parsed is `{ status: "ok", version: "1.0.0" }`
**Edge case:** Ensure version field is present (not omitted)

### Test 2: Version Field is Exactly String "1.0.0"
**AC covered:** AC2
**Precondition:** Route handler returns a response with version field
**Action:** Parse response body and extract version field; verify type and value
**Expected result:** `typeof version === "string"` and `version === "1.0.0"`
**Edge case:** Version should not be a number, object, or null; should not contain additional characters

### Test 3: GET /status Response is Valid JSON
**AC covered:** AC3
**Precondition:** Route handler returns a response
**Action:** Call `JSON.parse()` on the response body
**Expected result:** Parse succeeds with no syntax error; result is an object with `status` and `version` fields
**Edge case:** Malformed JSON would throw `SyntaxError`; test verifies this does NOT happen

### Test 4: GET /status Response Body Has Only Expected Fields
**AC covered:** AC1 (implicit — verifies exact shape match)
**Precondition:** Route handler returns a response
**Action:** Parse response body and inspect all field names
**Expected result:** Response object has exactly two fields: `status` (type: string, value: "ok") and `version` (type: string, value: "1.0.0"); no additional fields present
**Edge case:** Response should not include extra fields like `uptime` or `timestamp`; should not include story-1-only shape

### Test 5: Version Field is Present When Status Field Exists
**AC covered:** AC1
**Precondition:** Route handler returns a response with status field
**Action:** Parse response body and assert version field exists
**Expected result:** Response object includes `version` field alongside `status` field
**Edge case:** Verify this is an extension of story 1, not a replacement (both fields must coexist)

---

## Integration Tests

### Integration Test 1: GET /status Route Accessible via HTTP with Version
**Precondition:** Web UI server (`src/web-ui/server.js`) is running on localhost
**Action:** Make HTTP GET request to `http://localhost:3000/status`
**Expected result:** Response status is 200; body is valid JSON with `{ status: "ok", version: "1.0.0" }`
**Edge case:** Verify request succeeds without authentication (no `Authorization` header required)

### Integration Test 2: Version Field Persists Across Multiple Requests
**Precondition:** Web UI server is running
**Action:** Make two successive GET requests to `http://localhost:3000/status`
**Expected result:** Both responses contain identical version field value "1.0.0"
**Edge case:** Version should not change between requests (constant value)

---

## NFR Tests

**Story NFRs:** None stated in the story artefact.

**Result:** No NFR tests written. Story confirmed: NFRs = None.

---

## AC Verification Script

### Setup
1. Ensure the web UI server is running: `npm run dev` (or equivalent `node src/web-ui/server.js`)
2. Server should start on `http://localhost:3000` (or output its actual URL)

### Scenario 1: Verify /status Route Returns Version Field (AC1 + AC2 + AC3)
1. Open a terminal and run: `curl -s http://localhost:3000/status`
2. Inspect the output — it should be: `{"status":"ok","version":"1.0.0"}`
3. Confirm the output is valid JSON (no syntax errors)
4. Confirm the version field exists and contains exactly "1.0.0"
5. **Expected:** HTTP 200 response; JSON body with both `status: "ok"` and `version: "1.0.0"`

### Scenario 2: Verify Version Field Type and Value (AC2)
1. From the same terminal, run: `curl -s http://localhost:3000/status | jq '.version'`
2. Inspect the output — should be: `"1.0.0"` (a string in quotes)
3. Confirm it is not a number, object, or null value
4. **Expected:** String output exactly: `"1.0.0"`

### Scenario 3: Verify Response Shape Includes Both Fields (AC1 Detailed)
1. Run: `curl -s http://localhost:3000/status | jq .`
2. Inspect the parsed JSON output — confirm it matches exactly: `{ "status": "ok", "version": "1.0.0" }`
3. Confirm no additional fields are present (e.g. no `uptime` yet, which is story 3)
4. Confirm this extends story 1's response (both status and version present)
5. **Expected:** Two fields only: `status` and `version`

### Scenario 4: Verify Route Still Reachable Without Authentication (AC1 Implicit)
1. Run: `curl -i http://localhost:3000/status` (include headers)
2. Inspect the response headers — should see `HTTP/1.1 200 OK` or equivalent
3. Confirm no `Authorization` header was required
4. **Expected:** No 401 or 403 response; route remains public

---

## Quality Checks

✓ Every AC has at least one test
✓ Every test has a specific expected result
✓ Test data strategy: Synthetic (no external dependencies)
✓ PCI/sensitivity: None
✓ NFR tests: None (story has no NFRs)
✓ Gap table: No gaps
✓ Verification script: Plain language, curl-based, operator-runnable
✓ All tests written to fail (version field does not exist yet; tests assume it does)