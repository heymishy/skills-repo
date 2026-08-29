# Structured diagnostic for invalid mermaid syntax inside a diagram — Implementation Plan

> **For agent execution:** Use /subagent-execution (subagents available).

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/s2-mermaid-syntax-diagnostic`
**Worktree:** `.worktrees/s2-mermaid-syntax-diagnostic`
**Test command:** `node scripts/run-all-tests.js` (full suite); individual files: `node tests/check-s2-mermaid-syntax-diagnostic.js`, `node tests/check-csd-s2-canvas-diagram-rendering.js`

**Design note (read before starting):** `markDiagramRenderError` surfaces only the **first line** of mermaid's rejection/exception message (everything before the first `\n`) — never the full raw message or a stack trace. This was an explicit operator decision made during implementation planning after finding this story's original "pass the raw reason through" framing conflicted with an already-shipped test (`code-shape-diagrams`/csd-s2, Unit 3) enforcing `MC-SEC-01` (no raw error/stack text in the error box). See `decisions.md` (ARCH, 2026-08-29) for full rationale. Task 4 below updates that existing test to match.

---

## File map

```
Modify:
  src/web-ui/routes/skills.js                        — markDiagramRenderError(node, reason) signature
                                                         change (first-line extraction + escaping +
                                                         console.error), both call sites (live-session
                                                         script ~line 4072-4084, read-only history
                                                         script ~line 1039-1051) updated to pass reason
  tests/check-csd-s2-canvas-diagram-rendering.js      — Unit 3 assertions updated for the new,
                                                         intentional first-line-shown behaviour

Create:
  tests/check-s2-mermaid-syntax-diagnostic.js         — all tests for this story (S2's test plan)
```

---

## Task 1: `markDiagramRenderError` surfaces mermaid's first-line reason, escaped, logged in full

**Files:**
- Create: `tests/check-s2-mermaid-syntax-diagnostic.js`
- Modify: `src/web-ui/routes/skills.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-s2-mermaid-syntax-diagnostic.js`:

```javascript
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

async function main() {
  for (const fn of queue) { await fn(); }
  console.log('\n[s2-mermaid-syntax-diagnostic] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  if (failed > 0) { process.exit(1); }
}
main().catch(function(err) { console.error('[s2] Unexpected error:', err.message); process.exit(1); });
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-s2-mermaid-syntax-diagnostic.js
```

Expected output: `FAIL` on all 5 tests above — `markDiagramRenderError` currently takes only `node` (no `reason` parameter), so none of mermaid's specific reason text ever reaches the error box or the console.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/skills.js`, replace `markDiagramRenderError` inside the `_CANVAS_RENDER_FN_LINES` array (currently ~line 926-931):

```javascript
  '  function markDiagramRenderError(node, reason) {',
  '    var label = node.getAttribute("data-diagram-label") || "Diagram";',
  '    var reasonText = "";',
  '    if (reason) {',
  '      var rawMsg = (reason && reason.message) ? String(reason.message) : String(reason);',
  '      reasonText = rawMsg.split("\\n")[0];',
  '      try { console.error("[canvas-diagram-render-error] " + label + ": " + rawMsg); } catch (e) {}',
  '    }',
  '    node.classList.add("cv-diagram-error");',
  '    node.setAttribute("aria-label", label + " diagram failed to render");',
  '    var reasonHtml = reasonText ? (" " + escHtmlClient(reasonText)) : "";',
  '    node.innerHTML = \'<div class="cv-diagram-error-box" role="alert">\' + escHtmlClient(label) + " diagram failed to render" + reasonHtml + "</div>";',
  '  }',
```

Then update both call sites to pass the rejection/exception reason through (the first-line extraction happens inside `markDiagramRenderError` itself):

In the read-only history script (currently ~line 1039-1051):

```javascript
    '  if (window.mermaid && typeof window.mermaid.run === "function" && container) {',
    '    var mermaidNodes = container.querySelectorAll(".mermaid");',
    '    Array.prototype.forEach.call(mermaidNodes, function(node) {',
    '      try {',
    '        var runResult = window.mermaid.run({ nodes: [node] });',
    '        if (runResult && typeof runResult.catch === "function") {',
    '          runResult.catch(function(err) { markDiagramRenderError(node, err); });',
    '        }',
    '      } catch (e) {',
    '        markDiagramRenderError(node, e);',
    '      }',
    '    });',
    '  }',
```

In the live-session script (currently ~line 4072-4084):

```javascript
    '    if (isDiagramBlock && window.mermaid && typeof window.mermaid.run === "function" && appendedEl.querySelectorAll) {',
    '      var mermaidNodes = appendedEl.querySelectorAll(".mermaid");',
    '      Array.prototype.forEach.call(mermaidNodes, function(node) {',
    '        try {',
    '          var runResult = window.mermaid.run({ nodes: [node] });',
    '          if (runResult && typeof runResult.catch === "function") {',
    '            runResult.catch(function(err) { markDiagramRenderError(node, err); });',
    '          }',
    '        } catch (e) {',
    '          markDiagramRenderError(node, e);',
    '        }',
    '      });',
    '    }',
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-s2-mermaid-syntax-diagnostic.js
```

Expected output: `5 passed, 0 failed`

- [ ] **Step 5: Run the existing csd-s2 test — expect ONE known, already-planned failure**

```bash
node tests/check-csd-s2-canvas-diagram-rendering.js
```

Expected output: Unit 3 ("the error box never leaks the raw JS error message or a stack trace") now **fails** on its `bodyText.indexOf('Syntax error in graph') === -1` assertion — this is the exact, intentional, already-decided behaviour change from `decisions.md` (ARCH, 2026-08-29). Do not treat this as a regression to fix here; Task 4 below updates this test's assertions to match the new design. All other tests in this file (Units 1, 2, 4, and the NFR tests) must still pass unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/skills.js tests/check-s2-mermaid-syntax-diagnostic.js
git commit -m "feat(s2): surface mermaid's first-line render-failure reason in the error box and console"
```

---

## Task 2: AC3 — a sibling diagram's successful render is unaffected by a neighbour's failure

**Files:**
- Modify: `tests/check-s2-mermaid-syntax-diagnostic.js`

No production code change in this task — AC3 is a regression guarantee against the existing per-node `mermaid.run({nodes:[node]})` call pattern (already isolates nodes today); this task proves Task 1's change did not regress that isolation.

- [ ] **Step 1: Write the failing test**

Append to `tests/check-s2-mermaid-syntax-diagnostic.js`, adding this to the `queue` array before the `async function main()` line:

```javascript
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
```

- [ ] **Step 2: Run test — must fail (or pass trivially) then confirm**

```bash
node tests/check-s2-mermaid-syntax-diagnostic.js
```

Expected output: `6 passed, 0 failed`. This test should pass immediately on top of Task 1's implementation (per-node isolation already existed before this story; this task adds coverage proving it, per the story's own explicit "this story must not regress that" framing) — if it fails, that is a real regression introduced by Task 1 and must be root-caused before proceeding, not worked around.

- [ ] **Step 3: No implementation step** — covered by Task 1's code. If Step 2 failed, return to Task 1's implementation and fix before continuing.

- [ ] **Step 4: Commit**

```bash
git add tests/check-s2-mermaid-syntax-diagnostic.js
git commit -m "test(s2): add AC3 regression coverage for sibling diagram render isolation"
```

---

## Task 3: AC4 — successful renders are unchanged across all 3 mermaid-based types (regression)

**Files:**
- Modify: `tests/check-s2-mermaid-syntax-diagnostic.js`

No production code change in this task — regression proof only.

- [ ] **Step 1: Write the failing test**

Append to the `queue` array (before `async function main()`):

```javascript
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
```

- [ ] **Step 2: Run test — must pass**

```bash
node tests/check-s2-mermaid-syntax-diagnostic.js
```

Expected output: `7 passed, 0 failed`

- [ ] **Step 3: No implementation step** — regression proof only.

- [ ] **Step 4: Commit**

```bash
git add tests/check-s2-mermaid-syntax-diagnostic.js
git commit -m "test(s2): add AC4 regression coverage for unaffected successful renders"
```

---

## Task 4: Update csd-s2's Unit 3 test to match the new, intentional first-line-shown behaviour

**Files:**
- Modify: `tests/check-csd-s2-canvas-diagram-rendering.js`

This is a required correction, not scope creep — Task 1 deliberately changes the exact behaviour this pre-existing test from a different feature (`code-shape-diagrams`/csd-s2) asserts against. Leaving it unfixed would leave a permanently broken test on `master`. See `decisions.md` (ARCH, 2026-08-29) for the full rationale on why this change is safe (`MC-SEC-01`'s real intent — no raw stack/internals — is preserved; only the previously-over-broad "no raw message at all" behaviour is narrowed to "no stack, but the human-readable first line is shown").

- [ ] **Step 1: Confirm the current (now-failing) state**

```bash
node tests/check-csd-s2-canvas-diagram-rendering.js
```

Confirm Unit 3 is the only failure (per Task 1 Step 5), with this exact failure message:
```
FAIL: the error box never leaks the raw JS error message or a stack trace, even when mermaid.run() rejects with one
       AssertionError [ERR_ASSERTION]: must never expose the raw JS error message
```

- [ ] **Step 2: Update the test's assertions and name**

In `tests/check-csd-s2-canvas-diagram-rendering.js`, replace Unit 3 (currently ~line 257-290):

```javascript
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
```

- [ ] **Step 3: Run test — must pass**

```bash
node tests/check-csd-s2-canvas-diagram-rendering.js
```

Expected output: all units pass (Unit 3 now passes with its updated assertions; Units 1, 2, 4, and the NFR tests remain unaffected).

- [ ] **Step 4: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing (same 1 pre-existing flake, `check-p3.5-validate-trace.js`, already RISK-ACCEPTed). Specifically re-confirm `check-csd-s1-derisk-canvas-mermaid.js` also still passes unchanged (it shares the same `markDiagramRenderError` function but does not itself stub a rejecting `mermaid.run()`, so it should be unaffected by this story's change).

- [ ] **Step 5: Commit**

```bash
git add tests/check-csd-s2-canvas-diagram-rendering.js
git commit -m "test(csd-s2): update Unit 3 for S2's intentional first-line-reason-shown behaviour"
```

---

## After all tasks: open the draft PR

Once all 4 tasks are committed and the full suite passes, run `/verify-completion` then `/branch-complete` per the standard inner-loop sequence. Per this story's own NFR (Audit: N/A — client-only failure mode, no server-side event), `/verify-completion`'s route/handler E2E coverage check should report N/A unless this diff also happens to touch a file under `src/web-ui/routes/` in a way that changes route/handler behaviour (it modifies `skills.js`, but only the client-side inline-script string arrays, not a route handler itself — confirm this framing still holds when actually running that check, do not assume it from this plan alone).
