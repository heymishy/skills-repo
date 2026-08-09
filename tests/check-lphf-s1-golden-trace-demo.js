'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  PASS: ${name}`); passed++; }
function fail(name, err) { console.error(`  FAIL: ${name}: ${err.message || err}`); failed++; }

(async function() {
  const { renderGoldenTraceHtml, CONTENT } = require('../src/web-ui/content/golden-trace-content');

  // AC1
  try {
    const html = renderGoldenTraceHtml();
    const frameMatches = html.match(/class="gt-frame"/g) || [];
    assert.strictEqual(frameMatches.length, 4, `expected exactly 4 frames, found ${frameMatches.length}`);
    pass('goldenTraceDemo_rendersExactly4Frames_forConfiguredCandidate');
  } catch (e) { fail('goldenTraceDemo_rendersExactly4Frames_forConfiguredCandidate', e); }

  // gtcl-s1 AC4 — regression guard for the single locked-in kanban content
  // (retires the old "flip a config value between the two candidates" AC2,
  // since the mechanism it tested no longer exists)
  try {
    const html = renderGoldenTraceHtml();
    assert(html.includes('drag') && html.includes('advance'), 'expected kanban-specific content in rendered HTML');
    pass('goldenTraceDemo_rendersKanbanContent_asTheOnlyLockedInCandidate');
  } catch (e) { fail('goldenTraceDemo_rendersKanbanContent_asTheOnlyLockedInCandidate', e); }

  // gtcl-s1 AC2 — losing candidate's content fully removed
  try {
    const sourcePath = path.join(__dirname, '..', 'src', 'web-ui', 'content', 'golden-trace-content.js');
    const source = fs.readFileSync(sourcePath, 'utf8');
    ['code-shape-diagrams', 'System Architecture', 'Mermaid SVG', 'csd-s2', 'ADR-026'].forEach(function(distinguishingString) {
      assert(!source.includes(distinguishingString), `expected diagram candidate's content ("${distinguishingString}") to be fully removed, but found it`);
    });
    pass('goldenTraceContent_losingCandidateContentFullyRemoved');
  } catch (e) { fail('goldenTraceContent_losingCandidateContentFullyRemoved', e); }

  // gtcl-s1 AC3 — no ACTIVE_CANDIDATE/CANDIDATES selector mechanism remains
  try {
    const sourcePath = path.join(__dirname, '..', 'src', 'web-ui', 'content', 'golden-trace-content.js');
    const source = fs.readFileSync(sourcePath, 'utf8');
    assert(!source.includes('ACTIVE_CANDIDATE'), 'expected no ACTIVE_CANDIDATE selector to remain in source');
    assert(!source.includes('CANDIDATES'), 'expected no CANDIDATES lookup object to remain in source');
    pass('goldenTraceContent_noActiveCandidateSelectorRemains');
  } catch (e) { fail('goldenTraceContent_noActiveCandidateSelectorRemains', e); }

  // gtcl-s1 AC5 — rendered output byte-identical to before this change
  try {
    const fixturePath = path.join(__dirname, 'fixtures', 'golden-trace-pre-gtcl-s1.html');
    const preChangeHtml = fs.readFileSync(fixturePath, 'utf8');
    const postChangeHtml = renderGoldenTraceHtml();
    assert.strictEqual(postChangeHtml, preChangeHtml, 'rendered golden-trace HTML must be byte-identical before and after this cleanup');
    pass('renderGoldenTraceHtml_outputByteIdenticalToPreChange');
  } catch (e) { fail('renderGoldenTraceHtml_outputByteIdenticalToPreChange', e); }

  // AC4 (lphf-s1) — frame content matches the real artefact file, not fabricated
  try {
    const realDiscoveryPath = path.join(__dirname, '..', 'artefacts', '2026-07-24-interactive-kanban-boards', 'discovery.md');
    const realDiscovery = fs.readFileSync(realDiscoveryPath, 'utf8');
    const excerptCore = 'an operator can see which stage a feature/story is in, but cannot act on that view';
    assert(realDiscovery.includes(excerptCore), 'test setup error: the real discovery.md no longer contains the expected excerpt');
    assert(CONTENT.discovery.includes(excerptCore), 'frame content does not match the real discovery.md excerpt verbatim');
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
