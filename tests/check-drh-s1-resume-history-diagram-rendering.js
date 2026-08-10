#!/usr/bin/env node
// check-drh-s1-resume-history-diagram-rendering.js — unit/integration tests for drh-s1
// (diagrams generated during a live /ideate, /design, or /definition session never
// appeared when resuming/viewing that stage's history -- handleGetJourneyStageView
// discarded the durable turn content's CANVAS-JSON markers entirely).
//
// Story:      artefacts/2026-08-10-resume-diagram-history-fix/stories/drh-s1-resume-history-diagram-rendering.md
// Test plan:  artefacts/2026-08-10-resume-diagram-history-fix/test-plans/drh-s1-test-plan.md
//
// Coverage:
//   AC1 (unit)  — extractCanvasBlocksFromTurns finds every valid marker across turns
//   AC1 (integration) — handleGetJourneyStageView renders a real diagram block for it
//   AC2 (integration) — mermaid.min.js script + init script present exactly once
//   AC3 (unit)  — malformed marker skipped, valid ones still extracted
//   AC4 (integration) — no interactive controls (readOnly guarantee unchanged)
//   AC5 (integration) — same fix applies to design and definition stages
//   AC6 (integration) — zero markers -> no diagram scripts added, unchanged today

'use strict';

process.env.NODE_ENV = 'test';

var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');

var passed = 0;
var failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log('PASS:', name);
    passed++;
  } catch (e) {
    console.error('FAIL:', name, '—', e.message);
    failed++;
    process.exitCode = 1;
  }
}

async function checkAsync(name, fn) {
  try {
    await fn();
    console.log('PASS:', name);
    passed++;
  } catch (e) {
    console.error('FAIL:', name, '—', e.message);
    failed++;
    process.exitCode = 1;
  }
}

var journeyStore = require('../src/web-ui/modules/journey-store');
var journeyRoutes = require('../src/web-ui/routes/journey');
var skillsRoutes = require('../src/web-ui/routes/skills');

var _scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'drh-s1-'));
journeyRoutes.setRepoRoot(_scratchRoot);

function writeArtefact(relPath, content) {
  var abs = path.join(_scratchRoot, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
}

function mockReq(overrides) {
  return Object.assign({
    session: { accessToken: 'tok-alice', userId: '1', login: 'alice' },
    params: {},
    body: {},
    url: '/'
  }, overrides || {});
}

function mockRes() {
  var _statusCode = null;
  var _headers = {};
  var _body = '';
  return {
    writeHead: function (code, headers) { _statusCode = code; Object.assign(_headers, headers || {}); return this; },
    end: function (body) { if (body != null) _body = body; },
    _get: function () { return { statusCode: _statusCode, headers: _headers, body: _body }; }
  };
}

function makeCompletedJourneyFixture(slug, stageName, artefactRelPath, artefactContent) {
  var journey = journeyStore.createJourney(slug, 'default');
  writeArtefact(artefactRelPath, artefactContent);
  journeyStore.completeStage(journey.journeyId, stageName, artefactRelPath, null, 'seed-sid-1');
  journeyStore.setJourneyFields(journey.journeyId, { activeSkill: 'benefit-metric', activeSessionId: 'seed-sid-2' });
  return journey;
}

var VALID_MARKER = '---CANVAS-JSON: {"type":"text","title":"Market scan","content":{"paragraphs":["Three competitors offer one-click checkout."]}}---';
var VALID_MARKER_2 = '---CANVAS-JSON: {"type":"cluster-tree","title":"Opportunity map","content":{"clusters":["Need: faster checkout"]}}---';
var MALFORMED_MARKER = '---CANVAS-JSON: {not valid json---';

var TURNS_WITH_DIAGRAM = [
  { role: 'assistant', content: 'Here is the market scan for this lens.\n\n' + VALID_MARKER + '\n\nLet me know what you think.' },
  { role: 'user', content: 'Looks good, keep going.' }
];

var TURNS_NO_DIAGRAM = [
  { role: 'assistant', content: 'What problem are we trying to solve?' },
  { role: 'user', content: 'Operators cannot see the diagrams behind a completed stage.' }
];

(async () => {

// ── AC1 (data-layer): extractCanvasBlocksFromTurns finds every valid marker ──
check('AC1: extractCanvasBlocksFromTurns finds a marker across multiple turns', () => {
  var turns = [
    { role: 'assistant', content: 'First lens.\n' + VALID_MARKER },
    { role: 'user', content: 'ok' },
    { role: 'assistant', content: 'Second lens.\n' + VALID_MARKER_2 }
  ];
  var blocks = skillsRoutes.extractCanvasBlocksFromTurns(turns);
  assert.strictEqual(blocks.length, 2, 'expected 2 blocks extracted across turns, got ' + blocks.length);
  assert.strictEqual(blocks[0].type, 'text');
  assert.strictEqual(blocks[1].type, 'cluster-tree');
});

// ── AC3: malformed marker skipped, valid one still extracted ──
check('AC3: extractCanvasBlocksFromTurns skips a malformed marker but keeps a valid one', () => {
  var turns = [
    { role: 'assistant', content: MALFORMED_MARKER + '\n' + VALID_MARKER }
  ];
  var blocks = skillsRoutes.extractCanvasBlocksFromTurns(turns);
  assert.strictEqual(blocks.length, 1, 'expected exactly 1 valid block, malformed one silently skipped');
  assert.strictEqual(blocks[0].type, 'text');
});

// ── AC1 (render-layer) + AC2: real diagram renders, scripts present exactly once ──
await checkAsync('AC1/AC2: ideate history with a diagram marker renders the diagram + mermaid script exactly once', async () => {
  var journey = makeCompletedJourneyFixture(
    'drh-s1-ac1-feature', 'ideate', 'artefacts/drh-s1-ac1-feature/ideate.md',
    '# Ideate\n\nSome ideate artefact content for AC1.'
  );
  journeyRoutes.setGetTurnsForStage(async function () { return TURNS_WITH_DIAGRAM.slice(); });

  var req = mockReq({ params: { journeyId: journey.journeyId, stageName: 'ideate' } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyStageView(req, res);
  var result = res._get();

  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
  assert.ok(result.body.indexOf('id="canvas-panel"') !== -1, 'expected the canvas panel to be present');
  assert.ok(result.body.indexOf('Market scan') !== -1, 'expected the diagram title to render');
  assert.ok(result.body.indexOf('class="canvas-block"') !== -1, 'expected a rendered canvas-block element');

  var mermaidScriptCount = (result.body.match(/vendor\/mermaid\.min\.js/g) || []).length;
  assert.strictEqual(mermaidScriptCount, 1, 'expected exactly 1 mermaid script tag, got ' + mermaidScriptCount);
  var initScriptCount = (result.body.match(/renderCanvasBlock/g) || []).length;
  assert.ok(initScriptCount > 0, 'expected the read-only canvas render script to be present');
});

// ── AC4: readOnly guarantee unchanged -- no interactive controls, even with diagrams ──
await checkAsync('AC4: history view with diagrams still has no interactive input/textarea/submit controls', async () => {
  var journey = makeCompletedJourneyFixture(
    'drh-s1-ac4-feature', 'ideate', 'artefacts/drh-s1-ac4-feature/ideate.md',
    '# Ideate\n\nAC4 fixture content.'
  );
  journeyRoutes.setGetTurnsForStage(async function () { return TURNS_WITH_DIAGRAM.slice(); });

  var req = mockReq({ params: { journeyId: journey.journeyId, stageName: 'ideate' } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyStageView(req, res);
  var result = res._get();

  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
  assert.ok(result.body.indexOf('<input') === -1, 'did not expect any <input> element even with diagrams present');
  assert.ok(result.body.indexOf('<textarea') === -1, 'did not expect any <textarea> element even with diagrams present');
  assert.ok(result.body.indexOf('type="submit"') === -1, 'did not expect any submit button even with diagrams present');
  assert.ok(result.body.indexOf('class="btn-confirm"') === -1, 'did not expect a rendered assumption-confirm <button> element even with diagrams present (the .btn-confirm CSS rule itself is always present in the shared stylesheet, which is not what this asserts)');
  assert.ok(result.body.indexOf('id="assumption-cards"') === -1, 'did not expect the assumption-cards panel to render -- this stage-history view uses the artefact-pane layout, not the ideate 3-panel layout');
});

// ── AC5: the same fix applies to design and definition stages, not just ideate ──
await checkAsync('AC5: design stage history with a diagram marker also renders it', async () => {
  var journey = makeCompletedJourneyFixture(
    'drh-s1-ac5a-feature', 'design', 'artefacts/drh-s1-ac5a-feature/design.md',
    '# Design\n\nAC5 design fixture content.'
  );
  journeyRoutes.setGetTurnsForStage(async function () { return TURNS_WITH_DIAGRAM.slice(); });

  var req = mockReq({ params: { journeyId: journey.journeyId, stageName: 'design' } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyStageView(req, res);
  var result = res._get();

  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
  assert.ok(result.body.indexOf('class="canvas-block"') !== -1, 'expected a rendered canvas-block element for the design stage too');
  assert.ok(result.body.indexOf('vendor/mermaid.min.js') !== -1, 'expected the mermaid script for the design stage too');
});

await checkAsync('AC5: definition stage history with a diagram marker also renders it', async () => {
  var journey = makeCompletedJourneyFixture(
    'drh-s1-ac5b-feature', 'definition', 'artefacts/drh-s1-ac5b-feature/definition.md',
    '# Definition\n\nAC5 definition fixture content.'
  );
  journeyRoutes.setGetTurnsForStage(async function () { return TURNS_WITH_DIAGRAM.slice(); });

  var req = mockReq({ params: { journeyId: journey.journeyId, stageName: 'definition' } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyStageView(req, res);
  var result = res._get();

  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
  assert.ok(result.body.indexOf('class="canvas-block"') !== -1, 'expected a rendered canvas-block element for the definition stage too');
  assert.ok(result.body.indexOf('vendor/mermaid.min.js') !== -1, 'expected the mermaid script for the definition stage too');
});

// ── AC6: zero markers -> no diagram scripts added, unchanged from today ──
await checkAsync('AC6: history view with zero diagram markers adds no diagram scripts', async () => {
  var journey = makeCompletedJourneyFixture(
    'drh-s1-ac6-feature', 'discovery', 'artefacts/drh-s1-ac6-feature/discovery.md',
    '# Discovery\n\nAC6 fixture content, no diagrams.'
  );
  journeyRoutes.setGetTurnsForStage(async function () { return TURNS_NO_DIAGRAM.slice(); });

  var req = mockReq({ params: { journeyId: journey.journeyId, stageName: 'discovery' } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyStageView(req, res);
  var result = res._get();

  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
  assert.ok(result.body.indexOf('vendor/mermaid.min.js') === -1, 'did not expect a mermaid script when there are no diagram markers');
  assert.ok(result.body.indexOf('renderCanvasBlock') === -1, 'did not expect the read-only canvas render script when there are no diagram markers');
  // The always-present empty canvas-panel placeholder must be unaffected.
  assert.ok(result.body.indexOf('Diagrams will appear here as the session progresses.') !== -1, 'expected the existing empty-diagrams placeholder to still render, unchanged');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
