'use strict';
// bkn-s1 -- bookkeeping pushes to master start no workflow that adds nothing.
// Parses the workflow files (structure, not text). Plain Node script. Run: node tests/check-bkn-s1-bookkeeping-push-noise.js
// Story: artefacts/2026-11-17-bookkeeping-push-noise/stories/bkn-s1-stop-bookkeeping-push-noise.md
// Test plan: artefacts/2026-11-17-bookkeeping-push-noise/test-plans/bkn-s1-test-plan.md

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const yaml = require('js-yaml');

const root = path.resolve(__dirname, '..');
const dir = path.join(root, '.github', 'workflows');

function load(name) {
  const d = yaml.load(fs.readFileSync(path.join(dir, name), 'utf8'));
  const on = d.on !== undefined ? d.on : d[true]; // YAML 1.1 reads a bare `on` key as boolean true
  return { doc: d, on: typeof on === 'string' ? { [on]: null } : (Array.isArray(on) ? on.reduce(function (o, k) { o[k] = null; return o; }, {}) : (on || {})) };
}

// The bookkeeping paths: the same meaning as staging-deploy.yml's paths-ignore.
const BOOKKEEPING = ['workspace/**', 'artefacts/**', '.github/pipeline-state.json'];
// Push workflows allowed to have no bookkeeping exclusion. Starts empty; an entry needs a reason.
const ALLOWED = {};

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test('T1 Trace Commit ignores bookkeeping paths on a master push (AC1)', function () {
  const { on } = load('trace-commit.yml');
  assert.ok(on.push && (on.push.branches || []).indexOf('master') !== -1, 'trace-commit no longer triggers on master pushes');
  const ig = on.push['paths-ignore'] || [];
  BOOKKEEPING.forEach(function (g) { assert.ok(ig.indexOf(g) !== -1, 'paths-ignore is missing ' + g + ' (has: ' + JSON.stringify(ig) + ')'); });
});

test('T2 Vulnerability Check follows the dependency files, weekly and manually (AC2)', function () {
  const { on } = load('vulnerability-check.yml');
  ['push', 'pull_request'].forEach(function (ev) {
    const p = (on[ev] && on[ev].paths) || [];
    ['package.json', 'package-lock.json'].forEach(function (f) { assert.ok(p.indexOf(f) !== -1, ev + ' paths is missing ' + f + ' (has: ' + JSON.stringify(p) + ')'); });
    assert.ok(!(on[ev] && on[ev]['paths-ignore']), ev + ' mixes paths and paths-ignore');
  });
  assert.ok(Array.isArray(on.schedule) && on.schedule.length === 1 && /^\S+ \S+ \S+ \S+ \S+$/.test(on.schedule[0].cron), 'no weekly schedule');
  assert.ok(Object.prototype.hasOwnProperty.call(on, 'workflow_dispatch'), 'no manual trigger');
});

test('T3 the dreaming workflow has no push trigger, only schedule and manual (AC3)', function () {
  const { on } = load('improvement-agent-schedule.yml');
  assert.ok(!Object.prototype.hasOwnProperty.call(on, 'push'), 'dreaming still triggers on push');
  assert.ok(Array.isArray(on.schedule) && on.schedule.length >= 1, 'dreaming lost its schedule');
  assert.ok(Object.prototype.hasOwnProperty.call(on, 'workflow_dispatch'), 'dreaming lost its manual trigger');
});

test('T4 every workflow that pushes on master excludes bookkeeping (guard) (AC4)', function () {
  const bad = [];
  fs.readdirSync(dir).filter(function (f) { return /\.ya?ml$/.test(f); }).forEach(function (f) {
    const { on } = load(f);
    if (!on.push) return;
    const branches = on.push.branches;
    if (branches && branches.indexOf('master') === -1) return; // never runs on master pushes
    if (ALLOWED[f]) return;
    const ig = on.push['paths-ignore'];
    const paths = on.push.paths;
    const ok = (ig && BOOKKEEPING.every(function (g) { return ig.indexOf(g) !== -1; })) ||
      (paths && paths.length > 0 && !paths.some(function (p) { return /^(workspace|artefacts)\//.test(p) || p === '.github/pipeline-state.json'; }));
    if (!ok) bad.push(f);
  });
  assert.deepStrictEqual(bad, [], 'master push workflows with no bookkeeping exclusion: ' + bad.join(', '));
});

test('T5 every workflow parses and the other tests that read these workflows still pass (AC5)', function () {
  fs.readdirSync(dir).filter(function (f) { return /\.ya?ml$/.test(f); }).forEach(function (f) { load(f); });
  ['tests/check-trace-commit.js', 'tests/check-coha-s3-vulnerability-ci-step.js', 'tests/check-trw1-trace-writer.js'].forEach(function (f) {
    const r = spawnSync(process.execPath, [path.join(root, f)], { cwd: root, encoding: 'utf8', timeout: 90000 });
    assert.strictEqual(r.status, 0, f + ' exited ' + r.status + ': ' + String(r.stdout + r.stderr).slice(-300));
  });
});

let passed = 0; let failed = 0;
tests.forEach(function (t) {
  try { t.fn(); console.log('[bkn-s1] PASS: ' + t.name); passed++; }
  catch (e) { console.error('[bkn-s1] FAIL: ' + t.name + '\n    ' + String(e.message).split('\n').join('\n    ')); failed++; }
});
console.log('\n[bkn-s1] ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
