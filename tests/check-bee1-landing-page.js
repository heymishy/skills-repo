#!/usr/bin/env node
// check-bee1-landing-page.js — AC verification tests for bee.1 (public landing page)
// Tests T1–T11 (unit + integration + NFR)
// All tests FAIL until src/web-ui/routes/landing.js (or equivalent) exists and
// the / route is wired in src/web-ui/server.js.
// No external dependencies — Node.js built-ins only.

'use strict';

const path   = require('path');
const assert = require('assert');
const fs     = require('fs');

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

// Environment setup
process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;

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

// Load the handler under test — will throw if module does not exist yet (TDD red)
let handleLanding;
let healthCheckHandler;
try {
  ({ handleLanding } = require('../src/web-ui/routes/landing'));
} catch (e) {
  console.log('\n✗ FATAL: src/web-ui/routes/landing.js not found — all tests will fail');
  console.log('  ' + e.message);
  failed++;
}

try {
  ({ healthCheckHandler } = require('../src/web-ui/routes/health'));
} catch (e) {
  // health route pre-exists; only warn
  console.log('  [warn] health route not loadable: ' + e.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// T1 — Unit: unauthenticated GET / returns HTTP 200 with Content-Type text/html
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT1 — unauthenticated GET / returns 200 text/html');
if (handleLanding) {
  const req = mockReq({ session: {} });
  const res = mockRes();
  handleLanding(req, res);
  eq(res.statusCode, 200, 'T1.1: status 200');
  ok(
    (res.headers['content-type'] || '').includes('text/html'),
    'T1.2: Content-Type includes text/html'
  );
} else {
  ok(false, 'T1: skipped — handleLanding not loaded');
}

// ─────────────────────────────────────────────────────────────────────────────
// T2 — Unit: response body contains product name and CTA href=/auth/github
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT2 — response body contains product name and CTA');
if (handleLanding) {
  const req = mockReq({ session: {} });
  const res = mockRes();
  handleLanding(req, res);
  const body = res.body;
  ok(
    body.toLowerCase().includes('skill'),
    'T2.1: body contains product name (skills/skill)'
  );
  ok(body.includes('href="/auth/github"'), 'T2.2: body contains CTA href=/auth/github');
  ok(
    body.toLowerCase().includes('sign in with github'),
    'T2.3: body contains "Sign in with GitHub" text'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// T3 — Unit: authenticated GET / returns 302 to /journeys
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT3 — authenticated GET / returns 302 to /journeys');
if (handleLanding) {
  const req = mockReq({ session: { accessToken: 'tok', login: 'alice' } });
  const res = mockRes();
  handleLanding(req, res);
  eq(res.statusCode, 302, 'T3.1: status 302');
  eq(res.headers['location'], '/journeys', 'T3.2: Location header = /journeys');
}

// ─────────────────────────────────────────────────────────────────────────────
// T4 — Unit: req.session.token (wrong field) does NOT trigger redirect
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT4 — wrong session field (req.session.token) does not trigger redirect');
if (handleLanding) {
  const req = mockReq({ session: { token: 'old-style-token' } });
  const res = mockRes();
  handleLanding(req, res);
  eq(res.statusCode, 200, 'T4.1: status 200 (not treated as authenticated)');
  ok(res.headers['location'] !== '/journeys', 'T4.2: no redirect to /journeys');
}

// ─────────────────────────────────────────────────────────────────────────────
// T5 — Unit: HTML has no CDN CSS framework URLs
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT5 — HTML has no CDN CSS framework references');
if (handleLanding) {
  const req = mockReq({ session: {} });
  const res = mockRes();
  handleLanding(req, res);
  const body = res.body;
  const cdnPatterns = [
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com',
    'unpkg.com',
    'cdn.tailwindcss.com',
    'bootstrapcdn.com'
  ];
  cdnPatterns.forEach(function(pattern) {
    ok(!body.includes(pattern), 'T5: no ' + pattern + ' in HTML');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// T6 — Unit: HTML contains platform description AND skill session description
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT6 — HTML contains required copy (description + skill session description)');
if (handleLanding) {
  const req = mockReq({ session: {} });
  const res = mockRes();
  handleLanding(req, res);
  const body = res.body.toLowerCase();
  // AC4a: description of what the platform does
  ok(body.length > 200, 'T6.1: body has substantial content (>200 chars)');
  // AC4b: description of what a skill session produces — look for artefact/governed/session
  ok(
    body.includes('artefact') || body.includes('artifact') || body.includes('governed') || body.includes('session'),
    'T6.2: body describes what a skill session produces'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// T7 — Unit: authenticated session with full fields still redirects
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT7 — fully populated session redirects to /journeys');
if (handleLanding) {
  const req = mockReq({
    session: { accessToken: 'any-value', login: 'bob', tenantId: 'org-1' }
  });
  const res = mockRes();
  handleLanding(req, res);
  eq(res.statusCode, 302, 'T7.1: status 302 with populated session');
  eq(res.headers['location'], '/journeys', 'T7.2: Location = /journeys');
}

// ─────────────────────────────────────────────────────────────────────────────
// T8 — Unit: handler source does not reference req.url, req.params in path assembly
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT8 — handler source does not derive file path from request data (AC6)');
{
  const candidates = [
    path.join(ROOT, 'src', 'web-ui', 'routes', 'landing.js'),
    path.join(ROOT, 'src', 'web-ui', 'server.js')
  ];
  let handlerSource = '';
  candidates.forEach(function(p) {
    if (fs.existsSync(p)) {
      // Only read the landing-related section of server.js to avoid false positives
      const src = fs.readFileSync(p, 'utf8');
      handlerSource += p.endsWith('landing.js') ? src : '';
    }
  });

  if (handlerSource) {
    // Look for dangerous pattern: path construction from request data
    const dangerPattern = /(?:req\.url|req\.params|req\.query)[\s\S]{0,60}(?:path\.join|path\.resolve|readFileSync)/;
    ok(!dangerPattern.test(handlerSource), 'T8.1: no path construction from request data in landing.js');
    ok(handlerSource.includes('__dirname'), 'T8.2: path uses __dirname (literal path segment)');
  } else {
    ok(false, 'T8: landing.js not found yet — will pass once implemented');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// T9 — Integration: GET /health still returns 200 (existing route unaffected)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT9 — GET /health still returns 200 (existing route)');
if (healthCheckHandler) {
  const req = mockReq({ url: '/health', method: 'GET', session: {} });
  const res = mockRes();
  healthCheckHandler(req, res);
  eq(res.statusCode, 200, 'T9.1: GET /health returns 200');
} else {
  ok(false, 'T9: healthCheckHandler not loaded');
}

// ─────────────────────────────────────────────────────────────────────────────
// T10 — NFR: HTML has balanced open/close tags for key structural elements
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT10 — NFR: HTML has balanced structural tags');
if (handleLanding) {
  const req = mockReq({ session: {} });
  const res = mockRes();
  handleLanding(req, res);
  const body = res.body;

  function countTag(tag) {
    return (body.match(new RegExp('<' + tag + '[\\s>]', 'gi')) || []).length;
  }
  function countCloseTag(tag) {
    return (body.match(new RegExp('</' + tag + '>', 'gi')) || []).length;
  }

  const tags = ['html', 'body', 'head'];
  tags.forEach(function(tag) {
    eq(countTag(tag), countCloseTag(tag), 'T10: <' + tag + '> open === close');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// T11 — NFR: no *redundant* PostHog SDK dependency beyond posthog-node (AC9 — belt-and-suspenders)
// ─────────────────────────────────────────────────────────────────────────────
// tst-s1 (2026-07-16 baseline triage): this originally asserted zero posthog
// packages at all, on the assumption bee.1's own analytics stayed hand-rolled
// (posthog-server.js, HTTPS calls). bri-s1.2 later added `posthog-node` as a
// new, deliberate, documented runtime dependency for feature-flag evaluation
// (artefacts/2026-07-09-beta-readiness-infra/decisions.md ARCH entry,
// 2026-07-10) -- a different purpose than bee.1's own analytics capture, and
// unrelated scope creep from bee.1's point of view. The belt-and-suspenders
// intent (bee.1 itself must not silently pull in a redundant PostHog SDK
// package) still holds; only the specific, now-legitimate `posthog-node`
// package is allowed.
console.log('\nT11 — no redundant PostHog npm package in package.json');
{
  const pkgPath = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const allDeps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
  const ALLOWED_POSTHOG_DEPS = ['posthog-node'];
  const posthogDeps = Object.keys(allDeps).filter(function(k) { return k.includes('posthog'); });
  const unexpectedPosthogDeps = posthogDeps.filter(function(k) { return !ALLOWED_POSTHOG_DEPS.includes(k); });
  eq(unexpectedPosthogDeps.length, 0, 'T11.1: no unexpected posthog package in dependencies or devDependencies (found: ' + posthogDeps.join(', ') + ')');
}

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n─────────────────────────────');
console.log('bee.1 landing page: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  process.exit(1);
}
