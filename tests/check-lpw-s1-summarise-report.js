'use strict';
// lpw-s1 T5 (AC6, AC7) -- the job-summary script turns a Playwright JSON report and a c8 summary into Markdown.
// Plain Node script. Run: node tests/check-lpw-s1-summarise-report.js

const assert = require('assert');
const path = require('path');
const { spawnSync } = require('child_process');
const { summariseReport, summariseCoverage } = require(path.resolve(__dirname, '..', 'scripts', 'summarise-playwright-report'));

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const REPORT = {
  suites: [
    { file: 'a-good.spec.js', specs: [
      { title: 'one', file: 'a-good.spec.js', tests: [{ status: 'expected', results: [{ duration: 1500 }] }, { status: 'skipped', results: [] }] }
    ] },
    { file: 'b-bad.spec.js', specs: [
      { title: 'two', file: 'b-bad.spec.js', tests: [{ status: 'unexpected', results: [{ duration: 4000 }, { duration: 6000 }] }, { status: 'flaky', results: [{ duration: 2000 }] }] }
    ], suites: [
      { specs: [{ title: 'nested', file: 'b-bad.spec.js', tests: [{ status: 'expected', results: [{ duration: 500 }] }] }] }
    ] }
  ]
};

test('T5a the report table counts passed, failed, flaky and skipped per spec file and lists failures first', function () {
  const md = summariseReport(REPORT);
  assert.ok(md.indexOf('2 passed, 1 failed, 1 flaky, 1 skipped across 2 spec files') !== -1, 'totals line missing: ' + md);
  const rows = md.split('\n').filter(function (l) { return /^\| .*spec\.js/.test(l); });
  assert.strictEqual(rows.length, 2);
  assert.ok(rows[0].indexOf('b-bad.spec.js') !== -1, 'the failing spec must come first');
  assert.ok(/\| b-bad\.spec\.js \| 1 \| 1 \| 1 \| 0 \| 9 \|/.test(rows[0]), 'b-bad row wrong (last attempt duration only: 6+2+0.5 = 8.5, rounds to 9): ' + rows[0]);
  assert.ok(/\| a-good\.spec\.js \| 1 \| 0 \| 0 \| 1 \| 2 \|/.test(rows[1]), 'a-good row wrong: ' + rows[1]);
});

test('T5b an empty or missing report gives a note, not a throw', function () {
  assert.ok(summariseReport({}).indexOf('No tests were recorded') !== -1);
  assert.ok(summariseReport(null).indexOf('No tests were recorded') !== -1);
});

test('T5c the coverage table shows the totals and the least-covered files first', function () {
  const summary = {
    total: { lines: { pct: 61.234 }, functions: { pct: 55 }, statements: { pct: 60 }, branches: { pct: 40 } },
    'C:\\repo\\src\\web-ui\\routes\\a.js': { lines: { pct: 90 }, functions: { pct: 80 } },
    '/home/runner/work/x/x/src/web-ui/routes/b.js': { lines: { pct: 10 }, functions: { pct: 0 } },
    '/home/runner/work/x/x/src/web-ui/server.js': { lines: { pct: 50 }, functions: { pct: 40 } }
  };
  const md = summariseCoverage(summary, 2);
  assert.ok(md.indexOf('Lines 61.2%') !== -1 && md.indexOf('functions 55.0%') !== -1, 'totals wrong: ' + md);
  const rows = md.split('\n').filter(function (l) { return /^\| src\//.test(l); });
  assert.strictEqual(rows.length, 2, 'top N not honoured');
  assert.ok(rows[0].indexOf('src/web-ui/routes/b.js') !== -1, 'least covered must be first: ' + rows[0]);
  assert.ok(summariseCoverage(null).indexOf('No coverage summary') !== -1);
});

test('T5e a coverage summary with no files says so instead of showing zeros', function () {
  const md = summariseCoverage({ total: { lines: { pct: 0 } } });
  assert.ok(md.indexOf('No server coverage was recorded') !== -1, md);
});

test('T5d the command line never fails the job: a missing file prints a note and exits 0', function () {
  const r = spawnSync(process.execPath, [path.resolve(__dirname, '..', 'scripts', 'summarise-playwright-report.js'), 'report', path.join(__dirname, 'no-such-report.json')], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0);
  assert.ok(r.stdout.indexOf('No report to summarise') !== -1, r.stdout);
});

let passed = 0; let failed = 0;
tests.forEach(function (t) {
  try { t.fn(); console.log('[lpw-s1] PASS: ' + t.name); passed++; }
  catch (e) { console.error('[lpw-s1] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
});
console.log('\n[lpw-s1] ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
