#!/usr/bin/env node
// check-gav-s1-gate-advance-validation.js — test plan verification for gav-s1
// Covers U1-U25 (AC1-AC7) and IT1-IT4 from the test plan.
// Run: node tests/check-gav-s1-gate-advance-validation.js
'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const ROOT   = path.join(__dirname, '..');
const MODULE = path.join(ROOT, 'src', 'enforcement', 'cli-outer-loop.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else           { console.log(`  ✗ ${label}`); failed++; }
}

function loadModule() {
  delete require.cache[require.resolve(MODULE)];
  return require(MODULE);
}

const { validate } = loadModule();

// ── Fixture setup ─────────────────────────────────────────────────────────────
// Synthetic test data must live INSIDE ROOT so the path-traversal guard passes.
const tmpDir = fs.mkdtempSync(path.join(ROOT, '.tmp-test-gav-s1-'));

function writeFixture(relPath, content) {
  const abs = path.join(tmpDir, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
  return path.relative(ROOT, abs).replace(/\\/g, '/');
}

// ── U1/U2/U3/U4 — AC1: dor-signed-off alias ──────────────────────────────────
console.log('\n[gav-s1] AC1 — dor-signed-off alias');
{
  const storyPath = writeFixture('u1/story.md', [
    '## User Story', '',
    '## Acceptance Criteria',
    '**AC1:** Given a, When b, Then c.',
    '**AC2:** Given a, When b, Then c.',
    '**AC3:** Given a, When b, Then c.',
    '', '## Out of Scope', 'Widget X is excluded.',
    '', '## Benefit Linkage', 'M1 — test metric.',
    '', '## Complexity Rating', '**Rating:** 2', '**Scope stability:** Stable',
    '', '## Architecture Constraints', 'ADR-011 applies.',
  ].join('\n'));
  const tpPath = writeFixture('u1/tp.md', ['## AC Coverage', 'AC1 AC2 AC3'].join('\n'));
  const rvPath = writeFixture('u1/rv.md', ['| Finding | Severity |', '| none | LOW |'].join('\n'));
  const dorPath = writeFixture('u1/dor.md', [
    `**Story reference:** ${storyPath}`,
    `**Test plan reference:** ${tpPath}`,
    `**Review artefact:** ${rvPath}`,
  ].join('\n'));

  const rDorSignedOff = validate(dorPath, 'dor-signed-off', ROOT);
  const rDefOfReady    = validate(dorPath, 'definition-of-ready', ROOT);
  assert(rDorSignedOff.exitCode === 0, 'U1: dor-signed-off exitCode === 0');
  assert(rDefOfReady.exitCode === 0, 'U1: definition-of-ready exitCode === 0');
  assert(rDorSignedOff.exitCode === rDefOfReady.exitCode, 'U1: both aliases return identical exitCode');
  assert(/validate OK/.test(rDorSignedOff.stdout) && /validate OK/.test(rDefOfReady.stdout), 'U1: both aliases return "validate OK" shape');

  const rAgain = validate(dorPath, 'definition-of-ready', ROOT);
  assert(rAgain.exitCode === 0, 'U2: definition-of-ready alone still works (backward compat)');

  const badStoryPath = writeFixture('u1/story-no-oos.md', [
    '## Acceptance Criteria',
    '**AC1:** Given a, When b, Then c.',
    '**AC2:** Given a, When b, Then c.',
    '**AC3:** Given a, When b, Then c.',
    '', '## Benefit Linkage', 'M1 — test metric.',
    '', '## Complexity Rating', '**Rating:** 2', '**Scope stability:** Stable',
    '', '## Architecture Constraints', 'ADR-011 applies.',
  ].join('\n'));
  const badDorPath = writeFixture('u1/dor-h4-fail.md', [
    `**Story reference:** ${badStoryPath}`,
    `**Test plan reference:** ${tpPath}`,
    `**Review artefact:** ${rvPath}`,
  ].join('\n'));
  const rH4Alias = validate(badDorPath, 'dor-signed-off', ROOT);
  assert(rH4Alias.exitCode === 4, 'U3: dor-signed-off fails on the same H4 violation as definition-of-ready');

  const rUnsupported = validate(dorPath, 'not-a-real-gate', ROOT);
  assert(rUnsupported.exitCode === 8, 'U4: unsupported gate still exits 8');
  assert(/UNSUPPORTED_GATE/.test(rUnsupported.stderr), 'U4: UNSUPPORTED_GATE message present');
  const supportedCount = ['definition-of-ready', 'dor-signed-off', 'discovery-approved', 'benefit-metric-active', 'definition-complete', 'test-plan-complete', 'branch-complete', 'definition-of-done']
    .filter((g) => rUnsupported.stderr.includes(g)).length;
  assert(supportedCount === 8, `U4: unsupported-gate message lists all 8 supported gates (found ${supportedCount})`);
}

// ── U5-U9 — AC2: discovery-approved ───────────────────────────────────────────
console.log('\n[gav-s1] AC2 — discovery-approved');
{
  function discoveryFixture(overrides) {
    const sections = Object.assign({
      problem: '## Problem Statement\n\nReal problem text.\n',
      who: '## Who It Affects\n\nOperators.\n',
      why: '## Why Now\n\nBecause reasons.\n',
      mvp: '## MVP Scope\n\nBounded list.\n',
      oos: '## Out of Scope\n\nItem A, Item B.\n',
      approved: '## Approved By\n\nHamish King — Founder — 2026-07-29\n',
    }, overrides || {});
    return [sections.problem, sections.who, sections.why, sections.mvp, sections.oos, sections.approved].join('\n');
  }

  const completePath = writeFixture('u5/discovery.md', discoveryFixture());
  assert(validate(completePath, 'discovery-approved', ROOT).exitCode === 0, 'U5: complete discovery.md passes');

  const missingProblemPath = writeFixture('u6/discovery.md', discoveryFixture({ problem: '' }));
  const r6 = validate(missingProblemPath, 'discovery-approved', ROOT);
  assert(r6.exitCode !== 0, 'U6: missing Problem Statement fails');
  assert(/Problem Statement/.test(r6.stderr), 'U6: message names the missing section');

  const missingApprovedPath = writeFixture('u7/discovery.md', discoveryFixture({ approved: '' }));
  const r7 = validate(missingApprovedPath, 'discovery-approved', ROOT);
  assert(r7.exitCode !== 0, 'U7: missing Approved By fails');
  assert(/Approved By/.test(r7.stderr), 'U7: message names the missing approval');

  const placeholderApprovedPath = writeFixture('u8/discovery.md', discoveryFixture({ approved: '## Approved By\n\n[FILL IN]\n' }));
  const r8 = validate(placeholderApprovedPath, 'discovery-approved', ROOT);
  assert(r8.exitCode !== 0, 'U8: placeholder Approved By value fails');

  const blankMvpPath = writeFixture('u9/discovery.md', discoveryFixture({ mvp: '## MVP Scope\n\n' }));
  const r9 = validate(blankMvpPath, 'discovery-approved', ROOT);
  assert(r9.exitCode !== 0, 'U9: blank MVP Scope body fails');
}

// ── U10-U13 — AC3: benefit-metric-active ──────────────────────────────────────
console.log('\n[gav-s1] AC3 — benefit-metric-active');
{
  function metricBlock(fields) {
    return [
      '### Metric 1: Example',
      '',
      '| Field | Value |',
      '|-------|-------|',
      `| **What we measure** | ${fields.what || ''} |`,
      `| **Baseline** | ${fields.baseline || ''} |`,
      `| **Target** | ${fields.target || ''} |`,
      `| **Measurement method** | ${fields.method || ''} |`,
    ].join('\n');
  }

  const completeBlock = metricBlock({ what: 'Time to first response', baseline: '10 minutes', target: 'Under 5 minutes', method: 'Weekly dashboard export' });
  const completePath = writeFixture('u10/bm.md', ['## Tier 1: Product Metrics', '', completeBlock].join('\n'));
  assert(validate(completePath, 'benefit-metric-active', ROOT).exitCode === 0, 'U10: complete Tier 1 metric passes');

  const missingBaselineBlock = metricBlock({ what: 'Time to first response', baseline: '', target: 'Under 5 minutes', method: 'Weekly dashboard export' });
  const missingBaselinePath = writeFixture('u11/bm.md', ['## Tier 1: Product Metrics', '', missingBaselineBlock].join('\n'));
  const r11 = validate(missingBaselinePath, 'benefit-metric-active', ROOT);
  assert(r11.exitCode !== 0, 'U11: missing Baseline fails');

  const noTier1Path = writeFixture('u12/bm.md', ['## Tier 2: Meta Metrics', '', '### Meta Metric 1: X'].join('\n'));
  const r12 = validate(noTier1Path, 'benefit-metric-active', ROOT);
  assert(r12.exitCode !== 0, 'U12: zero Tier 1 metrics fails');

  const incompleteBlock = metricBlock({ what: 'Other metric', baseline: '', target: '', method: '' });
  const multiPath = writeFixture('u13/bm.md', ['## Tier 1: Product Metrics', '', completeBlock, '', incompleteBlock].join('\n'));
  assert(validate(multiPath, 'benefit-metric-active', ROOT).exitCode === 0, 'U13: passes when at least one of multiple metrics is complete');
}

// ── U14-U17 — AC4: definition-complete ────────────────────────────────────────
console.log('\n[gav-s1] AC4 — definition-complete');
{
  function storyFixture(overrides) {
    const o = Object.assign({ acCount: 3, oos: 'Widget integration excluded.', rating: '2' }, overrides || {});
    const acs = [];
    for (let i = 1; i <= o.acCount; i++) {
      acs.push(`**AC${i}:** Given a, When b, Then c.`);
    }
    return [
      '## Acceptance Criteria', acs.join('\n'),
      '', '## Out of Scope', o.oos,
      '', '## Complexity Rating', `**Rating:** ${o.rating}`, '**Scope stability:** Stable',
    ].join('\n');
  }

  const completePath = writeFixture('u14/story.md', storyFixture());
  assert(validate(completePath, 'definition-complete', ROOT).exitCode === 0, 'U14: fully-formed story passes');

  const fewAcsPath = writeFixture('u15/story.md', storyFixture({ acCount: 2 }));
  assert(validate(fewAcsPath, 'definition-complete', ROOT).exitCode !== 0, 'U15: fewer than 3 ACs fails');

  const blankOosPath = writeFixture('u16/story.md', storyFixture({ oos: '' }));
  assert(validate(blankOosPath, 'definition-complete', ROOT).exitCode !== 0, 'U16: blank Out of Scope fails');

  const badRatingPath = writeFixture('u17/story.md', storyFixture({ rating: '5' }));
  assert(validate(badRatingPath, 'definition-complete', ROOT).exitCode !== 0, 'U17: out-of-range Complexity Rating fails');
}

// ── U18/U19 — AC5: test-plan-complete ─────────────────────────────────────────
console.log('\n[gav-s1] AC5 — test-plan-complete');
{
  const storyPath = writeFixture('u18/story.md', [
    '## Acceptance Criteria',
    '**AC1:** Given a, When b, Then c.',
    '**AC2:** Given a, When b, Then c.',
    '**AC3:** Given a, When b, Then c.',
  ].join('\n'));

  const fullTpPath = writeFixture('u18/tp.md', [
    `**Story reference:** ${storyPath}`,
    '## AC Coverage', 'AC1 — T1', 'AC2 — T2', 'AC3 — T3',
  ].join('\n'));
  assert(validate(fullTpPath, 'test-plan-complete', ROOT).exitCode === 0, 'U18: test plan covering every story AC passes');

  const partialTpPath = writeFixture('u19/tp.md', [
    `**Story reference:** ${storyPath}`,
    '## AC Coverage', 'AC1 — T1', 'AC2 — T2',
  ].join('\n'));
  const r19 = validate(partialTpPath, 'test-plan-complete', ROOT);
  assert(r19.exitCode !== 0, 'U19: test plan missing one story AC fails');
  assert(/AC3/.test(r19.stderr), 'U19: message names AC3 as uncovered');
}

// ── U20-U22 — AC6: branch-complete ────────────────────────────────────────────
console.log('\n[gav-s1] AC6 — branch-complete');
{
  const okPath = writeFixture('u20/state.json', JSON.stringify({ prUrl: 'https://github.com/x/y/pull/1', verifyStatus: 'passed' }));
  assert(validate(okPath, 'branch-complete', ROOT).exitCode === 0, 'U20: prUrl + verifyStatus:passed both present passes');

  const noPrUrlPath = writeFixture('u21/state.json', JSON.stringify({ prUrl: '', verifyStatus: 'passed' }));
  assert(validate(noPrUrlPath, 'branch-complete', ROOT).exitCode !== 0, 'U21: empty prUrl fails');

  const notPassedPath = writeFixture('u22/state.json', JSON.stringify({ prUrl: 'https://github.com/x/y/pull/1', verifyStatus: 'not-started' }));
  assert(validate(notPassedPath, 'branch-complete', ROOT).exitCode !== 0, 'U22: verifyStatus not "passed" fails');
}

// ── U23-U25 — AC7: definition-of-done ─────────────────────────────────────────
console.log('\n[gav-s1] AC7 — definition-of-done');
{
  function dodFixture(rows) {
    return [
      '## AC Coverage', '',
      '| AC | Satisfied? | Evidence | Verification method | Deviation |',
      '|----|-----------|----------|---------------------|-----------|',
      ...rows,
    ].join('\n');
  }

  const allPassPath = writeFixture('u23/dod.md', dodFixture([
    '| AC1 | ✅ | Test T1 | automated test | None |',
    '| AC2 | ✅ | Test T2 | automated test | None |',
  ]));
  assert(validate(allPassPath, 'definition-of-done', ROOT).exitCode === 0, 'U23: all-✅ rows pass');

  const warnWithDeviationPath = writeFixture('u24/dod.md', dodFixture([
    '| AC1 | ✅ | Test T1 | automated test | None |',
    '| AC2 | ⚠️ | Test T2 | automated test | Deferred to follow-up story XYZ |',
  ]));
  assert(validate(warnWithDeviationPath, 'definition-of-done', ROOT).exitCode === 0, 'U24: ⚠️ row with recorded deviation passes');

  const blankDeviationPath = writeFixture('u25/dod.md', dodFixture([
    '| AC1 | ✅ | Test T1 | automated test | None |',
    '| AC2 | ❌ | Test T2 | automated test |  |',
  ]));
  const r25 = validate(blankDeviationPath, 'definition-of-done', ROOT);
  assert(r25.exitCode !== 0, 'U25: ❌ row with blank Deviation fails');
  assert(/AC2/.test(r25.stderr), 'U25: message names the specific failing AC row');
}

// ── IT1 — path traversal guard across the 6 new gate branches ────────────────
console.log('\n[gav-s1] IT1 — path traversal guard preserved across all 6 new gate branches');
{
  const newGates = ['discovery-approved', 'benefit-metric-active', 'definition-complete', 'test-plan-complete', 'branch-complete', 'definition-of-done'];
  newGates.forEach((gate) => {
    const r = validate('../../etc/passwd', gate, ROOT);
    assert(r.exitCode === 8, `IT1: ${gate} rejects path traversal (exitCode 8)`);
    assert(/OWASP A01|repository root/i.test(r.stderr), `IT1: ${gate} traversal message references the guard`);
  });
}

// ── IT2 — gateAdvance end-to-end for test-plan-complete ──────────────────────
console.log('\n[gav-s1] IT2 — gateAdvance end-to-end for test-plan-complete');
{
  const { gateAdvance } = require('../src/enforcement/cli-gate-advance');
  const gaDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gav-s1-it2-'));
  try {
    fs.mkdirSync(path.join(gaDir, '.github'), { recursive: true });
    fs.writeFileSync(path.join(gaDir, '.github', 'pipeline-state.json'), JSON.stringify({ schemaVersion: '1', features: [{ slug: 'f1', stories: [{ id: 's1' }] }] }, null, 2));

    fs.mkdirSync(path.join(gaDir, 'artefacts', 'f1'), { recursive: true });
    fs.writeFileSync(path.join(gaDir, 'artefacts', 'f1', 'story.md'), [
      '## Acceptance Criteria',
      '**AC1:** Given a, When b, Then c.',
    ].join('\n'));
    fs.writeFileSync(path.join(gaDir, 'artefacts', 'f1', 'tp.md'), [
      '**Story reference:** artefacts/f1/story.md',
      '## AC Coverage', 'AC1 — T1',
    ].join('\n'));

    const result = gateAdvance('f1', 's1', 'test-plan-complete', 'artefacts/f1/tp.md', ['testPlanWritten=true'], gaDir);
    assert(result.exitCode === 0, 'IT2: gateAdvance exitCode === 0 for a valid test-plan-complete pair');
    const after = JSON.parse(fs.readFileSync(path.join(gaDir, '.github', 'pipeline-state.json'), 'utf8'));
    // advance() only coerces booleans for fields in its own BOOLEAN_FIELDS
    // allowlist; testPlanWritten isn't one, so it's stored as the literal
    // string "true" — this test only checks the field was actually written.
    assert(after.features[0].stories[0].testPlanWritten === 'true', 'IT2: state written only after validation passes');
  } finally {
    try { fs.rmSync(gaDir, { recursive: true, force: true }); } catch (_) {}
  }
}

// ── IT3 — gateAdvance end-to-end for branch-complete ─────────────────────────
console.log('\n[gav-s1] IT3 — gateAdvance end-to-end for branch-complete');
{
  const { gateAdvance } = require('../src/enforcement/cli-gate-advance');
  const gaDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gav-s1-it3-'));
  try {
    fs.mkdirSync(path.join(gaDir, '.github'), { recursive: true });
    fs.writeFileSync(path.join(gaDir, '.github', 'pipeline-state.json'), JSON.stringify({ schemaVersion: '1', features: [{ slug: 'f1', stories: [{ id: 's1' }] }] }, null, 2));

    fs.mkdirSync(path.join(gaDir, 'artefacts', 'f1'), { recursive: true });
    fs.writeFileSync(path.join(gaDir, 'artefacts', 'f1', 'state.json'), JSON.stringify({ prUrl: 'https://github.com/x/y/pull/1', verifyStatus: 'not-started' }));

    const result = gateAdvance('f1', 's1', 'branch-complete', 'artefacts/f1/state.json', ['prStatus=merged'], gaDir);
    assert(result.exitCode !== 0, 'IT3: gateAdvance fails validation when verifyStatus is not "passed"');
    const after = JSON.parse(fs.readFileSync(path.join(gaDir, '.github', 'pipeline-state.json'), 'utf8'));
    assert(after.features[0].stories[0].prStatus === undefined, 'IT3: state left untouched — prStatus NOT written');
  } finally {
    try { fs.rmSync(gaDir, { recursive: true, force: true }); } catch (_) {}
  }
}

// ── IT4 — gateAdvance end-to-end for definition-of-done ──────────────────────
console.log('\n[gav-s1] IT4 — gateAdvance end-to-end for definition-of-done');
{
  const { gateAdvance } = require('../src/enforcement/cli-gate-advance');
  const gaDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gav-s1-it4-'));
  try {
    fs.mkdirSync(path.join(gaDir, '.github'), { recursive: true });
    fs.writeFileSync(path.join(gaDir, '.github', 'pipeline-state.json'), JSON.stringify({ schemaVersion: '1', features: [{ slug: 'f1', stories: [{ id: 's1' }] }] }, null, 2));

    fs.mkdirSync(path.join(gaDir, 'artefacts', 'f1'), { recursive: true });
    fs.writeFileSync(path.join(gaDir, 'artefacts', 'f1', 'dod.md'), [
      '## AC Coverage', '',
      '| AC | Satisfied? | Evidence | Verification method | Deviation |',
      '|----|-----------|----------|---------------------|-----------|',
      '| AC1 | ❌ | Test T1 | automated test |  |',
    ].join('\n'));

    const result = gateAdvance('f1', 's1', 'definition-of-done', 'artefacts/f1/dod.md', ['dodStatus=complete'], gaDir);
    assert(result.exitCode !== 0, 'IT4: gateAdvance fails validation on a blank-deviation ❌ row');
    const after = JSON.parse(fs.readFileSync(path.join(gaDir, '.github', 'pipeline-state.json'), 'utf8'));
    assert(after.features[0].stories[0].dodStatus === undefined, 'IT4: state left untouched — dodStatus NOT written');
  } finally {
    try { fs.rmSync(gaDir, { recursive: true, force: true }); } catch (_) {}
  }
}

// ── Cleanup ───────────────────────────────────────────────────────────────────
try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n=== check-gav-s1-gate-advance-validation results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
