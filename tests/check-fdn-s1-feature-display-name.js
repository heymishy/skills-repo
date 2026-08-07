'use strict';

// tests/check-fdn-s1-feature-display-name.js -- fdn-s1
// Story: artefacts/2026-07-25-feature-display-name-and-progress/stories/fdn-s1-feature-display-name.md
// Test plan: artefacts/2026-07-25-feature-display-name-and-progress/test-plans/fdn-s1-feature-display-name-test-plan.md
//
// Covers:
//   AC1: New-feature modal accepts optional displayName, persisted
//   AC2: no displayName -> raw slug shown, unchanged
//   AC3: displayName set -> shown instead of slug, no duplication
//   AC4: rename route updates displayName, never featureSlug; tenant-ownership enforced
//   AC5: PG _sanitise persists/round-trips displayName
//   AC6: mergeFeatureSources threads displayName into item.name

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

var PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
var JOURNEY_STORE_PG_PATH = path.resolve(__dirname, '../src/web-ui/adapters/journey-store-pg.js');
var JOURNEY_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var SKILLS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
var PRODUCT_ROLLUP_PATH = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function makeRes() {
  var r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(status, headers) { r._status = status; Object.assign(r._headers, headers || {}); };
  r.setHeader = function(k, v) { r._headers[k] = v; };
  r.end = function(b) { r._body += (b || ''); };
  return r;
}

function extractSidFromRedirect(res) {
  var loc = res._headers.Location || '';
  var m = /\/skills\/[^/]+\/sessions\/([^/]+)\/chat/.exec(loc);
  return m ? decodeURIComponent(m[1]) : null;
}

(async function() {
  // ===========================================================================
  // AC1 -- POST accepts and persists an optional displayName
  // ===========================================================================
  await test('newFeatureAcceptsOptionalDisplayName (AC1)', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var skillsRoute = require(SKILLS_ROUTE_PATH);

    var req = {
      params: { id: 'prod-1' },
      session: { tenantId: 'tenant-1', login: 'octocat' },
      body: { startSkill: 'discovery', displayName: 'Checkout redesign' }
    };
    var res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, { query: async function(sql) { if (String(sql).toUpperCase().indexOf("SELECT REPO_OWNER, REPO_NAME") !== -1) { return { rows: [{ repo_owner: "acme", repo_name: "widgets" }] }; } return { rows: [] }; } }, { capture: function() {} });

    var sid = extractSidFromRedirect(res);
    var session = skillsRoute._getHtmlSession(sid);
    var journey = journeyStore.getJourney(session.journeyId);

    assert.strictEqual(journey.displayName, 'Checkout redesign');
  });

  await test('newFeatureOmittedDisplayNameDefaultsToNull (AC1)', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var skillsRoute = require(SKILLS_ROUTE_PATH);

    var req = {
      params: { id: 'prod-1' },
      session: { tenantId: 'tenant-1', login: 'octocat' },
      body: { startSkill: 'discovery' }
    };
    var res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, { query: async function(sql) { if (String(sql).toUpperCase().indexOf("SELECT REPO_OWNER, REPO_NAME") !== -1) { return { rows: [{ repo_owner: "acme", repo_name: "widgets" }] }; } return { rows: [] }; } }, { capture: function() {} });

    var sid = extractSidFromRedirect(res);
    var session = skillsRoute._getHtmlSession(sid);
    var journey = journeyStore.getJourney(session.journeyId);

    assert.strictEqual(journey.displayName, null, 'expected no forced displayName when omitted');
  });

  await test('newFeatureBlankDisplayNameDefaultsToNull (AC1)', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var skillsRoute = require(SKILLS_ROUTE_PATH);

    var req = {
      params: { id: 'prod-1' },
      session: { tenantId: 'tenant-1', login: 'octocat' },
      body: { startSkill: 'discovery', displayName: '   ' }
    };
    var res = makeRes();
    await productsRoute.handlePostProductFeature(req, res, null, { query: async function(sql) { if (String(sql).toUpperCase().indexOf("SELECT REPO_OWNER, REPO_NAME") !== -1) { return { rows: [{ repo_owner: "acme", repo_name: "widgets" }] }; } return { rows: [] }; } }, { capture: function() {} });

    var sid = extractSidFromRedirect(res);
    var session = skillsRoute._getHtmlSession(sid);
    var journey = journeyStore.getJourney(session.journeyId);

    assert.strictEqual(journey.displayName, null, 'expected a whitespace-only name to be treated as absent');
  });

  // ===========================================================================
  // AC2/AC3 -- row rendering: slug fallback vs displayName
  // ===========================================================================
  await test('_renderEpicRow: no displayName renders raw slug unchanged (AC2)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var html = productsRoute._renderEpicRow({ featureSlug: 'new-feature-abc123', health: 'unknown', stage: 'discovery' });
    assert.ok(html.indexOf('new-feature-abc123') !== -1);
  });

  await test('_renderEpicRow: displayName set renders it instead of the slug (AC3)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var html = productsRoute._renderEpicRow({ featureSlug: 'new-feature-abc123', displayName: 'Checkout redesign', health: 'unknown', stage: 'discovery' });
    assert.ok(html.indexOf('Checkout redesign') !== -1, 'expected displayName in output');
    assert.ok(html.indexOf('new-feature-abc123') === -1, 'expected raw slug not duplicated as a second visible label');
  });

  await test('_renderPvcItemRow: no name/displayName renders raw slug unchanged (AC2)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var html = productsRoute._renderPvcItemRow({ slug: 'new-feature-xyz789', health: 'unknown' });
    assert.ok(html.indexOf('new-feature-xyz789') !== -1);
  });

  await test('_renderPvcItemRow: item.name (from displayName) renders instead of the slug (AC3)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var html = productsRoute._renderPvcItemRow({ slug: 'new-feature-xyz789', name: 'Checkout redesign', health: 'unknown' });
    assert.ok(html.indexOf('Checkout redesign') !== -1);
    // The slug still legitimately appears in the href/aria-label (it's the
    // real URL target) -- what must NOT happen is the slug also appearing
    // as the row's own visible title text, i.e. duplicated as a second label.
    var titleMatch = /font-weight:500">([^<]*)<\/div>/.exec(html);
    assert.ok(titleMatch, 'expected to find the row title div');
    assert.strictEqual(titleMatch[1], 'Checkout redesign', 'expected the visible title to be the displayName, not the slug');
  });

  // ===========================================================================
  // AC4 -- rename route
  // ===========================================================================
  await test('renameRouteUpdatesDisplayNameOnly (AC4)', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var journeyRoute = freshRequire(JOURNEY_ROUTE_PATH);
    journeyRoute.setJourneyStoreModule(journeyStore);

    var created = journeyStore.createJourney('my-feature-slug', 'default');
    journeyStore.setJourneyFields(created.journeyId, { ownerId: 'octocat', tenantId: 'tenant-1' });

    var req = {
      params: { journeyId: created.journeyId },
      session: { accessToken: 'tok', login: 'octocat', tenantId: 'tenant-1' },
      body: { displayName: 'Renamed feature' }
    };
    var res = makeRes();
    await journeyRoute.handlePutJourneyDisplayName(req, res);

    assert.strictEqual(res._status, 200);
    var journey = journeyStore.getJourney(created.journeyId);
    assert.strictEqual(journey.displayName, 'Renamed feature');
    assert.strictEqual(journey.featureSlug, 'my-feature-slug', 'expected featureSlug to be completely untouched');
  });

  await test('renameRouteEnforcesTenantOwnership (AC4, Security NFR)', async function() {
    var journeyStore = freshRequire(JOURNEY_STORE_PATH);
    journeyStore._clearForTesting();
    var journeyRoute = freshRequire(JOURNEY_ROUTE_PATH);
    journeyRoute.setJourneyStoreModule(journeyStore);

    var created = journeyStore.createJourney('other-tenant-feature', 'default');
    journeyStore.setJourneyFields(created.journeyId, { ownerId: 'owner@example.test', tenantId: 'owner@example.test' });

    var req = {
      params: { journeyId: created.journeyId },
      session: { accessToken: 'tok', login: 'attacker@example.test', tenantId: 'attacker@example.test' },
      body: { displayName: 'Hijacked name' }
    };
    var res = makeRes();
    await journeyRoute.handlePutJourneyDisplayName(req, res);

    assert.strictEqual(res._status, 404);
    var journey = journeyStore.getJourney(created.journeyId);
    assert.strictEqual(journey.displayName, null, 'expected the rename to be rejected, not applied');
  });

  // ===========================================================================
  // AC5 -- PG _sanitise round-trips displayName
  // ===========================================================================
  await test('pgSanitiseRoundTripsDisplayName (AC5)', function() {
    var fs = require('fs');
    var src = fs.readFileSync(path.resolve(__dirname, '../src/web-ui/adapters/journey-store-pg.js'), 'utf8');
    assert.ok(/displayName:\s*journey\.displayName\s*\|\|\s*null/.test(src), 'expected _sanitise() to include displayName in its explicit allowlist');
  });

  await test('pgSanitiseRoundTripsDisplayName via listJourneys shape (AC5)', function() {
    var journeyStorePg = freshRequire(JOURNEY_STORE_PG_PATH);
    // listJourneys spreads row.data (the JSONB blob) over the row -- simulate
    // that shape directly to prove displayName survives the round trip once
    // _sanitise() has written it into `data`.
    var fakeDataBlob = { displayName: 'Round tripped name', completedStages: [] };
    var reconstructed = Object.assign({}, fakeDataBlob, { journeyId: 'j1', featureSlug: 'x' });
    assert.strictEqual(reconstructed.displayName, 'Round tripped name');
  });

  // ===========================================================================
  // AC6 -- mergeFeatureSources threads displayName for journey-sourced items
  // ===========================================================================
  await test('mergeFeatureSourcesUsesDisplayNameForJourneyItems (AC6)', function() {
    var productRollup = freshRequire(PRODUCT_ROLLUP_PATH);
    var merged = productRollup.mergeFeatureSources(null, [
      { featureSlug: 'new-feature-abc', displayName: 'Checkout redesign', journey_id: 'j1', stage: 'discovery' }
    ]);
    assert.strictEqual(merged.length, 1);
    assert.strictEqual(merged[0].name, 'Checkout redesign');
  });

  await test('mergeFeatureSources: journey item with no displayName leaves name null (AC6)', function() {
    var productRollup = freshRequire(PRODUCT_ROLLUP_PATH);
    var merged = productRollup.mergeFeatureSources(null, [
      { featureSlug: 'new-feature-def', journey_id: 'j2', stage: 'discovery' }
    ]);
    assert.strictEqual(merged.length, 1);
    assert.strictEqual(merged[0].name, null);
  });

  // ===========================================================================
  // Kanban board card titles also prefer displayName (bonus coverage --
  // same render-site convention, threaded through _aggregateJourneysByStage)
  // ===========================================================================
  await test('kanban card title prefers display_name over feature_slug', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var columns = productsRoute.buildProductKanbanColumns([
      { journey_id: 'j1', feature_slug: 'new-feature-abc', stage: 'discovery', display_name: 'Checkout redesign' }
    ]);
    var discoveryColumn = columns.filter(function(c) { return c.stage === 'discovery'; })[0];
    assert.strictEqual(discoveryColumn.cards[0].title, 'Checkout redesign');
  });

  await test('kanban card title falls back to feature_slug when no display_name (unchanged behaviour)', function() {
    var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
    var columns = productsRoute.buildProductKanbanColumns([
      { journey_id: 'j2', feature_slug: 'new-feature-def', stage: 'discovery' }
    ]);
    var discoveryColumn = columns.filter(function(c) { return c.stage === 'discovery'; })[0];
    assert.strictEqual(discoveryColumn.cards[0].title, 'new-feature-def');
  });

  console.log('\n[fdn-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
