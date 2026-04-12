#!/usr/bin/env node
/**
 * check-dor-approval.js
 *
 * Automated tests for persona routing and non-engineer approval interface (p2.8).
 *
 * Tests from the p2.8 test plan:
 *
 *   Unit tests (AC1 — channel hint routing):
 *   - channel-hint-payload-has-required-fields
 *   - channel-hint-target-url-read-from-context
 *   - channel-hint-adapter-selected-from-context
 *
 *   Unit test (AC2 — /approve-dor comment trigger):
 *   - approve-dor-comment-trigger-recorded-with-timestamp
 *
 *   Unit tests (AC3 — pipeline-state.json write):
 *   - pipeline-state-dorStatus-signed-off
 *   - dorApprover-stores-username-not-email
 *   - dorChannel-records-approval-interface
 *
 *   Unit tests (AC4 — IDE channel regression):
 *   - ide-notification-not-suppressed-when-approval-channel-set
 *   - both-channels-dispatched-when-both-configured
 *
 *   Unit tests (AC5 — unconfigured approval channel fallback):
 *   - no-approval-channel-falls-back-to-ide-only
 *   - no-approval-channel-logs-config-warning
 *
 *   Unit tests (AC6 — context.yml as single source of truth):
 *   - channel-target-read-from-context-not-hardcoded
 *   - swap-channel-via-context-only
 *
 *   NFR tests:
 *   - dorApprover-no-pii-in-fixtures        (Security)
 *   - channel-hints-schema-values-match-adapter-enum  (Consistency MC-CONSIST-02)
 *   - dorChannel-permanent-record           (Auditability)
 *   - hardcoded-value-scan                  (AC6 static check)
 *
 *   Schema tests (ADR-003):
 *   - schema-dorApprover-field-registered
 *   - schema-dorChannel-field-registered
 *   - schema-dorSignedOffAt-field-registered
 *
 * Run:  node tests/check-dor-approval.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js (fs, path) only.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const {
  selectAdapter,
  buildNotificationPayload,
  dispatchNotifications,
  processApproveCommentEvent,
  routeApprovalNotification,
  VALID_CHANNEL_TYPES,
} = require(path.join(root, 'src', 'approval-channel', 'index.js'));

// ── Test harness ──────────────────────────────────────────────────────────────

let passed   = 0;
let failed   = 0;
const failures = [];

function pass(name) {
  passed++;
  process.stdout.write('  \u2713 ' + name + '\n');
}

function fail(name, reason) {
  failed++;
  failures.push({ name, reason });
  process.stdout.write('  \u2717 ' + name + '\n');
  process.stdout.write('    \u2192 ' + reason + '\n');
}

function assert(condition, name, reason) {
  if (condition) pass(name);
  else fail(name, reason);
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeContextWithApproval(issueUrl) {
  return {
    channel_hints: {
      ide: 'vscode',
      approval: {
        type: 'github-issue',
        issueUrl: issueUrl || 'https://github.com/example-org/example-repo/issues/42',
      },
    },
  };
}

function makeContextWithoutApproval() {
  return {
    channel_hints: {
      ide: 'vscode',
    },
  };
}

function makeContextApprovalChannelTopLevel() {
  return {
    approval_channel: 'github-issue',
    channel_hints: {
      ide: 'vscode',
    },
  };
}

function makeFleetEntry() {
  return {
    squadId:          'test-squad',
    repoUrl:          'https://github.com/example-org/test-squad',
    pipelineStateUrl: 'https://raw.githubusercontent.com/example-org/test-squad/main/.github/pipeline-state.json',
  };
}

function makePipelineState(storySlug) {
  return {
    version: '1',
    updated: '2026-04-11T00:00:00Z',
    features: [
      {
        slug: 'test-feature',
        name: 'Test Feature',
        track: 'standard',
        stage: 'definition-of-ready',
        health: 'green',
        epics: [
          {
            slug: 'test-epic',
            name: 'Test Epic',
            status: 'in-progress',
            stories: [
              {
                slug: storySlug || 'test-story-slug',
                name: 'Test Story',
                stage: 'definition-of-ready',
                health: 'green',
                dorStatus: 'not-started',
              },
            ],
          },
        ],
      },
    ],
  };
}

function makeApproveEvent(overrides) {
  return Object.assign({
    actorUsername: 'pm-approver',
    storySlug:     'test-story-slug',
    timestamp:     '2026-04-11T10:30:00.000Z',
  }, overrides);
}

// ── AC1: Channel hint routing ─────────────────────────────────────────────────

console.log('\n[dor-approval] AC1: Channel hint routing');

// channel-hint-payload-has-required-fields
(function() {
  const context    = makeContextWithApproval();
  const fleetEntry = makeFleetEntry();
  const result     = routeApprovalNotification(context, 'p2.8-story', 'squad-alpha', fleetEntry);
  const payload    = result.payload;

  assert(typeof payload.storySlug === 'string' && payload.storySlug === 'p2.8-story',
    'channel-hint-payload-has-required-fields: payload has storySlug',
    'storySlug: ' + JSON.stringify(payload.storySlug));

  assert(typeof payload.squadId === 'string' && payload.squadId === 'squad-alpha',
    'channel-hint-payload-has-required-fields: payload has squadId',
    'squadId: ' + JSON.stringify(payload.squadId));

  assert(typeof payload.approvalActionDescription === 'string' && payload.approvalActionDescription.length > 0,
    'channel-hint-payload-has-required-fields: payload has approvalActionDescription',
    'approvalActionDescription: ' + JSON.stringify(payload.approvalActionDescription));

  assert(payload.fleetRegistryRef !== null && payload.fleetRegistryRef !== undefined,
    'channel-hint-payload-has-required-fields: payload has fleetRegistryRef',
    'fleetRegistryRef: ' + JSON.stringify(payload.fleetRegistryRef));
}());

// channel-hint-target-url-read-from-context
(function() {
  const ctxA = makeContextWithApproval('https://a.example.com/issues/1');
  const ctxB = makeContextWithApproval('https://b.example.com/issues/2');

  const resultA = routeApprovalNotification(ctxA, 'story-x', 'squad-a', null);
  const resultB = routeApprovalNotification(ctxB, 'story-x', 'squad-b', null);

  assert(resultA.payload.targetUrl === 'https://a.example.com/issues/1',
    'channel-hint-target-url-read-from-context: context A URL matches',
    'got: ' + resultA.payload.targetUrl);

  assert(resultB.payload.targetUrl === 'https://b.example.com/issues/2',
    'channel-hint-target-url-read-from-context: context B URL matches',
    'got: ' + resultB.payload.targetUrl);

  assert(resultA.payload.targetUrl !== resultB.payload.targetUrl,
    'channel-hint-target-url-read-from-context: context A and B URLs differ (no shared constant)',
    'both URLs are: ' + resultA.payload.targetUrl);
}());

// channel-hint-adapter-selected-from-context
(function() {
  const context  = makeContextApprovalChannelTopLevel();
  const adapter  = selectAdapter(context);

  assert(adapter === 'github-issue',
    'channel-hint-adapter-selected-from-context: github-issue adapter selected from approval_channel',
    'got: ' + adapter);

  const context2 = makeContextWithApproval();
  const adapter2 = selectAdapter(context2);

  assert(adapter2 === 'github-issue',
    'channel-hint-adapter-selected-from-context: github-issue adapter selected from channel_hints.approval.type',
    'got: ' + adapter2);
}());

// ── AC2: /approve-dor comment trigger ─────────────────────────────────────────

console.log('\n[dor-approval] AC2: /approve-dor comment trigger');

// approve-dor-comment-trigger-recorded-with-timestamp
(function() {
  const ps    = makePipelineState('test-story-slug');
  const event = makeApproveEvent({ timestamp: '2026-04-11T10:30:00.000Z' });
  const ctx   = makeContextWithApproval();

  const result = processApproveCommentEvent(event, ps, ctx);

  assert(result.success === true,
    'approve-dor-comment-trigger-recorded-with-timestamp: event processed successfully',
    'success: ' + result.success);

  assert(result.story && result.story.dorSignedOffAt === '2026-04-11T10:30:00.000Z',
    'approve-dor-comment-trigger-recorded-with-timestamp: timestamp written to dorSignedOffAt',
    'dorSignedOffAt: ' + (result.story && result.story.dorSignedOffAt));
}());

// ── AC3: pipeline-state.json write ───────────────────────────────────────────

console.log('\n[dor-approval] AC3: pipeline-state.json write');

// pipeline-state-dorStatus-signed-off
(function() {
  const ps     = makePipelineState('test-story-slug');
  const event  = makeApproveEvent();
  const ctx    = makeContextWithApproval();
  const result = processApproveCommentEvent(event, ps, ctx);

  assert(result.success === true && result.story && result.story.dorStatus === 'signed-off',
    'pipeline-state-dorStatus-signed-off: dorStatus is "signed-off" (ADR-002 evidence field)',
    'dorStatus: ' + (result.story && result.story.dorStatus));
}());

// dorApprover-stores-username-not-email
(function() {
  const ps  = makePipelineState('test-story-slug');
  const event = makeApproveEvent({
    actorUsername: 'hamish-dev',
    // actorEmail would be ignored — never stored
  });
  const ctx = makeContextWithApproval();
  const result = processApproveCommentEvent(event, ps, ctx);

  assert(result.success === true && result.story && result.story.dorApprover === 'hamish-dev',
    'dorApprover-stores-username-not-email: dorApprover contains username',
    'dorApprover: ' + (result.story && result.story.dorApprover));

  // PII constraint: must not contain @ (email) or spaces (full name).
  const approver = result.story && result.story.dorApprover;
  assert(approver && !approver.includes('@'),
    'dorApprover-stores-username-not-email: dorApprover has no @ character (not an email)',
    'dorApprover: ' + approver);

  assert(approver && !approver.includes(' '),
    'dorApprover-stores-username-not-email: dorApprover has no spaces (not a full name)',
    'dorApprover: ' + approver);
}());

// dorChannel-records-approval-interface
(function() {
  const ps     = makePipelineState('test-story-slug');
  const event  = makeApproveEvent();
  const ctx    = makeContextWithApproval();
  const result = processApproveCommentEvent(event, ps, ctx);

  assert(result.success === true && result.story && result.story.dorChannel === 'github-issue',
    'dorChannel-records-approval-interface: dorChannel is "github-issue"',
    'dorChannel: ' + (result.story && result.story.dorChannel));

  assert(result.story && result.story.dorChannel !== null && result.story.dorChannel !== undefined,
    'dorChannel-records-approval-interface: dorChannel is non-null',
    'dorChannel: ' + (result.story && result.story.dorChannel));
}());

// ── AC4: IDE channel regression guard ────────────────────────────────────────

console.log('\n[dor-approval] AC4: IDE channel regression guard');

// ide-notification-not-suppressed-when-approval-channel-set
(function() {
  const ctx     = makeContextWithApproval();
  const payload = buildNotificationPayload('my-story', 'squad-x', ctx, null);
  const result  = dispatchNotifications(ctx, payload);

  const ideDispatched = result.dispatched.some(function(d) { return d.startsWith('ide:'); });
  assert(ideDispatched,
    'ide-notification-not-suppressed-when-approval-channel-set: IDE notification is in dispatched list',
    'dispatched: ' + JSON.stringify(result.dispatched));
}());

// both-channels-dispatched-when-both-configured
(function() {
  const ctx     = makeContextWithApproval();
  const payload = buildNotificationPayload('my-story', 'squad-x', ctx, null);
  const result  = dispatchNotifications(ctx, payload);

  const ideCount      = result.dispatched.filter(function(d) { return d.startsWith('ide:'); }).length;
  const approvalCount = result.dispatched.filter(function(d) { return d.startsWith('approval:'); }).length;

  assert(result.dispatched.length === 2,
    'both-channels-dispatched-when-both-configured: exactly 2 dispatch calls',
    'dispatched: ' + JSON.stringify(result.dispatched));

  assert(ideCount === 1,
    'both-channels-dispatched-when-both-configured: exactly 1 IDE dispatch',
    'ide count: ' + ideCount);

  assert(approvalCount === 1,
    'both-channels-dispatched-when-both-configured: exactly 1 approval dispatch',
    'approval count: ' + approvalCount);
}());

// ── AC5: Unconfigured approval channel fallback ───────────────────────────────

console.log('\n[dor-approval] AC5: Unconfigured approval channel fallback');

// no-approval-channel-falls-back-to-ide-only
(function() {
  const ctx     = makeContextWithoutApproval();
  const payload = buildNotificationPayload('my-story', 'squad-x', ctx, null);

  let threw = false;
  let result;
  try {
    result = dispatchNotifications(ctx, payload);
  } catch (err) {
    threw = true;
  }

  assert(!threw,
    'no-approval-channel-falls-back-to-ide-only: no exception thrown',
    'unexpected exception');

  const ideDispatched = result && result.dispatched.some(function(d) { return d.startsWith('ide:'); });
  assert(ideDispatched,
    'no-approval-channel-falls-back-to-ide-only: IDE notification dispatched',
    'dispatched: ' + JSON.stringify(result && result.dispatched));
}());

// no-approval-channel-logs-config-warning
(function() {
  const ctx     = makeContextWithoutApproval();
  const payload = buildNotificationPayload('my-story', 'squad-x', ctx, null);

  const warnMessages = [];
  const result = dispatchNotifications(ctx, payload, {
    warn: function(msg) { warnMessages.push(msg); },
  });

  assert(warnMessages.length > 0,
    'no-approval-channel-logs-config-warning: at least one warning logged',
    'no warnings logged');

  const warningText = warnMessages.join(' ');
  assert(warningText.toLowerCase().includes('no approval channel') ||
         warningText.toLowerCase().includes('defaulting to ide'),
    'no-approval-channel-logs-config-warning: warning message contains expected text',
    'warning: ' + warningText);

  assert(result.warnings.length > 0,
    'no-approval-channel-logs-config-warning: warning returned in result.warnings',
    'result.warnings: ' + JSON.stringify(result.warnings));
}());

// ── AC6: context.yml as single source of truth ────────────────────────────────

console.log('\n[dor-approval] AC6: context.yml single source of truth');

// channel-target-read-from-context-not-hardcoded
(function() {
  const ctxA = makeContextWithApproval('https://a.example.com/issues/1');
  const ctxB = makeContextWithApproval('https://b.example.com/issues/2');

  const resultA = routeApprovalNotification(ctxA, 'story-slug', 'squad-a', null);
  const resultB = routeApprovalNotification(ctxB, 'story-slug', 'squad-b', null);

  assert(resultA.payload.targetUrl === 'https://a.example.com/issues/1',
    'channel-target-read-from-context-not-hardcoded: context A URL matches (no shared constant)',
    'got: ' + resultA.payload.targetUrl);

  assert(resultB.payload.targetUrl === 'https://b.example.com/issues/2',
    'channel-target-read-from-context-not-hardcoded: context B URL matches (no shared constant)',
    'got: ' + resultB.payload.targetUrl);
}());

// swap-channel-via-context-only
(function() {
  // Verify that swapping context.yml alone changes the adapter selection.
  const ctxGithub = { approval_channel: 'github-issue' };
  const ctxManual = { approval_channel: 'manual' };

  const adapterA = selectAdapter(ctxGithub);
  const adapterB = selectAdapter(ctxManual);

  assert(adapterA === 'github-issue',
    'swap-channel-via-context-only: github-issue context selects github-issue adapter',
    'got: ' + adapterA);

  assert(adapterB === 'manual',
    'swap-channel-via-context-only: manual context selects manual adapter',
    'got: ' + adapterB);

  assert(adapterA !== adapterB,
    'swap-channel-via-context-only: different contexts produce different adapters (context drives routing)',
    'both: ' + adapterA);
}());

// ── NFR: Security — no PII in fixtures ────────────────────────────────────────

console.log('\n[dor-approval] NFR: Security (dorApprover PII constraint)');

// dorApprover-no-pii-in-fixtures
(function() {
  const testCases = [
    { actorUsername: 'pm-approver',    desc: 'pm-approver' },
    { actorUsername: 'hamish-dev',     desc: 'hamish-dev' },
    { actorUsername: 'risk-lead-01',   desc: 'risk-lead-01' },
  ];

  let allPass = true;
  for (const tc of testCases) {
    const ps     = makePipelineState('test-story-slug');
    const event  = makeApproveEvent({ actorUsername: tc.actorUsername });
    const ctx    = makeContextWithApproval();
    const result = processApproveCommentEvent(event, ps, ctx);

    const approver = result.story && result.story.dorApprover;
    if (!approver || approver.includes('@') || approver.includes(' ')) {
      fail('dorApprover-no-pii-in-fixtures: fixture "' + tc.desc + '" has no PII',
        'dorApprover: ' + JSON.stringify(approver));
      allPass = false;
    }
  }
  if (allPass) {
    pass('dorApprover-no-pii-in-fixtures: all test fixtures have username-only dorApprover (no @, no spaces)');
  }
}());

// ── NFR: Consistency — channel hints schema values match adapter enum ──────────

console.log('\n[dor-approval] NFR: Consistency (MC-CONSIST-02)');

// channel-hints-schema-values-match-adapter-enum
(function() {
  // VALID_CHANNEL_TYPES from the module is the canonical enum.
  const expected = ['github-issue', 'jira-transition', 'confluence-comment', 'slack-reaction', 'manual'];

  const allPresent = expected.every(function(t) { return VALID_CHANNEL_TYPES.includes(t); });
  assert(allPresent,
    'channel-hints-schema-values-match-adapter-enum: VALID_CHANNEL_TYPES includes all expected channel types',
    'expected: ' + JSON.stringify(expected) + ' got: ' + JSON.stringify(VALID_CHANNEL_TYPES));

  assert(VALID_CHANNEL_TYPES.includes('github-issue'),
    'channel-hints-schema-values-match-adapter-enum: github-issue is a valid channel type',
    'VALID_CHANNEL_TYPES: ' + JSON.stringify(VALID_CHANNEL_TYPES));
}());

// ── NFR: Auditability — dorChannel permanent record ───────────────────────────

console.log('\n[dor-approval] NFR: Auditability (dorChannel permanent record)');

// dorChannel-permanent-record
(function() {
  // First sign-off via github-issue channel.
  const ps     = makePipelineState('test-story-slug');
  const event1 = makeApproveEvent({ actorUsername: 'pm-approver', timestamp: '2026-04-11T10:00:00Z' });
  const ctx1   = makeContextWithApproval();
  processApproveCommentEvent(event1, ps, ctx1);

  const channelAfterFirst = ps.features[0].epics[0].stories[0].dorChannel;

  assert(channelAfterFirst === 'github-issue',
    'dorChannel-permanent-record: first sign-off writes dorChannel: "github-issue"',
    'dorChannel: ' + channelAfterFirst);

  // Second sign-off attempt via manual channel — dorChannel must NOT be overwritten.
  const event2 = makeApproveEvent({ actorUsername: 'other-approver', timestamp: '2026-04-11T11:00:00Z' });
  const ctx2   = { channel_hints: { approval: { type: 'manual' } } };
  processApproveCommentEvent(event2, ps, ctx2);

  const channelAfterSecond = ps.features[0].epics[0].stories[0].dorChannel;

  assert(channelAfterSecond === 'github-issue',
    'dorChannel-permanent-record: second sign-off does NOT overwrite dorChannel',
    'dorChannel after second write: ' + channelAfterSecond);
}());

// ── AC6 Static check: no hardcoded channel targets in SKILL.md or module ──────

console.log('\n[dor-approval] AC6: Hardcoded value scan');

// hardcoded-value-scan
(function() {
  // Patterns that indicate hardcoded channel targets.
  const hardcodedPatterns = [
    /https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/issues\/\d+/,  // hardcoded issue URL
    /https:\/\/[a-zA-Z0-9._-]+\.atlassian\.net\//,                           // Jira hardcoded URL
    /slack\.com\/archives\//,                                                  // Slack channel hardcode
    /teams\.microsoft\.com\//,                                                 // Teams channel hardcode
  ];

  const filesToScan = [
    path.join(root, 'src', 'approval-channel', 'index.js'),
    path.join(root, 'scripts', 'process-dor-approval.js'),
    path.join(root, '.github', 'skills', 'persona-routing', 'SKILL.md'),
    path.join(root, '.github', 'workflows', 'approve-dor-github-issue.yml'),
  ];

  let hardcodedFound = null;
  for (const filePath of filesToScan) {
    if (!fs.existsSync(filePath)) continue;
    const text = fs.readFileSync(filePath, 'utf8');
    for (const pattern of hardcodedPatterns) {
      const match = text.match(pattern);
      if (match) {
        hardcodedFound = path.basename(filePath) + ': ' + match[0];
        break;
      }
    }
    if (hardcodedFound) break;
  }

  assert(hardcodedFound === null,
    'hardcoded-value-scan: no hardcoded channel URLs in approval-channel module, script, SKILL.md, or workflow',
    'found hardcoded value in: ' + hardcodedFound);
}());

// ── ADR-003: Schema registration ──────────────────────────────────────────────

console.log('\n[dor-approval] Schema registration (ADR-003)');

(function() {
  const schemaPath = path.join(root, '.github', 'pipeline-state.schema.json');
  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    pass('schema-file-valid-json: pipeline-state.schema.json is valid JSON');
  } catch (err) {
    fail('schema-file-valid-json', err.message);
    return;
  }

  // Navigate to story-level properties in the schema.
  const storyProps = (
    schema &&
    schema.properties &&
    schema.properties.features &&
    schema.properties.features.items &&
    schema.properties.features.items.properties &&
    schema.properties.features.items.properties.epics &&
    schema.properties.features.items.properties.epics.items &&
    schema.properties.features.items.properties.epics.items.properties &&
    schema.properties.features.items.properties.epics.items.properties.stories &&
    schema.properties.features.items.properties.epics.items.properties.stories.items &&
    schema.properties.features.items.properties.epics.items.properties.stories.items.properties
  ) || {};

  assert('dorApprover' in storyProps,
    'schema-dorApprover-field-registered: dorApprover field exists in pipeline-state.schema.json',
    'not found; available keys: ' + Object.keys(storyProps).join(', '));

  assert('dorChannel' in storyProps,
    'schema-dorChannel-field-registered: dorChannel field exists in pipeline-state.schema.json',
    'not found; available keys: ' + Object.keys(storyProps).join(', '));

  assert('dorSignedOffAt' in storyProps,
    'schema-dorSignedOffAt-field-registered: dorSignedOffAt field exists in pipeline-state.schema.json',
    'not found; available keys: ' + Object.keys(storyProps).join(', '));

  // Verify field descriptions are set (ADR-003: schema is the contract).
  const dorApproverDef = storyProps.dorApprover || {};
  assert(typeof dorApproverDef.description === 'string' && dorApproverDef.description.length > 0,
    'schema-dorApprover-field-registered: dorApprover has description',
    'description: ' + JSON.stringify(dorApproverDef.description));

  const dorChannelDef = storyProps.dorChannel || {};
  assert(typeof dorChannelDef.description === 'string' && dorChannelDef.description.length > 0,
    'schema-dorChannel-field-registered: dorChannel has description',
    'description: ' + JSON.stringify(dorChannelDef.description));
}());

// ── Print results ─────────────────────────────────────────────────────────────

process.stdout.write('\n[dor-approval] Results: ' + passed + ' passed, ' + failed + ' failed\n');

if (failures.length > 0) {
  process.stdout.write('[dor-approval] Failures:\n');
  failures.forEach(function(f) {
    process.stdout.write('  \u2717 ' + f.name + '\n');
    process.stdout.write('    \u2192 ' + f.reason + '\n');
  });
  process.exit(1);
}
