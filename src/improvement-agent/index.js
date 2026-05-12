#!/usr/bin/env node
/**
 * src/improvement-agent/index.js
 *
 * Improvement agent entry point — wires all detection dimensions.
 *
 * Dimensions registered:
 *   1. failure-detector  — failure signal + staleness detection (p2.11/p2.12)
 *   2. calibration       — estimation calibration detection (p3.11)
 *
 * Usage (CLI):
 *   node src/improvement-agent/index.js
 *   node src/improvement-agent/index.js --verbose
 *
 * Import:
 *   const agent = require('./index.js');
 *   agent.runAllDimensions(options);
 *
 * Zero external npm dependencies — plain Node.js only.
 */
'use strict';

var fs                 = require('fs');
var path               = require('path');
var failureDetector    = require('./failure-detector.js');
var calibration        = require('./calibration.js');
var complianceReport   = require('./compliance-report.js');
var experimentSignals  = require('./experiment-signals.js');

var ROOT = path.join(__dirname, '..', '..');

// Default paths for state and dream result
var DEFAULT_STATE_JSON_PATH    = path.join(ROOT, 'workspace', 'state.json');
var DEFAULT_CONTEXT_YML_PATH   = path.join(ROOT, '.github', 'context.yml');
var DEFAULT_DREAM_RESULT_PATH  = path.join(ROOT, 'workspace', 'dream-run-result.json');

/**
 * Read min_dream_interval_hours from the improvement_agent: block in context.yml.
 * Returns 23 if the field is absent or the file is unreadable.
 *
 * @param {string} [contextYmlPath]
 * @returns {number}
 */
function readMinDreamInterval(contextYmlPath) {
  var ymlPath = contextYmlPath || DEFAULT_CONTEXT_YML_PATH;
  try {
    var content  = fs.readFileSync(ymlPath, 'utf8');
    var lines    = content.split('\n');
    var inSection   = false;
    var sectionIndent = -1;
    for (var i = 0; i < lines.length; i++) {
      var raw     = lines[i].replace(/\s*#.*$/, '').trimRight();
      if (!raw.trim()) continue;
      var indent  = raw.match(/^(\s*)/)[1].length;
      var trimmed = raw.trim();
      if (!inSection) {
        if (trimmed === 'improvement_agent:') { inSection = true; sectionIndent = indent; }
        continue;
      }
      if (indent <= sectionIndent && /^\w[\w_]*:/.test(trimmed)) break;
      var m = trimmed.match(/^min_dream_interval_hours\s*:\s*(\d+)/);
      if (m) return parseInt(m[1], 10);
    }
  } catch (e) { /* use default */ }
  return 23;
}

/**
 * Read lastDreamRun ISO timestamp from workspace/state.json.
 * Returns null if not present or unreadable.
 *
 * @param {string} [stateJsonPath]
 * @returns {string|null}
 */
function readLastDreamRun(stateJsonPath) {
  var p = stateJsonPath || DEFAULT_STATE_JSON_PATH;
  try {
    var state = JSON.parse(fs.readFileSync(p, 'utf8'));
    return state.lastDreamRun || null;
  } catch (e) {
    return null;
  }
}

/**
 * Merge lastDreamRun into workspace/state.json (preserves all other fields).
 *
 * @param {string} [stateJsonPath]
 * @param {string}  isoTimestamp
 */
function writeLastDreamRun(stateJsonPath, isoTimestamp) {
  var p     = stateJsonPath || DEFAULT_STATE_JSON_PATH;
  var state = {};
  try { state = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { /* start fresh */ }
  state.lastDreamRun = isoTimestamp;
  fs.writeFileSync(p, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

/**
 * Write workspace/dream-run-result.json.
 *
 * @param {string} [dreamResultPath]
 * @param {object}  result
 */
function writeDreamRunResult(dreamResultPath, result) {
  var p = dreamResultPath || DEFAULT_DREAM_RESULT_PATH;
  fs.writeFileSync(p, JSON.stringify(result, null, 2) + '\n', 'utf8');
}

// Registered improvement agent dimensions (in run order)
var DIMENSIONS = [
  { name: 'failure-detector',   run: function (opts) { return failureDetector.runAgent(opts); } },
  { name: 'calibration',        run: function (opts) { return calibration.runCalibration(opts); } },
  { name: 'compliance-report',  run: function (opts) { return complianceReport.generateComplianceReport(opts); } },
  { name: 'experiment-signals', run: function (opts) { return experimentSignals.runExperimentSignals(opts); } },
];

/**
 * Run all improvement agent detection dimensions.
 *
 * Includes an interval guard: if lastDreamRun in workspace/state.json is less than
 * min_dream_interval_hours ago (from context.yml, default 23), the run is skipped.
 * On completion, writes lastDreamRun to state.json and dream-run-result.json.
 *
 * @param {object} [options]
 * @param {string}  [options.tracesDir]       - override workspace/traces
 * @param {string}  [options.proposalsDir]    - override workspace/proposals
 * @param {string}  [options.normsPath]       - override workspace/estimation-norms.md
 * @param {string}  [options.stateJsonPath]   - override workspace/state.json
 * @param {string}  [options.contextYmlPath]  - override .github/context.yml
 * @param {string}  [options.dreamResultPath] - override workspace/dream-run-result.json
 * @param {boolean} [options.verbose]         - enable verbose logging
 * @returns {object} { dimensionResults: { [name]: any }, skipped?: boolean }
 */
function runAllDimensions(options) {
  var opts             = options || {};
  var stateJsonPath    = opts.stateJsonPath   || DEFAULT_STATE_JSON_PATH;
  var contextYmlPath   = opts.contextYmlPath  || DEFAULT_CONTEXT_YML_PATH;
  var dreamResultPath  = opts.dreamResultPath || DEFAULT_DREAM_RESULT_PATH;
  var results          = {};

  // ── Interval guard ───────────────────────────────────────────────────────────
  // Guard only skips when lastDreamRun is present AND elapsed time is less than
  // min_dream_interval_hours. Absence of lastDreamRun (first ever run) always proceeds.
  var minIntervalHours = readMinDreamInterval(contextYmlPath);
  var lastDreamRun     = readLastDreamRun(stateJsonPath);
  if (lastDreamRun !== null && lastDreamRun !== undefined) {
    var elapsedHours = (Date.now() - new Date(lastDreamRun).getTime()) / (1000 * 60 * 60);
    if (elapsedHours < minIntervalHours) {
      var skipResult = {
        runAt:                  new Date().toISOString(),
        proposalsGenerated:     0,
        proposalPaths:          [],
        humanAttentionRequired: false,
        attentionReason:        null,
        skipped:                true,
        skippedReason:          'Interval guard: last run was ' + Math.round(elapsedHours) +
                                'h ago (minimum: ' + minIntervalHours + 'h)',
      };
      try { writeDreamRunResult(dreamResultPath, skipResult); } catch (e) { /* non-fatal */ }
      if (opts.verbose) {
        process.stdout.write('[improvement-agent] Skipping: last run was ' +
          Math.round(elapsedHours) + 'h ago (minimum: ' + minIntervalHours + 'h)\n');
      }
      return { dimensionResults: {}, skipped: true };
    }
  }

  // ── Run dimensions ───────────────────────────────────────────────────────────
  for (var i = 0; i < DIMENSIONS.length; i++) {
    var dim = DIMENSIONS[i];
    try {
      results[dim.name] = dim.run(opts);
    } catch (e) {
      if (opts.verbose) {
        process.stderr.write('[improvement-agent] dimension ' + dim.name + ' error: ' + e.message + '\n');
      }
      results[dim.name] = null;
    }
  }

  // ── Write lastDreamRun ───────────────────────────────────────────────────────
  var runAt = new Date().toISOString();
  try {
    writeLastDreamRun(stateJsonPath, runAt);
  } catch (e) {
    if (opts.verbose) {
      process.stderr.write('[improvement-agent] Warning: could not write lastDreamRun: ' + e.message + '\n');
    }
  }

  // ── Aggregate proposals + write dream-run-result.json ───────────────────────
  var allProposalPaths = [];
  var fdResult = results['failure-detector'];
  if (fdResult && Array.isArray(fdResult.proposals)) {
    allProposalPaths = allProposalPaths.concat(fdResult.proposals);
  }
  var expSigResult             = results['experiment-signals'];
  var experimentSignalsDetected = (expSigResult && typeof expSigResult.signalCount === 'number')
    ? expSigResult.signalCount
    : 0;
  var experimentSignalDetails  = (expSigResult && Array.isArray(expSigResult.signals))
    ? expSigResult.signals
    : [];
  var humanAttentionRequired = allProposalPaths.length > 0;
  var dreamRunResult = {
    runAt:                      runAt,
    proposalsGenerated:         allProposalPaths.length,
    proposalPaths:              allProposalPaths,
    humanAttentionRequired:     humanAttentionRequired,
    attentionReason:            humanAttentionRequired
                                  ? allProposalPaths.length + ' proposal(s) generated — human review required'
                                  : null,
    experimentSignalsDetected:  experimentSignalsDetected,
    experimentSignalDetails:    experimentSignalDetails,
    skipped:                    false,
  };
  try {
    writeDreamRunResult(dreamResultPath, dreamRunResult);
  } catch (e) {
    if (opts.verbose) {
      process.stderr.write('[improvement-agent] Warning: could not write dream-run-result.json: ' + e.message + '\n');
    }
  }

  return { dimensionResults: results };
}

module.exports = {
  DIMENSIONS:            DIMENSIONS,
  runAllDimensions:      runAllDimensions,
  readMinDreamInterval:  readMinDreamInterval,
  readLastDreamRun:      readLastDreamRun,
  writeLastDreamRun:     writeLastDreamRun,
  writeDreamRunResult:   writeDreamRunResult,
};

// ── CLI entry ─────────────────────────────────────────────────────────────────
if (require.main === module) {
  var verbose = process.argv.indexOf('--verbose') !== -1;
  var result  = runAllDimensions({ verbose: verbose });
  if (verbose) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  }
}
