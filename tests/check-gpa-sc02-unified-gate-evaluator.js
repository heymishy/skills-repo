'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

const PREFIX = '[gpa-sc02]';
let passed = 0; let failed = 0;
function test(name, fn) {
  try { fn(); console.log(PREFIX + ' PASS: ' + name); passed++; }
  catch(e) { console.error(PREFIX + ' FAIL: ' + name + ' — ' + e.message); failed++; }
}

// T1 — structural gate all-pass
test('T1 — evaluateGate structural all-pass returns {passed:true, findings:[]}', function() {
  const { evaluateGate } = require('../src/enforcement/governance-package');
  const result = evaluateGate({
    gate: 'structural',
    context: {
      checks: [
        { name: 'workspace-state-valid',   passed: true },
        { name: 'pipeline-state-valid',    passed: true },
        { name: 'artefacts-dir-exists',    passed: true },
        { name: 'governance-gates-exists', passed: true },
      ],
    },
  });
  assert.strictEqual(result.passed, true);
  assert.deepStrictEqual(result.findings, []);
});

// T2 — structural gate one-fail with reason
test('T2 — evaluateGate structural one-fail returns reason in findings', function() {
  const { evaluateGate } = require('../src/enforcement/governance-package');
  const result = evaluateGate({
    gate: 'structural',
    context: {
      checks: [
        { name: 'workspace-state-valid',   passed: false, reason: 'workspace/state.json not found' },
        { name: 'pipeline-state-valid',    passed: true },
        { name: 'artefacts-dir-exists',    passed: true },
        { name: 'governance-gates-exists', passed: true },
      ],
    },
  });
  assert.strictEqual(result.passed, false);
  assert.deepStrictEqual(result.findings, ['workspace/state.json not found']);
});

// T3 — structural gate multiple failures
test('T3 — evaluateGate structural multiple-fail collects all reasons', function() {
  const { evaluateGate } = require('../src/enforcement/governance-package');
  const result = evaluateGate({
    gate: 'structural',
    context: {
      checks: [
        { name: 'workspace-state-valid',   passed: false, reason: 'workspace/state.json not found' },
        { name: 'pipeline-state-valid',    passed: true },
        { name: 'artefacts-dir-exists',    passed: true },
        { name: 'governance-gates-exists', passed: false, reason: '.github/governance-gates.yml not found' },
      ],
    },
  });
  assert.strictEqual(result.passed, false);
  assert.deepStrictEqual(result.findings, ['workspace/state.json not found', '.github/governance-gates.yml not found']);
});

// T4 — source references governance-package
test('T4 — run-assurance-gate.js references governance-package', function() {
  const src = fs.readFileSync(path.join(__dirname, '../.github/scripts/run-assurance-gate.js'), 'utf8');
  assert.ok(src.includes('governance-package'), 'source must reference governance-package');
});

// T5 — source calls evaluateGate with structural gate
test('T5 — run-assurance-gate.js calls evaluateGate with structural gate', function() {
  const src = fs.readFileSync(path.join(__dirname, '../.github/scripts/run-assurance-gate.js'), 'utf8');
  assert.ok(src.includes('evaluateGate'), 'source must call evaluateGate');
  assert.ok(src.includes("'structural'") || src.includes('"structural"'), "source must reference 'structural' gate");
});

// T6 — try/catch around governance-package require (NFR)
test('T6 — run-assurance-gate.js has try/catch wrapping governance-package require', function() {
  const src = fs.readFileSync(path.join(__dirname, '../.github/scripts/run-assurance-gate.js'), 'utf8');
  // Both 'try' and 'governance-package' must appear, and try must come before governance-package in the require block
  const tryIdx = src.indexOf('try');
  const gpIdx  = src.indexOf('governance-package');
  assert.ok(tryIdx !== -1, 'source must contain try block');
  assert.ok(gpIdx  !== -1, 'source must reference governance-package');
  // try block must appear before or very close to the governance-package require
  assert.ok(tryIdx < gpIdx, 'try block must precede governance-package reference');
});

// IT1 — evaluateGateRunner hook is called when provided
test('IT1 — evaluateGateRunner hook is called when provided in ctx', function() {
  const { runGate } = require('../.github/scripts/run-assurance-gate');
  const tmpDir  = fs.mkdtempSync(path.join(os.tmpdir(), 'sc02-it1-'));
  const fakeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sc02-root1-'));
  fs.mkdirSync(path.join(fakeRoot, 'workspace'));
  fs.writeFileSync(path.join(fakeRoot, 'workspace', 'state.json'), '{}');
  fs.mkdirSync(path.join(fakeRoot, '.github'), { recursive: true });
  fs.writeFileSync(path.join(fakeRoot, '.github', 'pipeline-state.json'), '{}');
  fs.mkdirSync(path.join(fakeRoot, 'artefacts'));
  fs.writeFileSync(path.join(fakeRoot, '.github', 'governance-gates.yml'), 'gates: []');
  let called = false;
  function mockEGRunner(args) { called = true; return { passed: true, findings: [] }; }
  runGate({ trigger: 'test', prRef: '', commitSha: 'abc', tracesDir: tmpDir, root: fakeRoot, evaluateGateRunner: mockEGRunner });
  assert.ok(called, 'evaluateGateRunner must be called');
});

// IT2 — evaluateGateRunner receives correct arguments
test('IT2 — evaluateGateRunner receives gate:structural and 4 check names', function() {
  const { runGate } = require('../.github/scripts/run-assurance-gate');
  const tmpDir   = fs.mkdtempSync(path.join(os.tmpdir(), 'sc02-it2-'));
  const fakeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sc02-root2-'));
  fs.mkdirSync(path.join(fakeRoot, 'workspace'));
  fs.writeFileSync(path.join(fakeRoot, 'workspace', 'state.json'), '{}');
  fs.mkdirSync(path.join(fakeRoot, '.github'), { recursive: true });
  fs.writeFileSync(path.join(fakeRoot, '.github', 'pipeline-state.json'), '{}');
  fs.mkdirSync(path.join(fakeRoot, 'artefacts'));
  fs.writeFileSync(path.join(fakeRoot, '.github', 'governance-gates.yml'), 'gates: []');
  let capturedArgs = null;
  function mockEGRunner(args) { capturedArgs = args; return { passed: true, findings: [] }; }
  runGate({ trigger: 'test', prRef: '', commitSha: 'abc', tracesDir: tmpDir, root: fakeRoot, evaluateGateRunner: mockEGRunner });
  assert.ok(capturedArgs !== null, 'evaluateGateRunner must be called with args');
  assert.strictEqual(capturedArgs.gate, 'structural', 'gate must be structural');
  assert.ok(capturedArgs.context && Array.isArray(capturedArgs.context.checks), 'context.checks must be an array');
  const checkNames = capturedArgs.context.checks.map(function(c) { return c.name; });
  ['workspace-state-valid', 'pipeline-state-valid', 'artefacts-dir-exists', 'governance-gates-exists']
    .forEach(function(n) { assert.ok(checkNames.includes(n), 'checks must include ' + n); });
});

// IT3 — verdict derived from evaluateGateRunner, not inline checks
test('IT3 — verdict derived from evaluateGateRunner return, not inline checks.every', function() {
  const { runGate } = require('../.github/scripts/run-assurance-gate');
  const tmpDir   = fs.mkdtempSync(path.join(os.tmpdir(), 'sc02-it3-'));
  const fakeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sc02-root3-'));
  fs.mkdirSync(path.join(fakeRoot, 'workspace'));
  fs.writeFileSync(path.join(fakeRoot, 'workspace', 'state.json'), '{}');
  fs.mkdirSync(path.join(fakeRoot, '.github'), { recursive: true });
  fs.writeFileSync(path.join(fakeRoot, '.github', 'pipeline-state.json'), '{}');
  fs.mkdirSync(path.join(fakeRoot, 'artefacts'));
  fs.writeFileSync(path.join(fakeRoot, '.github', 'governance-gates.yml'), 'gates: []');
  // checksRunner: all checks fail; evaluateGateRunner: returns pass
  // Before SC-02: verdict = 'fail' (inline checks.every)
  // After SC-02:  verdict = 'pass' (from evaluateGateRunner)
  function mockChecksRunner() {
    return [
      { name: 'workspace-state-valid',   passed: false, reason: 'injected-fail' },
      { name: 'pipeline-state-valid',    passed: false, reason: 'injected-fail' },
      { name: 'artefacts-dir-exists',    passed: false, reason: 'injected-fail' },
      { name: 'governance-gates-exists', passed: false, reason: 'injected-fail' },
    ];
  }
  function mockEGRunner() { return { passed: true, findings: [] }; }
  const result = runGate({
    trigger: 'test', prRef: '', commitSha: 'abc', tracesDir: tmpDir, root: fakeRoot,
    checksRunner: mockChecksRunner, evaluateGateRunner: mockEGRunner,
  });
  assert.strictEqual(result.verdict, 'pass', 'verdict must come from evaluateGateRunner (pass), not inline checks (fail)');
});

console.log('\n' + PREFIX + ' Results: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
