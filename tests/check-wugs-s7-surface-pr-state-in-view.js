'use strict';
// check-wugs-s7-surface-pr-state-in-view.js — wugs-s7
//
// Unit/integration tests for surfacing pending/merged/closed PR state in the
// guardrails/standards view: tracks PRs opened by wugs-s6's write adapter in
// guardrail_pending_prs, live-checks status on each view render.

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

function mockReq(overrides) {
  return Object.assign({
    params: { id: 'p1' },
    session: { accessToken: 'tok', tenantId: 't1', login: 'alice', csrfToken: 'ct1' }
  }, overrides || {});
}

function mockRes() {
  var _statusCode = null;
  var _body = '';
  return {
    writeHead: function (code) { _statusCode = code; return this; },
    end: function (body) { if (body != null) _body = body; },
    _get: function () { return { statusCode: _statusCode, body: _body }; }
  };
}

// Mock pool: product lookup, nav summary, and guardrail_pending_prs rows/deletes.
function makeMockPool(pendingRows, deletedIds) {
  return {
    query: async function (sql, params) {
      var s = String(sql);
      if (/SELECT name, tenant_id, repo_owner, repo_name FROM products WHERE product_id/i.test(s)) {
        return { rows: [{ name: 'Test Product', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }] };
      }
      if (/SELECT product_id, name, created_at FROM products WHERE tenant_id/i.test(s)) { return { rows: [] }; }
      if (/SELECT journey_id, created_at AS updated_at FROM journeys WHERE product_id/i.test(s)) { return { rows: [] }; }
      if (/SELECT journey_id FROM journeys WHERE tenant_id.*product_id IS NULL/i.test(s)) { return { rows: [] }; }
      if (/SELECT .* FROM guardrail_pending_prs WHERE tenant_id/i.test(s)) {
        return { rows: (pendingRows || []) };
      }
      if (/INSERT INTO guardrail_pending_prs/i.test(s)) { return { rows: [] }; }
      if (/DELETE FROM guardrail_pending_prs WHERE id/i.test(s)) {
        if (deletedIds) deletedIds.push(params[0]);
        return { rows: [] };
      }
      return { rows: [] };
    }
  };
}

async function withMockedFetchRepoPath(mockFn, testFn) {
  var artefactFetcher = require('../src/web-ui/adapters/artefact-fetcher');
  var original = artefactFetcher.getFetchRepoPath();
  artefactFetcher.setFetchRepoPath(mockFn);
  try { await testFn(); } finally { artefactFetcher.setFetchRepoPath(original); }
}

(async () => {

// ── Task 1: tracking-row creation ────────────────────────────────────────
await checkAsync('trackPendingPr_afterSuccessfulWrite_insertsTrackingRow', async () => {
  var calls = [];
  var pool = {
    query: async function (sql, params) {
      calls.push({ sql: String(sql), params: params });
      return { rows: [] };
    }
  };
  await products._trackPendingPr(pool, 't1', 'p1', 'standards/new.md', 42, 'https://github.com/acme/widgets/pull/42');
  var insertCall = calls.find(function (c) { return /INSERT INTO guardrail_pending_prs/i.test(c.sql); });
  assert.ok(insertCall, 'expected an INSERT INTO guardrail_pending_prs to be issued');
  assert.deepStrictEqual(insertCall.params, ['t1', 'p1', 'standards/new.md', 42, 'https://github.com/acme/widgets/pull/42']);
});

// ── Wiring: server.js calls _trackPendingPr after a successful write ────
check('wiring: server_js_tracksNewPrAfterSuccessfulWrite', () => {
  var fs = require('fs');
  var serverSrc = fs.readFileSync(require.resolve('../src/web-ui/server.js'), 'utf8');
  assert.ok(serverSrc.indexOf('_trackPendingPr') !== -1, 'expected server.js to call _trackPendingPr after a successful guardrail write');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
