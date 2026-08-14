'use strict';
// check-wugs-s13-approve-reject-ui.js — wugs-s13
//
// Currently implemented: confirms an effectively-admin session sees real,
// wired Approve/Reject buttons for a pending promotion request (AC1), and
// a non-admin session sees the existing static "pending approval" text
// unchanged, with no buttons and no requestId leaked into the markup (AC2).
//
// AC3-AC6 (client-side handler wiring to the real wugs-s9 endpoints with
// CSRF and disable/update/error behaviour, and the wugs-s9 server-side
// role-gate regression check) are added in later tasks of this story.

var assert = require('assert');

var passed = 0;
var failed = 0;

var products = require('../src/web-ui/routes/products');

function mockReq(overrides) {
  return Object.assign({
    params: { id: 'prod-1' },
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
      if (/SELECT name, tenant_id, repo_owner, repo_name FROM products WHERE product_id/i.test(s)) {
        return { rows: state.prodRow ? [state.prodRow] : [] };
      }
      if (/SELECT id, path, pr_number, pr_url FROM guardrail_pending_prs WHERE tenant_id/i.test(s)) {
        return { rows: [] };
      }
      if (/SELECT request_id, file_path, status FROM guardrail_promotion_requests WHERE tenant_id/i.test(s)) {
        return { rows: state.pendingRequests || [] };
      }
      if (/SELECT repo_owner, repo_name FROM tenant_org_repo WHERE tenant_id/i.test(s)) {
        return { rows: [] };
      }
      return { rows: [] };
    }
  };
}

(async () => {

// ── AC1: admin sees real buttons ─────────────────────────────────────────
await checkAsyncOrSync('AC1: adminSession_pendingRequest_rendersRealButtons', async () => {
  var pool = makeMockPool({
    prodRow: { name: 'P', tenant_id: 't1', repo_owner: 'org', repo_name: 'repo' },
    pendingRequests: [{ request_id: 'req-1', file_path: '.github/architecture-guardrails.md', status: 'pending' }]
  });
  var req = mockReq();
  var res = mockRes();
  await products.handleGetProductGuardrailsView(req, res, null, pool);
  var body = res._get().body;
  assert.ok(/<button[^>]*>\s*Approve\s*<\/button>/i.test(body) || />Approve</i.test(body), 'expected a real Approve button in the rendered HTML');
  assert.ok(/>Reject</i.test(body), 'expected a real Reject button in the rendered HTML');
  assert.ok(body.indexOf('req-1') !== -1, 'expected the real requestId embedded in the rendered button wiring');
  assert.ok(body.indexOf('Promotion requested — pending approval') === -1, 'expected the static text to be replaced, not shown alongside the buttons');
});

async function checkAsyncOrSync(name, fn) {
  try { await fn(); console.log('PASS:', name); passed++; }
  catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; }
}

// ── AC2: non-admin sees unchanged static text ────────────────────────────
await checkAsyncOrSync('AC2: nonAdminSession_pendingRequest_rendersStaticTextUnchanged', async () => {
  var pool = makeMockPool({
    prodRow: { name: 'P', tenant_id: 't1', repo_owner: 'org', repo_name: 'repo' },
    pendingRequests: [{ request_id: 'req-2', file_path: '.github/architecture-guardrails.md', status: 'pending' }]
  });
  var req = mockReq({ session: { accessToken: 'tok', tenantId: 't1', login: 'engineer-bob', role: 'engineer', csrfToken: 'ct1' } });
  var res = mockRes();
  await products.handleGetProductGuardrailsView(req, res, null, pool);
  var body = res._get().body;
  assert.ok(body.indexOf('Promotion requested — pending approval') !== -1, 'expected the existing static text to still render for a non-admin');
  assert.ok(body.indexOf('>Approve<') === -1, 'expected no Approve button leaked into non-admin-visible markup');
  assert.ok(body.indexOf('>Reject<') === -1, 'expected no Reject button leaked into non-admin-visible markup');
  assert.ok(body.indexOf('req-2') === -1, 'expected the requestId to NOT be embedded in non-admin-visible markup (only needed for the admin buttons)');
});

// ── AC3/AC4/AC5: client-side handler wiring ──────────────────────────────
await checkAsyncOrSync('AC3: approveHandler_source_callsRealEndpointWithCsrfAndUpdatesRow', async () => {
  var pool = makeMockPool({
    prodRow: { name: 'P', tenant_id: 't1', repo_owner: 'org', repo_name: 'repo' },
    pendingRequests: [{ request_id: 'req-3', file_path: '.github/architecture-guardrails.md', status: 'pending' }]
  });
  var req = mockReq();
  var res = mockRes();
  await products.handleGetProductGuardrailsView(req, res, null, pool);
  var body = res._get().body;
  assert.ok(/function wugsApprove/.test(body), 'expected a wugsApprove client-side handler function in the rendered page');
  var fnMatch = body.match(/function wugsApprove[\s\S]*?\n\s*\}/);
  assert.ok(fnMatch, 'expected to extract wugsApprove function source');
  var fnSrc = fnMatch[0];
  assert.ok(/\.disabled\s*=\s*true/.test(fnSrc), 'expected the button to be disabled on click');
  assert.ok(/fetch\(/.test(fnSrc) && /\/api\/admin\/promotions\//.test(fnSrc) && /approve/.test(fnSrc), 'expected a fetch call to the real approve endpoint');
  assert.ok(/_csrf/.test(fnSrc), 'expected the CSRF token to be included in the request');
  assert.ok(/method:\s*["']POST["']/.test(fnSrc), 'expected a POST request');
});

await checkAsyncOrSync('AC4: rejectHandler_source_callsRealEndpointWithCsrfAndUpdatesRow', async () => {
  var pool = makeMockPool({
    prodRow: { name: 'P', tenant_id: 't1', repo_owner: 'org', repo_name: 'repo' },
    pendingRequests: [{ request_id: 'req-4', file_path: '.github/architecture-guardrails.md', status: 'pending' }]
  });
  var req = mockReq();
  var res = mockRes();
  await products.handleGetProductGuardrailsView(req, res, null, pool);
  var body = res._get().body;
  assert.ok(/function wugsReject/.test(body), 'expected a wugsReject client-side handler function in the rendered page');
  var fnMatch = body.match(/function wugsReject[\s\S]*?\n\s*\}/);
  assert.ok(fnMatch, 'expected to extract wugsReject function source');
  var fnSrc = fnMatch[0];
  assert.ok(/\.disabled\s*=\s*true/.test(fnSrc), 'expected the button to be disabled on click');
  assert.ok(/fetch\(/.test(fnSrc) && /\/api\/admin\/promotions\//.test(fnSrc) && /reject/.test(fnSrc), 'expected a fetch call to the real reject endpoint');
  assert.ok(/_csrf/.test(fnSrc), 'expected the CSRF token to be included in the request');
});

await checkAsyncOrSync('AC5: approveAndRejectHandlers_failurePath_reEnableButtonAndShowError', async () => {
  var pool = makeMockPool({
    prodRow: { name: 'P', tenant_id: 't1', repo_owner: 'org', repo_name: 'repo' },
    pendingRequests: [{ request_id: 'req-5', file_path: '.github/architecture-guardrails.md', status: 'pending' }]
  });
  var req = mockReq();
  var res = mockRes();
  await products.handleGetProductGuardrailsView(req, res, null, pool);
  var body = res._get().body;
  ['wugsApprove', 'wugsReject'].forEach(function (fnName) {
    var fnMatch = body.match(new RegExp('function ' + fnName + '[\\s\\S]*?catch[\\s\\S]*?\\}\\s*\\)'));
    assert.ok(fnMatch, 'expected to find ' + fnName + '\'s own catch/failure branch');
    var fnSrc = fnMatch[0];
    assert.ok(/\.disabled\s*=\s*false/.test(fnSrc), fnName + ': expected the button to re-enable on failure');
    assert.ok(/alert\(/.test(fnSrc), fnName + ': expected a clear error to be surfaced on failure');
  });
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
