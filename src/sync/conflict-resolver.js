'use strict';

// conflict-resolver.js — css-s3: detects a genuine cross-surface conflict
// (both pipeline-state.json and the connected web-UI journey independently
// changed since the last-synced marker, to DIFFERENT values) versus an
// ordinary single-sided propagation, and resolves a genuine conflict to
// pipeline-state.json's own value (canonical, per css-s1's own ARCH
// decision and this story's AC2).
//
// detectConflict is a pure function -- no D37 adapter needed, nothing to
// swap in tests/prod (see decisions.md's "last synced marker design" ARCH
// entry). resolveConflict reuses sync-log.js's own Pool/testing convention
// directly -- no new adapter seam, same reasoning as css-s2's sync-log.js.

var syncLog = require('../web-ui/adapters/sync-log');

/**
 * Pure comparison: returns null if there is no genuine conflict (one or
 * both sides still match the last-synced marker, or both sides already
 * agree with each other), or a conflict object if both sides independently
 * moved away from the marker to DIFFERENT values.
 * @param {string|null|undefined} lastSyncedStage
 * @param {string} pipelineStateValue
 * @param {string} journeyValue
 * @returns {{pipelineStateValue: string, journeyValue: string}|null}
 */
function detectConflict(lastSyncedStage, pipelineStateValue, journeyValue) {
  if (pipelineStateValue === journeyValue) return null;
  var pipelineStateMoved = pipelineStateValue !== lastSyncedStage;
  var journeyMoved = journeyValue !== lastSyncedStage;
  if (pipelineStateMoved && journeyMoved) {
    return { pipelineStateValue: pipelineStateValue, journeyValue: journeyValue };
  }
  return null;
}

/**
 * Resolves a detected conflict: pipeline-state.json's value always wins
 * (AC2). Logs the conflict (AC3) and returns the resolved (winning) value.
 * Can throw/reject if the underlying sync_log write fails -- callers decide
 * their own error-handling strategy, same contract as sync-log.js's own
 * logReconciliationGap/logConflict.
 * @param {string} featureSlug
 * @param {string|null} tenantId
 * @param {string} pipelineStateValue
 * @param {string} journeyValue
 * @returns {Promise<string>} the resolved value (always pipelineStateValue)
 */
async function resolveConflict(featureSlug, tenantId, pipelineStateValue, journeyValue) {
  await syncLog.logConflict(featureSlug, tenantId, pipelineStateValue, journeyValue, pipelineStateValue);
  return pipelineStateValue;
}

module.exports = { detectConflict: detectConflict, resolveConflict: resolveConflict };
