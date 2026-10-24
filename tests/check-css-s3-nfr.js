#!/usr/bin/env node
/**
 * check-css-s3-nfr.js
 *
 * NFR tests for css-s3: Performance (bounded overhead), Security (no
 * credentials in conflict log entries), Audit (exactly one log entry per
 * genuine conflict).
 *
 * Run: node tests/check-css-s3-nfr.js
 */
'use strict';

const syncLog = require('../src/web-ui/adapters/sync-log');
const conflictResolver = require('../src/sync/conflict-resolver');

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
  console.log('\n[css-s3] NFR tests\n');

  // Performance: detectConflict is O(1), not a scan -- 1000 calls complete well under 100ms
  (function perfTest() {
    const start = process.hrtime();
    for (let i = 0; i < 1000; i++) {
      conflictResolver.detectConflict('last', 'a' + i, 'b' + i);
    }
    const diff = process.hrtime(start);
    const elapsedMs = diff[0] * 1000 + diff[1] / 1e6;
    assert('perf-bounded-overhead', elapsedMs < 100, `expected 1000 detectConflict calls to complete in under 100ms, took ${elapsedMs.toFixed(2)}ms`);
  })();

  // Security: a resolved conflict's logged entry contains no token/credential-shaped value
  await (async function securityTest() {
    const pool = makeFakePool();
    syncLog._setPoolForTesting(pool);
    await conflictResolver.resolveConflict('test-feat', null, 'definition-of-ready', 'review');
    const serialized = JSON.stringify(pool.calls[0].params);
    assert('security-no-credential-shaped-value', !/gh[pousr]_|Bearer |accessToken/i.test(serialized),
      `expected no token-shaped value in logged conflict params, got: ${serialized}`);
    assert('security-signature-no-token-param', conflictResolver.resolveConflict.length === 4,
      `expected resolveConflict(featureSlug, tenantId, pipelineStateValue, journeyValue) -- a 4-arg signature with no token parameter, got length ${conflictResolver.resolveConflict.length}`);
  })();

  // Audit: exactly one log entry per detected conflict -- not zero, not more than one
  await (async function auditTest() {
    const pool = makeFakePool();
    syncLog._setPoolForTesting(pool);
    await conflictResolver.resolveConflict('test-feat-2', null, 'branch-complete', 'test-plan');
    assert('audit-exactly-one-entry', pool.calls.length === 1, `expected exactly 1 sync_log write per resolved conflict, got ${pool.calls.length}`);
  })();

  console.log(`[css-s3] ${totalPassed} passed, ${totalFailed} failed\n`);
  if (issues.length > 0) {
    console.log(issues.join('\n'));
    console.log('');
  }
  process.exit(totalFailed === 0 ? 0 : 1);
}

run();
