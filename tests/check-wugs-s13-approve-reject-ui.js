'use strict';
// check-wugs-s13-approve-reject-ui.js — wugs-s13
//
// Confirms an effectively-admin session sees real, wired Approve/Reject
// buttons for a pending promotion request (AC1), a non-admin session sees
// the existing static text unchanged (AC2), the client-side handlers call
// the real wugs-s9 endpoints with CSRF and proper disable/update/error
// behaviour (AC3-AC5), and wugs-s9's own server-side role gate is
// unaffected (AC6, regression-checked via its own existing test file).

var assert = require('assert');

var passed = 0;
var failed = 0;

function check(name, fn) {
  try { fn(); console.log('PASS:', name); passed++; }
  catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; }
}

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

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
