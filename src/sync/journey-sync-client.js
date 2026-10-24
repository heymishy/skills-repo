'use strict';

// journey-sync-client.js — css-s1: CLI-side D37 adapter for the CLI -> web-UI
// journey sync direction (resolve + update), reached via a new internal HTTP
// endpoint on the deployed web-UI server (src/web-ui/routes/internal-sync.js)
// -- the CLI has no direct Postgres credential (decisions.md 2026-08-07 ARCH
// entry).
//
// css-s4: generalised from the single discovery-approved gate to all 7
// gate-map.js gates. GATE_TO_JOURNEY_STAGE's own KEYS are derived from
// gate-map.js's export (not re-typed, per this story's own NFR against
// duplicating the fixed 7-value list) -- its VALUES are new information
// (the corresponding journey-trackable stage name, or null for the 2
// inner-loop gates with no journey-side representation at all). See
// decisions.md's "gate-to-journey-stage mapping" ARCH entry for the full
// reasoning.
//
// D37: the real HTTP transport is wired separately, never self-wired here --
// the default stub throws so a missing wiring call fails loudly instead of
// silently no-opping. See cli-gate-advance.js for the wiring call.

var GATE_MAP = require('../enforcement/gate-map');
var conflictResolver = require('./conflict-resolver');

var GATE_TO_JOURNEY_STAGE = {};
Object.keys(GATE_MAP).forEach(function(gate) { GATE_TO_JOURNEY_STAGE[gate] = null; });
GATE_TO_JOURNEY_STAGE['discovery-approved']    = 'discovery';
GATE_TO_JOURNEY_STAGE['benefit-metric-active'] = 'benefit-metric';
GATE_TO_JOURNEY_STAGE['definition-complete']   = 'definition';
GATE_TO_JOURNEY_STAGE['test-plan-complete']    = 'test-plan';
GATE_TO_JOURNEY_STAGE['dor-signed-off']        = 'definition-of-ready';
// 'branch-complete' and 'definition-of-done' stay null -- CLI-only
// inner-loop milestones with no corresponding journey/session concept.

var _transport = function() {
  throw new Error('Adapter not wired: journeySyncClient. Call setJourneySyncClient() with a real implementation before use.');
};

function setJourneySyncClient(fn) { _transport = fn; }
function getJourneySyncClient() { return _transport; }

// Mirrors sign-off.js's own _logger convention -- non-throwing default so a
// missing setLogger() call only silences the audit trail, never breaks sync.
var _logger = {
  info: function() {},
  warn: function() {}
};
function setLogger(logger) { _logger = logger; }

/**
 * True only when both new CLI-side env vars are configured. AC6: the common
 * case (solo CLI usage, no web-UI product connected) must never attempt an
 * HTTP call or throw -- same observable outcome as "no journey found" (AC2).
 */
function _syncConfigured() {
  return !!(process.env.INTERNAL_SYNC_URL && process.env.INTERNAL_SYNC_SECRET);
}

/**
 * css-s1 AC1/AC2/AC6 -- resolve a web-UI journey for a pipeline-state.json
 * feature slug via the internal endpoint. css-s4: the resolved journey now
 * also carries its own currentStage (getLatestKnownStage's own result),
 * used by syncGateAdvanceToJourney's new conflict-detection logic.
 * @param {string} featureSlug
 * @returns {Promise<{journeyId:string, featureSlug:string, repoOwner:string|null, repoName:string|null, currentStage:string|null}|null>}
 */
async function resolveJourneyForFeatureSlug(featureSlug) {
  if (!_syncConfigured()) return null;
  var transport = getJourneySyncClient();
  var response = await transport('resolve', { featureSlug: featureSlug });
  if (!response || !response.found) return null;
  return response.journey;
}

/**
 * css-s1 AC1/AC3/AC4, css-s4 AC1 -- sync a CLI-side gate-advance onto the
 * resolved journey's completedStages, for ANY of the 7 gate-map.js gates.
 * AC3: if the resolved journey's own connected repo does not match this
 * CLI's own repo identity, the slug match is a cross-repo coincidence --
 * log the mismatch (NFR-Audit) and make no write call at all.
 *
 * css-s4: two new behaviours.
 * (1) A gate with no journey-side representation (GATE_TO_JOURNEY_STAGE
 *     maps it to null) safely no-ops -- same "nothing to sync to"
 *     precedent as AC2's own "no journey connected" case, not a new
 *     failure mode.
 * (2) For the 5 journey-representable gates, a genuine conflict is now
 *     checked: pipeline-state.json's own write for this gate already
 *     happened, unconditionally, before this function is ever called (via
 *     cli-gate-advance.js's own earlier advance() call) -- there is
 *     nothing to "correct" on that side. The only decision left is
 *     whether PUSHING that already-final value onto the journey would be
 *     correct. If the journey's own currentStage has independently
 *     diverged (differs from both lastSyncedStage and the gate's own
 *     target stage), pushing would silently overwrite the journey's own
 *     more-recent, disagreeing progress -- skip the push, log the
 *     conflict via conflict-resolver.js (the SAME mechanism css-s3 built
 *     for css-s2's own direction, reused here, not duplicated), and
 *     deliberately leave lastSyncedStage un-advanced so a later
 *     reconciliation/retry keeps flagging the unresolved disagreement.
 * @param {{journeyId:string, featureSlug:string, repoOwner:string|null, repoName:string|null, currentStage:string|null}} journey
 * @param {string} gate
 * @param {string|null} [lastSyncedStage] - read by the caller from local pipeline-state.json
 * @returns {Promise<void>}
 */
async function syncGateAdvanceToJourney(journey, gate, lastSyncedStage) {
  var targetStage = GATE_TO_JOURNEY_STAGE[gate];
  if (targetStage === undefined) return; // unknown gate name -- defensive, should never happen given gate-map.js's own enum
  if (targetStage === null) return; // css-s4: no journey-side representation for this gate -- safe no-op

  var ownRepoOwner = process.env.GITHUB_REPO_OWNER || null;
  var ownRepoName = process.env.GITHUB_REPO_NAME || null;
  var repoMismatch = !!(journey.repoOwner && journey.repoName && ownRepoOwner && ownRepoName &&
    (journey.repoOwner !== ownRepoOwner || journey.repoName !== ownRepoName));

  if (repoMismatch) {
    _logger.warn('journey-sync-mismatch', {
      featureSlug: journey.featureSlug,
      journeyId: journey.journeyId,
      reason: 'journey repo does not match this CLI\'s own repo identity'
    });
    return;
  }

  // css-s4: real conflict detection, reusing css-s3's own mechanism. A
  // conflict requires a known baseline to diverge FROM -- with no
  // lastSyncedStage at all (first-ever sync for this story), there is no
  // "since last sync" to compare against, so detectConflict is not invoked
  // at all and the sync proceeds (same precedent as T2/T2c in
  // check-css-s3-conflict-resolver.js: an unmoved side never conflicts;
  // "no recorded baseline" is the same absence-of-movement case, not a
  // divergence). Without this guard, detectConflict(null, targetStage,
  // journey.currentStage) would misread ANY non-null journey.currentStage
  // as having "moved" relative to a null baseline and falsely flag a
  // conflict on the very first sync.
  var conflict = lastSyncedStage ? conflictResolver.detectConflict(lastSyncedStage, targetStage, journey.currentStage || null) : null;
  if (conflict) {
    await conflictResolver.resolveConflict(journey.featureSlug, null, conflict.pipelineStateValue, conflict.journeyValue);
    _logger.warn('journey-sync-conflict', {
      featureSlug: journey.featureSlug,
      journeyId: journey.journeyId,
      pipelineStateValue: targetStage,
      journeyValue: journey.currentStage
    });
    return;
  }

  var transport = getJourneySyncClient();
  await transport('update', {
    journeyId: journey.journeyId,
    featureSlug: journey.featureSlug,
    stage: targetStage
  });
  _logger.info('journey-sync-success', { featureSlug: journey.featureSlug, journeyId: journey.journeyId });
}

/**
 * css-s1 (D37 real implementation) -- the actual network call to the
 * internal web-UI endpoint. Wired via setJourneySyncClient(), from
 * cli-gate-advance.js (D37 rule 3).
 * @param {'resolve'|'update'} op
 * @param {object} payload
 * @returns {Promise<object>}
 */
async function realJourneySyncTransport(op, payload) {
  var baseUrl = (process.env.INTERNAL_SYNC_URL || '').replace(/\/$/, '');
  var response = await fetch(baseUrl + '/internal/journey-sync/' + op, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-sync-secret': process.env.INTERNAL_SYNC_SECRET
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error('journey-sync ' + op + ' request failed: HTTP ' + response.status);
  }
  return response.json();
}

module.exports = {
  resolveJourneyForFeatureSlug: resolveJourneyForFeatureSlug,
  syncGateAdvanceToJourney: syncGateAdvanceToJourney,
  realJourneySyncTransport: realJourneySyncTransport,
  setJourneySyncClient: setJourneySyncClient,
  getJourneySyncClient: getJourneySyncClient,
  setLogger: setLogger,
  GATE_TO_JOURNEY_STAGE: GATE_TO_JOURNEY_STAGE
};
