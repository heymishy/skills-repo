'use strict';
/**
 * pipeline-state-writer.js — owle.6
 * Factory function that returns a writer for auto-updating .github/pipeline-state.json
 * on gate-confirm success.
 *
 * Usage:
 *   const factory = require('./adapters/pipeline-state-writer');
 *   setPipelineStateWriter(factory(repoRoot));
 */

var fs = require('fs');
var path = require('path');

// Valid enum values for lightweight schema validation (no jsonschema dependency)
var VALID_PR_STATUS  = ['none', 'draft', 'open', 'merged'];
var VALID_DOR_STATUS = ['not-started', 'in-progress', 'signed-off'];
var VALID_HEALTH     = ['green', 'amber', 'red'];

/**
 * Validate that stateUpdate fields contain only valid enum values.
 * Throws with a descriptive message if validation fails.
 * @param {Object} stateUpdate
 */
function validateStateUpdate(stateUpdate) {
  if (stateUpdate.prStatus !== undefined && !VALID_PR_STATUS.includes(stateUpdate.prStatus)) {
    throw new Error('schema validation failed: invalid prStatus value "' + stateUpdate.prStatus +
      '". Must be one of: ' + VALID_PR_STATUS.join(', '));
  }
  if (stateUpdate.dorStatus !== undefined && !VALID_DOR_STATUS.includes(stateUpdate.dorStatus)) {
    throw new Error('schema validation failed: invalid dorStatus value "' + stateUpdate.dorStatus +
      '". Must be one of: ' + VALID_DOR_STATUS.join(', '));
  }
  if (stateUpdate.health !== undefined && !VALID_HEALTH.includes(stateUpdate.health)) {
    throw new Error('schema validation failed: invalid health value "' + stateUpdate.health +
      '". Must be one of: ' + VALID_HEALTH.join(', '));
  }
}

/**
 * Factory function.
 * @param {string} repoRoot — absolute path to the repository root
 * @returns {function(featureSlug, storyId, stateUpdate): void}
 */
module.exports = function pipelineStateWriterFactory(repoRoot) {
  var statePath = path.join(repoRoot, '.github', 'pipeline-state.json');
  var tmpPath = statePath + '.tmp';
  // daga-s1: .github/pipeline-state.json's own mere presence/readability is
  // no longer a reliable "is this a real, governed checkout" signal now
  // that the Docker image includes .github/ (see .dockerignore) so
  // aada-s1/fapg-s1's own read-only artefact-page features can actually
  // work in production. .git/ is what genuinely distinguishes a real,
  // committable checkout from a deployed container's own baked image copy
  // -- it stays excluded from the Docker image regardless of that change.
  // Checked once here (factory-creation time, i.e. server startup), not
  // per-call, since repoRoot does not change between calls.
  var isRealCheckout = fs.existsSync(path.join(repoRoot, '.git'));

  return function pipelineStateWriter(featureSlug, storyId, stateUpdate) {
    if (!isRealCheckout) {
      throw new Error(
        'pipeline-state-writer: ' + repoRoot + ' has no .git/ directory -- ' +
        'not a real, governed checkout. Refusing to write; changes here ' +
        'would never be durable (e.g. a deployed container).'
      );
    }

    // Validate before touching the file
    validateStateUpdate(stateUpdate);

    // Prototype pollution guard (OWASP A03) — must run before any file operation
    var PROTO_BLOCKED = ['__proto__', 'constructor', 'prototype'];
    var updateKeys = Object.keys(stateUpdate);
    for (var ki = 0; ki < updateKeys.length; ki++) {
      if (PROTO_BLOCKED.indexOf(updateKeys[ki]) !== -1) {
        throw new Error('Rejected field name \'' + updateKeys[ki] + '\': prototype pollution risk.');
      }
    }

    // Read current state. This file is git-tracked and must already exist --
    // never fabricate a fresh, near-empty state when it's missing. A missing
    // file here means repoRoot is not a real, governed checkout (e.g. a
    // deployed container where .github/ is deliberately excluded from the
    // built image, see .dockerignore) -- silently starting from {features:[]}
    // would overwrite real history with a file containing only the one
    // feature/story just touched, and that file is never committed back to
    // git, so the real state is lost the moment this container is replaced.
    // Source: workspace/capture-log.md, 2026-07-26 (alrf storage-drift audit).
    var state;
    try {
      state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    } catch (readErr) {
      throw new Error(
        'pipeline-state-writer: cannot read ' + statePath + ' (' +
        (readErr && readErr.message ? readErr.message : String(readErr)) + '). ' +
        'Refusing to fabricate a fresh state file -- this usually means repoRoot ' +
        'is not a real git-backed checkout of this repository.'
      );
    }

    if (!Array.isArray(state.features)) {
      state.features = [];
    }

    // Find or create feature entry
    var feature = state.features.find(function(f) {
      return f.slug === featureSlug || f.id === featureSlug;
    });

    if (!feature) {
      feature = { slug: featureSlug, id: featureSlug };
      state.features.push(feature);
    }

    // Apply feature-level fields (not story-specific)
    var featureLevelKeys = ['discoveryStatus', 'artefact', 'stage', 'health'];
    featureLevelKeys.forEach(function(key) {
      if (stateUpdate[key] !== undefined) {
        feature[key] = stateUpdate[key];
      }
    });

    // Atomic write of feature-level changes first, then advance() for story-level.
    // advance() reads from disk, so the feature-level write must precede it.
    var content = JSON.stringify(state, null, 2) + '\n';
    fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, statePath);

    // Apply story-level fields if storyId provided — delegate to advance()
    // advance() handles epic-nested story lookup, enum validation, proto guard,
    // and atomic write. Feature-level write above must complete first so the
    // feature entry exists when advance() reads the state.
    if (storyId) {
      var storyLevelKeys = ['dorStatus', 'prStatus', 'prUrl', 'stage', 'updatedAt'];
      var rawFields = [];
      storyLevelKeys.forEach(function(key) {
        if (stateUpdate[key] !== undefined) {
          rawFields.push(key + '=' + stateUpdate[key]);
        }
      });
      if (rawFields.length > 0) {
        var advanceFn = require('../../enforcement/cli-advance').advance;
        var advResult = advanceFn(featureSlug, storyId, rawFields, repoRoot);
        if (advResult.exitCode !== 0) {
          throw new Error('pipeline-state advance failed: ' + advResult.stderr);
        }
      }
    }

    console.info(JSON.stringify({
      event: 'pipeline_state_updated',
      featureSlug: featureSlug,
      storyId: storyId,
      fieldsChanged: Object.keys(stateUpdate).filter(function(k) { return k !== 'accessToken'; })
    }));
  };
};
