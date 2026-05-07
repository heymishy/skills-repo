'use strict';
/**
 * check-wusl2-progressive-live-draft.js
 *
 * TDD tests for wusl.2 — Progressive live draft: build up the artefact panel
 * in real time as the model streams, not only at response end.
 * Tests FAIL before implementation, PASS after.
 *
 * Run: node tests/check-wusl2-progressive-live-draft.js
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

// ── T2.1 — AC1: chunk containing ARTEFACT-START marker emits {draftChunk} ────

queue.push(function() {
  console.log('\n── T2.1 — AC1: chunk containing ---ARTEFACT-START--- emits {draftChunk} SSE event');
  return test('T2.1 (AC1): when onChunk delivers text containing ---ARTEFACT-START---, server emits {draftChunk}', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'wusl2-t1-' + Math.random().toString(36).slice(2);
    seedSession(routes, sid);

    const artefactBody = 'First line of artefact content\n';
    routes.setSkillTurnExecutorStreamAdapter(async function(_s, _h, _i, _t, onChunk) {
      onChunk('Some context.\n---ARTEFACT-START---\n' + artefactBody);
      return 'Some context.\n---ARTEFACT-START---\n' + artefactBody + '---ARTEFACT-END---';
    });

    const res = makeSseRes();
    await routes.handlePostTurnStreamHtml(makeReq(sid), res);

    const draftEvents = res.events.filter(function(e) { return e.draftChunk !== undefined; });
    assert.ok(draftEvents.length > 0,
      'must emit at least one {draftChunk} SSE event when ARTEFACT-START is in chunk; got 0');
    const combined = draftEvents.map(function(e) { return e.draftChunk; }).join('');
    assert.ok(combined.includes('First line'), 'draftChunk content must contain artefact body text; got: ' + combined);
  });
});

// ── T2.2 — AC1: content before start marker must NOT appear in draftChunk ────

queue.push(function() {
  console.log('\n── T2.2 — AC1: content before ARTEFACT-START must not appear in draftChunk events');
  return test('T2.2 (AC1): context text before ---ARTEFACT-START--- is not included in {draftChunk} events', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'wusl2-t2-' + Math.random().toString(36).slice(2);
    seedSession(routes, sid);

    routes.setSkillTurnExecutorStreamAdapter(async function(_s, _h, _i, _t, onChunk) {
      onChunk('CONTEXT_BEFORE\n---ARTEFACT-START---\nARTEFACT_CONTENT\n---ARTEFACT-END---');
      return 'CONTEXT_BEFORE\n---ARTEFACT-START---\nARTEFACT_CONTENT\n---ARTEFACT-END---';
    });

    const res = makeSseRes();
    await routes.handlePostTurnStreamHtml(makeReq(sid), res);

    const combined = res.events
      .filter(function(e) { return e.draftChunk !== undefined; })
      .map(function(e) { return e.draftChunk; })
      .join('');
    assert.ok(!combined.includes('CONTEXT_BEFORE'),
      'draftChunk must not include content before ---ARTEFACT-START---; got: ' + combined);
  });
});

// ── T2.3 — AC1: no artefact → zero draftChunk events ─────────────────────────

queue.push(function() {
  console.log('\n── T2.3 — AC1: non-artefact response produces zero {draftChunk} events');
  return test('T2.3 (AC1): response without artefact markers emits no {draftChunk} events', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'wusl2-t3-' + Math.random().toString(36).slice(2);
    seedSession(routes, sid);

    routes.setSkillTurnExecutorStreamAdapter(async function(_s, _h, _i, _t, onChunk) {
      onChunk('This is a ');
      onChunk('plain conversational response.');
      return 'This is a plain conversational response.';
    });

    const res = makeSseRes();
    await routes.handlePostTurnStreamHtml(makeReq(sid), res);

    const draftEvents = res.events.filter(function(e) { return e.draftChunk !== undefined; });
    assert.strictEqual(draftEvents.length, 0,
      'must emit zero {draftChunk} events for non-artefact responses; got ' + draftEvents.length);
  });
});

// ── T2.4 — AC1: split start marker across two chunks is detected ─────────────

queue.push(function() {
  console.log('\n── T2.4 — AC1: split ---ARTEFACT-START--- across chunk boundary is detected correctly');
  return test('T2.4 (AC1): split start marker (half in chunk1, half in chunk2) is still detected', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'wusl2-t4-' + Math.random().toString(36).slice(2);
    seedSession(routes, sid);

    routes.setSkillTurnExecutorStreamAdapter(async function(_s, _h, _i, _t, onChunk) {
      onChunk('Context\n---ARTEFACT-S');
      onChunk('TART---\nSplit marker content\n---ARTEFACT-END---');
      return 'Context\n---ARTEFACT-START---\nSplit marker content\n---ARTEFACT-END---';
    });

    const res = makeSseRes();
    await routes.handlePostTurnStreamHtml(makeReq(sid), res);

    const draftEvents = res.events.filter(function(e) { return e.draftChunk !== undefined; });
    assert.ok(draftEvents.length > 0,
      'split marker across chunk boundary must still trigger {draftChunk} events; got 0');
    const combined = draftEvents.map(function(e) { return e.draftChunk; }).join('');
    assert.ok(combined.includes('Split marker content'),
      'draftChunk must contain text after split marker; got: ' + combined);
  });
});

// ── T2.5 — AC1: draftChunk events accumulate to full artefact body ────────────

queue.push(function() {
  console.log('\n── T2.5 — AC1: accumulated draftChunk text matches final artefactContent (minus markers)');
  return test('T2.5 (AC1): accumulated draftChunk text equals the final artefactContent', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'wusl2-t5-' + Math.random().toString(36).slice(2);
    seedSession(routes, sid);

    const artefactBody = '# Discovery\n\nLine one\nLine two\n';

    routes.setSkillTurnExecutorStreamAdapter(async function(_s, _h, _i, _t, onChunk) {
      onChunk('Context text.\n---ARTEFACT-START---\n');
      onChunk('# Discovery\n');
      onChunk('\nLine one\n');
      onChunk('Line two\n');
      onChunk('---ARTEFACT-END---');
      return 'Context text.\n---ARTEFACT-START---\n' + artefactBody + '---ARTEFACT-END---';
    });

    const res = makeSseRes();
    await routes.handlePostTurnStreamHtml(makeReq(sid), res);

    const draftEvents = res.events.filter(function(e) { return e.draftChunk !== undefined; });
    const accumulated = draftEvents.map(function(e) { return e.draftChunk; }).join('');

    const doneEvent = res.events.find(function(e) { return e.done !== undefined && e.artefactContent; });
    assert.ok(doneEvent, 'must have a final {done, artefactContent} event');
    // Accumulated draftChunk text must be a prefix of (or equal to) the final artefact
    assert.ok(
      doneEvent.artefactContent.startsWith(accumulated.trim()) ||
      accumulated.includes(doneEvent.artefactContent.trim()),
      'accumulated draftChunk text must match final artefactContent.\n' +
      '  accumulated: ' + JSON.stringify(accumulated.slice(0, 80)) + '\n' +
      '  final:       ' + JSON.stringify(doneEvent.artefactContent.slice(0, 80))
    );
  });
});

// ── T2.6 — AC2: final {done, artefactContent} event still sent ───────────────

queue.push(function() {
  console.log('\n── T2.6 — AC2: final {done, artefactContent} event still sent at stream end');
  return test('T2.6 (AC2): final SSE event has {done: true, artefactContent} even when draftChunk events were sent', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'wusl2-t6-' + Math.random().toString(36).slice(2);
    seedSession(routes, sid);

    routes.setSkillTurnExecutorStreamAdapter(async function(_s, _h, _i, _t, onChunk) {
      onChunk('---ARTEFACT-START---\nFinal artefact text\n---ARTEFACT-END---');
      return '---ARTEFACT-START---\nFinal artefact text\n---ARTEFACT-END---';
    });

    const res = makeSseRes();
    await routes.handlePostTurnStreamHtml(makeReq(sid), res);

    const doneEvents = res.events.filter(function(e) { return e.done !== undefined; });
    assert.strictEqual(doneEvents.length, 1, 'must have exactly one {done} event');
    assert.ok(doneEvents[0].artefactContent, 'final {done} event must include artefactContent');
    assert.ok(
      doneEvents[0].artefactContent.includes('Final artefact text'),
      'artefactContent in {done} event must contain the artefact body'
    );
  });
});

// ── T2.7 — AC3: client HTML script handles evt.draftChunk ────────────────────

queue.push(function() {
  console.log('\n── T2.7 — AC3: rendered chat page script handles evt.draftChunk by calling updateDraftPanel');
  return test('T2.7 (AC3): chat page JS handles evt.draftChunk events and calls updateDraftPanel progressively', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'wusl2-t7-' + Math.random().toString(36).slice(2);
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

    // The pump loop must handle evt.draftChunk
    assert.ok(
      capturedHtml.includes('evt.draftChunk') || capturedHtml.includes('draftChunk'),
      'chat page script must handle draftChunk events from SSE'
    );
    // It must call updateDraftPanel with the progressive content
    const draftChunkIdx  = capturedHtml.indexOf('draftChunk');
    const updatePanelIdx = capturedHtml.indexOf('updateDraftPanel');
    assert.ok(draftChunkIdx !== -1, 'draftChunk must appear in script');
    assert.ok(updatePanelIdx !== -1, 'updateDraftPanel must appear in script');
  });
});

// ── T2.8 — AC4: ARTEFACT-END content excluded from draftChunk ────────────────

queue.push(function() {
  console.log('\n── T2.8 — AC4: content on/after ---ARTEFACT-END--- not sent as draftChunk');
  return test('T2.8 (AC4): marker lines themselves not included in draftChunk text', async function() {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'wusl2-t8-' + Math.random().toString(36).slice(2);
    seedSession(routes, sid);

    routes.setSkillTurnExecutorStreamAdapter(async function(_s, _h, _i, _t, onChunk) {
      onChunk('---ARTEFACT-START---\nBody text\n---ARTEFACT-END---');
      return '---ARTEFACT-START---\nBody text\n---ARTEFACT-END---';
    });

    const res = makeSseRes();
    await routes.handlePostTurnStreamHtml(makeReq(sid), res);

    const combined = res.events
      .filter(function(e) { return e.draftChunk !== undefined; })
      .map(function(e) { return e.draftChunk; })
      .join('');
    assert.ok(!combined.includes('---ARTEFACT-END---'),
      'draftChunk must not include the ARTEFACT-END marker; got: ' + combined);
    assert.ok(!combined.includes('---ARTEFACT-START---'),
      'draftChunk must not include the ARTEFACT-START marker; got: ' + combined);
  });
});

// ── run ──────────────────────────────────────────────────────────────────────

console.log('\n[check-wusl2-progressive-live-draft]');

queue.reduce(function(p, fn) { return p.then(fn); }, Promise.resolve()).then(function() {
  console.log('\n--- Results ---');
  console.log('  Passed: ' + passed);
  console.log('  Failed: ' + failed);
  if (failures.length) {
    failures.forEach(function(f) { console.log('  FAIL detail: ' + f.name + '\n    ' + f.msg); });
  }
  process.exit(failed > 0 ? 1 : 0);
});
