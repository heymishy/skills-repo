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
  console.log('\n[css-s3] conflict-resolver + sync-log.logConflict tests\n');

  // T0: sync-log.js's logConflict() writes an INSERT with all 3 value columns
  await (async function T0() {
    const pool = makeFakePool();
    syncLog._setPoolForTesting(pool);
    // Three DISTINCT values (not pipelineStateValue === resolvedValue) so
    // each param position is independently checked -- a transposition bug
    // (e.g. writing pipelineStateValue into both the $4 and $6 slots
    // instead of resolvedValue) would otherwise pass undetected, exactly
    // the "proves presence, not correct wiring" weak-test shape CLAUDE.md's
    // D37 rule warns about (tir-s1/tir-s5).
    await syncLog.logConflict('test-feature-slug', 'tenant-abc', 'definition', 'review', 'resolved-result');

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
    assert('T0-has-pipeline-state-value', call.params.indexOf('"definition"') !== -1, 'expected pipeline_state_value (JSON-encoded "definition") present in params');
    assert('T0-has-journey-value', call.params.indexOf('"review"') !== -1, 'expected journey_value (JSON-encoded "review") present in params');
    assert('T0-has-resolved-value', call.params.indexOf('"resolved-result"') !== -1, 'expected resolved_value (JSON-encoded "resolved-result") present in params, distinct from pipeline_state_value -- catches a transposition bug the original duplicate-value fixture could not');
  })();

  // T1 (AC1): detectConflict flags a genuine conflict when both sides moved to DIFFERENT values
  (function T1() {
    const result = conflictResolver.detectConflict('test-plan', 'definition-of-ready', 'review');
    assert('T1-flags-conflict', !!result, 'expected a truthy conflict object when both sides moved to different values since the last-synced marker');
    assert('T1-pipeline-state-value', result && result.pipelineStateValue === 'definition-of-ready', 'expected conflict.pipelineStateValue to be the pipeline-state.json side');
    assert('T1-journey-value', result && result.journeyValue === 'review', 'expected conflict.journeyValue to be the journey side');
  })();

  // T2 (AC4 negative control): only ONE side moved since last sync -> no conflict
  (function T2() {
    const result = conflictResolver.detectConflict('test-plan', 'definition-of-ready', 'test-plan');
    assert('T2-no-conflict-single-sided', result === null, 'expected null when only the pipeline-state.json side moved and the journey side still matches the last-synced marker');
  })();

  // T2b: both sides moved but to the SAME value -> no conflict (genuine agreement, not a disagreement)
  (function T2b() {
    const result = conflictResolver.detectConflict('test-plan', 'review', 'review');
    assert('T2b-no-conflict-same-value', result === null, 'expected null when both sides independently moved to the SAME value -- agreement, not a conflict');
  })();

  // T2c: neither side moved since last sync -> no conflict
  (function T2c() {
    const result = conflictResolver.detectConflict('test-plan', 'test-plan', 'test-plan');
    assert('T2c-no-conflict-unchanged', result === null, 'expected null when neither side has moved since the last-synced marker');
  })();

  // T3 (AC2): resolveConflict always returns pipeline-state.json's value as the winner
  await (async function T3() {
    const pool = makeFakePool();
    syncLog._setPoolForTesting(pool);
    const resolved = await conflictResolver.resolveConflict('test-feature-slug', null, 'definition-of-ready', 'review');
    assert('T3-resolves-to-pipeline-state-value', resolved === 'definition-of-ready', `expected the resolved value to be pipeline-state.json's own value "definition-of-ready", got "${resolved}"`);
  })();

  // T4 (AC3): resolveConflict logs both values and the winner
  await (async function T4() {
    const pool = makeFakePool();
    syncLog._setPoolForTesting(pool);
    await conflictResolver.resolveConflict('test-feature-slug-2', 'tenant-xyz', 'branch-complete', 'test-plan');

    assert('T4-one-log-call', pool.calls.length === 1, `expected exactly 1 sync_log write, got ${pool.calls.length}`);
    assert('T4-logs-feature-slug', pool.calls[0].params.indexOf('test-feature-slug-2') !== -1, 'expected feature_slug in logged params');
    // logConflict JSON.stringify's each value (JSONB columns) -- check the
    // params array directly for the JSON-encoded element, not a
    // JSON.stringify(params) re-serialization (same fix as T0 above).
    assert('T4-logs-both-values', pool.calls[0].params.indexOf('"branch-complete"') !== -1 && pool.calls[0].params.indexOf('"test-plan"') !== -1, 'expected both divergent values logged');
    assert('T4-logs-timestamp-via-now', String(pool.calls[0].sql).indexOf('NOW()') !== -1, 'expected the INSERT to populate created_at via NOW()');
  })();

  // AC4's "no conflict log entry for an ordinary single-sided sync" claim is
  // ALREADY proven at the unit level by T2/T2b/T2c above (detectConflict
  // returns null for those inputs). A test reproducing the real call site's
  // own "if (conflict) resolveConflict(...)" pattern INSIDE this test file
  // would be tautological -- the decision of whether to call resolveConflict
  // is made by code outside this module (journey-sync-client.js /
  // pipeline-state-github-writer.js), not by conflict-resolver.js itself.
  // The genuine, non-vacuous proof that NO log entry is written for an
  // ordinary single-sided sync lives in Task 4's own integration test
  // (tests/check-css-s3-pipeline-state-conflict-wiring.js, T2), which
  // exercises the real wired call site end-to-end. Removed a prior,
  // tautological T5 here during Task 3's own code-quality review (it
  // reused T2's identical inputs and its own "zero writes" assertion was
  // guaranteed by the test's own conditional, not by any code under test).

  console.log(`[css-s3] ${totalPassed} passed, ${totalFailed} failed\n`);
  if (issues.length > 0) {
    console.log(issues.join('\n'));
    console.log('');
  }
  process.exit(totalFailed === 0 ? 0 : 1);
}

run();
