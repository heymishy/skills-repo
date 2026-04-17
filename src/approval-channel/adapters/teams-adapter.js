/**
 * teams-adapter.js
 *
 * Approval channel adapter for Microsoft Teams (p3.8).
 *
 * Parses an Adaptive Card webhook payload from Teams, verifies the HMAC
 * signature using the signing secret from the environment variable
 * TEAMS_WEBHOOK_SECRET, extracts the story ID, and calls
 * process-dor-approval (process-dor-approval.js / processApproveCommentEvent)
 * with the story ID.
 *
 * Security (MC-SEC-01):
 *   - Signing secret read from process.env.TEAMS_WEBHOOK_SECRET only.
 *   - Never hardcoded. No credential literals in source.
 *   - HMAC comparison uses crypto.timingSafeEqual to prevent timing attacks.
 *
 * Interface (ADR-006):
 *   - Implements the approval-channel adapter interface.
 *   - Does not modify src/approval-channel/index.js.
 *
 * Returns:
 *   { statusCode: number, body: object }
 *   200 — success
 *   400 — missing/malformed payload or missing storyId
 *   401 — HMAC verification failed
 *   500 — downstream error (write failure, unexpected throw)
 *
 * Dependency injection (test isolation — AC3):
 *   opts.processDorApproval — override the default process-dor-approval
 *   function. Used in unit tests to supply a mock.
 *
 * Reference: artefacts/2026-04-14-skills-platform-phase3/stories/p3.8-enterprise-approval-channel-adapters.md
 */
'use strict';

const crypto = require('crypto');
const path   = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');

// ─────────────────────────────────────────────────────────────────────────────
// HMAC verification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verify the Teams HMAC signature on the raw request body.
 *
 * Teams signs requests using HMAC-SHA256. The Authorization header format is:
 *   Authorization: HMAC <base64(hmac-sha256(rawBody, secret))>
 *
 * @param {string|Buffer} rawBody   — raw request body (before JSON parsing)
 * @param {string}        authHeader — value of the Authorization header
 * @param {string}        secret     — signing secret from TEAMS_WEBHOOK_SECRET
 * @returns {boolean}
 */
function verifyHmac(rawBody, authHeader, secret) {
  if (!secret) return false;
  if (!authHeader || !authHeader.startsWith('HMAC ')) return false;

  const provided = authHeader.slice(5); // strip "HMAC " prefix
  const expected = crypto.createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');

  // Length equality check first to guard timingSafeEqual buffer-size requirement
  if (Buffer.byteLength(provided) !== Buffer.byteLength(expected)) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(provided),
      Buffer.from(expected)
    );
  } catch (_) {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Story ID extraction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract the story ID from a Teams Adaptive Card webhook payload.
 * Checks common payload shapes in order of precedence.
 *
 * @param {object} payload — parsed JSON body from the Teams webhook
 * @returns {string|null}
 */
function extractStoryId(payload) {
  if (!payload) return null;
  if (typeof payload.storyId === 'string' && payload.storyId) return payload.storyId;
  if (payload.value && typeof payload.value.storyId === 'string' && payload.value.storyId)
    return payload.value.storyId;
  if (payload.action && payload.action.data && typeof payload.action.data.storyId === 'string'
      && payload.action.data.storyId)
    return payload.action.data.storyId;
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
  var fs   = require('fs');
  var channelIndex = require(path.join(ROOT, 'src', 'approval-channel', 'index.js'));
  var processApproveCommentEvent = channelIndex.processApproveCommentEvent;

  var statePath = process.env.PIPELINE_STATE_PATH
    || path.join(ROOT, '.github', 'pipeline-state.json');

  var pipelineState = JSON.parse(fs.readFileSync(statePath, 'utf8'));

  var event = {
    actorUsername: process.env.ACTOR_USERNAME || 'teams-adapter',
    storySlug:     opts.storyId,
    timestamp:     new Date().toISOString(),
  };

  var result = processApproveCommentEvent(event, pipelineState, {});
  if (!result.success) {
    throw new Error('[teams-adapter] processApproveCommentEvent failed for ' + opts.storyId);
  }

  fs.writeFileSync(statePath, JSON.stringify(pipelineState, null, 2));
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// handle — main adapter entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle a Teams webhook request.
 *
 * @param {string|Buffer} rawBody  — raw request body (required for HMAC)
 * @param {object}        headers  — request headers; must include authorization
 * @param {object}        [opts]   — { processDorApproval: function } for DI
 * @returns {Promise<{ statusCode: number, body: object }>}
 */
async function handle(rawBody, headers, opts) {
  var secret     = process.env.TEAMS_WEBHOOK_SECRET;
  var authHeader = (headers && (headers['authorization'] || headers['Authorization'])) || '';

  // 1. HMAC verification
  if (!verifyHmac(rawBody, authHeader, secret)) {
    process.stderr.write('[teams-adapter] HMAC verification failed\n');
    return { statusCode: 401, body: { error: 'Unauthorized' } };
  }

  // 2. Parse payload
  var payload;
  try {
    payload = (typeof rawBody === 'string') ? JSON.parse(rawBody) : JSON.parse(rawBody.toString());
  } catch (_) {
    return { statusCode: 400, body: { error: 'Invalid JSON body' } };
  }

  // 3. Extract story ID
  var storyId = extractStoryId(payload);
  if (!storyId) {
    process.stderr.write('[teams-adapter] Missing storyId in payload\n');
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
    process.stderr.write('[teams-adapter] Error: ' + (err && err.message) + '\n');
    return { statusCode: 500, body: { error: 'Internal Server Error' } };
  }
}

module.exports = { handle, verifyHmac, extractStoryId };
