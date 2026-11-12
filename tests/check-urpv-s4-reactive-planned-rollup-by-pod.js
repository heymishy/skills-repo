'use strict';

// tests/check-urpv-s4-reactive-planned-rollup-by-pod.js -- urpv-s4
// Story: artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s4-reactive-planned-rollup-by-pod.md
// Test plan: artefacts/2026-11-08-unified-reactive-proactive-visibility/test-plans/urpv-s4-reactive-planned-rollup-by-pod-test-plan.md
//
// Unit tests exercise the pure rollup computation. Integration tests drive the
// REAL entry point -- handleGetProductView -- with a fake pool whose pod SQL
// answers follow the real pod-assignment-store.js queries (pod_assignments
// joined to pods; feature_id = journey_id), and the real artefact-fetcher seam
// mocked for decisions.md (urpv-s3's real data path).

const assert = require('assert');
const path = require('path');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }
async function test(name, fn) { try { await fn(); pass(name); } catch (e) { fail(name, e); } }

const ROOT = path.resolve(__dirname, '..');
const MODULE_PATH = path.join(ROOT, 'src/web-ui/modules/reactive-pod-rollup.js');
const PRODUCTS_ROUTE_PATH = path.join(ROOT, 'src/web-ui/routes/products.js');
const FETCHER_PATH = path.join(ROOT, 'src/web-ui/adapters/artefact-fetcher.js');
const MODULES_ADAPTER_PATH = path.join(ROOT, 'src/web-ui/adapters/modules-adapter.js');

function mkItems(n, track, prefix, extra) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(Object.assign({ slug: prefix + i, track: track }, extra || {}));
  return out;
}

const DECISIONS = [
  '**2026-11-08 | RISK-ACCEPT | discovery**', '**Decision:** First accepted risk.', '', '---', '',
  '**2026-11-09 | SCOPE | definition**', '**Decision:** A scope change.', '', '---', '',
  '**2026-11-10 | ARCH | definition**', '**Decision:** Not reactive.', '', '---', ''
].join('\n');

(async function() {
  const mod = require(MODULE_PATH);
  const fetcher = require(FETCHER_PATH);
  const originalFetch = fetcher.getFetchRepoPath();
  const ctxNone = { defaultPod: null, podsByJourneyId: {}, lookupFailed: false };

  // ---------------- Unit: AC1 ----------------
  await test('AC1: track:short and decisions.md items count as reactive, everything else planned', () => {
    const items = [].concat(mkItems(3, 'short', 's'), mkItems(5, 'standard', 'p'));
    const decisions = [{ featureSlug: 's0', code: 'RISK-ACCEPT' }, { featureSlug: 'p0', code: 'SCOPE' }];
    const r = mod.computePodRollup(items, decisions, ctxNone);
    assert.strictEqual(r.totals.reactiveCount, 5);
    assert.strictEqual(r.totals.plannedCount, 5);
  });

  await test('AC1: pod resolves explicit assignment, then product default pod, then Unassigned', () => {
    const items = [
      { slug: 'a', track: 'standard', journeyId: 'jA' },
      { slug: 'b', track: 'standard', journeyId: 'jB' },
      { slug: 'c', track: 'standard' }
    ];
    // Item C has no journey and no default would make it Unassigned; give B and C a default first.
    const withDefault = mod.computePodRollup(items, [], {
      defaultPod: { podId: 'beta-id', podName: 'beta' },
      podsByJourneyId: { jA: [{ podId: 'alpha-id', podName: 'alpha' }], jB: [] },
      lookupFailed: false
    });
    const byName = {}; withDefault.rows.forEach(r => { byName[r.podName] = r; });
    assert.strictEqual(byName.alpha.plannedCount, 1);
    assert.strictEqual(byName.beta.plannedCount, 2); // B (no row) and C (no journey) fall to the default
    const noDefault = mod.computePodRollup(items, [], {
      defaultPod: null, podsByJourneyId: { jA: [{ podId: 'alpha-id', podName: 'alpha' }], jB: [] }, lookupFailed: false
    });
    const names = noDefault.rows.map(r => r.podName);
    assert.deepStrictEqual(names, ['alpha', 'Unassigned']);
    assert.strictEqual(noDefault.rows[1].plannedCount, 2);
  });

  await test('AC1: a decisions.md item takes the pod of its feature (via the feature item\'s journey)', () => {
    const items = [{ slug: 'f1', track: 'standard', journeyId: 'j1' }];
    const r = mod.computePodRollup(items, [{ featureSlug: 'f1', code: 'RISK-ACCEPT' }], {
      defaultPod: null, podsByJourneyId: { j1: [{ podId: 'alpha-id', podName: 'alpha' }] }, lookupFailed: false
    });
    assert.strictEqual(r.rows.length, 1);
    assert.strictEqual(r.rows[0].podName, 'alpha');
    assert.strictEqual(r.rows[0].reactiveCount, 1);
    assert.strictEqual(r.rows[0].plannedCount, 1);
  });

  await test('AC1: completed (definition-of-done) feature items are not counted (active items only)', () => {
    const items = [{ slug: 'a', track: 'short', stage: 'definition-of-done' }, { slug: 'b', track: 'short', stage: 'discovery' }];
    const r = mod.computePodRollup(items, [], ctxNone);
    assert.strictEqual(r.totals.reactiveCount, 1);
  });

  await test('AC1: a feature assigned to two pods is counted under each pod, totals count it once', () => {
    const items = [{ slug: 'a', track: 'short', journeyId: 'j1' }];
    const r = mod.computePodRollup(items, [], {
      defaultPod: null,
      podsByJourneyId: { j1: [{ podId: 'p1', podName: 'alpha' }, { podId: 'p2', podName: 'gamma' }] },
      lookupFailed: false
    });
    assert.strictEqual(r.rows.length, 2);
    r.rows.forEach(row => assert.strictEqual(row.reactiveCount, 1));
    assert.strictEqual(r.totals.reactiveCount, 1);
  });

  // ---------------- Unit: AC2 ----------------
  await test('AC2: pod row has separate reactiveCount and plannedCount fields (3 / 12), not a blended 15', () => {
    const items = [].concat(mkItems(3, 'short', 's', { journeyId: 'j1' }), mkItems(12, 'standard', 'p', { journeyId: 'j1' }));
    const r = mod.computePodRollup(items, [], {
      defaultPod: null, podsByJourneyId: { j1: [{ podId: 'a', podName: 'alpha' }] }, lookupFailed: false
    });
    assert.strictEqual(r.rows.length, 1);
    assert.strictEqual(r.rows[0].reactiveCount, 3);
    assert.strictEqual(r.rows[0].plannedCount, 12);
    assert.strictEqual(r.rows[0].total, undefined);
  });

  // ---------------- Unit: AC3 ----------------
  await test('AC3: zero pods configured -> exactly one Unassigned row carrying the full split', () => {
    const items = [].concat(mkItems(2, 'short', 's'), mkItems(4, 'standard', 'p'));
    const r = mod.computePodRollup(items, [{ featureSlug: 's0' }], ctxNone);
    assert.strictEqual(r.rows.length, 1);
    assert.strictEqual(r.rows[0].podName, 'Unassigned');
    assert.strictEqual(r.rows[0].reactiveCount, 3);
    assert.strictEqual(r.rows[0].plannedCount, 4);
  });

  await test('AC3 edge: no items at all -> a single Unassigned row of 0 / 0 (a real zero, not blank)', () => {
    const r = mod.computePodRollup([], [], ctxNone);
    assert.strictEqual(r.rows.length, 1);
    assert.strictEqual(r.rows[0].reactiveCount, 0);
    assert.strictEqual(r.rows[0].plannedCount, 0);
  });

  // ---------------- Integration via the REAL entry point ----------------
  delete require.cache[require.resolve(PRODUCTS_ROUTE_PATH)];
  const productsRoute = require(PRODUCTS_ROUTE_PATH);
  require(MODULES_ADAPTER_PATH).setModulesAdapter({ query: async function() { return { rows: [] }; } });

  // spec: { taxonomyUngrouped: [{slug, track, ...}], journeys: {slug: journeyId}, explicit: {journeyId: [{pod_id,name}]}, defaultPod: {pod_id,name}|null, podQueryError }
  function makePool(spec) {
    const calls = { featurePod: [], defaultPod: [] };
    const pool = {
      calls,
      query: async function(sql, params) {
        if (/SELECT name, tenant_id, repo_owner, repo_name FROM products/.test(sql)) {
          return { rows: [{ name: 'Acme', tenant_id: 't1', repo_owner: 'acme', repo_name: 'repo' }] };
        }
        if (/FROM product_rollups/.test(sql)) {
          return { rows: [{ dod_status_counts: {}, health_counts: null, test_coverage: null, ac_coverage: null, taxonomy: { groups: [], ungrouped: spec.taxonomyUngrouped, totalCount: spec.taxonomyUngrouped.length }, synced_at: new Date() }] };
        }
        if (/FROM journeys/.test(sql)) {
          return { rows: Object.keys(spec.journeys || {}).map(s => ({ journey_id: spec.journeys[s], feature_slug: s, stage: 'discovery', display_name: null })) };
        }
        if (/FROM pod_assignments pa JOIN pods p/.test(sql) && /pa\.feature_id = \$2/.test(sql)) {
          calls.featurePod.push(params);
          if (spec.podQueryError) { throw new Error('db down'); }
          return { rows: ((spec.explicit || {})[params[1]] || []).map(p => ({ pod_id: p.pod_id, assignment_type: 'explicit-multi-assign', name: p.name })) };
        }
        if (/FROM pod_assignments pa JOIN pods p/.test(sql) && /feature_id IS NULL/.test(sql)) {
          calls.defaultPod.push(params);
          return { rows: spec.defaultPod ? [{ pod_id: spec.defaultPod.pod_id, name: spec.defaultPod.name }] : [] };
        }
        if (/FROM pod_members/.test(sql)) { return { rows: [{ count: '2' }] }; }
        return { rows: [] };
      }
    };
    return pool;
  }
  function makeRes() {
    let html = null; let status = null;
    return { html: () => html, status: () => status, writeHead: (s) => { status = s; }, end: (b) => { html = b; } };
  }
  async function renderProduct(pool) {
    const res = makeRes();
    await productsRoute.handleGetProductView({ params: { id: 'p1' }, session: { tenantId: 't1', accessToken: 'tok' } }, res, null, pool);
    return res;
  }
  function rowFor(html, podName) {
    const re = new RegExp('<tr[^>]*data-pod-row="' + podName + '"[^>]*>([\\s\\S]*?)</tr>');
    const m = re.exec(html);
    return m ? m[1] : null;
  }
  function textOf(fragment) { return fragment.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
  function noDecisionsFetch() { fetcher.setFetchRepoPath(async (o, r, p) => { throw new fetcher.ArtefactNotFoundError(o + '/' + r, p); }); }

  const alphaPod = { pod_id: 'pod-alpha', name: 'alpha' };
  const betaPod = { pod_id: 'pod-beta', name: 'beta' };

  await test('AC1/AC2 (real route): reactive+planned counted per pod via real pod SQL; explicit pod, product default, and Unassigned fallback', async () => {
    // fa: short, explicit alpha. fb: standard, no row -> default beta. fc: taxonomy-only short (no journey) -> default beta.
    fetcher.setFetchRepoPath(async (o, r, p) => { if (p === 'artefacts/fa/decisions.md') { return DECISIONS; } throw new fetcher.ArtefactNotFoundError(o + '/' + r, p); });
    const pool = makePool({
      taxonomyUngrouped: require(path.join(ROOT, 'src/web-ui/modules/product-rollup.js')).computeTaxonomyRollup({ features: [{ slug: 'fa', name: 'A', track: 'short' }, { slug: 'fb', name: 'B', track: 'standard' }, { slug: 'fc', name: 'C', track: 'short' }] }).ungrouped, // real urpv-s2 producer shape
      journeys: { fa: 'jA', fb: 'jB' },
      explicit: { jA: [alphaPod] },
      defaultPod: betaPod
    });
    const res = await renderProduct(pool);
    assert.strictEqual(res.status(), 200);
    const html = res.html();
    const alpha = textOf(rowFor(html, 'alpha') || '');
    const beta = textOf(rowFor(html, 'beta') || '');
    // alpha: fa (short) + its 2 decisions.md items (RISK-ACCEPT, SCOPE; ARCH excluded) = 3 reactive, 0 planned
    assert(/3 reactive \/ 0 planned/.test(alpha), 'alpha row was: ' + alpha);
    // beta: fb planned, fc short reactive
    assert(/1 reactive \/ 1 planned/.test(beta), 'beta row was: ' + beta);
    assert.strictEqual(rowFor(html, 'Unassigned'), null, 'no Unassigned row when every item resolves to a pod');
  });

  await test('AC3 (real route): no pods configured at all -> single Unassigned row with the full split', async () => {
    noDecisionsFetch();
    const pool = makePool({
      taxonomyUngrouped: [{ slug: 'fa', track: 'short' }, { slug: 'fb', track: 'standard' }, { slug: 'fc', track: 'standard' }],
      journeys: { fa: 'jA', fb: 'jB' }, explicit: {}, defaultPod: null
    });
    const html = (await renderProduct(pool)).html();
    assert.strictEqual((html.match(/data-pod-row="/g) || []).length, 1);
    assert(/1 reactive \/ 2 planned/.test(textOf(rowFor(html, 'Unassigned') || '')));
  });

  await test('AC4 (real route): the rollup is an additional tab in the same response -- no separate route or page', async () => {
    noDecisionsFetch();
    const pool = makePool({ taxonomyUngrouped: [{ slug: 'fa', track: 'short' }], journeys: { fa: 'jA' }, explicit: { jA: [alphaPod] }, defaultPod: betaPod });
    const html = (await renderProduct(pool)).html();
    assert(/id="pvc-tab-pod"[^>]*role="tab"[^>]*onclick="pvcShowTab\('pod'\)"/.test(html), 'tab button missing');
    assert(/id="pvc-tab-panel-pod"[^>]*role="tabpanel"/.test(html), 'tab panel missing');
    const panel = /<div id="pvc-tab-panel-pod"[\s\S]*?<\/table>[\s\S]*?<\/div>/.exec(html);
    assert(panel, 'panel markup not found');
    assert(!/<a [^>]*href=/.test(panel[0]), 'the rollup must not link away to another page');
  });

  await test('real route: pod queries stay tenant-scoped, one per journey, and the product default is read exactly once', async () => {
    noDecisionsFetch();
    const pool = makePool({
      taxonomyUngrouped: [{ slug: 'fa', track: 'short' }, { slug: 'fb', track: 'standard' }, { slug: 'fc', track: 'standard' }],
      journeys: { fa: 'jA', fb: 'jB' }, explicit: {}, defaultPod: betaPod
    });
    await renderProduct(pool);
    assert.strictEqual(pool.calls.defaultPod.length, 1, 'getProductDefaultPod must not be called again for the rollup');
    assert.strictEqual(pool.calls.featurePod.length, 2, 'one getFeaturePodAssignments per journey, none for the taxonomy-only item');
    pool.calls.featurePod.forEach(p => assert.strictEqual(p[0], 't1'));
    assert.deepStrictEqual(pool.calls.featurePod.map(p => p[1]).sort(), ['jA', 'jB']);
  });

  await test('real route: a failed pod lookup still renders the page and says attribution is unavailable', async () => {
    noDecisionsFetch();
    const origErr = console.error; console.error = () => {};
    let res;
    try {
      res = await renderProduct(makePool({ taxonomyUngrouped: [{ slug: 'fa', track: 'short' }], journeys: { fa: 'jA' }, podQueryError: true, defaultPod: null }));
    } finally { console.error = origErr; }
    assert.strictEqual(res.status(), 200);
    assert(/could not be read/.test(res.html()), 'expected an honest unavailable note');
  });

  // ---------------- NFR ----------------
  await test('NFR accessibility: both counts are visible text (including a real "0") on every row, incl. Unassigned', async () => {
    noDecisionsFetch();
    const html = (await renderProduct(makePool({ taxonomyUngrouped: [{ slug: 'fa', track: 'standard' }], journeys: {}, defaultPod: null }))).html();
    const t = textOf(rowFor(html, 'Unassigned') || '');
    assert(/0 reactive \/ 1 planned/.test(t), 'row text was: ' + t);
  });

  await test('NFR security: a pod name containing markup is escaped', async () => {
    noDecisionsFetch();
    const evil = { pod_id: 'pod-x', name: '<script>alert(1)</script>' };
    const html = (await renderProduct(makePool({ taxonomyUngrouped: [{ slug: 'fa', track: 'short' }], journeys: { fa: 'jA' }, explicit: { jA: [evil] }, defaultPod: null }))).html();
    assert(!html.includes('<script>alert(1)</script>'));
    assert(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  });

  await test('NFR design tokens: the new module contains no hardcoded hex colour', () => {
    const src = require('fs').readFileSync(MODULE_PATH, 'utf8');
    assert(!/#[0-9a-fA-F]{3,8}\b/.test(src), 'hex colour found in module');
  });

  await test('no regression: rendering the section without a pod context adds no pod tab', () => {
    const html = productsRoute._renderConsolidatedFeaturesSection([{ slug: 'a', track: 'short' }], [], null, 'p1', 'csrf', null, {}, [], []);
    assert(!html.includes('pvc-tab-pod'));
    assert(html.includes('pvc-tab-all'));
  });

  fetcher.setFetchRepoPath(originalFetch);
  console.log(`\n[urpv-s4] Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
