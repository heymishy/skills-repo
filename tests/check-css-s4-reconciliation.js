#!/usr/bin/env node
/**
 * check-css-s4-reconciliation.js
 *
 * Tests for css-s4's reconciliation safety net (AC2): catches a css-s2
 * in-request retry that was exhausted (a logged, unresolved sync_log gap),
 * and re-attempts the sync using a SUBSEQUENT live request's own token --
 * never a stored credential from the original failed attempt.
 *
 * Run: node tests/check-css-s4-reconciliation.js
 */
'use strict';

const syncLog = require('../src/web-ui/adapters/sync-log');
const reconciliation = require('../src/sync/reconciliation');

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function assert(label, condition, message) {
  if (condition) { totalPassed++; } else { totalFailed++; issues.push(`  ✗ [${label}] ${message}`); }
}

function makeFakePool(rows) {
  const calls = [];
  return {
    calls: calls,
    query: async function(sql, params) {
      calls.push({ sql, params });
      var sqlUpper = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
      if (sqlUpper.indexOf('SELECT') === 0) return { rows: rows || [] };
      return { rows: [] };
    }
  };
}

async function run() {
  console.log('\n[css-s4] reconciliation tests\n');

  // T1 (AC2): findOpenGap finds an unresolved gap entry for a feature
  await (async function T1() {
    const pool = makeFakePool([{ id: 42, feature_slug: 'test-feat', entry_type: 'gap', created_at: '2026-10-25T00:00:00Z', resolved_at: null }]);
    syncLog._setPoolForTesting(pool);
    const gap = await reconciliation.findOpenGap('test-feat');
    assert('T1-finds-gap', gap && gap.id === 42, `expected to find the open gap entry, got ${JSON.stringify(gap)}`);
    const selectCall = pool.calls.find(function(c) { return String(c.sql).toUpperCase().indexOf('SELECT') === 0; });
    assert('T1-queries-unresolved-only', String(selectCall.sql).toUpperCase().indexOf('RESOLVED_AT IS NULL') !== -1, 'expected the query to filter on resolved_at IS NULL');
  })();

  // T2 (AC2): findOpenGap returns null when no open gap exists
  await (async function T2() {
    const pool = makeFakePool([]);
    syncLog._setPoolForTesting(pool);
    const gap = await reconciliation.findOpenGap('test-feat-clean');
    assert('T2-no-gap-returns-null', gap === null, 'expected null when no open gap exists for this feature');
  })();

  // T3 (AC2): reconcile re-attempts using the CALLING request's own writer/context -- never a stored credential
  await (async function T3() {
    const pool = { calls: [], query: async function(sql, params) {
      this.calls.push({ sql, params });
      var sqlUpper = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
      if (sqlUpper.indexOf('SELECT') === 0) return { rows: [{ id: 99, feature_slug: 'test-feat-2', entry_type: 'gap', created_at: '2026-10-25T00:00:00Z', resolved_at: null }] };
      return { rows: [] };
    } };
    syncLog._setPoolForTesting(pool);

    let writerCalledWith = null;
    const mockWriter = async function(featureSlug, storyId, stateUpdate, context) {
      writerCalledWith = { featureSlug, storyId, stateUpdate, context };
      return { conflict: null };
    };

    const result = await reconciliation.reconcile('test-feat-2', 's1', { token: 'this-requests-own-live-token', owner: 'acme', repo: 'proj' }, mockWriter, { stage: 'definition' });

    assert('T3-calls-writer', !!writerCalledWith, 'expected reconcile to call the provided writer function');
    assert('T3-uses-live-context-token', writerCalledWith && writerCalledWith.context.token === 'this-requests-own-live-token', 'expected the writer to receive the same context object reconcile() was passed, unchanged (passthrough) -- reconcile() accepts no credential parameter of its own at all');
    assert('T3-marks-resolved', pool.calls.some(function(c) { return String(c.sql).toUpperCase().indexOf('UPDATE') === 0 && String(c.sql).toUpperCase().indexOf('RESOLVED_AT') !== -1; }), 'expected an UPDATE ... resolved_at query after a successful re-attempt');
    assert('T3-result-resolved-true', result.resolved === true, `expected result.resolved === true, got ${JSON.stringify(result)}`);
  })();

  // T4 (AC2): reconcile logs a fresh gap (does not mark resolved) if the re-attempt fails again
  await (async function T4() {
    const pool = { calls: [], query: async function(sql, params) {
      this.calls.push({ sql, params });
      var sqlUpper = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
      if (sqlUpper.indexOf('SELECT') === 0) return { rows: [{ id: 100, feature_slug: 'test-feat-3', entry_type: 'gap', created_at: '2026-10-25T00:00:00Z', resolved_at: null }] };
      return { rows: [] };
    } };
    syncLog._setPoolForTesting(pool);

    const failingWriter = async function() { throw new Error('simulated: re-attempt also failed'); };
    const result = await reconciliation.reconcile('test-feat-3', 's1', { token: 'tok', owner: 'acme', repo: 'proj' }, failingWriter, { stage: 'definition' });

    assert('T4-result-resolved-false', result.resolved === false, `expected result.resolved === false when the re-attempt itself fails, got ${JSON.stringify(result)}`);
    const resolveCall = pool.calls.find(function(c) { return String(c.sql).toUpperCase().indexOf('UPDATE') === 0 && String(c.sql).toUpperCase().indexOf('RESOLVED_AT') !== -1; });
    assert('T4-not-marked-resolved', !resolveCall, 'expected NO resolved_at UPDATE when the re-attempt itself failed -- the gap stays open for a future reconciliation attempt');
  })();

  console.log(`[css-s4] ${totalPassed} passed, ${totalFailed} failed\n`);
  if (issues.length > 0) {
    console.log(issues.join('\n'));
    console.log('');
  }
  process.exit(totalFailed === 0 ? 0 : 1);
}

run();
