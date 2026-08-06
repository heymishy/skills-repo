'use strict';

// rb-s4: Bootstrap an existing repo from a DoR-approved SaaS artefact
// Tests AC1-AC5 per artefacts/2026-08-05-repo-bootstrap-no-fork/test-plans/rb-s4-test-plan.md

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { PassThrough } = require('stream');

const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;
const registered = [];

/** Registers a test (sync or async fn) to run sequentially in main(). */
function test(name, fn) {
  registered.push({ name, fn });
}

function mktmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rb-s4-test-'));
}

function rmtmp(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const TEST_CREDENTIAL = 'synthetic-test-credential-not-a-real-token-xyz789';

function b64(s) { return Buffer.from(s, 'utf8').toString('base64'); }

function makeFixture(slug, storySlug, artefactBody) {
  const dorArtefact = `artefacts/${slug}/dor/${storySlug}-dor.md`;
  const feature = {
    slug,
    stage: 'dor-signed-off',
    stories: [
      {
        id: storySlug,
        dorStatus: 'signed-off',
        dorArtefact,
        stage: 'dor-signed-off',
        health: 'green'
      }
    ]
  };
  return { feature, dorArtefact, artefactBody };
}

const FIXTURE_A = makeFixture('2026-01-01-feature-a', 'fa-s1', '# Feature A DoR\n\nApproved content for feature A.\n');
const FIXTURE_B = makeFixture('2026-02-02-feature-b', 'fb-s1', '# Feature B DoR\n\nDifferent approved content for feature B.\n');

function pipelineStateWith(...features) {
  return {
    version: '1',
    updated: new Date().toISOString(),
    programmes: [],
    features: features.map(f => f.feature)
  };
}

/** Mocked GitHub Contents API fetch — resolves pipeline-state.json and per-slug artefact requests. */
function createMockGithubFetch(fixtures, opts) {
  opts = opts || {};
  const calls = [];
  const state = pipelineStateWith(...fixtures);

  async function mockFetch(url, options) {
    calls.push({ url, options });

    if (opts.denyAccess) {
      return { ok: false, status: 403, json: async () => ({ message: 'Forbidden' }) };
    }

    if (url.includes('/contents/.github/pipeline-state.json')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ content: b64(JSON.stringify(state)), encoding: 'base64' })
      };
    }

    for (const fx of fixtures) {
      if (!fx.dorArtefact) continue;
      const artefactUrlFragment = `/contents/${fx.dorArtefact}`;
      if (url.includes(artefactUrlFragment)) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ content: b64(fx.artefactBody), encoding: 'base64' })
        };
      }
    }

    return { ok: false, status: 404, json: async () => ({ message: 'Not Found' }) };
  }

  return { calls, fetch: mockFetch };
}

/**
 * mtrr-s1: realExportDataSource now resolves owner/repo via
 * ownerRepoForFeature's tenant-scoped products-table lookup instead of the
 * old single-repo env-var helper, so every call now requires a wired DB
 * pool. This suite's own mocked GitHub fetch (createMockGithubFetch above)
 * matches purely on URL path suffix and never inspects the owner/repo
 * segment, so the exact values returned here are arbitrary -- they only need
 * to be non-null so ownerRepoForFeature resolves successfully for each
 * fixture's slug, preserving this suite's original intent (testing
 * pipeline-state/artefact fetch mechanics, not tenant-scoping -- that is
 * mtrr-s1's own dedicated test file's job).
 */
function createMockDbPoolForFixtures(fixtures) {
  const rows = fixtures.map((fx, i) => ({
    slug: fx.feature.slug,
    productId: 'rb-s4-fixture-product-' + i,
    tenantId: 'rb-s4-fixture-tenant-' + i,
    repoOwner: 'rb-s4-fixture-owner-' + i,
    repoName: 'rb-s4-fixture-repo-' + i
  }));
  return {
    query: async (sql, params) => {
      const s = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
      if (s.startsWith('SELECT PRODUCT_ID, TENANT_ID FROM JOURNEYS WHERE FEATURE_SLUG')) {
        const match = rows.find(r => r.slug === params[0]);
        return { rows: match ? [{ product_id: match.productId, tenant_id: match.tenantId }] : [] };
      }
      if (s.startsWith('SELECT REPO_OWNER, REPO_NAME FROM PRODUCTS WHERE PRODUCT_ID')) {
        const match = rows.find(r => r.productId === params[0] && r.tenantId === params[1]);
        return { rows: match ? [{ repo_owner: match.repoOwner, repo_name: match.repoName }] : [] };
      }
      return { rows: [] };
    }
  };
}

function createMockSaasFetch(opts) {
  opts = opts || {};
  const calls = [];
  async function mockFetch(url, options) {
    calls.push({ url, options });
    if (opts.deny) {
      return {
        ok: false,
        status: 403,
        json: async () => ({ error: `Credential does not have access to feature ${opts.deny}` })
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        artefactContent: opts.fixture.artefactBody,
        pipelineStateEntry: opts.fixture.feature
      })
    };
  }
  return { calls, fetch: mockFetch };
}

function makeMockRes() {
  const res = { statusCode: null, headers: null, body: null };
  res.writeHead = (status, headers) => { res.statusCode = status; res.headers = headers; };
  res.end = (body) => { res.body = body; };
  return res;
}

// ---------------------------------------------------------------------------
// Unit tests — export data source adapter (AC5, the critical D37 tests)
// ---------------------------------------------------------------------------

test('stubExportDataSourceThrows_whenNotWired', () => {
  delete require.cache[require.resolve('../src/web-ui/routes/export')];
  const { getExportDataSource } = require('../src/web-ui/routes/export');
  const stub = getExportDataSource();
  assert.throws(
    () => stub(),
    (err) => err.message === 'Adapter not wired: exportDataSource. Call setExportDataSource() with a real implementation before use.',
    'unwired stub should throw the exact D37 message, not return null/undefined/empty'
  );
});

test('wiredExportDataSource_returnsCorrectPayloadForCredential', async () => {
  const { realExportDataSource, setDbPool } = require('../src/web-ui/adapters/export-data-source');
  setDbPool(createMockDbPoolForFixtures([FIXTURE_A]));
  const mock = createMockGithubFetch([FIXTURE_A]);
  const originalFetch = global.fetch;
  global.fetch = mock.fetch;
  try {
    const result = await realExportDataSource(FIXTURE_A.feature.slug, TEST_CREDENTIAL);
    assert.strictEqual(result.artefactContent, FIXTURE_A.artefactBody, 'artefact content should match the fixture exactly');
    assert.strictEqual(result.pipelineStateEntry.slug, FIXTURE_A.feature.slug, 'pipelineStateEntry should be the correct feature');
  } finally {
    global.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// Unit tests — export route handler (AC4)
// ---------------------------------------------------------------------------

test('exportEndpointReturns200WithMatchingContent_forValidRequest', async () => {
  delete require.cache[require.resolve('../src/web-ui/routes/export')];
  const { handleExportRoute, setExportDataSource } = require('../src/web-ui/routes/export');
  const { realExportDataSource, setDbPool } = require('../src/web-ui/adapters/export-data-source');
  setDbPool(createMockDbPoolForFixtures([FIXTURE_A]));
  setExportDataSource(realExportDataSource);

  const mock = createMockGithubFetch([FIXTURE_A]);
  const originalFetch = global.fetch;
  global.fetch = mock.fetch;
  try {
    const req = { headers: { authorization: 'Bearer ' + TEST_CREDENTIAL } };
    const res = makeMockRes();
    await handleExportRoute(req, res, FIXTURE_A.feature.slug);
    assert.strictEqual(res.statusCode, 200, `expected 200, got ${res.statusCode} body=${res.body}`);
    const parsed = JSON.parse(res.body);
    assert.strictEqual(parsed.artefactContent, FIXTURE_A.artefactBody);
    assert.strictEqual(parsed.pipelineStateEntry.slug, FIXTURE_A.feature.slug);
  } finally {
    global.fetch = originalFetch;
  }
});

test('exportEndpointRejectsRequestForFeatureNotDorApproved', async () => {
  delete require.cache[require.resolve('../src/web-ui/routes/export')];
  const { handleExportRoute, setExportDataSource } = require('../src/web-ui/routes/export');
  const { realExportDataSource, setDbPool } = require('../src/web-ui/adapters/export-data-source');
  setExportDataSource(realExportDataSource);

  const notReadyFeature = {
    feature: { slug: '2026-03-03-not-ready', stage: 'definition', stories: [{ id: 'nr-s1', dorStatus: 'not-started' }] },
    dorArtefact: null,
    artefactBody: null
  };
  setDbPool(createMockDbPoolForFixtures([notReadyFeature]));
  const mock = createMockGithubFetch([notReadyFeature]);
  const originalFetch = global.fetch;
  global.fetch = mock.fetch;
  try {
    const req = { headers: { authorization: 'Bearer ' + TEST_CREDENTIAL } };
    const res = makeMockRes();
    await handleExportRoute(req, res, notReadyFeature.feature.slug);
    assert.ok(res.statusCode >= 400 && res.statusCode < 500, `expected a 4xx for a not-DoR-approved feature, got ${res.statusCode}`);
  } finally {
    global.fetch = originalFetch;
  }
});

test('exportEndpointAuditLogsEachFetch', async () => {
  delete require.cache[require.resolve('../src/web-ui/routes/export')];
  const { handleExportRoute, setExportDataSource, setLogger } = require('../src/web-ui/routes/export');
  const { realExportDataSource, setDbPool } = require('../src/web-ui/adapters/export-data-source');
  setDbPool(createMockDbPoolForFixtures([FIXTURE_A]));
  setExportDataSource(realExportDataSource);

  const logged = [];
  setLogger({
    info: (event, data) => logged.push({ event, data }),
    warn: () => {}
  });

  const mock = createMockGithubFetch([FIXTURE_A]);
  const originalFetch = global.fetch;
  global.fetch = mock.fetch;
  try {
    const req = { headers: { authorization: 'Bearer ' + TEST_CREDENTIAL } };
    const res = makeMockRes();
    await handleExportRoute(req, res, FIXTURE_A.feature.slug);
    const entry = logged.find(l => l.event === 'export_fetch');
    assert.ok(entry, 'an export_fetch audit entry should have been logged');
    assert.strictEqual(entry.data.featureSlug, FIXTURE_A.feature.slug);
    assert.ok(entry.data.timestamp, 'audit entry should include a timestamp');
    assert.ok(!JSON.stringify(entry.data).includes(TEST_CREDENTIAL), 'audit log must never include the credential');
  } finally {
    global.fetch = originalFetch;
    setLogger({ info: () => {}, warn: () => {} });
  }
});

// ---------------------------------------------------------------------------
// Integration test — AC5 behavioural correctness (the critical D37 test)
// ---------------------------------------------------------------------------

test('twoDifferentFeaturesResolveToTwoDifferentCorrectPayloads', async () => {
  const { realExportDataSource, setDbPool } = require('../src/web-ui/adapters/export-data-source');
  setDbPool(createMockDbPoolForFixtures([FIXTURE_A, FIXTURE_B]));
  const mock = createMockGithubFetch([FIXTURE_A, FIXTURE_B]);
  const originalFetch = global.fetch;
  global.fetch = mock.fetch;
  try {
    const resultA = await realExportDataSource(FIXTURE_A.feature.slug, TEST_CREDENTIAL);
    const resultB = await realExportDataSource(FIXTURE_B.feature.slug, TEST_CREDENTIAL);

    assert.notStrictEqual(resultA.artefactContent, resultB.artefactContent,
      'two different features must resolve to two different artefact payloads, not a shared/cached response');
    assert.strictEqual(resultA.artefactContent, FIXTURE_A.artefactBody, 'feature A content should individually match its own fixture');
    assert.strictEqual(resultB.artefactContent, FIXTURE_B.artefactBody, 'feature B content should individually match its own fixture');
    assert.strictEqual(resultA.pipelineStateEntry.slug, FIXTURE_A.feature.slug);
    assert.strictEqual(resultB.pipelineStateEntry.slug, FIXTURE_B.feature.slug);
  } finally {
    global.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// Unit tests — CLI credential handling (AC1)
// ---------------------------------------------------------------------------

test('cliPromptsForCredentialSecurely_neverViaEnvVar', () => {
  const binSource = fs.readFileSync(path.join(ROOT, 'cli', 'bin', 'init.js'), 'utf8');
  const saasFetchSource = fs.readFileSync(path.join(ROOT, 'cli', 'lib', 'saas-fetch.js'), 'utf8');
  const initLibSource = fs.readFileSync(path.join(ROOT, 'cli', 'lib', 'init.js'), 'utf8');

  assert.ok(!/process\.env\.\w*CRED/i.test(saasFetchSource), 'saas-fetch.js must not read the credential from a plain env var');
  assert.ok(!/process\.env\.\w*CRED/i.test(initLibSource), 'init.js must not read the credential from a plain env var');
  assert.ok(!/process\.env\.\w*TOKEN/i.test(saasFetchSource), 'saas-fetch.js must not read the credential from a plain env var named *TOKEN');
  assert.ok(!/--credential/.test(binSource), 'CLI must not accept the credential as a command-line flag/argument');

  const { promptForCredential } = require('../cli/lib/credential-prompt');
  assert.strictEqual(typeof promptForCredential, 'function', 'credential-prompt.js must export promptForCredential');
});

test('promptForCredential_nonTtyFallback_readsWithoutEnvOrArg', async () => {
  const { promptForCredential } = require('../cli/lib/credential-prompt');
  const input = new PassThrough();
  input.isTTY = false;
  const output = new PassThrough();
  output.on('data', () => {});

  const promise = promptForCredential({ input, output });
  input.write(TEST_CREDENTIAL + '\n');
  input.end();
  const result = await promise;
  assert.strictEqual(result, TEST_CREDENTIAL);
});

// ---------------------------------------------------------------------------
// Unit + integration tests — CLI fetch logic (AC1, AC2, AC3)
// ---------------------------------------------------------------------------

test('cliFetchesArtefactAndPipelineStateForValidCredential', async () => {
  const { fetchFromSaas } = require('../cli/lib/saas-fetch');
  const tmp = mktmp();
  try {
    const mock = createMockSaasFetch({ fixture: FIXTURE_A });
    await fetchFromSaas(tmp, FIXTURE_A.feature.slug, TEST_CREDENTIAL, { fetchImpl: mock.fetch, baseUrl: 'https://saas.test' });
    const written = fs.readFileSync(path.join(tmp, FIXTURE_A.dorArtefact), 'utf8');
    assert.strictEqual(written, FIXTURE_A.artefactBody);
  } finally {
    rmtmp(tmp);
  }
});

test('fetchedContentWrittenToConventionalPaths', async () => {
  const { fetchFromSaas } = require('../cli/lib/saas-fetch');
  const tmp = mktmp();
  try {
    const mock = createMockSaasFetch({ fixture: FIXTURE_A });
    await fetchFromSaas(tmp, FIXTURE_A.feature.slug, TEST_CREDENTIAL, { fetchImpl: mock.fetch, baseUrl: 'https://saas.test' });

    assert.ok(fs.existsSync(path.join(tmp, FIXTURE_A.dorArtefact)), 'DoR artefact should be written to the conventional path');

    const statePath = path.join(tmp, '.github', 'pipeline-state.json');
    assert.ok(fs.existsSync(statePath), 'pipeline-state.json should be written');
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    const feature = state.features.find(f => f.slug === FIXTURE_A.feature.slug);
    assert.ok(feature, 'pipeline-state.json should contain the fetched feature entry');
    assert.strictEqual(feature.stories[0].dorStatus, 'signed-off');
  } finally {
    rmtmp(tmp);
  }
});

test('return403OnInvalidCredentialAccess_namesTheProblem', async () => {
  const { fetchFromSaas, SaasAccessDeniedError } = require('../cli/lib/saas-fetch');
  const tmp = mktmp();
  try {
    const mock = createMockSaasFetch({ deny: FIXTURE_A.feature.slug });
    let threw = null;
    try {
      await fetchFromSaas(tmp, FIXTURE_A.feature.slug, TEST_CREDENTIAL, { fetchImpl: mock.fetch, baseUrl: 'https://saas.test' });
    } catch (err) {
      threw = err;
    }
    assert.ok(threw, 'fetchFromSaas should throw on a 403');
    assert.ok(threw instanceof SaasAccessDeniedError, 'error should be a SaasAccessDeniedError');
    assert.ok(threw.message.includes(FIXTURE_A.feature.slug), `error message should name the feature slug, got: ${threw.message}`);
  } finally {
    rmtmp(tmp);
  }
});

test('doesNotFallBackToFreshRepoBootstrapOn403', async () => {
  const { fetchFromSaas } = require('../cli/lib/saas-fetch');
  const tmp = mktmp();
  try {
    const before = fs.readdirSync(tmp);
    assert.strictEqual(before.length, 0, 'target dir should start empty');

    const mock = createMockSaasFetch({ deny: FIXTURE_A.feature.slug });
    try {
      await fetchFromSaas(tmp, FIXTURE_A.feature.slug, TEST_CREDENTIAL, { fetchImpl: mock.fetch, baseUrl: 'https://saas.test' });
    } catch (_) { /* expected */ }

    const after = fs.readdirSync(tmp);
    assert.strictEqual(after.length, 0, 'target dir should remain untouched after a 403 -- no fresh-repo fallback content written');
  } finally {
    rmtmp(tmp);
  }
});

// ---------------------------------------------------------------------------
// Integration test — full CLI wiring (AC1, AC2)
// ---------------------------------------------------------------------------

test('cliEndToEnd_fetchAndMaterializeAgainstMockedSaasApi', async () => {
  delete require.cache[require.resolve('../cli/lib/init')];
  const { runInit } = require('../cli/lib/init');
  const tmp = mktmp();
  try {
    const mock = createMockSaasFetch({ fixture: FIXTURE_A });
    await runInit(tmp, {
      fromSaas: FIXTURE_A.feature.slug,
      credential: TEST_CREDENTIAL,
      saasBaseUrl: 'https://saas.test',
      fetchImpl: mock.fetch
    });

    assert.ok(fs.existsSync(path.join(tmp, FIXTURE_A.dorArtefact)), 'fetched DoR artefact should be materialized');
    assert.ok(fs.existsSync(path.join(tmp, '.github', 'pipeline-state.json')), 'pipeline-state.json should exist');
    assert.ok(fs.existsSync(path.join(tmp, '.github', 'skills')), 'full skill set (rb-s2) should still be installed');
    assert.ok(fs.existsSync(path.join(tmp, '.github', 'skills-registry.json')), 'skills registry (rb-s2) should still be installed');

    const state = JSON.parse(fs.readFileSync(path.join(tmp, '.github', 'pipeline-state.json'), 'utf8'));
    const feature = state.features.find(f => f.slug === FIXTURE_A.feature.slug);
    assert.ok(feature, 'pipeline-state.json should contain the fetched feature, ready for /branch-setup');
  } finally {
    rmtmp(tmp);
  }
});

// ---------------------------------------------------------------------------
// NFR tests
// ---------------------------------------------------------------------------

test('fetchAndMaterializeUnder15Seconds', async () => {
  const { fetchFromSaas } = require('../cli/lib/saas-fetch');
  const tmp = mktmp();
  try {
    const mock = createMockSaasFetch({ fixture: FIXTURE_A });
    const start = Date.now();
    await fetchFromSaas(tmp, FIXTURE_A.feature.slug, TEST_CREDENTIAL, { fetchImpl: mock.fetch, baseUrl: 'https://saas.test' });
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 15000, `fetch-and-materialize took ${elapsed}ms -- expected under 15000ms`);
  } finally {
    rmtmp(tmp);
  }
});

test('credentialNeverLoggedOrWrittenToDisk', async () => {
  delete require.cache[require.resolve('../cli/lib/init')];
  const { runInit } = require('../cli/lib/init');
  const tmp = mktmp();
  const originalLog = console.log;
  const originalErr = console.error;
  let captured = '';
  console.log = (...a) => { captured += a.join(' ') + '\n'; };
  console.error = (...a) => { captured += a.join(' ') + '\n'; };
  try {
    const mock = createMockSaasFetch({ fixture: FIXTURE_A });
    await runInit(tmp, {
      fromSaas: FIXTURE_A.feature.slug,
      credential: TEST_CREDENTIAL,
      saasBaseUrl: 'https://saas.test',
      fetchImpl: mock.fetch
    });
  } finally {
    console.log = originalLog;
    console.error = originalErr;
  }

  assert.ok(!captured.includes(TEST_CREDENTIAL), 'credential must never appear in console output');

  function walk(dir) {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const st = fs.statSync(full);
      if (st.isDirectory()) { walk(full); continue; }
      let content;
      try { content = fs.readFileSync(full, 'utf8'); } catch (_) { continue; }
      assert.ok(!content.includes(TEST_CREDENTIAL), `credential must never be written to disk, found in ${path.relative(tmp, full)}`);
    }
  }
  walk(tmp);
  rmtmp(tmp);
});

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

(async function main() {
  console.log('\n[rb-s4] Running tests\n');
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
  console.log(`[rb-s4-saas-connected-bootstrap] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
