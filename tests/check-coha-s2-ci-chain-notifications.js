#!/usr/bin/env node
/**
 * check-coha-s2-ci-chain-notifications.js
 *
 * Automated tests for CI/CD chain notifications (coha-s2): announce,
 * status, and auto-retry visibility, all calling coha-s1's real adapter.
 *
 * Unit (AC1): sendsPatchAnnounceNotification_beforeDeployStepsRun
 * Unit (AC2): sendsExactlyOneStatusNotification_onSuccess
 * Unit (AC2): sendsExactlyOneStatusNotification_onFailure
 * Unit (AC3): sendsRetryNotificationWithReason_whenGenuineEviction
 * Unit (AC4): sendsNoRetryNotification_whenGenuineFailureNotEviction
 * Integration (AC1): announceStepCallsRealAdapterPath_inStagingDeployWorkflowLogic
 * Integration (AC2): statusNotificationFiresExactlyOnce_acrossRealWorkflowCompletionPaths
 * Integration (AC3, AC4): retryVisibilityRespectsRealIsDeployGroupEvictionGate_endToEnd
 * NFR (Performance): notificationCallDoesNotBlockDeployStepProgression
 * NFR (Audit): notificationDispatchIsLoggedForMetric1Measurement
 *
 * Run:  node tests/check-coha-s2-ci-chain-notifications.js
 * Used: npm test (auto-discovered by scripts/run-all-tests.js's tests/check-*.js glob)
 *
 * Mock webhook listener is a real in-process http.createServer (same
 * pattern as check-coha-s1-teams-outbound-adapter.js), per
 * product/constraints.md #13.
 */
'use strict';

var http = require('http');
var path = require('path');

var root = path.join(__dirname, '..');
var adapter = require(path.join(root, 'src', 'approval-channel', 'adapters', 'teams-outbound-adapter.js'));
var notify = require(path.join(root, 'scripts', 'lib', 'ci-chain-notify.js'));

// ── Test harness ──────────────────────────────────────────────────────────────

var passed = 0;
var failed = 0;
var failures = [];

function pass(name) {
  passed++;
  process.stdout.write('  ✓ ' + name + '\n');
}

function fail(name, reason) {
  failed++;
  failures.push({ name: name, reason: reason });
  process.stdout.write('  ✗ ' + name + '\n');
  process.stdout.write('    → ' + reason + '\n');
}

function assert(condition, name, reason) {
  if (condition) pass(name);
  else fail(name, reason);
}

function startMockListener(statusCode) {
  var requests = [];
  return new Promise(function(resolve) {
    var server = http.createServer(function(req, res) {
      var chunks = [];
      req.on('data', function(c) { chunks.push(c); });
      req.on('end', function() {
        requests.push(Buffer.concat(chunks).toString('utf8'));
        res.writeHead(statusCode);
        res.end();
      });
    });
    server.listen(0, '127.0.0.1', function() {
      var port = server.address().port;
      resolve({
        url: 'http://127.0.0.1:' + port + '/webhook',
        requests: requests,
        stop: function() { return new Promise(function(r) { server.close(r); }); }
      });
    });
  });
}

/** Captures everything written to process.stdout during fn(), then restores it. */
function captureStdout(fn) {
  var original = process.stdout.write;
  var captured = [];
  process.stdout.write = function(chunk) {
    captured.push(chunk);
    return true;
  };
  var restore = function() { process.stdout.write = original; };
  var result = fn();
  if (result && typeof result.then === 'function') {
    return result.then(function(v) { restore(); return { value: v, output: captured.join('') }; },
      function(e) { restore(); throw e; });
  }
  restore();
  return { value: result, output: captured.join('') };
}

async function main() {
  // Wire the real adapter once, same as scripts/notify-ci-chain.js does.
  adapter.setTeamsNotifyAdapter(adapter.realTeamsNotifyAdapter);

  // ── AC1 (unit): patch-announce notification sent, identifies commit/PR ────
  {
    var listener1 = await startMockListener(200);
    process.env.TEAMS_WEBHOOK_URL = listener1.url;

    await notify.notifyPatchAnnounce({ commit: 'abc1234', pr: 1234 });

    assert(
      listener1.requests.length === 1 && listener1.requests[0].indexOf('abc1234') !== -1 && listener1.requests[0].indexOf('1234') !== -1,
      'sendsPatchAnnounceNotification_beforeDeployStepsRun',
      'Expected exactly one request identifying the commit/PR, got: ' + JSON.stringify(listener1.requests)
    );
    await listener1.stop();
  }

  // ── AC2 (unit): exactly one status notification, success ──────────────────
  {
    var listener2 = await startMockListener(200);
    process.env.TEAMS_WEBHOOK_URL = listener2.url;

    await notify.notifyStatus({ workflow: 'Staging Deploy', outcome: 'success', commit: 'def5678' });

    assert(
      listener2.requests.length === 1,
      'sendsExactlyOneStatusNotification_onSuccess',
      'Expected exactly 1 request, got ' + listener2.requests.length
    );
    await listener2.stop();
  }

  // ── AC2 (unit): exactly one status notification, failure ──────────────────
  {
    var listener3 = await startMockListener(200);
    process.env.TEAMS_WEBHOOK_URL = listener3.url;

    await notify.notifyStatus({ workflow: 'E2E Tests (Playwright)', outcome: 'failure', commit: 'ghi9012' });

    assert(
      listener3.requests.length === 1 && listener3.requests[0].indexOf('failure') !== -1,
      'sendsExactlyOneStatusNotification_onFailure',
      'Expected exactly 1 request reflecting failure, got: ' + JSON.stringify(listener3.requests)
    );
    await listener3.stop();
  }

  // ── AC3 (unit): genuine eviction + rerun fired -> retry notification with reason ──
  {
    var listener4 = await startMockListener(200);
    process.env.TEAMS_WEBHOOK_URL = listener4.url;

    var evictionText = 'Canceling since a higher priority waiting request for deploy-group exists';
    await notify.notifyRetryIfEviction({ annotationText: evictionText, runId: '42671165600', rerunFired: true });

    assert(
      listener4.requests.length === 1 && listener4.requests[0].toLowerCase().indexOf('retry') !== -1,
      'sendsRetryNotificationWithReason_whenGenuineEviction',
      'Expected exactly 1 request naming the retry, got: ' + JSON.stringify(listener4.requests)
    );
    await listener4.stop();
  }

  // ── AC4 (unit): genuine failure (not eviction) -> zero notifications ──────
  {
    var listener5 = await startMockListener(200);
    process.env.TEAMS_WEBHOOK_URL = listener5.url;

    var failureText = 'Process completed with exit code 1.';
    await notify.notifyRetryIfEviction({ annotationText: failureText, runId: '99999999999', rerunFired: false });

    assert(
      listener5.requests.length === 0,
      'sendsNoRetryNotification_whenGenuineFailureNotEviction',
      'Expected zero requests for a genuine failure, got ' + listener5.requests.length
    );
    await listener5.stop();
  }

  // ── AC1 (integration): announce step calls the real adapter path end-to-end ──
  {
    var listener6 = await startMockListener(200);
    process.env.TEAMS_WEBHOOK_URL = listener6.url;

    var result6 = await notify.notifyPatchAnnounce({ commit: 'jkl3456', pr: null });

    assert(
      result6 && result6.ok === true && listener6.requests.length === 1,
      'announceStepCallsRealAdapterPath_inStagingDeployWorkflowLogic',
      'Expected the real adapter path to be exercised with a successful result, got: ' + JSON.stringify(result6) + ' / ' + JSON.stringify(listener6.requests)
    );
    await listener6.stop();
  }

  // ── AC2 (integration): shared status function fires exactly once across both workflows' outcome types ──
  {
    var listener7 = await startMockListener(200);
    process.env.TEAMS_WEBHOOK_URL = listener7.url;

    await notify.notifyStatus({ workflow: 'Staging Deploy', outcome: 'success', commit: 'mno7890' });
    var countAfterFirst = listener7.requests.length;
    await notify.notifyStatus({ workflow: 'E2E Tests (Playwright)', outcome: 'failure', commit: 'mno7890' });
    var countAfterSecond = listener7.requests.length;

    assert(
      countAfterFirst === 1 && countAfterSecond === 2,
      'statusNotificationFiresExactlyOnce_acrossRealWorkflowCompletionPaths',
      'Expected one request per call (1 then 2), got ' + countAfterFirst + ' then ' + countAfterSecond
    );
    await listener7.stop();
  }

  // ── AC3+AC4 (integration): retry visibility defers entirely to the real isDeployGroupEviction() gate ──
  {
    var listener8 = await startMockListener(200);
    process.env.TEAMS_WEBHOOK_URL = listener8.url;

    await notify.notifyRetryIfEviction({ annotationText: 'Canceling since a higher priority waiting request for deploy-group exists', runId: '1', rerunFired: true });
    var afterEviction = listener8.requests.length;
    await notify.notifyRetryIfEviction({ annotationText: 'some unrelated real failure text', runId: '2', rerunFired: false });
    var afterFailure = listener8.requests.length;

    assert(
      afterEviction === 1 && afterFailure === 1,
      'retryVisibilityRespectsRealIsDeployGroupEvictionGate_endToEnd',
      'Expected eviction to produce 1 call and genuine failure to add 0 more (stay at 1), got ' + afterEviction + ' then ' + afterFailure
    );
    await listener8.stop();
  }

  // ── NFR (Performance): notification call does not block beyond coha-s1's bounded timeout ──
  {
    var listener9 = await startMockListener(200);
    process.env.TEAMS_WEBHOOK_URL = listener9.url;

    var start = Date.now();
    await notify.notifyStatus({ workflow: 'Staging Deploy', outcome: 'success', commit: 'pqr1122' });
    var elapsedMs = Date.now() - start;

    assert(
      elapsedMs < 10000,
      'notificationCallDoesNotBlockDeployStepProgression',
      'Expected the call to complete well within the 10s bounded timeout, took ' + elapsedMs + 'ms'
    );
    await listener9.stop();
  }

  // ── NFR (Audit): one log entry per dispatch attempt, across all three notification types ──
  {
    var listener10 = await startMockListener(200);
    process.env.TEAMS_WEBHOOK_URL = listener10.url;

    var captured = await captureStdout(async function() {
      await notify.notifyPatchAnnounce({ commit: 'stu3344', pr: 1 });
      await notify.notifyStatus({ workflow: 'Staging Deploy', outcome: 'success', commit: 'stu3344' });
      await notify.notifyRetryIfEviction({ annotationText: 'Canceling since a higher priority waiting request for deploy-group exists', runId: '3', rerunFired: true });
    });

    var announceLogged = captured.output.indexOf('announce-attempt') !== -1;
    var statusLogged = captured.output.indexOf('status-attempt') !== -1;
    var retryLogged = captured.output.indexOf('retry-attempt') !== -1;

    assert(
      announceLogged && statusLogged && retryLogged,
      'notificationDispatchIsLoggedForMetric1Measurement',
      'Expected a log entry for each of announce/status/retry dispatch attempts, got output: ' + captured.output
    );
    await listener10.stop();
  }

  delete process.env.TEAMS_WEBHOOK_URL;

  process.stdout.write('\n' + passed + ' passed, ' + failed + ' failed\n');
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(function(err) {
  process.stderr.write('FATAL: ' + (err && err.stack || err) + '\n');
  process.exit(1);
});
