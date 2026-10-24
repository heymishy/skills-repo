// cli-gate-advance.js — gated pipeline-state advance with artefact validation
// Returns { exitCode, stdout, stderr }. No process.exit(). No file writes until
// validate() passes. Implements AC1–AC3 of cdg.7.
'use strict';

var { validate } = require('./cli-outer-loop');
var { advance }  = require('./cli-advance');
var journeySyncClient = require('../sync/journey-sync-client');

// css-s1 (D37 rule 3): wiring the real HTTP transport is kept separate from
// the sync business logic in journey-sync-client.js and from gateAdvance()'s
// own control flow (a later task) -- this line is the entire "wiring" task.
// The CLI has no long-running server.js-style startup point; this module's
// own load time is the equivalent "once, at startup" moment for a one-shot
// CLI process.
// Never wired in NODE_ENV=test (tests call setJourneySyncClient() themselves
// with a mock); the throwing stub stays active there, matching the pattern
// already used by server.js's adapter wiring blocks.
if (process.env.NODE_ENV !== 'test') {
  journeySyncClient.setJourneySyncClient(journeySyncClient.realJourneySyncTransport);
  console.log('[css-s1] journey-sync client wired');
}

var USAGE = 'Usage: skills gate-advance <feature-slug> <story-id> <gate-name> <artefact-path> [field=value...]';

/**
 * Validate an artefact against a gate, then advance pipeline-state fields.
 * If validate() returns a non-zero exit code, the state file is not modified.
 *
 * @param {string}   featureSlug  — pipeline-state feature slug
 * @param {string}   storyId      — story id or slug
 * @param {string}   gateName     — gate to validate (e.g. 'definition-of-ready')
 * @param {string}   artefactPath — path to the artefact to validate
 * @param {string[]} rawFields    — array of "field=value" pairs for advance()
 * @param {string}   repoRoot     — absolute path to the repository root
 * @returns {Promise<{ exitCode: number, stdout: string, stderr: string }>}
 */
async function gateAdvance(featureSlug, storyId, gateName, artefactPath, rawFields, repoRoot) {
  // AC3: all four positional args are required
  if (!featureSlug || !storyId || !gateName || !artefactPath) {
    return {
      exitCode: 8,
      stdout: '',
      stderr: 'Missing required argument(s). ' + USAGE +
        '\nRequired positional args: feature-slug, story-id, gate-name, artefact-path',
    };
  }

  // AC1: run the gate validation — if non-zero, propagate and do not touch state
  var valResult = validate(artefactPath, gateName, repoRoot);
  if (valResult.exitCode !== 0) {
    return valResult;
  }

  // AC2: validation passed — advance pipeline-state fields
  var advanceResult = advance(featureSlug, storyId, rawFields || [], repoRoot);

  // css-s1 AC1/AC2/AC3/AC4/AC6: synchronous CLI -> web-UI journey sync,
  // scoped to the discovery-approved gate only. A sync failure (network
  // error, no journey connected, env not configured) never changes
  // gateAdvance's own exit code -- the pipeline-state advance above already
  // succeeded or failed on its own terms.
  if (advanceResult.exitCode === 0 && gateName === journeySyncClient.SYNC_GATE) {
    try {
      var journey = await journeySyncClient.resolveJourneyForFeatureSlug(featureSlug);
      if (journey) {
        await journeySyncClient.syncGateAdvanceToJourney(journey, gateName);
        // css-s3: keep the shared "last synced" marker current from the CLI
        // side too, after a successful sync. Bookkeeping only -- no real
        // conflict-branch call here; this direction's real call site cannot
        // produce a genuine two-different-values conflict today (see
        // decisions.md's wiring-scope-refinement ARCH entry). A failure
        // here is logged the same as a sync failure above -- it must never
        // change gateAdvance's own exit code, which already reflects the
        // pipeline-state advance's own success.
        try {
          advance(featureSlug, storyId, ['lastSyncedStage=' + journeySyncClient.SYNC_STAGE], repoRoot);
        } catch (markerErr) {
          process.stderr.write('[journey-sync] warning: lastSyncedStage update failed: ' + ((markerErr && markerErr.message) || String(markerErr)) + '\n');
        }
      }
    } catch (err) {
      process.stderr.write('[journey-sync] warning: ' + ((err && err.message) || String(err)) + '\n');
    }
  }

  return advanceResult;
}

module.exports = { gateAdvance };
