#!/usr/bin/env node
/**
 * check-coha-s4-production-log-scan.js
 *
 * Automated tests for the bounded production-log scan (coha-s4).
 *
 * Unit (AC2): detectsKnownErrorPattern_inLogOutput
 * Unit (AC1): scanInvokesFlyctlLogsWithBoundedWindow_andExitsAfterScan
 * Unit (AC1): scanDoesNotLeaveAnOpenHandleRunning
 * Unit (AC3): sendsNoNotification_whenNoMatchFound
 * Unit (AC4): recordBaselineMeasurement_computesGapFromSyntheticTimestamps
 * Integration (AC1): scanRunsAgainstRealFlyctlCliShape_inScheduledWorkflowContext
 * Integration (AC2): notificationDispatchIsCiGateVerifiable_onKnownBadLogLine
 * Integration (AC2): sendsExactlyOneNotificationPerScanRun_onMatch
 * NFR (Performance): scanCompletesWithinScheduledJobTimeout
 * NFR (Security): flyApiTokenNeverLoggedOrIncludedInNotificationPayload
 * NFR (Audit): everyScanRunIsLogged_matchOrNoMatch
 *
 * Run:  node tests/check-coha-s4-production-log-scan.js
 * Used: npm test (auto-discovered by scripts/run-all-tests.js's tests/check-*.js glob)
 */
'use strict';

var path = require('path');
var root = path.join(__dirname, '..');
var scan = require(path.join(root, 'scripts', 'production-log-scan.js'));
var adapter = require(path.join(root, 'src', 'approval-channel', 'adapters', 'teams-outbound-adapter.js'));

// ── Test harness ──────────────────────────────────────────────────────────────

var passed = 0;
var failed = 0;

function pass(name) {
  passed++;
  process.stdout.write('  ✓ ' + name + '\n');
}

function fail(name, reason) {
  failed++;
  process.stdout.write('  ✗ ' + name + '\n');
  process.stdout.write('    → ' + reason + '\n');
}

function assert(condition, name, reason) {
  if (condition) pass(name);
  else fail(name, reason);
}

function captureStdout(fn) {
  var original = process.stdout.write;
  var captured = [];
  process.stdout.write = function(chunk) {
    captured.push(chunk);
    return true;
  };
  return Promise.resolve(fn()).then(function(result) {
    process.stdout.write = original;
    return { result: result, output: captured.join('') };
  }, function(err) {
    process.stdout.write = original;
    throw err;
  });
}

var KNOWN_BAD_LINE = '2026-11-09T10:00:00.000Z [auth] tenant_admin_bootstrap_failed reason: inconsistent types deduced for parameter $1 for tenantId heymishy';
var CLEAN_LINE = '2026-11-09T10:00:00.000Z [auth] login success for tenantId heymishy';

async function run() {

  // ── Unit (AC2): pure pattern-match logic, no I/O ────────────────────────────
  {
    var logOutput = KNOWN_BAD_LINE + '\n' + CLEAN_LINE;
    var matches = scan.scanLogLines(logOutput);
    assert(
      matches.length === 1 && matches[0].pattern === 'tenant_admin_bootstrap_failed' && matches[0].excerpt.indexOf('tenant_admin_bootstrap_failed') !== -1 && !!matches[0].timestamp,
      'detectsKnownErrorPattern_inLogOutput',
      'Expected exactly 1 match with pattern/excerpt/timestamp. Got: ' + JSON.stringify(matches)
    );
  }

  // ── Unit (AC1): bounded window arguments, exits after scan ──────────────────
  {
    var capturedArgs = null;
    scan.setCommandRunner(async function(cmd, args) { capturedArgs = args; return { status: 0, stdout: '', stderr: '' }; });
    await scan.runScan();
    assert(
      capturedArgs && capturedArgs[0] === 'logs' && capturedArgs[1] === '--since' && capturedArgs[2] === scan.LOOKBACK_WINDOW && capturedArgs[3] === '--no-tail',
      'scanInvokesFlyctlLogsWithBoundedWindow_andExitsAfterScan',
      'Expected ["logs","--since","' + scan.LOOKBACK_WINDOW + '","--no-tail"], got ' + JSON.stringify(capturedArgs)
    );
  }

  // ── Unit (AC1): no standing process / open handle left behind ───────────────
  {
    scan.setCommandRunner(async function() { return { status: 0, stdout: '', stderr: '' }; });
    var before = process._getActiveHandles ? process._getActiveHandles().length : 0;
    await scan.runScan();
    var after = process._getActiveHandles ? process._getActiveHandles().length : 0;
    assert(
      after === before,
      'scanDoesNotLeaveAnOpenHandleRunning',
      'Active handle count changed from ' + before + ' to ' + after + ' after runScan()'
    );
  }

  // ── Unit (AC3): no match -> no notification, clean exit ─────────────────────
  {
    var notifyCalled = false;
    scan.setCommandRunner(async function() { return { status: 0, stdout: CLEAN_LINE, stderr: '' }; });
    adapter.setTeamsNotifyAdapter(async function() { notifyCalled = true; return { ok: true }; });
    var result = await scan.runScan();
    assert(
      notifyCalled === false && result.ok === true && result.matches.length === 0,
      'sendsNoNotification_whenNoMatchFound',
      'Expected no adapter call and ok:true with empty matches. Got notifyCalled=' + notifyCalled + ' result=' + JSON.stringify(result)
    );
  }

  // ── Unit (AC4): baseline-gap arithmetic, synthetic timestamps only ──────────
  {
    var gapResult = scan.recordBaselineMeasurement('2026-11-09T10:00:00Z', '2026-11-09T13:30:00Z');
    var expectedMs = 3.5 * 60 * 60 * 1000;
    assert(
      gapResult.gapMs === expectedMs && gapResult.gapHuman === '3.50h',
      'recordBaselineMeasurement_computesGapFromSyntheticTimestamps',
      'Expected gapMs=' + expectedMs + ' gapHuman="3.50h", got ' + JSON.stringify(gapResult)
    );
  }

  // ── Integration (AC1): real-shaped CLI invocation, clean process exit ───────
  {
    scan.setCommandRunner(async function(cmd, args) {
      assert(cmd === 'flyctl', 'scanRunsAgainstRealFlyctlCliShape_inScheduledWorkflowContext:cmd', 'Expected cmd "flyctl", got ' + cmd);
      return { status: 0, stdout: CLEAN_LINE, stderr: '' };
    });
    var r = await scan.runScan();
    assert(
      r.ok === true,
      'scanRunsAgainstRealFlyctlCliShape_inScheduledWorkflowContext',
      'Expected the scan to complete cleanly against a CLI-contract-faithful double. Got ' + JSON.stringify(r)
    );
  }

  // ── Integration (AC2): CI-gate-verifiable dispatch on a known-bad line ──────
  {
    var dispatchedPayload = null;
    scan.setCommandRunner(async function() { return { status: 0, stdout: KNOWN_BAD_LINE, stderr: '' }; });
    adapter.setTeamsNotifyAdapter(async function(payload) { dispatchedPayload = payload; return { ok: true }; });
    await scan.runScan();
    assert(
      !!dispatchedPayload && dispatchedPayload.text.indexOf('tenant_admin_bootstrap_failed') !== -1,
      'notificationDispatchIsCiGateVerifiable_onKnownBadLine',
      'Expected the dispatched payload text to include the matched pattern name. Got ' + JSON.stringify(dispatchedPayload)
    );
  }

  // ── Integration (AC2, AC3): exactly one notification per run, even with multiple matching lines ──
  {
    var callCount = 0;
    var lastPayload = null;
    scan.setCommandRunner(async function() { return { status: 0, stdout: KNOWN_BAD_LINE + '\n' + KNOWN_BAD_LINE, stderr: '' }; });
    adapter.setTeamsNotifyAdapter(async function(payload) { callCount++; lastPayload = payload; return { ok: true }; });
    await scan.runScan();
    assert(
      callCount === 1 && lastPayload.text.indexOf('tenant_admin_bootstrap_failed') !== -1,
      'sendsExactlyOneNotificationPerScanRun_onMatch',
      'Expected exactly 1 adapter call even with 2 matching lines in one run. Got callCount=' + callCount
    );
  }

  // ── NFR Performance: completes well within scheduled job timeout ────────────
  {
    var bigLog = [];
    for (var i = 0; i < 5000; i++) { bigLog.push(CLEAN_LINE); }
    scan.setCommandRunner(async function() { return { status: 0, stdout: bigLog.join('\n'), stderr: '' }; });
    var start = Date.now();
    await scan.runScan();
    var elapsed = Date.now() - start;
    assert(
      elapsed < 5000,
      'scanCompletesWithinScheduledJobTimeout',
      'Expected scan over 5000 log lines to complete in under 5000ms, took ' + elapsed + 'ms'
    );
  }

  // ── NFR Security: FLY_API_TOKEN never logged or in notification payload ─────
  {
    var originalToken = process.env.FLY_API_TOKEN;
    process.env.FLY_API_TOKEN = 'secret-test-token-xyz';
    var payloadSeen = null;
    scan.setCommandRunner(async function() { return { status: 0, stdout: KNOWN_BAD_LINE, stderr: '' }; });
    adapter.setTeamsNotifyAdapter(async function(p) { payloadSeen = p; return { ok: true }; });
    var capture = await captureStdout(function() { return scan.runScan(); });
    if (originalToken === undefined) { delete process.env.FLY_API_TOKEN; } else { process.env.FLY_API_TOKEN = originalToken; }
    assert(
      capture.output.indexOf('secret-test-token-xyz') === -1 && JSON.stringify(payloadSeen).indexOf('secret-test-token-xyz') === -1,
      'flyApiTokenNeverLoggedOrIncludedInNotificationPayload',
      'Expected zero occurrences of the token value in logs or payload. logOutput=' + JSON.stringify(capture.output) + ' payload=' + JSON.stringify(payloadSeen)
    );
  }

  // ── NFR Audit: every scan run logged, match or no-match ─────────────────────
  {
    adapter.setTeamsNotifyAdapter(async function() { return { ok: true }; });

    scan.setCommandRunner(async function() { return { status: 0, stdout: CLEAN_LINE, stderr: '' }; });
    var noMatchCapture = await captureStdout(function() { return scan.runScan(); });

    scan.setCommandRunner(async function() { return { status: 0, stdout: KNOWN_BAD_LINE, stderr: '' }; });
    var matchCapture = await captureStdout(function() { return scan.runScan(); });

    assert(
      noMatchCapture.output.indexOf('no-match') !== -1 && matchCapture.output.indexOf('match') !== -1,
      'everyScanRunIsLogged_matchOrNoMatch',
      'Expected a logged outcome for both runs. noMatchOutput=' + JSON.stringify(noMatchCapture.output) + ' matchOutput=' + JSON.stringify(matchCapture.output)
    );
  }

  // ── Summary ──────────────────────────────────────────────────────────────────

  process.stdout.write('\n');
  if (failed === 0) {
    process.stdout.write('  All ' + passed + ' tests passed.\n\n');
  } else {
    process.stdout.write('  ' + failed + ' test(s) failed, ' + passed + ' passed.\n\n');
    process.exit(1);
  }
}

run().catch(function(err) {
  process.stderr.write('\nFatal error in check-coha-s4-production-log-scan.js: ' + (err && err.stack || err) + '\n');
  process.exit(1);
});
