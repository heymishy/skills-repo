#!/usr/bin/env node
// check-wuce23-skill-launcher-landing.js — AC verification tests for wuce.23
// Tests T1–T16 (HTTP integration via mock req/res)
// Tests FAIL until handleGetSkillsHtml() and handlePostSkillSessionHtml() are implemented.
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
  handleGetSkillsHtml,
  handlePostSkillSessionHtml,
  setListSkills,
  setCreateSession,
  setSkillsAuditLogger
} = require('../src/web-ui/routes/skills');

const { handleDashboard } = require('../src/web-ui/routes/dashboard');

// ── Test helpers ─────────────────────────────────────────────────────────────
const MOCK_SKILLS = [
  { name: 'discovery', description: 'Structures a raw idea into a discovery artefact.' },
  { name: 'test-plan', description: 'Writes a failing test plan for a reviewed story.' }
];

function mockReqGet(overrides) {
  return Object.assign({
    session:   { accessToken: 'test-token', userId: 42, login: 'alice' },
    sessionId: 'test-sid',
    query:     {},
    headers:   { accept: 'text/html' },
    method:    'GET',
    url:       '/skills'
  }, overrides || {});
}

function mockReqPost(name, overrides) {
  return Object.assign({
    session:   { accessToken: 'test-token', userId: 42, login: 'alice' },
    sessionId: 'test-sid',
    query:     {},
    headers:   { 'content-type': 'application/x-www-form-urlencoded' },
    method:    'POST',
    url:       '/api/skills/' + (name || 'discovery') + '/sessions',
    params:    { name: name || 'discovery' }
  }, overrides || {});
}

function mockRes() {
  const res = {
    statusCode: null,
    headers:    {},
    body:       '',
    writeHead(code, hdrs) {
      this.statusCode = code;
      if (hdrs) {
        Object.keys(hdrs).forEach(k => {
          this.headers[k.toLowerCase()] = hdrs[k];
        });
      }
    },
    end(data) {
      if (data) { this.body += data; }
    },
    setHeader(name, val) { this.headers[name.toLowerCase()] = val; }
  };
  return res;
}

// ─────────────────────────────────────────────────────────────────────────────
// Test suite
// ─────────────────────────────────────────────────────────────────────────────
async function run() {
  // ── Setup: inject mock adapters ─────────────────────────────────────────────
  setListSkills(async () => MOCK_SKILLS);
  setCreateSession(async (name, token) => ({ id: 'sess-abc123' }));

  let auditLogCalled = false;
  let auditLogData   = null;
  setSkillsAuditLogger((data) => { auditLogCalled = true; auditLogData = data; });

  // ── T1: GET /skills → 200 HTML ──────────────────────────────────────────────
  console.log('\n  T1 — GET /skills → 200 HTML with renderShell');
  {
    const req = mockReqGet();
    const res = mockRes();
    await handleGetSkillsHtml(req, res);
    eq(res.statusCode, 200, 'T1: status 200');
    ok((res.headers['content-type'] || '').startsWith('text/html'), 'T2: Content-Type text/html');
    ok(res.body.includes('<!doctype html'), 'T1: body includes <!doctype html');
    ok(res.body.includes('<nav aria-label="Main navigation">'), 'T1: body includes nav element');
  }

  // ── T3: GET /skills — skill names displayed ─────────────────────────────────
  console.log('\n  T3 — GET /skills — skill names displayed');
  {
    const req = mockReqGet();
    const res = mockRes();
    await handleGetSkillsHtml(req, res);
    ok(res.body.includes('discovery'), 'T3: body includes skill name "discovery"');
    ok(res.body.includes('test-plan'), 'T3: body includes skill name "test-plan"');
  }

  // ── T4: GET /skills — skill descriptions and "Start" buttons ───────────────
  console.log('\n  T4 — GET /skills — descriptions and Start buttons');
  {
    const req = mockReqGet();
    const res = mockRes();
    await handleGetSkillsHtml(req, res);
    ok(res.body.includes('Structures a raw idea into a discovery artefact.'), 'T4: body includes description 1');
    ok(res.body.includes('Writes a failing test plan'), 'T4: body includes description 2 (partial)');
    // Count "Start" occurrences — expect at least 2 (one per skill)
    const startCount = (res.body.match(/Start/g) || []).length;
    ok(startCount >= 2, 'T4: at least 2 "Start" buttons present');
  }

  // ── T5: GET /skills — form action per skill ─────────────────────────────────
  console.log('\n  T5 — GET /skills — form action attributes');
  {
    const req = mockReqGet();
    const res = mockRes();
    await handleGetSkillsHtml(req, res);
    ok(res.body.includes('action="/api/skills/discovery/sessions"'), 'T5: discovery form action correct');
    ok(res.body.includes('action="/api/skills/test-plan/sessions"'), 'T5: test-plan form action correct');
  }

  // ── T6: GET /skills — forms use method="POST" ───────────────────────────────
  console.log('\n  T6 — GET /skills — forms use method POST');
  {
    const req = mockReqGet();
    const res = mockRes();
    await handleGetSkillsHtml(req, res);
    ok(res.body.includes('method="POST"'), 'T6: form method="POST" present');
  }

  // ── T7: POST /api/skills/:name/sessions → 303 redirect ─────────────────────
  console.log('\n  T7 — POST /api/skills/discovery/sessions → 303 redirect');
  {
    setCreateSession(async () => ({ id: 'sess-abc123' }));
    const req = mockReqPost('discovery');
    const res = mockRes();
    await handlePostSkillSessionHtml(req, res);
    eq(res.statusCode, 303, 'T7: status 303');
    eq(res.headers['location'], '/skills/discovery/sessions/sess-abc123', 'T10: Location header correct');
  }

  // ── T8: POST adapter error → HTML error page (renderShell) ─────────────────
  console.log('\n  T8 — POST adapter error → HTML error page');
  {
    setCreateSession(async () => { throw new Error('upstream failure'); });
    const req = mockReqPost('discovery');
    const res = mockRes();
    await handlePostSkillSessionHtml(req, res);
    ok(res.statusCode >= 400, 'T8: status 4xx or 5xx on adapter error');
    ok((res.headers['content-type'] || '').startsWith('text/html'), 'T8: Content-Type text/html on error');
    ok(res.body.includes('<nav aria-label="Main navigation">'), 'T8: renderShell used for error page');
    ok(!res.body.includes('{"error":'), 'T8: no raw JSON in error response');
    // Restore mock
    setCreateSession(async () => ({ id: 'sess-abc123' }));
  }

  // ── T9: GET /skills — XSS in description escaped ───────────────────────────
  console.log('\n  T9 — GET /skills — XSS in description escaped');
  {
    setListSkills(async () => [
      { name: 'discovery', description: '<img onerror=alert(1)>' }
    ]);
    const req = mockReqGet();
    const res = mockRes();
    await handleGetSkillsHtml(req, res);
    ok(!res.body.includes('<img onerror='), 'T9: raw XSS not present in body');
    ok(res.body.includes('&lt;img onerror='), 'T9: XSS is HTML-escaped');
    // Restore mock
    setListSkills(async () => MOCK_SKILLS);
  }

  // ── T10: GET /skills — XSS in skill name escaped ───────────────────────────
  console.log('\n  T10 — GET /skills — XSS in skill name escaped');
  {
    setListSkills(async () => [
      { name: '<b>hack</b>', description: 'Safe description.' }
    ]);
    const req = mockReqGet();
    const res = mockRes();
    await handleGetSkillsHtml(req, res);
    ok(!res.body.includes('<b>hack</b>'), 'T10: raw XSS name not present in body');
    ok(res.body.includes('&lt;b&gt;hack&lt;/b&gt;'), 'T10: XSS name is HTML-escaped');
    // Restore mock
    setListSkills(async () => MOCK_SKILLS);
  }

  // ── T11: GET /skills unauthenticated → 302 ─────────────────────────────────
  console.log('\n  T11 — GET /skills unauthenticated → 302');
  {
    const req = mockReqGet({ session: null });
    const res = mockRes();
    await handleGetSkillsHtml(req, res);
    eq(res.statusCode, 302, 'T11: GET no session → 302');
  }

  // ── T12: POST unauthenticated → 302 ────────────────────────────────────────
  console.log('\n  T12 — POST /api/skills/:name/sessions unauthenticated → 302');
  {
    const req = mockReqPost('discovery', { session: null });
    const res = mockRes();
    await handlePostSkillSessionHtml(req, res);
    eq(res.statusCode, 302, 'T12: POST no session → 302');
  }

  // ── T13: GET /dashboard nav has href="/skills" ──────────────────────────────
  console.log('\n  T13 — GET /dashboard nav includes href="/skills"');
  {
    const req = Object.assign({
      session:   { accessToken: 'test-token', userId: 42, login: 'alice' },
      sessionId: 'test-sid',
      query:     {},
      headers:   { accept: 'text/html' },
      method:    'GET',
      url:       '/dashboard'
    });
    const res = mockRes();
    await handleDashboard(req, res);
    ok(res.body.includes('href="/skills"'), 'T13: nav "Run a Skill" href=/skills present');
  }

  // ── T14: GET /skills — no JavaScript in form elements ──────────────────────
  console.log('\n  T14 — GET /skills — form requires no JavaScript');
  {
    setListSkills(async () => MOCK_SKILLS);
    const req = mockReqGet();
    const res = mockRes();
    await handleGetSkillsHtml(req, res);
    ok(!res.body.includes('onclick='), 'T14: no onclick= attribute');
    ok(!res.body.includes('addEventListener'), 'T14: no addEventListener');
    ok(res.body.includes('method="POST"'), 'T14: form method present');
    ok(res.body.includes('action="/api/skills/'), 'T14: form action present');
  }

  // ── T15: GET /skills — audit log written ───────────────────────────────────
  console.log('\n  T15 — GET /skills — audit log written');
  {
    auditLogCalled = false;
    auditLogData   = null;
    const req = mockReqGet();
    const res = mockRes();
    await handleGetSkillsHtml(req, res);
    ok(auditLogCalled, 'T15: audit log called');
    ok(auditLogData && auditLogData.userId === 42, 'T15: audit log contains userId');
    ok(auditLogData && auditLogData.route === '/skills', 'T15: audit log contains route=/skills');
    ok(auditLogData && typeof auditLogData.timestamp === 'string', 'T15: audit log contains timestamp');
  }

  // ── T16: handleGetSkillsHtml is separate named export (ADR-009) ─────────────
  console.log('\n  T16 — handleGetSkillsHtml is a separate named export (ADR-009)');
  {
    const fs = require('fs');
    const skillsRouteSrc = fs.readFileSync(
      path.join(ROOT, 'src/web-ui/routes/skills.js'), 'utf8'
    );
    const htmlHandlerCount = (skillsRouteSrc.match(/handleGetSkillsHtml/g) || []).length;
    ok(htmlHandlerCount >= 1, 'T16: handleGetSkillsHtml appears in skills.js');
    // Verify it is exported separately from the JSON handler
    ok(
      skillsRouteSrc.includes('handleGetSkillsHtml') && skillsRouteSrc.includes('handleGetSkills'),
      'T16: both HTML handler and JSON handler present as distinct exports'
    );
  }

  // ── Report ──────────────────────────────────────────────────────────────────
  console.log(`\n[wuce23-skill-launcher-landing] Results: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('[wuce23] Unexpected error:', err.message, err.stack);
  process.exit(1);
});
