'use strict';
/**
 * check-sdrg-s1-session-done-reexecution-guard.js
 *
 * TDD tests for sdrg-s1 — Guard the initial-turn auto-fire so viewing an
 * already-completed session can never re-execute or re-mutate it.
 *
 * Run: node tests/check-sdrg-s1-session-done-reexecution-guard.js
 */

const assert = require('assert');
const path   = require('path');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(function() {
        passed++;
        console.log('  PASS: ' + name);
      }).catch(function(err) {
        failed++;
        const msg = err && err.message ? err.message : String(err);
        failures.push({ name, msg });
        console.log('  FAIL: ' + name + '\n       ' + msg);
      });
    }
    passed++;
    console.log('  PASS: ' + name);
    return Promise.resolve();
  } catch (err) {
    failed++;
    const msg = err && err.message ? err.message : String(err);
    failures.push({ name, msg });
    console.log('  FAIL: ' + name + '\n       ' + msg);
    return Promise.resolve();
  }
}

function freshRequire(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

const ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

/** Collect SSE lines written to a mock res, return parsed data payloads. */
function makeSseRes() {
  const events = [];
  return {
    _status: null,
    _headers: {},
    _ended: false,
    events,
    writeHead: function(status, headers) {
      this._status = status;
      Object.assign(this._headers, headers || {});
    },
    write: function(chunk) {
      const str = String(chunk);
      str.split('\n').forEach(function(line) {
        if (!line.startsWith('data: ')) { return; }
        try { events.push(JSON.parse(line.slice(6).trim())); } catch (_) {}
      });
    },
    end: function() { this._ended = true; }
  };
}

function makeStreamReq(sessionId, answer) {
  return {
    session: { accessToken: 'test-tok', userId: 1, login: 'user' },
    params:  { name: 'discovery', id: sessionId },
    body:    { answer: answer }
  };
}

function seedDoneSession(routes, sid, artefactContent) {
  routes._setHtmlSession(sid, {
    skillName:       'discovery',
    sessionPath:     '/tmp/test',
    systemPrompt:    'SYS',
    turns:           [],
    artefactContent: artefactContent,
    artefactPath:    'artefacts/x/discovery.md',
    done:            true
  });
}

function seedFreshSession(routes, sid) {
  routes._setHtmlSession(sid, {
    skillName:       'discovery',
    sessionPath:     '/tmp/test',
    systemPrompt:    'SYS',
    turns:           [],
    artefactContent: null,
    artefactPath:    null,
    done:            false
  });
}

const queue = [];

// ── AC1 — streaming endpoint: __init__ on a done session is a true no-op ──────

queue.push(function() {
  console.log('\n── AC1 — streamTurn_initOnDoneSession_isNoOp_executorNeverCalled');
  return test('AC1: handlePostTurnStreamHtml __init__ on done session never calls executor, never mutates state', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'sdrg1-' + Math.random().toString(36).slice(2);
    seedDoneSession(routes, sid, 'EXISTING ARTEFACT');

    let called = false;
    routes.setSkillTurnExecutorStreamAdapter(async function() {
      called = true;
      return 'should never run';
    });

    const res = makeSseRes();
    await routes.handlePostTurnStreamHtml(makeStreamReq(sid, '__init__'), res);

    assert.strictEqual(called, false, 'executor must never be called for __init__ on a done session');
    const session = routes._getHtmlSession(sid);
    assert.strictEqual(session.turns.length, 0, 'no turn must be pushed');
    assert.strictEqual(session.artefactContent, 'EXISTING ARTEFACT', 'artefactContent must be unchanged');
  });
});

queue.push(function() {
  console.log('\n── AC1 — streamTurn_initOnDoneSession_emitsValidTerminalDoneEvent');
  return test('AC1: handlePostTurnStreamHtml __init__ on done session emits a valid terminal done event', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'sdrg1b-' + Math.random().toString(36).slice(2);
    seedDoneSession(routes, sid, 'EXISTING ARTEFACT');
    routes.setSkillTurnExecutorStreamAdapter(async function() { return 'should never run'; });

    const res = makeSseRes();
    await routes.handlePostTurnStreamHtml(makeStreamReq(sid, '__init__'), res);

    assert.ok(res._ended, 'response must be ended, not left hanging');
    const doneEvents = res.events.filter(function(e) { return e.done !== undefined; });
    assert.strictEqual(doneEvents.length, 1, 'exactly one terminal done event must be written');
    assert.strictEqual(doneEvents[0].done, true, 'done must be true');
    assert.strictEqual(doneEvents[0].artefactContent, 'EXISTING ARTEFACT', 'terminal event must carry the existing artefact content');
  });
});

// ── AC2 — non-streaming endpoint: __init__ on a done session is a true no-op ──

queue.push(function() {
  console.log('\n── AC2 — submitTurn_initOnDoneSession_isNoOp_executorNeverCalled');
  return test('AC2: htmlSubmitTurn __init__ on done session never calls executor, never mutates state', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'sdrg2-' + Math.random().toString(36).slice(2);
    seedDoneSession(routes, sid, 'EXISTING ARTEFACT');

    let called = false;
    routes.setSkillTurnExecutorAdapter(async function() {
      called = true;
      return 'should never run';
    });

    await routes.htmlSubmitTurn('discovery', sid, '__init__', 'tok');

    assert.strictEqual(called, false, 'executor must never be called for __init__ on a done session');
    const session = routes._getHtmlSession(sid);
    assert.strictEqual(session.turns.length, 0, 'no turn must be pushed');
    assert.strictEqual(session.artefactContent, 'EXISTING ARTEFACT', 'artefactContent must be unchanged');
  });
});

queue.push(function() {
  console.log('\n── AC2 — submitTurn_initOnDoneSession_returnsExistingCompletionState');
  return test('AC2: htmlSubmitTurn __init__ on done session returns the existing completion state', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'sdrg2b-' + Math.random().toString(36).slice(2);
    seedDoneSession(routes, sid, 'EXISTING ARTEFACT');
    routes.setSkillTurnExecutorAdapter(async function() { return 'should never run'; });

    const result = await routes.htmlSubmitTurn('discovery', sid, '__init__', 'tok');

    assert.ok(result, 'result must not be null/undefined');
    assert.strictEqual(result.done, true, 'result.done must be true');
    assert.strictEqual(result.artefactContent, 'EXISTING ARTEFACT', 'result.artefactContent must be the existing artefact');
  });
});

// ── AC3 — regression guard: fresh session __init__ behaviour unchanged ────────

queue.push(function() {
  console.log('\n── AC3 — streamTurn_initOnFreshSession_behaviourUnchanged');
  return test('AC3: handlePostTurnStreamHtml __init__ on a fresh session still calls the executor', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'sdrg3-' + Math.random().toString(36).slice(2);
    seedFreshSession(routes, sid);

    let called = false;
    routes.setSkillTurnExecutorStreamAdapter(async function(_sys, _hist, _inp, _tok, onChunk) {
      called = true;
      onChunk('Hello!');
      return 'Hello!';
    });

    const res = makeSseRes();
    await routes.handlePostTurnStreamHtml(makeStreamReq(sid, '__init__'), res);

    assert.strictEqual(called, true, 'executor must still be called for __init__ on a genuinely fresh session');
    const session = routes._getHtmlSession(sid);
    assert.strictEqual(session.turns.length, 1, 'assistant turn must be pushed for the fresh-session init turn');
  });
});

queue.push(function() {
  console.log('\n── AC3 — submitTurn_initOnFreshSession_behaviourUnchanged');
  return test('AC3: htmlSubmitTurn __init__ on a fresh session still calls the executor', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'sdrg3b-' + Math.random().toString(36).slice(2);
    seedFreshSession(routes, sid);

    let called = false;
    routes.setSkillTurnExecutorAdapter(async function() {
      called = true;
      return 'Hello!';
    });

    await routes.htmlSubmitTurn('discovery', sid, '__init__', 'tok');

    assert.strictEqual(called, true, 'executor must still be called for __init__ on a genuinely fresh session');
  });
});

// ── AC4 — client script: SESSION_DONE suppresses auto-fire on a done session ──

queue.push(function() {
  console.log('\n── AC4 — renderChatPage_doneSession_emitsSessionDoneTrueAndSuppressesAutoFire');
  return test('AC4: handleGetChatHtml for a done session emits SESSION_DONE=true and a guarded auto-fire condition', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'sdrg4-' + Math.random().toString(36).slice(2);
    seedDoneSession(routes, sid, 'EXISTING ARTEFACT');

    let capturedHtml = '';
    const req = {
      session: { accessToken: 'tok', userId: 1, login: 'u' },
      params:  { name: 'discovery', id: sid }
    };
    const res = {
      writeHead: function() {},
      end: function(body) { capturedHtml += (body || ''); }
    };
    await routes.handleGetChatHtml(req, res);

    assert.ok(/var SESSION_DONE\s*=\s*true;/.test(capturedHtml), 'HTML must set SESSION_DONE = true for a done session');
    assert.ok(/if\(!SESSION_DONE\s*&&\s*thread\.children\.length\s*===\s*0\)/.test(capturedHtml),
      'auto-fire condition must be gated on !SESSION_DONE');
  });
});

// ── AC5 — client script: auto-fire still present for a genuinely fresh session ─

queue.push(function() {
  console.log('\n── AC5 — renderChatPage_freshEmptySession_autoFireStillPresent');
  return test('AC5: handleGetChatHtml for a fresh session emits SESSION_DONE=false and the auto-fire call is still reachable', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'sdrg5-' + Math.random().toString(36).slice(2);
    seedFreshSession(routes, sid);

    let capturedHtml = '';
    const req = {
      session: { accessToken: 'tok', userId: 1, login: 'u' },
      params:  { name: 'discovery', id: sid }
    };
    const res = {
      writeHead: function() {},
      end: function(body) { capturedHtml += (body || ''); }
    };
    await routes.handleGetChatHtml(req, res);

    assert.ok(/var SESSION_DONE\s*=\s*false;/.test(capturedHtml), 'HTML must set SESSION_DONE = false for a fresh session');
    assert.ok(capturedHtml.includes('sendTurn("__init__")'), 'auto-fire call site must still be present in the emitted script');
  });
});

(async function run() {
  for (const fn of queue) {
    await fn();
  }
  console.log('\n[check-sdrg-s1-session-done-reexecution-guard] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    console.log('Failed tests:');
    failures.forEach(function(f) { console.log('  - ' + f.name + ': ' + f.msg); });
    process.exit(1);
  }
})();
