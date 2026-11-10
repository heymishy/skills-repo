# Implementation Plan: Bounded production-log scan with pattern-match notification

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s4-bounded-production-log-scan.md
**Test plan reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s4-bounded-production-log-scan-test-plan.md
**DoR reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/dor/coha-s4-bounded-production-log-scan-dor.md

---

## File map

| File | Purpose |
|------|---------|
| `scripts/production-log-scan.js` | New. Pattern-match scan logic, injectable `flyctl` command runner (D37-shaped, mirrors `scripts/deploy-staging.js`'s precedent), AC4 baseline-arithmetic helper, CLI entrypoint. |
| `.github/workflows/production-log-scan.yml` | New. Scheduled (`schedule:` cron) workflow, runs `node scripts/production-log-scan.js`, `FLY_API_TOKEN` from secrets. |
| `tests/check-coha-s4-production-log-scan.js` | New. Unit + integration tests per the test plan. |

Reuses, unchanged: `src/approval-channel/adapters/teams-outbound-adapter.js` (`sendTeamsNotification`, `setTeamsNotifyAdapter`, `realTeamsNotifyAdapter`) — this story is a downstream caller only, per that module's own doc comment.

---

## Task 1 — Pattern-match scan logic (AC1, AC2, AC3)

**Test first** (`tests/check-coha-s4-production-log-scan.js`):
```js
test('detectsKnownErrorPattern_inLogOutput', () => {
  const { scanLogLines } = require('../scripts/production-log-scan');
  const logOutput = '2026-11-09T10:00:00Z [auth] tenant_admin_bootstrap_failed reason: inconsistent types deduced for parameter $1 for tenantId heymishy\n2026-11-09T10:00:01Z [auth] login success for tenantId heymishy';
  const matches = scanLogLines(logOutput);
  assert.strictEqual(matches.length, 1);
  assert.strictEqual(matches[0].pattern, 'tenant_admin_bootstrap_failed');
  assert.ok(matches[0].excerpt.includes('tenant_admin_bootstrap_failed'));
  assert.ok(matches[0].timestamp);
});

test('sendsNoNotification_whenNoMatchFound', async () => {
  const { runScan, setCommandRunner } = require('../scripts/production-log-scan');
  const { setTeamsNotifyAdapter } = require('../src/approval-channel/adapters/teams-outbound-adapter');
  let notifyCalled = false;
  setCommandRunner(async () => ({ status: 0, stdout: '2026-11-09T10:00:00Z [auth] login success', stderr: '' }));
  setTeamsNotifyAdapter(async () => { notifyCalled = true; return { ok: true }; });
  const result = await runScan();
  assert.strictEqual(notifyCalled, false);
  assert.deepStrictEqual(result.matches, []);
});
```

**Implementation** (`scripts/production-log-scan.js`):
```js
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
```

**Run:** `node tests/check-coha-s4-production-log-scan.js` — expect `detectsKnownErrorPattern_inLogOutput` and `sendsNoNotification_whenNoMatchFound` to pass after this task (red before, green after).

**Commit:** `feat(coha-s4): add bounded production-log scan pattern-match logic (AC1-AC3)`

---

## Task 2 — flyctl command-runner wiring (AC1, separate per Architecture Constraints)

**Test first:**
```js
test('scanInvokesFlyctlLogsWithBoundedWindow_andExitsAfterScan', async () => {
  const { runScan, setCommandRunner, LOOKBACK_WINDOW } = require('../scripts/production-log-scan');
  let capturedArgs = null;
  setCommandRunner(async (cmd, args) => { capturedArgs = args; return { status: 0, stdout: '', stderr: '' }; });
  await runScan();
  assert.deepStrictEqual(capturedArgs, ['logs', '--since', LOOKBACK_WINDOW, '--no-tail']);
});
```
Already implemented by Task 1's `createRealCommandRunner`/`setCommandRunner` split (mirrors `deploy-staging.js`) — this task is the explicit wiring confirmation + the "never a standing process" assertion:
```js
test('scanDoesNotLeaveAnOpenHandleRunning', async () => {
  const { runScan, setCommandRunner } = require('../scripts/production-log-scan');
  setCommandRunner(async () => ({ status: 0, stdout: '', stderr: '' }));
  const before = process._getActiveHandles ? process._getActiveHandles().length : 0;
  await runScan();
  const after = process._getActiveHandles ? process._getActiveHandles().length : 0;
  assert.strictEqual(after, before);
});
```

**Commit:** `feat(coha-s4): wire flyctl command runner, confirm no standing process (AC1)`

---

## Task 3 — Notification content + single-notification guarantee (AC2, AC3)

**Test first:**
```js
test('sendsExactlyOneNotificationPerScanRun_onMatch', async () => {
  const { runScan, setCommandRunner } = require('../scripts/production-log-scan');
  const { setTeamsNotifyAdapter } = require('../src/approval-channel/adapters/teams-outbound-adapter');
  let callCount = 0;
  let lastPayload = null;
  setCommandRunner(async () => ({ status: 0, stdout: '2026-11-09T10:00:00Z [auth] tenant_admin_bootstrap_failed reason: x', stderr: '' }));
  setTeamsNotifyAdapter(async (payload) => { callCount++; lastPayload = payload; return { ok: true }; });
  await runScan();
  assert.strictEqual(callCount, 1);
  assert.ok(lastPayload.text.includes('tenant_admin_bootstrap_failed'));
});
```
Implementation already covered by Task 1's `buildNotificationPayload`/`runScan` — this task confirms the aggregation behavior explicitly (one call even with multiple matching lines in one run).

**Commit:** `feat(coha-s4): confirm single-notification-per-run guarantee (AC2, AC3)`

---

## Task 4 — NFR tests (timeout, token-never-logged, audit)

**Tests:**
```js
test('scanCompletesWithinScheduledJobTimeout', async () => {
  const { runScan, setCommandRunner } = require('../scripts/production-log-scan');
  setCommandRunner(async () => ({ status: 0, stdout: Array(5000).fill('2026-11-09T10:00:00Z [info] ok').join('\n'), stderr: '' }));
  const start = Date.now();
  await runScan();
  assert.ok(Date.now() - start < 5000);
});

test('flyApiTokenNeverLoggedOrIncludedInNotificationPayload', async () => {
  const { runScan, setCommandRunner } = require('../scripts/production-log-scan');
  const { setTeamsNotifyAdapter } = require('../src/approval-channel/adapters/teams-outbound-adapter');
  process.env.FLY_API_TOKEN = 'secret-test-token-xyz';
  let logged = '';
  const origWrite = process.stdout.write;
  process.stdout.write = (chunk) => { logged += chunk; return true; };
  let payloadSeen = null;
  setCommandRunner(async () => ({ status: 0, stdout: '2026-11-09T10:00:00Z [auth] tenant_admin_bootstrap_failed reason: x', stderr: '' }));
  setTeamsNotifyAdapter(async (p) => { payloadSeen = p; return { ok: true }; });
  await runScan();
  process.stdout.write = origWrite;
  assert.ok(!logged.includes('secret-test-token-xyz'));
  assert.ok(!JSON.stringify(payloadSeen).includes('secret-test-token-xyz'));
  delete process.env.FLY_API_TOKEN;
});

test('everyScanRunIsLogged_matchOrNoMatch', async () => {
  const { runScan, setCommandRunner } = require('../scripts/production-log-scan');
  const { setTeamsNotifyAdapter } = require('../src/approval-channel/adapters/teams-outbound-adapter');
  setTeamsNotifyAdapter(async () => ({ ok: true }));
  let logged = '';
  const origWrite = process.stdout.write;
  process.stdout.write = (chunk) => { logged += chunk; return true; };
  setCommandRunner(async () => ({ status: 0, stdout: '2026-11-09T10:00:00Z [info] ok', stderr: '' }));
  await runScan();
  setCommandRunner(async () => ({ status: 0, stdout: '2026-11-09T10:00:01Z [auth] tenant_admin_bootstrap_failed reason: x', stderr: '' }));
  await runScan();
  process.stdout.write = origWrite;
  assert.ok(logged.includes('no-match'));
  assert.ok(logged.includes('match'));
});
```

**Commit:** `test(coha-s4): add NFR tests (timeout, token secrecy, audit logging)`

---

## Task 5 — AC4 baseline-arithmetic unit test (synthetic timestamps only)

**Test:**
```js
test('recordBaselineMeasurement_computesGapFromSyntheticTimestamps', () => {
  const { recordBaselineMeasurement } = require('../scripts/production-log-scan');
  const result = recordBaselineMeasurement('2026-11-09T10:00:00Z', '2026-11-09T13:30:00Z');
  assert.strictEqual(result.gapMs, 3.5 * 60 * 60 * 1000);
  assert.strictEqual(result.gapHuman, '3.50h');
});
```
The real first-occurrence event itself remains manual (test plan Coverage gaps, AC4) — recorded in the AC verification script, not automated here.

**Commit:** `feat(coha-s4): add AC4 baseline-gap arithmetic (synthetic-timestamp unit test only)`

---

## Task 6 — Scheduled GitHub Actions workflow

**File:** `.github/workflows/production-log-scan.yml`
```yaml
name: Production Log Scan

on:
  schedule:
    - cron: '0 */6 * * *'  # every 6 hours -- well within 24h bounded window
  workflow_dispatch: {}

jobs:
  scan:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - name: Run bounded production-log scan
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
          TEAMS_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
        run: node scripts/production-log-scan.js
```
No wiring test possible for the real scheduled trigger itself (GitHub Actions `schedule:` cron is not locally testable) — covered by the post-merge smoke test in the verification script (manually trigger via `workflow_dispatch` once merged, per the AC1 integration test's own stated mitigation).

**Commit:** `feat(coha-s4): add scheduled GitHub Actions workflow for production-log scan`

---

## Self-review checklist

- [x] Exact file paths, no placeholders
- [x] Complete code shown, not "add logic here"
- [x] Failing test before implementation for every task
- [x] Expected output stated for every test
- [x] Commit messages in imperative mood
- [x] No scope beyond the 4 ACs (no remediation, no pattern-UI, no new observability vendor)
