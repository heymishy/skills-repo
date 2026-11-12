'use strict';

// tests/check-urpv-s3-decisions-md-as-reactive-source.js -- urpv-s3
// Story: artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s3-decisions-md-as-reactive-source.md
// Test plan: artefacts/2026-11-08-unified-reactive-proactive-visibility/test-plans/urpv-s3-decisions-md-as-reactive-source-test-plan.md
//
// Unit tests exercise the parser / fetch-and-parse functions. Integration
// tests drive the REAL entry point -- handleGetProductView -- with the real
// artefact-fetcher adapter's setFetchRepoPath seam mocked. The mock matches
// realFetchRepoPath's actual contract (artefact-fetcher.js): resolves to a
// decoded UTF-8 string for a file, rejects with ArtefactNotFoundError on 404,
// called positionally as (owner, repo, path, token).

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }
async function test(name, fn) { try { await fn(); pass(name); } catch (e) { fail(name, e); } }

const ROOT = path.resolve(__dirname, '..');
const SRC_PATH = path.join(ROOT, 'src/web-ui/modules/decisions-reactive-source.js');
const PRODUCTS_ROUTE_PATH = path.join(ROOT, 'src/web-ui/routes/products.js');
const FETCHER_PATH = path.join(ROOT, 'src/web-ui/adapters/artefact-fetcher.js');
const MODULES_ADAPTER_PATH = path.join(ROOT, 'src/web-ui/adapters/modules-adapter.js');

const WELL_FORMED = [
  '# Decisions: sample', '', '---', '',
  '**2026-11-08 | RISK-ACCEPT | discovery (/clarify)**',
  '**Decision:** Accept the CI runner pin deviation.',
  '**Rationale:** Cheap.', '', '---', '',
  '**2026-11-09 | SCOPE | definition**',
  '**Rationale:** Field order varies here.',
  '**Decision:** Add sync-on-connect.', '', '---', ''
].join('\n');

const MIXED = WELL_FORMED + [
  '**2026-11-10 | ARCH | definition**', '**Decision:** Use adapter X.', '', '---', '',
  '**2026-11-10 | ASSUMPTION | discovery**', '**Decision:** Users are online.', '', '---', '',
  '**2026-11-10 | SLICE | definition**', '**Decision:** Slice by persona.', '', '---', ''
].join('\n');

const MALFORMED = [
  '**2026-11-08 | RISK-ACCEPT | discovery**', '**Decision:** First good entry.', '', '---', '',
  '**Decision:** Orphan entry with no header line at all.', '**Rationale:** broken.', '', '---', '',
  '**2026-11-09 | SCOPE | definition**', '**Decision:** Third good entry.', '', '---', ''
].join('\n');

function logCapture() { const calls = []; const fn = (m) => calls.push(m); fn.calls = calls; return fn; }

(async function() {
  const src = require(SRC_PATH);
  const fetcher = require(FETCHER_PATH);
  const originalFetch = fetcher.getFetchRepoPath();

  // ---------------- Unit: AC1 ----------------
  await test('AC1: parses a well-formed RISK-ACCEPT entry (date, code, title)', () => {
    const items = src.parseReactiveDecisions(WELL_FORMED, { featureSlug: 'f1', log: logCapture() });
    const ra = items.find(i => i.code === 'RISK-ACCEPT');
    assert(ra, 'no RISK-ACCEPT item');
    assert.strictEqual(ra.date, '2026-11-08');
    assert.strictEqual(ra.title, 'Accept the CI runner pin deviation.');
    assert.strictEqual(ra.featureSlug, 'f1');
  });

  await test('AC1: parses a well-formed SCOPE entry even when Decision follows Rationale', () => {
    const items = src.parseReactiveDecisions(WELL_FORMED, { featureSlug: 'f1', log: logCapture() });
    const sc = items.find(i => i.code === 'SCOPE');
    assert(sc, 'no SCOPE item');
    assert.strictEqual(sc.date, '2026-11-09');
    assert.strictEqual(sc.title, 'Add sync-on-connect.');
  });

  await test('AC1: parses this feature\'s own REAL decisions.md (real-format fixture)', () => {
    const real = fs.readFileSync(path.join(ROOT, 'artefacts/2026-11-08-unified-reactive-proactive-visibility/decisions.md'), 'utf8');
    const items = src.parseReactiveDecisions(real, { featureSlug: 'real', log: logCapture() });
    assert(items.length >= 3, 'expected several real RISK-ACCEPT/SCOPE items, got ' + items.length);
    items.forEach(i => { assert(i.code === 'RISK-ACCEPT' || i.code === 'SCOPE'); assert(/^\d{4}-\d{2}-\d{2}$/.test(i.date)); assert(i.title.length > 0); });
  });

  // ---------------- Unit: AC2 ----------------
  await test('AC2: excludes ARCH / ASSUMPTION / SLICE entries', () => {
    const items = src.parseReactiveDecisions(MIXED, { featureSlug: 'f1', log: logCapture() });
    assert.strictEqual(items.length, 2);
    items.forEach(i => assert(i.code === 'RISK-ACCEPT' || i.code === 'SCOPE'));
  });

  // ---------------- Unit: AC3 ----------------
  await test('AC3: skips the malformed entry, keeps the rest, logs server-side once, never throws', () => {
    const log = logCapture();
    let items;
    assert.doesNotThrow(() => { items = src.parseReactiveDecisions(MALFORMED, { featureSlug: 'f1', log }); });
    assert.strictEqual(items.length, 2);
    assert.deepStrictEqual(items.map(i => i.title), ['First good entry.', 'Third good entry.']);
    assert.strictEqual(log.calls.length, 1, 'expected exactly one log call, got ' + log.calls.length);
  });

  // ---------------- Unit: AC4 ----------------
  await test('AC4: fetch rejecting with a 404 resolves to [] without throwing or logging', async () => {
    fetcher.setFetchRepoPath(async () => { throw new fetcher.ArtefactNotFoundError('o/r', 'p'); });
    const log = logCapture();
    const items = await src.fetchReactiveDecisionsForFeature('o', 'r', 'f1', 'tok', { log });
    assert.deepStrictEqual(items, []);
    assert.strictEqual(log.calls.length, 0);
  });

  await test('AC4: any other fetch failure (incl. unwired adapter) resolves to [] and logs', async () => {
    fetcher.setFetchRepoPath(async () => { throw new Error('boom'); });
    const log = logCapture();
    assert.deepStrictEqual(await src.fetchReactiveDecisionsForFeature('o', 'r', 'f1', 'tok', { log }), []);
    assert.strictEqual(log.calls.length, 1);
    fetcher.setFetchRepoPath(function() { throw new Error('Adapter not wired: fetchRepoPath.'); });
    assert.deepStrictEqual(await src.fetchReactiveDecisionsForFeature('o', 'r', 'f1', 'tok', { log: logCapture() }), []);
  });

  await test('path safety: a slug containing traversal characters is never fetched', async () => {
    let called = false;
    fetcher.setFetchRepoPath(async () => { called = true; return WELL_FORMED; });
    for (const bad of ['../x', 'a/b', '..', 'a b', '']) {
      assert.deepStrictEqual(await src.fetchReactiveDecisionsForFeature('o', 'r', bad, 'tok', { log: logCapture() }), []);
    }
    assert.strictEqual(called, false);
  });

  // ---------------- NFR: tenant scoping (ADR-025) ----------------
  await test('NFR authorisation: fetchRepoPath receives this product\'s own owner/repo/accessToken and the literal decisions.md path', async () => {
    const calls = [];
    fetcher.setFetchRepoPath(async (o, r, p, t) => { calls.push([o, r, p, t]); return WELL_FORMED; });
    await src.fetchReactiveDecisionsForFeature('tenantA-org', 'prodA-repo', 'feat-x', 'tokenA', { log: logCapture() });
    assert.deepStrictEqual(calls, [['tenantA-org', 'prodA-repo', 'artefacts/feat-x/decisions.md', 'tokenA']]);
  });

  // ---------------- Integration via the REAL entry point ----------------
  delete require.cache[require.resolve(PRODUCTS_ROUTE_PATH)];
  const productsRoute = require(PRODUCTS_ROUTE_PATH);
  require(MODULES_ADAPTER_PATH).setModulesAdapter({ query: async function() { return { rows: [] }; } });

  function makePool(repoOwner, repoName, featureSlugs) {
    return {
      query: async function(sql) {
        if (/SELECT name, tenant_id, repo_owner, repo_name FROM products/.test(sql)) {
          return { rows: [{ name: 'Acme', tenant_id: 't1', repo_owner: repoOwner, repo_name: repoName }] };
        }
        if (/FROM product_rollups/.test(sql)) { return { rows: [] }; }
        if (/FROM journeys/.test(sql)) {
          return { rows: featureSlugs.map((s, i) => ({ journey_id: 'j' + i, feature_slug: s, stage: 'discovery', display_name: null })) };
        }
        return { rows: [] };
      }
    };
  }
  function makeRes() {
    let html = null; let status = null;
    return { html: () => html, status: () => status, writeHead: (s) => { status = s; }, end: (b) => { html = b; } };
  }
  async function renderProduct(pool, token) {
    const res = makeRes();
    await productsRoute.handleGetProductView({ params: { id: 'p1' }, session: { tenantId: 't1', accessToken: token } }, res, null, pool);
    return res;
  }

  await test('AC1 (real route): consolidated page shows decisions.md RISK-ACCEPT/SCOPE items with date, code, title; ARCH excluded', async () => {
    fetcher.setFetchRepoPath(async (o, r, p) => { if (p === 'artefacts/feat-a/decisions.md') { return MIXED; } throw new fetcher.ArtefactNotFoundError(o + '/' + r, p); });
    const res = await renderProduct(makePool('acme', 'repo', ['feat-a', 'feat-b']), 'tok');
    assert.strictEqual(res.status(), 200);
    const html = res.html();
    assert(html.includes('Accept the CI runner pin deviation.'));
    assert(html.includes('Add sync-on-connect.'));
    assert(html.includes('2026-11-08') && html.includes('RISK-ACCEPT') && html.includes('SCOPE'));
    assert(!html.includes('Use adapter X.'), 'ARCH entry must not render');
    assert.strictEqual((html.match(/data-urpv-source="decisions"/g) || []).length, 2);
  });

  await test('AC3 (real route): malformed entry silently dropped, 2 well-formed entries render, no error text', async () => {
    fetcher.setFetchRepoPath(async (o, r, p) => { if (p === 'artefacts/feat-a/decisions.md') { return MALFORMED; } throw new fetcher.ArtefactNotFoundError(o + '/' + r, p); });
    const origErr = console.error; console.error = () => {};
    let res;
    try { res = await renderProduct(makePool('acme', 'repo', ['feat-a']), 'tok'); } finally { console.error = origErr; }
    const html = res.html();
    assert.strictEqual((html.match(/data-urpv-source="decisions"/g) || []).length, 2);
    assert(html.includes('First good entry.') && html.includes('Third good entry.'));
    assert(!html.includes('Orphan entry'));
  });

  await test('AC4 (real route): 404 for every feature -> page renders 200 with zero decisions items and no error banner', async () => {
    fetcher.setFetchRepoPath(async (o, r, p) => { throw new fetcher.ArtefactNotFoundError(o + '/' + r, p); });
    const res = await renderProduct(makePool('acme', 'repo', ['feat-a', 'feat-b']), 'tok');
    assert.strictEqual(res.status(), 200);
    assert(!res.html().includes('data-urpv-source="decisions"'));
    assert(!res.html().includes('urpv-decisions-reactive'));
  });

  await test('AC4 (real route): non-404 fetch failure (and unwired adapter) still renders 200 with zero items', async () => {
    const origErr = console.error; console.error = () => {};
    try {
      fetcher.setFetchRepoPath(async () => { throw new Error('GitHub 502'); });
      const res = await renderProduct(makePool('acme', 'repo', ['feat-a']), 'tok');
      assert.strictEqual(res.status(), 200);
      assert(!res.html().includes('data-urpv-source="decisions"'));
    } finally { console.error = origErr; }
  });

  await test('NFR security (real route): script tag in a decisions.md title is rendered escaped, never executable', async () => {
    const evil = '**2026-11-08 | RISK-ACCEPT | x**\n**Decision:** <script>alert(1)</script> & "q"\n\n---\n';
    fetcher.setFetchRepoPath(async (o, r, p) => { if (p === 'artefacts/feat-a/decisions.md') { return evil; } throw new fetcher.ArtefactNotFoundError(o + '/' + r, p); });
    const html = (await renderProduct(makePool('acme', 'repo', ['feat-a']), 'tok')).html();
    assert(html.includes('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;q&quot;'));
    assert(!html.includes('<script>alert(1)</script>'));
  });

  await test('NFR authorisation (real route): the handler fetches with the product\'s own owner/repo and session accessToken, once per feature', async () => {
    const allCalls = [];
    fetcher.setFetchRepoPath(async (o, r, p, t) => { allCalls.push([o, r, p, t]); throw new fetcher.ArtefactNotFoundError(o + '/' + r, p); });
    await renderProduct(makePool('tenantA-org', 'prodA-repo', ['feat-a', 'feat-b']), 'tokenA');
    // itar-s3: the page now also fetches workspace/incidents.json through the same adapter;
    // this test is about the per-feature decisions.md fetches only.
    const calls = allCalls.filter(c => /decisions\.md$/.test(c[2]));
    assert.strictEqual(calls.length, 2);
    allCalls.forEach(c => { assert.strictEqual(c[0], 'tenantA-org'); assert.strictEqual(c[1], 'prodA-repo'); assert.strictEqual(c[3], 'tokenA'); });
    calls.forEach(c => { assert.strictEqual(c[0], 'tenantA-org'); assert.strictEqual(c[1], 'prodA-repo'); assert.strictEqual(c[3], 'tokenA'); });
    assert.deepStrictEqual(calls.map(c => c[2]).sort(), ['artefacts/feat-a/decisions.md', 'artefacts/feat-b/decisions.md']);
  });

  await test('no repo connected or no session token: no fetch is attempted and page renders', async () => {
    let called = 0;
    fetcher.setFetchRepoPath(async () => { called++; return WELL_FORMED; });
    const r1 = await renderProduct(makePool(null, null, ['feat-a']), 'tok');
    const r2 = await renderProduct(makePool('acme', 'repo', ['feat-a']), undefined);
    assert.strictEqual(r1.status(), 200); assert.strictEqual(r2.status(), 200);
    assert.strictEqual(called, 0);
  });

  fetcher.setFetchRepoPath(originalFetch);
  console.log(`\n[urpv-s3] Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
