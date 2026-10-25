'use strict';

// reconciliation.js — css-s4: the reconciliation safety net (AC2). When a
// css-s2 in-request retry was exhausted (a sync_log 'gap' entry was
// logged), this module is called opportunistically from a SUBSEQUENT live,
// authenticated request touching the same feature -- never a scheduled
// background job, and never a stored credential (ADR-020 / this epic's own
// established no-stored-credential constraint, see decisions.md). Reuses
// whatever live context/token the CALLING request already has.
//
// css-s4 build-time correction: this module is pure orchestration over
// sync-log.js's own data-access functions (findOpenGap/markGapResolved) --
// it never touches a Postgres pool or runs SQL of its own, matching
// conflict-resolver.js's actual precedent exactly (that module also never
// introduces a pool override of its own; it just calls into sync-log.js
// and lets that module own all pool/table access end-to-end). This avoids
// two independent, unsynchronized override points for the same sync_log
// table, and keeps all sync_log schema/column knowledge in one file.

var syncLog = require('../web-ui/adapters/sync-log');

/**
 * Finds the most recent unresolved 'gap' entry for a feature, or null.
 * @param {string} featureSlug
 * @returns {Promise<{id:number, feature_slug:string, entry_type:string, created_at:string, resolved_at:null}|null>}
 */
async function findOpenGap(featureSlug) {
  return syncLog.findOpenGap(featureSlug);
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
  var gap = await syncLog.findOpenGap(featureSlug);
  if (!gap) return { resolved: false };

  try {
    await writerFn(featureSlug, storyId, stateUpdate, context);
    await syncLog.markGapResolved(gap.id);
    return { resolved: true };
  } catch (reconcileErr) {
    // Re-attempt itself failed -- the gap stays open (resolved_at untouched)
    // for a future reconciliation attempt. Never throw -- this is an
    // opportunistic, best-effort check layered onto an already-successful
    // request; it must never turn that request into a failure.
    return { resolved: false };
  }
}

module.exports = { findOpenGap: findOpenGap, reconcile: reconcile };
