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
console.log('\n[ppc-s6] AC2/AC4: Scope/Benefit summary');

var fetcher = require('../src/web-ui/adapters/artefact-fetcher');

queue.push(function() {
  return test('T3 (AC2): Scope and Benefit sections render from discovery.md/benefit-metric.md via fetchArtefact, escaped', function() {
    pe.setFetcherModule(async function(featureSlug, artefactType) {
      if (artefactType === 'discovery') return '## Problem statement\n\nTenants cannot <see> their own evidence.';
      if (artefactType === 'benefit-metric') return '## Metrics\n\n- Adoption: 50%';
      throw new fetcher.ArtefactNotFoundError(featureSlug, artefactType);
    });
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, { query: async function() { return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] }; } }).then(function() {
      pe.setFetcherModule(fetcher.fetchArtefact);
      assert.ok(res._body.indexOf('Tenants cannot') !== -1, 'Scope section must show the fetched Problem statement content');
      assert.ok(res._body.indexOf('&lt;see&gt;') !== -1, 'fetched content must be HTML-escaped (XSS guard)');
      assert.ok(res._body.indexOf('<see>') === -1, 'must never render unescaped tenant-authored content as literal HTML');
    }, function(err) { pe.setFetcherModule(fetcher.fetchArtefact); throw err; });
  });
});

queue.push(function() {
  return test('T4 (AC4): a missing discovery.md shows a "not available" state naming the specific artefact, rest of page unaffected', function() {
    pe.setFetcherModule(async function(featureSlug, artefactType) {
      if (artefactType === 'discovery') throw new fetcher.ArtefactNotFoundError(featureSlug, artefactType);
      if (artefactType === 'benefit-metric') return '## Metrics\n\n- Adoption: 50%';
      throw new fetcher.ArtefactNotFoundError(featureSlug, artefactType);
    });
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, { query: async function() { return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] }; } }).then(function() {
      pe.setFetcherModule(fetcher.fetchArtefact);
      assert.strictEqual(res._status, 200, 'page must still render fully, not 404/500');
      assert.ok(res._body.indexOf('discovery.md') !== -1 && res._body.indexOf('not found') !== -1, 'must name the specific missing artefact (discovery.md), not a generic message');
      assert.ok(res._body.indexOf('<form') !== -1, 'AC list / capture forms must still render unaffected');
    }, function(err) { pe.setFetcherModule(fetcher.fetchArtefact); throw err; });
  });
});

console.log('\n[ppc-s6] AC3: coverage summary line');

queue.push(function() {
  return test('T5 (AC3): coverage line shows "Full coverage" when every AC has evidence, reusing renderCoverageSummaryHtml as-is', function() {
    var store3 = getStore();
    var setup = setupDodCompleteJourney(store3, {});
    store3.setJourneyFields(setup.journeyId, { captureScreenshots: { AC1: 'artefacts/' + setup.featureSlug + '/playback/ppc-s1/screenshots/AC1.png' } });
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, makeMockPool()).then(function() {
      assert.ok(res._body.indexOf('Full coverage') !== -1, 'single AC, single screenshot captured -> full coverage, reusing the exact wording renderCoverageSummaryHtml already uses');
      assert.ok(res._body.indexOf('playback-coverage-summary--full') !== -1, 'must reuse the existing text-distinct CSS class, not a new one');
    });
  });
});

queue.push(function() {
  return test('T6 (AC3): coverage line shows "0 of N" when nothing is captured', function() {
    var store3 = getStore();
    var setup = setupDodCompleteJourney(store3, {});
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, makeMockPool()).then(function() {
      assert.ok(res._body.indexOf('0 of 1 ACs have captured evidence yet') !== -1);
    });
  });
});

console.log('\n[ppc-s6] AC6: responsive Scope/Benefit layout');

queue.push(function() {
  return test('T7 (AC6): Scope/Benefit summary declares an explicit @media (max-width: 768px) single-column override', function() {
    var store4 = getStore();
    var setup = setupDodCompleteJourney(store4, {});
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, makeMockPool()).then(function() {
      assert.ok(res._body.indexOf('@media (max-width: 768px)') !== -1,
        'DESIGN.md requires an explicit breakpoint override when Scope/Benefit render as multi-column -- "not specified is not a valid shipped state"');
      assert.ok(res._body.indexOf('grid-template-columns:1fr 1fr') !== -1, 'Scope/Benefit must render as an actual multi-column grid at desktop width, not already single-column (otherwise the override would be meaningless)');
    });
  });
});

(async function() { for (var i = 0; i < queue.length; i++) { await queue[i](); } console.log('\n' + passed + ' passed, ' + failed + ' failed'); if (failed > 0) process.exitCode = 1; })();
