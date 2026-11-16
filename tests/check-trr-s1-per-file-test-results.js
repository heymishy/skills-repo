'use strict';
// trr-s1 -- every CI run saves each test file's pass/fail, duration and first failing line as test-results.json.
// Plain Node script. Run: node tests/check-trr-s1-per-file-test-results.js
// Story: artefacts/2026-11-16-ci-regression-review/stories/trr-s1-record-per-test-file-results.md
// Test plan: artefacts/2026-11-16-ci-regression-review/test-plans/trr-s1-test-plan.md

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const runner = require('../scripts/run-all-tests');
const ROOT = path.join(__dirname, '..');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trr-s1-'));
function fixture(name, body) { const p = path.join(dir, name); fs.writeFileSync(p, body); return p; }
const PASS = fixture('check-pass.js', "console.log('  ok   T1 fine'); process.exit(0);");
const NOISY = fixture('check-noisy.js', "for (let i = 0; i < 50; i++) console.log('line ' + i); process.exit(0);");
const FAIL = fixture('check-fail.js', "console.log('  ok   T1 fine'); console.log('  FAIL T2 compares -- AssertionError: expected 1 to equal 2'); console.log('  trailing detail line'); process.exit(1);");
const HANG = fixture('check-hang.js', "setInterval(function () {}, 1000);");
const FILES = [PASS, NOISY, FAIL, HANG];
// The runner flushes each child's output to this process's stdout and stderr; keep fixture output out of the test log.
async function run(files, opts) {
  const so = process.stdout.write; const se = process.stderr.write;
  process.stdout.write = () => true; process.stderr.write = () => true;
  try { return await runner.runFilesConcurrently(files, opts); } finally { process.stdout.write = so; process.stderr.write = se; }
}


test('T1 the results file lists every file with status and duration, and the counts equal the runner\'s own (AC1)', async () => {
  const r = await run(FILES, { concurrency: 2, timeoutMs: 1500, cwd: dir });
  assert.ok(Array.isArray(r.results), 'runFilesConcurrently returned no results array');
  assert.strictEqual(r.results.length, FILES.length);
  const out = path.join(dir, 'out-t1.json');
  assert.strictEqual(runner.writeTestResults(out, r.results, r.elapsedMs), true);
  const j = JSON.parse(fs.readFileSync(out, 'utf8'));
  assert.strictEqual(j.files.length, FILES.length);
  j.files.forEach((f) => { assert.ok(['pass', 'fail', 'timeout'].indexOf(f.status) !== -1, f.file + ' status ' + f.status); assert.strictEqual(typeof f.durationMs, 'number'); assert.ok('exitCode' in f); });
  assert.strictEqual(j.summary.total, FILES.length);
  assert.strictEqual(j.summary.failed, r.failedFiles.length, 'failed count differs from the runner\'s own failedFiles');
  assert.strictEqual(j.summary.passed, j.files.filter((f) => f.status === 'pass').length);
});

test('T2 the first-failing-line extractor is bounded, ordered and never throws (AC2, NFR)', () => {
  const x = runner.extractFirstFailure;
  assert.strictEqual(typeof x, 'function');
  assert.strictEqual(x('  ok   a\n  FAIL T2 b -- why\n  FAIL T3 c'), '  FAIL T2 b -- why');
  assert.strictEqual(x('fine\nAssertionError: expected 1 to equal 2\nmore'), 'AssertionError: expected 1 to equal 2');
  assert.strictEqual(x('fine\n✗ broken thing'), '✗ broken thing');
  assert.strictEqual(x('Error: boom\nat x'), 'Error: boom');
  assert.strictEqual(x('all good\nnothing here'), '');
  assert.strictEqual(x('FAIL ' + 'x'.repeat(1000)).length, 300);
  [undefined, null, 42, {}, '', Buffer.from('FAIL buf')].forEach((v) => assert.doesNotThrow(() => x(v)));
  assert.strictEqual(x(Buffer.from('FAIL buf')), 'FAIL buf');
});

test('T3 a failing file carries its exit code and first failing line; a hung file is a timeout (AC2)', async () => {
  const r = await run([FAIL, HANG, PASS], { concurrency: 3, timeoutMs: 800, cwd: dir });
  const by = {}; r.results.forEach((x) => { by[path.basename(x.file)] = x; });
  assert.strictEqual(by['check-fail.js'].status, 'fail');
  assert.strictEqual(by['check-fail.js'].exitCode, 1);
  assert.strictEqual(by['check-fail.js'].firstFailure, '  FAIL T2 compares -- AssertionError: expected 1 to equal 2');
  assert.strictEqual(by['check-hang.js'].status, 'timeout');
  assert.strictEqual(by['check-pass.js'].status, 'pass');
  assert.strictEqual(by['check-pass.js'].firstFailure, '');
  assert.deepStrictEqual(r.failedFiles.map((f) => path.basename(f)).sort(), ['check-fail.js', 'check-hang.js']);
});

test('T4 CI uploads the file after the unit chain, always, for 90 days; the file is git-ignored (AC3)', () => {
  const wf = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'pr-checks.yml'), 'utf8').replace(/\r\n/g, '\n');
  const chain = wf.indexOf('name: Unit test chain');
  const up = wf.indexOf('actions/upload-artifact', chain);
  assert.ok(chain !== -1 && up > chain, 'no upload-artifact step after the Unit test chain step');
  const step = wf.slice(up, up + 600);
  assert.ok(/test-results-\$\{\{\s*github\.run_id\s*\}\}/.test(wf.slice(chain)), 'artefact name does not include the run id');
  assert.ok(step.indexOf('test-results.json') !== -1, 'path is not test-results.json');
  assert.ok(/retention-days:\s*90/.test(step), 'retention is not 90 days');
  assert.ok(/if:\s*always\(\)/.test(wf.slice(chain, up + 200)), 'upload is not if: always()');
  const gi = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8').split(/\r?\n/).map((l) => l.trim());
  assert.ok(gi.indexOf('test-results.json') !== -1, '.gitignore does not list test-results.json');
});

test('T5 an unwritable results path never changes the outcome and logs one warning (AC4)', () => {
  const warns = []; const orig = console.warn; console.warn = (...a) => warns.push(a.join(' '));
  let ret;
  try { ret = runner.writeTestResults(path.join(dir, 'no', 'such', 'dir', 'x.json'), [{ file: 'a', status: 'pass', exitCode: 0, durationMs: 1, firstFailure: '' }], 5); }
  finally { console.warn = orig; }
  assert.strictEqual(ret, false);
  assert.strictEqual(warns.length, 1, 'expected one warning, got ' + warns.length);
  assert.ok(warns[0].indexOf('test-results') !== -1);
  const orig2 = console.warn; console.warn = () => {};
  try { assert.doesNotThrow(() => runner.writeTestResults(undefined, undefined, undefined)); } finally { console.warn = orig2; }
});

test('T6 the runner\'s existing contract is unchanged (AC5); tfhc-s9 and pcr-s1 run in the full suite as before', async () => {
  ['discoverTestFiles', 'GRANDFATHER_LIST', 'SEQUENTIAL_EXCLUSIVE_LIST', 'getAllTestFiles', 'runFilesConcurrently', 'getPoolConcurrency', 'runAll'].forEach((k) => assert.ok(k in runner, 'export missing: ' + k));
  assert.strictEqual(runner.GRANDFATHER_LIST.length, 16, 'the grandfather list changed');
  const r = await run([PASS, FAIL], { concurrency: 2, timeoutMs: 1500, cwd: dir });
  assert.strictEqual(typeof r.elapsedMs, 'number');
  assert.deepStrictEqual(r.failedFiles.map((f) => path.basename(f)), ['check-fail.js'], 'failedFiles semantics changed');
  const empty = await run([], { cwd: dir });
  assert.deepStrictEqual([empty.failedFiles.length, empty.results.length], [0, 0]);
});

(async () => {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch (e) { failed++; console.log('  FAIL ' + t.name + ' -- ' + (e && e.message)); }
  }
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) { /* temp cleanup is best effort */ }
  console.log('[trr-s1-per-file-test-results] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
