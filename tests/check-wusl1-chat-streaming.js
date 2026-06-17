'use strict';
/**
 * check-wusl1-chat-streaming.js
 *
 * TDD tests for wusl.1 — Stream model response tokens into chat bubble in real time.
 * Tests FAIL before implementation, PASS after.
 *
 * Run: node tests/check-wusl1-chat-streaming.js
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
    end: function() {}
  };
}

function makeReq(sessionId, answer) {
  return {
    session: { accessToken: 'test-tok', userId: 1, login: 'user' },
    params:  { name: 'discovery', id: sessionId },
    body:    { answer: answer || 'hello' }
  };
}

function seedSession(routes, sid) {
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

// ── T1.1 — AC2: each onChunk call produces a distinct SSE chunk event ──────────

queue.push(function() {
  console.log('\n── T1.1 — AC2: N onChunk calls → N SSE {chunk} events in order');
  return test('T1.1 (AC2): 3 onChunk calls produce 3 distinct {chunk} SSE events', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'wusl1-t1-' + Math.random().toString(36).slice(2);
    seedSession(routes, sid);

    routes.setSkillTurnExecutorStreamAdapter(async function(_sys, _hist, _inp, _tok, onChunk) {
      onChunk('Hello');
      onChunk(', ');
      onChunk('world!');
      return 'Hello, world!';
    });

    const res = makeSseRes();
    await routes.handlePostTurnStreamHtml(makeReq(sid), res);

    const chunkEvents = res.events.filter(function(e) { return e.chunk !== undefined; });
    assert.strictEqual(chunkEvents.length, 3, 'must have exactly 3 {chunk} events, got: ' + chunkEvents.length);
    assert.strictEqual(chunkEvents[0].chunk, 'Hello', 'first chunk must be "Hello"');
    assert.strictEqual(chunkEvents[1].chunk, ', ', 'second chunk must be ", "');
    assert.strictEqual(chunkEvents[2].chunk, 'world!', 'third chunk must be "world!"');
  });
});

// ── T1.2 — AC4: full text intact in session.turns after streaming ─────────────

queue.push(function() {
  console.log('\n── T1.2 — AC4: session.turns updated with complete concatenated text');
  return test('T1.2 (AC4): session.turns contains full assistant text after streaming', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'wusl1-t2-' + Math.random().toString(36).slice(2);
    seedSession(routes, sid);

    routes.setSkillTurnExecutorStreamAdapter(async function(_sys, _hist, _inp, _tok, onChunk) {
      onChunk('Part one. ');
      onChunk('Part two.');
      return 'Part one. Part two.';
    });

    await routes.handlePostTurnStreamHtml(makeReq(sid, 'my question'), makeSseRes());

    const session = routes._getHtmlSession(sid);
    assert.strictEqual(session.turns.length, 2, 'must have 2 turns (user + assistant)');
    assert.strictEqual(session.turns[0].role, 'user');
    assert.strictEqual(session.turns[1].role, 'assistant');
    assert.strictEqual(session.turns[1].content, 'Part one. Part two.', 'assistant turn must be the full text');
  });
});

// ── T1.3 — AC7: error event sent on executor failure ─────────────────────────

queue.push(function() {
  console.log('\n── T1.3 — AC7: error SSE event sent when executor throws');
  return test('T1.3 (AC7): {error} SSE event written when _skillTurnExecutorStream throws', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'wusl1-t3-' + Math.random().toString(36).slice(2);
    seedSession(routes, sid);

    routes.setSkillTurnExecutorStreamAdapter(async function() {
      throw new Error('Model unavailable');
    });

    const res = makeSseRes();
    await routes.handlePostTurnStreamHtml(makeReq(sid), res);

    const errEvents = res.events.filter(function(e) { return e.error !== undefined; });
    assert.ok(errEvents.length > 0, 'must emit at least one {error} SSE event');
    assert.ok(typeof errEvents[0].error === 'string', 'error value must be a string');
  });
});

// ── T1.4 — AC4: final {done} event sent after all chunks ─────────────────────

queue.push(function() {
  console.log('\n── T1.4 — AC4: final {done} event is sent after all chunk events');
  return test('T1.4 (AC4): {done} SSE event is the last event after chunk events', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'wusl1-t4-' + Math.random().toString(36).slice(2);
    seedSession(routes, sid);

    routes.setSkillTurnExecutorStreamAdapter(async function(_sys, _hist, _inp, _tok, onChunk) {
      onChunk('token1 ');
      onChunk('token2');
      return 'token1 token2';
    });

    const res = makeSseRes();
    await routes.handlePostTurnStreamHtml(makeReq(sid), res);

    const doneEvents = res.events.filter(function(e) { return e.done !== undefined; });
    assert.ok(doneEvents.length === 1, 'must have exactly 1 {done} event');

    // done event must come after all chunk events
    const lastChunkIdx = res.events.map(function(e, i) { return e.chunk !== undefined ? i : -1; })
      .filter(function(i) { return i !== -1; })
      .pop();
    const doneIdx = res.events.findIndex(function(e) { return e.done !== undefined; });
    assert.ok(doneIdx > lastChunkIdx, '{done} event must be after all {chunk} events');
  });
});

// ── T1.5 — AC3: chat page HTML has animated thinking dots ────────────────────

queue.push(function() {
  console.log('\n── T1.5 — AC3: rendered chat HTML contains animated thinking indicator');
  return test('T1.5 (AC3): rendered HTML from handleGetChatHtml contains sw-thinking and sw-dot-pulse animation', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'wusl1-t5-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sid, null, 'discovery');

    // initial turn needed to get past auth
    routes.setSkillTurnExecutorAdapter(async function() { return 'Hello!'; });

    let capturedHtml = '';
    const req = {
      session: { accessToken: 'tok', userId: 1, login: 'u' },
      params:  { name: 'discovery', id: sid }
    };
    const res = {
      _status: null,
      writeHead: function(s) { this._status = s; },
      end: function(body) { capturedHtml += (body || ''); }
    };

    await routes.handleGetChatHtml(req, res);

    assert.ok(capturedHtml.includes('sw-thinking'), 'HTML must reference sw-thinking class');
    assert.ok(capturedHtml.includes('sw-dot'), 'HTML must reference sw-dot class');
    assert.ok(capturedHtml.includes('sw-dot-pulse'), 'HTML must include sw-dot-pulse @keyframes animation');
  });
});

// ── T1.6 — AC2+AC3: thinking div is removed on first chunk, not on response start ─

queue.push(function() {
  console.log('\n── T1.6 — AC2/AC3: thinkingDiv removed inside evt.chunk block, not on r.ok');
  return test('T1.6 (AC2/AC3): chat page JS removes thinkingDiv inside evt.chunk handler, not when response headers arrive', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'wusl1-t6-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sid, null, 'discovery');
    routes.setSkillTurnExecutorAdapter(async function() { return 'Hello!'; });

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

    // The JS should NOT remove thinkingDiv immediately when r resolves:
    // Pattern we do NOT want: "if(thinkingDiv) { thinkingDiv.remove()..." right after "if(!r.ok..."
    // Pattern we DO want: thinkingDiv.remove() inside the if(evt.chunk) block.
    //
    // Heuristic: the string "thinkingDiv.remove()" should appear inside or after
    // "if(evt.chunk)" in the script, not in the fetch().then() before the pump loop starts.
    //
    // We assert: the first occurrence of "thinkingDiv.remove()" appears AFTER
    // the first occurrence of "evt.chunk" in the script.
    const scriptStart = capturedHtml.indexOf('<script>');
    assert.ok(scriptStart !== -1, 'HTML must contain <script> block');
    const scriptContent = capturedHtml.slice(scriptStart);

    const removeIdx       = scriptContent.indexOf('thinkingDiv.remove()');
    const chunkIdx        = scriptContent.indexOf('evt.chunk');
    const reasoningIdx    = scriptContent.indexOf('evt.reasoningChunk');

    assert.ok(removeIdx !== -1, 'thinkingDiv.remove() must appear in script');
    assert.ok(chunkIdx !== -1,  'evt.chunk must appear in script');
    // thinkingDiv is removed on the first model signal — either a content chunk or a
    // reasoning chunk. The removal must NOT happen immediately when response headers
    // arrive (before the pump loop). We assert it appears after either signal check.
    const firstSignalIdx = reasoningIdx !== -1 ? Math.min(chunkIdx, reasoningIdx) : chunkIdx;
    assert.ok(
      removeIdx > firstSignalIdx,
      'thinkingDiv.remove() must appear after evt.chunk or evt.reasoningChunk check (remove on first model signal, not on response start). ' +
      'removeIdx=' + removeIdx + ' firstSignalIdx=' + firstSignalIdx
    );
  });
});

// ── T1.7 — AC5: stripArtefactBlock is called in the pump loop ────────────────

queue.push(function() {
  console.log('\n── T1.7 — AC5: stripArtefactBlock called on streamText before every render');
  return test('T1.7 (AC5): chat page JS calls stripArtefactBlock on streamText before innerHTML assignment', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'wusl1-t7-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sid, null, 'discovery');
    routes.setSkillTurnExecutorAdapter(async function() { return 'Hello!'; });

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

    // The pump loop must call lightMd(stripArtefactBlock(streamText)) when updating innerHTML
    assert.ok(
      capturedHtml.includes('stripArtefactBlock'),
      'chat page script must define and use stripArtefactBlock'
    );
    assert.ok(
      capturedHtml.includes('lightMd(stripArtefactBlock(streamText))'),
      'innerHTML assignment must use lightMd(stripArtefactBlock(streamText))'
    );
  });
});

// ── run ──────────────────────────────────────────────────────────────────────

console.log('\n[check-wusl1-chat-streaming]');

queue.reduce(function(p, fn) { return p.then(fn); }, Promise.resolve()).then(function() {
  console.log('\n--- Results ---');
  console.log('  Passed: ' + passed);
  console.log('  Failed: ' + failed);
  if (failures.length) {
    failures.forEach(function(f) { console.log('  FAIL detail: ' + f.name + '\n    ' + f.msg); });
  }
  process.exit(failed > 0 ? 1 : 0);
});
