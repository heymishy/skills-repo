# IL-T3 Test Plan — aml.2 Alert Routing

**Framework:** Jest (`npm test`)
**Test data strategy:** Synthetic + mocked external services (Slack API, nodemailer, audit-logger)

---

## AC coverage table

| AC / NFR | Tests | Coverage | Notes |
|----------|-------|----------|-------|
| AC1 — Slack message | T1: Slack postMessage called with correct channel; T2: Slack message body contains alertId and amount | Full | Slack client mocked |
| AC2 — Email sent | T3: sendMail called with correct to/subject; T4: email body contains alertId | Full | nodemailer mocked |
| AC3 — Partial failure | T5: Slack 5xx → returns { slack: 'failed', email: 'sent' }; T6: function does not throw when Slack fails | Full | — |
| NFR-1 — Audit log | T7: auditLogger.log called on every routeAlert call; T8: log entry contains alertId and channel statuses | Full | auditLogger mocked |

No test plan gaps.

---

## Unit tests

### T1 — Slack channel and alert details posted

**AC:** AC1
**Precondition:** Slack client mock; payload `{ alertId: 'ALERT_001', amount: 15000, customerId: 'CUST_42', breachTimestamp: '2026-06-13T09:00:00Z' }`
**Action:** `await routeAlert(payload)`
**Expected:** `slackMock.chat.postMessage` called once with `{ channel: '#aml-alerts', ... }` containing alertId and amount

### T2 — Slack message body includes required fields

**AC:** AC1
**Expected:** postMessage call's `text` or `blocks` argument contains `'ALERT_001'` and `'15000'`

### T3 — Email sent to compliance list with correct subject

**AC:** AC2
**Precondition:** nodemailer `sendMail` mocked
**Expected:** `sendMail` called with `{ to: 'compliance@enterprise.com', subject: 'AML Threshold Breach — ALERT_001' }`

### T4 — Email body contains alertId

**AC:** AC2
**Expected:** `sendMail` call's `text` or `html` argument contains `'ALERT_001'`

### T5 — Slack failure returns partial success object

**AC:** AC3
**Precondition:** Slack mock configured to reject with `{ status: 503 }`
**Action:** `const result = await routeAlert(payload)`
**Expected:** `result` equals `{ slack: 'failed', email: 'sent' }`

### T6 — Function never throws on channel failure

**AC:** AC3
**Precondition:** Both Slack and email mocks configured to reject
**Expected:** `routeAlert(payload)` resolves (does not throw); result is `{ slack: 'failed', email: 'failed' }`

### T7 — Audit log called on every invocation

**NFR:** NFR-1
**Precondition:** `auditLogger.log` mocked
**Expected:** `auditLogger.log` called exactly once per `routeAlert(payload)` call

### T8 — Audit log entry contains required fields

**NFR:** NFR-1
**Expected:** `auditLogger.log` call argument contains `{ alertId: 'ALERT_001', channels: { slack: ..., email: ... } }` (or equivalent structure with alertId and channel statuses)

---

## Gap table

No gaps.
