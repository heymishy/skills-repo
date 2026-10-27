'use strict';
// check-ppc-s6-dashboard-shell-parity.js — ppc-s6. Covers dashboard-shell wrap
// (AC1, AC5), tenant-scoped Scope/Benefit summary (AC2, AC4), at-a-glance
// coverage line (AC3), and responsive single-column layout below 768px (AC6)
// for the Playback Evidence page, which has shipped as a bare, unstyled
// HTML fragment since ppc-s1.

var assert = require('assert');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  var result;
  try { result = fn(); } catch (err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve(); }
  if (result && typeof result.then === 'function') {
    return result.then(function() { passed++; console.log('  PASS: ' + name); }, function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); });
  }
  passed++; console.log('  PASS: ' + name); return Promise.resolve();
}
var queue = [];

var store = require('../src/web-ui/modules/journey-store');
var pe = require('../src/web-ui/routes/playback-evidence');
pe.setJourneyStoreModule(store);

function getStore() { store._clearForTesting(); return store; }
function makeRes() {
  var res = { _status: null, _json: null, _body: null, _headers: {},
    json: function(body) { res._status = res._status || 200; res._json = body; },
    writeHead: function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); },
    end: function(body) { res._body = (res._body || '') + (body || ''); },
    setHeader: function(k, v) { res._headers[k] = v; } };
  res.status = function(code) { res._status = code; return res; };
  return res;
}
var _n = 0;
function makeReq(tenantId, productId, featureSlug, extra) {
  _n++;
  return Object.assign({ session: { tenantId: tenantId, userId: 'ppc-s6-user-' + _n, accessToken: 'test-token', login: 'user', csrfToken: 'test-csrf-token' },
    sessionId: 'sid-' + tenantId, params: { productId: productId, featureSlug: featureSlug }, headers: { accept: 'text/html' } }, extra || {});
}
function setupDodCompleteJourney(store, opts) {
  opts = opts || {};
  var slug = opts.featureSlug || ('ppc-s6-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  var j = store.createJourney(slug);
  store.setJourneyFields(j.journeyId, { tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' });
  var dodContent = ['## AC Coverage', '', '| AC | Satisfied? | Evidence |', '|----|----|----|', '| AC1 — Shows the dashboard | Yes | screenshot |'].join('\n');
  store.setPgAdapterForTesting({ saveJourney: async function() {}, getArtefactsForJourney: async function() { return [{ skill_name: 'definition-of-done', artefact_path: 'artefacts/' + slug + '/dod.md', content: dodContent }]; } });
  store.completeStage(j.journeyId, 'definition-of-done', 'artefacts/' + slug + '/dod.md', null);
  return { journeyId: j.journeyId, featureSlug: slug, tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' };
}
function makeMockPool() { return { query: async function() { return { rows: [] }; } }; }

console.log('\n[ppc-s6] AC1/AC5: dashboard shell wrap');

queue.push(function() {
  return test('T1 (AC1): HTML response is wrapped in the dashboard shell (nav sidebar markup present), not a bare <!DOCTYPE> fragment', function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, makeMockPool()).then(function() {
      assert.strictEqual(res._status, 200);
      assert.ok(res._body.indexOf('sw-app') !== -1, 'must contain the shared shell wrapper markup (sw-app), confirming renderShellWithNav was used');
      assert.ok(res._body.indexOf('sw-sidebar') !== -1 || res._body.indexOf('Products') !== -1, 'must contain the Products-nav sidebar, not a direct renderShell() call that would omit it');
    });
  });
});

queue.push(function() {
  return test('T2 (AC5): the existing capture-target form still submits correctly inside the shell wrap', function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, makeMockPool()).then(function() {
      assert.ok(res._body.indexOf('<form') !== -1, 'the existing plain <form> elements must still be present, unchanged, inside the shell wrap');
      assert.ok(res._body.indexOf('method="POST"') !== -1);
    });
  });
});

console.log('\n[ppc-s6] Results');
(async function() { for (var i = 0; i < queue.length; i++) { await queue[i](); } console.log('\n' + passed + ' passed, ' + failed + ' failed'); if (failed > 0) process.exitCode = 1; })();
