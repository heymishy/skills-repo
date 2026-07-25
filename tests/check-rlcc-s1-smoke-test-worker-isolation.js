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

// ── AC2: change is scoped — exactly one `run:` command carries --workers=1 ────
console.log('\n[rlcc-s1] AC2 — --workers=1 appears on exactly one run: line, scoped to smoke-test only');
{
  const runLinesWithFlag = lines.filter(function(l) {
    return /^\s*run:/.test(l) && l.indexOf('--workers=1') !== -1;
  });
  assert(runLinesWithFlag.length === 1, 'AC2a: exactly one run: command carries --workers=1');

  // Confirm it lives inside the smoke-test job, not deploy-staging or promote-to-prod
  const smokeTestIdx = workflowText.indexOf('smoke-test:');
  const promoteIdx   = workflowText.indexOf('promote-to-prod:');
  const runLineIdx   = workflowText.indexOf('run: npx playwright test --grep "@mocked" --workers=1');
  assert(
    smokeTestIdx !== -1 && runLineIdx > smokeTestIdx && (promoteIdx === -1 || runLineIdx < promoteIdx),
    'AC2b: the flagged run: command is positioned inside the smoke-test job block'
  );
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
