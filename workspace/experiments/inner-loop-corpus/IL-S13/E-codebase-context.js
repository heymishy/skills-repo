// Existing codebase context for IL-S13
// File: src/payments/payment-router.js (existing — payments.11 MODIFIES this)

'use strict';

const nzDomesticGateway = require('../gateways/nz-domestic-gateway');
const swiftGateway = require('../gateways/swift-gateway'); // existing, handles MT103 formatting
const rbnzClient = require('../aml/rbnz-client');          // existing: RBNZ sanctioned party list screening
const austracClient = require('../aml/austrac-client');    // existing: AUSTRAC watchlist client

/**
 * Routes a payment to the appropriate gateway.
 * Currently supports NZ domestic payments only.
 *
 * payments.11 adds:
 *   - Trans-Tasman routing branch for { destinationCountry: 'AU', paymentType: 'INTRAGROUP' }
 *   - Dual-AML screening (RBNZ then AUSTRAC) for all cross-border payments
 *   - SWIFT notification artefact production (C5 — JPMorgan Chase correspondent agreement)
 */
async function routePayment(payment) {
  const { destinationCountry, paymentType, amount, creditorAccount, debtorAccount } = payment;

  // Existing NZ domestic routing
  if (destinationCountry === 'NZ') {
    return nzDomesticGateway.forward({ amount, creditorAccount, debtorAccount });
  }

  // TODO payments.11: Add AU intragroup routing branch
  // TODO payments.11: Dual-AML screening (RBNZ first per C7, then AUSTRAC)
  // TODO payments.11: SWIFT notification artefact (C5)

  throw new Error(`Unsupported routing: destinationCountry=${destinationCountry}`);
}

module.exports = { routePayment };

// ─────────────────────────────────────────────────────────────────────────────
// File: src/aml/rbnz-client.js (existing — do NOT modify)
// ─────────────────────────────────────────────────────────────────────────────
//
// async function screen({ creditorAccount, debtorAccount, amount }) {
//   // Returns { match: boolean, listName: 'RBNZ_SANCTIONED' | null }
// }

// ─────────────────────────────────────────────────────────────────────────────
// File: src/aml/austrac-client.js (existing — do NOT modify)
// ─────────────────────────────────────────────────────────────────────────────
//
// async function screen({ creditorAccount, debtorAccount, amount }) {
//   // Returns { match: boolean, listName: 'AUSTRAC_WATCHLIST' | null }
// }

// ─────────────────────────────────────────────────────────────────────────────
// Files to be created by payments.11:
// ─────────────────────────────────────────────────────────────────────────────
//
// src/payments/trans-tasman-router.js
//   Handles AU intragroup routing logic; calls dual-aml-screener then swift gateway.
//   Produces SWIFT notification artefact on first call (C5).
//
// src/aml/dual-aml-screener.js
//   Sequential screening: rbnzClient.screen() then austracClient.screen() (C7 ordering).
//   Returns { blocked: boolean, blockedBy: string | null }
