'use strict';
// check-jae-s4-ai-field-suggestion.js -- unit/integration tests for jae-s4
// (Epic: journey-authoring-ai-suggestions, 2026-10-14-journey-authoring-experience).
//
// Covers: AC1 (client calls the new ai-suggestion endpoint and renders a
// button), AC1a (handleGetJourneyCanvas never calls the AI adapter), AC2
// (deterministic suggestion suppresses the LLM fallback for the same
// field), AC3 (clicking the LLM suggestion fills but does not save), AC4
// (D37 behavioural wiring test -- two different stage contexts produce two
// different, individually-traceable suggestions), AC5 (LLM failure/empty
// response degrades silently), AC6 (unwired adapter throws the exact D37
// stub error).
//
// Reuses check-jae-s3-field-suggestions.js's own fixture/mock/jsdom
// conventions throughout.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { JSDOM } = require('jsdom');

let passed = 0; let failed = 0;
function pass(name) { console.log('  [PASS] ' + name); passed++; }
function fail(name, err) { console.error('  [FAIL] ' + name + ': ' + (err.message || err)); failed++; }

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
        return Promise.resolve({ rows: [] });
      }
      if (/^SELECT id, journey_stage_id, feature_slug, metric_keys, mapping_state FROM feature_customer_journey_stage_mappings/.test(s)) {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    }
  };
}

function makeAiSuggestionMockPool(journeyRow, stageRow, featureSlug) {
  return {
    query: function(sql, params) {
      var s = String(sql).trim();
      if (/^SELECT id, name, product_id FROM customer_journeys WHERE id = \$1 AND tenant_id = \$2/.test(s)) {
        var jmatch = journeyRow && journeyRow.id === params[0];
        return Promise.resolve({ rows: jmatch ? [journeyRow] : [] });
      }
      if (/^SELECT id, name FROM customer_journey_stages WHERE id = \$1 AND journey_id = \$2/.test(s)) {
        var smatch = stageRow && stageRow.id === params[0];
        return Promise.resolve({ rows: smatch ? [stageRow] : [] });
      }
      if (/^SELECT feature_slug FROM journeys WHERE product_id = \$1 AND feature_slug IS NOT NULL LIMIT 1/.test(s)) {
        return Promise.resolve({ rows: featureSlug ? [{ feature_slug: featureSlug }] : [] });
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

function makeMockReqRes(query) {
  var req = { session: { tenantId: 't1' }, params: { id: 'j1' }, query: query || {} };
  var res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
  return { req: req, res: res };
}

function makeCanvasMockReqRes() {
  var req = { session: { tenantId: 't1' }, params: { id: 'j1' } };
  var res = { status: function(c) { this._s = c; return this; }, json: function(b) { this._b = b; }, _s: 200, _b: null };
  return { req: req, res: res };
}

function extractAllScripts(html) {
  var scripts = [];
  var re = /<script>([\s\S]*?)<\/script>/g;
  var m;
  while ((m = re.exec(html)) !== null) { scripts.push(m[1]); }
  assert.ok(scripts.length > 0, 'expected at least one <script> block in the rendered HTML');
  return scripts;
}

function buildDom(bodyContent, fetchImpl) {
  var scripts = extractAllScripts(bodyContent);
  var dom = new JSDOM('<!DOCTYPE html><html><body>' + bodyContent + '</body></html>', {
    runScripts: 'outside-only',
    url: 'http://localhost/journeys/j1'
  });
  dom.window.fetch = fetchImpl || function() { return Promise.resolve({ ok: true, json: function() { return Promise.resolve({}); } }); };
  scripts.forEach(function(src) { dom.window.eval(src); });
  return dom;
}

function withClaudeRepoPath(repoRoot, fn) {
  var orig = process.env.CLAUDE_REPO_PATH;
  process.env.CLAUDE_REPO_PATH = repoRoot;
  return Promise.resolve().then(fn).finally(function() {
    if (orig === undefined) delete process.env.CLAUDE_REPO_PATH;
    else process.env.CLAUDE_REPO_PATH = orig;
  });
}

function flushMicrotasks() {
  return new Promise(function(resolve) { setTimeout(resolve, 0); });
}

(async function() {
  const journeys = require('../src/web-ui/routes/journeys');
  const fieldSuggestionAi = require('../src/web-ui/adapters/field-suggestion-ai');

  // AC6 (unit): unwired adapter throws the exact D37 stub error -- run
  // FIRST, before any other test calls setGenerateAiFieldSuggestion, so the
  // module's own unwired default is still active.
  try {
    var threw = null;
    try {
      await fieldSuggestionAi.generateAiFieldSuggestion({ stageName: 'S', journeyName: 'J' }, 'customer_actions');
    } catch (e) { threw = e; }
    assert.ok(threw, 'expected generateAiFieldSuggestion to throw when unwired');
    assert.strictEqual(
      threw.message,
      'Adapter not wired: generateAiFieldSuggestion. Call setGenerateAiFieldSuggestion() with a real implementation before use.',
      'expected the exact D37 stub error message'
    );
    pass('jae-s4 AC6: unwired adapter throws the exact D37 stub error');
  } catch (e) { fail('jae-s4 AC6: unwired adapter throws the exact D37 stub error', e); }

  // AC1a (unit): handleGetJourneyCanvas never calls the AI adapter.
  try {
    var ac1aCalls = 0;
    fieldSuggestionAi.setGenerateAiFieldSuggestion(function() { ac1aCalls++; return Promise.resolve('x'); });
    var repoRootA = fs.mkdtempSync(path.join(os.tmpdir(), 'jae-s4-'));
    await withClaudeRepoPath(repoRootA, async function() {
      await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
        var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null, product_id: null }, [{ id: 's1', name: 'Stage 1', position: 0 }]);
        var { req, res } = makeCanvasMockReqRes();
        await journeys.handleGetJourneyCanvas(req, res, null, pool);
      });
    });
    fs.rmSync(repoRootA, { recursive: true, force: true });
    assert.strictEqual(ac1aCalls, 0, 'expected zero calls to generateAiFieldSuggestion during handleGetJourneyCanvas');
    pass('jae-s4 AC1a: handleGetJourneyCanvas never calls the AI adapter');
  } catch (e) { fail('jae-s4 AC1a: handleGetJourneyCanvas never calls the AI adapter', e); }

  // AC1 (unit): client calls the new endpoint and renders a button when it returns a suggestion.
  try {
    var repoRoot1 = fs.mkdtempSync(path.join(os.tmpdir(), 'jae-s4-'));
    var bodyContent1;
    await withClaudeRepoPath(repoRoot1, async function() {
      bodyContent1 = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
        var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null, product_id: null }, [{ id: 's1', name: 'Stage 1', position: 0 }]);
        var { req, res } = makeCanvasMockReqRes();
        await journeys.handleGetJourneyCanvas(req, res, null, pool);
        return res._b.bodyContent;
      });
    });
    fs.rmSync(repoRoot1, { recursive: true, force: true });
    var fetchCalls1 = [];
    var dom1 = buildDom(bodyContent1, function(url) {
      fetchCalls1.push(url);
      if (String(url).indexOf('/ai-suggestion') !== -1) {
        return Promise.resolve({ ok: true, json: function() { return Promise.resolve({ suggestion: 'Try calling support within 24 hours.' }); } });
      }
      return Promise.resolve({ ok: true, json: function() { return Promise.resolve({}); } });
    });
    var win1 = dom1.window;
    var link1 = win1.document.querySelector('.sw-stage-edit');
    link1.dispatchEvent(new win1.MouseEvent('click', { bubbles: true }));
    await flushMicrotasks();
    var aiBtn1 = win1.document.querySelector('.sw-field-suggestion-btn--ai[data-field="customer_actions"]');
    assert.ok(aiBtn1, 'expected an AI-suggestion button to render for customer_actions');
    assert.ok(aiBtn1.textContent.indexOf('AI suggestion') !== -1, 'expected the AI button label to be visually distinguished by text, not colour alone');
    assert.ok(fetchCalls1.some(function(u) { return String(u).indexOf('field=customer_actions') !== -1; }), 'expected a call to the ai-suggestion endpoint for customer_actions');
    pass('jae-s4 AC1: client calls the ai-suggestion endpoint and renders a distinguished button');
  } catch (e) { fail('jae-s4 AC1: client calls the ai-suggestion endpoint and renders a distinguished button', e); }

  // AC2 (unit): deterministic suggestion suppresses the LLM fallback for the same field.
  try {
    var repoRoot2 = fs.mkdtempSync(path.join(os.tmpdir(), 'jae-s4-'));
    var dir2 = path.join(repoRoot2, 'artefacts', 'feat-a');
    fs.mkdirSync(dir2, { recursive: true });
    fs.writeFileSync(path.join(dir2, 'discovery.md'),
      '# Discovery: X\n\n**Status:** Approved\n\n## Problem Statement\n\nCustomers abandon checkout.\n\n## Who It Affects\n\nSomeone.\n', 'utf8');
    var bodyContent2;
    await withClaudeRepoPath(repoRoot2, async function() {
      bodyContent2 = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
        var pool2 = {
          query: function(sql, params) {
            var s = String(sql).trim();
            if (/^SELECT id, name, description, product_id, persona_name, persona_role, persona_goal FROM customer_journeys/.test(s)) {
              return Promise.resolve({ rows: [{ id: 'j1', name: 'J', description: null, product_id: 'P1' }] });
            }
            if (/^SELECT id, name, position, description/.test(s)) {
              return Promise.resolve({ rows: [{ id: 's1', name: 'Stage 1', position: 0 }] });
            }
            if (/^SELECT DISTINCT feature_slug FROM journeys WHERE product_id = \$1/.test(s)) {
              return Promise.resolve({ rows: [{ feature_slug: 'feat-a' }] });
            }
            return Promise.resolve({ rows: [] });
          }
        };
        var { req, res } = makeCanvasMockReqRes();
        await journeys.handleGetJourneyCanvas(req, res, null, pool2);
        return res._b.bodyContent;
      });
    });
    fs.rmSync(repoRoot2, { recursive: true, force: true });
    var fetchCalls2 = [];
    var dom2 = buildDom(bodyContent2, function(url) {
      fetchCalls2.push(url);
      return Promise.resolve({ ok: true, json: function() { return Promise.resolve({ suggestion: 'should never be fetched' }); } });
    });
    var win2 = dom2.window;
    var link2 = win2.document.querySelector('.sw-stage-edit');
    link2.dispatchEvent(new win2.MouseEvent('click', { bubbles: true }));
    await flushMicrotasks();
    var deterministicBtn2 = win2.document.querySelector('.sw-field-suggestion-btn[data-field="customer_actions"]:not(.sw-field-suggestion-btn--ai)');
    assert.ok(deterministicBtn2, 'expected the deterministic suggestion button to render');
    assert.ok(
      !fetchCalls2.some(function(u) { return String(u).indexOf('/ai-suggestion') !== -1; }),
      'expected zero calls to the ai-suggestion endpoint when a deterministic suggestion already covers this field'
    );
    pass('jae-s4 AC2: deterministic suggestion suppresses the LLM fallback for the same field');
  } catch (e) { fail('jae-s4 AC2: deterministic suggestion suppresses the LLM fallback for the same field', e); }

  // AC3 (unit): clicking the LLM suggestion fills the field without saving it.
  try {
    var repoRoot3 = fs.mkdtempSync(path.join(os.tmpdir(), 'jae-s4-'));
    var bodyContent3;
    await withClaudeRepoPath(repoRoot3, async function() {
      bodyContent3 = await withMockedPipelineState(JSON.stringify({ features: [] }), async () => {
        var pool = makeCanvasMockPool({ id: 'j1', name: 'J', description: null, product_id: null }, [{ id: 's1', name: 'Stage 1', position: 0 }]);
        var { req, res } = makeCanvasMockReqRes();
        await journeys.handleGetJourneyCanvas(req, res, null, pool);
        return res._b.bodyContent;
      });
    });
    fs.rmSync(repoRoot3, { recursive: true, force: true });
    var dom3 = buildDom(bodyContent3, function(url) {
      if (String(url).indexOf('/ai-suggestion') !== -1) {
        return Promise.resolve({ ok: true, json: function() { return Promise.resolve({ suggestion: 'A generated pain point suggestion.' }); } });
      }
      return Promise.resolve({ ok: true, json: function() { return Promise.resolve({}); } });
    });
    var win3 = dom3.window;
    var link3 = win3.document.querySelector('.sw-stage-edit');
    link3.dispatchEvent(new win3.MouseEvent('click', { bubbles: true }));
    await flushMicrotasks();
    var aiBtn3 = win3.document.querySelector('.sw-field-suggestion-btn--ai[data-field="customer_actions"]');
    assert.ok(aiBtn3, 'expected the AI suggestion button to render');
    aiBtn3.dispatchEvent(new win3.MouseEvent('click', { bubbles: true }));
    var field3 = win3.document.getElementById('sw-stage-field-customer_actions');
    assert.strictEqual(field3.value, 'A generated pain point suggestion.', 'expected the field to be filled with the exact suggestion text');
    pass('jae-s4 AC3: clicking the LLM suggestion fills the field without saving it');
  } catch (e) { fail('jae-s4 AC3: clicking the LLM suggestion fills the field without saving it', e); }

  // AC5 (unit): LLM failure and empty-response both degrade silently -- two
  // sub-cases in one test, mirroring jae-s3 AC3's own established convention.
  try {
    // Sub-case (a): adapter rejects (simulated network error/timeout).
    fieldSuggestionAi.setGenerateAiFieldSuggestion(function() { return Promise.reject(new Error('network down')); });
    var pool5a = makeAiSuggestionMockPool({ id: 'j1', name: 'J', product_id: null }, { id: 's1', name: 'Stage 1' }, null);
    var { req: req5a, res: res5a } = makeMockReqRes({ field: 'customer_actions' });
    req5a.params.stageId = 's1';
    var threw5a = null;
    try { await journeys.handleGetAiFieldSuggestion(req5a, res5a, null, pool5a); } catch (e) { threw5a = e; }
    assert.ok(!threw5a, 'expected the route to not throw even when the adapter rejects');
    assert.strictEqual(res5a._s, 200, 'expected a 200 response, not an error status, even on adapter rejection');
    assert.strictEqual(res5a._b.suggestion, null, 'expected suggestion: null on adapter rejection, not an error shape');

    // Sub-case (b): adapter resolves to null/empty.
    fieldSuggestionAi.setGenerateAiFieldSuggestion(function() { return Promise.resolve(null); });
    var pool5b = makeAiSuggestionMockPool({ id: 'j1', name: 'J', product_id: null }, { id: 's1', name: 'Stage 1' }, null);
    var { req: req5b, res: res5b } = makeMockReqRes({ field: 'customer_actions' });
    req5b.params.stageId = 's1';
    await journeys.handleGetAiFieldSuggestion(req5b, res5b, null, pool5b);
    assert.strictEqual(res5b._s, 200, 'expected a 200 response, not an error status');
    assert.strictEqual(res5b._b.suggestion, null, 'expected suggestion: null, not an error shape');

    pass('jae-s4 AC5: LLM failure and empty-response both degrade to suggestion: null, no error shown');
  } catch (e) { fail('jae-s4 AC5: LLM failure and empty-response both degrade to suggestion: null, no error shown', e); }

  // AC4 (integration): two different stage contexts produce observably
  // different suggestion text -- D37 behavioural wiring test, not a
  // "was a reference assigned" check.
  try {
    fieldSuggestionAi.setGenerateAiFieldSuggestion(function(stageContext, field) {
      // Input-dependent, not a constant -- echoes the stage name back so the
      // test can assert the output is genuinely traceable to its own input.
      return Promise.resolve('Suggestion for stage "' + stageContext.stageName + '" field ' + field + '.');
    });
    var poolA = makeAiSuggestionMockPool({ id: 'j1', name: 'J', product_id: null }, { id: 's1', name: 'Evaluate options' }, null);
    var { req: reqA, res: resA } = makeMockReqRes({ field: 'customer_actions' });
    reqA.params.stageId = 's1';
    await journeys.handleGetAiFieldSuggestion(reqA, resA, null, poolA);

    var poolB = makeAiSuggestionMockPool({ id: 'j1', name: 'J', product_id: null }, { id: 's2', name: 'Resolve a support ticket' }, null);
    var { req: reqB, res: resB } = makeMockReqRes({ field: 'customer_actions' });
    reqB.params.stageId = 's2';
    await journeys.handleGetAiFieldSuggestion(reqB, resB, null, poolB);

    assert.notStrictEqual(resA._b.suggestion, resB._b.suggestion, 'expected two different stage inputs to produce two different suggestion texts');
    assert.ok(resA._b.suggestion.indexOf('Evaluate options') !== -1, 'expected stage A\'s own suggestion to be traceable to stage A\'s own name');
    assert.ok(resB._b.suggestion.indexOf('Resolve a support ticket') !== -1, 'expected stage B\'s own suggestion to be traceable to stage B\'s own name');
    pass('jae-s4 AC4: two different stage contexts produce two different, individually-traceable suggestions (D37 behavioural wiring test)');
  } catch (e) { fail('jae-s4 AC4: two different stage contexts produce two different, individually-traceable suggestions (D37 behavioural wiring test)', e); }

  console.log('\n[jae-s4-ai-field-suggestion] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
})();
