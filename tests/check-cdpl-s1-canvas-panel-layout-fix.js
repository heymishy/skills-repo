#!/usr/bin/env node
// check-cdpl-s1-canvas-panel-layout-fix.js — AC verification for cdpl-s1
// (Stop the artefact panel squeezing the diagram panel, and fix the dead
// "maximise canvas" button). Follows the plain-Node pattern established by
// tests/check-inc4-canvas-panel.js: call renderChat() directly and assert
// on the returned HTML string. No server, no fixtures.
'use strict';

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else       { console.log('  ✗ ' + label); failed++; }
}

const { renderChat } = require('../src/web-ui/views/chat-view');

const designData = {
  skillName: 'design', skillLabel: 'Design', featureSlug: 'test-feature', sessionId: 'test-session',
  questionIndex: 1, totalQuestions: 1, currentQuestion: 'Hello?',
  priorQA: [], draftSections: [], pendingConfirmation: false,
  userInitial: 'M', modelLabel: 'test-model'
};

const ideateData = {
  skillName: 'ideate', skillLabel: 'Ideate', featureSlug: 'test-feature', sessionId: 'test-session-2',
  questionIndex: 1, totalQuestions: 1, currentQuestion: 'Hi?',
  priorQA: [], draftSections: [], pendingConfirmation: false,
  userInitial: 'M', modelLabel: 'test-model'
};

// ── Test 1 — renderChat_designSkill_artefactPanelHasMaxHeightStyle (AC1) ─────
// dsa-s4 (2026-09-20): the height cap that stops #artefact-panel squeezing
// #canvas-panel moved from a max-height style on #artefact-panel itself to
// a flex-basis cap on its new resizable wrapper, #sw-artefact-top-group
// (part of dsa-s4's AC3 resizable-pane mechanism). #artefact-panel is still
// height-constrained -- via its ancestor's flex:0 0 <pct>% + overflow:hidden
// -- just not via its own inline style anymore. See decisions.md,
// "dsa-s4 Task 4: 3 pre-existing check-scripts assert max-height on the
// wrong element after Task 3's resizable-pane refactor".
console.log('\n  Test 1 — renderChat_designSkill_artefactPanelHasMaxHeightStyle (AC1)');
{
  const html = renderChat(designData);
  const m = html.match(/<div id="artefact-panel"[^>]*style="([^"]*)"/);
  ok(m !== null, 'AC1: #artefact-panel element with a style attribute is present');
  const wrapper = html.match(/<div id="sw-artefact-top-group"[^>]*style="([^"]*)"/);
  ok(wrapper !== null, 'AC1: #artefact-panel is wrapped in a #sw-artefact-top-group height-capping container');
  ok(wrapper && /flex\s*:\s*0\s+0\s+\d/.test(wrapper[1]) && /overflow\s*:\s*hidden/.test(wrapper[1]),
    'AC1: #sw-artefact-top-group caps height via flex-basis + overflow:hidden (the new containment mechanism, replacing the old max-height style)');
}

// ── Test 2 — renderChat_designSkill_canvasPanelHasMinHeightDeclaration (AC2) ─
console.log('\n  Test 2 — renderChat_designSkill_canvasPanelHasMinHeightDeclaration (AC2)');
{
  const html = renderChat(designData);
  const m = html.match(/<div id="canvas-panel"[^>]*style="([^"]*)"/);
  ok(m !== null, 'AC2: #canvas-panel element with a style attribute is present');
  ok(m && /flex\s*:\s*1\s+1\s+auto/.test(m[1]), 'AC2: #canvas-panel retains flex:1 1 auto');
  ok(m && /min-height\s*:/.test(m[1]), 'AC2: #canvas-panel style includes a min-height declaration');
}

// ── Test 3 — renderChat_designSkill_diagramsHeaderHasMaximiseButton (AC3) ────
console.log('\n  Test 3 — renderChat_designSkill_diagramsHeaderHasMaximiseButton (AC3)');
{
  const html = renderChat(designData);
  const headIdx = html.indexOf('cv-section-label">Diagrams');
  ok(headIdx !== -1, 'AC3: Diagrams section header is present');
  const headerSlice = html.slice(Math.max(0, headIdx - 400), headIdx + 600);
  ok(/class="ad-fs-btn"/.test(headerSlice), 'AC3: new maximise button reuses the ad-fs-btn class (not a newly invented class name)');
  ok(/onclick="swToggleCanvasFs\(\)"/.test(headerSlice), 'AC3: maximise button wired to a toggle function following the swToggleArtefactFs() naming convention');
}

// ── Test 4 — swExpandCanvas_functionIsDefined_inRenderedScript (AC4) ─────────
console.log('\n  Test 4 — swExpandCanvas_functionIsDefined_inRenderedScript (AC4)');
{
  const html = renderChat(ideateData);
  ok(/function\s+swExpandCanvas\s*\(/.test(html), 'AC4: swExpandCanvas() is now defined in the rendered script (was previously referenced via onclick but never defined)');
}

// ── Test 5 — toggleMechanism_isSharedNotDuplicated (Architecture Constraint) ─
console.log('\n  Test 5 — toggleMechanism_isSharedNotDuplicated_betweenArtefactAndCanvasMaximise');
{
  const html = renderChat(designData);

  function extractFnBody(src, fnName) {
    const re = new RegExp('function\\s+' + fnName + '\\s*\\(\\)\\s*\\{');
    const m = re.exec(src);
    if (!m) return null;
    // find matching closing brace by simple depth count from the opening brace
    let depth = 0;
    let start = m.index + m[0].length - 1; // index of the opening '{'
    for (let i = start; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') {
        depth--;
        if (depth === 0) return src.slice(start, i + 1);
      }
    }
    return null;
  }

  const artefactFsBody = extractFnBody(html, 'swToggleArtefactFs');
  ok(artefactFsBody !== null, 'swToggleArtefactFs() body is present (baseline reference implementation)');
  ok(artefactFsBody && /classList\.toggle\(/.test(artefactFsBody), 'swToggleArtefactFs() uses classList.toggle(...)');

  const canvasFsBody = extractFnBody(html, 'swToggleCanvasFs');
  ok(canvasFsBody !== null, 'swToggleCanvasFs() (new canvas-maximise function) is present');
  ok(canvasFsBody && /classList\.toggle\(/.test(canvasFsBody), 'swToggleCanvasFs() uses classList.toggle(...) — same mechanism, not a reinvented one');

  const expandCanvasBody = extractFnBody(html, 'swExpandCanvas');
  ok(expandCanvasBody !== null, 'swExpandCanvas() body is present');
  // swExpandCanvas() must delegate to the shared mechanism, either by calling
  // swToggleCanvasFs() directly (thin alias, per the DoR contract's own
  // stated assumption) or by independently containing the identical
  // classList.toggle(...) shape. Either way it must not invent a different
  // fullscreen approach (e.g. a style.display flip, a different class name
  // pattern, or a modal/overlay mechanism).
  const delegatesToShared = expandCanvasBody && /swToggleCanvasFs\s*\(\)/.test(expandCanvasBody);
  const reimplementsSharedShape = expandCanvasBody && /classList\.toggle\(/.test(expandCanvasBody);
  ok(delegatesToShared || reimplementsSharedShape, 'swExpandCanvas() uses the shared toggle mechanism (delegates to swToggleCanvasFs() or uses the identical classList.toggle(...) shape) — not a second, independent fullscreen implementation');
}

// ── Report ───────────────────────────────────────────────────────────────────
console.log('\n[cdpl-s1-canvas-panel-layout-fix] Results: ' + passed + ' passed, ' + failed + ' failed\n');
if (failed > 0) { process.exit(1); }
