#!/usr/bin/env node
// check-rlcc-s1-smoke-test-worker-isolation.js — TDD tests for rlcc-s1
// Tests: AC1-AC3 — the staging smoke-test job's @mocked Playwright run must
// be serialized to a single worker so the process-wide real-LLM-call counter
// can't be polluted by a concurrently-running different spec, without
// affecting any other job or the shared playwright.config.js.
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT              = path.join(__dirname, '..');
const WORKFLOW_PATH      = path.join(ROOT, '.github', 'workflows', 'staging-deploy.yml');
const PLAYWRIGHT_CONFIG  = path.join(ROOT, 'playwright.config.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log('  ✓ ' + label); passed++; }
  else           { console.log('  ✗ ' + label); failed++; }
}

const workflowText = fs.readFileSync(WORKFLOW_PATH, 'utf8');
const lines = workflowText.split('\n');

// ── AC1: smoke-test job's playwright line includes --workers=1 ────────────────
console.log('\n[rlcc-s1] AC1 — smoke-test job\'s @mocked run includes --workers=1');
{
  const runLineIdx = lines.findIndex(function(l) {
    return l.indexOf('npx playwright test --grep "@mocked"') !== -1;
  });
  assert(runLineIdx !== -1, 'AC1a: found the @mocked run: line');
  assert(runLineIdx !== -1 && lines[runLineIdx].indexOf('--workers=1') !== -1,
    'AC1b: that line includes --workers=1');
}

// ── AC2: change is scoped — exactly one `run:` command inside the smoke-test
// job carries --workers=1 (not "exactly one in the whole file" — pmec-s1
// added a wholly separate post-deploy-e2e-confirm job that legitimately
// reuses --workers=1 for the same CPU-contention reason e2e.yml's Scenario
// A/B jobs already do; the scope guarantee this AC actually cares about is
// "the flag didn't leak into deploy-staging/promote-to-prod", not "no other
// job anywhere in the file may ever use it too") ────────────────────────────
console.log('\n[rlcc-s1] AC2 — --workers=1 appears on exactly one run: line inside the smoke-test job, and never inside deploy-staging or promote-to-prod');
{
  const smokeTestIdx = workflowText.indexOf('smoke-test:');
  const promoteIdx   = workflowText.indexOf('promote-to-prod:');
  const smokeTestBlock = (smokeTestIdx !== -1)
    ? workflowText.slice(smokeTestIdx, promoteIdx !== -1 ? promoteIdx : undefined)
    : '';
  // Only count within the smoke-test job's own block (up to the next job
  // boundary that isn't itself part of smoke-test — post-deploy-e2e-confirm
  // sits between smoke-test and promote-to-prod, so bound the slice at the
  // next top-level job header instead of directly at promote-to-prod).
  const nextJobMatch = /\n  [A-Za-z0-9_.-]+:\s*\n/.exec(smokeTestBlock.slice(1));
  const smokeTestOwnBlock = nextJobMatch ? smokeTestBlock.slice(0, nextJobMatch.index + 1) : smokeTestBlock;

  const runLinesWithFlagInSmokeTest = smokeTestOwnBlock.split('\n').filter(function(l) {
    return /^\s*run:/.test(l) && l.indexOf('--workers=1') !== -1;
  });
  assert(runLinesWithFlagInSmokeTest.length === 1, 'AC2a: exactly one run: command inside the smoke-test job carries --workers=1');

  // Confirm the deploy-staging and promote-to-prod job blocks never carry it
  const deployStagingIdx = workflowText.indexOf('deploy-staging:');
  const deployStagingBlock = (deployStagingIdx !== -1 && smokeTestIdx !== -1)
    ? workflowText.slice(deployStagingIdx, smokeTestIdx)
    : '';
  const promoteBlock = (promoteIdx !== -1) ? workflowText.slice(promoteIdx) : '';
  const leakedOutsideSmokeTest = [deployStagingBlock, promoteBlock].some(function(block) {
    return block.split('\n').some(function(l) {
      return /^\s*run:/.test(l) && l.indexOf('--workers=1') !== -1;
    });
  });
  assert(!leakedOutsideSmokeTest, 'AC2b: --workers=1 does not appear inside deploy-staging or promote-to-prod');
}

// ── AC3: playwright.config.js is unmodified — no top-level workers: key ───────
console.log('\n[rlcc-s1] AC3 — playwright.config.js has no workers: key (local/dev parallelism unaffected)');
{
  delete require.cache[require.resolve(PLAYWRIGHT_CONFIG)];
  const config = require(PLAYWRIGHT_CONFIG);
  assert(!('workers' in config), 'AC3: playwright.config.js module.exports has no "workers" key');
}

console.log('\n[rlcc-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
