// Existing codebase context for IL-T3
// File: src/audit/audit-logger.js (existing module — the implementing agent must use this)

'use strict';

/**
 * Audit logger for compliance-relevant events.
 * All compliance events must be logged here — NOT to console.log.
 *
 * This module is the canonical destination for the FCA-required audit trail.
 * Usage: auditLogger.log({ event, alertId, timestamp, ...otherFields })
 */

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

// ─────────────────────────────────────────────────────────────────────────────
// Also available (for test injection pattern reference):
// File: src/compliance/alert-router.js (DOES NOT EXIST YET — agent creates this)
// The implementing agent should accept slack and email transport as parameters
// to enable mocking in tests. Example pattern used elsewhere in the codebase:

function createAlertRouter(slackClient, emailTransport, auditLog) {
  return {
    async routeAlert(payload) {
      // implementation goes here
    },
  };
}

// module.exports = createAlertRouter;
// — OR — export routeAlert directly with module-level singleton injection
// Both patterns are acceptable; choose the one that makes unit testing easier.
