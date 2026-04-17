#!/usr/bin/env node
/**
 * calibration.js
 *
 * Estimation calibration detection dimension for the improvement agent (p3.11).
 *
 * Reads workspace/estimation-norms.md, detects systematic underestimation, and
 * stages a calibration proposal when the detection conditions are met.
 *
 * Exports:
 *   ESTIMATION_UNDERRUN_THRESHOLD  — 0.30 (30% underestimation threshold)
 *   ESTIMATION_MIN_FEATURE_COUNT   — 3 (minimum qualifying features to trigger)
 *   runCalibration(options)        — detection + optional proposal write
 *
 * Detection logic:
 *   A feature qualifies when (outerLoopActualH - outerLoopEstimateH) / outerLoopEstimateH > 0.30
 *   (i.e. actual exceeded estimate by more than 30%).
 *   Trigger fires when qualifyingCount >= ESTIMATION_MIN_FEATURE_COUNT.
 *
 * Proposal content (AC2 required fields):
 *   - underestimationRatePercent   — average underestimation rate across qualifying features
 *   - contributingFeatureSlugs     — array of feature slugs
 *   - affectedGuidanceExtract      — extract of current E1/E2 estimation guidance
 *   - proposedGuideline            — suggested updated guideline text
 *   - rationale                    — rationale for the proposed change
 *
 * Constraints:
 *   - Proposal staged at workspace/proposals/estimation-calibration-[YYYY-MM-DD].md only.
 *   - No auto-apply to SKILL.md / estimation-norms.md / context.yml (AC4).
 *   - Named constants MUST be: ESTIMATION_UNDERRUN_THRESHOLD = 0.30, ESTIMATION_MIN_FEATURE_COUNT = 3.
 *   - Silent return (no error, no output) when conditions not met (AC3).
 *   - Zero external npm dependencies — plain Node.js (fs, path) only.
 *
 * Reference: artefacts/2026-04-14-skills-platform-phase3/stories/p3.11-estimation-calibration-eval.md
 */
'use strict';

var fs   = require('fs');
var path = require('path');

// ── Named constants (AC5 — must be at module level, exported) ─────────────────
var ESTIMATION_UNDERRUN_THRESHOLD  = 0.30;
var ESTIMATION_MIN_FEATURE_COUNT   = 3;

var ROOT              = path.join(__dirname, '..', '..');
var DEFAULT_NORMS_PATH     = path.join(ROOT, 'workspace', 'estimation-norms.md');
var DEFAULT_PROPOSALS_DIR  = path.join(ROOT, 'workspace', 'proposals');
var DEFAULT_SKILLS_DIR     = path.join(ROOT, '.github', 'skills');

// Known E1/E2 guidance extract (sourced from /estimate SKILL.md and copilot-instructions.md)
var E1_E2_GUIDANCE_EXTRACT =
  'E1 (at /discovery): rough outer-loop focus-time forecast, seeded from scope complexity ' +
  'and operator experience. E2 (at /definition): refined once story count and complexity ' +
  'scores are known. Both passes use the outer-loop focus time signal — not calendar days ' +
  'or inner-loop autonomous agent hours.';

// ── YAML block parser ─────────────────────────────────────────────────────────

/**
 * Parse the ```yaml estimation-norms block from an estimation-norms.md file.
 * Returns an array of record objects, each with parsed key: value pairs.
 * Handles scalar values (strings, numbers, booleans, null).
 *
 * @param {string} content - raw file content
 * @returns {Array<object>}
 */
function parseNormsYaml(content) {
  // Normalise Windows CRLF so all regex patterns use plain \n
  content = content.replace(/\r\n/g, '\n');

  // Extract the YAML code block
  var blockRe = /```(?:ya?ml)?\s+estimation-norms\n([\s\S]*?)```/;
  var blockMatch = content.match(blockRe);
  var yaml;

  if (blockMatch) {
    yaml = blockMatch[1];
  } else {
    // Fallback: try plain yaml block
    var plainRe = /```ya?ml\n([\s\S]*?)```/;
    var plainMatch = content.match(plainRe);
    if (!plainMatch) return [];
    yaml = plainMatch[1];
  }

  // Simple YAML list parser: split on leading "- " to identify records
  var records = [];
  var currentRecord = null;

  var lines = yaml.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    // Record start: line beginning with "- "
    if (/^- /.test(line)) {
      if (currentRecord) records.push(currentRecord);
      currentRecord = {};
      // Parse the first key-value on the same line as "- "
      var firstKv = line.slice(2);
      parseKv(firstKv, currentRecord);
      continue;
    }

    // Continuation: indented key-value pair
    if (currentRecord && /^\s+\w/.test(line)) {
      parseKv(line.trim(), currentRecord);
    }
  }
  if (currentRecord) records.push(currentRecord);

  return records;
}

/**
 * Parse a single "key: value" line into an object.
 * @param {string} line
 * @param {object} obj - destination object (mutated)
 */
function parseKv(line, obj) {
  var sepIdx = line.indexOf(':');
  if (sepIdx === -1) return;
  var key   = line.slice(0, sepIdx).trim();
  var value = line.slice(sepIdx + 1).trim();

  // Remove surrounding quotes
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  // Coerce types
  if (value === 'null' || value === '~' || value === '') {
    obj[key] = null;
  } else if (value === 'true') {
    obj[key] = true;
  } else if (value === 'false') {
    obj[key] = false;
  } else {
    var num = Number(value);
    obj[key] = isNaN(num) ? value : num;
  }
}

// ── Detection logic ───────────────────────────────────────────────────────────

/**
 * Compute per-feature underestimation rate and collect qualifying features.
 * A feature qualifies when rate > ESTIMATION_UNDERRUN_THRESHOLD AND both E and A are present.
 *
 * @param {Array<object>} records
 * @returns {{ qualifying: Array<object>, allRates: number[] }}
 */
function analyseRecords(records) {
  var qualifying = [];
  var allRates   = [];

  for (var i = 0; i < records.length; i++) {
    var r = records[i];
    var estimate = r.outerLoopEstimateH;
    var actual   = r.outerLoopActualH;

    if (estimate == null || actual == null) continue;
    if (typeof estimate !== 'number' || typeof actual !== 'number') continue;
    if (estimate <= 0) continue;

    var rate = (actual - estimate) / estimate;
    allRates.push(rate);

    if (rate > ESTIMATION_UNDERRUN_THRESHOLD) {
      qualifying.push({ record: r, rate: rate });
    }
  }

  return { qualifying: qualifying, allRates: allRates };
}

// ── Date helper ───────────────────────────────────────────────────────────────

function todayIso() {
  var d = new Date();
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

// ── Proposal builder ──────────────────────────────────────────────────────────

/**
 * Build the calibration proposal content object.
 * @param {Array<{record:object,rate:number}>} qualifying
 * @returns {object} proposal with date, filename, and markdown content
 */
function buildProposal(qualifying) {
  var slugs = qualifying.map(function (q) {
    return q.record.feature || q.record.date || 'unknown';
  });

  var avgRate = qualifying.reduce(function (sum, q) {
    return sum + q.rate;
  }, 0) / qualifying.length;

  var ratePct = Math.round(avgRate * 100);

  var rateLines = qualifying.map(function (q) {
    var slug = q.record.feature || q.record.date || 'unknown';
    var e = q.record.outerLoopEstimateH;
    var a = q.record.outerLoopActualH;
    var pct = Math.round(q.rate * 100);
    return '- ' + slug + ' (estimate: ' + e + 'h, actual: ' + a + 'h, +' + pct + '%)';
  });

  var today = todayIso();

  var content = [
    '---',
    'type: estimation-calibration',
    'status: pending_review',
    'created_at: "' + today + '"',
    '---',
    '',
    '# Estimation Calibration Proposal — ' + today,
    '',
    '## Underestimation rate',
    '',
    'Average underestimation across qualifying features: **' + ratePct + '%**',
    '(Threshold: ' + (ESTIMATION_UNDERRUN_THRESHOLD * 100) + '%; qualifying minimum: ' + ESTIMATION_MIN_FEATURE_COUNT + ' features)',
    '',
    '## Contributing feature slugs',
    '',
    rateLines.join('\n'),
    '',
    '## Current affected E1/E2 guidance extract',
    '',
    E1_E2_GUIDANCE_EXTRACT,
    '',
    '## Proposed updated guideline',
    '',
    'Apply a **+' + ratePct + '% uplift factor** to E1 and E2 estimates for features with ' +
    'complexity ≥ 2 or scope stability "Unstable". When the trailing average underestimation ' +
    'rate across the last ' + ESTIMATION_MIN_FEATURE_COUNT + '+ features exceeds ' +
    (ESTIMATION_UNDERRUN_THRESHOLD * 100) + '%, increase the base E1 estimate by the observed ' +
    'average underrun percentage before recording.',
    '',
    '## Rationale',
    '',
    'The improvement agent observed systematic underestimation across ' + qualifying.length +
    ' consecutive features with E3 actuals. The average actual outer-loop time exceeded ' +
    'the E2 estimate by ' + ratePct + '%. This pattern exceeds the detection threshold ' +
    '(' + (ESTIMATION_UNDERRUN_THRESHOLD * 100) + '%) and meets the minimum feature count (' +
    ESTIMATION_MIN_FEATURE_COUNT + '). ' +
    'A calibration adjustment is warranted to prevent future underestimation and improve ' +
    'operator capacity planning.',
  ].join('\n');

  return {
    date:     today,
    fileName: 'estimation-calibration-' + today + '.md',
    underestimationRatePercent:  ratePct,
    contributingFeatureSlugs:    slugs,
    affectedGuidanceExtract:     E1_E2_GUIDANCE_EXTRACT,
    proposedGuideline:           'Apply +' + ratePct + '% uplift factor to E1/E2 for complexity ≥2 features',
    rationale:                   'Systematic underestimation of ' + ratePct + '% observed across ' + qualifying.length + ' features.',
    content:  content,
  };
}

// ── Main detection function ───────────────────────────────────────────────────

/**
 * Run the calibration detection dimension.
 *
 * @param {object} [options]
 * @param {string}  [options.normsPath]    - path to estimation-norms.md (default workspace/estimation-norms.md)
 * @param {string}  [options.proposalsDir] - directory to write proposals (default workspace/proposals/)
 * @param {boolean} [options.dryRun]       - if true, return proposal without writing to disk
 * @returns {object|null} proposal object if generated; null if conditions not met
 */
function runCalibration(options) {
  var opts         = options || {};
  var normsPath    = opts.normsPath    || DEFAULT_NORMS_PATH;
  var proposalsDir = opts.proposalsDir || DEFAULT_PROPOSALS_DIR;
  var dryRun       = !!opts.dryRun;

  // Read norms file — silent return if absent (AC3)
  if (!fs.existsSync(normsPath)) {
    return null;
  }

  var content = '';
  try {
    content = fs.readFileSync(normsPath, 'utf8');
  } catch (_) {
    return null;
  }

  var records  = parseNormsYaml(content);
  var analysis = analyseRecords(records);

  if (analysis.qualifying.length < ESTIMATION_MIN_FEATURE_COUNT) {
    return null; // AC3 — below count threshold, silent
  }

  var proposal = buildProposal(analysis.qualifying);

  if (!dryRun) {
    // Write proposal file — only to proposals dir (AC4 — not SKILL.md / norms / context.yml)
    if (!fs.existsSync(proposalsDir)) {
      try { fs.mkdirSync(proposalsDir, { recursive: true }); } catch (_) {}
    }
    var outPath = path.join(proposalsDir, proposal.fileName);
    try {
      fs.writeFileSync(outPath, proposal.content, 'utf8');
    } catch (_) {}
    proposal.writtenTo = outPath;
  }

  return proposal;
}

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  ESTIMATION_UNDERRUN_THRESHOLD: ESTIMATION_UNDERRUN_THRESHOLD,
  ESTIMATION_MIN_FEATURE_COUNT:  ESTIMATION_MIN_FEATURE_COUNT,
  runCalibration:                runCalibration,
  // Exposed for testing
  _parseNormsYaml:               parseNormsYaml,
  _analyseRecords:               analyseRecords,
  _buildProposal:                buildProposal,
};
