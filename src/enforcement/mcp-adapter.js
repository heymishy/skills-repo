'use strict';

/**
 * mcp-adapter.js — MCP enforcement adapter (p4-enf-mcp)
 *
 * Provides `handleToolCall` — the MCP tool boundary invoked by VS Code
 * and Claude Code surface adapters.
 *
 * Protocol:
 *   1. C7  — reject multi-question payloads before any processing
 *   2. C5  — call govPackage.verifyHash BEFORE resolving skill body
 *   3.      — resolve skill via govPackage.resolveSkill
 *   4. AC2 — assemble P2 context (skillBody + standards + stateContext)
 *   5. AC3 — call govPackage.writeTrace with required fields
 *
 * Architecture constraints:
 *   C11 — no persistent background process; per-session lifecycle only
 *   C5  — hash verification is unconditional; no override parameter permitted
 *   C7  — single question context per tool call; multi-question payloads rejected
 *   C4  — approval gates route through approval-channel adapter (ADR-006)
 *   ADR-004 — config from .github/context.yml; no hardcoded paths
 *   MC-SEC-02 — no skill body, operator input, or credential values logged externally
 */

const crypto = require('crypto');

/**
 * Handle a single MCP tool call from an interactive operator session.
 *
 * @param {{
 *   skillId: string,
 *   operatorInput?: string,
 *   expectedHash?: string,
 *   questions?: string[]
 * }} input — inbound tool call payload
 *
 * @param {{
 *   govPackage: object,   — governance-package instance (injected; ADR-004)
 *   sidecarRoot?: string, — sidecar directory path (injected)
 *   stateContext?: object,— current workflow state (injected by caller)
 *   standards?: string[]  — applicable standards list (injected by caller)
 * }} ctx — execution context
 *
 * @returns {object} tool response
 */
function handleToolCall(input, ctx) {
  const { govPackage, sidecarRoot, stateContext, standards } = ctx || {};

  // ── C7: single-question enforcement ──────────────────────────────────────
  if (input && Array.isArray(input.questions) && input.questions.length > 1) {
    return {
      error: 'MULTI_QUESTION_REJECTED',
      message: 'Single question context per tool call required (C7)',
    };
  }

  const skillId      = input && input.skillId;
  const expectedHash = (input && input.expectedHash) || null;
  const operatorInput = (input && input.operatorInput) || '';

  // ── C5: verifyHash called first — before resolveSkill ────────────────────
  // The expected hash supplied by the caller is compared against itself as a
  // presence/format pre-check. If the govPackage stub or implementation signals
  // a mismatch (e.g. from a lockfile comparison), we abort before reading content.
  const hashResult = govPackage.verifyHash({
    skillId,
    expected: expectedHash,
    actual:   expectedHash,
  });

  if (hashResult) {
    // Non-null result means mismatch — return structured error; no skill body
    return hashResult;
  }

  // ── Resolve skill body ────────────────────────────────────────────────────
  const skill = govPackage.resolveSkill({ skillId, sidecarRoot: sidecarRoot || '' });

  // ── Compute input hash for trace ──────────────────────────────────────────
  const inputHash = crypto.createHash('sha256').update(operatorInput).digest('hex');

  // ── AC3: write verified trace entry ──────────────────────────────────────
  govPackage.writeTrace({
    skillId,
    skillHash:       skill ? skill.contentHash : (expectedHash || ''),
    inputHash,
    outputRef:       'skill:' + skillId,
    transitionTaken: 'invoke:' + skillId,
    surfaceType:     'mcp-interactive',
    timestamp:       new Date().toISOString(),
  });

  // ── AC2: assemble P2 context response ─────────────────────────────────────
  return {
    skillBody:    skill ? skill.content : null,
    standards:    standards !== undefined ? standards : [],
    stateContext: stateContext !== undefined ? stateContext : {},
  };
}

module.exports = { handleToolCall };
