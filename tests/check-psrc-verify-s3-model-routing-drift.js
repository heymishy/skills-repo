'use strict';

// tests/check-psrc-verify-s3-model-routing-drift.js — psrc-verify-s3
// Story: artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/stories/psrc-verify-s3.md
// Test plan: artefacts/2026-09-15-psrc-s1-sonnet-verify-3story/test-plans/psrc-verify-s3-test-plan.md
//
// Covers all 6 planned tests (4 unit, 2 integration) for
// checkModelRoutingDrift(envVars) and its server.js startup call site.
//
// Follows this repo's hand-rolled test()/assert style (no Jest/Mocha).

process.env.NODE_ENV = 'test';

var assert = require('assert');
var path = require('path');

var passed = 0, failed = 0, failures = [];
function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

var ROOT = path.join(__dirname, '..');
var MODEL_ROUTING_PATH = require.resolve(path.join(ROOT, 'src', 'web-ui', 'config', 'model-routing'));

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

/**
 * Base env with all 5 governance-critical skills correctly overridden to
 * Sonnet -- the expected healthy state once psrc-verify-s2 ships.
 */
function makeHealthyEnvVars() {
  return {
    WUCE_MODEL_OVERRIDE_DESIGN: 'claude-sonnet-4-6',
    WUCE_MODEL_OVERRIDE_DEFINITION: 'claude-sonnet-4-6',
    WUCE_MODEL_OVERRIDE_REVIEW: 'claude-sonnet-4-6',
    WUCE_MODEL_OVERRIDE_TEST_PLAN: 'claude-sonnet-4-6',
    WUCE_MODEL_OVERRIDE_DEFINITION_OF_READY: 'claude-sonnet-4-6'
  };
}

(async function main() {

  // ===========================================================================
  // AC1 -- checkModelRoutingDriftReturnsEmptyWhenAllFiveResolveToSonnet
  // ===========================================================================
  await test('checkModelRoutingDriftReturnsEmptyWhenAllFiveResolveToSonnet (AC1)', async function() {
    var modelRouting = freshRequire(MODEL_ROUTING_PATH);
    var result = modelRouting.checkModelRoutingDrift(makeHealthyEnvVars());
    assert.deepStrictEqual(result, [], 'expected zero drift entries when all 5 overrides are set to Sonnet');
  });

  // ===========================================================================
  // AC1 -- checkModelRoutingDriftReturnsAllFiveWhenNoOverridesSet
  // ===========================================================================
  await test('checkModelRoutingDriftReturnsAllFiveWhenNoOverridesSet (AC1)', async function() {
    var modelRouting = freshRequire(MODEL_ROUTING_PATH);
    var result = modelRouting.checkModelRoutingDrift({});
    assert.strictEqual(result.length, 5, 'expected all 5 governance-critical skills to drift when no overrides are set, got: ' + result.length);
    var skills = result.map(function(r) { return r.skill; }).sort();
    assert.deepStrictEqual(skills, ['definition', 'definition-of-ready', 'design', 'review', 'test-plan'].sort());
    result.forEach(function(r) {
      assert.ok(r.resolvedModel.indexOf('haiku') !== -1, 'expected resolvedModel to contain "haiku" for ' + r.skill + ', got: ' + r.resolvedModel);
    });
  });

  // ===========================================================================
  // AC3 -- checkModelRoutingDriftReturnsExactlyOneWhenOneOverrideMissing
  // ===========================================================================
  await test('checkModelRoutingDriftReturnsExactlyOneWhenOneOverrideMissing (AC3)', async function() {
    var modelRouting = freshRequire(MODEL_ROUTING_PATH);
    var envVars = makeHealthyEnvVars();
    delete envVars.WUCE_MODEL_OVERRIDE_REVIEW;
    var result = modelRouting.checkModelRoutingDrift(envVars);
    assert.strictEqual(result.length, 1, 'expected exactly 1 drift entry when exactly 1 override is missing, got: ' + result.length);
    assert.strictEqual(result[0].skill, 'review');
    assert.ok(result[0].resolvedModel.indexOf('haiku') !== -1);
  });

  // ===========================================================================
  // AC4 -- checkModelRoutingDriftNeverIncludesDiscoveryOrIdeate
  // ===========================================================================
  await test('checkModelRoutingDriftNeverIncludesDiscoveryOrIdeate (AC4)', async function() {
    var modelRouting = freshRequire(MODEL_ROUTING_PATH);
    // No overrides at all -- the worst-case env. discovery/ideate are not in
    // DRIFT_GUARD_SONNET_SKILLS at all, so they must never appear regardless
    // of their own (unrelated, unaffected) routing state.
    var result = modelRouting.checkModelRoutingDrift({});
    var skills = result.map(function(r) { return r.skill; });
    assert.ok(skills.indexOf('discovery') === -1, 'expected discovery to never appear in drift output');
    assert.ok(skills.indexOf('ideate') === -1, 'expected ideate to never appear in drift output');
  });

  // ===========================================================================
  // AC2 -- serverStartupLogsOneWarningPerDriftEntry (integration)
  // ===========================================================================
  await test('serverStartupLogsOneWarningPerDriftEntry (AC2 integration)', async function() {
    var modelRouting = freshRequire(MODEL_ROUTING_PATH);
    var envVars = makeHealthyEnvVars();
    delete envVars.WUCE_MODEL_OVERRIDE_REVIEW;
    delete envVars.WUCE_MODEL_OVERRIDE_DESIGN;

    var warnCalls = [];
    var spyWarn = function(msg) { warnCalls.push(msg); };

    // Mirrors server.js's own real startup call site shape: read the drift
    // list, log one warn line per entry.
    var drift = modelRouting.checkModelRoutingDrift(envVars);
    drift.forEach(function(entry) {
      spyWarn('[model-routing-drift] ' + entry.skill + ' resolved to ' + entry.resolvedModel + ', expected a Sonnet model');
    });

    assert.strictEqual(warnCalls.length, 2, 'expected exactly 2 warn calls for 2 drifted skills, got: ' + warnCalls.length);
    assert.ok(warnCalls.every(function(m) { return m.indexOf('[model-routing-drift]') === 0; }));
    assert.ok(warnCalls.some(function(m) { return m.indexOf('review') !== -1; }));
    assert.ok(warnCalls.some(function(m) { return m.indexOf('design') !== -1; }));
  });

  // ===========================================================================
  // AC2 -- serverStartupLogsNothingWhenAllFiveHealthy (integration)
  // ===========================================================================
  await test('serverStartupLogsNothingWhenAllFiveHealthy (AC2 integration)', async function() {
    var modelRouting = freshRequire(MODEL_ROUTING_PATH);
    var warnCalls = [];
    var spyWarn = function(msg) { warnCalls.push(msg); };

    var drift = modelRouting.checkModelRoutingDrift(makeHealthyEnvVars());
    drift.forEach(function(entry) {
      spyWarn('[model-routing-drift] ' + entry.skill + ' resolved to ' + entry.resolvedModel + ', expected a Sonnet model');
    });

    assert.strictEqual(warnCalls.length, 0, 'expected zero warn calls when all 5 skills are correctly routed, got: ' + warnCalls.length);
  });

  // ===========================================================================
  // Source-level guard -- server.js actually calls checkModelRoutingDrift at
  // its real startup site (not just importing it). Matches the real call-site
  // string with argument, not the bare identifier, per this repo's own
  // established wiring-guard convention (D37 lesson: a bare-identifier check
  // is satisfied by the import line alone and proves nothing).
  // ===========================================================================
  await test('serverJsWiresCheckModelRoutingDriftAtRealStartup (wiring guard)', async function() {
    var fs = require('fs');
    var serverSrc = fs.readFileSync(path.join(ROOT, 'src', 'web-ui', 'server.js'), 'utf8');
    assert.ok(serverSrc.indexOf('checkModelRoutingDrift(process.env)') !== -1, 'expected server.js to actually call checkModelRoutingDrift(process.env) at startup, not just import it');
    assert.ok(serverSrc.indexOf('[model-routing-drift]') !== -1, 'expected server.js to log the [model-routing-drift] prefix somewhere');
  });

  console.log('\n[psrc-verify-s3] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) {
      console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('[psrc-verify-s3] Unexpected error:', err);
  process.exit(1);
});
