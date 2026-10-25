#!/usr/bin/env node
/**
 * check-sync-mechanism-is-parameterized.js
 *
 * css-s4 NFR (Performance): the sync mechanism must be ONE implementation
 * parameterized by gate type, not 7 hand-written copies. Structural check:
 * scans journey-sync-client.js for repeated near-identical gate-specific
 * blocks (the anti-pattern this would look like if someone hand-wrote 7
 * copies instead of using GATE_TO_JOURNEY_STAGE).
 *
 * Run: node scripts/check-sync-mechanism-is-parameterized.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', 'sync', 'journey-sync-client.js');
const content = fs.readFileSync(FILE, 'utf8');

let failed = false;

// Check 1: GATE_TO_JOURNEY_STAGE's keys must be derived from gate-map.js's
// own require, not a second hardcoded array of the same 7 gate-name strings.
if (!/Object\.keys\(\s*GATE_MAP\s*\)/.test(content)) {
  console.error('[check-sync-mechanism-is-parameterized] FAIL: GATE_TO_JOURNEY_STAGE does not derive its keys from Object.keys(GATE_MAP) -- the 7 gate names may be duplicated as a second hardcoded list.');
  failed = true;
}

// Check 2: syncGateAdvanceToJourney must appear exactly once (one function,
// not 7 near-identical gate-specific functions).
const fnMatches = content.match(/function syncGateAdvanceToJourney/g) || [];
if (fnMatches.length !== 1) {
  console.error(`[check-sync-mechanism-is-parameterized] FAIL: expected exactly 1 syncGateAdvanceToJourney function, found ${fnMatches.length}.`);
  failed = true;
}

if (!failed) {
  console.log('[check-sync-mechanism-is-parameterized] OK: sync mechanism is one parameterized implementation, not 7 gate-specific copies.');
}

process.exit(failed ? 1 : 0);
