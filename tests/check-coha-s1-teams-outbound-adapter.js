#!/usr/bin/env node
/**
 * check-coha-s1-teams-outbound-adapter.js
 *
 * Automated tests for the outbound Teams notification adapter (coha-s1).
 *
 * Unit (AC3): throwsWhenAdapterNotWired_beforeAnySetterCalled
 * Unit (AC1): returnsSuccessResult_whenWebhookRespondsWith2xx
 * Unit (AC1): readsWebhookUrlFromSecretEnvVar_neverHardcoded
 * Unit (AC2): reportsFailureExplicitly_onNetworkError
 * Unit (AC2): reportsFailureExplicitly_onNon2xxResponse
 * Integration (AC1): dispatchReachesRealOutboundPath_viaMockWebhookListener
 * Integration (AC2): reportedFailurePropagatesToCaller_onWebhookDown
 * Integration (AC4, D37): wiringProducesBehaviourallyDistinctOutcomes_forTwoDifferentPayloads
 * NFR (Performance): sendCallTimesOutWithinBoundedWindow
 * NFR (Security): webhookUrlNeverAppearsInLogsOrErrorOutput
 * NFR (Audit): everySendAttemptIsLoggedServerSide
 *
 * Run:  node tests/check-coha-s1-teams-outbound-adapter.js
 * Used: npm test (auto-discovered by scripts/run-all-tests.js's tests/check-*.js glob)
 *
 * Zero external dependencies -- plain Node.js (http) only. The mock webhook
 * listener is a real in-process http.createServer, not a jest.fn()-style
 * stub, per product/constraints.md #13 (structural, CI-gate-verifiable
 * dispatch assertions).
 *
 * IMPORTANT: test 1 (throwsWhenAdapterNotWired_beforeAnySetterCalled) must
 * run before any other test calls setTeamsNotifyAdapter() -- this file's
 * tests execute in the order written, deliberately, to exercise the
 * module's true unwired default state exactly once.
 */
'use strict';

var http = require('http');
var path = require('path');

var root = path.join(__dirname, '..');
var adapter = require(path.join(root, 'src', 'approval-channel', 'adapters', 'teams-outbound-adapter.js'));

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

// ── Mock webhook listener helper ───────────────────────────────────────────────

/**
 * Starts a real in-process HTTP listener that records every request body
 * it receives, responding with `statusCode` to each. Caller must call
 * stop() when done.
 * @param {number} statusCode
 * @returns {Promise<{url: string, stop: function, requests: Array}>}
 */
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
  return Promise.resolve(fn()).then(function(result) {
    process.stdout.write = original;
    return { result: result, output: captured.join('') };
  }, function(err) {
    process.stdout.write = original;
    throw err;
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────────

async function run() {
  var originalWebhookUrl = process.env.TEAMS_WEBHOOK_URL;

  // ── AC3: stub default throws, before any setter call ──────────────────────
  try {
    adapter.sendTeamsNotification({ text: 'should never reach here' });
    fail(
      'throwsWhenAdapterNotWired_beforeAnySetterCalled',
      'Expected sendTeamsNotification() to throw synchronously before any setTeamsNotifyAdapter() call, but it did not throw.'
    );
  } catch (err) {
    assert(
      err.message === 'Adapter not wired: teamsNotifyAdapter. Call setTeamsNotifyAdapter() with a real implementation before use.',
      'throwsWhenAdapterNotWired_beforeAnySetterCalled',
      'Expected exact D37 stub error message, got: ' + err.message
    );
  }

  // ── AC1: successful 2xx send ────────────────────────────────────────────────
  {
    var listener1 = await startMockListener(200);
    process.env.TEAMS_WEBHOOK_URL = listener1.url;
    adapter.setTeamsNotifyAdapter(adapter.realTeamsNotifyAdapter);

    var result1 = await adapter.sendTeamsNotification({ text: 'hello' });
    assert(
      result1 && result1.ok === true && listener1.requests.length === 1,
      'returnsSuccessResult_whenWebhookRespondsWith2xx',
      'Expected { ok: true } and exactly one recorded POST, got result=' + JSON.stringify(result1) + ' requests=' + listener1.requests.length
    );
    await listener1.stop();
  }

  // ── AC1: no hardcoded URL, always reads from TEAMS_WEBHOOK_URL ─────────────
  {
    var fs = require('fs');
    var source = fs.readFileSync(
      path.join(root, 'src', 'approval-channel', 'adapters', 'teams-outbound-adapter.js'),
      'utf8'
    );
    var readsFromEnv = source.indexOf('process.env.TEAMS_WEBHOOK_URL') !== -1;
    var hardcodedUrlPattern = /https?:\/\/[^\s'"]*webhook[^\s'"]*/i;
    // Exclude the doc-comment usage example and this file's own test helper URLs
    var sourceWithoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert(
      readsFromEnv && !hardcodedUrlPattern.test(sourceWithoutComments),
      'readsWebhookUrlFromSecretEnvVar_neverHardcoded',
      'Expected adapter to read TEAMS_WEBHOOK_URL from process.env and contain no hardcoded webhook URL literal'
    );
  }

  // ── AC2: network error (connection refused) ─────────────────────────────────
  {
    // Use a port nothing is listening on to force ECONNREFUSED.
    process.env.TEAMS_WEBHOOK_URL = 'http://127.0.0.1:1/webhook';
    adapter.setTeamsNotifyAdapter(adapter.realTeamsNotifyAdapter);

    var result2 = await adapter.sendTeamsNotification({ text: 'hello' });
    assert(
      result2 && result2.ok === false && typeof result2.error === 'string',
      'reportsFailureExplicitly_onNetworkError',
      'Expected { ok: false, error: <string> } on connection refused, got: ' + JSON.stringify(result2)
    );
  }

  // ── AC2: non-2xx response ───────────────────────────────────────────────────
  {
    var listener2 = await startMockListener(500);
    process.env.TEAMS_WEBHOOK_URL = listener2.url;
    adapter.setTeamsNotifyAdapter(adapter.realTeamsNotifyAdapter);

    var result3 = await adapter.sendTeamsNotification({ text: 'hello' });
    assert(
      result3 && result3.ok === false,
      'reportsFailureExplicitly_onNon2xxResponse',
      'Expected { ok: false } on a 500 response, got: ' + JSON.stringify(result3)
    );
    await listener2.stop();
  }

  // ── AC1 (integration): real dispatch reaches the mock listener ────────────
  {
    var listener3 = await startMockListener(200);
    process.env.TEAMS_WEBHOOK_URL = listener3.url;
    adapter.setTeamsNotifyAdapter(adapter.realTeamsNotifyAdapter);

    var payload = { text: 'integration-check', id: 'abc123' };
    await adapter.sendTeamsNotification(payload);
    var bodyMatches = listener3.requests.length === 1 && listener3.requests[0] === JSON.stringify(payload);
    assert(
      bodyMatches,
      'dispatchReachesRealOutboundPath_viaMockWebhookListener',
      'Expected the mock listener to record exactly one request body matching the sent payload, got: ' + JSON.stringify(listener3.requests)
    );
    await listener3.stop();
  }

  // ── AC2 (integration): failure propagates to caller on webhook down ───────
  {
    var listener4 = await startMockListener(200);
    var closedUrl = listener4.url;
    await listener4.stop(); // close it before calling -- port now unreachable

    process.env.TEAMS_WEBHOOK_URL = closedUrl;
    adapter.setTeamsNotifyAdapter(adapter.realTeamsNotifyAdapter);

    var result4 = await adapter.sendTeamsNotification({ text: 'hello' });
    assert(
      result4 && result4.ok === false,
      'reportedFailurePropagatesToCaller_onWebhookDown',
      'Expected an explicit failure result when the webhook endpoint is down, got: ' + JSON.stringify(result4)
    );
  }

  // ── AC4 / D37: wiring produces behaviourally distinct outcomes ────────────
  {
    var listener5 = await startMockListener(200);
    process.env.TEAMS_WEBHOOK_URL = listener5.url;
    // Exercise the exact same wiring call scripts/notify-teams.js performs --
    // the real production wiring path, not a test-only mock of the adapter.
    adapter.setTeamsNotifyAdapter(adapter.realTeamsNotifyAdapter);

    var payloadA = { text: 'patch announce', kind: 'patch' };
    var payloadB = { text: 'vulnerability found', kind: 'vulnerability' };
    await adapter.sendTeamsNotification(payloadA);
    await adapter.sendTeamsNotification(payloadB);

    var twoDistinctRequests = listener5.requests.length === 2
      && listener5.requests[0] === JSON.stringify(payloadA)
      && listener5.requests[1] === JSON.stringify(payloadB)
      && listener5.requests[0] !== listener5.requests[1];
    assert(
      twoDistinctRequests,
      'wiringProducesBehaviourallyDistinctOutcomes_forTwoDifferentPayloads',
      'Expected two distinct payloads to produce two distinct, individually-correct POST bodies, got: ' + JSON.stringify(listener5.requests)
    );
    await listener5.stop();
  }

  // ── NFR Performance: bounded timeout ────────────────────────────────────────
  {
    // A server that accepts the connection but never responds.
    var hangingServer = http.createServer(function() { /* never respond */ });
    await new Promise(function(resolve) { hangingServer.listen(0, '127.0.0.1', resolve); });
    var hangingPort = hangingServer.address().port;
    process.env.TEAMS_WEBHOOK_URL = 'http://127.0.0.1:' + hangingPort + '/webhook';
    adapter.setTeamsNotifyAdapter(adapter.realTeamsNotifyAdapter);

    var boundedTimeoutMs = 200; // short bound for test speed; production default is 10000ms
    var start = Date.now();
    var result5 = await adapter.realTeamsNotifyAdapter({ text: 'hello' }, { timeoutMs: boundedTimeoutMs });
    var elapsed = Date.now() - start;

    assert(
      result5 && result5.ok === false && elapsed < boundedTimeoutMs + 2000,
      'sendCallTimesOutWithinBoundedWindow',
      'Expected the send to time out and return within the bounded window, got ok=' + (result5 && result5.ok) + ' elapsed=' + elapsed + 'ms'
    );
    await new Promise(function(resolve) { hangingServer.close(resolve); });
  }

  // ── NFR Security: webhook URL never appears in logs or error output ───────
  {
    var listener6 = await startMockListener(500);
    var secretLookingUrl = listener6.url.replace('127.0.0.1', '127.0.0.1') + '?token=should-never-leak';
    process.env.TEAMS_WEBHOOK_URL = secretLookingUrl;
    adapter.setTeamsNotifyAdapter(adapter.realTeamsNotifyAdapter);

    var captured = await captureStdout(function() {
      return adapter.sendTeamsNotification({ text: 'hello' });
    });
    var resultForErrorCheck = captured.result;
    var urlLeakedInLogs = captured.output.indexOf(secretLookingUrl) !== -1 || captured.output.indexOf('should-never-leak') !== -1;
    var urlLeakedInError = resultForErrorCheck && typeof resultForErrorCheck.error === 'string' && resultForErrorCheck.error.indexOf('should-never-leak') !== -1;

    assert(
      !urlLeakedInLogs && !urlLeakedInError,
      'webhookUrlNeverAppearsInLogsOrErrorOutput',
      'Expected zero occurrences of the webhook URL value in logs or error output. logOutput=' + JSON.stringify(captured.output) + ' error=' + JSON.stringify(resultForErrorCheck)
    );
    await listener6.stop();
  }

  // ── NFR Audit: every send attempt is logged with a timestamp ──────────────
  {
    var listener7 = await startMockListener(200);
    process.env.TEAMS_WEBHOOK_URL = listener7.url;
    adapter.setTeamsNotifyAdapter(adapter.realTeamsNotifyAdapter);

    var successCapture = await captureStdout(function() {
      return adapter.sendTeamsNotification({ text: 'success case' });
    });
    await listener7.stop();

    process.env.TEAMS_WEBHOOK_URL = 'http://127.0.0.1:1/webhook'; // connection refused
    var failureCapture = await captureStdout(function() {
      return adapter.sendTeamsNotification({ text: 'failure case' });
    });

    var isoTimestampPattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/;
    var successLogged = isoTimestampPattern.test(successCapture.output) && successCapture.output.indexOf('success') !== -1;
    var failureLogged = isoTimestampPattern.test(failureCapture.output) && failureCapture.output.indexOf('failure') !== -1;

    assert(
      successLogged && failureLogged,
      'everySendAttemptIsLoggedServerSide',
      'Expected both a success and a failure send attempt to produce a log entry with a parseable ISO timestamp. successOutput=' + JSON.stringify(successCapture.output) + ' failureOutput=' + JSON.stringify(failureCapture.output)
    );
  }

  // ── Restore environment ─────────────────────────────────────────────────────
  if (originalWebhookUrl === undefined) {
    delete process.env.TEAMS_WEBHOOK_URL;
  } else {
    process.env.TEAMS_WEBHOOK_URL = originalWebhookUrl;
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
  process.stderr.write('\nFatal error in check-coha-s1-teams-outbound-adapter.js: ' + (err && err.stack || err) + '\n');
  process.exit(1);
});
