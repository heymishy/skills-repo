Save path: artefacts/2026-06-13-aml-threshold-monitoring/plans/aml.2-plan.md

---

# Implementation Plan — aml.2 Alert Routing

**Story:** aml.2 — Route threshold breach alerts to compliance channels  
**Feature:** 2026-06-13-aml-threshold-monitoring  
**Branch:** `feature/aml.2`  
**Test Command:** `npm test`  
**Oversight Level:** Medium (compliance — tech lead awareness required)

---

## Overview

Implement `routeAlert(payload)` function that:
- Posts formatted Slack message to `#aml-alerts`
- Sends email to `compliance@enterprise.com`
- Logs every dispatch attempt to audit trail (NFR-1 compliance obligation)
- Returns partial success status; never throws

---

## Files to Create

1. `tests/compliance/alert-router.test.js` — Test suite (RED phase)
2. `src/compliance/alert-router.js` — Implementation (GREEN phase)

---

## Test Suite: `tests/compliance/alert-router.test.js`

### RED Phase — All Tests Written First

```js
'use strict';

const assert = require('assert');
const sinon = require('sinon');
const createAlertRouter = require('../../src/compliance/alert-router');

describe('Alert Router (aml.2)', () => {
  let slackClientStub;
  let emailTransportStub;
  let auditLoggerStub;
  let alertRouter;

  beforeEach(() => {
    // Slack client stub
    slackClientStub = {
      chat: {
        postMessage: sinon.stub().resolves({ ok: true, ts: '1234567890.123456' }),
      },
    };

    // Email transport stub
    emailTransportStub = {
      sendMail: sinon.stub().yieldsAsync(null, { messageId: 'msg-123' }),
    };

    // Audit logger stub
    auditLoggerStub = {
      log: sinon.stub(),
    };

    alertRouter = createAlertRouter(slackClientStub, emailTransportStub, auditLoggerStub);
  });

  afterEach(() => {
    sinon.restore();
  });

  // ============================================================================
  // AC1: Slack message sent to #aml-alerts
  // ============================================================================

  describe('AC1 — Slack message dispatch', () => {
    it('T1: postMessage called with #aml-alerts channel', async () => {
      const payload = {
        alertId: 'ALERT_001',
        amount: 15000,
        customerId: 'CUST_42',
        breachTimestamp: '2026-06-13T10:30:00Z',
      };

      const result = await alertRouter.routeAlert(payload);

      assert.strictEqual(slackClientStub.chat.postMessage.calledOnce, true);
      const callArgs = slackClientStub.chat.postMessage.getCall(0).args[0];
      assert.strictEqual(callArgs.channel, '#aml-alerts');
      assert.strictEqual(result.slack, 'sent');
    });

    it('T2: Slack message contains alertId and amount', async () => {
      const payload = {
        alertId: 'ALERT_002',
        amount: 25000,
        customerId: 'CUST_99',
        breachTimestamp: '2026-06-13T11:45:00Z',
      };

      await alertRouter.routeAlert(payload);

      const callArgs = slackClientStub.chat.postMessage.getCall(0).args[0];
      const messageText = callArgs.text || JSON.stringify(callArgs);
      assert(messageText.includes('ALERT_002'));
      assert(messageText.includes('25000'));
    });
  });

  // ============================================================================
  // AC2: Email sent to compliance@enterprise.com with correct subject
  // ============================================================================

  describe('AC2 — Email dispatch', () => {
    it('T3: sendMail called with correct to and subject', async () => {
      const payload = {
        alertId: 'ALERT_003',
        amount: 35000,
        customerId: 'CUST_77',
        breachTimestamp: '2026-06-13T12:00:00Z',
      };

      const result = await alertRouter.routeAlert(payload);

      assert.strictEqual(emailTransportStub.sendMail.calledOnce, true);
      const callArgs = emailTransportStub.sendMail.getCall(0).args[0];
      assert.strictEqual(callArgs.to, 'compliance@enterprise.com');
      assert.strictEqual(callArgs.subject, 'AML Threshold Breach — ALERT_003');
      assert.strictEqual(result.email, 'sent');
    });

    it('T4: Email body contains alertId', async () => {
      const payload = {
        alertId: 'ALERT_004',
        amount: 45000,
        customerId: 'CUST_55',
        breachTimestamp: '2026-06-13T13:15:00Z',
      };

      await alertRouter.routeAlert(payload);

      const callArgs = emailTransportStub.sendMail.getCall(0).args[0];
      const emailBody = callArgs.text || callArgs.html || '';
      assert(emailBody.includes('ALERT_004'));
    });
  });

  // ============================================================================
  // AC3: Partial failure recovery — function never throws
  // ============================================================================

  describe('AC3 — Partial failure & error resilience', () => {
    it('T5: Slack 5xx error → returns { slack: "failed", email: "sent" }', async () => {
      slackClientStub.chat.postMessage.rejects(
        new Error('Slack service unavailable (503)')
      );

      const payload = {
        alertId: 'ALERT_005',
        amount: 55000,
        customerId: 'CUST_33',
        breachTimestamp: '2026-06-13T14:30:00Z',
      };

      const result = await alertRouter.routeAlert(payload);

      assert.deepStrictEqual(result, { slack: 'failed', email: 'sent' });
      assert.strictEqual(emailTransportStub.sendMail.calledOnce, true);
    });

    it('T6: Function never throws on channel failure', async () => {
      slackClientStub.chat.postMessage.rejects(new Error('Network timeout'));
      emailTransportStub.sendMail.yieldsAsync(new Error('SMTP connection failed'));

      const payload = {
        alertId: 'ALERT_006',
        amount: 65000,
        customerId: 'CUST_11',
        breachTimestamp: '2026-06-13T15:45:00Z',
      };

      let threwError = false;
      try {
        await alertRouter.routeAlert(payload);
      } catch (err) {
        threwError = true;
      }

      assert.strictEqual(threwError, false);
    });

    it('T6b: Both channels fail → returns { slack: "failed", email: "failed" }', async () => {
      slackClientStub.chat.postMessage.rejects(new Error('Slack down'));
      emailTransportStub.sendMail.yieldsAsync(new Error('SMTP down'));

      const payload = {
        alertId: 'ALERT_007',
        amount: 75000,
        customerId: 'CUST_22',
        breachTimestamp: '2026-06-13T16:00:00Z',
      };

      const result = await alertRouter.routeAlert(payload);

      assert.deepStrictEqual(result, { slack: 'failed', email: 'failed' });
    });
  });

  // ============================================================================
  // NFR-1: Audit logging (compliance obligation — FCA regulatory requirement)
  // ============================================================================

  describe('NFR-1 — Audit trail logging', () => {
    it('T7: auditLogger.log called exactly once per routeAlert invocation', async () => {
      const payload = {
        alertId: 'ALERT_008',
        amount: 85000,
        customerId: 'CUST_88',
        breachTimestamp: '2026-06-13T17:00:00Z',
      };

      await alertRouter.routeAlert(payload);

      assert.strictEqual(auditLoggerStub.log.calledOnce, true);
    });

    it('T8: Audit log entry contains alertId and channel statuses', async () => {
      const payload = {
        alertId: 'ALERT_009',
        amount: 95000,
        customerId: 'CUST_66',
        breachTimestamp: '2026-06-13T18:15:00Z',
      };

      await alertRouter.routeAlert(payload);

      const logEntry = auditLoggerStub.log.getCall(0).args[0];
      assert.strictEqual(logEntry.alertId, 'ALERT_009');
      assert(logEntry.channelStatus);
      assert(logEntry.channelStatus.slack === 'sent' || logEntry.channelStatus.slack === 'failed');
      assert(logEntry.channelStatus.email === 'sent' || logEntry.channelStatus.email === 'failed');
    });

    it('T8b: Audit log contains timestamp', async () => {
      const payload = {
        alertId: 'ALERT_010',
        amount: 105000,
        customerId: 'CUST_44',
        breachTimestamp: '2026-06-13T19:30:00Z',
      };

      await alertRouter.routeAlert(payload);

      const logEntry = auditLoggerStub.log.getCall(0).args[0];
      assert(logEntry.timestamp);
      assert(typeof logEntry.timestamp === 'string');
    });

    it('T8c: Audit log entry written even when both channels fail', async () => {
      slackClientStub.chat.postMessage.rejects(new Error('Slack unavailable'));
      emailTransportStub.sendMail.yieldsAsync(new Error('SMTP unavailable'));

      const payload = {
        alertId: 'ALERT_011',
        amount: 115000,
        customerId: 'CUST_99',
        breachTimestamp: '2026-06-13T20:45:00Z',
      };

      await alertRouter.routeAlert(payload);

      assert.strictEqual(auditLoggerStub.log.calledOnce, true);
      const logEntry = auditLoggerStub.log.getCall(0).args[0];
      assert.strictEqual(logEntry.alertId, 'ALERT_011');
      assert.deepStrictEqual(logEntry.channelStatus, { slack: 'failed', email: 'failed' });
    });
  });

  // ============================================================================
  // Integration: Happy path — both channels succeed, audit logged
  // ============================================================================

  describe('Happy path integration', () => {
    it('Returns { slack: "sent", email: "sent" } and logs audit entry', async () => {
      const payload = {
        alertId: 'ALERT_FINAL',
        amount: 200000,
        customerId: 'CUST_FINAL',
        breachTimestamp: '2026-06-13T21:00:00Z',
      };

      const result = await alertRouter.routeAlert(payload);

      assert.deepStrictEqual(result, { slack: 'sent', email: 'sent' });
      assert.strictEqual(slackClientStub.chat.postMessage.calledOnce, true);
      assert.strictEqual(emailTransportStub.sendMail.calledOnce, true);
      assert.strictEqual(auditLoggerStub.log.calledOnce, true);
    });
  });
});
```

---

## Implementation: `src/compliance/alert-router.js`

### GREEN Phase — Implementation

```js
'use strict';

/**
 * Alert Router Factory
 *
 * Creates a routeAlert(payload) function that:
 * - Posts formatted Slack message to #aml-alerts
 * - Sends email to compliance@enterprise.com
 * - Logs every dispatch attempt to audit trail (NFR-1)
 * - Returns partial success status; never throws
 *
 * Architecture: Dependency injection pattern
 * - slackClient: Slack Web API client (@slack/web-api)
 * - emailTransport: nodemailer transport
 * - auditLogger: Audit logging module (src/audit/audit-logger.js)
 *
 * @param {Object} slackClient — Slack Web API client with chat.postMessage
 * @param {Object} emailTransport — nodemailer transport with sendMail
 * @param {Object} auditLogger — Audit logger with log(entry) method
 * @returns {Object} { routeAlert(payload) }
 */
function createAlertRouter(slackClient, emailTransport, auditLogger) {
  /**
   * Route a threshold breach alert to compliance channels
   *
   * AC1: Posts Slack message to #aml-alerts
   * AC2: Sends email to compliance@enterprise.com with subject AML Threshold Breach — [alertId]
   * AC3: Returns partial success; never throws
   * NFR-1: Logs every dispatch attempt (compliance obligation)
   *
   * @param {Object} payload — Alert payload
   * @param {string} payload.alertId — Unique alert identifier
   * @param {number} payload.amount — Breach amount in base currency
   * @param {string} payload.customerId — Customer identifier
   * @param {string} payload.breachTimestamp — ISO 8601 timestamp
   * @returns {Promise<{ slack: 'sent'|'failed', email: 'sent'|'failed' }>}
   */
  async function routeAlert(payload) {
    const { alertId, amount, customerId, breachTimestamp } = payload;

    let slackStatus = 'failed';
    let emailStatus = 'failed';

    // ========================================================================
    // AC1: Slack message to #aml-alerts
    // ========================================================================
    try {
      await slackClient.chat.postMessage({
        channel: '#aml-alerts',
        text: `🚨 AML Threshold Breach Alert\n\nAlert ID: ${alertId}\nAmount: £${amount}\nCustomer: ${customerId}\nDetected: ${breachTimestamp}`,
      });
      slackStatus = 'sent';
    } catch (slackErr) {
      // AC3: Catch error, do not throw; continue to email
      slackStatus = 'failed';
    }

    // ========================================================================
    // AC2: Email to compliance@enterprise.com
    // ========================================================================
    try {
      await new Promise((resolve, reject) => {
        emailTransport.sendMail(
          {
            to: 'compliance@enterprise.com',
            subject: `AML Threshold Breach — ${alertId}`,
            text: `An AML threshold breach alert has been triggered.\n\nAlert ID: ${alertId}\nAmount: £${amount}\nCustomer ID: ${customerId}\nDetected: ${breachTimestamp}\n\nPlease review and take appropriate action.`,
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
    } catch (emailErr) {
      // AC3: Catch error, do not throw
      emailStatus = 'failed';
    }

    // ========================================================================
    // NFR-1: Audit logging (compliance obligation — FCA regulatory requirement)
    // ========================================================================
    try {
      auditLogger.log({
        alertId,
        timestamp: new Date().toISOString(),
        channelStatus: {
          slack: slackStatus,
          email: emailStatus,
        },
        payload, // Full payload for audit trail
      });
    } catch (auditErr) {
      // NFR-1: Log audit failure but do not throw (graceful degradation)
      // This ensures the function contract is maintained
    }

    // ========================================================================
    // AC3: Return partial success status; never throw
    // ========================================================================
    return {
      slack: slackStatus,
      email: emailStatus,
    };
  }

  return {
    routeAlert,
  };
}

module.exports = createAlertRouter;
```

---

## Summary of Coverage

| AC / NFR | Test ID(s) | Implementation Coverage |
|----------|-----------|------------------------|
| **AC1** — Slack to #aml-alerts | T1, T2 | `slackClient.chat.postMessage({ channel: '#aml-alerts', ... })` |
| **AC2** — Email to compliance + subject | T3, T4 | `emailTransport.sendMail({ to: 'compliance@enterprise.com', subject: 'AML Threshold Breach — [alertId]' })` |
| **AC3** — Partial failure + no throw | T5, T6, T6b | Try-catch wrapping both channels; returns `{ slack, email }` status; no throw |
| **NFR-1** — Audit logging | T7, T8, T8b, T8c | `auditLogger.log({ alertId, timestamp, channelStatus })` called on every invocation |

---

## Test Execution Order

1. **RED phase:** Run test suite → All tests fail (no implementation)
   ```bash
   npm test -- tests/compliance/alert-router.test.js
   ```

2. **GREEN phase:** Add implementation → All tests pass

3. **REFACTOR phase:** Code review & cleanup (if needed)

---

## Architecture & Constraints

- **Dependency Injection:** Alert router accepts `slackClient`, `emailTransport`, `auditLogger` as constructor parameters
- **Error Resilience:** All external calls wrapped in try-catch; function never throws
- **Audit Trail (NFR-1):** Every dispatch logged to `src/audit/audit-logger.js` (compliance obligation — FCA requirement)
- **Scope Boundary:** No SAR filing, MLRO escalation, deduplication, or threshold detection (aml.1 scope)

---

## Handoff Checklist

- [ ] Create `tests/compliance/alert-router.test.js` (all RED tests written)
- [ ] Create `src/compliance/alert-router.js` (implementation)
- [ ] Verify `npm test` passes all 9+ test cases
- [ ] Verify audit logging writes to `logs/audit.jsonl`
- [ ] Confirm no SAR/MLRO logic (out of scope)
- [ ] Tech lead sign-off (medium oversight)