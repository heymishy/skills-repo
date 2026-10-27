'use strict';
// check-ppc-s1-ui-layer.js — ppc-s1. Tasks 13-15 (post-/verify-completion
// fix): the final whole-arc review found AC1/AC3/AC4/AC5 and the AC
// verification script describe a real browser page ("open the new
// playback-review page", "click 'Set capture target'", keyboard-navigate
// buttons) -- but Tasks 7-9 only built a JSON API (_sendJson), no rendered
// HTML at all. This file covers the dual-mode HTML rendering added to
// close that gap: handleGetPlaybackEvidence's HTML branch, the new
// tenant-scoped handleGetCaptureScreenshot route, and the
// redirect-after-form-POST behaviour on the two mutating handlers.

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

var store = require('../src/web-ui/modules/journey-store');
var pe = require('../src/web-ui/routes/playback-evidence');
pe.setJourneyStoreModule(store);
var repoRootAdapter = require('../src/web-ui/adapters/repo-root');

function getStore() {
  store._clearForTesting();
  return store;
}

function makeRes() {
  var res = {
    _status: null, _json: null, _body: null, _headers: {},
    json: function(body) { res._status = res._status || 200; res._json = body; },
    writeHead: function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); },
    end: function(body) { res._body = (res._body || '') + (body || ''); },
    setHeader: function(k, v) { res._headers[k] = v; }
  };
  res.status = function(code) { res._status = code; return res; };
  return res;
}

var _makeReqCallCount = 0;
function makeReq(tenantId, productId, featureSlug, extra) {
  _makeReqCallCount++;
  return Object.assign({
    session: { tenantId: tenantId, userId: 'ppc-s1-ui-test-user-' + _makeReqCallCount, accessToken: 'test-token', login: 'user', csrfToken: 'test-csrf-token' },
    sessionId: 'sid-' + tenantId,
    params: { productId: productId, featureSlug: featureSlug },
    headers: {}
  }, extra || {});
}

function setupDodCompleteJourney(store, opts) {
  opts = opts || {};
  var slug = opts.featureSlug || ('ppc-s1-ui-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  var j = store.createJourney(slug);
  store.setJourneyFields(j.journeyId, { tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' });
  var dodContent = [
    '## AC Coverage',
    '',
    '| AC | Satisfied? | Evidence |',
    '|----|------------|----------|',
    '| AC1 — Shows the dashboard | Yes | screenshot |',
    '| AC2 — Saves a <widget> & "thing" | Yes | screenshot |'
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
  return test('AC1/AC4 (HTML mode): a browser request (Accept: text/html) renders a real page with a form per AC, "not set" state visible as text', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { headers: { accept: 'text/html,application/xhtml+xml' } });
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, null);

    assert.strictEqual(res._status, 200);
    assert.ok(res._headers['Content-Type'] && res._headers['Content-Type'].indexOf('text/html') !== -1, 'must respond with an HTML content type, not JSON');
    var html = res._body;
    assert.ok(html.indexOf('<form') !== -1, 'must contain a real <form> element (NFR-Accessibility: real form/input, not a div styled as a button)');
    assert.ok(html.indexOf('Capture target not set') !== -1, 'AC4: must show the exact "not set" text for an AC with no stored target');
    assert.ok(html.indexOf('AC1') !== -1 && html.indexOf('AC2') !== -1, 'must list both ACs from the DoD artefact');
    // Escaping: the fixture AC2 description contains <widget> & "thing" --
    // must be HTML-escaped, never rendered as a literal tag (XSS guard,
    // since AC descriptions are parsed from a tenant-authored DoD artefact).
    assert.ok(html.indexOf('<widget>') === -1, 'must never render unescaped tenant-authored content as literal HTML');
    assert.ok(html.indexOf('&lt;widget&gt;') !== -1, 'must HTML-escape the AC description');
  });
});

queue.push(function() {
  return test('AC1 (JSON mode unchanged): a request with no Accept: text/html still gets the existing JSON response', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, null);

    assert.strictEqual(res._status === null || res._status === 200, true);
    assert.strictEqual(res._json.acs.length, 2, 'existing JSON-mode behaviour (Tasks 7-9, already reviewed) must be completely unaffected');
  });
});

queue.push(function() {
  return test('AC5 (HTML mode): a captured screenshot renders as an inline <img> pointing at the new tenant-scoped screenshot route, not /playback-media/', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    store.setJourneyFields(setup.journeyId, { captureScreenshots: { AC1: 'artefacts/' + setup.featureSlug + '/playback/ppc-s1/screenshots/AC1.png' } });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { headers: { accept: 'text/html' } });
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, null);

    var html = res._body;
    assert.ok(html.indexOf('<img') !== -1, 'AC5: captured evidence must display inline, not as a download link');
    assert.ok(html.indexOf('/playback-evidence/') !== -1 && html.indexOf('/screenshots/AC1') !== -1, 'image src must point at this story\'s own tenant-scoped screenshot route');
    assert.ok(html.indexOf('/playback-media/') === -1, 'must NOT reuse the existing unscoped /playback-media/ route (confirmed to have no tenant check at all)');
  });
});

queue.push(function() {
  return test('handleGetCaptureScreenshot: serves the real file for the correct tenant+product+acId, 404 for anything else', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});

    var tmpRoot = path.join(os.tmpdir(), 'ppc-s1-ui-screenshot-' + Date.now());
    var relShotPath = 'artefacts/' + setup.featureSlug + '/playback/ppc-s1/screenshots/AC1.png';
    var absShotPath = path.join(tmpRoot, relShotPath);
    fs.mkdirSync(path.dirname(absShotPath), { recursive: true });
    var pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    fs.writeFileSync(absShotPath, pngBytes);
    repoRootAdapter.setRepoRoot(tmpRoot);
    store.setJourneyFields(setup.journeyId, { captureScreenshots: { AC1: relShotPath } });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' } });
    var res = makeRes();
    await pe.handleGetCaptureScreenshot(req, res);
    assert.strictEqual(res._status, 200);
    assert.strictEqual(res._headers['Content-Type'], 'image/png');

    // No AC1 screenshot stored for a DIFFERENT, unrelated feature -> 404.
    var setupOther = setupDodCompleteJourney(store, {});
    var reqOther = makeReq(setupOther.tenantId, setupOther.productId, setupOther.featureSlug, { params: { productId: setupOther.productId, featureSlug: setupOther.featureSlug, acId: 'AC1' } });
    var resOther = makeRes();
    await pe.handleGetCaptureScreenshot(reqOther, resOther);
    assert.strictEqual(resOther._status, 404);

    // Crafted acId -> 404, never reaches the filesystem.
    var reqCrafted = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: '../../../etc/passwd' } });
    var resCrafted = makeRes();
    await pe.handleGetCaptureScreenshot(reqCrafted, resCrafted);
    assert.strictEqual(resCrafted._status, 404);
  });
});

queue.push(function() {
  return test('AC2 (form submission): a form-encoded POST to set a target redirects (302) back to the GET page, JSON-mode callers unaffected', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});

    // Form-mode: a real browser <form method="POST"> always sends this content-type.
    var formReq = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' },
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: { url: 'http://localhost:3000/dashboard', selector: '#widget-1', _csrf: 'test-csrf-token' }
    });
    var formRes = makeRes();
    await pe.handlePostCaptureTarget(formReq, formRes, null, null);

    assert.strictEqual(formRes._status, 302, 'a form submission must redirect back to the page, not return raw JSON');
    assert.ok(formRes._headers.Location && formRes._headers.Location.indexOf(setup.featureSlug) !== -1, 'must redirect back to this feature\'s own playback-evidence page');

    var reloaded = store.getJourney(setup.journeyId);
    assert.deepStrictEqual(reloaded.captureTargets[0], { acId: 'AC1', url: 'http://localhost:3000/dashboard', selector: '#widget-1' });

    // JSON-mode (existing Task 8 tests, no content-type header set) must be completely unaffected.
    var jsonReq = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC2' },
      body: { url: 'http://localhost:3000/x', selector: '#y', _csrf: 'test-csrf-token' }
    });
    var jsonRes = makeRes();
    await pe.handlePostCaptureTarget(jsonReq, jsonRes, null, null);
    assert.strictEqual(jsonRes._json.ok, true, 'JSON-mode behaviour (no form content-type) must be unaffected by the new redirect logic');
  });
});

queue.push(function() {
  // ppc-s9 Task 8 migration note: handlePostCaptureTrigger no longer drives
  // a Playwright page/screenshot/commit itself (Task 5) -- it dispatches via
  // captureDispatchAdapter + a nonce instead. The redirect-on-form-submission
  // behaviour this test actually covers (AC3's own "a form POST redirects,
  // not raw JSON" UI contract) is unchanged by that move, so only the mock
  // setup needed updating, not the assertion itself.
  return test('AC3 (form submission): a form-encoded capture-trigger POST redirects (302) back to the GET page on success', async function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    store.setCaptureTarget(setup.journeyId, 'AC1', 'http://localhost:3000/x', '#y');

    var nonceStore = require('../src/web-ui/adapters/capture-nonce-store');
    var captureDispatchAdapter = require('../src/web-ui/adapters/capture-dispatch-adapter');
    var nonceRecords = {};
    nonceStore.setNonceStoreAdapter({
      set: async function(key, value) { nonceRecords[key] = value; },
      get: async function(key) { return nonceRecords[key] === undefined ? null : nonceRecords[key]; },
      del: async function(key) { delete nonceRecords[key]; }
    });
    captureDispatchAdapter.setCaptureDispatchAdapter({
      dispatchCaptureWorkflow: async function() {},
      checkCaptureArtifact: async function() { return { found: false }; },
      downloadCaptureArtifact: async function() { return {}; }
    });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, {
      params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' },
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: { _csrf: 'test-csrf-token' }
    });
    var res = makeRes();
    await pe.handlePostCaptureTrigger(req, res, null, { query: async function() { return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] }; } });

    assert.strictEqual(res._status, 302, 'a form-submitted capture-trigger must redirect back to the page on success');
    assert.ok(res._headers.Location && res._headers.Location.indexOf(setup.featureSlug) !== -1);
  });
});

(async function() {
  console.log('\ncheck-ppc-s1-ui-layer.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
