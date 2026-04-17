#!/usr/bin/env node
/**
 * calibration.test.js
 *
 * Unit + integration tests for the estimation calibration dimension (p3.11).
 *
 * Tests from the test plan:
 *
 *   Unit tests (AC1 — trigger: ≥3 features >30%):
 *   - calibration-detects-three-features-above-threshold
 *   - proposal-file-contains-required-fields
 *
 *   Unit tests (AC3 — silent when conditions not met):
 *   - calibration-silent-for-fewer-than-three-features
 *   - calibration-silent-for-rate-below-threshold
 *
 *   Unit tests (AC4 — no auto-apply):
 *   - calibration-does-not-write-to-skill-files
 *
 *   Unit tests (AC5 — named constants):
 *   - constant-estimation-underrun-threshold-is-0-30
 *   - constant-estimation-min-feature-count-is-3
 *
 *   Integration tests (wiring):
 *   - calibration-module-wired-into-improvement-agent
 *
 * Run:  node src/improvement-agent/calibration.test.js
 * Used: npm test (via check-improvement-agent.js which imports this)
 *
 * Zero external dependencies — plain Node.js (fs, path, os) only.
 */
'use strict';

var fs   = require('fs');
var path = require('path');
var os   = require('os');

var ROOT       = path.join(__dirname, '..', '..');
var FIXTURES   = path.join(__dirname, 'fixtures');

var calibration = require('./calibration.js');
var {
  ESTIMATION_UNDERRUN_THRESHOLD,
  ESTIMATION_MIN_FEATURE_COUNT,
  runCalibration,
} = calibration;

var passed   = 0;
var failed   = 0;
var failures = [];

function pass(name) {
  process.stdout.write('  ✓ ' + name + '\n');
  passed++;
}
function fail(name, reason) {
  process.stderr.write('  ✗ ' + name + '\n');
  process.stderr.write('      ' + reason + '\n');
  failed++;
  failures.push(name + ': ' + reason);
}

// ── Test: AC5 — named constants ───────────────────────────────────────────────
(function test_threshold_constant() {
  var name = 'constant-estimation-underrun-threshold-is-0-30';
  if (ESTIMATION_UNDERRUN_THRESHOLD === 0.30) {
    pass(name);
  } else {
    fail(name, 'Expected 0.30, got ' + ESTIMATION_UNDERRUN_THRESHOLD);
  }
})();

(function test_count_constant() {
  var name = 'constant-estimation-min-feature-count-is-3';
  if (ESTIMATION_MIN_FEATURE_COUNT === 3) {
    pass(name);
  } else {
    fail(name, 'Expected 3, got ' + ESTIMATION_MIN_FEATURE_COUNT);
  }
})();

// ── Test: AC1 — detects three qualifying features ─────────────────────────────
(function test_detects_trigger() {
  var name = 'calibration-detects-three-features-above-threshold';
  var normsPath = path.join(FIXTURES, 'estimation-norms-trigger.md');
  if (!fs.existsSync(normsPath)) {
    fail(name, 'Trigger fixture not found at ' + normsPath);
    return;
  }
  var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'calib-test-'));
  try {
    var result = runCalibration({ normsPath: normsPath, proposalsDir: tmpDir });
    if (result && result.fileName && result.fileName.startsWith('estimation-calibration-')) {
      pass(name);
    } else {
      fail(name, 'Expected proposal object with fileName; got: ' + JSON.stringify(result));
    }
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
})();

// ── Test: AC2 — proposal contains required fields ─────────────────────────────
(function test_proposal_required_fields() {
  var name = 'proposal-file-contains-required-fields';
  var normsPath = path.join(FIXTURES, 'estimation-norms-trigger.md');
  if (!fs.existsSync(normsPath)) {
    fail(name, 'Trigger fixture not found at ' + normsPath);
    return;
  }
  var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'calib-test-'));
  try {
    var result = runCalibration({ normsPath: normsPath, proposalsDir: tmpDir });
    if (!result) {
      fail(name, 'runCalibration returned null — no proposal generated');
      return;
    }
    var content = result.content || '';
    var missingFields = [];
    // AC2: underestimation rate %, contributing slugs, guidance extract, proposed update, rationale
    if (!/\d+%/.test(content) && typeof result.underestimationRatePercent !== 'number') {
      missingFields.push('underestimationRatePercent');
    }
    if (!result.contributingFeatureSlugs || !result.contributingFeatureSlugs.length) {
      missingFields.push('contributingFeatureSlugs');
    }
    if (!result.affectedGuidanceExtract) {
      missingFields.push('affectedGuidanceExtract');
    }
    if (!result.proposedGuideline) {
      missingFields.push('proposedGuideline');
    }
    if (!result.rationale) {
      missingFields.push('rationale');
    }
    if (missingFields.length === 0) {
      pass(name);
    } else {
      fail(name, 'Proposal missing required fields: ' + missingFields.join(', '));
    }
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
})();

// ── Test: AC3 — silent for fewer than 3 qualifying features ───────────────────
(function test_silent_below_count() {
  var name = 'calibration-silent-for-fewer-than-three-features';
  var normsPath = path.join(FIXTURES, 'estimation-norms-below-count.md');
  if (!fs.existsSync(normsPath)) {
    fail(name, 'Below-count fixture not found at ' + normsPath);
    return;
  }
  var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'calib-test-'));
  try {
    var result = runCalibration({ normsPath: normsPath, proposalsDir: tmpDir });
    if (result == null) {
      pass(name);
    } else {
      fail(name, 'Expected null (no proposal) but got: ' + JSON.stringify(result));
    }
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
})();

// ── Test: AC3 — silent for rate at or below threshold ────────────────────────
(function test_silent_below_rate() {
  var name = 'calibration-silent-for-rate-below-threshold';
  var normsPath = path.join(FIXTURES, 'estimation-norms-below-rate.md');
  if (!fs.existsSync(normsPath)) {
    fail(name, 'Below-rate fixture not found at ' + normsPath);
    return;
  }
  var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'calib-test-'));
  try {
    var result = runCalibration({ normsPath: normsPath, proposalsDir: tmpDir });
    if (result == null) {
      pass(name);
    } else {
      fail(name, 'Expected null (below rate threshold) but got: ' + JSON.stringify(result));
    }
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
})();

// ── Test: AC4 — does not write to SKILL.md or norms files ────────────────────
(function test_no_auto_apply() {
  var name = 'calibration-does-not-write-to-skill-files';
  var normsPath = path.join(FIXTURES, 'estimation-norms-trigger.md');
  if (!fs.existsSync(normsPath)) {
    fail(name, 'Trigger fixture not found at ' + normsPath);
    return;
  }

  var skillsDir = path.join(ROOT, '.github', 'skills');
  var normsFilePath = path.join(ROOT, 'workspace', 'estimation-norms.md');
  var contextYml   = path.join(ROOT, '.github', 'context.yml');

  // Capture mtime of key files before run
  function mtime(p) {
    try { return fs.statSync(p).mtimeMs; } catch (_) { return null; }
  }
  var beforeSkills  = mtime(skillsDir);
  var beforeNorms   = mtime(normsFilePath);
  var beforeContext = mtime(contextYml);

  var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'calib-test-'));
  try {
    runCalibration({ normsPath: normsPath, proposalsDir: tmpDir });

    var afterSkills  = mtime(skillsDir);
    var afterNorms   = mtime(normsFilePath);
    var afterContext = mtime(contextYml);

    // Skills dir mtime should not have changed (no files written inside)
    if (afterSkills !== beforeSkills) {
      fail(name, '.github/skills/ directory was modified during calibration run');
      return;
    }
    if (afterNorms !== beforeNorms && normsFilePath !== normsPath) {
      fail(name, 'workspace/estimation-norms.md was modified during calibration run');
      return;
    }
    if (afterContext !== beforeContext) {
      fail(name, '.github/context.yml was modified during calibration run');
      return;
    }
    pass(name);
  } catch (e) {
    fail(name, 'Unexpected error: ' + e.message);
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
})();

// ── Test: integration — calibration wired into improvement agent ──────────────
(function test_wired_into_agent() {
  var name = 'calibration-module-wired-into-improvement-agent';
  // Check that calibration.js can be required from the improvement agent context
  // and that either failure-detector.js OR an index.js references calibration
  var fdPath   = path.join(__dirname, 'failure-detector.js');
  var idxPath  = path.join(__dirname, 'index.js');
  var calibPath = path.join(__dirname, 'calibration.js');

  if (!fs.existsSync(calibPath)) {
    fail(name, 'calibration.js not found at ' + calibPath);
    return;
  }

  // Check if failure-detector.js or index.js references calibration
  var fdContent  = fs.existsSync(fdPath) ? fs.readFileSync(fdPath, 'utf8') : '';
  var idxContent = fs.existsSync(idxPath) ? fs.readFileSync(idxPath, 'utf8') : '';

  var wiredInFd  = /calibration/i.test(fdContent);
  var wiredInIdx = /calibration/i.test(idxContent);

  if (wiredInFd || wiredInIdx) {
    pass(name);
  } else {
    fail(name, 'calibration.js is not referenced in failure-detector.js or index.js — not wired into improvement agent');
  }
})();

// ── Summary ───────────────────────────────────────────────────────────────────
process.stdout.write('\n');
process.stdout.write('calibration.test: ' + passed + ' passed, ' + failed + ' failed\n');
if (failed > 0) {
  process.stderr.write('FAILED:\n');
  failures.forEach(function (f) { process.stderr.write('  - ' + f + '\n'); });
  process.exit(1);
}
