'use strict';

// tests/check-ddft-s5-web-ui-rendering.js -- tests for ddft-s5
// Story: artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s5-web-ui-rendering.md
// Test plan: artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s5-web-ui-rendering-test-plan.md
//
// Wiring rule: behavioural ACs are driven through the REAL entry point
// (productsRoute.handleGetProductView) with the REAL realFetchRepoPath adapter
// against a stubbed global.fetch returning the real GitHub Contents API payload
// shape ({content: <base64>}). The real committed workspace/incidents.json is
// read-only here and hash-checked before/after.

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}
function assertTrue(c, label) { if (!c) { throw new Error(label); } }

var ROOT = path.resolve(__dirname, '..');
var PRODUCTS_ROUTE_PATH = path.join(ROOT, 'src/web-ui/routes/products.js');
var FETCHER_PATH = path.join(ROOT, 'src/web-ui/adapters/artefact-fetcher.js');
var MODULES_ADAPTER_PATH = path.join(ROOT, 'src/web-ui/adapters/modules-adapter.js');
var REAL_FILE = path.join(ROOT, 'workspace/incidents.json');

function freshRequire(p) { delete require.cache[require.resolve(p)]; return require(p); }
function sha(p) { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }

function makePool(repoOwner, repoName) {
  return {
    query: async function(sql) {
      if (/SELECT name, tenant_id, repo_owner, repo_name FROM products/.test(sql)) {
        return { rows: [{ name: 'Acme', tenant_id: 't1', repo_owner: repoOwner, repo_name: repoName }] };
      }
      return { rows: [] };
    }
  };
}
function makeRes() {
  var html = null;
  return { html: function() { return html; }, writeHead: function() {}, end: function(b) { html = b; } };
}
function incident(over) {
  return Object.assign({
    id: 'inc-1', type: 'incident', trigger: 'Incident trigger one', summary: 'Summary one', tags: ['auth'],
    priorIncidentLinks: [], status: 'open', triageSummary: null, confirmationStatus: null,
    createdAt: '2026-11-12T00:00:00.000Z', updatedAt: '2026-11-12T00:00:00.000Z'
  }, over || {});
}
function deferred(over) {
  return Object.assign({
    id: 'def-1', type: 'deferred-item', trigger: 'Deferred trigger one', summary: 'Deferred summary', tags: ['x'],
    priorIncidentLinks: [], status: 'open', triageSummary: null, confirmationStatus: null,
    createdAt: '2026-11-12T00:00:00.000Z', updatedAt: '2026-11-12T00:00:00.000Z',
    source: 'risk-accept', revisitCondition: 'Revisit when the thing changes', linkedFeature: 'feat-x', linkedStory: 'x-s1'
  }, over || {});
}

var realFetch = global.fetch;
var fetchCalls = [];
function stubGithub(routes) {
  fetchCalls = [];
  global.fetch = async function(url, opts) {
    fetchCalls.push({ url: String(url), auth: opts && opts.headers && opts.headers.Authorization });
    var key = Object.keys(routes).find(function(k) { return String(url).endsWith('/contents/' + k); });
    var v = key ? routes[key] : 'NOT_FOUND';
    if (v === 'THROW') { throw new Error('network down'); }
    if (v === 'NOT_FOUND') { return { status: 404, ok: false, json: async function() { return { message: 'Not Found' }; } }; }
    return {
      status: 200, ok: true,
      json: async function() { return { type: 'file', encoding: 'base64', content: Buffer.from(v, 'utf8').toString('base64').replace(/(.{60})/g, '$1\n') }; }
    };
  };
}
async function renderPage(routes) {
  stubGithub(routes);
  var route = freshRequire(PRODUCTS_ROUTE_PATH);
  var fetcher = require(FETCHER_PATH);
  fetcher.setFetchRepoPath(fetcher.realFetchRepoPath);
  require(MODULES_ADAPTER_PATH).setModulesAdapter({ query: async function() { return { rows: [] }; } });
  var res = makeRes();
  var req = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'u', accessToken: 'tok-123' } };
  await route.handleGetProductView(req, res, null, makePool('acme', 'repo'));
  return res.html();
}

(async function() {
  var route = freshRequire(PRODUCTS_ROUTE_PATH);
  var hashBefore = sha(REAL_FILE);

  // ---------------- Unit ----------------
  await test('recordTypeLabel_returnsDistinctLiteralText (AC1)', function() {
    assertTrue(route._recordTypeLabel('incident') === 'Incident', 'incident label');
    assertTrue(route._recordTypeLabel('deferred-item') === 'Deferred', 'deferred label');
  });

  await test('typeLabelNeverReliesOnColourAlone (AC1, MC-A11Y-02)', function() {
    var html = route._renderDeferredItem(deferred());
    assertTrue(/>\s*Deferred\s*</.test(html), 'literal text node "Deferred" expected, got: ' + html);
  });

  await test('rendersRevisitConditionInlineNotBehindClickThrough (AC2)', function() {
    var html = route._renderDeferredItem(deferred({ revisitCondition: 'Act when X is done' }));
    assertTrue(html.indexOf('Act when X is done') !== -1, 'revisitCondition missing');
    assertTrue(!/<(a|button)[\s>]/.test(html) && html.indexOf('<details') === -1, 'no link/button/details click-through');
  });

  await test('renderDeferredItem_noLiteralNullUndefined_whenOptionalFieldsAbsent', function() {
    var html = route._renderDeferredItem(deferred({ revisitCondition: null, linkedFeature: null, linkedStory: null, tags: undefined, summary: undefined }));
    assertTrue(html.indexOf('null') === -1 && html.indexOf('undefined') === -1, 'no literal null/undefined: ' + html);
    assertTrue(html.indexOf('Deferred') !== -1 && html.indexOf('Status: open') !== -1, 'label and status still render');
  });

  await test('NFR revisitConditionTextIsEscapedOnRender (MC-SEC-01)', function() {
    var bad = '<script>alert(1)</script>';
    var html = route._renderDeferredItem(deferred({ trigger: bad, summary: bad, revisitCondition: bad, tags: [bad], status: bad, id: bad, source: bad, linkedFeature: bad, linkedStory: bad }));
    assertTrue(html.indexOf('<script>') === -1, 'raw <script> leaked');
    assertTrue(html.indexOf('&lt;script&gt;alert(1)&lt;/script&gt;') !== -1, 'escaped form missing');
  });

  await test('NFR deferredItemUsesOnlyDesignTokens (no literal colour values)', function() {
    var html = route._renderDeferredItem(deferred()) + route._renderDeferredItemsSection([deferred()]);
    assertTrue(!/#[0-9a-fA-F]{3,8}\b/.test(html) && !/rgb\(/.test(html), 'no hex/rgb colours: ' + html);
  });

  await test('parseDeferredItemRecords_filtersToDeferredType_ignoresIncidentsAndBadInput', function() {
    var raw = JSON.stringify([incident({ id: 'a' }), deferred({ id: 'b' }), (function() { var r = incident({ id: 'c' }); delete r.type; return r; })()]);
    var out = route._parseDeferredItemRecords(raw);
    assertTrue(out.length === 1 && out[0].id === 'b', 'expected only b, got ' + JSON.stringify(out.map(function(r) { return r.id; })));
    assertTrue(route._parseDeferredItemRecords('not json').length === 0, 'bad JSON');
    assertTrue(route._parseDeferredItemRecords('{"a":1}').length === 0, 'non-array');
    assertTrue(route._parseDeferredItemRecords(null).length === 0, 'null');
    assertTrue(route._parseDeferredItemRecords('').length === 0, 'empty');
    assertTrue(route._parseDeferredItemRecords('[null,5,"x"]').length === 0, 'junk entries');
  });

  await test('incidentOnlyRenderingUnchangedWhenZeroDeferredItems (AC4)', function() {
    assertTrue(route._renderDeferredItemsSection([]) === '', 'empty list -> empty string');
    assertTrue(route._renderDeferredItemsSection(undefined) === '', 'undefined -> empty string');
    var sect = route._renderConsolidatedFeaturesSection([], [], null, 'p1', 'csrf', {}, {}, [], [incident()], null, []);
    assertTrue(sect.indexOf('data-incident-item') !== -1 && sect.indexOf('data-deferred-section') === -1, 'incident-only: no deferred markup');
  });

  // ---------------- Integration through the real handler ----------------
  await test('mixedRecordList_rendersBothTypesLabelled_andSectionsIgnoreEachOthersRecords (AC1)', async function() {
    var html = await renderPage({ 'workspace/incidents.json': JSON.stringify([incident({ id: 'inc-A', trigger: 'Alpha incident' }), deferred({ id: 'def-B', trigger: 'Beta deferred' })]) });
    assertTrue((html.match(/data-incident-item/g) || []).length === 1, 'exactly one incident item');
    assertTrue((html.match(/data-deferred-item/g) || []).length === 1, 'exactly one deferred item');
    var incSec = html.slice(html.indexOf('data-incidents-section'), html.indexOf('data-deferred-section'));
    assertTrue(incSec.indexOf('Alpha incident') !== -1 && incSec.indexOf('Beta deferred') === -1, 'incident section holds only the incident');
    var defSec = html.slice(html.indexOf('data-deferred-section'));
    assertTrue(defSec.indexOf('Beta deferred') !== -1 && defSec.indexOf('Alpha incident') === -1, 'deferred section holds only the deferred item');
    assertTrue(/>\s*Deferred\s*</.test(html), 'Deferred text label present');
    assertTrue(html.indexOf('Revisit when the thing changes') !== -1, 'revisitCondition inline');
  });

  await test('singleFetch: incidents.json fetched exactly once for both sections', async function() {
    await renderPage({ 'workspace/incidents.json': JSON.stringify([incident(), deferred()]) });
    var n = fetchCalls.filter(function(c) { return /workspace\/incidents\.json$/.test(c.url); }).length;
    assertTrue(n === 1, 'expected 1 fetch of incidents.json, got ' + n);
    var c = fetchCalls.find(function(c) { return /workspace\/incidents\.json$/.test(c.url); });
    assertTrue(c.auth === 'Bearer tok-123', 'uses session accessToken');
  });

  await test('bothRealSeededRecordsRenderWithoutError (AC3, real committed file)', async function() {
    var real = fs.readFileSync(REAL_FILE, 'utf8');
    var parsed = JSON.parse(real);
    var defs = parsed.filter(function(r) { return r.type === 'deferred-item'; });
    assertTrue(defs.length >= 2 && !parsed.some(function(r) { return r.type === 'incident'; }), 'fixture assumption: >=2 deferred, 0 incidents');
    var html = await renderPage({ 'workspace/incidents.json': real });
    assertTrue((html.match(/data-deferred-item/g) || []).length === defs.length, 'every deferred record renders');
    assertTrue(html.indexOf('data-incident-item') === -1 && html.indexOf('data-incidents-section') === -1, 'no incident markup');
    assertTrue(html.indexOf('tfhc-s1') !== -1, 'tfhc-s1 record visible');
    assertTrue(html.indexOf('enterprise fork') !== -1, 'C1-vs-Option-C record visible');
    assertTrue(html.indexOf('Act when testPlan.passing for tfhc-s1 is corrected') !== -1, 'tfhc-s1 revisitCondition inline');
    assertTrue(html.indexOf('refresh later') !== -1, 'C1 revisitCondition inline');
    assertTrue((html.match(/>\s*Deferred\s*</g) || []).length >= defs.length, 'each carries Deferred label');
  });

  await test('zeroDeferredItems_incidentOnlyFile_rendersNormally (AC4)', async function() {
    var html = await renderPage({ 'workspace/incidents.json': JSON.stringify([incident({ trigger: 'Only incident' })]) });
    assertTrue(html.indexOf('Only incident') !== -1 && html.indexOf('data-incident-item') !== -1, 'incident renders');
    assertTrue(html.indexOf('data-deferred-section') === -1 && html.indexOf('data-deferred-item') === -1, 'no deferred markup');
  });

  await test('degradesSilently_whenFileMissingEmptyInvalidOrThrowing (AC4)', async function() {
    var cases = { missing: {}, thrown: { 'workspace/incidents.json': 'THROW' }, empty: { 'workspace/incidents.json': '' }, invalid: { 'workspace/incidents.json': '{{{' } };
    for (var k of Object.keys(cases)) {
      var html = await renderPage(cases[k]);
      assertTrue(html.indexOf('No features yet') !== -1, k + ': page renders normally');
      assertTrue(html.indexOf('data-deferred-item') === -1 && html.indexOf('data-deferred-section') === -1, k + ': no deferred markup');
    }
  });

  await test('boundsFetchLatency_whenGithubHangs (NFR)', async function() {
    var fetcher = require(FETCHER_PATH);
    fetcher.setFetchRepoPath(function() { return new Promise(function() {}); });
    var res = makeRes();
    var t0 = Date.now();
    await route.handleGetProductView({ params: { id: 'p1' }, session: { tenantId: 't1', login: 'u', accessToken: 't' } }, res, null, makePool('acme', 'repo'));
    assertTrue(res.html().indexOf('No features yet') !== -1 && Date.now() - t0 < 6000, 'bounded and renders');
  });

  // ---------------- Wiring ----------------
  await test('wiring: render function has a production caller and handler passes deferred items', function() {
    var src = fs.readFileSync(PRODUCTS_ROUTE_PATH, 'utf8');
    var uses = src.match(/_renderDeferredItemsSection\(/g) || [];
    assertTrue(uses.length >= 2, 'defined and called (found ' + uses.length + ' occurrences)');
    assertTrue(/_renderProductView\([^)]*deferredItems[^)]*\)/.test(src), 'handler passes deferredItems to _renderProductView');
    assertTrue(!/require\([^)]*scripts\//.test(src), 'src must not require scripts/ (not in the production image)');
  });

  await test('realIncidentsJson_unchangedByTests', function() {
    assertTrue(sha(REAL_FILE) === hashBefore, 'workspace/incidents.json hash changed');
  });

  global.fetch = realFetch;
  console.log('\n[ddft-s5] ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed === 0 ? 0 : 1);
})();
