// Existing codebase context for IL-S3
// File: src/payments/rtp-message-handler.js (existing module — implementing agent MODIFIES this)

'use strict';

const schemeBridge = require('./scheme-bridge'); // existing: sends pacs.002 ACKs to Payments NZ
const processingLog = require('./processing-log'); // existing: append-only log of payment processing events

/**
 * Handles a single inbound ISO 20022 pacs.008 payment message.
 * Called by the scheme listener on every inbound message.
 *
 * Currently: processes the payment and sends ACK but does NOT enforce the 10-second SLA.
 * rtp.3 adds the SLA timer wrapper around this function.
 */
async function handleInboundMessage(message) {
  const { messageId, amount, creditorAccount } = message;

  // Step 1: AML screening (real-time API, P99 8 seconds)
  const amlResult = await amlClient.screen({ amount, creditorAccount });
  if (amlResult.hold) {
    return schemeBridge.sendAck({ type: 'pacs.002', status: 'REJECTED', reason: 'AML_HOLD', messageId });
  }

  // Step 2: Fraud pre-screen (stub — real-time fraud API not yet integrated)
  const fraudResult = { pass: true }; // stub; fraud vendor API is phase 2

  // Step 3: Credit the account
  await accountLedger.credit({ accountId: creditorAccount, amount });

  // Step 4: Send positive ACK
  return schemeBridge.sendAck({ type: 'pacs.002', status: 'ACCEPTED', messageId });
}

// SLA timer module to be created by rtp.3:
// src/payments/rtp-sla-timer.js
// It should wrap handleInboundMessage with a 9,500ms timer.
// Pattern: Promise.race([handleInboundMessage(message), slaTimeout(9500)])
// On timeout: schemeBridge.sendAck({ type: 'pacs.002', status: 'REJECTED', reason: 'SCHEME_SLA_EXCEEDED' })

module.exports = { handleInboundMessage };
