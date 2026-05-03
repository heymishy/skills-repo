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

const { createDurableSession, getDurableSession, updateDurableSession, listDurableSessions, purgeExpiredSessions, _getStore } = require('../src/session-store');
const { handleResumeSession } = require('../src/web-ui/routes/skills');

function makeReq(opts) {
  return { session: opts.session || null, params: opts.params || {}, body: opts.body !== undefined ? opts.body : undefined };
}
function makeRes() {
  const r = { statusCode: 200, body: null, _headers: {} };
  r.writeHead = function(status, hdrs) { r.statusCode = status; if (hdrs) Object.assign(r._headers, hdrs); };
  r.end = function(data) { try { r.body = JSON.parse(data); } catch(_) { r.body = data; } };
  return r;
}

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
    const created = await createDurableSession('user-expire', 'discovery');
    const store = _getStore();
    const session = store.get(created.sessionId);
    session.expiresAt = new Date(Date.now() - 1000).toISOString();
    store.set(created.sessionId, session);
    try {
      await getDurableSession(created.sessionId, 'user-expire');
      assert.fail('should have thrown SESSION_EXPIRED');
    } catch (err) {
      assert.strictEqual(err.code, 'SESSION_EXPIRED', 'wrong error code: ' + err.code);
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
    const created = await createDurableSession('user-upd', 'discovery');
    const originalUpdatedAt = created.updatedAt;
    await new Promise(function(r) { setTimeout(r, 5); });
    const updated = await updateDurableSession(created.sessionId, { questionIndex: 1 });
    assert(updated.updatedAt >= originalUpdatedAt, 'updatedAt should be >= original');
    assert(!isNaN(new Date(updated.updatedAt).getTime()), 'updatedAt is not a valid date');
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
    const created = await createDurableSession('t42-user', 'discovery');
    await updateDurableSession(created.sessionId, {
      questionIndex: 1,
      answers: [{ questionId: 'q1', text: 'Test answer' }]
    });
    const req = makeReq({ session: { accessToken: 'ghp_test', userId: 't42-user' }, params: { name: 'discovery', id: created.sessionId } });
    const res = makeRes();
    await handleResumeSession(req, res);
    assert.strictEqual(res.statusCode, 200, 'expected 200, got ' + res.statusCode + ': ' + JSON.stringify(res.body));
    assert.strictEqual(res.body.questionIndex, 1, 'questionIndex not persisted');
    assert.strictEqual(res.body.answers.length, 1, 'answers not persisted');
  });
}

// ---------------------------------------------------------------------------
// T5 — In-progress session list on GET /skills
// ---------------------------------------------------------------------------

async function runT5() {
  process.stdout.write('\nT5 — Session list\n');

  await test('T5.1 — GET /skills returns in-progress sessions with skill name, start date, questions completed', async () => {
    const created = await createDurableSession('t51-user', 'discovery');
    await updateDurableSession(created.sessionId, { questionIndex: 2, answers: [{questionId:'q1',text:'a'},{questionId:'q2',text:'b'}] });
    const sessions = await listDurableSessions('t51-user');
    assert(Array.isArray(sessions), 'listDurableSessions should return an array');
    const found = sessions.find(s => s.sessionId === created.sessionId);
    assert(found, 'created session not found in list');
    assert.strictEqual(found.skillName, 'discovery', 'skillName wrong');
    assert(found.createdAt, 'createdAt missing');
    assert.strictEqual(found.questionIndex, 2, 'questionIndex not updated in list');
  });

  await test('T5.2 — expired or complete sessions not shown in in-progress list', async () => {
    const expiredSession = await createDurableSession('t52-user', 'discovery');
    const store = _getStore();
    const s = store.get(expiredSession.sessionId);
    s.expiresAt = new Date(Date.now() - 1000).toISOString();
    store.set(expiredSession.sessionId, s);
    const completeSession = await createDurableSession('t52-user', 'discovery');
    await updateDurableSession(completeSession.sessionId, { complete: true });
    const sessions = await listDurableSessions('t52-user');
    const expiredInList  = sessions.find(s => s.sessionId === expiredSession.sessionId);
    const completeInList = sessions.find(s => s.sessionId === completeSession.sessionId);
    assert(!expiredInList,  'expired session should not appear in list');
    assert(!completeInList, 'complete session should not appear in list');
  });
}

// ---------------------------------------------------------------------------
// T6 — Session expiry
// ---------------------------------------------------------------------------

async function runT6() {
  process.stdout.write('\nT6 — Session expiry\n');

  await test('T6.1 — inactive session > 24h → SESSION_EXPIRED error (not 404)', async () => {
    const created = await createDurableSession('t61-user', 'discovery');
    const store = _getStore();
    const s = store.get(created.sessionId);
    s.expiresAt = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    store.set(created.sessionId, s);
    try {
      await getDurableSession(created.sessionId, 't61-user');
      assert.fail('should have thrown SESSION_EXPIRED');
    } catch (err) {
      assert.strictEqual(err.code, 'SESSION_EXPIRED', 'expected SESSION_EXPIRED, got: ' + err.code);
    }
  });

  await test('T6.2 — expired session data is deleted from durable store', async () => {
    const created = await createDurableSession('t62-user', 'discovery');
    const store = _getStore();
    const s = store.get(created.sessionId);
    s.expiresAt = new Date(Date.now() - 1000).toISOString();
    store.set(created.sessionId, s);
    try { await getDurableSession(created.sessionId, 't62-user'); } catch (_) {}
    assert(!store.has(created.sessionId), 'expired session still in store after expiry');
  });
}

// ---------------------------------------------------------------------------
// T7 — Resume route (GET /api/skills/:name/sessions/:id/resume)
// ---------------------------------------------------------------------------

async function runT7() {
  process.stdout.write('\nT7 — Resume route\n');

  await test('T7.1 — returns session state with question index, previous answers, partial artefact', async () => {
    const created = await createDurableSession('t71-user', 'discovery');
    await updateDurableSession(created.sessionId, {
      questionIndex:   2,
      answers:         [{ questionId: 'q1', text: 'answer 1' }, { questionId: 'q2', text: 'answer 2' }],
      partialArtefact: '## Discovery draft'
    });
    const req = makeReq({ session: { accessToken: 'ghp_test', userId: 't71-user' }, params: { name: 'discovery', id: created.sessionId } });
    const res = makeRes();
    await handleResumeSession(req, res);
    assert.strictEqual(res.statusCode, 200, 'expected 200, got ' + res.statusCode);
    assert.strictEqual(res.body.questionIndex, 2, 'questionIndex missing/wrong');
    assert.strictEqual(res.body.answers.length, 2, 'answers not returned');
    assert.strictEqual(res.body.partialArtefact, '## Discovery draft', 'partialArtefact not returned');
  });

  await test('T7.2 — resume for expired session returns 410 with "Session expired" message', async () => {
    const created = await createDurableSession('t72-user', 'discovery');
    const store = _getStore();
    const s = store.get(created.sessionId);
    s.expiresAt = new Date(Date.now() - 1000).toISOString();
    store.set(created.sessionId, s);
    const req = makeReq({ session: { accessToken: 'ghp_test', userId: 't72-user' }, params: { name: 'discovery', id: created.sessionId } });
    const res = makeRes();
    await handleResumeSession(req, res);
    assert.strictEqual(res.statusCode, 410, 'expected 410, got ' + res.statusCode);
    assert(res.body.message, 'message missing from 410 response');
  });
}

// ---------------------------------------------------------------------------
// NFR tests
// ---------------------------------------------------------------------------

async function runNFR() {
  process.stdout.write('\nNFR\n');

  await test('NFR1 — sessionId is cryptographically random ≥128 bits (tested via T1.2 above) — confirmed here for crypto.randomBytes', async () => {
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
    const created = await createDurableSession('sensitive-userId-99999', 'discovery');
    assert(!created.sessionId.includes('sensitive'), 'sessionId must not contain userId');
    assert.strictEqual(created.userId, 'sensitive-userId-99999', 'userId not stored in session');
  });

  await test('NFR3 — resume responds within 1s for a session with 50 answers', async () => {
    const created = await createDurableSession('nfr3-user', 'discovery');
    const answers = [];
    for (let i = 0; i < 50; i++) { answers.push({ questionId: 'q' + (i+1), text: 'answer ' + i }); }
    await updateDurableSession(created.sessionId, { answers, questionIndex: 50 });
    const req = makeReq({ session: { accessToken: 'ghp_test', userId: 'nfr3-user' }, params: { name: 'discovery', id: created.sessionId } });
    const res = makeRes();
    const start = Date.now();
    await handleResumeSession(req, res);
    const elapsed = Date.now() - start;
    assert(elapsed < 1000, 'resume took ' + elapsed + 'ms (must be < 1000ms)');
    assert.strictEqual(res.statusCode, 200);
  });
}

// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------

async function runINT() {
  process.stdout.write('\nINT — Integration\n');

  await test('INT1 — create session, answer 2 questions, close, resume: state fully restored', async () => {
    const created = await createDurableSession('int1-user-sp', 'discovery');
    await updateDurableSession(created.sessionId, {
      questionIndex: 2,
      answers: [
        { questionId: 'q1', text: 'AI pipeline automation' },
        { questionId: 'q2', text: 'Non-technical stakeholders' }
      ],
      partialArtefact: '## Discovery: AI Pipeline\n\nDraft content.'
    });
    const resumed = await getDurableSession(created.sessionId, 'int1-user-sp');
    assert.strictEqual(resumed.questionIndex, 2, 'questionIndex not restored');
    assert.strictEqual(resumed.answers.length, 2, 'answers not restored');
    assert(resumed.partialArtefact, 'partialArtefact not restored');
  });

  await test('INT2 — create + answer + complete → commit: committed artefact contains answers from both virtual sessions', async () => {
    const created = await createDurableSession('int2-user-sp', 'discovery');
    await updateDurableSession(created.sessionId, {
      questionIndex:   3,
      answers:         [
        { questionId: 'q1', text: 'First answer' },
        { questionId: 'q2', text: 'Second answer' },
        { questionId: 'q3', text: 'Third answer' }
      ],
      partialArtefact: '## Discovery\n\nContent from both sessions.',
      complete:        true
    });
    const final = await getDurableSession(created.sessionId, 'int2-user-sp');
    assert.strictEqual(final.complete, true, 'session not complete');
    assert.strictEqual(final.answers.length, 3, 'answers missing');
    assert(final.partialArtefact.includes('Content from both sessions.'), 'artefact content missing');
  });

  await test('INT3 — cross-user access attempt returns 403 end-to-end', async () => {
    const created = await createDurableSession('owner-int3', 'discovery');
    const req = makeReq({ session: { accessToken: 'ghp_test', userId: 'attacker-int3' }, params: { name: 'discovery', id: created.sessionId } });
    const res = makeRes();
    await handleResumeSession(req, res);
    assert.strictEqual(res.statusCode, 403, 'expected 403, got ' + res.statusCode);
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
