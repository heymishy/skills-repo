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

var STATE_PATH = '.github/pipeline-state.json';
var RETRY_DELAYS_MS = [150, 400]; // 3 total attempts: initial + 2 retries, per wsd-s2 decisions.md

// Mirrors pipeline-state-writer.js's own enum lists exactly (wsd-s2 DoR Coding Agent Instructions).
var VALID_PR_STATUS  = ['none', 'draft', 'open', 'merged'];
var VALID_DOR_STATUS = ['not-started', 'in-progress', 'signed-off'];
var VALID_HEALTH     = ['green', 'amber', 'red'];

var FEATURE_LEVEL_KEYS = ['discoveryStatus', 'artefact', 'stage', 'health'];
var STORY_LEVEL_KEYS   = ['dorStatus', 'prStatus', 'prUrl', 'stage', 'updatedAt'];

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

/**
 * Apply stateUpdate to an in-memory pipeline-state object: feature-level
 * fields mirror pipeline-state-writer.js's own featureLevelKeys.forEach()
 * logic verbatim; story-level fields delegate to wsd-s1's applyAdvance(),
 * which owns enum validation, epic-nested story lookup, and the
 * storyWasCreated visibility fix.
 */
function applyStateUpdate(state, featureSlug, storyId, stateUpdate) {
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

  if (storyId) {
    var rawFields = [];
    STORY_LEVEL_KEYS.forEach(function(key) {
      if (stateUpdate[key] !== undefined) rawFields.push(key + '=' + stateUpdate[key]);
    });
    if (rawFields.length > 0) {
      var result = applyAdvance(state, featureSlug, storyId, rawFields);
      if (result.exitCode !== 0) {
        throw new Error('pipeline-state advance failed: ' + result.stderr);
      }
      return result.state;
    }
  }
  return state;
}

function githubApiBase() {
  return (process.env.GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');
}

/** GET .github/pipeline-state.json — content and sha captured together from ONE request. */
async function fetchState(apiBase, owner, repo, authHeaders) {
  var url = apiBase + '/repos/' + owner + '/' + repo + '/contents/' + STATE_PATH;
  var res = await fetch(url, { headers: authHeaders });
  if (!res.ok) {
    throw new Error('Failed to fetch pipeline-state.json: ' + res.status);
  }
  var body = await res.json();
  var content = Buffer.from(body.content, 'base64').toString('utf8');
  return { state: JSON.parse(content), sha: body.sha };
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
    while (attempt < 3) {
      try {
        var fetched = await fetchState(apiBase, owner, repo, authHeaders);
        var mutatedState = applyStateUpdate(fetched.state, featureSlug, storyId, stateUpdate);
        var newContent = JSON.stringify(mutatedState, null, 2) + '\n';
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
        return;
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
