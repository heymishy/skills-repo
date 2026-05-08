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

  return function pipelineStateWriter(featureSlug, storyId, stateUpdate) {
    // Validate before touching the file
    validateStateUpdate(stateUpdate);

    // Read current state
    var state;
    try {
      state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    } catch (_) {
      state = { schemaVersion: '1', features: [] };
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

    // Apply story-level fields if storyId provided
    if (storyId) {
      if (!Array.isArray(feature.stories)) {
        feature.stories = [];
      }
      var story = feature.stories.find(function(s) {
        return s.id === storyId || s.slug === storyId;
      });
      if (!story) {
        story = { id: storyId };
        feature.stories.push(story);
      }
      var storyLevelKeys = ['dorStatus', 'prStatus', 'prUrl', 'stage', 'updatedAt'];
      storyLevelKeys.forEach(function(key) {
        if (stateUpdate[key] !== undefined) {
          story[key] = stateUpdate[key];
        }
      });
    }

    // Track which fields changed for log (never log accessToken or session data)
    var fieldsChanged = Object.keys(stateUpdate).filter(function(k) {
      return k !== 'accessToken';
    });

    // Atomic write: tmp then rename
    var content = JSON.stringify(state, null, 2) + '\n';
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, statePath);

    console.info(JSON.stringify({
      event: 'pipeline_state_updated',
      featureSlug: featureSlug,
      storyId: storyId,
      fieldsChanged: fieldsChanged
    }));
  };
};
