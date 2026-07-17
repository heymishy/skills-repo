'use strict';

// tests/check-pr-s3-sync-freshness.js
// pr-s3 AC1, AC3 -- human-readable relative-time formatting for a product's
// last sync, and the explicit "Not yet synced" state when no sync has ever run.

var assert = require('assert');
var path = require('path');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    fn();
    passed++; console.log('  [PASS]', name);
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err.message);
  }
}

var MODULE_PATH = path.resolve(__dirname, '../src/web-ui/modules/sync-freshness.js');
var mod = require(MODULE_PATH);

console.log('\n[pr-s3] T1 -- formats a synced_at timestamp as a human-readable relative time (AC1)');
test('formatSyncedAt: 2 hours ago renders as a relative-time string mentioning hours', function() {
  var twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  var result = mod.formatSyncedAt(twoHoursAgo);
  assert.ok(/2 hours? ago/i.test(result), 'Expected a relative time mentioning "2 hours ago", got: ' + result);
});

test('formatSyncedAt: accepts an ISO string as well as a Date object', function() {
  var twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  var result = mod.formatSyncedAt(twoHoursAgo);
  assert.ok(/2 hours? ago/i.test(result), 'Expected a relative time mentioning "2 hours ago" for an ISO string input, got: ' + result);
});

test('formatSyncedAt: does not return a raw ISO timestamp or epoch number', function() {
  var result = mod.formatSyncedAt(new Date());
  assert.ok(!/^\d+$/.test(result), 'Expected a human string, not a raw epoch number: ' + result);
  assert.ok(!/^\d{4}-\d{2}-\d{2}T/.test(result), 'Expected a human string, not a raw ISO timestamp: ' + result);
});

console.log('\n[pr-s3] T2 -- shows a "Not yet synced" state when no synced_at value exists (AC3)');
test('formatSyncedAt: null/undefined input returns the explicit "Not yet synced" label', function() {
  assert.strictEqual(mod.formatSyncedAt(null), 'Not yet synced');
  assert.strictEqual(mod.formatSyncedAt(undefined), 'Not yet synced');
});

console.log('\n[pr-s3-sync-freshness] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failures.length) {
  failures.forEach(function(f) { console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err); });
}
process.exit(failed > 0 ? 1 : 0);
