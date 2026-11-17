'use strict';
// gic-s1 T4 (AC1, AC2, AC3) -- workflow text: the three required-style jobs read their flag from the base branch, the
// reporting workflow cannot run pull-request code, and the unit job supplies master's baseline. The project has no YAML
// parser, so the text is read by hand. Plain Node script. Run: node tests/check-gic-s1-workflows.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const tests = [];
function test(name, fn) { tests.push({ name: name, fn: fn }); }
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8').replace(/\r\n/g, '\n'); }

/** The text of one job: from its `  key:` line (inside `jobs:`) to the next job key. */
function jobBlock(text, jobName) {
  const at = text.indexOf('\njobs:');
  const lines = (at === -1 ? text : text.slice(at)).split('\n');
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^ {2}[A-Za-z0-9_-]+:\s*$/.test(lines[i]) && new RegExp('^\\s+name:\\s*[\'"]?' + jobName.replace(/[.*+?^${}()|[\]\\()]/g, '\\$&') + '[\'"]?\\s*$', 'm').test(lines.slice(i + 1, i + 6).join('\n'))) { start = i; break; }
  }
  if (start === -1) return '';
  let end = lines.length;
  for (let j = start + 1; j < lines.length; j++) { if (/^ {2}[A-Za-z0-9_-]+:\s*$/.test(lines[j])) { end = j; break; } }
  return lines.slice(start, end).join('\n');
}

const JOBS = [
  ['.github/workflows/e2e.yml', 'Scenario A E2E (staging)', 'audit.staging_e2e_scenario_a'],
  ['.github/workflows/e2e.yml', 'Scenario B E2E (staging)', 'audit.staging_e2e_scenario_b'],
  ['.github/workflows/core-browser-tests.yml', 'Core browser tests', 'audit.core_browser_tests']
];

JOBS.forEach(function (j) {
  test('T4a "' + j[1] + '" reads its flag through scripts/read-base-flag.js from the base branch, not from the checkout', function () {
    const job = jobBlock(read(j[0]), j[1]);
    assert.ok(job, 'job not found');
    assert.ok(job.indexOf('scripts/read-base-flag.js') !== -1 && job.indexOf(j[2]) !== -1, 'must call the reader with ' + j[2]);
    assert.ok(/git fetch[^\n]*origin/.test(job) && /github\.base_ref/.test(job), 'must fetch the base ref (github.base_ref)');
    assert.ok(/git show[^\n]*scripts\/read-base-flag\.js/.test(job), 'the reader itself must also be read from the base branch');
    assert.ok(!/yq e[^\n]*context\.yml/.test(job) && !/grep -q[^\n]*context\.yml/.test(job), 'must no longer read the checkout\'s context.yml with yq or grep');
  });
});

test('T4b gate-files-changed.yml triggers on pull_request_target only and cannot run pull-request code', function () {
  const t = read('.github/workflows/gate-files-changed.yml');
  const on = t.split(/\njobs:/)[0];
  assert.ok(/pull_request_target:/.test(on) && !/^\s*pull_request:/m.test(on), 'trigger must be pull_request_target only');
  assert.ok(!/github\.head_ref/.test(t) && !/github\.event\.pull_request\.head/.test(t), 'must never refer to the pull request head');
  assert.ok(!/ref:\s*\$\{\{/.test(t), 'must not check out a computed ref');
  assert.ok(!/npm (ci|install)|yarn|pip install/.test(t), 'must not install anything');
  const perms = (t.match(/permissions:\n((?:\s{2,}\S.*\n)+)/) || [])[1] || '';
  assert.ok(/contents:\s*read/.test(perms) && /pull-requests:\s*write/.test(perms), 'permissions must be contents: read and pull-requests: write');
  assert.ok(!/(issues|actions|packages|id-token|checks|statuses|deployments):\s*write/.test(perms) && !/contents:\s*write/.test(perms), 'no other write permission');
});

test('T4c the reporting workflow never fails on a match in observe mode', function () {
  const t = read('.github/workflows/gate-files-changed.yml');
  assert.ok(!/exit 1/.test(t), 'no step may exit 1');
  assert.ok(!/continue-on-error:\s*false/.test(t));
});

test('T4d the unit job fetches master\'s baseline and passes it to the regression check', function () {
  const t = read('.github/workflows/pr-checks.yml');
  assert.ok(/known-baseline-failures\.json/.test(t) && /git (show|cat-file)[^\n]*known-baseline-failures\.json/.test(t), 'must read the baseline from the base ref');
  assert.ok(/ci-test-regression-check\.js\s+test-output\.log[^\n]*base/.test(t), 'must pass the base baseline to the check');
});

let passed = 0; let failed = 0;
tests.forEach(function (t) {
  try { t.fn(); console.log('[gic-s1] PASS: ' + t.name); passed++; }
  catch (e) { console.error('[gic-s1] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
});
console.log('\n[gic-s1] ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
