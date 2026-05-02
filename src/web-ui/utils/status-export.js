'use strict';

// status-export.js — export portfolio status as a markdown table.
// Used by GET /status/export to produce steering-committee-ready output (AC4).
// ADR-003: derives status from existing pipeline-state.json fields only.

const { deriveBlockerIndicator, deriveFeatureStatusLabel, isFeatureDone } = require('./status-board');

/**
 * Convert an array of features to a markdown status table.
 * Handles empty array gracefully (returns header + "No features" row).
 * @param {Array} features
 * @returns {string}
 */
function exportStatusAsMarkdown(features) {
  const featureList = Array.isArray(features) ? features : [];

  const header = '| Feature | Stage | Last Activity | Status |\n|---------|-------|---------------|--------|\n';

  if (featureList.length === 0) {
    return header + '| No features | — | — | — |\n';
  }

  let rows = '';
  for (const f of featureList) {
    const slug = f.slug || '';
    const stage = f.stage || '';
    const lastActivity = f.lastActivityDate || f.updatedAt || '';
    let status;
    if (isFeatureDone(f)) {
      status = 'Done';
    } else {
      const blocker = deriveBlockerIndicator(f);
      status = blocker || deriveFeatureStatusLabel(f.stories || []);
    }
    rows += `| ${slug} | ${stage} | ${lastActivity} | ${status} |\n`;
  }

  return header + rows;
}

module.exports = { exportStatusAsMarkdown };
