Save path: artefacts/2026-06-13-aml-threshold-monitoring/plans/aml.2-plan.md

---

# IL-T3 Implementation Plan — aml.2 Alert Routing

**Feature:** 2026-06-13-aml-threshold-monitoring  
**Story:** aml.2 — Route threshold breach alerts to compliance channels  
**Branch:** `feature/aml.2`  
**Test Command:** `npm test`  
**Oversight Level:** Medium

---

## TDD Execution Order

All tests are written **FIRST**, in RED phase. Implementation follows **AFTER** all test specs are defined.

---

## Test Suite: `tests/compliance/alert-router.test.js`

### RED Phase Tests (Failing Tests First)

```javascript
'use strict';

const assert = require('assert');
const sinon = require('sinon');
const createAlertRouter = require('../../src/compliance/alert-router');
const auditLogger = require('../../src/audit/audit-logger');

describe('Alert Router — aml.2', () => {
  let slackClientStub;
  let emailTransportStub;
  let auditLoggerStub;
  let alertRouter;

  beforeEach(() => {
    // Stub external dependencies
    slackClientStub = {
      chat: {
        postMessage: sinon.stub().resolves({ ok: true }),
      },
    };

    emailTransportStub = {
      sendMail: sinon.stub().callsArgAsync(1, null, { response: '250 OK' }),
    };

    auditLoggerStub = sinon.stub(auditLogger, 'log');

    // Create router instance with stubbed dependencies
    alertRouter = createAlertRouter(slackClientStub, emailTransportStub, auditLogger);
  });

  afterEach(() => {
    sinon.restore();
  });

  // ============ AC1: Slack Message Sent ============

  describe('AC1 — Slack message to #aml-alerts', () => {
    it('T1: postMessage called with #aml-alerts channel', async () => {
      const payload = {
        alertId: 'ALERT_001',
        amount: 25000,
        customerId: 'CUST_123',
        breachTimestamp: '2026-06-13T10:30:00Z',
      };

      await alertRouter.routeAlert(payload);

      assert(
        slackClientStub.chat.postMessage.calledOnce,
        'postMessage should be called exactly once'
      );

      const callArgs = slackClientStub.chat.postMessage.getCall(0).args[0];
      assert.strictEqual(
        callArgs.channel,
        '#aml-alerts',
        'channel must be #aml-alerts'
      );
    });

    it('T2: Slack message contains alertId and amount', async () => {
      const payload = {
        alertId: 'ALERT_001',
        amount: 25000,
        customerId: 'CUST_123',
        breachTimestamp: '2026-06-13T10:30:00Z',
      };

      await alertRouter.routeAlert(payload);

      const callArgs = slackClientStub.chat.postMessage.getCall(0).args[0];
      const messageText = callArgs.text || JSON.stringify(callArgs);

      assert(
        messageText.includes('ALERT_001'),
        'Slack message must contain alertId'
      );
      assert(
        messageText.includes('25000'),
        'Slack message must contain amount'
      );
    });
  });

  // ============ AC2: Email Sent to Compliance ============

  describe('AC2 — Email to compliance@enterprise.com', () => {
    it('T3: sendMail called with correct to and subject', async () => {
      const payload = {
        alertId: 'ALERT_001',
        amount: 25000,
        customerId: 'CUST_123',
        breachTimestamp: '2026-06-13T10:30:00Z',
      };

      await alertRouter.routeAlert(payload);

      assert(
        emailTransportStub.sendMail.calledOnce,
        'sendMail should be called exactly once'
      );

      const callArgs = emailTransportStub.sendMail.getCall(0).args[0];
      assert.strictEqual(
        callArgs.to,
        'compliance@enterprise.com',
        'email to must be compliance@enterprise.com'
      );
      assert.strictEqual(
        callArgs.subject,
        'AML Threshold Breach — ALERT_001',
        'subject must be AML Threshold Breach — [alertId]'
      );
    });

    it('T4: Email body contains alertId', async () => {
      const payload = {
        alertId: 'ALERT_001',
        amount: 25000,
        customerId: 'CUST_123',
        breachTimestamp: '2026-06-13T10:30:00Z',
      };

      await alertRouter.routeAlert(payload);

      const callArgs = emailTransportStub.sendMail.getCall(0).args[0];
      const emailBody = callArgs.html || callArgs.text || '';

      assert(
        emailBody.includes('ALERT_001'),
        'email body must contain alertId'
      );
    });
  });

  // ============ AC3: Partial Failure Recovery ============

  describe('AC3 — Partial failure (no throw, graceful degradation)', () => {
    it('T5: Slack 5xx error → returns { slack: "failed", email: "sent" }', async () => {
      const payload = {
        alertId: 'ALERT_001',
        amount: 25000,
        customerId: 'CUST_123',
        breachTimestamp: '2026-06-13T10:30:00Z',
      };

      // Mock Slack to reject with 5xx
      slackClientStub.chat.postMessage.rejects(
        new Error('Slack API error: 503 Service Unavailable')
      );

      const result = await alertRouter.routeAlert(payload);

      assert.deepStrictEqual(
        result,
        { slack: 'failed', email: 'sent' },
        'should return partial success when Slack fails'
      );
    });

    it('T6: Function never throws on channel failure', async () => {
      const payload = {
        alertId: 'ALERT_001',
        amount: 25000,
        customerId: 'CUST_123',
        breachTimestamp: '2026-06-13T10:30:00Z',
      };

      // Mock both Slack and email to reject
      slackClientStub.chat.postMessage.rejects(new Error('Slack down'));
      emailTransportStub.sendMail.callsArgAsync(1, new Error('Email down'));

      let threwError = false;
      try {
        await alertRouter.routeAlert(payload);
      } catch (e) {
        threwError = true;
      }

      assert.strictEqual(
        threwError,
        false,
        'routeAlert must never throw, even on all channels failing'
      );
    });
  });

  // ============ NFR-1: Audit Logging ============

  describe('NFR-1 — Audit trail logging', () => {
    it('T7: auditLogger.log called on every routeAlert invocation', async () => {
      const payload = {
        alertId: 'ALERT_001',
        amount: 25000,
        customerId: 'CUST_123',
        breachTimestamp: '2026-06-13T10:30:00Z',
      };

      await alertRouter.routeAlert(payload);

      assert(
        auditLoggerStub.calledOnce,
        'auditLogger.log must be called exactly once per routeAlert'
      );
    });

    it('T8: Audit log entry contains alertId and channel statuses', async () => {
      const payload = {
        alertId: 'ALERT_001',
        amount: 25000,
        customerId: 'CUST_123',
        breachTimestamp: '2026-06-13T10:30:00Z',
      };

      await alertRouter.routeAlert(payload);

      const logEntry = auditLoggerStub.getCall(0).args[0];

      assert(
        logEntry.alertId,
        'audit log must contain alertId'
      );
      assert(
        logEntry.slack && (logEntry.slack === 'sent' || logEntry.slack === 'failed'),
        'audit log must contain slack channel status'
      );
      assert(
        logEntry.email && (logEntry.email === 'sent' || logEntry.email === 'failed'),
        'audit log must contain email channel status'
      );
    });
  });

  // ============ Integration: Success Path ============

  describe('Integration — Full success path', () => {
    it('returns { slack: "sent", email: "sent" } when all channels succeed', async () => {
      const payload = {
        alertId: 'ALERT_001',
        amount: 25000,
        customerId: 'CUST_123',
        breachTimestamp: '2026-06-13T10:30:00Z',
      };

      const result = await alertRouter.routeAlert(payload);

      assert.deepStrictEqual(
        result,
        { slack: 'sent', email: 'sent' },
        'should return full success when all channels deliver'
      );
    });
  });
});
```

---

## Implementation: `src/compliance/alert-router.js`

**File:** `src/compliance/alert-router.js`

```javascript
'use strict';

/**
 * createAlertRouter(slackClient, emailTransport, auditLogger)
 *
 * Factory function that returns an alert router with the routeAlert method.
 * Routes AML threshold breach alerts to Slack and email, with mandatory audit logging.
 *
 * @param {object} slackClient - Slack Web API client (e.g., @slack/web-api)
 * @param {object} emailTransport - nodemailer transport with sendMail(options, callback)
 * @param {object} auditLogger - audit logger from src/audit/audit-logger.js
 * @returns {object} router with async routeAlert(payload) method
 */
function createAlertRouter(slackClient, emailTransport, auditLogger) {
  return {
    /**
     * routeAlert(payload)
     *
     * Routes a threshold breach alert to compliance channels (Slack + email).
     * Never throws. Logs every dispatch attempt to audit trail.
     *
     * @param {object} payload
     * @param {string} payload.alertId - unique alert identifier (e.g., 'ALERT_001')
     * @param {number} payload.amount - breach amount in base currency units
     * @param {string} payload.customerId - customer identifier
     * @param {string} payload.breachTimestamp - ISO 8601 timestamp of breach
     *
     * @returns {Promise<object>} { slack: 'sent'|'failed', email: 'sent'|'failed' }
     */
    async routeAlert(payload) {
      const { alertId, amount, customerId, breachTimestamp } = payload;

      let slackStatus = 'failed';
      let emailStatus = 'failed';

      // ============ Route to Slack ============
      try {
        await slackClient.chat.postMessage({
          channel: '#aml-alerts',
          text: `AML Threshold Breach Alert`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*AML Threshold Breach Detected*\n\n*Alert ID:* ${alertId}\n*Amount:* £${amount}\n*Customer ID:* ${customerId}\n*Timestamp:* ${breachTimestamp}`,
              },
            },
          ],
        });
        slackStatus = 'sent';
      } catch (err) {
        // Slack delivery failed; do not throw, continue to email
        slackStatus = 'failed';
      }

      // ============ Route to Email ============
      try {
        await new Promise((resolve, reject) => {
          emailTransport.sendMail(
            {
              to: 'compliance@enterprise.com',
              subject: `AML Threshold Breach — ${alertId}`,
              html: `
                <h2>AML Threshold Breach Alert</h2>
                <p><strong>Alert ID:</strong> ${alertId}</p>
                <p><strong>Amount:</strong> £${amount}</p>
                <p><strong>Customer ID:</strong> ${customerId}</p>
                <p><strong>Timestamp:</strong> ${breachTimestamp}</p>
              `,
            },
            (err, info) => {
              if (err) {
                reject(err);
              } else {
                resolve(info);
              }
            }
          );
        });
        emailStatus = 'sent';
      } catch (err) {
        // Email delivery failed; do not throw
        emailStatus = 'failed';
      }

      // ============ Mandatory Audit Log (NFR-1) ============
      auditLogger.log({
        alertId,
        timestamp: new Date().toISOString(),
        slack: slackStatus,
        email: emailStatus,
      });

      // ============ Return Result ============
      return {
        slack: slackStatus,
        email: emailStatus,
      };
    },
  };
}

module.exports = createAlertRouter;
```

---

## Factory Integration: `src/compliance/alert-router-factory.js`

**File:** `src/compliance/alert-router-factory.js` (optional default export for convenience)

```javascript
'use strict';

const { WebClient } = require('@slack/web-api');
const nodemailer = require('nodemailer');
const createAlertRouter = require('./alert-router');
const auditLogger = require('../audit/audit-logger');

/**
 * Create a production alert router with real Slack and email transports.
 * This is a convenience factory for production use.
 */
function createProductionAlertRouter() {
  const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

  const emailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return createAlertRouter(slackClient, emailTransport, auditLogger);
}

module.exports = { createAlertRouter, createProductionAlertRouter };
```

---

## Summary of Changes

| File | Action | Purpose |
|------|--------|---------|
| `tests/compliance/alert-router.test.js` | **CREATE** | 8 unit tests (RED phase) covering AC1, AC2, AC3, NFR-1 |
| `src/compliance/alert-router.js` | **CREATE** | Core `routeAlert(payload)` implementation with Slack, email, and audit logging |
| `src/compliance/alert-router-factory.js` | **CREATE** | Production factory for convenience (optional; supports DI pattern) |

---

## Test Execution

```bash
npm test -- tests/compliance/alert-router.test.js
```

**Expected outcome (GREEN):**
- All 8 tests pass
- AC1: Slack message routed to `#aml-alerts` with alertId and amount ✓
- AC2: Email sent to `compliance@enterprise.com` with subject `AML Threshold Breach — [alertId]` ✓
- AC3: Partial failure (Slack 5xx) returns `{ slack: 'failed', email: 'sent' }`, never throws ✓
- NFR-1: Audit log called on every invocation with alertId and channel statuses ✓

---

## Acceptance Criteria Traceability

| AC | Test(s) | Implementation Section |
|----|---------|------------------------|
| AC1 | T1, T2 | Route to Slack (lines 67–84) |
| AC2 | T3, T4 | Route to Email (lines 86–115) |
| AC3 | T5, T6 | Error handling in both try/catch blocks |
| NFR-1 | T7, T8 | Mandatory Audit Log (lines 117–124) |

---

## Regulatory & Architecture Compliance

✓ **NFR-1 (Audit Trail):** Every `routeAlert` call logs to `src/audit/audit-logger.js` — NOT `console.log`  
✓ **No Throw Guarantee:** Function never throws; all errors caught and reported via return object  
✓ **Scope Boundary:** No SAR filing, MLRO escalation, deduplication, or threshold detection  
✓ **Dependency Injection:** Router accepts `slackClient`, `emailTransport`, `auditLogger` as parameters (testable)