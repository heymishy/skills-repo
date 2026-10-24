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
    await syncLog.logReconciliationGap('test-feature-slug', 'tenant-abc', 'discovery-approved');

    assert('T1-one-call', pool.calls.length === 1, `expected exactly 1 query call, got ${pool.calls.length}`);
    const call = pool.calls[0];
    const sqlUpper = String(call.sql).replace(/\s+/g, ' ').trim().toUpperCase();
    assert('T1-is-insert', sqlUpper.indexOf('INSERT') === 0, `expected an INSERT statement, got: ${sqlUpper}`);
    assert('T1-targets-sync-log', sqlUpper.indexOf('SYNC_LOG') !== -1, `expected the statement to target sync_log, got: ${sqlUpper}`);
    assert('T1-has-feature-slug', call.params.indexOf('test-feature-slug') !== -1, 'expected feature_slug param to be present');
    assert('T1-has-tenant-id', call.params.indexOf('tenant-abc') !== -1, 'expected tenant_id param to be present');
    assert('T1-has-entry-type-gap', call.params.indexOf('gap') !== -1, "expected entry_type param to be 'gap'");
  })();

  // T2: no token/credential-shaped value anywhere in the written params, and
  // the function's own signature never accepts one in the first place.
  await (async function T2() {
    assert('T2-signature-length', syncLog.logReconciliationGap.length === 3,
      `expected logReconciliationGap(featureSlug, tenantId, gateName) -- a 3-arg signature with no token parameter, got length ${syncLog.logReconciliationGap.length}`);

    const pool = makeFakePool();
    syncLog._setPoolForTesting(pool);
    await syncLog.logReconciliationGap('test-feature-slug-2', 'tenant-xyz', 'test-plan-complete');

    const call = pool.calls[0];
    const serialized = JSON.stringify(call.params);
    assert('T2-no-token-like-value', !/gh[pousr]_|Bearer |accessToken/i.test(serialized),
      `expected no token-shaped value in written params, got: ${serialized}`);
  })();

  // T3: tenantId may be null (feature with no tenant context) without throwing
  await (async function T3() {
    const pool = makeFakePool();
    syncLog._setPoolForTesting(pool);
    let threw = false;
    try {
      await syncLog.logReconciliationGap('test-feature-slug-3', null, 'discovery-approved');
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
