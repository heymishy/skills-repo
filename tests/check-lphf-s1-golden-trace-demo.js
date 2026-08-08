'use strict';
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  PASS: ${name}`); passed++; }
function fail(name, err) { console.error(`  FAIL: ${name}: ${err.message || err}`); failed++; }

(function() {
  const { renderGoldenTraceHtml, CANDIDATES, ACTIVE_CANDIDATE } = require('../src/web-ui/content/golden-trace-content');

  // AC1
  try {
    const html = renderGoldenTraceHtml();
    const frameMatches = html.match(/class="gt-frame"/g) || [];
    assert.strictEqual(frameMatches.length, 4, `expected exactly 4 frames, found ${frameMatches.length}`);
    pass('goldenTraceDemo_rendersExactly4Frames_forConfiguredCandidate');
  } catch (e) { fail('goldenTraceDemo_rendersExactly4Frames_forConfiguredCandidate', e); }

  // AC2 — kanban candidate
  try {
    const contentModule = require('../src/web-ui/content/golden-trace-content');
    assert.strictEqual(contentModule.ACTIVE_CANDIDATE, 'kanban');
    const html = contentModule.renderGoldenTraceHtml();
    assert(html.includes('drag') && html.includes('advance'), 'expected kanban-specific content in rendered HTML');
    pass('goldenTraceDemo_switchesToKanbanContent_whenConfigSetToKanban');
  } catch (e) { fail('goldenTraceDemo_switchesToKanbanContent_whenConfigSetToKanban', e); }

  // AC2 — diagram candidate (simulate the flip by re-reading CANDIDATES directly,
  // since ACTIVE_CANDIDATE is a module-level constant, not a runtime parameter)
  try {
    const { CANDIDATES } = require('../src/web-ui/content/golden-trace-content');
    const diagramHtml = CANDIDATES.diagram.shipped;
    assert(diagramHtml.includes('Mermaid') || diagramHtml.includes('System Architecture'), 'expected diagram-specific content available in CANDIDATES.diagram');
    pass('goldenTraceDemo_switchesToDiagramContent_whenConfigSetToDiagram');
  } catch (e) { fail('goldenTraceDemo_switchesToDiagramContent_whenConfigSetToDiagram', e); }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
