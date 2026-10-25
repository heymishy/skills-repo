'use strict';

// sync-log.js — css-s2: writes reconciliation-gap entries to the shared
// sync_log table (migrated in server.js, shared with css-s3's own conflict
// entries via the entry_type discriminator). Mirrors journey-store-pg.js's
// own Pool/_setPoolForTesting convention exactly (own singleton pool, local-
// host SSL exemption, test-only override) -- NOT a D37 injectable adapter,
// since no new adapter seam is being introduced: the existing
// setPipelineStateWriter()/getPipelineStateWriter() seam in journey.js
// already satisfies D37 for this mechanism (see decisions.md ARCH entry,
// "css-s2, pre-code discovery").
//
// This module never accepts or stores a token/credential parameter -- its
// logReconciliationGap signature is deliberately
// (featureSlug, tenantId, gateName, storyId, stateUpdate) -- none of those
// 5 params is ever a token/credential.

const { Pool } = require('pg');

let _pool = null;
let _poolForTesting = null;

function _setPoolForTesting(pool) {
  _poolForTesting = pool;
}

// Mirrors journey-store-pg.js's own _isLocalHost exemption exactly -- a
// plain local Postgres rejects an SSL handshake outright, so this scopes the
// SSL option to non-local hosts only (ncdv-s2).
function _isLocalHost(connectionString) {
  try {
    const hostname = new URL(connectionString).hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]';
  } catch (_) {
    return false;
  }
}

function _getPool() {
  if (_poolForTesting) return _poolForTesting;
  if (!_pool && process.env.DATABASE_URL) {
    const poolConfig = {
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 10000
    };
    if (!_isLocalHost(process.env.DATABASE_URL)) {
      poolConfig.ssl = { rejectUnauthorized: false };
    }
    _pool = new Pool(poolConfig);
  }
  return _pool;
}

/**
 * Logs a reconciliation-gap entry: a pipeline-state.json write that failed
 * after its own writer's internal retries were exhausted (wsd-s2's
 * pipeline-state-github-writer.js already retries before this is ever
 * called). Can throw/reject on a real DB failure -- callers (journey.js's
 * `pipeline_state_write_failed` catch block) MUST wrap this call in their
 * own try/catch so a failed gap-log write doesn't turn their already-non-
 * blocking failure path into a hard failure.
 *
 * css-s4 correctness fix: storyId and stateUpdate are now stored alongside
 * gateName because they are the exact payload reconciliation.js's
 * reconcile() needs to replay LATER, from a different, subsequent request.
 * Without them, reconcile() had no way to know WHAT write actually failed --
 * it was substituting whatever storyId/stateUpdate the later, unrelated,
 * calling request happened to be writing at the time, and marking this
 * entry's own gap resolved on that unrelated success instead of on genuine
 * recovery of the data that was actually lost.
 * @param {string} featureSlug
 * @param {string|null} tenantId
 * @param {string} gateName - the gate/stage name that failed to sync (session.skillName)
 * @param {string} storyId - the story whose write failed; stored so reconcile() can replay against the SAME story, not whatever story a later request is writing
 * @param {object} stateUpdate - the write payload that failed; stored so reconcile() can replay the SAME write, not a later request's unrelated payload
 * @returns {Promise<void>}
 */
async function logReconciliationGap(featureSlug, tenantId, gateName, storyId, stateUpdate) {
  const pool = _getPool();
  if (!pool) return;
  // journey_value carries this gap entry's own context payload (gateName,
  // storyId, stateUpdate) -- all three are needed so a later reconcile()
  // call can replay THIS SPECIFIC failed write. pipeline_state_value/
  // resolved_value stay null for 'gap' entries, reserved for css-s3's
  // 'conflict' entries which populate all three columns for an actual
  // pipeline-state-vs-journey diff.
  await pool.query(
    'INSERT INTO sync_log (feature_slug, tenant_id, entry_type, journey_value, created_at) VALUES ($1, $2, $3, $4, NOW())',
    [featureSlug, tenantId || null, 'gap', JSON.stringify({ gateName: gateName, storyId: storyId, stateUpdate: stateUpdate })]
  );
}

/**
 * Logs a conflict entry: a genuine cross-surface disagreement where both
 * pipeline-state.json and the connected web-UI journey independently
 * changed since the last-synced marker, to DIFFERENT values. The resolved
 * value is always pipelineStateValue (css-s1's own ARCH decision:
 * pipeline-state.json is canonical). Can throw/reject on a real DB failure
 * -- same contract as logReconciliationGap; callers decide their own
 * error-handling strategy.
 * @param {string} featureSlug
 * @param {string|null} tenantId
 * @param {string} pipelineStateValue
 * @param {string} journeyValue
 * @param {string} resolvedValue
 * @returns {Promise<void>}
 */
async function logConflict(featureSlug, tenantId, pipelineStateValue, journeyValue, resolvedValue) {
  const pool = _getPool();
  if (!pool) return;
  await pool.query(
    'INSERT INTO sync_log (feature_slug, tenant_id, entry_type, pipeline_state_value, journey_value, resolved_value, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
    [featureSlug, tenantId || null, 'conflict', JSON.stringify(pipelineStateValue), JSON.stringify(journeyValue), JSON.stringify(resolvedValue)]
  );
}

/**
 * Finds the most recent unresolved 'gap' entry for a feature, or null.
 * css-s4: moved here from reconciliation.js (src/sync/reconciliation.js) so
 * this module remains the single owner of sync_log's schema/column
 * knowledge -- reconciliation.js now calls this function directly instead
 * of running its own SELECT against a pool it reached for independently.
 * css-s4 correctness fix: journey_value is now included in the SELECT so
 * the caller (reconciliation.js's reconcile()) can read back the gap's own
 * stored {gateName, storyId, stateUpdate} payload and replay the SPECIFIC
 * write that failed, instead of substituting a later, unrelated request's
 * own payload.
 * @param {string} featureSlug
 * @returns {Promise<{id:number, feature_slug:string, entry_type:string, created_at:string, resolved_at:null, journey_value:object}|null>}
 */
async function findOpenGap(featureSlug) {
  const pool = _getPool();
  if (!pool) return null;
  // journey_value is a JSONB column: a real Postgres connection (via `pg`)
  // auto-deserializes it into a plain JS object on the returned row, so
  // row.journey_value is already {gateName, storyId, stateUpdate} here --
  // no JSON.parse needed. A fake pool used in tests must mirror this by
  // putting a plain object (not a JSON string) in its mocked journey_value.
  const result = await pool.query(
    "SELECT id, feature_slug, entry_type, created_at, resolved_at, journey_value FROM sync_log WHERE feature_slug = $1 AND entry_type = 'gap' AND resolved_at IS NULL ORDER BY created_at DESC LIMIT 1",
    [featureSlug]
  );
  return result.rows[0] || null;
}

/**
 * Marks a 'gap' entry as resolved (sets resolved_at to NOW()).
 * css-s4: moved here from reconciliation.js for the same reason as
 * findOpenGap above -- see that function's comment.
 * @param {number} gapId
 * @returns {Promise<void>}
 */
async function markGapResolved(gapId) {
  const pool = _getPool();
  if (!pool) return;
  await pool.query('UPDATE sync_log SET resolved_at = NOW() WHERE id = $1', [gapId]);
}

// css-s4: _getPool is intentionally NOT exported -- nothing outside this
// file uses it any longer. reconciliation.js (src/sync/reconciliation.js)
// now calls findOpenGap()/markGapResolved() directly instead of reaching
// for the pool itself, matching conflict-resolver.js's own precedent of
// pure orchestration over this module's data-access functions, with no
// second override point for the same table.
module.exports = { logReconciliationGap, logConflict, findOpenGap, markGapResolved, _setPoolForTesting };
