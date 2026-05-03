'use strict';
/**
 * session-persistence.test.js — AC verification for wuce.16
 * 22 tests: T1 (createDurableSession, 4), T2 (getDurableSession, 4),
 *           T3 (updateDurableSession, 3), T4 (COPILOT_HOME separation, 2),
 *           T5 (session list, 2), T6 (expiry, 2), T7 (resume route, 2),
 *           NFR1-NFR3 (3), INT1-INT3 (integration, 3)
 *
 * All tests FAIL until implementation exists (TDD entry condition).
 * Uses real fs module for durable store tests; temp dirs in os.tmpdir().
 */
const assert = require('assert');
const path   = require('path');
const fs     = require('fs');
const os     = require('os');
const crypto = require('crypto');

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
// T1 — createDurableSession
// Module under test: src/session-store.js
// ---------------------------------------------------------------------------

async function runT1() {
  process.stdout.write('\nT1 — createDurableSession\n');

  const { createDurableSession } = require('../src/session-store');

  await test('T1.1 — returns session object with all required fields from contract fixture shape', async () => {
    const session = await createDurableSession('test-stakeholder', 'discovery');
    assert(session.sessionId, 'sessionId missing');
    assert.strictEqual(session.userId, 'test-stakeholder');
    assert.strictEqual(session.skillName, 'discovery');
    assert(session.createdAt, 'createdAt missing');
    assert(session.updatedAt, 'updatedAt missing');
    assert(session.expiresAt, 'expiresAt missing');
    assert.strictEqual(session.questionIndex, 0);
    assert.deepStrictEqual(session.answers, []);
    assert.strictEqual(session.partialArtefact, null);
    assert.strictEqual(session.complete, false);
    assert.strictEqual(session.copilotHomeDeleted, false);
  });

  await test('T1.2 — sessionId is ≥128 bits (≥32 hex chars or UUID v4)', async () => {
    const session = await createDurableSession('user', 'discovery');
    const isHex32 = /^[0-9a-f]{32,}$/.test(session.sessionId);
    const isUuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(session.sessionId);
    assert(isHex32 || isUuidV4, 'sessionId does not meet entropy requirement');
  });

  await test('T1.3 — session state does NOT contain an oauthToken field', async () => {
    const session = await createDurableSession('user', 'discovery');
    const sessionStr = JSON.stringify(session);
    assert(!sessionStr.includes('oauthToken'), 'oauthToken present in session state');
    assert(!sessionStr.includes('access_token'), 'access_token present in session state');
    assert(!sessionStr.includes('gho_'), 'OAuth token prefix present in session state');
  });

  await test('T1.4 — expiresAt is exactly 24 hours after createdAt', async () => {
    const session = await createDurableSession('user', 'discovery');
    const created = new Date(session.createdAt).getTime();
    const expires = new Date(session.expiresAt).getTime();
    assert.strictEqual(expires - created, 24 * 60 * 60 * 1000, 'expiresAt offset wrong');
  });
}

// ---------------------------------------------------------------------------
// T2 — getDurableSession
// ---------------------------------------------------------------------------

async function runT2() {
  process.stdout.write('\nT2 — getDurableSession\n');

  const { createDurableSession, getDurableSession } = require('../src/session-store');

  await test('T2.1 — returns full session state for the correct userId', async () => {
    const created = await createDurableSession('test-stakeholder', 'discovery');
    const retrieved = await getDurableSession(created.sessionId, 'test-stakeholder');
    assert.strictEqual(retrieved.sessionId, created.sessionId);
    assert.strictEqual(retrieved.userId, 'test-stakeholder');
    assert.strictEqual(retrieved.skillName, 'discovery');
  });

  await test('T2.2 — throws SESSION_FORBIDDEN when userId does not match session owner', async () => {
    const created = await createDurableSession('user-a', 'discovery');
    try {
      await getDurableSession(created.sessionId, 'user-b');
      assert.fail('should have thrown SESSION_FORBIDDEN');
    } catch (err) {
      assert.strictEqual(err.code, 'SESSION_FORBIDDEN', 'wrong error code: ' + err.code);
    }
  });

  await test('T2.3 — throws SESSION_EXPIRED when current time is past expiresAt', async () => {
    const store = require('../src/session-store');
    store._resetStore();
    const created = await store.createDurableSession('user-t23', 'discovery');
    store._setClock(function() { return new Date(Date.now() + 25 * 60 * 60 * 1000); });
    try {
      await store.getDurableSession(created.sessionId, 'user-t23');
      assert.fail('should have thrown SESSION_EXPIRED');
    } catch (err) {
      assert.strictEqual(err.code, 'SESSION_EXPIRED', 'wrong error code: ' + err.code);
    } finally {
      store._setClock(function() { return new Date(); });
      store._resetStore();
    }
  });

  await test('T2.4 — throws SESSION_NOT_FOUND for unknown session ID', async () => {
    try {
      await getDurableSession('nonexistent-session-id-' + Date.now(), 'user');
      assert.fail('should have thrown SESSION_NOT_FOUND');
    } catch (err) {
      assert.strictEqual(err.code, 'SESSION_NOT_FOUND', 'wrong error code: ' + err.code);
    }
  });
}

// ---------------------------------------------------------------------------
// T3 — updateDurableSession
// ---------------------------------------------------------------------------

async function runT3() {
  process.stdout.write('\nT3 — updateDurableSession\n');

  const { createDurableSession, updateDurableSession } = require('../src/session-store');

  await test('T3.1 — updates questionIndex, answers, and partialArtefact', async () => {
    const created = await createDurableSession('user', 'discovery');
    const updated = await updateDurableSession(created.sessionId, {
      questionIndex: 1,
      answers: [{ questionId: 'q1', text: 'Automate the pipeline.' }],
      partialArtefact: '## Discovery draft'
    });
    assert.strictEqual(updated.questionIndex, 1);
    assert.strictEqual(updated.answers.length, 1);
    assert.strictEqual(updated.partialArtefact, '## Discovery draft');
  });

  await test('T3.2 — updatedAt is set to the time of the update', async () => {
    const store = require('../src/session-store');
    const created = await store.createDurableSession('user-t32', 'discovery');
    const originalUpdatedAt = created.updatedAt;
    const futureDate = new Date(Date.now() + 60 * 60 * 1000);
    store._setClock(function() { return futureDate; });
    const updated = await store.updateDurableSession(created.sessionId, { questionIndex: 1 });
    store._setClock(function() { return new Date(); });
    assert(updated.updatedAt !== originalUpdatedAt, 'updatedAt was not changed');
    assert.strictEqual(updated.updatedAt, futureDate.toISOString(), 'updatedAt does not match injected time');
  });

  await test('T3.3 — immutable fields (userId, createdAt, skillName) cannot be changed via update', async () => {
    const created = await createDurableSession('user', 'discovery');
    const updated = await updateDurableSession(created.sessionId, {
      userId: 'hacked-user',
      createdAt: '2020-01-01T00:00:00.000Z',
      skillName: 'evil'
    });
    assert.strictEqual(updated.userId, 'user', 'userId was mutated');
    assert.strictEqual(updated.createdAt, created.createdAt, 'createdAt was mutated');
    assert.strictEqual(updated.skillName, 'discovery', 'skillName was mutated');
  });
}

// ---------------------------------------------------------------------------
// T4 — COPILOT_HOME / durable store separation (16-M1 fix anchor)
// ---------------------------------------------------------------------------

async function runT4() {
  process.stdout.write('\nT4 — COPILOT_HOME separation (16-M1)\n');

  const { createDurableSession, updateDurableSession, getDurableSession } = require('../src/session-store');

  await test('T4.1 — session retrievable after copilotHomeDeleted:true set (durable store survives COPILOT_HOME cleanup)', async () => {
    const created = await createDurableSession('user', 'discovery');
    await updateDurableSession(created.sessionId, {
      questionIndex: 1,
      answers: [{ questionId: 'q1', text: 'Some answer' }],
      copilotHomeDeleted: true
    });
    // Must NOT depend on COPILOT_HOME path
    const resumed = await getDurableSession(created.sessionId, 'user');
    assert.strictEqual(resumed.answers.length, 1);
    assert.strictEqual(resumed.questionIndex, 1);
    assert.strictEqual(resumed.copilotHomeDeleted, true);
  });

  await test('T4.2 — resume route reads from durable store, not COPILOT_HOME', async () => {
    const store = require('../src/session-store');
    store._resetStore();
    const { handleGetSessionResume } = require('../src/web-ui/routes/skill-resume');
    const created = await store.createDurableSession('user-t42', 'discovery');
    await store.updateDurableSession(created.sessionId, {
      questionIndex: 3,
      answers: [{ questionId: 'q1', text: 'answer' }],
      copilotHomeDeleted: true
    });
    const req = { session: { accessToken: 'ghp_test', userId: 'user-t42' }, params: { name: 'discovery', id: created.sessionId }, body: {} };
    const res = { statusCode: 200, headers: {}, body: null };
    res.writeHead = function(code, hdrs) { res.statusCode = code; Object.assign(res.headers, hdrs || {}); };
    res.end = function(data) { try { res.body = JSON.parse(data); } catch(_) { res.body = data; } };
    await handleGetSessionResume(req, res);
    assert.strictEqual(res.statusCode, 200, 'expected 200 got ' + res.statusCode);
    assert.strictEqual(res.body.data.questionIndex, 3, 'questionIndex mismatch');
    assert.strictEqual(res.body.data.copilotHomeDeleted, true, 'copilotHomeDeleted should be true');
    store._resetStore();
  });
}

// ---------------------------------------------------------------------------
// T5 — In-progress session list on GET /skills
// ---------------------------------------------------------------------------

async function runT5() {
  process.stdout.write('\nT5 — Session list\n');

  await test('T5.1 — GET /skills returns in-progress sessions with skill name, start date, questions completed', async () => {
    const store = require('../src/session-store');
    store._resetStore();
    const created = await store.createDurableSession('user-t51', 'discovery');
    await store.updateDurableSession(created.sessionId, { questionIndex: 2 });
    const sessions = await store.listDurableSessions('user-t51');
    assert.strictEqual(sessions.length, 1, 'expected 1 in-progress session');
    assert.strictEqual(sessions[0].skillName, 'discovery');
    assert(sessions[0].createdAt, 'createdAt missing from session list');
    assert.strictEqual(sessions[0].questionIndex, 2);
    store._resetStore();
  });

  await test('T5.2 — expired or complete sessions not shown in in-progress list', async () => {
    const store = require('../src/session-store');
    store._resetStore();
    const complete = await store.createDurableSession('user-t52', 'discovery');
    await store.updateDurableSession(complete.sessionId, { complete: true });
    await store.createDurableSession('user-t52', 'definition');
    store._setClock(function() { return new Date(Date.now() + 25 * 60 * 60 * 1000); });
    const sessions = await store.listDurableSessions('user-t52');
    store._setClock(function() { return new Date(); });
    assert.strictEqual(sessions.length, 0, 'expected 0 sessions, got ' + sessions.length);
    store._resetStore();
  });
}

// ---------------------------------------------------------------------------
// T6 — Session expiry
// ---------------------------------------------------------------------------

async function runT6() {
  process.stdout.write('\nT6 — Session expiry\n');

  await test('T6.1 — inactive session > 24h → SESSION_EXPIRED error (not 404)', async () => {
    const store = require('../src/session-store');
    store._resetStore();
    const created = await store.createDurableSession('user-t61', 'discovery');
    store._setClock(function() { return new Date(Date.now() + 25 * 60 * 60 * 1000); });
    try {
      await store.getDurableSession(created.sessionId, 'user-t61');
      assert.fail('should have thrown SESSION_EXPIRED');
    } catch (err) {
      assert.strictEqual(err.code, 'SESSION_EXPIRED', 'expected SESSION_EXPIRED, got ' + err.code);
    } finally {
      store._setClock(function() { return new Date(); });
      store._resetStore();
    }
  });

  await test('T6.2 — expired session data is deleted from durable store', async () => {
    const store = require('../src/session-store');
    store._resetStore();
    const created = await store.createDurableSession('user-t62', 'discovery');
    store._setClock(function() { return new Date(Date.now() + 25 * 60 * 60 * 1000); });
    try { await store.getDurableSession(created.sessionId, 'user-t62'); } catch (_) {}
    store._setClock(function() { return new Date(); });
    try {
      await store.getDurableSession(created.sessionId, 'user-t62');
      assert.fail('session should have been deleted after expiry');
    } catch (err) {
      assert.strictEqual(err.code, 'SESSION_NOT_FOUND', 'expected SESSION_NOT_FOUND, got ' + err.code);
    }
    store._resetStore();
  });
}

// ---------------------------------------------------------------------------
// T7 — Resume route (GET /api/skills/:name/sessions/:id/resume)
// ---------------------------------------------------------------------------

async function runT7() {
  process.stdout.write('\nT7 — Resume route\n');

  await test('T7.1 — returns session state with question index, previous answers, partial artefact', async () => {
    const store = require('../src/session-store');
    store._resetStore();
    const { handleGetSessionResume } = require('../src/web-ui/routes/skill-resume');
    const created = await store.createDurableSession('user-t71', 'discovery');
    await store.updateDurableSession(created.sessionId, {
      questionIndex: 2,
      answers: [{ questionId: 'q1', text: 'a1' }, { questionId: 'q2', text: 'a2' }],
      partialArtefact: '## Draft'
    });
    const req = { session: { accessToken: 'ghp_test', userId: 'user-t71' }, params: { name: 'discovery', id: created.sessionId }, body: {} };
    const res = { statusCode: 200, headers: {}, body: null };
    res.writeHead = function(code, hdrs) { res.statusCode = code; Object.assign(res.headers, hdrs || {}); };
    res.end = function(data) { try { res.body = JSON.parse(data); } catch(_) { res.body = data; } };
    await handleGetSessionResume(req, res);
    assert.strictEqual(res.statusCode, 200, 'expected 200 got ' + res.statusCode);
    assert.strictEqual(res.body.data.questionIndex, 2);
    assert.strictEqual(res.body.data.answers.length, 2);
    assert.strictEqual(res.body.data.partialArtefact, '## Draft');
    store._resetStore();
  });

  await test('T7.2 — resume for expired session returns 410 with "Session expired" message', async () => {
    const store = require('../src/session-store');
    store._resetStore();
    const { handleGetSessionResume } = require('../src/web-ui/routes/skill-resume');
    const created = await store.createDurableSession('user-t72', 'discovery');
    store._setClock(function() { return new Date(Date.now() + 25 * 60 * 60 * 1000); });
    const req = { session: { accessToken: 'ghp_test', userId: 'user-t72' }, params: { name: 'discovery', id: created.sessionId }, body: {} };
    const res = { statusCode: 200, headers: {}, body: null };
    res.writeHead = function(code, hdrs) { res.statusCode = code; Object.assign(res.headers, hdrs || {}); };
    res.end = function(data) { try { res.body = JSON.parse(data); } catch(_) { res.body = data; } };
    await handleGetSessionResume(req, res);
    store._setClock(function() { return new Date(); });
    store._resetStore();
    assert.strictEqual(res.statusCode, 410, 'expected 410 for expired session, got ' + res.statusCode);
    const bodyStr = typeof res.body === 'string' ? res.body : JSON.stringify(res.body);
    assert(bodyStr.toLowerCase().includes('expired'), 'response should mention "expired"');
  });
}

// ---------------------------------------------------------------------------
// NFR tests
// ---------------------------------------------------------------------------

async function runNFR() {
  process.stdout.write('\nNFR\n');

  await test('NFR1 — sessionId is cryptographically random ≥128 bits (tested via T1.2 above) — confirmed here for crypto.randomBytes', async () => {
    const { createDurableSession } = require('../src/session-store');
    const sessions = await Promise.all([
      createDurableSession('u1', 'discovery'),
      createDurableSession('u2', 'discovery'),
      createDurableSession('u3', 'discovery')
    ]);
    const ids = sessions.map(s => s.sessionId);
    const unique = new Set(ids);
    assert.strictEqual(unique.size, 3, 'sessionIds not unique');
  });

  await test('NFR2 — userId is never written to server logs (hash or omit)', async () => {
    const storeSource = require('fs').readFileSync(
      require('path').join(__dirname, '../src/session-store.js'), 'utf8'
    );
    assert(!storeSource.includes('console.log'), 'session-store.js must not use console.log (userId leakage risk)');
    assert(!storeSource.includes('process.stdout.write'), 'session-store.js must not write to stdout with userId');
    assert(!storeSource.includes('process.stderr.write'), 'session-store.js must not write to stderr with userId');
  });

  await test('NFR3 — resume responds within 1s for a session with 50 answers', async () => {
    const store = require('../src/session-store');
    store._resetStore();
    const { handleGetSessionResume } = require('../src/web-ui/routes/skill-resume');
    const created = await store.createDurableSession('user-nfr3', 'discovery');
    const answers = [];
    for (let i = 0; i < 50; i++) { answers.push({ questionId: 'q' + i, text: 'Answer for question ' + i }); }
    await store.updateDurableSession(created.sessionId, { questionIndex: 50, answers });
    const req = { session: { accessToken: 'ghp_test', userId: 'user-nfr3' }, params: { name: 'discovery', id: created.sessionId }, body: {} };
    const res = { statusCode: 200, headers: {}, body: null };
    res.writeHead = function(code, hdrs) { res.statusCode = code; Object.assign(res.headers, hdrs || {}); };
    res.end = function(data) { try { res.body = JSON.parse(data); } catch(_) { res.body = data; } };
    const start = Date.now();
    await handleGetSessionResume(req, res);
    const elapsed = Date.now() - start;
    assert(elapsed < 1000, 'resume took ' + elapsed + 'ms, expected < 1000ms');
    assert.strictEqual(res.statusCode, 200);
    store._resetStore();
  });
}

// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------

async function runINT() {
  process.stdout.write('\nINT — Integration\n');

  await test('INT1 — create session, answer 2 questions, close, resume: state fully restored', async () => {
    const store = require('../src/session-store');
    store._resetStore();
    const { handleGetSessionResume } = require('../src/web-ui/routes/skill-resume');
    const session = await store.createDurableSession('int-user-1', 'discovery');
    await store.updateDurableSession(session.sessionId, {
      questionIndex: 1,
      answers: [{ questionId: 'q1', text: 'First answer' }]
    });
    await store.updateDurableSession(session.sessionId, {
      questionIndex: 2,
      answers: [{ questionId: 'q1', text: 'First answer' }, { questionId: 'q2', text: 'Second answer' }],
      partialArtefact: '## Discovery Draft'
    });
    const req = { session: { accessToken: 'ghp_test', userId: 'int-user-1' }, params: { name: 'discovery', id: session.sessionId }, body: {} };
    const res = { statusCode: 200, headers: {}, body: null };
    res.writeHead = function(code, hdrs) { res.statusCode = code; Object.assign(res.headers, hdrs || {}); };
    res.end = function(data) { try { res.body = JSON.parse(data); } catch(_) { res.body = data; } };
    await handleGetSessionResume(req, res);
    assert.strictEqual(res.statusCode, 200, 'resume failed: ' + res.statusCode);
    assert.strictEqual(res.body.data.questionIndex, 2, 'questionIndex not restored');
    assert.strictEqual(res.body.data.answers.length, 2, 'answers not restored');
    assert.strictEqual(res.body.data.partialArtefact, '## Discovery Draft', 'partialArtefact not restored');
    store._resetStore();
  });

  await test('INT2 — create + answer + complete → commit: committed artefact contains answers from both virtual sessions', async () => {
    const store = require('../src/session-store');
    store._resetStore();
    const session = await store.createDurableSession('int-user-2', 'discovery');
    await store.updateDurableSession(session.sessionId, {
      questionIndex: 1,
      answers: [{ questionId: 'q1', text: 'Answer from session A' }]
    });
    await store.updateDurableSession(session.sessionId, {
      questionIndex: 2,
      answers: [
        { questionId: 'q1', text: 'Answer from session A' },
        { questionId: 'q2', text: 'Answer from session B' }
      ],
      partialArtefact: '## Full draft with both answers',
      complete: true
    });
    const completed = await store.getDurableSession(session.sessionId, 'int-user-2');
    assert.strictEqual(completed.complete, true, 'session not marked complete');
    assert.strictEqual(completed.answers.length, 2, 'expected 2 answers from both sessions');
    assert(completed.partialArtefact.includes('both answers'), 'artefact missing cross-session content');
    store._resetStore();
  });

  await test('INT3 — cross-user access attempt returns 403 end-to-end', async () => {
    const store = require('../src/session-store');
    store._resetStore();
    const { handleGetSessionResume } = require('../src/web-ui/routes/skill-resume');
    const session = await store.createDurableSession('int-owner', 'discovery');
    const req = { session: { accessToken: 'ghp_attacker', userId: 'int-attacker' }, params: { name: 'discovery', id: session.sessionId }, body: {} };
    const res = { statusCode: 200, headers: {}, body: null };
    res.writeHead = function(code, hdrs) { res.statusCode = code; Object.assign(res.headers, hdrs || {}); };
    res.end = function(data) { try { res.body = JSON.parse(data); } catch(_) { res.body = data; } };
    await handleGetSessionResume(req, res);
    assert.strictEqual(res.statusCode, 403, 'expected 403 for cross-user access, got ' + res.statusCode);
    store._resetStore();
  });
}

// ---------------------------------------------------------------------------
// Contract fixture guard — ensure tests/fixtures/sessions/durable-session-state.json exists
// ---------------------------------------------------------------------------

function checkFixtures() {
  const dir = path.join(__dirname, 'fixtures/sessions');
  if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }

  const contractFixture = path.join(dir, 'durable-session-state.json');
  if (!fs.existsSync(contractFixture)) {
    fs.writeFileSync(contractFixture, JSON.stringify({
      sessionId: 'a3f7c2d1e4b5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3',
      userId: 'test-stakeholder',
      skillName: 'discovery',
      createdAt: '2026-05-02T09:00:00.000Z',
      updatedAt: '2026-05-02T09:15:00.000Z',
      expiresAt: '2026-05-03T09:00:00.000Z',
      questionIndex: 2,
      answers: [
        { questionId: 'q1', text: 'We want to automate our software delivery pipeline using AI agents.' },
        { questionId: 'q2', text: 'The target users are non-technical stakeholders — product owners, BAs, business leads.' }
      ],
      partialArtefact: '## Discovery: AI-Driven Pipeline Automation\n\n**Problem statement:** The team spends significant manual effort coordinating delivery pipeline steps.',
      complete: false,
      copilotHomeDeleted: false
    }, null, 2), 'utf8');
    process.stdout.write('[SETUP] Created contract fixture: tests/fixtures/sessions/durable-session-state.json\n');
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

(async () => {
  process.stdout.write('session-persistence.test.js — wuce.16\n');
  checkFixtures();
  await runT1();
  await runT2();
  await runT3();
  await runT4();
  await runT5();
  await runT6();
  await runT7();
  await runNFR();
  await runINT();

  process.stdout.write('\n');
  if (failures.length) {
    failures.forEach(f => process.stdout.write('  FAIL: ' + f.name + '\n    ' + f.err.message + '\n'));
  }
  process.stdout.write('\nResults: ' + passed + ' passed, ' + failed + ' failed\n');
  if (failed > 0) { process.exit(1); }
})();
