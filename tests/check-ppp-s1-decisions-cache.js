'use strict';
// ppp-s1 -- cache per-feature decisions.md reads (stale-while-revalidate) and start the product page's
// independent reads together. Plain Node script. Run: node tests/check-ppp-s1-decisions-cache.js
// Story: artefacts/2026-11-15-product-page-performance/stories/ppp-s1-product-page-performance.md
// Test plan: artefacts/2026-11-15-product-page-performance/test-plans/ppp-s1-test-plan.md

process.env.NODE_ENV = 'test';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const fetcher = require('../src/web-ui/adapters/artefact-fetcher');
const src = require('../src/web-ui/modules/decisions-reactive-source');
const MODULES_ADAPTER_PATH = require.resolve('../src/web-ui/adapters/modules-adapter');
const PRODUCTS_SRC = path.join(__dirname, '..', 'src', 'web-ui', 'routes', 'products.js');

const GOOD = '**2026-11-08 | RISK-ACCEPT | dor**\n**Decision:** Accept the pin deviation.\n';
const GOOD2 = '**2026-11-09 | SCOPE | definition**\n**Decision:** Changed text after refresh.\n';
const NOT_FOUND = (o, r, p) => new fetcher.ArtefactNotFoundError(o + '/' + r, p);

let clockNow = 1000000;
function resetAll(cfg) {
  src._clearDecisionsCache();
  src._setClock(() => clockNow);
  src._setCacheConfig(Object.assign({ ttlMs: 300000, maxEntries: 2000 }, cfg || {}));
}
function counting(handler) {
  const calls = [];
  fetcher.setFetchRepoPath(async (o, r, p, t) => { calls.push(p); return handler(o, r, p, t); });
  return calls;
}
const quiet = () => { const e = console.error; console.error = () => {}; return () => { console.error = e; }; };

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test('T1 a repeat view within the TTL makes no GitHub request and returns the same items (AC1)', async () => {
  resetAll();
  const calls = counting(() => GOOD);
  const a = await src.fetchReactiveDecisionsForFeaturesCached('o', 'r', ['f1', 'f2'], 'tok');
  const b = await src.fetchReactiveDecisionsForFeaturesCached('o', 'r', ['f1', 'f2'], 'tok');
  assert.strictEqual(calls.length, 2, 'one request per slug in total, got ' + calls.length);
  assert.strictEqual(a.length, 2);
  assert.deepStrictEqual(b, a);
});

test('T2 a stale entry is served at once, one background refresh per slug, then the new items (AC2)', async () => {
  resetAll();
  let content = GOOD; let release = null; let hang = false;
  const calls = counting(() => (hang ? new Promise((res) => { release = () => res(content); }) : content));
  const first = await src.fetchReactiveDecisionsForFeaturesCached('o', 'r', ['f1'], 'tok');
  assert.ok(first[0].title.indexOf('pin deviation') !== -1);
  clockNow += 400000; // past the 5 minute TTL
  hang = true; content = GOOD2;
  const p1 = src.fetchReactiveDecisionsForFeaturesCached('o', 'r', ['f1'], 'tok');
  const p2 = src.fetchReactiveDecisionsForFeaturesCached('o', 'r', ['f1'], 'tok');
  const [s1, s2] = await Promise.race([Promise.all([p1, p2]), new Promise((res) => setTimeout(() => res('TIMEOUT'), 200))]);
  assert.notStrictEqual(s1, undefined, 'both stale reads must resolve without waiting for GitHub');
  assert.ok(s1[0].title.indexOf('pin deviation') !== -1 && s2[0].title.indexOf('pin deviation') !== -1, 'stale items served');
  assert.strictEqual(calls.length, 2, 'exactly one refresh in flight (1 original + 1 refresh), got ' + calls.length);
  release();
  await new Promise((res) => setTimeout(res, 20));
  hang = false;
  const third = await src.fetchReactiveDecisionsForFeaturesCached('o', 'r', ['f1'], 'tok');
  assert.ok(third[0].title.indexOf('Changed text') !== -1, 'refreshed items served next');
});

test('T3 a not-found file is cached as empty (AC3)', async () => {
  resetAll();
  const calls = counting((o, r, p) => { throw NOT_FOUND(o, r, p); });
  const a = await src.fetchReactiveDecisionsForFeaturesCached('o', 'r', ['nofile'], 'tok');
  const b = await src.fetchReactiveDecisionsForFeaturesCached('o', 'r', ['nofile'], 'tok');
  assert.deepStrictEqual(a, []); assert.deepStrictEqual(b, []);
  assert.strictEqual(calls.length, 1);
});

test('T4a a failed fetch on a cold slug yields nothing and is not cached (AC4)', async () => {
  resetAll();
  const restore = quiet();
  try {
    let fail = true;
    const calls = counting(() => { if (fail) { throw new Error('GitHub 502'); } return GOOD; });
    const a = await src.fetchReactiveDecisionsForFeaturesCached('o', 'r', ['f1'], 'tok');
    assert.deepStrictEqual(a, []);
    fail = false;
    const b = await src.fetchReactiveDecisionsForFeaturesCached('o', 'r', ['f1'], 'tok');
    assert.strictEqual(calls.length, 2, 'the second view must retry');
    assert.strictEqual(b.length, 1);
  } finally { restore(); }
});

test('T4b a failed refresh keeps serving the stale items (AC4)', async () => {
  resetAll();
  const restore = quiet();
  try {
    let fail = false;
    counting(() => { if (fail) { throw new Error('rate limited'); } return GOOD; });
    await src.fetchReactiveDecisionsForFeaturesCached('o', 'r', ['f1'], 'tok');
    clockNow += 400000; fail = true;
    const stale = await src.fetchReactiveDecisionsForFeaturesCached('o', 'r', ['f1'], 'tok');
    assert.strictEqual(stale.length, 1, 'stale item still served');
    await new Promise((res) => setTimeout(res, 20));
    const again = await src.fetchReactiveDecisionsForFeaturesCached('o', 'r', ['f1'], 'tok');
    assert.strictEqual(again.length, 1, 'still served after the failed refresh finished');
  } finally { restore(); }
});

test('T5 the cache never holds more than the cap and drops the oldest (AC5)', async () => {
  resetAll({ maxEntries: 3 });
  counting(() => GOOD);
  for (const s of ['a1', 'a2', 'a3', 'a4', 'a5']) { await src.fetchReactiveDecisionsForFeaturesCached('o', 'r', [s], 'tok'); }
  const keys = src._cacheKeys();
  assert.strictEqual(keys.length, 3);
  assert.ok(keys.every((k) => /a[345]$/.test(k)), 'oldest two dropped: ' + keys.join(','));
});

test('T7 at most 16 requests are in flight at once, and more than the old 6 (AC7)', async () => {
  resetAll();
  let inflight = 0; let max = 0;
  fetcher.setFetchRepoPath(async () => { inflight++; max = Math.max(max, inflight); await new Promise((res) => setTimeout(res, 5)); inflight--; return GOOD; });
  const slugs = []; for (let i = 0; i < 100; i++) { slugs.push('feat-' + i); }
  await src.fetchReactiveDecisionsForFeaturesCached('o', 'r', slugs, 'tok');
  assert.ok(max > 6, 'expected more than 6 in flight, got ' + max);
  assert.ok(max <= 16, 'expected at most 16 in flight, got ' + max);
});

test('T8a the token is never stored or part of a cache key (NFR)', async () => {
  resetAll();
  counting(() => GOOD);
  await src.fetchReactiveDecisionsForFeaturesCached('o', 'r', ['f1'], 'SECRET-TOKEN-123');
  assert.ok(src._cacheKeys().length === 1);
  assert.ok(JSON.stringify(src._cacheKeys()).indexOf('SECRET-TOKEN-123') === -1, 'token in a cache key');
});

test('T8b slug validation is kept in front of the cache (NFR)', async () => {
  resetAll();
  const calls = counting(() => GOOD);
  const out = await src.fetchReactiveDecisionsForFeaturesCached('o', 'r', ['../x', 'a/b', 'ok-slug'], 'tok');
  assert.strictEqual(calls.length, 1, 'only the safe slug is requested');
  assert.strictEqual(out.length, 1);
  assert.deepStrictEqual(src._cacheKeys().filter((k) => k.indexOf('..') !== -1 || k.indexOf('a/b') !== -1), []);
});

// ---- handler-level (the real entry point, as the urpv-s3 tests do) ----
function makePool(featureSlugs, stats) {
  let inflight = 0;
  return {
    query: async function (sql) {
      inflight++; stats.max = Math.max(stats.max, inflight);
      await new Promise((res) => setTimeout(res, 15));
      inflight--;
      if (/SELECT name, tenant_id, repo_owner, repo_name FROM products/.test(sql)) {
        return { rows: [{ name: 'Acme', tenant_id: 't1', repo_owner: 'acme', repo_name: 'repo' }] };
      }
      if (/FROM product_rollups/.test(sql)) { return { rows: [] }; }
      if (/FROM journeys WHERE product_id/.test(sql) && /feature_slug/.test(sql)) {
        return { rows: featureSlugs.map((s, i) => ({ journey_id: 'j' + i, feature_slug: s, stage: 'discovery', display_name: null })) };
      }
      return { rows: [] };
    }
  };
}
function makeRes() { let html = null; let status = null; return { html: () => html, status: () => status, writeHead: (s) => { status = s; }, end: (b) => { html = b; } }; }
async function renderProduct(productsRoute, pool) {
  const res = makeRes();
  await productsRoute.handleGetProductView({ params: { id: 'p1' }, session: { tenantId: 't1', accessToken: 'tok' } }, res, null, pool);
  return res;
}

test('T9 two views of the same product: the second makes zero decisions requests and shows the same text (AC1, real entry point)', async () => {
  resetAll();
  delete require.cache[require.resolve('../src/web-ui/routes/products')];
  const productsRoute = require('../src/web-ui/routes/products');
  require(MODULES_ADAPTER_PATH).setModulesAdapter({ query: async function () { return { rows: [] }; } });
  const calls = counting((o, r, p) => { if (p === 'artefacts/feat-a/decisions.md') { return GOOD; } throw NOT_FOUND(o, r, p); });
  const stats = { max: 0 };
  const first = await renderProduct(productsRoute, makePool(['feat-a', 'feat-b'], stats));
  const afterFirst = calls.filter((p) => /decisions\.md$/.test(p)).length;
  const second = await renderProduct(productsRoute, makePool(['feat-a', 'feat-b'], stats));
  const afterSecond = calls.filter((p) => /decisions\.md$/.test(p)).length;
  assert.strictEqual(afterFirst, 2, 'first view fetches each slug once');
  assert.strictEqual(afterSecond, afterFirst, 'second view makes no further decisions request');
  assert.ok(first.html().indexOf('Accept the pin deviation.') !== -1 && second.html().indexOf('Accept the pin deviation.') !== -1);
  const code = fs.readFileSync(PRODUCTS_SRC, 'utf8');
  assert.ok(code.indexOf('fetchReactiveDecisionsForFeaturesCached(') !== -1, 'handler uses the cached function');
  assert.ok(!/_decisionsReactiveSource\.fetchReactiveDecisionsForFeatures\(/.test(code), 'handler no longer calls the uncached one');
});

test('T6 the handler starts independent reads together instead of one after another (AC6)', async () => {
  resetAll();
  delete require.cache[require.resolve('../src/web-ui/routes/products')];
  const productsRoute = require('../src/web-ui/routes/products');
  require(MODULES_ADAPTER_PATH).setModulesAdapter({ query: async function () { return { rows: [] }; } });
  counting((o, r, p) => { throw NOT_FOUND(o, r, p); });
  const stats = { max: 0 };
  const res = await renderProduct(productsRoute, makePool(['feat-a'], stats));
  assert.strictEqual(res.status(), 200);
  assert.ok(res.html().indexOf('Acme') !== -1 && res.html().indexOf('feat-a') !== -1, 'page still renders the product and feature');
  assert.ok(stats.max >= 3, 'expected at least 3 queries in flight together, got ' + stats.max);
});

(async () => {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch (e) { failed++; console.log('  FAIL ' + t.name + ' -- ' + (e && e.message)); }
  }
  console.log('[ppp-s1-decisions-cache] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
