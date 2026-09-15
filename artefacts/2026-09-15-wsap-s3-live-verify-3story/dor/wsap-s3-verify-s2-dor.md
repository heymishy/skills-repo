# Definition of Ready: PROCEED — wsap-s3-verify-s2

**Story:** wsap-s3-verify-s2 — Add Version Field to /status Response
**Date:** 2026-09-15
**Oversight:** Low
**Complexity:** 1

## Hard Blocks
All 13 hard blocks PASS.

## Warnings
W1–W5: All acknowledged or passed. W4 (solo operator) is standing posture.

## Coding Agent Instructions

### Context
This is verification feature story 2 of 3 for wsap-s3 (web UI story advance pipeline fixes). The feature scaffolds a minimal `/status` endpoint to exercise multi-story commit batching and per-story review re-run suppression. This story extends story 1's route with a `version` field.

**Feature will be discarded after wsap-s3 verification is complete.**

### Acceptance Criteria (What Done Means)

1. **AC1:** Route `GET /status` responds with HTTP 200 and JSON body `{ "status": "ok", "version": "1.0.0" }`
2. **AC2:** Version field is a string constant exactly "1.0.0"
3. **AC3:** Response is valid JSON parseable by `JSON.parse()`

### Implementation Scope

**What you will write:**
- Modify the route handler for `GET /status` in `src/web-ui/server.js` to add a `version` field
- Handler returns `{ status: "ok", version: "1.0.0" }` with HTTP 200

**What you will NOT write:**
- Dynamic version determination
- Version update logic
- Authentication or session checks (route remains public)
- The `uptime` field (story 3 scope)
- Persistence or database integration

### Files You Will Touch

**Required:**
- `src/web-ui/server.js` — modify route handler to include version field

**Not required:**
- No new files; test file already exists from story 1

### Test Coverage (Required Before Opening PR)

All tests must pass:
```bash
npm test
```

**Tests to pass:**
- Test 1: GET /status Returns Correct Response Shape with Version (AC1)
- Test 2: Version Field is Exactly String "1.0.0" (AC2)
- Test 3: GET /status Response is Valid JSON (AC3)
- Test 4: Response Body Has Only Expected Fields (AC1 verification)
- Test 5: Version Field is Present When Status Field Exists (AC1)
- Integration Test 1: GET /status Route Accessible via HTTP with Version (AC1 + AC2)
- Integration Test 2: Version Field Persists Across Multiple Requests (AC2)

### AC Verification (Before DoD)

After tests pass, run the verification script:

```bash
npm run dev &
sleep 2
curl -s http://localhost:3000/status | jq .
# Expected output: { "status": "ok", "version": "1.0.0" }
```

All scenarios from the test plan must succeed.

### Contract Boundaries

**Do not:**
- Change the route path or HTTP method
- Add authentication to the route
- Add any fields beyond `status` and `version`
- Modify story 1's `status` field value or type

**Do:**
- Ensure backward compatibility: both `status` and `version` fields present in response
- Keep version value hardcoded as "1.0.0" (not computed)

### Helpful Notes

- This is a throwaway feature — standard code quality acceptable
- Story 1's route handler already exists; you are extending it, not rewriting it
- Version field must coexist with status field (not replace it)
- No new infrastructure or dependencies required