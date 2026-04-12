#!/usr/bin/env node
/**
 * approval-channel/index.js
 *
 * Persona routing and non-engineer approval interface (p2.8).
 *
 * Provides channel hint routing and the github-issue approval adapter.
 * All channel routing targets are read from context.yml — no hardcoded
 * URLs, workspace IDs, issue numbers, or team names (ADR-004).
 *
 * Exports:
 *   selectAdapter(context)
 *     → string|null  — adapter type from context (e.g. 'github-issue')
 *
 *   buildNotificationPayload(storySlug, squadId, context, fleetEntry)
 *     → object  — notification payload with required fields
 *
 *   dispatchNotifications(context, payload, opts)
 *     → { dispatched: string[], warnings: string[] }
 *     IDE channel regression guard: IDE notification always dispatched
 *     when channel_hints.ide is set. Fallback: no channel_hints.approval →
 *     IDE-only + warning logged. No error, no blocked action (AC5).
 *
 *   processApproveCommentEvent(event, pipelineState, context)
 *     → { success: boolean, story: object|null }
 *     Writes dorStatus: "signed-off", dorApprover (GitHub username — never
 *     email; MC-PII constraint), dorChannel (permanent record, not
 *     overwritten), and dorSignedOffAt to the target story in pipelineState.
 *
 *   routeApprovalNotification(context, storySlug, squadId, fleetEntry, opts)
 *     → { payload: object, dispatched: string[], warnings: string[] }
 *
 * ADR-002: dorStatus: "signed-off" — identical to VS Code sign-off path.
 * ADR-003: dorApprover, dorChannel, dorSignedOffAt defined in schema first.
 * ADR-004: all channel targets read from context.yml.
 * MC-PII:  dorApprover stores username only — never full name or email.
 *
 * Reference: artefacts/2026-04-11-skills-platform-phase2/stories/p2.8-persona-routing-non-engineer-approval.md
 */
'use strict';

// Valid approval channel adapter types (Phase 2: github-issue only;
// Phase 3 will add jira-transition, confluence-comment, slack-reaction).
const VALID_CHANNEL_TYPES = [
  'github-issue',
  'jira-transition',
  'confluence-comment',
  'slack-reaction',
  'manual',
];

// ─────────────────────────────────────────────────────────────────────────────
// selectAdapter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Selects the approval channel adapter type from a parsed context object.
 * Reads channel_hints.approval.type first; falls back to top-level
 * approval_channel field (both are valid context.yml forms — ADR-004).
 *
 * @param {object} context - Parsed context.yml
 * @returns {string|null} Adapter type (e.g. 'github-issue') or null if not configured
 */
function selectAdapter(context) {
  const hints = (context && context.channel_hints) || {};
  if (hints.approval && hints.approval.type) {
    return hints.approval.type;
  }
  if (context && context.approval_channel) {
    return context.approval_channel;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// buildNotificationPayload
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the notification payload for the approval channel.
 * Target URL is read from context.yml (channel_hints.approval.issueUrl) — ADR-004.
 *
 * @param {string} storySlug  - Story slug to include in the payload
 * @param {string} squadId    - Squad identifier
 * @param {object} context    - Parsed context.yml
 * @param {object} [fleetEntry] - Fleet registry entry for the squad (from fleet/squads/{id}.json)
 * @returns {object} Notification payload
 */
function buildNotificationPayload(storySlug, squadId, context, fleetEntry) {
  const hints    = (context && context.channel_hints) || {};
  const approval = hints.approval || {};

  return {
    storySlug,
    squadId,
    approvalActionDescription: 'Post /approve-dor as a comment on the linked GitHub Issue to trigger DoR sign-off.',
    fleetRegistryRef: (fleetEntry && fleetEntry.pipelineStateUrl) || null,
    targetUrl:    approval.issueUrl || null,
    channelType:  approval.type || selectAdapter(context) || null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// dispatchNotifications
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dispatches notifications to all configured channels.
 *
 * IDE channel regression guard (AC4): if channel_hints.ide is set, the IDE
 * notification is always dispatched — adding an approval channel must NOT
 * suppress the VS Code notification.
 *
 * Fallback (AC5): no channel_hints.approval key → IDE-only notification +
 * warning logged. No error thrown; no action blocked.
 *
 * @param {object} context - Parsed context.yml
 * @param {object} payload - Notification payload (from buildNotificationPayload)
 * @param {object} [opts]  - { warn: function(msg) } — injectable logger
 * @returns {{ dispatched: string[], warnings: string[] }}
 */
function dispatchNotifications(context, payload, opts) {
  const warnFn = (opts && typeof opts.warn === 'function')
    ? opts.warn
    : function(msg) { process.stdout.write('[approval-channel] WARN: ' + msg + '\n'); };

  const dispatched = [];
  const warnings   = [];
  const hints      = (context && context.channel_hints) || {};

  // IDE channel — always dispatched when configured (AC4 regression guard).
  // If no ide hint is set, default to vscode as the fallback target.
  const ideTarget = hints.ide || 'vscode';
  dispatched.push('ide:' + ideTarget);

  // Approval channel — dispatched only when configured in context.yml.
  if (hints.approval && hints.approval.type) {
    dispatched.push('approval:' + hints.approval.type);
  } else if (context && context.approval_channel) {
    dispatched.push('approval:' + context.approval_channel);
  } else {
    // AC5: no approval channel configured → log warning, continue IDE-only.
    const msg = 'No approval channel configured \u2014 DoR sign-off defaulting to IDE. ' +
      'Set channel_hints.approval in context.yml to enable non-engineer approval.';
    warnFn(msg);
    warnings.push(msg);
  }

  return { dispatched, warnings };
}

// ─────────────────────────────────────────────────────────────────────────────
// processApproveCommentEvent
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Processes an /approve-dor event and writes dorStatus, dorApprover, dorChannel,
 * and dorSignedOffAt to the target story entry in pipelineState.
 *
 * MC-PII: dorApprover stores GitHub username ONLY — never a full name or email.
 * Auditability: dorChannel is a permanent record — not overwritten if already set.
 * ADR-002: dorStatus: "signed-off" — identical canonical field to VS Code sign-off.
 *
 * @param {object} event - Approval event payload
 *   {
 *     actorUsername: string,    // GitHub username of the approver (required)
 *     storySlug:    string,     // Story slug to update (required)
 *     timestamp?:   string,     // ISO 8601 timestamp; defaults to now()
 *   }
 * @param {object} pipelineState - Parsed pipeline-state.json (mutated in place)
 * @param {object} context       - Parsed context.yml
 * @returns {{ success: boolean, story: object|null }}
 */
function processApproveCommentEvent(event, pipelineState, context) {
  if (!event || !event.actorUsername || !event.storySlug) {
    return { success: false, story: null };
  }

  // PII constraint: store username only, never email or full name.
  const approver = event.actorUsername;

  // Channel is read from context.yml — not hardcoded (ADR-004).
  const hints          = (context && context.channel_hints) || {};
  const approvalChannel = (hints.approval && hints.approval.type) ||
    (context && context.approval_channel) ||
    'github-issue';

  const timestamp = event.timestamp || new Date().toISOString();

  // Locate the target story in pipeline-state.json.
  let targetStory = null;
  if (pipelineState && Array.isArray(pipelineState.features)) {
    outer: for (const feature of pipelineState.features) {
      if (!Array.isArray(feature.epics)) continue;
      for (const epic of feature.epics) {
        if (!Array.isArray(epic.stories)) continue;
        for (const story of epic.stories) {
          if (story.slug === event.storySlug) {
            targetStory = story;
            break outer;
          }
        }
      }
    }
  }

  if (!targetStory) {
    return { success: false, story: null };
  }

  // Write dorStatus — ADR-002: same canonical evidence field as VS Code sign-off.
  targetStory.dorStatus = 'signed-off';

  // Write dorApprover — GitHub username only (MC-PII constraint).
  targetStory.dorApprover = approver;

  // Write dorChannel — permanent record; not overwritten if already set.
  if (!targetStory.dorChannel) {
    targetStory.dorChannel = approvalChannel;
  }

  // Write sign-off timestamp.
  targetStory.dorSignedOffAt = timestamp;

  return { success: true, story: targetStory };
}

// ─────────────────────────────────────────────────────────────────────────────
// routeApprovalNotification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Routes an approval notification to all configured channels.
 * Reads channel config from context.yml only — no hardcoded targets (ADR-004).
 *
 * @param {object} context       - Parsed context.yml
 * @param {string} storySlug     - Story slug
 * @param {string} squadId       - Squad identifier
 * @param {object} [fleetEntry]  - Fleet registry entry ({ pipelineStateUrl, ... })
 * @param {object} [opts]        - { warn: function(msg) }
 * @returns {{ payload: object, dispatched: string[], warnings: string[] }}
 */
function routeApprovalNotification(context, storySlug, squadId, fleetEntry, opts) {
  const payload = buildNotificationPayload(storySlug, squadId, context, fleetEntry);
  const result  = dispatchNotifications(context, payload, opts);
  return Object.assign({ payload }, result);
}

// ─────────────────────────────────────────────────────────────────────────────
// Module exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  selectAdapter,
  buildNotificationPayload,
  dispatchNotifications,
  processApproveCommentEvent,
  routeApprovalNotification,
  VALID_CHANNEL_TYPES,
};
