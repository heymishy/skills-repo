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

// Matches journey.js's/features.js's own DI convention: one stable required
// store instance, reset between tests via its own _clearForTesting() --
// never require.cache-busting, since playback-evidence.js now takes the
// store via setJourneyStoreModule() (journey-store.js code review fix).
var store = require('../src/web-ui/modules/journey-store');
var pe = require('../src/web-ui/routes/playback-evidence');
pe.setJourneyStoreModule(store);
function getStore() {
  store._clearForTesting();
  return store;
}
function makeRes() {
  var res = { _status: null, _json: null, json: function(body) { res._status = res._status || 200; res._json = body; } };
  res.status = function(code) { res._status = code; return res; };
  return res;
}
function makeReq(tenantId, productId, featureSlug, extra) {
  return Object.assign({
    session: { tenantId: tenantId, accessToken: 'test-token', login: 'user' },
    sessionId: 'sid-' + tenantId,
    params: { productId: productId, featureSlug: featureSlug }
  }, extra || {});
}

function setupDodCompleteJourney(store, opts) {
  opts = opts || {};
  var slug = opts.featureSlug || ('ppc-s1-feature-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  var j = store.createJourney(slug);
  store.setJourneyFields(j.journeyId, { tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' });
  var dodContent = [
    '## AC Coverage',
    '',
    '| AC | Satisfied? | Evidence |',
    '|----|------------|----------|',
    '| AC1 — Shows the dashboard | Yes | screenshot |',
    '| AC2 — Saves a widget | Yes | screenshot |'
  ].join('\n');
  store.setPgAdapterForTesting({
    saveJourney: async function() {},
    getArtefactsForJourney: async function() {
      return [{ skill_name: 'definition-of-done', artefact_path: 'artefacts/' + slug + '/dod.md', content: dodContent }];
    }
  });
  store.completeStage(j.journeyId, 'definition-of-done', 'artefacts/' + slug + '/dod.md', null);
  return { journeyId: j.journeyId, featureSlug: slug, tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' };
}

queue.push(function() {
  return test('AC1: GET surface lists ACs scoped to the requesting tenant+product only', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, null);

    assert.strictEqual(res._status === null || res._status === 200, true);
    assert.strictEqual(res._json.acs.length, 2);
    assert.strictEqual(res._json.acs[0].acId, 'AC1');
  });
});

queue.push(function() {
  return test('AC4: an AC with no stored capture target shows NOT_SET, not a broken/erroring action', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, null);

    assert.strictEqual(res._json.acs[0].targetSet, false);
    assert.strictEqual(res._json.acs[0].target, null);
  });
});

queue.push(function() {
  return test('AC5: a captured screenshot path displays inline, no separate download step', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    store.setJourneyFields(setup.journeyId, { captureScreenshots: { AC1: 'artefacts/' + setup.featureSlug + '/playback/ppc-s1/screenshots/AC1.png' } });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, null);

    assert.strictEqual(res._json.acs[0].screenshotPath, 'artefacts/' + setup.featureSlug + '/playback/ppc-s1/screenshots/AC1.png');
  });
});

queue.push(function() {
  return test('AC7-precursor: unknown/unmatched tenant+product+slug combination returns 404, not a crash', async function() {
    var store = getStore();
    var req = makeReq('tenant-nobody', 'product-nobody', 'slug-that-does-not-exist');
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, null);
    assert.strictEqual(res._status, 404);
    assert.deepStrictEqual(res._json, { error: 'not found' });
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
