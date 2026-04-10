#!/usr/bin/env node
/**
 * check-suite.js
 *
 * Automated tests for workspace/suite.json, src/suite-parser/index.js, and
 * the gate evaluation component. Implements all automatable tests from the
 * p1.6 test plan:
 *
 *   Unit tests:
 *   - U1  — valid scenario validates successfully                              (AC1)
 *   - U2  — scenario missing required field returns field-missing error        (AC1)
 *   - U3  — duplicate taskId returns duplicate-ID error                       (AC1)
 *   - U4  — populated reviewNote passes audit completeness check              (AC3b)
 *   - U5  — null/absent reviewNote returns audit-gap finding                  (AC3b / Audit NFR)
 *   - U6  — fully retired scenario (retiredAt + retiredReason) excluded       (AC4)
 *   - U7  — scenario with retiredAt but no retiredReason → silent-removal err (AC4)
 *
 *   Integration tests:
 *   - I1  — workspace/suite.json validates every scenario                     (AC1)
 *   - I2  — expectedOutcome present in mock output → pass result              (AC2)
 *   - I3  — expectedOutcome absent from mock output → fail result             (AC2)
 *   - I4  — active scenario included in evaluation set; cannot be silently    (AC4)
 *           skipped without retiredReason
 *
 *   NFR tests:
 *   - N1  — full suite evaluation completes within 480 seconds                (Performance NFR)
 *   - N2  — workspace/suite.json contains no credential-like patterns         (Security NFR)
 *   - N3  — every scenario in workspace/suite.json has a non-null reviewNote  (Audit NFR)
 *
 * Run:  node .github/scripts/check-suite.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js fs only.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');

const { validateScenario, validateSuite, parseSuite, evaluateScenario, evaluateSuite } =
  require(path.join(root, 'src', 'suite-parser', 'index.js'));

// ── Test harness ──────────────────────────────────────────────────────────────

let passed   = 0;
let failed   = 0;
const failures = [];

function pass(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}

function fail(name, reason) {
  failed++;
  failures.push({ name, reason });
  console.log(`  ✗ ${name}`);
  console.log(`    → ${reason}`);
}

// ── Load workspace/suite.json ─────────────────────────────────────────────────

const suitePath = path.join(root, 'workspace', 'suite.json');

if (!fs.existsSync(suitePath)) {
  console.error('[suite-check] FATAL: workspace/suite.json not found — implementation incomplete');
  process.exit(1);
}

let suite;
let suiteRaw;
try {
  suiteRaw = fs.readFileSync(suitePath, 'utf8');
  suite    = JSON.parse(suiteRaw);
} catch (e) {
  console.error(`[suite-check] FATAL: workspace/suite.json is not valid JSON: ${e.message}`);
  process.exit(1);
}

// ── Run tests ─────────────────────────────────────────────────────────────────

console.log('[suite-check] Running p1.6 living eval regression suite tests…');
console.log('');

// ── Unit tests ────────────────────────────────────────────────────────────────

console.log('  Unit: AC1 — schema validator');

// U1 — valid scenario validates successfully
{
  const validScenario = {
    taskId:                  'test-u1',
    description:             'A valid test scenario',
    skillSurfaceCombination: 'discovery/github-copilot',
    expectedOutcome:         'discovery artefact written',
    failurePatternGuarded:   'No artefact written',
    reviewNote:              'Outcome-orientation confirmed',
  };
  const result = validateScenario(validScenario);
  if (result.valid) {
    pass('u1-valid-scenario-returns-valid');
  } else {
    fail('u1-valid-scenario-returns-valid',
      `expected valid but got errors: ${result.errors.join(', ')}`);
  }
}

// U2 — scenario missing failurePatternGuarded returns field-missing error
{
  const incompleteScenario = {
    taskId:                  'test-u2',
    description:             'Missing failurePatternGuarded',
    skillSurfaceCombination: 'discovery/github-copilot',
    expectedOutcome:         'something',
    reviewNote:              'some note',
    // failurePatternGuarded deliberately absent
  };
  const result = validateScenario(incompleteScenario);
  if (!result.valid && result.errors.some(e => e.includes('failurePatternGuarded'))) {
    pass('u2-missing-field-returns-field-missing-error');
  } else if (result.valid) {
    fail('u2-missing-field-returns-field-missing-error',
      'expected invalid but validator returned valid');
  } else {
    fail('u2-missing-field-returns-field-missing-error',
      `validator returned invalid but errors do not mention "failurePatternGuarded": ${result.errors.join(', ')}`);
  }
}

// U3 — duplicate taskId returns duplicate-ID error
{
  const duplicateSuite = {
    scenarios: [
      {
        taskId:                  'dup-id',
        description:             'First scenario',
        skillSurfaceCombination: 'discovery/github-copilot',
        expectedOutcome:         'some outcome',
        failurePatternGuarded:   'some pattern',
        reviewNote:              'some note',
      },
      {
        taskId:                  'dup-id',   // duplicate
        description:             'Second scenario with same taskId',
        skillSurfaceCombination: 'clarify/github-copilot',
        expectedOutcome:         'another outcome',
        failurePatternGuarded:   'another pattern',
        reviewNote:              'another note',
      },
    ],
  };
  const result = validateSuite(duplicateSuite);
  if (!result.valid && result.errors.some(e => e.includes('duplicate taskId'))) {
    pass('u3-duplicate-taskid-returns-duplicate-id-error');
  } else if (result.valid) {
    fail('u3-duplicate-taskid-returns-duplicate-id-error',
      'expected invalid (duplicate taskId) but validator returned valid');
  } else {
    fail('u3-duplicate-taskid-returns-duplicate-id-error',
      `validator returned invalid but errors do not mention "duplicate taskId": ${result.errors.join(', ')}`);
  }
}

console.log('');
console.log('  Unit: AC3b / Audit NFR — reviewNote audit check');

// U4 — populated reviewNote passes audit completeness check
{
  const scenarioWithNote = {
    taskId:                  'test-u4',
    description:             'Scenario with reviewNote',
    skillSurfaceCombination: 'discovery/github-copilot',
    expectedOutcome:         'discovery artefact written',
    failurePatternGuarded:   'No artefact written',
    reviewNote:              'Outcome-orientation confirmed: tests artefact existence',
  };
  const result = validateScenario(scenarioWithNote);
  if (result.valid) {
    pass('u4-populated-reviewnote-passes-audit-check');
  } else {
    fail('u4-populated-reviewnote-passes-audit-check',
      `scenario with reviewNote should be valid but got errors: ${result.errors.join(', ')}`);
  }
}

// U5 — null reviewNote returns audit-gap finding
{
  const scenarioNullNote = {
    taskId:                  'test-u5-null',
    description:             'Scenario with null reviewNote',
    skillSurfaceCombination: 'discovery/github-copilot',
    expectedOutcome:         'discovery artefact written',
    failurePatternGuarded:   'No artefact written',
    reviewNote:              null,
  };
  const resultNull = validateScenario(scenarioNullNote);
  if (!resultNull.valid && resultNull.errors.some(e => e.includes('reviewNote'))) {
    pass('u5-null-reviewnote-returns-audit-gap-finding');
  } else if (resultNull.valid) {
    fail('u5-null-reviewnote-returns-audit-gap-finding',
      'expected audit-gap error for null reviewNote but validator returned valid');
  } else {
    fail('u5-null-reviewnote-returns-audit-gap-finding',
      `validator returned invalid but errors do not mention "reviewNote": ${resultNull.errors.join(', ')}`);
  }

  // Also test absent reviewNote
  const scenarioAbsentNote = {
    taskId:                  'test-u5-absent',
    description:             'Scenario with absent reviewNote',
    skillSurfaceCombination: 'discovery/github-copilot',
    expectedOutcome:         'discovery artefact written',
    failurePatternGuarded:   'No artefact written',
    // reviewNote deliberately absent
  };
  const resultAbsent = validateScenario(scenarioAbsentNote);
  if (!resultAbsent.valid && resultAbsent.errors.some(e => e.includes('reviewNote'))) {
    pass('u5-absent-reviewnote-returns-audit-gap-finding');
  } else if (resultAbsent.valid) {
    fail('u5-absent-reviewnote-returns-audit-gap-finding',
      'expected audit-gap error for absent reviewNote but validator returned valid');
  } else {
    fail('u5-absent-reviewnote-returns-audit-gap-finding',
      `validator returned invalid but errors do not mention "reviewNote": ${resultAbsent.errors.join(', ')}`);
  }
}

console.log('');
console.log('  Unit: AC4 — suite parser retirement classification');

// U6 — scenario with retiredAt + retiredReason classified as explicitly retired
{
  const suiteWithRetired = {
    scenarios: [
      {
        taskId:                  'active-scenario',
        description:             'Active scenario',
        skillSurfaceCombination: 'discovery/github-copilot',
        expectedOutcome:         'discovery artefact written',
        failurePatternGuarded:   'No artefact written',
        reviewNote:              'Confirmed outcome-oriented',
      },
      {
        taskId:                  'retired-scenario',
        description:             'Retired scenario',
        skillSurfaceCombination: 'discovery/github-copilot',
        expectedOutcome:         'discovery artefact written',
        failurePatternGuarded:   'No artefact written',
        reviewNote:              'Confirmed outcome-oriented',
        retiredAt:               '2026-01-01',
        retiredReason:           'Replaced by s-discovery-v2 which covers a broader outcome',
      },
    ],
  };
  const { active, retired, violations } = parseSuite(suiteWithRetired);
  const retiredIds = retired.map(s => s.taskId);
  const activeIds  = active.map(s => s.taskId);

  if (retiredIds.includes('retired-scenario') && !activeIds.includes('retired-scenario')) {
    pass('u6-fully-retired-scenario-excluded-from-active-evaluation');
  } else {
    fail('u6-fully-retired-scenario-excluded-from-active-evaluation',
      `expected "retired-scenario" in retired set and not in active set; active: [${activeIds.join(', ')}], retired: [${retiredIds.join(', ')}]`);
  }
  if (violations.length === 0) {
    pass('u6-no-violations-for-fully-retired-scenario');
  } else {
    fail('u6-no-violations-for-fully-retired-scenario',
      `expected no violations but got: ${violations.map(v => v.message).join(', ')}`);
  }
}

// U7 — scenario with retiredAt but no retiredReason → silent-removal error
{
  const suiteWithViolation = {
    scenarios: [
      {
        taskId:                  'silent-removal',
        description:             'Scenario retired without reason',
        skillSurfaceCombination: 'discovery/github-copilot',
        expectedOutcome:         'discovery artefact written',
        failurePatternGuarded:   'No artefact written',
        reviewNote:              'Confirmed outcome-oriented',
        retiredAt:               '2026-01-01',
        // retiredReason deliberately absent — policy violation
      },
    ],
  };
  const { active, retired, violations } = parseSuite(suiteWithViolation);

  if (violations.length > 0 && violations.some(v => v.scenario.taskId === 'silent-removal')) {
    pass('u7-missing-retired-reason-returns-silent-removal-error');
  } else {
    fail('u7-missing-retired-reason-returns-silent-removal-error',
      `expected silent-removal violation for "silent-removal" but violations: [${violations.map(v => v.message).join('; ')}]`);
  }
  // The violating scenario must not appear in the active set without a reason
  const activeIds = active.map(s => s.taskId);
  if (!activeIds.includes('silent-removal')) {
    pass('u7-silent-removal-scenario-not-in-active-set');
  } else {
    fail('u7-silent-removal-scenario-not-in-active-set',
      'silent-removal violation scenario must not appear in active set without retiredReason');
  }
}

// ── Integration tests ─────────────────────────────────────────────────────────

console.log('');
console.log('  Integration: AC1 — workspace/suite.json full validation');

// I1 — workspace/suite.json validates all scenarios
{
  const result = validateSuite(suite);
  if (result.valid) {
    pass(`i1-suite-json-validates-all-scenarios (${suite.scenarios.length} scenarios)`);
  } else {
    fail('i1-suite-json-validates-all-scenarios',
      `suite.json failed validation:\n      ${result.errors.join('\n      ')}`);
  }
}

console.log('');
console.log('  Integration: AC2 — outcome-oriented gate evaluation');

// I2 — expectedOutcome present in mock output → pass result
{
  // Use the first scenario from the live suite as the known scenario
  const knownScenario = suite.scenarios.find(s => s.taskId === 's-discovery');
  if (!knownScenario) {
    fail('i2-expected-outcome-present-returns-pass',
      'could not find scenario "s-discovery" in workspace/suite.json');
  } else {
    // Mock gate run output that contains the expectedOutcome string
    const mockGateOutputPass = [
      '[assurance-gate] Running skill evaluation…',
      `[assurance-gate] PASS: ${knownScenario.expectedOutcome}`,
      '[assurance-gate] Evaluation complete',
    ].join('\n');

    const evalResult = evaluateScenario(knownScenario, mockGateOutputPass);

    if (evalResult.result === 'pass') {
      pass('i2-expected-outcome-present-returns-pass');
    } else {
      fail('i2-expected-outcome-present-returns-pass',
        `expected result "pass" when expectedOutcome is in mock output but got "${evalResult.result}"`);
    }
    // Confirm gate did not check procedure (result is purely string-presence based)
    if (evalResult.taskId === knownScenario.taskId) {
      pass('i2-result-records-taskid-not-procedure');
    } else {
      fail('i2-result-records-taskid-not-procedure',
        `expected taskId "${knownScenario.taskId}" but got "${evalResult.taskId}"`);
    }
  }
}

// I3 — expectedOutcome absent from mock output → fail result
{
  const knownScenario = suite.scenarios.find(s => s.taskId === 's-discovery');
  if (!knownScenario) {
    fail('i3-expected-outcome-absent-returns-fail',
      'could not find scenario "s-discovery" in workspace/suite.json');
  } else {
    // Mock gate run output that does NOT contain the expectedOutcome string
    const mockGateOutputFail = [
      '[assurance-gate] Running skill evaluation…',
      '[assurance-gate] No matching outcome found in this run',
      '[assurance-gate] Evaluation complete',
    ].join('\n');

    const evalResult = evaluateScenario(knownScenario, mockGateOutputFail);

    if (evalResult.result === 'fail') {
      pass('i3-expected-outcome-absent-returns-fail');
    } else {
      fail('i3-expected-outcome-absent-returns-fail',
        `expected result "fail" when expectedOutcome is absent from mock output but got "${evalResult.result}"`);
    }
  }
}

console.log('');
console.log('  Integration: AC4 — active scenario cannot be silently skipped');

// I4 — active scenario appears in evaluation set; scenario without retiredReason raises violation
{
  const { active, retired, violations } = parseSuite(suite);

  // Every scenario in suite.json (none have retiredAt) should be active
  if (active.length === suite.scenarios.length) {
    pass(`i4-all-scenarios-in-active-evaluation-set (${active.length} active)`);
  } else {
    fail('i4-all-scenarios-in-active-evaluation-set',
      `expected all ${suite.scenarios.length} scenarios active but found ${active.length} active, ${retired.length} retired, ${violations.length} violations`);
  }

  // No silent-removal violations in the initial suite
  if (violations.length === 0) {
    pass('i4-no-silent-removal-violations-in-initial-suite');
  } else {
    fail('i4-no-silent-removal-violations-in-initial-suite',
      `found unexpected silent-removal violations: ${violations.map(v => v.message).join('; ')}`);
  }

  // A scenario with retiredAt but no retiredReason must raise a violation, not pass silently
  const testSuiteWithSilentRemoval = {
    scenarios: [
      {
        taskId:                  'would-be-silently-removed',
        description:             'Test scenario for I4',
        skillSurfaceCombination: 'discovery/github-copilot',
        expectedOutcome:         'discovery artefact written to artefacts/',
        failurePatternGuarded:   'No artefact written',
        reviewNote:              'Confirmed outcome-oriented',
        retiredAt:               '2026-01-01',
        // retiredReason absent — silent-removal policy violation
      },
    ],
  };
  const { violations: testViolations } = parseSuite(testSuiteWithSilentRemoval);
  if (testViolations.length > 0) {
    pass('i4-scenario-without-retired-reason-raises-violation-not-silent-skip');
  } else {
    fail('i4-scenario-without-retired-reason-raises-violation-not-silent-skip',
      'expected a silent-removal violation but parseSuite returned no violations');
  }
}

// ── NFR tests ─────────────────────────────────────────────────────────────────

console.log('');
console.log('  NFR: Performance, security, audit');

// N1 — full suite evaluation completes within 480 seconds (8 minutes)
{
  // Build a representative mock gate output for timing measurement
  const mockOutput = suite.scenarios
    .map(s => `[gate] PASS: ${s.expectedOutcome}`)
    .join('\n');

  const start    = Date.now();
  evaluateSuite(suite, mockOutput);
  const elapsedMs = Date.now() - start;
  const elapsedSec = elapsedMs / 1000;

  if (elapsedSec < 480) {
    pass(`n1-suite-evaluation-within-480-seconds (completed in ${elapsedMs}ms)`);
  } else {
    fail('n1-suite-evaluation-within-480-seconds',
      `evaluation took ${elapsedSec.toFixed(2)}s — exceeds 480s budget`);
  }
}

// N2 — workspace/suite.json contains no credential-like patterns
{
  const credentialPatterns = [
    { re: /ghp_[A-Za-z0-9]{36,}/,         label: 'GitHub personal access token (ghp_...)' },
    { re: /\bBearer\s+[A-Za-z0-9._\-]{8,}/i, label: 'Bearer token' },
    { re: /\bpassword\s*[:=]\s*\S+/i,      label: 'password field' },
    { re: /\bsecret\s*[:=]\s*\S+/i,        label: 'secret field' },
    { re: /\bapikey\s*[:=]\s*\S+/i,        label: 'apikey field' },
    { re: /\bapi_key\s*[:=]\s*\S+/i,       label: 'api_key field' },
    { re: /\btoken\s*[:=]\s*[A-Za-z0-9._\-]{8,}/i, label: 'token field' },
  ];

  const credFound = [];
  for (const { re, label } of credentialPatterns) {
    if (re.test(suiteRaw)) {
      credFound.push(label);
    }
  }

  if (credFound.length === 0) {
    pass('n2-suite-json-contains-no-credential-patterns');
  } else {
    fail('n2-suite-json-contains-no-credential-patterns',
      `credential-like pattern(s) detected in workspace/suite.json: ${credFound.join(', ')}`);
  }
}

// N3 — every scenario has a non-null, non-empty reviewNote
{
  const missingNotes = suite.scenarios
    .filter(s => !s.reviewNote || typeof s.reviewNote !== 'string' || s.reviewNote.trim() === '')
    .map(s => s.taskId || '(unknown)');

  if (missingNotes.length === 0) {
    pass(`n3-every-scenario-has-non-null-reviewnote (${suite.scenarios.length} scenarios checked)`);
  } else {
    fail('n3-every-scenario-has-non-null-reviewnote',
      `scenarios with missing or null reviewNote: ${missingNotes.join(', ')}`);
  }
}

// ── Final report ──────────────────────────────────────────────────────────────

console.log('');
if (failed > 0) {
  console.error(`[suite-check] Results: ${passed} passed, ${failed} failed`);
  console.error('');
  console.error('[suite-check] Failures:');
  for (const { name, reason } of failures) {
    console.error(`  ✗ ${name}`);
    console.error(`    → ${reason}`);
  }
  process.exit(1);
}

console.log(`[suite-check] Results: ${passed} passed, ${failed} failed`);
process.exit(0);
