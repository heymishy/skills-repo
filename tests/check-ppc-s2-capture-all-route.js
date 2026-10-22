'use strict';
var assert = require('assert');
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

var decisionsLogWriter = require('../src/web-ui/adapters/decisions-log-writer');

queue.push(function() {
  return test('decisions-log-writer: the injected writer is called with a SCOPE-note payload referencing the exceeded threshold', async function() {
    var received = null;
    decisionsLogWriter.setDecisionsLogWriter(async function(journey, ownerRepo, token, payload) {
      received = { journey: journey, ownerRepo: ownerRepo, token: token, payload: payload };
    });
    try {
      var fakeJourney = { featureSlug: 'test-feature' };
      var fakeOwnerRepo = { owner: 'acme', repo: 'widgets' };
      await decisionsLogWriter.appendScopeNote(fakeJourney, fakeOwnerRepo, 'tok', { featureSlug: 'test-feature', durationMs: 65000 });
      assert.strictEqual(received.payload.durationMs, 65000);
      assert.strictEqual(received.payload.featureSlug, 'test-feature');
      assert.strictEqual(received.ownerRepo.owner, 'acme');
    } finally {
      decisionsLogWriter._resetDecisionsLogWriter();
    }
  });
});

queue.push(function() {
  return test('decisions-log-writer: realAppendScopeNote reads existing decisions.md, appends the SCOPE entry, and commits back to the tenant\'s OWN repo', async function() {
    var artefactFetcher = require('../src/web-ui/adapters/artefact-fetcher');
    var artefactCommitWriter = require('../src/web-ui/adapters/artefact-commit-writer');
    var originalFetch = global.fetch;
    // realAppendScopeNote now reads via fetchRepoPath (the D37 injectable
    // exact-path adapter), not fetchArtefact -- wire it to its real
    // implementation for this test, same as server.js does at startup, so
    // the GET below actually goes through global.fetch rather than hitting
    // the default throwing stub.
    var originalFetchRepoPath = artefactFetcher.getFetchRepoPath();
    artefactFetcher.setFetchRepoPath(artefactFetcher.realFetchRepoPath);
    var putBody = null;
    global.fetch = async function(url, opts) {
      if (String(url).endsWith('/user')) {
        return { ok: true, json: async function() { return { name: 'Test User', login: 'testuser' }; } };
      }
      if (String(url).indexOf('/contents/artefacts/test-feature/decisions.md') !== -1 && (!opts || opts.method !== 'PUT')) {
        return { ok: true, json: async function() { return { content: Buffer.from('# Decisions: test-feature\n\n---\n').toString('base64'), sha: 'abc123' }; } };
      }
      if (opts && opts.method === 'PUT') {
        putBody = JSON.parse(opts.body);
        return { ok: true, json: async function() { return { ok: true }; } };
      }
      return { ok: false, status: 404 };
    };
    try {
      await decisionsLogWriter.realAppendScopeNote(
        { featureSlug: 'test-feature' },
        { owner: 'acme', repo: 'widgets' },
        'tok',
        { featureSlug: 'test-feature', durationMs: 65000 }
      );
      assert.ok(putBody, 'must PUT the updated content back');
      var decodedContent = Buffer.from(putBody.content, 'base64').toString('utf8');
      assert.ok(decodedContent.indexOf('# Decisions: test-feature') !== -1, 'must preserve the existing content, not overwrite it');
      assert.ok(decodedContent.indexOf('SCOPE') !== -1 && decodedContent.indexOf('65.0s') !== -1, 'must append a SCOPE entry referencing the real measured duration');
      assert.strictEqual(putBody.sha, 'abc123', 'must pass the existing file\'s sha so the update does not conflict');
    } finally {
      global.fetch = originalFetch;
      artefactFetcher.setFetchRepoPath(originalFetchRepoPath);
    }
  });
});

(async function() {
  console.log('\ncheck-ppc-s2-capture-all-route.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
