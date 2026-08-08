'use strict';
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var os = require('os');
var execFileSync = require('child_process').execFileSync;

var passed = 0; var failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++; console.log('  PASS: ' + name);
  } catch (err) {
    failed++; console.log('  FAIL: ' + name + '\n       ' + (err && err.message || err));
  }
}

var SCRIPT_PATH = path.resolve(__dirname, '../scripts/clean-local-test-artefacts.js');
function freshRequireScript() {
  try { delete require.cache[require.resolve(SCRIPT_PATH)]; } catch (_) {}
  return require(SCRIPT_PATH);
}

function setUpTempRepo() {
  var tmpRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cas-s1-')));
  execFileSync('git', ['init', '-q'], { cwd: tmpRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tmpRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmpRoot });
  fs.mkdirSync(path.join(tmpRoot, 'artefacts'), { recursive: true });
  return tmpRoot;
}

test('findBareDiscoveryDirs_stillDetectsGenuineBareDiscoveryDir', function () {
  var tmpRoot = setUpTempRepo();
  var dir = path.join(tmpRoot, 'artefacts', '2026-01-01-bare-feature');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'discovery.md'), '# discovery');
  var mod = freshRequireScript();
  var candidates = mod.findBareDiscoveryDirs(tmpRoot);
  assert.strictEqual(candidates.length, 1, 'expected exactly 1 candidate');
  assert.strictEqual(candidates[0], dir);
});

test('findBareDiscoveryDirs_earlyExitsOnSecondFile_excludesCorrectly', function () {
  var tmpRoot = setUpTempRepo();
  var dir = path.join(tmpRoot, 'artefacts', '2026-01-01-real-feature');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'discovery.md'), '# discovery');
  fs.writeFileSync(path.join(dir, 'benefit-metric.md'), '# benefit metric');
  var mod = freshRequireScript();
  var candidates = mod.findBareDiscoveryDirs(tmpRoot);
  assert.strictEqual(candidates.length, 0, 'expected zero candidates once a 2nd file exists');
});

test('findBareDiscoveryDirs_visitsBoundedEntries_onLargeNonCandidateTree', function () {
  var tmpRoot = setUpTempRepo();
  var dir = path.join(tmpRoot, 'artefacts', '2026-01-01-large-feature');
  var storiesDir = path.join(dir, 'stories');
  fs.mkdirSync(storiesDir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'discovery.md'), '# discovery');
  fs.writeFileSync(path.join(dir, 'benefit-metric.md'), '# benefit metric');
  for (var i = 0; i < 500; i++) {
    fs.writeFileSync(path.join(storiesDir, 's' + i + '.md'), '# story ' + i);
  }

  var origReaddirSync = fs.readdirSync;
  var visitedPaths = [];
  fs.readdirSync = function (p) {
    visitedPaths.push(p);
    return origReaddirSync.apply(fs, arguments);
  };
  var mod;
  try {
    mod = freshRequireScript();
    mod.findBareDiscoveryDirs(tmpRoot);
  } finally {
    fs.readdirSync = origReaddirSync;
  }
  // dir already has 2 top-level files (discovery.md, benefit-metric.md) --
  // that alone proves "more than 1 file" without ever needing to know what
  // is inside stories/. Without early-exit, the full recursive listing
  // walks into stories/ anyway to build the complete flat file array before
  // checking its length; with early-exit, stories/ is never touched.
  assert(
    visitedPaths.indexOf(storiesDir) === -1,
    'expected stories/ subdirectory to never be visited once 2 top-level files already disqualify the directory, but readdirSync was called on: ' + visitedPaths.join(', '),
  );
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
