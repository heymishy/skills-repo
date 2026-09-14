'use strict';

// tests/check-fsdn-s1-feature-slug-display-name.js -- fsdn-s1
// Story: artefacts/2026-09-14-feature-slug-respects-display-name/stories/fsdn-s1-slugify-display-name-on-product-feature-create.md
// Test plan: artefacts/2026-09-14-feature-slug-respects-display-name/test-plans/fsdn-s1-test-plan.md

var assert = require('assert');
var fs = require('fs');
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
var JOURNEY_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var SKILLS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

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

var fakePool = { query: async function(sql) {
  if (String(sql).toUpperCase().indexOf('SELECT REPO_OWNER, REPO_NAME') !== -1) {
    return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
  }
  return { rows: [] };
} };

async function createFeatureAndGetJourney(displayName) {
  var journeyStore = freshRequire(JOURNEY_STORE_PATH);
  journeyStore._clearForTesting();
  var productsRoute = freshRequire(PRODUCTS_ROUTE_PATH);
  var skillsRoute = require(SKILLS_ROUTE_PATH);

  var body = { startSkill: 'discovery', _csrf: 'test-csrf-token' };
  if (displayName !== undefined) { body.displayName = displayName; }

  var req = {
    params: { id: 'prod-1' },
    session: { tenantId: 'tenant-1', login: 'octocat', csrfToken: 'test-csrf-token' },
    body: body
  };
  var res = makeRes();
  await productsRoute.handlePostProductFeature(req, res, null, fakePool, { capture: function() {} });

  var sid = extractSidFromRedirect(res);
  var session = skillsRoute._getHtmlSession(sid);
  return journeyStore.getJourney(session.journeyId);
}

(async function() {
  var today = new Date().toISOString().slice(0, 10);

  // ===========================================================================
  // AC1 -- non-blank displayName builds a human-readable, date-prefixed slug
  // ===========================================================================
  await test('non-blank displayName produces a slugified, date-prefixed featureSlug (AC1)', async function() {
    var journey = await createFeatureAndGetJourney('Multi-User Role Sessions');
    assert.strictEqual(journey.featureSlug, today + '-multi-user-role-sessions');
  });

  // ===========================================================================
  // AC2 -- omitted/blank displayName keeps today's exact fallback, unchanged
  // ===========================================================================
  await test('omitted displayName keeps the new-feature-<hash> fallback unchanged (AC2)', async function() {
    var journey = await createFeatureAndGetJourney(undefined);
    assert.ok(/^new-feature-[0-9a-f-]{8}$/.test(journey.featureSlug) || /^new-feature-.{8}$/.test(journey.featureSlug),
      'expected new-feature-<hash> shape, got: ' + journey.featureSlug);
  });

  await test('blank/whitespace-only displayName keeps the new-feature-<hash> fallback unchanged (AC2)', async function() {
    var journey = await createFeatureAndGetJourney('   ');
    assert.ok(/^new-feature-.{8}$/.test(journey.featureSlug), 'expected new-feature-<hash> shape, got: ' + journey.featureSlug);
  });

  // ===========================================================================
  // AC3 -- a displayName that slugifies to empty falls back safely
  // ===========================================================================
  await test('displayName that slugifies to empty string falls back to new-feature-<hash> (AC3)', async function() {
    var journey = await createFeatureAndGetJourney('!!!');
    assert.ok(/^new-feature-.{8}$/.test(journey.featureSlug), 'expected new-feature-<hash> shape, got: ' + journey.featureSlug);
  });

  // ===========================================================================
  // AC4 -- normalization matches the proven _slugify implementation exactly
  // ===========================================================================
  await test('mixed case, punctuation, and extra whitespace normalize via the real _slugify (AC4)', async function() {
    var journeyRoute = require(JOURNEY_ROUTE_PATH);
    var expected = today + '-' + journeyRoute._slugify('  Checkout Redesign!! v2  ');
    var journey = await createFeatureAndGetJourney('  Checkout Redesign!! v2  ');
    assert.strictEqual(journey.featureSlug, expected);
  });

  // ===========================================================================
  // AC5 -- no duplicate slugify implementation in products.js
  // ===========================================================================
  await test('products.js does not define its own slugify function, it reuses journey.js\'s (AC5)', function() {
    var src = fs.readFileSync(PRODUCTS_ROUTE_PATH, 'utf8');
    assert.ok(!/function\s+_?slugify\s*\(/.test(src), 'expected no local slugify function definition in products.js');
    assert.ok(/require\(['"]\.\/journey['"]\)\._slugify/.test(src), 'expected products.js to reuse journey.js\'s exported _slugify');
  });

  await test('journey.js exports _slugify', function() {
    var journeyRoute = require(JOURNEY_ROUTE_PATH);
    assert.strictEqual(typeof journeyRoute._slugify, 'function');
  });

  console.log('\n[fsdn-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
