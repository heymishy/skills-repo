#!/usr/bin/env node
// check-avpf-s1-postgres-fallback.js — AC verification tests for avpf-s1
// Postgres fallback for the artefact viewer when GitHub's Contents API 404s.
// No external dependencies — Node.js built-ins only.

'use strict';

const {
  handleArtefactRoute,
  setLogger,
  setFetcher,
  setJourneyStore
} = require('../src/web-ui/routes/artefact');

const { fetchArtefact, ArtefactNotFoundError } = require('../src/web-ui/adapters/artefact-fetcher');

// ── Test runner ───────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else           { console.log(`  ✗ ${label}`); failed++; }
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

// ── Mock helpers (mirrors tests/check-wuce2-read-render-artefact.js) ───────
function mockReq(overrides) {
  return Object.assign({ session: {}, sessionId: 'test-sid', query: {}, headers: {} }, overrides || {});
}

function mockRes() {
  return {
    statusCode: null,
    headers:    {},
    body:       '',
    writeHead(code, hdrs) {
      this.statusCode = code;
      if (hdrs) Object.assign(this.headers, hdrs);
    },
    end(body) { this.body = (body != null ? body : ''); this._ended = true; }
  };
}

function fakeJourneyStore(overrides) {
  return Object.assign({
    getJourneyByFeatureSlug: () => null,
    getArtefactsForJourney: async () => []
  }, overrides || {});
}

const realJourneyStore = require('../src/web-ui/modules/journey-store');

// ════════════════════════════════════════════════════════════════════════════
// AC1 — Postgres fallback renders content when GitHub 404s (same tenant)
// ════════════════════════════════════════════════════════════════════════════

test('avpf1_postgresFallback_rendersContent_whenGithub404sAndSameTenant', async () => {
  setFetcher(async () => { throw new ArtefactNotFoundError('new-feature-32ded088', 'benefit-metric'); });
  setJourneyStore(fakeJourneyStore({
    getJourneyByFeatureSlug: (slug) => (slug === 'new-feature-32ded088' ? { journeyId: 'j1', tenantId: 't1' } : null),
    getArtefactsForJourney: async (journeyId) => (journeyId === 'j1'
      ? [{ skill_name: 'benefit-metric', artefact_path: 'artefacts/new-feature-32ded088/benefit-metric.md', content: '## Benefit Metric\n\nReal content.' }]
      : [])
  }));

  const req = mockReq({ session: { accessToken: 'tok', userId: 1, tenantId: 't1' } });
  const res = mockRes();
  await handleArtefactRoute(req, res, 'new-feature-32ded088', 'benefit-metric');

  setFetcher(fetchArtefact);
  setJourneyStore(realJourneyStore);

  assert(res.statusCode === 200, 'avpf1: status is 200');
  assert(res.body.includes('<h2>'), 'avpf1: body contains rendered heading');
  assert(!res.body.toLowerCase().includes('artefact not found'), 'avpf1: body does not say artefact not found');
});

// ════════════════════════════════════════════════════════════════════════════
// AC2 — GitHub content preferred and unchanged when GitHub has it
// ════════════════════════════════════════════════════════════════════════════

test('avpf2_githubContent_preferredAndUnchanged_whenGithubHasIt', async () => {
  let pgCalled = false;
  setFetcher(async () => '## Real GitHub Content\n\nFrom GitHub.');
  setJourneyStore(fakeJourneyStore({
    getJourneyByFeatureSlug: () => ({ journeyId: 'j1', tenantId: 't1' }),
    getArtefactsForJourney: async () => { pgCalled = true; return [{ skill_name: 'discovery', content: 'CANARY - should never appear' }]; }
  }));

  const req = mockReq({ session: { accessToken: 'tok', userId: 1, tenantId: 't1' } });
  const res = mockRes();
  await handleArtefactRoute(req, res, 'example-feature', 'discovery');

  setFetcher(fetchArtefact);
  setJourneyStore(realJourneyStore);

  assert(res.statusCode === 200, 'avpf2: status is 200');
  assert(res.body.includes('Real GitHub Content') || res.body.includes('From GitHub'), 'avpf2: body contains GitHub-sourced content');
  assert(!res.body.includes('CANARY'), 'avpf2: body does not contain Postgres canary content');
  assert(pgCalled === false, 'avpf2: Postgres fallback was never consulted when GitHub succeeded');
});

// ════════════════════════════════════════════════════════════════════════════
// AC3 — Existing "artefact not found" unchanged when neither source has content
// ════════════════════════════════════════════════════════════════════════════

test('avpf3_notFoundPage_unchanged_whenNeitherSourceHasContent', async () => {
  setFetcher(async () => { throw new ArtefactNotFoundError('truly-unknown-feature', 'discovery'); });
  setJourneyStore(fakeJourneyStore({
    getJourneyByFeatureSlug: () => null
  }));

  const req = mockReq({ session: { accessToken: 'tok', userId: 1, tenantId: 't1' } });
  const res = mockRes();
  await handleArtefactRoute(req, res, 'truly-unknown-feature', 'discovery');

  setFetcher(fetchArtefact);
  setJourneyStore(realJourneyStore);

  assert(res.statusCode === 404, 'avpf3: status is 404');
  assert(res.body.toLowerCase().includes('artefact not found'), 'avpf3: body contains "artefact not found"');
});

// ════════════════════════════════════════════════════════════════════════════
// AC4 — Degrades to 404 when Postgres lookup itself throws
// ════════════════════════════════════════════════════════════════════════════

test('avpf4_degradesTo404_whenPostgresLookupThrows', async () => {
  setFetcher(async () => { throw new ArtefactNotFoundError('some-feature', 'discovery'); });
  setJourneyStore(fakeJourneyStore({
    getJourneyByFeatureSlug: () => { throw new Error('DB connection failed'); }
  }));

  const req = mockReq({ session: { accessToken: 'tok', userId: 1, tenantId: 't1' } });
  const res = mockRes();

  let threw = false;
  try {
    await handleArtefactRoute(req, res, 'some-feature', 'discovery');
  } catch (_e) {
    threw = true;
  }

  setFetcher(fetchArtefact);
  setJourneyStore(realJourneyStore);

  assert(threw === false, 'avpf4: handleArtefactRoute does not throw');
  assert(res.statusCode === 404, 'avpf4: status is 404, not 500');
  assert(res.body.toLowerCase().includes('artefact not found'), 'avpf4: body contains "artefact not found"');
});

// ════════════════════════════════════════════════════════════════════════════
// AC5 — Cross-tenant: never serve another tenant's content
// ════════════════════════════════════════════════════════════════════════════

test('avpf5_crossTenant_neverServesOtherTenantsContent', async () => {
  setFetcher(async () => { throw new ArtefactNotFoundError('someone-elses-feature', 'benefit-metric'); });
  setJourneyStore(fakeJourneyStore({
    getJourneyByFeatureSlug: () => ({ journeyId: 'j2', tenantId: 't-OTHER' }),
    getArtefactsForJourney: async () => [{ skill_name: 'benefit-metric', content: 'SECRET tenant t-OTHER content' }]
  }));

  const req = mockReq({ session: { accessToken: 'tok', userId: 1, tenantId: 't1' } });
  const res = mockRes();
  await handleArtefactRoute(req, res, 'someone-elses-feature', 'benefit-metric');

  setFetcher(fetchArtefact);
  setJourneyStore(realJourneyStore);

  assert(res.statusCode === 404, 'avpf5: status is 404');
  assert(res.body.toLowerCase().includes('artefact not found'), 'avpf5: body contains "artefact not found"');
  assert(!res.body.includes('SECRET tenant t-OTHER content'), 'avpf5: body never contains the other tenant\'s content');
});

// ════════════════════════════════════════════════════════════════════════════
// Runner
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n[avpf-s1-postgres-fallback] Running 5 AC verification tests...\n');

  for (const t of tests) {
    try {
      const result = t.fn();
      if (result && typeof result.then === 'function') {
        await result;
      }
    } catch (err) {
      console.log(`  ✗ ${t.name} — threw: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n[avpf-s1-postgres-fallback] ${passed} passed, ${failed} failed`);

  if (failed > 0) process.exit(1);
}

main();
