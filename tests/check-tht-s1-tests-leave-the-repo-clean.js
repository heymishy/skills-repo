'use strict';
// tht-s1 -- the full test suite leaves the repository clean, and the cat-s1 timing test runs without neighbours.
// Plain Node script. Run: node tests/check-tht-s1-tests-leave-the-repo-clean.js
// Story: artefacts/2026-11-16-test-hygiene-isolation/stories/tht-s1-tests-leave-the-repo-clean.md
// Test plan: artefacts/2026-11-16-test-hygiene-isolation/test-plans/tht-s1-test-plan.md

process.env.NODE_ENV = 'test';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test('T1 cat-s1 runs in the sequential-exclusive phase, with the other members unchanged (AC1)', () => {
  const runner = require('../scripts/run-all-tests.js');
  const list = runner.SEQUENTIAL_EXCLUSIVE_LIST;
  assert.ok(list.indexOf('tests/check-cat-s1-core-trace-builder.js') !== -1, 'cat-s1 is not in SEQUENTIAL_EXCLUSIVE_LIST');
  ['tests/check-lcdf-s1-build-time-learnings-count.js', 'tests/check-lccf-s1-fail-open-learnings-count.js',
    'tests/check-coha-s5-error-capture.js', 'tests/check-coha-s7-error-issue-incident.js'].forEach((f) => assert.ok(list.indexOf(f) !== -1, 'existing member removed: ' + f));
  const all = runner.getAllTestFiles(ROOT).map((f) => path.relative(ROOT, f).split(path.sep).join('/'));
  assert.ok(all.indexOf('tests/check-cat-s1-core-trace-builder.js') !== -1, 'the runner no longer discovers cat-s1 at all');
});

test('T2 the artefact save root is the override when SKILLS_ARTEFACT_SAVE_ROOT is set (AC2)', () => {
  const skills = require('../src/web-ui/routes/skills');
  assert.strictEqual(typeof skills._artefactSaveRoot, 'function', '_artefactSaveRoot is not exported');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tht-s1-root-'));
  const prev = process.env.SKILLS_ARTEFACT_SAVE_ROOT;
  try {
    process.env.SKILLS_ARTEFACT_SAVE_ROOT = dir;
    assert.strictEqual(skills._artefactSaveRoot(), dir);
  } finally {
    if (prev === undefined) delete process.env.SKILLS_ARTEFACT_SAVE_ROOT; else process.env.SKILLS_ARTEFACT_SAVE_ROOT = prev;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('T3 without the override the save root is exactly what it was before (AC2)', () => {
  const skills = require('../src/web-ui/routes/skills');
  assert.strictEqual(typeof skills._artefactSaveRoot, 'function', '_artefactSaveRoot is not exported');
  const prev = process.env.SKILLS_ARTEFACT_SAVE_ROOT;
  delete process.env.SKILLS_ARTEFACT_SAVE_ROOT;
  try {
    const expected = process.env.CLAUDE_REPO_PATH || process.env.COPILOT_REPO_PATH || path.resolve(ROOT, 'src', 'web-ui', 'routes', '..', '..', '..');
    assert.strictEqual(skills._artefactSaveRoot(), expected);
  } finally { if (prev !== undefined) process.env.SKILLS_ARTEFACT_SAVE_ROOT = prev; }
});

// The paths the five files used to write into the checkout, compared before and after (existence, size, modified time),
// so junk that is already in a checkout cannot make this fail and nothing is ever deleted here.
const WATCHED = [
  'artefacts/' + new Date().toISOString().slice(0, 10) + '-discovery',
  'artefacts/test-slug/ideate.md',
  'artefacts/stis-s1-test-slug',
  'workspace/test-tmp-inf5',
  'workspace/test-tmp-mig4',
  'workspace/strategy-metrics.json'
];
function snapshot() {
  const snap = {};
  WATCHED.forEach((rel) => {
    try { const s = fs.statSync(path.join(ROOT, rel)); snap[rel] = s.size + ':' + s.mtimeMs; } catch (_) { snap[rel] = 'absent'; }
  });
  return snap;
}
function head() { return spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim(); }

test('T4 the five formerly junk-writing files leave HEAD and the watched paths untouched (AC3)', () => {
  const FILES = ['check-wusl2-progressive-live-draft', 'check-iwu5-lens-complete', 'check-stis-s1-guard-skill-turn-git-commit', 'check-inf5-trace-extension', 'check-mig4-trace-extension'];
  const problems = [];
  FILES.forEach((f) => {
    const beforeHead = head(); const before = snapshot();
    const r = spawnSync(process.execPath, [path.join('tests', f + '.js')], { cwd: ROOT, encoding: 'utf8', timeout: 120000 });
    const afterHead = head(); const after = snapshot();
    if (afterHead !== beforeHead) problems.push(f + ': HEAD moved');
    WATCHED.forEach((rel) => { if (before[rel] !== after[rel]) problems.push(f + ': ' + rel + ' ' + before[rel] + ' -> ' + after[rel]); });
    if (r.status !== 0) problems.push(f + ': exited ' + r.status);
  });
  assert.deepStrictEqual(problems, [], problems.join(' | '));
});

(async () => {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch (e) { failed++; console.log('  FAIL ' + t.name + ' -- ' + (e && e.message)); }
  }
  console.log('[tht-s1-tests-leave-the-repo-clean] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
