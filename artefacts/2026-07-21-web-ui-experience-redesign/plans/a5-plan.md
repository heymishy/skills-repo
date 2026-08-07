## Implementation Plan: Surface discovery-only and ideation-only work in a Roadmap tab

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/a5-roadmap-tab.md`
**DoR reference:** `artefacts/2026-07-21-web-ui-experience-redesign/dor/a5-dor.md`
**Test plan reference:** `artefacts/2026-07-21-web-ui-experience-redesign/test-plans/a5-test-plan.md`
**Author:** Claude (agent)
**Date:** 2026-07-21

---

## File map

| File | Change |
|------|--------|
| `src/web-ui/modules/roadmap-scan.js` | New. `scanRoadmapArtefacts(artefactsDir, pipelineState)` — read-only scan of `artefacts/` for discovery-only/ideate-only folders, excluding anything already tracked in `pipeline-state.json`. |
| `src/web-ui/routes/products.js` | Add `_renderRoadmapTab()` and `handleGetProductRoadmap()`, exported alongside existing handlers. |
| `src/web-ui/server.js` | Register `GET /products/:id/roadmap` route, wired to `handleGetProductRoadmap`. |
| `tests/check-a5-roadmap-tab.js` | New. Unit tests for `scanRoadmapArtefacts` (AC1-AC4) + integration tests for the route/rendering (AC1, AC4) + NFR performance test. |

No other files touched — this story's Architecture Constraints are read-only (no writes to any artefact file) and explicitly do not build the sync/cache pipeline (`product_rollups` column, extended `/product-sync`).

---

## Task 1 — `scanRoadmapArtefacts` returns a discovery-only entry, excludes tracked features, and never throws on an empty dir (AC1, AC3, AC4)

**Files:** `src/web-ui/modules/roadmap-scan.js` (new), `tests/check-a5-roadmap-tab.js` (new)

**TDD steps:**

1. RED — write a failing test asserting `scanRoadmapArtefacts` doesn't exist / throws when required:
   ```js
   var roadmapScan = require('../src/web-ui/modules/roadmap-scan');
   assert.strictEqual(typeof roadmapScan.scanRoadmapArtefacts, 'function');
   ```
   Run: `node tests/check-a5-roadmap-tab.js` — expected output: `Cannot find module '../src/web-ui/modules/roadmap-scan'` (module does not exist yet).

2. GREEN — create `src/web-ui/modules/roadmap-scan.js`:
   ```js
   'use strict';

   var fs = require('fs');
   var path = require('path');

   // a5 -- read-only scan of artefacts/ for discovery-only and ideate-only
   // feature folders that have no corresponding entry in pipeline-state.json.
   // Per the story's Architecture Constraints: this reads artefacts directly
   // at render time. It does NOT build the sync/cache pipeline (a new
   // product_rollups column computed by an extended /product-sync) -- that
   // is explicitly deferred per discovery's Out of Scope.

   var TITLE_PREFIX_RE = /^(Discovery Artefact|Discovery|Ideation Artefact|Ideate)\s*[:—-]\s*/i;
   var DATE_PATTERNS = [
     /\*\*Created:\*\*\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i,
     /\*\*Discovery started:\*\*\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i,
     /\*\*Session date:\*\*\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/i
   ];
   var FOLDER_DATE_RE = /^([0-9]{4}-[0-9]{2}-[0-9]{2})-/;

   function _extractTitle(mdContent, fallback) {
     var lines = String(mdContent || '').split(/\r?\n/);
     for (var i = 0; i < lines.length; i++) {
       var line = lines[i].trim();
       if (line.charAt(0) === '#') {
         var heading = line.replace(/^#+\s*/, '').replace(TITLE_PREFIX_RE, '').trim();
         return heading || fallback;
       }
     }
     return fallback;
   }

   function _extractDate(mdContent, folderName) {
     for (var i = 0; i < DATE_PATTERNS.length; i++) {
       var m = String(mdContent || '').match(DATE_PATTERNS[i]);
       if (m) return m[1];
     }
     var folderMatch = folderName.match(FOLDER_DATE_RE);
     return folderMatch ? folderMatch[1] : null;
   }

   function _trackedSlugSet(pipelineState) {
     var set = {};
     var features = (pipelineState && pipelineState.features) || [];
     features.forEach(function(f) {
       if (f && f.slug) { set[f.slug] = true; }
     });
     return set;
   }

   /**
    * @param {string} artefactsDir - absolute path to the repo's artefacts/ directory
    * @param {object} pipelineState - parsed pipeline-state.json content (or null)
    * @returns {Array<{slug: string, title: string, stage: 'Discovery'|'Ideate only', date: string|null}>}
    */
   function scanRoadmapArtefacts(artefactsDir, pipelineState) {
     var results = [];
     var trackedSlugs = _trackedSlugSet(pipelineState);

     var entries;
     try {
       entries = fs.readdirSync(artefactsDir, { withFileTypes: true });
     } catch (_) {
       return results; // AC4 -- missing/unreadable dir is treated as "nothing early-stage", not an error
     }

     entries.forEach(function(entry) {
       if (!entry.isDirectory()) { return; }
       var slug = entry.name;
       if (trackedSlugs[slug]) { return; } // AC3 -- already-tracked features are excluded

       var folderPath = path.join(artefactsDir, slug);
       var discoveryPath = path.join(folderPath, 'discovery.md');
       var ideatePath = path.join(folderPath, 'ideate.md');
       var hasDiscovery = fs.existsSync(discoveryPath);
       var hasIdeate = fs.existsSync(ideatePath);
       if (!hasDiscovery && !hasIdeate) { return; }

       var stage, sourcePath;
       if (hasIdeate) {
         // AC2 -- ideate.md present (with or without discovery.md) gets its own
         // distinct label, never conflated with plain "Discovery"
         stage = 'Ideate only';
         sourcePath = ideatePath;
       } else {
         stage = 'Discovery';
         sourcePath = discoveryPath;
       }

       var content = '';
       try { content = fs.readFileSync(sourcePath, 'utf8'); } catch (_) { content = ''; }

       results.push({
         slug: slug,
         title: _extractTitle(content, slug),
         stage: stage,
         date: _extractDate(content, slug)
       });
     });

     return results;
   }

   module.exports = { scanRoadmapArtefacts: scanRoadmapArtefacts };
   ```

3. GREEN — write the real test bodies in `tests/check-a5-roadmap-tab.js` (see Task 4 for the full file; this task covers the first three `test()` blocks):
   ```js
   var assert = require('assert');
   var fs = require('fs');
   var os = require('os');
   var path = require('path');
   var roadmapScan = require('../src/web-ui/modules/roadmap-scan');

   var passed = 0; var failed = 0;
   function test(name, fn) {
     try { fn(); passed++; console.log('  [PASS]', name); }
     catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
   }

   function makeFixtureDir() {
     return fs.mkdtempSync(path.join(os.tmpdir(), 'a5-roadmap-'));
   }

   console.log('\n[a5] AC1 -- discovery-only artefact with no pipeline-state entry is roadmap-eligible');
   test('a feature with only discovery.md and no pipeline-state entry is detected', function() {
     var dir = makeFixtureDir();
     var featureDir = path.join(dir, '2026-05-01-widget-thing');
     fs.mkdirSync(featureDir, { recursive: true });
     fs.writeFileSync(path.join(featureDir, 'discovery.md'),
       '# Discovery: Widget Thing\n\n**Status:** Approved\n**Created:** 2026-05-01\n');
     var result = roadmapScan.scanRoadmapArtefacts(dir, { features: [] });
     assert.strictEqual(result.length, 1);
     assert.strictEqual(result[0].slug, '2026-05-01-widget-thing');
     assert.strictEqual(result[0].title, 'Widget Thing');
     assert.strictEqual(result[0].stage, 'Discovery');
     assert.strictEqual(result[0].date, '2026-05-01');
   });

   console.log('\n[a5] AC2 -- ideate-only artefact gets a distinct stage label');
   test('a feature with only ideate.md is labelled "Ideate only", distinct from "Discovery"', function() {
     var dir = makeFixtureDir();
     var featureDir = path.join(dir, '2026-05-02-gizmo-idea');
     fs.mkdirSync(featureDir, { recursive: true });
     fs.writeFileSync(path.join(featureDir, 'ideate.md'),
       '# Ideation Artefact -- Gizmo Idea\n\n**Session date:** 2026-05-02\n');
     var result = roadmapScan.scanRoadmapArtefacts(dir, { features: [] });
     assert.strictEqual(result.length, 1);
     assert.strictEqual(result[0].stage, 'Ideate only');
     assert.notStrictEqual(result[0].stage, 'Discovery');
   });

   console.log('\n[a5] AC3 -- already-tracked feature is excluded');
   test('a feature already tracked in pipeline-state.json does not appear', function() {
     var dir = makeFixtureDir();
     var featureDir = path.join(dir, '2026-05-03-tracked-feature');
     fs.mkdirSync(featureDir, { recursive: true });
     fs.writeFileSync(path.join(featureDir, 'discovery.md'), '# Discovery: Tracked Feature\n**Created:** 2026-05-03\n');
     var pipelineState = { features: [{ slug: '2026-05-03-tracked-feature', stage: 'definition' }] };
     var result = roadmapScan.scanRoadmapArtefacts(dir, pipelineState);
     assert.strictEqual(result.length, 0);
   });

   console.log('\n[a5] AC4 -- zero early-stage artefacts returns an empty array, not an error');
   test('an empty artefacts directory returns [] with no exception', function() {
     var dir = makeFixtureDir();
     var result = roadmapScan.scanRoadmapArtefacts(dir, { features: [] });
     assert.deepStrictEqual(result, []);
   });

   test('a non-existent artefacts directory returns [] with no exception', function() {
     var result = roadmapScan.scanRoadmapArtefacts(path.join(os.tmpdir(), 'a5-does-not-exist-' + Date.now()), { features: [] });
     assert.deepStrictEqual(result, []);
   });
   ```

4. Run: `node tests/check-a5-roadmap-tab.js`
   Expected output: all 5 tests `[PASS]`, `0 failed`.

**Commit message:** `feat(a5): add scanRoadmapArtefacts read-only artefact scanner`

---

## Task 2 — Wire the scan into a Roadmap tab route and render it, with the empty state and stage pills (AC1, AC2, AC4)

**Files:** `src/web-ui/routes/products.js`, `tests/check-a5-roadmap-tab.js`

**TDD steps:**

1. RED — add a failing integration test asserting `handleGetProductRoadmap` doesn't exist yet:
   ```js
   console.log('\n[a5] products.js exports handleGetProductRoadmap');
   test('products.js exports handleGetProductRoadmap', function() {
     var productsRoute = require('../src/web-ui/routes/products');
     assert.strictEqual(typeof productsRoute.handleGetProductRoadmap, 'function');
   });
   ```
   Run: `node tests/check-a5-roadmap-tab.js` — expected: this test `[FAIL]` (`undefined` is not `'function'`); prior tests still pass.

2. GREEN — in `src/web-ui/routes/products.js`:
   - Add near the top, alongside the other adapter requires:
     ```js
     var _roadmapScan = require('../modules/roadmap-scan'); // a5
     var _repoRootAdapter = require('../adapters/repo-root'); // a5 -- reuses the existing local-disk repo-root pattern (already used by handlePostProductFeature)
     ```
   - Add a rendering function (placed after `_renderProductView`):
     ```js
     function _renderRoadmapTab(productName, productId, login, roadmapEntries) {
       var listHtml = roadmapEntries.length === 0
         ? '<p style="color:var(--muted);font-size:14px">Nothing in early-stage discovery right now</p>'
         : '<ul class="sw-list">' +
             roadmapEntries.map(function(e) {
               var pillClass = e.stage === 'Ideate only' ? 'sw-pill sw-pill--neutral' : 'sw-pill sw-pill--accent';
               return '<li>' +
                 '<div style="flex:1">' +
                   '<div style="font-size:14px;font-weight:500">' + _escapeHtml(e.title) + '</div>' +
                   (e.date ? '<div style="font-size:12px;color:var(--muted);margin-top:2px">' + _escapeHtml(e.date) + '</div>' : '') +
                 '</div>' +
                 '<span class="' + pillClass + '">' + _escapeHtml(e.stage) + '</span>' +
               '</li>';
             }).join('') +
           '</ul>';
       var body = '<div style="max-width:720px">' +
         '<div style="margin-bottom:24px">' +
           '<div style="font-size:12px;color:var(--muted);margin-bottom:4px"><a href="/products/' + _escapeHtml(productId) + '" style="color:var(--muted);text-decoration:none">' + _escapeHtml(productName) + '</a> &rsaquo;</div>' +
           '<h1 style="margin:0;font-size:24px">Roadmap</h1>' +
         '</div>' +
         listHtml +
       '</div>';
       return _htmlShell.renderShell({ title: 'Roadmap', bodyContent: body, user: { login: login }, active: 'dashboard', crumbs: [productName, 'Roadmap'] });
     }
     ```
   - Add the handler (placed after `handleGetProductView`):
     ```js
     /**
      * a5 -- GET /products/:id/roadmap: read-only scan of artefacts/ for
      * discovery-only and ideate-only work with no pipeline-state.json entry
      * yet. Reads the connected repo's local disk directly at render time
      * (same local-disk pattern as handlePostProductFeature's repoRoot usage)
      * -- this does NOT build the sync/cache pipeline (a new product_rollups
      * column via an extended /product-sync), which is explicitly deferred
      * per discovery's Out of Scope and this story's Architecture Constraints.
      */
     async function handleGetProductRoadmap(req, res, _next, pool) {
       var _pool = pool;
       var productId = req.params && req.params.id;
       var tenantId = req.session && req.session.tenantId;
       var login = req.session && req.session.login;

       var prodRow = (await _pool.query(
         'SELECT name, tenant_id FROM products WHERE product_id = $1',
         [productId]
       )).rows[0];
       if (!prodRow || prodRow.tenant_id !== tenantId) {
         if (res.status) { res.status(404).json({ error: 'not found' }); }
         else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'not found' })); }
         return;
       }

       var repoRoot = _repoRootAdapter.getRepoRoot(req);
       var artefactsDir = require('path').join(repoRoot, 'artefacts');
       var pipelineStatePath = require('path').join(repoRoot, '.github', 'pipeline-state.json');
       var pipelineState = { features: [] };
       try {
         pipelineState = JSON.parse(require('fs').readFileSync(pipelineStatePath, 'utf8'));
       } catch (_) {
         pipelineState = { features: [] };
       }

       var roadmapEntries = _roadmapScan.scanRoadmapArtefacts(artefactsDir, pipelineState);

       if (res.json) {
         res.json({ roadmap: roadmapEntries });
       } else {
         var html = _renderRoadmapTab(prodRow.name, productId, login, roadmapEntries);
         res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
         res.end(html);
       }
     }
     ```
   - Add `handleGetProductRoadmap` and `_renderRoadmapTab` to `module.exports`.

3. GREEN — add the integration tests to `tests/check-a5-roadmap-tab.js`:
   ```js
   console.log('\n[a5] AC4 -- Roadmap tab renders the empty state cleanly when the scan returns nothing');
   (function() {
     try {
       var productsRoute = require('../src/web-ui/routes/products');
       var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a5-empty-'));
       var mockPool = { query: async function(sql) {
         if (/SELECT name, tenant_id FROM products/i.test(sql)) return { rows: [{ name: 'Acme', tenant_id: 't1' }] };
         return { rows: [] };
       } };
       var origRepoRoot = require('../src/web-ui/adapters/repo-root').getRepoRoot;
       require('../src/web-ui/adapters/repo-root').setRepoRoot(dir);
       var html = null;
       var req = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'x' } };
       var res = { writeHead: function() {}, end: function(body) { html = body; } };
       productsRoute.handleGetProductRoadmap(req, res, null, mockPool).then(function() {
         if (!/Nothing in early-stage discovery right now/.test(html)) {
           failed++; console.log('  [FAIL] empty roadmap state --  expected empty-state text, got:', html && html.slice(0, 200));
         } else {
           passed++; console.log('  [PASS] Roadmap tab renders the empty state cleanly (AC4)');
         }
         require('../src/web-ui/adapters/repo-root').setRepoRoot(null);
       });
     } catch (err) {
       failed++; console.log('  [FAIL] empty roadmap state (sync) --', err.message);
     }
   })();

   console.log('\n[a5] AC1 -- Roadmap tab renders a real discovery-only entry with its stage pill');
   (function() {
     try {
       var productsRoute = require('../src/web-ui/routes/products');
       var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a5-real-'));
       var featureDir = path.join(dir, '2026-05-04-real-thing');
       fs.mkdirSync(featureDir, { recursive: true });
       fs.writeFileSync(path.join(featureDir, 'discovery.md'), '# Discovery: Real Thing\n**Created:** 2026-05-04\n');
       var mockPool = { query: async function(sql) {
         if (/SELECT name, tenant_id FROM products/i.test(sql)) return { rows: [{ name: 'Acme', tenant_id: 't1' }] };
         return { rows: [] };
       } };
       require('../src/web-ui/adapters/repo-root').setRepoRoot(dir);
       var html = null;
       var req = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'x' } };
       var res = { writeHead: function() {}, end: function(body) { html = body; } };
       productsRoute.handleGetProductRoadmap(req, res, null, mockPool).then(function() {
         if (!/Real Thing/.test(html) || !/Discovery/.test(html) || !/2026-05-04/.test(html)) {
           failed++; console.log('  [FAIL] discovery-only rendering -- expected title/stage/date, got:', html && html.slice(0, 300));
         } else {
           passed++; console.log('  [PASS] Roadmap tab renders a real discovery-only entry with title, stage pill, and date (AC1)');
         }
         require('../src/web-ui/adapters/repo-root').setRepoRoot(null);
         console.log('\n[a5-roadmap-tab] Results: ' + passed + ' passed, ' + failed + ' failed');
         process.exit(failed > 0 ? 1 : 0);
       });
     } catch (err) {
       failed++; console.log('  [FAIL] discovery-only rendering (sync) --', err.message);
       console.log('\n[a5-roadmap-tab] Results: ' + passed + ' passed, ' + failed + ' failed');
       process.exit(1);
     }
   })();
   ```
   (These two async blocks are the last thing in the file and own the final `process.exit` — see Task 4 for the fully assembled file with correct ordering/async chaining.)

4. Run: `node tests/check-a5-roadmap-tab.js`
   Expected output: all tests `[PASS]`, `0 failed`.

**Commit message:** `feat(a5): add Roadmap tab handler and rendering, wired to scanRoadmapArtefacts`

---

## Task 3 — Register the route in `server.js` and add the NFR performance test (100-folder scan under 1 second)

**Files:** `src/web-ui/server.js`, `tests/check-a5-roadmap-tab.js`

**TDD steps:**

1. RED — add a failing test asserting `server.js` references the new route:
   ```js
   console.log('\n[a5] server.js registers GET /products/:id/roadmap');
   test('server.js references handleGetProductRoadmap and the /roadmap route pattern', function() {
     var serverSrc = fs.readFileSync(path.resolve(__dirname, '../src/web-ui/server.js'), 'utf8');
     assert.ok(/handleGetProductRoadmap/.test(serverSrc), 'Expected server.js to import/use handleGetProductRoadmap');
     assert.ok(/\\\/products\\\/\[\^\/\]\+\\\/roadmap\$/.test(serverSrc) || /products\/\[\^\/\]\+\\\/roadmap/.test(serverSrc), 'Expected a /products/:id/roadmap route pattern');
   });
   ```
   Run: `node tests/check-a5-roadmap-tab.js` — expected: this test `[FAIL]`.

2. GREEN:
   - In `src/web-ui/server.js`, add `handleGetProductRoadmap` to the destructured import from `./routes/products` (same line as the other product handlers).
   - Add a new route branch immediately after the existing `GET /products/:id/kanban` block:
     ```js
     } else if (pathname.match(/^\/products\/[^/]+\/roadmap$/) && req.method === 'GET') {
       // a5 -- Roadmap tab: discovery-only/ideate-only work with no pipeline-state.json entry
       req.params = { id: pathname.split('/')[2] };
       authGuard(req, res, async () => { await handleGetProductRoadmap(req, res, null, _pshPool); });

     ```

3. GREEN — add the NFR performance test:
   ```js
   console.log('\n[a5] NFR -- artefact scan completes in under 1 second for 100 feature folders');
   test('scanRoadmapArtefacts scans 100 feature folders in under 1 second', function() {
     var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'a5-perf-'));
     for (var i = 0; i < 100; i++) {
       var featureDir = path.join(dir, '2026-01-01-feature-' + i);
       fs.mkdirSync(featureDir, { recursive: true });
       fs.writeFileSync(path.join(featureDir, 'discovery.md'), '# Discovery: Feature ' + i + '\n**Created:** 2026-01-01\n');
     }
     var start = Date.now();
     var result = roadmapScan.scanRoadmapArtefacts(dir, { features: [] });
     var elapsedMs = Date.now() - start;
     assert.strictEqual(result.length, 100);
     assert.ok(elapsedMs < 1000, 'Expected scan to complete in under 1000ms, took ' + elapsedMs + 'ms');
   });
   ```

4. Run: `node tests/check-a5-roadmap-tab.js`
   Expected output: all tests `[PASS]`, `0 failed`.

**Commit message:** `feat(a5): register GET /products/:id/roadmap route and add NFR performance test`

---

## Task 4 — Full suite run and final assembly of `tests/check-a5-roadmap-tab.js`

Assemble all `test()` blocks and async IIFEs from Tasks 1-3 into one file, `tests/check-a5-roadmap-tab.js`, with the async blocks chained (not fire-and-forget) so the file's own `process.exit` only runs after every assertion has resolved, matching the pattern already used in `tests/check-pr-s2-products-route.js` (`(async function() { ... })();` wrapping sequential `await` blocks).

Run: `npm test` (full suite via `node scripts/run-all-tests.js`, which auto-discovers `tests/check-*.js`).
Expected: `tests/check-a5-roadmap-tab.js` passes with 0 failures, and no other previously-passing test file regresses.

**Commit message:** `test(a5): finalize check-a5-roadmap-tab.js as a single sequential test file`

---

## Self-review checklist

- [x] Exact file paths (no placeholders)
- [x] Complete code shown for every step
- [x] Failing test written before each implementation step
- [x] Expected output stated for every run command
- [x] Commit messages in imperative mood
- [x] No scope beyond AC1-AC4 (no sync/cache pipeline, no edit/progress actions, no cross-product aggregation)
