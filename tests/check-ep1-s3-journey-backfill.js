'use strict';
// check-ep1-s3-journey-backfill.js — ep1-s3
//
// Unit + integration tests for backfillJourneyFromPipelineState, which
// creates a journey record for a CLI-only feature the first time it's
// needed, and is wired into handleGetJourneyResume's "no record found"
// branch so ep1-s1's merged-in Continue links don't 404. Covers AC1 from
// artefacts/new-feature-af17f555/test-plans/ep1-s3-test-plan.md.

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
var _scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s3-'));
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
  var _headers = {};
  var _body = '';
  return {
    writeHead: function (code, headers) { _statusCode = code; _headers = headers || {}; return this; },
    end: function (body) { if (body != null) _body = body; },
    _get: function () { return { statusCode: _statusCode, headers: _headers, body: _body }; }
  };
}

check('AC1: creates a new journey record when none exists', () => {
  writeState([{ slug: 'ep1s3-a', stage: 'definition', updatedAt: '2026-08-01T00:00:00.000Z' }]);
  var journey = journeyRoutes.backfillJourneyFromPipelineState('ep1s3-a', _scratchRoot);
  assert.ok(journey, 'expected a journey to be created');
  assert.strictEqual(journey.featureSlug, 'ep1s3-a');
});

check('AC1: completedStages inferred as every stage up to and including current', () => {
  writeState([{ slug: 'ep1s3-b', stage: 'definition', updatedAt: '2026-08-01T00:00:00.000Z' }]);
  var journey = journeyRoutes.backfillJourneyFromPipelineState('ep1s3-b', _scratchRoot);
  var names = journey.completedStages.map(function(s) { return s.skillName; });
  assert.deepStrictEqual(names, ['ideate', 'discovery', 'benefit-metric', 'design', 'definition']);
});

check('AC1: stamps cliAdoptionTimestamp', () => {
  writeState([{ slug: 'ep1s3-c', stage: 'discovery', updatedAt: '2026-08-01T00:00:00.000Z' }]);
  var journey = journeyRoutes.backfillJourneyFromPipelineState('ep1s3-c', _scratchRoot);
  assert.ok(journey.cliAdoptionTimestamp, 'expected cliAdoptionTimestamp to be set');
});

check('AC1: stamps cliAdoptionArtefactHashes for whichever single-file artefacts exist on disk', () => {
  writeState([{ slug: 'ep1s3-hash', stage: 'definition', updatedAt: '2026-08-01T00:00:00.000Z' }]);
  var featDir = path.join(_scratchRoot, 'artefacts', 'ep1s3-hash');
  fs.mkdirSync(featDir, { recursive: true });
  fs.writeFileSync(path.join(featDir, 'discovery.md'), '# Discovery content', 'utf8');
  var journey = journeyRoutes.backfillJourneyFromPipelineState('ep1s3-hash', _scratchRoot);
  assert.ok(journey.cliAdoptionArtefactHashes, 'expected cliAdoptionArtefactHashes to be set');
  assert.ok(journey.cliAdoptionArtefactHashes.discovery, 'expected a hash for discovery.md, which exists on disk');
  assert.strictEqual(journey.cliAdoptionArtefactHashes.design, undefined, 'expected no hash for design.md, which does not exist on disk');
});

check('AC1: idempotent — second call returns the same record, no duplicate', () => {
  writeState([{ slug: 'ep1s3-d', stage: 'review', updatedAt: '2026-08-01T00:00:00.000Z' }]);
  var first = journeyRoutes.backfillJourneyFromPipelineState('ep1s3-d', _scratchRoot);
  var second = journeyRoutes.backfillJourneyFromPipelineState('ep1s3-d', _scratchRoot);
  assert.strictEqual(first.journeyId, second.journeyId);
});

check('unknown slug (not in pipeline-state.json) returns null', () => {
  writeState([{ slug: 'ep1s3-known', stage: 'discovery', updatedAt: '2026-08-01T00:00:00.000Z' }]);
  var result = journeyRoutes.backfillJourneyFromPipelineState('totally-unknown-slug', _scratchRoot);
  assert.strictEqual(result, null);
});

check('stage past definition-of-ready (inner loop) backfills the full outer-loop sequence', () => {
  writeState([{ slug: 'ep1s3-e', stage: 'branch-complete', updatedAt: '2026-08-01T00:00:00.000Z' }]);
  var journey = journeyRoutes.backfillJourneyFromPipelineState('ep1s3-e', _scratchRoot);
  assert.strictEqual(journey.completedStages.length, 8, 'expected all 8 outer-loop stages backfilled');
});

check('missing pipeline-state.json returns null, does not throw', () => {
  var emptyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s3-empty-'));
  var result = journeyRoutes.backfillJourneyFromPipelineState('anything', emptyRoot);
  assert.strictEqual(result, null);
});

(async () => {

// ── Integration: resume flow backfills instead of 404ing ──
await checkAsync('integration: resume flow backfills instead of 404ing for a CLI-only feature', async () => {
  writeState([{ slug: 'ep1s3-resume', stage: 'definition', updatedAt: '2026-08-01T00:00:00.000Z' }]);
  var req = mockReq({ params: { featureSlug: 'ep1s3-resume' } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyResume(req, res);
  var result = res._get();
  assert.notStrictEqual(result.statusCode, 404, 'expected NOT 404 — backfill should have created a journey record');
  assert.ok([200, 302, 303].indexOf(result.statusCode) !== -1, 'expected a redirect or a rendered page, got: ' + result.statusCode);
});

// ── Integration: a genuinely unknown slug still 404s (regression — backfill must not mask real not-found cases) ──
await checkAsync('integration: resume flow still 404s for a slug in neither journey-store nor pipeline-state.json', async () => {
  writeState([{ slug: 'ep1s3-real', stage: 'definition', updatedAt: '2026-08-01T00:00:00.000Z' }]);
  var req = mockReq({ params: { featureSlug: 'ep1s3-genuinely-nowhere' } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyResume(req, res);
  var result = res._get();
  assert.strictEqual(result.statusCode, 404, 'expected 404 for a slug that exists nowhere');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
