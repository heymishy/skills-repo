'use strict';
// check-ep1-s4-stage-routing.js — ep1-s4
//
// Unit tests for getNextSkill/getValidBackwardTargets (pure routing-table
// functions) and an integration test proving the fix to a real bug found
// during investigation: backfillJourneyFromPipelineState previously set
// activeSkill to the pipeline-state.json stage's OWN value (the last
// completed stage) instead of the next stage to work on. Covers AC1 from
// artefacts/new-feature-af17f555/test-plans/ep1-s4-test-plan.md.

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

var journeyRoutes = require('../src/web-ui/routes/journey');

// ── getNextSkill ──────────────────────────────────────────────────────────

check('routes ideation to discovery', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('ideation', {}), 'discovery');
});
check('routes discovery to benefit-metric by default (no spike result)', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('discovery', {}), 'benefit-metric');
});
check('routes discovery to benefit-metric when spike recommends build', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('discovery', { spikeRecommendation: 'build' }), 'benefit-metric');
});
check('routes discovery to terminal when spike recommends no-build', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('discovery', { spikeRecommendation: 'no-build' }), 'terminal');
});
check('routes spike to benefit-metric', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('spike', {}), 'benefit-metric');
});
check('routes benefit-metric to definition by default', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('benefit-metric', {}), 'definition');
});
check('routes definition to review', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('definition', {}), 'review');
});
check('routes review to test-plan by default (engineering surface)', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('review', {}), 'test-plan');
});
check('routes review to dor-gate when surface type does not require test-plan', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('review', { requiresTestPlan: false }), 'dor-gate');
});
check('routes test-plan to definition-of-ready', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('test-plan', {}), 'definition-of-ready');
});
check('routes definition-of-ready to dor-gate', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('definition-of-ready', {}), 'dor-gate');
});
check('routes dor-gate to release (terminal)', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('dor-gate', {}), 'release');
});
check('unrecognized stage returns null, does not throw', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('nonsense-stage', {}), null);
});
check('missing contextFlags argument does not throw', () => {
  assert.strictEqual(journeyRoutes.getNextSkill('discovery'), 'benefit-metric');
});

// ── getValidBackwardTargets ─────────────────────────────────────────────

check('returns every stage strictly earlier than current', () => {
  var result = journeyRoutes.getValidBackwardTargets(['discovery', 'benefit-metric', 'definition'], 'definition');
  assert.deepStrictEqual(result, ['discovery', 'benefit-metric']);
});
check('excludes stages not in completedStages even if earlier in sequence', () => {
  var result = journeyRoutes.getValidBackwardTargets(['discovery', 'definition'], 'definition');
  assert.deepStrictEqual(result, ['discovery']);
});
check('empty completedStages returns empty array', () => {
  assert.deepStrictEqual(journeyRoutes.getValidBackwardTargets([], 'definition'), []);
});
check('unrecognized currentStage returns empty array, does not throw', () => {
  assert.deepStrictEqual(journeyRoutes.getValidBackwardTargets(['discovery'], 'nonsense-stage'), []);
});

// ── Integration: backfill bug fix ───────────────────────────────────────

check('backfillJourneyFromPipelineState sets activeSkill to the NEXT stage, not the last completed one', () => {
  var scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s4-'));
  journeyRoutes.setRepoRoot(scratchRoot);
  var dir = path.join(scratchRoot, '.github');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pipeline-state.json'), JSON.stringify({ features: [{ slug: 'ep1s4-next', stage: 'definition', updatedAt: '2026-08-01T00:00:00.000Z' }] }), 'utf8');
  var journey = journeyRoutes.backfillJourneyFromPipelineState('ep1s4-next', scratchRoot);
  assert.strictEqual(journey.activeSkill, 'review', 'expected activeSkill to be the NEXT stage after definition, not definition itself');
});

check('backfillJourneyFromPipelineState falls back to old behaviour for a stage outside the routing table (e.g. inner-loop)', () => {
  var scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s4-fallback-'));
  journeyRoutes.setRepoRoot(scratchRoot);
  var dir = path.join(scratchRoot, '.github');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pipeline-state.json'), JSON.stringify({ features: [{ slug: 'ep1s4-innerloop', stage: 'branch-complete', updatedAt: '2026-08-01T00:00:00.000Z' }] }), 'utf8');
  var journey = journeyRoutes.backfillJourneyFromPipelineState('ep1s4-innerloop', scratchRoot);
  assert.strictEqual(journey.activeSkill, 'definition-of-ready', 'expected fallback to the last BACKFILL_STAGE_SEQUENCE entry, unchanged from ep1-s3 behaviour');
});

// ── Integration: confirm-back interstitial ──────────────────────────────

var journeyStore = require('../src/web-ui/modules/journey-store');

function mockReq(overrides) {
  return Object.assign({
    session: { accessToken: 'tok-alice', userId: '1', login: 'alice', tenantId: 't1' },
    params: {}
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

await (async function() {
  try {
    var journey = journeyStore.createJourney('ep1s4-confirm-fixture', 'default');
    journeyStore.completeStage(journey.journeyId, 'discovery', 'artefacts/ep1s4-confirm-fixture/discovery.md');
    var req = mockReq({ params: { journeyId: journey.journeyId, stageName: 'discovery' } });
    var res = mockRes();
    await journeyRoutes.handleGetStageConfirmBack(req, res);
    var result = res._get();
    assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
    assert.ok(result.body.indexOf('Move back to Discovery?') !== -1, 'expected the confirm heading');
    assert.ok(result.body.indexOf('/journey/' + journey.journeyId + '/stage/discovery/reopen') !== -1, 'expected a Confirm link to the existing reopen route');
    assert.ok(result.body.indexOf('href="/journey">Cancel') !== -1, 'expected a Cancel link back to /journey');
    console.log('PASS:', 'handleGetStageConfirmBack renders a confirm page with Confirm/Cancel links');
    passed++;
  } catch (e) {
    console.error('FAIL:', 'handleGetStageConfirmBack renders a confirm page with Confirm/Cancel links', '—', e.message);
    failed++;
    process.exitCode = 1;
  }
})();

await (async function() {
  try {
    var journey = journeyStore.createJourney('ep1s4-confirm-notdone', 'default');
    var req = mockReq({ params: { journeyId: journey.journeyId, stageName: 'discovery' } });
    var res = mockRes();
    await journeyRoutes.handleGetStageConfirmBack(req, res);
    var result = res._get();
    assert.strictEqual(result.statusCode, 404, 'expected 404 for a stage that was never completed');
    console.log('PASS:', 'handleGetStageConfirmBack 404s for a stage that was never completed');
    passed++;
  } catch (e) {
    console.error('FAIL:', 'handleGetStageConfirmBack 404s for a stage that was never completed', '—', e.message);
    failed++;
    process.exitCode = 1;
  }
})();

// ── Regression: completedStages must actually persist to disk ───────────
//
// Root cause found while writing this story's own E2E spec: journey-disk.js's
// updateStage() threw internally (journey.stages was undefined for any
// journey-store-originated journey), silently swallowed by completeStage()'s
// try/catch -- so listJourneys() (disk-backed) always saw completedStages
// frozen at [] regardless of real completeStage() calls. Fixed in
// journey-disk.js (defensive .stages init) and journey-store.js (an explicit
// saveJourney() call after completeStage(), since updateStage() never wrote
// completedStages in the first place -- a different schema field entirely).

await (async function() {
  try {
    var fsMod = require('fs');
    var osMod = require('os');
    var pathMod = require('path');
    var journeyStoreForDiskCheck = require('../src/web-ui/modules/journey-store');
    var journeyDiskForCheck = require('../src/modules/journey-disk');
    journeyStoreForDiskCheck.setDiskAdapter(journeyDiskForCheck);
    var slug = 'ep1s4-disk-persist-' + Date.now();
    var j = journeyStoreForDiskCheck.createJourney(slug, 'default');
    journeyStoreForDiskCheck.completeStage(j.journeyId, 'discovery', 'artefacts/' + slug + '/discovery.md');
    var diskPath = pathMod.resolve(pathMod.join(__dirname, '..', 'workspace', 'journeys', slug, 'journey.json'));
    var onDisk = JSON.parse(fsMod.readFileSync(diskPath, 'utf8'));
    assert.strictEqual(onDisk.completedStages.length, 1, 'expected completedStages to actually persist to disk after completeStage()');
    assert.strictEqual(onDisk.completedStages[0].skillName, 'discovery');
    fsMod.rmSync(pathMod.dirname(diskPath), { recursive: true, force: true });
    console.log('PASS:', 'completeStage() persists completedStages to disk (regression for the silent-throw bug)');
    passed++;
  } catch (e) {
    console.error('FAIL:', 'completeStage() persists completedStages to disk (regression for the silent-throw bug)', '—', e.message);
    failed++;
    process.exitCode = 1;
  }
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
