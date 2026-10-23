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

var fs = require('fs');
var path = require('path');
var os = require('os');
var store = require('../src/web-ui/modules/journey-store');
var pe = require('../src/web-ui/routes/playback-evidence');
var sessionPageAdapter = require('../src/web-ui/adapters/session-page-adapter');
var artefactCommitWriter = require('../src/web-ui/adapters/artefact-commit-writer');
var repoRootAdapter = require('../src/web-ui/adapters/repo-root');
var captureAllLock = require('../src/web-ui/modules/capture-all-lock');
pe.setJourneyStoreModule(store);

function getStore() {
  store._clearForTesting();
  captureAllLock._clearForTesting();
  return store;
}
function makeRes() {
  var res = {
    _status: null, _json: null, _body: null, _headers: {},
    json: function(body) { res._status = res._status || 200; res._json = body; },
    writeHead: function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); },
    end: function(body) { res._body = body; },
    setHeader: function(k, v) { res._headers[k] = v; }
  };
  res.status = function(code) { res._status = code; return res; };
  return res;
}
function makeReq(tenantId, productId, featureSlug, userId, extra) {
  return Object.assign({
    session: { tenantId: tenantId, userId: userId, accessToken: 'test-token', login: 'user', csrfToken: 'test-csrf-token' },
    sessionId: 'sid-' + tenantId,
    params: { productId: productId, featureSlug: featureSlug },
    headers: {}
  }, extra || {});
}
function makeMockPool(rows) {
  return { query: async function() { return { rows: rows }; } };
}
function setupDodCompleteJourney(store, opts) {
  opts = opts || {};
  var slug = opts.featureSlug || ('ppc-s3-feature-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  var dodContent = opts.dodContent || [
    '## AC Coverage', '',
    '| AC | Satisfied? | Evidence |', '|----|------------|----------|',
    '| AC1 — First | Yes | screenshot |'
  ].join('\n');
  var j = store.createJourney(slug);
  store.setJourneyFields(j.journeyId, { tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' });
  store.setPgAdapterForTesting({
    saveJourney: async function() {},
    getArtefactsForJourney: async function() {
      return [{ skill_name: 'definition-of-done', artefact_path: 'artefacts/' + slug + '/dod.md', content: dodContent }];
    }
  });
  store.completeStage(j.journeyId, 'definition-of-done', 'artefacts/' + slug + '/dod.md', null);
  return { journeyId: j.journeyId, featureSlug: slug, tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' };
}
function setupFakeCapture(tmpPrefix) {
  var tmpRoot = path.join(os.tmpdir(), tmpPrefix + '-' + Date.now());
  fs.mkdirSync(tmpRoot, { recursive: true });
  repoRootAdapter.setRepoRoot(tmpRoot);
  var fakePage = {
    goto: async function() {},
    screenshot: async function(opts) {
      var abs = path.join(tmpRoot, opts.path);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    }
  };
  sessionPageAdapter.setSessionPageAdapter(async function() {
    return { page: fakePage, browser: { close: async function() {} } };
  });
  artefactCommitWriter.setArtefactCommitAdapter(async function() { return { ok: true }; });
}
function uniqueUser(label) { return label + '-' + Date.now() + '-' + Math.random().toString(36).slice(2); }

queue.push(function() {
  return test('AC1: a second capture-trigger from the same user within 60s is rejected, not a silent failure or queued duplicate', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    setupFakeCapture('ppc-s3-rl-ac1');
    var user = uniqueUser('ac1-user');

    var req1 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, user, { params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' }, body: { _csrf: 'test-csrf-token' } });
    await pe.handlePostCaptureTrigger(req1, makeRes(), null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    var req2 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, user, { params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' }, body: { _csrf: 'test-csrf-token' } });
    var res2 = makeRes();
    await pe.handlePostCaptureTrigger(req2, res2, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(res2._status, 429);
    assert.ok(res2._json.error.toLowerCase().indexOf('rate limit') !== -1, 'must be a clear, distinct rate-limit error, not a generic failure');
  });
});

queue.push(function() {
  return test('AC3: after the rate-limit window has elapsed, a new capture-trigger from the same user proceeds normally', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    setupFakeCapture('ppc-s3-rl-ac3');
    var user = uniqueUser('ac3-user');

    var captureAllModule = require('../src/utils/capture-all');
    var realNow = Date.now;
    try {
      Date.now = function() { return realNow() - 61000; };
      var req1 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, user, { params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' }, body: { _csrf: 'test-csrf-token' } });
      await pe.handlePostCaptureTrigger(req1, makeRes(), null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));
      Date.now = realNow;

      var req2 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, user, { params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' }, body: { _csrf: 'test-csrf-token' } });
      var res2 = makeRes();
      await pe.handlePostCaptureTrigger(req2, res2, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

      assert.notStrictEqual(res2._status, 429, 'the window has elapsed -- no false-positive lockout');
    } finally {
      Date.now = realNow;
    }
  });
});

queue.push(function() {
  return test('NFR-Accessibility: a rate-limited form submission renders role="alert" markup, not a visual-only toast', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    setupFakeCapture('ppc-s3-rl-a11y');
    var user = uniqueUser('a11y-user');

    var formHeaders = { 'content-type': 'application/x-www-form-urlencoded' };
    var req1 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, user, { headers: formHeaders, params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' }, body: { _csrf: 'test-csrf-token' } });
    await pe.handlePostCaptureTrigger(req1, makeRes(), null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    var req2 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, user, { headers: formHeaders, params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' }, body: { _csrf: 'test-csrf-token' } });
    var res2 = makeRes();
    await pe.handlePostCaptureTrigger(req2, res2, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(res2._status, 429);
    assert.ok(res2._body.indexOf('role="alert"') !== -1, 'a real browser form submission must get an accessible alert, not raw JSON');
  });
});

queue.push(function() {
  return test('NFR-Accessibility: a rate-limited JSON API caller still gets a JSON error body (not HTML)', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    store2.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/a', '#a');
    setupFakeCapture('ppc-s3-rl-json');
    var user = uniqueUser('json-user');

    var req1 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, user, { params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' }, body: { _csrf: 'test-csrf-token' } });
    await pe.handlePostCaptureTrigger(req1, makeRes(), null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    var req2 = makeReq(setup.tenantId, setup.productId, setup.featureSlug, user, { params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' }, body: { _csrf: 'test-csrf-token' } });
    var res2 = makeRes();
    await pe.handlePostCaptureTrigger(req2, res2, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.strictEqual(res2._status, 429);
    assert.strictEqual(typeof res2._json, 'object', 'a non-form caller must get a parsed JSON body, not HTML');
    assert.ok(res2._json.error, 'must contain an explicit error field');
  });
});

(async function() {
  console.log('\ncheck-ppc-s3-capture-rate-limit.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
