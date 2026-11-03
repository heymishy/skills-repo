#!/usr/bin/env node
/**
 * is-deploy-group-eviction.js
 *
 * fhff-s2 -- decision function distinguishing a genuine `deploy-group`
 * concurrency-eviction cancellation (recoverable: safe to auto-rerun) from
 * a real job failure (not safe to auto-rerun -- rerunning it would mask a
 * genuine failure as transient).
 *
 * The exact text matched here is the real GitHub Actions cancellation
 * annotation for this concurrency group -- confirmed live on PR #633 and
 * documented in .github/workflows/e2e.yml's own historical comments:
 *   "Canceling since a higher priority waiting request for deploy-group
 *   exists"
 *
 * See: artefacts/2026-11-01-fixture-hardening-fast-follows/stories/
 *      fhff-s2-ci-deploy-group-concurrency-fix.md (AC2, AC3).
 */
'use strict';

const DEPLOY_GROUP_EVICTION_TEXT =
  'Canceling since a higher priority waiting request for deploy-group exists';

/**
 * Returns true only when annotationText matches the real GitHub Actions
 * cancellation pattern for the deploy-group concurrency group. Returns
 * false for anything else -- including genuine failure messages -- so the
 * auto-rerun mechanism this function feeds never attempts to rerun a run
 * that failed for a real reason.
 *
 * @param {string} annotationText
 * @returns {boolean}
 */
function isDeployGroupEviction(annotationText) {
  if (typeof annotationText !== 'string') {
    return false;
  }
  return annotationText.includes(DEPLOY_GROUP_EVICTION_TEXT);
}

module.exports = { isDeployGroupEviction, DEPLOY_GROUP_EVICTION_TEXT };
