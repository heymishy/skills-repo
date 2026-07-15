'use strict';
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function() {
  // T1 (AC5 first half) — unwired adapter throws, never a silent safe-looking return
  try {
    // fresh require cache to get the pristine unwired module
    delete require.cache[require.resolve('../src/web-ui/adapters/repo-adapter')];
    const fresh = require('../src/web-ui/adapters/repo-adapter');
    let threw = false;
    let msg = '';
    try {
      await fresh.createRepo('fake-token', 'my-repo');
    } catch (e) {
      threw = true;
      msg = e.message;
    }
    assert(threw, 'createRepo did not throw when adapter is unwired');
    assert.strictEqual(msg, 'Adapter not wired: createRepoAdapter. Call setCreateRepoAdapter() with a real implementation before use.', 'wrong error message');
    pass('unwired createRepoAdapter throws the exact D37 error message, never a silent return');
  } catch (e) { fail('unwired createRepoAdapter throws the exact D37 error message, never a silent return', e); }

  const repoAdapter = require('../src/web-ui/adapters/repo-adapter');
  const { handlePostProductRepoCreate } = require('../src/web-ui/routes/products');

  function makeMockPool(state) {
    const queries = [];
    return {
      _queries: queries,
      query: async function(sql, params) {
        queries.push({ sql, params });
        if (/UPDATE products SET repo_provider/i.test(sql)) {
          return { rows: [{ product_id: state.productId }] };
        }
        return { rows: [] };
      }
    };
  }

  // T2 (AC1) — creating a new repo sets the product's repo_* columns
  try {
    repoAdapter.setCreateRepoAdapter(async function(token, name) {
      assert.strictEqual(token, 'fake-token-abc', 'createRepo not called with the session accessToken');
      return { owner: { login: 'jane' }, name: name };
    });
    const pool = makeMockPool({ productId: 'prod-1' });
    const ph = { _caps: [], capture: function(id, ev, props) { this._caps.push({ id, ev, props }); } };
    const req = { session: { tenantId: 'tx', login: 'jane', accessToken: 'fake-token-abc' }, params: { id: 'prod-1' }, body: { name: 'my-product' } };
    const res = { json: function(b) { this._b = b; }, _b: null, status: function(c) { this._s = c; return this; } };

    await handlePostProductRepoCreate(req, res, null, pool, ph);

    const updateCall = pool._queries.find(q => /UPDATE products SET repo_provider/i.test(q.sql));
    assert(updateCall, 'no UPDATE products call made');
    assert.deepStrictEqual(updateCall.params, ['github', 'jane', 'my-product', 'prod-1'], 'UPDATE params did not set repo_provider/repo_owner/repo_name correctly');
    assert(res._s === 200 || res._s === 201 || res._b, 'no success response sent');
    pass('creating a new repo sets repo_provider=github, repo_owner, repo_name on the product');
  } catch (e) { fail('creating a new repo sets repo_provider=github, repo_owner, repo_name on the product', e); }

  // T3 (AC2) — name collision is rejected with a clear error, no columns written
  try {
    repoAdapter.setCreateRepoAdapter(async function() {
      throw new repoAdapter.RepoNameTakenError('taken-name');
    });
    const pool = makeMockPool({ productId: 'prod-2' });
    const ph = { capture: function() {} };
    const req = { session: { tenantId: 'tx', login: 'jane', accessToken: 'fake-token-abc' }, params: { id: 'prod-2' }, body: { name: 'taken-name' } };
    const res = { json: function(b) { this._b = b; }, _b: null, status: function(c) { this._s = c; return this; } };

    await handlePostProductRepoCreate(req, res, null, pool, ph);

    assert(res._s >= 400 && res._s < 500, `Expected a 4xx error status, got ${res._s}`);
    assert(res._b && /already/i.test(res._b.error || ''), 'error message does not identify the name collision specifically');
    assert(!pool._queries.some(q => /UPDATE products SET repo_provider/i.test(q.sql)), 'product row was written despite a name collision');
    pass('a repo name collision is rejected with a clear "already taken" error; zero product writes');
  } catch (e) { fail('a repo name collision is rejected with a clear "already taken" error; zero product writes', e); }

  // T4 (AC3) — non-GitHub-authenticated session is redirected to account linking
  try {
    const pool = makeMockPool({ productId: 'prod-3' });
    const ph = { capture: function() {} };
    const req = { session: { tenantId: 'tx', login: 'jane@example.com' }, params: { id: 'prod-3' }, body: { name: 'whatever' } };
    const res = { json: function(b) { this._b = b; }, _b: null, status: function(c) { this._s = c; return this; } };

    let fetchCalls = 0;
    const _origFetch = global.fetch;
    global.fetch = function() { fetchCalls++; return _origFetch.apply(this, arguments); };
    try {
      await handlePostProductRepoCreate(req, res, null, pool, ph);
    } finally {
      global.fetch = _origFetch;
    }

    assert.strictEqual(fetchCalls, 0, 'a GitHub API call was made despite no accessToken in session');
    assert(res._s === 401 || res._s === 403, `Expected 401/403 for no-GitHub-token session, got ${res._s}`);
    assert(res._b && res._b.linkUrl === '/settings/link-account/github/start', 'response does not direct to the real GET /settings/link-account/github/start route');
    assert(!pool._queries.some(q => /UPDATE products SET repo_provider/i.test(q.sql)), 'product row was written despite no GitHub token');
    pass('a session without a GitHub token is directed to /settings/link-account/github/start; zero writes, zero GitHub calls');
  } catch (e) { fail('a session without a GitHub token is directed to /settings/link-account/github/start; zero writes, zero GitHub calls', e); }

  // T5 (AC4) — repo_* columns are written before the response is sent (no partial-configuration window)
  try {
    const order = [];
    repoAdapter.setCreateRepoAdapter(async function(token, name) {
      order.push('createRepo');
      return { owner: { login: 'jane' }, name: name };
    });
    const pool = {
      _queries: [],
      query: async function(sql, params) {
        this._queries.push({ sql, params });
        if (/UPDATE products SET repo_provider/i.test(sql)) { order.push('update'); }
        return { rows: [{ product_id: 'prod-4' }] };
      }
    };
    const ph = { capture: function() {} };
    const req = { session: { tenantId: 'tx', login: 'jane', accessToken: 'fake-token-abc' }, params: { id: 'prod-4' }, body: { name: 'my-product-4' } };
    const res = {
      json: function(b) { order.push('response'); this._b = b; },
      _b: null,
      status: function(c) { this._s = c; return this; }
    };

    await handlePostProductRepoCreate(req, res, null, pool, ph);

    assert.deepStrictEqual(order, ['createRepo', 'update', 'response'], `Expected repo columns written before the response was sent, got order: ${order.join(', ')}`);
    pass('repo_* columns are fully written before any response is sent -- no partial-configuration window');
  } catch (e) { fail('repo_* columns are fully written before any response is sent -- no partial-configuration window', e); }

  // T6 (AC5 second half) -- server.js wires the adapter to a real implementation;
  // two different create-repo calls resolve to two different, individually-correct
  // results (one succeeds, one hits the real name-collision path) -- not merely
  // proof that setCreateRepoAdapter was called.
  try {
    const fs = require('fs');
    const serverSrc = fs.readFileSync(require.resolve('../src/web-ui/server.js'), 'utf8');
    assert(/setCreateRepoAdapter\(\s*realCreateRepo\s*\)/.test(serverSrc), 'server.js does not wire setCreateRepoAdapter(realCreateRepo)');

    // Behavioural proof, independent of server.js's own text: wire realCreateRepo
    // exactly as server.js does, then prove two different sessions/calls resolve
    // to two different, individually-correct outcomes against a mocked GitHub API.
    const { setCreateRepoAdapter, createRepo, realCreateRepo, RepoNameTakenError } = require('../src/web-ui/adapters/repo-adapter');
    setCreateRepoAdapter(realCreateRepo);

    const _origFetch = global.fetch;
    global.fetch = async function(url, opts) {
      const body = JSON.parse(opts.body);
      if (body.name === 'available-repo') {
        return { ok: true, status: 201, json: async () => ({ owner: { login: 'sessionA-user' }, name: 'available-repo' }) };
      }
      return { ok: false, status: 422, json: async () => ({ message: 'Validation Failed' }) };
    };
    let sessionAResult, sessionBError;
    try {
      sessionAResult = await createRepo('token-a', 'available-repo');
      try {
        await createRepo('token-b', 'taken-repo');
      } catch (e) {
        sessionBError = e;
      }
    } finally {
      global.fetch = _origFetch;
    }

    assert.strictEqual(sessionAResult.owner.login, 'sessionA-user', 'session A did not resolve to its own correct created-repo result');
    assert(sessionBError instanceof RepoNameTakenError, 'session B did not resolve to its own correct name-collision result');
    pass('wired createRepoAdapter resolves two different create-repo calls to two different, individually-correct results');
  } catch (e) { fail('wired createRepoAdapter resolves two different create-repo calls to two different, individually-correct results', e); }

  console.log(`\n[prc-s2.1] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
