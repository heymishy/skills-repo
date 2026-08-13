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

// ── Shared test helper: mock a single GitHub PR-status response ─────────
function mockPrStatusFetch(state, merged) {
  return async function (url) {
    return {
      ok: true,
      status: 200,
      json: async function () { return { state: state, merged: !!merged, number: 42, html_url: 'https://github.com/acme/widgets/pull/42' }; }
    };
  };
}

// ── AC1: pending PR shows indicator + link ───────────────────────────────
await checkAsync('AC1: handleGetGuardrailsView_pendingPr_showsIndicatorAndLink', async () => {
  var deletedIds = [];
  var pool = makeMockPool([
    { id: 'row-1', tenant_id: 't1', product_id: 'p1', path: '.github/architecture-guardrails.md', pr_number: 42, pr_url: 'https://github.com/acme/widgets/pull/42' }
  ], deletedIds);
  var originalFetch = global.fetch;
  global.fetch = mockPrStatusFetch('open', false);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    var artefactFetcher = require('../src/web-ui/adapters/artefact-fetcher');
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    try {
      var req = mockReq();
      var res = mockRes();
      await products.handleGetProductGuardrailsView(req, res, null, pool);
      var result = res._get();
      assert.strictEqual(result.statusCode, 200);
      assert.ok(/Pending review/i.test(result.body), 'expected a "Pending review" text indicator');
      assert.ok(result.body.indexOf('https://github.com/acme/widgets/pull/42') !== -1, 'expected a real link to the PR URL');
      assert.strictEqual(deletedIds.length, 0, 'an open PR must not clear its tracking row');
    } finally { global.fetch = originalFetch; }
  });
});

// ── Error isolation: one row's status check throwing must not crash the
// whole view, nor affect any other row's resolution (Task 2 review fix) ──
await checkAsync('errorIsolation: onePrStatusCheckThrows_otherRowsStillResolveAndViewRenders', async () => {
  var deletedIds = [];
  var pool = makeMockPool([
    { id: 'row-1', tenant_id: 't1', product_id: 'p1', path: 'standards/foo.md', pr_number: 1, pr_url: 'https://github.com/acme/widgets/pull/1' },
    { id: 'row-2', tenant_id: 't1', product_id: 'p1', path: '.github/architecture-guardrails.md', pr_number: 2, pr_url: 'https://github.com/acme/widgets/pull/2' }
  ], deletedIds);
  var originalFetch = global.fetch;
  global.fetch = async function (url) {
    if (String(url).indexOf('/pulls/1') !== -1) {
      throw new Error('simulated GitHub API failure for PR #1');
    }
    if (String(url).indexOf('/pulls/2') !== -1) {
      return {
        ok: true,
        status: 200,
        json: async function () { return { state: 'open', merged: false, number: 2, html_url: 'https://github.com/acme/widgets/pull/2' }; }
      };
    }
    throw new Error('unexpected fetch URL in test: ' + url);
  };
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    var artefactFetcher = require('../src/web-ui/adapters/artefact-fetcher');
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    try {
      var req = mockReq();
      var res = mockRes();
      await products.handleGetProductGuardrailsView(req, res, null, pool);
      var result = res._get();
      assert.strictEqual(result.statusCode, 200, 'expected the view to still render 200 despite one PR status check throwing');
      assert.ok(/Pending review — PR #2/.test(result.body), 'expected PR #2\'s pending badge to still show correctly');
      assert.strictEqual(deletedIds.indexOf('row-1'), -1, 'row-1 (status check threw) must NOT be deleted');
    } finally { global.fetch = originalFetch; }
  });
});

// ── AC2: merged PR clears indicator, shows new content ───────────────────
await checkAsync('AC2: handleGetGuardrailsView_mergedPr_clearsIndicatorShowsNewContent', async () => {
  var deletedIds = [];
  var pool = makeMockPool([
    { id: 'row-1', tenant_id: 't1', product_id: 'p1', path: '.github/architecture-guardrails.md', pr_number: 42, pr_url: 'https://github.com/acme/widgets/pull/42' }
  ], deletedIds);
  var originalFetch = global.fetch;
  global.fetch = mockPrStatusFetch('closed', true);
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (path === '.github/architecture-guardrails.md') { return 'THE NEW MERGED CONTENT'; }
    var artefactFetcher = require('../src/web-ui/adapters/artefact-fetcher');
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    try {
      var req = mockReq();
      var res = mockRes();
      await products.handleGetProductGuardrailsView(req, res, null, pool);
      var result = res._get();
      assert.strictEqual(result.statusCode, 200);
      assert.ok(!/Pending review/i.test(result.body), 'expected no pending indicator once merged');
      assert.ok(result.body.indexOf('THE NEW MERGED CONTENT') !== -1, 'expected the new merged content to show via the normal live-read path');
      assert.deepStrictEqual(deletedIds, ['row-1'], 'expected the tracking row to be cleared');
    } finally { global.fetch = originalFetch; }
  });
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
