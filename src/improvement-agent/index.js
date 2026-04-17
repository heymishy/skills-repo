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
 *
 * Import:
 *   const agent = require('./index.js');
 *   agent.runAllDimensions(options);
 *
 * Zero external npm dependencies — plain Node.js only.
 */
'use strict';

var path           = require('path');
var failureDetector = require('./failure-detector.js');
var calibration     = require('./calibration.js');

var ROOT = path.join(__dirname, '..', '..');

// Registered improvement agent dimensions (in run order)
var DIMENSIONS = [
  { name: 'failure-detector',  run: function (opts) { return failureDetector.runAgent(opts); } },
  { name: 'calibration',       run: function (opts) { return calibration.runCalibration(opts); } },
];

/**
 * Run all improvement agent detection dimensions.
 *
 * @param {object} [options]
 * @param {string}  [options.tracesDir]    - override workspace/traces
 * @param {string}  [options.proposalsDir] - override workspace/proposals
 * @param {string}  [options.normsPath]    - override workspace/estimation-norms.md
 * @param {boolean} [options.verbose]      - enable verbose logging
 * @returns {object} { dimensionResults: { [name]: any } }
 */
function runAllDimensions(options) {
  var opts    = options || {};
  var results = {};

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

  return { dimensionResults: results };
}

module.exports = {
  DIMENSIONS:        DIMENSIONS,
  runAllDimensions:  runAllDimensions,
};

// ── CLI entry ─────────────────────────────────────────────────────────────────
if (require.main === module) {
  var verbose = process.argv.indexOf('--verbose') !== -1;
  var result  = runAllDimensions({ verbose: verbose });
  if (verbose) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  }
}
