'use strict';
// capture-all.js (ppc-s2) -- pure helpers for the capture-all loop. No
// store/adapter access, so every function here is unit-testable with plain
// fixtures, independent of journey-store or Postgres.

/**
 * ppc-s2 (AC1, AC6) -- splits a feature's DoD AC list into captureable
 * (has a stored or auto-resolved target) and skipped (neither, named reason)
 * groups. actr-s3 (AC1, AC2): also accepts autoResolvedTargets, the same
 * shape as captureTargets -- a manual target always wins when both exist
 * for the same AC.
 * @param {{acs: Array<{acId:string}>, captureTargets: Array<{acId:string,url:string,selector:string}>, autoResolvedTargets?: Array<{acId:string,url:string,selector:string}>}} feature
 * @returns {{toCapture: Array<{acId:string, target:{url:string,selector:string}}>, skipped: Array<{acId:string, reason:string}>}}
 */
function buildCaptureAllList(feature) {
  var acs = (feature && feature.acs) || [];
  var targets = (feature && feature.captureTargets) || [];
  var autoTargets = (feature && feature.autoResolvedTargets) || [];
  var toCapture = [];
  var skipped = [];
  acs.forEach(function(ac) {
    // Code-quality review (Task 1): first match wins when an acId is
    // duplicated within either array -- duplicates are not expected or
    // validated here, consistent with this module's existing pure-merge
    // contract (no validation of its own inputs).
    var manual = targets.find(function(t) { return t.acId === ac.acId; });
    var auto = autoTargets.find(function(t) { return t.acId === ac.acId; });
    var source = manual || auto;
    if (source) {
      toCapture.push({ acId: ac.acId, target: { url: source.url, selector: source.selector } });
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
