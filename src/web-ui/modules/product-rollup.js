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
 * Also returns a perFeature breakdown -- one entry per feature carrying its
 * own normalized health value, read directly from feature.health (a3 AC1).
 * This is the ONLY input this function reads from pipeline-state.json --
 * traced at a3 story time (see artefacts/2026-07-21-web-ui-experience-redesign/
 * plans/a3-plan.md Task 0 and this feature's decisions.md): feature.health is
 * set independently of test-coverage data (computeTestCoverageRollup reads
 * story.testPlan instead, a structurally separate field), so the perFeature
 * health returned here is a genuinely separate signal from coverage, not a
 * repaint of it (a3 AC2, AC2a). Epics carry no independent health field of
 * their own in this repo's real schema, so per-feature (not per-epic) is the
 * correct granularity for this breakdown.
 *
 * @param {object} pipelineState - parsed pipeline-state.json content
 * @returns {{green: number, amber: number, red: number, unknown: number, perFeature: Array<{slug: string, name: string|undefined, health: 'green'|'amber'|'red'|'unknown'}>}}
 */
function computeHealthCounts(pipelineState) {
  var counts = { green: 0, amber: 0, red: 0, unknown: 0, perFeature: [] };
  var features = (pipelineState && pipelineState.features) || [];

  features.forEach(function(feature) {
    var health = feature.health;
    if (health !== 'green' && health !== 'amber' && health !== 'red') {
      health = 'unknown';
    }
    counts[health]++;
    counts.perFeature.push({ slug: feature.slug, name: feature.name, health: health });
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
 * Per-story detail is additionally grouped by parent epic (groups/ungrouped),
 * mirroring computeTaxonomyRollup's shape, so the product view can render a
 * readable per-epic breakdown instead of one flat list of 100+ story codes
 * (F4 -- found unreadable at scale during live staging verification of the
 * product-rollup epic's own self-registered product, which has 141 stories).
 *
 * @param {object} pipelineState - parsed pipeline-state.json content
 * @returns {{blendedPercentage: number|null, noData: boolean, totalPassing: number, totalTests: number, perFeature: Array<{slug: string, passing: number, totalTests: number, percentage: number}>, groups: Array<{epicSlug: string, epicName: string, items: Array<{slug: string, passing: number, totalTests: number, percentage: number}>}>, ungrouped: Array<{slug: string, passing: number, totalTests: number, percentage: number}>}}
 */
function computeTestCoverageRollup(pipelineState) {
  var features = (pipelineState && pipelineState.features) || [];
  var totalPassing = 0;
  var totalTests = 0;
  var perFeature = [];
  var groups = [];
  var ungrouped = [];

  function toEntry(story) {
    if (!story.testPlan || typeof story.testPlan.totalTests !== 'number' || story.testPlan.totalTests <= 0) {
      return null;
    }
    var passing = story.testPlan.passing || 0;
    var total = story.testPlan.totalTests;
    totalPassing += passing;
    totalTests += total;
    var entry = {
      slug: story.slug || story.id,
      passing: passing,
      totalTests: total,
      percentage: Math.round((passing / total) * 1000) / 10
    };
    perFeature.push(entry);
    return entry;
  }

  features.forEach(function(feature) {
    if (Array.isArray(feature.epics) && feature.epics.length > 0) {
      feature.epics.forEach(function(epic) {
        var items = (epic.stories || []).map(toEntry).filter(Boolean);
        if (items.length > 0) {
          groups.push({ epicSlug: epic.slug, epicName: epic.name, items: items });
        }
      });
    } else {
      (feature.stories || []).forEach(function(story) {
        var entry = toEntry(story);
        if (entry) { ungrouped.push(entry); }
      });
    }
  });

  if (totalTests === 0) {
    return { blendedPercentage: null, noData: true, totalPassing: 0, totalTests: 0, perFeature: [], groups: [], ungrouped: [] };
  }

  return {
    blendedPercentage: Math.round((totalPassing / totalTests) * 1000) / 10,
    noData: false,
    totalPassing: totalPassing,
    totalTests: totalTests,
    perFeature: perFeature,
    groups: groups,
    ungrouped: ungrouped
  };
}

/**
 * Aggregates AC (acceptance-criteria) coverage across every story in every
 * feature, using the identical blended (sum-of-verified/sum-of-total, not
 * average-of-percentages) method as computeTestCoverageRollup, applied to
 * story.acTotal/story.acVerified instead of story.testPlan (AC1). A story
 * with no acTotal/acVerified fields at all (e.g. not yet past
 * /definition-of-ready) is excluded from both the numerator and
 * denominator (AC2). If no story anywhere has any AC data,
 * blendedPercentage is null and noData is true (AC4).
 *
 * Per-story detail is additionally grouped by parent epic (groups/ungrouped),
 * mirroring computeTaxonomyRollup's shape -- same F4 rationale as
 * computeTestCoverageRollup above.
 *
 * @param {object} pipelineState - parsed pipeline-state.json content
 * @returns {{blendedPercentage: number|null, noData: boolean, totalVerified: number, totalAc: number, perFeature: Array<{slug: string, verified: number, total: number, percentage: number}>, groups: Array<{epicSlug: string, epicName: string, items: Array<{slug: string, verified: number, total: number, percentage: number}>}>, ungrouped: Array<{slug: string, verified: number, total: number, percentage: number}>}}
 */
function computeAcCoverageRollup(pipelineState) {
  var features = (pipelineState && pipelineState.features) || [];
  var totalVerified = 0;
  var totalAc = 0;
  var perFeature = [];
  var groups = [];
  var ungrouped = [];

  function toEntry(story) {
    if (typeof story.acTotal !== 'number' || story.acTotal <= 0) {
      return null;
    }
    var verified = story.acVerified || 0;
    var total = story.acTotal;
    totalVerified += verified;
    totalAc += total;
    var entry = {
      slug: story.slug || story.id,
      verified: verified,
      total: total,
      percentage: Math.round((verified / total) * 1000) / 10
    };
    perFeature.push(entry);
    return entry;
  }

  features.forEach(function(feature) {
    if (Array.isArray(feature.epics) && feature.epics.length > 0) {
      feature.epics.forEach(function(epic) {
        var items = (epic.stories || []).map(toEntry).filter(Boolean);
        if (items.length > 0) {
          groups.push({ epicSlug: epic.slug, epicName: epic.name, items: items });
        }
      });
    } else {
      (feature.stories || []).forEach(function(story) {
        var entry = toEntry(story);
        if (entry) { ungrouped.push(entry); }
      });
    }
  });

  if (totalAc === 0) {
    return { blendedPercentage: null, noData: true, totalVerified: 0, totalAc: 0, perFeature: [], groups: [], ungrouped: [] };
  }

  return {
    blendedPercentage: Math.round((totalVerified / totalAc) * 1000) / 10,
    noData: false,
    totalVerified: totalVerified,
    totalAc: totalAc,
    perFeature: perFeature,
    groups: groups,
    ungrouped: ungrouped
  };
}

/**
 * Groups a product's stories by their parent epic, and lists top-level
 * features with no epics (flat stories[]) separately as "ungrouped" (AC1).
 * A feature with a populated epics[].stories[] and a stale/empty top-level
 * stories[] field (this repo's own real shape) is grouped under its epic
 * only, never also counted as ungrouped (AC1, mirrors pr-s2's AC4). A
 * product with zero epics anywhere returns an empty groups array -- never
 * a group entry with zero items -- so the render layer can correctly omit
 * an "Epics" section entirely rather than showing a misleading empty one
 * (AC3). discoveryArtefact is a genuine top-level-feature field in this
 * repo's schema, so it is only carried on ungrouped entries (AC2) -- an
 * epic-nested story has no discoveryArtefact of its own. totalCount is
 * incremented once per emitted leaf item (by construction, in the same
 * walk that builds groups/ungrouped), so it is guaranteed to equal
 * sum(groups[].items.length) + ungrouped.length unless the walk itself has
 * a bug -- this is the correctness property AC4 exists to catch (AC4).
 *
 * @param {object} pipelineState - parsed pipeline-state.json content
 * @returns {{groups: Array<{epicSlug: string, epicName: string, items: Array<{slug: string}>}>, ungrouped: Array<{slug: string, name: string|undefined, discoveryArtefact: string|undefined}>, totalCount: number}}
 */
function computeTaxonomyRollup(pipelineState) {
  var features = (pipelineState && pipelineState.features) || [];
  var groups = [];
  var ungrouped = [];
  var totalCount = 0;

  features.forEach(function(feature) {
    if (Array.isArray(feature.epics) && feature.epics.length > 0) {
      feature.epics.forEach(function(epic) {
        var items = (epic.stories || []).map(function(story) {
          totalCount++;
          return { slug: story.slug || story.id };
        });
        groups.push({ epicSlug: epic.slug, epicName: epic.name, items: items });
      });
    } else {
      totalCount++;
      ungrouped.push({ slug: feature.slug, name: feature.name, discoveryArtefact: feature.discoveryArtefact });
    }
  });

  return { groups: groups, ungrouped: ungrouped, totalCount: totalCount };
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
  var testCoverage = computeTestCoverageRollup(pipelineState);
  var acCoverage = computeAcCoverageRollup(pipelineState);
  var taxonomy = computeTaxonomyRollup(pipelineState);

  await pool.query(
    `INSERT INTO product_rollups (product_id, dod_status_counts, health_counts, test_coverage, ac_coverage, taxonomy, synced_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (product_id) DO UPDATE SET dod_status_counts = $2, health_counts = $3, test_coverage = $4, ac_coverage = $5, taxonomy = $6, synced_at = NOW()`,
    [opts.productId, JSON.stringify(rollup), JSON.stringify(healthCounts), JSON.stringify(testCoverage), JSON.stringify(acCoverage), JSON.stringify(taxonomy)]
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
  computeAcCoverageRollup,
  computeTaxonomyRollup,
  syncProductRollup,
  triggerProductSync,
  isSyncInProgress
};
