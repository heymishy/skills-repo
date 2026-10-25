#!/usr/bin/env node
/**
 * check-sync-mechanism-is-parameterized.js (test wrapper for the script of the same name under scripts/)
 *
 * Run: node tests/check-sync-mechanism-is-parameterized.js
 */
'use strict';
const { execSync } = require('child_process');
const path = require('path');

let totalPassed = 0;
let totalFailed = 0;

function assert(label, condition, message) {
  if (condition) { totalPassed++; } else { totalFailed++; console.log(`  ✗ [${label}] ${message}`); }
}

try {
  const output = execSync('node "' + path.join(__dirname, '..', 'scripts', 'check-sync-mechanism-is-parameterized.js') + '"', { encoding: 'utf8' });
  assert('script-passes', output.indexOf('OK:') !== -1, `expected the structural check to pass against the real journey-sync-client.js, got: ${output}`);
} catch (err) {
  assert('script-passes', false, `expected the structural check to exit 0, it failed: ${err.message}`);
}

console.log(`[check-sync-mechanism-is-parameterized] ${totalPassed} passed, ${totalFailed} failed`);
process.exit(totalFailed === 0 ? 0 : 1);
