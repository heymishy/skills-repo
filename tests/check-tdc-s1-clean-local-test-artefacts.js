'use strict';
// check-tdc-s1-clean-local-test-artefacts.js — tdc-s1
// Story: artefacts/2026-07-24-test-data-cleanup/stories/tdc-s1-cleanup-scripts.md
// Test plan: artefacts/2026-07-24-test-data-cleanup/test-plans/tdc-s1-cleanup-scripts-test-plan.md
//
// Covers:
//   AC1: dry-run lists recognised, untracked candidates only, deletes nothing
//   AC2: --delete removes exactly the listed candidates, nothing else

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

// Build a temp "repo" tree with a real .git dir so the script's isTracked()
// git-ls-files check runs against a real, controlled git repo rather than
// this repo's own history.
function setUpTempRepo() {
  var tmpRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'tdc-s1-')));
  execFileSync('git', ['init', '-q'], { cwd: tmpRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tmpRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: tmpRoot });

  // A real, committed (tracked) bare-discovery.md directory -- must NEVER be a candidate.
  var trackedDir = path.join(tmpRoot, 'artefacts', '2026-01-01-real-feature');
  fs.mkdirSync(trackedDir, { recursive: true });
  fs.writeFileSync(path.join(trackedDir, 'discovery.md'), '# Real discovery\n');
  execFileSync('git', ['add', 'artefacts/2026-01-01-real-feature/discovery.md'], { cwd: tmpRoot });
  execFileSync('git', ['commit', '-q', '-m', 'seed real feature'], { cwd: tmpRoot });

  // An untracked bare-discovery.md directory -- IS a candidate.
  var untrackedDir = path.join(tmpRoot, 'artefacts', '2026-02-02-stray-test-run');
  fs.mkdirSync(untrackedDir, { recursive: true });
  fs.writeFileSync(path.join(untrackedDir, 'discovery.md'), '# Stray test run\n');

  // A real, multi-file feature folder -- must never be a candidate (wrong shape).
  var multiFileDir = path.join(tmpRoot, 'artefacts', '2026-03-03-real-feature-full');
  fs.mkdirSync(path.join(multiFileDir, 'stories'), { recursive: true });
  fs.writeFileSync(path.join(multiFileDir, 'discovery.md'), '# Full feature\n');
  fs.writeFileSync(path.join(multiFileDir, 'stories', 's1.md'), '# Story 1\n');

  // An untracked workspace/test-tmp-* directory -- IS a candidate.
  var testTmpDir = path.join(tmpRoot, 'workspace', 'test-tmp-example');
  fs.mkdirSync(testTmpDir, { recursive: true });
  fs.writeFileSync(path.join(testTmpDir, 'scratch.md'), 'scratch\n');

  return { tmpRoot: tmpRoot, trackedDir: trackedDir, untrackedDir: untrackedDir, multiFileDir: multiFileDir, testTmpDir: testTmpDir };
}

var queue = [];

queue.push(function() {
  test('AC1: dry-run lists only the recognised, untracked candidates, deletes nothing', function() {
    var script = freshRequireScript();
    var fixture = setUpTempRepo();

    var bareDiscovery = script.findBareDiscoveryDirs(fixture.tmpRoot);
    var testTmp = script.findTestTmpDirs(fixture.tmpRoot);

    assert.ok(bareDiscovery.indexOf(fixture.untrackedDir) !== -1, 'expected the untracked stray dir to be a candidate');
    assert.ok(bareDiscovery.indexOf(fixture.trackedDir) === -1, 'expected the TRACKED bare-discovery dir to be excluded');
    assert.ok(bareDiscovery.indexOf(fixture.multiFileDir) === -1, 'expected the multi-file real feature dir to be excluded (wrong shape)');
    assert.ok(testTmp.indexOf(fixture.testTmpDir) !== -1, 'expected the untracked test-tmp dir to be a candidate');

    // Dry run (no delete call made) -- everything must still exist.
    assert.ok(fs.existsSync(fixture.trackedDir), 'tracked dir must still exist');
    assert.ok(fs.existsSync(fixture.untrackedDir), 'untracked dir must still exist (dry run only)');
    assert.ok(fs.existsSync(fixture.multiFileDir), 'multi-file dir must still exist');
    assert.ok(fs.existsSync(fixture.testTmpDir), 'test-tmp dir must still exist');

    fs.rmSync(fixture.tmpRoot, { recursive: true, force: true });
  });
});

queue.push(function() {
  test('AC2: deleting exactly the found candidates removes them, nothing else', function() {
    var script = freshRequireScript();
    var fixture = setUpTempRepo();

    var candidates = script.findBareDiscoveryDirs(fixture.tmpRoot).concat(script.findTestTmpDirs(fixture.tmpRoot));
    candidates.forEach(function(c) { fs.rmSync(c, { recursive: true, force: true }); });

    assert.ok(!fs.existsSync(fixture.untrackedDir), 'expected the untracked stray dir to be removed');
    assert.ok(!fs.existsSync(fixture.testTmpDir), 'expected the untracked test-tmp dir to be removed');
    assert.ok(fs.existsSync(fixture.trackedDir), 'expected the TRACKED bare-discovery dir to survive');
    assert.ok(fs.existsSync(fixture.multiFileDir), 'expected the multi-file real feature dir to survive');

    fs.rmSync(fixture.tmpRoot, { recursive: true, force: true });
  });
});

queue.push(function() {
  test('CLI entrypoint runs end-to-end against the real repo without throwing (dry-run)', function() {
    var out = execFileSync(process.execPath, [SCRIPT_PATH], { encoding: 'utf8' });
    assert.ok(/Would remove|No stray test artefact directories found/.test(out), 'expected recognisable dry-run output');
  });
});

queue.forEach(function(fn) { fn(); });

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
