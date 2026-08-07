'use strict';

// artefact-backfill.js — das-s3: backfill already-completed stage artefacts
// (still present on local disk) to a product's repo at the moment it's
// connected.
//
// das-s1's dual-write only fires on NEW stage completions going forward --
// nothing previously ran at the moment a repo is connected to check for and
// commit already-completed, not-yet-backed-up stages sitting on local disk.
// A journey that completed several stages before its product's repo was
// connected would lose all of that content permanently the next time a
// redeploy wiped local disk (found live on staging, 2026-08-07 --
// new-feature-5a4e59db). This module closes that specific gap.
//
// Not a D37 injectable adapter (DoR H-ADAPTER: N/A unless introduced) -- a
// plain helper over a journey's own completedStages list and the
// filesystem, mirroring export-data-source.js's ownerRepoForFeature (an
// internal helper, not a swappable adapter in its own right). Reuses
// das-s1's artefact-commit-writer.js's commitArtefact for the actual commit
// (story Architecture Constraints) -- no new commit mechanism is introduced
// here.
//
// Best-effort per stage (AC2): a stage whose local file no longer exists,
// or whose commit attempt fails for any reason, is skipped -- it never
// blocks or fails the other stages' backfill attempts.

var fs = require('fs');
var path = require('path');
var _artefactCommitWriter = require('./artefact-commit-writer');

/**
 * Backfill a single journey's already-completed stages (per journey.
 * completedStages) to the given owner/repo, for every stage whose local-disk
 * artefact still exists. Time-boxed by design (story Architecture
 * Constraints): content already lost to a prior redeploy is not recoverable
 * here and is simply reported as skipped, not treated as an error.
 *
 * @param {{ featureSlug?: string, completedStages?: Array<{skillName: string, artefactPath: string}> }} journey
 * @param {string} owner - GitHub repo owner just connected
 * @param {string} repo - GitHub repo name just connected
 * @param {string} accessToken - the operator's own session-derived GitHub OAuth token (never a service account)
 * @param {string} repoRoot - local disk root each stage's artefactPath is resolved against
 * @returns {Promise<{attempted: number, succeeded: number, skipped: string[]}>}
 */
async function backfillCompletedStagesToRepo(journey, owner, repo, accessToken, repoRoot) {
  var completedStages = (journey && journey.completedStages) || [];
  var result = { attempted: 0, succeeded: 0, skipped: [] };

  // AC4: zero completed stages -> no work attempted at all, not even a
  // filesystem check -- the common case (most products connect a repo
  // before starting) must add zero overhead.
  if (completedStages.length === 0) {
    return result;
  }

  for (var i = 0; i < completedStages.length; i++) {
    var stage = completedStages[i];
    result.attempted++;

    var absPath = stage.artefactPath ? path.join(repoRoot, stage.artefactPath) : null;
    if (!absPath || !fs.existsSync(absPath)) {
      result.skipped.push(stage.skillName);
      console.info(JSON.stringify({
        event: 'artefact_backfill_skipped',
        featureSlug: journey.featureSlug || null,
        stage: stage.skillName,
        reason: 'local-file-missing'
      }));
      continue;
    }

    try {
      var content = fs.readFileSync(absPath, 'utf8');
      await _artefactCommitWriter.commitArtefact(stage.artefactPath, content, accessToken, owner, repo);
      result.succeeded++;
      console.info(JSON.stringify({
        event: 'artefact_backfill_committed',
        featureSlug: journey.featureSlug || null,
        stage: stage.skillName
      }));
    } catch (err) {
      // Best-effort (AC2): a failed commit attempt (e.g. a transient GitHub
      // API error) skips this one stage, never the others already queued.
      result.skipped.push(stage.skillName);
      console.error(JSON.stringify({
        event: 'artefact_backfill_failed',
        featureSlug: journey.featureSlug || null,
        stage: stage.skillName,
        error: (err && err.message) || String(err)
      }));
    }
  }

  return result;
}

module.exports = { backfillCompletedStagesToRepo };
