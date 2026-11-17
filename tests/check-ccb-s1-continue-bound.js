'use strict';
/**
 * check-ccb-s1-continue-bound.js -- ccb-s1 (issue #1148): the chat page bounds its hidden "continue" turns.
 *
 * The page re-sends a hidden "continue" turn whenever a streamed turn is not done and its text has no "?" (or the
 * server says it was truncated). It had no bound, so a reply without a question mark chained turns forever with the
 * send button disabled. These tests run the REAL page script (extracted from the real handleGetChatHtml render) in
 * jsdom against the REAL stream handler; only the model call is stubbed, scripted per test. Same harness as
 * check-icv-s1-ideate-canvas-turn2-render-fix.js.
 *
 * Covers (docs: artefacts/2026-11-18-chat-continue-bound/test-plans/ccb-s1-test-plan.md):
 *   T1a/T1b AC1  no-question replies: at most 2 hidden continues, then input enabled and a notice
 *   T2a/T2b AC2  truncated replies: at most 5; a chain that finishes within the cap is unchanged
 *   T3      AC3  an identical continue stops the chain at once
 *   T4      AC4  the operator's own message resets the count
 *   T5a-c   AC5  a "?" reply, a done reply and an ideate reply send no continue
 *
 * Run: node tests/check-ccb-s1-continue-bound.js
 */

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');
const { JSDOM } = require('jsdom');

const routes = require(path.resolve(__dirname, '../src/web-ui/routes/skills.js'));

// Never create a real git commit or leave artefact files (see check-icv-s1's harness notes).
routes.setSkillTurnGitCommitAdapter(function ccbS1NoOpGitCommit() { /* no-op in this test file */ });
const TEST_ARTEFACT_SLUG = 'zzz-test-ccb-s1-disposable-artefact';
const TEST_ARTEFACT_DIR  = path.resolve(__dirname, '..', 'artefacts', TEST_ARTEFACT_SLUG);
function cleanupTestArtefact() { try { fs.rmSync(TEST_ARTEFACT_DIR, { recursive: true, force: true }); } catch (_) { /* best-effort */ } }

const NOTICE = 'Stopped asking the model to continue';

let passed = 0;
let failed = 0;
function test(name, fn) {
  return Promise.resolve().then(fn)
    .then(function() { passed++; console.log('  PASS: ' + name); })
    .catch(function(err) { failed++; console.log('  FAIL: ' + name + '\n       ' + (err && err.message ? err.message : String(err))); });
}

function noopRes() {
  const chunks = [];
  return { _chunks: chunks, writeHead: function() {}, write: function(d) { chunks.push(d); }, end: function(d) { if (d) chunks.push(d); } };
}

function extractMainScript(html) {
  const marker = 'var form    = document.getElementById("chat-form");';
  const idx = html.indexOf(marker);
  assert.ok(idx !== -1, 'expected the chat-form client script to be present in the rendered HTML');
  const start = html.lastIndexOf('<script>', idx);
  const end   = html.indexOf('</script>', idx);
  return html.slice(start + '<script>'.length, end);
}

async function buildPage(sessionId, skillName) {
  const res = noopRes();
  await routes.handleGetChatHtml({ session: { accessToken: 'tok', login: 'test-user' }, params: { name: skillName, id: sessionId } }, res);
  const html = res._chunks.join('');
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/skills/' + skillName + '/sessions/' + sessionId });
  const win = dom.window;
  win.TextDecoder = TextDecoder;
  win.TextEncoder = TextEncoder;
  win.fetch = function(url, opts) {
    const body = JSON.parse((opts && opts.body) || '{}');
    const streamRes = noopRes();
    return routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'tok', login: 'test-user' }, params: { name: skillName, id: sessionId }, body: body }, streamRes
    ).then(function() {
      const bytes = new TextEncoder().encode(streamRes._chunks.join(''));
      let served = false;
      return {
        ok: true,
        body: { getReader: function() { return { read: function() {
          if (served) return Promise.resolve({ done: true, value: undefined });
          served = true; return Promise.resolve({ done: false, value: bytes });
        } }; } },
        headers: { get: function() { return 'text/event-stream'; } }
      };
    });
  };
  win.eval(extractMainScript(html));
  return dom;
}

const settle = function(ms) { return new Promise(function(r) { setTimeout(r, ms || 400); }); };
let seq = 0;
function uniqueId(label) { seq++; return 'test-ccb-s1-' + label + '-' + seq + '-' + Math.random().toString(36).slice(2); }

/**
 * Stubs the model call with a scripted reply per call: replyFor(callNumber) returns
 * { text, truncated? }. Returns a counter object { calls, inputs }.
 */
function scriptModel(replyFor) {
  const state = { calls: 0, inputs: [] };
  routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
    state.calls++;
    state.inputs.push(input);
    const r = replyFor(state.calls);
    onFirstChunk(0);
    onChunk(r.text);
    return Promise.resolve({ text: r.text, usage: { model: 'stub', stop_reason: r.truncated ? 'max_tokens' : 'end_turn' } });
  });
  return state;
}

function newSession(skillName) {
  const sid = uniqueId(skillName);
  routes._setHtmlSession(sid, {
    skillName: skillName, sessionPath: '/tmp/t', systemPrompt: '# ' + skillName,
    turns: [], artefactContent: null, artefactPath: null, done: false,
    journeyId: null, assumptionCardsEnabled: skillName === 'ideate'
  });
  return sid;
}
// The thread's visible text only: the page's own inline <script> text contains the notice string and must not count.
function threadText(dom) {
  const clone = dom.window.document.body.cloneNode(true);
  Array.prototype.forEach.call(clone.querySelectorAll('script, style'), function(n) { n.remove(); });
  return clone.textContent;
}
function submitBtn(dom) { return dom.window.document.querySelector('#chat-form button[type="submit"]'); }
function noticeCount(dom) { return threadText(dom).split(NOTICE).length - 1; }
function sendAsOperator(dom, text) {
  const doc = dom.window.document;
  doc.getElementById('chat-input').value = text;
  doc.getElementById('chat-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}

const queue = [];

// T1a / T1b -- AC1: replies with no question mark and not truncated.
queue.push(function() {
  console.log('\n-- AC1 -- a reply with no "?" is followed by at most 2 hidden continues, then the input is back and the operator is told');
  return test('T1a/T1b: statement replies -> 3 turns in all, button enabled, last reply visible, notice shown once', async function() {
    const sid = newSession('discovery');
    const model = scriptModel(function(n) { return { text: 'Statement number ' + n + ' with nothing to answer.' }; });
    const dom = await buildPage(sid, 'discovery');
    try {
      await settle(2500);
      assert.strictEqual(model.calls, 3, 'expected 3 turns in all (the first plus 2 hidden continues), got ' + model.calls + ' (unbounded before this change)');
      assert.strictEqual(submitBtn(dom).disabled, false, 'the send button must be enabled once the chain stops');
      assert.ok(threadText(dom).indexOf('Statement number 3') !== -1 || threadText(dom).indexOf('Statement number 1') !== -1, 'the replies must stay visible');
      assert.strictEqual(noticeCount(dom), 1, 'the notice must appear exactly once, got ' + noticeCount(dom));
    } finally { dom.window.close(); }
  });
});

// T2a -- AC2: truncated replies, each different: first turn + 5 continues.
queue.push(function() {
  console.log('\n-- AC2 -- truncated replies may continue up to 5 times');
  return test('T2a: truncated, different replies -> 6 turns in all, then the input is back with the notice', async function() {
    const sid = newSession('discovery');
    const model = scriptModel(function(n) { return { text: 'Long artefact part ' + n + ' of many.', truncated: true }; });
    const dom = await buildPage(sid, 'discovery');
    try {
      await settle(3500);
      assert.strictEqual(model.calls, 6, 'expected 6 turns in all (the first plus 5 hidden continues), got ' + model.calls);
      assert.strictEqual(submitBtn(dom).disabled, false, 'the send button must be enabled once the chain stops');
      assert.strictEqual(noticeCount(dom), 1, 'the notice must appear once, got ' + noticeCount(dom));
    } finally { dom.window.close(); }
  });
});

// T2b -- AC2: two truncated replies, then a done reply with an artefact: unchanged, no notice.
queue.push(function() {
  return test('T2b: two truncated replies then a done reply -> 3 turns, the artefact is shown, no notice', async function() {
    const sid = newSession('discovery');
    const model = scriptModel(function(n) {
      if (n < 3) return { text: 'Part ' + n + ' of the artefact so far.', truncated: true };
      return { text: 'Finished.\n---ARTEFACT-START---\n# Disposable ccb-s1 artefact\n\nBody.\n---ARTEFACT-END---\n---SLUG---\n' + TEST_ARTEFACT_SLUG };
    });
    const dom = await buildPage(sid, 'discovery');
    try {
      await settle(2500);
      assert.strictEqual(model.calls, 3, 'expected 3 turns, got ' + model.calls);
      assert.strictEqual(noticeCount(dom), 0, 'no notice may appear when the chain finishes within the cap');
    } finally { dom.window.close(); cleanupTestArtefact(); }
  });
});

// T3 -- AC3: an identical continue stops the chain at once.
queue.push(function() {
  console.log('\n-- AC3 -- an identical reply stops the chain');
  return test('T3: the second reply equals the first -> 2 turns only, notice shown', async function() {
    const sid = newSession('discovery');
    const model = scriptModel(function() { return { text: 'The very same statement every time.' }; });
    const dom = await buildPage(sid, 'discovery');
    try {
      await settle(2000);
      assert.strictEqual(model.calls, 2, 'expected 2 turns (stop on the identical reply), got ' + model.calls);
      assert.strictEqual(submitBtn(dom).disabled, false);
      assert.strictEqual(noticeCount(dom), 1);
    } finally { dom.window.close(); }
  });
});

// T4 -- AC4: the operator's own message resets the count.
queue.push(function() {
  console.log('\n-- AC4 -- the operator\'s message restarts the count');
  return test('T4: after the cap, a typed message gets its own first turn plus up to 2 continues', async function() {
    const sid = newSession('discovery');
    const model = scriptModel(function(n) { return { text: 'Statement number ' + n + ' with nothing to answer.' }; });
    const dom = await buildPage(sid, 'discovery');
    try {
      await settle(2500);
      assert.strictEqual(model.calls, 3, 'precondition: the first chain stops at 3, got ' + model.calls);
      sendAsOperator(dom, 'Please carry on with the next part.');
      await settle(2500);
      assert.strictEqual(model.calls, 6, 'expected 3 more turns (the operator\'s plus 2 continues), got ' + (model.calls - 3));
      assert.strictEqual(model.inputs[3], 'Please carry on with the next part.', 'the 4th turn must be the operator\'s message');
    } finally { dom.window.close(); }
  });
});

// T5a-c -- AC5: unchanged cases send no continue.
queue.push(function() {
  console.log('\n-- AC5 -- replies that should not continue still do not');
  return test('T5a: a reply ending in a question -> 1 turn, button enabled, no notice', async function() {
    const sid = newSession('discovery');
    const model = scriptModel(function() { return { text: 'Which users does this serve?' }; });
    const dom = await buildPage(sid, 'discovery');
    try {
      await settle(1200);
      assert.strictEqual(model.calls, 1, 'expected 1 turn, got ' + model.calls);
      assert.strictEqual(submitBtn(dom).disabled, false);
      assert.strictEqual(noticeCount(dom), 0);
    } finally { dom.window.close(); }
  });
});
queue.push(function() {
  return test('T5b: a done reply -> 1 turn, no notice', async function() {
    const sid = newSession('discovery');
    const model = scriptModel(function() {
      return { text: 'Here you go.\n---ARTEFACT-START---\n# Disposable ccb-s1 artefact\n\nBody.\n---ARTEFACT-END---\n---SLUG---\n' + TEST_ARTEFACT_SLUG };
    });
    const dom = await buildPage(sid, 'discovery');
    try {
      await settle(1200);
      assert.strictEqual(model.calls, 1, 'expected 1 turn, got ' + model.calls);
      assert.strictEqual(noticeCount(dom), 0);
    } finally { dom.window.close(); cleanupTestArtefact(); }
  });
});
queue.push(function() {
  return test('T5c: an ideate session with a statement reply -> 1 turn (icv-s1\'s exemption), no notice', async function() {
    const sid = newSession('ideate');
    const model = scriptModel(function() { return { text: 'An opportunity map, stated plainly.' }; });
    const dom = await buildPage(sid, 'ideate');
    try {
      await settle(1200);
      assert.strictEqual(model.calls, 1, 'expected 1 turn, got ' + model.calls);
      assert.strictEqual(noticeCount(dom), 0);
    } finally { dom.window.close(); }
  });
});

(async function() {
  console.log('ccb-s1 -- bound the chat page\'s hidden "continue" turns\n');
  for (const run of queue) { await run(); }
  cleanupTestArtefact();
  console.log('\nccb-s1: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
