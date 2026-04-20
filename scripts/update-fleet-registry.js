'use strict';

const VALID_SYNC_STATUSES = ['clean', 'stale'];
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const DEFAULT_STALE_THRESHOLD = 2;

/**
 * Validate a consumer registry entry against the required schema.
 *
 * @param {object} entry
 * @returns {null|Error} null if valid, Error naming the invalid field
 */
function validateEntry(entry) {
  const required = ['consumerSlug', 'lockfileVersion', 'upstreamSource', 'lastSyncDate', 'syncStatus'];
  for (const field of required) {
    if (entry[field] === undefined || entry[field] === null) {
      return new Error(
        `Fleet registry entry validation failed: missing required field "${field}".`
      );
    }
  }
  if (!VALID_SYNC_STATUSES.includes(entry.syncStatus)) {
    return new Error(
      `Invalid syncStatus "${entry.syncStatus}": must be one of ${VALID_SYNC_STATUSES.join(', ')}.`
    );
  }
  if (!ISO_DATE_RE.test(entry.lastSyncDate)) {
    return new Error(
      `Invalid lastSyncDate "${entry.lastSyncDate}": must be an ISO 8601 date string (e.g. 2026-04-19T10:00:00Z).`
    );
  }
  return null;
}

/**
 * Compute sync status for a consumer based on versions behind threshold.
 *
 * @param {object} options
 * @param {number} options.versionsBehind  - How many versions behind the consumer is
 * @param {number} [options.threshold=2]   - Versions-behind threshold for "stale" (default: 2)
 * @returns {{ syncStatus: string, versionsBehind?: number }}
 */
function computeSyncStatus({ versionsBehind, threshold }) {
  const limit = (threshold !== undefined && threshold !== null) ? threshold : DEFAULT_STALE_THRESHOLD;
  if (versionsBehind >= limit) {
    return { syncStatus: 'stale', versionsBehind };
  }
  return { syncStatus: 'clean' };
}

/**
 * Add a consumer entry to the fleet registry.
 * Validates required fields and computes syncStatus.
 *
 * @param {object} input
 * @param {string} input.consumerSlug    - Identifier for the consumer repo (e.g. 'org/repo')
 * @param {string} input.lockfileVersion - The platform version from the consumer's lockfile
 * @param {string} input.upstreamSource  - The upstream URL recorded in the consumer's lockfile
 * @param {string} input.lastSyncDate    - ISO 8601 date of last sync
 * @returns {object} The registry entry
 * @throws {Error} If required fields are missing
 */
function addConsumerEntry({ consumerSlug, lockfileVersion, upstreamSource, lastSyncDate }) {
  if (!upstreamSource) {
    throw new Error(
      'Fleet registry entry validation failed: missing required field "upstreamSource".'
    );
  }
  if (!consumerSlug) {
    throw new Error(
      'Fleet registry entry validation failed: missing required field "consumerSlug".'
    );
  }
  if (!lockfileVersion) {
    throw new Error(
      'Fleet registry entry validation failed: missing required field "lockfileVersion".'
    );
  }
  if (!lastSyncDate) {
    throw new Error(
      'Fleet registry entry validation failed: missing required field "lastSyncDate".'
    );
  }

  const statusResult = computeSyncStatus({ versionsBehind: 0 });

  return {
    consumerSlug,
    lockfileVersion,
    upstreamSource,
    lastSyncDate,
    syncStatus: statusResult.syncStatus,
  };
}

module.exports = { addConsumerEntry, computeSyncStatus, validateEntry };
