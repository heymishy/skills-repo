'use strict';
/**
 * src/web-ui/modules/migration-tracker.js — smt-s1
 *
 * Skips a migration's own DDL once it has already been applied, instead of
 * re-running CREATE TABLE/ALTER TABLE on every boot. No new npm dependency —
 * uses the same pool.query(sql, params) convention every other migration in
 * this codebase already uses.
 */

// Memoised per pool -- CREATE TABLE IF NOT EXISTS is idempotent, but issuing
// it on every single hasMigrationRun/recordMigrationRun call would itself be
// exactly the kind of redundant round-trip this story exists to eliminate,
// one level down. Ensured at most once per pool per process.
const _tableEnsured = new WeakSet();

async function ensureTable(pool) {
  if (_tableEnsured.has(pool)) {
    return;
  }
  await pool.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (' +
    'name TEXT PRIMARY KEY, ' +
    'applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()' +
    ')'
  );
  _tableEnsured.add(pool);
}

async function hasMigrationRun(pool, name) {
  await ensureTable(pool);
  const result = await pool.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
  return result.rows.length > 0;
}

async function recordMigrationRun(pool, name) {
  await ensureTable(pool);
  await pool.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
}

async function runMigrationOnce(pool, name, migrationFn) {
  const alreadyRun = await hasMigrationRun(pool, name);
  if (alreadyRun) {
    return;
  }
  await migrationFn();
  await recordMigrationRun(pool, name);
}

module.exports = { hasMigrationRun, recordMigrationRun, runMigrationOnce };
