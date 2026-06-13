# IL-T3 — AML Alert Routing (LOW-MED difficulty)

**Feature:** 2026-06-13-aml-threshold-monitoring
**Story:** aml.2
**Difficulty:** LOW-MED
**Expected Phase A score:** ≥ 0.90

## Operator input

> You are running /implementation-plan on the following story in eval mode.
> Your FIRST line of output must be exactly: Save path: artefacts/2026-06-13-aml-threshold-monitoring/plans/aml.2-plan.md

DoR artefact:

# IL-T3 DoR Artefact — aml.2

**Feature:** 2026-06-13-aml-threshold-monitoring
**Story:** aml.2 — Route threshold breach alerts to compliance channels
**DoR verdict:** Proceed: Yes
**Oversight level:** Medium (compliance story — tech lead awareness required)

### Contract Proposal

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

**Estimated touch points:**
- Create: `src/compliance/alert-router.js`
- Create: `tests/compliance/alert-router.test.js`

### Coding Agent Instructions

**Goal:** Implement `routeAlert(payload)` in `src/compliance/alert-router.js` that sends Slack + email and logs every dispatch attempt.

**Branch:** `feature/aml.2`
**Test command:** `npm test`
**Oversight:** Medium

**ACs to implement:**
1. AC1 — Slack message to `#aml-alerts` with payload details
2. AC2 — Email to `compliance@enterprise.com`, subject `AML Threshold Breach — [alertId]`
3. AC3 — Channel delivery failure returns partial success; function never throws
4. NFR-1 — Every call logs to `src/audit/audit-logger.js` with alertId, timestamp, channel statuses

**Files to touch:**
- Create: `src/compliance/alert-router.js`
- Create: `tests/compliance/alert-router.test.js`

**Architecture Constraint:** Audit logging is MANDATORY for every dispatch attempt. Use `src/audit/audit-logger.js` — NOT `console.log`. This is the compliance evidence trail.

**Scope boundary:** No SAR filing, no MLRO escalation, no threshold detection.

---

Definition artefact:

# IL-T3 Definition Artefact — AML Alert Routing

**Feature:** 2026-06-13-aml-threshold-monitoring
**Story slug:** aml.2

### Story: aml.2 — Route threshold breach alerts to compliance channels

**AC1:** Given a threshold breach alert payload `{ alertId, amount, customerId, breachTimestamp }`, when `routeAlert(payload)` is called, then a Slack message is sent to `#aml-alerts` and returns `{ slack: 'sent', email: 'sent' }`.

**AC2:** Given a threshold breach alert payload, when `routeAlert(payload)` is called, then an email is sent to `compliance@enterprise.com` with subject `AML Threshold Breach — [alertId]`.

**AC3:** Given a channel delivery failure, when `routeAlert(payload)` is called, then the function returns `{ slack: 'failed', email: 'sent' }` and does NOT throw.

**Out of Scope:** SAR filing automation, MLRO escalation, alert deduplication, threshold detection (aml.1), review workflow.

**NFR-1 (Audit trail — compliance):** Every alert dispatch must be logged to `src/audit/audit-logger.js` with alertId, timestamp, channels attempted, delivery status per channel.

**Architecture Constraints:** NFR-1 audit trail is a compliance obligation (FCA regulatory requirement). Use `src/audit/audit-logger.js` — NOT `console.log`.

---

Test plan:

# IL-T3 Test Plan — aml.2 Alert Routing

| AC / NFR | Tests | Coverage |
|----------|-------|----------|
| AC1 — Slack message | T1: postMessage called with `#aml-alerts`; T2: message contains alertId and amount | Full |
| AC2 — Email sent | T3: sendMail called with correct to/subject; T4: email body contains alertId | Full |
| AC3 — Partial failure | T5: Slack 5xx → `{ slack: 'failed', email: 'sent' }`; T6: function never throws | Full |
| NFR-1 — Audit log | T7: `auditLogger.log` called on every invocation; T8: log entry has alertId and channel statuses | Full |

**T1:** Slack mock; `routeAlert(payload)` → `slackMock.chat.postMessage` called with `{ channel: '#aml-alerts', ... }`
**T3:** nodemailer mock; `sendMail` called with `{ to: 'compliance@enterprise.com', subject: 'AML Threshold Breach — ALERT_001' }`
**T5:** Slack mock rejects with 503; result = `{ slack: 'failed', email: 'sent' }`
**T7:** `auditLogger.log` mocked; called exactly once per `routeAlert` call

---

Codebase context:

```js
// src/audit/audit-logger.js (existing module — the implementing agent MUST use this)
'use strict';

const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, '../../logs/audit.jsonl');

const auditLogger = {
  log(entry) {
    const line = JSON.stringify({ ...entry, loggedAt: new Date().toISOString() });
    fs.appendFileSync(LOG_PATH, line + '\n', 'utf8');
  },
};

module.exports = auditLogger;

// Alert router injection pattern (agent creates src/compliance/alert-router.js):
// function createAlertRouter(slackClient, emailTransport, auditLog) {
//   return {
//     async routeAlert(payload) {
//       // implementation goes here
//     },
//   };
// }
// module.exports = createAlertRouter;
```

Produce the implementation plan. Write it to artefacts/2026-06-13-aml-threshold-monitoring/plans/aml.2-plan.md.

## Expected characteristics

# IL-T3 DoR Artefact — aml.2

**Feature:** 2026-06-13-aml-threshold-monitoring
**Story:** aml.2 — Route threshold breach alerts to compliance channels

## Contract Proposal

**What will be built:**
A `routeAlert(payload)` function exported from `src/compliance/alert-router.js`:
- Slack to `#aml-alerts`
- Email to `compliance@enterprise.com`, subject `AML Threshold Breach — [alertId]`
- Logs to `src/audit/audit-logger.js` on every call (NFR-1)
- Returns `{ slack: 'sent'|'failed', email: 'sent'|'failed' }` — never throws

**What will NOT be built:**
- SAR filing, MLRO escalation, alert deduplication, threshold detection, compliance UI

**ACs:**
- AC1: Slack to `#aml-alerts` with alert details
- AC2: Email to `compliance@enterprise.com` with correct subject
- AC3: Partial failure — function never throws, returns per-channel status

**NFR-1:** Every dispatch logged to `src/audit/audit-logger.js` with alertId, timestamp, channel statuses.

**Architecture Constraint:** MUST use `src/audit/audit-logger.js` — NOT `console.log`.

**Files to touch:**
- Create: `src/compliance/alert-router.js`
- Create: `tests/compliance/alert-router.test.js`
