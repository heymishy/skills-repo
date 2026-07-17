'use strict';

// src/web-ui/modules/sync-freshness.js -- pr-s3
//
// Formats a product_rollups.synced_at value as a human-readable relative
// time ("2 hours ago"), or the explicit "Not yet synced" label when no sync
// has ever run (AC3) -- never a blank string, "Invalid Date", or a raw
// timestamp/epoch number that could read as misleadingly current (AC1).

/**
 * @param {Date|string|null|undefined} syncedAt
 * @returns {string} human-readable relative time, or "Not yet synced"
 */
function formatSyncedAt(syncedAt) {
  if (!syncedAt) return 'Not yet synced';

  var then = new Date(syncedAt);
  var diffMs = Date.now() - then.getTime();
  var diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'Last synced just now';

  var diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return 'Last synced ' + diffMin + ' minute' + (diffMin === 1 ? '' : 's') + ' ago';

  var diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return 'Last synced ' + diffHours + ' hour' + (diffHours === 1 ? '' : 's') + ' ago';

  var diffDays = Math.floor(diffHours / 24);
  return 'Last synced ' + diffDays + ' day' + (diffDays === 1 ? '' : 's') + ' ago';
}

module.exports = {
  formatSyncedAt
};
