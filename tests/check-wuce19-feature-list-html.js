#!/usr/bin/env node
// check-wuce19-feature-list-html.js — AC verification tests for wuce.19
// Tests T1–T16 (HTTP integration via mock req/res)
// Tests FAIL until handleGetFeatures() has content-type negotiation.
// No external dependencies — Node.js built-ins only.

'use strict';

const path = require('path');
const ROOT = path.join(__dirname, '..');

// ── Environment setup ─────────────────────────────────────────────────────────
process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
process.env.WUCE_REPOSITORIES    = 'test-owner/test-repo';

let passed = 0;
let failed = 0;

function ok(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function eq(actual, expected, label) {
  if (actual === expected) { console.log(`  \u2713 ${label}`); passed++; }
  else {
    console.log(`  \u2717 ${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
    failed++;
  }
}

// ── Load modules ─────────────────────────────────────────────────────────────
const {
  setFetchPipelineState,
  setConfiguredRepositories,
  setValidateRepositoryAccess
} = require('../src/web-ui/adapters/feature-list');

const {
  handleGetFeatures,
  setAuditLogger
} = require('../src/web-ui/routes/features');

// ── Test helpers ─────────────────────────────────────────────────────────────
// Standard mock: 2 features — updatedAt is normalised to lastUpdated by the adapter
const MOCK_PIPELINE_STATE = {
  features: [
    { slug: '2026-04-01-my-feature',    stage: 'definition', updatedAt: '2026-04-01' },
    { slug: '2026-04-02-other-feature', stage: 'test-plan',  updatedAt: '2026-04-02' }
  ]
};

function setupAdapter(state) {
  setConfiguredRepositories(() => ['test-owner/test-repo']);
  setValidateRepositoryAccess(async () => true);
  setFetchPipelineState(async () => state);
}

function mockReq(overrides) {
  return Object.assign({
    session:   { accessToken: 'test-token', userId: 42, login: 'alice' },
    sessionId: 'test-sid',
    query:     {},
    headers:   { accept: 'text/html' },
    method:    'GET',
    url:       '/features'
  }, overrides || {});
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
    end(body) { this.body = (body != null ? String(body) : ''); }
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

(async () => {

  // ───────────────────────────────────────────────────────────────────────────
  // T1 — GET /features Accept: text/html → 200 with HTML shell
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\nT1 — GET /features Accept: text/html → 200 with HTML shell');
  {
    setupAdapter(MOCK_PIPELINE_STATE);
    const req = mockReq({ headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetFeatures(req, res);
    eq(res.statusCode, 200, 'T1: status 200');
    ok(res.headers['Content-Type'] && res.headers['Content-Type'].includes('text/html'),
      'T1: Content-Type includes text/html');
    ok(res.body.includes('<!doctype html'), 'T1: doctype present');
    ok(res.body.includes('<nav aria-label="Main navigation">'), 'T1: nav with aria-label');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // T2 — GET /features HTML — <ul> present with one <li> per feature
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\nT2 — GET /features HTML — <ul> present with one <li> per feature');
  {
    setupAdapter(MOCK_PIPELINE_STATE);
    const req = mockReq({ headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetFeatures(req, res);
    ok(res.body.includes('<ul'), 'T2: <ul> element present');
    const liCount = (res.body.match(/<li/g) || []).length;
    ok(liCount >= 2, `T2: at least 2 <li> elements (found ${liCount})`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // T3 — GET /features HTML — feature slug in each item
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\nT3 — GET /features HTML — feature slug in each item');
  {
    setupAdapter(MOCK_PIPELINE_STATE);
    const req = mockReq({ headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetFeatures(req, res);
    ok(res.body.includes('2026-04-01-my-feature'),    'T3: first slug present');
    ok(res.body.includes('2026-04-02-other-feature'), 'T3: second slug present');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // T4 — GET /features HTML — stage displayed per item
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\nT4 — GET /features HTML — stage displayed per item');
  {
    setupAdapter(MOCK_PIPELINE_STATE);
    const req = mockReq({ headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetFeatures(req, res);
    ok(res.body.includes('definition'), 'T4: definition stage present');
    ok(res.body.includes('test-plan'),  'T4: test-plan stage present');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // T5 — GET /features HTML — link to /features/:slug per item
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\nT5 — GET /features HTML — link to /features/:slug per item');
  {
    setupAdapter(MOCK_PIPELINE_STATE);
    const req = mockReq({ headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetFeatures(req, res);
    ok(res.body.includes('href="/features/2026-04-01-my-feature"'),
      'T5: first slug link href present');
    ok(res.body.includes('href="/features/2026-04-02-other-feature"'),
      'T5: second slug link href present');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // T6 — GET /features Accept: application/json → JSON unchanged
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\nT6 — GET /features Accept: application/json → JSON unchanged');
  {
    setupAdapter(MOCK_PIPELINE_STATE);
    const req = mockReq({ headers: { accept: 'application/json' } });
    const res = mockRes();
    await handleGetFeatures(req, res);
    eq(res.statusCode, 200, 'T6: status 200');
    ok(res.headers['Content-Type'] && res.headers['Content-Type'].includes('application/json'),
      'T6: Content-Type application/json');
    let parsed;
    try { parsed = JSON.parse(res.body); } catch (e) { parsed = null; }
    ok(Array.isArray(parsed), 'T6: body parses as array');
    ok(parsed && parsed.length > 0 && typeof parsed[0].slug === 'string',
      'T6: array items have slug field');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // T7 — GET /features no Accept header → JSON unchanged
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\nT7 — GET /features no Accept header → JSON unchanged');
  {
    setupAdapter(MOCK_PIPELINE_STATE);
    const req = mockReq({ headers: {} });
    const res = mockRes();
    await handleGetFeatures(req, res);
    eq(res.statusCode, 200, 'T7: status 200');
    ok(res.headers['Content-Type'] && res.headers['Content-Type'].includes('application/json'),
      'T7: Content-Type application/json');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // T8 — GET /features empty features → HTML with empty-state message, no <ul>
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\nT8 — GET /features empty features → empty-state message, no <ul>');
  {
    setupAdapter({ features: [] });
    const req = mockReq({ headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetFeatures(req, res);
    eq(res.statusCode, 200, 'T8: status 200');
    ok(res.body.includes('No features found'), 'T8: empty-state message present');
    ok(!res.body.includes('<ul'), 'T8: no <ul> element rendered');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // T9 — GET /features HTML — XSS in stage value escaped
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\nT9 — GET /features HTML — XSS in stage value escaped');
  {
    setupAdapter({
      features: [{ slug: '2026-04-01-xss', stage: '<b>bad</b>', updatedAt: '2026-04-01' }]
    });
    const req = mockReq({ headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetFeatures(req, res);
    ok(!res.body.includes('<b>bad</b>'),           'T9: raw <b> tag not in body');
    ok(res.body.includes('&lt;b&gt;bad&lt;/b&gt;'), 'T9: escaped version present');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // T10 — GET /features unauthenticated Accept: text/html → 302
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\nT10 — GET /features unauthenticated Accept: text/html → 302');
  {
    const req = mockReq({ session: {}, headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetFeatures(req, res);
    eq(res.statusCode, 302, 'T10: status 302');
    eq(res.headers['Location'], '/auth/github', 'T10: Location /auth/github');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // T11 — GET /features unauthenticated Accept: application/json → 302
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\nT11 — GET /features unauthenticated Accept: application/json → 302');
  {
    const req = mockReq({ session: {}, headers: { accept: 'application/json' } });
    const res = mockRes();
    await handleGetFeatures(req, res);
    eq(res.statusCode, 302, 'T11: status 302');
    eq(res.headers['Location'], '/auth/github', 'T11: Location /auth/github');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // T12 — GET /features HTML — date displayed per item
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\nT12 — GET /features HTML — date displayed per item');
  {
    setupAdapter(MOCK_PIPELINE_STATE);
    const req = mockReq({ headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetFeatures(req, res);
    ok(res.body.includes('2026-04-01'), 'T12: first feature date present');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // T13 — GET /features HTML — audit log written with { userId, route, timestamp }
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\nT13 — GET /features HTML — audit log written');
  {
    const auditCalls = [];
    setAuditLogger({ info: (event, data) => auditCalls.push({ event, data }) });
    setupAdapter(MOCK_PIPELINE_STATE);
    const req = mockReq({
      headers: { accept: 'text/html' },
      session: { accessToken: 'audit-token', userId: 99, login: 'tester' }
    });
    const res = mockRes();
    await handleGetFeatures(req, res);

    const entry = auditCalls.find((c) => c.event === 'feature_list_accessed');
    ok(entry !== undefined,                         'T13: feature_list_accessed event logged');
    ok(entry && entry.data.userId === 99,           'T13: userId in audit log');
    ok(entry && entry.data.route  === '/features',  'T13: route in audit log');
    ok(entry && typeof entry.data.timestamp === 'string', 'T13: timestamp in audit log');

    // Reset logger so subsequent tests are not affected
    setAuditLogger({ info: () => {} });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // T14 — GET /features HTML — no extra API round-trip (adapter called once)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\nT14 — GET /features HTML — listFeatures adapter called exactly once');
  {
    let adapterCalls = 0;
    setConfiguredRepositories(() => ['test-owner/test-repo']);
    setValidateRepositoryAccess(async () => true);
    setFetchPipelineState(async () => {
      adapterCalls++;
      return { features: [{ slug: 'single-feat', stage: 'discovery', updatedAt: '2026-01-01' }] };
    });
    const req = mockReq({ headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetFeatures(req, res);
    eq(adapterCalls, 1, 'T14: listFeatures adapter fetch called exactly once');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // T15 — GET /features HTML — renderShell wraps output (nav present)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\nT15 — GET /features HTML — renderShell wraps output');
  {
    setupAdapter(MOCK_PIPELINE_STATE);
    const req = mockReq({ headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetFeatures(req, res);
    ok(res.body.includes('<nav aria-label="Main navigation">'),
      'T15: renderShell nav element present');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // T16 — GET /features HTML — special chars in slug escaped
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\nT16 — GET /features HTML — special chars in slug escaped');
  {
    setupAdapter({
      features: [{ slug: 'feat-<test>', stage: 'discovery', updatedAt: '2026-01-01' }]
    });
    const req = mockReq({ headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetFeatures(req, res);
    ok(!res.body.includes('feat-<test>'),        'T16: raw < in slug not present');
    ok(res.body.includes('feat-&lt;test&gt;'),   'T16: escaped slug present');
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);

})().catch((err) => {
  console.error('\nUnhandled error in test suite:', err);
  process.exit(1);
});
