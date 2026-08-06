'use strict';
// check-mtrr-s2-repo-connection-picker.js — mtrr-s2
//
// Verifies the repo-connection picker (mtrr-s2): a UI that lists the
// operator's own accessible GitHub repos (via their OAuth credential) as the
// PRIMARY way to connect a product to a repo, replacing the bare URL-entry
// field's default position -- while keeping URL entry as the mandatory
// fallback when listing fails (rate limit / scope / network), per the
// story's ACs (artefacts/2026-08-06-multi-tenant-repo-resolution/stories/
// mtrr-s2-repo-connection-picker.md) and test plan (test-plans/
// mtrr-s2-test-plan.md). Follows this repo's hand-rolled assert-based test
// convention (see tests/check-prc-s1.2-connect-repo.js), not Jest/Mocha.
//
// AC1: picker lists accessible repos as the primary path
// AC2: selecting a repo writes the exact same repo_provider/repo_owner/
//      repo_name columns the URL-entry flow already writes (reuses
//      handlePutProductEdit's existing repo-association path, no new write
//      path)
// AC3: a rate-limit/scope/network failure falls back to the URL-entry field,
//      with a message -- the operator is never left with no way to proceed
// AC4: search/filter narrows a large repo list
// NFR (Performance): the repo list is cached within a session -- a second
//      render never re-calls the GitHub API

var assert = require('assert');
var path = require('path');

var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
var REPO_PICKER_PATH = path.resolve(__dirname, '../src/web-ui/modules/repo-picker.js');

function freshRequire(p) { delete require.cache[require.resolve(p)]; return require(p); }

var passed = 0;
var failed = 0;
function pass(name) { console.log('  [PASS] ' + name); passed++; }
function fail(name, err) { console.error('  [FAIL] ' + name + ': ' + (err && err.message || err)); failed++; }

function fixtureRepos(n) {
  var out = [];
  for (var i = 0; i < n; i++) {
    out.push({ owner: 'acme', name: 'repo-' + i, fullName: 'acme/repo-' + i });
  }
  return out;
}

function mockRes() {
  return { _s: null, _b: null, status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; return this; } };
}

function mockPool(existingOwner, existingName) {
  var queries = [];
  return {
    _queries: queries,
    query: function(sql, params) {
      queries.push({ sql: sql, params: params });
      if (/SELECT product_id, tenant_id FROM products WHERE product_id/i.test(sql)) {
        return Promise.resolve({ rows: [{ product_id: params[0], tenant_id: 'tenant-1' }] });
      }
      if (/UPDATE products SET repo_provider/i.test(sql)) {
        return Promise.resolve({ rowCount: 1 });
      }
      return Promise.resolve({ rows: [] });
    }
  };
}

(async function main() {
  // T1 (AC1) — picker lists accessible repos as the primary path, not a
  // bare URL-entry field.
  try {
    var products1 = freshRequire(PRODUCTS_ROUTE_PATH);
    var repoPickerResult = { ok: true, repos: fixtureRepos(3) };
    var html = products1._renderProductView(
      'Test Product', 'prod-1', [], 'testuser', null, false,
      null, null, [], 'csrf', {}, {}, [], 0,
      repoPickerResult
    );
    assert.ok(html.indexOf('acme/repo-0') !== -1, 'expected the fixture repo list to be rendered');
    assert.ok(html.indexOf('acme/repo-1') !== -1, 'expected the fixture repo list to be rendered');
    var pickerIdx = html.indexOf('rpc-picker-list');
    var manualIdx = html.indexOf('id="rpc-connect-owner"');
    assert.ok(pickerIdx !== -1, 'expected a repo picker list element to be present');
    // AC1: the picker must be the PRIMARY (not-hidden) path. The manual URL
    // fields may still exist in the markup as a fallback escape hatch, but
    // must not be the visible-by-default panel when the picker succeeded.
    var manualPanelMatch = /id="rpc-connect-panel"[^>]*style="([^"]*)"/.exec(html);
    assert.ok(manualPanelMatch, 'expected a manual connect panel element to exist as a fallback');
    assert.ok(/display:\s*none/.test(manualPanelMatch[1]), 'manual URL-entry panel must not be the default-visible view when the picker has repos (AC1: picker is primary)');
    pass('AC1: picker lists accessible repos as the primary path, not a bare URL-entry field');
  } catch (e) { fail('AC1: picker lists accessible repos as the primary path, not a bare URL-entry field', e); }

  // T2 (AC2) — selecting a repo from the picker reaches handlePutProductEdit
  // with the same {owner, repo} shape the URL-entry flow already uses,
  // producing an identical UPDATE.
  try {
    var products2 = freshRequire(PRODUCTS_ROUTE_PATH);
    var repoAdapter2 = freshRequire(path.resolve(__dirname, '../src/web-ui/adapters/repo-adapter.js'));
    repoAdapter2.setRepoAdapter(function() { return Promise.resolve({ hasAccess: true, status: 200 }); });

    var pool = mockPool();
    var res = mockRes();
    // Simulates the picker's rpcSelectRepo(productId, owner, repo) client
    // call: PUT /products/:id with {owner, repo} -- byte-identical to what
    // rpcSubmitConnect (the existing URL-entry flow) already sends.
    var req = {
      params: { id: 'prod-2' },
      session: { tenantId: 'tenant-1', login: 'alice', accessToken: 'tok' },
      body: { owner: 'acme', repo: 'repo-1' }
    };
    await products2.handlePutProductEdit(req, res, null, pool, { capture: function() {} });

    var updateCall = pool._queries.find(function(q) { return /UPDATE products SET repo_provider/i.test(q.sql); });
    assert.ok(updateCall, 'expected the picker selection to reach an UPDATE via the existing repo-association path');
    assert.deepStrictEqual(updateCall.params, ['github', 'acme', 'repo-1', 'prod-2'], 'UPDATE params from a picker selection must match exactly what the URL-entry flow would have written for the same repo');
    assert.strictEqual(res._s, 200, 'expected a 200 from the shared repo-association path');
    pass('AC2: selecting a repo from the picker writes the exact same repo_provider/repo_owner/repo_name columns the URL-entry flow writes');
  } catch (e) { fail('AC2: selecting a repo from the picker writes the exact same repo_provider/repo_owner/repo_name columns the URL-entry flow writes', e); }

  // T3 (AC3) — a rate-limit/scope/network failure falls back to the
  // URL-entry field, with an explanatory message; the operator is never
  // left with nothing to interact with.
  try {
    var repoPicker3 = freshRequire(REPO_PICKER_PATH);
    repoPicker3._resetCacheForTests();
    var failingListRepos = function() { return Promise.reject(Object.assign(new Error('rate limited'), { status: 403 })); };
    var result3 = await repoPicker3.getAccessibleRepos('tok-fail', failingListRepos);
    assert.strictEqual(result3.ok, false, 'expected a failed listing to resolve {ok:false}, not throw');
    assert.ok(result3.message && typeof result3.message === 'string' && result3.message.length > 0, 'expected a human-readable fallback message');

    var products3 = freshRequire(PRODUCTS_ROUTE_PATH);
    var html3 = products3._renderProductView(
      'Test Product', 'prod-3', [], 'testuser', null, false,
      null, null, [], 'csrf', {}, {}, [], 0,
      result3
    );
    assert.ok(html3.indexOf('id="rpc-connect-owner"') !== -1, 'expected the URL-entry field to be present as the fallback');
    var manualPanelMatch3 = /id="rpc-connect-panel"[^>]*style="([^"]*)"/.exec(html3);
    assert.ok(manualPanelMatch3, 'expected the manual connect panel to exist');
    assert.ok(!/display:\s*none/.test(manualPanelMatch3[1]), 'expected the URL-entry field to be the VISIBLE fallback (not hidden) when the picker failed');
    assert.ok(html3.indexOf(result3.message) !== -1, 'expected the fallback explanation message to be rendered on the page');
    pass('AC3: rate-limit/scope/network failure falls back to the URL-entry field with a message, operator is never stuck');
  } catch (e) { fail('AC3: rate-limit/scope/network failure falls back to the URL-entry field with a message, operator is never stuck', e); }

  // T4 (AC4) — search/filter narrows a large (20+) repo list.
  try {
    var repoPicker4 = freshRequire(REPO_PICKER_PATH);
    var repos20 = fixtureRepos(25).concat([{ owner: 'other-org', name: 'special-widget', fullName: 'other-org/special-widget' }]);
    var narrowed = repoPicker4.filterRepoList(repos20, 'special');
    assert.strictEqual(narrowed.length, 1, 'expected the filter to narrow to exactly 1 matching repo');
    assert.strictEqual(narrowed[0].fullName, 'other-org/special-widget', 'expected the filter to match on fullName');

    var narrowedCaseInsensitive = repoPicker4.filterRepoList(repos20, 'SPECIAL');
    assert.strictEqual(narrowedCaseInsensitive.length, 1, 'expected the filter to be case-insensitive');

    var unfiltered = repoPicker4.filterRepoList(repos20, '');
    assert.strictEqual(unfiltered.length, 26, 'expected an empty query to return the full list, unfiltered');
    pass('AC4: search/filter narrows a large repo list correctly and case-insensitively');
  } catch (e) { fail('AC4: search/filter narrows a large repo list correctly and case-insensitively', e); }

  // T5 (AC1+AC2, integration) — load (mocked list) -> select -> persist,
  // producing a result identical to what a direct URL-entry submission
  // would produce for the same repo.
  try {
    var repoPicker5 = freshRequire(REPO_PICKER_PATH);
    repoPicker5._resetCacheForTests();
    var products5 = freshRequire(PRODUCTS_ROUTE_PATH);
    var repoAdapter5 = freshRequire(path.resolve(__dirname, '../src/web-ui/adapters/repo-adapter.js'));
    repoAdapter5.setRepoAdapter(function() { return Promise.resolve({ hasAccess: true, status: 200 }); });

    var listReposFn = function() { return Promise.resolve(fixtureRepos(5)); };
    var loadResult = await repoPicker5.getAccessibleRepos('tok-e2e', listReposFn);
    assert.ok(loadResult.ok && loadResult.repos.length === 5, 'expected the mocked list to load successfully');

    var chosen = loadResult.repos[2]; // acme/repo-2
    var pool5 = mockPool();
    var res5 = mockRes();
    var req5 = {
      params: { id: 'prod-5' },
      session: { tenantId: 'tenant-1', login: 'alice', accessToken: 'tok-e2e' },
      body: { owner: chosen.owner, repo: chosen.name }
    };
    await products5.handlePutProductEdit(req5, res5, null, pool5, { capture: function() {} });

    // Compare against what a direct URL-entry submission for the SAME repo
    // would produce.
    var pool5b = mockPool();
    var res5b = mockRes();
    var req5b = {
      params: { id: 'prod-5' },
      session: { tenantId: 'tenant-1', login: 'alice', accessToken: 'tok-e2e' },
      body: { owner: 'acme', repo: 'repo-2' }
    };
    await products5.handlePutProductEdit(req5b, res5b, null, pool5b, { capture: function() {} });

    var updateA = pool5._queries.find(function(q) { return /UPDATE products SET repo_provider/i.test(q.sql); });
    var updateB = pool5b._queries.find(function(q) { return /UPDATE products SET repo_provider/i.test(q.sql); });
    assert.deepStrictEqual(updateA.params, updateB.params, 'picker-driven connection must persist an identical row to a direct URL-entry submission for the same repo');
    pass('AC1+AC2 (integration): load -> select -> persist produces an identical result to a direct URL-entry submission for the same repo');
  } catch (e) { fail('AC1+AC2 (integration): load -> select -> persist produces an identical result to a direct URL-entry submission for the same repo', e); }

  // T6 (NFR: Performance) — the repo list is cached within a session; a
  // second render never re-calls the GitHub API, and both resolve well
  // under 2 seconds.
  try {
    var repoPicker6 = freshRequire(REPO_PICKER_PATH);
    repoPicker6._resetCacheForTests();
    var callCount = 0;
    var listReposFn6 = function() {
      callCount++;
      return Promise.resolve(fixtureRepos(10));
    };

    var t0 = Date.now();
    var first = await repoPicker6.getAccessibleRepos('tok-cache', listReposFn6);
    var second = await repoPicker6.getAccessibleRepos('tok-cache', listReposFn6);
    var elapsedMs = Date.now() - t0;

    assert.strictEqual(callCount, 1, 'expected the underlying adapter to be called exactly once across two renders within the same session (cache hit on the second)');
    assert.ok(first.ok && second.ok, 'expected both calls to resolve successfully');
    assert.deepStrictEqual(first.repos, second.repos, 'expected the cached result to be returned unchanged on the second render');
    assert.ok(elapsedMs < 2000, 'expected both renders combined to complete well under the 2-second NFR threshold, took ' + elapsedMs + 'ms');
    pass('NFR (Performance): repo list is cached within a session -- a second render does not re-call the GitHub API, both complete under 2 seconds');
  } catch (e) { fail('NFR (Performance): repo list is cached within a session -- a second render does not re-call the GitHub API, both complete under 2 seconds', e); }

  console.log('\n[mtrr-s2] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
