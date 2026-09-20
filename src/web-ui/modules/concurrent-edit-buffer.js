'use strict';

// concurrent-edit-buffer.js — ep2-s4 AC1. In-memory per-journeyId+stageName
// save-request buffer, modeled directly on modules/presence-store.js's own
// established Map<key,...> + injectable _now()/setNow() pattern.
//
// Concurrency window is EXACTLY 100ms (DoR Architecture Constraint: "not 99,
// not 101 -- this is the AC boundary"). A save strictly within 100ms of the
// last save for the same key is flagged concurrent; a save at exactly the
// boundary or later is not (a Date.now()-based >= check keeps the boundary
// unambiguous and testable).

var _now = function () { return Date.now(); };
function setNow(fn) { _now = fn; }

var WINDOW_MS = 100;

/** @type {Map<string, {userId: string, content: string, timestamp: number}>} */
var _lastSave = new Map();

/**
 * Register a save for journeyId+stageName key and check whether a prior save
 * for the SAME key landed within the last 100ms.
 * @param {string} key - typically `${journeyId}:${stageName}`
 * @param {string} userId
 * @param {string} content
 * @returns {{concurrentWith: {userId:string, content:string, timestamp:number}|null}}
 */
function registerSave(key, userId, content) {
  var now = _now();
  var prior = _lastSave.get(key);
  var concurrentWith = null;
  if (prior && (now - prior.timestamp) < WINDOW_MS) {
    concurrentWith = prior;
  }
  _lastSave.set(key, { userId: userId, content: content, timestamp: now });
  return { concurrentWith: concurrentWith };
}

function _clearForTesting() { _lastSave = new Map(); }

module.exports = { registerSave, setNow, WINDOW_MS, _clearForTesting };
