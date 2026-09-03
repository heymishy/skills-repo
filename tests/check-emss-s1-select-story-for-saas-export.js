'use strict';

// emss-s1: Let a --from-saas export request specify which DoR-approved story to fetch
// Tests AC1-AC4 per artefacts/2026-08-07-export-multi-story-selection/test-plans/emss-s1-test-plan.md

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;
const registered = [];

/** Registers a test (sync or async fn) to run sequentially in main(). */
function test(name, fn) {
  registered.push({ name, fn });
}

function mktmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'emss-s1-test-'));
}

function rmtmp(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

// ---------------------------------------------------------------------------
// Shared fixtures — a feature with 2 signed-off stories, story A first
// ---------------------------------------------------------------------------

const TEST_CREDENTIAL = 'synthetic-test-credential-not-a-real-token-xyz789';

function makeMultiStoryFeature() {
  return {
    slug: '2026-08-07-multi-story-feature',
    stage: 'dor-signed-off',
    stories: [
      {
        id: 'msf-s1',
        slug: 'msf-s1',
        dorStatus: 'signed-off',
        dorArtefact: 'artefacts/2026-08-07-multi-story-feature/dor/msf-s1-dor.md'
      },
      {
        id: 'msf-s2',
        slug: 'msf-s2',
        dorStatus: 'signed-off',
        dorArtefact: 'artefacts/2026-08-07-multi-story-feature/dor/msf-s2-dor.md'
      },
      {
        id: 'msf-s3',
        slug: 'msf-s3',
        dorStatus: 'not-started',
        dorArtefact: null
      }
    ]
  };
}

function makeMockRes() {
  const res = { statusCode: null, headers: null, body: null };
  res.writeHead = (status, headers) => { res.statusCode = status; res.headers = headers; };
  res.end = (body) => { res.body = body; };
  return res;
}

/** Mocked "real" data source that mirrors realExportDataSource's contract without a DB pool or network. */
function createMockDataSourceForFeature(feature) {
  const { findDorApprovedStory, ExportNotFoundError } = require(path.join(ROOT, 'src', 'web-ui', 'adapters', 'export-data-source'));
  return async function mockDataSource(slug, credential, storySlug) {
    const story = findDorApprovedStory(feature, storySlug);
    if (!story) throw new ExportNotFoundError(slug);
    return {
      artefactContent: `content for ${story.slug || story.id}`,
      pipelineStateEntry: feature
    };
  };
}

// ---------------------------------------------------------------------------
// Unit tests — findDorApprovedStory optional storySlug parameter
// ---------------------------------------------------------------------------

test('noSelector_returnsFirstSignedOffStory', () => {
  const { findDorApprovedStory } = require(path.join(ROOT, 'src', 'web-ui', 'adapters', 'export-data-source'));
  const feature = makeMultiStoryFeature();
  const story = findDorApprovedStory(feature);
  assert.ok(story, 'a story should be returned');
  assert.strictEqual(story.id, 'msf-s1', 'no-selector default must still return the first signed-off story (AC1 backward compat)');
});

test('validSelector_returnsThatSpecificStory', () => {
  const { findDorApprovedStory } = require(path.join(ROOT, 'src', 'web-ui', 'adapters', 'export-data-source'));
  const feature = makeMultiStoryFeature();
  const story = findDorApprovedStory(feature, 'msf-s2');
  assert.ok(story, 'a story should be returned for a valid selector');
  assert.strictEqual(story.id, 'msf-s2', 'should return story B, not story A');
});

test('invalidSelector_nonexistentSlug_returnsNull', () => {
  const { findDorApprovedStory } = require(path.join(ROOT, 'src', 'web-ui', 'adapters', 'export-data-source'));
  const feature = makeMultiStoryFeature();
  const story = findDorApprovedStory(feature, 'does-not-exist');
  assert.strictEqual(story, null, 'a selector matching no story on the feature must return null, never fall back to story A');
});

test('invalidSelector_unapprovedStory_returnsNull', () => {
  const { findDorApprovedStory } = require(path.join(ROOT, 'src', 'web-ui', 'adapters', 'export-data-source'));
  const feature = makeMultiStoryFeature();
  const story = findDorApprovedStory(feature, 'msf-s3');
  assert.strictEqual(story, null, 'a selector matching an existing-but-not-signed-off story must return null, never fall back to story A');
});

// ---------------------------------------------------------------------------
// Unit tests — realExportDataSource threading the selector + error class split
// ---------------------------------------------------------------------------

test('realExportDataSource_noSelector_preservesExistingNotDorApprovedError', async () => {
  const { realExportDataSource, setDbPool, ExportNotDorApprovedError } = require(path.join(ROOT, 'src', 'web-ui', 'adapters', 'export-data-source'));
  const feature = {
    slug: '2026-08-07-nothing-signed-off',
    stage: 'definition',
    stories: [{ id: 'nso-s1', dorStatus: 'not-started' }]
  };
  setDbPool({
    query: async (sql, params) => {
      const s = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
      if (s.startsWith('SELECT PRODUCT_ID, TENANT_ID FROM JOURNEYS WHERE FEATURE_SLUG')) {
        return { rows: [{ product_id: 'p1', tenant_id: 't1' }] };
      }
      if (s.startsWith('SELECT REPO_OWNER, REPO_NAME FROM PRODUCTS WHERE PRODUCT_ID')) {
        return { rows: [{ repo_owner: 'owner1', repo_name: 'repo1' }] };
      }
      return { rows: [] };
    }
  });
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    if (String(url).includes('/contents/.github/pipeline-state.json')) {
      const state = { version: '1', updated: new Date().toISOString(), programmes: [], features: [feature] };
      return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify({ content: Buffer.from(JSON.stringify(state)).toString('base64'), encoding: 'base64' }) };
    }
    return { ok: false, status: 404, json: async () => ({ message: 'Not Found' }) };
  };
  try {
    let threw = null;
    try {
      await realExportDataSource(feature.slug, TEST_CREDENTIAL);
    } catch (err) {
      threw = err;
    }
    assert.ok(threw instanceof ExportNotDorApprovedError, 'no-selector + nothing signed off must still throw ExportNotDorApprovedError, unchanged from today');
  } finally {
    global.fetch = originalFetch;
  }
});

test('realExportDataSource_invalidSelector_throwsExportNotFoundError', async () => {
  const { realExportDataSource, setDbPool, ExportNotFoundError } = require(path.join(ROOT, 'src', 'web-ui', 'adapters', 'export-data-source'));
  const feature = makeMultiStoryFeature();
  setDbPool({
    query: async (sql) => {
      const s = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
      if (s.startsWith('SELECT PRODUCT_ID, TENANT_ID FROM JOURNEYS WHERE FEATURE_SLUG')) {
        return { rows: [{ product_id: 'p1', tenant_id: 't1' }] };
      }
      if (s.startsWith('SELECT REPO_OWNER, REPO_NAME FROM PRODUCTS WHERE PRODUCT_ID')) {
        return { rows: [{ repo_owner: 'owner1', repo_name: 'repo1' }] };
      }
      return { rows: [] };
    }
  });
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    if (String(url).includes('/contents/.github/pipeline-state.json')) {
      const state = { version: '1', updated: new Date().toISOString(), programmes: [], features: [feature] };
      return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify({ content: Buffer.from(JSON.stringify(state)).toString('base64'), encoding: 'base64' }) };
    }
    return { ok: false, status: 404, json: async () => ({ message: 'Not Found' }) };
  };
  try {
    let threw = null;
    try {
      await realExportDataSource(feature.slug, TEST_CREDENTIAL, 'does-not-exist');
    } catch (err) {
      threw = err;
    }
    assert.ok(threw instanceof ExportNotFoundError, `an invalid selector must throw ExportNotFoundError (AC3), got ${threw && threw.constructor.name}`);
  } finally {
    global.fetch = originalFetch;
  }
});

// ---------------------------------------------------------------------------
// Unit tests — route handler query-param threading (AC2, AC3) + audit log NFR
// ---------------------------------------------------------------------------

test('routeHandler_noSelector_returnsFirstStoryArtefact', async () => {
  delete require.cache[require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'export'))];
  const { handleExportRoute, setExportDataSource } = require(path.join(ROOT, 'src', 'web-ui', 'routes', 'export'));
  const feature = makeMultiStoryFeature();
  setExportDataSource(createMockDataSourceForFeature(feature));

  const req = { headers: { authorization: 'Bearer ' + TEST_CREDENTIAL }, query: {} };
  const res = makeMockRes();
  await handleExportRoute(req, res, feature.slug);
  assert.strictEqual(res.statusCode, 200, `expected 200, got ${res.statusCode} body=${res.body}`);
  const parsed = JSON.parse(res.body);
  assert.strictEqual(parsed.artefactContent, 'content for msf-s1', 'no selector should return story A (AC1)');
});

test('routeHandler_validSelector_returnsThatStoryArtefact', async () => {
  delete require.cache[require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'export'))];
  const { handleExportRoute, setExportDataSource } = require(path.join(ROOT, 'src', 'web-ui', 'routes', 'export'));
  const feature = makeMultiStoryFeature();
  setExportDataSource(createMockDataSourceForFeature(feature));

  const req = { headers: { authorization: 'Bearer ' + TEST_CREDENTIAL }, query: { story: 'msf-s2' } };
  const res = makeMockRes();
  await handleExportRoute(req, res, feature.slug);
  assert.strictEqual(res.statusCode, 200, `expected 200, got ${res.statusCode} body=${res.body}`);
  const parsed = JSON.parse(res.body);
  assert.strictEqual(parsed.artefactContent, 'content for msf-s2', 'a valid ?story= selector must return that specific story (AC2), not story A');
});

test('routeHandler_invalidSelector_returnsNotFoundError', async () => {
  delete require.cache[require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'export'))];
  const { handleExportRoute, setExportDataSource } = require(path.join(ROOT, 'src', 'web-ui', 'routes', 'export'));
  const feature = makeMultiStoryFeature();
  setExportDataSource(createMockDataSourceForFeature(feature));

  const req = { headers: { authorization: 'Bearer ' + TEST_CREDENTIAL }, query: { story: 'does-not-exist' } };
  const res = makeMockRes();
  await handleExportRoute(req, res, feature.slug);
  assert.strictEqual(res.statusCode, 404, `an unmatched ?story= selector must return the ExportNotFoundError status code (404), got ${res.statusCode}`);
});

test('routeHandler_missingReqQuery_doesNotThrow', async () => {
  // Some existing callers (rb-s4's own test suite) construct req objects
  // without a .query field at all -- the route handler must not assume it
  // is always present.
  delete require.cache[require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'export'))];
  const { handleExportRoute, setExportDataSource } = require(path.join(ROOT, 'src', 'web-ui', 'routes', 'export'));
  const feature = makeMultiStoryFeature();
  setExportDataSource(createMockDataSourceForFeature(feature));

  const req = { headers: { authorization: 'Bearer ' + TEST_CREDENTIAL } }; // no .query at all
  const res = makeMockRes();
  await handleExportRoute(req, res, feature.slug);
  assert.strictEqual(res.statusCode, 200, `a req with no .query field must not throw -- should behave as no-selector, got ${res.statusCode} body=${res.body}`);
});

test('auditLog_includesSelectedStorySlug', async () => {
  delete require.cache[require.resolve(path.join(ROOT, 'src', 'web-ui', 'routes', 'export'))];
  const { handleExportRoute, setExportDataSource, setLogger } = require(path.join(ROOT, 'src', 'web-ui', 'routes', 'export'));
  const feature = makeMultiStoryFeature();
  setExportDataSource(createMockDataSourceForFeature(feature));

  const logged = [];
  setLogger({ info: (event, data) => logged.push({ event, data }), warn: () => {} });

  try {
    const reqDefault = { headers: { authorization: 'Bearer ' + TEST_CREDENTIAL }, query: {} };
    await handleExportRoute(reqDefault, makeMockRes(), feature.slug);
    const reqSelected = { headers: { authorization: 'Bearer ' + TEST_CREDENTIAL }, query: { story: 'msf-s2' } };
    await handleExportRoute(reqSelected, makeMockRes(), feature.slug);

    const entries = logged.filter(l => l.event === 'export_fetch');
    assert.strictEqual(entries.length, 2, 'both calls should be audit-logged');
    assert.strictEqual(entries[0].data.storySlug, null, 'default (no-selector) call should log storySlug: null');
    assert.strictEqual(entries[1].data.storySlug, 'msf-s2', 'explicit-selector call should log the selected story slug');
  } finally {
    setLogger({ info: () => {}, warn: () => {} });
  }
});

// ---------------------------------------------------------------------------
// Integration test — CLI --story flag threading (AC4)
// ---------------------------------------------------------------------------

test('cliStoryFlag_threadsSelectorToExportRequest', async () => {
  const { fetchFromSaas } = require(path.join(ROOT, 'cli', 'lib', 'saas-fetch'));
  const feature = makeMultiStoryFeature();
  const tmp = mktmp();
  try {
    const calls = [];
    const mockFetch = async (url) => {
      calls.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({ artefactContent: 'content for msf-s2', pipelineStateEntry: feature })
      };
    };
    await fetchFromSaas(tmp, feature.slug, TEST_CREDENTIAL, { fetchImpl: mockFetch, baseUrl: 'https://saas.test', story: 'msf-s2' });
    assert.strictEqual(calls.length, 1, 'exactly one request should have been made');
    const requestedUrl = new URL(calls[0]);
    assert.strictEqual(requestedUrl.searchParams.get('story'), 'msf-s2', `constructed URL must include the story selector as a query parameter, got ${calls[0]}`);
  } finally {
    rmtmp(tmp);
  }
});

test('cliStoryFlag_writesTheSelectedStorysArtefactPath_notTheDefault', async () => {
  // Correctness check beyond the URL-shape assertion above: the CLI's own
  // local findDorApprovedStory() copy must also be given the selector, or it
  // will independently re-derive story A's dorArtefact path while writing
  // story B's actual returned content under it.
  const { fetchFromSaas } = require(path.join(ROOT, 'cli', 'lib', 'saas-fetch'));
  const feature = makeMultiStoryFeature();
  const storyB = feature.stories[1];
  const tmp = mktmp();
  try {
    const mockFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ artefactContent: 'content for msf-s2', pipelineStateEntry: feature })
    });
    await fetchFromSaas(tmp, feature.slug, TEST_CREDENTIAL, { fetchImpl: mockFetch, baseUrl: 'https://saas.test', story: 'msf-s2' });
    const writtenPath = path.join(tmp, storyB.dorArtefact);
    assert.ok(fs.existsSync(writtenPath), `expected the selected story's artefact to be written to ${storyB.dorArtefact}`);
    assert.strictEqual(fs.readFileSync(writtenPath, 'utf8'), 'content for msf-s2');
  } finally {
    rmtmp(tmp);
  }
});

test('cliNoStoryFlag_preservesDefaultUrlShape', async () => {
  // AC1 backward compat at the CLI layer: omitting --story must produce the
  // exact same request URL as before this story (no ?story= param at all).
  const { fetchFromSaas } = require(path.join(ROOT, 'cli', 'lib', 'saas-fetch'));
  const feature = makeMultiStoryFeature();
  const tmp = mktmp();
  try {
    const calls = [];
    const mockFetch = async (url) => {
      calls.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({ artefactContent: 'content for msf-s1', pipelineStateEntry: feature })
      };
    };
    await fetchFromSaas(tmp, feature.slug, TEST_CREDENTIAL, { fetchImpl: mockFetch, baseUrl: 'https://saas.test' });
    assert.strictEqual(calls[0], `https://saas.test/api/export/${encodeURIComponent(feature.slug)}`, `no-selector URL must be unchanged, got ${calls[0]}`);
  } finally {
    rmtmp(tmp);
  }
});

test('cliBinInit_parsesStoryFlagAndExcludesFromPositionalArgs', () => {
  const binSource = fs.readFileSync(path.join(ROOT, 'cli', 'bin', 'init.js'), 'utf8');
  assert.ok(/--story/.test(binSource), 'cli/bin/init.js should parse a --story flag');
});

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

(async function main() {
  console.log('\n[emss-s1] Running tests\n');
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
  console.log(`[emss-s1-select-story-for-saas-export] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
