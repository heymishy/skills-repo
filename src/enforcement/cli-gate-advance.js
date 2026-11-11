// cli-gate-advance.js — gated pipeline-state advance with artefact validation
// Returns { exitCode, stdout, stderr }. No process.exit(). No file writes until
// validate() passes. Implements AC1–AC3 of cdg.7.
'use strict';

var fs = require('fs');
var path = require('path');
var { validate } = require('./cli-outer-loop');
var { advance, findStory } = require('./cli-advance');
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

// fsae-s1: cross-gate sequencing enforcement. Found during
// artefacts/2026-11-11-framework-scaling-and-architecture-evolution's own
// ideation (Lens B data-proxy check, 2026-11-11) — validate() checks each
// gate's artefact content in total isolation, with nothing anywhere
// preventing an out-of-order call (e.g. definition-of-done before
// test-plan-complete has ever run for that story). This covers the 4
// story-scoped late gates only — discovery-approved, benefit-metric-active,
// and definition-complete are feature-level artefact checks with no
// per-story predecessor concept (their own validate*() functions take only
// the resolved artefact path, no feature/story lookup), so they are
// deliberately left out of this check rather than guessed at. Each
// predecessor condition below is taken directly from the real entry
// condition documented in that gate's own downstream skill (not reverse-
// engineered from the story.stage string, which is a looser signal some
// skills don't even set consistently):
//   - test-plan-complete  requires /test-plan's own entry condition: a PASS
//     review report, i.e. story.reviewStatus === 'passed'
//   - dor-signed-off / definition-of-ready requires /definition-of-ready's
//     own entry condition: review PASS + a test plan already written
//   - branch-complete requires /branch-setup's own entry condition: a DoR
//     artefact with Proceed: Yes, i.e. story.dorStatus === 'signed-off'
//   - definition-of-done requires its own entry condition verbatim: "PR has
//     been merged (not just opened or approved)", i.e. story.prStatus === 'merged'
function checkGateSequencing(featureSlug, storyId, gateName, repoRoot) {
  var stateFile = path.join(repoRoot, '.github', 'pipeline-state.json');
  var state;
  try {
    state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch (_) {
    // No state file yet, or unreadable — nothing to sequence-check against;
    // let validate() run and report its own, more specific failure.
    return null;
  }

  var feature = (state.features || []).find(function(f) { return f.slug === featureSlug || f.id === featureSlug; });
  if (!feature) { return null; }
  var story = findStory(feature, storyId);
  if (!story) { return null; }

  // gstc (2026-11-11): short-track features (CLAUDE.md's "/test-plan ->
  // /definition-of-ready -> coding agent" path) skip /review entirely by
  // design (steps 1-4) -- their stories never set reviewStatus at all, so
  // requiring it here would permanently block every short-track story from
  // the sanctioned gate-advance path. The testPlan requirement below still
  // applies equally to both tracks -- /test-plan is never skipped.
  var isShortTrack = feature.track === 'short';

  if (gateName === 'test-plan-complete') {
    if (!isShortTrack && story.reviewStatus !== 'passed') {
      return 'SEQUENCING FAIL: test-plan-complete requires story.reviewStatus === "passed" (got "' + story.reviewStatus + '") — /review must pass before /test-plan. (Short-track features skip /review entirely — set feature.track to "short" if this is a short-track story.)';
    }
  } else if (gateName === 'dor-signed-off' || gateName === 'definition-of-ready') {
    if (!isShortTrack && story.reviewStatus !== 'passed') {
      return 'SEQUENCING FAIL: ' + gateName + ' requires story.reviewStatus === "passed" (got "' + story.reviewStatus + '") — /review must pass before /definition-of-ready. (Short-track features skip /review entirely — set feature.track to "short" if this is a short-track story.)';
    }
    if (!story.testPlan || !story.testPlan.status) {
      return 'SEQUENCING FAIL: ' + gateName + ' requires a test plan to already exist (story.testPlan.status unset) — /test-plan must run before /definition-of-ready.';
    }
  } else if (gateName === 'branch-complete') {
    if (story.dorStatus !== 'signed-off') {
      return 'SEQUENCING FAIL: branch-complete requires story.dorStatus === "signed-off" (got "' + story.dorStatus + '") — /definition-of-ready must sign off before the inner coding loop.';
    }
  } else if (gateName === 'definition-of-done') {
    if (story.prStatus !== 'merged') {
      return 'SEQUENCING FAIL: definition-of-done requires story.prStatus === "merged" (got "' + story.prStatus + '") — the PR must actually be merged, not just opened or approved.';
    }
  }
  return null;
}

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

  // fsae-s1: cross-gate sequencing check — runs before validate() so an
  // out-of-order call fails on the real reason, not an unrelated artefact-
  // content check that happened to also be missing.
  var seqError = checkGateSequencing(featureSlug, storyId, gateName, repoRoot);
  if (seqError) {
    return { exitCode: 8, stdout: '', stderr: seqError };
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
  if (advanceResult.exitCode === 0 && journeySyncClient.GATE_TO_JOURNEY_STAGE[gateName]) {
    try {
      var journey = await journeySyncClient.resolveJourneyForFeatureSlug(featureSlug);
      if (journey) {
        // css-s4: read this story's own locally-accumulated lastSyncedStage
        // for this story, to pass into syncGateAdvanceToJourney's own new
        // conflict-detection logic.
        var _localState = JSON.parse(fs.readFileSync(path.join(repoRoot, '.github', 'pipeline-state.json'), 'utf8'));
        var _localFeature = (_localState.features || []).find(function(f) { return f.slug === featureSlug || f.id === featureSlug; });
        var _localStory = _localFeature && findStory(_localFeature, storyId);
        var _lastSyncedStage = _localStory ? _localStory.lastSyncedStage : null;
        var _synced = await journeySyncClient.syncGateAdvanceToJourney(journey, gateName, _lastSyncedStage);
        // css-s3: keep the shared "last synced" marker current from the CLI
        // side too, after a successful sync. Bookkeeping only -- no real
        // conflict-branch call here; this direction's real call site cannot
        // produce a genuine two-different-values conflict today (see
        // decisions.md's wiring-scope-refinement ARCH entry). A failure
        // here is logged the same as a sync failure above -- it must never
        // change gateAdvance's own exit code, which already reflects the
        // pipeline-state advance's own success.
        //
        // css-s4: generalised from the removed SYNC_STAGE constant (which
        // only ever covered the single discovery-approved gate) to this
        // gate's own GATE_TO_JOURNEY_STAGE target. Only recorded for the 5
        // journey-representable gates -- a null-mapped (inner-loop) gate
        // has no journey-side stage to mark as synced, and recording one
        // anyway would stamp a false "last synced" value nothing actually
        // pushed. Also gated on _synced === true: syncGateAdvanceToJourney
        // now returns false whenever it detected a genuine conflict and
        // skipped the push (in addition to the no-op/mismatch cases) -- the
        // marker must only advance when the push genuinely happened, not
        // merely attempted, otherwise a resolved-to-conflict case would
        // silently mask an unresolved disagreement by falsely advancing the
        // marker past the point where the journey and pipeline-state.json
        // actually agreed.
        var _syncedTargetStage = journeySyncClient.GATE_TO_JOURNEY_STAGE[gateName];
        if (_syncedTargetStage && _synced) {
          try {
            advance(featureSlug, storyId, ['lastSyncedStage=' + _syncedTargetStage], repoRoot);
          } catch (markerErr) {
            process.stderr.write('[journey-sync] warning: lastSyncedStage update failed: ' + ((markerErr && markerErr.message) || String(markerErr)) + '\n');
          }
        }
      }
    } catch (err) {
      process.stderr.write('[journey-sync] warning: ' + ((err && err.message) || String(err)) + '\n');
    }
  }

  return advanceResult;
}

module.exports = { gateAdvance };
