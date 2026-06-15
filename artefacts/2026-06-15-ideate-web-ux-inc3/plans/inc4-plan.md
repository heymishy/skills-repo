# inc4 — Canvas Output Panel: Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Add `---CANVAS-JSON---` marker parsing, SSE emission, and a `#canvas-panel` client renderer so structured lens output renders visually in the right panel instead of as streamed markdown.
**Branch:** `feature/inc4-canvas-panel`
**Test command:** `node tests/check-inc4-canvas-panel.js`
**Full suite:** `npm test`

---

## File map

```
Modify:
  src/web-ui/routes/skills.js          — add parseCanvasBlock; extend display-strip
                                          regexes to cover CANVAS-JSON; add canvas
                                          buffer + canvasBlock SSE in
                                          handlePostTurnStreamHtml; update
                                          updateDraftPanel ref to canvas-panel; wire
                                          appendCanvasBlock in SSE pump; export
                                          parseCanvasBlock
  src/web-ui/views/chat-view.js        — replace #draft-content → #canvas-panel;
                                          rename section heading to "Canvas"; add
                                          --teal extension tokens; add canvas CSS
                                          (.canvas-block, .canvas-type-tag, .cv-tree,
                                          .cv-table, .cv-text, .cv-pips); add
                                          renderCanvasBlock + appendCanvasBlock to
                                          inline <script>
  tests/check-iwu2-right-panel-layout.js — update 5 assertions from #draft-content
                                            to #canvas-panel (known regression per DoR)

Create:
  tests/check-inc4-canvas-panel.js     — T1–T9 (T10 = npm test full-suite run)
```

---

## Task 1: `parseCanvasBlock` — AC1

**Model:** balanced
**Files:**
- Modify: `src/web-ui/routes/skills.js`
- Create: `tests/check-inc4-canvas-panel.js` (T1/T2/T3 only)

### Step 1: Write the failing test

Create `tests/check-inc4-canvas-panel.js`:

```javascript
#!/usr/bin/env node
// check-inc4-canvas-panel.js — AC verification for inc4 canvas output panel
// Tests T1–T9. T10 = npm test (full suite regression).
'use strict';

process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
process.env.WUCE_REPOSITORIES    = 'test-owner/test-repo';

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else       { console.log('  ✗ ' + label); failed++; }
}
function eq(a, b, label) {
  if (a === b) { console.log('  ✓ ' + label); passed++; }
  else {
    console.log('  ✗ ' + label + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');
    failed++;
  }
}

const {
  parseCanvasBlock,
  _setHtmlSession,
  _getHtmlSession,
  setSkillTurnExecutorStreamAdapter,
  handlePostTurnStreamHtml
} = require('../src/web-ui/routes/skills');

const { renderChat } = require('../src/web-ui/views/chat-view');

// ── T1 — parseCanvasBlock: valid marker ──────────────────────────────────────
console.log('\n  T1 — parseCanvasBlock: valid marker');
{
  const m = '---CANVAS-JSON: {"type":"cluster-tree","title":"Opp Map","content":{"clusters":[]}}---';
  const r = parseCanvasBlock(m);
  ok(r !== null, 'T1: returns non-null for valid cluster-tree marker');
  eq(r && r.type, 'cluster-tree', 'T1: type field correct');
  eq(r && r.title, 'Opp Map', 'T1: title field correct');
  ok(r && r.content !== undefined, 'T1: content field present');
  // Other valid types
  ok(parseCanvasBlock('---CANVAS-JSON: {"type":"table","title":"T","content":{}}---') !== null, 'T1: "table" is valid type');
  ok(parseCanvasBlock('---CANVAS-JSON: {"type":"text","title":"T","content":{}}---') !== null, 'T1: "text" is valid type');
}

// ── T2 — parseCanvasBlock: invalid JSON → null ───────────────────────────────
console.log('\n  T2 — parseCanvasBlock: invalid JSON → null');
{
  ok(parseCanvasBlock('---CANVAS-JSON: {bad json}---') === null, 'T2: invalid JSON → null');
  ok(parseCanvasBlock('no marker here') === null, 'T2: no marker → null');
  ok(parseCanvasBlock('') === null, 'T2: empty string → null');
}

// ── T3 — parseCanvasBlock: unknown type → null ───────────────────────────────
console.log('\n  T3 — parseCanvasBlock: unknown type → null');
{
  ok(parseCanvasBlock('---CANVAS-JSON: {"type":"diagram","title":"x","content":{}}---') === null, 'T3: "diagram" → null');
  ok(parseCanvasBlock('---CANVAS-JSON: {"type":"","title":"x","content":{}}---') === null, 'T3: empty type → null');
  ok(parseCanvasBlock('---CANVAS-JSON: {"title":"x","content":{}}---') === null, 'T3: missing type → null');
}

// ── T4/T5 — SSE pipeline ─────────────────────────────────────────────────────
// (appended in Task 2)

// ── T6 — #canvas-panel in renderChat ─────────────────────────────────────────
// (appended in Task 3)

// ── T7/T8/T9 — renderCanvasBlock ─────────────────────────────────────────────
// (appended in Task 4)

// ── Report ───────────────────────────────────────────────────────────────────
console.log('\n[inc4-canvas-panel] Results: ' + passed + ' passed, ' + failed + ' failed\n');
if (failed > 0) { process.exit(1); }
```

### Step 2: Run test — must fail

```
node tests/check-inc4-canvas-panel.js
```

Expected: `TypeError: parseCanvasBlock is not a function` (not yet exported)

### Step 3: Implement `parseCanvasBlock`

In `src/web-ui/routes/skills.js`, add immediately after `parseConditionMarker` (around line 563):

```javascript
/**
 * inc4: Parse a single ---CANVAS-JSON: {...}--- marker from text.
 * Validates type against allowlist. Returns null on any parse/validate failure.
 * @param {string} text
 * @returns {{ type: string, title: string, content: object }|null}
 */
function parseCanvasBlock(text) {
  var MARKER_RE = /---CANVAS-JSON:\s*(\{[\s\S]*?\})\s*---/;
  var match = String(text).match(MARKER_RE);
  if (!match) { return null; }
  var TYPE_ALLOW = ['cluster-tree', 'table', 'text'];
  try {
    var parsed = JSON.parse(match[1]);
    if (TYPE_ALLOW.indexOf(String(parsed.type || '')) === -1) { return null; }
    return parsed;
  } catch (_) {
    return null;
  }
}
```

In `module.exports` at the bottom of the file, add `parseCanvasBlock` to the `// inc2.1` section:

```javascript
  // inc2.1 — condition marker parser
  parseConditionMarker,
  // inc4 — canvas block parser
  parseCanvasBlock,
```

### Step 4: Run test — must pass

```
node tests/check-inc4-canvas-panel.js
```

Expected: `Results: 9 passed, 0 failed`

### Step 5: Run full suite — no regressions

```
npm test
```

Expected: all tests passing

### Step 6: Commit

```
git add src/web-ui/routes/skills.js tests/check-inc4-canvas-panel.js
git commit -m "feat(inc4): add parseCanvasBlock with cluster-tree/table/text allowlist"
```

---

## Task 2: Canvas buffer + SSE emission — AC2

**Model:** balanced
**Files:**
- Modify: `src/web-ui/routes/skills.js`
- Modify: `tests/check-inc4-canvas-panel.js` (append T4/T5)

### Step 1: Append T4/T5 to test file

Replace the `// ── T4/T5 — SSE pipeline ────` placeholder comment block with:

```javascript
// ── T4/T5 — SSE pipeline ─────────────────────────────────────────────────────
console.log('\n  T4/T5 — SSE: canvasBlock emitted + stripped from chunk');
const SESSION_CV = 'test-inc4-canvas-session';
_setHtmlSession(SESSION_CV, {
  skillName: 'ideate', sessionPath: '/tmp/test', systemPrompt: 'test',
  turns: [], artefactContent: null, artefactPath: null, done: false,
  journeyId: null, assumptionCardsEnabled: true
});

const CV_MARKER = '---CANVAS-JSON: {"type":"cluster-tree","title":"Opp Map","content":{"clusters":["C1","C2"]}}---';
const CV_STREAM  = 'Text before. ' + CV_MARKER + ' Text after.';

setSkillTurnExecutorStreamAdapter(function(sp, hist, content, token, onChunk) {
  onChunk(CV_STREAM);
  return Promise.resolve(CV_STREAM);
});

const cvReq = {
  session: { accessToken: 'test-token' },
  params:  { id: SESSION_CV, name: 'ideate' },
  on: function(event, cb) {
    if (event === 'data')  { cb(Buffer.from(JSON.stringify({ answer: 'hi' }))); }
    if (event === 'end')   { cb(); }
    if (event === 'error') {}
  }
};
const cvRes = {
  writtenData: [],
  writeHead: function() {},
  write: function(d) { this.writtenData.push(d); },
  end:   function() {}
};

async function runT4T5() {
  await handlePostTurnStreamHtml(cvReq, cvRes);

  const canvasEvents = cvRes.writtenData.filter(function(d) { return d.includes('"canvasBlock"'); });
  ok(canvasEvents.length >= 1, 'T4: canvasBlock SSE event emitted');

  var firstCanvas = null;
  try { firstCanvas = JSON.parse(canvasEvents[0].replace(/^data: /, '').trim()); } catch (_) {}
  eq(firstCanvas && firstCanvas.canvasBlock && firstCanvas.canvasBlock.type, 'cluster-tree', 'T4: canvasBlock.type correct');
  eq(firstCanvas && firstCanvas.canvasBlock && firstCanvas.canvasBlock.title, 'Opp Map', 'T4: canvasBlock.title correct');

  const sess = _getHtmlSession(SESSION_CV);
  ok(sess && sess.canvasBlocks && sess.canvasBlocks.length >= 1, 'T4: session.canvasBlocks populated');

  // T5: chunk events must not contain the raw CANVAS-JSON marker text
  const chunkEvents = cvRes.writtenData.filter(function(d) { return d.includes('"chunk"'); });
  const allChunkText = chunkEvents.map(function(d) {
    try { return JSON.parse(d.replace(/^data: /, '')).chunk || ''; } catch (_) { return ''; }
  }).join('');
  ok(!allChunkText.includes('---CANVAS-JSON:'), 'T5: CANVAS-JSON marker stripped from chunk display events');
}
```

Also replace the final `// ── Report` block so it calls `runT4T5()` then reports:

```javascript
// ── Report ───────────────────────────────────────────────────────────────────
runT4T5().then(function() {
  console.log('\n[inc4-canvas-panel] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  if (failed > 0) { process.exit(1); }
}).catch(function(err) {
  console.error('[inc4] Unexpected error:', err.message);
  process.exit(1);
});
```

### Step 2: Run test — T4/T5 must fail

```
node tests/check-inc4-canvas-panel.js
```

Expected: T4 fails (`canvasBlock SSE event emitted` — no such event yet), T5 fails (marker present in chunks)

### Step 3: Implement canvas buffer + display strip extension

In `src/web-ui/routes/skills.js`, inside `handlePostTurnStreamHtml`:

**3a. Extend display strip regexes** (around line 2024–2025). Replace:

```javascript
  var _DISPLAY_STRIP_RE   = /---(?:ASSUMPTION|CONDITION)-JSON:[\s\S]*?---/g;
  var _DISPLAY_PARTIAL_RE = /---(?:ASSUMPTION|CONDITION)-JSON:/;
```

With:

```javascript
  var _DISPLAY_STRIP_RE   = /---(?:ASSUMPTION|CONDITION|CANVAS)-JSON:[\s\S]*?---/g;
  var _DISPLAY_PARTIAL_RE = /---(?:ASSUMPTION|CONDITION|CANVAS)-JSON:/;
```

**3b. Extend `_findPartialStart` prefix check** (around line 2054). Replace:

```javascript
            if ('ASSUMPTION-JSON:'.indexOf(after) === 0 || 'CONDITION-JSON:'.indexOf(after) === 0) {
```

With:

```javascript
            if ('ASSUMPTION-JSON:'.indexOf(after) === 0 || 'CONDITION-JSON:'.indexOf(after) === 0 || 'CANVAS-JSON:'.indexOf(after) === 0) {
```

**3c. Add canvas buffer variables** after the condition buffer declarations (around line 2020). After `var _COND_STRIP_RE = /---CONDITION-JSON:[\s\S]*?---/g;`, add:

```javascript
  // inc4: canvas block buffer
  var _canvasBuf    = '';
  var _CANVAS_START = '---CANVAS-JSON:';
  var _CANVAS_END   = '---';
```

**3d. Add canvas buffer scan loop** in the `onChunk` callback, after the condition buffer scan section (after `_conditionBuf = _cCleanBuf + _cScanBuf;`, around line 2138) and before `_artefactAccum += chunk;`:

```javascript
        // inc4: scan for canvas block markers — same pattern as condition buffer
        _canvasBuf += chunk;
        var _cvScanBuf  = _canvasBuf;
        var _cvCleanBuf = '';
        var _cvStartIdx;
        while ((_cvStartIdx = _cvScanBuf.indexOf(_CANVAS_START)) !== -1) {
          var _cvAfterEnd   = _cvScanBuf.indexOf(_CANVAS_END, _cvStartIdx + _CANVAS_START.length);
          if (_cvAfterEnd === -1) { break; }
          var _cvMarkerFull = _cvScanBuf.slice(_cvStartIdx, _cvAfterEnd + _CANVAS_END.length);
          _cvCleanBuf += _cvScanBuf.slice(0, _cvStartIdx);
          _cvScanBuf   = _cvScanBuf.slice(_cvAfterEnd + _CANVAS_END.length);
          var _cvParsed = parseCanvasBlock(_cvMarkerFull);
          if (_cvParsed) {
            if (!session.canvasBlocks) { session.canvasBlocks = []; }
            session.canvasBlocks.push(_cvParsed);
            res.write('data: ' + JSON.stringify({ canvasBlock: {
              type:    _cvParsed.type    || '',
              title:   _cvParsed.title   || '',
              content: _cvParsed.content || {}
            } }) + '\n\n');
          }
        }
        _canvasBuf = _cvCleanBuf + _cvScanBuf;
```

### Step 4: Run test — T4/T5 must pass

```
node tests/check-inc4-canvas-panel.js
```

Expected: `Results: 14 passed, 0 failed`

### Step 5: Run full suite — no regressions

```
npm test
```

Expected: all tests passing

### Step 6: Commit

```
git add src/web-ui/routes/skills.js tests/check-inc4-canvas-panel.js
git commit -m "feat(inc4): add canvas buffer + canvasBlock SSE emission in turn-stream handler"
```

---

## Task 3: `#canvas-panel` in chat-view.js — AC3

**Model:** balanced
**Files:**
- Modify: `src/web-ui/views/chat-view.js`
- Modify: `src/web-ui/routes/skills.js` (updateDraftPanel ID)
- Modify: `tests/check-iwu2-right-panel-layout.js` (5 assertions)
- Modify: `tests/check-inc4-canvas-panel.js` (append T6)

### Step 1: Append T6 to test file

Replace the `// ── T6 — #canvas-panel in renderChat` placeholder comment with:

```javascript
// ── T6 — #canvas-panel in renderChat ─────────────────────────────────────────
console.log('\n  T6 — #canvas-panel in renderChat output');
{
  const baseData = {
    skillName: 'ideate', skillLabel: 'Ideate', featureSlug: '', sessionId: 'test',
    questionIndex: 1, totalQuestions: 1, currentQuestion: 'Hello?',
    priorQA: [], draftSections: [], pendingConfirmation: false,
    userInitial: 'M', modelLabel: 'test-model'
  };
  const cvHtml = renderChat(baseData);
  ok(cvHtml.includes('id="canvas-panel"'), 'T6: #canvas-panel present in renderChat output');
  ok(cvHtml.includes('role="region"'), 'T6: role="region" present');
  ok(cvHtml.includes('aria-label="Canvas"'), 'T6: aria-label="Canvas" present');
  ok(!cvHtml.includes('id="draft-content"'), 'T6: #draft-content no longer present');
}
```

### Step 2: Run test — T6 must fail

```
node tests/check-inc4-canvas-panel.js
```

Expected: T6 fails (`#canvas-panel present` — still emitting `#draft-content`)

### Step 3: Update `chat-view.js`

**3a. Add `--teal` extension tokens and canvas CSS** in the `<style>` block (append after the last `.condition-card-text` rule, before `'</style>'`):

```javascript
      /* inc4 — canvas panel extension */
      ':root { --teal: #0F766E; --teal-soft: #CCFBF1; }',
      '.cv-section-head { display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--line);background:var(--line-2);flex-shrink:0; }',
      '.cv-section-label { font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted); }',
      '.cv-pips { display:flex;gap:4px; }',
      '.cv-pip { width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;background:var(--line-2);color:var(--muted);border:1px solid var(--line); }',
      '.cv-pip.active { background:var(--accent-soft);color:var(--accent-ink);border-color:var(--accent); }',
      '.canvas-block { border:1px solid var(--line);border-radius:8px;margin-bottom:10px;overflow:hidden; }',
      '.canvas-block-head { display:flex;align-items:center;gap:8px;padding:7px 12px;background:var(--line-2);border-bottom:1px solid var(--line); }',
      '.canvas-type-tag { font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;padding:1px 6px;border-radius:3px;background:var(--accent-soft);color:var(--accent-ink); }',
      '.canvas-block-title { font-size:13px;font-weight:600;color:var(--ink); }',
      '.canvas-block-body { padding:10px 12px; }',
      '.cv-empty { font-size:13px;color:var(--muted);margin:0; }',
      '.cv-tree ul { margin:0;padding-left:18px;list-style:disc; }',
      '.cv-tree li { font-size:13px;color:var(--ink);line-height:1.5;padding:2px 0; }',
      '.cv-table { width:100%;border-collapse:collapse; }',
      '.cv-table th,.cv-table td { border:1px solid var(--line);padding:5px 9px;font-size:12px;text-align:left; }',
      '.cv-table th { background:var(--line-2);font-weight:600;color:var(--ink); }',
      '.cv-table td { color:var(--ink-2); }',
      '.cv-text p { font-size:13px;color:var(--ink);line-height:1.6;margin:4px 0; }',
```

**3b. Replace the "Artefact draft" section** (the last four lines of the right panel, currently):

```javascript
        '<div class="ac-section-head" style="flex-shrink:0">',
          '<span class="ac-section-label">Artefact draft</span>',
          '<span class="ac-badge" id="ac-draft-label" style="background:var(--line-2);color:var(--muted);border:1px solid var(--line)">waiting</span>',
        '</div>',
        '<div id="draft-content" role="region" aria-label="Artefact draft" style="flex:1 1 auto;overflow-y:auto;padding:20px 24px">',
          '<p style="color:var(--muted);font-size:13px">The artefact draft will build up here as the session progresses.</p>',
          (draftSections || ''),
        '</div>',
```

Replace with:

```javascript
        '<div class="cv-section-head">',
          '<span class="cv-section-label">Canvas</span>',
          '<div class="cv-pips" id="cv-pips">',
            '<span class="cv-pip" data-lens="A" title="Lens A">A</span>',
            '<span class="cv-pip" data-lens="B" title="Lens B">B</span>',
            '<span class="cv-pip" data-lens="C" title="Lens C">C</span>',
            '<span class="cv-pip" data-lens="D" title="Lens D">D</span>',
            '<span class="cv-pip" data-lens="E" title="Lens E">E</span>',
          '</div>',
        '</div>',
        '<div id="canvas-panel" role="region" aria-label="Canvas" style="flex:1 1 auto;overflow-y:auto;padding:16px">',
          '<p class="cv-empty">Lens output will appear here as the session progresses.</p>',
          (draftSections || ''),
        '</div>',
```

**3c. Update `renderCanvasBlock` wiring comment** in the inline `<script>` block at the bottom of `renderChat`. In the existing `<script>` block (around line 259), add a comment marker where Task 4 will inject `renderCanvasBlock` and `appendCanvasBlock`:

After `'// SSE pump wires: if(evt.conditionItem){appendConditionItem(evt.conditionItem);}',` add:
```javascript
      '// SSE pump wires: if(evt.canvasBlock){appendCanvasBlock(evt.canvasBlock);}',
      '// renderCanvasBlock and appendCanvasBlock added in inc4 Task 4',
```

### Step 4: Update `updateDraftPanel` in `skills.js`

In `src/web-ui/routes/skills.js`, in the `_renderChatPage` inline script (around line 1573), replace:

```javascript
    '  var panel = document.getElementById("draft-content");',
```

With:

```javascript
    '  var panel = document.getElementById("canvas-panel");',
```

### Step 5: Update `check-iwu2-right-panel-layout.js`

Make these targeted replacements:

**Line 2 comment:**
```javascript
// Verifies that renderChat() emits #assumption-cards and #canvas-panel as
```

**AC2 (line 43–44):**
```javascript
// AC2: #canvas-panel section exists (replaces #draft-content — inc4)
assert('AC2: HTML contains id="canvas-panel"', html.includes('id="canvas-panel"'));
```

**AC6 (lines 56–58):**
```javascript
// AC6: #canvas-panel has role="region" and aria-label
assert('AC6: #canvas-panel has role="region"', html.includes('role="region"'));
assert('AC6: #canvas-panel has aria-label="Canvas"', html.includes('aria-label="Canvas"'));
```

**AC7 (lines 60–61):**
```javascript
// AC7: #canvas-panel has flex:1 (flex:1 1 auto) in inline style
assert('AC7: #canvas-panel has flex:1 in inline style', html.includes('flex:1 1 auto'));
```

**AC8 (lines 63–66):**
```javascript
// AC8: #assumption-cards appears before #canvas-panel in document order
const assumptionPos = html.indexOf('id="assumption-cards"');
const canvasPos     = html.indexOf('id="canvas-panel"');
assert('AC8: #assumption-cards appears before #canvas-panel', assumptionPos < canvasPos && assumptionPos !== -1);
```

**AC10 (lines 72–73):**
```javascript
assert('AC10: placeholder text updated for canvas panel',
  html.includes('Lens output will appear here'));
```

### Step 6: Run test — T6 must pass

```
node tests/check-inc4-canvas-panel.js
```

Expected: `Results: 18 passed, 0 failed`

### Step 7: Run full suite — confirm iwu2 green

```
npm test
```

Expected: all tests passing (including iwu2 with updated assertions)

### Step 8: Commit

```
git add src/web-ui/views/chat-view.js src/web-ui/routes/skills.js tests/check-iwu2-right-panel-layout.js tests/check-inc4-canvas-panel.js
git commit -m "feat(inc4): replace #draft-content with #canvas-panel; add canvas CSS and section head"
```

---

## Task 4: `renderCanvasBlock` + `appendCanvasBlock` — AC4, AC5, AC6

**Model:** balanced
**Files:**
- Modify: `src/web-ui/views/chat-view.js` (inline script)
- Modify: `src/web-ui/routes/skills.js` (SSE pump wire-up)
- Modify: `tests/check-inc4-canvas-panel.js` (append T7/T8/T9)

### Step 1: Append T7/T8/T9 to test file

Replace the `// ── T7/T8/T9 — renderCanvasBlock` placeholder comment with:

```javascript
// ── T7/T8/T9 — renderCanvasBlock ─────────────────────────────────────────────
console.log('\n  T7/T8/T9 — renderCanvasBlock in inline script');
{
  const baseData2 = {
    skillName: 'ideate', skillLabel: 'Ideate', featureSlug: '', sessionId: 'test2',
    questionIndex: 1, totalQuestions: 1, currentQuestion: 'Hi?',
    priorQA: [], draftSections: [], pendingConfirmation: false,
    userInitial: 'M', modelLabel: 'test-model'
  };
  const cvHtml2 = renderChat(baseData2);

  // T7: renderCanvasBlock function present in inline script
  ok(cvHtml2.includes('function renderCanvasBlock'), 'T7: renderCanvasBlock present in page source');

  // T8: handles all three block types
  const rcStart = cvHtml2.indexOf('function renderCanvasBlock');
  const rcSrc   = cvHtml2.slice(rcStart, rcStart + 2000);
  ok(rcSrc.includes('cluster-tree'), 'T8: cluster-tree handler present');
  ok(rcSrc.includes('table'),        'T8: table handler present');
  ok(rcSrc.includes('text'),         'T8: text handler present');

  // T9: escHtmlClient used in renderCanvasBlock body
  ok(rcSrc.includes('escHtmlClient'), 'T9: escHtmlClient used in renderCanvasBlock');
}
```

### Step 2: Run test — T7/T8/T9 must fail

```
node tests/check-inc4-canvas-panel.js
```

Expected: T7/T8/T9 fail (`renderCanvasBlock present in page source` — not yet added)

### Step 3: Add `renderCanvasBlock` and `appendCanvasBlock` to `chat-view.js`

In the inline `<script>` block of `renderChat` (around line 243), **after** the closing `}` of `appendConditionItem` and the SSE pump comment, add:

```javascript
      'function renderCanvasBlock(block){',
        'var type=block.type||"";',
        'var title=escHtmlClient(block.title||"");',
        'var content=block.content||{};',
        'var bodyHtml="";',
        'if(type==="cluster-tree"){',
          'var clusters=content.clusters||[];',
          'var listItems=clusters.map(function(c){',
            'var name=escHtmlClient(String(c&&c.name?c.name:c));',
            'var children=(c&&c.children)||[];',
            'var childItems=children.map(function(ch){return"<li>"+escHtmlClient(String(ch))+"</li>";}).join("");',
            'return"<li>"+name+(childItems?"<ul>"+childItems+"</ul>":"")+"</li>";',
          '}).join("");',
          'bodyHtml="<div class=\\"cv-tree\\"><ul>"+listItems+"</ul></div>";',
        '}else if(type==="table"){',
          'var headers=(content.headers||[]).map(function(h){return"<th>"+escHtmlClient(String(h))+"</th>";}).join("");',
          'var rows=(content.rows||[]).map(function(row){',
            'var cells=(Array.isArray(row)?row:Object.values(row)).map(function(c){return"<td>"+escHtmlClient(String(c))+"</td>";}).join("");',
            'return"<tr>"+cells+"</tr>";',
          '}).join("");',
          'bodyHtml="<table class=\\"cv-table\\"><thead><tr>"+headers+"</tr></thead><tbody>"+rows+"</tbody></table>";',
        '}else if(type==="text"){',
          'var paras=(content.paragraphs||[String(content.text||"")]).map(function(p){return"<p>"+escHtmlClient(String(p))+"</p>";}).join("");',
          'bodyHtml="<div class=\\"cv-text\\">"+paras+"</div>";',
        '}',
        'var typeTag="<span class=\\"canvas-type-tag\\">"+escHtmlClient(type)+"</span>";',
        'return\'<div class="canvas-block">\'+',
          '\'<div class="canvas-block-head">\'+typeTag+\' <span class="canvas-block-title">\'+title+"</span></div>"+',
          '\'<div class="canvas-block-body">\'+bodyHtml+"</div></div>";',
      '}',
      'function appendCanvasBlock(block){',
        'var container=document.getElementById("canvas-panel");',
        'if(!container)return;',
        'var p=container.querySelector("p.cv-empty");if(p)p.remove();',
        'var wrapper=document.createElement("div");',
        'wrapper.innerHTML=renderCanvasBlock(block);',
        'container.appendChild(wrapper.firstChild||wrapper);',
      '}',
```

### Step 4: Wire `appendCanvasBlock` into the SSE pump in `skills.js`

In `src/web-ui/routes/skills.js`, in the `_renderChatPage` inline script SSE pump section (around line 1629, after `if(evt.conditionItem){`), add after the conditionItem handler:

```javascript
    '              if(evt.canvasBlock) {',
    '                appendCanvasBlock(evt.canvasBlock);',
    '              }',
```

### Step 5: Run test — T7/T8/T9 must pass

```
node tests/check-inc4-canvas-panel.js
```

Expected: `Results: 27 passed, 0 failed`

### Step 6: Run full suite — no regressions

```
npm test
```

Expected: all tests passing

### Step 7: Commit

```
git add src/web-ui/views/chat-view.js src/web-ui/routes/skills.js tests/check-inc4-canvas-panel.js
git commit -m "feat(inc4): add renderCanvasBlock + appendCanvasBlock for cluster-tree/table/text rendering"
```

---

## Task 5: Register test + regression check — AC7

**Model:** balanced
**Files:**
- Modify: `package.json`

### Step 1: Add test to package.json

In `package.json`, append to the end of the `scripts.test` value:

```
&& node tests/check-inc4-canvas-panel.js
```

(The current chain ends with `&& node tests/check-inc3-question-cadence.js`)

### Step 2: Run full suite — T10 verified

```
npm test
```

Expected: all tests passing, including new `check-inc4-canvas-panel.js` at the end.

The final line of output should include `[inc4-canvas-panel] Results: 27 passed, 0 failed`.

### Step 3: Commit

```
git add package.json
git commit -m "feat(inc4): register check-inc4-canvas-panel.js in test suite (AC7 regression gate)"
```

---

## Self-review checklist

- [x] Exact file paths — no `[placeholder]` remaining
- [x] Complete code in Step 3 of every task — not stubs
- [x] Failing test written before implementation step in every task
- [x] Expected output for every run command
- [x] Commit messages in imperative mood
- [x] No scope beyond inc4 ACs (no new skill steps, no unrelated refactors)
- [x] Known iwu2 regression handled explicitly in Task 3 per DoR guidance

---

## AC coverage

| AC | Tasks | Tests |
|----|-------|-------|
| AC1 — `parseCanvasBlock` | Task 1 | T1, T2, T3 |
| AC2 — `canvasBlock` SSE + strip | Task 2 | T4, T5 |
| AC3 — `#canvas-panel` in shell | Task 3 | T6 |
| AC4 — `renderCanvasBlock` all types | Task 4 | T7, T8 |
| AC5 — HTML escaping | Task 4 | T9 |
| AC6 — Keyboard nav + text label | Task 3 (role/aria), Task 4 (`.canvas-type-tag` visible text) | T6, T8 |
| AC7 — Regression | Task 5 | T10 (npm test) |
