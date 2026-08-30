'use strict';
/**
 * check-csd-s2-canvas-diagram-rendering.js -- csd-s2: production-harden the
 * /ideate canvas's diagram content-block mechanism (proven for one type by
 * csd-s1) to cover all three diagram types (data-model, system-architecture,
 * program-design), a labelled error-box state for malformed mermaid syntax,
 * "As Designed"/"As Built" label differentiation, and consistent security
 * config across all three types.
 *
 * See:
 *   artefacts/2026-07-25-code-shape-diagrams/stories/csd-s2-canvas-diagram-rendering.md
 *   artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s2-test-plan.md
 *   artefacts/2026-07-25-code-shape-diagrams/dor/csd-s2-dor-contract.md
 *
 * Implements this story's 7 non-E2E tests (4 unit, 1 integration, 2 NFR).
 * AC3 (visual distinguishability of side-by-side diagrams) and AC4 (keyboard
 * navigation) are CSS-layout-dependent and covered separately by
 * tests/e2e/csd-s2-canvas-diagram-rendering.spec.js (Playwright, real
 * browser), per this story's test plan gap-table entries.
 *
 * Follows the exact real-render harness pattern established by csd-s1's own
 * tests/check-csd-s1-derisk-canvas-mermaid.js: builds a REAL page via
 * handleGetChatHtml(), extracts the actual generated client script, and
 * evaluates it in jsdom against a REAL handlePostTurnStreamHtml() call per
 * turn (only the model call itself is stubbed) -- not a source-string grep,
 * and not a "was a function reference assigned" check (D37 wiring-test
 * discipline, CLAUDE.md).
 *
 * Run: node tests/check-csd-s2-canvas-diagram-rendering.js
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

const { MINIMAL_DATA_MODEL_MERMAID } = require('./fixtures/csd-s1/data-model-fixtures');
const { MINIMAL_SYSTEM_ARCHITECTURE_MERMAID } = require('./fixtures/csd-s2/system-architecture-fixtures');
const { MINIMAL_PROGRAM_DESIGN_MERMAID } = require('./fixtures/csd-s2/program-design-fixtures');
const { MALFORMED_MERMAID_SYNTAX } = require('./fixtures/csd-s2/malformed-mermaid-fixture');

// stis-s1 pattern: never let a real git commit fire from this test file.
routes.setSkillTurnGitCommitAdapter(function csdS2NoOpGitCommitTestMode() { /* no-op */ });

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
function uniqueId(label) { seq++; return 'test-csd-s2-' + label + '-' + seq + '-' + Math.random().toString(36).slice(2); }

/**
 * Build a jsdom window from a real handleGetChatHtml() render, stub
 * window.mermaid BEFORE evaluating the extracted script, and wire a fetch
 * stub that routes every POST into the REAL handlePostTurnStreamHtml (only
 * the model call is stubbed). Mirrors csd-s1's own buildPage() harness.
 * @param {string} sessionId
 * @param {object} [opts]
 * @param {Array} [opts.canvasBlocks] pre-seeded session.canvasBlocks
 * @param {function} [opts.mermaidRunImpl] override for window.mermaid.run(runOpts) -> Promise
 * @returns {Promise<{dom: object, mermaidRunCalls: Array, mermaidInitCalls: Array}>}
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
  const runImpl = opts.mermaidRunImpl || function() { return Promise.resolve(); };
  win.mermaid = {
    initialize: function(cfg) { mermaidInitCalls.push(cfg); },
    run: function(runOpts) { mermaidRunCalls.push(runOpts); return runImpl(runOpts); }
  };

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

function diagramMarker(type, mermaidSrc, title) {
  return '---CANVAS-JSON: ' + JSON.stringify({ type: type, title: title || type, content: { mermaid: mermaidSrc } }) + '---';
}

const queue = [];

// ── Unit 1 (AC1) — each of the 3 diagram types renders with a distinct, visible type label ──
queue.push(function runUnit1() {
  console.log('\n-- Unit 1 (AC1) -- rendersEachDiagramTypeWithDistinctLabel');
  return test('each of the 3 diagram types (system-architecture, program-design, data-model) renders with a visible, human-readable label matching its type', async function() {
    const cases = [
      { type: 'system-architecture', mermaid: MINIMAL_SYSTEM_ARCHITECTURE_MERMAID, expectedLabel: 'System Architecture' },
      { type: 'program-design',      mermaid: MINIMAL_PROGRAM_DESIGN_MERMAID,      expectedLabel: 'Program Design' },
      { type: 'data-model',          mermaid: MINIMAL_DATA_MODEL_MERMAID,          expectedLabel: 'Data Model' }
    ];

    for (const c of cases) {
      const sid = uniqueId('u1-' + c.type);
      const text = 'Here is the diagram.\n\n' + diagramMarker(c.type, c.mermaid) + '\n\nThoughts?';
      routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
        onFirstChunk(0);
        onChunk(text);
        return Promise.resolve({ text: text, usage: { model: 'stub' } });
      });

      const { dom } = await buildPage(sid);
      try {
        await settle();
        const block = dom.window.document.querySelector('#canvas-panel .canvas-block[data-block-type="' + c.type + '"]');
        assert.ok(block, 'expected a .canvas-block[data-block-type="' + c.type + '"] element to be present');

        const labelEl = block.querySelector('.cv-diagram-type-label');
        assert.ok(labelEl, 'expected a visible .cv-diagram-type-label element for type ' + c.type);
        assert.strictEqual(labelEl.textContent, c.expectedLabel, 'expected the visible label text to read "' + c.expectedLabel + '" for type ' + c.type);

        const mermaidEl = block.querySelector('.mermaid');
        assert.ok(mermaidEl, 'expected a .mermaid element inside the ' + c.type + ' block');
        assert.ok(!block.querySelector('.cv-text'), c.type + ' must NOT fall through to the plain-text renderer');
      } finally {
        dom.window.close();
      }
    }
  });
});

// ── Unit 2 (AC2) — malformed mermaid syntax shows a labelled error box, not blank ──
queue.push(function runUnit2() {
  console.log('\n-- Unit 2 (AC2) -- malformedMermaidSyntaxShowsErrorBoxNotBlank');
  return test('a diagram block with deliberately invalid mermaid syntax shows a labelled error box in place of the diagram, not a blank space', async function() {
    const sid = uniqueId('u2');
    const text = 'Here is a broken diagram.\n\n' + diagramMarker('data-model', MALFORMED_MERMAID_SYNTAX) + '\n\nThoughts?';
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
      const block = dom.window.document.querySelector('#canvas-panel .canvas-block[data-block-type="data-model"]');
      assert.ok(block, 'expected the data-model block to still render its outer shell');

      const mermaidEl = block.querySelector('.mermaid');
      assert.ok(mermaidEl, 'expected the .mermaid element to still exist after a failed render');
      assert.ok(mermaidEl.classList.contains('cv-diagram-error'), 'expected the .mermaid element to be marked with the cv-diagram-error class');

      const errorBox = block.querySelector('.cv-diagram-error-box');
      assert.ok(errorBox, 'expected a labelled .cv-diagram-error-box element, not a blank space');
      assert.notStrictEqual(errorBox.textContent.trim(), '', 'the error box must not be empty/blank');
      assert.ok(/data model/i.test(errorBox.textContent), 'expected the error box to name the diagram type ("Data Model")');
      assert.ok(/failed to render/i.test(errorBox.textContent), 'expected the error box to state that rendering failed');
    } finally {
      dom.window.close();
    }
  });
});

// ── Unit 3 (AC2 edge case) — mermaid render failure shows its first-line reason, never a stack trace ──
queue.push(function runUnit3() {
  console.log('\n-- Unit 3 (AC2 edge case) -- mermaidRenderFailureShowsReasonNeverStackTrace');
  return test('the error box shows the first-line reason but never leaks a stack trace, even when mermaid.run() rejects with one', async function() {
    const sid = uniqueId('u3');
    const text = 'Here is a broken diagram.\n\n' + diagramMarker('system-architecture', MALFORMED_MERMAID_SYNTAX) + '\n\nThoughts?';
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      onFirstChunk(0);
      onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });

    const STACK_MARKER = 'at Parser.parseError (mermaid.min.js:42:1075)';
    const { dom } = await buildPage(sid, {
      mermaidRunImpl: function() {
        return Promise.reject(new Error('Syntax error in graph\n' + STACK_MARKER));
      }
    });
    try {
      await settle();
      const block = dom.window.document.querySelector('#canvas-panel .canvas-block[data-block-type="system-architecture"]');
      assert.ok(block, 'expected the system-architecture block to render');

      const bodyText = block.querySelector('.canvas-block-body').textContent;
      assert.strictEqual(bodyText.indexOf('Parser.parseError'), -1, 'must never expose the raw stack trace text');
      assert.strictEqual(bodyText.indexOf('mermaid.min.js'), -1, 'must never expose the raw stack trace file reference');
      // csd/s2-of-diagram-validation-and-types (2026-08-29): the FIRST LINE of
      // the rejection message is now deliberately shown -- this is that
      // story's own AC1. Only the stack-trace lines (asserted absent above)
      // are suppressed, per decisions.md ARCH entry 2026-08-29.
      assert.notStrictEqual(bodyText.indexOf('Syntax error in graph'), -1, 'the human-readable first-line reason IS now shown (this story\'s own AC1) -- only the stack trace lines are suppressed');

      const errorBox = block.querySelector('.cv-diagram-error-box');
      assert.ok(errorBox, 'expected a labelled error box to still be present');
    } finally {
      dom.window.close();
    }
  });
});

// ── Unit 4 (AC1) — all three diagram types render independently in the same payload ──
queue.push(function runUnit4() {
  console.log('\n-- Unit 4 (AC1) -- threeDiagramTypesRenderIndependentlyInSamePayload');
  return test('a single turn with all 3 diagram type markers renders all 3, in order, each correctly, no cross-type interference', async function() {
    const sid = uniqueId('u4');
    const text = [
      'Combined diagram output.',
      diagramMarker('system-architecture', MINIMAL_SYSTEM_ARCHITECTURE_MERMAID),
      diagramMarker('program-design', MINIMAL_PROGRAM_DESIGN_MERMAID),
      diagramMarker('data-model', MINIMAL_DATA_MODEL_MERMAID),
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
      assert.strictEqual(blocks.length, 3, 'expected exactly 3 canvas blocks');

      const types = Array.prototype.map.call(blocks, function(b) { return b.getAttribute('data-block-type'); });
      assert.deepStrictEqual(types, ['system-architecture', 'program-design', 'data-model'], 'blocks must render in the exact order the markers appeared');

      assert.ok(blocks[0].querySelector('.mermaid') && blocks[0].querySelector('.cv-diagram-type-label').textContent === 'System Architecture', 'block 1 must render as System Architecture');
      assert.ok(blocks[1].querySelector('.mermaid') && blocks[1].querySelector('.cv-diagram-type-label').textContent === 'Program Design', 'block 2 must render as Program Design');
      assert.ok(blocks[2].querySelector('.mermaid') && blocks[2].querySelector('.cv-diagram-type-label').textContent === 'Data Model', 'block 3 must render as Data Model');

      assert.strictEqual(dom.window.document.querySelectorAll('#canvas-panel .mermaid').length, 3, 'exactly 3 .mermaid elements total, no cross-contamination');
    } finally {
      dom.window.close();
    }
  });
});

// ── Integration 1 (AC3) — as-designed / as-built pair renders with distinct labels ──
queue.push(function runIntegration1() {
  console.log('\n-- Integration 1 (AC3) -- asDesignedAndAsBuiltBlocksBothRenderWithDistinctLabels');
  return test('two diagram blocks of the same type, tagged "As Designed" and "As Built", both render and are labelled distinctly in the DOM', async function() {
    const sid = uniqueId('i1');
    const asDesignedMarker = '---CANVAS-JSON: ' + JSON.stringify({ type: 'data-model', title: 'As Designed', content: { mermaid: MINIMAL_DATA_MODEL_MERMAID } }) + '---';
    const asBuiltMarker    = '---CANVAS-JSON: ' + JSON.stringify({ type: 'data-model', title: 'As Built', content: { mermaid: MINIMAL_DATA_MODEL_MERMAID } }) + '---';
    const text = 'Comparing design to build.\n\n' + asDesignedMarker + '\n\n' + asBuiltMarker + '\n\nThoughts?';
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      onFirstChunk(0);
      onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });

    const { dom } = await buildPage(sid);
    try {
      await settle();
      const blocks = dom.window.document.querySelectorAll('#canvas-panel .canvas-block[data-block-type="data-model"]');
      assert.strictEqual(blocks.length, 2, 'expected exactly 2 data-model blocks');

      const titles = Array.prototype.map.call(blocks, function(b) {
        const titleEl = b.querySelector('.canvas-block-title');
        return titleEl && titleEl.textContent;
      });
      assert.deepStrictEqual(titles, ['As Designed', 'As Built'], 'expected the two blocks to be distinctly labelled "As Designed" and "As Built"');

      // Both must still be genuine, independent diagram renders (not one
      // reusing/aliasing the other's DOM), each with its own .mermaid node.
      assert.strictEqual(dom.window.document.querySelectorAll('#canvas-panel .mermaid').length, 2, 'expected 2 independent .mermaid elements, one per block');
    } finally {
      dom.window.close();
    }
  });
});

// ── NFR 1 (Performance) — multiple diagram blocks render without a noticeable extra delay ──
queue.push(function runNfr1() {
  console.log('\n-- NFR 1 (Performance) -- multipleDiagramBlocksRenderWithoutNoticeableExtraDelay');
  return test('rendering 3 diagram blocks in one payload completes promptly (informal smoke check -- no numeric NFR baseline exists yet, per NFR profile)', async function() {
    const sid = uniqueId('nfr1');
    const text = [
      diagramMarker('system-architecture', MINIMAL_SYSTEM_ARCHITECTURE_MERMAID),
      diagramMarker('program-design', MINIMAL_PROGRAM_DESIGN_MERMAID),
      diagramMarker('data-model', MINIMAL_DATA_MODEL_MERMAID)
    ].join('\n\n');
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      onFirstChunk(0);
      onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });

    const startedAt = Date.now();
    const { dom } = await buildPage(sid);
    try {
      await settle();
      const elapsedMs = Date.now() - startedAt;
      const blocks = dom.window.document.querySelectorAll('#canvas-panel .canvas-block');
      assert.strictEqual(blocks.length, 3, 'expected all 3 diagram blocks to have rendered');
      // Generous ceiling (no numeric NFR target exists -- flagged as a known
      // gap in the NFR profile; this is a smoke check against pathological
      // hangs/blocking behaviour, not a real perf gate).
      assert.ok(elapsedMs < 5000, 'expected rendering 3 diagram blocks to complete well under 5s in a test environment, took ' + elapsedMs + 'ms');
    } finally {
      dom.window.close();
    }
  });
});

// ── NFR 2 (Security, MC-SEC-01) — all three diagram types use the same securityLevel config ──
queue.push(function runNfr2() {
  console.log('\n-- NFR 2 (Security, MC-SEC-01) -- allThreeDiagramTypesUseConsistentSecurityConfig');
  return test('mermaid.initialize() with securityLevel is called exactly once and applies uniformly across all three diagram types (no per-type override)', async function() {
    const sid = uniqueId('nfr2');
    const text = [
      diagramMarker('system-architecture', MINIMAL_SYSTEM_ARCHITECTURE_MERMAID),
      diagramMarker('program-design', MINIMAL_PROGRAM_DESIGN_MERMAID),
      diagramMarker('data-model', MINIMAL_DATA_MODEL_MERMAID)
    ].join('\n\n');
    routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, input, token, onChunk, onThinking, onFirstChunk) {
      onFirstChunk(0);
      onChunk(text);
      return Promise.resolve({ text: text, usage: { model: 'stub' } });
    });

    const { dom, mermaidInitCalls } = await buildPage(sid);
    try {
      await settle();
      // Exactly one initialize() call for the whole page -- proves there is
      // no per-diagram-type initialize() override that could silently
      // diverge from "strict" for one of the three types.
      assert.strictEqual(mermaidInitCalls.length, 1, 'expected exactly one mermaid.initialize() call, applying uniformly to all diagram types on the page');
      const cfg = mermaidInitCalls[0];
      assert.ok(['strict', 'sandbox'].indexOf(cfg.securityLevel) !== -1, 'securityLevel must be "strict" or "sandbox"');
      assert.notStrictEqual(cfg.securityLevel, 'loose', 'securityLevel must never be "loose"');

      const blocks = dom.window.document.querySelectorAll('#canvas-panel .canvas-block');
      assert.strictEqual(blocks.length, 3, 'expected all 3 diagram blocks to have rendered under the same security config');
    } finally {
      dom.window.close();
    }
  });
});

// ── Additional (ADR-026 compliance, source-level) — no parallel per-type rendering function ──
queue.push(function runAdditionalAdr026() {
  console.log('\n-- Additional (ADR-026 compliance) -- allThreeDiagramTypesShareOneRenderingHelperNoParallelPath');
  return test('system-architecture and program-design are wired through the SAME buildDiagramBodyHtml() helper as data-model -- no per-type parallel rendering function introduced', function() {
    assert.ok(!/function\s+renderSystemArchitectureBlock/.test(ROUTES_SRC), 'must NOT introduce a separate renderSystemArchitectureBlock (parallel) rendering function');
    assert.ok(!/function\s+renderProgramDesignBlock/.test(ROUTES_SRC), 'must NOT introduce a separate renderProgramDesignBlock (parallel) rendering function');
    assert.ok(!/function\s+renderDataModelBlock/.test(ROUTES_SRC), 'must NOT introduce a separate renderDataModelBlock (parallel) rendering function');

    // Strip source-code // comments before counting -- explanatory prose
    // (e.g. "see buildDiagramBodyHtml() helper below") also mentions the
    // helper name and would otherwise inflate the count.
    const nonCommentSrc = ROUTES_SRC.split('\n').filter(function(line) { return line.trim().indexOf('//') !== 0; }).join('\n');
    const helperMatches = nonCommentSrc.match(/buildDiagramBodyHtml\(/g) || [];
    // 1 function definition + 4 call sites (data-model, system-architecture, program-design, sequence [S5]).
    assert.strictEqual(helperMatches.length, 5, 'expected buildDiagramBodyHtml to be defined once and called from exactly the 4 diagram-type branches, found ' + helperMatches.length + ' occurrences');

    const parseFnStart = ROUTES_SRC.indexOf('function parseCanvasBlock');
    const parseFnBody = ROUTES_SRC.slice(parseFnStart, parseFnStart + 800);
    assert.ok(/TYPE_ALLOW\s*=\s*\[[^\]]*'system-architecture'[^\]]*'program-design'[^\]]*\]|TYPE_ALLOW\s*=\s*\[[^\]]*'program-design'[^\]]*'system-architecture'[^\]]*\]/.test(parseFnBody),
      'expected parseCanvasBlock\'s TYPE_ALLOW to include both new diagram types');

    const saParsed = routes.parseCanvasBlock('---CANVAS-JSON: {"type":"system-architecture","title":"x","content":{"mermaid":"flowchart TD"}}---');
    assert.ok(saParsed !== null && saParsed.type === 'system-architecture', 'parseCanvasBlock must accept a valid system-architecture marker');

    const pdParsed = routes.parseCanvasBlock('---CANVAS-JSON: {"type":"program-design","title":"x","content":{"mermaid":"flowchart LR"}}---');
    assert.ok(pdParsed !== null && pdParsed.type === 'program-design', 'parseCanvasBlock must accept a valid program-design marker');
  });
});

// ── Non-regression — pre-existing cluster-tree/table/text/data-model fixtures still pass ──
queue.push(function runNonRegression() {
  console.log('\n-- Non-regression -- preExistingBlockTypesStillRenderUnaffectedAfterNewDiagramTypesAdded');
  return test('cluster-tree, table, text, and data-model still render correctly in one payload after system-architecture/program-design were added', async function() {
    const sid = uniqueId('nr1');
    const CLUSTER_MARKER = '---CANVAS-JSON: {"type":"cluster-tree","title":"Opportunity map","content":{"clusters":["Capture problem"]}}---';
    const TABLE_MARKER   = '---CANVAS-JSON: {"type":"table","title":"Options","content":{"headers":["Option","Score"],"rows":[["A","3"]]}}---';
    const TEXT_MARKER    = '---CANVAS-JSON: {"type":"text","title":"Summary","content":{"paragraphs":["A summary paragraph."]}}---';
    const text = [
      diagramMarker('data-model', MINIMAL_DATA_MODEL_MERMAID),
      CLUSTER_MARKER,
      TABLE_MARKER,
      TEXT_MARKER
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
      assert.strictEqual(blocks.length, 4, 'expected all 4 legacy + data-model blocks to render');

      const types = Array.prototype.map.call(blocks, function(b) { return b.getAttribute('data-block-type'); });
      assert.deepStrictEqual(types, ['data-model', 'cluster-tree', 'table', 'text'], 'blocks must render in marker order, unaffected by the new diagram types existing');

      assert.ok(blocks[0].querySelector('.mermaid'), 'data-model block must still render a .mermaid element');
      assert.ok(blocks[1].querySelector('.cv-tree-wrap'), 'cluster-tree block must still render its tree structure');
      assert.ok(blocks[2].querySelector('.cv-table'), 'table block must still render its table structure');
      assert.ok(blocks[3].querySelector('.cv-text'), 'text block must still render its paragraph structure');
    } finally {
      dom.window.close();
    }
  });
});

(async function run() {
  console.log('csd-s2 -- Production-harden the /ideate canvas diagram content-block mechanism (all 3 diagram types)\n');
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
