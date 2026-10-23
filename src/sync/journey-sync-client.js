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

module.exports = {
  resolveJourneyForFeatureSlug: resolveJourneyForFeatureSlug,
  setJourneySyncClient: setJourneySyncClient,
  getJourneySyncClient: getJourneySyncClient,
  setLogger: setLogger,
  SYNC_GATE: SYNC_GATE,
  SYNC_STAGE: SYNC_STAGE
};
