Save path: artefacts/2026-06-13-aml-threshold-monitoring/plans/aml.2-plan.md

```markdown
# Implementation Plan — aml.2: Route Threshold Breach Alerts to Compliance Channels

**Feature:** 2026-06-13-aml-threshold-monitoring
**Story:** aml.2
**Branch:** `feature/aml.2`
**Oversight level:** Medium (tech lead awareness required)
**Test command:** `npm test`

---

## Overview

Implement `routeAlert(payload)` via a factory function `createAlertRouter(slackClient, emailTransport, auditLog)` exported from `src/compliance/alert-router.js`. The function sends a Slack message to `#aml-alerts`, an email to `compliance@enterprise.com`, logs every dispatch attempt to `src/audit/audit-logger.js`, and never throws — returning a partial-success result object instead.

---

## Execution Order (strict TDD: RED → GREEN → REFACTOR)

---

### TASK 1 — Create the test file scaffold (RED)

**File:** `tests/compliance/alert-router.test.js`

Create the test file with all eight tests in a failing state. No implementation file exists yet, so every `require` will fail — confirming RED.

```js
'use strict';

const createAlertRouter = require('../../src/compliance/alert-router');

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------
const PAYLOAD = {
  alertId: 'ALERT_001',
  amount: 15000,
  customerId: 'CUST_42',
  breachTimestamp: '2026-06-13T10:00:00.000Z',
};

// ---------------------------------------------------------------------------
// Mock factories — recreated before each test to prevent cross-test pollution
// ---------------------------------------------------------------------------
function makeSlackMock({ shouldFail = false } = {}) {
  return {
    chat: {
      postMessage: jest.fn().mockImplementation(() =>
        shouldFail
          ? Promise.reject(Object.assign(new Error('Slack 503'), { status: 503 }))
          : Promise.resolve({ ok: true }),
      ),
    },
  };
}

function makeEmailMock({ shouldFail = false } = {}) {
  return {
    sendMail: jest.fn().mockImplementation(() =>
      shouldFail
        ? Promise.reject(new Error('SMTP error'))
        : Promise.resolve({ messageId: 'msg-001' }),
    ),
  };
}

function makeAuditMock() {
  return { log: jest.fn() };
}

// ---------------------------------------------------------------------------
// AC1 — Slack message sent to #aml-alerts
// ---------------------------------------------------------------------------
describe('AC1 — Slack delivery', () => {
  // T1: postMessage called with correct channel
  test('T1: calls slackClient.chat.postMessage with channel #aml-alerts', async () => {
    const slack = makeSlackMock();
    const email = makeEmailMock();
    const audit = makeAuditMock();
    const router = createAlertRouter(slack, email, audit);

    await router.routeAlert(PAYLOAD);

    expect(slack.chat.postMessage).toHaveBeenCalledTimes(1);
    expect(slack.chat.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ channel: '#aml-alerts' }),
    );
  });

  // T2: Slack message body contains alertId and amount
  test('T2: Slack message text contains alertId and amount', async () => {
    const slack = makeSlackMock();
    const email = makeEmailMock();
    const audit = makeAuditMock();
    const router = createAlertRouter(slack, email, audit);

    await router.routeAlert(PAYLOAD);

    const callArg = slack.chat.postMessage.mock.calls[0][0];
    const messageText = JSON.stringify(callArg);
    expect(messageText).toContain('ALERT_001');
    expect(messageText).toContain('15000');
  });
});

// ---------------------------------------------------------------------------
// AC2 — Email sent to compliance@enterprise.com
// ---------------------------------------------------------------------------
describe('AC2 — Email delivery', () => {
  // T3: sendMail called with correct to and subject
  test('T3: calls sendMail with correct to address and subject', async () => {
    const slack = makeSlackMock();
    const email = makeEmailMock();
    const audit = makeAuditMock();
    const router = createAlertRouter(slack, email, audit);

    await router.routeAlert(PAYLOAD);

    expect(email.sendMail).toHaveBeenCalledTimes(1);
    expect(email.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'compliance@enterprise.com',
        subject: 'AML Threshold Breach — ALERT_001',
      }),
    );
  });

  // T4: email body contains alertId
  test('T4: email body contains alertId', async () => {
    const slack = makeSlackMock();
    const email = makeEmailMock();
    const audit = makeAuditMock();
    const router = createAlertRouter(slack, email, audit);

    await router.routeAlert(PAYLOAD);

    const callArg = email.sendMail.mock.calls[0][0];
    const bodyText = JSON.stringify(callArg);
    expect(bodyText).toContain('ALERT_001');
  });
});

// ---------------------------------------------------------------------------
// AC3 — Partial failure recovery; function never throws
// ---------------------------------------------------------------------------
describe('AC3 — Partial failure and no-throw guarantee', () => {
  // T5: Slack 5xx → { slack: 'failed', email: 'sent' }
  test('T5: Slack failure returns { slack: "failed", email: "sent" }', async () => {
    const slack = makeSlackMock({ shouldFail: true });
    const email = makeEmailMock();
    const audit = makeAuditMock();
    const router = createAlertRouter(slack, email, audit);

    const result = await router.routeAlert(PAYLOAD);

    expect(result).toEqual({ slack: 'failed', email: 'sent' });
  });

  // T6: function does not throw even when both channels fail
  test('T6: function never throws even when both channels fail', async () => {
    const slack = makeSlackMock({ shouldFail: true });
    const email = makeEmailMock({ shouldFail: true });
    const audit = makeAuditMock();
    const router = createAlertRouter(slack, email, audit);

    await expect(router.routeAlert(PAYLOAD)).resolves.toEqual({
      slack: 'failed',
      email: 'failed',
    });
  });
});

// ---------------------------------------------------------------------------
// NFR-1 — Audit log: every dispatch attempt logged
// ---------------------------------------------------------------------------
describe('NFR-1 — Audit logging', () => {
  // T7: auditLogger.log called exactly once per routeAlert invocation
  test('T7: auditLogger.log called exactly once per routeAlert call', async () => {
    const slack = makeSlackMock();
    const email = makeEmailMock();
    const audit = makeAuditMock();
    const router = createAlertRouter(slack, email, audit);

    await router.routeAlert(PAYLOAD);

    expect(audit.log).toHaveBeenCalledTimes(1);
  });

  // T8: log entry contains alertId, timestamp, and channel statuses
  test('T8: log entry contains alertId, a timestamp, and channel delivery statuses', async () => {
    const slack = makeSlackMock({ shouldFail: true });
    const email = makeEmailMock();
    const audit = makeAuditMock();
    const router = createAlertRouter(slack, email, audit);

    await router.routeAlert(PAYLOAD);

    const logEntry = audit.log.mock.calls[0][0];
    expect(logEntry).toMatchObject({
      alertId: 'ALERT_001',
      slack: 'failed',
      email: 'sent',
    });
    expect(typeof logEntry.dispatchedAt).toBe('string');
    // ISO 8601 sanity check
    expect(() => new Date(logEntry.dispatchedAt).toISOString()).not.toThrow();
  });
});
```

**Expected state after TASK 1:** All 8 tests fail with `Cannot find module '../../src/compliance/alert-router'`. RED confirmed.

---

### TASK 2 — Create the implementation file (GREEN)

**File:** `src/compliance/alert-router.js`

Write the minimum correct implementation to make all 8 tests pass.

```js
'use strict';

/**
 * createAlertRouter — factory function enabling dependency injection for
 * testability and compliance auditability.
 *
 * @param {object} slackClient   — Slack Web API client (must expose chat.postMessage)
 * @param {object} emailTransport — nodemailer transport (must expose sendMail)
 * @param {object} auditLog      — audit logger (must expose log); MUST be
 *                                 src/audit/audit-logger.js in production
 * @returns {{ routeAlert: (payload: object) => Promise<{slack: string, email: string}> }}
 */
function createAlertRouter(slackClient, emailTransport, auditLog) {
  /**
   * routeAlert — dispatches a threshold breach alert to all compliance channels.
   *
   * Never throws. Returns { slack: 'sent'|'failed', email: 'sent'|'failed' }.
   * Every call is logged to the audit trail regardless of channel outcomes.
   *
   * @param {{ alertId: string, amount: number, customerId: string, breachTimestamp: string }} payload
   * @returns {Promise<{ slack: string, email: string }>}
   */
  async function routeAlert(payload) {
    const { alertId, amount, customerId, breachTimestamp } = payload;
    const dispatchedAt = new Date().toISOString();

    // -----------------------------------------------------------------------
    // Dispatch to Slack — #aml-alerts
    // -----------------------------------------------------------------------
    let slackStatus = 'sent';
    try {
      await slackClient.chat.postMessage({
        channel: '#aml-alerts',
        text: `AML Threshold Breach Alert — ${alertId}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: [
                `*AML Threshold Breach Detected*`,
                `• *Alert ID:* ${alertId}`,
                `• *Amount:* ${amount}`,
                `• *Customer ID:* ${customerId}`,
                `• *Breach Timestamp:* ${breachTimestamp}`,
              ].join('\n'),
            },
          },
        ],
      });
    } catch (err) {
      slackStatus = 'failed';
    }

    // -----------------------------------------------------------------------
    // Dispatch via Email — compliance@enterprise.com
    // -----------------------------------------------------------------------
    let emailStatus = 'sent';
    try {
      await emailTransport.sendMail({
        to: 'compliance@enterprise.com',
        subject: `AML Threshold Breach — ${alertId}`,
        text: [
          `AML Threshold Breach Alert`,
          ``,
          `Alert ID:          ${alertId}`,
          `Amount:            ${amount}`,
          `Customer ID:       ${customerId}`,
          `Breach Timestamp:  ${breachTimestamp}`,
          `Dispatched At:     ${dispatchedAt}`,
        ].join('\n'),
        html: `
          <h2>AML Threshold Breach Alert</h2>
          <table>
            <tr><th>Alert ID</th><td>${alertId}</td></tr>
            <tr><th>Amount</th><td>${amount}</td></tr>
            <tr><th>Customer ID</th><td>${customerId}</td></tr>
            <tr><th>Breach Timestamp</th><td>${breachTimestamp}</td></tr>
            <tr><th>Dispatched At</th><td>${dispatchedAt}</td></tr>
          </table>
        `,
      });
    } catch (err) {
      emailStatus = 'failed';
    }

    // -----------------------------------------------------------------------
    // NFR-1 — Mandatory audit log entry (FCA compliance obligation).
    // Uses injected auditLog; production callers MUST inject
    // src/audit/audit-logger.js.  console.log is NOT acceptable here.
    // -----------------------------------------------------------------------
    auditLog.log({
      event: 'ALERT_DISPATCHED',
      alertId,
      dispatchedAt,
      slack: slackStatus,
      email: emailStatus,
    });

    return { slack: slackStatus, email: emailStatus };
  }

  return { routeAlert };
}

module.exports = createAlertRouter;
```

**Expected state after TASK 2:** All 8 tests pass. GREEN confirmed.

---

### TASK 3 — Verify wiring to production dependencies (integration note, no new tests)

No new test file is required. This task documents the expected production wiring so the tech lead reviewer can confirm compliance obligations are met at the call site.

When `alert-router.js` is used in production code, it **must** be instantiated as:

```js
// Example: src/compliance/index.js (or wherever aml.1 calls the router)
'use strict';

const { WebClient } = require('@slack/web-api');
const nodemailer = require('nodemailer');
const auditLogger = require('../audit/audit-logger');      // NFR-1 — mandatory
const createAlertRouter = require('./alert-router');

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

const emailTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const alertRouter = createAlertRouter(slackClient, emailTransport, auditLogger);

module.exports = alertRouter;
```

> **Tech lead checkpoint:** Confirm `auditLogger` (not `console.log`) is always injected before merging to `main`.

---

## File Manifest

| Action | Path |
|--------|------|
| CREATE | `tests/compliance/alert-router.test.js` |
| CREATE | `src/compliance/alert-router.js` |
| READ (existing, do not modify) | `src/audit/audit-logger.js` |

---

## AC → Test → Code Traceability Matrix

| AC / NFR | Test IDs | Implementation line(s) |
|----------|----------|------------------------|
| AC1 — Slack to `#aml-alerts` | T1, T2 | `slackClient.chat.postMessage({ channel: '#aml-alerts', ... })` |
| AC2 — Email to compliance@ | T3, T4 | `emailTransport.sendMail({ to: 'compliance@enterprise.com', subject: ... })` |
| AC3 — Partial failure / no-throw | T5, T6 | `try/catch` blocks around each channel; return object always resolves |
| NFR-1 — Audit log | T7, T8 | `auditLog.log({ alertId, dispatchedAt, slack, email })` — always executed |

---

## Out-of-Scope Boundary (do not implement)

- SAR filing or MLRO escalation
- Threshold detection (belongs to aml.1)
- Alert deduplication, suppression, or rate limiting
- Any UI for compliance officer review
- Modifying `src/audit/audit-logger.js`

---

## Risk Notes

| Risk | Mitigation |
|------|------------|
| `auditLogger` swapped for `console.log` at call site | Factory pattern forces explicit injection; tech lead review gate before merge |
| Channels dispatched concurrently vs. sequentially | Current impl is sequential (await each). If parallelism is desired in future, use `Promise.allSettled` — both approaches satisfy the AC as written |
| `logs/` directory missing at runtime | `audit-logger.js` uses `fs.appendFileSync` — ensure `logs/` exists in deployment; out of scope for this story |
```