'use strict';
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var os = require('os');
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

queue.push(function() {
  return test('commitArtefact: base64 encoding passes binary content through unchanged (no re-encoding)', async function() {
    delete require.cache[require.resolve('../src/web-ui/adapters/artefact-commit-writer')];
    var acw = require('../src/web-ui/adapters/artefact-commit-writer');
    var received = null;
    acw.setArtefactCommitAdapter(async function(artefactPath, content, token, owner, repo, encoding) {
      received = { artefactPath: artefactPath, content: content, encoding: encoding };
      return { ok: true };
    });
    var fakePngBase64 = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString('base64');
    await acw.commitArtefact('artefacts/x/shot.png', fakePngBase64, 'tok', 'acme', 'widgets', 'base64');
    assert.strictEqual(received.encoding, 'base64');
    assert.strictEqual(received.content, fakePngBase64, 'content must pass through unchanged when already base64');
  });
});

queue.push(function() {
  return test('commitArtefact: default (no encoding arg) behaves exactly as before -- markdown text, utf8', async function() {
    delete require.cache[require.resolve('../src/web-ui/adapters/artefact-commit-writer')];
    var acw = require('../src/web-ui/adapters/artefact-commit-writer');
    var received = null;
    acw.setArtefactCommitAdapter(async function(artefactPath, content, token, owner, repo, encoding) {
      received = { content: content, encoding: encoding };
      return { ok: true };
    });
    await acw.commitArtefact('artefacts/x/notes.md', '# hello', 'tok', 'acme', 'widgets');
    assert.strictEqual(received.content, '# hello');
    assert.strictEqual(received.encoding, undefined, 'existing callers never pass a 6th arg -- must stay undefined, not default to a new value that changes their behaviour');
  });
});

queue.push(function() {
  return test('realCommitArtefact: encoding=base64 passes content straight through to the PUT body unchanged', async function() {
    delete require.cache[require.resolve('../src/web-ui/adapters/artefact-commit-writer')];
    var acw = require('../src/web-ui/adapters/artefact-commit-writer');
    var originalFetch = global.fetch;
    var putBody = null;
    global.fetch = async function(url, opts) {
      if (String(url).endsWith('/user')) {
        return { ok: true, json: async function() { return { name: 'Test User', login: 'testuser' }; } };
      }
      if (opts && opts.method === 'PUT') {
        putBody = JSON.parse(opts.body);
        return { ok: true, json: async function() { return { ok: true }; } };
      }
      // GET existing file check -- simulate "not found" (brand new file)
      return { ok: false, status: 404 };
    };
    try {
      var fakeBase64 = Buffer.from([1, 2, 3, 4]).toString('base64');
      await acw.realCommitArtefact('artefacts/x/shot.png', fakeBase64, 'tok', 'acme', 'widgets', 'base64');
      assert.strictEqual(putBody.content, fakeBase64, 'base64 content must pass straight through, not be re-encoded via Buffer.from(content, utf8)');
    } finally {
      global.fetch = originalFetch;
    }
  });
});

(async function() {
  console.log('\ncheck-ppc-s1-playback-evidence-route.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
