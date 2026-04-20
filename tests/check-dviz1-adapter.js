/**
 * check-dviz1-adapter.js
 * Governance check: verifies dashboards/pipeline-adapter.js and its wiring
 * into dashboards/index.html satisfy AC1–AC5 (dviz.1 test plan T1–T10).
 *
 * Run: node tests/check-dviz1-adapter.js
 * Story: dviz.1-pipeline-adapter  Feature: 2026-04-18-dashboard-v2
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SUITE = '[check-dviz1-adapter]';

let passed = 0;
let failed = 0;

function pass(id, msg) {
  console.log('  \u2714 ' + id + ' ' + msg);
  passed++;
}

function fail(id, msg) {
  console.error('  \u2716 ' + id + ' ' + msg);
  failed++;
}

const adapterPath = path.resolve('dashboards', 'pipeline-adapter.js');
const indexPath   = path.resolve('dashboards', 'index.html');

// ── T1 — adapter file exists ─────────────────────────────────────────────────
if (fs.existsSync(adapterPath)) {
  pass('T1', 'dashboards/pipeline-adapter.js exists');
} else {
  fail('T1', 'dashboards/pipeline-adapter.js not found');
}

// ── T2 — adapter syntax clean ────────────────────────────────────────────────
try {
  execSync('node --check "' + adapterPath + '"', { stdio: 'pipe' });
  pass('T2', 'adapter syntax is valid JavaScript');
} catch (err) {
  var errMsg = (err.stderr || err.stdout || err.message || '').toString().trim();
  fail('T2', 'syntax error in pipeline-adapter.js \u2014 ' + errMsg);
}

// ── T3 — index.html loads pipeline-adapter.js before babel script ────────────
var indexHtml = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
var adapterScriptPos = indexHtml.indexOf('<script src="pipeline-adapter.js">');
var babelScriptPos   = indexHtml.indexOf('<script type="text/babel"');

if (adapterScriptPos === -1) {
  fail('T3', 'index.html does not contain <script src="pipeline-adapter.js">');
} else if (babelScriptPos === -1) {
  fail('T3', 'index.html does not contain <script type="text/babel"');
} else if (adapterScriptPos < babelScriptPos) {
  pass('T3', 'index.html loads pipeline-adapter.js before babel script block');
} else {
  fail('T3', 'pipeline-adapter.js script tag appears AFTER the babel script block');
}

// ── T4 — old inline mock comment removed ─────────────────────────────────────
var OLD_MOCK_COMMENT = '// CYCLES + EPICS + STORIES \u2014 realistic mock';
if (indexHtml.indexOf(OLD_MOCK_COMMENT) === -1) {
  pass('T4', 'old inline mock comment not present in index.html');
} else {
  fail('T4', 'old hardcoded mock comment still present in index.html \u2014 must be removed');
}

// ── T5 — adapter source assigns window.CYCLES and window.EPICS ───────────────
var adapterSrc = fs.existsSync(adapterPath) ? fs.readFileSync(adapterPath, 'utf8') : '';

if (adapterSrc.indexOf('window.CYCLES') !== -1 && adapterSrc.indexOf('window.EPICS') !== -1) {
  pass('T5', 'adapter assigns window.CYCLES and window.EPICS');
} else {
  fail('T5', 'adapter does not assign window.CYCLES and/or window.EPICS');
}

// ── T6 — stage→phase mapping covers all 12 pipeline stages ───────────────────
var REQUIRED_STAGES = [
  'discovery', 'benefit-metric', 'definition', 'review', 'test-plan',
  'definition-of-ready', 'issue-dispatch', 'subagent-execution',
  'ci-assurance', 'definition-of-done', 'trace', 'improve'
];

var missingStages = REQUIRED_STAGES.filter(function (s) {
  return adapterSrc.indexOf("'" + s + "'") === -1 &&
         adapterSrc.indexOf('"' + s + '"') === -1;
});

if (missingStages.length === 0) {
  pass('T6', 'all 12 pipeline stages present in stage-to-phase mapping');
} else {
  fail('T6', 'missing stage entries: ' + missingStages.join(', '));
}

// ── T7 — dodStatus:complete → state "done" ───────────────────────────────────
if (adapterSrc.indexOf('dodStatus') !== -1 && adapterSrc.indexOf("'done'") !== -1) {
  pass('T7', 'adapter maps dodStatus:complete to state "done"');
} else {
  fail('T7', 'adapter does not map dodStatus to "done"');
}

// ── T8 — health:red → state "blocked" ────────────────────────────────────────
if (adapterSrc.indexOf("'red'") !== -1 && adapterSrc.indexOf("'blocked'") !== -1) {
  pass('T8', 'adapter maps health:red to state "blocked"');
} else {
  fail('T8', 'adapter does not map health:red to "blocked"');
}

// ── T9 — catch/fallback branch present for fetch failure ─────────────────────
var hasCatch = adapterSrc.indexOf('.catch(') !== -1 ||
               adapterSrc.indexOf('catch (') !== -1 ||
               adapterSrc.indexOf('catch(')  !== -1;
if (hasCatch) {
  pass('T9', 'adapter has .catch branch \u2014 no uncaught promise rejection on fetch failure');
} else {
  fail('T9', 'adapter has no catch branch \u2014 fetch failure would be an uncaught rejection');
}

// ── T10 — no credentials in adapter (MC-SEC-02) ──────────────────────────────
var credPattern = /api[_-]?key|token|secret|password|credential/i;
// Strip comments before checking so inline explanatory text is excluded
var srcNoComments = adapterSrc
  .replace(/\/\/[^\n]*/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '');

if (!credPattern.test(srcNoComments)) {
  pass('T10', 'no credential strings found in adapter (MC-SEC-02 \u2713)');
} else {
  fail('T10', 'potential credential string in adapter \u2014 review MC-SEC-02');
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('');
if (failed > 0) {
  console.error(SUITE + ' ' + passed + ' passed, ' + failed + ' failed');
  process.exit(1);
} else {
  console.log(SUITE + ' ' + passed + ' passed, 0 failed');
}
