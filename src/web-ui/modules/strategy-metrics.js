'use strict';
// strategy-metrics.js — sdg.6: detects "[Grounded in: <filename>]" callout
// markers in completed /ideate and /discovery artefacts and records
// per-artefact metrics to workspace/strategy-metrics.json, so callout rate
// (how often the model actually used uploaded reference content) can be
// correlated with artefact quality over time.
//
// Append-only: prior entries are never mutated or removed (NFR-APPEND).
// Section counting rule: an artefact's "totalSections" is the number of
// "##" (H2) headings in its saved markdown -- this is the counting
// convention every /ideate and /discovery artefact template already uses
// for its own section structure (see skills/discovery/SKILL.md's
// "### Section N" headings roll up under this repo's own artefact templates'
// top-level "##" sections).

var fs   = require('fs');
var path = require('path');

var METRICS_FILENAME = 'strategy-metrics.json';

// Literal, case-sensitive pattern (NFR-LITERAL) — no `i` flag.
var CALLOUT_PATTERN = /\[Grounded in: ([^\]]+)\]/g;

function _metricsPath(workspaceDir) {
  return path.join(workspaceDir, METRICS_FILENAME);
}

/**
 * Idempotent: creates workspace/strategy-metrics.json with {"metrics":[]}
 * if it does not already exist. Never resets an existing file's content.
 * @param {string} workspaceDir
 */
function initMetricsFile(workspaceDir) {
  var filePath = _metricsPath(workspaceDir);
  if (fs.existsSync(filePath)) return;
  fs.writeFileSync(filePath, JSON.stringify({ metrics: [] }, null, 2), 'utf8');
}

/**
 * Scan artefact text for literal "[Grounded in: <filename>]" occurrences.
 * Case-sensitive (NFR-LITERAL) — "[grounded in: ...]" does not match.
 * @param {string} text
 * @returns {{ count: number, filenames: string[] }}
 */
function detectCalloutMarkers(text) {
  var filenames = [];
  var re = new RegExp(CALLOUT_PATTERN.source, 'g');
  var match;
  while ((match = re.exec(text || '')) !== null) {
    filenames.push(match[1]);
  }
  return { count: filenames.length, filenames: filenames };
}

/**
 * Count "##" (H2) heading occurrences in artefact markdown — the
 * documented section-counting rule for totalSections (accepted gap,
 * per sdg.6's test plan: heuristic, not semantic section parsing).
 * @param {string} text
 * @returns {number}
 */
function countSections(text) {
  var matches = (text || '').match(/^##\s+/gm);
  return matches ? matches.length : 0;
}

/**
 * Append one metrics entry to workspace/strategy-metrics.json. Read-modify-
 * write: existing entries are preserved verbatim (NFR-APPEND); calloutRate
 * is computed here (rounded to 2dp) so callers only supply raw counts.
 * @param {string} workspaceDir
 * @param {{featureSlug:string, stage:string, hasReferenceFiles:boolean,
 *          referenceFileCount:number, referenceFileNames:string[],
 *          calloutCount:number, totalSections:number}} payload
 */
function recordMetrics(workspaceDir, payload) {
  initMetricsFile(workspaceDir);
  var filePath = _metricsPath(workspaceDir);
  var current = { metrics: [] };
  try { current = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch (_) {}
  if (!current || !Array.isArray(current.metrics)) current = { metrics: [] };

  var rate = payload.totalSections > 0
    ? Math.round((payload.calloutCount / payload.totalSections) * 100) / 100
    : 0;

  current.metrics.push({
    date:               new Date().toISOString(),
    featureSlug:        payload.featureSlug,
    stage:              payload.stage,
    hasReferenceFiles:  !!payload.hasReferenceFiles,
    referenceFileCount: payload.referenceFileCount || 0,
    referenceFileNames: payload.referenceFileNames || [],
    calloutCount:       payload.calloutCount || 0,
    totalSections:      payload.totalSections || 0,
    calloutRate:        rate
  });

  fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf8');
}

/**
 * Human-readable session-completion line (AC4).
 * @param {{hasReferenceFiles:boolean, calloutCount?:number, totalSections?:number}} payload
 * @returns {string}
 */
function buildCompletionSummary(payload) {
  if (!payload || !payload.hasReferenceFiles) {
    return 'No strategy grounding used in this session.';
  }
  var count = payload.calloutCount || 0;
  var total = payload.totalSections || 0;
  var rate  = total > 0 ? Math.round((count / total) * 100) / 100 : 0;
  return 'Strategy content was cited in ' + count + '/' + total + ' sections of your artefact (rate: ' + rate + ').';
}

module.exports = { initMetricsFile, detectCalloutMarkers, countSections, recordMetrics, buildCompletionSummary };
