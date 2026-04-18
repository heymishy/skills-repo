/**
 * check-dashboard-viz.js
 * Governance check: syntax-validates all .js files in dashboards/.
 * Uses dynamic readdirSync enumeration — no hardcoded file names.
 * Run: node tests/check-dashboard-viz.js
 */
'use strict';
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DASHBOARD_DIR = path.resolve(__dirname, '..', 'dashboards');
const SUITE = '[check-dashboard-viz]';

const files = fs.readdirSync(DASHBOARD_DIR).filter(f => f.endsWith('.js'));

if (files.length === 0) {
  console.log(SUITE + ' SKIP: no .js files found in dashboards/');
  process.exit(0);
}

let passed = 0;
let failed = 0;
const failures = [];

for (const file of files) {
  const fullPath = path.join(DASHBOARD_DIR, file);
  try {
    execSync('node --check "' + fullPath + '"', { stdio: 'pipe' });
    passed++;
  } catch (err) {
    const msg = (err.stderr || err.stdout || err.message || '').toString().trim();
    console.error(SUITE + ' FAIL: dashboards/' + file + ' \u2014 ' + msg);
    failures.push(file);
    failed++;
  }
}

if (failed > 0) {
  console.error(SUITE + ' ' + passed + ' passed, ' + failed + ' failed');
  process.exit(1);
} else {
  console.log(SUITE + ' PASS: all ' + passed + ' file(s) are valid JavaScript');
}
