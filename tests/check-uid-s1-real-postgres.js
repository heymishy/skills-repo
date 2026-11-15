'use strict';
// uid-s1 -- proves against a REAL Postgres that comparing a uuid column with a non-uuid value raises the error shape
// the classifier in src/web-ui/utils/invalid-id-error.js parses (SQLSTATE 22P02, message 'invalid input syntax for
// type uuid: "<value>"'). Plain Node script. Run: node tests/check-uid-s1-real-postgres.js
//
// Needs   UID_TEST_DATABASE_URL=postgres://postgres:test@127.0.0.1:25432/postgres   (a THROWAWAY local Postgres)
// and prints SKIPPED without it: a SKIPPED line is not a pass. Refuses any database that is not local.

const assert = require('assert');

const DB_URL = process.env.UID_TEST_DATABASE_URL;
function isLocalDbUrl(url) {
  let u;
  try { u = new URL(url); } catch (e) { return false; }
  return ['127.0.0.1', 'localhost', '[::1]', '::1'].indexOf(u.hostname) !== -1;
}

(async () => {
  if (!DB_URL) { console.log('  SKIPPED P1 (set UID_TEST_DATABASE_URL to a throwaway local Postgres to run it)'); console.log('[uid-s1-real-postgres] Results: 0 passed, 0 failed, 1 skipped'); return; }
  if (!isLocalDbUrl(DB_URL)) { console.log('  FAIL refusing to run against a non-local database'); console.log('[uid-s1-real-postgres] Results: 0 passed, 1 failed'); process.exit(1); }
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: DB_URL });
  let failed = 0;
  try {
    await pool.query('DROP TABLE IF EXISTS uid_s1_t');
    await pool.query('CREATE TABLE uid_s1_t (id UUID PRIMARY KEY DEFAULT gen_random_uuid())');
    let m; try { m = require('../src/web-ui/utils/invalid-id-error'); } catch (e) { m = null; }
    for (const value of ['not-a-uuid', '%00', '%E0%A4%A', "' OR 1=1 --"]) {
      try {
        await pool.query('SELECT * FROM uid_s1_t WHERE id = $1', [value]);
        throw new Error('expected a rejection for ' + value);
      } catch (err) {
        try {
          assert.strictEqual(err.code, '22P02', 'code was ' + err.code + ' (' + err.message + ')');
          assert.ok(err.message.indexOf('invalid input syntax for type uuid: "' + value + '"') !== -1, 'message was ' + err.message);
          assert.ok(m && m.isInvalidIdError(err, { url: '/products/' + encodeURIComponent(value) }) === true, 'classifier must match the real error');
          console.log('  ok   P1 real Postgres error for ' + JSON.stringify(value));
        } catch (assertErr) { failed++; console.log('  FAIL P1 ' + JSON.stringify(value) + ' -- ' + assertErr.message); }
      }
    }
  } finally { try { await pool.query('DROP TABLE IF EXISTS uid_s1_t'); } catch (e) {} await pool.end(); }
  console.log('[uid-s1-real-postgres] Results: ' + (4 - failed) + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
