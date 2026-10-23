'use strict';
// capture-all.js (ppc-s2) -- pure helpers for the capture-all loop. No
// store/adapter access, so every function here is unit-testable with plain
// fixtures, independent of journey-store or Postgres.

/**
 * ppc-s2 (AC1, AC6) -- splits a feature's DoD AC list into captureable
 * (has a stored target) and skipped (no target, named reason) groups.
 * @param {{acs: Array<{acId:string}>, captureTargets: Array<{acId:string,url:string,selector:string}>}} feature
 * @returns {{toCapture: Array<{acId:string, target:{url:string,selector:string}}>, skipped: Array<{acId:string, reason:string}>}}
 */
function buildCaptureAllList(feature) {
  var acs = (feature && feature.acs) || [];
  var targets = (feature && feature.captureTargets) || [];
  var toCapture = [];
  var skipped = [];
  acs.forEach(function(ac) {
    var target = targets.find(function(t) { return t.acId === ac.acId; });
    if (target) {
      toCapture.push({ acId: ac.acId, target: { url: target.url, selector: target.selector } });
    } else {
      skipped.push({ acId: ac.acId, reason: 'no capture target set' });
    }
  });
  return { toCapture: toCapture, skipped: skipped };
}

/**
 * ppc-s2 (AC3) -- real elapsed milliseconds between two timestamps (e.g.
 * Date.now() values). The route handler is responsible for sourcing real
 * wall-clock values; this is pure arithmetic so its own test stays decoupled
 * from actual timing.
 * @param {number} start
 * @param {number} end
 * @returns {number}
 */
function measureCaptureDuration(start, end) {
  return end - start;
}

var TIMING_THRESHOLD_MS = 60000;

/**
 * ppc-s2 (AC4) -- strictly greater-than 60s (discovery.md's own named
 * trigger condition). Exactly 60000ms does not trigger the flag.
 * @param {number} durationMs
 * @returns {{exceedsThreshold: boolean}}
 */
function checkTimingThreshold(durationMs) {
  return { exceedsThreshold: durationMs > TIMING_THRESHOLD_MS };
}

module.exports = { buildCaptureAllList, measureCaptureDuration, checkTimingThreshold, TIMING_THRESHOLD_MS };
