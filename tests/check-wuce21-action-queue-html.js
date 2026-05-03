#!/usr/bin/env node
// check-wuce21-action-queue-html.js — AC verification tests for wuce.21
// Tests T1–T16 (integration)
// Tests FAIL until handleGetActionsHtml is added to routes/dashboard.js,
// GET /actions is wired in server.js, and all ACs are satisfied.
// No external dependencies — Node.js built-ins only.
// NODE_ENV is set to 'test' so server modules do not start real OAuth flows.

'use strict';

const path = require('path');

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
process.env.WUCE_REPOSITORIES    = 'testorg/repo-a';

// ── Load modules ─────────────────────────────────────────────────────────────
const { handleDashboard, handleGetActions, handleGetActionsHtml, setLogger, setGetPendingActions } =
  require('../src/web-ui/routes/dashboard');

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
    url: '/actions'
  }, overrides || {});
}

// Mock action items — uses the { title, feature, actionType, artefactPath } shape
// injected via setGetPendingActions for HTML handler tests
const MOCK_ITEMS = [
  { id: 'a1', title: 'Review wuce.18 DoR',  feature: '2026-05-02-web-ui', actionType: 'Sign-off required', artefactPath: 'artefacts/wuce/dor/wuce.18-dor.md' },
  { id: 'a2', title: 'Check test plan',     feature: '2026-05-01-auth',   actionType: 'Review requested',  artefactPath: 'artefacts/auth/test-plans/auth-test-plan.md' }
];

function setHtmlMock(items) {
  setGetPendingActions(async () => ({ items: items || MOCK_ITEMS, bannerMessage: null }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

(async function runTests() {

// ─────────────────────────────────────────────────────────────────────────────
// T1 — GET /actions → 200, text/html, renderShell nav present
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT1 — GET /actions → 200 with HTML shell');
{
  setHtmlMock();
  const req = mockReq();
  const res = mockRes();

  await handleGetActionsHtml(req, res);

  eq(res.statusCode, 200,                   'T1: status 200');
  ok(res.headers['Content-Type'] === 'text/html; charset=utf-8',
                                            'T1: Content-Type text/html; charset=utf-8');
  ok(res.body.includes('<nav aria-label="Main navigation">'),
                                            'T1: renderShell nav present');
}

// ─────────────────────────────────────────────────────────────────────────────
// T2 — GET /actions — action titles in body
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT2 — GET /actions — action titles displayed');
{
  setHtmlMock();
  const req = mockReq();
  const res = mockRes();
  await handleGetActionsHtml(req, res);

  ok(res.body.includes('Review wuce.18 DoR'), 'T2: title "Review wuce.18 DoR" in body');
  ok(res.body.includes('Check test plan'),    'T2: title "Check test plan" in body');
}

// ─────────────────────────────────────────────────────────────────────────────
// T3 — GET /actions — feature slugs in body
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT3 — GET /actions — feature slugs displayed');
{
  setHtmlMock();
  const req = mockReq();
  const res = mockRes();
  await handleGetActionsHtml(req, res);

  ok(res.body.includes('2026-05-02-web-ui'), 'T3: feature "2026-05-02-web-ui" in body');
  ok(res.body.includes('2026-05-01-auth'),   'T3: feature "2026-05-01-auth" in body');
}

// ─────────────────────────────────────────────────────────────────────────────
// T4 — GET /actions — action type labels in body
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT4 — GET /actions — action type labels displayed');
{
  setHtmlMock();
  const req = mockReq();
  const res = mockRes();
  await handleGetActionsHtml(req, res);

  ok(res.body.includes('Sign-off required'), 'T4: actionType "Sign-off required" in body');
  ok(res.body.includes('Review requested'),  'T4: actionType "Review requested" in body');
}

// ─────────────────────────────────────────────────────────────────────────────
// T5 — GET /actions — artefact links present
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT5 — GET /actions — artefact links with href="/artefact/');
{
  setHtmlMock();
  const req = mockReq();
  const res = mockRes();
  await handleGetActionsHtml(req, res);

  ok(res.body.includes('href="/artefact/'), 'T5: href starts with /artefact/ present in body');
}

// ─────────────────────────────────────────────────────────────────────────────
// T6 — GET /actions empty queue → empty-state message, no <ul>
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT6 — GET /actions empty queue → empty-state message, no empty list');
{
  setHtmlMock([]);
  const req = mockReq();
  const res = mockRes();
  await handleGetActionsHtml(req, res);

  eq(res.statusCode, 200,                              'T6: status 200 for empty queue');
  ok(res.body.includes('No pending actions'),          'T6: empty-state message present');
  ok(!res.body.includes('<ul'),                        'T6: no <ul> element when queue empty');
}

// ─────────────────────────────────────────────────────────────────────────────
// T7 — GET /api/actions → JSON unchanged after wuce.21
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT7 — GET /api/actions → JSON response unchanged');
{
  setGetPendingActions(async () => ({
    items: [{ featureName: 'Test Feature', artefactType: 'Discovery', daysPending: 1, artefactUrl: '/x' }],
    bannerMessage: null
  }));

  const req = mockReq({ url: '/api/actions' });
  const res = mockRes();
  await handleGetActions(req, res);

  eq(res.statusCode, 200,                              'T7: status 200 for authenticated user');
  ok(res.headers['Content-Type'] === 'application/json',
                                                       'T7: Content-Type application/json');
  let parsed;
  try { parsed = JSON.parse(res.body); } catch (_) {}
  ok(parsed !== undefined,                             'T7: body is valid JSON');
}

// ─────────────────────────────────────────────────────────────────────────────
// T8 — GET /api/actions and GET /actions are distinct routes, both 200 for auth
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT8 — GET /api/actions and GET /actions are distinct routes');
{
  setGetPendingActions(async () => ({ items: [], bannerMessage: null }));
  const reqApi  = mockReq({ url: '/api/actions' });
  const resApi  = mockRes();
  await handleGetActions(reqApi, resApi);

  setHtmlMock([]);
  const reqHtml = mockReq({ url: '/actions' });
  const resHtml = mockRes();
  await handleGetActionsHtml(reqHtml, resHtml);

  eq(resApi.statusCode,  200, 'T8: /api/actions returns 200');
  ok(resApi.headers['Content-Type'] === 'application/json',
                              'T8: /api/actions returns JSON');
  eq(resHtml.statusCode, 200, 'T8: /actions returns 200');
  ok(resHtml.headers['Content-Type'] === 'text/html; charset=utf-8',
                              'T8: /actions returns HTML');
}

// ─────────────────────────────────────────────────────────────────────────────
// T9 — XSS: action title escaped
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT9 — GET /actions XSS in action title escaped');
{
  setHtmlMock([{
    id: 'xss1',
    title: '<img onerror=alert(1)>',
    feature: 'safe-feature',
    actionType: 'Sign-off required',
    artefactPath: 'artefacts/x/dor/x.md'
  }]);
  const req = mockReq();
  const res = mockRes();
  await handleGetActionsHtml(req, res);

  ok(!res.body.includes('<img onerror='),   'T9: raw <img onerror= NOT in body');
  ok(res.body.includes('&lt;img onerror='), 'T9: escaped &lt;img onerror= in body');
}

// ─────────────────────────────────────────────────────────────────────────────
// T10 — XSS: feature slug escaped
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT10 — GET /actions XSS in feature slug escaped');
{
  setHtmlMock([{
    id: 'xss2',
    title: 'Safe title',
    feature: '<b>hack</b>',
    actionType: 'Review requested',
    artefactPath: 'artefacts/x/test-plans/x.md'
  }]);
  const req = mockReq();
  const res = mockRes();
  await handleGetActionsHtml(req, res);

  ok(!res.body.includes('<b>hack</b>'),          'T10: raw <b>hack</b> NOT in body');
  ok(res.body.includes('&lt;b&gt;hack&lt;/b&gt;'), 'T10: escaped form present');
}

// ─────────────────────────────────────────────────────────────────────────────
// T11 — Unauthenticated GET /actions → 302
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT11 — GET /actions unauthenticated → 302');
{
  const req = mockReq({ session: {} });  // no accessToken
  const res = mockRes();
  await handleGetActionsHtml(req, res);

  eq(res.statusCode, 302,                    'T11: status 302 for unauthenticated');
  eq(res.headers['Location'], '/auth/github', 'T11: Location header → /auth/github');
}

// ─────────────────────────────────────────────────────────────────────────────
// T12 — GET /dashboard nav "Actions" link points to /actions
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT12 — GET /dashboard nav "Actions" href="/actions"');
{
  const req = mockReq({ url: '/dashboard' });
  const res = mockRes();
  handleDashboard(req, res);

  ok(res.body.includes('href="/actions"'),         'T12: nav "Actions" href="/actions"');
  ok(!res.body.includes('href="/api/actions"'),    'T12: nav does NOT have href="/api/actions"');
}

// ─────────────────────────────────────────────────────────────────────────────
// T13 — GET /actions audit log written { userId, route, timestamp }
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT13 — GET /actions audit log written');
{
  setHtmlMock([]);
  const logCalls = [];
  setLogger({
    info: (event, data) => logCalls.push({ event, data }),
    warn: () => {}
  });

  const req = mockReq({ session: { accessToken: 'tok', userId: 77, login: 'bob' } });
  const res = mockRes();
  await handleGetActionsHtml(req, res);

  const auditEntry = logCalls.find(c => c.data && c.data.route === '/actions');
  ok(auditEntry !== undefined,                   'T13: audit log entry with route=/actions found');
  eq(auditEntry && auditEntry.data.userId, 77,   'T13: audit log userId correct');
  ok(auditEntry && typeof auditEntry.data.timestamp === 'string',
                                                 'T13: audit log timestamp is a string');

  // Restore default logger
  setLogger({ info: () => {}, warn: () => {} });
}

// ─────────────────────────────────────────────────────────────────────────────
// T14 — GET /actions — link text is descriptive (not bare "view")
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT14 — GET /actions — link text is descriptive');
{
  setHtmlMock();
  const req = mockReq();
  const res = mockRes();
  await handleGetActionsHtml(req, res);

  ok(!res.body.match(/<a[^>]*>view<\/a>/i),      'T14: bare "view" link text absent');
  ok(!res.body.match(/<a[^>]*>click here<\/a>/i), 'T14: bare "click here" link text absent');
  // Link text should contain the title (or "View <title>")
  ok(res.body.includes('Review wuce.18 DoR'),     'T14: action title appears in link context');
}

// ─────────────────────────────────────────────────────────────────────────────
// T15 — GET /actions — list uses ul/li structure
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT15 — GET /actions — ul/li structure');
{
  setHtmlMock();
  const req = mockReq();
  const res = mockRes();
  await handleGetActionsHtml(req, res);

  ok(res.body.includes('<ul'),  'T15: <ul> present in body');
  ok(res.body.includes('<li'),  'T15: <li> present in body');
}

// ─────────────────────────────────────────────────────────────────────────────
// T16 — GET /api/actions still requires auth (non-200 for unauthenticated)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT16 — GET /api/actions requires auth');
{
  const req = mockReq({ session: {}, url: '/api/actions' });
  const res = mockRes();
  await handleGetActions(req, res);

  ok(res.statusCode !== 200, 'T16: GET /api/actions unauthenticated → non-200 (auth required)');
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[wuce21-action-queue-html] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

})().catch(err => { console.error(err); process.exit(1); });
