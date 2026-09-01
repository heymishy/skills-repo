'use strict';
// check-ep1-s1-journey-feature-merge.js — ep1-s1
//
// Unit + integration tests for _mergeStateFeaturesIntoJourneyList, which
// merges non-terminal pipeline-state.json features that have no
// journey-store record yet into /journey's existing card list. Covers
// AC1-AC2 from artefacts/new-feature-af17f555/test-plans/ep1-s1-test-plan.md.

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

var journeyRoutes = require('../src/web-ui/routes/journey');
var _scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s1-'));
journeyRoutes.setRepoRoot(_scratchRoot);

function writeState(features) {
  var dir = path.join(_scratchRoot, '.github');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pipeline-state.json'), JSON.stringify({ features: features }), 'utf8');
}

function mockReq(overrides) {
  return Object.assign({
    session: { accessToken: 'tok-alice', userId: '1', login: 'alice', tenantId: 't1' },
    params: {},
    query: {},
    body: {},
    url: '/'
  }, overrides || {});
}

function mockRes() {
  var _statusCode = null;
  var _body = '';
  return {
    writeHead: function (code) { _statusCode = code; return this; },
    end: function (body) { if (body != null) _body = body; },
    _get: function () { return { statusCode: _statusCode, body: _body }; }
  };
}

(async () => {

check('AC1: includes a non-terminal pipeline-state feature with no journey record', () => {
  writeState([{ slug: 'cli-only-feature', stage: 'definition', updatedAt: '2026-08-01T00:00:00.000Z' }]);
  var merged = journeyRoutes._mergeStateFeaturesIntoJourneyList([], _scratchRoot);
  assert.strictEqual(merged.length, 1);
  assert.strictEqual(merged[0].featureSlug, 'cli-only-feature');
});

check('AC1: excludes a feature already present in journey-store list', () => {
  writeState([{ slug: 'already-known', stage: 'review', updatedAt: '2026-08-01T00:00:00.000Z' }]);
  var existing = [{ featureSlug: 'already-known', currentStage: 'review', createdAt: '2026-07-01T00:00:00.000Z' }];
  var merged = journeyRoutes._mergeStateFeaturesIntoJourneyList(existing, _scratchRoot);
  assert.strictEqual(merged.length, 1, 'expected no duplicate — only the original journey-store entry');
  assert.strictEqual(merged[0], existing[0]);
});

check('AC2: excludes completed/archived/released features', () => {
  writeState([
    { slug: 'f-completed', stage: 'completed', updatedAt: '2026-08-01T00:00:00.000Z' },
    { slug: 'f-archived',  stage: 'archived',  updatedAt: '2026-08-01T00:00:00.000Z' },
    { slug: 'f-released',  stage: 'released',  updatedAt: '2026-08-01T00:00:00.000Z' },
    { slug: 'f-active',    stage: 'review',    updatedAt: '2026-08-01T00:00:00.000Z' }
  ]);
  var merged = journeyRoutes._mergeStateFeaturesIntoJourneyList([], _scratchRoot);
  assert.strictEqual(merged.length, 1);
  assert.strictEqual(merged[0].featureSlug, 'f-active');
});

check('AC1: maps updatedAt to createdAt (the field _renderJourneyHome sorts/displays by)', () => {
  writeState([{ slug: 'dated-feature', stage: 'definition', updatedAt: '2026-08-15T12:00:00.000Z' }]);
  var merged = journeyRoutes._mergeStateFeaturesIntoJourneyList([], _scratchRoot);
  assert.strictEqual(merged[0].createdAt, '2026-08-15T12:00:00.000Z');
});

check('graceful degradation: missing pipeline-state.json does not throw', () => {
  var emptyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s1-empty-'));
  var existing = [{ featureSlug: 'x', currentStage: 'review', createdAt: '2026-07-01T00:00:00.000Z' }];
  var merged = journeyRoutes._mergeStateFeaturesIntoJourneyList(existing, emptyRoot);
  assert.deepStrictEqual(merged, existing);
});

check('terminal-stage constant matches pipeline-state.json vocabulary exactly', () => {
  assert.deepStrictEqual(journeyRoutes.TERMINAL_STAGES, ['completed', 'archived', 'released']);
});

check('regression: existing journey-store entries preserved unmodified', () => {
  writeState([]);
  var existing = [
    { featureSlug: 'a', currentStage: 'review' },
    { featureSlug: 'b', currentStage: 'definition' }
  ];
  var merged = journeyRoutes._mergeStateFeaturesIntoJourneyList(existing, _scratchRoot);
  assert.deepStrictEqual(merged.slice(0, 2), existing);
});

// ── Integration: handleGetJourney renders a merged-in card through the real page ──
await checkAsync('integration: handleGetJourney renders a merged-in CLI-only feature with jh-continue', async () => {
  var mergeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s1-render-'));
  journeyRoutes.setRepoRoot(mergeRoot);
  var dir = path.join(mergeRoot, '.github');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pipeline-state.json'), JSON.stringify({
    features: [
      { slug: 'ep1s1-render-active', stage: 'definition', updatedAt: '2026-08-20T00:00:00.000Z' },
      { slug: 'ep1s1-render-terminal', stage: 'released', updatedAt: '2026-08-20T00:00:00.000Z' }
    ]
  }), 'utf8');

  var req = mockReq({ params: {} });
  var res = mockRes();
  await journeyRoutes.handleGetJourney(req, res, null, null);
  var result = res._get();

  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
  assert.ok(result.body.indexOf('href="/journey/ep1s1-render-active/resume"') !== -1, 'expected a Continue link for the merged-in active feature');
  assert.ok(result.body.indexOf('ep1s1-render-terminal') === -1, 'expected no card for the terminal-stage feature');
  journeyRoutes.setRepoRoot(_scratchRoot);
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
