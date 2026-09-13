'use strict';

// repo-freshness.js — rclr-s1: lazily refresh a tenant's local repo checkout
// on active web UI access, instead of only ever advancing on a full app
// redeploy (root cause found 2026-09-13: journey.js's _readPipelineFeatures
// reads a local git checkout on the server that is never told to `git pull`).
//
// Deliberately NOT a background poller. This is invoked exclusively from the
// real request-serving read path (_readPipelineFeatures) -- an idle tenant's
// repo is never touched. Each repoRoot tracks its own last-attempt time
// independently, so refreshing one tenant's checkout never affects another's.
//
// SAFETY: uses `git pull --ff-only`, never a rebase or a destructive reset.
// skills.js already runs real `git add`/`git commit` against this exact same
// local checkout when a skill session saves an artefact -- the checkout can
// legitimately hold real, locally-committed-but-not-yet-pushed work at the
// moment a refresh is attempted. --ff-only fails safely (non-zero exit,
// caught below) rather than discarding anything when local history has
// diverged from origin for that reason.

var _cp = require('child_process');

var DEFAULT_TTL_MS = 2 * 60 * 1000; // 2 minutes

var _lastAttemptAt = {}; // repoRoot -> timestamp ms, independent per repo

/**
 * Refresh repoRoot's local checkout via `git pull --ff-only`, at most once
 * per ttlMs for that specific repoRoot. Never throws.
 *
 * @param {string} repoRoot - resolved, server-side tenant-scoped repo path
 * @param {{now?: Function, exec?: Function, ttlMs?: number}} [deps] - injected for testability
 * @returns {{pulled: boolean, reason?: string, error?: string}}
 */
function ensureRepoFresh(repoRoot, deps) {
  deps = deps || {};
  var now = (deps.now || Date.now)();
  var ttlMs = deps.ttlMs != null ? deps.ttlMs : DEFAULT_TTL_MS;
  var exec = deps.exec || _cp.execSync;

  var lastAttempt = _lastAttemptAt[repoRoot] || 0;
  if (now - lastAttempt < ttlMs) {
    return { pulled: false, reason: 'fresh' };
  }

  // Record the attempt before running git, so a failing pull doesn't get
  // retried on every single request until the TTL genuinely elapses again.
  _lastAttemptAt[repoRoot] = now;

  try {
    exec('git pull --ff-only', { cwd: repoRoot, timeout: 5000, encoding: 'utf8' });
    return { pulled: true };
  } catch (err) {
    return { pulled: false, reason: 'pull-failed', error: err && err.message };
  }
}

/**
 * Test-only: clear all recorded last-attempt timestamps.
 */
function _resetForTesting() {
  _lastAttemptAt = {};
}

module.exports = { ensureRepoFresh: ensureRepoFresh, _resetForTesting: _resetForTesting };
