#!/usr/bin/env node
/**
 * check-css-s3-conflict-resolver.js
 *
 * Unit tests for css-s3's conflict-resolver.js and sync-log.js's new
 * logConflict() export. Covers AC1-AC4.
 *
 * Run: node tests/check-css-s3-conflict-resolver.js
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
  console.log('\n[css-s3] conflict-resolver + sync-log.logConflict tests\n');

  // T0 (Task 2 red/green step): sync-log.js's new logConflict() writes an INSERT with all 3 value columns
  await (async function T0() {
    const pool = makeFakePool();
    syncLog._setPoolForTesting(pool);
    await syncLog.logConflict('test-feature-slug', 'tenant-abc', 'definition', 'review', 'definition');

    assert('T0-one-call', pool.calls.length === 1, `expected exactly 1 query call, got ${pool.calls.length}`);
    const call = pool.calls[0];
    const sqlUpper = String(call.sql).replace(/\s+/g, ' ').trim().toUpperCase();
    assert('T0-is-insert', sqlUpper.indexOf('INSERT') === 0, `expected an INSERT statement, got: ${sqlUpper}`);
    assert('T0-targets-sync-log', sqlUpper.indexOf('SYNC_LOG') !== -1, `expected the statement to target sync_log, got: ${sqlUpper}`);
    assert('T0-has-entry-type-conflict', call.params.indexOf('conflict') !== -1, "expected entry_type param to be 'conflict'");
    // logConflict JSON.stringify's each value before it reaches the params
    // array (correct -- these columns are JSONB, so a bare unquoted JS
    // string is not valid JSON; the param must itself be the JSON text
    // '"definition"'). Check the params array directly for that exact
    // element -- do NOT JSON.stringify(call.params) first, which would
    // double-encode and escape the inner quotes, hiding the literal match.
    assert('T0-has-pipeline-state-value', call.params.indexOf('"definition"') !== -1, 'expected pipeline_state_value/resolved_value (both JSON-encoded "definition") present in params');
    assert('T0-has-journey-value', call.params.indexOf('"review"') !== -1, 'expected journey_value (JSON-encoded "review") present in params');
  })();

  console.log(`[css-s3] ${totalPassed} passed, ${totalFailed} failed (partial — Task 2 only; Task 3 appends more below)\n`);
  if (issues.length > 0) {
    console.log(issues.join('\n'));
    console.log('');
  }
  process.exit(totalFailed === 0 ? 0 : 1);
}

run();
