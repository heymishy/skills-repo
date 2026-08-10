'use strict';
// check-jcn-s1-journey-page-nav-products.js — jcn-s1
//
// Unit tests for jcn-s1 (the stage-history resume view and the journey-
// complete view both rendered with no way back to /dashboard -- pan-s1's
// sidebar Products section, which replaced the old standalone "Home" nav
// item, was never threaded into either handler's renderShell call). Covers
// AC1-AC5 from
// artefacts/2026-08-10-journey-page-nav-products-gap/test-plans/jcn-s1-test-plan.md.

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

var _scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jcn-s1-'));
journeyRoutes.setRepoRoot(_scratchRoot);

function writeArtefact(relPath, content) {
  var abs = path.join(_scratchRoot, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
}

function mockReq(overrides) {
  return Object.assign({
    session: { accessToken: 'tok-alice', userId: '1', login: 'alice', tenantId: 't1' },
    params: {},
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

function makeCompletedJourneyFixture(slug, stageName, artefactRelPath, artefactContent) {
  var journey = journeyStore.createJourney(slug, 'default');
  if (artefactRelPath) { writeArtefact(artefactRelPath, artefactContent); }
  journeyStore.completeStage(journey.journeyId, stageName, artefactRelPath || null, null, 'seed-sid-1');
  journeyStore.setJourneyFields(journey.journeyId, { activeSkill: 'benefit-metric', activeSessionId: 'seed-sid-2' });
  return journey;
}

// Mock pool matching _getProductsNavSummary's exact real query shapes
// (products.js:1316-1341).
function makeMockPool(products) {
  return {
    query: async function (sql) {
      var s = String(sql);
      if (/SELECT product_id, name, created_at FROM products WHERE tenant_id/i.test(s)) {
        return { rows: (products || []).map(function (p) { return { product_id: p.id, name: p.name, created_at: new Date().toISOString() }; }) };
      }
      if (/SELECT journey_id, created_at AS updated_at FROM journeys WHERE product_id/i.test(s)) {
        return { rows: [] };
      }
      if (/SELECT journey_id FROM journeys WHERE tenant_id.*product_id IS NULL/i.test(s)) {
        return { rows: [] };
      }
      return { rows: [] };
    }
  };
}

(async () => {

// ── AC1: stage-history page nav includes product list + See all products ──
await checkAsync('AC1: handleGetJourneyStageView_withPool_rendersProductsNavSection', async () => {
  var journey = makeCompletedJourneyFixture(
    'jcn-s1-ac1-feature', 'definition', 'artefacts/jcn-s1-ac1-feature/definition.md',
    '# Definition\n\nAC1 fixture content.'
  );
  journeyRoutes.setGetTurnsForStage(async function () { return []; });
  var pool = makeMockPool([{ id: 'p1', name: 'Product One' }]);

  var req = mockReq({ params: { journeyId: journey.journeyId, stageName: 'definition' } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyStageView(req, res, pool);
  var result = res._get();

  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
  assert.ok(result.body.indexOf('Product One') !== -1, 'expected the real product name in the rendered nav');
});

// ── AC2: "See all products" link points at /dashboard ──
await checkAsync('AC2: handleGetJourneyStageView_seeAllProductsLink_pointsAtDashboard', async () => {
  var journey = makeCompletedJourneyFixture(
    'jcn-s1-ac2-feature', 'definition', 'artefacts/jcn-s1-ac2-feature/definition.md',
    '# Definition\n\nAC2 fixture content.'
  );
  journeyRoutes.setGetTurnsForStage(async function () { return []; });
  var pool = makeMockPool([{ id: 'p1', name: 'Product One' }]);

  var req = mockReq({ params: { journeyId: journey.journeyId, stageName: 'definition' } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyStageView(req, res, pool);
  var result = res._get();

  assert.ok(result.body.indexOf('See all products') !== -1, 'expected a "See all products" link');
  assert.ok(result.body.indexOf('href="/dashboard"') !== -1, 'expected the See-all-products link to point at /dashboard');
});

// ── AC3: journey-complete page nav includes the same products section ──
await checkAsync('AC3: handleGetJourneyComplete_withPool_rendersProductsNavSection', async () => {
  var journey = journeyStore.createJourney('jcn-s1-ac3-feature', 'default');
  journeyStore.completeStage(journey.journeyId, 'definition-of-ready', null, null, 'seed-sid-1');
  var pool = makeMockPool([{ id: 'p1', name: 'Product One' }]);

  var req = mockReq({ params: { journeyId: journey.journeyId } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyComplete(req, res, pool);
  var result = res._get();

  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
  assert.ok(result.body.indexOf('Product One') !== -1, 'expected the real product name in the rendered nav');
  assert.ok(result.body.indexOf('href="/dashboard"') !== -1, 'expected the See-all-products link to point at /dashboard');
});

// ── AC4: zero-products state matches the rest of the app ──
await checkAsync('AC4: bothPages_zeroProducts_rendersEmptyProductsStateNotProductOne', async () => {
  var journey1 = makeCompletedJourneyFixture(
    'jcn-s1-ac4-feature', 'definition', 'artefacts/jcn-s1-ac4-feature/definition.md',
    '# Definition\n\nAC4 fixture content.'
  );
  journeyRoutes.setGetTurnsForStage(async function () { return []; });
  var journey2 = journeyStore.createJourney('jcn-s1-ac4b-feature', 'default');
  journeyStore.completeStage(journey2.journeyId, 'definition-of-ready', null, null, 'seed-sid-1');
  var pool = makeMockPool([]); // zero products

  var req1 = mockReq({ params: { journeyId: journey1.journeyId, stageName: 'definition' } });
  var res1 = mockRes();
  await journeyRoutes.handleGetJourneyStageView(req1, res1, pool);
  var result1 = res1._get();

  var req2 = mockReq({ params: { journeyId: journey2.journeyId } });
  var res2 = mockRes();
  await journeyRoutes.handleGetJourneyComplete(req2, res2, pool);
  var result2 = res2._get();

  assert.strictEqual(result1.statusCode, 200);
  assert.strictEqual(result2.statusCode, 200);
  assert.ok(result1.body.indexOf('Product One') === -1, 'expected no fabricated product name with zero real products (stage-history page)');
  assert.ok(result2.body.indexOf('Product One') === -1, 'expected no fabricated product name with zero real products (journey-complete page)');
});

// ── AC5: no-pool test callers unaffected (regression guard) ──
await checkAsync('AC5: bothHandlers_calledWithoutPool_unaffected', async () => {
  var journey1 = makeCompletedJourneyFixture(
    'jcn-s1-ac5a-feature', 'definition', 'artefacts/jcn-s1-ac5a-feature/definition.md',
    '# Definition\n\nAC5 fixture content.'
  );
  journeyRoutes.setGetTurnsForStage(async function () { return []; });
  var journey2 = journeyStore.createJourney('jcn-s1-ac5b-feature', 'default');
  journeyStore.completeStage(journey2.journeyId, 'definition-of-ready', null, null, 'seed-sid-1');

  var req1 = mockReq({ params: { journeyId: journey1.journeyId, stageName: 'definition' } });
  var res1 = mockRes();
  await journeyRoutes.handleGetJourneyStageView(req1, res1); // no pool arg

  var req2 = mockReq({ params: { journeyId: journey2.journeyId } });
  var res2 = mockRes();
  await journeyRoutes.handleGetJourneyComplete(req2, res2); // no pool arg

  assert.strictEqual(res1._get().statusCode, 200, 'expected handleGetJourneyStageView to complete successfully with no pool argument');
  assert.strictEqual(res2._get().statusCode, 200, 'expected handleGetJourneyComplete to complete successfully with no pool argument');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
