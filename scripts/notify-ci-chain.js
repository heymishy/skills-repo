#!/usr/bin/env node
/**
 * scripts/notify-ci-chain.js (coha-s2)
 *
 * Wiring entry point for the shared CI/CD chain notification logic
 * (scripts/lib/ci-chain-notify.js). Wires the real implementation
 * (realTeamsNotifyAdapter) to coha-s1's injectable setter -- same
 * pattern as scripts/notify-teams.js -- then dispatches one of the
 * three notification modes using JSON args passed as a string argument.
 *
 * This is the "production wiring" task required by D37 for the adapter
 * this story calls; this story itself introduces no new injectable
 * adapter (per its own Architecture Constraints).
 *
 * Usage:
 *   node scripts/notify-ci-chain.js announce '{"commit":"abc123","pr":1234}'
 *   node scripts/notify-ci-chain.js status '{"workflow":"Staging Deploy","outcome":"success","commit":"abc123"}'
 *   node scripts/notify-ci-chain.js retry '{"annotationText":"...","runId":"123","rerunFired":true}'
 *
 * Exit code 0 on success (or on a legitimate "no notification needed"
 * outcome for retry mode), 1 on any failure.
 */
'use strict';

const path = require('path');
const {
  setTeamsNotifyAdapter,
  realTeamsNotifyAdapter
} = require(path.join(__dirname, '..', 'src', 'approval-channel', 'adapters', 'teams-outbound-adapter.js'));
const { notifyPatchAnnounce, notifyStatus, notifyRetryIfEviction } = require(path.join(__dirname, 'lib', 'ci-chain-notify.js'));

setTeamsNotifyAdapter(realTeamsNotifyAdapter);

async function main() {
  const mode = process.argv[2];
  const raw = process.argv[3];

  if (!mode || !raw) {
    process.stderr.write('[notify-ci-chain] Usage: node scripts/notify-ci-chain.js <announce|status|retry> \'{"...json args..."}\'\n');
    process.exit(1);
    return;
  }

  let args;
  try {
    args = JSON.parse(raw);
  } catch (_) {
    process.stderr.write('[notify-ci-chain] Invalid JSON args argument\n');
    process.exit(1);
    return;
  }

  let result;
  if (mode === 'announce') {
    result = await notifyPatchAnnounce(args);
  } else if (mode === 'status') {
    result = await notifyStatus(args);
  } else if (mode === 'retry') {
    result = await notifyRetryIfEviction(args);
  } else {
    process.stderr.write('[notify-ci-chain] Unknown mode: ' + mode + ' (expected announce|status|retry)\n');
    process.exit(1);
    return;
  }

  if (result === null) {
    process.stdout.write('[notify-ci-chain] no notification sent (not applicable for this outcome)\n');
    return;
  }

  if (!result.ok) {
    process.stderr.write('[notify-ci-chain] Notification failed: ' + result.error + '\n');
    process.exit(1);
    return;
  }

  process.stdout.write('[notify-ci-chain] Notification sent successfully\n');
}

main();
