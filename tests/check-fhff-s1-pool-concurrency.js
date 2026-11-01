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

// -- Task 1: extraction is behaviour-preserving (same value as today's
// inline formula). This is NOT yet AC2's final "higher than before" claim
// -- that assertion replaces this one in Task 3, once the cap is actually
// re-tuned using Task 2's real evidence. ----------------------------------
{
  const T = 'extraction-is-behaviour-preserving';
  const oldFormulaValue = Math.max(1, Math.ceil(os.cpus().length / 3));
  const newCap = getPoolConcurrency();
  assertCheck(T, newCap === oldFormulaValue,
    `Expected getPoolConcurrency() to return the same value as the pre-extraction formula (${oldFormulaValue}) until Task 3 re-tunes it, got ${newCap}`);
}

if (totalFailed > 0) {
  console.error(`[fhff-s1-pool-concurrency] FAIL -- ${issues.length} issue(s) found:`);
  issues.forEach(i => console.error(i));
  process.exit(1);
} else {
  console.log(`[fhff-s1-pool-concurrency] ${totalPassed} check(s) OK ✓`);
}
