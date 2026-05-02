#!/usr/bin/env node
// check-wuce6-feature-navigation.js — AC verification tests for wuce.6
// Tests T1.1–T1.6, T2.1–T2.3, T3.1–T3.2, T4.1–T4.2, T5.1–T5.2,
//        IT1–IT4, NFR1–NFR2
// No external dependencies — Node.js built-ins only.
// Tests FAIL until src/web-ui/utils/plain-language-labels.js,
// src/web-ui/adapters/feature-list.js, src/web-ui/adapters/artefact-list.js,
// and src/web-ui/routes/features.js exist.

'use strict';

const path = require('path');
const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

// ── Load modules ─────────────────────────────────────────────────────────────
process.env.WUCE_REPOSITORIES = 'test-owner/test-repo';
process.env.SESSION_SECRET    = 'test-session-secret-minimum32chars!!';
process.env.NODE_ENV          = 'development';

const {
  labelArtefactType,
  groupArtefactsByStage
} = require('../src/web-ui/utils/plain-language-labels');

const {
  listFeatures,
  setValidateRepositoryAccess,
  setFetchPipelineState,
  setConfiguredRepositories
} = require('../src/web-ui/adapters/feature-list');

const {
  listArtefacts,
  setFetchArtefactDirectory,
  setValidateRepositoryAccess: setArtefactValidateAccess,
  setConfiguredRepositories:   setArtefactRepos
} = require('../src/web-ui/adapters/artefact-list');

const {
  renderFeatureList,
  renderArtefactItem,
  handleGetFeatures,
  handleGetFeatureArtefacts,
  setAuditLogger
} = require('../src/web-ui/routes/features');

// Fixtures
const pipelineStateFeature     = require('./fixtures/github/pipeline-state-feature.json');
const artefactListFixture      = require('./fixtures/github/contents-api-artefact-list.json');
const emptyArtefactsFixture    = require('./fixtures/github/contents-api-empty-artefacts.json');

// ── Test helpers ─────────────────────────────────────────────────────────────
function mockReq(overrides) {
  return Object.assign({
    session: { accessToken: 'test-token', userId: 'user-99' },
    sessionId: 'test-sid',
    query: {},
    headers: {},
    method: 'GET'
  }, overrides || {});
}

function mockRes() {
  return {
    statusCode: null,
    headers: {},
    body: '',
    writeHead(code, hdrs) {
      this.statusCode = code;
      if (hdrs) Object.assign(this.headers, hdrs);
    },
    end(body) { this.body = (body != null ? String(body) : ''); this._ended = true; }
  };
}

// ── Test registry ─────────────────────────────────────────────────────────────
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

// ══════════════════════════════════════════════════════════════════════════════
// T1 — labelArtefactType (AC2)
// ══════════════════════════════════════════════════════════════════════════════

test('T1.1 labelArtefactType("dor") returns "Ready Check"', () => {
  const result = labelArtefactType('dor');
  assert(result === 'Ready Check', 'T1.1: "dor" → "Ready Check"');
});

test('T1.2 labelArtefactType("benefit-metric") returns "Benefit Metric"', () => {
  const result = labelArtefactType('benefit-metric');
  assert(result === 'Benefit Metric', 'T1.2: "benefit-metric" → "Benefit Metric"');
});

test('T1.3 labelArtefactType("discovery") returns "Discovery"', () => {
  const result = labelArtefactType('discovery');
  assert(result === 'Discovery', 'T1.3: "discovery" → "Discovery"');
});

test('T1.4 labelArtefactType("test-plan") returns "Test Plan"', () => {
  const result = labelArtefactType('test-plan');
  assert(result === 'Test Plan', 'T1.4: "test-plan" → "Test Plan"');
});

test('T1.5 labelArtefactType("story") returns "Stories"', () => {
  const result = labelArtefactType('story');
  assert(result === 'Stories', 'T1.5: "story" → "Stories"');
});

test('T1.6 unknown type returns non-empty fallback string and does not throw', () => {
  let result;
  let threw = false;
  try {
    result = labelArtefactType('unknown-internal-type');
  } catch (e) {
    threw = true;
  }
  assert(!threw, 'T1.6: no exception thrown for unknown type');
  assert(typeof result === 'string' && result.length > 0, 'T1.6: returns non-empty string');
  assert(result !== 'unknown-internal-type', 'T1.6: raw internal identifier not returned as-is');
});

// ══════════════════════════════════════════════════════════════════════════════
// T2 — groupArtefactsByStage (AC3)
// ══════════════════════════════════════════════════════════════════════════════

test('T2.1 groupArtefactsByStage groups artefacts by stage with correct keys', () => {
  const artefacts = [
    { type: 'Discovery',     name: 'discovery.md',    viewUrl: '/a/d' },
    { type: 'Benefit Metric',name: 'bm.md',           viewUrl: '/a/b' },
    { type: 'Stories',       name: 'story.md',        viewUrl: '/a/s' },
    { type: 'Test Plan',     name: 'test-plan.md',    viewUrl: '/a/t' },
    { type: 'Ready Check',   name: 'dor.md',          viewUrl: '/a/r' }
  ];
  const groups = groupArtefactsByStage(artefacts);
  assert(typeof groups === 'object', 'T2.1: returns an object');
  assert(Array.isArray(groups['Discovery']),     'T2.1: Discovery group exists');
  assert(Array.isArray(groups['Benefit Metric']),'T2.1: Benefit Metric group exists');
  assert(Array.isArray(groups['Ready Check']),   'T2.1: Ready Check group exists');
});

test('T2.2 no internal type identifier appears as a group key', () => {
  const artefacts = [
    { type: 'Ready Check', name: 'wuce.1-dor.md',         viewUrl: '/a/r' },
    { type: 'Benefit Metric', name: 'benefit-metric.md',  viewUrl: '/a/b' }
  ];
  const groups = groupArtefactsByStage(artefacts);
  const keys = Object.keys(groups);
  assert(!keys.includes('dor'), 'T2.2: "dor" is not a group key');
  assert(!keys.includes('benefit-metric'), 'T2.2: "benefit-metric" is not a group key');
  assert(keys.includes('Ready Check'), 'T2.2: "Ready Check" IS a group key');
  assert(keys.includes('Benefit Metric'), 'T2.2: "Benefit Metric" IS a group key');
});

test('T2.3 groupArtefactsByStage with empty array returns empty groups without throwing', () => {
  let result;
  let threw = false;
  try {
    result = groupArtefactsByStage([]);
  } catch (e) {
    threw = true;
  }
  assert(!threw, 'T2.3: no exception with empty array');
  assert(typeof result === 'object' && Object.keys(result).length === 0, 'T2.3: returns empty object');
});

// ══════════════════════════════════════════════════════════════════════════════
// T3 — listFeatures adapter (AC1)
// ══════════════════════════════════════════════════════════════════════════════

test('T3.1 listFeatures returns feature list with required fields', async () => {
  setConfiguredRepositories(() => ['test-owner/test-repo']);
  setValidateRepositoryAccess(async () => true);
  setFetchPipelineState(async () => ({ features: [pipelineStateFeature] }));

  const features = await listFeatures('test-token');
  assert(Array.isArray(features), 'T3.1: returns array');
  assert(features.length > 0, 'T3.1: at least one feature returned');
  const f = features[0];
  assert(typeof f.slug === 'string'             && f.slug.length > 0, 'T3.1: slug present');
  assert(typeof f.stage === 'string'            && f.stage.length > 0, 'T3.1: stage present');
  assert(typeof f.lastUpdated === 'string',      'T3.1: lastUpdated present');
  assert(typeof f.artefactIndexUrl === 'string' && f.artefactIndexUrl.length > 0, 'T3.1: artefactIndexUrl present');
});

test('T3.2 listFeatures validates read access before listing features', async () => {
  const accessCalls = [];
  setConfiguredRepositories(() => ['test-owner/test-repo']);
  setValidateRepositoryAccess(async (owner, repo, token) => {
    accessCalls.push({ owner, repo });
    return true;
  });
  setFetchPipelineState(async () => ({ features: [pipelineStateFeature] }));

  await listFeatures('test-token');
  assert(accessCalls.length >= 1, 'T3.2: validateRepositoryAccess called for each repo');
  assert(accessCalls[0].owner === 'test-owner', 'T3.2: correct owner passed to access check');
  assert(accessCalls[0].repo  === 'test-repo',  'T3.2: correct repo passed to access check');
});

// ══════════════════════════════════════════════════════════════════════════════
// T4 — listArtefacts adapter (AC2, AC4)
// ══════════════════════════════════════════════════════════════════════════════

test('T4.1 listArtefacts returns artefacts with display-label type field, not internal type', async () => {
  setArtefactRepos(() => ['test-owner/test-repo']);
  setArtefactValidateAccess(async () => true);
  setFetchArtefactDirectory(async () => artefactListFixture);

  const { artefacts } = await listArtefacts('2026-05-02-test-feature', 'test-token');
  assert(Array.isArray(artefacts) && artefacts.length > 0, 'T4.1: artefacts array returned');

  const dorArtefact = artefacts.find((a) => a.name === 'wuce.1-dor.md');
  assert(dorArtefact !== undefined, 'T4.1: dor artefact present');
  assert(dorArtefact.type === 'Ready Check', 'T4.1: dor artefact type is "Ready Check" not "dor"');

  const discoveryArtefact = artefacts.find((a) => a.name === 'discovery.md');
  assert(discoveryArtefact !== undefined, 'T4.1: discovery artefact present');
  assert(discoveryArtefact.type === 'Discovery', 'T4.1: discovery type is "Discovery" not "discovery"');
});

test('T4.2 listArtefacts each artefact includes viewUrl pointing to wuce.2 artefact view', async () => {
  setArtefactRepos(() => ['test-owner/test-repo']);
  setArtefactValidateAccess(async () => true);
  setFetchArtefactDirectory(async () => artefactListFixture);

  const { artefacts } = await listArtefacts('2026-05-02-test-feature', 'test-token');
  const allHaveViewUrl = artefacts.every((a) => typeof a.viewUrl === 'string' && a.viewUrl.startsWith('/artefacts/'));
  assert(allHaveViewUrl, 'T4.2: every artefact has viewUrl starting with /artefacts/');
});

// ══════════════════════════════════════════════════════════════════════════════
// T5 — renderFeatureList DOM-state (AC1, AC2)
// ══════════════════════════════════════════════════════════════════════════════

test('T5.1 renderFeatureList renders slug, stage, last-updated, and artefact index link', () => {
  const features = [{
    slug: '2026-05-02-test-feature',
    stage: 'test-plan',
    lastUpdated: '2026-05-01',
    artefactIndexUrl: '/features/2026-05-02-test-feature'
  }];
  const html = renderFeatureList(features);
  assert(html.includes('2026-05-02-test-feature'),               'T5.1: slug in HTML');
  assert(html.includes('test-plan'),                             'T5.1: stage in HTML');
  assert(html.includes('2026-05-01'),                            'T5.1: lastUpdated in HTML');
  assert(html.includes('href="/features/2026-05-02-test-feature"'),'T5.1: artefact index link');
});

test('T5.2 renderArtefactItem renders plain-language label and does not contain "dor" as visible text', () => {
  const artefact = {
    type: 'Ready Check',
    name: 'wuce.1-dor.md',
    viewUrl: '/artefacts/artefacts/2026-05-02-test-feature/dor/wuce.1-dor.md'
  };
  const html = renderArtefactItem(artefact);
  assert(html.includes('Ready Check'), 'T5.2: "Ready Check" present in HTML');
  // "dor" appears only in the URL path and filename, not as standalone visible text
  // (the HTML escaping means dor is in href/filename context only — test that the type span is not "dor")
  assert(!html.includes('>dor<'), 'T5.2: "dor" not rendered as standalone visible text');
  assert(!html.includes('>dor </'), 'T5.2: "dor" not rendered as display-label');
});

// ══════════════════════════════════════════════════════════════════════════════
// Integration tests
// ══════════════════════════════════════════════════════════════════════════════

test('IT1 GET /features returns 200 with feature list containing required shape', async () => {
  setConfiguredRepositories(() => ['test-owner/test-repo']);
  setValidateRepositoryAccess(async () => true);
  setFetchPipelineState(async () => ({ features: [pipelineStateFeature] }));

  const req = mockReq();
  const res = mockRes();
  await handleGetFeatures(req, res);

  assert(res.statusCode === 200, 'IT1: status 200');
  const body = JSON.parse(res.body);
  assert(Array.isArray(body), 'IT1: body is array');
  assert(body.length > 0, 'IT1: at least one feature');
  const f = body[0];
  assert(typeof f.slug  === 'string', 'IT1: slug field');
  assert(typeof f.stage === 'string', 'IT1: stage field');
  assert(typeof f.lastUpdated === 'string', 'IT1: lastUpdated field');
  assert(typeof f.artefactIndexUrl === 'string', 'IT1: artefactIndexUrl field');
});

test('IT2 GET /features/:slug returns artefact index with display labels', async () => {
  setArtefactRepos(() => ['test-owner/test-repo']);
  setArtefactValidateAccess(async () => true);
  setFetchArtefactDirectory(async () => artefactListFixture);

  const req = mockReq();
  const res = mockRes();
  await handleGetFeatureArtefacts(req, res, '2026-05-02-test-feature');

  assert(res.statusCode === 200, 'IT2: status 200');
  const body = JSON.parse(res.body);
  assert(Array.isArray(body.artefacts), 'IT2: artefacts array');

  const typeValues = body.artefacts.map((a) => a.type);
  // AC2: plain-language labels only
  const internalTypes = ['dor', 'benefit-metric', 'discovery', 'test-plan', 'story'];
  for (const t of internalTypes) {
    assert(!typeValues.includes(t), `IT2: internal type "${t}" not in response type values`);
  }
  assert(typeValues.includes('Discovery'),     'IT2: "Discovery" label present');
  assert(typeValues.includes('Benefit Metric'),'IT2: "Benefit Metric" label present');
  assert(typeValues.includes('Ready Check'),   'IT2: "Ready Check" label present');
  assert(typeValues.includes('Test Plan'),     'IT2: "Test Plan" label present');
  assert(typeValues.includes('Stories'),       'IT2: "Stories" label present');
});

test('IT3 GET /features/:slug for repo with no artefacts directory returns "No artefacts found"', async () => {
  setArtefactRepos(() => ['test-owner/test-repo']);
  setArtefactValidateAccess(async () => true);
  setFetchArtefactDirectory(async () => emptyArtefactsFixture);

  const req = mockReq();
  const res = mockRes();
  await handleGetFeatureArtefacts(req, res, '2026-05-02-no-artefacts-repo');

  assert(res.statusCode === 200, 'IT3: status 200 (not error page)');
  const body = JSON.parse(res.body);
  assert(body.message === 'No artefacts found', 'IT3: "No artefacts found" in response');
});

test('IT4 GET /features returns 401 without authentication', async () => {
  const req = mockReq({ session: {} });  // no accessToken
  const res = mockRes();
  await handleGetFeatures(req, res);

  assert(res.statusCode === 401, 'IT4: status 401 for unauthenticated request');
});

// ══════════════════════════════════════════════════════════════════════════════
// NFR tests
// ══════════════════════════════════════════════════════════════════════════════

test('NFR1 audit log on feature list access: userId, featureCount, timestamp logged; no token', async () => {
  const logCalls = [];
  setAuditLogger({ info: (event, data) => logCalls.push({ event, data }) });

  setConfiguredRepositories(() => ['test-owner/test-repo']);
  setValidateRepositoryAccess(async () => true);
  setFetchPipelineState(async () => ({ features: [pipelineStateFeature] }));

  const req = mockReq({ session: { accessToken: 'secret-token-abc', userId: 'user-99' } });
  const res = mockRes();
  await handleGetFeatures(req, res);

  // Flatten all log call data to a single string for token check
  const logStr = JSON.stringify(logCalls);
  assert(logStr.includes('user-99'),           'NFR1: userId in audit log');
  assert(!logStr.includes('secret-token-abc'), 'NFR1: access token NOT in audit log');

  const accessLog = logCalls.find((c) => c.event === 'feature_list_accessed');
  assert(accessLog !== undefined, 'NFR1: feature_list_accessed event logged');
  assert(typeof accessLog.data.featureCount === 'number', 'NFR1: featureCount in log');
  assert(typeof accessLog.data.timestamp    === 'string', 'NFR1: timestamp in log');
});

test('NFR2 private repo not enumerated for unauthorised user', async () => {
  setConfiguredRepositories(() => ['test-owner/private-repo', 'test-owner/public-repo']);
  let accessCallCount = 0;
  setValidateRepositoryAccess(async (owner, repo) => {
    accessCallCount++;
    return repo !== 'private-repo';  // private-repo is not accessible
  });
  setFetchPipelineState(async (owner, repo) => {
    if (repo === 'public-repo') return { features: [pipelineStateFeature] };
    return null;
  });

  const features = await listFeatures('test-token');

  // Access checked for all repos
  assert(accessCallCount >= 1, 'NFR2: validateRepositoryAccess called for each configured repo');
  // Private repo features must not appear
  const slugs = features.map((f) => f.slug);
  assert(!slugs.includes('private-feature'), 'NFR2: private repo features absent from result');
  // Public repo features are returned
  assert(features.length > 0, 'NFR2: public repo features returned');
  // No exception thrown for inaccessible repo
});

// ── Run all tests ─────────────────────────────────────────────────────────────
async function run() {
  let suiteFailed = false;
  for (const { name, fn } of tests) {
    console.log(`\n${name}`);
    try {
      await fn();
    } catch (err) {
      console.log(`  \u2717 THREW: ${err.message}`);
      failed++;
    }
  }
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`wuce.6 feature-navigation: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

run();
