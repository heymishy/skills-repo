'use strict';
// src/teams-bot/bot-approval-router.js
// p4-nta-gate-translation — Teams channel approval routing
//
// C4: no auto-approval; every approval is an explicit human action
// ADR-004: no hardcoded tenant/channel IDs; all config injected
// MC-SEC-02: no credentials in approval event payload

/**
 * Routes a Teams approval event to processApproveCommentEvent.
 * Validates the approver against the configured approvers list.
 * Returns an error object if config is missing or approver is not authorised.
 *
 * @param {{ storySlug: string, approver: string, config: object }} opts
 * @param {{ processApproveCommentEvent: function }} deps
 * @returns {{ success: boolean, dorStatus?: string } | { error: string, message: string }}
 */
function routeApproval({ storySlug, approver, config } = {}, deps = {}) {
  // Validate config
  const teamsConfig = config && config.approval_channels && config.approval_channels.teams;
  if (!teamsConfig) {
    return {
      error:   'MISSING_CONFIG',
      message: 'Approval routing configuration is missing: approval_channels.teams not found',
    };
  }

  // Validate approver
  const allowedApprovers = (teamsConfig.approvers || []);
  if (!allowedApprovers.includes(approver)) {
    return {
      error:   'UNAUTHORISED_APPROVER',
      message: 'Approver "' + approver + '" is not in the authorised approvers list',
      success: false,
    };
  }

  // Build approval event — no credentials or tokens (MC-SEC-02)
  const approvalEvent = {
    storySlug:    storySlug,
    approver:     approver,
    channel:      'teams',
    approvedAt:   new Date().toISOString(),
    dorStatus:    'signed-off',
  };

  // Delegate to the processApproveCommentEvent handler (injected dependency)
  const processFn = deps && deps.processApproveCommentEvent;
  if (typeof processFn === 'function') {
    return processFn(approvalEvent);
  }

  return { success: true, dorStatus: 'signed-off', event: approvalEvent };
}

module.exports = { routeApproval };
