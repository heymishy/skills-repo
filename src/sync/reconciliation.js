'use strict';

// reconciliation.js — css-s4: the reconciliation safety net (AC2). When a
// css-s2 in-request retry was exhausted (a sync_log 'gap' entry was
// logged), this module is called opportunistically from a SUBSEQUENT live,
// authenticated request touching the same feature -- never a scheduled
// background job, and never a stored credential (ADR-020 / this epic's own
// established no-stored-credential constraint, see decisions.md). Reuses
// whatever live context/token the CALLING request already has.
//
// css-s4 build-time correction: reuses sync-log.js's own Pool/testing
// convention directly, via its exported _getPool(), rather than opening a
// second, independent Postgres connection pool to the same sync_log table
// -- same "no new adapter seam" reasoning conflict-resolver.js already
// documents for itself. _setPoolForTesting below is kept for interface
// symmetry/direct-override use; when not explicitly set, this module falls
// through to sync-log.js's own pool (and its own test override).

var syncLog = require('../web-ui/adapters/sync-log');

let _poolForTesting = null;

function _setPoolForTesting(pool) {
  _poolForTesting = pool;
}

function _getPool() {
  if (_poolForTesting) return _poolForTesting;
  return syncLog._getPool();
}

/**
 * Finds the most recent unresolved 'gap' entry for a feature, or null.
 * @param {string} featureSlug
 * @returns {Promise<{id:number, feature_slug:string, entry_type:string, created_at:string, resolved_at:null}|null>}
 */
async function findOpenGap(featureSlug) {
  var pool = _getPool();
  if (!pool) return null;
  var result = await pool.query(
    "SELECT id, feature_slug, entry_type, created_at, resolved_at FROM sync_log WHERE feature_slug = $1 AND entry_type = 'gap' AND resolved_at IS NULL ORDER BY created_at DESC LIMIT 1",
    [featureSlug]
  );
  return result.rows[0] || null;
}

/**
 * Re-attempts a pipeline-state.json write for a feature with an open gap,
 * using the CALLING request's own live writer/context -- reconcile() never
 * accepts or stores a credential of its own; `writerFn` and `context` are
 * both supplied fresh by the caller on every invocation.
 * @param {string} featureSlug
 * @param {string} storyId
 * @param {object} context - the CALLING request's own live _pipelineStateContext (token/owner/repo)
 * @param {Function} writerFn - the CALLING request's own already-wired _pipelineStateWriter
 * @param {object} stateUpdate - the write payload for the re-attempt
 * @returns {Promise<{resolved: boolean}>}
 */
async function reconcile(featureSlug, storyId, context, writerFn, stateUpdate) {
  var pool = _getPool();
  if (!pool) return { resolved: false };

  var gap = await findOpenGap(featureSlug);
  if (!gap) return { resolved: false };

  try {
    await writerFn(featureSlug, storyId, stateUpdate, context);
    await pool.query('UPDATE sync_log SET resolved_at = NOW() WHERE id = $1', [gap.id]);
    return { resolved: true };
  } catch (reconcileErr) {
    // Re-attempt itself failed -- the gap stays open (resolved_at untouched)
    // for a future reconciliation attempt. Never throw -- this is an
    // opportunistic, best-effort check layered onto an already-successful
    // request; it must never turn that request into a failure.
    return { resolved: false };
  }
}

module.exports = { findOpenGap: findOpenGap, reconcile: reconcile, _setPoolForTesting: _setPoolForTesting };
