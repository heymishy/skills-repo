// check-wuce22-status-board-html.js — AC verification tests for wuce.22
// Tests T1–T16 (HTTP integration via mock req/res)
// Tests FAIL until handleGetStatus() has content-type negotiation.
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
const { getPipelineStatus, setFetcher, setAccessValidator } =
  require('../src/web-ui/adapters/pipeline-status');

const { handleGetStatus, handleGetStatusExport, setLogger } =
  require('../src/web-ui/routes/status');

const _statusBoardMod = require('../src/web-ui/utils/status-board');

// ── Test data ─────────────────────────────────────────────────────────────────
const FEAT_GREEN = {
  slug: '2026-04-01-my-feature',
  stage: 'definition',
  health: 'green',
  stories: []
};

const FEAT_RED = {
  slug: '2026-04-02-blocked',
  stage: 'test-plan',
  health: 'red',
  blockers: ['Missing test plan'],
  stories: []
};

const FEAT_XSS_SLUG = {
  slug: '<script>alert(1)</script>',
  stage: 'test',
  health: 'green',
  stories: []
};

const FEAT_XSS_PHASE = {
  slug: 'clean-slug',
  stage: '<b>phase</b>',
  health: 'green',
  stories: []
};

// ── Test helpers ─────────────────────────────────────────────────────────────
function mockReq(overrides) {
  return Object.assign({
    session: { accessToken: 'test-token', userId: 'u1', login: 'alice' },
    headers: { accept: 'text/html' },
    method:  'GET',
    url:     '/status',
    query:   {}
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

function setupAdapter(features) {
  setAccessValidator(null);
  setFetcher(() => features);
}

// ── Tests ─────────────────────────────────────────────────────────────────────
(async () => {

  // ── T1: GET /status Accept: text/html → 200 HTML shell ─────────────────────
  console.log('\nT1 — GET /status Accept: text/html → 200 with HTML shell');
  {
    setupAdapter([FEAT_GREEN, FEAT_RED]);
    const req = mockReq({ headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetStatus(req, res);
    eq(res.statusCode, 200, 'T1a: status 200');
    ok(res.headers['Content-Type'] && res.headers['Content-Type'].includes('text/html'),
      'T1b: Content-Type includes text/html');
    ok(res.body.includes('<!doctype html'), 'T1c: doctype present');
    ok(res.body.includes('<nav aria-label="Main navigation">'), 'T1d: nav with aria-label');
  }

  // ── T2: HTML — feature slugs displayed ─────────────────────────────────────
  console.log('\nT2 — GET /status HTML — feature slugs displayed');
  {
    setupAdapter([FEAT_GREEN, FEAT_RED]);
    const req = mockReq({ headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetStatus(req, res);
    ok(res.body.includes('2026-04-01-my-feature'), 'T2a: first slug present');
    ok(res.body.includes('2026-04-02-blocked'),    'T2b: second slug present');
  }

  // ── T3: HTML — phase/stage displayed per feature ────────────────────────────
  console.log('\nT3 — GET /status HTML — stage displayed per feature');
  {
    setupAdapter([FEAT_GREEN, FEAT_RED]);
    const req = mockReq({ headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetStatus(req, res);
    ok(res.body.includes('definition'), 'T3a: definition stage present');
    ok(res.body.includes('test-plan'),  'T3b: test-plan stage present');
  }

  // ── T4: HTML — blocker text displayed ──────────────────────────────────────
  console.log('\nT4 — GET /status HTML — blocker text displayed');
  {
    setupAdapter([FEAT_GREEN, FEAT_RED]);
    const req = mockReq({ headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetStatus(req, res);
    ok(res.body.includes('Missing test plan'), 'T4: blocker text "Missing test plan" present');
  }

  // ── T5: HTML — health: red → text label "Blocked" or "At risk" ────────────
  console.log('\nT5 — GET /status HTML — red health → text label present');
  {
    setupAdapter([FEAT_GREEN, FEAT_RED]);
    const req = mockReq({ headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetStatus(req, res);
    ok(res.body.includes('Blocked') || res.body.includes('At risk'),
      'T5: "Blocked" or "At risk" text label present for red health');
  }

  // ── T6: HTML — health: green → text label "On track" or "In progress" ──────
  console.log('\nT6 — GET /status HTML — green health → text label present');
  {
    setupAdapter([FEAT_GREEN, FEAT_RED]);
    const req = mockReq({ headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetStatus(req, res);
    ok(res.body.includes('On track') || res.body.includes('In progress'),
      'T6: "On track" or "In progress" text label present for green health');
  }

  // ── T7: Accept: application/json → JSON unchanged ──────────────────────────
  console.log('\nT7 — GET /status Accept: application/json → JSON unchanged');
  {
    setupAdapter([FEAT_GREEN, FEAT_RED]);
    const req = mockReq({ headers: { accept: 'application/json' } });
    const res = mockRes();
    await handleGetStatus(req, res);
    eq(res.statusCode, 200, 'T7a: status 200');
    ok(res.headers['Content-Type'] && res.headers['Content-Type'].includes('application/json'),
      'T7b: Content-Type application/json');
    let parsed;
    try { parsed = JSON.parse(res.body); } catch (e) { parsed = null; }
    ok(Array.isArray(parsed), 'T7c: body parses as array');
    ok(parsed && parsed.length > 0 && typeof parsed[0].slug === 'string',
      'T7d: items have slug field');
  }

  // ── T8: No Accept header → JSON unchanged ───────────────────────────────────
  console.log('\nT8 — GET /status no Accept header → JSON unchanged');
  {
    setupAdapter([FEAT_GREEN, FEAT_RED]);
    const req = mockReq({ headers: {} });
    const res = mockRes();
    await handleGetStatus(req, res);
    eq(res.statusCode, 200, 'T8a: status 200');
    ok(res.headers['Content-Type'] && res.headers['Content-Type'].includes('application/json'),
      'T8b: Content-Type application/json');
  }

  // ── T9: HTML — XSS in slug escaped ─────────────────────────────────────────
  console.log('\nT9 — GET /status HTML — XSS in slug escaped');
  {
    setupAdapter([FEAT_XSS_SLUG]);
    const req = mockReq({ headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetStatus(req, res);
    ok(!res.body.includes('<script>alert(1)</script>'),    'T9a: raw <script> tag not present');
    ok(res.body.includes('&lt;script&gt;'), 'T9b: escaped &lt;script&gt; present');
  }

  // ── T10: HTML — XSS in stage escaped ────────────────────────────────────────
  console.log('\nT10 — GET /status HTML — XSS in stage escaped');
  {
    setupAdapter([FEAT_XSS_PHASE]);
    const req = mockReq({ headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetStatus(req, res);
    ok(!res.body.includes('<b>phase</b>'),               'T10a: raw <b> tag not present');
    ok(res.body.includes('&lt;b&gt;phase&lt;/b&gt;'), 'T10b: escaped phase present');
  }

  // ── T11: Unauthenticated + Accept: text/html → 302 ─────────────────────────
  console.log('\nT11 — GET /status unauthenticated Accept: text/html → 302');
  {
    const req = mockReq({ session: null, headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetStatus(req, res);
    eq(res.statusCode, 302, 'T11a: status 302');
    eq(res.headers['Location'], '/auth/github', 'T11b: Location /auth/github');
  }

  // ── T12: GET /status/export authenticated → 200 unchanged ──────────────────
  console.log('\nT12 — GET /status/export authenticated → 200 (regression)');
  {
    setupAdapter([FEAT_GREEN, FEAT_RED]);
    const req = mockReq({ headers: { accept: 'application/json' }, url: '/status/export' });
    const res = mockRes();
    await handleGetStatusExport(req, res);
    eq(res.statusCode, 200, 'T12a: status 200');
    ok(res.headers['Content-Type'] && res.headers['Content-Type'].includes('text/markdown'),
      'T12b: Content-Type text/markdown');
    ok(typeof res.body === 'string' && res.body.includes('|'),
      'T12c: body contains markdown table');
  }

  // ── T13: GET /status/export unauthenticated → not 404/500 (regression) ──────
  console.log('\nT13 — GET /status/export unauthenticated → not 404 or 500');
  {
    const req = mockReq({ session: null, headers: {}, url: '/status/export' });
    const res = mockRes();
    await handleGetStatusExport(req, res);
    ok(res.statusCode !== 404 && res.statusCode !== 500,
      `T13: /status/export unauthenticated — not 404/500 (got ${res.statusCode})`);
  }

  // ── T14: renderStatusBoard called exactly once ──────────────────────────────
  console.log('\nT14 — GET /status HTML — renderStatusBoard called exactly once');
  {
    setupAdapter([FEAT_GREEN, FEAT_RED]);
    const origRender = _statusBoardMod.renderStatusBoard;
    let renderCallCount = 0;
    _statusBoardMod.renderStatusBoard = (...args) => {
      renderCallCount++;
      return origRender.apply(_statusBoardMod, args);
    };
    try {
      const req = mockReq({ headers: { accept: 'text/html' } });
      const res = mockRes();
      await handleGetStatus(req, res);
      eq(renderCallCount, 1, 'T14: renderStatusBoard called exactly once');
      ok(res.body.includes('class="status-board"'), 'T14b: status-board class in output');
    } finally {
      _statusBoardMod.renderStatusBoard = origRender;
    }
  }

  // ── T15: Audit log has { userId, route: '/status', timestamp } ──────────────
  console.log('\nT15 — GET /status HTML — audit log written');
  {
    setupAdapter([FEAT_GREEN, FEAT_RED]);
    let auditCalled = false;
    let auditPayload = null;
    setLogger({
      info: (event, data) => {
        if (event === 'status_board_access') { auditCalled = true; auditPayload = data; }
      },
      warn: () => {}
    });
    const req = mockReq({ session: { accessToken: 'tok', userId: 'u99', login: 'bob' },
                          headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetStatus(req, res);
    ok(auditCalled,                                         'T15a: audit log called');
    ok(auditPayload && auditPayload.userId === 'u99',       'T15b: userId in audit log');
    ok(auditPayload && auditPayload.route === '/status',    'T15c: route "/status" in audit log');
    ok(auditPayload && typeof auditPayload.timestamp === 'string', 'T15d: timestamp in audit log');
    setLogger({ info: () => {}, warn: () => {} });
  }

  // ── T16: getPipelineStatus called exactly once ──────────────────────────────
  console.log('\nT16 — GET /status HTML — no extra API round-trip (getPipelineStatus once)');
  {
    let fetchCallCount = 0;
    setAccessValidator(null);
    setFetcher(() => { fetchCallCount++; return [FEAT_GREEN, FEAT_RED]; });
    const req = mockReq({ headers: { accept: 'text/html' } });
    const res = mockRes();
    await handleGetStatus(req, res);
    eq(fetchCallCount, 1, 'T16: getPipelineStatus (fetcher) called exactly once');
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log(`\n[wuce22-status-board-html] ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);

})().catch(err => {
  console.error(`\n[wuce22-status-board-html] fatal: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
