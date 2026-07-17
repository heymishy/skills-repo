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

/**
 * Fetches a product's connected repo's pipeline-state.json via the wired
 * adapter, computes the DoD-status rollup, and writes it to the
 * product_rollups cache table scoped by product_id. Throws (does not write)
 * if the fetch fails, so a failed sync never silently shows stale or empty
 * data as if it were current (AC3).
 *
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {{getPipelineStateFetchAdapter: Function}} adapterModule
 * @param {{productId: string, repoOwner: string, repoName: string, accessToken: string}} opts
 */
async function syncProductRollup(pool, adapterModule, opts) {
  var raw = await adapterModule.getPipelineStateFetchAdapter()(opts.repoOwner, opts.repoName, opts.accessToken);
  var decoded = Buffer.from(raw.content, 'base64').toString('utf8');
  var pipelineState = JSON.parse(decoded);
  var rollup = computeDodStatusRollup(pipelineState);

  await pool.query(
    `INSERT INTO product_rollups (product_id, dod_status_counts, synced_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (product_id) DO UPDATE SET dod_status_counts = $2, synced_at = NOW()`,
    [opts.productId, JSON.stringify(rollup)]
  );

  return rollup;
}

// pr-s3 AC4: in-flight sync tracking, keyed by product_id. A simple
// in-memory Set is sufficient here -- this platform runs as a single Node
// process per environment (no multi-instance horizontal scaling in the
// current architecture), so a per-process guard is the correct scope for
// preventing duplicate concurrent syncs of the same product.
var _syncsInProgress = new Set();

/**
 * @param {string} productId
 * @returns {boolean} true if a sync for this product is currently in flight
 */
function isSyncInProgress(productId) {
  return _syncsInProgress.has(productId);
}

/**
 * Wraps syncProductRollup with a per-product_id concurrency guard (AC4).
 * Rejects immediately (does not queue or wait) if a sync for the same
 * product_id is already in flight, so a second concurrent Refresh click
 * never starts a second underlying fetch. Always clears the in-flight flag
 * on completion, success or failure, so a failed sync can be retried
 * immediately rather than deadlocking the product's Refresh action.
 *
 * @param {object} pool
 * @param {{getPipelineStateFetchAdapter: Function}} adapterModule
 * @param {{productId: string, repoOwner: string, repoName: string, accessToken: string}} opts
 */
async function triggerProductSync(pool, adapterModule, opts) {
  if (_syncsInProgress.has(opts.productId)) {
    throw new Error('A sync for this product is already in progress');
  }
  _syncsInProgress.add(opts.productId);
  try {
    return await syncProductRollup(pool, adapterModule, opts);
  } finally {
    _syncsInProgress.delete(opts.productId);
  }
}

module.exports = {
  computeDodStatusRollup,
  syncProductRollup,
  triggerProductSync,
  isSyncInProgress
};
