'use strict';
/**
 * vuln-dedup-store.js -- coha-s3
 *
 * De-duplication record for the vulnerability-check CI step: tracks which
 * finding IDs have already been notified so a repeated, still-unresolved
 * finding doesn't produce a repeat notification (AC3, product/constraints.md
 * #13 -- CI-gate-verifiable de-duplication, not an instructional guarantee).
 *
 * Mirrors scripts/lib/incident-store.js's plain-function, no-class style.
 */
const fs = require('fs');

function loadNotifiedFindingIds(filePath) {
  if (!fs.existsSync(filePath)) { return []; }
  const raw = fs.readFileSync(filePath, 'utf8');
  return raw.trim().length > 0 ? JSON.parse(raw) : [];
}

function isAlreadyNotified(findingId, filePath) {
  return loadNotifiedFindingIds(filePath).indexOf(findingId) !== -1;
}

function recordNotifiedFinding(findingId, filePath) {
  const ids = loadNotifiedFindingIds(filePath);
  if (ids.indexOf(findingId) === -1) {
    ids.push(findingId);
  }
  fs.writeFileSync(filePath, JSON.stringify(ids, null, 2) + '\n');
  return ids;
}

module.exports = { loadNotifiedFindingIds, isAlreadyNotified, recordNotifiedFinding };
