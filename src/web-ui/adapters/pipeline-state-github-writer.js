'use strict';

// pipeline-state-github-writer.js — wsd-s2: GitHub Contents API-backed
// pipelineStateWriter for the production container.
//
// pipeline-state-writer.js's local-fs writer requires a real local `.git/`
// checkout (`isRealCheckout`), which is always false in the production
// container because `.dockerignore` excludes `.git/` from the image — so
// every production write throws, silently caught by journey.js's own
// try/catch and only ever server-logged. This module gives production a
// second, working implementation of the same `pipelineStateWriter`
// contract: read .github/pipeline-state.json via the GitHub Contents API
// (GET, capturing content + sha together in ONE request), mutate it
// in-memory using the exact same validation/mutation rules the local-fs
// writer already relies on (wsd-s1's applyAdvance() for story-level fields;
// the local-fs writer's own feature-level field application, mirrored here
// verbatim), then PUT the result back with that same sha.
//
// Deliberately does NOT call artefact-commit-writer.js's commitArtefact/
// realCommitArtefact for the PUT step -- that function does its own,
// separate internal GET-for-sha. Chaining this module's own GET (for
// content) with that function's own later, separate GET-for-sha would let a
// concurrent write land in the gap between the two GETs, silently
// defeating optimistic concurrency. This module captures sha and content
// together from a single GET and PUTs directly against that same sha.
//
// D37 (CLAUDE.md): no new injectable-adapter seam is introduced here -- the
// existing setPipelineStateWriter()/throw-on-unwired-stub pattern in
// journey.js already satisfies rule 1. server.js selects between this
// factory and pipeline-state-writer.js's local-fs factory at startup, based
// on the same isRealCheckout signal (see wsd-s2 DoR, H-ADAPTER assessment).

var { applyAdvance } = require('../../enforcement/cli-advance');
// Held as a module reference (not destructured) so tests can monkeypatch
// posthogServer.captureException on the shared require-cache singleton and
// have this module's calls observe the replacement.
var posthogServer = require('../modules/posthog-server');
var conflictResolver = require('../../sync/conflict-resolver');

var STATE_PATH = '.github/pipeline-state.json';
var RETRY_DELAYS_MS = [150, 400]; // 3 total attempts: initial + 2 retries, per wsd-s2 decisions.md

// Mirrors pipeline-state-writer.js's own enum lists exactly (wsd-s2 DoR Coding Agent Instructions).
var VALID_PR_STATUS  = ['none', 'draft', 'open', 'merged'];
var VALID_DOR_STATUS = ['not-started', 'in-progress', 'signed-off'];
var VALID_HEALTH     = ['green', 'amber', 'red'];

var FEATURE_LEVEL_KEYS = ['discoveryStatus', 'artefact', 'stage', 'health'];
var STORY_LEVEL_KEYS   = ['dorStatus', 'prStatus', 'prUrl', 'stage', 'updatedAt', 'lastSyncedStage'];

function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

/** Mirrors pipeline-state-writer.js's validateStateUpdate() exactly. */
function validateStateUpdate(stateUpdate) {
  if (stateUpdate.prStatus !== undefined && VALID_PR_STATUS.indexOf(stateUpdate.prStatus) === -1) {
    throw new Error('schema validation failed: invalid prStatus value "' + stateUpdate.prStatus +
      '". Must be one of: ' + VALID_PR_STATUS.join(', '));
  }
  if (stateUpdate.dorStatus !== undefined && VALID_DOR_STATUS.indexOf(stateUpdate.dorStatus) === -1) {
    throw new Error('schema validation failed: invalid dorStatus value "' + stateUpdate.dorStatus +
      '". Must be one of: ' + VALID_DOR_STATUS.join(', '));
  }
  if (stateUpdate.health !== undefined && VALID_HEALTH.indexOf(stateUpdate.health) === -1) {
    throw new Error('schema validation failed: invalid health value "' + stateUpdate.health +
      '". Must be one of: ' + VALID_HEALTH.join(', '));
  }
}

/** Mirrors pipeline-state-writer.js's prototype-pollution guard exactly. */
function guardPrototypePollution(stateUpdate) {
  var PROTO_BLOCKED = ['__proto__', 'constructor', 'prototype'];
  var updateKeys = Object.keys(stateUpdate);
  for (var i = 0; i < updateKeys.length; i++) {
    if (PROTO_BLOCKED.indexOf(updateKeys[i]) !== -1) {
      throw new Error('Rejected field name \'' + updateKeys[i] + '\': prototype pollution risk.');
    }
  }
}

/** Read-only story lookup -- flat feature.stories[] first, then epic-nested. Never creates. */
function _findStoryReadOnly(feature, storyId) {
  if (Array.isArray(feature.stories)) {
    var flat = feature.stories.find(function(s) { return s.id === storyId || s.slug === storyId; });
    if (flat) return flat;
  }
  var epics = feature.epics || [];
  for (var ei = 0; ei < epics.length; ei++) {
    var epicStories = epics[ei].stories || [];
    var found = epicStories.find(function(s) { return s.id === storyId || s.slug === storyId; });
    if (found) return found;
  }
  return null;
}

/**
 * Apply stateUpdate to an in-memory pipeline-state object: feature-level
 * fields mirror pipeline-state-writer.js's own featureLevelKeys.forEach()
 * logic verbatim; story-level fields delegate to wsd-s1's applyAdvance(),
 * which owns enum validation, epic-nested story lookup, and the
 * storyWasCreated visibility fix.
 */
async function applyStateUpdate(state, featureSlug, storyId, stateUpdate, conflictLogState) {
  if (!Array.isArray(state.features)) state.features = [];
  var feature = state.features.find(function(f) {
    return f.slug === featureSlug || f.id === featureSlug;
  });
  if (!feature) {
    feature = { slug: featureSlug, id: featureSlug };
    state.features.push(feature);
  }
  FEATURE_LEVEL_KEYS.forEach(function(key) {
    if (stateUpdate[key] !== undefined) feature[key] = stateUpdate[key];
  });

  var detectedConflict = null;
  if (storyId) {
    // css-s3: conflict detection -- compare the CURRENT (freshly-fetched)
    // pipeline-state.json stage value against stateUpdate's own incoming
    // stage value, using lastSyncedStage as the "last agreed" marker. Only
    // meaningful when stateUpdate actually carries a new stage value --
    // other story-level fields (dorStatus, prStatus, prUrl) are untouched.
    if (stateUpdate.stage !== undefined) {
      var existingStory = _findStoryReadOnly(feature, storyId);
      if (existingStory) {
        var conflict = conflictResolver.detectConflict(existingStory.lastSyncedStage, existingStory.stage, stateUpdate.stage);
        stateUpdate = Object.assign({}, stateUpdate);
        if (conflict) {
          // css-s3 (Critical, found at code-quality review): this function
          // is re-run on every attempt of the writer's own, PRE-EXISTING
          // 409-retry loop (an unrelated Contents-API optimistic-concurrency
          // mechanism -- someone else wrote to pipeline-state.json between
          // our GET and PUT). A failed PUT persists nothing, so a retry
          // re-observes the SAME on-disk state and would re-detect the
          // SAME logical cross-surface conflict. Resolving again (always
          // pipelineStateValue) is safe/idempotent, but logConflict's own
          // sync_log INSERT is NOT idempotent -- without this guard, one
          // logical conflict produces up to 3 duplicate sync_log rows
          // under 409 pressure, corrupting the audit trail this feature's
          // own benefit-metric depends on. conflictLogState is a plain
          // object shared across all retry attempts of ONE writer call
          // (declared once before that call's while loop) -- log exactly
          // once per logical conflict per call, resolve on every attempt.
          var resolved = conflict.pipelineStateValue;
          if (!conflictLogState || !conflictLogState.logged) {
            resolved = await conflictResolver.resolveConflict(featureSlug, null, conflict.pipelineStateValue, conflict.journeyValue);
            if (conflictLogState) conflictLogState.logged = true;
          }
          delete stateUpdate.stage; // pipeline-state.json's own value wins -- do not apply the incoming stage
          stateUpdate.lastSyncedStage = resolved;
          // css-s3 (AC2, Task 7): surface the resolution to the caller
          // (journey.js) so it can correct ITS OWN side too -- see
          // decisions.md's Task 7 ARCH entry for why a standalone Postgres
          // write at this point would be ineffective (journey.js's own
          // later, session.skillName-driven logic would silently overwrite
          // it again within the same request) and why reassigning
          // session.skillName to `resolved` at the call site is the real
          // fix instead.
          detectedConflict = { pipelineStateValue: conflict.pipelineStateValue, journeyValue: conflict.journeyValue, resolved: resolved };
        } else {
          stateUpdate.lastSyncedStage = stateUpdate.stage;
        }
      }
    }

    var rawFields = [];
    STORY_LEVEL_KEYS.forEach(function(key) {
      if (stateUpdate[key] !== undefined) rawFields.push(key + '=' + stateUpdate[key]);
    });
    if (rawFields.length > 0) {
      var result = applyAdvance(state, featureSlug, storyId, rawFields);
      if (result.exitCode !== 0) {
        throw new Error('pipeline-state advance failed: ' + result.stderr);
      }
      return { state: result.state, conflict: detectedConflict };
    }
  }
  return { state: state, conflict: detectedConflict };
}

function githubApiBase() {
  return (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');
}

/**
 * GET .github/pipeline-state.json's sha (always present regardless of file
 * size), then GET its content via the Git Blobs API using that exact sha.
 *
 * wsd-s5: the Contents API's own JSON response omits `content` (empty
 * string) for any file over 1 MB -- pipeline-state.json is ~1.5 MB and
 * growing, so the original single-GET design (`content` decoded straight
 * from the Contents API response) silently received an empty string and
 * `JSON.parse('')` threw "Unexpected end of JSON input" on every real
 * production write, found via this story's own live verification. The Git
 * Blobs API has no such ceiling (up to 100 MB) and, critically, is fetched
 * BY the sha the Contents API just returned -- a git blob is immutable and
 * content-addressed, so this second GET can never observe content that
 * doesn't match that exact sha. This is safer than the original
 * single-GET design's own race-avoidance goal, not a regression of it: the
 * PUT below still uses this same sha, so a genuine concurrent write is
 * still caught as a 409 exactly as before.
 */
async function fetchState(apiBase, owner, repo, authHeaders) {
  var metaUrl = apiBase + '/repos/' + owner + '/' + repo + '/contents/' + STATE_PATH;
  var metaRes = await fetch(metaUrl, { headers: authHeaders });
  if (!metaRes.ok) {
    throw new Error('Failed to fetch pipeline-state.json: ' + metaRes.status);
  }
  var meta = await metaRes.json();
  var sha = meta.sha;

  var blobUrl = apiBase + '/repos/' + owner + '/' + repo + '/git/blobs/' + sha;
  var blobRes = await fetch(blobUrl, { headers: authHeaders });
  if (!blobRes.ok) {
    throw new Error('Failed to fetch pipeline-state.json blob: ' + blobRes.status);
  }
  var blob = await blobRes.json();
  var content = Buffer.from(blob.content, blob.encoding || 'base64').toString('utf8');
  return { state: JSON.parse(content), sha: sha };
}

/** PUT the mutated state back with the sha captured by fetchState(). */
async function putState(apiBase, owner, repo, authHeaders, newContent, sha, authorName, authorEmail, message) {
  var url = apiBase + '/repos/' + owner + '/' + repo + '/contents/' + STATE_PATH;
  var payload = {
    message:   message,
    content:   Buffer.from(newContent, 'utf8').toString('base64'),
    sha:       sha,
    author:    { name: authorName, email: authorEmail },
    committer: { name: authorName, email: authorEmail },
  };
  var res = await fetch(url, {
    method:  'PUT',
    headers: Object.assign({}, authHeaders, { 'Content-Type': 'application/json' }),
    body:    JSON.stringify(payload),
  });
  if (res.status === 409) {
    var conflictErr = new Error('Conflict: pipeline-state.json was updated since it was last read');
    conflictErr.isConflict = true;
    throw conflictErr;
  }
  if (!res.ok) {
    throw new Error('Failed to write pipeline-state.json: ' + res.status);
  }
  return res.json();
}

function captureWriteFailure(featureSlug, storyId, err) {
  try {
    posthogServer.captureException(err, 'pipeline-state-writer', {
      event:       'pipeline_state_write_failed',
      via:         'github-api',
      featureSlug: featureSlug,
      storyId:     storyId,
    });
  } catch (_) {
    // Never let telemetry capture itself throw and mask the real failure.
  }
}

/**
 * Factory function — mirrors pipeline-state-writer.js's own factory shape.
 * @returns {function(featureSlug, storyId, stateUpdate, context): Promise<void>}
 */
module.exports = function pipelineStateGithubWriterFactory() {
  return async function pipelineStateGithubWriter(featureSlug, storyId, stateUpdate, context) {
    context = context || {};
    var token = context.token;
    var owner = context.owner;
    var repo  = context.repo;

    if (!token || !owner || !repo) {
      var missingErr = new Error(
        'pipeline-state-github-writer: token, owner, and repo are all required ' +
        '(no session token or no connected repository resolved for this feature).'
      );
      captureWriteFailure(featureSlug, storyId, missingErr);
      throw missingErr;
    }

    try {
      validateStateUpdate(stateUpdate);
      guardPrototypePollution(stateUpdate);
    } catch (validationErr) {
      captureWriteFailure(featureSlug, storyId, validationErr);
      throw validationErr;
    }

    var apiBase = githubApiBase();
    var authHeaders = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' };

    var authorName, authorEmail;
    try {
      var userRes = await fetch(apiBase + '/user', { headers: authHeaders });
      if (!userRes.ok) {
        throw new Error('Failed to fetch user identity: ' + userRes.status);
      }
      var user = await userRes.json();
      authorName  = user.name || user.login;
      authorEmail = user.email || (user.login + '@users.noreply.github.com');
    } catch (identityErr) {
      captureWriteFailure(featureSlug, storyId, identityErr);
      throw identityErr;
    }

    var attempt = 0;
    var lastErr = null;
    // css-s3: shared across every attempt of THIS writer call's own
    // 409-retry loop -- dedupes conflict logging (see applyStateUpdate's
    // own comment) without affecting conflict resolution, which is safe to
    // repeat on every attempt.
    var conflictLogState = { logged: false };
    while (attempt < 3) {
      try {
        var fetched = await fetchState(apiBase, owner, repo, authHeaders);
        var applyResult = await applyStateUpdate(fetched.state, featureSlug, storyId, stateUpdate, conflictLogState);
        var newContent = JSON.stringify(applyResult.state, null, 2) + '\n';
        await putState(
          apiBase, owner, repo, authHeaders, newContent, fetched.sha,
          authorName, authorEmail,
          'chore: pipeline-state update ' + featureSlug + (storyId ? '/' + storyId : '')
        );
        console.info(JSON.stringify({
          event:        'pipeline_state_updated',
          featureSlug:  featureSlug,
          storyId:      storyId,
          fieldsChanged: Object.keys(stateUpdate).filter(function(k) { return k !== 'accessToken'; }),
          via:          'github-api',
          attempt:      attempt + 1,
        }));
        // css-s3 (AC2, Task 7): surface the resolved conflict (or null) to
        // the caller so it can correct its own side -- see
        // decisions.md's Task 7 ARCH entry.
        return { conflict: applyResult.conflict };
      } catch (err) {
        lastErr = err;
        if (err && err.isConflict && attempt < 2) {
          attempt++;
          await sleep(RETRY_DELAYS_MS[attempt - 1]);
          continue;
        }
        break;
      }
    }

    captureWriteFailure(featureSlug, storyId, lastErr);
    throw lastErr;
  };
};
