'use strict';
// check-wugs-s10-audit-log-promotion-events.js — wugs-s10
//
// Unit/integration tests for PostHog audit-log capture on promotion
// request/approve/reject events — fail-open (a capture failure must never
// block the underlying state change).

var assert = require('assert');

var passed = 0;
var failed = 0;

function check(name, fn) {
  try { fn(); console.log('PASS:', name); passed++; }
  catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; }
}

async function checkAsync(name, fn) {
  try { await fn(); console.log('PASS:', name); passed++; }
  catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; }
}

var products = require('../src/web-ui/routes/products');
var guardrailPrAdapter = require('../src/web-ui/adapters/guardrail-pr-adapter');

function mockPosthog(captureFn) {
  return { capture: captureFn };
}

function mockReq(overrides) {
  return Object.assign({
    params: { requestId: 'req-1' },
    body: { _csrf: 'ct1' },
    session: { accessToken: 'tok', tenantId: 't1', login: 'admin-alice', role: 'admin', csrfToken: 'ct1' }
  }, overrides || {});
}

function mockRes() {
  var _statusCode = null;
  var _body = '';
  return {
    writeHead: function (code) { _statusCode = code; return this; },
    end: function (body) { if (body != null) _body = body; },
    status: function (c) { _statusCode = c; return this; },
    json: function (b) { _body = JSON.stringify(b); },
    _get: function () { return { statusCode: _statusCode, body: _body }; }
  };
}

function makeMockPool(state) {
  return {
    query: async function (sql, params) {
      var s = String(sql);
      if (/SELECT request_id, status FROM guardrail_promotion_requests WHERE tenant_id = \$1 AND product_id = \$2 AND file_path = \$3 AND status = \$4/i.test(s)) {
        return { rows: state.existingPending ? [state.existingPending] : [] };
      }
      if (/INSERT INTO guardrail_promotion_requests/i.test(s)) {
        return { rows: [{ request_id: state.newRequestId || 'req-new-1', status: 'pending' }] };
      }
      if (/SELECT name, tenant_id, repo_owner, repo_name FROM products WHERE product_id/i.test(s)) {
        return { rows: state.prodRow ? [state.prodRow] : [] };
      }
      return { rows: [] };
    }
  };
}

(async () => {

// ── AC1: request creation fires guardrail_promotion_requested ───────────
await checkAsync('AC1: requestPromotion_fires_guardrailPromotionRequested', async () => {
  var captured = null;
  var ph = mockPosthog(function (distinctId, event, properties) {
    captured = { distinctId: distinctId, event: event, properties: properties };
  });
  var artefactFetcher = require('../src/web-ui/adapters/artefact-fetcher');
  var originalFetch = artefactFetcher.fetchRepoPath;
  artefactFetcher.fetchRepoPath = async function () { return 'CURRENT CONTENT'; };
  try {
    var pool = makeMockPool({ existingPending: null, newRequestId: 'req-new-1' });
    var result = await products._requestPromotion(pool, 't1', 'p1', 'standards/saas-gui.md', 'alice', 'org', 'repo', 'tok', ph);
    assert.strictEqual(result.alreadyExisted, false);
    assert.ok(captured, 'expected .capture() to be called');
    assert.strictEqual(captured.event, 'guardrail_promotion_requested');
    assert.strictEqual(captured.properties.tenantId, 't1');
    assert.strictEqual(captured.properties.productId, 'p1');
    assert.strictEqual(captured.properties.requestId, 'req-new-1');
    assert.strictEqual(captured.properties.filePath, 'standards/saas-gui.md');
  } finally {
    artefactFetcher.fetchRepoPath = originalFetch;
  }
});

// ── AC4 (request path): capture failure doesn't block request creation ──
await checkAsync('AC4: requestPromotion_captureThrows_stillCreatesRequest', async () => {
  var ph = mockPosthog(function () { throw new Error('simulated PostHog failure'); });
  var artefactFetcher = require('../src/web-ui/adapters/artefact-fetcher');
  var originalFetch = artefactFetcher.fetchRepoPath;
  artefactFetcher.fetchRepoPath = async function () { return 'CURRENT CONTENT'; };
  try {
    var pool = makeMockPool({ existingPending: null, newRequestId: 'req-new-2' });
    var result = await products._requestPromotion(pool, 't1', 'p1', 'standards/saas-gui.md', 'alice', 'org', 'repo', 'tok', ph);
    assert.strictEqual(result.alreadyExisted, false, 'expected the request to still be created despite the capture failure');
    assert.strictEqual(result.requestId, 'req-new-2');
  } finally {
    artefactFetcher.fetchRepoPath = originalFetch;
  }
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
