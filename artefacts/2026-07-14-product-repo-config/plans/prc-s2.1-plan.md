# Create a new GitHub repo directly from product creation — Implementation Plan

> **For agent execution:** Executed directly, task-by-task, following /tdd
> discipline (RED-GREEN-REFACTOR per task, commit after each green). No
> subagent fan-out used — the change is confined to one new adapter module,
> one new route handler, one server.js wiring block, and one test file.

**Goal:** Add a `createRepo` capability to a D37 injectable `repoAdapter` module and a route handler that lets a tenant admin create a brand-new GitHub repo (via `POST /user/repos` using their own OAuth token) directly from product creation, then populates the product's `repo_*` columns before any bootstrap-step response is sent.

**Branch:** `feature/prc-s2.1` (already checked out in this worktree)
**Worktree:** current working directory
**Test command:** `node tests/check-prc-s2.1-create-repo.js` (this story's file, fast iteration); targeted regression set at verify-completion (this file + `check-prc-s1.1-product-repo-columns.js` + `check-prc-s4.2-delete-product.js` + `check-wuce3-attributed-signoff.js` + `check-lab-s2.1-google-oauth.js` — the products/oauth-adjacent surface this story could plausibly touch)

---

## Pre-implementation note: DoR contract assumption does not hold in this worktree

The DoR contract for this story (`artefacts/2026-07-14-product-repo-config/dor/prc-s2.1-dor-contract.md`) and its H-ADAPTER determination (`prc-s2.1-dor.md`, marked N/A) both assume `prc-s1.2` has already introduced and wired a `repoAdapter` module (`setRepoAdapter`/`getRepoAdapter`) that this story extends with a `createRepo` method.

`prc-s1.2` is being built concurrently by a sibling agent on a separate branch (per dispatch instructions) and has not merged into `origin/master` as of this worktree's creation (`git log`/`git branch -a` confirm only `prc-s1.1` and `prc-s4.2` have merged; no `repoAdapter` module exists anywhere in this repo's history). This story's own Coding Agent Instructions anticipated exactly this possibility: *"Verify prc-s1.2's setRepoAdapter wiring already covers this method... if implementation reveals it does not, treat that as a new finding and add a wiring AC before proceeding, per D37."*

**Resolution adopted:** build the `repoAdapter` module fresh in this branch, using the exact D37 shape and error-message convention `prc-s1.2`'s own story/DoR already specifies (`setRepoAdapter`/`getRepoAdapter`, stub throws `Adapter not wired: repoAdapter. Call setRepoAdapter() with a real implementation before use.`) — so that when both stories' branches are reconciled, the merge is a straightforward object-literal union (`{ createRepo: ... }` + `{ verifyAccess: ... }`-shaped, or whatever `prc-s1.2` lands as) rather than two incompatible adapters. A wiring AC (AC5) is added to this story below, mirroring `prc-s1.2`'s own AC5, and logged in `decisions.md` before implementation proceeds.

This is a finding, not a silent scope change — logged in `decisions.md` under `2026-07-15 | SCOPE | prc-s2.1 implementation — DoR contract assumption did not hold`.

---

## Story AC5 (added this run, D37 wiring)

**AC5 (D37 wiring):** Given the `setRepoAdapter`/`getRepoAdapter` pair is left unwired, When any code path calls `createRepo`, Then it throws `Adapter not wired: repoAdapter. Call setRepoAdapter() with a real implementation before use.` — never a silent empty/safe-looking return. Given `server.js` wires the adapter to a real implementation at startup, When two different create-repo submissions are made (one succeeds, one hits a name collision), Then each resolves to its own correct, independently-verifiable result — not merely "a function reference was assigned."

---

## File map

```
Create:
  src/web-ui/adapters/repo-adapter.js       — D37 injectable repoAdapter: setRepoAdapter/getRepoAdapter,
                                                createRepo(token, name) delegating to the injected impl,
                                                realCreateRepo(token, name) production implementation
                                                (POST /user/repos via fetch, user's own OAuth token)
  tests/check-prc-s2.1-create-repo.js       — integration tests for AC1-AC5 + NFR

Modify:
  src/web-ui/routes/products.js             — add handlePostProductRepoCreate handler
  src/web-ui/server.js                      — import + wire POST /products/:id/repo/create,
                                                wire setRepoAdapter({ createRepo: realCreateRepo }) at startup
```

---

## Task 1: `repoAdapter` module — D37 injectable adapter with `createRepo` (AC1, AC2, AC5 first half)

**Files:**
- Create: `src/web-ui/adapters/repo-adapter.js`
- Test: `tests/check-prc-s2.1-create-repo.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function() {
  const { setRepoAdapter, getRepoAdapter, createRepo } = require('../src/web-ui/adapters/repo-adapter');

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
    assert.strictEqual(msg, 'Adapter not wired: repoAdapter. Call setRepoAdapter() with a real implementation before use.', 'wrong error message');
    pass('unwired repoAdapter throws the exact D37 error message, never a silent return');
  } catch (e) { fail('unwired repoAdapter throws the exact D37 error message, never a silent return', e); }

  console.log(`\n[prc-s2.1] Results so far: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-prc-s2.1-create-repo.js
```

Expected output: `Cannot find module '../src/web-ui/adapters/repo-adapter'` (module does not exist yet)

- [ ] **Step 3: Write minimal implementation**

Create `src/web-ui/adapters/repo-adapter.js`:

```javascript
'use strict';

// repo-adapter.js — prc-s2.1
//
// D37 injectable adapter for GitHub repo creation. Named/shaped to match
// prc-s1.2's own story-specified contract (setRepoAdapter/getRepoAdapter,
// same throw message convention) even though prc-s1.2 has not yet merged
// into this branch -- see the "Pre-implementation note" in this story's
// implementation plan. When prc-s1.2 merges, its methods (repo-access
// verification) are expected to land in the same _repoAdapter object
// alongside createRepo; that reconciliation is the orchestrator's job, not
// this story's.
//
// ADR-020: every GitHub write in this codebase uses the authenticated
// user's own OAuth token (from req.session.accessToken), never a service
// account. createRepo(token, name) takes the token explicitly from the
// caller -- it is never read from environment or module state.

let _repoAdapter = {
  createRepo: function() {
    throw new Error('Adapter not wired: repoAdapter. Call setRepoAdapter() with a real implementation before use.');
  }
};

/**
 * Replace the repo adapter (used in tests and production startup).
 * Merges into the existing adapter object so a partial re-wiring (e.g. only
 * createRepo) does not clobber other methods a sibling story's wiring may
 * have already set.
 * @param {object} impl - object with one or more adapter methods (e.g. { createRepo })
 */
function setRepoAdapter(impl) {
  _repoAdapter = Object.assign({}, _repoAdapter, impl);
}

/**
 * @returns {object} the current repo adapter implementation
 */
function getRepoAdapter() {
  return _repoAdapter;
}

/**
 * Create a new GitHub repo under the authenticated user's own account.
 * Route handlers call this -- NOT realCreateRepo directly -- so the
 * implementation can be swapped in tests without touching route logic.
 * @param {string} token - user's OAuth access token from req.session.accessToken
 * @param {string} name - desired repo name
 * @returns {Promise<{ owner: { login: string }, name: string }>}
 */
async function createRepo(token, name) {
  return _repoAdapter.createRepo(token, name);
}

/**
 * Custom error thrown when GitHub reports the repo name is already taken
 * (422 Validation Failed on POST /user/repos).
 */
class RepoNameTakenError extends Error {
  constructor(name) {
    super('A repo named "' + name + '" already exists on your GitHub account. Choose a different name.');
    this.name = 'RepoNameTakenError';
  }
}

/**
 * Real production implementation -- POST /user/repos using the authenticated
 * user's own OAuth token (ADR-020). Wire via setRepoAdapter in server.js.
 * @param {string} token - user's OAuth access token
 * @param {string} name - desired repo name
 * @returns {Promise<{ owner: { login: string }, name: string }>}
 * @throws {RepoNameTakenError} on a 422 name-collision response
 */
async function realCreateRepo(token, name) {
  const apiBase = (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');

  const res = await fetch(apiBase + '/user/repos', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: name })
  });

  if (res.status === 422) {
    throw new RepoNameTakenError(name);
  }

  if (!res.ok) {
    throw new Error('Failed to create repo: ' + res.status);
  }

  return res.json();
}

module.exports = {
  setRepoAdapter,
  getRepoAdapter,
  createRepo,
  realCreateRepo,
  RepoNameTakenError
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-prc-s2.1-create-repo.js
```

Expected output: `[prc-s2.1] Results so far: 1 passed, 0 failed`

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/adapters/repo-adapter.js tests/check-prc-s2.1-create-repo.js
git commit -m "feat(prc-s2.1): add D37 repoAdapter with createRepo (POST /user/repos, user's own OAuth token)"
```

---

## Task 2: `handlePostProductRepoCreate` route handler (AC1, AC2, AC4)

**Files:**
- Modify: `src/web-ui/routes/products.js`
- Test: `tests/check-prc-s2.1-create-repo.js` (append)

- [ ] **Step 1: Write the failing tests** (append to `tests/check-prc-s2.1-create-repo.js`, before the final results log)

```javascript
  // Re-require for the remaining tests -- module-level adapter state is shared
  // across tests in this file below, wired explicitly per test via setRepoAdapter.
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
    repoAdapter.setRepoAdapter({
      createRepo: async function(token, name) {
        assert.strictEqual(token, 'fake-token-abc', 'createRepo not called with the session accessToken');
        return { owner: { login: 'jane' }, name: name };
      }
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
    repoAdapter.setRepoAdapter({
      createRepo: async function() {
        throw new repoAdapter.RepoNameTakenError('taken-name');
      }
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
    repoAdapter.setRepoAdapter({
      createRepo: async function(token, name) {
        order.push('createRepo');
        return { owner: { login: 'jane' }, name: name };
      }
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
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-prc-s2.1-create-repo.js
```

Expected output: `TypeError: handlePostProductRepoCreate is not a function` (or `Cannot destructure` — export does not exist yet)

- [ ] **Step 3: Write minimal implementation**

Add to `src/web-ui/routes/products.js`, near the top add the require:

```javascript
var _repoAdapter = require('../adapters/repo-adapter'); // prc-s2.1
```

Add the handler (after `handleDeleteProduct`, before `STAGE_COLUMNS`):

```javascript
/**
 * prc-s2.1: POST /products/:id/repo/create -- create a brand-new GitHub repo
 * under the operator's own account (ADR-020: their own OAuth token, never a
 * service account) and populate the product's repo_provider/repo_owner/
 * repo_name columns. AC3: sessions with no GitHub accessToken (Google/email
 * auth) are directed to the existing GET /settings/link-account/github/start
 * flow -- no GitHub API call is attempted and no columns are written. AC4:
 * the UPDATE completes before any response is sent, so there is never a
 * window where the product looks configured but isn't.
 */
async function handlePostProductRepoCreate(req, res, _next, pool, posthog) {
  req.body = await _readBody(req);
  var _pool = pool;
  var _ph = posthog || _posthog;
  var productId = req.params && req.params.id;
  var tenantId = req.session && req.session.tenantId;
  var token = req.session && req.session.accessToken;
  var name = (req.body && req.body.name) || '';

  if (!token) {
    var linkBody = { error: 'A GitHub account must be linked before creating a repo.', linkUrl: '/settings/link-account/github/start' };
    if (res.status) { res.status(403).json(linkBody); }
    else { res.writeHead(403, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(linkBody)); }
    return;
  }

  var created;
  try {
    created = await _repoAdapter.createRepo(token, name);
  } catch (err) {
    var status = (err && err.name === 'RepoNameTakenError') ? 409 : 502;
    var errBody = { error: (err && err.message) || 'Failed to create repo' };
    if (res.status) { res.status(status).json(errBody); }
    else { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(errBody)); }
    return;
  }

  var owner = created && created.owner && created.owner.login;
  var repoName = created && created.name;

  await _pool.query(
    'UPDATE products SET repo_provider = $1, repo_owner = $2, repo_name = $3 WHERE product_id = $4',
    ['github', owner, repoName, productId]
  );

  _ph.capture(tenantId, 'product_repo_created', {
    productId: productId,
    tenantId: tenantId,
    repoOwner: owner,
    repoName: repoName
  });

  var okBody = { repo_provider: 'github', repo_owner: owner, repo_name: repoName };
  if (res.status) { res.status(201).json(okBody); }
  else { res.writeHead(201, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(okBody)); }
}
```

Add `handlePostProductRepoCreate` to the `module.exports` block at the bottom of `src/web-ui/routes/products.js`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-prc-s2.1-create-repo.js
```

Expected output: `[prc-s2.1] Results: 5 passed, 0 failed`

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/routes/products.js tests/check-prc-s2.1-create-repo.js
git commit -m "feat(prc-s2.1): add handlePostProductRepoCreate -- create-new-repo route handler"
```

---

## Task 3: Wire `POST /products/:id/repo/create` and `setRepoAdapter` in server.js (AC5 second half)

**Files:**
- Modify: `src/web-ui/server.js`
- Test: `tests/check-prc-s2.1-create-repo.js` (append wiring-behavioural test)

- [ ] **Step 1: Write the failing test** (append to `tests/check-prc-s2.1-create-repo.js`, before the final results log)

```javascript
  // T6 (AC5 second half) -- server.js wires the adapter to a real implementation;
  // two different create-repo calls resolve to two different, individually-correct
  // results (one succeeds, one hits the real name-collision path) -- not merely
  // proof that setRepoAdapter was called.
  try {
    const fs = require('fs');
    const serverSrc = fs.readFileSync(require.resolve('../src/web-ui/server.js'), 'utf8');
    assert(/setRepoAdapter\(\s*\{\s*createRepo:\s*realCreateRepo/.test(serverSrc) || /setRepoAdapter\(\s*\{[^}]*createRepo/.test(serverSrc), 'server.js does not wire setRepoAdapter({ createRepo: realCreateRepo })');

    // Behavioural proof, independent of server.js's own text: wire realCreateRepo
    // exactly as server.js does, then prove two different sessions/calls resolve
    // to two different, individually-correct outcomes against a mocked GitHub API.
    const { setRepoAdapter, createRepo, realCreateRepo, RepoNameTakenError } = require('../src/web-ui/adapters/repo-adapter');
    setRepoAdapter({ createRepo: realCreateRepo });

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
    pass('wired repoAdapter resolves two different create-repo calls to two different, individually-correct results');
  } catch (e) { fail('wired repoAdapter resolves two different create-repo calls to two different, individually-correct results', e); }
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-prc-s2.1-create-repo.js
```

Expected output: assertion failure on the `serverSrc` regex check (server.js does not yet wire `setRepoAdapter`)

- [ ] **Step 3: Make the change**

In `src/web-ui/server.js`, add the import near the other `products.js`-adjacent requires (near line 49-50):

```javascript
const { setRepoAdapter, realCreateRepo } = require('./adapters/repo-adapter'); // prc-s2.1
```

Extend the existing `products.js` destructured import (line 49) to include the new handler:

```javascript
const { handlePostProductNew, handlePostProductConfirm, handleGetDashboard: _handleGetDashboard, handleGetProductNew, handleGetProductView, handlePostProductFeature, handleGetProductKanban, handleGetOrgKanban, handleDeleteProduct, handlePostProductRepoCreate } = require('./routes/products'); // psh-s3 / psh-s4 / psh-s6 / psh-s7 / prc-s4.2 / prc-s2.1
```

Wire the adapter at startup, near the other D37 wiring blocks (after the `setProviderAdapter(gitHubProviderAdapter);` block around line 88-89):

```javascript
// prc-s2.1 / D37 mandatory separate wiring task -- wire the real GitHub
// repo-creation adapter. Uses Object.assign-merge internally (repo-adapter.js)
// so a later prc-s1.2 wiring call (repo-access verification) does not clobber
// this createRepo wiring, and vice versa.
setRepoAdapter({ createRepo: realCreateRepo });
console.log('[repo-adapter] createRepo wired');
```

Add the route branch immediately after the existing `POST /products/:id/features` branch (after line 1741's closing `});`):

```javascript
  } else if (pathname.match(/^\/products\/[^/]+\/repo\/create$/) && req.method === 'POST') {
    // prc-s2.1 -- create a brand-new GitHub repo for a product
    req.params = { id: pathname.split('/')[2] };
    authGuard(req, res, async () => { await handlePostProductRepoCreate(req, res, null, _pshPool, null); });

```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-prc-s2.1-create-repo.js
```

Expected output: `[prc-s2.1] Results: 6 passed, 0 failed`

- [ ] **Step 5: Run targeted regression set — no regressions**

```bash
node tests/check-prc-s2.1-create-repo.js && node tests/check-prc-s1.1-product-repo-columns.js && node tests/check-prc-s4.2-delete-product.js && node tests/check-wuce3-attributed-signoff.js && node tests/check-lab-s2.1-google-oauth.js
```

Expected output: all five files pass, 0 failures (full `node scripts/run-all-tests.js` is deliberately NOT run per this dispatch's instructions -- pre-existing unrelated flakiness in that suite has repeatedly stalled agents in this pipeline; targeted evidence against the products/oauth-adjacent surface this story could plausibly touch is the correct bar)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js tests/check-prc-s2.1-create-repo.js
git commit -m "feat(prc-s2.1): wire POST /products/:id/repo/create and setRepoAdapter(createRepo) in server.js"
```

---

## Post-implementation

- [ ] Append the DoR-contract-assumption finding to `artefacts/2026-07-14-product-repo-config/decisions.md` before Task 1 begins (see Pre-implementation note above).
- [ ] Update `artefacts/2026-07-14-product-repo-config/stories/prc-s2.1.md` with the new AC5 (D37 wiring) added this run.
- [ ] Leave the AC verification script (`prc-s2.1-verification.md`) scenario results for the operator to run manually against a real deployed instance and a real GitHub account (Scenarios 1-4 all require a real browser session).
- [ ] Run the targeted regression set (Task 3, Step 5) one final time before /verify-completion.
