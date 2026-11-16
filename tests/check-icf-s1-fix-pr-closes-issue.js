'use strict';
// icf-s1 -- a short-track fix for a GitHub issue carries that issue through the pipeline and closes it with its PR.
// Plain Node script. Run: node tests/check-icf-s1-fix-pr-closes-issue.js
// Story: artefacts/2026-11-16-issue-closure-by-fix-pr/stories/icf-s1-fix-pr-closes-its-source-issue.md
// Test plan: artefacts/2026-11-16-issue-closure-by-fix-pr/test-plans/icf-s1-test-plan.md

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts', 'check-source-issue-closure.js');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
function loadScript() { assert.ok(fs.existsSync(SCRIPT), 'scripts/check-source-issue-closure.js does not exist'); return require(SCRIPT); }

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'icf-s1-'));

test('T1 branch-complete puts Fixes #N in both PR bodies and requires the closing-reference check (AC1)', () => {
  const s = read('skills/branch-complete/SKILL.md');
  const bodies = s.split('Fixes #').length - 1;
  assert.ok(bodies >= 2, 'expected "Fixes #" in the bash and the PowerShell bodies, found ' + bodies);
  assert.ok(/Source issue/i.test(s), 'no source-issue instruction');
  assert.ok(s.indexOf('check-source-issue-closure.js --pr') !== -1, 'the closing-reference check command is not required');
});

test('T2 the closing-keyword test passes real keywords and fails a bare mention (AC2)', () => {
  const { closingKeywordPresent } = loadScript();
  ['Fixes #1121', 'closes #1121', 'RESOLVES #1121', 'This PR fixes #1121.'].forEach((b) => assert.strictEqual(closingKeywordPresent(b, 1121), true, 'should pass: ' + b));
  // The real PR #1127 wording, which left issue #1121 open, and look-alikes.
  ['After the live check the operator can close issue #1121 and incident PR #1122.', 'Fixes #11210', 'see #1121', '', undefined].forEach((b) => assert.strictEqual(closingKeywordPresent(b, 1121), false, 'should fail: ' + b));
});

test('T3 the scan returns exactly the merged stories whose source issue is still open (AC3)', () => {
  const { findOpenSourceIssues } = loadScript();
  const st = (id, extra) => Object.assign({ id, slug: id, prStatus: 'merged' }, extra);
  const state = { features: [
    { slug: 'f1', stories: [st('a', { sourceIssue: 1 }), st('b', { sourceIssue: 2 }), st('c', {}), st('d', { sourceIssue: 1, prStatus: 'draft' })] },
    { slug: 'f2', epics: [{ stories: [st('e', { sourceIssue: 1 })] }] }
  ] };
  const lookup = (n) => (n === 1 ? 'OPEN' : 'CLOSED');
  const open = findOpenSourceIssues(state, lookup).map((x) => x.feature + '/' + x.id).sort();
  assert.deepStrictEqual(open, ['f1/a', 'f2/e']);
  const unknown = findOpenSourceIssues(state, () => null);
  assert.deepStrictEqual(unknown, [], 'an unknown lookup must not be reported as open');
});

test('T4 definition-of-done Step 1 runs the scan and the DoD template has a Source Issue Closure section (AC4)', () => {
  const s = read('skills/definition-of-done/SKILL.md');
  const step1 = s.slice(s.indexOf('## Step 1'), s.indexOf('## Step 2'));
  assert.ok(/source issue/i.test(step1), 'Step 1 does not mention the source issue');
  assert.ok(step1.indexOf('check-source-issue-closure.js') !== -1, 'Step 1 does not run the scan');
  assert.ok(/deviation/i.test(step1) && /operator/i.test(step1), 'Step 1 must record a deviation and offer the operator the closing action');
  assert.ok(/## Source Issue Closure/.test(read('templates/definition-of-done.md')), 'template has no Source Issue Closure section');
});

test('T5 the schema accepts sourceIssue, the integrity check passes with it, and advance stores an integer (AC5)', () => {
  const schema = JSON.parse(read('.github/pipeline-state.schema.json'));
  const storyDefs = [];
  (function walk(o) { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') { if (o.properties && o.properties.testPlan && o.properties.dorStatus) storyDefs.push(o); Object.keys(o).forEach((k) => walk(o[k])); } })(schema);
  assert.ok(storyDefs.length >= 2, 'expected two story definitions, found ' + storyDefs.length);
  storyDefs.forEach((d, i) => assert.ok(d.properties.sourceIssue && d.properties.sourceIssue.type === 'integer', 'story definition ' + i + ' lacks sourceIssue:integer'));
  const root = fs.mkdtempSync(path.join(tmp, 'root-'));
  fs.mkdirSync(path.join(root, 'scripts')); fs.mkdirSync(path.join(root, '.github'));
  fs.copyFileSync(path.join(ROOT, 'scripts', 'check-pipeline-state-integrity.js'), path.join(root, 'scripts', 'check-pipeline-state-integrity.js'));
  const story = { id: 's-1', slug: 's-1', name: 'story', stage: 'definition-of-done', health: 'green', acTotal: 1, acVerified: 1, prStatus: 'merged', dorStatus: 'signed-off', sourceIssue: 5, testPlan: { status: 'written', totalTests: 1, passing: 1, artefact: 'x.md' } };
  fs.writeFileSync(path.join(root, '.github', 'pipeline-state.json'), JSON.stringify({ features: [{ slug: '2026-01-01-x', name: 'x', track: 'short', stage: 'definition', health: 'green', metrics: [], guardrails: [], stories: [story] }] }));
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'check-pipeline-state-integrity.js')], { cwd: root, encoding: 'utf8' });
  assert.strictEqual(r.status, 0, 'integrity exit ' + r.status + ': ' + (r.stdout + r.stderr).split(/\r?\n/).filter((l) => /FAIL/.test(l)).join(' | '));
  const { applyAdvance } = require('../src/enforcement/cli-advance');
  const state = { features: [{ slug: 'f', stories: [{ id: 's-1', slug: 's-1' }] }] };
  const res = applyAdvance(state, 'f', 's-1', ['sourceIssue=1121']);
  assert.strictEqual(res.exitCode, 0, 'advance exit ' + res.exitCode + ' ' + res.stderr);
  assert.strictEqual(res.state.features[0].stories[0].sourceIssue, 1121, 'sourceIssue must be stored as the integer 1121');
});

test('T6 with no gh the script exits 0 and says skipped; with no source issues it exits 0 and says none (AC6)', () => {
  assert.ok(fs.existsSync(SCRIPT), 'script missing');
  const withIssue = path.join(tmp, 'state-with-issue.json');
  fs.writeFileSync(withIssue, JSON.stringify({ features: [{ slug: 'f', stories: [{ id: 'a', slug: 'a', prStatus: 'merged', sourceIssue: 7 }] }] }));
  const skipped = spawnSync(process.execPath, [SCRIPT, '--state', withIssue], { cwd: ROOT, encoding: 'utf8', env: Object.assign({}, process.env, { GH_BIN: 'icf-no-such-binary' }) });
  assert.strictEqual(skipped.status, 0, 'exit ' + skipped.status + ': ' + (skipped.stdout + skipped.stderr).slice(0, 200));
  assert.ok(/skipped/i.test(skipped.stdout + skipped.stderr), 'no skipped message: ' + skipped.stdout);
  const none = path.join(tmp, 'state-none.json');
  fs.writeFileSync(none, JSON.stringify({ features: [{ slug: 'f', stories: [{ id: 'a', slug: 'a', prStatus: 'merged' }] }] }));
  const r = spawnSync(process.execPath, [SCRIPT, '--state', none], { cwd: ROOT, encoding: 'utf8', env: Object.assign({}, process.env, { GH_BIN: 'icf-no-such-binary' }) });
  assert.strictEqual(r.status, 0, 'exit ' + r.status);
  assert.ok(/no .*source issue/i.test(r.stdout), 'no "none found" message: ' + r.stdout);
});

(async () => {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch (e) { failed++; console.log('  FAIL ' + t.name + ' -- ' + (e && e.message)); }
  }
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* temp cleanup is best effort */ }
  console.log('[icf-s1-fix-pr-closes-issue] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
