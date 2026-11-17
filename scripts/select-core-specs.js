#!/usr/bin/env node
'use strict';
// lpw-s2 (AC4) -- the rule that picks the required core of browser specs, from the per-spec coverage measurement.
//
//   1. One passing spec for every capability that has a passing spec: the one that adds the most statements.
//   2. Then more passing specs, greedily by new statements added, until the next one would add less than the
//      threshold (percentage points of all statements in src/web-ui).
//
// A spec is never chosen when it failed in the measurement, is named in options.failedBefore, or is in lane scenario
// or quarantined in the matrix. Capabilities with no eligible spec are returned as gaps. Deterministic: ties are
// broken by file name.
//
//   node scripts/select-core-specs.js <per-spec-coverage.json> [capability-matrix.json] [failed-before.json]

const fs = require('fs');
const path = require('path');

/**
 * @param {{totalStatements:number, specs:Object<string,{failed:number,statements:string[]}>}} measurement
 * @param {{specs:{file:string,capability:string,lane:string}[]}} matrix
 * @param {{threshold?:number, failedBefore?:string[]}} [options]
 */
function selectCore(measurement, matrix, options) {
  const threshold = (options && typeof options.threshold === 'number') ? options.threshold : 0.1;
  const failedBefore = new Set((options && options.failedBefore) || []);
  const total = measurement.totalStatements || 1;
  const sets = {};
  Object.keys(measurement.specs).forEach(function (f) { sets[f] = new Set(measurement.specs[f].statements); });

  const byCapability = {};
  const capabilities = [];
  matrix.specs.forEach(function (e) {
    if (e.lane === 'scenario' || e.lane === 'quarantined') return;
    if (!byCapability[e.capability]) { byCapability[e.capability] = []; capabilities.push(e.capability); }
    const m = measurement.specs[e.file];
    const eligible = m && !(m.failed > 0) && !failedBefore.has(e.file);
    if (eligible) byCapability[e.capability].push(e.file);
  });
  // A capability whose only specs are scenario or quarantined is a gap too: look at every non-scenario entry.
  const allCapabilities = {};
  matrix.specs.forEach(function (e) { allCapabilities[e.capability] = true; });
  const gaps = Object.keys(allCapabilities).filter(function (c) {
    return !matrix.specs.some(function (e) {
      return e.capability === c && e.lane !== 'quarantined' && e.lane !== 'scenario'
        && measurement.specs[e.file] && !(measurement.specs[e.file].failed > 0) && !failedBefore.has(e.file);
    }) && !matrix.specs.some(function (e) { return e.capability === c && e.lane === 'scenario'; });
  }).sort();

  const covered = new Set();
  const core = [];
  const steps = [];
  function add(file) {
    let added = 0;
    sets[file].forEach(function (s) { if (!covered.has(s)) { covered.add(s); added++; } });
    core.push(file);
    steps.push({ file: file, added: added, cumulative: covered.size, cumulativePct: Math.round(covered.size / total * 10000) / 100 });
  }
  function best(files) {
    let pick = null; let pickGain = -1;
    files.slice().sort().forEach(function (f) {
      if (core.indexOf(f) !== -1) return;
      let gain = 0; sets[f].forEach(function (s) { if (!covered.has(s)) gain++; });
      if (gain > pickGain) { pick = f; pickGain = gain; }
    });
    return pick;
  }

  // Phase 1: one per capability, taking the capabilities with the largest best-spec gain first so that coverage
  // rises as early as possible; ties by capability name. Order only affects the reported steps, not the set.
  const remaining = capabilities.filter(function (c) { return byCapability[c].length > 0; }).sort();
  while (remaining.length) {
    let bi = 0; let bg = -1; let bf = null;
    remaining.forEach(function (c, i) {
      const f = best(byCapability[c]);
      if (!f) return;
      let gain = 0; sets[f].forEach(function (s) { if (!covered.has(s)) gain++; });
      if (gain > bg) { bg = gain; bi = i; bf = f; }
    });
    if (!bf) break;
    // A capability already represented by an earlier pick (a spec can serve one capability only) stays represented.
    add(bf);
    remaining.splice(bi, 1);
  }

  // Phase 2: greedy over every other eligible spec until the gain is below the threshold.
  const pool = [];
  capabilities.forEach(function (c) { byCapability[c].forEach(function (f) { if (pool.indexOf(f) === -1) pool.push(f); }); });
  for (;;) {
    const f = best(pool);
    if (!f) break;
    let gain = 0; sets[f].forEach(function (s) { if (!covered.has(s)) gain++; });
    if (gain / total * 100 < threshold) break;
    add(f);
  }
  return { core: core, gaps: gaps, steps: steps, totalStatements: total };
}

if (require.main === module) {
  const meas = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const matrix = JSON.parse(fs.readFileSync(process.argv[3] || path.resolve(__dirname, '..', 'tests', 'e2e', 'capability-matrix.json'), 'utf8'));
  const failedBefore = process.argv[4] ? JSON.parse(fs.readFileSync(process.argv[4], 'utf8')) : [];
  const r = selectCore(meas, matrix, { failedBefore: failedBefore });
  process.stdout.write(JSON.stringify(r, null, 2) + '\n');
}

module.exports = { selectCore };
