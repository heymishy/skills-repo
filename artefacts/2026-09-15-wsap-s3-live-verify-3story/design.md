# Definition: wsap-s3 Live Verification — 3-Story Status Endpoint Feature

**Status:** Complete
**Date:** 2026-09-15
**Feature slug:** 2026-09-15-wsap-s3-live-verify-3story

---

## Feature Overview

Three minimal, independent stories scaffolding a `/status` endpoint to drive real multi-story pipeline-state transitions through the web UI. Purpose: verify wsap-s3's multi-story commit gating (one commit per batch) and per-story review re-run suppression. Feature is discarded after wsap-s3 DoD verification.

---

## Stories

### Story 1: Add GET /status Route

**Story ID:** wsap-s3-verify-s1
**Title:** Add GET /status route returning { status: "ok" }
**Type:** Feature

#### Acceptance Criteria

1. **AC1:** Route `GET /status` responds with HTTP 200 and JSON body `{ "status": "ok" }`
2. **AC2:** Route is registered in `src/web-ui/server.js` and is reachable without authentication
3. **AC3:** Response is valid JSON and can be parsed by `JSON.parse()`

#### Notes
Minimal route addition; no dependencies on other stories.

---

### Story 2: Add Version Field to /status Response

**Story ID:** wsap-s3-verify-s2
**Title:** Add version field to GET /status response
**Type:** Feature

#### Acceptance Criteria

1. **AC1:** Route `GET /status` responds with HTTP 200 and JSON body `{ "status": "ok", "version": "1.0.0" }`
2. **AC2:** Version field is a string constant "1.0.0"
3. **AC3:** Response remains valid JSON

#### Notes
Depends on story 1 (extends existing `/status` route). Independent of story 3.

---

### Story 3: Add Uptime Field to /status Response

**Story ID:** wsap-s3-verify-s3
**Title:** Add uptime field to GET /status response
**Type:** Feature

#### Acceptance Criteria

1. **AC1:** Route `GET /status` responds with HTTP 200 and JSON body `{ "status": "ok", "uptime": <seconds> }` where uptime is server uptime in seconds since startup
2. **AC2:** Uptime field is a non-negative integer
3. **AC3:** Uptime increases on successive calls (verifying it tracks elapsed time)
4. **AC4:** Response remains valid JSON

#### Notes
Depends on story 1 (extends existing `/status` route). Independent of story 2. Requires tracking server startup time.

---

## Epic Structure

All three stories are flat (no epic nesting). Each is independently advanceable through test-plan → DoR → verification.

---

## Constraints

- Feature is throwaway — discarded after wsap-s3 verification completes
- No persistent data storage required
- Server startup time tracking is in-memory only (process uptime)
- No authentication required for `/status` access

---

## Success Criteria

Feature definition is complete when:
- All three stories have minimal, clear AC sets (done above)
- Each story is independently testable and advanceable
- Feature is ready to move into test-plan phase per story

---

## Attribution

**Contributors:**
- Hamish King — Operator / Solo Engineer — 2026-09-15

**Approved By:**
- Hamish King — Solo Operator — 2026-09-15