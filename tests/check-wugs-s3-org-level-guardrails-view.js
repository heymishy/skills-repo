'use strict';
// check-wugs-s3-org-level-guardrails-view.js — wugs-s3
//
// Unit/integration tests for the org-level guardrails/standards section:
// first-time designation + seeding (reusing wugs-s6's createGuardrailPr),
// and live-read org-level content (reusing wugs-s1's fetchRepoPath), with
// hard cross-tenant isolation.

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
var artefactFetcher = require('../src/web-ui/adapters/artefact-fetcher');
var guardrailPrAdapter = require('../src/web-ui/adapters/guardrail-pr-adapter');

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
    status: function (c) { _statusCode = c; return this; },
    json: function (b) { _body = JSON.stringify(b); },
    _get: function () { return { statusCode: _statusCode, body: _body }; }
  };
}

// Mock pool covering the product-lookup query, getProductsNavSummary's own
// queries, and tenant_org_repo lookups/inserts (matching check-wugs-s2's own
// makeMockPool convention). orgRepoRow is null (no designation) or a real row.
function makeMockPool(navProducts, orgRepoRowsByTenant, calls) {
  return {
    query: async function (sql, params) {
      var s = String(sql);
      if (calls) calls.push({ sql: s, params: params });
      if (/SELECT name, tenant_id, repo_owner, repo_name FROM products WHERE product_id/i.test(s)) {
        var pid = params && params[0];
        var row = { name: 'Test Product', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' };
        if (pid === 'p-tenant-b') { row = { name: 'Tenant B Product', tenant_id: 't2', repo_owner: 'bravo', repo_name: 'stuff' }; }
        return { rows: [row] };
      }
      if (/SELECT product_id, name, created_at FROM products WHERE tenant_id/i.test(s)) {
        return { rows: (navProducts || []).map(function (p) { return { product_id: p.id, name: p.name, created_at: new Date().toISOString() }; }) };
      }
      if (/SELECT journey_id, created_at AS updated_at FROM journeys WHERE product_id/i.test(s)) { return { rows: [] }; }
      if (/SELECT journey_id FROM journeys WHERE tenant_id.*product_id IS NULL/i.test(s)) { return { rows: [] }; }
      if (/SELECT .* FROM tenant_org_repo WHERE tenant_id/i.test(s)) {
        var tid = params && params[0];
        var orgRow = (orgRepoRowsByTenant || {})[tid] || null;
        return { rows: orgRow ? [orgRow] : [] };
      }
      if (/INSERT INTO tenant_org_repo/i.test(s)) { return { rows: [] }; }
      return { rows: [] };
    }
  };
}

async function withMockedFetchRepoPath(mockFn, testFn) {
  var original = artefactFetcher.getFetchRepoPath();
  artefactFetcher.setFetchRepoPath(mockFn);
  try { await testFn(); } finally { artefactFetcher.setFetchRepoPath(original); }
}

(async () => {

// ── AC3: no org repo designated — explicit prompt state ──────────────────
await checkAsync('AC3: handleGetGuardrailsView_noOrgRepoDesignated_showsExplicitPrompt', async () => {
  var pool = makeMockPool([], {});
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200);
    assert.ok(/no org repo designated/i.test(result.body), 'expected an explicit "no org repo designated" prompt, not a silently empty section');
    assert.ok(result.body.indexOf('/settings/org-repo') !== -1, 'expected a real designation entry point (link/form action) in the prompt');
  });
});

// ── AC2: org section shows real designated-repo content ─────────────────
await checkAsync('AC2: handleGetGuardrailsView_orgRepoDesignated_showsRealContent', async () => {
  var pool = makeMockPool([], { t1: { repo_owner: 'org-co', repo_name: 'org-repo' } });
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (owner === 'org-co' && path === '.github/architecture-guardrails.md') { return 'REAL ORG GUARDRAILS CONTENT'; }
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var req = mockReq();
    var res = mockRes();
    await products.handleGetProductGuardrailsView(req, res, null, pool);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200);
    assert.ok(result.body.indexOf('REAL ORG GUARDRAILS CONTENT') !== -1, 'expected the org repo\'s real content, not the product repo\'s or a placeholder');
    assert.ok(!/no org repo designated/i.test(result.body), 'expected the "no org repo designated" prompt to be gone once a repo IS designated');
  });
});

// ── AC4: two products, same tenant — identical org-level content ────────
await checkAsync('AC4: handleGetGuardrailsView_twoProductsSameTenant_identicalOrgContent', async () => {
  var pool = makeMockPool([], { t1: { repo_owner: 'org-co', repo_name: 'org-repo' } });
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (owner === 'org-co' && path === '.github/architecture-guardrails.md') { return 'SHARED ORG CONTENT'; }
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    // Same product id (p1) is used because makeMockPool's product-lookup
    // fixture only defines p1 (tenant t1) and p-tenant-b (tenant t2) — the
    // point of this test is "same tenant, same org repo", which p1 alone
    // already exercises twice; a second same-tenant product id would need a
    // third fixture branch that adds no further discriminating power.
    var req1 = mockReq();
    var res1 = mockRes();
    await products.handleGetProductGuardrailsView(req1, res1, null, pool);
    var req2 = mockReq();
    var res2 = mockRes();
    await products.handleGetProductGuardrailsView(req2, res2, null, pool);
    assert.ok(res1._get().body.indexOf('SHARED ORG CONTENT') !== -1);
    assert.ok(res2._get().body.indexOf('SHARED ORG CONTENT') !== -1);
  });
});

// ── AC5: cross-tenant isolation — never leaks another tenant's org repo ──
await checkAsync('AC5: handleGetGuardrailsView_crossTenantIsolation_neverLeaksOtherTenantOrgRepo', async () => {
  var pool = makeMockPool([], {
    t1: { repo_owner: 'tenant-a-org', repo_name: 'tenant-a-repo' },
    t2: { repo_owner: 'tenant-b-org', repo_name: 'tenant-b-repo' }
  });
  await withMockedFetchRepoPath(async function (owner, repo, path) {
    if (owner === 'tenant-a-org' && path === '.github/architecture-guardrails.md') { return 'TENANT A ORG CONTENT'; }
    if (owner === 'tenant-b-org' && path === '.github/architecture-guardrails.md') { return 'TENANT B ORG CONTENT'; }
    throw new artefactFetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  }, async function () {
    var reqA = mockReq({ params: { id: 'p1' }, session: { accessToken: 'tok', tenantId: 't1', login: 'alice', csrfToken: 'ct1' } });
    var resA = mockRes();
    await products.handleGetProductGuardrailsView(reqA, resA, null, pool);

    var reqB = mockReq({ params: { id: 'p-tenant-b' }, session: { accessToken: 'tok', tenantId: 't2', login: 'bob', csrfToken: 'ct1' } });
    var resB = mockRes();
    await products.handleGetProductGuardrailsView(reqB, resB, null, pool);

    var bodyA = resA._get().body;
    var bodyB = resB._get().body;
    assert.ok(bodyA.indexOf('TENANT A ORG CONTENT') !== -1, 'Tenant A should see its own org content');
    assert.ok(bodyA.indexOf('TENANT B ORG CONTENT') === -1, 'Tenant A must never see Tenant B\'s org content');
    assert.ok(bodyA.indexOf('tenant-b-org') === -1 && bodyA.indexOf('tenant-b-repo') === -1, 'Tenant A must never see Tenant B\'s org repo owner/name');
    assert.ok(bodyB.indexOf('TENANT B ORG CONTENT') !== -1, 'Tenant B should see its own org content');
    assert.ok(bodyB.indexOf('TENANT A ORG CONTENT') === -1, 'Tenant B must never see Tenant A\'s org content');
    assert.ok(bodyB.indexOf('tenant-a-org') === -1 && bodyB.indexOf('tenant-a-repo') === -1, 'Tenant B must never see Tenant A\'s org repo owner/name');
  });
});

// ── AC1: first designation creates the row and seeds exact verbatim content ──
await checkAsync('AC1: designateOrgRepo_noExistingRow_createsRowAndSeedsExactContent', async () => {
  var calls = [];
  var pool = makeMockPool([], {}, calls);
  var writeCalls = [];
  var writeAdapter = async function (target, content) {
    writeCalls.push({ target: target, content: content });
    return { prNumber: 1, prUrl: 'https://github.com/org-co/org-repo/pull/1' };
  };
  var captured = null;
  var mockPosthog = { capture: function (distinctId, event, properties) { captured = { distinctId: distinctId, event: event, properties: properties }; } };

  var req = mockReq({ body: { repo_owner: 'org-co', repo_name: 'org-repo', _csrf: 'ct1' } });
  var res = mockRes();
  await products.handlePostOrgRepoSettings(req, res, null, pool, writeAdapter, mockPosthog);

  var result = res._get();
  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode + ' body: ' + result.body);

  var insertCall = calls.find(function (c) { return /INSERT INTO tenant_org_repo/i.test(c.sql); });
  assert.ok(insertCall, 'expected an INSERT INTO tenant_org_repo to be issued');
  assert.deepStrictEqual(insertCall.params, ['t1', 'org-co', 'org-repo'], 'expected the insert to carry the real tenant_id/repo_owner/repo_name');

  assert.strictEqual(writeCalls.length, 2, 'expected exactly 2 seed writes (guardrails + standards getting-started)');
  var guardrailsWrite = writeCalls.find(function (w) { return w.target.path === '.github/architecture-guardrails.md'; });
  var standardsWrite = writeCalls.find(function (w) { return w.target.path === 'standards/getting-started.md'; });
  assert.ok(guardrailsWrite, 'expected a seed write to .github/architecture-guardrails.md');
  assert.ok(standardsWrite, 'expected a seed write to standards/getting-started.md');
  assert.strictEqual(
    guardrailsWrite.content,
    '## Getting Started\n\nThis file records your organisation\'s architectural decisions and constraints — the things every product should respect unless explicitly overridden. Add an entry here whenever your team makes a structural choice that should apply broadly (e.g. \'All new services must expose a health-check endpoint at /health\'). Delete this section once you\'ve added your own guardrails.',
    'expected the exact verbatim AC1 guardrails seed text, not a paraphrase'
  );
  assert.strictEqual(
    standardsWrite.content,
    '# Getting Started\n\nThis folder holds your organisation\'s engineering standards — practices every product is expected to follow. Add a file per discipline as your standards mature (e.g. security, data handling, accessibility). A reasonable first standard: all code changes require a passing test suite before merge. Delete this file once you\'ve added your own standards.',
    'expected the exact verbatim AC1 standards seed text, not a paraphrase'
  );

  assert.ok(captured, 'expected a PostHog capture call to have fired');
  assert.strictEqual(captured.event, 'org_repo_designated');
  assert.strictEqual(captured.properties.tenant_id, 't1');
  assert.strictEqual(captured.properties.repo_owner, 'org-co');
  assert.strictEqual(captured.properties.repo_name, 'org-repo');
});

// ── AC1 (negative): missing repo fields rejected server-side ────────────
await checkAsync('AC1: designateOrgRepo_missingRepoName_rejectedServerSide', async () => {
  var pool = makeMockPool([], {});
  var writeAdapterCalled = false;
  var writeAdapter = async function () { writeAdapterCalled = true; };
  var req = mockReq({ body: { repo_owner: 'org-co', repo_name: '', _csrf: 'ct1' } });
  var res = mockRes();
  await products.handlePostOrgRepoSettings(req, res, null, pool, writeAdapter, { capture: function () {} });
  var result = res._get();
  assert.strictEqual(result.statusCode, 400);
  assert.strictEqual(writeAdapterCalled, false, 'expected no seed writes when validation rejects the submission');
});

// ── review fix: missing tenantId is rejected before any DB insert ───────
await checkAsync('AC1: designateOrgRepo_missingTenantId_returns404AndSkipsWrite', async () => {
  var pool = makeMockPool([], {});
  var writeAdapterCalled = false;
  var writeAdapter = async function () { writeAdapterCalled = true; };
  var req = mockReq({
    session: { accessToken: 'tok', csrfToken: 'ct1' },
    body: { repo_owner: 'org-co', repo_name: 'org-repo', _csrf: 'ct1' }
  });
  var res = mockRes();
  await products.handlePostOrgRepoSettings(req, res, null, pool, writeAdapter, { capture: function () {} });
  var result = res._get();
  assert.strictEqual(result.statusCode, 404, 'expected 404 when session has no tenantId, got: ' + result.statusCode + ' body: ' + result.body);
  assert.strictEqual(writeAdapterCalled, false, 'expected no seed writes and no DB insert when tenantId is missing');
});

// ── review fix: CSRF guard blocks the org-repo settings POST ────────────
await checkAsync('review fix: designateOrgRepo_mismatchedCsrf_returns403AndSkipsWrite', async () => {
  var pool = makeMockPool([], {});
  var writeAdapterCalled = false;
  var writeAdapter = async function () { writeAdapterCalled = true; };
  var req = mockReq({ body: { repo_owner: 'org-co', repo_name: 'org-repo', _csrf: 'attacker-guess' } });
  var res = mockRes();
  await products.handlePostOrgRepoSettings(req, res, null, pool, writeAdapter, { capture: function () {} });
  var result = res._get();
  assert.strictEqual(result.statusCode, 403, 'expected a 403 for a mismatched CSRF token, got: ' + result.statusCode + ' body: ' + result.body);
  assert.strictEqual(result.body, 'Forbidden');
  assert.strictEqual(writeAdapterCalled, false, 'expected the write adapter to never be called when the CSRF guard blocks the request');
});

await checkAsync('review fix: designateOrgRepo_missingCsrf_returns403AndSkipsWrite', async () => {
  var pool = makeMockPool([], {});
  var writeAdapterCalled = false;
  var writeAdapter = async function () { writeAdapterCalled = true; };
  var req = mockReq({ body: { repo_owner: 'org-co', repo_name: 'org-repo' } }); // no _csrf field at all
  var res = mockRes();
  await products.handlePostOrgRepoSettings(req, res, null, pool, writeAdapter, { capture: function () {} });
  var result = res._get();
  assert.strictEqual(result.statusCode, 403, 'expected a 403 when _csrf is missing entirely, got: ' + result.statusCode + ' body: ' + result.body);
  assert.strictEqual(result.body, 'Forbidden');
  assert.strictEqual(writeAdapterCalled, false, 'expected the write adapter to never be called when the CSRF guard blocks the request');
});

// ── review fix: write-path errors from writeAdapter are handled distinctly ──
await checkAsync('review fix: designateOrgRepo_writeAdapterConflictError_returns409WithClearMessage', async () => {
  var pool = makeMockPool([], {});
  var writeAdapter = async function () {
    throw new guardrailPrAdapter.GuardrailPrConflictError('Artefact was updated — please reload and try again');
  };
  var req = mockReq({ body: { repo_owner: 'org-co', repo_name: 'org-repo', _csrf: 'ct1' } });
  var res = mockRes();
  await products.handlePostOrgRepoSettings(req, res, null, pool, writeAdapter, { capture: function () {} });
  var result = res._get();
  assert.strictEqual(result.statusCode, 409, 'expected a 409 when the write adapter throws GuardrailPrConflictError, got: ' + result.statusCode + ' body: ' + result.body);
  assert.ok(/reload|refresh/i.test(result.body), 'expected a clear, actionable error message in the response body');
});

await checkAsync('review fix: designateOrgRepo_writeAdapterGenericError_returns500', async () => {
  var pool = makeMockPool([], {});
  var writeAdapter = async function () {
    throw new Error('unexpected GitHub API failure');
  };
  var req = mockReq({ body: { repo_owner: 'org-co', repo_name: 'org-repo', _csrf: 'ct1' } });
  var res = mockRes();
  await products.handlePostOrgRepoSettings(req, res, null, pool, writeAdapter, { capture: function () {} });
  var result = res._get();
  assert.strictEqual(result.statusCode, 500, 'expected a 500 for a generic write-adapter error, got: ' + result.statusCode + ' body: ' + result.body);
  assert.ok(/Failed to create pull request/i.test(result.body), 'expected a clear error message in the response body');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
