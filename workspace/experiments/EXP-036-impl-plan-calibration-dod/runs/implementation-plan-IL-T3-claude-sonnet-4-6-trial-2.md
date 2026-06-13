Save path: artefacts/2026-06-13-aml-threshold-monitoring/plans/aml.2-plan.md

```markdown
# Implementation Plan — aml.2: Route Threshold Breach Alerts to Compliance Channels

**Feature:** 2026-06-13-aml-threshold-monitoring
**Branch:** `feature/aml.2`
**Oversight level:** Medium (tech lead awareness required)
**Test command:** `npm test`

---

## Overview

Implement `routeAlert(payload)` exported from `src/compliance/alert-router.js` via a
factory function `createAlertRouter(slackClient, emailTransport, auditLog)`. The function
sends a Slack message to `#aml-alerts`, sends an email to `compliance@enterprise.com`,
logs every dispatch attempt to `src/audit/audit-logger.js`, and never throws — returning
a `{ slack: 'sent'|'failed', email: 'sent'|'failed' }` result object.

---

## File Inventory

| Action | Path |
|--------|------|
| CREATE | `tests/compliance/alert-router.test.js` |
| CREATE | `src/compliance/alert-router.js` |

No existing files are modified.

---

## TDD Task Sequence

### TASK 1 — Write the failing test file (RED)

**File:** `tests/compliance/alert-router.test.js`

Write all eight tests (T1–T8) before any implementation exists. Running `npm test` at
this point must show all tests failing (module-not-found or assertion failures).

```js
'use strict';

const createAlertRouter = require('../../src/compliance/alert-router');

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------
const PAYLOAD = {
  alertId: 'ALERT_001',
  amount: 15000,
  customerId: 'CUST_42',
  breachTimestamp: '2026-06-13T10:00:00.000Z',
};

// ---------------------------------------------------------------------------
// Helper factories for mocks
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
    sendMail: jest.fn().mockImplementation((opts, cb) => {
      if (shouldFail) {
        cb(new Error('SMTP error'));
      } else {
        cb(null, { messageId: 'msg_001' });
      }
    }),
  };
}

function makeAuditMock() {
  return { log: jest.fn() };
}

// ---------------------------------------------------------------------------
// AC1 — Slack message sent to #aml-alerts
// ---------------------------------------------------------------------------
describe('AC1 — Slack delivery', () => {
  test('T1: postMessage is called with channel #aml-alerts', async () => {
    const slack = makeSlackMock();
    const email = makeEmailMock();
    const audit = makeAuditMock();
    const router = createAlertRouter(slack, email, audit);

    await router.routeAlert(PAYLOAD);

    expect(slack.chat.postMessage).toHaveBeenCalledTimes(1);
    const callArg = slack.chat.postMessage.mock.calls[0][0];
    expect(callArg.channel).toBe('#aml-alerts');
  });

  test('T2: Slack message body contains alertId and amount', async () => {
    const slack = makeSlackMock();
    const email = makeEmailMock();
    const audit = makeAuditMock();
    const router = createAlertRouter(slack, email, audit);

    await router.routeAlert(PAYLOAD);

    const callArg = slack.chat.postMessage.mock.calls[0][0];
    // Accept either a flat text field or a blocks-based message
    const messageText = callArg.text || JSON.stringify(callArg.blocks || '');
    expect(messageText).toContain('ALERT_001');
    expect(messageText).toContain('15000');
  });
});

// ---------------------------------------------------------------------------
// AC2 — Email sent to compliance@enterprise.com
// ---------------------------------------------------------------------------
describe('AC2 — Email delivery', () => {
  test('T3: sendMail called with correct to and subject', async () => {
    const slack = makeSlackMock();
    const email = makeEmailMock();
    const audit = makeAuditMock();
    const router = createAlertRouter(slack, email, audit);

    await router.routeAlert(PAYLOAD);

    expect(email.sendMail).toHaveBeenCalledTimes(1);
    const mailOpts = email.sendMail.mock.calls[0][0];
    expect(mailOpts.to).toBe('compliance@enterprise.com');
    expect(mailOpts.subject).toBe('AML Threshold Breach — ALERT_001');
  });

  test('T4: email body contains alertId', async () => {
    const slack = makeSlackMock();
    const email = makeEmailMock();
    const audit = makeAuditMock();
    const router = createAlertRouter(slack, email, audit);

    await router.routeAlert(PAYLOAD);

    const mailOpts = email.sendMail.mock.calls[0][0];
    const body = mailOpts.text || mailOpts.html || '';
    expect(body).toContain('ALERT_001');
  });
});

// ---------------------------------------------------------------------------
// AC3 — Partial failure / never throws
// ---------------------------------------------------------------------------
describe('AC3 — Partial failure recovery', () => {
  test('T5: Slack 5xx → returns { slack: "failed", email: "sent" }', async () => {
    const slack = makeSlackMock({ shouldFail: true });
    const email = makeEmailMock();
    const audit = makeAuditMock();
    const router = createAlertRouter(slack, email, audit);

    const result = await router.routeAlert(PAYLOAD);

    expect(result).toEqual({ slack: 'failed', email: 'sent' });
  });

  test('T6: routeAlert never throws even when Slack rejects', async () => {
    const slack = makeSlackMock({ shouldFail: true });
    const email = makeEmailMock();
    const audit = makeAuditMock();
    const router = createAlertRouter(slack, email, audit);

    await expect(router.routeAlert(PAYLOAD)).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// NFR-1 — Audit log on every dispatch attempt
// ---------------------------------------------------------------------------
describe('NFR-1 — Audit logging', () => {
  test('T7: auditLogger.log is called exactly once per routeAlert call', async () => {
    const slack = makeSlackMock();
    const email = makeEmailMock();
    const audit = makeAuditMock();
    const router = createAlertRouter(slack, email, audit);

    await router.routeAlert(PAYLOAD);

    expect(audit.log).toHaveBeenCalledTimes(1);
  });

  test('T8: audit log entry contains alertId and channel statuses', async () => {
    const slack = makeSlackMock({ shouldFail: true });
    const email = makeEmailMock();
    const audit = makeAuditMock();
    const router = createAlertRouter(slack, email, audit);

    await router.routeAlert(PAYLOAD);

    expect(audit.log).toHaveBeenCalledTimes(1);
    const entry = audit.log.mock.calls[0][0];
    expect(entry.alertId).toBe('ALERT_001');
    expect(entry.timestamp).toBeDefined();
    expect(entry.channels).toMatchObject({
      slack: 'failed',
      email: 'sent',
    });
  });
});
```

**Verification (RED gate):** Run `npm test`. Expected outcome: 8 failures with
`Cannot find module '../../src/compliance/alert-router'`. Zero passing tests.
Do not proceed to Task 2 until this is confirmed.

---

### TASK 2 — Write the implementation (GREEN)

**File:** `src/compliance/alert-router.js`

Only create this file after Task 1 is committed and red.

```js
'use strict';

/**
 * Factory function — accepts injected dependencies for testability.
 *
 * @param {object} slackClient    - Slack WebClient instance (or compatible mock)
 * @param {object} emailTransport - nodemailer transport instance (or compatible mock)
 * @param {object} auditLog       - src/audit/audit-logger.js (or compatible mock)
 * @returns {{ routeAlert: Function }}
 */
function createAlertRouter(slackClient, emailTransport, auditLog) {
  // ------------------------------------------------------------------
  // Internal helpers
  // ------------------------------------------------------------------

  /**
   * Attempt to post a Slack message. Returns 'sent' or 'failed'; never throws.
   */
  async function dispatchSlack(payload) {
    try {
      await slackClient.chat.postMessage({
        channel: '#aml-alerts',
        text:
          `AML Threshold Breach Alert\n` +
          `Alert ID : ${payload.alertId}\n` +
          `Amount   : ${payload.amount}\n` +
          `Customer : ${payload.customerId}\n` +
          `Breached : ${payload.breachTimestamp}`,
      });
      return 'sent';
    } catch (err) {
      // Intentionally swallowed — partial failure is expected behaviour (AC3)
      return 'failed';
    }
  }

  /**
   * Attempt to send an email. Returns 'sent' or 'failed'; never throws.
   * Wraps the nodemailer callback API in a Promise for uniform async flow.
   */
  function dispatchEmail(payload) {
    return new Promise((resolve) => {
      const mailOptions = {
        to: 'compliance@enterprise.com',
        subject: `AML Threshold Breach — ${payload.alertId}`,
        text:
          `AML Threshold Breach Alert\n\n` +
          `Alert ID         : ${payload.alertId}\n` +
          `Amount           : ${payload.amount}\n` +
          `Customer ID      : ${payload.customerId}\n` +
          `Breach Timestamp : ${payload.breachTimestamp}\n`,
      };

      emailTransport.sendMail(mailOptions, (err) => {
        if (err) {
          resolve('failed');
        } else {
          resolve('sent');
        }
      });
    });
  }

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  /**
   * Route an alert to all compliance channels.
   *
   * @param {{ alertId: string, amount: number, customerId: string, breachTimestamp: string }} payload
   * @returns {Promise<{ slack: 'sent'|'failed', email: 'sent'|'failed' }>}
   */
  async function routeAlert(payload) {
    // Dispatch both channels concurrently — neither can block the other (AC3)
    const [slackStatus, emailStatus] = await Promise.all([
      dispatchSlack(payload),
      dispatchEmail(payload),
    ]);

    const result = { slack: slackStatus, email: emailStatus };

    // NFR-1 — MANDATORY compliance audit trail; MUST use auditLog, not console.log
    auditLog.log({
      alertId: payload.alertId,
      timestamp: new Date().toISOString(),
      channels: result,
    });

    return result;
  }

  return { routeAlert };
}

module.exports = createAlertRouter;
```

**Verification (GREEN gate):** Run `npm test`. Expected outcome: all 8 tests pass.

---

### TASK 3 — Wire production dependencies (integration wiring)

This task creates no new test. It wires real clients so application code can call
`routeAlert` in production without importing mocks.

**File:** `src/compliance/alert-router.js` — add a named export for the production
singleton **below** the factory export. No changes to the factory or tests.

```js
// Append to the bottom of src/compliance/alert-router.js
// after module.exports = createAlertRouter;

// Production singleton — only instantiated when running outside of test context.
// Tests always call createAlertRouter() directly with injected mocks.
if (process.env.NODE_ENV !== 'test') {
  const { WebClient } = require('@slack/web-api');
  const nodemailer = require('nodemailer');
  const auditLogger = require('../audit/audit-logger');

  const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
  const emailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  module.exports.productionRouter = createAlertRouter(
    slackClient,
    emailTransport,
    auditLogger,
  );
}
```

> **Note to reviewer:** Environment variables `SLACK_BOT_TOKEN`, `SMTP_HOST`,
> `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` must be present in the production runtime.
> These are out of scope for this story but must be added to the secrets store before
> deployment.

**Verification:** Run `npm test` again. All 8 tests must still pass (the `NODE_ENV`
guard prevents the production block from executing during tests).

---

## Acceptance Criteria Coverage Matrix

| AC / NFR | Tests | Covered by |
|----------|-------|------------|
| AC1 — Slack sent to `#aml-alerts` | T1, T2 | `dispatchSlack` → `slackClient.chat.postMessage` |
| AC2 — Email to `compliance@enterprise.com` with correct subject | T3, T4 | `dispatchEmail` → `emailTransport.sendMail` |
| AC3 — Partial failure; function never throws | T5, T6 | `try/catch` in `dispatchSlack`; callback → resolve in `dispatchEmail` |
| NFR-1 — Audit log on every call | T7, T8 | `auditLog.log(...)` after `Promise.all` |

---

## Scope Boundary Confirmation

The following are explicitly NOT in this implementation:

- SAR filing or MLRO escalation
- Threshold detection (aml.1 scope)
- Alert deduplication, suppression, or rate limiting
- Any UI or review workflow
- Changes to `src/audit/audit-logger.js`

---

## Risk Notes

| Risk | Mitigation |
|------|------------|
| `audit-logger.js` uses `fs.appendFileSync` — will fail if `logs/` directory absent | Ensure `logs/` exists in repo (add `.gitkeep`); out of scope for this story but flag to tech lead |
| Production secrets not yet in secrets store | Flag to tech lead before merge to `main` |
| nodemailer callback vs. promise API inconsistency | Wrapped in explicit `new Promise` in `dispatchEmail` — no dual-API risk |
```