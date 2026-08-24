#!/usr/bin/env node
/**
 * check-vcfrc-s1-verify-completion-fresh-result-check.js
 *
 * Content-assertion tests for the fresh-same-session-result check added to
 * /verify-completion's Step 1. Run: node tests/check-vcfrc-s1-verify-completion-fresh-result-check.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SKILL_MD = path.join(ROOT, 'skills', 'verify-completion', 'SKILL.md');
const CONTRACTS_SCRIPT = path.join(ROOT, '.github', 'scripts', 'check-skill-contracts.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('  ✓ ' + name);
    passed++;
  } catch (err) {
    console.error('  ✗ ' + name);
    console.error('      ' + err.message);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function norm(s) {
  return s.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ');
}

const skillMd = norm(fs.readFileSync(SKILL_MD, 'utf8'));

console.log('\n[vcfrc-s1] Tests\n');

test('step1HasFreshResultCheck (AC1)', () => {
  const step1Idx = skillMd.indexOf('## Step 1 — Run the full test suite');
  const step2Idx = skillMd.indexOf('## Step 2');
  assert(step1Idx !== -1, 'expected Step 1 heading to exist');
  assert(step2Idx !== -1, 'expected Step 2 heading to exist');
  const step1Text = skillMd.slice(step1Idx, step2Idx);
  assert(/check whether an already-fresh same-session result exists/.test(step1Text),
    'expected Step 1 to instruct checking for an already-fresh same-session result before running the command');
  const checkIdx = step1Text.indexOf('check whether an already-fresh same-session result exists');
  const commandIdx = step1Text.indexOf('```bash');
  assert(checkIdx !== -1 && commandIdx !== -1 && checkIdx < commandIdx,
    'expected the fresh-result check to appear before the test command block');
});

test('freshnessDefinitionPrecise (AC2)', () => {
  assert(/no code changes have been made since that run/.test(skillMd),
    'expected the freshness definition to require no code changes since the prior run');
  assert(/covered the same full-suite command, not a targeted single-file run/.test(skillMd),
    'expected the freshness definition to require the same full-suite command, not a targeted subset');
});

test('citesConcreteEvidence (AC3)', () => {
  assert(/vrne-s3/.test(skillMd), 'expected the passage to cite vrne-s3');
  assert(/vrne-s4/.test(skillMd), 'expected the passage to cite vrne-s4');
  assert(/loop-design\.md.*Section 8c|Section 8c/.test(skillMd), 'expected the passage to cite loop-design.md Section 8c');
});

test('existingStep1TextUnchanged (AC4, non-regression)', () => {
  assert(/Tests: \[N\]\/\[N\] passing/.test(skillMd), 'expected the existing test report format to be unchanged');
  assert(/If failures exist.{0,10}do not proceed to Step 2/.test(skillMd), 'expected the existing failure-handling instruction to be unchanged');
  assert(/Route\/handler E2E coverage check \(mandatory when the diff touches route\/handler files\)/.test(skillMd),
    'expected the existing Route/handler E2E coverage check section heading to be unchanged');
  assert(/Do not run the full, unscoped `npm run test:e2e` suite/.test(skillMd),
    'expected the existing test:e2e exclusion instruction to be unchanged');
});

test('skillContractsUntouchedOrConsistentlyGuarded (T5)', () => {
  const result = spawnSync(process.execPath, [CONTRACTS_SCRIPT], { encoding: 'utf8', cwd: ROOT });
  assert(result.status === 0, 'check-skill-contracts.js should exit 0: ' + (result.stderr || result.stdout || '').slice(0, 300));
});

console.log('');
console.log('[vcfrc-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
