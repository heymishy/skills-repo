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
 * Counts features by their top-level health status (green/amber/red), using
 * "unknown" for any feature with no health field or an unrecognised value.
 * Reuses the same status vocabulary and precedence convention already
 * established in .github/scripts/viz-functions.js's fleetHealthLabel/
 * featureActionMeta, even though this counting logic is new application
 * code (that file lives in the legacy/unused dashboard's support module,
 * not something this application code imports from) (AC1).
 *
 * @param {object} pipelineState - parsed pipeline-state.json content
 * @returns {{green: number, amber: number, red: number, unknown: number}}
 */
function computeHealthCounts(pipelineState) {
  var counts = { green: 0, amber: 0, red: 0, unknown: 0 };
  var features = (pipelineState && pipelineState.features) || [];

  features.forEach(function(feature) {
    var health = feature.health;
    if (health !== 'green' && health !== 'amber' && health !== 'red') {
      health = 'unknown';
    }
    counts[health]++;
  });

  return counts;
}

/**
 * Derives a single overall product-health signal from per-status counts,
 * using the same red-takes-precedence rule already applied per-feature
 * elsewhere in this codebase (viz-functions.js's featureActionMeta): any
 * red feature makes the overall signal red regardless of how many
 * green/amber features also exist (AC2). With no red, any amber makes it
 * amber (AC3). All-green, or zero features entirely, yields green (AC4) --
 * this function never throws and never returns undefined/null.
 *
 * @param {{green?: number, amber?: number, red?: number, unknown?: number}} counts
 * @returns {'green'|'amber'|'red'}
 */
function computeOverallHealthSignal(counts) {
  var safe = counts || {};
  if ((safe.red || 0) > 0) return 'red';
  if ((safe.amber || 0) > 0) return 'amber';
  return 'green';
}

/**
 * Aggregates test coverage across every story in every feature (handling
 * both epics[].stories[] and flat feature.stories[] structures, same walk
 * as computeDodStatusRollup) as a single blended percentage -- sum of
 * testPlan.passing over sum of testPlan.totalTests -- NOT an average of
 * each story's own percentage (AC1). A story with no testPlan field at all
 * is excluded from both the numerator and denominator entirely; it is
 * never treated as a 0% contributor (AC2). Per-story detail is always
 * returned alongside the blended number (AC3). If no story anywhere has
 * any testPlan data, blendedPercentage is null and noData is true --
 * never 0 or NaN (AC4).
 *
 * @param {object} pipelineState - parsed pipeline-state.json content
 * @returns {{blendedPercentage: number|null, noData: boolean, totalPassing: number, totalTests: number, perFeature: Array<{slug: string, passing: number, totalTests: number, percentage: number}>}}
 */
function computeTestCoverageRollup(pipelineState) {
  var features = (pipelineState && pipelineState.features) || [];
  var totalPassing = 0;
  var totalTests = 0;
  var perFeature = [];

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
      if (!story.testPlan || typeof story.testPlan.totalTests !== 'number' || story.testPlan.totalTests <= 0) {
        return;
      }
      var passing = story.testPlan.passing || 0;
      var total = story.testPlan.totalTests;
      totalPassing += passing;
      totalTests += total;
      perFeature.push({
        slug: story.slug,
        passing: passing,
        totalTests: total,
        percentage: Math.round((passing / total) * 1000) / 10
      });
    });
  });

  if (totalTests === 0) {
    return { blendedPercentage: null, noData: true, totalPassing: 0, totalTests: 0, perFeature: [] };
  }

  return {
    blendedPercentage: Math.round((totalPassing / totalTests) * 1000) / 10,
    noData: false,
    totalPassing: totalPassing,
    totalTests: totalTests,
    perFeature: perFeature
  };
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
  var healthCounts = computeHealthCounts(pipelineState);

  await pool.query(
    `INSERT INTO product_rollups (product_id, dod_status_counts, health_counts, synced_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (product_id) DO UPDATE SET dod_status_counts = $2, health_counts = $3, synced_at = NOW()`,
    [opts.productId, JSON.stringify(rollup), JSON.stringify(healthCounts)]
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
  computeHealthCounts,
  computeOverallHealthSignal,
  computeTestCoverageRollup,
  syncProductRollup,
  triggerProductSync,
  isSyncInProgress
};
