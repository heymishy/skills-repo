'use strict';

/**
 * coha-s4 -- bounded, triggered-and-bounded (never standing) scheduled scan
 * of recent production logs for known error patterns, notifying via
 * coha-s1's outbound Teams adapter on a match.
 *
 * flyctl invocation is an injectable adapter (D37), mirroring the precedent
 * in scripts/deploy-staging.js -- the scan/match LOGIC is unit-testable
 * without invoking a real flyctl binary.
 */

const path = require('path');
const {
  setTeamsNotifyAdapter,
  realTeamsNotifyAdapter,
  sendTeamsNotification
} = require(path.join(__dirname, '..', 'src', 'approval-channel', 'adapters', 'teams-outbound-adapter.js'));

// Bounded window: hours-to-a-day, comfortably within the confirmed 7-day
// retention (product/constraints.md #11, /clarify). Do not approach 7d
// without re-confirming retention still covers it.
const LOOKBACK_WINDOW = '24h';

// Static, code-maintained list for this MVP (Out of Scope: no editable UI).
const KNOWN_ERROR_PATTERNS = [
  { name: 'tenant_admin_bootstrap_failed', regex: /tenant_admin_bootstrap_failed/ }
];

let _runCommand = null;

function setCommandRunner(fn) {
  _runCommand = fn;
}

function _requireCommandRunner() {
  if (!_runCommand) {
    throw new Error('Adapter not wired: commandRunner. Call setCommandRunner() with a real implementation before use.');
  }
  return _runCommand;
}

function _auditLog(outcome, detail) {
  // Never includes FLY_API_TOKEN -- outcome/detail are derived only from
  // match count and pattern names, never from raw env/secret values.
  process.stdout.write('[production-log-scan] ' + new Date().toISOString() + ' ' + outcome + ' ' + detail + '\n');
}

/**
 * Pure pattern-match logic -- no I/O, unit-testable without flyctl.
 * @param {string} logOutput
 * @returns {Array<{pattern: string, excerpt: string, timestamp: string}>}
 */
function scanLogLines(logOutput) {
  const matches = [];
  (logOutput || '').split('\n').forEach(function(line) {
    KNOWN_ERROR_PATTERNS.forEach(function(p) {
      if (p.regex.test(line)) {
        matches.push({ pattern: p.name, excerpt: line.trim(), timestamp: new Date().toISOString() });
      }
    });
  });
  return matches;
}

/**
 * One notification per scan run, even if multiple lines matched in that
 * run -- AC2 says "exactly one notification is sent" per run, not per line.
 */
function buildNotificationPayload(matches) {
  const lines = matches.map(function(m) {
    return '[' + m.timestamp + '] ' + m.pattern + ': ' + m.excerpt;
  }).join('\n');
  return { text: 'Production log scan found ' + matches.length + ' known error pattern match(es):\n' + lines };
}

/**
 * AC4 -- diff-recording arithmetic only. The real first-occurrence event is
 * a manual/operational trigger (see test plan Coverage gaps); this function
 * is the testable mechanism that records the gap once that event happens.
 * @returns {{gapMs: number, gapHuman: string}}
 */
function recordBaselineMeasurement(defectTimestampIso, detectionTimestampIso) {
  const gapMs = new Date(detectionTimestampIso).getTime() - new Date(defectTimestampIso).getTime();
  const gapHours = gapMs / (1000 * 60 * 60);
  return { gapMs: gapMs, gapHuman: gapHours.toFixed(2) + 'h' };
}

/**
 * Runs the scan once and exits -- never a standing process. Scheduled by
 * the GitHub Actions workflow's own `schedule:` cron trigger.
 */
async function runScan() {
  const run = _requireCommandRunner();
  const result = await run('flyctl', ['logs', '--since', LOOKBACK_WINDOW, '--no-tail']);

  if (result.status !== 0) {
    _auditLog('error', 'flyctl logs exited ' + result.status);
    return { ok: false, matches: [] };
  }

  const matches = scanLogLines(result.stdout);

  if (matches.length === 0) {
    _auditLog('no-match', 'scan completed, 0 matches');
    return { ok: true, matches: [] };
  }

  const sendResult = await sendTeamsNotification(buildNotificationPayload(matches));
  _auditLog('match', matches.length + ' match(es) found, notification ' + (sendResult.ok ? 'sent' : 'FAILED: ' + sendResult.error));
  return { ok: true, matches: matches, notified: sendResult.ok };
}

function createRealCommandRunner() {
  const { spawnSync } = require('child_process');
  return async function(cmd, args) {
    const result = spawnSync(cmd, args, { encoding: 'utf8' });
    return { status: result.status, stdout: result.stdout, stderr: result.stderr };
  };
}

if (require.main === module) {
  setCommandRunner(createRealCommandRunner());
  setTeamsNotifyAdapter(realTeamsNotifyAdapter);
  runScan().then(function(result) {
    process.exit(result.ok ? 0 : 1);
  }).catch(function(err) {
    console.error('production-log-scan failed unexpectedly:', err.message);
    process.exit(1);
  });
}

module.exports = {
  runScan,
  scanLogLines,
  buildNotificationPayload,
  recordBaselineMeasurement,
  setCommandRunner,
  KNOWN_ERROR_PATTERNS,
  LOOKBACK_WINDOW
};
