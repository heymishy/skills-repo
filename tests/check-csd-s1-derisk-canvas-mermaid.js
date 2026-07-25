'use strict';
/**
 * check-csd-s1-derisk-canvas-mermaid.js -- csd-s1: prove the /ideate canvas's
 * content-block dispatch mechanism can render a real, hand-authored Data
 * Model mermaid diagram, extending the existing cluster-tree/table/text
 * dispatch (ADR-026) rather than building a parallel rendering path.
 *
 * See:
 *   artefacts/2026-07-25-code-shape-diagrams/stories/csd-s1-derisk-canvas-mermaid.md
 *   artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s1-test-plan.md
 *   artefacts/2026-07-25-code-shape-diagrams/dor/csd-s1-dor-contract.md
 *
 * Implements this story's 8 non-E2E tests (4 unit, 2 integration, 2 NFR).
 * AC2 (visual legibility of a realistic 5+-entity diagram) is covered
 * separately by tests/e2e/csd-s1-data-model-diagram.spec.js (Playwright,
 * real browser -- required because legibility is CSS-layout-dependent and
 * cannot be verified in jsdom, per this story's test plan gap-table entry).
 *
 * Follows the exact real-render harness pattern established by
 * tests/check-icv-s1-ideate-canvas-turn2-render-fix.js: builds a REAL page
 * via handleGetChatHtml(), extracts the actual generated client script, and
 * evaluates it in jsdom against a REAL handlePostTurnStreamHtml() call per
 * turn (only the model call itself is stubbed) -- not a source-string grep,
 * and not a "was a function reference assigned" check (D37 wiring-test
 * discipline, CLAUDE.md): mermaid.run() is asserted to have actually been
 * invoked with the real, newly-appended diagram node.
 *
 * Run: node tests/check-csd-s1-derisk-canvas-mermaid.js
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
const ROUTES_SRC = fs.readFileSync(ROUTES_PATH, 'utf8');

const {
  MINIMAL_DATA_MODEL_MERMAID
} = require('./fixtures/csd-s1/data-model-fixtures');

// stis-s1 pattern: never let a real git commit fire from this test file
// (routes/skills.js's default adapter is the real one when server.js is
// never booted). ideate turns never emit ARTEFACT-START/END so this is
// belt-and-braces, matching check-icv-s1's own precedent.
routes.setSkillTurnGitCommitAdapter(function csdS1NoOpGitCommitTestMode() { /* no-op */ });

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

let seq = 0;
function uniqueId(label) { seq++; return 'test-csd-s1-' + label + '-' + seq + '-' + Math.random().toString(36).slice(2); }

/**
 * Build a jsdom window from a real handleGetChatHtml() render (skillName
 * always 'ideate' -- the only canvas consumer today), stub window.mermaid
 * BEFORE evaluating the extracted script (mermaid.initialize() runs at
 * IIFE-eval time; appendCanvasBlock calls mermaid.run() synchronously per
 * appended block), and wire a fetch stub that routes every POST into the
 * REAL handlePostTurnStreamHtml (only the model call is stubbed).
 * @param {string} sessionId
 * @param {object} [opts]
 * @param {Array} [opts.canvasBlocks] pre-seeded session.canvasBlocks (hydration path)
 * @param {object} [opts.mermaidStub] override for window.mermaid
 * @returns {Promise<{dom: object, mermaidRunCalls: Array}>}
 */
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
  win.mermaid = opts.mermaidStub || {
    initialize: function(cfg) { mermaidInitCalls.push(cfg); },
    run: function(runOpts) { mermaidRunCalls.push(runOpts); return Promise.resolve(); }
  };

  // jsdom's runScripts:'outside-only' never executes the HTML's OTHER inline
  // <script> tags (only whatever we explicitly dom.window.eval() below) --
  // that includes canvasBlocksInitScript's own
  // `<script>window.__SW_INITIAL_CANVAS_BLOCKS__=[...];</script>` tag. A
  // real browser would have run it before the main script; replicate that
  // one specific effect here so the real initial-hydration branch inside the
  // extracted main script (`if (IS_IDEATE && typeof
  // __SW_INITIAL_CANVAS_BLOCKS__ !== "undefined" ...)`) is genuinely
  // exercised rather than skipped.
  if (opts.canvasBlocks && opts.canvasBlocks.length) {
    win.__SW_INITIAL_CANVAS_BLOCKS__ = opts.canvasBlocks;
  }

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
  return { dom: dom, mermaidRunCalls: mermaidRunCalls, mermaidInitCalls: mermaidInitCalls };
}

function settle(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms || 500); });
}

const CLUSTER_MARKER = '---CANVAS-JSON: {"type":"cluster-tree","title":"Opportunity map","content":{"clusters":["Capture problem"]}}---';
const TABLE_MARKER   = '---CANVAS-JSON: {"type":"table","title":"Options","content":{"headers":["Option","Score"],"rows":[["A","3"]]}}---';
const TEXT_MARKER    = '---CANVAS-JSON: {"type":"text","title":"Summary","content":{"paragraphs":["A summary paragraph."]}}---';
function dataModelMarker(mermaidSrc, title) {
  return '---CANVAS-JSON: ' + JSON.stringify({ type: 'data-model', title: title || 'Data model', content: { mermaid: mermaidSrc } }) + '---';
}

const queue = [];

// ── Unit 1 (AC1) — data-model block renders as a mermaid diagram, not raw text ──
queue.push(function runUnit1() {
  console.log('\n-- Unit 1 (AC1) -- rendersDataModelBlockAsMermaidNotRawText');
  return test('a data-model block renders a real .mermaid element (mermaid.run invoked with it), not plain text', async function() {
    const sid = uniqueId('u1');
    const text = 'Here is the data model.\n\n' + dataModelMarker(MINIMAL_DATA_MODEL_MERMAID, 'Data model') + '\n\nLet me know what you think.';
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      onFirstChunk(0);
      onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });

    const { dom, mermaidRunCalls } = await buildPage(sid);
    try {
      await settle();

      const block = dom.window.document.querySelector('#canvas-panel .canvas-block[data-block-type="data-model"]');
      assert.ok(block, 'expected a .canvas-block[data-block-type="data-model"] element to be present');

      const mermaidEl = block.querySelector('.mermaid');
      assert.ok(mermaidEl, 'expected a .mermaid element inside the data-model block (mermaid\'s own rendering-target convention)');
      assert.ok(!block.querySelector('.cv-text'), 'a data-model block must NOT fall through to the plain-text (.cv-text) renderer -- that would be "raw text", not a diagram');

      assert.strictEqual(mermaidRunCalls.length, 1, 'expected mermaid.run() to be invoked exactly once for the appended data-model block');
      const runNodes = mermaidRunCalls[0].nodes;
      assert.ok(Array.isArray(runNodes) && runNodes.length === 1 && runNodes[0] === mermaidEl,
        'mermaid.run() must be invoked with the actual, real appended .mermaid DOM node -- not just any node, and not skipped');

      assert.ok(mermaidEl.textContent.indexOf('PRODUCTS') !== -1 && mermaidEl.textContent.indexOf('FEATURES') !== -1,
        'the .mermaid element must contain the real fixture\'s mermaid source (entity names present), proving genuine content flowed through, not a stub');
    } finally {
      dom.window.close();
    }
  });
});

// ── Unit 2 (AC1) — new type doesn't break existing dispatch for other types ──
queue.push(function runUnit2() {
  console.log('\n-- Unit 2 (AC1) -- newBlockTypeDoesNotBreakExistingDispatchForOtherTypes');
  return test('a data-model block alongside an existing cluster-tree block: both render correctly, cluster-tree dispatch unaffected', async function() {
    const sid = uniqueId('u2');
    const text = 'Combined output.\n\n' + dataModelMarker(MINIMAL_DATA_MODEL_MERMAID) + '\n\n' + CLUSTER_MARKER + '\n\nThoughts?';
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      onFirstChunk(0);
      onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });

    const { dom } = await buildPage(sid);
    try {
      await settle();
      const blocks = dom.window.document.querySelectorAll('#canvas-panel .canvas-block');
      assert.strictEqual(blocks.length, 2, 'expected exactly 2 canvas blocks (data-model + cluster-tree)');

      assert.strictEqual(blocks[0].getAttribute('data-block-type'), 'data-model', 'first block should be the data-model block (marker order preserved)');
      assert.ok(blocks[0].querySelector('.mermaid'), 'first block should render a .mermaid element');

      assert.strictEqual(blocks[1].getAttribute('data-block-type'), 'cluster-tree', 'second block should be the cluster-tree block');
      const treeWrap = blocks[1].querySelector('.cv-tree-wrap');
      assert.ok(treeWrap, 'cluster-tree block must still render its existing .cv-tree-wrap structure, unaffected by the new type existing');
      assert.ok(treeWrap.textContent.indexOf('Capture problem') !== -1, 'cluster-tree content must render correctly (no cross-contamination between block types)');
    } finally {
      dom.window.close();
    }
  });
});

// ── Unit 3 (AC4) — dispatch follows the same if/else-if pattern, no parallel path ──
queue.push(function runUnit3() {
  console.log('\n-- Unit 3 (AC4) -- dispatchMechanismUsesSameSwitchPatternAsExistingTypes');
  return test('the data-model case is chained into the SAME if/else-if dispatch as cluster-tree/table/text -- no parallel rendering function', function() {
    const fnStart = ROUTES_SRC.indexOf('function renderCanvasBlock');
    assert.ok(fnStart !== -1, 'expected function renderCanvasBlock to exist in routes/skills.js');
    const fnBody = ROUTES_SRC.slice(fnStart, fnStart + 4000);

    // Same dispatch shape: an unbroken if / else-if / else-if / else-if chain,
    // in this exact order, all inside renderCanvasBlock's own body -- not a
    // separately-defined renderDataModelBlock function called out to.
    const dispatchChainRe = /if\s*\(type === "cluster-tree"\)[\s\S]*?}\s*else if\s*\(type === "table"\)[\s\S]*?}\s*else if\s*\(type === "text"\)[\s\S]*?}\s*else if\s*\(type === "data-model"\)/;
    assert.ok(dispatchChainRe.test(fnBody), 'expected an unbroken if/else-if chain ending in the new data-model branch, immediately following the text branch, inside renderCanvasBlock itself');

    assert.ok(!/function\s+renderDataModelBlock/.test(ROUTES_SRC), 'must NOT introduce a separate renderDataModelBlock (or similarly named parallel) rendering function -- ADR-026 requires extending the existing dispatch, not building a parallel path');

    // Server-side gate (parseCanvasBlock's TYPE_ALLOW) extended in lockstep,
    // same symmetry the other 3 types already have between the two allowlists.
    const parseFnStart = ROUTES_SRC.indexOf('function parseCanvasBlock');
    const parseFnBody = ROUTES_SRC.slice(parseFnStart, parseFnStart + 800);
    assert.ok(/TYPE_ALLOW\s*=\s*\[[^\]]*'data-model'[^\]]*\]/.test(parseFnBody), 'expected parseCanvasBlock\'s TYPE_ALLOW to include \'data-model\', matching the client dispatch\'s new case');

    // Functional confirmation of the same allowlist, via the real exported function.
    const parsed = routes.parseCanvasBlock('---CANVAS-JSON: {"type":"data-model","title":"x","content":{"mermaid":"erDiagram"}}---');
    assert.ok(parsed !== null, 'parseCanvasBlock must accept a valid data-model marker');
    assert.strictEqual(parsed.type, 'data-model');
  });
});

// ── Unit 4 (AC4 edge case) — unrecognised diagram type is a graceful no-op ──
queue.push(function runUnit4() {
  console.log('\n-- Unit 4 (AC4 edge case) -- dispatchMechanismRejectsUnknownDiagramTypeGracefully');
  return test('a genuinely unrecognised block type (not one of the 4 known types) does not crash the page and renders as a no-op, matching existing behaviour', async function() {
    const sid = uniqueId('u4');
    // Seeded directly into session.canvasBlocks (the initial-hydration path,
    // which -- unlike the live SSE marker path -- is NOT gated by
    // parseCanvasBlock's TYPE_ALLOW) to exercise the client dispatch itself
    // with a type it has never seen, e.g. a not-yet-wired future diagram
    // type or genuinely unknown data.
    const { dom } = await buildPage(sid, {
      canvasBlocks: [{ type: 'not-a-real-type', title: 'Mystery block', content: {} }]
    });
    try {
      await settle(200);
      // No throw during page eval/hydration is itself part of the assertion
      // (buildPage would have thrown if dom.window.eval threw synchronously).
      const block = dom.window.document.querySelector('#canvas-panel .canvas-block[data-block-type="not-a-real-type"]');
      assert.ok(block, 'expected the unrecognised-type block to still render its outer .canvas-block shell (head/tag), matching existing no-op behaviour for unknown types');
      const body = block.querySelector('.canvas-block-body');
      assert.ok(body, 'expected a .canvas-block-body element to exist');
      assert.strictEqual(body.innerHTML.trim(), '', 'an unrecognised type must render an EMPTY body (no-op) -- not a crash, not fallback raw text');
    } finally {
      dom.window.close();
    }
  });
});

// ── Integration 1 (AC1, AC3) — mixed block types in one coherent payload ──
queue.push(function runIntegration1() {
  console.log('\n-- Integration 1 (AC1, AC3) -- canvasRendersMixedBlockTypesInOneCoherentPayload');
  return test('a single turn with data-model + cluster-tree + table + text markers renders all 4, in order, each correctly, no cross-contamination', async function() {
    const sid = uniqueId('i1');
    const text = [
      'Combined lens output.',
      dataModelMarker(MINIMAL_DATA_MODEL_MERMAID),
      CLUSTER_MARKER,
      TABLE_MARKER,
      TEXT_MARKER,
      'Let me know what resonates.'
    ].join('\n\n');
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      onFirstChunk(0);
      onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });

    const { dom } = await buildPage(sid);
    try {
      await settle();
      const blocks = dom.window.document.querySelectorAll('#canvas-panel .canvas-block');
      assert.strictEqual(blocks.length, 4, 'expected exactly 4 canvas blocks');

      const types = Array.prototype.map.call(blocks, function(b) { return b.getAttribute('data-block-type'); });
      assert.deepStrictEqual(types, ['data-model', 'cluster-tree', 'table', 'text'], 'blocks must render in the exact order the markers appeared in the turn text');

      assert.ok(blocks[0].querySelector('.mermaid'), 'block 1 (data-model) must render a .mermaid element');
      assert.ok(blocks[1].querySelector('.cv-tree-wrap'), 'block 2 (cluster-tree) must render its tree structure');
      assert.ok(blocks[2].querySelector('.cv-table'), 'block 3 (table) must render its table structure');
      assert.ok(blocks[3].querySelector('.cv-text'), 'block 4 (text) must render its paragraph structure');

      // No cross-contamination: only the data-model block has a .mermaid element.
      assert.strictEqual(dom.window.document.querySelectorAll('#canvas-panel .mermaid').length, 1, 'only the data-model block should contain a .mermaid element');
    } finally {
      dom.window.close();
    }
  });
});

// ── Integration 2 (AC3) — existing cluster/table/text fixtures still pass unmodified ──
queue.push(function runIntegration2() {
  console.log('\n-- Integration 2 (AC3) -- existingClusterTableParagraphFixturesStillPassAfterDiagramTypeAdded');
  return test('the pre-existing cluster-tree/table/text fixtures (unmodified) still parse and render exactly as before -- zero regression from adding data-model', async function() {
    // Same fixture shapes as tests/check-inc4-canvas-panel.js's own T1
    // (parseCanvasBlock) coverage -- re-asserted here, unmodified, against
    // the real exported function after this story's TYPE_ALLOW change.
    const clusterParsed = routes.parseCanvasBlock('---CANVAS-JSON: {"type":"cluster-tree","title":"Opp Map","content":{"clusters":[]}}---');
    assert.ok(clusterParsed !== null, 'cluster-tree marker must still parse');
    assert.strictEqual(clusterParsed.type, 'cluster-tree');

    const tableParsed = routes.parseCanvasBlock('---CANVAS-JSON: {"type":"table","title":"T","content":{}}---');
    assert.ok(tableParsed !== null, '"table" must still be a valid type');

    const textParsed = routes.parseCanvasBlock('---CANVAS-JSON: {"type":"text","title":"T","content":{}}---');
    assert.ok(textParsed !== null, '"text" must still be a valid type');

    // Invalid/unknown types must still be rejected exactly as before (T3 in
    // check-inc4-canvas-panel.js) -- "diagram" (as opposed to "data-model")
    // was never a valid type and must remain rejected.
    assert.strictEqual(routes.parseCanvasBlock('---CANVAS-JSON: {"type":"diagram","title":"x","content":{}}---'), null, '"diagram" (generic, not "data-model") must remain an invalid type -- unchanged from before this story');

    // Full render, no data-model block present at all -- proves the legacy
    // rendering path is byte-for-byte unaffected by this story's change.
    const sid = uniqueId('i2');
    const text = 'Legacy-only output.\n\n' + CLUSTER_MARKER + '\n\n' + TABLE_MARKER + '\n\n' + TEXT_MARKER + '\n\nThoughts?';
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      onFirstChunk(0);
      onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });
    const { dom } = await buildPage(sid);
    try {
      await settle();
      const blocks = dom.window.document.querySelectorAll('#canvas-panel .canvas-block');
      assert.strictEqual(blocks.length, 3, 'expected exactly 3 legacy blocks, none of them a data-model block');
      assert.strictEqual(dom.window.document.querySelectorAll('#canvas-panel .mermaid').length, 0, 'no .mermaid element should appear when no data-model block is present');
    } finally {
      dom.window.close();
    }
  });
});

// ── NFR 1 (Security / MC-SEC-01) — mermaid securityLevel disables HTML injection ──
queue.push(function runNfr1() {
  console.log('\n-- NFR 1 (Security, MC-SEC-01) -- mermaidSecurityLevelDisablesHtmlInjection');
  return test('mermaid.initialize() is called with securityLevel "strict" (or "sandbox") -- never "loose"/"antiscript"/left at a permissive default', async function() {
    const sid = uniqueId('nfr1');
    const { dom, mermaidInitCalls } = await buildPage(sid);
    try {
      assert.ok(mermaidInitCalls.length >= 1, 'expected window.mermaid.initialize() to be called at least once during page script evaluation');
      const cfg = mermaidInitCalls[0];
      assert.ok(cfg && typeof cfg === 'object', 'expected an initialize() config object');
      assert.ok(['strict', 'sandbox'].indexOf(cfg.securityLevel) !== -1,
        'securityLevel must be "strict" or "sandbox" (mermaid\'s documented safe values) -- got ' + JSON.stringify(cfg.securityLevel));
      assert.notStrictEqual(cfg.securityLevel, 'loose', 'securityLevel must never be "loose" (permits raw HTML + click-triggered script bindings)');
      assert.notStrictEqual(cfg.securityLevel, 'antiscript', 'securityLevel must never be "antiscript" (still permits click-triggered bindings)');

      // Source-level confirmation: the literal config object in the shipped
      // script, not just what our stub happened to record.
      const html = require('../src/web-ui/routes/skills'); // no-op require to keep lints happy about single-use var below
      void html;
      const initCallSrc = ROUTES_SRC.slice(ROUTES_SRC.indexOf('window.mermaid.initialize'), ROUTES_SRC.indexOf('window.mermaid.initialize') + 200);
      assert.ok(/securityLevel:\s*"strict"|securityLevel:\s*'strict'/.test(initCallSrc) || /securityLevel:\s*"sandbox"|securityLevel:\s*'sandbox'/.test(initCallSrc),
        'expected the literal securityLevel value in the source to be "strict" or "sandbox"');
    } finally {
      dom.window.close();
    }
  });
});

// ── NFR 2 (Accessibility) — text-alternative fallback for the rendered diagram ──
queue.push(function runNfr2() {
  console.log('\n-- NFR 2 (Accessibility) -- diagramHasTextAlternativeFallback');
  return test('a rendered data-model block exposes the raw mermaid source as an accessible text alternative (details/pre + aria-label)', async function() {
    const sid = uniqueId('nfr2');
    const text = 'Diagram.\n\n' + dataModelMarker(MINIMAL_DATA_MODEL_MERMAID) + '\n\nThoughts?';
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      onFirstChunk(0);
      onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });

    const { dom } = await buildPage(sid);
    try {
      await settle();
      const block = dom.window.document.querySelector('#canvas-panel .canvas-block[data-block-type="data-model"]');
      assert.ok(block, 'expected the data-model block to render');

      const mermaidEl = block.querySelector('.mermaid');
      assert.ok(mermaidEl, 'expected a .mermaid element');
      assert.strictEqual(mermaidEl.getAttribute('role'), 'img', 'the diagram container should be marked role="img" for assistive tech');
      assert.ok(mermaidEl.getAttribute('aria-label'), 'expected a non-empty aria-label on the diagram container');

      const srcEl = block.querySelector('.cv-diagram-src');
      assert.ok(srcEl, 'expected a .cv-diagram-src text-alternative element');
      assert.ok(srcEl.textContent.indexOf('PRODUCTS') !== -1 && srcEl.textContent.indexOf('FEATURES') !== -1,
        'the text-alternative element must contain the actual raw mermaid source (entity names present), not a placeholder');

      const detailsEl = block.querySelector('details.cv-diagram-alt');
      assert.ok(detailsEl, 'expected the text alternative to live inside a <details> disclosure (present in the accessibility tree regardless of visual collapse state)');
      assert.ok(detailsEl.querySelector('summary'), 'expected a <summary> label for the disclosure');
    } finally {
      dom.window.close();
    }
  });
});

(async function run() {
  console.log('csd-s1 -- De-risk the /ideate canvas diagram mechanism with a real Data Model mermaid example\n');
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
