'use strict';
// check-jcx-s4-persona-card.js -- TDD tests for jcx-s4 (Epic:
// journey-map-and-placeholder-trigger, 2026-10-11-journey-cx-redesign).
// Story: artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s4.md
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

function makeDiscoveryFixture(repoRoot, slug, whoItAffectsText) {
  var dir = path.join(repoRoot, 'artefacts', slug);
  fs.mkdirSync(dir, { recursive: true });
  var content = '# Discovery: X\n\n**Status:** Approved\n\n## Problem Statement\n\nSome problem.\n\n## Who It Affects\n\n' +
    whoItAffectsText + '\n\n## Why Now\n\nBecause.\n';
  fs.writeFileSync(path.join(dir, 'discovery.md'), content, 'utf8');
}

(async function() {
  const personaScanner = require('../src/web-ui/adapters/persona-scanner');

  // -- AC1 (unit half): extractWhoItAffects returns raw text, unmodified --
  try {
    var repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jcx-s4-'));
    makeDiscoveryFixture(repoRoot, 'feat-a', 'Primary: Busy parent who needs quick checkout.');
    var content = fs.readFileSync(path.join(repoRoot, 'artefacts', 'feat-a', 'discovery.md'), 'utf8');
    var text = personaScanner.extractWhoItAffects(content);
    assert.strictEqual(text, 'Primary: Busy parent who needs quick checkout.', 'expected the raw, unmodified "Who It Affects" text');
    fs.rmSync(repoRoot, { recursive: true, force: true });
    pass('AC1 (unit): extractWhoItAffects returns raw text, unmodified -- no structured extraction');
  } catch (e) { fail('AC1 (unit): extractWhoItAffects returns raw text, unmodified -- no structured extraction', e); }

  // -- AC2: zero feature slugs -> empty suggestions, no error --
  try {
    var repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jcx-s4-'));
    var results = personaScanner.scanForPersonas([], repoRoot);
    assert.deepStrictEqual(results, [], 'expected an empty array, no thrown error');
    fs.rmSync(repoRoot, { recursive: true, force: true });
    pass('AC2: zero feature slugs returns an empty suggestions array, no error');
  } catch (e) { fail('AC2: zero feature slugs returns an empty suggestions array, no error', e); }

  // -- AC2 (missing discovery.md): a slug with no discovery.md is skipped, not an error --
  try {
    var repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jcx-s4-'));
    var results = personaScanner.scanForPersonas(['does-not-exist'], repoRoot);
    assert.deepStrictEqual(results, [], 'expected an empty array when the referenced discovery.md does not exist');
    fs.rmSync(repoRoot, { recursive: true, force: true });
    pass('AC2 (missing discovery.md): a slug with no discovery.md is skipped silently, not an error');
  } catch (e) { fail('AC2 (missing discovery.md): a slug with no discovery.md is skipped silently, not an error', e); }

  // -- AC5: multiple distinct personas kept separate, not merged --
  try {
    var repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jcx-s4-'));
    makeDiscoveryFixture(repoRoot, 'feat-a', 'Primary: Busy parent.');
    makeDiscoveryFixture(repoRoot, 'feat-b', 'Primary: Enterprise IT admin.');
    var results = personaScanner.scanForPersonas(['feat-a', 'feat-b'], repoRoot);
    assert.strictEqual(results.length, 2, 'expected 2 distinct suggestion entries, not merged');
    assert.strictEqual(results[0].featureSlug, 'feat-a');
    assert.strictEqual(results[0].personaText, 'Primary: Busy parent.');
    assert.strictEqual(results[1].featureSlug, 'feat-b');
    assert.strictEqual(results[1].personaText, 'Primary: Enterprise IT admin.');
    fs.rmSync(repoRoot, { recursive: true, force: true });
    pass('AC5: two distinct personas under the same product are returned as separate entries, not merged');
  } catch (e) { fail('AC5: two distinct personas under the same product are returned as separate entries, not merged', e); }

  // -- NFR: persona-scanner.js contains zero pool.query calls --
  try {
    var src = fs.readFileSync(require.resolve('../src/web-ui/adapters/persona-scanner'), 'utf8');
    assert.ok(!/pool\.query/.test(src), 'expected persona-scanner.js to contain zero pool.query calls -- it must only read local artefacts/ files');
    pass('NFR: persona-scanner.js is a pure file reader with zero DB query calls');
  } catch (e) { fail('NFR: persona-scanner.js is a pure file reader with zero DB query calls', e); }

  // -- Integration tests against journeys.js's own handlers --
  const journeys = require('../src/web-ui/routes/journeys');

  function makeMockPool(opts) {
    opts = opts || {};
    var updateCalls = opts.updateCalls || [];
    return {
      updateCalls: updateCalls,
      query: function(sql, params) {
        var s = String(sql).trim();
        if (/^SELECT id FROM customer_journeys WHERE id = \$1 AND tenant_id = \$2/.test(s)) {
          var match = opts.journeyRow && opts.journeyRow.id === params[0] && opts.journeyRow.tenant_id === params[1];
          return Promise.resolve({ rows: match ? [{ id: opts.journeyRow.id }] : [] });
        }
        if (/^SELECT DISTINCT feature_slug FROM journeys WHERE product_id = \$1/.test(s)) {
          var rows = (opts.journeysTableRows || []).filter(function(r) { return r.product_id === params[0]; });
          return Promise.resolve({ rows: rows.map(function(r) { return { feature_slug: r.feature_slug }; }) });
        }
        if (/^UPDATE customer_journeys SET persona_name = \$1/.test(s)) {
          updateCalls.push({ sql: s, params: params });
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      }
    };
  }

  // -- AC1 (integration half): suggestions scoped correctly by product_id --
  try {
    var repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jcx-s4-'));
    makeDiscoveryFixture(repoRoot, 'p1-feat-a', 'Primary: P1 persona A.');
    makeDiscoveryFixture(repoRoot, 'p1-feat-b', 'Primary: P1 persona B.');
    makeDiscoveryFixture(repoRoot, 'p2-feat-c', 'Primary: P2 persona C.');
    var pool = makeMockPool({
      journeysTableRows: [
        { product_id: 'P1', feature_slug: 'p1-feat-a' },
        { product_id: 'P1', feature_slug: 'p1-feat-b' },
        { product_id: 'P2', feature_slug: 'p2-feat-c' }
      ]
    });
    var suggestions = await journeys.getPersonaSuggestions(pool, 'P1', repoRoot);
    assert.strictEqual(suggestions.length, 2, 'expected only the 2 P1-scoped suggestions, P2 excluded');
    var slugs = suggestions.map(function(s) { return s.featureSlug; }).sort();
    assert.deepStrictEqual(slugs, ['p1-feat-a', 'p1-feat-b']);
    fs.rmSync(repoRoot, { recursive: true, force: true });
    pass('AC1 (integration): suggestions are correctly scoped by product_id, not repo-wide');
  } catch (e) { fail('AC1 (integration): suggestions are correctly scoped by product_id, not repo-wide', e); }

  // -- AC3: saving a persona writes to the 3 new columns --
  try {
    var updateCalls = [];
    var pool = makeMockPool({ journeyRow: { id: 'j1', tenant_id: 't1' }, updateCalls: updateCalls });
    var CSRF = 'jcx-s4-csrf';
    var req = { session: { tenantId: 't1', csrfToken: CSRF }, params: { id: 'j1' }, body: { persona_name: 'Busy parent', persona_role: 'Shopper', persona_goal: 'Checkout fast', _csrf: CSRF } };
    var res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await journeys.handlePatchJourneyPersona(req, res, null, pool);
    assert.strictEqual(res._s, 200, 'expected 200');
    assert.strictEqual(updateCalls.length, 1, 'expected exactly one UPDATE call');
    assert.deepStrictEqual(updateCalls[0].params, ['Busy parent', 'Shopper', 'Checkout fast', 'j1'], 'expected the UPDATE to carry the 3 persona values and the journey id');
    pass('AC3: saving a persona writes persona_name/persona_role/persona_goal via one UPDATE');
  } catch (e) { fail('AC3: saving a persona writes persona_name/persona_role/persona_goal via one UPDATE', e); }

  // -- AC3 (cross-tenant): a cross-tenant journey id returns 404, no UPDATE --
  try {
    var updateCalls = [];
    var pool = makeMockPool({ journeyRow: { id: 'j1', tenant_id: 'org-1' }, updateCalls: updateCalls });
    var CSRF = 'jcx-s4-csrf-xt';
    var req = { session: { tenantId: 'org-2', csrfToken: CSRF }, params: { id: 'j1' }, body: { persona_name: 'X', persona_role: 'Y', persona_goal: 'Z', _csrf: CSRF } };
    var res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
    await journeys.handlePatchJourneyPersona(req, res, null, pool);
    assert.strictEqual(res._s, 404, 'expected 404 (not 403) for a cross-tenant journey id');
    assert.strictEqual(updateCalls.length, 0, 'expected zero UPDATE calls');
    pass('AC3 (cross-tenant): a cross-tenant journey id returns 404, zero mutation');
  } catch (e) { fail('AC3 (cross-tenant): a cross-tenant journey id returns 404, zero mutation', e); }

  // -- AC4: re-opening the canvas for a journey with a saved persona shows
  // it, not the original discovery-sourced suggestions --
  try {
    var repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jcx-s4-'));
    makeDiscoveryFixture(repoRoot, 'p1-feat-a', 'Primary: Should NOT appear -- persona already saved.');
    function withMockedPipelineState(jsonString, fn) {
      var orig = fs.readFileSync;
      fs.readFileSync = function(p, enc) {
        if (String(p).indexOf('pipeline-state.json') !== -1) { return jsonString; }
        return orig(p, enc);
      };
      try { return fn(); } finally { fs.readFileSync = orig; }
    }
    var canvasPool = {
      query: function(sql, params) {
        var s = String(sql).trim();
        if (/^SELECT id, name, description, product_id, persona_name, persona_role, persona_goal FROM customer_journeys/.test(s)) {
          var match = params[0] === 'j1';
          return Promise.resolve({ rows: match ? [{ id: 'j1', name: 'J', description: null, product_id: 'P1', persona_name: 'Saved Name', persona_role: 'Saved Role', persona_goal: 'Saved Goal' }] : [] });
        }
        if (/^SELECT id, name, position, description/.test(s)) { return Promise.resolve({ rows: [] }); }
        if (/^SELECT DISTINCT feature_slug FROM journeys WHERE product_id = \$1/.test(s)) {
          return Promise.resolve({ rows: [{ feature_slug: 'p1-feat-a' }] });
        }
        return Promise.resolve({ rows: [] });
      }
    };
    var out = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
      var req = { session: { tenantId: 't1' }, params: { id: 'j1' } };
      var res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
      await journeys.handleGetJourneyCanvas(req, res, null, canvasPool);
      return res._b.bodyContent;
    });
    assert.ok(out.indexOf('Saved Name') !== -1, 'expected the saved persona name to render');
    assert.ok(out.indexOf('Saved Role') !== -1, 'expected the saved persona role to render');
    assert.ok(out.indexOf('Should NOT appear') === -1, 'expected the original discovery-sourced suggestion to NOT render once a persona is already saved');
    fs.rmSync(repoRoot, { recursive: true, force: true });
    pass('AC4: a journey with a saved persona renders it, not the original suggestions');
  } catch (e) { fail('AC4: a journey with a saved persona renders it, not the original suggestions', e); }

  console.log(`\n[jcx-s4-persona-card] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
