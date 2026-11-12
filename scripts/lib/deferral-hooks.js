'use strict';

// ddft-s4: shared mechanism behind the three self-registration hooks
// (/discovery, /decisions, /definition-of-done). The hooks are invoked from
// each skill's State-update section via scripts/register-deferral.js.
// All persistence goes through ./incident-store (ddft-s1) -- this module never
// touches the filesystem itself.

const path = require('path');
const store = require('./incident-store');

const DEFAULT_FILE = path.join(__dirname, '..', '..', 'workspace', 'incidents.json');

const HOOK_SOURCES = {
  'discovery-out-of-scope': 'discovery-out-of-scope',
  'risk-accept': 'risk-accept',
  'unmeasured-benefit-metric': 'unmeasured-benefit-metric',
};

function parseOutOfScope(markdown) {
  const lines = String(markdown).split(/\r?\n/);
  const items = [];
  let inSection = false;
  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      inSection = /^##\s+Out of Scope\s*$/i.test(line);
      continue;
    }
    if (!inSection) continue;
    const m = /^\s*(?:[-*]|\d+\.)\s+(.+?)\s*$/.exec(line);
    if (m) items.push(m[1]);
  }
  return items;
}

function requireText(value, label) {
  if (typeof value !== 'string' || value.trim() === '' || /^n\/?a$/i.test(value.trim())) {
    throw new Error('Missing or blank required value: ' + label);
  }
  return value.trim();
}

function buildRecords(hook, ctx) {
  const source = HOOK_SOURCES[hook];
  if (!source) {
    throw new Error('Unknown hook: ' + hook);
  }
  const c = ctx || {};
  const linkedFeature = c.feature || null;
  const linkedStory = c.story || null;

  if (hook === 'discovery-out-of-scope') {
    return (c.outOfScopeItems || []).map((item) => store.createDeferredItemRecord({
      trigger: 'discovery Out of Scope: ' + (linkedFeature || 'unknown feature'),
      summary: item,
      source: source,
      revisitCondition: null,
      linkedFeature: linkedFeature,
      linkedStory: linkedStory,
    }));
  }

  if (hook === 'risk-accept') {
    const ref = requireText(c.decisionRef, 'decision-ref');
    return [store.createDeferredItemRecord({
      trigger: 'decisions.md: ' + ref,
      summary: requireText(c.summary, 'summary'),
      source: source,
      revisitCondition: c.revisitCondition || null,
      linkedFeature: linkedFeature,
      linkedStory: linkedStory,
    })];
  }

  // unmeasured-benefit-metric
  const metric = requireText(c.metric, 'metric');
  const evidence = requireText(c.evidence, 'evidence');
  return [store.createDeferredItemRecord({
    trigger: 'definition-of-done Step 6: metric not-yet-measured: ' + metric,
    summary: 'Metric "' + metric + '" recorded not-yet-measured at DoD.',
    source: source,
    revisitCondition: 'Metric "' + metric + '" not yet measured: ' + evidence,
    linkedFeature: linkedFeature,
    linkedStory: linkedStory,
  })];
}

// Builds then appends every record. Builds all first so a validation failure
// writes nothing.
function registerDeferral(hook, ctx, filePath) {
  const records = buildRecords(hook, ctx);
  const target = filePath || DEFAULT_FILE;
  records.forEach((r) => store.appendIncidentRecord(r, target));
  return records;
}

module.exports = { DEFAULT_FILE, buildRecords, parseOutOfScope, registerDeferral };
