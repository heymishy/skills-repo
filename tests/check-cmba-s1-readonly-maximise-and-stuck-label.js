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
  ok(/e\.metaKey\s*\|\|\s*e\.ctrlKey/.test(html), 'AC3: Cmd/Ctrl+Enter submit handler still present for live sessions');
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
