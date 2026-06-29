#!/usr/bin/env node
// check-bee3-posthog.js — AC verification tests for bee.3 (PostHog instrumentation)
// Tests T1–T16 + NFR (unit + NFR)
// All tests FAIL until the PostHog snippet logic is wired into:
//   - src/web-ui/routes/landing.js (handleLanding)
//   - src/web-ui/routes/journey.js (handleJourneys)
//   - src/web-ui/routes/skills.js (handleGetChatHtml or equivalent)
// No external dependencies — Node.js built-ins only.

'use strict';

const path = require('path');
const fs   = require('fs');

const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function ok(condition, label) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else           { console.log(`  ✗ ${label}`); failed++; }
}

function eq(actual, expected, label) {
  if (actual === expected) { console.log(`  ✓ ${label}`); passed++; }
  else {
    console.log(`  ✗ ${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
    failed++;
  }
}

// Helpers
function mockRes() {
  return {
    statusCode: null,
    headers: {},
    body: '',
    writeHead(code, hdrs) {
      this.statusCode = code;
      if (hdrs) Object.assign(this.headers, hdrs);
    },
    end(b) { this.body = b != null ? String(b) : ''; },
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; }
  };
}

function mockReq(overrides) {
  return Object.assign({
    session: {},
    method: 'GET',
    url: '/',
    params: {},
    query: {},
    headers: {}
  }, overrides || {});
}

// Environment setup
process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';

// Load handlers — will throw if modules not yet present (TDD red)
let handleLanding;
let handleJourneys;
let setListJourneys;
let handleGetChatHtml;

try {
  ({ handleLanding } = require('../src/web-ui/routes/landing'));
} catch (e) {
  console.log('✗ WARN: src/web-ui/routes/landing.js not found — landing page tests will fail');
  failed++;
}

try {
  const journeyRoute = require('../src/web-ui/routes/journey');
  handleJourneys  = journeyRoute.handleJourneys;
  setListJourneys = journeyRoute.setListJourneys;
} catch (e) {
  console.log('✗ WARN: handleJourneys/setListJourneys not found in routes/journey.js — dashboard tests will fail');
  failed++;
}

try {
  ({ handleGetChatHtml } = require('../src/web-ui/routes/skills'));
} catch (e) {
  // skills.js may load but not export handleGetChatHtml until bee.3 is implemented
  console.log('✗ WARN: handleGetChatHtml not found in routes/skills.js — chat page tests will fail');
  failed++;
}

// ─────────────────────────────────────────────────────────────────────────────
// T1 — landing page with POSTHOG_KEY set: body contains PostHog CDN snippet
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT1 — landing page (key set): PostHog CDN snippet present');
{
  process.env.POSTHOG_KEY = 'phc_test123';
  if (handleLanding) {
    const req = mockReq({ session: {} });
    const res = mockRes();
    handleLanding(req, res);
    ok(
      res.body.includes('posthog.com') || res.body.includes('posthog'),
      'T1.1: body contains posthog CDN reference'
    );
    ok(res.body.includes('phc_test123'), 'T1.2: body contains POSTHOG_KEY value');
  } else {
    ok(false, 'T1: skipped — handleLanding not loaded');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// T2 — landing page: PostHog script tag has async attribute
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT2 — landing page: PostHog script has async attribute');
{
  process.env.POSTHOG_KEY = 'phc_test123';
  if (handleLanding) {
    const req = mockReq({ session: {} });
    const res = mockRes();
    handleLanding(req, res);
    // Find the script tag containing posthog and assert it has async
    const body = res.body;
    const scriptStart = body.indexOf('<script');
    const posthogScriptIdx = body.indexOf('posthog');
    // The posthog snippet should be in a script block with async
    const snippetRegion = body.slice(
      Math.max(0, posthogScriptIdx - 200),
      posthogScriptIdx + 200
    );
    ok(snippetRegion.includes('async'), 'T2.1: PostHog script tag has async attribute');
  } else {
    ok(false, 'T2: skipped — handleLanding not loaded');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// T3 — landing page with POSTHOG_KEY unset: no PostHog reference in HTML
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT3 — landing page (key unset): no posthog reference in HTML');
{
  delete process.env.POSTHOG_KEY;
  if (handleLanding) {
    const req = mockReq({ session: {} });
    const res = mockRes();
    handleLanding(req, res);
    ok(!res.body.toLowerCase().includes('posthog'), 'T3.1: no posthog reference when key unset');
  } else {
    ok(false, 'T3: skipped — handleLanding not loaded');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// T4 — landing page with POSTHOG_KEY = '' (empty string): no PostHog reference
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT4 — landing page (key empty string): no posthog reference');
{
  process.env.POSTHOG_KEY = '';
  if (handleLanding) {
    const req = mockReq({ session: {} });
    const res = mockRes();
    handleLanding(req, res);
    ok(!res.body.toLowerCase().includes('posthog'), 'T4.1: empty POSTHOG_KEY treated same as unset');
  } else {
    ok(false, 'T4: skipped — handleLanding not loaded');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// T5 — landing page: landing_page_view capture call present when key set
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT5 — landing page: landing_page_view capture call present');
{
  process.env.POSTHOG_KEY = 'phc_test123';
  if (handleLanding) {
    const req = mockReq({ session: {} });
    const res = mockRes();
    handleLanding(req, res);
    ok(
      res.body.includes("posthog.capture('landing_page_view')") || res.body.includes('posthog.capture("landing_page_view")'),
      "T5.1: body contains posthog.capture('landing_page_view')"
    );
  } else {
    ok(false, 'T5: skipped — handleLanding not loaded');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// T6 — landing page: landing_page_view absent when key unset
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT6 — landing page: no posthog calls when key unset');
{
  delete process.env.POSTHOG_KEY;
  if (handleLanding) {
    const req = mockReq({ session: {} });
    const res = mockRes();
    handleLanding(req, res);
    ok(!res.body.includes('posthog.'), 'T6.1: no posthog. calls when key unset');
  } else {
    ok(false, 'T6: skipped — handleLanding not loaded');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// T7 — landing page: cta_clicked capture with typeof guard when key set
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT7 — landing page: cta_clicked with typeof guard');
{
  process.env.POSTHOG_KEY = 'phc_test123';
  if (handleLanding) {
    const req = mockReq({ session: {} });
    const res = mockRes();
    handleLanding(req, res);
    const body = res.body;
    ok(
      body.includes("posthog.capture('cta_clicked')") || body.includes('posthog.capture("cta_clicked")'),
      "T7.1: body contains posthog.capture('cta_clicked')"
    );
    // The capture call must be guarded or the snippet must include the stub array
    // Either: typeof posthog !== 'undefined' guard, or PostHog stub (which queues calls)
    const hasTypeof = body.includes("typeof posthog !== 'undefined'") || body.includes('typeof posthog !== "undefined"');
    const hasStubArray = body.includes('posthog._i') || body.includes('window.posthog=posthog=') || body.includes('!function(t,e){');
    ok(
      hasTypeof || hasStubArray,
      'T7.2: cta_clicked call is guarded (typeof check or stub array present)'
    );
  } else {
    ok(false, 'T7: skipped — handleLanding not loaded');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// T8 — landing page: no posthog calls when key unset (graceful degradation)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT8 — landing page: no posthog calls when key unset (AC4 graceful degradation)');
{
  delete process.env.POSTHOG_KEY;
  if (handleLanding) {
    const req = mockReq({ session: {} });
    const res = mockRes();
    handleLanding(req, res);
    ok(!res.body.includes('posthog.'), 'T8.1: no posthog. calls in landing page when key unset');
  } else {
    ok(false, 'T8: skipped — handleLanding not loaded');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// T9 — dashboard with POSTHOG_KEY set: CDN snippet with key present
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT9 — dashboard (key set): PostHog CDN snippet present');
async function t9() {
  process.env.POSTHOG_KEY = 'phc_test123';
  if (!handleJourneys || !setListJourneys) { ok(false, 'T9: skipped — handleJourneys not loaded'); return; }
  setListJourneys(async function() { return []; });
  const req = mockReq({
    session: { accessToken: 'tok', login: 'alice', tenantId: 'org-1' },
    url: '/journeys'
  });
  const res = mockRes();
  await handleJourneys(req, res);
  ok(res.body.includes('phc_test123'), 'T9.1: dashboard body contains POSTHOG_KEY value');
  ok(
    res.body.includes('posthog.com') || res.body.includes('posthog'),
    'T9.2: dashboard body contains PostHog CDN reference'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// T10 — dashboard: posthog.identify called with login and tenant_id (AC5)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT10 — dashboard: posthog.identify with login and tenant_id (AC5)');
async function t10() {
  process.env.POSTHOG_KEY = 'phc_test123';
  if (!handleJourneys || !setListJourneys) { ok(false, 'T10: skipped'); return; }
  setListJourneys(async function() { return []; });
  const req = mockReq({
    session: { accessToken: 'tok', login: 'alice', tenantId: 'org-1' },
    url: '/journeys'
  });
  const res = mockRes();
  await handleJourneys(req, res);
  ok(
    res.body.includes("posthog.identify('alice'") || res.body.includes('posthog.identify("alice"'),
    "T10.1: posthog.identify called with login 'alice' as distinct_id"
  );
  ok(res.body.includes('org-1'), 'T10.2: tenant_id value org-1 present in body');
  ok(res.body.includes('tenant_id'), 'T10.3: tenant_id key present in identify call');
}

// ─────────────────────────────────────────────────────────────────────────────
// T11 — dashboard: identify uses login, NOT accessToken (security)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT11 — dashboard: accessToken does not appear in HTML (security)');
async function t11() {
  process.env.POSTHOG_KEY = 'phc_test123';
  if (!handleJourneys || !setListJourneys) { ok(false, 'T11: skipped'); return; }
  setListJourneys(async function() { return []; });
  const req = mockReq({
    session: { accessToken: 'SECRET_GITHUB_TOKEN_CANARY', login: 'alice', tenantId: 'org-1' },
    url: '/journeys'
  });
  const res = mockRes();
  await handleJourneys(req, res);
  ok(
    !res.body.includes('SECRET_GITHUB_TOKEN_CANARY'),
    'T11.1: accessToken does not appear in dashboard HTML'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// T12 — dashboard: login_completed capture call after identify (AC6)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT12 — dashboard: login_completed capture call present (AC6)');
async function t12() {
  process.env.POSTHOG_KEY = 'phc_test123';
  if (!handleJourneys || !setListJourneys) { ok(false, 'T12: skipped'); return; }
  setListJourneys(async function() { return []; });
  const req = mockReq({
    session: { accessToken: 'tok', login: 'alice', tenantId: 'org-1' },
    url: '/journeys'
  });
  const res = mockRes();
  await handleJourneys(req, res);
  ok(
    res.body.includes("posthog.capture('login_completed')") || res.body.includes('posthog.capture("login_completed")'),
    "T12.1: body contains posthog.capture('login_completed')"
  );
  // login_completed must appear after identify in the HTML
  const identifyIdx = res.body.indexOf('posthog.identify');
  const loginCompletedIdx = res.body.indexOf('login_completed');
  ok(
    identifyIdx !== -1 && loginCompletedIdx > identifyIdx,
    'T12.2: login_completed appears after posthog.identify in HTML'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// T13 — dashboard: no posthog snippet or calls when key unset
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT13 — dashboard (key unset): no posthog reference');
async function t13() {
  delete process.env.POSTHOG_KEY;
  if (!handleJourneys || !setListJourneys) { ok(false, 'T13: skipped'); return; }
  setListJourneys(async function() { return []; });
  const req = mockReq({
    session: { accessToken: 'tok', login: 'alice', tenantId: 'org-1' },
    url: '/journeys'
  });
  const res = mockRes();
  await handleJourneys(req, res);
  ok(!res.body.includes('posthog.'), 'T13.1: no posthog. calls in dashboard when key unset');
}

// ─────────────────────────────────────────────────────────────────────────────
// T14 — chat page: journey_created capture present when key set (AC7)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT14 — chat page: journey_created capture present when key set (AC7)');
async function t14() {
  process.env.POSTHOG_KEY = 'phc_test123';
  if (!handleGetChatHtml) { ok(false, 'T14: skipped — handleGetChatHtml not loaded'); return; }
  const req = mockReq({
    session: { accessToken: 'tok', login: 'alice', tenantId: 'org-1' },
    url: '/skills/definition/sessions/sess-1/chat',
    params: { name: 'definition', id: 'sess-1' }
  });
  const res = mockRes();
  try {
    await handleGetChatHtml(req, res);
    ok(
      res.body.includes("posthog.capture('journey_created')") || res.body.includes('posthog.capture("journey_created")'),
      "T14.1: chat page body contains posthog.capture('journey_created')"
    );
  } catch (e) {
    ok(false, 'T14: handleGetChatHtml threw — ' + e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// T15 — chat page: no journey_created reference when key unset
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT15 — chat page (key unset): no posthog.capture reference');
async function t15() {
  delete process.env.POSTHOG_KEY;
  if (!handleGetChatHtml) { ok(false, 'T15: skipped — handleGetChatHtml not loaded'); return; }
  const req = mockReq({
    session: { accessToken: 'tok', login: 'alice', tenantId: 'org-1' },
    url: '/skills/definition/sessions/sess-1/chat',
    params: { name: 'definition', id: 'sess-1' }
  });
  const res = mockRes();
  try {
    await handleGetChatHtml(req, res);
    ok(!res.body.includes('posthog.'), 'T15.1: no posthog. calls in chat page when key unset');
  } catch (e) {
    ok(false, 'T15: handleGetChatHtml threw — ' + e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// T16 — No posthog npm package in package.json (AC9)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT16 — No posthog npm package in package.json (AC9)');
{
  const pkgPath = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const allDeps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
  const posthogPkgs = Object.keys(allDeps).filter(function(k) { return /posthog/i.test(k); });
  eq(posthogPkgs.length, 0, 'T16.1: no posthog package in dependencies');
}

// ─────────────────────────────────────────────────────────────────────────────
// NFR-T1 — No accessToken in any HTML response (security NFR)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nNFR-T1 — accessToken does not appear in any HTML response (security)');
async function nfrT1() {
  process.env.POSTHOG_KEY = 'phc_test123';
  const canary = 'CANARY_OAUTH_TOKEN_VALUE_12345';

  if (handleLanding) {
    const req = mockReq({ session: { accessToken: canary, login: 'alice' } });
    const res = mockRes();
    // Authenticated user should get redirect, but test unauthenticated landing too
    const req2 = mockReq({ session: {} });
    const res2 = mockRes();
    handleLanding(req2, res2);
    ok(!res2.body.includes(canary), 'NFR-T1.1: accessToken not in landing page HTML');
  }

  if (handleJourneys && setListJourneys) {
    setListJourneys(async function() { return []; });
    const req = mockReq({ session: { accessToken: canary, login: 'alice', tenantId: 'org-1' } });
    const res = mockRes();
    await handleJourneys(req, res);
    ok(!res.body.includes(canary), 'NFR-T1.2: accessToken not in dashboard HTML');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NFR-T2 — POSTHOG_KEY not hardcoded in source files
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nNFR-T2 — POSTHOG_KEY read from process.env, not hardcoded in source');
{
  const filesToCheck = [
    path.join(ROOT, 'src', 'web-ui', 'routes', 'landing.js'),
    path.join(ROOT, 'src', 'web-ui', 'routes', 'journey.js'),
    path.join(ROOT, 'src', 'web-ui', 'routes', 'skills.js')
  ];
  // A hardcoded PostHog key always starts with 'phc_' and is ~47 chars
  const hardcodedKeyPattern = /phc_[A-Za-z0-9]{40,}/;
  filesToCheck.forEach(function(p) {
    if (fs.existsSync(p)) {
      const src = fs.readFileSync(p, 'utf8');
      ok(!hardcodedKeyPattern.test(src), 'NFR-T2: no hardcoded PostHog key in ' + path.basename(p));
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Run all async tests sequentially
// ─────────────────────────────────────────────────────────────────────────────
(async function main() {
  await t9();
  await t10();
  await t11();
  await t12();
  await t13();
  await t14();
  await t15();
  await nfrT1();

  console.log('\n─────────────────────────────');
  console.log('bee.3 posthog: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    process.exit(1);
  }
})();
