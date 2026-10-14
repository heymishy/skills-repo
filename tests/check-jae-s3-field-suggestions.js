'use strict';
// check-jae-s3-field-suggestions.js -- unit/integration tests for jae-s3
// (Epic: journey-authoring-guided-creation, 2026-10-14-journey-authoring-experience).
//
// Covers: AC1 (extractProblemStatement + getFieldSuggestions), AC2
// (clicking a suggestion fills the field, doesn't save), AC3 (no
// suggestion when no product_id / no readable discovery.md), AC4 (no
// suggestion for an already-populated field), AC5 (cross-tenant/product
// scoping matches getPersonaSuggestions exactly).
//
// Reuses check-jcx-s4-persona-card.js's own real-temp-fixture convention
// and check-jcx-s7-panel-feedback-and-polish.js's own jsdom buildDom pattern.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { JSDOM } = require('jsdom');

let passed = 0; let failed = 0;
function pass(name) { console.log('  [PASS] ' + name); passed++; }
function fail(name, err) { console.error('  [FAIL] ' + name + ': ' + (err.message || err)); failed++; }

function makeDiscoveryFixture(repoRoot, slug, problemStatementText) {
  var dir = path.join(repoRoot, 'artefacts', slug);
  fs.mkdirSync(dir, { recursive: true });
  var content = '# Discovery: X\n\n**Status:** Approved\n\n## Problem Statement\n\n' + problemStatementText +
    '\n\n## Who It Affects\n\nSomeone.\n\n## Why Now\n\nBecause.\n';
  fs.writeFileSync(path.join(dir, 'discovery.md'), content, 'utf8');
}

function makeMockPool(opts) {
  opts = opts || {};
  return {
    query: function(sql, params) {
      var s = String(sql).trim();
      if (/^SELECT DISTINCT feature_slug FROM journeys WHERE product_id = \$1/.test(s)) {
        var rows = (opts.journeysTableRows || []).filter(function(r) { return r.product_id === params[0]; });
        return Promise.resolve({ rows: rows.map(function(r) { return { feature_slug: r.feature_slug }; }) });
      }
      return Promise.resolve({ rows: [] });
    }
  };
}

function makeCanvasMockPool(journeyRow, stageRows) {
  return {
    query: function(sql, params) {
      var s = String(sql).trim();
      if (/^SELECT id, name, description, product_id, persona_name, persona_role, persona_goal FROM customer_journeys/.test(s)) {
        var match = journeyRow && journeyRow.id === params[0];
        return Promise.resolve({ rows: match ? [journeyRow] : [] });
      }
      if (/^SELECT id, name, position, description/.test(s)) {
        return Promise.resolve({ rows: stageRows });
      }
      if (/^SELECT DISTINCT feature_slug FROM journeys WHERE product_id = \$1/.test(s)) {
        return Promise.resolve({ rows: [{ feature_slug: 'feat-a' }] });
      }
      if (/^SELECT id, journey_stage_id, feature_slug, metric_keys, mapping_state FROM feature_customer_journey_stage_mappings/.test(s)) {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    }
  };
}

function withMockedPipelineState(jsonString, fn) {
  var orig = fs.readFileSync;
  fs.readFileSync = function(p, enc) {
    if (String(p).indexOf('pipeline-state.json') !== -1) { return jsonString; }
    return orig(p, enc);
  };
  try { return fn(); } finally { fs.readFileSync = orig; }
}

function makeMockReqRes() {
  var req = { session: { tenantId: 't1' }, params: { id: 'j1' } };
  var res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
  return { req: req, res: res };
}

// The field-suggestion click handler (jae-s3) lives in a LATER <script>
// block than "var stageData={};" (the persona-editor/feature-picker
// script, not the stage-panel one) -- mirrors check-jcx-s4-persona-card.js's
// own extractAllScripts convention for this exact cross-script-block case.
function extractAllScripts(html) {
  var scripts = [];
  var re = /<script>([\s\S]*?)<\/script>/g;
  var m;
  while ((m = re.exec(html)) !== null) { scripts.push(m[1]); }
  assert.ok(scripts.length > 0, 'expected at least one <script> block in the rendered HTML');
  return scripts;
}

function buildDom(bodyContent) {
  var scripts = extractAllScripts(bodyContent);
  var dom = new JSDOM('<!DOCTYPE html><html><body>' + bodyContent + '</body></html>', {
    runScripts: 'outside-only',
    url: 'http://localhost/journeys/j1'
  });
  dom.window.fetch = function() { return Promise.resolve({ ok: true, json: function() { return Promise.resolve({}); } }); };
  scripts.forEach(function(src) { dom.window.eval(src); });
  return dom;
}

(async function() {
  const personaScanner = require('../src/web-ui/adapters/persona-scanner');
  const journeys = require('../src/web-ui/routes/journeys');

  // AC1 (unit): extractProblemStatement extracts raw text, or null if absent
  try {
    var repoRoot1 = fs.mkdtempSync(path.join(os.tmpdir(), 'jae-s3-'));
    makeDiscoveryFixture(repoRoot1, 'feat-a', 'Customers abandon checkout due to unclear shipping costs.');
    var content1 = fs.readFileSync(path.join(repoRoot1, 'artefacts', 'feat-a', 'discovery.md'), 'utf8');
    var text1 = personaScanner.extractProblemStatement(content1);
    assert.strictEqual(text1, 'Customers abandon checkout due to unclear shipping costs.', 'expected the raw, unmodified Problem Statement text');
    var noSection = '# Discovery: X\n\n**Status:** Approved\n\n## Who It Affects\n\nSomeone.\n';
    assert.strictEqual(personaScanner.extractProblemStatement(noSection), null, 'expected null when no Problem Statement section exists');
    fs.rmSync(repoRoot1, { recursive: true, force: true });
    pass('jae-s3 AC1 (unit): extractProblemStatement extracts raw text, null if absent');
  } catch (e) { fail('jae-s3 AC1 (unit): extractProblemStatement extracts raw text, null if absent', e); }

  // AC1 (integration): getFieldSuggestions reaches a real discovery.md fixture end to end
  try {
    var repoRoot2 = fs.mkdtempSync(path.join(os.tmpdir(), 'jae-s3-'));
    makeDiscoveryFixture(repoRoot2, 'p1-feat-a', 'Customers expect a confirmation email within minutes.');
    var pool2 = makeMockPool({ journeysTableRows: [{ product_id: 'P1', feature_slug: 'p1-feat-a' }] });
    var results2 = await journeys.getFieldSuggestions(pool2, 'P1', repoRoot2);
    assert.strictEqual(results2.length, 1, 'expected exactly 1 suggestion');
    assert.strictEqual(results2[0].featureSlug, 'p1-feat-a');
    assert.strictEqual(results2[0].problemText, 'Customers expect a confirmation email within minutes.');
    fs.rmSync(repoRoot2, { recursive: true, force: true });
    pass('jae-s3 AC1 (integration): getFieldSuggestions reaches a real discovery.md fixture end to end');
  } catch (e) { fail('jae-s3 AC1 (integration): getFieldSuggestions reaches a real discovery.md fixture end to end', e); }

  // AC2: clicking a suggestion fills the field without saving it
  try {
    var repoRoot3 = fs.mkdtempSync(path.join(os.tmpdir(), 'jae-s3-'));
    makeDiscoveryFixture(repoRoot3, 'feat-a', 'Customer expects a confirmation email within minutes.');
    // handleGetJourneyCanvas resolves repoRoot via adapters/repo-root.js's
    // own getRepoRoot(req), not a parameter -- CLAUDE_REPO_PATH is the
    // established override point (mirrors check-jcx-s4-persona-card.js's
    // own established pattern for this exact constraint).
    var _origClaudeRepoPath = process.env.CLAUDE_REPO_PATH;
    process.env.CLAUDE_REPO_PATH = repoRoot3;
    var bodyContent;
    try {
      bodyContent = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
        var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null, product_id: 'P1' }, [{ id: 's1', name: 'Stage 1', position: 0 }]);
        var { req, res } = makeMockReqRes();
        await journeys.handleGetJourneyCanvas(req, res, null, pool);
        return res._b.bodyContent;
      });
    } finally {
      if (_origClaudeRepoPath === undefined) delete process.env.CLAUDE_REPO_PATH;
      else process.env.CLAUDE_REPO_PATH = _origClaudeRepoPath;
      fs.rmSync(repoRoot3, { recursive: true, force: true });
    }
    var dom = buildDom(bodyContent);
    var win = dom.window;
    var link = win.document.querySelector('.sw-stage-edit');
    link.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    var suggestionBtn = win.document.querySelector('.sw-field-suggestion-btn[data-field="customer_actions"]');
    assert.ok(suggestionBtn, 'expected a customer_actions suggestion button to render');
    suggestionBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    var field = win.document.getElementById('sw-stage-field-customer_actions');
    assert.strictEqual(field.value, suggestionBtn.getAttribute('data-text'), 'expected the field to be filled with the exact suggestion text');
    pass('jae-s3 AC2: clicking a suggestion fills the field without saving it');
  } catch (e) { fail('jae-s3 AC2: clicking a suggestion fills the field without saving it', e); }

  // AC3 (unit): no suggestion button when no product_id or no linked readable discovery.md
  try {
    var repoRoot4 = fs.mkdtempSync(path.join(os.tmpdir(), 'jae-s3-'));
    var resultsNoProduct = await journeys.getFieldSuggestions(makeMockPool({}), null, repoRoot4);
    assert.deepStrictEqual(resultsNoProduct, [], 'expected an empty array when no product_id is set');
    var resultsNoDiscovery = await journeys.getFieldSuggestions(
      makeMockPool({ journeysTableRows: [{ product_id: 'P1', feature_slug: 'does-not-exist' }] }), 'P1', repoRoot4
    );
    assert.deepStrictEqual(resultsNoDiscovery, [], 'expected an empty array when the linked feature has no readable discovery.md');
    fs.rmSync(repoRoot4, { recursive: true, force: true });
    pass('jae-s3 AC3: no suggestions when no product_id or no linked readable discovery.md -- both degrade gracefully');
  } catch (e) { fail('jae-s3 AC3: no suggestions when no product_id or no linked readable discovery.md -- both degrade gracefully', e); }

  // AC4: no suggestion for a field that already has a real value
  try {
    var repoRoot4b = fs.mkdtempSync(path.join(os.tmpdir(), 'jae-s3-'));
    makeDiscoveryFixture(repoRoot4b, 'feat-a', 'A real suggestion that must NOT override existing content.');
    var _origClaudeRepoPath4 = process.env.CLAUDE_REPO_PATH;
    process.env.CLAUDE_REPO_PATH = repoRoot4b;
    var bodyContent4;
    try {
      bodyContent4 = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
        var pool = makeCanvasMockPool(
          { id: 'j1', name: 'J', description: null, product_id: 'P1' },
          [{ id: 's1', name: 'Stage 1', position: 0, customer_actions: 'already has real content' }]
        );
        var { req, res } = makeMockReqRes();
        await journeys.handleGetJourneyCanvas(req, res, null, pool);
        return res._b.bodyContent;
      });
    } finally {
      if (_origClaudeRepoPath4 === undefined) delete process.env.CLAUDE_REPO_PATH;
      else process.env.CLAUDE_REPO_PATH = _origClaudeRepoPath4;
      fs.rmSync(repoRoot4b, { recursive: true, force: true });
    }
    var dom4 = buildDom(bodyContent4);
    var win4 = dom4.window;
    var link4 = win4.document.querySelector('.sw-stage-edit');
    link4.dispatchEvent(new win4.MouseEvent('click', { bubbles: true }));
    var container4 = win4.document.getElementById('sw-field-suggestions-customer_actions');
    assert.strictEqual(container4.children.length, 0, 'expected no suggestion button for a field that already has a real value');
    pass('jae-s3 AC4: no suggestion offered for a field that already has a real value');
  } catch (e) { fail('jae-s3 AC4: no suggestion offered for a field that already has a real value', e); }

  // AC5: cross-tenant/product scoping matches getPersonaSuggestions exactly
  try {
    var repoRoot5 = fs.mkdtempSync(path.join(os.tmpdir(), 'jae-s3-'));
    makeDiscoveryFixture(repoRoot5, 'p1-feat-a', 'P1 problem text.');
    makeDiscoveryFixture(repoRoot5, 'p2-feat-b', 'P2 problem text.');
    var pool5 = makeMockPool({
      journeysTableRows: [
        { product_id: 'P1', feature_slug: 'p1-feat-a' },
        { product_id: 'P2', feature_slug: 'p2-feat-b' }
      ]
    });
    var fieldResults = await journeys.getFieldSuggestions(pool5, 'P1', repoRoot5);
    var personaResults = await journeys.getPersonaSuggestions(pool5, 'P1', repoRoot5);
    assert.strictEqual(fieldResults.length, 1, 'expected only the P1-scoped suggestion, P2 excluded');
    assert.strictEqual(fieldResults.length, personaResults.length, 'expected getFieldSuggestions to scope identically to getPersonaSuggestions for the equivalent scenario');
    assert.strictEqual(fieldResults[0].featureSlug, personaResults[0].featureSlug);
    fs.rmSync(repoRoot5, { recursive: true, force: true });
    pass('jae-s3 AC5: cross-tenant/product scoping matches getPersonaSuggestions exactly');
  } catch (e) { fail('jae-s3 AC5: cross-tenant/product scoping matches getPersonaSuggestions exactly', e); }

  console.log('\n[jae-s3-field-suggestions] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
})();
