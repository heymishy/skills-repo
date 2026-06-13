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

Implement `routeAlert(payload)` via a factory function `createAlertRouter(slackClient, emailTransport, auditLog)` exported from `src/compliance/alert-router.js`. The function sends a Slack message to `#aml-alerts`, sends an email to `compliance@enterprise.com`, logs every dispatch attempt to `src/audit/audit-logger.js`, and returns `{ slack: 'sent'|'failed', email: 'sent'|'failed' }` — never throwing.

---

## Files to Touch

| Action | Path |
|--------|------|
| Create | `tests/compliance/alert-router.test.js` |
| Create | `src/compliance/alert-router.js` |

---

## TDD Task Sequence

### TASK 1 — Write failing tests (RED)

**File:** `tests/compliance/alert-router.test.js`

Write all eight tests before any implementation exists. Every test must fail at this stage (module not found).

```js
'use strict';

const createAlertRouter = require('../../src/compliance/alert-router');

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const PAYLOAD = {
  alertId: 'ALERT_001',
  amount: 15000,
  customerId: 'CUST_42',
  breachTimestamp: '2026-06-13T10:00:00.000Z',
};

function makeSlackMock({ shouldFail = false } = {}) {
  return {
    chat: {
      postMessage: jest.fn().mockImplementation(() =>
        shouldFail
          ? Promise.reject({ status: 503, message: 'Service Unavailable' })
          : Promise.resolve({ ok: true }),
      ),
    },
  };
}

function makeEmailMock({ shouldFail = false } = {}) {
  return {
    sendMail: jest.fn().mockImplementation((opts, cb) => {
      if (shouldFail) return cb(new Error('SMTP error'));
      return cb(null, { messageId: 'msg-001' });
    }),
  };
}

function makeAuditMock() {
  return { log: jest.fn() };
}

// ---------------------------------------------------------------------------
// AC1 — Slack message sent to #aml-alerts
// ---------------------------------------------------------------------------
describe('AC1 — Slack message', () => {
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

  // T2: message text contains alertId and amount
  test('T2: Slack message body contains alertId and amount', async () => {
    const slack = makeSlackMock();
    const email = makeEmailMock();
    const audit = makeAuditMock();
    const router = createAlertRouter(slack, email, audit);

    await router.routeAlert(PAYLOAD);

    const callArg = slack.chat.postMessage.mock.calls[0][0];
    // text or blocks — we inspect the serialised argument string
    const argString = JSON.stringify(callArg);
    expect(argString).toContain('ALERT_001');
    expect(argString).toContain('15000');
  });
});

// ---------------------------------------------------------------------------
// AC2 — Email sent to compliance@enterprise.com
// ---------------------------------------------------------------------------
describe('AC2 — Email sent', () => {
  // T3: sendMail called with correct to and subject
  test('T3: calls sendMail with correct to and subject', async () => {
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
      expect.any(Function),
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
    const bodyString = JSON.stringify(callArg);
    expect(bodyString).toContain('ALERT_001');
  });
});

// ---------------------------------------------------------------------------
// AC3 — Partial failure recovery
// ---------------------------------------------------------------------------
describe('AC3 — Partial failure', () => {
  // T5: Slack 5xx → { slack: 'failed', email: 'sent' }
  test('T5: Slack rejection returns { slack: "failed", email: "sent" }', async () => {
    const slack = makeSlackMock({ shouldFail: true });
    const email = makeEmailMock();
    const audit = makeAuditMock();
    const router = createAlertRouter(slack, email, audit);

    const result = await router.routeAlert(PAYLOAD);

    expect(result).toEqual({ slack: 'failed', email: 'sent' });
  });

  // T6: function never throws even when both channels fail
  test('T6: function never throws when both channels fail', async () => {
    const slack = makeSlackMock({ shouldFail: true });
    const email = makeEmailMock({ shouldFail: true });
    const audit = makeAuditMock();
    const router = createAlertRouter(slack, email, audit);

    await expect(router.routeAlert(PAYLOAD)).resolves.not.toThrow();
    const result = await router.routeAlert(PAYLOAD);
    expect(result).toEqual({ slack: 'failed', email: 'failed' });
  });
});

// ---------------------------------------------------------------------------
// NFR-1 — Audit logging (compliance evidence trail)
// ---------------------------------------------------------------------------
describe('NFR-1 — Audit log', () => {
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
  test('T8: log entry contains alertId, timestamp, and channel delivery statuses', async () => {
    const slack = makeSlackMock({ shouldFail: true });
    const email = makeEmailMock();
    const audit = makeAuditMock();
    const router = createAlertRouter(slack, email, audit);

    await router.routeAlert(PAYLOAD);

    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        alertId: 'ALERT_001',
        timestamp: expect.any(String),
        channels: expect.objectContaining({
          slack: 'failed',
          email: 'sent',
        }),
      }),
    );
  });
});
```

**Verification (RED gate):** Run `npm test`. All 8 tests must fail with `Cannot find module '../../src/compliance/alert-router'`. Do NOT proceed to Task 2 until this is confirmed.

---

### TASK 2 — Write implementation (GREEN)

**File:** `src/compliance/alert-router.js`

Only after all 8 tests are confirmed RED.

```js
'use strict';

/**
 * createAlertRouter — factory that injects transport dependencies.
 *
 * @param {object} slackClient   — Slack WebClient instance (or compatible mock)
 * @param {object} emailTransport — nodemailer transport (or compatible mock)
 * @param {object} auditLog      — audit-logger instance (defaults to src/audit/audit-logger.js)
 * @returns {{ routeAlert(payload): Promise<{slack: string, email: string}> }}
 */
function createAlertRouter(slackClient, emailTransport, auditLog) {
  // Allow callers to omit auditLog and fall back to the real module.
  // In production wiring this should always be passed explicitly.
  const logger = auditLog || require('../audit/audit-logger');

  return {
    /**
     * routeAlert — dispatches a threshold breach alert to Slack and email.
     *
     * Never throws. Returns { slack: 'sent'|'failed', email: 'sent'|'failed' }.
     *
     * @param {{ alertId: string, amount: number, customerId: string, breachTimestamp: string }} payload
     * @returns {Promise<{ slack: string, email: string }>}
     */
    async routeAlert(payload) {
      const { alertId, amount, customerId, breachTimestamp } = payload;
      const result = { slack: 'failed', email: 'failed' };

      // -----------------------------------------------------------------------
      // AC1 — Post to Slack #aml-alerts
      // -----------------------------------------------------------------------
      try {
        await slackClient.chat.postMessage({
          channel: '#aml-alerts',
          text: `*AML Threshold Breach* | alertId: ${alertId} | amount: ${amount} | customer: ${customerId} | breachTimestamp: ${breachTimestamp}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*AML Threshold Breach Detected*\n• *Alert ID:* ${alertId}\n• *Amount:* ${amount}\n• *Customer ID:* ${customerId}\n• *Breach Timestamp:* ${breachTimestamp}`,
              },
            },
          ],
        });
        result.slack = 'sent';
      } catch (err) {
        // Intentional: channel failure must not propagate (AC3)
        result.slack = 'failed';
      }

      // -----------------------------------------------------------------------
      // AC2 — Send email to compliance@enterprise.com
      // -----------------------------------------------------------------------
      await new Promise((resolve) => {
        emailTransport.sendMail(
          {
            to: 'compliance@enterprise.com',
            subject: `AML Threshold Breach — ${alertId}`,
            text: [
              `AML Threshold Breach Alert`,
              ``,
              `Alert ID:          ${alertId}`,
              `Amount:            ${amount}`,
              `Customer ID:       ${customerId}`,
              `Breach Timestamp:  ${breachTimestamp}`,
            ].join('\n'),
            html: `<p><strong>AML Threshold Breach Alert</strong></p>
<ul>
  <li><strong>Alert ID:</strong> ${alertId}</li>
  <li><strong>Amount:</strong> ${amount}</li>
  <li><strong>Customer ID:</strong> ${customerId}</li>
  <li><strong>Breach Timestamp:</strong> ${breachTimestamp}</li>
</ul>`,
          },
          (err) => {
            if (err) {
              result.email = 'failed';
            } else {
              result.email = 'sent';
            }
            resolve();
          },
        );
      });

      // -----------------------------------------------------------------------
      // NFR-1 — Audit log (MANDATORY — FCA compliance evidence trail)
      // Do NOT replace with console.log.
      // -----------------------------------------------------------------------
      logger.log({
        alertId,
        timestamp: new Date().toISOString(),
        channels: {
          slack: result.slack,
          email: result.email,
        },
      });

      return result;
    },
  };
}

module.exports = createAlertRouter;
```

**Verification (GREEN gate):** Run `npm test`. All 8 tests must pass. Do NOT proceed to Task 3 until this is confirmed.

---

### TASK 3 — Refactor (CLEAN)

Keep tests green throughout. Permitted refactors only — no behaviour changes.

1. **Extract message builders** — if the Slack block and email text grow, move them to small private helper functions (`buildSlackMessage`, `buildEmailOptions`) above `createAlertRouter`. No logic changes.
2. **JSDoc completeness** — ensure `@param` and `@returns` tags are accurate.
3. **No-op if already clean** — if no structural improvements are identified, record "No refactor needed" and close the task.

**Verification (CLEAN gate):** Run `npm test`. All 8 tests must still pass.

---

## Acceptance Criteria Traceability

| AC / NFR | Tests | Task |
|----------|-------|------|
| AC1 — Slack to `#aml-alerts` | T1, T2 | Task 1 (test), Task 2 (impl) |
| AC2 — Email to `compliance@enterprise.com` | T3, T4 | Task 1 (test), Task 2 (impl) |
| AC3 — Partial failure, never throws | T5, T6 | Task 1 (test), Task 2 (impl) |
| NFR-1 — Audit log on every call | T7, T8 | Task 1 (test), Task 2 (impl) |

---

## Scope Boundary (enforced)

| Item | In scope | Out of scope |
|------|----------|-------------|
| Slack `#aml-alerts` dispatch | ✅ | |
| Email `compliance@enterprise.com` | ✅ | |
| Audit log via `audit-logger.js` | ✅ | |
| `console.log` as audit trail | | ✅ (prohibited) |
| SAR filing / MLRO escalation | | ✅ |
| Threshold detection | | ✅ (aml.1) |
| Alert deduplication / suppression | | ✅ |
| Review workflow UI | | ✅ |

---

## Dependency Notes

- `slackClient` — caller injects a `@slack/web-api` `WebClient` instance. The alert router has no `require('@slack/web-api')` — dependency inversion is maintained.
- `emailTransport` — caller injects a nodemailer transport. The alert router has no `require('nodemailer')`.
- `auditLog` — caller should inject `require('./src/audit/audit-logger')`. The module falls back to a direct require only when `auditLog` is omitted (defensive default for production wiring convenience; tests always inject a mock).
```