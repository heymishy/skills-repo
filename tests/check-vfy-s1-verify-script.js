'use strict';
// vfy-s1 -- the verify command: the core lane selection and arguments, the Playwright run's environment,
// the failure digest read from Playwright's JSON report, the exit code, and the busy-port check.
// Plain Node script. Run: node tests/check-vfy-s1-verify-script.js

const assert = require('assert');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const root = path.resolve(__dirname, '..');
const v = require(path.join(root, 'scripts', 'verify.js'));

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

// A Playwright JSON report, trimmed to the fields the digest reads: two failures (one with colour codes in its
// message, one with a second error), one flaky test, one pass.
function fixtureReport() {
  return {
    stats: { expected: 1, unexpected: 2, flaky: 1, skipped: 0 },
    suites: [{
      title: 'a.spec.js', file: 'tests/e2e/a.spec.js',
      specs: [
        { title: 'fails with colour codes', file: 'tests/e2e/a.spec.js', line: 12, column: 1, tests: [{
          status: 'unexpected', results: [{ status: 'failed', retry: 0, errors: [
            { message: '\u001b[31mexpect(locator).toBeVisible()\u001b[39m failed\n\nLocator: #x\nExpected: visible' }] }] }] },
        { title: 'passes', file: 'tests/e2e/a.spec.js', line: 30, column: 1, tests: [{
          status: 'expected', results: [{ status: 'passed', retry: 0, errors: [] }] }] },
      ],
      suites: [{
        title: 'nested', file: 'tests/e2e/b.spec.js',
        specs: [
          { title: 'fails after a retry', file: 'tests/e2e/b.spec.js', line: 4, column: 1, tests: [{
            status: 'unexpected', results: [
              { status: 'failed', retry: 0, errors: [{ message: 'Timeout 5000ms exceeded.\nmore detail' }] },
              { status: 'failed', retry: 1, errors: [{ message: 'second attempt' }] }] }] },
          { title: 'flaky one', file: 'tests/e2e/b.spec.js', line: 9, column: 1, tests: [{
            status: 'flaky', results: [{ status: 'failed', retry: 0, errors: [{ message: 'once' }] }, { status: 'passed', retry: 1, errors: [] }] }] },
        ],
        suites: [],
      }],
    }],
  };
}

test('T1a the default run is the core lane, one worker, in the Playwright JSON reporter', function () {
  const args = v.buildPlaywrightArgs(['tests/e2e/x.spec.js', 'tests/e2e/y.spec.js']);
  assert.ok(args.includes('test'), 'runs playwright test');
  assert.ok(args.includes('tests/e2e/x.spec.js') && args.includes('tests/e2e/y.spec.js'), 'passes the specs');
  assert.ok(args.includes('--workers=1'), 'one worker, as CI runs it');
  assert.ok(args.includes('--reporter=json'), 'JSON reporter, so the digest can be read');
});

test('T1b the environment is the test server environment and points the JSON report at a file', function () {
  const env = v.buildEnv({ PATH: '/bin', SOMETHING: 'kept' }, '/tmp/report.json');
  assert.strictEqual(env.NODE_ENV, 'test');
  assert.strictEqual(env.PLAYWRIGHT_JSON_OUTPUT_NAME, '/tmp/report.json');
  assert.strictEqual(env.SOMETHING, 'kept', 'keeps the caller environment');
});

test('T2a the digest names each failed test with its file, line and first error line', function () {
  const failures = v.readFailures(fixtureReport());
  assert.deepStrictEqual(failures.map(function (f) { return f.title; }), ['fails with colour codes', 'fails after a retry']);
  assert.strictEqual(failures[1].file, 'tests/e2e/b.spec.js');
  assert.strictEqual(failures[1].line, 4);
  const text = v.formatDigest(failures, fixtureReport().stats);
  assert.ok(/fails with colour codes/.test(text) && /tests\/e2e\/a\.spec\.js:12/.test(text), 'title and file:line');
  assert.ok(/Timeout 5000ms exceeded\./.test(text) && !/more detail/.test(text), 'first line only');
});

test('T2b colour codes are removed from the error text', function () {
  const failures = v.readFailures(fixtureReport());
  assert.ok(!/\u001b\[/.test(JSON.stringify(failures)), 'no escape sequences in the digest data');
  assert.ok(!/\u001b\[/.test(v.formatDigest(failures, fixtureReport().stats)), 'no escape sequences in the printed digest');
  assert.ok(/expect\(locator\)\.toBeVisible\(\) failed/.test(failures[0].error));
});

test('T2c a passing run prints no failure entries and a pass count; a flaky test is counted, not failed', function () {
  const passing = { stats: { expected: 39, unexpected: 0, flaky: 1, skipped: 2 }, suites: [] };
  const failures = v.readFailures(passing);
  assert.deepStrictEqual(failures, []);
  const text = v.formatDigest(failures, passing.stats);
  assert.ok(/PASS/.test(text) && /39 passed/.test(text) && /1 flaky/.test(text), text);
  assert.ok(!/FAIL/.test(text));
});

test('T3a the exit code passes the Playwright code through, and 0 when the run is clean', function () {
  assert.strictEqual(v.exitCodeFor(1, []), 1);
  assert.strictEqual(v.exitCodeFor(0, []), 0);
  assert.strictEqual(v.exitCodeFor(1, v.readFailures(fixtureReport())), 1);
  assert.strictEqual(v.exitCodeFor(0, v.readFailures(fixtureReport())), 1, 'a failing report never exits 0');
});

test('T3b a missing report with a non-zero run is still a failure, not a silent pass', function () {
  const text = v.formatDigest([], null);
  assert.ok(/no report/i.test(text), text);
});

test('T4 explicit spec arguments replace the core list; no arguments use the core list', function () {
  assert.deepStrictEqual(v.parseArgs(['tests/e2e/q.spec.js']).specs, ['tests/e2e/q.spec.js']);
  const core = v.parseArgs([]).specs;
  assert.ok(core.length >= 30 && core.every(function (f) { return /^tests\/e2e\/.+\.spec\.js$/.test(f); }), 'core lane');
});

test('T5a a busy port is reported as busy', async function () {
  const srv = net.createServer();
  await new Promise(function (r) { srv.listen(0, '127.0.0.1', r); });
  const port = srv.address().port;
  try { assert.strictEqual(await v.portIsFree(port), false); }
  finally { await new Promise(function (r) { srv.close(r); }); }
});

test('T5b a free port is reported as free', async function () {
  const srv = net.createServer();
  await new Promise(function (r) { srv.listen(0, '127.0.0.1', r); });
  const port = srv.address().port;
  await new Promise(function (r) { srv.close(r); });
  assert.strictEqual(await v.portIsFree(port), true);
});

(async function main() {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); console.log('[vfy-s1] PASS: ' + t.name); passed++; }
    catch (e) { console.error('[vfy-s1] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
  }
  console.log('\n[vfy-s1] ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
