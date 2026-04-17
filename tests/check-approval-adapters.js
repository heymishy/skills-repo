#!/usr/bin/env node
/**
 * check-approval-adapters.js
 *
 * Automated tests for Teams and Jira enterprise approval channel adapters (p3.8).
 *
 * Tests from the p3.8 test plan:
 *
 *   Unit (AC1 — Teams adapter, HMAC):
 *   - teams-adapter-valid-payload-writes-signed-off
 *   - teams-adapter-invalid-hmac-returns-401
 *
 *   Unit (AC2 — Jira adapter):
 *   - jira-transition-adapter-valid-payload-writes-signed-off
 *   - jira-comment-adapter-valid-approve-dor-writes-signed-off
 *
 *   Unit (AC4 — failure handling):
 *   - teams-missing-story-id-returns-4xx
 *   - jira-missing-story-id-returns-4xx
 *   - process-dor-write-failure-returns-5xx
 *
 *   Unit (AC5 — no hardcoded credentials):
 *   - credentials-read-from-env-vars
 *
 *   Interface conformance (ADR-006 — AC1/AC2):
 *   - teams-adapter-exports-handle-function
 *   - jira-adapter-exports-handle-function
 *
 * Run:  node tests/check-approval-adapters.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js (fs, path, crypto) only.
 * All tests use mock payloads and mock processDorApproval — no real network,
 * no real credentials, no real pipeline-state.json writes (AC3).
 */
'use strict';

var fs     = require('fs');
var path   = require('path');
var crypto = require('crypto');

var root = path.join(__dirname, '..');

var teamsAdapter = require(path.join(root, 'src', 'approval-channel', 'adapters', 'teams-adapter.js'));
var jiraAdapter  = require(path.join(root, 'src', 'approval-channel', 'adapters', 'jira-adapter.js'));

// ── Test harness ──────────────────────────────────────────────────────────────

var passed   = 0;
var failed   = 0;
var failures = [];

function pass(name) {
  passed++;
  process.stdout.write('  \u2713 ' + name + '\n');
}

function fail(name, reason) {
  failed++;
  failures.push({ name: name, reason: reason });
  process.stdout.write('  \u2717 ' + name + '\n');
  process.stdout.write('    \u2192 ' + reason + '\n');
}

function assert(condition, name, reason) {
  if (condition) pass(name);
  else fail(name, reason);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

var TEST_TEAMS_SECRET  = 'test-teams-secret-abc123';
var TEST_JIRA_TOKEN    = 'test-jira-token-xyz789';

/**
 * Build a valid Teams Authorization header for the given raw body and secret.
 */
function buildTeamsAuthHeader(rawBody, secret) {
  var hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  return 'HMAC ' + hmac;
}

/**
 * Mock processDorApproval that records calls and resolves successfully.
 */
function makeMockProcessDor() {
  var calls = [];
  var fn = function(opts) {
    calls.push(opts);
    return Promise.resolve({ success: true });
  };
  fn.calls = calls;
  return fn;
}

/**
 * Mock processDorApproval that always throws.
 */
function makeThrowingProcessDor(message) {
  return function() {
    return Promise.reject(new Error(message || 'write error'));
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

process.stdout.write('\ncheck-approval-adapters\n\n');

async function run() {

  // ── Teams adapter: interface conformance ────────────────────────────────────

  assert(
    typeof teamsAdapter.handle === 'function',
    'teams-adapter-exports-handle-function',
    'teams-adapter.js must export a handle function'
  );

  // ── Jira adapter: interface conformance ─────────────────────────────────────

  assert(
    typeof jiraAdapter.handle === 'function',
    'jira-adapter-exports-handle-function',
    'jira-adapter.js must export a handle function'
  );

  // ── AC1: Teams — valid payload writes signed-off ────────────────────────────

  var mockDor1 = makeMockProcessDor();
  var rawBody1 = JSON.stringify({ storyId: 'p3.8-test-story' });
  var auth1    = buildTeamsAuthHeader(rawBody1, TEST_TEAMS_SECRET);

  var prevTeamsSecret = process.env.TEAMS_WEBHOOK_SECRET;
  process.env.TEAMS_WEBHOOK_SECRET = TEST_TEAMS_SECRET;

  var result1 = await teamsAdapter.handle(rawBody1, { authorization: auth1 }, { processDorApproval: mockDor1 });

  process.env.TEAMS_WEBHOOK_SECRET = prevTeamsSecret;

  assert(
    result1.statusCode === 200,
    'teams-adapter-valid-payload-writes-signed-off',
    'Expected statusCode 200, got ' + result1.statusCode
  );
  assert(
    mockDor1.calls.length === 1 && mockDor1.calls[0].storyId === 'p3.8-test-story',
    'teams-adapter-valid-payload-calls-process-dor-with-correct-storyId',
    'Expected processDorApproval called once with storyId=p3.8-test-story'
  );

  // ── AC1: Teams — invalid HMAC returns 401 ───────────────────────────────────

  var mockDor2  = makeMockProcessDor();
  var rawBody2  = JSON.stringify({ storyId: 'p3.8-test-story' });
  var badAuth   = 'HMAC invalidsignature==';

  process.env.TEAMS_WEBHOOK_SECRET = TEST_TEAMS_SECRET;

  var result2 = await teamsAdapter.handle(rawBody2, { authorization: badAuth }, { processDorApproval: mockDor2 });

  process.env.TEAMS_WEBHOOK_SECRET = prevTeamsSecret;

  assert(
    result2.statusCode === 401,
    'teams-adapter-invalid-hmac-returns-401',
    'Expected statusCode 401, got ' + result2.statusCode
  );
  assert(
    mockDor2.calls.length === 0,
    'teams-adapter-invalid-hmac-does-not-call-process-dor',
    'process-dor-approval must NOT be called when HMAC is invalid'
  );

  // ── AC2: Jira — valid transition payload writes signed-off ──────────────────

  var mockDor3      = makeMockProcessDor();
  var jiraTransition = {
    issue: {
      key:    'PROJ-42',
      fields: {
        storyId: 'p3.8-test-story',
        status: { name: 'Approved' },
      },
    },
  };

  var prevJiraToken = process.env.JIRA_SERVICE_ACCOUNT_TOKEN;
  process.env.JIRA_SERVICE_ACCOUNT_TOKEN = TEST_JIRA_TOKEN;

  var result3 = await jiraAdapter.handle(jiraTransition, { processDorApproval: mockDor3 });

  process.env.JIRA_SERVICE_ACCOUNT_TOKEN = prevJiraToken;

  assert(
    result3.statusCode === 200,
    'jira-transition-adapter-valid-payload-writes-signed-off',
    'Expected statusCode 200, got ' + result3.statusCode
  );
  assert(
    mockDor3.calls.length === 1 && mockDor3.calls[0].storyId === 'p3.8-test-story',
    'jira-transition-adapter-calls-process-dor-with-correct-storyId',
    'Expected processDorApproval called once with storyId=p3.8-test-story'
  );

  // ── AC2: Jira — /approve-dor comment writes signed-off ──────────────────────

  var mockDor4     = makeMockProcessDor();
  var jiraComment  = {
    issue: {
      key:    'PROJ-43',
      fields: {
        storyId: 'p3.8-test-story',
        status: { name: 'In Progress' },
      },
    },
    comment: {
      body: '/approve-dor',
    },
  };

  process.env.JIRA_SERVICE_ACCOUNT_TOKEN = TEST_JIRA_TOKEN;

  var result4 = await jiraAdapter.handle(jiraComment, { processDorApproval: mockDor4 });

  process.env.JIRA_SERVICE_ACCOUNT_TOKEN = prevJiraToken;

  assert(
    result4.statusCode === 200,
    'jira-comment-adapter-valid-approve-dor-writes-signed-off',
    'Expected statusCode 200, got ' + result4.statusCode
  );
  assert(
    mockDor4.calls.length === 1 && mockDor4.calls[0].storyId === 'p3.8-test-story',
    'jira-comment-adapter-calls-process-dor-with-correct-storyId',
    'Expected processDorApproval called once with storyId=p3.8-test-story'
  );

  // ── AC4: Teams — missing storyId returns 4xx ────────────────────────────────

  var mockDor5   = makeMockProcessDor();
  var rawBody5   = JSON.stringify({ message: 'no story id here' });
  var auth5      = buildTeamsAuthHeader(rawBody5, TEST_TEAMS_SECRET);

  process.env.TEAMS_WEBHOOK_SECRET = TEST_TEAMS_SECRET;

  var result5 = await teamsAdapter.handle(rawBody5, { authorization: auth5 }, { processDorApproval: mockDor5 });

  process.env.TEAMS_WEBHOOK_SECRET = prevTeamsSecret;

  assert(
    result5.statusCode >= 400 && result5.statusCode < 500,
    'teams-missing-story-id-returns-4xx',
    'Expected 4xx status, got ' + result5.statusCode
  );
  assert(
    mockDor5.calls.length === 0,
    'teams-missing-story-id-does-not-call-process-dor',
    'process-dor-approval must NOT be called when storyId is missing'
  );

  // ── AC4: Jira — missing storyId returns 4xx ─────────────────────────────────

  var mockDor6 = makeMockProcessDor();
  var jiraNoId = {
    issue: {
      fields: {
        status: { name: 'Approved' },
        // no storyId, no key
      },
    },
  };

  process.env.JIRA_SERVICE_ACCOUNT_TOKEN = TEST_JIRA_TOKEN;

  var result6 = await jiraAdapter.handle(jiraNoId, { processDorApproval: mockDor6 });

  process.env.JIRA_SERVICE_ACCOUNT_TOKEN = prevJiraToken;

  assert(
    result6.statusCode >= 400 && result6.statusCode < 500,
    'jira-missing-story-id-returns-4xx',
    'Expected 4xx status, got ' + result6.statusCode
  );
  assert(
    mockDor6.calls.length === 0,
    'jira-missing-story-id-does-not-call-process-dor',
    'process-dor-approval must NOT be called when storyId is missing'
  );

  // ── AC4: Teams — process-dor write failure returns 5xx ─────────────────────

  var throwingDor = makeThrowingProcessDor('pipeline-state write error');
  var rawBody7    = JSON.stringify({ storyId: 'p3.8-test-story' });
  var auth7       = buildTeamsAuthHeader(rawBody7, TEST_TEAMS_SECRET);

  process.env.TEAMS_WEBHOOK_SECRET = TEST_TEAMS_SECRET;

  var result7 = await teamsAdapter.handle(rawBody7, { authorization: auth7 }, { processDorApproval: throwingDor });

  process.env.TEAMS_WEBHOOK_SECRET = prevTeamsSecret;

  assert(
    result7.statusCode >= 500 && result7.statusCode < 600,
    'process-dor-write-failure-returns-5xx',
    'Expected 5xx status on write failure, got ' + result7.statusCode
  );

  // ── AC5: No hardcoded credentials in source files ────────────────────────────

  var teamsSource = fs.readFileSync(
    path.join(root, 'src', 'approval-channel', 'adapters', 'teams-adapter.js'),
    'utf8'
  );
  var jiraSource  = fs.readFileSync(
    path.join(root, 'src', 'approval-channel', 'adapters', 'jira-adapter.js'),
    'utf8'
  );

  // Must reference the env var for credentials
  assert(
    teamsSource.indexOf('process.env.TEAMS_WEBHOOK_SECRET') !== -1,
    'teams-adapter-reads-secret-from-env-var',
    'teams-adapter.js must read TEAMS_WEBHOOK_SECRET from process.env'
  );
  assert(
    jiraSource.indexOf('process.env.JIRA_SERVICE_ACCOUNT_TOKEN') !== -1,
    'jira-adapter-reads-token-from-env-var',
    'jira-adapter.js must read JIRA_SERVICE_ACCOUNT_TOKEN from process.env'
  );

  // Must NOT contain hardcoded credential-like literals (tokens, secrets, passwords)
  var credentialPattern = /(['"])[a-zA-Z0-9+/]{20,}={0,2}\1/;
  assert(
    !credentialPattern.test(teamsSource),
    'credentials-read-from-env-vars',
    'teams-adapter.js must not contain hardcoded credential strings'
  );

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
  process.stderr.write('\nFatal error in check-approval-adapters.js: ' + err.message + '\n');
  process.exit(1);
});
