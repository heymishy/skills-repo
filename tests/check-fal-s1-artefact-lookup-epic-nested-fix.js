'use strict';

// tests/check-fal-s1-artefact-lookup-epic-nested-fix.js — fal-s1
//
// The artefact index page (/features/:slug) resolved artefacts using the raw
// URL story slug -- correct only for a genuine top-level feature. Any story
// nested inside another feature's epics[].stories[] needs the real parent
// feature's slug instead: confirmed live in production for lphf-s2 and
// rb-s4, both real, dodStatus:complete stories that showed "No artefacts
// found" despite having fully-recorded artefact paths. A second, distinct
// root cause was found via a repo-wide data check: 35 real epic-nested
// stories store their story references as bare strings (not objects), which
// computeTaxonomyRollup's own slug extraction (story.slug || story.id)
// resolves to undefined for.
//
// pdt-s4's own existing test (check-pdt-s4-story-breadcrumb.js) mocks
// setListArtefacts to always succeed regardless of the slug it's called
// with -- it would not have caught this bug, since it only asserts
// breadcrumb text, not which feature slug the artefact lookup itself
// received. These tests capture the actual call arguments instead.
//
// Covers AC1-AC4 from
// artefacts/2026-09-04-feature-artefact-lookup-epic-nested-fix/test-plans/fal-s1-test-plan.md.
// AC5 is covered by tests/check-pdt-s4-story-breadcrumb.js running unmodified.

var assert = require('assert');
var path = require('path');

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

var FEATURES_PATH = path.resolve(__dirname, '../src/web-ui/routes/features.js');
var ROLLUP_PATH   = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');

function freshRequire(modulePath) {
  try { delete require.cache[require.resolve(modulePath)]; } catch (_) {}
  return require(modulePath);
}

function makeRes() {
  var state = { status: 200, body: '' };
  return {
    writeHead: function(code) { state.status = code; },
    end: function(body) { state.body = body || ''; },
    _get: function() { return state; }
  };
}

// Wraps a mock fn to record every call's argument list, so tests can assert
// which slug a downstream lookup was actually invoked with -- not just what
// the final rendered output contains.
function spy(impl) {
  var calls = [];
  var fn = function() {
    calls.push(Array.prototype.slice.call(arguments));
    return impl.apply(this, arguments);
  };
  fn.calls = calls;
  return fn;
}

(async function() {
  // ===========================================================================
  // AC1 -- object-shaped epic-nested story resolves to the real feature slug
  // ===========================================================================
  await test('AC1: object-shaped epic-nested story: _listArtefacts and getJourneyByFeatureSlug are called with the real parent feature slug, not the raw story slug', async function() {
    var routes = freshRequire(FEATURES_PATH);
    var listArtefactsSpy = spy(async function() {
      return { artefacts: [{ path: 'artefacts/2026-08-08-landing-page-hero-features/discovery.md', type: 'Discovery' }], grouped: {}, noArtefacts: false };
    });
    var getJourneyByFeatureSlugSpy = spy(function() { return null; }); // neither the raw slug nor (in this fixture) the resolved slug has its own journey record
    routes.setListArtefacts(listArtefactsSpy);
    routes.setJourneyStoreModule({
      getJourneyByFeatureSlug: getJourneyByFeatureSlugSpy,
      getArtefactsForJourney: async function() { return []; }
    });
    var taxonomy = { groups: [{ epicSlug: 'e1', epicName: 'Landing Page Hero Features', items: [{ slug: 'lphf-s2', featureSlug: '2026-08-08-landing-page-hero-features' }] }], ungrouped: [] };
    var pool = { query: async function(sql, params) {
      if (/SELECT p\.product_id, p\.name, pr\.taxonomy/i.test(sql)) {
        return { rows: params[0] === 't1' ? [{ product_id: 'product-lphf', name: 'Landing Page Product', taxonomy: taxonomy }] : [] };
      }
      return { rows: [] };
    } };
    var req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' }, headers: { accept: 'text/html' } };
    var res = makeRes();
    await routes.handleGetFeatureArtefacts(req, res, 'lphf-s2', pool);

    assert.strictEqual(listArtefactsSpy.calls[0][0], '2026-08-08-landing-page-hero-features', 'expected _listArtefacts to be called with the real parent feature slug, got: ' + listArtefactsSpy.calls[0][0]);
    var resolvedSlugCalls = getJourneyByFeatureSlugSpy.calls.filter(function(c) { return c[0] === '2026-08-08-landing-page-hero-features'; });
    assert.ok(resolvedSlugCalls.length >= 1, 'expected getJourneyByFeatureSlug to also be called with the real parent feature slug (for the resume-links/Postgres-fallback journey), got calls: ' + JSON.stringify(getJourneyByFeatureSlugSpy.calls));
  });

  // ===========================================================================
  // AC2 (part 1) -- computeTaxonomyRollup resolves a bare-string story slug
  // ===========================================================================
  await test('AC2 (part 1): computeTaxonomyRollup resolves a bare-string epic-nested story slug correctly, not undefined', function() {
    var rollup = freshRequire(ROLLUP_PATH);
    var pipelineState = {
      features: [{
        slug: '2026-04-14-skills-platform-phase3',
        epics: [{
          slug: 'p3.1-epic',
          name: 'Phase 3.1',
          stories: ['p3.1a', 'p3.1b']
        }]
      }]
    };
    var result = rollup.computeTaxonomyRollup(pipelineState);
    var items = result.groups[0].items;
    assert.strictEqual(items[0].slug, 'p3.1a', 'expected the bare-string story reference to resolve to itself, got: ' + items[0].slug);
    assert.strictEqual(items[0].featureSlug, '2026-04-14-skills-platform-phase3');
    assert.strictEqual(items[1].slug, 'p3.1b');
  });

  // ===========================================================================
  // AC2 (part 2) -- end-to-end artefact lookup for the bare-string case
  // ===========================================================================
  await test('AC2 (part 2): bare-string epic-nested story: _listArtefacts is called with the real parent feature slug', async function() {
    var routes = freshRequire(FEATURES_PATH);
    var listArtefactsSpy = spy(async function() {
      return { artefacts: [{ path: 'artefacts/2026-04-14-skills-platform-phase3/discovery.md', type: 'Discovery' }], grouped: {}, noArtefacts: false };
    });
    routes.setListArtefacts(listArtefactsSpy);
    routes.setJourneyStoreModule({
      getJourneyByFeatureSlug: function() { return null; },
      getArtefactsForJourney: async function() { return []; }
    });
    // Represents computeTaxonomyRollup's own now-fixed output for a
    // bare-string story reference (AC2 part 1) -- slug resolves to the
    // string itself, featureSlug carries the real parent feature.
    var taxonomy = { groups: [{ epicSlug: 'p3.1-epic', epicName: 'Phase 3.1', items: [{ slug: 'p3.1a', featureSlug: '2026-04-14-skills-platform-phase3' }] }], ungrouped: [] };
    var pool = { query: async function(sql, params) {
      if (/SELECT p\.product_id, p\.name, pr\.taxonomy/i.test(sql)) {
        return { rows: params[0] === 't1' ? [{ product_id: 'product-p3', name: 'Skills Platform', taxonomy: taxonomy }] : [] };
      }
      return { rows: [] };
    } };
    var req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' }, headers: { accept: 'text/html' } };
    var res = makeRes();
    await routes.handleGetFeatureArtefacts(req, res, 'p3.1a', pool);

    assert.strictEqual(listArtefactsSpy.calls[0][0], '2026-04-14-skills-platform-phase3', 'expected _listArtefacts to be called with the real parent feature slug, got: ' + listArtefactsSpy.calls[0][0]);
  });

  // ===========================================================================
  // AC3 (regression) -- top-level feature: fast path unchanged, no taxonomy scan
  // ===========================================================================
  await test('AC3 (regression): top-level feature uses the fast path -- no taxonomy scan, _listArtefacts gets the raw (already-correct) slug', async function() {
    var routes = freshRequire(FEATURES_PATH);
    var listArtefactsSpy = spy(async function() {
      return { artefacts: [{ path: 'artefacts/x/discovery.md', type: 'Discovery' }], grouped: {}, noArtefacts: false };
    });
    routes.setListArtefacts(listArtefactsSpy);
    routes.setJourneyStoreModule({
      getJourneyByFeatureSlug: function() { return { journeyId: 'jid-1', featureSlug: 'x', displayName: 'Feature X', completedStages: [], productId: 'product-abc' }; },
      getArtefactsForJourney: async function() { return []; }
    });
    var taxonomyScanCalled = false;
    var pool = { query: async function(sql, params) {
      if (/SELECT p\.product_id, p\.name, pr\.taxonomy/i.test(sql)) { taxonomyScanCalled = true; return { rows: [] }; }
      if (/SELECT name FROM products WHERE product_id/i.test(sql)) return { rows: [{ name: 'Acme Product' }] };
      return { rows: [] };
    } };
    var req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' }, headers: { accept: 'text/html' } };
    var res = makeRes();
    await routes.handleGetFeatureArtefacts(req, res, 'x', pool);

    assert.ok(!taxonomyScanCalled, 'expected the taxonomy-scan query to never run when the fast path already resolved');
    assert.strictEqual(listArtefactsSpy.calls[0][0], 'x', 'expected _listArtefacts to still be called with the raw (already-correct) slug');
  });

  // ===========================================================================
  // AC4 (regression) -- genuinely unresolvable slug still shows "No artefacts found"
  // ===========================================================================
  await test('AC4 (regression): genuinely unresolvable slug: "No artefacts found for this feature" still renders', async function() {
    var routes = freshRequire(FEATURES_PATH);
    routes.setListArtefacts(async function() { return { artefacts: [], grouped: {}, noArtefacts: true }; });
    routes.setJourneyStoreModule({
      getJourneyByFeatureSlug: function() { return null; },
      getArtefactsForJourney: async function() { return []; }
    });
    var pool = { query: async function() { return { rows: [] }; } };
    var req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' }, headers: { accept: 'text/html' } };
    var res = makeRes();
    await routes.handleGetFeatureArtefacts(req, res, 'totally-unknown-slug', pool);
    var body = res._get().body;
    assert.ok(/No artefacts found for this feature/.test(body), 'expected the existing honest empty-state message to still render');
  });

  console.log('\n[check-fal-s1-artefact-lookup-epic-nested-fix] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
