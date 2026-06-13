// Existing codebase context for IL-S13
// payments.aml-screener-1 creates src/aml/dual-aml-screener.js using these existing modules

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// src/aml/rbnz-client.js  (existing — do NOT modify)
// ─────────────────────────────────────────────────────────────────────────────

// async function screen({ paymentId, creditorAccount, debtorAccount, amount }) {
//   // Screens payment against RBNZ sanctioned party list
//   // Returns: { match: boolean, listName: 'RBNZ_SANCTIONED' | null }
// }
// module.exports = { screen };

// ─────────────────────────────────────────────────────────────────────────────
// src/aml/austrac-client.js  (existing — do NOT modify)
// ─────────────────────────────────────────────────────────────────────────────

// async function screen({ paymentId, creditorAccount, debtorAccount, amount }) {
//   // Screens payment against AUSTRAC watchlist
//   // Returns: { match: boolean, listName: 'AUSTRAC_WATCHLIST' | null }
// }
// module.exports = { screen };

// ─────────────────────────────────────────────────────────────────────────────
// src/audit/audit-logger.js  (existing — do NOT modify)
// ─────────────────────────────────────────────────────────────────────────────

// function log(entry) {
//   // Writes structured audit log entry to compliance audit stream
//   // entry: { paymentId, rbnzResult, austracResult, blocked, timestamp }
//   //   - rbnzResult:   { match: boolean, listName: string | null }
//   //   - austracResult: { match: boolean, listName: string | null } | null
//   //                    (null when RBNZ blocked early — AUSTRAC not called per C7)
//   //   - timestamp:    Date.now() at time of screening
// }
// module.exports = { log };

// ─────────────────────────────────────────────────────────────────────────────
// src/aml/dual-aml-screener.js  (to be CREATED by payments.aml-screener-1)
// ─────────────────────────────────────────────────────────────────────────────
//
// Must export: screenCrossBorder(payment) → Promise<{ blocked: boolean, blockedBy: string | null }>
//
// Sequential flow (C7 — RBNZ before AUSTRAC; NO Promise.all):
//   1. await rbnzClient.screen(payment)  — RBNZ first (domestic regulator obligation)
//   2. if match → return { blocked: true, blockedBy: 'RBNZ_SANCTIONED' }
//   3. await austracClient.screen(payment)  — AUSTRAC second
//   4. if match → return { blocked: true, blockedBy: 'AUSTRAC_WATCHLIST' }
//   5. return { blocked: false, blockedBy: null }
//   6. On every call: auditLogger.log({ paymentId, rbnzResult, austracResult, blocked, timestamp })
//
// tests/aml/dual-aml-screener.test.js  (to be CREATED by payments.aml-screener-1)
//
// Jest test suite covering T1–T7 (see C-test-plan.md)
// Mock: jest.mock('../../src/aml/rbnz-client'), jest.mock('../../src/aml/austrac-client'), jest.mock('../../src/audit/audit-logger')
