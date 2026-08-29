'use strict';
/**
 * check-s2-mermaid-syntax-diagnostic.js -- S2: a mermaid render failure
 * surfaces the specific (first-line) reason mermaid reported, instead of a
 * generic "[label] diagram failed to render" with the reason discarded.
 *
 * Reuses the exact real-render jsdom harness pattern established by
 * csd-s1/csd-s2's own test files (buildPage/extractMainScript/diagramMarker)
 * -- not a source-string grep, and not a "was a function reference assigned"
 * check (D37 wiring-test discipline, CLAUDE.md).
 *
 * Run: node tests/check-s2-mermaid-syntax-diagnostic.js
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

const { MINIMAL_DATA_MODEL_MERMAID } = require('./fixtures/csd-s1/data-model-fixtures');
const { MINIMAL_SYSTEM_ARCHITECTURE_MERMAID } = require('./fixtures/csd-s2/system-architecture-fixtures');
const { MINIMAL_PROGRAM_DESIGN_MERMAID } = require('./fixtures/csd-s2/program-design-fixtures');
const { MALFORMED_MERMAID_SYNTAX } = require('./fixtures/csd-s2/malformed-mermaid-fixture');

routes.setSkillTurnGitCommitAdapter(function s2NoOpGitCommitTestMode() { /* no-op */ });

let passed = 0;
let failed = 0;

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(function() { passed++; console.log('  PASS: ' + name); })
    .catch(function(err) {
      failed++;
      const msg = err && err.message ? err.message : String(err);
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
function uniqueId(label) { seq++; return 'test-s2-' + label + '-' + seq + '-' + Math.random().toString(36).slice(2); }

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

  const consoleErrorCalls = [];
  const originalConsoleError = win.console.error.bind(win.console);
  win.console.error = function() {
    consoleErrorCalls.push(Array.prototype.slice.call(arguments));
    originalConsoleError.apply(null, arguments);
  };

  const mermaidRunCalls = [];
  const runImpl = opts.mermaidRunImpl || function() { return Promise.resolve(); };
  win.mermaid = {
    initialize: function() {},
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
  return { dom: dom, mermaidRunCalls: mermaidRunCalls, consoleErrorCalls: consoleErrorCalls };
}

function settle(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms || 500); });
}

function diagramMarker(type, mermaidSrc, title) {
  return '---CANVAS-JSON: ' + JSON.stringify({ type: type, title: title || type, content: { mermaid: mermaidSrc } }) + '---';
}

const queue = [];

// ── AC1 (2 tests) — the error box shows mermaid's own first-line reason ─────
queue.push(function runAC1a() {
  console.log('\n-- AC1 -- mermaidRenderFailureSurfacesMermaidsOwnReason');
  return test('the error box text includes mermaid\'s specific first-line reason, not just "failed to render"', async function() {
    const sid = uniqueId('ac1a');
    const text = 'Broken diagram.\n\n' + diagramMarker('data-model', MALFORMED_MERMAID_SYNTAX) + '\n\nThoughts?';
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      onFirstChunk(0); onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });
    const { dom } = await buildPage(sid, {
      mermaidRunImpl: function() { return Promise.reject(new Error('Parse error on line 2')); }
    });
    try {
      await settle();
      const errorBox = dom.window.document.querySelector('#canvas-panel .cv-diagram-error-box');
      assert.ok(errorBox, 'expected a labelled error box');
      assert.ok(/Parse error on line 2/.test(errorBox.textContent), 'expected the error box to include mermaid\'s specific reason');
    } finally { dom.window.close(); }
  });
});

queue.push(function runAC1b() {
  return test('the specific reason is logged to the console for developer diagnosis', async function() {
    const sid = uniqueId('ac1b');
    const text = 'Broken diagram.\n\n' + diagramMarker('data-model', MALFORMED_MERMAID_SYNTAX) + '\n\nThoughts?';
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      onFirstChunk(0); onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });
    const { dom, consoleErrorCalls } = await buildPage(sid, {
      mermaidRunImpl: function() { return Promise.reject(new Error('Parse error on line 2')); }
    });
    try {
      await settle();
      const loggedSomething = consoleErrorCalls.some(function(args) {
        return args.some(function(a) { return typeof a === 'string' && a.indexOf('Parse error on line 2') !== -1; });
      });
      assert.ok(loggedSomething, 'expected console.error to have captured the specific reason');
    } finally { dom.window.close(); }
  });
});

// ── AC2 (1 test) — the reason is real text content, not colour-only ─────────
queue.push(function runAC2() {
  console.log('\n-- AC2 -- errorReasonAvailableViaTextAlternativeNotColourAlone');
  return test('the reason is present as real text content within the error box, not conveyed by colour/class alone', async function() {
    const sid = uniqueId('ac2');
    const text = 'Broken diagram.\n\n' + diagramMarker('system-architecture', MALFORMED_MERMAID_SYNTAX) + '\n\nThoughts?';
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      onFirstChunk(0); onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });
    const { dom } = await buildPage(sid, {
      mermaidRunImpl: function() { return Promise.reject(new Error('Lexical error on line 1')); }
    });
    try {
      await settle();
      const errorBox = dom.window.document.querySelector('#canvas-panel .cv-diagram-error-box');
      assert.ok(errorBox, 'expected an error box');
      assert.notStrictEqual(errorBox.textContent.trim(), '', 'error box text must not be empty');
      assert.ok(/Lexical error on line 1/.test(errorBox.textContent), 'the reason must be present as real text content');
    } finally { dom.window.close(); }
  });
});

// ── NFR-Performance (1 test) — no additional mermaid.run() call ─────────────
queue.push(function runPerf() {
  console.log('\n-- NFR-Performance -- mermaidRenderFailureAddsNoLatency');
  return test('mermaid.run() is called exactly once per node -- no additional call to capture the reason', async function() {
    const sid = uniqueId('perf');
    const text = 'Broken diagram.\n\n' + diagramMarker('data-model', MALFORMED_MERMAID_SYNTAX) + '\n\nThoughts?';
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      onFirstChunk(0); onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });
    const { dom, mermaidRunCalls } = await buildPage(sid, {
      mermaidRunImpl: function() { return Promise.reject(new Error('boom')); }
    });
    try {
      await settle();
      assert.strictEqual(mermaidRunCalls.length, 1, 'expected exactly one mermaid.run() call for the single diagram node');
    } finally { dom.window.close(); }
  });
});

// ── NFR-Security (1 test) — reason text is escaped before DOM insertion ─────
queue.push(function runSec() {
  console.log('\n-- NFR-Security -- errorReasonTextIsEscapedBeforeDomInsertion');
  return test('a script-like rejection reason is escaped, not inserted as executable markup', async function() {
    const sid = uniqueId('sec');
    const text = 'Broken diagram.\n\n' + diagramMarker('data-model', MALFORMED_MERMAID_SYNTAX) + '\n\nThoughts?';
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      onFirstChunk(0); onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });
    const { dom } = await buildPage(sid, {
      mermaidRunImpl: function() { return Promise.reject(new Error('<img src=x onerror=alert(1)>')); }
    });
    try {
      await settle();
      const errorBox = dom.window.document.querySelector('#canvas-panel .cv-diagram-error-box');
      assert.ok(errorBox, 'expected an error box');
      assert.strictEqual(errorBox.querySelectorAll('img').length, 0, 'the reason text must not produce a real <img> element (must be escaped, not raw HTML)');
      assert.ok(/onerror=alert\(1\)/.test(errorBox.textContent), 'the escaped text should still be visible as literal text');
    } finally { dom.window.close(); }
  });
});

// ── AC3 (1 test) — sibling isolation is preserved ────────────────────────────
queue.push(function runAC3() {
  console.log('\n-- AC3 -- siblingDiagramRendersSuccessfullyDespiteNeighbourFailure');
  return test('one diagram\'s render failure does not affect a sibling diagram\'s successful render', async function() {
    const sid = uniqueId('ac3');
    const text = 'Two diagrams.\n\n' +
      diagramMarker('data-model', MALFORMED_MERMAID_SYNTAX, 'Broken One') + '\n\n' +
      diagramMarker('system-architecture', MINIMAL_SYSTEM_ARCHITECTURE_MERMAID, 'Working One') +
      '\n\nThoughts?';
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      onFirstChunk(0); onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });
    const { dom } = await buildPage(sid, {
      mermaidRunImpl: function(runOpts) {
        var node = runOpts.nodes[0];
        var label = node.getAttribute('data-diagram-label') || '';
        if (label === 'Data Model') { return Promise.reject(new Error('Parse error on line 1')); }
        return Promise.resolve();
      }
    });
    try {
      await settle();
      const brokenBlock  = dom.window.document.querySelector('#canvas-panel .canvas-block[data-block-type="data-model"]');
      const workingBlock = dom.window.document.querySelector('#canvas-panel .canvas-block[data-block-type="system-architecture"]');
      assert.ok(brokenBlock, 'expected the broken data-model block to render its outer shell');
      assert.ok(workingBlock, 'expected the working system-architecture block to render');

      assert.ok(brokenBlock.querySelector('.cv-diagram-error-box'), 'expected the broken diagram to show an error box');
      assert.ok(!workingBlock.querySelector('.cv-diagram-error-box'), 'the working diagram must NOT show an error box just because its sibling failed');
      assert.ok(workingBlock.querySelector('.mermaid') && !workingBlock.querySelector('.mermaid').classList.contains('cv-diagram-error'), 'the working diagram\'s node must not be marked as errored');
    } finally { dom.window.close(); }
  });
});

// ── AC4 (1 test) — successful renders unchanged across all 3 types ──────────
queue.push(function runAC4() {
  console.log('\n-- AC4 -- successfulRendersUnchangedAcrossAll3MermaidTypes');
  return test('all 3 mermaid-based types still render successfully with no error UI', async function() {
    const sid = uniqueId('ac4');
    const text = 'Three good diagrams.\n\n' +
      diagramMarker('data-model', MINIMAL_DATA_MODEL_MERMAID, 'DM') + '\n\n' +
      diagramMarker('system-architecture', MINIMAL_SYSTEM_ARCHITECTURE_MERMAID, 'SA') + '\n\n' +
      diagramMarker('program-design', MINIMAL_PROGRAM_DESIGN_MERMAID, 'PD') +
      '\n\nThoughts?';
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      onFirstChunk(0); onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });
    const { dom } = await buildPage(sid, {
      mermaidRunImpl: function() { return Promise.resolve(); }
    });
    try {
      await settle();
      ['data-model', 'system-architecture', 'program-design'].forEach(function(type) {
        const block = dom.window.document.querySelector('#canvas-panel .canvas-block[data-block-type="' + type + '"]');
        assert.ok(block, 'expected the ' + type + ' block to render');
        assert.ok(!block.querySelector('.cv-diagram-error-box'), 'expected no error box for a successfully-rendering ' + type + ' diagram');
        assert.ok(block.querySelector('.mermaid') && !block.querySelector('.mermaid').classList.contains('cv-diagram-error'), type + ' node must not be marked as errored');
      });
    } finally { dom.window.close(); }
  });
});

async function main() {
  for (const fn of queue) { await fn(); }
  console.log('\n[s2-mermaid-syntax-diagnostic] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  if (failed > 0) { process.exit(1); }
}
main().catch(function(err) { console.error('[s2] Unexpected error:', err.message); process.exit(1); });
