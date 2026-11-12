'use strict';

// src/web-ui/modules/reactive-pod-rollup.js -- urpv-s4
//
// Reactive-vs-planned load rollup by pod for the consolidated features view.
//
// Reactive = a feature item whose `track` is "short" (urpv-s2) OR a RISK-ACCEPT/SCOPE
// item parsed from a feature's decisions.md (urpv-s3, passed down as
// `decisionsReactiveItems`). Every other active feature item is planned.
//
// Pod attribution reuses pod-assignment-store.js read-only: a feature's explicit
// pods (pod_assignments.feature_id = journeys.journey_id, via getFeaturePodAssignments),
// else the product's default pod (getProductDefaultPod, already read by the page),
// else a single "Unassigned" bucket. Taxonomy-only items have no journey and so no
// explicit assignment; they fall through to the default pod / Unassigned.
//
// Pure computation + rendering; the only I/O is resolvePodContext, which the route
// handler calls once before the (synchronous) render.

var podAssignmentStore = require('./pod-assignment-store');

var UNASSIGNED_KEY = '__unassigned__';
var UNASSIGNED_NAME = 'Unassigned';
var DONE_STAGE = 'definition-of-done';

function _esc(str) {
  return String(str === null || str === undefined ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Async: read each journey's explicit pod assignments (one getFeaturePodAssignments
 * call per journey, tenant-scoped). The product default pod is NOT re-read here --
 * the caller passes the one it already fetched. Never throws: any failure yields
 * lookupFailed:true with no explicit assignments.
 * @returns {Promise<{defaultPod: object|null, podsByJourneyId: Object, lookupFailed: boolean}>}
 */
async function resolvePodContext(pool, tenantId, journeyIds, defaultPod, deps) {
  var getAssignments = (deps && deps.getFeaturePodAssignments) || podAssignmentStore.getFeaturePodAssignments;
  var log = (deps && deps.log) || function(msg) { console.error(msg); };
  var podsByJourneyId = {};
  var lookupFailed = false;
  var seen = {};
  var ids = (journeyIds || []).filter(function(id) {
    if (!id || seen[id]) { return false; }
    seen[id] = true;
    return true;
  });
  try {
    for (var i = 0; i < ids.length; i++) {
      podsByJourneyId[ids[i]] = await getAssignments(pool, tenantId, ids[i]);
    }
  } catch (err) {
    lookupFailed = true;
    podsByJourneyId = {};
    log('[urpv-s4] pod assignment lookup failed: ' + (err && err.message ? err.message : 'unknown error'));
  }
  return { defaultPod: defaultPod || null, podsByJourneyId: podsByJourneyId, lookupFailed: lookupFailed };
}

function _podsFor(journeyId, ctx) {
  var explicit = journeyId && ctx.podsByJourneyId ? ctx.podsByJourneyId[journeyId] : null;
  if (Array.isArray(explicit) && explicit.length > 0) {
    return explicit.map(function(p) { return { key: p.podId, name: p.podName }; });
  }
  if (ctx.defaultPod && ctx.defaultPod.podId) {
    return [{ key: ctx.defaultPod.podId, name: ctx.defaultPod.podName }];
  }
  return [{ key: UNASSIGNED_KEY, name: UNASSIGNED_NAME }];
}

/**
 * Pure rollup. Completed (definition-of-done) feature items are excluded -- this is
 * an active-work view, matching the page's own default "Active only" filter.
 * A feature in several pods counts under each pod; totals count it once.
 * @returns {{rows: Array<{podKey: string, podName: string, reactiveCount: number, plannedCount: number}>, totals: {reactiveCount: number, plannedCount: number}}}
 */
function computePodRollup(items, decisionsReactiveItems, podContext) {
  var ctx = podContext || { defaultPod: null, podsByJourneyId: {}, lookupFailed: false };
  var buckets = {};
  var totals = { reactiveCount: 0, plannedCount: 0 };
  var journeyBySlug = {};

  function add(pods, field) {
    totals[field]++;
    pods.forEach(function(p) {
      if (!buckets[p.key]) { buckets[p.key] = { podKey: p.key, podName: p.name, reactiveCount: 0, plannedCount: 0 }; }
      buckets[p.key][field]++;
    });
  }

  var active = (items || []).filter(function(item) { return item && item.stage !== DONE_STAGE; });
  (items || []).forEach(function(item) {
    var slug = item && (item.featureSlug || item.slug);
    if (slug && item.journeyId && !journeyBySlug[slug]) { journeyBySlug[slug] = item.journeyId; }
  });

  active.forEach(function(item) {
    add(_podsFor(item.journeyId, ctx), item.track === 'short' ? 'reactiveCount' : 'plannedCount');
  });
  (decisionsReactiveItems || []).forEach(function(d) {
    add(_podsFor(journeyBySlug[d && d.featureSlug], ctx), 'reactiveCount');
  });

  var rows = Object.keys(buckets).map(function(k) { return buckets[k]; });
  if (rows.length === 0) {
    rows.push({ podKey: UNASSIGNED_KEY, podName: UNASSIGNED_NAME, reactiveCount: 0, plannedCount: 0 });
  }
  rows.sort(function(a, b) {
    if (a.podKey === UNASSIGNED_KEY) { return 1; }
    if (b.podKey === UNASSIGNED_KEY) { return -1; }
    return a.podName < b.podName ? -1 : (a.podName > b.podName ? 1 : 0);
  });
  return { rows: rows, totals: totals };
}

/**
 * Render the rollup as an additional tab button + panel for the existing
 * pvc-tabs pattern (switched by the page's own pvcShowTab). Counts are plain
 * text ("3 reactive / 12 planned"), never colour-only; a zero is a real "0".
 * @returns {{tabButtonHtml: string, panelHtml: string}}
 */
function renderPodRollupTab(rollup, podContext) {
  var rows = rollup.rows.map(function(r) {
    return '<tr data-pod-row="' + _esc(r.podName) + '" style="border-bottom:1px solid var(--line)">' +
      '<th scope="row" style="text-align:left;padding:8px 12px 8px 0;font-weight:500;color:var(--ink)">' + _esc(r.podName) + '</th>' +
      '<td style="padding:8px 0;font-size:14px;color:var(--ink)">' +
        '<span data-pod-reactive>' + r.reactiveCount + '</span> reactive / <span data-pod-planned>' + r.plannedCount + '</span> planned' +
      '</td>' +
    '</tr>';
  }).join('');
  var note = (podContext && podContext.lookupFailed)
    ? '<p style="font-size:12px;color:var(--warn);margin:0 0 8px">Pod assignments could not be read; counts use the product default pod, or Unassigned.</p>'
    : '';
  var panelHtml =
    '<div id="pvc-tab-panel-pod" class="pvc-tab-panel" role="tabpanel" aria-labelledby="pvc-tab-pod" data-urpv-pod-rollup>' +
      '<div style="font-size:12px;color:var(--muted);margin-bottom:8px">Active reactive vs planned items by pod. Reactive = short-track features plus RISK-ACCEPT and SCOPE decisions.</div>' +
      note +
      '<table style="border-collapse:collapse;width:100%"><caption style="text-align:left;font-size:12px;color:var(--muted);padding-bottom:4px">Reactive and planned counts by pod</caption><tbody>' + rows + '</tbody></table>' +
      '<div data-pod-total style="margin-top:8px;font-size:12px;color:var(--muted)">Total: ' + rollup.totals.reactiveCount + ' reactive / ' + rollup.totals.plannedCount + ' planned</div>' +
    '</div>';
  var tabButtonHtml =
    '<button type="button" class="pvc-tab" id="pvc-tab-pod" role="tab" aria-selected="false" onclick="pvcShowTab(\'pod\')">By Pod</button>';
  return { tabButtonHtml: tabButtonHtml, panelHtml: panelHtml };
}

module.exports = { resolvePodContext, computePodRollup, renderPodRollupTab };
