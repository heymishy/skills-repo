# IL-T3 DoR Artefact — aml.2

**Feature:** 2026-06-13-aml-threshold-monitoring
**Story:** aml.2 — Route threshold breach alerts to compliance channels
**DoR verdict:** Proceed: Yes
**DoR run:** Run 1 — 2026-06-13
**Oversight level:** Medium (compliance story — tech lead awareness required; no formal sign-off needed)
**Hard blocks:** 13/13 passed
**Warnings:** W1 acknowledged (NFR-1 audit trail — compliance team has reviewed the audit log format; risk noted that log format must match MLRO reporting template)

---

## Contract Proposal

**What will be built:**
A `routeAlert(payload)` function exported from `src/compliance/alert-router.js`. The function:
- Posts a formatted Slack message to `#aml-alerts` using the Slack Web API
- Sends an email via the existing nodemailer transport to `compliance@enterprise.com`
- Logs every dispatch attempt to `src/audit/audit-logger.js` (NFR-1)
- Returns `{ slack: 'sent'|'failed', email: 'sent'|'failed' }` — never throws

**What will NOT be built:**
- SAR filing logic or MLRO escalation
- Threshold detection (aml.1 scope)
- Alert deduplication, suppression, or rate limiting
- Any UI for compliance officer review

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — Slack message sent | Unit test with `slackClient.chat.postMessage` mocked; assert called with correct channel and payload | Unit |
| AC2 — Email sent | Unit test with nodemailer transport mocked; assert `sendMail` called with correct to/subject | Unit |
| AC3 — Partial failure recovery | Unit test: mock Slack to reject (5xx error); assert function returns `{ slack: 'failed', email: 'sent' }` without throwing | Unit |
| NFR-1 — Audit log | Unit test: assert `auditLogger.log` called with alertId, timestamp, and channel statuses on every call | Unit |

**Assumptions:**
- Slack client and nodemailer transport are injected as constructor parameters (or module-level singletons that can be replaced in tests)
- `src/audit/audit-logger.js` exists and exports `log(entry)` synchronously

**Estimated touch points:**
- Create: `src/compliance/alert-router.js`
- Create: `tests/compliance/alert-router.test.js`

---

## Hard Block Results

| Block | Status | Notes |
|-------|--------|-------|
| H1–H8 | ✅ PASS | All standard checks pass |
| H9 (Architecture Constraints) | ✅ PASS | NFR-1 audit trail constraint named with audit logger path |
| H-NFR | ✅ PASS | NFR profile and story-level NFR-1 consistent |
| H-NFR2 (compliance NFR with human sign-off) | ✅ PASS | NFR-1 is an internal audit log obligation, not an external regulatory sign-off gate; compliance team reviewed log format |
| H-GOV | ✅ PASS | Discovery approved |
| All others | ✅ PASS | — |

---

## Coding Agent Instructions

**Goal:** Implement `routeAlert(payload)` in `src/compliance/alert-router.js` that sends Slack + email and logs every dispatch attempt.

**Branch:** `feature/aml.2`
**Test command:** `npm test`
**Oversight:** Medium — share DoR with tech lead before starting

**ACs to implement:**
1. AC1 — Slack message to `#aml-alerts` with payload details; return `{ slack: 'sent' }`
2. AC2 — Email to `compliance@enterprise.com`, subject `AML Threshold Breach — [alertId]`; return `{ email: 'sent' }`
3. AC3 — Channel delivery failure returns partial success; function never throws
4. NFR-1 — Every call to routeAlert logs to `src/audit/audit-logger.js` with alertId, timestamp, channel statuses

**Files to touch:**
- Create: `src/compliance/alert-router.js`
- Create: `tests/compliance/alert-router.test.js`

**Scope boundary:** No SAR filing, no MLRO escalation, no threshold detection.

**Architecture Constraint:** Audit logging is MANDATORY for every dispatch attempt (success AND failure). Use `src/audit/audit-logger.js` — not `console.log`. This is the compliance evidence trail.
