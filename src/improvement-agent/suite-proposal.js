/**
 * src/improvement-agent/suite-proposal.js
 *
 * Suite addition proposal staging for the improvement agent (p3.4).
 *
 * IMPORTANT: This module writes new scenario proposals to
 *   workspace/proposals/suite-additions/[proposal-id].json
 *
 * It NEVER writes to workspace/suite.json or platform/suite.json directly.
 * Human promotion from the staging area to suite.json requires a manual PR
 * to the platform-infrastructure repo (AC4 — no automated promotion pathway).
 *
 * Exports:
 *   generateProposalId()                         — returns unique sp-<hex> id
 *   writeSuiteProposal(proposal, options)        — write staged proposal JSON file
 *
 * Zero external npm dependencies — plain Node.js (crypto, fs, path) only.
 */
'use strict';

var crypto = require('crypto');
var fs     = require('fs');
var path   = require('path');

// Sub-directory under proposalsDir where staged suite proposals are written
var SUITE_ADDITIONS_SUBDIR = 'suite-additions';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Generate a unique proposal ID.
 *
 * @returns {string} e.g. "sp-3f8a1b2c"
 */
function generateProposalId() {
  return 'sp-' + crypto.randomBytes(4).toString('hex');
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Write a staged suite addition proposal to
 *   <proposalsDir>/suite-additions/<proposalId>.json
 *
 * The written JSON contains:
 *   proposalId      — unique identifier
 *   traceId         — trace file reference that evidences this proposal
 *   failurePattern  — kebab-case failure pattern being addressed
 *   justification   — human-readable rationale
 *   createdAt       — ISO 8601 timestamp
 *   status          — always "pending" at creation
 *
 * @param {object} proposal
 * @param {string} proposal.traceId          - mandatory trace file reference
 * @param {string} proposal.failurePattern   - mandatory failure pattern label
 * @param {string} proposal.justification    - mandatory rationale string
 * @param {object} [options]
 * @param {string} [options.proposalsDir]    - override base proposals directory
 * @param {string} [options.proposalId]      - override generated ID (for testing)
 * @returns {{ proposalId: string, filePath: string }}
 */
function writeSuiteProposal(proposal, options) {
  var opts = options || {};

  if (!proposal || typeof proposal !== 'object') {
    throw new Error('proposal must be a non-null object');
  }
  if (!proposal.traceId) {
    throw new Error('proposal.traceId is required');
  }
  if (!proposal.failurePattern) {
    throw new Error('proposal.failurePattern is required');
  }
  if (!proposal.justification) {
    throw new Error('proposal.justification is required');
  }

  var proposalId   = opts.proposalId || generateProposalId();
  var baseDir      = opts.proposalsDir ||
    path.join(__dirname, '..', '..', 'workspace', 'proposals');
  var stagingDir   = path.join(baseDir, SUITE_ADDITIONS_SUBDIR);

  if (!fs.existsSync(stagingDir)) {
    fs.mkdirSync(stagingDir, { recursive: true });
  }

  var filePath = path.join(stagingDir, proposalId + '.json');

  var record = {
    proposalId:     proposalId,
    traceId:        proposal.traceId,
    failurePattern: proposal.failurePattern,
    justification:  proposal.justification,
    createdAt:      new Date().toISOString(),
    status:         'pending',
  };

  fs.writeFileSync(filePath, JSON.stringify(record, null, 2) + '\n', 'utf8');

  return { proposalId: proposalId, filePath: filePath };
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  generateProposalId: generateProposalId,
  writeSuiteProposal: writeSuiteProposal,
};
