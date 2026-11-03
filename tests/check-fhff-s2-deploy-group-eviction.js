#!/usr/bin/env node
/**
 * check-fhff-s2-deploy-group-eviction.js
 *
 * Tests for fhff-s2 -- isDeployGroupEviction(), the decision function that
 * distinguishes a genuine `deploy-group` concurrency-eviction cancellation
 * (recoverable: safe to auto-rerun) from a real job failure (not safe to
 * auto-rerun, since that would mask a genuine failure as transient).
 *
 * Covers:
 *   AC2 (static YAML scoping check) -- both e2e.yml and staging-deploy.yml
 *     jobs that share the deploy-group lock keep a bare-string `concurrency:
 *     deploy-group` value, not a per-ref/per-branch templated expression.
 *   AC3's decision-logic half -- isDeployGroupEviction() returns true only
 *     for the real GitHub Actions cancellation annotation text, and false
 *     for a genuine failure message, so the auto-rerun mechanism this
 *     function feeds never reruns a run that failed for a real reason.
 *
 * Run: node tests/check-fhff-s2-deploy-group-eviction.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { isDeployGroupEviction } = require('../scripts/lib/is-deploy-group-eviction.js');

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

// -- AC2: static YAML scoping check -----------------------------------------
// Both workflows' deploy-group concurrency jobs must keep a bare-string
// `concurrency: deploy-group` value -- not a templated expression
// incorporating github.ref / github.head_ref / any per-branch variable.
// Narrowing the key was already explicitly rejected as a regression (it
// would let two different PRs deploy/E2E-test against the same real
// wuce-staging app concurrently).
{
  const T = 'AC2-concurrency-key-stays-bare-deploy-group';

  const e2ePath = path.join(__dirname, '..', '.github', 'workflows', 'e2e.yml');
  const stagingDeployPath = path.join(__dirname, '..', '.github', 'workflows', 'staging-deploy.yml');

  const e2eText = fs.readFileSync(e2ePath, 'utf8');
  const stagingDeployText = fs.readFileSync(stagingDeployPath, 'utf8');

  // Find every `concurrency:` line that participates in the deploy-group
  // lock (there are two in e2e.yml -- Scenario A and Scenario B -- and one
  // in staging-deploy.yml).
  const concurrencyLineRe = /^\s*concurrency:\s*(.+?)\s*(#.*)?$/gm;

  function collectConcurrencyValues(text) {
    const values = [];
    let m;
    while ((m = concurrencyLineRe.exec(text)) !== null) {
      values.push(m[1].trim());
    }
    return values;
  }

  const e2eValues = collectConcurrencyValues(e2eText);
  const stagingDeployValues = collectConcurrencyValues(stagingDeployText);

  assertCheck(T + '-e2e-has-deploy-group-jobs', e2eValues.length >= 2,
    `Expected e2e.yml to have at least 2 concurrency: lines for deploy-group jobs (Scenario A + Scenario B), found ${e2eValues.length}`);
  assertCheck(T + '-staging-deploy-has-deploy-group-job', stagingDeployValues.length >= 1,
    `Expected staging-deploy.yml to have at least 1 concurrency: line, found ${stagingDeployValues.length}`);

  e2eValues.forEach((v, i) => {
    assertCheck(T + `-e2e-value-${i}-is-bare-string`, v === 'deploy-group',
      `Expected e2e.yml concurrency value #${i} to be the bare string "deploy-group", got "${v}" -- a templated expression (github.ref/github.head_ref/etc) would narrow the lock per-branch, already rejected as a regression`);
  });

  stagingDeployValues.forEach((v, i) => {
    const bareValue = v.split('#')[0].trim();
    assertCheck(T + `-staging-deploy-value-${i}-is-bare-string`, bareValue === 'deploy-group',
      `Expected staging-deploy.yml concurrency value #${i} to be the bare string "deploy-group", got "${bareValue}" -- a templated expression (github.ref/github.head_ref/etc) would narrow the lock per-branch, already rejected as a regression`);
  });
}

// -- AC3 (decision-logic half): isDeployGroupEviction() ----------------------
{
  const T = 'AC3-isDeployGroupEviction-recognizes-real-eviction-text';

  // The exact text confirmed live on PR #633, documented in e2e.yml's own
  // historical comments.
  const realEvictionText = 'Canceling since a higher priority waiting request for deploy-group exists';

  assertCheck(T, isDeployGroupEviction(realEvictionText) === true,
    `Expected isDeployGroupEviction() to return true for the real GitHub Actions eviction annotation text, got ${isDeployGroupEviction(realEvictionText)}`);
}

{
  const T = 'AC3-isDeployGroupEviction-does-not-mask-real-failures';

  // A genuine failure message must never be misclassified as a recoverable
  // eviction -- otherwise the auto-rerun mechanism would mask real failures
  // as transient and silently re-run (and potentially keep re-running) a
  // run that failed for a real reason.
  const genuineFailureText = 'Process completed with exit code 1.';

  assertCheck(T, isDeployGroupEviction(genuineFailureText) === false,
    `Expected isDeployGroupEviction() to return false for a genuine failure message, got ${isDeployGroupEviction(genuineFailureText)} -- the mechanism must never treat a real failure as a recoverable eviction`);
}

{
  const T = 'AC3-isDeployGroupEviction-false-for-unrelated-text';

  assertCheck(T, isDeployGroupEviction('') === false,
    'Expected isDeployGroupEviction() to return false for an empty string');
  assertCheck(T + '-null', isDeployGroupEviction(null) === false,
    'Expected isDeployGroupEviction() to return false for null input (defensive -- must not throw)');
  assertCheck(T + '-undefined', isDeployGroupEviction(undefined) === false,
    'Expected isDeployGroupEviction() to return false for undefined input (defensive -- must not throw)');
  assertCheck(T + '-other-concurrency-group', isDeployGroupEviction('Canceling since a higher priority waiting request for some-other-group exists') === false,
    'Expected isDeployGroupEviction() to return false when the cancellation text names a different concurrency group, not deploy-group');
}

if (totalFailed > 0) {
  console.error(`[fhff-s2-deploy-group-eviction] FAIL -- ${issues.length} issue(s) found:`);
  issues.forEach(i => console.error(i));
  process.exit(1);
} else {
  console.log(`[fhff-s2-deploy-group-eviction] ${totalPassed} check(s) OK ✓`);
}
