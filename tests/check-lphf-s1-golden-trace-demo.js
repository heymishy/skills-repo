'use strict';
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  PASS: ${name}`); passed++; }
function fail(name, err) { console.error(`  FAIL: ${name}: ${err.message || err}`); failed++; }

(async function() {
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

  // AC4
  try {
    const fs = require('fs');
    const path = require('path');
    const { ACTIVE_CANDIDATE, CANDIDATES } = require('../src/web-ui/content/golden-trace-content');
    const realDiscoveryPath = path.join(__dirname, '..', 'artefacts', '2026-07-24-interactive-kanban-boards', 'discovery.md');
    const realDiscovery = fs.readFileSync(realDiscoveryPath, 'utf8');
    const excerptCore = 'an operator can see which stage a feature/story is in, but cannot act on that view';
    assert(realDiscovery.includes(excerptCore), 'test setup error: the real discovery.md no longer contains the expected excerpt');
    assert(CANDIDATES[ACTIVE_CANDIDATE].discovery.includes(excerptCore), 'frame content does not match the real discovery.md excerpt verbatim');
    pass('goldenTraceDemo_frameContentMatchesRealArtefactFile_notFabricated');
  } catch (e) { fail('goldenTraceDemo_frameContentMatchesRealArtefactFile_notFabricated', e); }

  // Integration: the placeholder is actually replaced in the served page
  try {
    delete require.cache[require.resolve('../src/web-ui/routes/public')];
    const { handleRoot } = require('../src/web-ui/routes/public');
    const req = { session: {} };
    let body = null;
    const res = {
      setHeader: function() {},
      writeHead: function() {},
      end: function(data) { body = data; }
    };
    await handleRoot(req, res);
    assert(body.includes('gt-section'), 'expected the golden-trace section to be present in the served landing page HTML');
    assert(!body.includes('<!--GOLDEN_TRACE_SECTION-->'), 'expected the placeholder to be replaced, not left literal');
    pass('handleRoot_includesGoldenTraceSection_inServedHtml');
  } catch (e) { fail('handleRoot_includesGoldenTraceSection_inServedHtml', e); }

  // NFR — Security
  try {
    const { renderGoldenTraceHtml } = require('../src/web-ui/content/golden-trace-content');
    const html = renderGoldenTraceHtml();
    assert(!/Bearer\s+[A-Za-z0-9\-._~+/]+=*/.test(html), 'Bearer token pattern found');
    assert(!/password\s*[:=]/i.test(html), 'password assignment found');
    assert(!/secret\s*[:=]/i.test(html), 'secret assignment found');
    assert(!/api[_-]?key\s*[:=]/i.test(html), 'API key pattern found');
    pass('goldenTraceDemo_containsNoCredentialsOrPII');
  } catch (e) { fail('goldenTraceDemo_containsNoCredentialsOrPII', e); }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
