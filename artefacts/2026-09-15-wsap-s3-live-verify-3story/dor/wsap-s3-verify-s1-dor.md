# Coding Agent Instructions — wsap-s3-verify-s1

**Story:** wsap-s3-verify-s1 — Add GET /status Route
**Date:** 2026-09-15
**Oversight:** Low
**Complexity:** 1

## Context

This is a verification feature for wsap-s3 (web UI story advance pipeline fixes). Three minimal stories scaffold a `/status` endpoint to exercise multi-story commit batching and per-story review re-run suppression. This story adds the base route.

**Feature will be discarded after wsap-s3 verification is complete.**

## Acceptance Criteria (What Done Means)

1. **AC1:** Route `GET /status` responds with HTTP 200 and JSON body `{ "status": "ok" }`
2. **AC2:** Route is registered in `src/web-ui/server.js` and is reachable without authentication
3. **AC3:** Response is valid JSON and can be parsed by `JSON.parse()`

## Implementation Scope

**What you will write:**
- A route handler for `GET /status` in `src/web-ui/server.js`
- Handler returns hardcoded response `{ status: "ok" }` with HTTP 200

**What you will NOT write:**
- Authentication or session checks
- Persistence or database integration
- Rate limiting or access control
- Response caching
- The `version` or `uptime` fields (those are stories 2 and 3)

## Files You Will Touch

**Required:**
- `src/web-ui/server.js` — add route handler

**Out of scope:**
- No other files should be modified

## Test Coverage (Required Before Opening PR)

All tests must pass before you open the PR:

```bash
npm test
```

**Tests you must pass:**
- Test 1: GET /status Returns Correct Response Shape (AC1)
- Test 2: GET /status Route is Registered in server.js (AC2)
- Test 3: GET /status Response is Valid JSON (AC3)
- Test 4: GET /status Response Body Structure (AC1 verification)
- Integration Test 1: GET /status Route Accessible via HTTP (AC1 + AC2)

**Test file location:** `tests/unit/routes/status.test.js` (or equivalent)

## AC Verification (Before DoD)

After all tests pass, run the verification script:

```bash
npm run dev &
sleep 2
curl -s http://localhost:3000/status | jq .
# Expected output: { "status": "ok" }
```

All three scenarios from the test plan must succeed.

## Contract Boundaries

**Do not:**
- Add authentication guards to the route
- Add any dynamic fields (version, uptime, timestamp)
- Add any database calls or side effects
- Modify the response shape beyond `{ status: "ok" }`

## Helpful Notes

- This is a throwaway feature — code quality is acceptable, no need for production-grade polish
- Solo operator verification context — no review cycle expected
- The route must be reachable immediately after server start