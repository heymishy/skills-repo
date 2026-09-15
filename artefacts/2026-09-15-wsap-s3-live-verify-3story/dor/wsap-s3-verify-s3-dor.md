# Definition of Ready: PROCEED — wsap-s3-verify-s3

**Story:** wsap-s3-verify-s3 — Add Uptime Field to /status Response
**Feature slug:** 2026-09-15-wsap-s3-live-verify-3story
**Date:** 2026-09-15
**Oversight:** Low

---

## Hard Blocks

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So format with persona | ✅ PASS |
| H2 | ≥3 ACs in Given/When/Then format | ✅ PASS — 4 ACs |
| H3 | Every AC has ≥1 test | ✅ PASS |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage to named metric | ✅ PASS — M1 |
| H6 | Complexity rated | ✅ PASS — 1 |
| H7 | No unresolved HIGH findings | ✅ PASS — 0 HIGH |
| H8 | Test plan covers all ACs | ✅ PASS |
| H8-ext | Schema dependency check | ✅ PASS — no upstream dependencies |
| H9 | Architecture constraints documented | ✅ PASS |
| H-E2E | CSS-layout-dependent AC check | ✅ PASS — none |
| H-NFR | NFR profile or "None" explicit | ✅ PASS — "NFR: None" |
| H-NFR-profile | NFR profile exists if NFRs declared | ✅ PASS — not triggered |

**All 13 hard blocks: PASS**

---

## Warnings Acknowledged

W1–W5: All passed or acknowledged. W4 RISK-ACCEPT (solo operator) is standing posture per ADR-025.

---

## Contract Proposal

**What will be built:** Extend `GET /status` route handler in `src/web-ui/server.js` to compute and return server uptime in seconds since process startup. Response: `{ status: "ok", version: "1.0.0", uptime: <non-negative integer> }`. Uptime computed from `process.uptime()`, rounded to whole seconds (integer).

**What will NOT be built:** Dynamic version logic, auth changes, system uptime, restart handling, sub-second precision, persistence.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test response shape; integration test HTTP 200 + JSON | unit / integration |
| AC2 | Unit test uptime is non-negative integer | unit |
| AC3 | Integration test two successive calls with delay; second > first | integration |
| AC4 | Unit test JSON.parse() succeeds | unit |

**Assumptions:** `process.uptime()` available and reliable; server startup time constant; rounding to whole seconds acceptable; route remains public; throwaway feature for wsap-s3 verification only.

**Estimated touch points:** Files: `src/web-ui/server.js`; Services: None; APIs: None (internal `process.uptime()` only).

---

## Coding Agent Instructions

### Context
Verification feature story 3 of 3 for wsap-s3 fixes. Scaffolds minimal `/status` endpoint to exercise multi-story commit batching. This story extends stories 1 and 2 with `uptime` field. **Feature discarded after wsap-s3 verification.**

### Acceptance Criteria
1. **AC1:** Route `GET /status` responds HTTP 200, JSON `{ "status": "ok", "version": "1.0.0", "uptime": <seconds> }` where uptime is non-negative integer since process startup
2. **AC2:** Uptime is non-negative integer computed from process startup time
3. **AC3:** Uptime increases on successive calls — second call after delay returns strictly greater uptime
4. **AC4:** Response is valid JSON (JSON.parse() succeeds)

### Implementation Scope

**Write:**
- Modify `GET /status` route handler in `src/web-ui/server.js`
- Compute uptime via `process.uptime()`, round to whole seconds
- Return `{ status: "ok", version: "1.0.0", uptime: <non-negative integer> }` with HTTP 200

**Do NOT write:**
- Dynamic uptime from external sources
- Restart/reset logic
- Authentication checks
- Sub-second precision
- Persistence/database

### Files You Will Touch
- **Required:** `src/web-ui/server.js` (extend route handler)
- **Not required:** No new files

### Test Coverage

Run:
```bash
npm test
```

Must pass: All 11 tests (8 unit + 3 integration) covering AC1–AC4.

### AC Verification

```bash
npm run dev &
sleep 2
curl -s http://localhost:3000/status | jq .
# Expected: { "status": "ok", "version": "1.0.0", "uptime": <non-negative integer> }
```

All 6 verification scenarios must succeed.

### Contract Boundaries

**Do NOT:**
- Change route path/method
- Add authentication
- Add fields beyond status/version/uptime
- Modify stories 1–2 fields
- Use fractional uptime

**Do:**
- Ensure all three fields present
- Use `Math.floor(process.uptime())` for uptime
- Verify uptime increases monotonically

### Applicable Standards

**From `standards/software-engineering/core.md`:**
Apply core software engineering standards to implementation and testing.

**From `standards/software-engineering/POLICY.md`:**
Apply policy floors to code review and quality gates.

### Helpful Notes
- Throwaway feature; standard code quality acceptable
- Extend existing handlers (stories 1–2); do not rewrite
- All three fields must coexist
- No new infrastructure/dependencies needed
- Round via `Math.floor(process.uptime())`

---

## Completion

✅ **Definition of ready: PROCEED — wsap-s3-verify-s3**

Hard blocks: 13/13 passed
Warnings: Acknowledged
Oversight: Low

**No outstanding decisions.** Ready for inner loop:
1. `/branch-setup`
2. `/implementation-plan`
3. `/tdd` or `/subagent-execution`
4. `/verify-completion`
5. `/branch-complete`

After PR merge: run `/definition-of-done`.