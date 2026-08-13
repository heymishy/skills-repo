'use strict';
// check-wugs-s9-approve-reject-promotion.js — wugs-s9
//
// Unit/integration tests for admin approve/reject of wugs-s8's promotion
// requests: race-safe resolution via a single conditional UPDATE, reuses
// wugs-s6's real write adapter on approval.

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

// state.pendingRow: the row an UPDATE ... WHERE status='pending' should
// return (null = already resolved / no matching row). state.orgRepoRow:
// tenant_org_repo row (null = not designated). calls: records every query.
function makeMockPool(state, calls) {
  return {
    query: async function (sql, params) {
      var s = String(sql);
      if (calls) calls.push({ sql: s, params: params });
      if (/SELECT repo_owner, repo_name FROM tenant_org_repo WHERE tenant_id/i.test(s)) {
        return { rows: state.orgRepoRow ? [state.orgRepoRow] : [] };
      }
      if (/UPDATE guardrail_promotion_requests SET status = \$1, resolved_by = \$2, resolved_at = NOW\(\) WHERE request_id = \$3 AND tenant_id = \$4 AND status = \$5/i.test(s)) {
        return { rows: state.pendingRow ? [state.pendingRow] : [] };
      }
      if (/UPDATE guardrail_promotion_requests SET pr_number = \$1 WHERE request_id = \$2/i.test(s)) {
        return { rows: [] };
      }
      if (/UPDATE guardrail_promotion_requests SET status = \$1 WHERE request_id = \$2/i.test(s)) {
        return { rows: [] };
      }
      return { rows: [] };
    }
  };
}

async function withMockedWriteAdapter(mockFn, testFn) {
  var original = guardrailPrAdapter.getGuardrailPrAdapter();
  guardrailPrAdapter.setGuardrailPrAdapter(mockFn);
  try { await testFn(); } finally { guardrailPrAdapter.setGuardrailPrAdapter(original); }
}

(async () => {

// ── AC1: approval invokes wugs-s6's adapter, records PR number ──────────
await checkAsync('AC1: approveRequest_pending_invokesWriteAdapterAndRecordsPr', async () => {
  var calls = [];
  var pool = makeMockPool({
    orgRepoRow: { repo_owner: 'org-co', repo_name: 'org-repo' },
    pendingRow: { request_id: 'req-1', product_id: 'p1', file_path: 'standards/saas-gui.md', content_snapshot: 'SNAPSHOT CONTENT' }
  }, calls);
  await withMockedWriteAdapter(async function (token, owner, repo, targetPath, content, options) {
    assert.strictEqual(owner, 'org-co', 'expected the write to target the ORG repo, not the product repo');
    assert.strictEqual(repo, 'org-repo');
    assert.strictEqual(targetPath, 'standards/saas-gui.md', 'expected the request\'s own file_path');
    assert.strictEqual(content, 'SNAPSHOT CONTENT', 'expected the request\'s content_snapshot, not a fresh re-read');
    return { prNumber: 7, prUrl: 'https://github.com/org-co/org-repo/pull/7' };
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handlePostApprovePromotion(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode + ' body: ' + result.body);
    var prNumberUpdate = calls.find(function (c) { return /SET pr_number = \$1/i.test(c.sql); });
    assert.ok(prNumberUpdate, 'expected a second UPDATE recording the PR number');
    assert.strictEqual(prNumberUpdate.params[0], 7);
    var body = JSON.parse(result.body);
    assert.strictEqual(body.prNumber, 7);
  });
});

// ── review fix: CSRF guard blocks approval, no state change ─────────────
await checkAsync('review: approveRequest_missingCsrf_rejected403NoStateChange', async () => {
  var calls = [];
  var pool = makeMockPool({
    orgRepoRow: { repo_owner: 'org-co', repo_name: 'org-repo' },
    pendingRow: { request_id: 'req-1', product_id: 'p1', file_path: 'standards/saas-gui.md', content_snapshot: 'X' }
  }, calls);
  var req = mockReq({ body: { _csrf: 'wrong-token' } });
  var res = mockRes();
  await products.handlePostApprovePromotion(req, res, null, pool);
  var result = res._get();
  assert.strictEqual(result.statusCode, 403, 'expected 403 for a CSRF token mismatch');
  var claimUpdate = calls.find(function (c) { return /SET status = \$1, resolved_by = \$2/i.test(c.sql); });
  assert.ok(!claimUpdate, 'expected NO state change -- the CSRF guard must block before any DB write');
});

// ── review fix: write-adapter failure reverts the claim back to pending ─
await checkAsync('review: approveRequest_writeAdapterFails_revertsToPendingWith500', async () => {
  var calls = [];
  var pool = makeMockPool({
    orgRepoRow: { repo_owner: 'org-co', repo_name: 'org-repo' },
    pendingRow: { request_id: 'req-1', product_id: 'p1', file_path: 'standards/saas-gui.md', content_snapshot: 'X' }
  }, calls);
  await withMockedWriteAdapter(async function () {
    throw new Error('simulated GitHub API failure');
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handlePostApprovePromotion(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 500, 'expected 500 on write-adapter failure, got: ' + result.statusCode + ' body: ' + result.body);
    var revertUpdate = calls.find(function (c) { return /SET status = \$1 WHERE request_id = \$2/i.test(c.sql) && c.params[0] === 'pending'; });
    assert.ok(revertUpdate, 'expected a compensating UPDATE reverting status back to pending so the admin can retry');
    assert.strictEqual(revertUpdate.params[1], 'req-1');
  });
});

// ── review fix: GuardrailPrConflictError on write gets its own 409 ──────
await checkAsync('review: approveRequest_writeAdapterConflict_409NotGeneric500', async () => {
  var calls = [];
  var pool = makeMockPool({
    orgRepoRow: { repo_owner: 'org-co', repo_name: 'org-repo' },
    pendingRow: { request_id: 'req-1', product_id: 'p1', file_path: 'standards/saas-gui.md', content_snapshot: 'X' }
  }, calls);
  await withMockedWriteAdapter(async function () {
    throw new guardrailPrAdapter.GuardrailPrConflictError('stale sha');
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handlePostApprovePromotion(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 409, 'expected 409 for a stale-SHA conflict, matching handlePostOrgRepoSettings\'s sibling handling');
    var revertUpdate = calls.find(function (c) { return /SET status = \$1 WHERE request_id = \$2/i.test(c.sql) && c.params[0] === 'pending'; });
    assert.ok(revertUpdate, 'expected the request to be reverted to pending even on a conflict, so it can be retried');
  });
});

// ── AC2: rejection sets status, no write ─────────────────────────────────
await checkAsync('AC2: rejectRequest_pending_setsStatusNoWrite', async () => {
  var calls = [];
  var writeAdapterCalled = false;
  var pool = makeMockPool({
    pendingRow: { request_id: 'req-1', product_id: 'p1', file_path: 'standards/saas-gui.md', content_snapshot: 'SNAPSHOT CONTENT' }
  }, calls);
  await withMockedWriteAdapter(async function () { writeAdapterCalled = true; return { prNumber: 999, prUrl: 'should-never-be-called' }; }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handlePostRejectPromotion(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode + ' body: ' + result.body);
    assert.strictEqual(writeAdapterCalled, false, 'expected wugs-s6\'s write adapter to NEVER be called for a rejection');
    var claimUpdate = calls.find(function (c) { return /SET status = \$1, resolved_by = \$2/i.test(c.sql); });
    assert.ok(claimUpdate, 'expected the atomic claim UPDATE');
    assert.strictEqual(claimUpdate.params[0], 'rejected');
  });
});

// ── AC3: non-admin approve rejected server-side, no state change ────────
await checkAsync('AC3: resolveRequest_nonAdmin_approveRejected403', async () => {
  var calls = [];
  var pool = makeMockPool({
    orgRepoRow: { repo_owner: 'org-co', repo_name: 'org-repo' },
    pendingRow: { request_id: 'req-1', product_id: 'p1', file_path: 'standards/saas-gui.md', content_snapshot: 'X' }
  }, calls);
  var req = mockReq({ session: { accessToken: 'tok', tenantId: 't1', login: 'engineer-bob', role: 'engineer', csrfToken: 'ct1' } });
  var res = mockRes();
  await products.handlePostApprovePromotion(req, res, null, pool);
  var result = res._get();
  assert.strictEqual(result.statusCode, 403, 'expected 403 for a non-admin, matching-role session');
  var claimUpdate = calls.find(function (c) { return /SET status = \$1, resolved_by = \$2/i.test(c.sql); });
  assert.ok(!claimUpdate, 'expected NO state change -- the role gate must block before any DB write');
});

// ── AC3: non-admin reject rejected server-side, no state change ─────────
await checkAsync('AC3: resolveRequest_nonAdmin_rejectRejected403', async () => {
  var calls = [];
  var pool = makeMockPool({
    pendingRow: { request_id: 'req-1', product_id: 'p1', file_path: 'standards/saas-gui.md', content_snapshot: 'X' }
  }, calls);
  var req = mockReq({ session: { accessToken: 'tok', tenantId: 't1', login: 'engineer-bob', role: 'engineer', csrfToken: 'ct1' } });
  var res = mockRes();
  await products.handlePostRejectPromotion(req, res, null, pool);
  var result = res._get();
  assert.strictEqual(result.statusCode, 403, 'expected 403 for a non-admin, matching-role session');
  var claimUpdate = calls.find(function (c) { return /SET status = \$1, resolved_by = \$2/i.test(c.sql); });
  assert.ok(!claimUpdate, 'expected NO state change -- the role gate must block before any DB write');
});

// ── AC4: no org repo designated — approval blocked with a clear error ───
await checkAsync('AC4: resolveRequest_noOrgRepo_blockedWithClearError', async () => {
  var calls = [];
  var pool = makeMockPool({
    orgRepoRow: null,
    pendingRow: { request_id: 'req-1', product_id: 'p1', file_path: 'standards/saas-gui.md', content_snapshot: 'X' }
  }, calls);
  var req = mockReq();
  var res = mockRes();
  await products.handlePostApprovePromotion(req, res, null, pool);
  var result = res._get();
  assert.strictEqual(result.statusCode, 422, 'expected 422 (not a silent failure)');
  assert.ok(/org repo/i.test(result.body), 'expected a clear error mentioning the org repo');
  var claimUpdate = calls.find(function (c) { return /SET status = \$1, resolved_by = \$2/i.test(c.sql); });
  assert.ok(!claimUpdate, 'expected the request to remain untouched -- no wasted atomic claim on a doomed approval');
});

// ── AC5: concurrent resolution -- only the first call wins ──────────────
await checkAsync('AC5: resolveRequest_concurrentCalls_onlyFirstUpdateSucceeds', async () => {
  var calls = [];
  var claimCallCount = 0;
  var pool = {
    query: async function (sql, params) {
      var s = String(sql);
      calls.push({ sql: s, params: params });
      if (/SELECT repo_owner, repo_name FROM tenant_org_repo WHERE tenant_id/i.test(s)) {
        return { rows: [{ repo_owner: 'org-co', repo_name: 'org-repo' }] };
      }
      if (/UPDATE guardrail_promotion_requests SET status = \$1, resolved_by = \$2, resolved_at = NOW\(\) WHERE request_id = \$3 AND tenant_id = \$4 AND status = \$5/i.test(s)) {
        claimCallCount++;
        // Simulate real Postgres behaviour: only the FIRST conditional
        // UPDATE actually finds a row still in 'pending' -- the second
        // one (fired after the first already flipped the status) matches
        // zero rows, exactly as a real DB would return under this race.
        return claimCallCount === 1
          ? { rows: [{ request_id: 'req-1', product_id: 'p1', file_path: 'standards/saas-gui.md', content_snapshot: 'X' }] }
          : { rows: [] };
      }
      if (/UPDATE guardrail_promotion_requests SET pr_number = \$1 WHERE request_id = \$2/i.test(s)) { return { rows: [] }; }
      return { rows: [] };
    }
  };
  var writeAdapterCallCount = 0;
  await withMockedWriteAdapter(async function () { writeAdapterCallCount++; return { prNumber: 42, prUrl: 'https://github.com/org-co/org-repo/pull/42' }; }, async function () {
    var req1 = mockReq();
    var res1 = mockRes();
    var req2 = mockReq({ session: { accessToken: 'tok', tenantId: 't1', login: 'admin-carol', role: 'admin', csrfToken: 'ct1' } });
    var res2 = mockRes();
    await products.handlePostApprovePromotion(req1, res1, null, pool);
    await products.handlePostApprovePromotion(req2, res2, null, pool);
    assert.strictEqual(res1._get().statusCode, 200, 'expected the first call to succeed');
    assert.strictEqual(res2._get().statusCode, 409, 'expected the second call to get "already resolved", not a duplicate success');
    assert.strictEqual(writeAdapterCallCount, 1, 'expected the write adapter to be invoked exactly ONCE, not twice -- no duplicate PR');
    var claimAttempts = calls.filter(function (c) { return /SET status = \$1, resolved_by = \$2/i.test(c.sql); });
    assert.strictEqual(claimAttempts.length, 2, 'expected both admins to attempt the atomic claim -- only the DB\'s WHERE clause decides the winner, not application logic');
  });
});

// ── Wiring: both admin routes are registered in server.js ───────────────
check('wiring: server_js_routes_adminPromotionsApproveReject_to_handlers', () => {
  var fs = require('fs');
  var serverSrc = fs.readFileSync(require.resolve('../src/web-ui/server.js'), 'utf8');
  assert.ok(serverSrc.indexOf('/api/admin/promotions') !== -1, 'expected server.js to route /api/admin/promotions/:requestId/approve|reject');
  assert.ok(serverSrc.indexOf('handlePostApprovePromotion') !== -1, 'expected server.js to reference handlePostApprovePromotion');
  assert.ok(serverSrc.indexOf('handlePostRejectPromotion') !== -1, 'expected server.js to reference handlePostRejectPromotion');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
