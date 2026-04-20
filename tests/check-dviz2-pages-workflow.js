/**
 * check-dviz2-pages-workflow.js
 * Governance check: verifies .github/workflows/pages.yml satisfies AC1–AC5
 * (dviz.2 test plan T1–T8).
 *
 * Run: node tests/check-dviz2-pages-workflow.js
 * Story: dviz.2-pages-workflow  Feature: 2026-04-18-dashboard-v2
 *
 * Note: js-yaml is not a listed dependency; structural YAML checks use
 * text-based assertions consistent with the no-external-deps ADR-001 rule.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const SUITE = '[check-dviz2-pages-workflow]';

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

const workflowPath = path.resolve('.github', 'workflows', 'pages.yml');

// ── T1 — pages.yml exists ────────────────────────────────────────────────────
if (fs.existsSync(workflowPath)) {
  pass('T1', '.github/workflows/pages.yml exists');
} else {
  fail('T1', '.github/workflows/pages.yml not found');
}

var content = fs.existsSync(workflowPath)
  ? fs.readFileSync(workflowPath, 'utf8')
  : '';

// ── T2 — pages.yml has no tab-indentation (YAML forbids tabs) ────────────────
if (content.length === 0) {
  fail('T2', 'pages.yml is empty');
} else if (/^\t/m.test(content)) {
  fail('T2', 'pages.yml contains tab-indented lines (YAML requires space indentation)');
} else {
  pass('T2', 'pages.yml has no tab-indentation issues');
}

// ── T3 — trigger includes dashboards/** push ─────────────────────────────────
if (content.indexOf('dashboards/**') !== -1) {
  pass('T3', 'workflow trigger includes dashboards/** path');
} else {
  fail('T3', 'on.push.paths does not include dashboards/**');
}

// ── T4 — trigger includes pipeline-state.json push ───────────────────────────
if (content.indexOf('.github/pipeline-state.json') !== -1) {
  pass('T4', 'workflow trigger includes .github/pipeline-state.json path');
} else {
  fail('T4', 'on.push.paths does not include .github/pipeline-state.json');
}

// ── T5 — correct permissions block present ───────────────────────────────────
if (/pages:\s+write/.test(content) && /id-token:\s+write/.test(content)) {
  pass('T5', 'permissions block contains pages:write and id-token:write');
} else {
  fail('T5', 'pages.yml missing required permissions (pages:write and/or id-token:write)');
}

// ── T6 — upload-pages-artifact uses path: dashboards ─────────────────────────
var hasUploadStep = content.indexOf('upload-pages-artifact') !== -1;
var hasDashboardsPath = content.indexOf('path: dashboards') !== -1 ||
                        content.indexOf("path: './dashboards'") !== -1 ||
                        content.indexOf('path: ./dashboards') !== -1;

if (hasUploadStep && hasDashboardsPath) {
  pass('T6', 'upload-pages-artifact step uses dashboards/ as artifact path');
} else if (!hasUploadStep) {
  fail('T6', 'no upload-pages-artifact step found in pages.yml');
} else {
  fail('T6', 'upload-pages-artifact step found but path is not set to dashboards/');
}

// ── T7 — no PAT or hardcoded secrets (MC-SEC-02) ─────────────────────────────
// GITHUB_TOKEN is auto-injected and safe — exclude it from check
var contentForSecurityCheck = content.replace(/GITHUB_TOKEN/g, '');
var secretsPattern = /ghp_|github_pat|secrets\.(PAT|TOKEN|KEY)/i;

if (!secretsPattern.test(contentForSecurityCheck)) {
  pass('T7', 'no hardcoded PAT or secret references found (MC-SEC-02 \u2713)');
} else {
  fail('T7', 'potential hardcoded PAT or secret found in pages.yml \u2014 review MC-SEC-02');
}

// ── T8 — deploy-pages step present ───────────────────────────────────────────
if (content.indexOf('deploy-pages') !== -1) {
  pass('T8', 'deploy-pages step is present in workflow');
} else {
  fail('T8', 'no deploy-pages step found in pages.yml');
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('');
if (failed > 0) {
  console.error(SUITE + ' ' + passed + ' passed, ' + failed + ' failed');
  process.exit(1);
} else {
  console.log(SUITE + ' ' + passed + ' passed, 0 failed');
}
