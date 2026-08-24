#!/usr/bin/env node
/**
 * check-egsv-s1-env-gated-skip-visibility.js
 *
 * Content-assertion tests proving 3 test files no longer fold environment-
 * gated skips (pwsh/bash/python3 unavailable) into their `passed` counter.
 * Run: node tests/check-egsv-s1-env-gated-skip-visibility.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const P35 = path.join(ROOT, 'tests', 'check-p3.5-validate-trace.js');
const ENF2 = path.join(ROOT, 'tests', 'check-p4-enf-second-line.js');
const VTP1 = path.join(ROOT, 'tests', 'check-vtp-s1-validate-trace-consolidation.js');

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

const p35 = norm(fs.readFileSync(P35, 'utf8'));
const enf2 = norm(fs.readFileSync(ENF2, 'utf8'));
const vtp1 = norm(fs.readFileSync(VTP1, 'utf8'));

console.log('\n[egsv-s1] T1/T2 — check-p3.5-validate-trace.js (AC1)\n');

test('p35SkipsAreTrackedSeparately', () => {
  assert(/let\s+skipped\s*=\s*0/.test(p35), 'expected a skipped counter declared');
  const skipBlocks = p35.match(/pwsh not available in this environment[^\n]*\n\s*skipped\+\+/g) || [];
  assert(skipBlocks.length === 2, 'expected both pwsh-unavailable skip blocks to increment skipped, found ' + skipBlocks.length);
  assert(!/pwsh not available in this environment.{0,80}pass\(name\)/s.test(p35),
    'a pwsh-unavailable skip block still calls pass(name) instead of skipped++');
});

test('p35SummaryReportsSkipCount', () => {
  assert(/skipped > 0.*skipped.*pwsh/.test(p35) || /skipped.*pwsh unavailable/.test(p35),
    'expected the final summary line to conditionally report skipped count mentioning pwsh');
});

console.log('\n[egsv-s1] T3/T4 — check-p4-enf-second-line.js (AC2)\n');

test('enfSecondLineT6TrackedSeparately', () => {
  assert(/let\s+skipped\s*=\s*0/.test(enf2), 'expected a skipped counter declared near passed/failed');
  assert(/T6: skipped \(bash not available on this platform[^\n]*\n\s*skipped\+\+/.test(enf2),
    'expected T6 skip block to increment skipped');
  assert(!/T6: skipped \(bash not available on this platform.{0,60}\n\s*passed\+\+/.test(enf2),
    'T6 skip block still increments passed');
});

test('enfSecondLineSummaryReportsSkipCount', () => {
  assert(/skipped > 0.*skipped.*bash unavailable/.test(enf2),
    'expected the Results summary line to conditionally report skipped count mentioning bash');
});

console.log('\n[egsv-s1] T5/T6 — check-vtp-s1-validate-trace-consolidation.js (AC3)\n');

test('vtpS1BlockSkipsTrackedSeparately', () => {
  assert(/let skipped = 0/.test(vtp1), 'expected a skipped counter declared alongside passed/failed');
  assert(/skipped \(bash\/python3 not usable on this platform[^\n]*\n\s*skipped \+= 1/.test(vtp1),
    'expected the AC1/AC2/AC3 block-skip to increment skipped');
  assert(/skipped \(pre-change baseline cannot run on this platform[^\n]*\n\s*skipped \+= 1/.test(vtp1),
    'expected the AC1 baseline-comparison skip to increment skipped');
  assert(!/skipped \(bash\/python3 not usable on this platform.{0,80}\n\s*passed \+= 1/.test(vtp1),
    'the AC1/AC2/AC3 block-skip still increments passed');
  assert(!/skipped \(pre-change baseline cannot run on this platform.{0,80}\n\s*passed \+= 1/.test(vtp1),
    'the AC1 baseline-comparison skip still increments passed');
});

test('vtpS1SummaryReportsSkipCount', () => {
  assert(/skipped > 0.*skipped.*bash\/python3 unavailable/.test(vtp1),
    'expected the final console.log summary to conditionally report skipped count');
});

console.log('\n[egsv-s1] T7 — exit-code logic unchanged (AC5)\n');

test('exitCodeLogicUnchangedAcrossAllThree', () => {
  assert(/if \(failed > 0\) \{[\s\S]{0,200}process\.exit\(1\)/.test(p35),
    'check-p3.5-validate-trace.js exit logic should still gate only on failed');
  assert(/if \(failed > 0\) process\.exit\(1\)/.test(enf2),
    'check-p4-enf-second-line.js exit logic should still gate only on failed');
  assert(/process\.exit\(failed > 0 \? 1 : 0\)/.test(vtp1),
    'check-vtp-s1-validate-trace-consolidation.js exit logic should still gate only on failed');
});

console.log('\n[egsv-s1] T8 — non-skip pass/assert sites unchanged (AC4, non-regression)\n');

test('passIncrementSitesUnrelatedToSkipUnchanged', () => {
  assert(/function pass\(name\)/.test(p35), 'check-p3.5-validate-trace.js should still define pass()/fail() for its real assertions');
  assert(/function fail\(name, reason\)/.test(p35), 'check-p3.5-validate-trace.js fail() helper missing');
  assert(/function assert\(condition, label\) \{/.test(enf2), 'check-p4-enf-second-line.js assert() helper missing');
  assert(/T1: artefacts\/2026-04-19-skills-platform-phase4\/theme-f-inputs\.md exists/.test(enf2),
    'check-p4-enf-second-line.js T1 real assertion should be untouched');
  assert(/function pass\(name\) \{ console\.log/.test(vtp1), 'check-vtp-s1-validate-trace-consolidation.js pass() helper missing');
  assert(/singleCheckMode_\$\{name\}_runsAndReportsCleanly/.test(vtp1),
    'check-vtp-s1-validate-trace-consolidation.js real per-check assertion loop should be untouched');
});

console.log('');
console.log('[egsv-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
