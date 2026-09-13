'use strict';

var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    fn();
    passed++; console.log('  [PASS]', name);
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
  }
}

var freshnessPath = require.resolve('../src/web-ui/adapters/repo-freshness');
var journeyPath = require.resolve('../src/web-ui/routes/journey');

function freshFreshness() {
  delete require.cache[freshnessPath];
  return require('../src/web-ui/adapters/repo-freshness');
}

function main() {
  console.log('\n[rclr-s1] Group A -- ensureRepoFresh unit behaviour (AC1-AC5)');

  test('T1 (AC1): first call for a fresh repoRoot runs git pull --ff-only with correct cwd', function() {
    var freshness = freshFreshness();
    var calls = [];
    var result = freshness.ensureRepoFresh('/repo/a', {
      now: function() { return 10000000; },
      exec: function(cmd, opts) { calls.push({ cmd: cmd, opts: opts }); }
    });
    assert.strictEqual(calls.length, 1, 'exec should be called exactly once');
    assert.strictEqual(calls[0].cmd, 'git pull --ff-only');
    assert.strictEqual(calls[0].opts.cwd, '/repo/a');
    assert.strictEqual(result.pulled, true);
  });

  test('T2 (AC2): a second call within ttlMs does not invoke exec again', function() {
    var freshness = freshFreshness();
    var calls = [];
    var deps = { now: function() { return 10000000; }, exec: function(cmd) { calls.push(cmd); }, ttlMs: 120000 };
    freshness.ensureRepoFresh('/repo/b', deps);
    deps.now = function() { return 10000000 + 60000; }; // 1 minute later, within TTL
    var result2 = freshness.ensureRepoFresh('/repo/b', deps);
    assert.strictEqual(calls.length, 1, 'exec should not be called a second time within the TTL window');
    assert.strictEqual(result2.pulled, false);
    assert.strictEqual(result2.reason, 'fresh');
  });

  test('T3 (AC2): a call after ttlMs has elapsed does invoke exec again', function() {
    var freshness = freshFreshness();
    var calls = [];
    var deps = { now: function() { return 10000000; }, exec: function(cmd) { calls.push(cmd); }, ttlMs: 120000 };
    freshness.ensureRepoFresh('/repo/c', deps);
    deps.now = function() { return 10000000 + 120001; }; // just past the TTL
    var result2 = freshness.ensureRepoFresh('/repo/c', deps);
    assert.strictEqual(calls.length, 2, 'exec should be called again once the TTL has elapsed');
    assert.strictEqual(result2.pulled, true);
  });

  test('T4 (AC3): an exec that throws is caught and returned as a result value, never thrown', function() {
    var freshness = freshFreshness();
    var result;
    assert.doesNotThrow(function() {
      result = freshness.ensureRepoFresh('/repo/d', {
        now: function() { return 10000000; },
        exec: function() { throw new Error('git pull failed: diverged'); }
      });
    });
    assert.strictEqual(result.pulled, false);
    assert.strictEqual(result.reason, 'pull-failed');
    assert.ok(result.error && result.error.indexOf('diverged') !== -1);
  });

  test('T5 (AC4): the exact command executed is "git pull --ff-only" -- never rebase or reset', function() {
    var freshness = freshFreshness();
    var calls = [];
    freshness.ensureRepoFresh('/repo/e', {
      now: function() { return 10000000; },
      exec: function(cmd) { calls.push(cmd); }
    });
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0], 'git pull --ff-only');
    assert.ok(calls[0].indexOf('rebase') === -1);
    assert.ok(calls[0].indexOf('reset') === -1);
  });

  test('T6 (AC5): refreshing repoRoot A does not affect the TTL state for a different repoRoot B', function() {
    var freshness = freshFreshness();
    var calls = [];
    var deps = { now: function() { return 10000000; }, exec: function(cmd, opts) { calls.push(opts.cwd); }, ttlMs: 120000 };
    freshness.ensureRepoFresh('/repo/f', deps);
    var resultB = freshness.ensureRepoFresh('/repo/g', deps);
    assert.strictEqual(calls.length, 2, 'both distinct repoRoots should trigger their own pull');
    assert.deepStrictEqual(calls, ['/repo/f', '/repo/g']);
    assert.strictEqual(resultB.pulled, true);
  });

  console.log('\n[rclr-s1] Group B -- _readPipelineFeatures wiring (AC6)');

  test('T7 (AC6): _readPipelineFeatures calls ensureRepoFresh before reading the file', function() {
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rclr-s1-'));
    var githubDir = path.join(tmpDir, '.github');
    fs.mkdirSync(githubDir);
    fs.writeFileSync(path.join(githubDir, 'pipeline-state.json'), JSON.stringify({ features: [{ slug: 'x' }] }));

    var refreshCalledWith = null;
    require.cache[freshnessPath] = {
      id: freshnessPath, filename: freshnessPath, loaded: true,
      exports: {
        ensureRepoFresh: function(repoRoot) { refreshCalledWith = repoRoot; return { pulled: true }; },
        _resetForTesting: function() {}
      }
    };
    delete require.cache[journeyPath];
    var journey = require('../src/web-ui/routes/journey');

    var features = journey._readPipelineFeatures(tmpDir);

    assert.strictEqual(refreshCalledWith, tmpDir, 'ensureRepoFresh should be called with the same root passed to _readPipelineFeatures');
    assert.deepStrictEqual(features, [{ slug: 'x' }]);

    delete require.cache[freshnessPath];
    delete require.cache[journeyPath];
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('T8 (AC6): when ensureRepoFresh throws, _readPipelineFeatures still reads and returns the file contents', function() {
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rclr-s1-'));
    var githubDir = path.join(tmpDir, '.github');
    fs.mkdirSync(githubDir);
    fs.writeFileSync(path.join(githubDir, 'pipeline-state.json'), JSON.stringify({ features: [{ slug: 'y' }] }));

    require.cache[freshnessPath] = {
      id: freshnessPath, filename: freshnessPath, loaded: true,
      exports: {
        ensureRepoFresh: function() { throw new Error('unexpected adapter throw'); },
        _resetForTesting: function() {}
      }
    };
    delete require.cache[journeyPath];
    var journey = require('../src/web-ui/routes/journey');

    var features;
    assert.doesNotThrow(function() {
      features = journey._readPipelineFeatures(tmpDir);
    });
    assert.deepStrictEqual(features, [{ slug: 'y' }]);

    delete require.cache[freshnessPath];
    delete require.cache[journeyPath];
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  console.log('\n[rclr-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main();
