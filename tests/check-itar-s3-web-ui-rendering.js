'use strict';

// tests/check-itar-s3-web-ui-rendering.js -- tests for itar-s3
// Story: artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s3-web-ui-rendering.md
// Test plan: artefacts/2026-11-08-incident-triage-and-respond/test-plans/itar-s3-web-ui-rendering-test-plan.md
//
// Wiring rule: every behavioural AC is driven through the REAL entry point
// (productsRoute.handleGetProductView, the handler server.js registers for
// GET /products/:id), with the REAL realFetchRepoPath adapter against a
// stubbed global.fetch returning the real GitHub Contents API payload shape
// ({content: <base64>}), not a hand-shaped mock of the adapter's output.

var fs = require('fs');
var os = require('os');
var path = require('path');

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

function freshRequire(p) { delete require.cache[require.resolve(p)]; return require(p); }

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
    id: 'inc-1', type: 'incident', trigger: 'Trigger one', summary: 'Summary one', tags: ['auth'],
    priorIncidentLinks: [], status: 'open', triageSummary: null, confirmationStatus: null,
    createdAt: '2026-11-12T00:00:00.000Z', updatedAt: '2026-11-12T00:00:00.000Z'
  }, over || {});
}

// Stub global.fetch so the REAL realFetchRepoPath runs and decodes a real
// GitHub Contents API response shape. `routes` maps a repo path to a string
// body, 'NOT_FOUND', or 'THROW'.
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

async function renderPage(routes, session) {
  stubGithub(routes);
  var route = freshRequire(PRODUCTS_ROUTE_PATH);
  var fetcher = require(FETCHER_PATH);
  fetcher.setFetchRepoPath(fetcher.realFetchRepoPath);
  require(MODULES_ADAPTER_PATH).setModulesAdapter({ query: async function() { return { rows: [] }; } });
  var res = makeRes();
  var req = { params: { id: 'p1' }, session: Object.assign({ tenantId: 't1', login: 'u', accessToken: 'tok-123' }, session || {}) };
  await route.handleGetProductView(req, res, null, makePool('acme', 'repo'));
  return res.html();
}

(async function() {
  var route = freshRequire(PRODUCTS_ROUTE_PATH);

  // ---------------- Unit ----------------
  await test('renderIncidentItem_showsStatusAsTextLabel_notColorAlone (AC1, MC-A11Y-02)', function() {
    var html = route._renderIncidentItem(incident({ status: 'open' }));
    assertTrue(/>\s*Status: open\s*</.test(html), 'expected visible text "Status: open", got: ' + html);
  });

  await test('renderIncidentItem_showsTriageSummaryInline_whenPresent (AC2)', function() {
    var html = route._renderIncidentItem(incident({ triageSummary: 'Known: X. Suggested next step: Y.' }));
    assertTrue(html.indexOf('Known: X. Suggested next step: Y.') !== -1, 'summary text missing');
    assertTrue(html.indexOf('<a ') === -1, 'no link/click-through expected in the item');
  });

  await test('renderIncidentItem_omitsTriageSummaryBlock_whenAbsent (AC1)', function() {
    var html = route._renderIncidentItem(incident({ triageSummary: null }));
    assertTrue(html.indexOf('inc-1') !== -1 && html.indexOf('Status: open') !== -1, 'id/status must still render');
    assertTrue(html.indexOf('undefined') === -1 && html.indexOf('null') === -1, 'no literal undefined/null');
    assertTrue(html.indexOf('data-incident-triage') === -1, 'no triage block expected');
    var html2 = route._renderIncidentItem(incident({ triageSummary: undefined, tags: undefined }));
    assertTrue(html2.indexOf('undefined') === -1, 'missing fields must not print undefined');
  });

  await test('NFR-SEC-1 renderIncidentItem_escapesAllRecordText (MC-SEC-01)', function() {
    var bad = '<script>alert(1)</script>';
    var html = route._renderIncidentItem(incident({ trigger: bad, summary: bad, triageSummary: bad, tags: [bad], status: bad, id: bad }));
    assertTrue(html.indexOf('<script>') === -1, 'raw <script> leaked');
    assertTrue(html.indexOf('&lt;script&gt;alert(1)&lt;/script&gt;') !== -1, 'escaped form missing');
  });

  await test('selectIncidentRecords_filtersToIncidentType_untypedCountsAsIncident', function() {
    var raw = JSON.stringify([incident({ id: 'a' }), incident({ id: 'b', type: 'deferred-item' }), (function() { var r = incident({ id: 'c' }); delete r.type; return r; })()]);
    var out = route._parseIncidentRecords(raw);
    assertTrue(out.length === 2 && out[0].id !== 'b' && out[1].id !== 'b', 'expected a and c only, got ' + JSON.stringify(out.map(function(r) { return r.id; })));
    assertTrue(route._parseIncidentRecords('not json').length === 0, 'bad JSON -> []');
    assertTrue(route._parseIncidentRecords('{"a":1}').length === 0, 'non-array -> []');
    assertTrue(route._parseIncidentRecords(null).length === 0, 'null -> []');
    assertTrue(route._parseIncidentRecords('').length === 0, 'empty -> []');
  });

  // ---------------- Integration through the real handler ----------------
  await test('handleGetProductView_rendersEachRecordAsDistinctItem_whenIncidentsJsonPresent (AC1)', async function() {
    var recs = [
      incident({ id: 'inc-A', status: 'open', trigger: 'Alpha trigger', triageSummary: 'Alpha triage text' }),
      incident({ id: 'inc-B', status: 'triaged', trigger: 'Beta trigger', createdAt: '2026-11-11T00:00:00.000Z' })
    ];
    var html = await renderPage({ 'workspace/incidents.json': JSON.stringify(recs) });
    var items = html.match(/data-incident-item/g) || [];
    assertTrue(items.length === 2, 'expected 2 incident items, got ' + items.length);
    assertTrue(html.indexOf('Alpha trigger') !== -1 && html.indexOf('Beta trigger') !== -1, 'triggers missing');
    assertTrue(html.indexOf('Status: open') !== -1 && html.indexOf('Status: triaged') !== -1, 'each record shows its own status');
    assertTrue(html.indexOf('Alpha triage text') !== -1, 'triage summary missing');
    var call = fetchCalls.find(function(c) { return /workspace\/incidents\.json$/.test(c.url); });
    assertTrue(!!call, 'incidents.json was never fetched');
    assertTrue(call.url.indexOf('/repos/acme/repo/contents/workspace/incidents.json') !== -1, 'fetch scoped to the product repo: ' + call.url);
    assertTrue(call.auth === 'Bearer tok-123', 'fetch must use req.session.accessToken');
  });

  await test('handleGetProductView_rendersZeroIncidentItems_whenIncidentsJsonFileNotFound (AC3)', async function() {
    var html = await renderPage({});
    assertTrue(typeof html === 'string' && html.indexOf('No features yet') !== -1, 'page must render normally');
    assertTrue(html.indexOf('data-incident-item') === -1, 'no incident items');
    assertTrue(!/error/i.test((html.match(/data-incident[^>]*>/g) || []).join('')), 'no error marker');
  });

  await test('handleGetProductView_degradesSilently_onFetchFailureEmptyOrNull (AC3, 3-path)', async function() {
    var failing = await renderPage({ 'workspace/incidents.json': 'THROW' });
    assertTrue(failing.indexOf('No features yet') !== -1 && failing.indexOf('data-incident-item') === -1, 'throw path');
    var empty = await renderPage({ 'workspace/incidents.json': '' });
    assertTrue(empty.indexOf('No features yet') !== -1 && empty.indexOf('data-incident-item') === -1, 'empty-string path');
    var bad = await renderPage({ 'workspace/incidents.json': '{{{' });
    assertTrue(bad.indexOf('No features yet') !== -1 && bad.indexOf('data-incident-item') === -1, 'invalid JSON path');
    // null path: adapter wired to resolve null
    var fetcher = require(FETCHER_PATH);
    fetcher.setFetchRepoPath(async function() { return null; });
    var res = makeRes();
    await route.handleGetProductView({ params: { id: 'p1' }, session: { tenantId: 't1', login: 'u', accessToken: 't' } }, res, null, makePool('acme', 'repo'));
    assertTrue(res.html().indexOf('data-incident-item') === -1 && res.html().indexOf('No features yet') !== -1, 'null path');
  });

  await test('handleGetProductView_noFetchAttempted_whenNoRepoOrNoToken', async function() {
    stubGithub({});
    var fetcher = require(FETCHER_PATH);
    fetcher.setFetchRepoPath(fetcher.realFetchRepoPath);
    var res = makeRes();
    await route.handleGetProductView({ params: { id: 'p1' }, session: { tenantId: 't1', login: 'u' } }, res, null, makePool('acme', 'repo'));
    assertTrue(res.html().indexOf('No features yet') !== -1, 'renders without token');
    assertTrue(fetchCalls.length === 0, 'no GitHub call without a token');
    var res2 = makeRes();
    await route.handleGetProductView({ params: { id: 'p1' }, session: { tenantId: 't1', login: 'u', accessToken: 't' } }, res2, null, makePool(null, null));
    assertTrue(fetchCalls.length === 0, 'no GitHub call without a connected repo');
  });

  await test('handleGetProductView_mixedTypeFile_showsOnlyIncidents_andEmptyIncidentCaseIsNotAnError (real workspace/incidents.json shape)', async function() {
    // The REAL committed file: 2 deferred-item records, 0 incidents.
    var real = fs.readFileSync(path.join(ROOT, 'workspace/incidents.json'), 'utf8');
    var types = JSON.parse(real).map(function(r) { return r.type; });
    assertTrue(types.every(function(t) { return t === 'deferred-item'; }), 'fixture assumption: real file holds only deferred-items');
    var html = await renderPage({ 'workspace/incidents.json': real });
    assertTrue(html.indexOf('data-incident-item') === -1, 'deferred-items must not render as incidents');
    assertTrue(html.indexOf('tfhc-s1') === -1, 'deferred-item text must not appear');
    // mixed: one real incident among the deferred-items
    var mixed = JSON.parse(real).concat([incident({ id: 'inc-real', trigger: 'Mixed-file incident' })]);
    var html2 = await renderPage({ 'workspace/incidents.json': JSON.stringify(mixed) });
    assertTrue((html2.match(/data-incident-item/g) || []).length === 1 && html2.indexOf('Mixed-file incident') !== -1, 'exactly the one incident renders');
    assertTrue(html2.indexOf('tfhc-s1') === -1, 'deferred items stay hidden in mixed file');
  });

  await test('handleGetProductView_rendersMigratedRealRecord_endToEnd_withRealTriageSummary (AC4)', async function() {
    // Build the record through the REAL mechanism chain: createIncidentRecord (itar-s1)
    // -> draftTriageSummary (itar-s2) -> serialized file -> real handler.
    var store = require(path.join(ROOT, 'scripts/lib/incident-store.js'));
    var drafter = require(path.join(ROOT, 'src/modules/triage-drafter.js'));
    var tmp = path.join(os.tmpdir(), 'itar-s3-' + Math.random().toString(36).slice(2) + '.json');
    var prior = store.createIncidentRecord({ trigger: 'earlier bootstrap failure', summary: 's', tags: ['auth', 'tenant-bootstrap'] });
    var real = store.createIncidentRecord({
      trigger: "[auth] tenant_admin_bootstrap_failed -- reason: 'inconsistent types deduced for parameter $1' for tenantId heymishy",
      summary: 'productionErrorInvestigation finding', tags: ['auth', 'tenant-bootstrap', 'tenant_admin_bootstrap_failed']
    });
    fs.writeFileSync(tmp, JSON.stringify([prior, real], null, 2));
    var drafted = drafter.draftTriageSummary(real.id, tmp);
    var fileText = fs.readFileSync(tmp, 'utf8');
    fs.unlinkSync(tmp);
    assertTrue(drafted.status === 'matched', 'precondition: triage drafted (matched), got ' + drafted.status);
    var html = await renderPage({ 'workspace/incidents.json': fileText });
    assertTrue(html.indexOf('data-incident-item') !== -1, 'incident rendered');
    assertTrue(html.indexOf('tenant_admin_bootstrap_failed') !== -1, 'real trigger visible');
    assertTrue(html.indexOf('Status: open') !== -1, 'status visible');
    assertTrue(html.indexOf('Suggested next step') !== -1, 'real drafted triage summary visible inline');
  });

  await test('handleGetProductView_boundsIncidentFetchLatency_whenGithubHangs (NFR)', async function() {
    var fetcher = require(FETCHER_PATH);
    fetcher.setFetchRepoPath(function() { return new Promise(function() {}); }); // never resolves
    var res = makeRes();
    var t0 = Date.now();
    await route.handleGetProductView({ params: { id: 'p1' }, session: { tenantId: 't1', login: 'u', accessToken: 't' } }, res, null, makePool('acme', 'repo'));
    var dt = Date.now() - t0;
    assertTrue(res.html().indexOf('No features yet') !== -1, 'page still renders');
    assertTrue(dt < 6000, 'hung fetch must be bounded, took ' + dt + 'ms');
  });

  await test('handleGetProductView_rendersBothReactiveDecisionsAndIncidents_whenBothSourcesPresent (urpv-s3 + itar-s3 coexist)', async function() {
    var decisionsMd = [
      '# Decisions', '', '---', '',
      '**2026-11-08 | RISK-ACCEPT | discovery**', '**Decision:** Accept the coexistence-marker risk.', '', '---', ''
    ].join('\n');
    stubGithub({
      'artefacts/feat-a/decisions.md': decisionsMd,
      'workspace/incidents.json': JSON.stringify([incident({ id: 'inc-co', trigger: 'Coexistence incident trigger' })])
    });
    var r = freshRequire(PRODUCTS_ROUTE_PATH);
    var fetcher = require(FETCHER_PATH);
    fetcher.setFetchRepoPath(fetcher.realFetchRepoPath);
    require(MODULES_ADAPTER_PATH).setModulesAdapter({ query: async function() { return { rows: [] }; } });
    var pool = {
      query: async function(sql) {
        if (/SELECT name, tenant_id, repo_owner, repo_name FROM products/.test(sql)) {
          return { rows: [{ name: 'Acme', tenant_id: 't1', repo_owner: 'acme', repo_name: 'repo' }] };
        }
        if (/FROM journeys/.test(sql)) {
          return { rows: [{ journey_id: 'j1', feature_slug: 'feat-a', stage: 'discovery', display_name: null }] };
        }
        return { rows: [] };
      }
    };
    var res = makeRes();
    await r.handleGetProductView({ params: { id: 'p1' }, session: { tenantId: 't1', login: 'u', accessToken: 'tok-123' } }, res, null, pool);
    var html = res.html();
    assertTrue(html.indexOf('Accept the coexistence-marker risk.') !== -1 && html.indexOf('urpv-decisions-reactive') !== -1, 'reactive decision (urpv-s3) must render');
    assertTrue(html.indexOf('Coexistence incident trigger') !== -1 && html.indexOf('data-incident-item') !== -1, 'incident (itar-s3) must render');
  });

  // ---------------- Wiring proof ----------------
  await test('server.js_registersProductViewRoute_andWiresRealFetchRepoPath (wiring)', function() {
    var src = fs.readFileSync(path.join(ROOT, 'src/web-ui/server.js'), 'utf8');
    assertTrue(/setFetchRepoPath\(realFetchRepoPath\)/.test(src), 'real fetchRepoPath wired in server.js');
    assertTrue(/handleGetProductView\(req, res, null, _pshPool\)/.test(src), 'handleGetProductView registered');
    var idx = src.indexOf('handleGetProductView(req, res, null, _pshPool)');
    var before = src.slice(Math.max(0, idx - 400), idx);
    assertTrue(/\/products\/|productViewMatch|pathname/.test(before), 'registered under a products route');
    var rsrc = fs.readFileSync(PRODUCTS_ROUTE_PATH, 'utf8');
    assertTrue(/req\.session\.accessToken/.test(rsrc) && !/req\.session\.token[^A]/.test(rsrc), 'accessToken canonical name');
  });

  global.fetch = realFetch;
  console.log('\n[itar-s3] ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed === 0 ? 0 : 1);
})();
