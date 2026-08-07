'use strict';

/**
 * dsh-s5 -- archive session_turns rows older than 60 days out of the hot
 * table into session_turns_archive, so hot-table storage stays bounded even
 * as more stages complete over time, without ever permanently losing
 * conversation history (the archive table is never purged by this job --
 * see dsh-s5's Out of Scope).
 *
 * Mirrors scripts/purge-e2e-tenants.js's exact shape:
 *   - D37 injectable DB connection adapter (stub throws).
 *   - A pure exported async function doing the real work.
 *   - A withTimeout() guard so a hung DB connection can never consume the
 *     whole CI job's timeout budget.
 *   - A require.main === module CLI entrypoint that wires the real pg.Pool,
 *     never throws out of the main loop, and always exits 0.
 *
 * ADR-025 (multi-tenancy): archived rows retain their tenant_id verbatim --
 * archiving must never strip or alter tenant scoping.
 */

let _dbConnection = null;

function setDbConnection(adapter) {
  _dbConnection = adapter;
}

function requireDbConnection() {
  if (!_dbConnection) {
    throw new Error('Adapter not wired: dbConnection. Call setDbConnection() with a real implementation before use.');
  }
  return _dbConnection;
}

const DEFAULT_THRESHOLD_DAYS = 60;

// Hygiene job, not a hot path -- a moderate chunk size keeps any single
// transaction/lock window short (per the story's Performance NFR) without
// needing per-row round-trip tuning.
const BATCH_SIZE = 100;

/**
 * Move one eligible row from session_turns to session_turns_archive: insert
 * it into the archive table with identical columns -- including the
 * original created_at, since this is an archival move, not a re-timestamp --
 * then delete it from the hot table. Left to throw on failure; the caller
 * (archiveOldTurns) catches per-row so one bad row never aborts the batch
 * (AC4).
 * @param {object} db
 * @param {{id: number, journey_id: string, tenant_id: string, skill_name: string, turns: *, created_at: *}} row
 * @returns {Promise<void>}
 */
async function archiveRow(db, row) {
  await db.query(
    'INSERT INTO session_turns_archive (id, journey_id, tenant_id, skill_name, turns, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
    [row.id, row.journey_id, row.tenant_id, row.skill_name, row.turns, row.created_at]
  );
  await db.query('DELETE FROM session_turns WHERE id = $1', [row.id]);
}

/**
 * Find every session_turns row older than thresholdDays and move each one
 * to session_turns_archive, batching the work in chunks of BATCH_SIZE so no
 * single run holds a long-running lock on the hot table (Performance NFR).
 * A single row's failure is logged and the remaining eligible rows are
 * still processed (AC4) -- this is pure hygiene, not a correctness gate.
 * Zero eligible rows is logged explicitly, never a silent no-op (AC5).
 * @param {object} db
 * @param {number} [thresholdDays] defaults to 60
 * @returns {Promise<{archivedCount: number, errorCount: number, errors: Array<{id: *, message: string}>}>}
 */
async function archiveOldTurns(db, thresholdDays) {
  const threshold = thresholdDays === undefined ? DEFAULT_THRESHOLD_DAYS : thresholdDays;
  const result = await db.query(
    "SELECT id, journey_id, tenant_id, skill_name, turns, created_at FROM session_turns WHERE created_at < NOW() - ($1 * INTERVAL '1 day')",
    [threshold]
  );
  const rows = (result && result.rows) || [];

  if (rows.length === 0) {
    console.log('0 rows archived');
    return { archivedCount: 0, errorCount: 0, errors: [] };
  }

  let archivedCount = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    for (const row of batch) {
      try {
        await archiveRow(db, row);
        archivedCount++;
      } catch (err) {
        errors.push({ id: row.id, message: err.message });
        console.error(`archive-session-turns: failed to archive row id=${row.id}: ${err.message}`);
      }
    }
  }

  return { archivedCount, errorCount: errors.length, errors };
}

/**
 * Race a promise against a hard deadline. Copied verbatim from
 * scripts/purge-e2e-tenants.js -- that script's own comment documents the
 * originating CI incident (2026-07-26, PR #622): pg's Pool has no default
 * connection timeout, so a bad/unreachable DATABASE_URL hangs the
 * connection attempt forever rather than failing fast. connectionTimeoutMillis
 * alone did not fully close this (still observed a full-timeout hang), so
 * this is a second, independent guard at the call-site level -- this job is
 * pure hygiene and must never be able to consume the whole job's timeout
 * budget.
 * @param {Promise} promise
 * @param {number} ms
 * @param {string} label
 */
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(label + ' timed out after ' + ms + 'ms')), ms))
  ]);
}

if (require.main === module) {
  (async () => {
    // eslint-disable-next-line global-require
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    });
    setDbConnection(pool);
    try {
      const summary = await withTimeout(archiveOldTurns(requireDbConnection()), 60000, 'archiveOldTurns');
      console.log(`Archived ${summary.archivedCount} row(s), ${summary.errorCount} error(s)`);
      process.exitCode = 0;
    } catch (err) {
      // Never a hard failure here (D37-adjacent, but deliberately inverted):
      // this is pure post-run hygiene, not a correctness gate -- a failure
      // must be visible in the log but must never be able to fail the
      // scheduled job that runs it. See the scheduled workflow's own
      // continue-on-error, matching purge-e2e-tenants.js's own convention.
      console.error('archive-session-turns failed (non-blocking):', err.message);
      process.exitCode = 0;
    } finally {
      try { await withTimeout(pool.end(), 5000, 'pool.end'); } catch (_) {}
      process.exit(process.exitCode || 0);
    }
  })();
}

module.exports = {
  archiveOldTurns,
  archiveRow,
  setDbConnection,
  requireDbConnection,
  DEFAULT_THRESHOLD_DAYS
};
