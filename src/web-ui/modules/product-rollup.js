'use strict';

// src/web-ui/modules/product-rollup.js -- pr-s2
//
// DoD-status aggregation over a connected repo's pipeline-state.json, plus
// (added in Task 3 below) sync orchestration writing the computed rollup to
// a Postgres cache table scoped by product_id.
//
// Handles both epics[].stories[] (epic-nested) and flat feature.stories[]
// structures. A feature may have BOTH a populated epics[].stories[] and a
// stale/empty top-level stories: [] field -- this platform's own real
// pipeline-state.json is shaped exactly this way. Only the epic-nested
// stories are counted for such a feature; the empty top-level array
// contributes nothing (AC4).

/**
 * @param {object} pipelineState - parsed pipeline-state.json content
 * @returns {Object<string, number>} count of stories at each dodStatus value
 */
function computeDodStatusRollup(pipelineState) {
  var counts = {};
  var features = (pipelineState && pipelineState.features) || [];

  features.forEach(function(feature) {
    var stories = [];
    if (Array.isArray(feature.epics) && feature.epics.length > 0) {
      feature.epics.forEach(function(epic) {
        (epic.stories || []).forEach(function(story) { stories.push(story); });
      });
    } else {
      stories = feature.stories || [];
    }

    stories.forEach(function(story) {
      var status = story.dodStatus || 'unknown';
      counts[status] = (counts[status] || 0) + 1;
    });
  });

  return counts;
}

module.exports = {
  computeDodStatusRollup
};
