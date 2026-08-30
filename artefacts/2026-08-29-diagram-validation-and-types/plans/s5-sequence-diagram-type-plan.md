# Add the Sequence diagram type, conditionally emitted — Implementation Plan

> **For agent execution:** Single session — execute via /tdd per task.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/s5-sequence-diagram-type`
**Worktree:** `.worktrees/s5-sequence-diagram-type`
**Test command:** `node tests/check-s5-sequence-diagram-type.js` (story suite) / `node scripts/run-all-tests.js` (full suite)

---

## File map

```
Create:
  tests/fixtures/s5/sequence-fixtures.js         — MINIMAL_SEQUENCE_MERMAID fixture (sequenceDiagram syntax)
  tests/check-s5-sequence-diagram-type.js        — story test suite (AC3, AC4, AC5, 3 NFR tests)

Modify:
  src/web-ui/routes/skills.js                    — TYPE_ALLOW (AC5), renderCanvasBlock dispatch (AC3),
                                                     live appendCanvasBlock's isDiagramBlock gate (AC3, live-session parity)
  tests/check-csd-s2-canvas-diagram-rendering.js — update the ADR-026 buildDiagramBodyHtml occurrence
                                                     count (4 -> 5) per the DoR's explicit warning
  skills/design/SKILL.md                         — new "Canvas markers — Sequence diagram (S5)" section (AC1, AC2)
```

---

## Important implementation note (not a separate task — applies across Tasks 1-3)

`renderCanvasBlock`'s dispatch (`_CANVAS_RENDER_FN_LINES`, shared by both the live script and the
read-only history script) is **not** the only place that gates diagram rendering. The live
interactive script's `appendCanvasBlock` function has its own, separate `isDiagramBlock` allowlist
(`src/web-ui/routes/skills.js` ~line 4085) that decides whether `window.mermaid.run()` is even
invoked for a block:

```js
var isDiagramBlock = block && (block.type === "data-model" || block.type === "system-architecture" || block.type === "program-design");
```

This check does **not** exist in the read-only history script (`buildReadOnlyCanvasScript`), which
runs `mermaid.run()` unconditionally over every `.mermaid` node it renders. If `"sequence"` is
added only to `renderCanvasBlock`'s dispatch (Task 2) and not to this gate, a live-session sequence
diagram would still produce the correct wrapper markup (so a shallow markup test could pass) but
`mermaid.run()` would never fire in a live session — the diagram would never actually render, and a
malformed one would never show the S1/S2 error-box diagnostic. This would silently violate AC3
("S1's and S2's diagnostic mechanisms apply to it automatically") for the live session specifically,
while appearing to work in the read-only history view. Task 3 below adds `"sequence"` to this gate
— do not skip it even though it is not mentioned by name in the DoR contract's "estimated touch
points" list.

---

## Task 1: Add "sequence" to parseCanvasBlockDiagnostic's TYPE_ALLOW (AC5)

**Files:**
- Modify: `src/web-ui/routes/skills.js`
- Test: `tests/check-s5-sequence-diagram-type.js` (new file — created in this task, added to across Tasks 2-5)

- [ ] **Step 1: Write the failing test**

Create `tests/check-s5-sequence-diagram-type.js`:

```js
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
```

Also create the fixture file `tests/fixtures/s5/sequence-fixtures.js`:

```js
'use strict';

/**
 * s5 hand-authored Sequence diagram fixture -- Mermaid `sequenceDiagram`
 * syntax, used by tests/check-s5-sequence-diagram-type.js.
 *
 * Hand-authored, not agent/skill-generated -- per the story's own scope, S5
 * only proves the rendering mechanism works for this 4th diagram type;
 * whether the model correctly chooses when to emit one is a live-model
 * judgment call covered by the AC1/AC2 manual verification scenario, not
 * this fixture.
 *
 * MINIMAL_SEQUENCE_MERMAID -- a 2-participant, 2-message exchange: just
 * enough to prove the rendering dispatch works end to end.
 */

const MINIMAL_SEQUENCE_MERMAID = [
  'sequenceDiagram',
  '    participant Client',
  '    participant Server',
  '    Client->>Server: Request',
  '    Server-->>Client: Response'
].join('\n');

module.exports = {
  MINIMAL_SEQUENCE_MERMAID
};
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-s5-sequence-diagram-type.js
```

Expected output: `FAIL: a sequence-type marker is parsed successfully...` — `parsed !== null` assertion fails because `parseCanvasBlockDiagnostic` returns `{ ok: false, reason: 'disallowed-type', ... }` for `"sequence"` (not yet in `TYPE_ALLOW`), so `routes.parseCanvasBlock(...)` returns `null`. All other tests in the file also fail (rendering never reaches `buildDiagramBodyHtml` for an unrecognized type — `renderCanvasBlock`'s `bodyHtml` stays `""`).

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/skills.js`, change line 841 (inside `parseCanvasBlockDiagnostic`):

```js
  var TYPE_ALLOW = ['cluster-tree', 'table', 'text', 'data-model', 'system-architecture', 'program-design', 'drift-signal', 'sequence'];
```

Also update the comment immediately above it (lines 838-840) — it currently says `'sequence' is added by S5 (out of scope for this story...)`; correct it to reflect that S5 is the story adding it now:

```js
  // dispatch, no parallel path). csd-s6 adds 'drift-signal' (see
  // src/modules/drift-comparator.js) the same way. 'sequence' is added by
  // S5, the same way (see src/web-ui/routes/skills.js's renderCanvasBlock
  // dispatch and the live appendCanvasBlock isDiagramBlock gate, both below).
```

- [ ] **Step 4: Run test — must pass (AC5 test only; others still fail)**

```bash
node tests/check-s5-sequence-diagram-type.js
```

Expected output: `PASS: a sequence-type marker is parsed successfully, not rejected as disallowed` — the remaining tests still fail (rendering dispatch not wired yet — Task 2).

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/routes/skills.js tests/check-s5-sequence-diagram-type.js tests/fixtures/s5/sequence-fixtures.js
git commit -m "feat(s5): add sequence to parseCanvasBlock's TYPE_ALLOW (AC5)"
```

---

## Task 2: Add the sequence dispatch branch to the shared renderCanvasBlock (AC3, part 1)

**Files:**
- Modify: `src/web-ui/routes/skills.js`

- [ ] **Step 1: Confirm the test already exists and fails**

`sequenceTypeRendersViaSharedBuildDiagramBodyHtml` (from Task 1's test file) currently fails: the marker now parses (Task 1), but `renderCanvasBlock`'s dispatch has no `sequence` branch, so `bodyHtml` stays empty and no `.cv-diagram-type-label`/`.mermaid` element is produced.

```bash
node tests/check-s5-sequence-diagram-type.js
```

Expected output: `FAIL: a sequence-type block renders with the "Sequence" label...` — `block` element found (the outer wrapper still renders via the generic `canvas-block` shell) but `labelEl` is `null`.

- [ ] **Step 2: Write minimal implementation**

In `src/web-ui/routes/skills.js`, inside `_CANVAS_RENDER_FN_LINES` (the `renderCanvasBlock` dispatch chain), add a new branch immediately after the `program-design` branch and before `drift-signal`:

```js
  '    } else if (type === "program-design") {',
  '      bodyHtml = buildDiagramBodyHtml("Program Design", content);',
  '    } else if (type === "sequence") {',
  '      bodyHtml = buildDiagramBodyHtml("Sequence", content);',
  '    } else if (type === "drift-signal") {',
```

(This is the ONLY change in this task — one new array element inserted between the existing `program-design` and `drift-signal` lines. No other line in `_CANVAS_RENDER_FN_LINES` changes.)

- [ ] **Step 3: Run test — this test must now pass**

```bash
node tests/check-s5-sequence-diagram-type.js
```

Expected output: `PASS: a sequence-type block renders with the "Sequence" label via the same shared mechanism as the 3 existing diagram types`. The `sequenceTypeRenderFailureUsesS1S2DiagnosticsAutomatically` and `readOnlyHistoryViewRendersSequenceBlockIdenticallyToLiveView` tests still fail — Task 3 is required for the live-session diagnostics test (the live script's separate `isDiagramBlock` gate has not been updated yet, so `mermaid.run()` is never invoked for this block in the live view and no error box appears).

- [ ] **Step 4: Commit**

```bash
git add src/web-ui/routes/skills.js
git commit -m "feat(s5): dispatch sequence type through the shared buildDiagramBodyHtml (AC3)"
```

---

## Task 3: Add "sequence" to the live script's isDiagramBlock gate (AC3, part 2 — live-session parity)

**Files:**
- Modify: `src/web-ui/routes/skills.js`

- [ ] **Step 1: Confirm the test fails for the expected reason**

```bash
node tests/check-s5-sequence-diagram-type.js
```

Expected output: `FAIL: a sequence-type block with invalid mermaid content shows the same labelled error box...` — the `.mermaid` element exists (Task 2 wired the dispatch) but does NOT have the `cv-diagram-error` class, because `window.mermaid.run()` was never invoked for it (the live script's `isDiagramBlock` check does not include `"sequence"` yet, per this plan's "Important implementation note" above).

- [ ] **Step 2: Write minimal implementation**

In `src/web-ui/routes/skills.js`, change the `isDiagramBlock` line (around line 4085, inside `appendCanvasBlock`):

```js
  '    var isDiagramBlock = block && (block.type === "data-model" || block.type === "system-architecture" || block.type === "program-design" || block.type === "sequence");',
```

- [ ] **Step 3: Run test — must pass**

```bash
node tests/check-s5-sequence-diagram-type.js
```

Expected output: `PASS: a sequence-type block with invalid mermaid content shows the same labelled error box as the existing types, in a LIVE session...`. The `readOnlyHistoryViewRendersSequenceBlockIdenticallyToLiveView` test should now also pass (both the live and read-only paths correctly render and process the sequence block). The 2 remaining NFR tests should also pass with no further changes (they exercise existing shared mermaid-init/model-call plumbing, unaffected by this story).

- [ ] **Step 4: Mutation-test this task's own diagnostic test (per `.github/standards/testing/test-design-patterns.md`)**

Temporarily revert Step 2's change (remove `|| block.type === "sequence"` from the `isDiagramBlock` line), then re-run:

```bash
node tests/check-s5-sequence-diagram-type.js
```

Expected output: `sequenceTypeRenderFailureUsesS1S2DiagnosticsAutomatically` FAILS again, for the same reason as Step 1 (no `cv-diagram-error` class) — confirming this test has real detection power against exactly the failure mode it guards against, not a coincidental pass. Then restore Step 2's change and re-run once more to confirm all tests pass again before proceeding.

```bash
node tests/check-s5-sequence-diagram-type.js
```

Expected output: `Results: 8 passed, 0 failed` / `All tests passed.` (confirm the diff is back to Step 2's change via `git diff src/web-ui/routes/skills.js` before continuing — must be non-empty and match Step 2 exactly.)

- [ ] **Step 5: Run the full story suite one more time to confirm the complete picture**

```bash
node tests/check-s5-sequence-diagram-type.js
```

Expected output: `Results: 8 passed, 0 failed`

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/skills.js
git commit -m "fix(s5): include sequence in the live appendCanvasBlock isDiagramBlock gate (AC3 live-session parity)"
```

---

## Task 4: Update check-csd-s2's ADR-026 occurrence-count assertion (4 → 5)

**Files:**
- Modify: `tests/check-csd-s2-canvas-diagram-rendering.js`

Per the DoR's explicit Coding Agent Instruction: this pre-existing test currently asserts
`buildDiagramBodyHtml` is called from exactly 3 diagram-type branches (4 total occurrences: 1
definition + 3 calls). Task 2 added a 4th call site (`sequence`), so this count must become 5 (1
definition + 4 calls) — otherwise this assertion silently starts failing the next time the full
suite runs.

- [ ] **Step 1: Confirm this test currently fails (after Task 2)**

```bash
node tests/check-csd-s2-canvas-diagram-rendering.js
```

Expected output (once Task 2 has landed): `FAIL: system-architecture and program-design are wired through the SAME buildDiagramBodyHtml()...` — `expected buildDiagramBodyHtml to be defined once and called from exactly the 3 diagram-type branches, found 5 occurrences`.

- [ ] **Step 2: Update the assertion**

In `tests/check-csd-s2-canvas-diagram-rendering.js`, change:

```js
    // 1 function definition + 3 call sites (data-model, system-architecture, program-design).
    assert.strictEqual(helperMatches.length, 4, 'expected buildDiagramBodyHtml to be defined once and called from exactly the 3 diagram-type branches, found ' + helperMatches.length + ' occurrences');
```

to:

```js
    // 1 function definition + 4 call sites (data-model, system-architecture, program-design, sequence [S5]).
    assert.strictEqual(helperMatches.length, 5, 'expected buildDiagramBodyHtml to be defined once and called from exactly the 4 diagram-type branches, found ' + helperMatches.length + ' occurrences');
```

- [ ] **Step 3: Run test — must pass**

```bash
node tests/check-csd-s2-canvas-diagram-rendering.js
```

Expected output: `Results: 10 passed, 0 failed` / `All tests passed.`

- [ ] **Step 4: Commit**

```bash
git add tests/check-csd-s2-canvas-diagram-rendering.js
git commit -m "test(s5): update csd-s2's ADR-026 buildDiagramBodyHtml occurrence count for the sequence branch (4 -> 5)"
```

---

## Task 5: Add the "Canvas markers — Sequence diagram (S5)" section to skills/design/SKILL.md (AC1, AC2)

**Files:**
- Modify: `skills/design/SKILL.md`

This task has no automated test (AC1/AC2 are the test plan's acknowledged `Untestable-by-nature`
manual gap — see the verification script's Scenario for the manual check). Follow the System
Architecture section's exact structure (format, fields, worked example), but make emission
**explicitly conditional**, not unconditional like System Architecture's "emit exactly one".

- [ ] **Step 1: No failing test to write — this is a documentation/instruction-content task**

- [ ] **Step 2: Write the section**

In `skills/design/SKILL.md`, insert a new section immediately after the existing "Canvas markers —
System Architecture diagram (csd-s3)" section (ends with "Do not emit more than one
`system-architecture` marker per /design session.") and before "## Data Model diagram markers
(csd-s4)":

```markdown
---

## Canvas markers — Sequence diagram (S5)

Unlike System Architecture (emitted unconditionally, exactly once per /design session), a Sequence
diagram is **conditional**: emit one only when this feature's own subject matter genuinely involves
a multi-step component interaction worth diagramming over time (e.g. an SSE turn exchange, a
cache-fallback trace, an auth handshake) — not for every feature. If the feature's architecture is
better expressed as static topology alone, do not emit a sequence marker; System Architecture
already covers that case.

When a genuine multi-step interaction is worth documenting, emit it during Step 2 (Solution
architecture), using this format:

```
---CANVAS-JSON: {"type":"sequence","title":"<string>","content":{"mermaid":"<mermaid sequenceDiagram syntax>"}}---
```

Fields:
- `type`: always `sequence` for this marker
- `title`: short human-readable title (e.g. "Auth handshake sequence")
- `content.mermaid`: Mermaid `sequenceDiagram` source showing the participants and the ordered
  messages between them. Reuse the existing shared rendering mechanism (`buildDiagramBodyHtml` via
  `renderCanvasBlock` — ADR-026) — do not introduce a new diagram format or a second rendering path.

Worked example, for a feature adding a cache-fallback trace:

```
---CANVAS-JSON: {"type":"sequence","title":"Cache fallback sequence","content":{"mermaid":"sequenceDiagram\n    participant Client\n    participant Cache\n    participant DB\n    Client->>Cache: GET key\n    Cache-->>Client: miss\n    Client->>DB: GET key\n    DB-->>Client: value\n    Client->>Cache: SET key, value"}}---
```

Do not emit more than one `sequence` marker per /design session, and do not emit one at all when no
genuine multi-step interaction exists for this feature.
```

- [ ] **Step 3: No test to run — verify by reading the rendered section**

```bash
node -e "const fs=require('fs'); const s=fs.readFileSync('skills/design/SKILL.md','utf8'); console.log(s.includes('Canvas markers — Sequence diagram (S5)') ? 'section present' : 'MISSING');"
```

Expected output: `section present`

- [ ] **Step 4: Commit**

```bash
git add skills/design/SKILL.md
git commit -m "docs(s5): add conditional Sequence diagram canvas-marker instruction to skills/design/SKILL.md (AC1, AC2)"
```

---

## Task 6: Full-suite regression run and story suite final pass

**Files:** none (verification only)

- [ ] **Step 1: Run the story suite**

```bash
node tests/check-s5-sequence-diagram-type.js
```

Expected output: `Results: 8 passed, 0 failed`

- [ ] **Step 2: Run the full suite**

```bash
node scripts/run-all-tests.js
```

Expected output: all files passing, 0 failed (baseline was 572 files, 0 failed at branch-setup —
expect 574 with this story's 2 new test files: `check-s5-sequence-diagram-type.js` is new;
`check-csd-s2-canvas-diagram-rendering.js` is a modification, not a new file — so 573 total).

- [ ] **Step 3: Open a draft PR**

Per the DoR's Coding Agent Instructions: open a draft PR when tests pass — do not mark ready for
review. Follow this repo's `/branch-complete` convention (draft PR title referencing `s5`, body
listing ACs satisfied and the story/test-plan/DoR artefact paths, matching S3/S4's own PR body
shape).
