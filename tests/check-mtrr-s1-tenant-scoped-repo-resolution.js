'use strict';

// mtrr-s1: Resolve each product's own repo for SaaS export, tenant-scoped
// Tests AC1-AC4 per artefacts/2026-08-06-multi-tenant-repo-resolution/test-plans/mtrr-s1-test-plan.md
//
// Replaces rb-s4's ownerRepoFromEnv() (single hardcoded GITHUB_REPO env var)
// with ownerRepoForFeature(slug, credential) -- a tenant-scoped products-table
// lookup (ADR-025). See src/web-ui/adapters/export-data-source.js.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;
const registered = [];

/** Registers a test (sync or async fn) to run sequentially in main(). */
function test(name, fn) {
  registered.push({ name, fn });
}

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const CREDENTIAL_A = 'synthetic-test-credential-product-a-xyz';
const CREDENTIAL_B = 'synthetic-test-credential-product-b-xyz';
const CREDENTIAL_NEITHER = 'synthetic-test-credential-unauthorized-xyz';

const PRODUCT_A = {
  productId: 'product-a-id',
  tenantId: 'tenant-a',
  repoOwner: 'tenant-a-org',
  repoName: 'tenant-a-repo'
};

const PRODUCT_B = {
  productId: 'product-b-id',
  tenantId: 'tenant-b',
  repoOwner: 'tenant-b-org',
  repoName: 'tenant-b-repo'
};

const SLUG_A = '2026-01-01-feature-a';
const SLUG_B = '2026-02-02-feature-b';
const SLUG_NONEXISTENT = '2026-03-03-does-not-exist-anywhere';

function b64(s) { return Buffer.from(s, 'utf8').toString('base64'); }

/**
 * Minimal hand-rolled mock pg-Pool-shaped object, scoped to exactly the two
 * query shapes ownerRepoForFeature issues (mirrors rb-s4's own
 * createMockGithubFetch philosophy: narrow, explicit, not a general SQL
 * engine -- see fake-test-db.js's own header comment for the same principle
 * applied elsewhere in this codebase).
 *
 * journeyRows: [{ feature_slug, product_id, tenant_id }]
 * productRows: [{ product_id, tenant_id, repo_owner, repo_name }]
 */
function createMockPool(journeyRows, productRows) {
  const calls = [];
  async function query(sql, params) {
    calls.push({ sql, params });
    const s = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();

    if (s.startsWith('SELECT PRODUCT_ID, TENANT_ID FROM JOURNEYS WHERE FEATURE_SLUG')) {
      const slug = params[0];
      const match = journeyRows.filter(r => r.feature_slug === slug);
      return { rows: match.map(r => ({ product_id: r.product_id, tenant_id: r.tenant_id })) };
    }

    if (s.startsWith('SELECT REPO_OWNER, REPO_NAME FROM PRODUCTS WHERE PRODUCT_ID') && s.includes('TENANT_ID')) {
      const [productId, tenantId] = params;
      const match = productRows.filter(r => r.product_id === productId && r.tenant_id === tenantId);
      return { rows: match.map(r => ({ repo_owner: r.repo_owner, repo_name: r.repo_name })) };
    }

    return { rows: [] };
  }
  return { query, calls };
}

function seededMockPool() {
  return createMockPool(
    [
      { feature_slug: SLUG_A, product_id: PRODUCT_A.productId, tenant_id: PRODUCT_A.tenantId },
      { feature_slug: SLUG_B, product_id: PRODUCT_B.productId, tenant_id: PRODUCT_B.tenantId }
    ],
    [
      { product_id: PRODUCT_A.productId, tenant_id: PRODUCT_A.tenantId, repo_owner: PRODUCT_A.repoOwner, repo_name: PRODUCT_A.repoName },
      { product_id: PRODUCT_B.productId, tenant_id: PRODUCT_B.tenantId, repo_owner: PRODUCT_B.repoOwner, repo_name: PRODUCT_B.repoName }
    ]
  );
}

function makeFixtureForProduct(product, slug, storySlug, artefactBody) {
  const dorArtefact = `artefacts/${slug}/dor/${storySlug}-dor.md`;
  const feature = {
    slug,
    stage: 'dor-signed-off',
    stories: [
      { id: storySlug, dorStatus: 'signed-off', dorArtefact, stage: 'dor-signed-off', health: 'green' }
    ]
  };
  return { feature, dorArtefact, artefactBody, product };
}

const FIXTURE_A = makeFixtureForProduct(PRODUCT_A, SLUG_A, 'fa-s1', '# Feature A DoR\n\nApproved content for feature A (tenant A).\n');
const FIXTURE_B = makeFixtureForProduct(PRODUCT_B, SLUG_B, 'fb-s1', '# Feature B DoR\n\nDifferent approved content for feature B (tenant B).\n');

function pipelineStateWith(...features) {
  return { version: '1', updated: new Date().toISOString(), programmes: [], features: features.map(f => f.feature) };
}

/**
 * Mocked GitHub Contents API fetch -- scoped per-repo (owner/repo baked into
 * the URL), so a request against the WRONG owner/repo pair returns 404, and
 * a request against the RIGHT owner/repo returns that fixture's own content.
 * This proves the resolved owner/repo (not a shared/global value) is what
 * drives which content comes back (AC1/AC2).
 */
function createMockGithubFetch(fixtures, opts) {
  opts = opts || {};
  const calls = [];

  async function mockFetch(url, options) {
    calls.push({ url, options });

    if (opts.denyAccess) {
      return { ok: false, status: 403, json: async () => ({ message: 'Forbidden' }) };
    }

    for (const fx of fixtures) {
      const repoFragment = `/repos/${fx.product.repoOwner}/${fx.product.repoName}/`;
      if (!url.includes(repoFragment)) continue;

      if (url.includes('/contents/.github/pipeline-state.json')) {
        return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify({ content: b64(JSON.stringify(pipelineStateWith(fx))), encoding: 'base64' }) };
      }
      if (fx.dorArtefact && url.includes(`/contents/${fx.dorArtefact}`)) {
        return { ok: true, status: 200, json: async () => ({ content: b64(fx.artefactBody), encoding: 'base64' }) };
      }
    }

    return { ok: false, status: 404, json: async () => ({ message: 'Not Found' }) };
  }

  return { calls, fetch: mockFetch };
}

function makeMockRes() {
  const res = { statusCode: null, headers: null, body: null };
  res.writeHead = (status, headers) => { res.statusCode = status; res.headers = headers; };
  res.end = (body) => { res.body = body; };
  return res;
}

function freshExportDataSource() {
  delete require.cache[require.resolve('../src/web-ui/adapters/export-data-source')];
  return require('../src/web-ui/adapters/export-data-source');
}

// ---------------------------------------------------------------------------
// Unit tests -- ownerRepoForFeature (AC1, AC2)
// ---------------------------------------------------------------------------

test('resolvesOwnerRepoForFeatureSlug_productA', async () => {
  const { ownerRepoForFeature, setDbPool } = freshExportDataSource();
  setDbPool(seededMockPool());
  const result = await ownerRepoForFeature(SLUG_A, CREDENTIAL_A);
  assert.strictEqual(result.owner, PRODUCT_A.repoOwner, 'should resolve product A\'s own owner, not a global/hardcoded value');
  assert.strictEqual(result.repo, PRODUCT_A.repoName, 'should resolve product A\'s own repo, not a global/hardcoded value');
});

test('resolvesOwnerRepoForFeatureSlug_productB_differsFromA', async () => {
  const { ownerRepoForFeature, setDbPool } = freshExportDataSource();
  const pool = seededMockPool();
  setDbPool(pool);
  const resultA = await ownerRepoForFeature(SLUG_A, CREDENTIAL_A);
  const resultB = await ownerRepoForFeature(SLUG_B, CREDENTIAL_B);

  assert.notStrictEqual(resultB.owner, resultA.owner, 'product B\'s owner must differ from product A\'s -- not a shared/cached resolution');
  assert.notStrictEqual(resultB.repo, resultA.repo, 'product B\'s repo must differ from product A\'s -- not a shared/cached resolution');
  assert.strictEqual(resultA.owner, PRODUCT_A.repoOwner);
  assert.strictEqual(resultA.repo, PRODUCT_A.repoName);
  assert.strictEqual(resultB.owner, PRODUCT_B.repoOwner);
  assert.strictEqual(resultB.repo, PRODUCT_B.repoName);
});

// ---------------------------------------------------------------------------
// Unit test -- not-found paths never leak identifiers (AC3)
// ---------------------------------------------------------------------------

test('nonExistentSlug_ownerRepoForFeature_throwsExportNotFoundError_noIdentifierInMessage', async () => {
  const { ownerRepoForFeature, setDbPool, ExportNotFoundError } = freshExportDataSource();
  setDbPool(seededMockPool());
  let threw = null;
  try {
    await ownerRepoForFeature(SLUG_NONEXISTENT, CREDENTIAL_NEITHER);
  } catch (err) {
    threw = err;
  }
  assert.ok(threw instanceof ExportNotFoundError, 'a slug with no linked journey row should throw ExportNotFoundError');
  assert.ok(!threw.message.includes(PRODUCT_A.repoOwner), 'error message must not leak product A\'s owner');
  assert.ok(!threw.message.includes(PRODUCT_A.repoName), 'error message must not leak product A\'s repo');
  assert.ok(!threw.message.includes(PRODUCT_A.tenantId), 'error message must not leak any tenant identifier');
});

// ---------------------------------------------------------------------------
// Unit + integration tests -- export route: 403 vs 404 preserved, no leak (AC3)
// ---------------------------------------------------------------------------

test('unauthorizedCredential_returns403_noRepoIdentifierInBody', async () => {
  delete require.cache[require.resolve('../src/web-ui/routes/export')];
  const { handleExportRoute, setExportDataSource } = require('../src/web-ui/routes/export');
  const { realExportDataSource, setDbPool } = freshExportDataSource();
  setDbPool(seededMockPool());
  setExportDataSource(realExportDataSource);

  // Credential resolves to a real, correctly-resolved repo (product A's own),
  // but GitHub itself denies access to it -- this is rb-s4's existing,
  // unchanged 403 boundary (GitHub's own repo-level ACL), now driven by the
  // correctly-resolved per-product repo rather than the old global one.
  const mock = createMockGithubFetch([FIXTURE_A], { denyAccess: true });
  const originalFetch = global.fetch;
  global.fetch = mock.fetch;
  try {
    const req = { headers: { authorization: 'Bearer ' + CREDENTIAL_NEITHER } };
    const res = makeMockRes();
    await handleExportRoute(req, res, SLUG_A);
    assert.strictEqual(res.statusCode, 403, `expected 403, got ${res.statusCode} body=${res.body}`);
    assert.ok(!res.body.includes(PRODUCT_A.repoOwner), 'error body must not reveal the repo owner');
    assert.ok(!res.body.includes(PRODUCT_A.repoName), 'error body must not reveal the repo name');
    assert.ok(!res.body.includes(PRODUCT_A.tenantId), 'error body must not reveal the tenant identifier');
  } finally {
    global.fetch = originalFetch;
  }
});

test('nonExistentSlug_returns403or404_noRepoIdentifierInBody', async () => {
  delete require.cache[require.resolve('../src/web-ui/routes/export')];
  const { handleExportRoute, setExportDataSource } = require('../src/web-ui/routes/export');
  const { realExportDataSource, setDbPool } = freshExportDataSource();
  setDbPool(seededMockPool());
  setExportDataSource(realExportDataSource);

  const mock = createMockGithubFetch([FIXTURE_A, FIXTURE_B]);
  const originalFetch = global.fetch;
  global.fetch = mock.fetch;
  try {
    const req = { headers: { authorization: 'Bearer ' + CREDENTIAL_NEITHER } };
    const res = makeMockRes();
    await handleExportRoute(req, res, SLUG_NONEXISTENT);
    assert.ok(res.statusCode === 403 || res.statusCode === 404, `expected 403 or 404, got ${res.statusCode}`);
    assert.ok(!res.body.includes(PRODUCT_A.repoOwner), 'error body must not reveal product A\'s repo owner');
    assert.ok(!res.body.includes(PRODUCT_A.repoName), 'error body must not reveal product A\'s repo name');
    assert.ok(!res.body.includes(PRODUCT_A.tenantId), 'error body must not reveal any tenant identifier');
    assert.ok(!res.body.includes(PRODUCT_B.repoOwner), 'error body must not reveal product B\'s repo owner');
    assert.ok(!res.body.includes(PRODUCT_B.tenantId), 'error body must not reveal any tenant identifier');
  } finally {
    global.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// Static check -- AC4: GITHUB_REPO / ownerRepoFromEnv fully removed
// ---------------------------------------------------------------------------

test('githubRepoEnvVarNotReferenced_inExportPath', () => {
  const exportDataSourceSrc = fs.readFileSync(path.join(ROOT, 'src', 'web-ui', 'adapters', 'export-data-source.js'), 'utf8');
  const exportRouteSrc = fs.readFileSync(path.join(ROOT, 'src', 'web-ui', 'routes', 'export.js'), 'utf8');

  assert.ok(!/GITHUB_REPO/.test(exportDataSourceSrc), 'export-data-source.js must not reference GITHUB_REPO');
  assert.ok(!/ownerRepoFromEnv/.test(exportDataSourceSrc), 'export-data-source.js must not reference ownerRepoFromEnv');
  assert.ok(!/GITHUB_REPO/.test(exportRouteSrc), 'routes/export.js must not reference GITHUB_REPO');
  assert.ok(!/ownerRepoFromEnv/.test(exportRouteSrc), 'routes/export.js must not reference ownerRepoFromEnv');
});

// ---------------------------------------------------------------------------
// Integration test -- full endpoint, two products resolve independently (AC1, AC2)
// ---------------------------------------------------------------------------

test('exportEndpointEndToEnd_twoProductsResolveIndependently', async () => {
  delete require.cache[require.resolve('../src/web-ui/routes/export')];
  const { handleExportRoute, setExportDataSource } = require('../src/web-ui/routes/export');
  const { realExportDataSource, setDbPool } = freshExportDataSource();
  setDbPool(seededMockPool());
  setExportDataSource(realExportDataSource);

  const mock = createMockGithubFetch([FIXTURE_A, FIXTURE_B]);
  const originalFetch = global.fetch;
  global.fetch = mock.fetch;
  try {
    const reqA = { headers: { authorization: 'Bearer ' + CREDENTIAL_A } };
    const resA = makeMockRes();
    await handleExportRoute(reqA, resA, SLUG_A);

    const reqB = { headers: { authorization: 'Bearer ' + CREDENTIAL_B } };
    const resB = makeMockRes();
    await handleExportRoute(reqB, resB, SLUG_B);

    assert.strictEqual(resA.statusCode, 200, `expected 200 for product A, got ${resA.statusCode} body=${resA.body}`);
    assert.strictEqual(resB.statusCode, 200, `expected 200 for product B, got ${resB.statusCode} body=${resB.body}`);

    const parsedA = JSON.parse(resA.body);
    const parsedB = JSON.parse(resB.body);

    assert.strictEqual(parsedA.artefactContent, FIXTURE_A.artefactBody, 'product A response should contain only product A\'s content');
    assert.strictEqual(parsedB.artefactContent, FIXTURE_B.artefactBody, 'product B response should contain only product B\'s content');
    assert.notStrictEqual(parsedA.artefactContent, parsedB.artefactContent, 'cross-check: no overlap between the two products\' responses');
  } finally {
    global.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// NFR test -- tenant-scoped lookup adds no more than 500ms
// ---------------------------------------------------------------------------

test('tenantScopedLookupUnder500ms', async () => {
  const { ownerRepoForFeature, setDbPool } = freshExportDataSource();
  setDbPool(seededMockPool());
  const start = Date.now();
  await ownerRepoForFeature(SLUG_A, CREDENTIAL_A);
  const elapsed = Date.now() - start;
  assert.ok(elapsed < 500, `tenant-scoped lookup took ${elapsed}ms -- expected under 500ms`);
});

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

(async function main() {
  console.log('\n[mtrr-s1] Running tests\n');
  for (const { name, fn } of registered) {
    try {
      await fn();
      console.log(`  ✔ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✖ ${name}`);
      console.error(`    ${err.stack || err.message}`);
      failed++;
    }
  }

  console.log('');
  console.log(`[mtrr-s1-tenant-scoped-repo-resolution] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
