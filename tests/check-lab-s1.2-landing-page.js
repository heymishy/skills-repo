#!/usr/bin/env node
// check-lab-s1.2-landing-page.js — AC verification tests for lab-s1.2 (landing page at /)
// Tests T1.1, T1.2, T1.3, T2.1, T3.1, T4.1, T4.2, T6.1, T6.2
// Tests FAIL until src/web-ui/routes/public.js and src/web-ui/templates/landing.html exist.
// No external dependencies — Node.js built-ins only.

'use strict';

var path = require('path');
var ROOT = path.join(__dirname, '..');

var passed = 0;
var failed = 0;

function check(label, ok) {
  if (ok) {
    console.log('  ✓ ' + label);
    passed++;
  } else {
    console.error('  ✗ ' + label);
    failed++;
  }
}

// ── Environment setup — must precede any require() of application code ───────
process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY; // prevent real HTTP calls in tests

// ── Monkeypatch posthog BEFORE loading the handler ───────────────────────────
// Load the posthog module into the require cache first, then replace .capture
// with a spy. When handleRoot calls _getPosthog().capture(...), it receives the
// cached module — and the spy — because Node's require cache is shared.
var posthogModule;
try {
  posthogModule = require('../src/web-ui/modules/posthog-server');
} catch (e) {
  console.error('FATAL: posthog-server module not found:', e.message);
  process.exit(1);
}

var _capturedEvents = [];
var _originalCapture = posthogModule.capture;

// Default spy: record all capture calls
posthogModule.capture = function spyCapture(distinctId, event, properties) {
  _capturedEvents.push({ distinctId: distinctId, event: event, properties: properties || {} });
};

// ── Load handler under test ───────────────────────────────────────────────────
var handleRoot;
try {
  var publicRoute = require('../src/web-ui/routes/public');
  handleRoot = publicRoute.handleRoot;
} catch (e) {
  console.error('\nFATAL: src/web-ui/routes/public.js not loaded — all tests will fail');
  console.error('  ' + e.message);
  process.exit(1);
}

// ── Mock helpers ──────────────────────────────────────────────────────────────
function mockReq(overrides) {
  return Object.assign({ session: {}, query: {}, body: {}, method: 'GET', url: '/', headers: {} }, overrides || {});
}

function mockRes() {
  return {
    statusCode: null,
    headers: {},
    body: '',
    setHeader: function(k, v) { this.headers[k.toLowerCase()] = v; },
    writeHead: function(code, hdrs) {
      this.statusCode = code;
      if (hdrs) {
        var self = this;
        Object.keys(hdrs).forEach(function(k) { self.headers[k.toLowerCase()] = hdrs[k]; });
      }
    },
    end: function(b) { this.body = (b != null ? String(b) : ''); }
  };
}

// ── T1 — GET / returns 200 with required HTML content (AC1) ──────────────────

console.log('\nT1 — GET / returns 200 with required HTML content (AC1)');

var _t1Req = mockReq({ session: {} });
var _t1Res = mockRes();
(async function() {
  await handleRoot(_t1Req, _t1Res);

  // T1.1 — status 200
  check('T1.1: GET / unauthenticated returns status 200', _t1Res.statusCode === 200);

  // T1.2 — body contains platform pitch headline
  var body = _t1Res.body;
  check(
    'T1.2: response body contains platform pitch headline (Skills/Platform/governed/delivery)',
    body.toLowerCase().includes('skill') || body.toLowerCase().includes('governed') || body.toLowerCase().includes('platform')
  );

  // T1.3 — body contains "Get started" CTA text
  check('T1.3: response body contains "Get started" CTA text', body.toLowerCase().includes('get started'));

  // ── T2 — CTA links to /auth/github (AC2) ─────────────────────────────────

  console.log('\nT2 — CTA href targets /auth/github (AC2)');

  // T2.1 — response body contains href="/auth/github"
  check('T2.1: response body contains href="/auth/github"', body.includes('href="/auth/github"'));

  // ── T3 — Authenticated user is redirected to /dashboard (AC3) ────────────

  console.log('\nT3 — authenticated user redirected to /dashboard (AC3)');

  var _t3Req = mockReq({ session: { accessToken: 'tok-12345' } });
  var _t3Res = mockRes();
  await handleRoot(_t3Req, _t3Res);

  // T3.1 — 302 redirect with Location: /dashboard
  check('T3.1: authenticated GET / returns status 302', _t3Res.statusCode === 302);
  check('T3.1: Location header is /dashboard', _t3Res.headers['location'] === '/dashboard');

  // ── T4 — PostHog event fired for unauthenticated visits (AC4) ────────────

  console.log('\nT4 — PostHog landing_page_viewed event on unauthenticated visit (AC4)');

  // Reset spy state
  _capturedEvents = [];

  var _t4Req = mockReq({ session: {} });
  var _t4Res = mockRes();
  await handleRoot(_t4Req, _t4Res);

  // T4.1 — capture called with landing_page_viewed
  var landingViewedCalls = _capturedEvents.filter(function(c) { return c.event === 'landing_page_viewed'; });
  check('T4.1: PostHog capture called with event "landing_page_viewed"', landingViewedCalls.length >= 1);

  // T4.2 — fire-and-forget: slow PostHog stub must not delay response
  // Replace capture with a stub that returns a promise that resolves after 200ms.
  // If handleRoot awaits this, it would take >200ms to return.
  // Fire-and-forget means handleRoot returns immediately (<50ms), regardless of PostHog timing.
  console.log('\nT4.2 — fire-and-forget: slow PostHog does not delay response');
  posthogModule.capture = function slowStub() {
    return new Promise(function(resolve) { setTimeout(resolve, 200); });
  };
  var _t42Req = mockReq({ session: {} });
  var _t42Res = mockRes();
  var _t42Start = Date.now();
  await handleRoot(_t42Req, _t42Res);
  var _t42Elapsed = Date.now() - _t42Start;
  check(
    'T4.2: response arrives without awaiting PostHog (handler elapsed < 100ms, actual: ' + _t42Elapsed + 'ms)',
    _t42Res.statusCode === 200 && _t42Elapsed < 100
  );

  // Restore spy
  posthogModule.capture = function spyCapture(distinctId, event, properties) {
    _capturedEvents.push({ distinctId: distinctId, event: event, properties: properties || {} });
  };

  // ── T6 — No auth data in HTML response (AC6) ─────────────────────────────

  console.log('\nT6 — no auth/session data in landing page HTML (AC6)');

  var _t6Req = mockReq({ session: {} });
  var _t6Res = mockRes();
  await handleRoot(_t6Req, _t6Res);
  var _t6Body = _t6Res.body;

  // T6.1 — body does not contain the string 'accessToken'
  check('T6.1: response body does NOT contain "accessToken"', !_t6Body.includes('accessToken'));

  // T6.2 — body does not match /session_id|accessToken/
  check('T6.2: response body does NOT match /session_id|accessToken/', !/session_id|accessToken/.test(_t6Body));

  // ── Results ───────────────────────────────────────────────────────────────

  console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
