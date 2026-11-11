#!/usr/bin/env node
/**
 * ci-chain-notify.js (coha-s2)
 *
 * Shared CI/CD chain notification logic: patch-announce, status (shared
 * across staging-deploy.yml and e2e.yml), and auto-retry visibility
 * (deferring entirely to the existing, unmodified isDeployGroupEviction()
 * gate in deploy-group-auto-rerun.yml). All three call coha-s1's
 * sendTeamsNotification() directly -- no new injectable adapter here, per
 * this story's own Architecture Constraints.
 *
 * Reference: artefacts/2026-11-08-cicd-observability-hardening-automation/
 *            stories/coha-s2-ci-cd-chain-notifications.md
 */
'use strict';

const path = require('path');
const { sendTeamsNotification } = require(path.join(__dirname, '..', '..', 'src', 'approval-channel', 'adapters', 'teams-outbound-adapter.js'));
const { isDeployGroupEviction } = require('./is-deploy-group-eviction.js');

function _log(dispatchType, detail) {
  // NFR-Audit: one log entry per dispatch attempt, supports Metric 1's
  // CI-run-count-vs-dispatch-count measurement method.
  process.stdout.write('[ci-chain-notify] ' + new Date().toISOString() + ' ' + dispatchType + ' ' + detail + '\n');
}

/**
 * AC1: sent before build/deploy steps run, identifies the commit/PR.
 * @param {{commit: string, pr: number|string|null}} args
 */
function notifyPatchAnnounce(args) {
  const commit = args.commit;
  const pr = args.pr;
  _log('announce-attempt', 'commit=' + commit + ' pr=' + pr);
  const prText = pr ? ('PR #' + pr + ' ') : '';
  return sendTeamsNotification({ text: 'Patch announce: build/deploy starting for ' + prText + '(' + commit + ')' });
}

/**
 * AC2: exactly one status notification per completed run -- the caller
 * (one hook point in staging-deploy.yml, one in e2e.yml) is responsible
 * for calling this exactly once per run; this function itself always
 * sends exactly one notification per call, never zero, never more than one.
 * @param {{workflow: string, outcome: 'success'|'failure', commit: string}} args
 */
function notifyStatus(args) {
  const workflow = args.workflow;
  const outcome = args.outcome;
  const commit = args.commit;
  _log('status-attempt', 'workflow=' + workflow + ' outcome=' + outcome);
  const emoji = outcome === 'success' ? '✅' : '❌';
  return sendTeamsNotification({ text: emoji + ' ' + workflow + ' ' + outcome + ' for ' + commit });
}

/**
 * AC3/AC4: defers entirely to the real, unmodified isDeployGroupEviction()
 * decision -- never re-implements or second-guesses it. Sends a retry
 * notification only when the cancellation was a genuine deploy-group
 * eviction AND a rerun was actually fired; sends nothing at all otherwise
 * (AC4's negative-space guarantee -- never notify about a retry that
 * didn't happen).
 * @param {{annotationText: string, runId: string, rerunFired: boolean}} args
 * @returns {Promise<object>|null}
 */
function notifyRetryIfEviction(args) {
  const eviction = isDeployGroupEviction(args.annotationText);
  if (eviction && args.rerunFired) {
    _log('retry-attempt', 'runId=' + args.runId);
    return sendTeamsNotification({ text: '🔁 Auto-retry occurred for run ' + args.runId + ' — deploy-group eviction, not a real failure' });
  }
  return null;
}

module.exports = { notifyPatchAnnounce, notifyStatus, notifyRetryIfEviction };
