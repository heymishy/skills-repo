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
var journeyFixture = require('./helpers/journey-fixture').journeyFixture;
var journeyFixtureRes = require('./helpers/journey-fixture').journeyFixtureRes;

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

  // ctpl-s1: the merge now only ever fires for the platform's own
  // self-hosted tenant -- this test's own scenario (proving the merge
  // RENDERS correctly when it does fire) requires that precondition, same
  // as every other caller of handleGetJourney now does.
  var _originalPlatformTenantId = process.env.PLATFORM_TENANT_ID;
  process.env.PLATFORM_TENANT_ID = 't1';
  try {
    var req = journeyFixture({ params: {} });
    var res = journeyFixtureRes();
    await journeyRoutes.handleGetJourney(req, res, null, null);
    var result = res._get();

    assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
    assert.ok(result.body.indexOf('href="/journey/ep1s1-render-active/resume"') !== -1, 'expected a Continue link for the merged-in active feature');
    assert.ok(result.body.indexOf('ep1s1-render-terminal') === -1, 'expected no card for the terminal-stage feature');
  } finally {
    if (_originalPlatformTenantId === undefined) delete process.env.PLATFORM_TENANT_ID;
    else process.env.PLATFORM_TENANT_ID = _originalPlatformTenantId;
    journeyRoutes.setRepoRoot(_scratchRoot);
  }
});

// ── ctpl-s1: tenant-match guard tests ──────────────────────────────────────
// These call handleGetJourney directly (not just _mergeStateFeaturesIntoJourneyList
// in isolation) because the guard lives at the CALL SITE in handleGetJourney,
// not inside the merge function itself -- a unit test on the merge function
// alone would prove nothing about whether the guard actually runs before it.
function withPlatformTenantId(value, fn) {
  var original = process.env.PLATFORM_TENANT_ID;
  if (value === undefined) delete process.env.PLATFORM_TENANT_ID;
  else process.env.PLATFORM_TENANT_ID = value;
  return Promise.resolve().then(fn).finally(function() {
    if (original === undefined) delete process.env.PLATFORM_TENANT_ID;
    else process.env.PLATFORM_TENANT_ID = original;
  });
}

await checkAsync('ctpl-s1 AC1: mismatched tenantId -- journey page has no merged pipeline-state features', async () => {
  var mergeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ctpl-s1-ac1-'));
  journeyRoutes.setRepoRoot(mergeRoot);
  var dir = path.join(mergeRoot, '.github');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pipeline-state.json'), JSON.stringify({
    features: [{ slug: 'ctpl-leak-fixture-1', stage: 'definition', updatedAt: '2026-10-29T00:00:00.000Z' }]
  }), 'utf8');
  try {
    await withPlatformTenantId('platform-tenant-x', async () => {
      var req = journeyFixture({ params: {}, session: { accessToken: 'tok', userId: '1', login: 'alice', tenantId: 'some-other-tenant' } });
      var res = journeyFixtureRes();
      await journeyRoutes.handleGetJourney(req, res, null, null);
      var body = res._get().body;
      assert.ok(body.indexOf('ctpl-leak-fixture-1') === -1, 'must not show a feature belonging to a different tenant');
    });
  } finally {
    journeyRoutes.setRepoRoot(_scratchRoot);
  }
});

await checkAsync('ctpl-s1 AC2: matching tenantId -- journey page still shows merged pipeline-state features (no regression)', async () => {
  var mergeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ctpl-s1-ac2-'));
  journeyRoutes.setRepoRoot(mergeRoot);
  var dir = path.join(mergeRoot, '.github');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pipeline-state.json'), JSON.stringify({
    features: [{ slug: 'ctpl-leak-fixture-2', stage: 'definition', updatedAt: '2026-10-29T00:00:00.000Z' }]
  }), 'utf8');
  try {
    await withPlatformTenantId('platform-tenant-x', async () => {
      var req = journeyFixture({ params: {}, session: { accessToken: 'tok', userId: '1', login: 'alice', tenantId: 'platform-tenant-x' } });
      var res = journeyFixtureRes();
      await journeyRoutes.handleGetJourney(req, res, null, null);
      var body = res._get().body;
      assert.ok(body.indexOf('ctpl-leak-fixture-2') !== -1, 'the one legitimate (self-hosted) case must be unaffected by this fix');
    });
  } finally {
    journeyRoutes.setRepoRoot(_scratchRoot);
  }
});

await checkAsync('ctpl-s1 AC3: PLATFORM_TENANT_ID unset -- no merged features for anyone, even an empty-string tenantId (fail-closed)', async () => {
  var mergeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ctpl-s1-ac3-'));
  journeyRoutes.setRepoRoot(mergeRoot);
  var dir = path.join(mergeRoot, '.github');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pipeline-state.json'), JSON.stringify({
    features: [{ slug: 'ctpl-leak-fixture-3', stage: 'definition', updatedAt: '2026-10-29T00:00:00.000Z' }]
  }), 'utf8');
  try {
    await withPlatformTenantId(undefined, async () => {
      var req = journeyFixture({ params: {}, session: { accessToken: 'tok', userId: '1', login: 'alice', tenantId: '' } });
      var res = journeyFixtureRes();
      await journeyRoutes.handleGetJourney(req, res, null, null);
      var body = res._get().body;
      assert.ok(body.indexOf('ctpl-leak-fixture-3') === -1, 'an unset PLATFORM_TENANT_ID must never wildcard-match, including against an empty-string tenantId');
    });
  } finally {
    journeyRoutes.setRepoRoot(_scratchRoot);
  }
});

// Code-quality review finding (MEDIUM): the AC3 test above sets
// PLATFORM_TENANT_ID to undefined (deleted), so platformTenantId ends up
// undefined -- 'undefined === ""' is already false under plain strict
// equality, meaning that test would pass identically even if
// _isPlatformSelfTenant had NO !! guards at all. It never actually
// exercises the specific danger the production comment names: an empty
// STRING PLATFORM_TENANT_ID ('', genuinely set, not deleted) compared
// against an empty-string tenantId, where '' === '' is true in plain JS.
// This test pins that exact case.
await checkAsync('ctpl-s1 AC3 (code-quality follow-up): PLATFORM_TENANT_ID set to the literal empty string must not match an empty-string tenantId', async () => {
  var mergeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ctpl-s1-ac3b-'));
  journeyRoutes.setRepoRoot(mergeRoot);
  var dir = path.join(mergeRoot, '.github');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pipeline-state.json'), JSON.stringify({
    features: [{ slug: 'ctpl-leak-fixture-3b', stage: 'definition', updatedAt: '2026-10-29T00:00:00.000Z' }]
  }), 'utf8');
  try {
    await withPlatformTenantId('', async () => {
      var req = journeyFixture({ params: {}, session: { accessToken: 'tok', userId: '1', login: 'alice', tenantId: '' } });
      var res = journeyFixtureRes();
      await journeyRoutes.handleGetJourney(req, res, null, null);
      var body = res._get().body;
      assert.ok(body.indexOf('ctpl-leak-fixture-3b') === -1, 'an empty-string PLATFORM_TENANT_ID must never match an empty-string tenantId, even though "" === "" is true -- this is exactly what the !! guards in _isPlatformSelfTenant exist to prevent');
    });
  } finally {
    journeyRoutes.setRepoRoot(_scratchRoot);
  }
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
