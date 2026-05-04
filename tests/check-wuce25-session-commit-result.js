'use strict';
/**
 * tests/check-wuce25-session-commit-result.js
 * 20 tests — wuce.25 Session commit result
 *
 * Tests are written to FAIL before implementation (TDD discipline).
 * Run: node tests/check-wuce25-session-commit-result.js
 */

const assert = require('assert'); // eslint-disable-line no-unused-vars
const fs     = require('fs');
const path   = require('path');

// ─── Import handlers + injection points from skills.js ────────────────────
const skillsRoute = require('../src/web-ui/routes/skills');
const {
  handleGetCommitPreviewHtml,
  handlePostCommitHtml,
  handleGetResultHtml,
  setGetCommitPreview,
  setCommitSession,
  setGetCommitResult,
  setCommitAuditLogger
} = skillsRoute;

// ─── Test data ─────────────────────────────────────────────────────────────
const SKILL          = 'discovery';
const SID            = 'sess-abc123';
const ARTEFACT_PATH  = 'artefacts/2026-05-03-my-feature/discovery.md';
const FEATURE_SLUG   = '2026-05-03-my-feature';
const ARTEFACT_TYPE  = 'discovery';
const ARTEFACT_BODY  = '# Discovery\n\nThis is the generated artefact content.\n';

const PREVIEW_RESULT = {
  artefactContent: ARTEFACT_BODY,
  artefactPath:    ARTEFACT_PATH,
  featureSlug:     FEATURE_SLUG,
  artefactType:    ARTEFACT_TYPE
};

const COMMIT_RESULT = {
  artefactPath:  ARTEFACT_PATH,
  featureSlug:   FEATURE_SLUG,
  artefactType:  ARTEFACT_TYPE
};

// ─── Helpers ───────────────────────────────────────────────────────────────
function mockReqGet({ skillName = SKILL, sessionId = SID, authed = true } = {}) {
  return {
    method:  'GET',
    params:  { name: skillName, id: sessionId },
    headers: {},
    session: authed ? { accessToken: 'tok', userId: 'u1', login: 'tester' } : {}
  };
}

function mockReqPost({ skillName = SKILL, sessionId = SID, authed = true } = {}) {
  const bodyStr = '';
  return {
    method:  'POST',
    params:  { name: skillName, id: sessionId },
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    session: authed ? { accessToken: 'tok', userId: 'u1', login: 'tester' } : {},
    on(event, cb) {
      if (event === 'data') cb(Buffer.from(bodyStr));
      if (event === 'end')  cb();
      return this;
    }
  };
}

function mockRes() {
  return {
    statusCode: null,
    headers:    {},
    body:       '',
    writeHead(code, hdrs) {
      this.statusCode = code;
      if (hdrs) Object.keys(hdrs).forEach(k => { this.headers[k.toLowerCase()] = hdrs[k]; });
    },
    end(chunk) { if (chunk) this.body += String(chunk); }
  };
}

let passed = 0;
let failed = 0;

function ok(label, condition) {
  if (condition) {
    console.log('  \u2713 ' + label);
    passed++;
  } else {
    console.error('  \u2717 ' + label);
    failed++;
  }
}

// ─── Tests ─────────────────────────────────────────────────────────────────
async function runTests() {

  // T1 — GET commit-preview → 200 HTML
  console.log('\n  T1 — GET /skills/:name/sessions/:id/commit-preview → 200 HTML');
  {
    setGetCommitPreview(async () => PREVIEW_RESULT);
    setCommitAuditLogger(() => {});
    const req = mockReqGet();
    const res = mockRes();
    await handleGetCommitPreviewHtml(req, res);
    ok('T1: status 200',             res.statusCode === 200);
    ok('T1: Content-Type text/html', (res.headers['content-type'] || '').includes('text/html'));
    ok('T1: body includes <!doctype html', res.body.toLowerCase().includes('<!doctype html'));
    ok('T1: nav present',            res.body.includes('<nav aria-label="Main navigation">'));
  }

  // T2 — artefact content rendered in body
  console.log('\n  T2 — commit-preview — artefact content in <pre>');
  {
    setGetCommitPreview(async () => PREVIEW_RESULT);
    setCommitAuditLogger(() => {});
    const req = mockReqGet();
    const res = mockRes();
    await handleGetCommitPreviewHtml(req, res);
    ok('T2: body includes <pre',                 res.body.includes('<pre'));
    ok('T2: body includes artefact body text',   res.body.includes('This is the generated artefact content.'));
  }

  // T3 — <pre> has role="region" and aria-label="Artefact preview"
  console.log('\n  T3 — commit-preview — <pre> WCAG attributes');
  {
    setGetCommitPreview(async () => PREVIEW_RESULT);
    setCommitAuditLogger(() => {});
    const req = mockReqGet();
    const res = mockRes();
    await handleGetCommitPreviewHtml(req, res);
    ok('T3: role="region" present',                   res.body.includes('role="region"'));
    ok('T3: aria-label="Artefact preview" present',   res.body.includes('aria-label="Artefact preview"'));
  }

  // T4 — commit form present with correct action, method, and submit button
  console.log('\n  T4 — commit-preview — commit form present');
  {
    setGetCommitPreview(async () => PREVIEW_RESULT);
    setCommitAuditLogger(() => {});
    const req = mockReqGet();
    const res = mockRes();
    await handleGetCommitPreviewHtml(req, res);
    ok('T4: <form present',                res.body.includes('<form'));
    ok('T4: action=/api/skills/.../commit', res.body.includes('action="/api/skills/discovery/sessions/sess-abc123/commit"'));
    ok('T4: method="POST"',                res.body.includes('method="POST"'));
    ok('T4: submit button present',        res.body.includes('<button type="submit"'));
  }

  // T5 — POST commit → 303 to result URL
  console.log('\n  T5 — POST /api/skills/:name/sessions/:id/commit → 303 to result');
  {
    setCommitSession(async () => COMMIT_RESULT);
    setCommitAuditLogger(() => {});
    const req = mockReqPost();
    const res = mockRes();
    await handlePostCommitHtml(req, res);
    ok('T5: status 303',                     res.statusCode === 303);
    ok('T5: Location = result URL',          (res.headers['location'] || '') === '/skills/discovery/sessions/sess-abc123/result');
  }

  // T6 — GET result → 200 HTML
  console.log('\n  T6 — GET /skills/:name/sessions/:id/result → 200 HTML');
  {
    setGetCommitResult(async () => COMMIT_RESULT);
    setCommitAuditLogger(() => {});
    const req = mockReqGet();
    const res = mockRes();
    await handleGetResultHtml(req, res);
    ok('T6: status 200',             res.statusCode === 200);
    ok('T6: Content-Type text/html', (res.headers['content-type'] || '').includes('text/html'));
  }

  // T7 — result page shows success message
  console.log('\n  T7 — result page — success message displayed');
  {
    setGetCommitResult(async () => COMMIT_RESULT);
    setCommitAuditLogger(() => {});
    const req = mockReqGet();
    const res = mockRes();
    await handleGetResultHtml(req, res);
    const successText = /committed|complete|success|done/i.test(res.body);
    ok('T7: success-conveying text present', successText);
  }

  // T8 — result page shows artefact path
  console.log('\n  T8 — result page — artefact path displayed');
  {
    setGetCommitResult(async () => COMMIT_RESULT);
    setCommitAuditLogger(() => {});
    const req = mockReqGet();
    const res = mockRes();
    await handleGetResultHtml(req, res);
    ok('T8: artefact path in body', res.body.includes(ARTEFACT_PATH));
  }

  // T9 — result page — link to /artefact/:slug/:type
  console.log('\n  T9 — result page — link to /artefact/:slug/:type');
  {
    setGetCommitResult(async () => COMMIT_RESULT);
    setCommitAuditLogger(() => {});
    const req = mockReqGet();
    const res = mockRes();
    await handleGetResultHtml(req, res);
    ok('T9: link to /artefact/2026-05-03-my-feature/discovery', res.body.includes('href="/artefact/2026-05-03-my-feature/discovery"'));
  }

  // T10 — result page — link back to /features
  console.log('\n  T10 — result page — link back to /features');
  {
    setGetCommitResult(async () => COMMIT_RESULT);
    setCommitAuditLogger(() => {});
    const req = mockReqGet();
    const res = mockRes();
    await handleGetResultHtml(req, res);
    ok('T10: link to /features', res.body.includes('href="/features"'));
  }

  // T11 — POST commit double-commit (409) → 409 HTML, not JSON
  console.log('\n  T11 — POST commit double-commit (409) → 409 HTML informative page');
  {
    const err409 = new Error('Session already committed');
    err409.status = 409;
    setCommitSession(async () => { throw err409; });
    setCommitAuditLogger(() => {});
    const req = mockReqPost();
    const res = mockRes();
    await handlePostCommitHtml(req, res);
    ok('T11: status 409',                res.statusCode === 409);
    ok('T11: Content-Type text/html',    (res.headers['content-type'] || '').includes('text/html'));
    ok('T11: nav present (renderShell)', res.body.includes('<nav aria-label="Main navigation">'));
    ok('T11: informative message',       /already committed|session already complete|already been committed/i.test(res.body));
    ok('T11: no raw JSON error',         !res.body.includes('{"error":'));
  }

  // T12 — GET commit-preview unknown session → 404 HTML
  console.log('\n  T12 — GET commit-preview unknown session → 404 HTML');
  {
    const err404 = new Error('Session not found');
    err404.status = 404;
    setGetCommitPreview(async () => { throw err404; });
    setCommitAuditLogger(() => {});
    const req = mockReqGet({ sessionId: 'unknown-sess' });
    const res = mockRes();
    await handleGetCommitPreviewHtml(req, res);
    ok('T12: status 404',             res.statusCode === 404);
    ok('T12: Content-Type text/html', (res.headers['content-type'] || '').includes('text/html'));
    ok('T12: nav present',            res.body.includes('<nav aria-label="Main navigation">'));
    ok('T12: no raw JSON',            !res.body.includes('{"error":'));
  }

  // T13 — GET result unknown session → 404 HTML
  console.log('\n  T13 — GET result unknown session → 404 HTML');
  {
    const err404 = new Error('Session not found');
    err404.status = 404;
    setGetCommitResult(async () => { throw err404; });
    setCommitAuditLogger(() => {});
    const req = mockReqGet({ sessionId: 'unknown-sess' });
    const res = mockRes();
    await handleGetResultHtml(req, res);
    ok('T13: status 404',             res.statusCode === 404);
    ok('T13: Content-Type text/html', (res.headers['content-type'] || '').includes('text/html'));
    ok('T13: no raw JSON',            !res.body.includes('{"error":'));
  }

  // T14 — POST commit unknown session → 404 HTML
  console.log('\n  T14 — POST commit unknown session → 404 HTML');
  {
    const err404 = new Error('Session not found');
    err404.status = 404;
    setCommitSession(async () => { throw err404; });
    setCommitAuditLogger(() => {});
    const req = mockReqPost({ sessionId: 'unknown-sess' });
    const res = mockRes();
    await handlePostCommitHtml(req, res);
    ok('T14: status 404',             res.statusCode === 404);
    ok('T14: Content-Type text/html', (res.headers['content-type'] || '').includes('text/html'));
    ok('T14: no raw JSON',            !res.body.includes('{"error":'));
  }

  // T15 — XSS in artefact content escaped in <pre>
  console.log('\n  T15 — XSS in artefact content escaped in <pre>');
  {
    setGetCommitPreview(async () => ({
      artefactContent: '<script>alert(1)</script>',
      artefactPath:    ARTEFACT_PATH,
      featureSlug:     FEATURE_SLUG,
      artefactType:    ARTEFACT_TYPE
    }));
    setCommitAuditLogger(() => {});
    const req = mockReqGet();
    const res = mockRes();
    await handleGetCommitPreviewHtml(req, res);
    ok('T15: raw <script> not in body', !res.body.includes('<script>alert(1)</script>'));
    ok('T15: escaped &lt;script&gt; present', res.body.includes('&lt;script&gt;'));
  }

  // T16 — XSS in artefact path escaped
  console.log('\n  T16 — XSS in artefact path escaped');
  {
    setGetCommitPreview(async () => ({
      artefactContent: ARTEFACT_BODY,
      artefactPath:    'artefacts/<b>hack</b>/discovery.md',
      featureSlug:     FEATURE_SLUG,
      artefactType:    ARTEFACT_TYPE
    }));
    setCommitAuditLogger(() => {});
    const req = mockReqGet();
    const res = mockRes();
    await handleGetCommitPreviewHtml(req, res);
    ok('T16: raw <b>hack</b> not in body', !res.body.includes('<b>hack</b>'));
    ok('T16: &lt;b&gt;hack&lt;/b&gt; present', res.body.includes('&lt;b&gt;hack&lt;/b&gt;'));
  }

  // T17 — GET commit-preview unauthenticated → 302
  console.log('\n  T17 — GET commit-preview unauthenticated → 302');
  {
    const req = mockReqGet({ authed: false });
    const res = mockRes();
    await handleGetCommitPreviewHtml(req, res);
    ok('T17: status 302',              res.statusCode === 302);
    ok('T17: Location /auth/github',   (res.headers['location'] || '') === '/auth/github');
  }

  // T18 — POST commit unauthenticated → 302
  console.log('\n  T18 — POST commit unauthenticated → 302');
  {
    const req = mockReqPost({ authed: false });
    const res = mockRes();
    await handlePostCommitHtml(req, res);
    ok('T18: status 302', res.statusCode === 302);
  }

  // T19 — handleGetCommitPreviewHtml and handlePostCommitHtml are named exports
  console.log('\n  T19 — named exports present in routes/skills.js');
  {
    const source = fs.readFileSync(path.join(__dirname, '../src/web-ui/routes/skills.js'), 'utf8');
    ok('T19: handleGetCommitPreviewHtml exported', source.includes('handleGetCommitPreviewHtml'));
    ok('T19: handlePostCommitHtml exported',       source.includes('handlePostCommitHtml'));
    ok('T19: handleGetResultHtml exported',        source.includes('handleGetResultHtml'));
  }

  // T20 — audit log written on POST commit with correct fields
  console.log('\n  T20 — audit log written on POST commit');
  {
    let capturedLog = null;
    setCommitSession(async () => COMMIT_RESULT);
    setCommitAuditLogger((data) => { capturedLog = data; });
    const req = mockReqPost();
    const res = mockRes();
    await handlePostCommitHtml(req, res);
    ok('T20: audit log called',               capturedLog !== null);
    ok('T20: userId in log',                  capturedLog && capturedLog.userId === 'u1');
    ok('T20: route in log',                   capturedLog && capturedLog.route === '/api/skills/discovery/sessions/sess-abc123/commit');
    ok('T20: skillName in log',               capturedLog && capturedLog.skillName === 'discovery');
    ok('T20: sessionId in log',               capturedLog && capturedLog.sessionId === 'sess-abc123');
    ok('T20: artefactPath in log',            capturedLog && capturedLog.artefactPath === ARTEFACT_PATH);
    ok('T20: timestamp in log',               capturedLog && typeof capturedLog.timestamp === 'string');
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('\n');
  console.log('[wuce25-session-commit-result] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('[wuce25-session-commit-result] Fatal error:', err.message);
  process.exit(1);
});
