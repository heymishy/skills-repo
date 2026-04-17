/**
 * jira-adapter.js
 *
 * Approval channel adapter for Jira (p3.8).
 *
 * Supports two trigger variants:
 *   1. Workflow transition — issue transitioned to "Approved" status
 *   2. Comment trigger    — /approve-dor comment posted on the linked issue
 *
 * Security (MC-SEC-01):
 *   - Service account token read from process.env.JIRA_SERVICE_ACCOUNT_TOKEN only.
 *   - Never hardcoded. No credential literals in source.
 *
 * Interface (ADR-006):
 *   - Implements the approval-channel adapter interface.
 *   - Does not modify src/approval-channel/index.js.
 *
 * Returns:
 *   { statusCode: number, body: object }
 *   200 — success
 *   400 — not an approval trigger, or missing storyId
 *   401 — service account token not configured
 *   500 — downstream error (write failure, unexpected throw)
 *
 * Dependency injection (test isolation — AC3):
 *   opts.processDorApproval — override the default process-dor-approval
 *   function. Used in unit tests to supply a mock.
 *
 * Story ID extraction:
 *   Checks issue.fields.storyId first (custom field), then issue.fields.customfield_storyid,
 *   then falls back to the issue.key value.
 *
 * Reference: artefacts/2026-04-14-skills-platform-phase3/stories/p3.8-enterprise-approval-channel-adapters.md
 */
'use strict';

var path = require('path');

var ROOT = path.join(__dirname, '..', '..', '..');

// ─────────────────────────────────────────────────────────────────────────────
// Trigger detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine whether the Jira webhook payload represents an approval trigger.
 *
 * Trigger variant 1 (workflow transition):
 *   payload.issue.fields.status.name === 'Approved'
 *
 * Trigger variant 2 (/approve-dor comment):
 *   payload.comment.body.trim() === '/approve-dor'
 *
 * @param {object} payload — parsed Jira webhook payload
 * @returns {boolean}
 */
function isApprovalTrigger(payload) {
  if (!payload) return false;

  // Variant 1: workflow transition to "Approved"
  if (payload.issue
      && payload.issue.fields
      && payload.issue.fields.status
      && payload.issue.fields.status.name === 'Approved') {
    return true;
  }

  // Variant 2: /approve-dor comment
  if (payload.comment
      && typeof payload.comment.body === 'string'
      && payload.comment.body.trim() === '/approve-dor') {
    return true;
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Story ID extraction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract the story ID from a Jira webhook payload.
 * Checks custom fields then falls back to the issue key.
 *
 * @param {object} payload — parsed Jira webhook payload
 * @returns {string|null}
 */
function extractStoryId(payload) {
  if (!payload) return null;
  var issue  = payload.issue || {};
  var fields = issue.fields || {};

  if (typeof fields.storyId === 'string' && fields.storyId) return fields.storyId;
  if (typeof fields.customfield_storyid === 'string' && fields.customfield_storyid)
    return fields.customfield_storyid;
  if (typeof issue.key === 'string' && issue.key) return issue.key;

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default process-dor-approval implementation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default implementation: reads pipeline-state.json and calls
 * processApproveCommentEvent from src/approval-channel/index.js.
 *
 * In production: ACTOR_USERNAME and PIPELINE_STATE_PATH must be set.
 * In tests: replace via opts.processDorApproval to avoid file I/O.
 *
 * @param {{ storyId: string, status: string }} opts
 */
function defaultProcessDorApproval(opts) {
  var fs = require('fs');
  var channelIndex = require(path.join(ROOT, 'src', 'approval-channel', 'index.js'));
  var processApproveCommentEvent = channelIndex.processApproveCommentEvent;

  var statePath = process.env.PIPELINE_STATE_PATH
    || path.join(ROOT, '.github', 'pipeline-state.json');

  var pipelineState = JSON.parse(fs.readFileSync(statePath, 'utf8'));

  var event = {
    actorUsername: process.env.ACTOR_USERNAME || 'jira-adapter',
    storySlug:     opts.storyId,
    timestamp:     new Date().toISOString(),
  };

  var result = processApproveCommentEvent(event, pipelineState, {});
  if (!result.success) {
    throw new Error('[jira-adapter] processApproveCommentEvent failed for ' + opts.storyId);
  }

  fs.writeFileSync(statePath, JSON.stringify(pipelineState, null, 2));
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// handle — main adapter entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle a Jira webhook request.
 *
 * @param {object} payload — parsed JSON body from the Jira webhook
 * @param {object} [opts]  — { processDorApproval: function } for DI
 * @returns {Promise<{ statusCode: number, body: object }>}
 */
async function handle(payload, opts) {
  // 1. Service account token presence check (MC-SEC-01)
  var token = process.env.JIRA_SERVICE_ACCOUNT_TOKEN;
  if (!token) {
    process.stderr.write('[jira-adapter] JIRA_SERVICE_ACCOUNT_TOKEN not set\n');
    return { statusCode: 401, body: { error: 'Unauthorized' } };
  }

  // 2. Trigger detection
  if (!isApprovalTrigger(payload)) {
    return { statusCode: 400, body: { error: 'Not an approval trigger' } };
  }

  // 3. Extract story ID
  var storyId = extractStoryId(payload);
  if (!storyId) {
    process.stderr.write('[jira-adapter] Missing storyId in payload\n');
    return { statusCode: 400, body: { error: 'Missing storyId' } };
  }

  // 4. Call process-dor-approval
  var processDorApproval = (opts && typeof opts.processDorApproval === 'function')
    ? opts.processDorApproval
    : defaultProcessDorApproval;

  try {
    await processDorApproval({ storyId: storyId, status: 'signed-off' });
    return { statusCode: 200, body: { ok: true } };
  } catch (err) {
    process.stderr.write('[jira-adapter] Error: ' + (err && err.message) + '\n');
    return { statusCode: 500, body: { error: 'Internal Server Error' } };
  }
}

module.exports = { handle, extractStoryId, isApprovalTrigger };
