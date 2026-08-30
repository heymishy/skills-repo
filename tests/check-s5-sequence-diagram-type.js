#!/usr/bin/env node
// check-s5-sequence-diagram-type.js -- S5: add the Sequence diagram type,
// conditionally emitted, to the shared canvas-block rendering mechanism.
//
// Story:     artefacts/2026-08-29-diagram-validation-and-types/stories/s5-sequence-diagram-type.md
// Test plan: artefacts/2026-08-29-diagram-validation-and-types/test-plans/s5-sequence-diagram-type-test-plan.md
//
// Coverage:
//   AC3 (unit) -- sequence renders via the shared buildDiagramBodyHtml mechanism
//   AC3 (unit) -- render-failure diagnostics fire identically to the 3 existing types (live session)
//   AC4 (unit) -- read-only history view renders identically to the live view
//   AC5 (unit) -- "sequence" is present in parseCanvasBlock's TYPE_ALLOW
//   NFR (performance/security/accessibility)
//
// Follows the real-render harness pattern established by csd-s1/csd-s2's own
// tests (builds a REAL page via handleGetChatHtml(), extracts the actual
// generated client script, evaluates it in jsdom against a REAL
// handlePostTurnStreamHtml() call -- only the model call itself is stubbed).

'use strict';

process.env.NODE_ENV             = process.env.NODE_ENV || 'test';
process.env.SESSION_SECRET       = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = process.env.GITHUB_CLIENT_ID || 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'test-secret';
process.env.GITHUB_CALLBACK_URL  = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback';
process.env.WUCE_REPOSITORIES    = process.env.WUCE_REPOSITORIES || 'test-owner/test-repo';

const assert = require('assert');
const { JSDOM } = require('jsdom');

const routes = require('../src/web-ui/routes/skills');
const { MINIMAL_SEQUENCE_MERMAID } = require('./fixtures/s5/sequence-fixtures');
const { MALFORMED_MERMAID_SYNTAX } = require('./fixtures/csd-s2/malformed-mermaid-fixture');

// stis-s1 pattern: never let a real git commit fire from this test file.
routes.setSkillTurnGitCommitAdapter(function s5NoOpGitCommitTestMode() { /* no-op */ });

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

function extractMainScript(html) {
  const marker = 'var form    = document.getElementById("chat-form");';
  const idx = html.indexOf(marker);
  assert.ok(idx !== -1, 'expected the chat-form client script to be present in the rendered HTML');
  const start = html.lastIndexOf('<script>', idx);
  const end   = html.indexOf('</script>', idx);
  assert.ok(start !== -1 && end !== -1, 'expected to find enclosing <script>...</script> tags');
  return html.slice(start + '<script>'.length, end);
}

let seq = 0;
function uniqueId(label) { seq++; return 'test-s5-' + label + '-' + seq + '-' + Math.random().toString(36).slice(2); }

async function buildPage(sessionId, opts) {
  opts = opts || {};
  routes._setHtmlSession(sessionId, {
    skillName: 'ideate', sessionPath: '/tmp/t', systemPrompt: '# ideate',
    turns: [], artefactContent: null, artefactPath: null, done: false,
    journeyId: null, assumptionCardsEnabled: true,
    canvasBlocks: opts.canvasBlocks || []
  });

  const res = noopRes();
  await routes.handleGetChatHtml(
    { session: { accessToken: 'tok', login: 'test-user' }, params: { name: 'ideate', id: sessionId } },
    res
  );
  const html = res._chunks.join('');
  const scriptSrc = extractMainScript(html);

  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/skills/ideate/sessions/' + sessionId + '/chat' });
  const win = dom.window;
  win.TextDecoder = TextDecoder;
  win.TextEncoder = TextEncoder;

  const mermaidRunCalls = [];
  const mermaidInitCalls = [];
  const runImpl = opts.mermaidRunImpl || function() { return Promise.resolve(); };
  win.mermaid = {
    initialize: function(cfg) { mermaidInitCalls.push(cfg); },
    run: function(runOpts) { mermaidRunCalls.push(runOpts); return runImpl(runOpts); }
  };

  win.fetch = function(url, fopts) {
    const body = JSON.parse((fopts && fopts.body) || '{}');
    const streamRes = noopRes();
    return routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'tok', login: 'test-user' }, params: { name: 'ideate', id: sessionId }, body: body },
      streamRes
    ).then(function() {
      const text  = streamRes._chunks.join('');
      const bytes = new TextEncoder().encode(text);
      let served  = false;
      return {
        ok: true,
        body: { getReader: function() {
          return { read: function() {
            if (served) { return Promise.resolve({ done: true, value: undefined }); }
            served = true;
            return Promise.resolve({ done: false, value: bytes });
          } };
        } },
        headers: { get: function() { return 'text/event-stream'; } }
      };
    });
  };

  dom.window.eval(scriptSrc);
  return { dom: dom, mermaidRunCalls: mermaidRunCalls, mermaidInitCalls: mermaidInitCalls };
}

function settle(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms || 500); });
}

function diagramMarker(type, mermaidSrc, title) {
  return '---CANVAS-JSON: ' + JSON.stringify({ type: type, title: title || type, content: { mermaid: mermaidSrc } }) + '---';
}

const queue = [];

// ── Unit (AC5) — "sequence" is present in TYPE_ALLOW ──
queue.push(function runAc5() {
  console.log('\n-- AC5 -- typeAllowIncludesSequence');
  return test('a sequence-type marker is parsed successfully, not rejected as disallowed', function() {
    const parsed = routes.parseCanvasBlock(diagramMarker('sequence', MINIMAL_SEQUENCE_MERMAID, 'Sequence'));
    assert.ok(parsed !== null, 'expected a sequence-type marker to parse successfully');
    assert.strictEqual(parsed.type, 'sequence');
  });
});

// ── Unit (AC3) — sequence renders via the shared buildDiagramBodyHtml mechanism ──
queue.push(function runAc3Render() {
  console.log('\n-- AC3 -- sequenceTypeRendersViaSharedBuildDiagramBodyHtml');
  return test('a sequence-type block renders with the "Sequence" label via the same shared mechanism as the 3 existing diagram types', async function() {
    const sid = uniqueId('ac3-render');
    const text = 'Here is the interaction.\n\n' + diagramMarker('sequence', MINIMAL_SEQUENCE_MERMAID, 'Sequence') + '\n\nThoughts?';
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      onFirstChunk(0);
      onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });

    const { dom } = await buildPage(sid);
    try {
      await settle();
      const block = dom.window.document.querySelector('#canvas-panel .canvas-block[data-block-type="sequence"]');
      assert.ok(block, 'expected a .canvas-block[data-block-type="sequence"] element to be present');

      const labelEl = block.querySelector('.cv-diagram-type-label');
      assert.ok(labelEl, 'expected a visible .cv-diagram-type-label element');
      assert.strictEqual(labelEl.textContent, 'Sequence', 'expected the visible label text to read "Sequence"');

      const mermaidEl = block.querySelector('.mermaid');
      assert.ok(mermaidEl, 'expected a .mermaid element inside the sequence block');

      const altEl = block.querySelector('details.cv-diagram-alt');
      assert.ok(altEl, 'expected the same text-alternative <details> element as the other 3 mermaid-based types');
    } finally {
      dom.window.close();
    }
  });
});

// ── Unit (AC3) — render-failure diagnostics fire identically, live session ──
queue.push(function runAc3Diagnostics() {
  console.log('\n-- AC3 -- sequenceTypeRenderFailureUsesS1S2DiagnosticsAutomatically');
  return test('a sequence-type block with invalid mermaid content shows the same labelled error box as the existing types, in a LIVE session (proves the live isDiagramBlock gate includes sequence, not just the shared render dispatch)', async function() {
    const sid = uniqueId('ac3-diag');
    const text = 'Broken interaction diagram.\n\n' + diagramMarker('sequence', MALFORMED_MERMAID_SYNTAX, 'Sequence') + '\n\nThoughts?';
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      onFirstChunk(0);
      onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });

    const { dom } = await buildPage(sid, {
      mermaidRunImpl: function() { return Promise.reject(new Error('Parse error on line 1: unexpected token')); }
    });
    try {
      await settle();
      const block = dom.window.document.querySelector('#canvas-panel .canvas-block[data-block-type="sequence"]');
      assert.ok(block, 'expected the sequence block to still render its outer shell');

      const mermaidEl = block.querySelector('.mermaid');
      assert.ok(mermaidEl, 'expected the .mermaid element to still exist after a failed render');
      assert.ok(mermaidEl.classList.contains('cv-diagram-error'), 'expected the .mermaid element to be marked with the cv-diagram-error class -- this only happens if mermaid.run() was actually invoked for this block in the LIVE script');

      const errorBox = block.querySelector('.cv-diagram-error-box');
      assert.ok(errorBox, 'expected a labelled .cv-diagram-error-box element, not a blank space');
      assert.ok(/sequence/i.test(errorBox.textContent), 'expected the error box to name the diagram type ("Sequence")');
      assert.ok(/failed to render/i.test(errorBox.textContent), 'expected the error box to state that rendering failed');
    } finally {
      dom.window.close();
    }
  });
});

// ── Unit (AC4) — read-only history view renders identically to the live view ──
queue.push(function runAc4() {
  console.log('\n-- AC4 -- readOnlyHistoryViewRendersSequenceBlockIdenticallyToLiveView');
  return test('the same sequence-type block renders with identical structure (type label, mermaid element, text-alternative) through both the live script and buildReadOnlyCanvasScript', async function() {
    const block = { type: 'sequence', title: 'Sequence', content: { mermaid: MINIMAL_SEQUENCE_MERMAID } };

    // Live view.
    const sid = uniqueId('ac4-live');
    const text = 'Interaction.\n\n' + diagramMarker('sequence', MINIMAL_SEQUENCE_MERMAID, 'Sequence') + '\n\nThoughts?';
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      onFirstChunk(0);
      onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });
    const { dom: liveDom } = await buildPage(sid);

    // Read-only view: a fresh jsdom with a #canvas-panel, running buildReadOnlyCanvasScript's output.
    const readOnlyHtml = '<!doctype html><html><body><div id="canvas-panel"></div>' + routes.buildReadOnlyCanvasScript([block]) + '</body></html>';
    const readOnlyDom = new JSDOM(readOnlyHtml, { runScripts: 'dangerously', url: 'http://localhost/readonly' });
    readOnlyDom.window.mermaid = { initialize: function() {}, run: function() { return Promise.resolve(); } };
    // JSDOM's runScripts:"dangerously" already executed the inline <script> once at parse time
    // using whatever window.mermaid existed then (undefined) -- re-run is unnecessary since
    // buildReadOnlyCanvasScript's mermaid calls are guarded by `if (window.mermaid...)` and the
    // DOM append (which is what this test asserts) already happened synchronously on parse.

    try {
      await settle();
      const liveBlock = liveDom.window.document.querySelector('#canvas-panel .canvas-block[data-block-type="sequence"]');
      const readOnlyBlock = readOnlyDom.window.document.querySelector('#canvas-panel .canvas-block[data-block-type="sequence"]');

      assert.ok(liveBlock, 'expected the live view to render a sequence canvas-block');
      assert.ok(readOnlyBlock, 'expected the read-only view to render a sequence canvas-block');

      assert.strictEqual(
        liveBlock.querySelector('.cv-diagram-type-label').textContent,
        readOnlyBlock.querySelector('.cv-diagram-type-label').textContent,
        'expected identical type-label text in both views'
      );
      assert.strictEqual(!!liveBlock.querySelector('.mermaid'), !!readOnlyBlock.querySelector('.mermaid'), 'expected a .mermaid element in both views');
      assert.strictEqual(!!liveBlock.querySelector('details.cv-diagram-alt'), !!readOnlyBlock.querySelector('details.cv-diagram-alt'), 'expected a text-alternative <details> element in both views');
      assert.strictEqual(liveBlock.getAttribute('data-block-type'), readOnlyBlock.getAttribute('data-block-type'), 'expected identical data-block-type attribute in both views');
    } finally {
      liveDom.window.close();
      readOnlyDom.window.close();
    }
  });
});

// ── NFR (Performance) — no new model/network call ──
queue.push(function runNfrPerf() {
  console.log('\n-- NFR (Performance) -- noNewModelOrNetworkCallForSequenceType');
  return test('rendering a sequence block introduces no model/executor call beyond the existing per-turn LLM call, and no extra network call', async function() {
    const sid = uniqueId('nfr-perf');
    const text = diagramMarker('sequence', MINIMAL_SEQUENCE_MERMAID, 'Sequence');
    let modelCallCount = 0;
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      modelCallCount++;
      onFirstChunk(0);
      onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });

    const { dom } = await buildPage(sid);
    try {
      await settle();
      assert.strictEqual(modelCallCount, 1, 'expected exactly the 1 existing per-turn model call, no additional call for rendering the sequence type');
    } finally {
      dom.window.close();
    }
  });
});

// ── NFR (Security) — same securityLevel: strict config, no per-type override ──
queue.push(function runNfrSecurity() {
  console.log('\n-- NFR (Security) -- sequenceMermaidCoveredBySameSecurityLevelStrict');
  return test('mermaid.initialize() is called exactly once and applies uniformly to the sequence type -- no per-type override', async function() {
    const sid = uniqueId('nfr-sec');
    const text = diagramMarker('sequence', MINIMAL_SEQUENCE_MERMAID, 'Sequence');
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      onFirstChunk(0);
      onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });

    const { dom, mermaidInitCalls } = await buildPage(sid);
    try {
      await settle();
      assert.strictEqual(mermaidInitCalls.length, 1, 'expected exactly one mermaid.initialize() call');
      const cfg = mermaidInitCalls[0];
      assert.ok(['strict', 'sandbox'].indexOf(cfg.securityLevel) !== -1, 'securityLevel must be "strict" or "sandbox"');
      assert.notStrictEqual(cfg.securityLevel, 'loose', 'securityLevel must never be "loose"');
    } finally {
      dom.window.close();
    }
  });
});

// ── NFR (Accessibility) — text-alternative present ──
queue.push(function runNfrA11y() {
  console.log('\n-- NFR (Accessibility) -- sequenceDiagramAccessibleViaSameTextAlternative');
  return test('a sequence block includes the same <details class="cv-diagram-alt"> text-alternative as the other 3 mermaid-based types', async function() {
    const sid = uniqueId('nfr-a11y');
    const text = diagramMarker('sequence', MINIMAL_SEQUENCE_MERMAID, 'Sequence');
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      onFirstChunk(0);
      onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });

    const { dom } = await buildPage(sid);
    try {
      await settle();
      const block = dom.window.document.querySelector('#canvas-panel .canvas-block[data-block-type="sequence"]');
      const alt = block.querySelector('details.cv-diagram-alt');
      assert.ok(alt, 'expected a details.cv-diagram-alt text-alternative element');
      assert.ok(/View diagram source/i.test(alt.querySelector('summary').textContent), 'expected the same summary text as the other diagram types');
      assert.ok(alt.querySelector('pre.cv-diagram-src').textContent.length > 0, 'expected the raw mermaid source to be present as the text alternative');
    } finally {
      dom.window.close();
    }
  });
});

(async function run() {
  console.log('s5-sequence-diagram-type -- Add the Sequence diagram type, conditionally emitted\n');
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
