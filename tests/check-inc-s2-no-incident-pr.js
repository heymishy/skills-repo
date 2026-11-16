'use strict';
// inc-s2 -- no incident-record pull request per production error issue: the workflow that opened them is removed.
// The GitHub issue (opened by the error bridge) is the record; the fix is a short-track story and a normal PR.
// Plain Node script. Run: node tests/check-inc-s2-no-incident-pr.js
// Story: artefacts/2026-11-16-ci-regression-review/stories/inc-s2-record-incidents-in-the-fix-pr.md
// Test plan: artefacts/2026-11-16-ci-regression-review/test-plans/inc-s2-test-plan.md

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WORKFLOWS = path.join(ROOT, '.github', 'workflows');
const REMOVED = 'error-issue-incident-' + 'record'; // built in two parts so this file does not contain the removed name whole

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

// The top-level trigger names of a workflow file (no YAML dependency: the block runs until the next column-0 key).
function triggers(yaml) {
  const lines = yaml.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((l) => /^on:\s*$/.test(l));
  if (start === -1) return [];
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\S/.test(lines[i]) && !/^#/.test(lines[i])) break;
    const m = lines[i].match(/^  ([A-Za-z_]+):/);
    if (m) out.push(m[1]);
  }
  return out;
}

test('T1 the incident-record workflow is gone and no workflow reacts to issue events (AC1)', () => {
  assert.ok(!fs.existsSync(path.join(WORKFLOWS, REMOVED + '.yml')), 'the workflow file still exists');
  const offenders = fs.readdirSync(WORKFLOWS).filter((f) => /\.ya?ml$/.test(f)).filter((f) => triggers(fs.readFileSync(path.join(WORKFLOWS, f), 'utf8')).indexOf('issues') !== -1);
  assert.deepStrictEqual(offenders, [], 'workflows with an issues trigger: ' + offenders.join(', '));
});

test('T2 the coha-s7 test no longer reads the workflow; its logic tests and a credential scan remain (AC2)', () => {
  const src = fs.readFileSync(path.join(ROOT, 'tests', 'check-coha-s7-error-issue-incident.js'), 'utf8');
  assert.ok(src.indexOf(REMOVED) === -1, 'the test still names the removed workflow');
  assert.ok(!/const WORKFLOW\b/.test(src), 'the WORKFLOW constant is still declared');
  ['cwt_UT1', 'cwt_UT2'].concat(Array.from({ length: 13 }, (_, i) => 'W' + (i + 1))).forEach((id) => {
    if (id === 'W12') return; // the credential scan is kept under a new name
    assert.ok(!new RegExp("test\\('" + id + "\\b").test(src), 'the workflow test ' + id + ' is still present');
  });
  ['U1 ', 'U6 ', 'U14 ', 'I1 ', 'I2 ', 'N1 ', 'N2 '].forEach((id) => assert.ok(new RegExp("test\\('" + id).test(src), 'the logic test ' + id.trim() + ' is missing'));
  assert.ok(/test\('S1 no credential in the script, library or this test/.test(src), 'the credential scan is missing');
});

test('T3 the error bridge that opens the GitHub issue is still there (AC3)', () => {
  const bridge = require('../src/web-ui/routes/error-bridge');
  assert.strictEqual(typeof bridge.handlePostErrorBridge, 'function', 'handlePostErrorBridge is not exported');
});

test('T4 nothing outside artefacts, workspace and worktrees refers to the removed workflow (AC4)', () => {
  const skipDirs = new Set(['node_modules', '.git', 'artefacts', 'workspace', '.worktrees', '.claude']);
  const hits = [];
  (function walk(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!skipDirs.has(e.name)) walk(p); return; }
      if (!/\.(js|json|md|ya?ml|html|txt)$/.test(e.name) || p === __filename) return;
      try { if (fs.statSync(p).size < 2 * 1024 * 1024 && fs.readFileSync(p, 'utf8').indexOf(REMOVED) !== -1) hits.push(path.relative(ROOT, p).split(path.sep).join('/')); } catch (_) { /* unreadable file: skip */ }
    });
  })(ROOT);
  assert.deepStrictEqual(hits, [], 'files still naming the removed workflow: ' + hits.join(', '));
});

test('T5 the recogniser library stays and still enforces the 120-character code limit (AC5)', () => {
  const lib = require('../scripts/lib/error-issue-incident');
  ['recogniseIssue', 'planRun', 'codeProblem'].forEach((k) => assert.strictEqual(typeof lib[k], 'function', k + ' missing'));
  assert.strictEqual(lib.codeProblem('x'.repeat(120)), null, '120 characters must be accepted');
  assert.notStrictEqual(lib.codeProblem('x'.repeat(121)), null, '121 characters must be rejected');
});

(async () => {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch (e) { failed++; console.log('  FAIL ' + t.name + ' -- ' + (e && e.message)); }
  }
  console.log('[inc-s2-no-incident-pr] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
