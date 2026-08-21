# Fix the read-only-view maximise-button ReferenceError and the stuck "Assigning…" button label — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** The three maximise/fullscreen toggle functions work regardless of `readOnly`; the bulk-assign button label resets after a successful assign.
**Branch:** `feature/cmba-s1`
**Worktree:** `.worktrees/cmba-s1`
**Test command:** `node tests/check-cmba-s1-readonly-maximise-and-stuck-label.js`

---

## File map

```
Create:
  tests/check-cmba-s1-readonly-maximise-and-stuck-label.js  — AC1-AC4 regression tests

Modify:
  src/web-ui/views/chat-view.js   — split the 3 toggle functions out of the readOnly-gated scriptHtml block
  src/web-ui/routes/products.js   — reset btn label in bmauAssignToModule's success handler
```

---

## Task 1: RED — write the four failing tests

**Files:**
- Create: `tests/check-cmba-s1-readonly-maximise-and-stuck-label.js`

- [ ] **Step 1: Write the test file**

```javascript
#!/usr/bin/env node
// check-cmba-s1-readonly-maximise-and-stuck-label.js — cmba-s1
'use strict';

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else       { console.log('  ✗ ' + label); failed++; }
}

const { renderChat } = require('../src/web-ui/views/chat-view');
const fs = require('fs');
const path = require('path');

function extractFnBody(src, fnName) {
  const re = new RegExp('function\\s+' + fnName + '\\s*\\(\\)\\s*\\{');
  const m = re.exec(src);
  if (!m) return null;
  let depth = 0;
  let start = m.index + m[0].length - 1;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  return null;
}

const designData = {
  skillName: 'design', skillLabel: 'Design', featureSlug: 'test-feature', sessionId: 'test-session',
  questionIndex: 1, totalQuestions: 1, currentQuestion: 'Hello?',
  priorQA: [], draftSections: [], pendingConfirmation: false,
  userInitial: 'M', modelLabel: 'test-model'
};

// ── Test 1 — swToggleCanvasFs/swExpandCanvas defined in read-only render (AC1) ──
console.log('\n  Test 1 — readOnlyRender_swToggleCanvasFsAndSwExpandCanvas_areDefined (AC1)');
{
  const html = renderChat(Object.assign({}, designData, { readOnly: true }));
  ok(extractFnBody(html, 'swToggleCanvasFs') !== null, 'AC1: swToggleCanvasFs() is defined in a read-only render');
  ok(extractFnBody(html, 'swExpandCanvas') !== null, 'AC1: swExpandCanvas() is defined in a read-only render');
}

// ── Test 2 — maximise-diagrams button wiring is real in a read-only render (AC1) ──
console.log('\n  Test 2 — readOnlyRender_maximiseDiagramsButton_callsARealDefinedFunction (AC1)');
{
  const html = renderChat(Object.assign({}, designData, { readOnly: true }));
  ok(/id="sw-canvas-fs-btn"[^>]*onclick="swToggleCanvasFs\(\)"/.test(html), 'AC1: maximise-diagrams button still wired to swToggleCanvasFs()');
  ok(extractFnBody(html, 'swToggleCanvasFs') !== null, 'AC1: the function it calls is actually defined in the same render');
}

// ── Test 3 — swToggleArtefactFs defined in a read-only render (AC2) ──
console.log('\n  Test 3 — readOnlyRender_swToggleArtefactFs_isDefined (AC2)');
{
  const html = renderChat(Object.assign({}, designData, { readOnly: true }));
  ok(extractFnBody(html, 'swToggleArtefactFs') !== null, 'AC2: swToggleArtefactFs() is defined in a read-only render');
}

// ── Test 4 — live-session behaviour unchanged (AC3, regression) ──
console.log('\n  Test 4 — liveSessionRender_allThreeFunctionsAndLiveOnlyContent_stillPresent (AC3)');
{
  const html = renderChat(Object.assign({}, designData, { readOnly: false }));
  ok(extractFnBody(html, 'swToggleCanvasFs') !== null, 'AC3: swToggleCanvasFs() still present for live sessions');
  ok(extractFnBody(html, 'swExpandCanvas') !== null, 'AC3: swExpandCanvas() still present for live sessions');
  ok(extractFnBody(html, 'swToggleArtefactFs') !== null, 'AC3: swToggleArtefactFs() still present for live sessions');
  ok(/appendConditionItem/.test(html), 'AC3: live-session-only SSE-pump helper (appendConditionItem) still present');
  ok(/metaKey\|\|e\.ctrlKey/.test(html) || /e\.metaKey\s*\|\|\s*e\.ctrlKey/.test(html), 'AC3: Cmd/Ctrl+Enter submit handler still present for live sessions');
  ok(/id="chat-form"/.test(html), 'AC3: live-session input form still rendered');
}

// ── Test 5 — bulk-assign success handler resets the button label (AC4) ──
console.log('\n  Test 5 — bmauAssignToModule_successHandler_resetsButtonLabel (AC4)');
{
  const productsSrc = fs.readFileSync(path.resolve(__dirname, '../src/web-ui/routes/products.js'), 'utf8');
  const fnMatch = /function\s+bmauAssignToModule\(productId,csrfToken\)\{/.exec(productsSrc);
  ok(fnMatch !== null, 'AC4: bmauAssignToModule found in products.js source');
  if (fnMatch) {
    let depth = 0; let start = fnMatch.index + fnMatch[0].length - 1; let end = -1;
    for (let i = start; i < productsSrc.length; i++) {
      if (productsSrc[i] === '{') depth++;
      else if (productsSrc[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    const fnBody = productsSrc.slice(start, end + 1);
    const thenMatch = /\.then\(function\(\)\{[\s\S]*?bmauUpdateSelection\(\);[\s\S]*?\}\)/.exec(fnBody);
    ok(thenMatch !== null, 'AC4: success .then() handler found');
    ok(thenMatch && /btn\.disabled\s*=\s*false/.test(thenMatch[0]), 'AC4: success handler resets btn.disabled to false');
    ok(thenMatch && /btn\.textContent\s*=\s*origText/.test(thenMatch[0]), 'AC4: success handler resets btn.textContent to origText');
  }
}

console.log('\n[cmba-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 2: Run — must fail**

```bash
node tests/check-cmba-s1-readonly-maximise-and-stuck-label.js
```

Expected output: Test 1, 2, 3 fail (functions absent in read-only render). Test 5's `btn.disabled=false`/`btn.textContent=origText` assertions fail (not present in the success handler). Test 4 should already pass (live-session behaviour is currently correct and unaffected).

- [ ] **Step 3: Commit**

```bash
git add tests/check-cmba-s1-readonly-maximise-and-stuck-label.js
git commit -m "test(cmba-s1): add failing tests for readonly-maximise ReferenceError and stuck bulk-assign label"
```

---

## Task 2: GREEN — implement both fixes

**Files:**
- Modify: `src/web-ui/views/chat-view.js`
- Modify: `src/web-ui/routes/products.js`

- [ ] **Step 1: Split the three toggle functions out of the readOnly-gated block in chat-view.js**

Move the `swToggleArtefactFs`, `swToggleCanvasFs`, `swExpandCanvas` function definitions (currently inside the `data.readOnly ? '' : (...)` -gated `scriptHtml` block) into a new, always-emitted script block. Add this new block unconditionally (not gated on `data.readOnly`), e.g. immediately before the `scriptHtml` declaration:

```javascript
const alwaysOnScriptHtml =
  '<script>' +
    'function swToggleArtefactFs(){var p=document.getElementById("sw-artefact-pane");var b=document.getElementById("sw-artefact-fs-btn");if(!p)return;p.classList.toggle("ad-fs");b.textContent=p.classList.contains("ad-fs")?"⊡":"⊞";}' +
    'function swToggleCanvasFs(){var p=document.getElementById("canvas-section");if(!p)return;p.classList.toggle("canvas-fs");var g=p.classList.contains("canvas-fs")?"⊡":"⊞";var b1=document.getElementById("sw-canvas-fs-btn");if(b1)b1.textContent=g;var b2=document.getElementById("sw-expand-canvas");if(b2)b2.textContent=g;}' +
    'function swExpandCanvas(){swToggleCanvasFs();}' +
  '</script>';
```

Remove the three function definitions from inside the existing `scriptHtml` block's `readOnly ? '' : (...)` branch (leave everything else in `scriptHtml` — the SSE-pump `appendConditionItem`, the keydown listener — exactly as-is, still gated on `readOnly`).

Add `alwaysOnScriptHtml` to the function's return array, alongside the existing `scriptHtml` (find the `return [ ... scriptHtml ]` near the end of the render function — check line ~523 per the earlier grep — and add `alwaysOnScriptHtml` to that same array, e.g. right before `scriptHtml`).

- [ ] **Step 2: Reset the bulk-assign button label in products.js**

Find `bmauAssignToModule`'s success `.then()` handler (ends with `bmauUpdateSelection();` before the `.catch()`). Add immediately after `bmauUpdateSelection();`:

```javascript
'btn.disabled=false;btn.textContent=origText;'
```

- [ ] **Step 3: Run — all 5 tests must pass**

```bash
node tests/check-cmba-s1-readonly-maximise-and-stuck-label.js
```

Expected output: `[cmba-s1] Results: 12 passed, 0 failed` (exact count depends on final assertion count — all assertions across Tests 1-5 pass).

- [ ] **Step 4: Run the two directly-related pre-existing suites — no regression**

```bash
node tests/check-cdpl-s1-canvas-panel-layout-fix.js
node tests/check-bmau-s1-bulk-assign-checkbox-ui.js
```

Expected output: 15/15 and 5/5, unchanged from baseline.

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/views/chat-view.js src/web-ui/routes/products.js
git commit -m "fix(cmba-s1): always-emit maximise/fullscreen toggle functions; reset bulk-assign label on success"
```

---
