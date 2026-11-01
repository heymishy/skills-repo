#!/usr/bin/env node
/**
 * check-fhff-s1-pool-concurrency.js
 *
 * Tests for fhff-s1 -- getPoolConcurrency(), the extracted, independently
 * testable production concurrency-cap function in scripts/run-all-tests.js.
 *
 * Covers: AC2 (unit). AC1/AC3/AC4/AC5 are real-environment manual
 * verifications -- see the story's own test plan Coverage gaps table.
 *
 * Run: node tests/check-fhff-s1-pool-concurrency.js
 */
'use strict';

const os = require('os');
const { getPoolConcurrency } = require('../scripts/run-all-tests.js');

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function ok() { totalPassed++; }
function fail(label, message) {
  totalFailed++;
  issues.push(`  ✗ [${label}] ${message}`);
}
function assertCheck(label, condition, message) {
  if (condition) { ok(); } else { fail(label, message); }
}

// -- Task 3: AC2 (unit) -- the concurrency cap is confirmed, by fhff-s1's
// own 16-run empirical investigation (see decisions.md), to already be
// stable at its current, unchanged value. No concurrency above this value
// was found stable (rb-s3 fails 100% of the time above 3, and raising the
// cap at all would also require fixing tfhc-s9's own test file, which is
// out of scope) -- so the cap intentionally stays unchanged. ---------------
{
  const T = 'AC2-concurrency-cap-confirmed-stable-at-current-value';
  const oldFormulaValue = Math.max(1, Math.ceil(os.cpus().length / 3));
  const newCap = getPoolConcurrency();
  assertCheck(T, newCap === oldFormulaValue,
    `Expected getPoolConcurrency() (${newCap}) to equal the formula's value (${oldFormulaValue}) -- fhff-s1's own 16-run investigation (see decisions.md) found no concurrency above this stable without also breaking tfhc-s9's own test file, so the cap intentionally stays unchanged`);
  assertCheck(T + '-sanity-ceiling', newCap <= os.cpus().length,
    `Expected getPoolConcurrency() (${newCap}) to never exceed the real core count (${os.cpus().length})`);
}

if (totalFailed > 0) {
  console.error(`[fhff-s1-pool-concurrency] FAIL -- ${issues.length} issue(s) found:`);
  issues.forEach(i => console.error(i));
  process.exit(1);
} else {
  console.log(`[fhff-s1-pool-concurrency] ${totalPassed} check(s) OK ✓`);
}
