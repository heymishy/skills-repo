# Structured diagnostic for a malformed canvas diagram marker — Implementation Plan

> **For agent execution:** Use /subagent-execution (subagents available).

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/s1-diagram-marker-diagnostic`
**Worktree:** `.worktrees/s1-diagram-marker-diagnostic`
**Test command:** `node scripts/run-all-tests.js` (full suite); individual file: `node tests/check-s1-diagram-marker-diagnostic.js`

---

## File map

```
Create:
  tests/check-s1-diagram-marker-diagnostic.js   — all tests for this story (S1's test plan)

Modify:
  src/web-ui/routes/skills.js                   — new parseCanvasBlockDiagnostic() function
                                                    (parseCanvasBlock becomes a thin wrapper over
                                                    it, preserving its exact existing return
                                                    contract for extractCanvasBlocksFromTurns);
                                                    the SSE scan loop in handlePostTurnStreamHtml
                                                    calls parseCanvasBlockDiagnostic directly and
                                                    emits a canvasDiagnostic SSE event + one bounded
                                                    retry's worth of session-level retry-state
                                                    tracking on failure; a minimal client-side
                                                    console.warn listener for the new event
```

---

## Task 1: `parseCanvasBlockDiagnostic` — richer failure shape, `parseCanvasBlock`'s contract unchanged

**Files:**
- Create: `tests/check-s1-diagram-marker-diagnostic.js`
- Modify: `src/web-ui/routes/skills.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-s1-diagram-marker-diagnostic.js`:

```javascript
'use strict';

// check-s1-diagram-marker-diagnostic.js
// Verifies S1: a malformed canvas diagram marker (invalid JSON or a disallowed
// type value) surfaces a structured diagnostic instead of silently vanishing.
//
// Run: node tests/check-s1-diagram-marker-diagnostic.js

var fs   = require('fs');
var path = require('path');
var SKILLS_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

function freshSkillsRoutes() {
  var resolved = require.resolve(SKILLS_PATH);
  delete require.cache[resolved];
  return require(resolved);
}

(async function main() {

console.log('\nTask 1 — parseCanvasBlockDiagnostic, parseCanvasBlock contract preserved');

await (async function() {
  var routes = freshSkillsRoutes();

  var invalidJsonMarker = '---CANVAS-JSON: {"type":"table", "title": broken}---';
  var diag1 = routes.parseCanvasBlockDiagnostic(invalidJsonMarker);
  ok('AC1: invalid JSON returns ok:false with reason invalid-json', diag1.ok === false && diag1.reason === 'invalid-json');
  ok('AC1: invalid JSON diagnostic includes a detail string', typeof diag1.detail === 'string' && diag1.detail.length > 0);

  var disallowedTypeMarker = '---CANVAS-JSON: {"type":"not-a-real-type","title":"x","content":{}}---';
  var diag2 = routes.parseCanvasBlockDiagnostic(disallowedTypeMarker);
  ok('AC2: disallowed type returns ok:false with reason disallowed-type', diag2.ok === false && diag2.reason === 'disallowed-type');
  ok('AC2: disallowed type diagnostic names the value', diag2.detail.indexOf('not-a-real-type') !== -1);
  ok('AC2: disallowed type diagnostic lists the allowlist', diag2.detail.indexOf('table') !== -1 && diag2.detail.indexOf('drift-signal') !== -1);

  var allowedTypeMarker = '---CANVAS-JSON: {"type":"table","title":"x","content":{"headers":[],"rows":[]}}---';
  var diag3 = routes.parseCanvasBlockDiagnostic(allowedTypeMarker);
  ok('AC2 negative control: an allowed type does not produce a disallowed-type diagnostic', diag3.ok === true);

  // AC5 regression: parseCanvasBlock's existing null-or-object contract is untouched.
  var ALL_7_TYPES = [
    { type: 'cluster-tree', content: { clusters: [] } },
    { type: 'table', content: { headers: [], rows: [] } },
    { type: 'text', content: { paragraphs: ['x'] } },
    { type: 'data-model', content: { mermaid: 'erDiagram' } },
    { type: 'system-architecture', content: { mermaid: 'flowchart TD' } },
    { type: 'program-design', content: { mermaid: 'flowchart TD' } },
    { type: 'drift-signal', content: { items: [] } }
  ];
  var allParsedCorrectly = ALL_7_TYPES.every(function(fixture) {
    var marker = '---CANVAS-JSON: ' + JSON.stringify(Object.assign({ title: 'x' }, fixture)) + '---';
    var parsed = routes.parseCanvasBlock(marker);
    return parsed && parsed.type === fixture.type;
  });
  ok('AC5: parseCanvasBlock still returns a valid object for all 7 existing types (contract unchanged)', allParsedCorrectly);

  ok('AC5 regression: parseCanvasBlock still returns null (not a diagnostic object) for a malformed marker', routes.parseCanvasBlock(invalidJsonMarker) === null);
  ok('AC5 regression: parseCanvasBlock still returns null for a disallowed type (not a diagnostic object)', routes.parseCanvasBlock(disallowedTypeMarker) === null);
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-s1-diagram-marker-diagnostic.js
```

Expected output: `TypeError: routes.parseCanvasBlockDiagnostic is not a function` (function does not exist yet)

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/skills.js`, replace the existing `parseCanvasBlock` function (currently at ~line 826-842):

```javascript
function parseCanvasBlockDiagnostic(text) {
  var MARKER_RE = /---CANVAS-JSON:\s*(\{[\s\S]*?\})\s*---/;
  // 'sequence' is added by S5, not this story -- see S1's Out of Scope section.
  var TYPE_ALLOW = ['cluster-tree', 'table', 'text', 'data-model', 'system-architecture', 'program-design', 'drift-signal'];
  var match = String(text).match(MARKER_RE);
  if (!match) {
    return { ok: false, reason: 'invalid-json', detail: 'No CANVAS-JSON marker body found in the given text' };
  }
  var parsed;
  try {
    parsed = JSON.parse(match[1]);
  } catch (parseErr) {
    return { ok: false, reason: 'invalid-json', detail: 'JSON parse error: ' + parseErr.message };
  }
  var type = String(parsed.type || '');
  if (TYPE_ALLOW.indexOf(type) === -1) {
    return { ok: false, reason: 'disallowed-type', detail: 'Disallowed type "' + type + '" — allowed types: ' + TYPE_ALLOW.join(', ') };
  }
  return { ok: true, block: parsed };
}

function parseCanvasBlock(text) {
  var result = parseCanvasBlockDiagnostic(text);
  return result.ok ? result.block : null;
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-s1-diagram-marker-diagnostic.js
```

Expected output: `9 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing (same 1 pre-existing flake, `check-p3.5-validate-trace.js`, already RISK-ACCEPTed)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/skills.js tests/check-s1-diagram-marker-diagnostic.js
git commit -m "feat(s1): add parseCanvasBlockDiagnostic, keep parseCanvasBlock's contract unchanged"
```

---

## Task 2: Wire the diagnostic into the SSE scan loop + audit log

**Files:**
- Modify: `src/web-ui/routes/skills.js`
- Modify: `tests/check-s1-diagram-marker-diagnostic.js`

- [ ] **Step 1: Write the failing test**

Append to `tests/check-s1-diagram-marker-diagnostic.js`, before the final `console.log('\n' + passed...)` line:

```javascript
console.log('\nTask 2 — diagnostic flows through the SSE scan loop + audit log');

function fakeStreamReq(sessionId, skillName) {
  return {
    session: { accessToken: 'test-token' },
    params:  { id: sessionId, name: skillName },
    on: function(event, cb) {
      if (event === 'data') { cb(Buffer.from(JSON.stringify({ answer: 'hi' }))); }
      if (event === 'end')  { cb(); }
      if (event === 'error') {}
    }
  };
}
function fakeStreamRes() {
  var r = { writtenData: [] };
  r.writeHead = function() {};
  r.write = function(d) { r.writtenData.push(d); };
  r.end = function() {};
  return r;
}

await (async function() {
  // AC1/AC2/Audit: a malformed (disallowed-type) marker in the model's own
  // streamed response emits a canvasDiagnostic SSE event and an audit log call,
  // driven through the REAL handlePostTurnStreamHtml via the existing
  // setSkillTurnExecutorStreamAdapter D37 seam -- same established pattern
  // check-inc4-canvas-panel.js already uses for the canvasBlock happy path.
  var routes = freshSkillsRoutes();
  var captured = [];
  routes.setLogger({ info: function(evt, data) { captured.push({ evt: evt, data: data }); }, error: function() {} });

  var sid = 'test-s1-t2-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'design', sessionPath: '/tmp/t', systemPrompt: '# design', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 's1-t2-feature'
  });

  var malformedMarker = '---CANVAS-JSON: {"type":"not-a-real-type","title":"x","content":{}}---';
  routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, content, token, onChunk) {
    onChunk(malformedMarker);
    return Promise.resolve(malformedMarker);
  });

  var res = fakeStreamRes();
  await routes.handlePostTurnStreamHtml(fakeStreamReq(sid, 'design'), res);

  var raw = res.writtenData.join('');
  ok('AC1: a canvasDiagnostic SSE event is written for a malformed marker', raw.indexOf('canvasDiagnostic') !== -1);
  ok('AC2: the diagnostic names the disallowed type and the allowlist', raw.indexOf('not-a-real-type') !== -1 && raw.indexOf('table') !== -1 && raw.indexOf('drift-signal') !== -1);

  var logEvent = captured.find(function(c) { return c.evt === 'canvas_marker_diagnostic'; });
  ok('Audit: the diagnostic is logged via the existing _logger convention', !!logEvent && logEvent.data.reason === 'disallowed-type');

  routes.setLogger({ info: function() {}, error: function() {} });
})();

await (async function() {
  // NFR-Security: raw script-like content in the malformed input must not
  // reach the SSE payload unescaped.
  var routes = freshSkillsRoutes();
  var sid = 'test-s1-t2-sec-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'design', sessionPath: '/tmp/t', systemPrompt: '# design', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 's1-t2-sec-feature'
  });

  var scriptLikeType = '<script>alert(1)</script>';
  var markerWithScriptInType = '---CANVAS-JSON: {"type":"' + scriptLikeType.replace(/"/g, '\\"') + '","title":"x","content":{}}---';
  routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, content, token, onChunk) {
    onChunk(markerWithScriptInType);
    return Promise.resolve(markerWithScriptInType);
  });

  var res = fakeStreamRes();
  await routes.handlePostTurnStreamHtml(fakeStreamReq(sid, 'design'), res);
  var raw = res.writtenData.join('');
  ok('NFR-Security: the diagnostic payload escapes raw <script> content from the malformed input', raw.indexOf('<script>alert(1)</script>') === -1);
})();

await (async function() {
  // Performance: no additional model/executor call attributable to diagnostic generation.
  var routes = freshSkillsRoutes();
  var sid = 'test-s1-t2-perf-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'design', sessionPath: '/tmp/t', systemPrompt: '# design', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 's1-t2-perf-feature'
  });

  var callCount = 0;
  var malformedMarker2 = '---CANVAS-JSON: {"type":"still-not-real","title":"x","content":{}}---';
  routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, content, token, onChunk) {
    callCount++;
    onChunk(malformedMarker2);
    return Promise.resolve(malformedMarker2);
  });

  await routes.handlePostTurnStreamHtml(fakeStreamReq(sid, 'design'), fakeStreamRes());
  ok('NFR-Performance: exactly one executor call for the turn -- diagnostic generation adds none', callCount === 1);
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-s1-diagram-marker-diagnostic.js
```

Expected output: `FAIL` on the `AC1`/`AC2`/`Audit` assertions — no `canvasDiagnostic` string ever appears in the SSE output and no `canvas_marker_diagnostic` log event fires, because the scan loop silently drops the malformed marker today (`if (_cvParsed) {...}` has no `else` branch), exactly as the story's Problem Statement describes.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/skills.js`, add a small server-side escape helper just above `parseCanvasBlockDiagnostic` (the diagnostic's `detail` field embeds attacker/model-controlled text verbatim, e.g. a disallowed `type` value — `JSON.stringify` does not escape `<`/`>`/`&`, so without this the raw characters reach the SSE payload unescaped; see NFR-Security, `diagnosticTextIsEscapedBeforeSsePayload` in the test plan):

```javascript
function _escSseDiagnosticText(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
```

Then replace the canvas-marker scan loop inside `handlePostTurnStreamHtml` (currently ~line 4900-4922):

```javascript
        // inc4: scan for canvas block markers
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
          var _cvDiag = parseCanvasBlockDiagnostic(_cvMarkerFull);
          if (_cvDiag.ok) {
            if (!session.canvasBlocks) { session.canvasBlocks = []; }
            session.canvasBlocks.push(_cvDiag.block);
            res.write('data: ' + JSON.stringify({ canvasBlock: {
              type:    _cvDiag.block.type    || '',
              title:   _cvDiag.block.title   || '',
              content: _cvDiag.block.content || {}
            } }) + '\n\n');
          } else {
            // S1 (AC1, AC2): a malformed marker no longer vanishes silently --
            // a structured diagnostic (reason + detail) is emitted via SSE and
            // logged, instead of the loop simply continuing with no signal.
            try {
              _logger.info('canvas_marker_diagnostic', { reason: _cvDiag.reason, detail: _cvDiag.detail });
            } catch (_diagLogErr) { /* logging must never break the stream */ }
            res.write('data: ' + JSON.stringify({ canvasDiagnostic: {
              reason: _cvDiag.reason,
              detail: _escSseDiagnosticText(_cvDiag.detail)
            } }) + '\n\n');
          }
        }
        _canvasBuf = _cvCleanBuf + _cvScanBuf;
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-s1-diagram-marker-diagnostic.js
```

Expected output: `14 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing (same 1 pre-existing flake). Re-confirm `check-inc4-canvas-panel.js` specifically — it exercises the SAME scan loop's happy path (`canvasBlock` SSE emission) and must still pass unchanged (AC5 regression, cross-checked against a sibling story's own test file, matching this session's own established discipline).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/skills.js tests/check-s1-diagram-marker-diagnostic.js
git commit -m "feat(s1): emit a structured canvasDiagnostic SSE event + audit log for a malformed marker"
```

---

## Task 3: One bounded retry — success and terminal-failure outcomes

**Files:**
- Modify: `src/web-ui/routes/skills.js`
- Modify: `tests/check-s1-diagram-marker-diagnostic.js`

- [ ] **Step 1: Write the failing test**

Append to `tests/check-s1-diagram-marker-diagnostic.js`, before the final `console.log('\n' + passed...)` line:

```javascript
console.log('\nTask 3 — one bounded retry: success and terminal-failure outcomes');

await (async function() {
  // AC3 (same-turn path): a failed marker followed by a corrected marker for
  // the SAME diagram identity, later in the SAME streamed turn, renders normally.
  var routes = freshSkillsRoutes();
  var sid = 'test-s1-t3-sameturn-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'design', sessionPath: '/tmp/t', systemPrompt: '# design', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 's1-t3-sameturn-feature'
  });

  var badMarker  = '---CANVAS-JSON: {"type":"not-a-real-type","title":"Diagram A","content":{}}---';
  var goodMarker = '---CANVAS-JSON: {"type":"table","title":"Diagram A","content":{"headers":[],"rows":[]}}---';
  routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, content, token, onChunk) {
    onChunk(badMarker + ' some text ' + goodMarker);
    return Promise.resolve(badMarker + goodMarker);
  });

  var res = fakeStreamRes();
  await routes.handlePostTurnStreamHtml(fakeStreamReq(sid, 'design'), res);
  var raw = res.writtenData.join('');
  ok('AC3 (same-turn): the diagnostic fires for the first failed attempt', raw.indexOf('canvasDiagnostic') !== -1);
  ok('AC3 (same-turn): the corrected marker renders normally as a canvasBlock', raw.indexOf('"canvasBlock"') !== -1 && raw.indexOf('"Diagram A"') !== -1);
})();

await (async function() {
  // AC3 (next-turn path): a failure in one turn, corrected in the FOLLOWING turn.
  var routes = freshSkillsRoutes();
  var sid = 'test-s1-t3-nextturn-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'design', sessionPath: '/tmp/t', systemPrompt: '# design', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 's1-t3-nextturn-feature'
  });

  var badMarker2  = '---CANVAS-JSON: {"type":"not-a-real-type","title":"Diagram B","content":{}}---';
  var goodMarker2 = '---CANVAS-JSON: {"type":"table","title":"Diagram B","content":{"headers":[],"rows":[]}}---';

  routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, content, token, onChunk) {
    onChunk(badMarker2);
    return Promise.resolve(badMarker2);
  });
  await routes.handlePostTurnStreamHtml(fakeStreamReq(sid, 'design'), fakeStreamRes());

  routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, content, token, onChunk) {
    onChunk(goodMarker2);
    return Promise.resolve(goodMarker2);
  });
  var res2 = fakeStreamRes();
  await routes.handlePostTurnStreamHtml(fakeStreamReq(sid, 'design'), res2);
  var raw2 = res2.writtenData.join('');
  ok('AC3 (next-turn): the corrected marker in the following turn renders normally', raw2.indexOf('"canvasBlock"') !== -1 && raw2.indexOf('"Diagram B"') !== -1);
})();

await (async function() {
  // AC4: a SECOND consecutive failure for the same diagram identity is
  // terminal -- the diagnostic still fires (visibility is not lost), but the
  // outcome is distinguishable from AC3's successful-retry case.
  var routes = freshSkillsRoutes();
  var sid = 'test-s1-t4-terminal-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'design', sessionPath: '/tmp/t', systemPrompt: '# design', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 's1-t4-terminal-feature'
  });

  var badMarker3a = '---CANVAS-JSON: {"type":"not-a-real-type","title":"Diagram C","content":{}}---';
  var badMarker3b = '---CANVAS-JSON: {"type":"still-not-real","title":"Diagram C","content":{}}---';

  routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, content, token, onChunk) {
    onChunk(badMarker3a);
    return Promise.resolve(badMarker3a);
  });
  await routes.handlePostTurnStreamHtml(fakeStreamReq(sid, 'design'), fakeStreamRes());

  routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, content, token, onChunk) {
    onChunk(badMarker3b);
    return Promise.resolve(badMarker3b);
  });
  var res3 = fakeStreamRes();
  await routes.handlePostTurnStreamHtml(fakeStreamReq(sid, 'design'), res3);
  var raw3 = res3.writtenData.join('');

  var diagnosticEvents = raw3.match(/canvasDiagnostic/g) || [];
  ok('AC4: the second consecutive failure still fires its own diagnostic (visibility not lost)', diagnosticEvents.length >= 1);
  ok('AC4: the second failure is marked terminal, distinguishable from a retriable first failure', raw3.indexOf('"terminal":true') !== -1);
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-s1-diagram-marker-diagnostic.js
```

Expected output: `FAIL` on AC4's terminal-flag assertion — no retry-state tracking exists yet, so every failure looks identical regardless of how many times the same diagram has failed before.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/skills.js`, extend the `else` branch added in Task 2 with retry-state tracking, keyed on `skillName + type-of-current-attempt + title` and stored on the session object (so it persists across turns for the next-turn retry path, per AC3):

```javascript
          } else {
            // S1 (AC3, AC4): track one bounded retry per diagram identity.
            // Keyed on skillName+title since a malformed marker's own `type`
            // may legitimately differ between the failed attempt and its
            // correction (e.g. a typo'd type value) -- title is the stable
            // identity the operator/model both understand as "the same diagram".
            if (!session._canvasFailureState) { session._canvasFailureState = {}; }
            var _cvIdentityMatch = _cvMarkerFull.match(/"title"\s*:\s*"([^"]*)"/);
            var _cvIdentity = (session.skillName || '') + '::' + (_cvIdentityMatch ? _cvIdentityMatch[1] : '');
            var _cvAlreadyFailed = !!session._canvasFailureState[_cvIdentity];
            session._canvasFailureState[_cvIdentity] = true;

            try {
              _logger.info('canvas_marker_diagnostic', { reason: _cvDiag.reason, detail: _cvDiag.detail, terminal: _cvAlreadyFailed });
            } catch (_diagLogErr) { /* logging must never break the stream */ }
            res.write('data: ' + JSON.stringify({ canvasDiagnostic: {
              reason: _cvDiag.reason,
              detail: _cvDiag.detail,
              terminal: _cvAlreadyFailed
            } }) + '\n\n');
          }
```

And clear the retry state on a successful parse for the same identity (in the `if (_cvDiag.ok)` branch above it):

```javascript
          if (_cvDiag.ok) {
            if (session._canvasFailureState) {
              var _cvOkIdentity = (session.skillName || '') + '::' + (_cvDiag.block.title || '');
              delete session._canvasFailureState[_cvOkIdentity];
            }
            if (!session.canvasBlocks) { session.canvasBlocks = []; }
            session.canvasBlocks.push(_cvDiag.block);
            res.write('data: ' + JSON.stringify({ canvasBlock: {
              type:    _cvDiag.block.type    || '',
              title:   _cvDiag.block.title   || '',
              content: _cvDiag.block.content || {}
            } }) + '\n\n');
          } else {
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-s1-diagram-marker-diagnostic.js
```

Expected output: `19 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing (same 1 pre-existing flake). Re-confirm `check-inc4-canvas-panel.js` again — `session._canvasFailureState` is a new field on the session object; confirm nothing in the existing session shape assumes a closed/known field set that this would violate.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/skills.js tests/check-s1-diagram-marker-diagnostic.js
git commit -m "feat(s1): track one bounded retry per diagram identity, mark a second failure terminal"
```

---

## Task 4: Minimal client-side console listener (added at contract review)

**Files:**
- Modify: `src/web-ui/routes/skills.js`

- [ ] **Step 1: Write the failing test**

Append to `tests/check-s1-diagram-marker-diagnostic.js`, before the final `console.log('\n' + passed...)` line:

```javascript
console.log('\nTask 4 — minimal client-side console listener for canvasDiagnostic');

await (async function() {
  // Source-inspection test (client-side inline script, no jsdom harness for
  // this file) -- same technique already established for the "AC1 client
  // render" style checks elsewhere in this codebase (e.g. res-s4's own
  // materiality-button test). Confirms the listener exists and is scoped to
  // the SSE dispatcher's own evt-handling block, not a stray, unused snippet.
  var skillsSrc = fs.readFileSync(SKILLS_PATH, 'utf8');
  var dispatcherMatch = skillsSrc.match(/if\(evt\.canvasBlock\)\s*\{[\s\S]*?\n\s*\}/);
  ok('dispatcher block found (anchor for locating the new listener nearby)', !!dispatcherMatch);

  var hasCanvasDiagnosticListener = /evt\.canvasDiagnostic/.test(skillsSrc);
  ok('AC1 (client-visible signal): a client-side listener for evt.canvasDiagnostic exists', hasCanvasDiagnosticListener);

  var listenerMatch = skillsSrc.match(/if\(evt\.canvasDiagnostic\)\s*\{([\s\S]*?)\n\s*\}/);
  ok('the listener logs to the console (minimal signal, not a full UI treatment per contract)', !!listenerMatch && /console\.(warn|error)/.test(listenerMatch[1]));
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-s1-diagram-marker-diagnostic.js
```

Expected output: `FAIL` — no `evt.canvasDiagnostic` reference exists in the client-side script yet.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/skills.js`, in the client-side SSE event dispatcher (the inline script array), add a sibling branch immediately after the existing `canvasBlock` handler (currently ~line 3779-3781):

```javascript
    '              if(evt.canvasBlock) {',
    '                appendCanvasBlock(evt.canvasBlock);',
    '              }',
    '              if(evt.canvasDiagnostic) {',
    '                console.warn("[canvas-diagnostic] " + evt.canvasDiagnostic.reason + ": " + evt.canvasDiagnostic.detail + (evt.canvasDiagnostic.terminal ? " (terminal -- no further retry)" : ""));',
    '              }',
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-s1-diagram-marker-diagnostic.js
```

Expected output: `22 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing (same 1 pre-existing flake).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/skills.js
git commit -m "feat(s1): add minimal client-side console listener for canvasDiagnostic events"
```

---

## After all tasks: open the draft PR

Once all 4 tasks are committed and the full suite passes, run `/verify-completion` then `/branch-complete` per the standard inner-loop sequence. Per the DoR's Coding Agent Instructions: open a draft PR when tests pass — do not mark ready for review.
