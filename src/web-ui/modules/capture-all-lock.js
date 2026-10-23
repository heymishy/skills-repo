'use strict';
// capture-all-lock.js (ppc-s2, AC2) -- in-memory, per-process concurrency
// lock + progress state for one feature's capture-all run. Deliberately
// NOT a durable table -- ppc-s2-dor-contract.md's own Assumptions section:
// "the run completes synchronously within one request/response cycle," so
// there is no cross-process or cross-restart durability requirement for
// this run-scoped state.

var _locks = new Map(); // journeyId -> { current: number, total: number, startedAt: number }

/**
 * @param {string} journeyId
 * @returns {boolean} true if the lock was acquired, false if already held
 */
function tryAcquireLock(journeyId) {
  if (_locks.has(journeyId)) return false;
  _locks.set(journeyId, { current: 0, total: 0, startedAt: Date.now() });
  return true;
}

function setTotal(journeyId, total) {
  var lockState = _locks.get(journeyId);
  if (lockState) lockState.total = total;
}

function updateProgress(journeyId, current) {
  var lockState = _locks.get(journeyId);
  if (lockState) lockState.current = current;
}

function releaseLock(journeyId) {
  _locks.delete(journeyId);
}

/**
 * @param {string} journeyId
 * @returns {{current:number, total:number, startedAt:number}|null}
 */
function getLockState(journeyId) {
  return _locks.get(journeyId) || null;
}

/** Test helper -- reset all lock state between tests. */
function _clearForTesting() { _locks.clear(); }

module.exports = { tryAcquireLock, setTotal, updateProgress, releaseLock, getLockState, _clearForTesting };
