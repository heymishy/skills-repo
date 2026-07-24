'use strict';
// clean-e2e-staging-data.js — tdc-s1
//
// Identifies and (optionally) removes journeys/artefacts rows in a real
// Postgres database that were created by E2E test runs against a deployed
// environment (e.g. wuce-staging).
//
// Safe-identification rule: every E2E-generated identity is tagged with an
// "e2e-test-" prefix (tests/e2e/fixtures/staging-auth.js — GitHub stub
// logins: "e2e-test-gh-...", email signups: "e2e-test-...@example.test").
// Since tenant_id and owner_id are both set from the signed-in user's own
// login (src/web-ui/routes/auth.js, auth-stub.js: req.session.tenantId =
// user.login), matching that exact prefix on either column is a narrow,
// false-positive-free way to find E2E-created rows — no other identifier
// or heuristic is used, and there is no "delete everything" mode.
//
// Dry-run by default — prints a report and issues no DELETE. Pass --confirm
// to actually delete the matched rows (artefacts first, by journey_id FK,
// then journeys).
//
// Requires DATABASE_URL in the environment (the operator's own staging
// connection string — never hardcoded, never logged in full).
//
// Usage: DATABASE_URL=... node scripts/clean-e2e-staging-data.js [--confirm]

var MATCH_PREFIX = 'e2e-test-';

function buildSelectQuery() {
  return {
    text: 'SELECT journey_id, tenant_id, owner_id, feature_slug, created_at FROM journeys WHERE tenant_id LIKE $1 OR owner_id LIKE $1 ORDER BY created_at ASC',
    values: [MATCH_PREFIX + '%']
  };
}

async function run(pool, options) {
  options = options || {};
  var confirm = !!options.confirm;

  var selectQuery = buildSelectQuery();
  var result = await pool.query(selectQuery.text, selectQuery.values);
  var rows = (result && result.rows) || [];

  if (rows.length === 0) {
    return { matchedCount: 0, deleted: false, rows: [] };
  }

  if (!confirm) {
    return { matchedCount: rows.length, deleted: false, rows: rows };
  }

  var journeyIds = rows.map(function(r) { return r.journey_id; });
  await pool.query('DELETE FROM artefacts WHERE journey_id = ANY($1)', [journeyIds]);
  await pool.query('DELETE FROM journeys WHERE journey_id = ANY($1)', [journeyIds]);

  return { matchedCount: rows.length, deleted: true, rows: rows };
}

function printReport(reportResult, confirmRequested) {
  if (reportResult.matchedCount === 0) {
    console.log('[clean-e2e-staging-data] No e2e-test-tagged journeys found.');
    return;
  }
  console.log('[clean-e2e-staging-data] ' + (reportResult.deleted ? 'Deleted' : 'Would delete') + ' ' + reportResult.matchedCount + ' journey' + (reportResult.matchedCount === 1 ? '' : 's') + ':');
  reportResult.rows.forEach(function(r) {
    console.log('  ' + r.journey_id + '  tenant=' + r.tenant_id + '  owner=' + r.owner_id + '  feature=' + r.feature_slug + '  created=' + r.created_at);
  });
  if (!reportResult.deleted && confirmRequested === false) {
    console.log('\nDry run only — pass --confirm to actually delete these.');
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('[clean-e2e-staging-data] DATABASE_URL is not set. Refusing to run — supply the target database\'s connection string in the environment first.');
    process.exitCode = 1;
    return;
  }

  var confirm = process.argv.includes('--confirm');
  var Pool = require('pg').Pool;
  var pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });

  try {
    var reportResult = await run(pool, { confirm: confirm });
    printReport(reportResult, confirm);
  } finally {
    await pool.end();
  }
}

module.exports = { run: run, buildSelectQuery: buildSelectQuery, MATCH_PREFIX: MATCH_PREFIX };

if (require.main === module) {
  main().catch(function(err) {
    console.error('[clean-e2e-staging-data] Failed: ' + (err && err.message || err));
    process.exitCode = 1;
  });
}
