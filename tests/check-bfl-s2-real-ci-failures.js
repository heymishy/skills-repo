'use strict';
// bfl-s2 -- the last three CI failures fixed honestly: a documented C3 carve-out in the pipeline-state integrity check
// (no inflated test count) and a platform-independent source-path guard. The known-failures baseline ends up empty.
// Plain Node script. Run: node tests/check-bfl-s2-real-ci-failures.js
// Story: artefacts/2026-11-16-ci-regression-review/stories/bfl-s2-fix-the-three-real-ci-failures.md
// Test plan: artefacts/2026-11-16-ci-regression-review/test-plans/bfl-s2-test-plan.md

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const INTEGRITY = path.join(ROOT, 'scripts', 'check-pipeline-state-integrity.js');
const CHECKER = path.join(ROOT, 'scripts', 'ci-test-regression-check.js');
const BASELINE = path.join(ROOT, 'tests', 'known-baseline-failures.json');
const { sourceIntegrity, isInsideRepo } = require('../scripts/ci-audit-comment.js');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bfl-s2-'));

// Runs a copy of the integrity script against a one-story state, in its own temporary root.
function runIntegrity(testPlan) {
  const root = fs.mkdtempSync(path.join(tmp, 'root-'));
  fs.mkdirSync(path.join(root, 'scripts')); fs.mkdirSync(path.join(root, '.github'));
  fs.copyFileSync(INTEGRITY, path.join(root, 'scripts', 'check-pipeline-state-integrity.js'));
  const story = { id: 's-1', slug: 's-1', name: 'story', stage: 'definition-of-done', health: 'green', acTotal: 1, acVerified: 1,
    prStatus: 'merged', dorStatus: 'signed-off', testPlan };
  const state = { features: [{ slug: '2026-01-01-synthetic', name: 'synthetic', track: 'short', stage: 'definition', health: 'green', metrics: [], guardrails: [], stories: [story] }] };
  fs.writeFileSync(path.join(root, '.github', 'pipeline-state.json'), JSON.stringify(state, null, 2));
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'check-pipeline-state-integrity.js')], { cwd: root, encoding: 'utf8' });
  return { status: r.status, out: r.stdout + r.stderr };
}
// The integrity script also prints self-test lines that mention check codes; only its "FAIL [Cn]" lines are findings.
const findings = (out) => out.split(/\r?\n/).filter((l) => /^\s*FAIL \[/.test(l));
const TP = (extra) => Object.assign({ status: 'written', totalTests: 5, passing: 4, artefact: 'x.md' }, extra);

test('T1 a documented known failure is accepted by C3 (AC1)', () => {
  const r = runIntegrity(TP({ knownFailing: 1, knownFailingReason: 'RISK-ACCEPT in decisions.md' }));
  assert.ok(!findings(r.out).some((l) => l.indexOf('[C3]') !== -1), 'C3 fired: ' + findings(r.out).join(' | '));
  assert.strictEqual(r.status, 0, 'exit ' + r.status + ': ' + r.out.slice(0, 300));
});

test('T2 a known failure without a written reason is refused (AC1)', () => {
  for (const reason of [undefined, '', '   ']) {
    const r = runIntegrity(TP(reason === undefined ? { knownFailing: 1 } : { knownFailing: 1, knownFailingReason: reason }));
    assert.strictEqual(r.status, 1, 'reason ' + JSON.stringify(reason) + ' exit ' + r.status + ': ' + r.out.slice(0, 200));
    assert.ok(findings(r.out).some((l) => l.indexOf('[C3]') !== -1 && /reason/i.test(l)), 'C3 and the missing reason are not named: ' + findings(r.out).join(' | '));
  }
});

test('T3 the carve-out does not hide a genuinely missing test (AC1)', () => {
  const r = runIntegrity(TP({ passing: 3, knownFailing: 1, knownFailingReason: 'RISK-ACCEPT in decisions.md' }));
  assert.strictEqual(r.status, 1, 'exit ' + r.status);
  assert.ok(findings(r.out).some((l) => l.indexOf('[C3]') !== -1), 'C3 not reported: ' + findings(r.out).join(' | '));
});

test('T4 passing plus known failing above the total is an over-count (AC1)', () => {
  const r = runIntegrity(TP({ passing: 4, knownFailing: 2, knownFailingReason: 'RISK-ACCEPT in decisions.md' }));
  assert.strictEqual(r.status, 1, 'exit ' + r.status);
  assert.ok(findings(r.out).some((l) => l.indexOf('[C2]') !== -1), 'C2 not reported: ' + findings(r.out).join(' | '));
});

test('T5 the real state keeps the honest 4 of 5 for tfhc-s1 with a written reason, and the real check exits 0 (AC2)', () => {
  const s = JSON.parse(fs.readFileSync(path.join(ROOT, '.github', 'pipeline-state.json'), 'utf8'));
  const f = s.features.find((x) => x.slug === '2026-10-30-test-fixture-hardening-continuation');
  const st = [].concat(f.stories || [], ...(f.epics || []).map((e) => e.stories || [])).find((x) => x.id === 'tfhc-s1' || x.slug === 'tfhc-s1');
  assert.ok(st, 'tfhc-s1 not found');
  assert.strictEqual(st.testPlan.passing, 4, 'passing must stay the honest 4');
  assert.strictEqual(st.testPlan.knownFailing, 1);
  assert.ok(/decisions\.md/.test(st.testPlan.knownFailingReason || ''), 'reason must name decisions.md');
  const r = spawnSync(process.execPath, [INTEGRITY], { cwd: ROOT, encoding: 'utf8' });
  assert.strictEqual(r.status, 0, 'real integrity check exit ' + r.status + ': ' + (r.stdout + r.stderr).slice(0, 300));
});

const VECTORS = [
  '../../etc/passwd',
  '../../../etc/passwd',
  '..\\..\\.\\Windows\\System32\\config\\SAM',
  '/etc/passwd',
  'C:\\Windows\\System32\\config\\SAM',
  'artefacts/../../../etc/passwd'
];
const VALID = ['README.md', 'scripts/ci-audit-comment.js', 'artefacts/a/b.md'];

function checkRules(label, pathApi, repoRoot, absoluteInside, absoluteOutside) {
  assert.strictEqual(typeof isInsideRepo, 'function', 'isInsideRepo is not exported');
  VECTORS.concat(absoluteOutside).forEach((v) => assert.strictEqual(isInsideRepo(v, repoRoot, pathApi), false, label + ' must reject ' + v));
  VALID.concat(absoluteInside).forEach((v) => assert.strictEqual(isInsideRepo(v, repoRoot, pathApi), true, label + ' must accept ' + v));
}
// An absolute path inside the repository stays valid (gpa-sc07 passes one); a sibling directory that merely starts with the same name is outside.
test('T6 under Linux path rules all six vectors are rejected and valid paths accepted (AC3)', () => checkRules('posix', path.posix, '/repo', ['/repo/package.json'], ['/repo-other/x']));
test('T7 under Windows path rules all six vectors are rejected and valid paths accepted (AC3)', () => checkRules('win32', path.win32, 'C:\\repo', ['C:\\repo\\package.json'], ['C:\\repo-other\\x']));

test('T8 sourceIntegrity gives the same answers from another working directory (AC4)', () => {
  const cwd = process.cwd();
  try {
    process.chdir(os.tmpdir());
    assert.strictEqual(sourceIntegrity('README.md', null), '\u2014', 'a valid in-repo path was flagged from another cwd');
    VECTORS.forEach((v) => assert.deepStrictEqual(sourceIntegrity(v, null), { traversal: true, sanitisedPath: '[REDACTED]' }, 'not flagged: ' + v));
  } finally { process.chdir(cwd); }
});

function checkerWith(failed) {
  const log = path.join(tmp, 'log-' + Math.random().toString(36).slice(2) + '.txt');
  const body = ['[run-all-tests] 867 file(s) run, ' + failed.length + ' failed, 1000ms'];
  if (failed.length) { body.push('[run-all-tests] Failed files (' + failed.length + '):'); failed.forEach((f) => body.push('  - ' + f)); }
  fs.writeFileSync(log, body.join('\n') + '\n');
  return spawnSync(process.execPath, [CHECKER, log], { cwd: ROOT, encoding: 'utf8' });
}
test('T9 the baseline is empty, a clean run exits 0 and any failing file exits 1 (AC5)', () => {
  const b = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  assert.deepStrictEqual(b.files, [], 'baseline still lists ' + JSON.stringify(b.files));
  const clean = checkerWith([]);
  assert.strictEqual(clean.status, 0, 'clean exit ' + clean.status + ': ' + (clean.stdout + clean.stderr).slice(0, 200));
  assert.ok(clean.stdout.indexOf('0 file(s) currently failing, 0 in known baseline') !== -1, clean.stdout.slice(0, 200));
  const bad = checkerWith(['tests/x.js']);
  assert.strictEqual(bad.status, 1, 'failing exit ' + bad.status);
  assert.ok(bad.stderr.indexOf('tests/x.js') !== -1, 'the failing file is not named');
});

(async () => {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch (e) { failed++; console.log('  FAIL ' + t.name + ' -- ' + (e && e.message)); }
  }
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* temp cleanup is best effort */ }
  console.log('[bfl-s2-real-ci-failures] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
