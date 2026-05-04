#!/usr/bin/env node
// check-wuce20-artefact-index-html.js — AC verification tests for wuce.20
// Tests T1–T17 (unit + integration)
// Tests FAIL until:
//   - src/web-ui/utils/artefact-labels.js exists and exports getLabel()
//   - handleGetFeatureArtefacts() has HTML content-type negotiation
// No external dependencies — Node.js built-ins only.

'use strict';

const assert = require('assert');
const path   = require('path');

const ROOT = path.join(__dirname, '..');

// ── Environment setup ─────────────────────────────────────────────────────────
process.env.NODE_ENV = 'test';

// ── Load modules ─────────────────────────────────────────────────────────────
const {
  handleGetFeatureArtefacts,
  setListArtefacts,
  setAuditLogger
} = require('../src/web-ui/routes/features');

const { getLabel } = require('../src/web-ui/utils/artefact-labels');

// ── Counters ──────────────────────────────────────────────────────────────────
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

// ── Test helpers ──────────────────────────────────────────────────────────────

function mockRes() {
  const r = {
    statusCode: null,
    headers:    {},
    body:       '',
    writeHead(code, hdrs) {
      this.statusCode = code;
      if (hdrs) Object.assign(this.headers, hdrs);
    },
    end(body) { this.body = (body != null ? String(body) : ''); }
  };
  return r;
}

function mockReq(overrides) {
  return Object.assign({
    session: { accessToken: 'test-token', userId: 42, login: 'alice' },
    headers: { accept: 'text/html' },
    method:  'GET',
    url:     '/features/2026-04-01-test-feature'
  }, overrides || {});
}

// Standard 4-artefact test fixture
const TEST_ARTEFACTS = [
  { type: 'discovery',     createdAt: '2026-04-01', path: 'artefacts/feat/discovery.md' },
  { type: 'benefit-metric',createdAt: '2026-04-02', path: 'artefacts/feat/benefit-metric.md' },
  { type: 'dor',           createdAt: '2026-04-03', path: 'artefacts/feat/dor/story-dor.md' },
  { type: 'test-plan',     createdAt: '2026-04-04', path: 'artefacts/feat/test-plans/story-test-plan.md' }
];

const FEATURE_SLUG = '2026-04-01-test-feature';

// Helpers to set up mock listArtefacts returning standard test fixture
function useStandardMock() {
  setListArtefacts(async () => ({
    artefacts:   TEST_ARTEFACTS,
    grouped:     {},
    noArtefacts: false
  }));
}

function useEmptyMock() {
  setListArtefacts(async () => ({
    artefacts:   [],
    grouped:     {},
    noArtefacts: true
  }));
}

async function run() {

// ─────────────────────────────────────────────────────────────────────────────
// T1 — Integration: GET /features/:slug Accept: text/html → 200 HTML
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT1 — Accept: text/html → 200 HTML with doctype');
{
  useStandardMock();
  const req = mockReq();
  const res = mockRes();
  let threw = false;
  try { await handleGetFeatureArtefacts(req, res, FEATURE_SLUG); }
  catch (e) { threw = true; console.log('  THREW:', e.message); }
  ok(!threw, 'T1.1: no exception');
  eq(res.statusCode, 200, 'T1.2: status 200');
  ok((res.headers['Content-Type'] || '').includes('text/html'), 'T1.3: Content-Type text/html');
  ok(res.body.includes('<!doctype html'), 'T1.4: body includes <!doctype html');
}

// ─────────────────────────────────────────────────────────────────────────────
// T2 — Integration: HTML response contains renderShell nav
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT2 — HTML response contains renderShell nav');
{
  useStandardMock();
  const req = mockReq();
  const res = mockRes();
  await handleGetFeatureArtefacts(req, res, FEATURE_SLUG);
  ok(res.body.includes('<nav aria-label="Main navigation">'), 'T2.1: nav with aria-label present');
}

// ─────────────────────────────────────────────────────────────────────────────
// T3 — Integration: HTML response contains artefact list items (<li at least 4)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT3 — HTML response contains artefact list items');
{
  useStandardMock();
  const req = mockReq();
  const res = mockRes();
  await handleGetFeatureArtefacts(req, res, FEATURE_SLUG);
  const liCount = (res.body.match(/<li /g) || []).length;
  ok(liCount >= 4, `T3.1: at least 4 <li elements (got ${liCount})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// T4 — Integration: HTML — label "Discovery" displayed for type "discovery"
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT4 — label "Discovery" for type "discovery"');
{
  useStandardMock();
  const req = mockReq();
  const res = mockRes();
  await handleGetFeatureArtefacts(req, res, FEATURE_SLUG);
  ok(res.body.includes('Discovery'), 'T4.1: "Discovery" label in body');
  ok(!res.body.includes('>discovery<'), 'T4.2: raw ">discovery<" not in body');
}

// ─────────────────────────────────────────────────────────────────────────────
// T5 — Integration: HTML — label "Benefit Metric" for "benefit-metric"
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT5 — label "Benefit Metric" for type "benefit-metric"');
{
  useStandardMock();
  const req = mockReq();
  const res = mockRes();
  await handleGetFeatureArtefacts(req, res, FEATURE_SLUG);
  ok(res.body.includes('Benefit Metric'), 'T5.1: "Benefit Metric" label in body');
}

// ─────────────────────────────────────────────────────────────────────────────
// T6 — Integration: HTML — label "Ready Check" for "dor"
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT6 — label "Ready Check" for type "dor"');
{
  useStandardMock();
  const req = mockReq();
  const res = mockRes();
  await handleGetFeatureArtefacts(req, res, FEATURE_SLUG);
  ok(res.body.includes('Ready Check'), 'T6.1: "Ready Check" label in body');
  ok(!res.body.includes('>dor<'), 'T6.2: raw ">dor<" not in body');
}

// ─────────────────────────────────────────────────────────────────────────────
// T7 — Integration: HTML — label "Test Plan" for "test-plan"
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT7 — label "Test Plan" for type "test-plan"');
{
  useStandardMock();
  const req = mockReq();
  const res = mockRes();
  await handleGetFeatureArtefacts(req, res, FEATURE_SLUG);
  ok(res.body.includes('Test Plan'), 'T7.1: "Test Plan" label in body');
}

// ─────────────────────────────────────────────────────────────────────────────
// T8 — Integration: GET /features/:slug Accept: application/json → JSON unchanged
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT8 — Accept: application/json → JSON response unchanged');
{
  useStandardMock();
  const req = mockReq({ headers: { accept: 'application/json' } });
  const res = mockRes();
  await handleGetFeatureArtefacts(req, res, FEATURE_SLUG);
  eq(res.statusCode, 200, 'T8.1: status 200');
  ok((res.headers['Content-Type'] || '').includes('application/json'), 'T8.2: Content-Type application/json');
  let parsed;
  let threw = false;
  try { parsed = JSON.parse(res.body); } catch (e) { threw = true; }
  ok(!threw, 'T8.3: body is valid JSON');
  ok(parsed !== null && typeof parsed === 'object', 'T8.4: parsed body is an object');
  ok(Array.isArray(parsed.artefacts), 'T8.5: body.artefacts is an array');
}

// ─────────────────────────────────────────────────────────────────────────────
// T9 — Integration: no Accept header → JSON unchanged
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT9 — no Accept header → JSON response');
{
  useStandardMock();
  const req = mockReq({ headers: {} });
  const res = mockRes();
  await handleGetFeatureArtefacts(req, res, FEATURE_SLUG);
  eq(res.statusCode, 200, 'T9.1: status 200');
  ok((res.headers['Content-Type'] || '').includes('application/json'), 'T9.2: Content-Type application/json');
  let threw = false;
  try { JSON.parse(res.body); } catch (e) { threw = true; }
  ok(!threw, 'T9.3: body is valid JSON');
}

// ─────────────────────────────────────────────────────────────────────────────
// T10 — Integration: HTML — XSS in artefact path metadata escaped
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT10 — XSS in artefact path metadata is escaped');
{
  setListArtefacts(async () => ({
    artefacts:   [{ type: 'discovery', createdAt: '2026-04-01', path: 'artefacts/<script>alert(1)</script>/discovery.md' }],
    grouped:     {},
    noArtefacts: false
  }));
  const req = mockReq();
  const res = mockRes();
  await handleGetFeatureArtefacts(req, res, FEATURE_SLUG);
  ok(!res.body.includes('<script>alert(1)</script>'), 'T10.1: unescaped <script> not in body');
  ok(res.body.includes('&lt;script&gt;'), 'T10.2: escaped &lt;script&gt; in body');
}

// ─────────────────────────────────────────────────────────────────────────────
// T11 — Integration: HTML — zero artefacts → empty-state message, no <ul
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT11 — zero artefacts → empty-state message, no <ul>');
{
  useEmptyMock();
  const req = mockReq();
  const res = mockRes();
  await handleGetFeatureArtefacts(req, res, FEATURE_SLUG);
  eq(res.statusCode, 200, 'T11.1: status 200');
  ok(res.body.includes('No artefacts found'), 'T11.2: empty-state message in body');
  ok(!res.body.includes('<ul'), 'T11.3: no <ul element in body');
}

// ─────────────────────────────────────────────────────────────────────────────
// T12 — Integration: GET /features/:slug unauthenticated → 302
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT12 \u2014 unauthenticated (browser) \u2192 302 redirect to /auth/github');
{
  const req = mockReq({ session: {} });
  const res = mockRes();
  await handleGetFeatureArtefacts(req, res, FEATURE_SLUG);
  eq(res.statusCode, 302, 'T12.1: status 302');
  eq(res.headers['Location'], '/auth/github', 'T12.2: Location header /auth/github');
}

// ─────────────────────────────────────────────────────────────────────────────
// T13 — Integration: HTML — creation dates displayed per artefact
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT13 — artefact creation dates visible in HTML');
{
  useStandardMock();
  const req = mockReq();
  const res = mockRes();
  await handleGetFeatureArtefacts(req, res, FEATURE_SLUG);
  ok(res.body.includes('2026-04-01'), 'T13.1: date 2026-04-01 in body');
  ok(res.body.includes('2026-04-02'), 'T13.2: date 2026-04-02 in body');
}

// ─────────────────────────────────────────────────────────────────────────────
// T14 — Integration: HTML — link to /artefact/:slug/:type per item
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT14 — artefact link href="/artefact/:slug/:type" per item');
{
  useStandardMock();
  const req = mockReq();
  const res = mockRes();
  await handleGetFeatureArtefacts(req, res, FEATURE_SLUG);
  ok(res.body.includes(`href="/artefact/${FEATURE_SLUG}/discovery"`), 'T14.1: href for discovery artefact');
}

// ─────────────────────────────────────────────────────────────────────────────
// T15 — Unit: artefact-labels.js returns correct labels
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT15 — artefact-labels.js getLabel() returns correct labels');
{
  eq(getLabel('dor'),            'Ready Check',   'T15.1: dor → Ready Check');
  eq(getLabel('benefit-metric'), 'Benefit Metric','T15.2: benefit-metric → Benefit Metric');
  eq(getLabel('test-plan'),      'Test Plan',     'T15.3: test-plan → Test Plan');
  eq(getLabel('discovery'),      'Discovery',     'T15.4: discovery → Discovery');
}

// ─────────────────────────────────────────────────────────────────────────────
// T16 — Unit: artefact-labels.js unknown type returns fallback (non-empty, no throw)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT16 — artefact-labels.js unknown type returns non-empty fallback');
{
  let label;
  let threw = false;
  try {
    label = getLabel('unknown-type');
  } catch (e) {
    threw = true;
  }
  ok(!threw, 'T16.1: no exception for unknown type');
  ok(typeof label === 'string' && label.length > 0, 'T16.2: fallback is non-empty string');
}

// ─────────────────────────────────────────────────────────────────────────────
// T17 — Integration: HTML — audit log written with featureSlug and route
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT17 — audit log written with featureSlug and route on HTML request');
{
  useStandardMock();
  const logCalls = [];
  setAuditLogger({ info: (event, data) => logCalls.push({ event, data }) });

  const req = mockReq();
  const res = mockRes();
  await handleGetFeatureArtefacts(req, res, FEATURE_SLUG);

  const auditCall = logCalls.find((c) => c.event === 'feature_artefacts_accessed');
  ok(auditCall !== undefined, 'T17.1: feature_artefacts_accessed event logged');
  ok(auditCall && auditCall.data.featureSlug === FEATURE_SLUG, 'T17.2: featureSlug in audit log');
  ok(auditCall && auditCall.data.route === '/features/:slug', 'T17.3: route in audit log');
  ok(auditCall && typeof auditCall.data.timestamp === 'string', 'T17.4: timestamp in audit log');

  // Reset audit logger to silent
  setAuditLogger({ info: () => {} });
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`wuce.20 artefact-index-html: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}

} // end run()

run().catch((err) => {
  console.error('Unhandled error in test run:', err);
  process.exitCode = 1;
});
