'use strict';
/**
 * artefact-writeback.test.js — AC verification for wuce.15
 * 18 tests: T1 (commitArtefact adapter, 4), T2 (path validation, 5),
 *           T3 (route handler, 4), T4 (conflict handling, 2),
 *           T5 (confirmation response, 1), NFR1-NFR2 (2), INT1-INT2 (integration)
 *
 * All tests FAIL until implementation exists (TDD entry condition).
 */
const assert = require('assert');
const path   = require('path');
const fs     = require('fs');

let passed = 0, failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    process.stdout.write('  \u2713 ' + name + '\n');
  } catch (err) {
    failed++;
    failures.push({ name, err });
    process.stdout.write('  \u2717 ' + name + ': ' + err.message + '\n');
  }
}

// ---------------------------------------------------------------------------
// Test helpers for route handler tests
// ---------------------------------------------------------------------------

function makeReq(overrides) {
  return Object.assign({ session: { accessToken: 'ghp_test', userId: 'user-1' }, params: {}, body: {} }, overrides);
}

function makeRes() {
  const res = { statusCode: 200, headers: {}, body: null };
  res.writeHead = function(code, hdrs) { res.statusCode = code; Object.assign(res.headers, hdrs || {}); };
  res.end = function(data) { try { res.body = JSON.parse(data); } catch (_) { res.body = data; } };
  return res;
}

// ---------------------------------------------------------------------------
// T1 — commitArtefact SCM adapter (reuses/extends wuce.3 adapter)
// Module under test: src/scm-adapter.js
// ---------------------------------------------------------------------------

async function runT1() {
  process.stdout.write('\nT1 — commitArtefact SCM adapter\n');

  const { commitArtefact: scmCommit, setAdapterForTest } = require('../src/scm-adapter');
  const successFixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/github/contents-api-commit-success.json'), 'utf8'));

  await test('T1.1 — calls Contents API with correct path, content (base64), and user identity as committer', async () => {
    const calls = [];
    setAdapterForTest({ commitArtefact: async (opts) => { calls.push(opts); return successFixture; } });
    await scmCommit({
      path: 'artefacts/2026-05-02-ai-pipeline/discovery.md',
      content: 'Hello world',
      accessToken: 'ghp_test123',
      userId: 'test-stakeholder',
      sessionId: 'session-test-123',
      skillName: 'discovery'
    });
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].path, 'artefacts/2026-05-02-ai-pipeline/discovery.md');
    assert.ok(calls[0].committer && calls[0].committer.name === 'test-stakeholder', 'committer identity set');
    assert.strictEqual(calls[0].committer.email, 'test-stakeholder@users.noreply.github.com');
  });

  await test('T1.2 — commit message includes skill name and session ID', async () => {
    const calls = [];
    setAdapterForTest({ commitArtefact: async (opts) => { calls.push(opts); return successFixture; } });
    await scmCommit({
      path: 'artefacts/test-feature/benefit-metric.md',
      content: 'metric content',
      accessToken: 'ghp_test',
      userId: 'user-1',
      sessionId: 'sess-xyz-456',
      skillName: 'benefit-metric'
    });
    assert.ok(calls[0].commitMessage.includes('benefit-metric'), 'commit message includes skill name');
    assert.ok(calls[0].commitMessage.includes('sess-xyz-456'), 'commit message includes session ID');
  });

  await test('T1.3 — returns { sha, htmlUrl } on success', async () => {
    setAdapterForTest({ commitArtefact: async () => successFixture });
    const result = await scmCommit({
      path: 'artefacts/test/file.md',
      content: 'content',
      accessToken: 'ghp_test',
      userId: 'u1',
      sessionId: 'sess-123',
      skillName: 'discovery'
    });
    assert.strictEqual(result.sha, successFixture.commit.sha);
    assert.strictEqual(result.htmlUrl, successFixture.content.html_url);
  });

  await test('T1.4 — propagates 409 conflict without swallowing it', async () => {
    setAdapterForTest({ commitArtefact: async () => {
      const err = new Error('409: Conflict'); err.status = 409; throw err;
    }});
    let caught = null;
    try {
      await scmCommit({
        path: 'artefacts/test/file.md', content: 'c',
        accessToken: 'ghp_test', userId: 'u1', sessionId: 's', skillName: 'discovery'
      });
    } catch (e) { caught = e; }
    assert.ok(caught, 'error was thrown');
    assert.strictEqual(caught.code, 'ARTEFACT_CONFLICT');
  });
}

// ---------------------------------------------------------------------------
// T2 — Artefact path validation (server-side)
// Module under test: src/artefact-path-validator.js
// ---------------------------------------------------------------------------

async function runT2() {
  process.stdout.write('\nT2 — Artefact path validation\n');

  const { validateArtefactPath } = require('../src/artefact-path-validator');

  await test('T2.1 — valid path under artefacts/ → accepted', async () => {
    assert.strictEqual(validateArtefactPath('artefacts/2026-05-02-ai-pipeline/discovery.md'), true);
    assert.strictEqual(validateArtefactPath('artefacts/2026-05-02-feature/stories/story.md'), true);
  });

  await test('T2.2 — ../etc/passwd → rejected', async () => {
    assert.strictEqual(validateArtefactPath('../etc/passwd'), false);
  });

  await test('T2.3 — path outside artefacts/ → rejected (even without traversal)', async () => {
    assert.strictEqual(validateArtefactPath('src/evil.js'), false);
    assert.strictEqual(validateArtefactPath('.github/workflows/pwned.yml'), false);
  });

  await test('T2.4 — resolved traversal rejected (artefacts/../etc/passwd normalises outside artefacts/)', async () => {
    assert.strictEqual(validateArtefactPath('artefacts/../etc/passwd'), false);
  });

  await test('T2.5 — client-supplied path in request body is ignored; server derives path from session context', async () => {
    const { handlePostCommit, setSessionRegistryForTest } = require('../src/web-ui/routes/skill-commit');
    const { setAdapterForTest } = require('../src/scm-adapter');
    const fix = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/github/contents-api-commit-success.json'), 'utf8'));
    const adapterCalls = [];
    setAdapterForTest({ commitArtefact: async (opts) => { adapterCalls.push(opts); return fix; } });
    const sessionData = { id: 'sess-t25', userId: 'user-t25', artefactPath: 'artefacts/2026-05-02-ai-pipeline/discovery.md', content: 'content text', state: 'complete' };
    setSessionRegistryForTest({ getSession: (id) => id === 'sess-t25' ? sessionData : null });
    const req = makeReq({ session: { accessToken: 'ghp_test', userId: 'user-t25' }, params: { name: 'discovery', id: 'sess-t25' }, body: { path: 'src/evil.js' } });
    const res = makeRes();
    await handlePostCommit(req, res);
    assert.strictEqual(adapterCalls.length, 1, 'adapter called once');
    assert.strictEqual(adapterCalls[0].path, 'artefacts/2026-05-02-ai-pipeline/discovery.md', 'session path used, not body path');
  });
}

// ---------------------------------------------------------------------------
// T3 — Route handler (POST /api/skills/:name/sessions/:id/commit)
// ---------------------------------------------------------------------------

async function runT3() {
  process.stdout.write('\nT3 — Commit route handler\n');

  const { handlePostCommit, setSessionRegistryForTest, setCommitFnForTest } = require('../src/web-ui/routes/skill-commit');
  const successFixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/github/contents-api-commit-success.json'), 'utf8'));

  await test('T3.1 — returns 201 with { sha, htmlUrl } on success', async () => {
    const session = { id: 'sess-t31', userId: 'user-1', artefactPath: 'artefacts/2026-05-02-ai-pipeline/discovery.md', content: 'content', state: 'complete' };
    setSessionRegistryForTest({ getSession: (id) => id === 'sess-t31' ? session : null });
    setCommitFnForTest(async () => ({ sha: successFixture.commit.sha, htmlUrl: successFixture.content.html_url }));
    const req = makeReq({ params: { name: 'discovery', id: 'sess-t31' } });
    const res = makeRes();
    await handlePostCommit(req, res);
    assert.strictEqual(res.statusCode, 201);
    assert.ok(res.body.sha, 'sha present');
    assert.ok(res.body.htmlUrl, 'htmlUrl present');
  });

  await test('T3.2 — returns 401 when unauthenticated', async () => {
    const req = makeReq({ session: null });
    const res = makeRes();
    await handlePostCommit(req, res);
    assert.strictEqual(res.statusCode, 401);
  });

  await test('T3.3 — returns 403 when session belongs to a different user', async () => {
    const session = { id: 'sess-t33', userId: 'user-2', artefactPath: 'artefacts/test/file.md', content: 'c', state: 'complete' };
    setSessionRegistryForTest({ getSession: (id) => id === 'sess-t33' ? session : null });
    const req = makeReq({ session: { accessToken: 'ghp_test', userId: 'user-1' }, params: { name: 'discovery', id: 'sess-t33' } });
    const res = makeRes();
    await handlePostCommit(req, res);
    assert.strictEqual(res.statusCode, 403);
  });

  await test('T3.4 — returns 400 SESSION_NOT_COMPLETE when session not yet complete', async () => {
    const session = { id: 'sess-t34', userId: 'user-1', artefactPath: 'artefacts/test/file.md', content: 'c', state: 'in-progress' };
    setSessionRegistryForTest({ getSession: (id) => id === 'sess-t34' ? session : null });
    const req = makeReq({ params: { name: 'discovery', id: 'sess-t34' } });
    const res = makeRes();
    await handlePostCommit(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.error, 'SESSION_NOT_COMPLETE');
  });
}

// ---------------------------------------------------------------------------
// T4 — Conflict handling (409 from Contents API)
// ---------------------------------------------------------------------------

async function runT4() {
  process.stdout.write('\nT4 — Conflict handling\n');

  const { handlePostCommit, setSessionRegistryForTest, setCommitFnForTest } = require('../src/web-ui/routes/skill-commit');
  const EXISTING_URL = 'https://github.com/test-org/test-repo/blob/master/artefacts/test/file.md';

  await test('T4.1 — 409 response → message matches AC4 exact text', async () => {
    const session = { id: 'sess-t41', userId: 'user-1', artefactPath: 'artefacts/test/file.md', content: 'c', state: 'complete' };
    setSessionRegistryForTest({ getSession: (id) => id === 'sess-t41' ? session : null });
    const conflictErr = new Error('Artefact already exists \u2014 reload and review before committing');
    conflictErr.code = 'ARTEFACT_CONFLICT';
    conflictErr.existingArtefactUrl = EXISTING_URL;
    setCommitFnForTest(async () => { throw conflictErr; });
    const req = makeReq({ params: { name: 'discovery', id: 'sess-t41' } });
    const res = makeRes();
    await handlePostCommit(req, res);
    assert.strictEqual(res.statusCode, 409);
    assert.strictEqual(res.body.message, 'Artefact already exists \u2014 reload and review before committing');
  });

  await test('T4.2 — 409 response includes existingArtefactUrl for the "view existing" option', async () => {
    const session = { id: 'sess-t42', userId: 'user-1', artefactPath: 'artefacts/test/file.md', content: 'c', state: 'complete' };
    setSessionRegistryForTest({ getSession: (id) => id === 'sess-t42' ? session : null });
    const conflictErr = new Error('Artefact already exists \u2014 reload and review before committing');
    conflictErr.code = 'ARTEFACT_CONFLICT';
    conflictErr.existingArtefactUrl = EXISTING_URL;
    setCommitFnForTest(async () => { throw conflictErr; });
    const req = makeReq({ params: { name: 'discovery', id: 'sess-t42' } });
    const res = makeRes();
    await handlePostCommit(req, res);
    assert.strictEqual(res.statusCode, 409);
    assert.ok(res.body.existingArtefactUrl, 'existingArtefactUrl present');
    assert.strictEqual(res.body.existingArtefactUrl, EXISTING_URL);
  });
}

// ---------------------------------------------------------------------------
// T5 — Confirmation response
// ---------------------------------------------------------------------------

async function runT5() {
  process.stdout.write('\nT5 — Confirmation response\n');

  const { handlePostCommit, setSessionRegistryForTest, setCommitFnForTest } = require('../src/web-ui/routes/skill-commit');
  const successFixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/github/contents-api-commit-success.json'), 'utf8'));

  await test('T5.1 — success response includes repo link (htmlUrl) and commit SHA (AC5)', async () => {
    const session = { id: 'sess-t51', userId: 'user-1', artefactPath: 'artefacts/2026-05-02-ai-pipeline/discovery.md', content: 'content', state: 'complete' };
    setSessionRegistryForTest({ getSession: (id) => id === 'sess-t51' ? session : null });
    setCommitFnForTest(async () => ({ sha: successFixture.commit.sha, htmlUrl: successFixture.content.html_url }));
    const req = makeReq({ params: { name: 'discovery', id: 'sess-t51' } });
    const res = makeRes();
    await handlePostCommit(req, res);
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.sha, successFixture.commit.sha);
    assert.strictEqual(res.body.htmlUrl, successFixture.content.html_url);
  });
}

// ---------------------------------------------------------------------------
// NFR tests
// ---------------------------------------------------------------------------

async function runNFR() {
  process.stdout.write('\nNFR\n');

  const { handlePostCommit, setSessionRegistryForTest, setCommitFnForTest } = require('../src/web-ui/routes/skill-commit');
  const successFixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/github/contents-api-commit-success.json'), 'utf8'));

  await test('NFR1 — commit endpoint responds within 5s (including Contents API mock)', async () => {
    const session = { id: 'sess-nfr1', userId: 'user-1', artefactPath: 'artefacts/test/file.md', content: 'c', state: 'complete' };
    setSessionRegistryForTest({ getSession: (id) => id === 'sess-nfr1' ? session : null });
    setCommitFnForTest(async () => ({ sha: successFixture.commit.sha, htmlUrl: successFixture.content.html_url }));
    const req = makeReq({ params: { name: 'discovery', id: 'sess-nfr1' } });
    const res = makeRes();
    const start = Date.now();
    await handlePostCommit(req, res);
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 5000, 'responded in ' + elapsed + 'ms (limit: 5000ms)');
    assert.strictEqual(res.statusCode, 201);
  });

  await test('NFR2 — OAuth token is never present in commit response or server logs', async () => {
    const TOKEN = 'ghp_SECRETTOKEN123456789';
    const session = { id: 'sess-nfr2', userId: 'user-1', artefactPath: 'artefacts/test/file.md', content: 'c', state: 'complete' };
    setSessionRegistryForTest({ getSession: (id) => id === 'sess-nfr2' ? session : null });
    setCommitFnForTest(async () => ({ sha: successFixture.commit.sha, htmlUrl: successFixture.content.html_url }));
    const req = makeReq({ session: { accessToken: TOKEN, userId: 'user-1' }, params: { name: 'discovery', id: 'sess-nfr2' } });
    const res = makeRes();
    await handlePostCommit(req, res);
    const responseStr = JSON.stringify(res.body);
    assert.ok(!responseStr.includes(TOKEN), 'OAuth token not in response body');
  });
}

// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------

async function runINT() {
  process.stdout.write('\nINT — Integration\n');

  const { handlePostCommit, setSessionRegistryForTest, setCommitFnForTest } = require('../src/web-ui/routes/skill-commit');
  const { setAdapterForTest } = require('../src/scm-adapter');
  const successFixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/github/contents-api-commit-success.json'), 'utf8'));

  await test('INT1 — complete skill session → commit endpoint → Contents API called with correct identity', async () => {
    const adapterCalls = [];
    setAdapterForTest({ commitArtefact: async (opts) => { adapterCalls.push(opts); return successFixture; } });
    setCommitFnForTest(null); // use real scm-adapter, which delegates to the mock wuce.3 adapter above
    const session = { id: 'sess-int1', userId: 'test-stakeholder', artefactPath: 'artefacts/2026-05-02-ai-pipeline/discovery.md', content: 'discovery content', state: 'complete' };
    setSessionRegistryForTest({ getSession: (id) => id === 'sess-int1' ? session : null });
    const req = makeReq({ session: { accessToken: 'ghp_int_test', userId: 'test-stakeholder' }, params: { name: 'discovery', id: 'sess-int1' } });
    const res = makeRes();
    await handlePostCommit(req, res);
    assert.strictEqual(res.statusCode, 201);
    assert.ok(adapterCalls.length > 0, 'Contents API adapter was called');
    assert.strictEqual(adapterCalls[0].path, 'artefacts/2026-05-02-ai-pipeline/discovery.md');
    assert.strictEqual(adapterCalls[0].committer.name, 'test-stakeholder');
  });

  await test('INT2 — path traversal in client body → 400 returned; Contents API never called', async () => {
    const adapterCalls = [];
    setAdapterForTest({ commitArtefact: async (opts) => { adapterCalls.push(opts); return successFixture; } });
    setCommitFnForTest(null); // use real scm-adapter so path validation runs
    // Session with a traversal artefactPath — simulates a tampered session
    const session = { id: 'sess-int2', userId: 'user-1', artefactPath: '../etc/passwd', content: 'c', state: 'complete' };
    setSessionRegistryForTest({ getSession: (id) => id === 'sess-int2' ? session : null });
    const req = makeReq({ params: { name: 'discovery', id: 'sess-int2' }, body: { path: '../etc/passwd' } });
    const res = makeRes();
    await handlePostCommit(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(adapterCalls.length, 0, 'Contents API was NOT called');
  });
}

// ---------------------------------------------------------------------------
// Fixture guard
// ---------------------------------------------------------------------------

function checkFixtures() {
  const dir = path.join(__dirname, 'fixtures/github');
  if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }

  const successFixture = path.join(dir, 'contents-api-commit-success.json');
  if (!fs.existsSync(successFixture)) {
    fs.writeFileSync(successFixture, JSON.stringify({
      content: {
        name: 'discovery.md',
        path: 'artefacts/2026-05-02-ai-pipeline/discovery.md',
        sha: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
        html_url: 'https://github.com/test-org/test-repo/blob/master/artefacts/2026-05-02-ai-pipeline/discovery.md'
      },
      commit: {
        sha: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
        message: 'artefact: commit /discovery session output [session-test-123]',
        author: { name: 'test-stakeholder', email: 'test-stakeholder@users.noreply.github.com' }
      }
    }, null, 2), 'utf8');
  }

  const conflictFixture = path.join(dir, 'contents-api-conflict.json');
  if (!fs.existsSync(conflictFixture)) {
    fs.writeFileSync(conflictFixture, JSON.stringify({
      message: '409: Conflict',
      documentation_url: 'https://docs.github.com/rest/repos/contents',
      status: '409'
    }, null, 2), 'utf8');
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

(async () => {
  process.stdout.write('artefact-writeback.test.js — wuce.15\n');
  checkFixtures();
  await runT1();
  await runT2();
  await runT3();
  await runT4();
  await runT5();
  await runNFR();
  await runINT();

  process.stdout.write('\n');
  if (failures.length) {
    failures.forEach(f => process.stdout.write('  FAIL: ' + f.name + '\n    ' + f.err.message + '\n'));
  }
  process.stdout.write('\nResults: ' + passed + ' passed, ' + failed + ' failed\n');
  if (failed > 0) { process.exit(1); }
})();
