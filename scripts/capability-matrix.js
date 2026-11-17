'use strict';
// lpw-s2 (AC3, AC7) -- the browser-test capability matrix: every spec file under tests/e2e/ appears once with a
// capability and a lane. Pure functions (validateMatrix, listSpecFiles) used by the guard test and the scripts that
// select and list the required core. The data lives in tests/e2e/capability-matrix.json.

const fs = require('fs');
const path = require('path');

const LANES = ['core', 'extended', 'scenario', 'quarantined'];
const QUARANTINE_MAX_DAYS = 45;

// The six specs that target "a real deployed environment" (lpw-s1): exactly the Scenario A and B specs.
const SCENARIO_FILES = [
  'a1-staging-auth-stub', 'a2-stripe-test-mode-plan-selection', 'a3-product-feature-ideate-canvas',
  'a4-ideate-session-resume', 'dsh-s4-resume-conversation-survives-restart', 'b1-formed-idea-outer-loop-story-map'
].map(function (n) { return 'tests/e2e/' + n + '.spec.js'; });

/** Every spec file under tests/e2e (repo-relative, forward slashes, sorted); fixtures are not specs. */
function listSpecFiles(root) {
  const out = [];
  (function walk(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(function (d) {
      const full = path.join(dir, d.name);
      if (d.isDirectory()) { if (d.name !== 'fixtures') walk(full); return; }
      if (/\.spec\.(js|ts)$/.test(d.name)) out.push(path.relative(root, full).split(path.sep).join('/'));
    });
  })(path.join(root, 'tests', 'e2e'));
  return out.sort();
}

function daysBetween(a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 86400000); }
function isDate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s)); }

/**
 * @param {{specs: object[]}} matrix
 * @param {string[]} filesOnDisk repo-relative spec paths
 * @param {string} today ISO date (YYYY-MM-DD)
 * @param {{scenarioFiles?: string[]}} [options]
 * @returns {string[]} problems; empty when the matrix is valid
 */
function validateMatrix(matrix, filesOnDisk, today, options) {
  const scenarioFiles = (options && options.scenarioFiles) || SCENARIO_FILES;
  const problems = [];
  const entries = (matrix && Array.isArray(matrix.specs)) ? matrix.specs : null;
  if (!entries) return ['the matrix has no specs array'];
  const onDisk = new Set(filesOnDisk);
  const seen = new Set();
  entries.forEach(function (e) {
    const f = e && e.file;
    if (!f) { problems.push('an entry has no file'); return; }
    if (seen.has(f)) problems.push(f + ': duplicate entry');
    seen.add(f);
    if (!onDisk.has(f)) problems.push(f + ': file does not exist');
    if (!e.capability || typeof e.capability !== 'string' || !e.capability.trim()) problems.push(f + ': capability is missing');
    if (LANES.indexOf(e.lane) === -1) problems.push(f + ': lane "' + e.lane + '" is not one of ' + LANES.join(', '));
    if (e.lane === 'quarantined') {
      ['reason', 'owner'].forEach(function (k) { if (!e[k] || !String(e[k]).trim()) problems.push(f + ': quarantined entry has no ' + k); });
      ['entered', 'reviewBy'].forEach(function (k) { if (!isDate(e[k])) problems.push(f + ': quarantined entry has no valid ' + k + ' date'); });
      if (isDate(e.reviewBy) && e.reviewBy < today) problems.push(f + ': quarantine review date ' + e.reviewBy + ' is in the past (overdue)');
      if (isDate(e.entered) && isDate(e.reviewBy) && daysBetween(e.entered, e.reviewBy) > QUARANTINE_MAX_DAYS) {
        problems.push(f + ': quarantine review date is more than ' + QUARANTINE_MAX_DAYS + ' days after the entry date');
      }
    }
    const isScenario = scenarioFiles.indexOf(f) !== -1;
    if (isScenario && e.lane !== 'scenario') problems.push(f + ': a staging-targeted spec must have lane scenario');
    if (!isScenario && e.lane === 'scenario') problems.push(f + ': lane scenario is only for the staging-targeted specs');
  });
  filesOnDisk.forEach(function (f) { if (!seen.has(f)) problems.push(f + ': spec file is missing from the matrix'); });
  return problems;
}

module.exports = { LANES, QUARANTINE_MAX_DAYS, SCENARIO_FILES, listSpecFiles, validateMatrix };
