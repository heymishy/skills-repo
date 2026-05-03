#!/usr/bin/env node
// check-wuce18-html-shell.js — AC verification tests for wuce.18 (HTML shell and navigation)
// Tests T1–T18 (unit + integration)
// Tests FAIL until src/web-ui/utils/html-shell.js and handleDashboard in routes/dashboard.js exist.
// No external dependencies — Node.js built-ins only.
// NODE_ENV is set to 'test' so server modules do not start real OAuth flows.

'use strict';

const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');

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

// ── Environment setup ─────────────────────────────────────────────────────────
process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';

// ── Load modules ─────────────────────────────────────────────────────────────
const { renderShell, escHtml } = require('../src/web-ui/utils/html-shell');
const { handleDashboard }      = require('../src/web-ui/routes/dashboard');

// ── Test helpers ─────────────────────────────────────────────────────────────
function mockRes() {
  const r = {
    statusCode: null,
    headers: {},
    body: '',
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
    sessionId: 'test-sid',
    query: {},
    headers: {},
    method: 'GET',
    url: '/dashboard'
  }, overrides || {});
}

// ── Tests ─────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// T1 — Unit: renderShell returns complete HTML document
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT1 — renderShell returns complete HTML document');
{
  const output = renderShell({ title: 'Test', bodyContent: '<p>hello</p>', user: { login: 'alice' } });
  ok(output.includes('<!doctype html'), 'T1.1: starts with doctype');
  ok(output.includes('<title>Test</title>'), 'T1.2: contains title element');
  ok(output.includes('<main>'), 'T1.3: contains main element');
  ok(output.includes('<p>hello</p>'), 'T1.4: injects bodyContent');
}

// ─────────────────────────────────────────────────────────────────────────────
// T2 — Unit: renderShell nav contains four correct links
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT2 — renderShell nav contains four correct links');
{
  const output = renderShell({ title: 'T', bodyContent: '', user: { login: 'alice' } });
  ok(output.includes('href="/features"'), 'T2.1: Features link href');
  ok(output.includes('href="/actions"'), 'T2.2: Actions link href');
  ok(output.includes('href="/status"'), 'T2.3: Status link href');
  ok(output.includes('href="/skills"'), 'T2.4: Run a Skill link href');
  ok(output.includes('aria-label="Main navigation"'), 'T2.5: nav aria-label');
}

// ─────────────────────────────────────────────────────────────────────────────
// T3 — Unit: renderShell nav has descriptive link text
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT3 — renderShell nav has descriptive link text');
{
  const output = renderShell({ title: 'T', bodyContent: '', user: { login: 'alice' } });
  ok(output.includes('>Features<'), 'T3.1: "Features" text');
  ok(output.includes('>Actions<'), 'T3.2: "Actions" text');
  ok(output.includes('>Status<'), 'T3.3: "Status" text');
  ok(output.includes('>Run a Skill<'), 'T3.4: "Run a Skill" text');
}

// ─────────────────────────────────────────────────────────────────────────────
// T4 — Unit: renderShell user login displayed in header
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT4 — renderShell user login displayed in header');
{
  const output = renderShell({ title: 'T', bodyContent: '', user: { login: 'alice' } });
  ok(output.includes('<header>'), 'T4.1: header element present');
  ok(output.includes('alice'), 'T4.2: user login visible');
}

// ─────────────────────────────────────────────────────────────────────────────
// T5 — Unit: escHtml escapes all five special characters
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT5 — escHtml escapes all five special characters');
{
  eq(escHtml('<'), '&lt;', 'T5.1: < → &lt;');
  eq(escHtml('>'), '&gt;', 'T5.2: > → &gt;');
  eq(escHtml('&'), '&amp;', 'T5.3: & → &amp;');
  eq(escHtml('"'), '&quot;', 'T5.4: " → &quot;');
  eq(escHtml("'"), '&#x27;', "T5.5: ' → &#x27;");
  eq(escHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;', 'T5.6: full script tag escaped');
}

// ─────────────────────────────────────────────────────────────────────────────
// T6 — Unit: XSS — script tag in user login is escaped
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT6 — XSS: script tag in user login is escaped');
{
  const output = renderShell({ title: 'T', bodyContent: '', user: { login: '<script>alert(1)</script>' } });
  ok(!output.includes('<script>'), 'T6.1: raw <script> tag must not appear');
  ok(output.includes('&lt;script&gt;'), 'T6.2: escaped version must appear');
}

// ─────────────────────────────────────────────────────────────────────────────
// T7 — Unit: renderShell injects bodyContent inside main
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT7 — bodyContent injected inside main');
{
  const output = renderShell({ title: 'T', bodyContent: '<ul id="test-content"></ul>', user: { login: 'u' } });
  const mainStart = output.indexOf('<main>');
  const mainEnd   = output.indexOf('</main>');
  const mainContent = output.slice(mainStart, mainEnd);
  ok(mainContent.includes('id="test-content"'), 'T7.1: bodyContent inside main');
}

// ─────────────────────────────────────────────────────────────────────────────
// T8 — Unit: renderShell title appears in <title> element
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT8 — title in <title> element');
{
  const output = renderShell({ title: 'My Dashboard', bodyContent: '', user: { login: 'u' } });
  ok(output.includes('<title>My Dashboard</title>'), 'T8.1: title in <title> element');
}

// ─────────────────────────────────────────────────────────────────────────────
// T9 — Integration: GET /dashboard (authenticated) returns 200 html with nav
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT9 — handleDashboard (authenticated) returns 200 HTML with nav');
{
  const req = mockReq();
  const res = mockRes();
  handleDashboard(req, res);
  eq(res.statusCode, 200, 'T9.1: status 200');
  ok(res.body.includes('<nav aria-label="Main navigation">'), 'T9.2: body has nav with aria-label');
  ok(res.body.includes('href="/features"'), 'T9.3: Features link present');
  ok(res.body.includes('href="/actions"'), 'T9.4: Actions link present');
  ok(res.body.includes('href="/status"'), 'T9.5: Status link present');
  ok(res.body.includes('href="/skills"'), 'T9.6: Run a Skill link present');
}

// ─────────────────────────────────────────────────────────────────────────────
// T10 — Integration: GET /dashboard unauthenticated → 302 /auth/github
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT10 — handleDashboard (unauthenticated) → 302 /auth/github');
{
  const req = mockReq({ session: {} });
  const res = mockRes();
  handleDashboard(req, res);
  eq(res.statusCode, 302, 'T10.1: status 302');
  eq(res.headers['Location'], '/auth/github', 'T10.2: Location is /auth/github');
}

// ─────────────────────────────────────────────────────────────────────────────
// T11 — Integration: GET /dashboard shows user login
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT11 — handleDashboard shows user login in response');
{
  const req = mockReq({ session: { accessToken: 'tok', userId: 1, login: 'testuser' } });
  const res = mockRes();
  handleDashboard(req, res);
  ok(res.body.includes('testuser'), 'T11.1: user login visible in body');
}

// ─────────────────────────────────────────────────────────────────────────────
// T12 — Integration: GET /dashboard Content-Type is text/html; charset=utf-8
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT12 — handleDashboard Content-Type: text/html; charset=utf-8');
{
  const req = mockReq();
  const res = mockRes();
  handleDashboard(req, res);
  const ct = res.headers['Content-Type'] || '';
  ok(ct.includes('text/html'), 'T12.1: Content-Type includes text/html');
  ok(ct.includes('charset=utf-8'), 'T12.2: Content-Type includes charset=utf-8');
}

// ─────────────────────────────────────────────────────────────────────────────
// T13 — Unit: renderShell produces valid HTML structure ordering
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT13 — renderShell HTML structure ordering');
{
  const output = renderShell({ title: 'T', bodyContent: '', user: { login: 'u' } });
  ok(output.indexOf('<!doctype') < output.indexOf('<html'), 'T13.1: doctype before html');
  ok(output.indexOf('<header>') > 0, 'T13.2: header element present');
  ok(output.indexOf('<nav') > 0, 'T13.3: nav element present');
  ok(output.indexOf('<main>') > 0, 'T13.4: main element present');
}

// ─────────────────────────────────────────────────────────────────────────────
// T14 — Unit: escHtml handles empty string
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT14 — escHtml handles empty string');
{
  eq(escHtml(''), '', 'T14.1: empty string → empty string');
}

// ─────────────────────────────────────────────────────────────────────────────
// T15 — Unit: escHtml handles string with no special chars unchanged
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT15 — escHtml passes through plain text unchanged');
{
  eq(escHtml('hello world'), 'hello world', 'T15.1: plain text unchanged');
}

// ─────────────────────────────────────────────────────────────────────────────
// T16 — Integration: dashboard renders without throwing when user.login is plain text
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT16 — handleDashboard smoke test with plain login');
{
  const req = mockReq({ session: { accessToken: 'tok', userId: 1, login: 'planeName' } });
  const res = mockRes();
  let threw = false;
  try {
    handleDashboard(req, res);
  } catch (e) {
    threw = true;
  }
  ok(!threw, 'T16.1: does not throw');
  eq(res.statusCode, 200, 'T16.2: returns 200');
}

// ─────────────────────────────────────────────────────────────────────────────
// T17 — Unit: exported escHtml is the same function reference (not duplicated)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT17 — escHtml export is same function reference');
{
  const { escHtml: e1 } = require('../src/web-ui/utils/html-shell');
  const { escHtml: e2 } = require('../src/web-ui/utils/html-shell');
  ok(e1 === e2, 'T17.1: same export reference — not duplicated');
}

// ─────────────────────────────────────────────────────────────────────────────
// T18 — Integration: login XSS in HTTP integration test
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT18 — handleDashboard: XSS login is escaped in response');
{
  const req = mockReq({ session: { accessToken: 'tok', userId: 1, login: '<b>bold</b>' } });
  const res = mockRes();
  handleDashboard(req, res);
  ok(!res.body.includes('<b>bold</b>'), 'T18.1: raw <b> tag must not appear in body');
  ok(res.body.includes('&lt;b&gt;bold&lt;/b&gt;'), 'T18.2: escaped version must appear');
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n── Summary ──`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
