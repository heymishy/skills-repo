'use strict';
// check-lab-s3.1-credits-model.js — AC verification tests for lab-s3.1 (Credits table + plan data model)
// Tests T1.1–T1.3, T2.1, T4.1–T4.3, T5.1–T5.2, T6.1, T7.1
// Tests FAIL until scripts/migrate-schema-credits.js, src/web-ui/modules/credits.js exist.
// No real Postgres connections — all DB calls use mock clients.

// Set process.env BEFORE any require() of application code
process.env.DATABASE_URL = process.env.DATABASE_URL || '';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const path = require('path');
const fs   = require('fs');

const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function check(label, ok) {
  if (ok) {
    passed++;
    console.log('PASS:', label);
  } else {
    failed++;
    console.error('FAIL:', label);
  }
}

// ─── T1 + T2 — Migration script creates correct tables (mock Postgres) ───────

(async function testMigration() {
  console.log('\n── T1: Migration creates both tables ──');

  const sqlCalls = [];
  const mockPg = {
    query: async (sql) => { sqlCalls.push(sql); return { rows: [] }; },
    end:   async ()    => {}
  };

  // Require migration — it must export { migrate } accepting an optional dbOverride
  const migration = require(path.join(ROOT, 'scripts', 'migrate-schema-credits'));

  // T1.1 + T1.2 + T1.3 — run once
  await migration.migrate(mockPg);

  check(
    'migration SQL contains CREATE TABLE IF NOT EXISTS credits',
    sqlCalls.some(s => s.includes('credits') && s.includes('CREATE TABLE IF NOT EXISTS'))
  );

  check(
    'migration SQL contains CREATE TABLE IF NOT EXISTS stripe_events',
    sqlCalls.some(s => s.includes('stripe_events') && s.includes('CREATE TABLE IF NOT EXISTS'))
  );

  check(
    'migration SQL contains IF NOT EXISTS clause',
    sqlCalls.some(s => s.includes('IF NOT EXISTS'))
  );

  // T2 — Idempotent migration
  console.log('\n── T2: Idempotent migration ──');
  const sqlCalls2 = [];
  const mockPg2 = {
    query: async (sql) => { sqlCalls2.push(sql); return { rows: [] }; },
    end:   async ()    => {}
  };

  let threw = false;
  try {
    await migration.migrate(mockPg2);
    await migration.migrate(mockPg2);
  } catch (e) {
    threw = true;
  }
  check('second migration run does not throw', !threw);
})().then(runCreditsTests).catch(function(err) {
  console.error('Migration test setup error:', err.message);
  failed++;
  runCreditsTests();
});

async function runCreditsTests() {
  // ─── T4 — credits.js adapter (mock) ────────────────────────────────────────
  console.log('\n── T4: credits.js module functions ──');

  // Clear module cache to get a fresh module
  const creditsPath = require.resolve(path.join(ROOT, 'src', 'web-ui', 'modules', 'credits'));
  delete require.cache[creditsPath];
  const credits = require(creditsPath);

  const dbCalls = [];
  const mockAdapter = {
    query: async (sql, params) => {
      dbCalls.push({ sql, params });
      // Simulate getBalance returning 75
      if (sql.includes('SELECT')) return { rows: [{ balance: 75 }] };
      return { rows: [] };
    }
  };
  credits.setCreditsAdapter(mockAdapter);

  // T4.1 — getBalance returns balance from adapter
  let balance;
  try {
    balance = await credits.getBalance('test-tenant');
  } catch (e) {
    balance = null;
  }
  check('getBalance returns balance from adapter', balance === 75);

  // T4.2 — adjustBalance uses atomic UPDATE pattern
  dbCalls.length = 0; // reset
  try {
    await credits.adjustBalance('test-tenant', -50);
  } catch (e) {
    // ignore
  }
  const adjustCall = dbCalls[0] || { sql: '', params: [] };
  check(
    'adjustBalance uses atomic UPDATE pattern',
    adjustCall.sql.includes('balance = balance +') && adjustCall.sql.includes('UPDATE credits')
  );

  // T4.3 — adjustBalance passes delta as param
  check(
    'adjustBalance passes delta as param',
    Array.isArray(adjustCall.params) && adjustCall.params.includes(-50)
  );

  // ─── T5 — Default stub throws (D37) ─────────────────────────────────────────
  console.log('\n── T5: Default stub throws (D37) ──');

  delete require.cache[creditsPath];
  const creditsClean = require(creditsPath);

  // T5.1 — default adapter throws on getBalance
  let threwGetBalance = false;
  try {
    await creditsClean.getBalance('test');
  } catch (e) {
    threwGetBalance = e.message && e.message.includes('Adapter not wired');
  }
  check('default stub throws Adapter not wired (getBalance)', threwGetBalance);

  // T5.2 — default adapter throws on adjustBalance
  let threwAdjustBalance = false;
  try {
    await creditsClean.adjustBalance('test', -1);
  } catch (e) {
    threwAdjustBalance = e.message && e.message.includes('Adapter not wired');
  }
  check('default stub throws Adapter not wired (adjustBalance)', threwAdjustBalance);

  // ─── T6 — server.js wiring ────────────────────────────────────────────────
  console.log('\n── T6: server.js production wiring ──');

  const serverSrc = fs.readFileSync(path.join(ROOT, 'src', 'web-ui', 'server.js'), 'utf8');
  check('server.js calls setCreditsAdapter', serverSrc.includes('setCreditsAdapter'));
  check('server.js has Credits DB adapter wired log', serverSrc.includes('Credits DB adapter wired'));

  // ─── T7 — DATABASE_URL not in committed files ─────────────────────────────
  console.log('\n── T7: DATABASE_URL not in committed files ──');

  const { execSync } = require('child_process');
  let grepResult = '';
  try {
    grepResult = execSync('git grep DATABASE_URL -- src/ scripts/', { cwd: __dirname }).toString();
  } catch (_) {
    grepResult = '';
  }
  check('DATABASE_URL not in committed src/ or scripts/ files', grepResult.trim() === '');

  // ─── Results ─────────────────────────────────────────────────────────────
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}
