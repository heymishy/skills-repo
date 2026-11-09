#!/usr/bin/env node
/**
 * scripts/notify-teams.js — coha-s1
 *
 * Wiring entry point for the outbound Teams notification adapter. Wires
 * the real implementation (realTeamsNotifyAdapter) to
 * teams-outbound-adapter.js's injectable setter, then sends one
 * notification using a message payload passed as a JSON string argument.
 *
 * This is the "production wiring" task required by D37, kept as a separate
 * concern from building the handler + injectable setter (that task lives
 * entirely in src/approval-channel/adapters/teams-outbound-adapter.js).
 *
 * Intended caller: a GitHub Actions workflow step, one per notification
 * source (coha-s2: CI/CD chain events, coha-s3: vulnerability findings,
 * coha-s4: production-log matches). Each future story's workflow step
 * shells out to this same script with its own payload shape -- this
 * story only provides the generic send mechanism (see Out of Scope).
 *
 * Usage:
 *   node scripts/notify-teams.js '{"text":"Deploy succeeded"}'
 *
 * Exit code 0 on successful send, 1 on any failure (missing/invalid
 * argument, or the adapter itself reporting ok:false).
 */
'use strict';

const path = require('path');
const {
  setTeamsNotifyAdapter,
  realTeamsNotifyAdapter,
  sendTeamsNotification
} = require(path.join(__dirname, '..', 'src', 'approval-channel', 'adapters', 'teams-outbound-adapter.js'));

setTeamsNotifyAdapter(realTeamsNotifyAdapter);

async function main() {
  const raw = process.argv[2];
  if (!raw) {
    process.stderr.write('[notify-teams] Usage: node scripts/notify-teams.js \'{"text":"..."}\'\n');
    process.exit(1);
    return;
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (_) {
    process.stderr.write('[notify-teams] Invalid JSON payload argument\n');
    process.exit(1);
    return;
  }

  const result = await sendTeamsNotification(payload);
  if (!result.ok) {
    process.stderr.write('[notify-teams] Notification failed: ' + result.error + '\n');
    process.exit(1);
    return;
  }

  process.stdout.write('[notify-teams] Notification sent successfully\n');
}

main();
