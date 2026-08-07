'use strict';
/**
 * check-icv-s1-ideate-canvas-turn2-render-fix.js -- icv-s1: stop the /ideate chat
 * client from auto-firing an unbounded chain of hidden "continue" turns, which
 * duplicated canvas blocks without limit and left the submit button disabled
 * so a real second user turn never registered (AC3 of
 * tests/e2e/a3-product-feature-ideate-canvas.spec.js, a real staging failure --
 * see artefacts/2026-07-23-ideate-canvas-turn2-render-fix/decisions.md).
 *
 * ROOT CAUSE (confirmed by direct code + real CI log inspection, not a mock/
 * fixture-design gap): `_renderChatPage`'s inline client script
 * (src/web-ui/routes/skills.js) auto-fires a hidden "continue" turn whenever
 * a turn's streamed text has no "?" AND no ARTEFACT-START/END marker (added in
 * a10b32a3, "artefact generation -- no hold turns + auto-nudge client when
 * model announces without asking"). That heuristic is correct for
 * artefact-generating skills (discovery/definition/etc. -- buildSystemPrompt's
 * "ARTEFACT GENERATION" instruction guarantees every turn ends in either the
 * artefact or a literal question). /ideate has neither guarantee: it is a
 * standalone, conversational, per-turn exchange that never emits
 * ARTEFACT-START/END and can legitimately end a turn with a suggestion/
 * statement instead of a literal "?" (exactly what
 * tests/e2e/fixtures/llm-gateway/ideate.success.json's own fixture text does).
 * Applying the heuristic to ideate anyway fired an unbounded chain of hidden
 * "continue" turns against the same static turn content -- each one pushing a
 * duplicate canvas block with no cap -- while leaving the submit button
 * disabled indefinitely (only re-enabled by the "done" or "has a '?'"
 * branches, neither of which the ideate fixture ever satisfies).
 *
 * This test exercises the REAL generated client script (extracted from a real
 * handleGetChatHtml() render, evaluated in jsdom -- not a source-string
 * grep) against a REAL handlePostTurnStreamHtml() call per fetch, proving the
 * actual, observable, differentiating behaviour (D37 wiring-test discipline):
 *
 *   AC1: an /ideate turn whose response has no "?" and no artefact marker
 *        fires exactly ONE executor call (no hidden "continue" chain) and
 *        renders exactly ONE canvas block.
 *   AC2: after that single turn, the submit button is re-enabled (proving the
 *        session is not stuck waiting on a "continue" that never resolves).
 *   AC3: a genuine second user turn (a real, visible form submit) renders a
 *        SECOND, additional canvas block -- proving the canvas panel grows
 *        turn-over-turn instead of freezing, matching the real E2E AC3 intent.
 *   AC4: the a10b32a3 auto-continue nudge is NOT removed for artefact-
 *        generating skills -- a discovery-shaped turn with no "?" and no
 *        artefact marker still auto-fires exactly one hidden "continue" call,
 *        proving this fix is ideate-specific, not a blanket regression.
 *
 * Run: node tests/check-icv-s1-ideate-canvas-turn2-render-fix.js
 */

process.env.NODE_ENV             = process.env.NODE_ENV || 'test';
process.env.SESSION_SECRET       = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = process.env.GITHUB_CLIENT_ID || 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'test-secret';
process.env.GITHUB_CALLBACK_URL  = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback';
process.env.WUCE_REPOSITORIES    = process.env.WUCE_REPOSITORIES || 'test-owner/test-repo';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');
const { JSDOM } = require('jsdom');

const ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
const routes = require(ROUTES_PATH);

// stis-s1 pattern (see server.js's NODE_ENV==='test' block): this test file
// requires routes/skills.js directly and never boots server.js, so the
// default (real) git-commit adapter is never replaced by server.js's own
// no-op wiring. AC4's contrast case deliberately produces a real
// ---ARTEFACT-START---/---ARTEFACT-END--- turn, which would otherwise fire a
// REAL `git commit` into this checkout -- exactly the "Junk commit
// contamination" pattern documented in this repo's workspace/learnings.md.
// No-op it here explicitly so this test can never create a real commit.
routes.setSkillTurnGitCommitAdapter(function icvS1NoOpGitCommitTestMode() { /* no-op in this test file */ });

// AC4's contrast case must produce a real ---ARTEFACT-START---/---ARTEFACT-END---
// turn to prove the a10b32a3 nudge still terminates for artefact-generating
// skills -- the real handler auto-saves that to disk. Pin an obviously
// disposable slug (never a bare dated slug like today's date) so this test
// can never collide with a real artefacts/YYYY-MM-DD-discovery/ directory.
const TEST_ARTEFACT_SLUG = 'zzz-test-icv-s1-disposable-artefact';
const TEST_ARTEFACT_DIR  = path.resolve(__dirname, '..', 'artefacts', TEST_ARTEFACT_SLUG);
function cleanupTestArtefact() {
  try { fs.rmSync(TEST_ARTEFACT_DIR, { recursive: true, force: true }); } catch (_) { /* best-effort */ }
}

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(function() { passed++; console.log('  PASS: ' + name); })
    .catch(function(err) {
      failed++;
      const msg = err && err.message ? err.message : String(err);
      failures.push({ name: name, msg: msg });
      console.log('  FAIL: ' + name + '\n       ' + msg);
    });
}

function noopRes() {
  const chunks = [];
  return {
    _chunks: chunks,
    writeHead: function() {},
    write: function(d) { chunks.push(d); },
    end: function(d) { if (d) { chunks.push(d); } }
  };
}

/** Extract just the DOM-update client script IIFE (not the whole page's other <script> tags). */
function extractMainScript(html) {
  const marker = 'var form    = document.getElementById("chat-form");';
  const idx = html.indexOf(marker);
  assert.ok(idx !== -1, 'expected the chat-form client script to be present in the rendered HTML');
  const start = html.lastIndexOf('<script>', idx);
  const end   = html.indexOf('</script>', idx);
  assert.ok(start !== -1 && end !== -1, 'expected to find enclosing <script>...</script> tags');
  return html.slice(start + '<script>'.length, end);
}

/**
 * Build a jsdom window from a real handleGetChatHtml() render, wire a fetch
 * stub that routes every POST straight into the REAL handlePostTurnStreamHtml
 * (so the executor stub, marker-scanning, and SSE framing are all genuine,
 * production code -- only the model call itself is stubbed), and evaluate the
 * real extracted client script inside it.
 */
async function buildPage(sessionId, skillName) {
  const res = noopRes();
  await routes.handleGetChatHtml(
    { session: { accessToken: 'tok', login: 'test-user' }, params: { name: skillName, id: sessionId } },
    res
  );
  const html = res._chunks.join('');
  const scriptSrc = extractMainScript(html);

  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/skills/' + skillName + '/sessions/' + sessionId });
  const win = dom.window;
  win.TextDecoder = TextDecoder;
  win.TextEncoder = TextEncoder;

  win.fetch = function(url, opts) {
    const body = JSON.parse((opts && opts.body) || '{}');
    const streamRes = noopRes();
    return routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'tok', login: 'test-user' }, params: { name: skillName, id: sessionId }, body: body },
      streamRes
    ).then(function() {
      const text  = streamRes._chunks.join('');
      const bytes = new TextEncoder().encode(text);
      let served  = false;
      return {
        ok: true,
        body: {
          getReader: function() {
            return {
              read: function() {
                if (served) { return Promise.resolve({ done: true, value: undefined }); }
                served = true;
                return Promise.resolve({ done: false, value: bytes });
              }
            };
          }
        },
        headers: { get: function() { return 'text/event-stream'; } }
      };
    });
  };

  dom.window.eval(scriptSrc);
  return dom;
}

function settle(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms || 400); });
}

const queue = [];
let seq = 0;
function uniqueId(label) { seq++; return 'test-icv-s1-' + label + '-' + seq + '-' + Math.random().toString(36).slice(2); }

// -- AC1/AC2 -- ideate: one turn, no "?" and no artefact marker in the response
// -> exactly one executor call, exactly one canvas block, submit re-enabled.
queue.push(function runAC1AC2() {
  console.log('\n-- AC1/AC2 -- /ideate: a turn with no "?" and no artefact marker does not auto-continue');
  return test('AC1/AC2: ideate turn 1 fires exactly one executor call, renders exactly one canvas block, and re-enables the submit button', async function() {
    const sid = uniqueId('ac1');
    routes._setHtmlSession(sid, {
      skillName: 'ideate', sessionPath: '/tmp/t', systemPrompt: '# ideate',
      turns: [], artefactContent: null, artefactPath: null, done: false,
      journeyId: null, assumptionCardsEnabled: true
    });

    let calls = 0;
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      calls++;
      const text = 'Here is an opportunity map.\n\n---CANVAS-JSON: {"type":"cluster-tree","title":"Opportunity map","content":{"clusters":["A"]}}---\n\nLet me know what resonates.';
      onFirstChunk(0);
      onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });

    const dom = await buildPage(sid, 'ideate');
    try {
      // The page auto-fires sendTurn("__init__") via setTimeout(0) since the
      // thread starts empty -- this IS that first, real turn.
      await settle(600);

      assert.strictEqual(calls, 1, 'expected exactly 1 executor call after ideate turn 1 settles -- got ' + calls + ' (a value > 1 means the hidden "continue" auto-nudge fired for ideate, reproducing the runaway-duplication bug)');

      const blocks = dom.window.document.querySelectorAll('#canvas-panel .canvas-block');
      assert.strictEqual(blocks.length, 1, 'expected exactly 1 .canvas-block after ideate turn 1 -- got ' + blocks.length);

      const submitBtn = dom.window.document.querySelector('#chat-form button[type="submit"]');
      assert.ok(submitBtn, 'submit button must exist');
      assert.strictEqual(submitBtn.disabled, false, 'submit button must be re-enabled after a single ideate turn completes -- if still disabled, the client is still waiting on a "continue" chain that will never resolve (the runaway-loop bug)');
    } finally {
      // Pre-fix, this scenario is a genuine infinite loop -- close the window
      // to cancel its pending timers so it cannot bleed executor calls into
      // later tests (they share the module-level executor-adapter stub).
      dom.window.close();
    }
  });
});

// -- AC3 -- a genuine second, visible user turn renders a second canvas block
queue.push(function runAC3() {
  console.log('\n-- AC3 -- /ideate: a genuine second user turn renders an additional canvas block (canvas grows, not frozen)');
  return test('AC3: a real second form submit on an ideate session adds a NEW canvas block without any hidden continuation calls', async function() {
    const sid = uniqueId('ac3');
    routes._setHtmlSession(sid, {
      skillName: 'ideate', sessionPath: '/tmp/t', systemPrompt: '# ideate',
      turns: [], artefactContent: null, artefactPath: null, done: false,
      journeyId: null, assumptionCardsEnabled: true
    });

    let calls = 0;
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      calls++;
      const text = 'Turn ' + calls + ' opportunity content.\n\n---CANVAS-JSON: {"type":"cluster-tree","title":"Lens ' + calls + '","content":{"clusters":["A"]}}---\n\nLet me know what resonates.';
      onFirstChunk(0);
      onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });

    const dom = await buildPage(sid, 'ideate');
    try {
      await settle(600); // turn 1 (auto-fired __init__) settles

      const afterTurn1 = dom.window.document.querySelectorAll('#canvas-panel .canvas-block').length;
      assert.strictEqual(afterTurn1, 1, 'expected exactly 1 canvas block after turn 1, got ' + afterTurn1);
      assert.strictEqual(calls, 1, 'expected exactly 1 executor call after turn 1, got ' + calls);

      // Real turn 2 -- a genuine, visible form submission.
      const doc = dom.window.document;
      doc.getElementById('chat-input').value = 'Let\'s focus on the capture problem first.';
      const form = doc.getElementById('chat-form');
      const submitEvent = new dom.window.Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
      await settle(600);

      assert.strictEqual(calls, 2, 'expected exactly 2 executor calls total after a genuine second submit -- got ' + calls + ' (more than 2 means a hidden "continue" chain is still firing)');
      const afterTurn2 = doc.querySelectorAll('#canvas-panel .canvas-block').length;
      assert.strictEqual(afterTurn2, 2, 'expected canvas block count to grow to 2 after turn 2 -- got ' + afterTurn2 + ' (frozen at 1 reproduces the real AC3 staging failure)');
    } finally {
      dom.window.close();
    }
  });
});

// -- AC4 -- contrast case: the a10b32a3 auto-continue nudge must still fire
// for artefact-generating skills (e.g. discovery) -- this fix must be
// ideate-specific, not a blanket removal of the nudge.
queue.push(function runAC4() {
  console.log('\n-- AC4 -- non-ideate (discovery): the original auto-continue-on-no-"?" nudge is unaffected by this fix');
  return test('AC4: a discovery turn with no "?" and no artefact marker still auto-fires exactly one hidden continuation call', async function() {
    const sid = uniqueId('ac4');
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery',
      turns: [], artefactContent: null, artefactPath: null, done: false,
      journeyId: null, assumptionCardsEnabled: true
    });

    let calls = 0;
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      calls++;
      // First call: announces intent, no "?", no artefact marker (this is the
      // exact shape a10b32a3 was written to nudge past). Second call (the
      // hidden "continue"): produces the artefact, ending the chain.
      // Note: a fullText match against ---ARTEFACT-START---/---ARTEFACT-END---
      // makes the real handler auto-save to disk at artefacts/<slug>/discovery.md.
      // Pin an explicit, obviously-disposable test slug via ---SLUG--- so this
      // never collides with (and overwrites) a real dated artefact directory
      // such as artefacts/YYYY-MM-DD-discovery/ -- cleaned up in the finally block.
      const text = calls === 1
        ? 'One moment while I compile this.'
        : '---SLUG---\n' + TEST_ARTEFACT_SLUG + '\n---ARTEFACT-START---\nFull artefact content.\n---ARTEFACT-END---';
      onFirstChunk(0);
      onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });

    const dom = await buildPage(sid, 'discovery');
    try {
      await settle(800); // turn 1 + the expected hidden "continue" both need to settle
      assert.strictEqual(calls, 2, 'expected exactly 2 executor calls (the real turn + the a10b32a3 hidden continuation) for a non-ideate skill -- got ' + calls + '. This fix must gate the nudge behind IS_IDEATE only, not remove it for artefact-generating skills.');
    } finally {
      dom.window.close();
      cleanupTestArtefact();
    }
  });
});

(async function run() {
  console.log('icv-s1 -- Stop /ideate from auto-firing an unbounded "continue" chain that duplicates canvas blocks and freezes turn 2\n');
  cleanupTestArtefact(); // in case a prior interrupted run left the disposable test artefact behind
  for (const fn of queue) { await fn(); }
  console.log('\n-----------------------------------------');
  console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailed tests:');
    failures.forEach(function(f) { console.log('  x ' + f.name + '\n    ' + f.msg); });
    process.exit(1);
  } else {
    console.log('\nAll tests passed.');
    process.exit(0);
  }
})();
