#!/usr/bin/env node
// check-mds-s1-diagram-showcase-fixtures.js — unit/integration tests for mds-s1
// (a new "diagram-showcase" mock-gateway scenario for ideate/design/definition,
// covering every diagram type each skill can legitimately emit, so the
// resume-history rendering path -- drh-s1 -- has real multi-type content to
// exercise instead of each existing success/failure fixture's single type).
//
// Story:      artefacts/2026-08-10-mock-diagram-showcase-fixtures/stories/mds-s1-diagram-showcase-mock-scenario.md
// Test plan:  artefacts/2026-08-10-mock-diagram-showcase-fixtures/test-plans/mds-s1-test-plan.md
//
// Coverage:
//   AC1 (unit)        — ideate diagram-showcase has 3 valid markers (cluster-tree/table/text)
//   AC2 (unit)        — design diagram-showcase has 2 valid markers (system-architecture/data-model)
//   AC3 (unit)        — definition diagram-showcase has 2 valid markers (program-design/data-model)
//   AC4 (unit)        — existing success/failure fixtures byte-identical, unchanged
//   AC5 (unit)        — inventoryFixtures reports the new files correctly
//   AC6 (integration) — new fixture data renders correctly via the resume-history view

'use strict';

process.env.NODE_ENV = 'test';

var assert = require('assert');
var crypto = require('crypto');
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

var mockGateway = require('../src/web-ui/modules/mock-llm-gateway');
var skillsRoutes = require('../src/web-ui/routes/skills');
var journeyStore = require('../src/web-ui/modules/journey-store');
var journeyRoutes = require('../src/web-ui/routes/journey');

var _scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mds-s1-'));
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

mockGateway.resetMockGatewayClient();
mockGateway.wireDefaultMockGatewayClient();

// ── AC1: ideate diagram-showcase has 3 valid markers ──
check('AC1: getMockResponse_ideateDiagramShowcase_hasThreeValidMarkers', () => {
  var result = mockGateway.getMockResponse('ideate', 'mock', 'diagram-showcase');
  var blocks = skillsRoutes.extractCanvasBlocksFromTurns([{ role: 'assistant', content: result.text }]);
  assert.strictEqual(blocks.length, 3, 'expected exactly 3 blocks, got ' + blocks.length);
  assert.deepStrictEqual(blocks.map(function(b) { return b.type; }), ['cluster-tree', 'table', 'text']);
  blocks.forEach(function(b) {
    assert.ok(b.title && b.title.length > 0, 'expected a non-empty title for ' + b.type);
    assert.ok(b.content, 'expected non-empty content for ' + b.type);
  });
});

// ── AC2: design diagram-showcase has 2 valid markers ──
check('AC2: getMockResponse_designDiagramShowcase_hasTwoValidMarkers', () => {
  var result = mockGateway.getMockResponse('design', 'mock', 'diagram-showcase');
  var blocks = skillsRoutes.extractCanvasBlocksFromTurns([{ role: 'assistant', content: result.text }]);
  assert.strictEqual(blocks.length, 2, 'expected exactly 2 blocks, got ' + blocks.length);
  assert.deepStrictEqual(blocks.map(function(b) { return b.type; }), ['system-architecture', 'data-model']);
  blocks.forEach(function(b) {
    assert.ok(b.content && typeof b.content.mermaid === 'string' && b.content.mermaid.length > 0, 'expected real mermaid content for ' + b.type);
  });
  assert.ok(blocks[0].content.mermaid.indexOf('-->') !== -1, 'expected flowchart-shaped mermaid for system-architecture');
  assert.ok(blocks[1].content.mermaid.indexOf('erDiagram') !== -1, 'expected erDiagram-shaped mermaid for data-model');
});

// ── AC3: definition diagram-showcase has 2 valid markers ──
check('AC3: getMockResponse_definitionDiagramShowcase_hasTwoValidMarkers', () => {
  var result = mockGateway.getMockResponse('definition', 'mock', 'diagram-showcase');
  var blocks = skillsRoutes.extractCanvasBlocksFromTurns([{ role: 'assistant', content: result.text }]);
  assert.strictEqual(blocks.length, 2, 'expected exactly 2 blocks, got ' + blocks.length);
  assert.deepStrictEqual(blocks.map(function(b) { return b.type; }), ['program-design', 'data-model']);
  blocks.forEach(function(b) {
    assert.ok(b.content && typeof b.content.mermaid === 'string' && b.content.mermaid.length > 0, 'expected real mermaid content for ' + b.type);
  });
});

// ── AC4: existing success/failure fixtures byte-identical, unchanged ──
// Checksums of the actually-existing pre-story fixture files for these three
// stages. Note: ideate.failure.json and design.failure.json do not exist in
// this repo (only success + this story's new diagram-showcase) -- the DoR's
// scope contract listed ideate.failure.json, but that file was never real;
// the checksum set below reflects the genuinely-existing files.
var EXISTING_FIXTURE_CHECKSUMS = {
  'ideate.success.json':     '6bb83dee65188d01a47dd26dffdd802319a267fd6a35e9e9a1c8c8964f4bf8e5',
  'design.success.json':     '7b19cb56fdb1ed68b35d8abd14209546648f2f3c99968d966a01bc8f48899907',
  'definition.success.json': '95a06f4bcb3e83c0c5868c4ca66baa22f78937e2aabe2de117c3d62bf909fb59',
  'definition.failure.json': '6be214967d9c1acbb275773611d9c9b6dfb40c5c35754013c90c72ec83b69642'
};

check('AC4: existingFixtures_byteIdentical_afterNewFixturesAdded', () => {
  Object.keys(EXISTING_FIXTURE_CHECKSUMS).forEach(function(fileName) {
    var filePath = path.join(mockGateway.FIXTURE_DIR, fileName);
    var content = fs.readFileSync(filePath);
    var hash = crypto.createHash('sha256').update(content).digest('hex');
    assert.strictEqual(hash, EXISTING_FIXTURE_CHECKSUMS[fileName], fileName + ' checksum mismatch -- pre-existing fixture was modified');
  });
});

// ── AC5: inventoryFixtures reports the new diagram-showcase files ──
check('AC5: inventoryFixtures_reportsNewDiagramShowcaseFiles', () => {
  var inventory = mockGateway.inventoryFixtures();
  ['ideate', 'design', 'definition'].forEach(function(stage) {
    var stageEntry = inventory.byStage[stage];
    assert.ok(stageEntry, 'expected an inventory entry for stage ' + stage);
    var hasShowcase = stageEntry.files.some(function(f) { return f.indexOf('diagram-showcase') !== -1; });
    assert.ok(hasShowcase, 'expected ' + stage + '.diagram-showcase.json to appear in inventoryFixtures() output');
  });
});

(async () => {

// ── AC6: new fixture data renders correctly via the resume-history view ──
await checkAsync('AC6 (ideate): resumeHistoryView_ideateDiagramShowcase_rendersAllThreeTypes', async () => {
  var fixture = mockGateway.getMockResponse('ideate', 'mock', 'diagram-showcase');
  var journey = makeCompletedJourneyFixture(
    'mds-s1-ac6-ideate-feature', 'ideate', 'artefacts/mds-s1-ac6-ideate-feature/ideate.md',
    '# Ideate\n\nAC6 ideate fixture content.'
  );
  journeyRoutes.setGetTurnsForStage(async function () { return [{ role: 'assistant', content: fixture.text }]; });

  var req = mockReq({ params: { journeyId: journey.journeyId, stageName: 'ideate' } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyStageView(req, res);
  var result = res._get();

  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
  // The client-side script embeds a `var BLOCKS = [...]` JSON array; actual
  // <div class="canvas-block"> DOM nodes are only created when that script
  // executes in a real browser (see buildReadOnlyCanvasScript), so a
  // server-rendered-HTML test counts embedded block entries via their
  // serialized "type":"..." keys, not literal DOM class attributes --
  // matching drh-s1's own established pattern of asserting on embedded
  // title/marker text rather than assuming client-side JS has run.
  var typeMatches = result.body.match(/"type":"/g) || [];
  assert.strictEqual(typeMatches.length, 3, 'expected 3 embedded blocks in BLOCKS, got ' + typeMatches.length);
  ['Opportunity map', 'Competitor feature comparison', 'Market scan summary'].forEach(function(title) {
    assert.ok(result.body.indexOf(title) !== -1, 'expected embedded title "' + title + '" in the response body');
  });
});

await checkAsync('AC6 (design): resumeHistoryView_designDiagramShowcase_rendersBothTypes', async () => {
  var fixture = mockGateway.getMockResponse('design', 'mock', 'diagram-showcase');
  var journey = makeCompletedJourneyFixture(
    'mds-s1-ac6-design-feature', 'design', 'artefacts/mds-s1-ac6-design-feature/design.md',
    '# Design\n\nAC6 design fixture content.'
  );
  journeyRoutes.setGetTurnsForStage(async function () { return [{ role: 'assistant', content: fixture.text }]; });

  var req = mockReq({ params: { journeyId: journey.journeyId, stageName: 'design' } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyStageView(req, res);
  var result = res._get();

  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
  var typeMatches = result.body.match(/"type":"/g) || [];
  assert.strictEqual(typeMatches.length, 2, 'expected 2 embedded blocks in BLOCKS, got ' + typeMatches.length);
  ['System Architecture', 'Data model'].forEach(function(title) {
    assert.ok(result.body.indexOf(title) !== -1, 'expected embedded title "' + title + '" in the response body');
  });
});

await checkAsync('AC6 (definition): resumeHistoryView_definitionDiagramShowcase_rendersBothTypes', async () => {
  var fixture = mockGateway.getMockResponse('definition', 'mock', 'diagram-showcase');
  var journey = makeCompletedJourneyFixture(
    'mds-s1-ac6-definition-feature', 'definition', 'artefacts/mds-s1-ac6-definition-feature/definition.md',
    '# Definition\n\nAC6 definition fixture content.'
  );
  journeyRoutes.setGetTurnsForStage(async function () { return [{ role: 'assistant', content: fixture.text }]; });

  var req = mockReq({ params: { journeyId: journey.journeyId, stageName: 'definition' } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyStageView(req, res);
  var result = res._get();

  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
  var typeMatches = result.body.match(/"type":"/g) || [];
  assert.strictEqual(typeMatches.length, 2, 'expected 2 embedded blocks in BLOCKS, got ' + typeMatches.length);
  ['Program Design', 'Data model'].forEach(function(title) {
    assert.ok(result.body.indexOf(title) !== -1, 'expected embedded title "' + title + '" in the response body');
  });
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
