'use strict';
var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve();
  }
}
var queue = [];

var { gateAdvance } = require('../src/enforcement/cli-gate-advance');
var journeySyncClient = require('../src/sync/journey-sync-client');

function makeTempDir() {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'css-s1-gate-advance-it-'));
  fs.mkdirSync(path.join(dir, '.github'), { recursive: true });
  return dir;
}
function writeValidDiscoveryArtefact(dir, featureSlug) {
  var p = path.join(dir, 'artefacts', featureSlug, 'discovery.md');
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, [
    '## Problem Statement', 'A problem.', '',
    '## Who It Affects', 'Someone.', '',
    '## Why Now', 'Because.', '',
    '## MVP Scope', 'The MVP.', '',
    '## Out of Scope', 'Nothing relevant.', '',
    '## Approved By', 'Jane Doe — PO — 2026-01-01'
  ].join('\n'));
  return 'artefacts/' + featureSlug + '/discovery.md';
}
function writeState(dir, featureSlug) {
  fs.writeFileSync(path.join(dir, '.github', 'pipeline-state.json'), JSON.stringify({
    schemaVersion: '1',
    features: [{ slug: featureSlug, stories: [{ id: 's1' }] }]
  }, null, 2));
}
function withEnv(vars, fn) {
  var saved = {};
  Object.keys(vars).forEach(function(k) {
    saved[k] = process.env[k];
    if (vars[k] === null) delete process.env[k];
    else process.env[k] = vars[k];
  });
  return Promise.resolve().then(fn).finally(function() {
    Object.keys(saved).forEach(function(k) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    });
  });
}

queue.push(function() {
  return test('gateAdvanceCommand_completesSynchronously_withJourneyUpdateIncluded', function() {
    return withEnv({ INTERNAL_SYNC_URL: 'http://fake.test', INTERNAL_SYNC_SECRET: 'secret', GITHUB_REPO_OWNER: 'acme', GITHUB_REPO_NAME: 'widgets' }, async function() {
      var dir = makeTempDir();
      try {
        var slug = 'css-s1-it-feature';
        var artefactPath = writeValidDiscoveryArtefact(dir, slug);
        writeState(dir, slug);

        var updateCalls = [];
        journeySyncClient.setJourneySyncClient(async function(op, payload) {
          if (op === 'resolve') return { found: true, journey: { journeyId: 'j1', featureSlug: slug, repoOwner: 'acme', repoName: 'widgets' } };
          updateCalls.push(payload);
          return { updated: true };
        });

        var result = await gateAdvance(slug, 's1', 'discovery-approved', artefactPath, ['stage=discovery-approved'], dir);

        assert.strictEqual(result.exitCode, 0, 'Expected exitCode 0: ' + result.stderr);
        assert.strictEqual(updateCalls.length, 1, 'the journey update call must already have happened by the time gateAdvance resolves');
        assert.strictEqual(updateCalls[0].stage, 'discovery');
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });
});

queue.push(function() {
  return test('gateAdvanceCommand_completesNormally_whenNoConnectedJourney', function() {
    return withEnv({ INTERNAL_SYNC_URL: 'http://fake.test', INTERNAL_SYNC_SECRET: 'secret' }, async function() {
      var dir = makeTempDir();
      try {
        var slug = 'css-s1-it-no-journey';
        var artefactPath = writeValidDiscoveryArtefact(dir, slug);
        writeState(dir, slug);

        journeySyncClient.setJourneySyncClient(async function(op) {
          assert.strictEqual(op, 'resolve');
          return { found: false };
        });

        var result = await gateAdvance(slug, 's1', 'discovery-approved', artefactPath, ['stage=discovery-approved'], dir);
        assert.strictEqual(result.exitCode, 0, 'Expected exitCode 0: ' + result.stderr);
        assert.strictEqual(result.stderr, '', 'no error output expected when no journey is connected');
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });
});

queue.push(function() {
  return test('gateAdvanceCommand_addsBoundedDelay_whenJourneySyncEnabled', function() {
    return withEnv({ INTERNAL_SYNC_URL: 'http://fake.test', INTERNAL_SYNC_SECRET: 'secret', GITHUB_REPO_OWNER: 'acme', GITHUB_REPO_NAME: 'widgets' }, async function() {
      var dir = makeTempDir();
      try {
        var slug = 'css-s1-it-timing';
        var artefactPath = writeValidDiscoveryArtefact(dir, slug);
        writeState(dir, slug);

        function delay(ms) { return new Promise(function(resolve) { setTimeout(resolve, ms); }); }

        journeySyncClient.setJourneySyncClient(async function(op) {
          await delay(50); // realistic mocked network round-trip
          if (op === 'resolve') return { found: true, journey: { journeyId: 'j1', featureSlug: slug, repoOwner: 'acme', repoName: 'widgets' } };
          return { updated: true };
        });

        var start = Date.now();
        var result = await gateAdvance(slug, 's1', 'discovery-approved', artefactPath, ['stage=discovery-approved'], dir);
        var elapsed = Date.now() - start;

        assert.strictEqual(result.exitCode, 0);
        assert.ok(elapsed < 500, 'Expected added delay under 500ms, got ' + elapsed + 'ms');
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });
});

queue.push(function() {
  return test('gateAdvanceCommand_exitCodeUnaffected_whenJourneySyncThrows', function() {
    return withEnv({ INTERNAL_SYNC_URL: 'http://fake.test', INTERNAL_SYNC_SECRET: 'secret', GITHUB_REPO_OWNER: 'acme', GITHUB_REPO_NAME: 'widgets' }, async function() {
      var dir = makeTempDir();
      try {
        var slug = 'css-s1-it-sync-throws';
        var artefactPath = writeValidDiscoveryArtefact(dir, slug);
        writeState(dir, slug);

        journeySyncClient.setJourneySyncClient(async function(op) {
          if (op === 'resolve') throw new Error('simulated journey-sync transport failure');
          return { updated: true };
        });

        var result = await gateAdvance(slug, 's1', 'discovery-approved', artefactPath, ['stage=discovery-approved'], dir);

        assert.strictEqual(result.exitCode, 0, 'Expected exitCode 0 even though journey-sync threw: ' + result.stderr);

        var writtenState = JSON.parse(fs.readFileSync(path.join(dir, '.github', 'pipeline-state.json'), 'utf8'));
        var writtenStory = writtenState.features[0].stories[0];
        assert.strictEqual(writtenStory.stage, 'discovery-approved', 'the pipeline-state advance must still have been written to disk');
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });
});

(async function() {
  console.log('\ncheck-css-s1-gate-advance-integration.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
