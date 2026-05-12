'use strict';
/**
 * src/improvement-agent/experiment-signals.js
 *
 * Experiment signals dimension for the improvement agent.
 *
 * Scans completed experiment result files under workspace/experiments/*/results/
 * and identifies EVAL.md dimensions that score below 0.70 across 2+ runs.
 * A single run below threshold is noise; 2+ runs is a pattern worth surfacing.
 *
 * Self-modify guard: signals targeting the improvement-agent itself are blocked.
 *
 * Zero external npm dependencies — fs + path only.
 */

var fs   = require('fs');
var path = require('path');

var ROOT            = path.join(__dirname, '..', '..');
var EXPERIMENTS_DIR = path.join(ROOT, 'workspace', 'experiments');

/** Threshold below which a dimension score is considered weak. */
var SCORE_THRESHOLD = 0.70;

/** Minimum number of runs below threshold before a signal is emitted. */
var MIN_RUNS_BELOW_THRESHOLD = 2;

/**
 * Returns the list of dimension keys present in a result object's `scores` map.
 * Expected schema: { scores: { d1_problem_framing, ..., d7_constraint_completeness }, ... }
 *
 * @param {object} scores
 * @returns {string[]}
 */
function getDimensionKeys(scores) {
  if (!scores || typeof scores !== 'object') return [];
  return Object.keys(scores);
}

/**
 * Converts a snake_case dimension key (e.g. "d3_constraint_surfacing") to a
 * human-readable label (e.g. "constraint-surfacing") for signal patternLabel.
 *
 * @param {string} key
 * @returns {string}
 */
function dimensionLabel(key) {
  // Strip leading "dN_" prefix, replace underscores with hyphens
  return key.replace(/^d\d+_/, '').replace(/_/g, '-');
}

/**
 * Reads all completed result JSON files from workspace/experiments/<id>/results/.
 * Returns an array of { experimentId, caseId, model, runId, scores, weightedScore, model_label }
 * Silently skips unreadable or malformed files.
 *
 * @param {string} [experimentsDir]
 * @returns {Array<object>}
 */
function readResultFiles(experimentsDir) {
  var dir = experimentsDir || EXPERIMENTS_DIR;
  var allResults = [];

  if (!fs.existsSync(dir)) return allResults;

  var experimentDirs;
  try { experimentDirs = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return allResults; }

  for (var i = 0; i < experimentDirs.length; i++) {
    var entry = experimentDirs[i];
    if (!entry.isDirectory()) continue;
    var experimentId = entry.name;
    var resultsDir = path.join(dir, experimentId, 'results');
    if (!fs.existsSync(resultsDir)) continue;

    var resultFiles;
    try { resultFiles = fs.readdirSync(resultsDir); } catch (e) { continue; }

    for (var j = 0; j < resultFiles.length; j++) {
      var fname = resultFiles[j];
      if (!fname.endsWith('.json')) continue;
      var fpath = path.join(resultsDir, fname);
      try {
        var content = fs.readFileSync(fpath, 'utf8');
        var parsed  = JSON.parse(content);
        // Derive caseId and runId from filename if not embedded
        // Expected filename pattern: <caseId>-<model>-<trial>.json or similar
        var nameParts = fname.replace('.json', '').split('-');
        allResults.push({
          experimentId:  experimentId,
          caseId:        parsed.caseId  || nameParts[0] || 'unknown',
          model:         parsed.model   || parsed.model_label || 'unknown',
          runId:         fname.replace('.json', ''),
          scores:        parsed.scores  || {},
          weightedScore: parsed.weighted_score != null ? parsed.weighted_score : null,
          pass:          !!parsed.pass,
        });
      } catch (e) { /* skip malformed file */ }
    }
  }

  return allResults;
}

/**
 * Groups results by dimension key and skill target.
 * Accumulates evidence runs per (dimension, skillTarget) pair.
 *
 * @param {Array<object>} results
 * @returns {Map<string, { dimensionName: string, skillTarget: string, evidenceRuns: string[], scores: number[], caseIds: string[] }>}
 */
function groupByDimension(results) {
  // Key: "<skillTarget>:<dimensionName>"
  var groups = {};

  for (var i = 0; i < results.length; i++) {
    var r = results[i];
    var dimKeys = getDimensionKeys(r.scores);
    // Derive skill target from experimentId (e.g. "EXP-001-discovery-phase4-5" → "discovery")
    var skillTarget = deriveSkillTarget(r.experimentId);

    for (var k = 0; k < dimKeys.length; k++) {
      var dimKey   = dimKeys[k];
      var dimScore = r.scores[dimKey];
      if (typeof dimScore !== 'number') continue;
      if (dimScore >= SCORE_THRESHOLD) continue; // only accumulate below-threshold runs

      var groupKey = skillTarget + ':' + dimKey;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          dimensionName: dimensionLabel(dimKey),
          skillTarget:   skillTarget,
          evidenceRuns:  [],
          scores:        [],
          caseIds:       [],
        };
      }
      groups[groupKey].evidenceRuns.push(r.experimentId + '-' + r.runId);
      groups[groupKey].scores.push(dimScore);
      if (groups[groupKey].caseIds.indexOf(r.caseId) === -1) {
        groups[groupKey].caseIds.push(r.caseId);
      }
    }
  }

  return groups;
}

/**
 * Attempts to derive the skill target from an experiment ID.
 * Convention: "EXP-001-<skill-name>-<suffix>" → "<skill-name>"
 * Falls back to 'unknown' if the pattern does not match.
 *
 * @param {string} experimentId
 * @returns {string}
 */
function deriveSkillTarget(experimentId) {
  // Strip "EXP-NNN-" prefix then take the next segment
  var m = experimentId.match(/^EXP-\d+-([a-z][a-z0-9-]*?)(?:-|$)/i);
  return m ? m[1].toLowerCase() : 'unknown';
}

/**
 * Main dimension entry point — called by index.js runAllDimensions.
 * Returns { signals: [...], signalCount: n }
 *
 * Self-modify guard: signals where skillTarget === 'improvement-agent' are blocked silently.
 *
 * @param {object} [opts]
 * @param {string} [opts.experimentsDir] - override workspace/experiments path
 * @param {boolean} [opts.verbose]
 * @returns {{ signals: Array<object>, signalCount: number }}
 */
function runExperimentSignals(opts) {
  var options        = opts || {};
  var experimentsDir = options.experimentsDir || EXPERIMENTS_DIR;
  var verbose        = !!options.verbose;

  var results = readResultFiles(experimentsDir);
  if (results.length === 0) {
    if (verbose) process.stdout.write('[experiment-signals] No completed result files found.\n');
    return { signals: [], signalCount: 0 };
  }

  var groups  = groupByDimension(results);
  var signals = [];
  var now     = new Date().toISOString();

  var groupKeys = Object.keys(groups);
  for (var i = 0; i < groupKeys.length; i++) {
    var g = groups[groupKeys[i]];

    // Self-modify guard
    if (g.skillTarget === 'improvement-agent') continue;

    // Only emit signal if 2+ runs below threshold (1 run = noise)
    if (g.evidenceRuns.length < MIN_RUNS_BELOW_THRESHOLD) continue;

    var meanScore = g.scores.reduce(function (a, b) { return a + b; }, 0) / g.scores.length;

    signals.push({
      surfaceType:   'eval-experiment',
      storySlug:     null,
      patternLabel:  g.dimensionName + '-below-threshold',
      evidenceRuns:  g.evidenceRuns,
      skillTarget:   g.skillTarget,
      dimensionName: g.dimensionName,
      meanScore:     Math.round(meanScore * 1000) / 1000, // 3 decimal places
      threshold:     SCORE_THRESHOLD,
      caseIds:       g.caseIds,
      createdAt:     now,
    });
  }

  if (verbose) {
    process.stdout.write('[experiment-signals] Signals generated: ' + signals.length + '\n');
  }

  return { signals: signals, signalCount: signals.length };
}

module.exports = {
  runExperimentSignals: runExperimentSignals,
  // exported for testing
  readResultFiles:      readResultFiles,
  groupByDimension:     groupByDimension,
  deriveSkillTarget:    deriveSkillTarget,
};
