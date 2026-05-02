'use strict';

// status-board.js — derive status indicators and render the portfolio status board.
// ADR-003: reads only existing pipeline-state.json fields (stage, prStatus, dorStatus, traceStatus).
// Accessibility NFR: colour is NEVER the sole status indicator — text label always present.

/**
 * Derive the blocker indicator label for a feature.
 * Returns "Trace findings" (exact AC2 text) when any story has traceStatus:"has-findings".
 * Returns null when no blocker.
 * @param {object} feature
 * @returns {string|null}
 */
function deriveBlockerIndicator(feature) {
  const stories = (feature && Array.isArray(feature.stories)) ? feature.stories : [];
  const hasFindings = stories.some(s => s && s.traceStatus === 'has-findings');
  return hasFindings ? 'Trace findings' : null;
}

/**
 * Derive the display status label for a feature's stories.
 * Returns "Awaiting implementation dispatch" (exact AC3 text) when any story has
 * dorStatus:"signed-off" AND prStatus:"none".
 * Returns a safe fallback string for any other state combination.
 * Never throws.
 * @param {Array} stories
 * @returns {string}
 */
function deriveFeatureStatusLabel(stories) {
  const storiesToCheck = Array.isArray(stories) ? stories : [];
  const awaitingDispatch = storiesToCheck.some(
    s => s && s.dorStatus === 'signed-off' && s.prStatus === 'none'
  );
  if (awaitingDispatch) return 'Awaiting implementation dispatch';
  const hasDraft = storiesToCheck.some(s => s && s.prStatus === 'draft');
  if (hasDraft) return 'In progress';
  const hasOpen = storiesToCheck.some(s => s && s.prStatus === 'open');
  if (hasOpen) return 'In review';
  return 'In progress';
}

/**
 * Determine whether a feature is "Done".
 * Done condition (AC5): ALL stories have prStatus:"merged" AND traceStatus:"passed".
 * Empty stories array → not done.
 * Uses only existing pipeline-state.json fields (ADR-003).
 * @param {object} feature
 * @returns {boolean}
 */
function isFeatureDone(feature) {
  const stories = (feature && Array.isArray(feature.stories)) ? feature.stories : [];
  if (stories.length === 0) return false;
  return stories.every(s => s && s.prStatus === 'merged' && s.traceStatus === 'passed');
}

/**
 * Render the portfolio status board as an HTML string.
 * Done features appear in a separate <section class="done-section"> element (AC5).
 * Amber indicator uses BOTH a CSS class AND a text label — colour not sole indicator (AC2, NFR).
 * @param {Array} features
 * @returns {string}
 */
function renderStatusBoard(features) {
  const featureList = Array.isArray(features) ? features : [];
  const inProgress = featureList.filter(f => !isFeatureDone(f));
  const done = featureList.filter(f => isFeatureDone(f));

  let html = '<div class="status-board">';

  // In-progress section
  html += '<section class="in-progress-section">';
  html += '<h2>In Progress</h2>';
  html += '<table class="status-table">';
  html += '<thead><tr><th>Feature</th><th>Stage</th><th>Last Activity</th><th>Status</th></tr></thead>';
  html += '<tbody>';
  for (const f of inProgress) {
    const blocker = deriveBlockerIndicator(f);
    const lastActivity = f.lastActivityDate || f.updatedAt || '';
    html += '<tr>';
    html += `<td>${escapeHtml(f.slug || '')}</td>`;
    html += `<td>${escapeHtml(f.stage || '')}</td>`;
    html += `<td>${escapeHtml(lastActivity)}</td>`;
    if (blocker) {
      // amber-indicator class + text label: colour NOT the sole indicator (WCAG AC2/NFR)
      html += `<td><span class="indicator amber-indicator">${escapeHtml(blocker)}</span></td>`;
    } else {
      const label = deriveFeatureStatusLabel(f.stories || []);
      html += `<td><span class="indicator">${escapeHtml(label)}</span></td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table></section>';

  // Done section — visually separated (AC5)
  if (done.length > 0) {
    html += '<section class="done-section">';
    html += '<h2>Done</h2>';
    html += '<table class="status-table">';
    html += '<thead><tr><th>Feature</th><th>Stage</th><th>Last Activity</th><th>Status</th></tr></thead>';
    html += '<tbody>';
    for (const f of done) {
      const lastActivity = f.lastActivityDate || f.updatedAt || '';
      html += '<tr>';
      html += `<td>${escapeHtml(f.slug || '')}</td>`;
      html += `<td>${escapeHtml(f.stage || '')}</td>`;
      html += `<td>${escapeHtml(lastActivity)}</td>`;
      html += '<td><span class="indicator done-indicator">Done</span></td>';
      html += '</tr>';
    }
    html += '</tbody></table></section>';
  }

  html += '</div>';
  return html;
}

/** Minimal HTML entity escaping to prevent XSS in rendered output. */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { deriveBlockerIndicator, deriveFeatureStatusLabel, isFeatureDone, renderStatusBoard };
