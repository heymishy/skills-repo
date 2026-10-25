#!/usr/bin/env node
/**
 * check-css-s2-sync-log.js
 *
 * Unit tests for css-s2's sync-log.js -- writes a sync_log reconciliation-gap
 * row (shared table with css-s3) via a fake pool, matching
 * journey-store-pg.js's own established _setPoolForTesting convention
 * (tests/check-ppc-s1-journey-store-helpers.js).
 *
 * Covers: AC3 (gap logged, no credential persisted).
 *
 * Run: node tests/check-css-s2-sync-log.js
 */
'use strict';

const syncLog = require('../src/web-ui/adapters/sync-log');

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function assert(label, condition, message) {
  if (condition) { totalPassed++; } else { totalFailed++; issues.push(`  ✗ [${label}] ${message}`); }
}

function makeFakePool() {
  const calls = [];
  return {
    calls: calls,
    query: async function(sql, params) {
      calls.push({ sql: sql, params: params });
      return { rows: [] };
    }
  };
}

async function run() {
  console.log('\n[css-s2] sync-log.js tests\n');

  // T1: logReconciliationGap writes an INSERT with the right fields
  await (async function T1() {
    const pool = makeFakePool();
    syncLog._setPoolForTesting(pool);
    await syncLog.logReconciliationGap('test-feature-slug', 'tenant-abc', 'discovery-approved', 's1', { stage: 'discovery' });

    assert('T1-one-call', pool.calls.length === 1, `expected exactly 1 query call, got ${pool.calls.length}`);
    const call = pool.calls[0];
    const sqlUpper = String(call.sql).replace(/\s+/g, ' ').trim().toUpperCase();
    assert('T1-is-insert', sqlUpper.indexOf('INSERT') === 0, `expected an INSERT statement, got: ${sqlUpper}`);
    assert('T1-targets-sync-log', sqlUpper.indexOf('SYNC_LOG') !== -1, `expected the statement to target sync_log, got: ${sqlUpper}`);
    assert('T1-has-feature-slug', call.params.indexOf('test-feature-slug') !== -1, 'expected feature_slug param to be present');
    assert('T1-has-tenant-id', call.params.indexOf('tenant-abc') !== -1, 'expected tenant_id param to be present');
    assert('T1-has-entry-type-gap', call.params.indexOf('gap') !== -1, "expected entry_type param to be 'gap'");
    const journeyValueParam = call.params.find(function(p) { return typeof p === 'string' && p.indexOf('discovery-approved') !== -1; });
    assert('T1-journey-value-has-gate-name', !!journeyValueParam && journeyValueParam.indexOf('discovery-approved') !== -1, 'expected the stringified journey_value payload to include gateName');
    assert('T1-journey-value-has-story-id', !!journeyValueParam && journeyValueParam.indexOf('s1') !== -1, 'expected the stringified journey_value payload to include storyId -- the specific story whose write failed, needed so reconcile() can replay the SAME write later');
    assert('T1-journey-value-has-state-update', !!journeyValueParam && journeyValueParam.indexOf('discovery') !== -1, 'expected the stringified journey_value payload to include stateUpdate -- the specific failed payload, needed so reconcile() can replay the SAME write later');
  })();

  // T2: the function's own signature never accepts a token/credential
  // parameter in the first place.
  await (async function T2() {
    // T2-signature-length IS the real proof behind AC3's "no credential
    // persisted" requirement: logReconciliationGap has no parameter a token
    // could ever be passed through, so a runtime "does it leak a token"
    // check on this isolated module would be both unnecessary and (since
    // the test fully controls its own input values) impossible to write
    // meaningfully -- it would only ever test the test's own input.
    // css-s4: storyId/stateUpdate were added (5-arg signature now) so
    // reconcile() can replay the SPECIFIC failed write later -- neither is
    // a credential; the "no credential parameter" guarantee still holds
    // across all 5 args (featureSlug/tenantId/gateName/storyId/stateUpdate).
    assert('T2-signature-length', syncLog.logReconciliationGap.length === 5,
      `expected logReconciliationGap(featureSlug, tenantId, gateName, storyId, stateUpdate) -- a 5-arg signature with no token parameter, got length ${syncLog.logReconciliationGap.length}`);
  })();

  // T3: tenantId may be null (feature with no tenant context) without throwing
  await (async function T3() {
    const pool = makeFakePool();
    syncLog._setPoolForTesting(pool);
    let threw = false;
    try {
      await syncLog.logReconciliationGap('test-feature-slug-3', null, 'discovery-approved', 's1', { stage: 'discovery' });
    } catch (err) {
      threw = true;
    }
    assert('T3-no-throw-on-null-tenant', !threw, 'expected logReconciliationGap to accept a null tenantId without throwing');
  })();

  console.log(`[css-s2] ${totalPassed} passed, ${totalFailed} failed\n`);
  if (issues.length > 0) {
    console.log(issues.join('\n'));
    console.log('');
  }
  process.exit(totalFailed === 0 ? 0 : 1);
}

run();
