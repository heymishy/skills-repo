'use strict';
// check-wugs-s12-remove-db-tables.js — wugs-s12
//
// Confirms the standards/standard_product_optouts tables and every real
// code path that queried them are fully removed (AC1), the migration now
// drops them explicitly (AC3), and handleDeleteProduct's cleanup no longer
// references them (AC2, locked in here as a source-level sanity check
// alongside check-prc-s4.2-delete-product.js's own behavioural test).

var assert = require('assert');
var fs = require('fs');

var passed = 0;
var failed = 0;

function check(name, fn) {
  try { fn(); console.log('PASS:', name); passed++; }
  catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; }
}

var serverSrc = fs.readFileSync(require.resolve('../src/web-ui/server.js'), 'utf8');
var productsSrc = fs.readFileSync(require.resolve('../src/web-ui/routes/products.js'), 'utf8');
var cleanupScriptSrc = fs.readFileSync(require.resolve('../scripts/cleanup-e2e-staging-data.js'), 'utf8');

// ── AC3: CREATE TABLE lines gone, explicit DROP TABLE added, correct order ──
check('AC3: createTableLines_removedFromServerJs', function () {
  assert.ok(serverSrc.indexOf('CREATE TABLE IF NOT EXISTS standards') === -1, 'expected the standards CREATE TABLE to be removed');
  assert.ok(serverSrc.indexOf('CREATE TABLE IF NOT EXISTS standard_product_optouts') === -1, 'expected the standard_product_optouts CREATE TABLE to be removed');
});
check('AC3: dropTableStatements_addedInFkSafeOrder', function () {
  var optoutsDropIdx = serverSrc.indexOf('DROP TABLE IF EXISTS standard_product_optouts');
  var standardsDropIdx = serverSrc.indexOf('DROP TABLE IF EXISTS standards');
  assert.ok(optoutsDropIdx !== -1, 'expected an explicit DROP TABLE IF EXISTS standard_product_optouts');
  assert.ok(standardsDropIdx !== -1, 'expected an explicit DROP TABLE IF EXISTS standards');
  assert.ok(optoutsDropIdx < standardsDropIdx, 'expected standard_product_optouts (the FK-referencing table) to be dropped before standards');
});

// ── AC2 (source-level lock-in, complementing check-prc-s4.2's behavioural test) ──
check('AC2: handleDeleteProduct_noLongerReferencesRemovedTables', function () {
  var idx = productsSrc.indexOf('async function handleDeleteProduct');
  assert.ok(idx !== -1, 'expected to find handleDeleteProduct');
  var fnBody = productsSrc.slice(idx, idx + 1500);
  assert.ok(fnBody.indexOf('DELETE FROM standards') === -1, 'expected no DELETE FROM standards inside handleDeleteProduct');
  assert.ok(fnBody.indexOf('DELETE FROM standard_product_optouts') === -1, 'expected no DELETE FROM standard_product_optouts inside handleDeleteProduct');
});

// ── Real cross-reference #2: cleanup-e2e-staging-data.js also cleaned up ──
check('AC1: cleanupScript_noLongerReferencesRemovedTables', function () {
  assert.ok(cleanupScriptSrc.indexOf('DELETE FROM standards') === -1, 'expected no DELETE FROM standards in cleanup-e2e-staging-data.js');
  assert.ok(cleanupScriptSrc.indexOf('DELETE FROM standard_product_optouts') === -1, 'expected no DELETE FROM standard_product_optouts in cleanup-e2e-staging-data.js');
});

// ── Real cross-reference #3: dead setStandardsAdapter Postgres wiring gone ──
check('AC1: standardsAdapterPostgresWiring_removedFromServerJs', function () {
  assert.ok(serverSrc.indexOf('setStandardsAdapter(async function') === -1, 'expected the real Postgres setStandardsAdapter wiring to be removed');
});

// ── AC1: repo-wide grep, the REAL complete removal list ────────────────────
check('AC1: noReferencesToRemovedTables_inSrcOrScripts', function () {
  var { execSync } = require('child_process');
  // review fix -- the trailing (?!.*wugs-s12) negative lookahead was dead:
  // POSIX ERE (grep -E) does not support lookahead at all, so that
  // alternative silently never matched anything, in every case, not just
  // the tagged-exclusion case it looked like it was allowing. There is no
  // legitimate reason to allow ANY CREATE TABLE mentioning standards in
  // src/ or scripts/ regardless of comment tagging, so the exclusion was
  // never actually needed -- removed rather than reimplemented.
  var pattern = 'FROM standards\\b|INTO standards\\b|UPDATE standards\\b|UPDATE standard_product_optouts\\b|CREATE TABLE.*\\bstandards\\b|FROM standard_product_optouts|INTO standard_product_optouts';
  var raw;
  try {
    raw = execSync('grep -rn -E "' + pattern + '" src/ scripts/', { cwd: require('path').join(__dirname, '..'), encoding: 'utf8' });
  } catch (e) {
    if (e.status !== 1) { throw e; }
    raw = '';
  }
  var offendingLines = raw.split('\n').filter(function (line) { return line.trim(); });
  assert.strictEqual(offendingLines.length, 0, 'expected zero live references to the removed tables in src/ or scripts/, found:\n' + offendingLines.join('\n'));
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
