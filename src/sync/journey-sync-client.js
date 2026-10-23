'use strict';

// journey-sync-client.js — css-s1: CLI-side D37 adapter for the CLI -> web-UI
// journey sync direction (resolve + update), reached via a new internal HTTP
// endpoint on the deployed web-UI server (src/web-ui/routes/internal-sync.js)
// -- the CLI has no direct Postgres credential (decisions.md 2026-08-07 ARCH
// entry).
//
// D37: the real HTTP transport is wired separately, never self-wired here --
// the default stub throws so a missing wiring call fails loudly instead of
// silently no-opping. See cli-gate-advance.js for the wiring call (a later task).

var SYNC_GATE = 'discovery-approved';
var SYNC_STAGE = 'discovery';

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
 * feature slug via the internal endpoint.
 * @param {string} featureSlug
 * @returns {Promise<{journeyId:string, featureSlug:string, repoOwner:string|null, repoName:string|null}|null>}
 */
async function resolveJourneyForFeatureSlug(featureSlug) {
  if (!_syncConfigured()) return null;
  var transport = getJourneySyncClient();
  var response = await transport('resolve', { featureSlug: featureSlug });
  if (!response || !response.found) return null;
  return response.journey;
}

/**
 * css-s1 AC1/AC3/AC4 -- sync a CLI-side gate-advance onto the resolved
 * journey's completedStages. Only the discovery-approved gate is in scope
 * (AC4); every other gate is a no-op boundary, not a gap. AC3: if the
 * resolved journey's own connected repo does not match this CLI's own repo
 * identity (process.env.GITHUB_REPO_OWNER/GITHUB_REPO_NAME -- the same
 * single-repo-identity convention sign-off.js's handleArtefactRead already
 * uses), the slug match is a cross-repo coincidence, not the same feature --
 * log the mismatch for visibility (NFR-Audit) and make no write call at all.
 * @param {{journeyId:string, featureSlug:string, repoOwner:string|null, repoName:string|null}} journey
 * @param {string} gate
 * @returns {Promise<void>}
 */
async function syncGateAdvanceToJourney(journey, gate) {
  if (gate !== SYNC_GATE) return;

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

  var transport = getJourneySyncClient();
  await transport('update', {
    journeyId: journey.journeyId,
    featureSlug: journey.featureSlug,
    stage: SYNC_STAGE
  });
  _logger.info('journey-sync-success', { featureSlug: journey.featureSlug, journeyId: journey.journeyId });
}

module.exports = {
  resolveJourneyForFeatureSlug: resolveJourneyForFeatureSlug,
  syncGateAdvanceToJourney: syncGateAdvanceToJourney,
  setJourneySyncClient: setJourneySyncClient,
  getJourneySyncClient: getJourneySyncClient,
  setLogger: setLogger,
  SYNC_GATE: SYNC_GATE,
  SYNC_STAGE: SYNC_STAGE
};
