'use strict';

/**
 * governance-package.js — Shared enforcement core (p4-enf-package)
 *
 * Exports 5 entry points consumed by MCP and CLI surface adapters:
 *   resolveSkill   — locate a SKILL.md in the sidecar and return content + SHA-256 hash
 *   verifyHash     — compare expected vs actual hash; return HASH_MISMATCH error or null
 *   evaluateGate   — evaluate a named gate against context; return { passed, findings }
 *   advanceState   — advance workflow state if the transition is declared; return new state
 *   writeTrace     — produce a validated trace entry object
 *
 * Architecture constraints:
 *   C5  — hash verification is unconditional; no override parameter permitted
 *   MC-SEC-02 — no skill content or credentials logged externally
 *   MC-CORRECT-02 — no new pipeline-state.json fields written from this module
 *   ADR-004 — no hardcoded paths; callers inject sidecarRoot / config
 */

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

// ── resolveSkill ──────────────────────────────────────────────────────────────

/**
 * Locate a SKILL.md for the given skillId under sidecarRoot.
 *
 * @param {{ skillId: string, sidecarRoot: string }} opts
 * @returns {{ skillId: string, content: string, contentHash: string } | null}
 */
function resolveSkill({ skillId, sidecarRoot }) {
  if (!skillId || !sidecarRoot) return null;

  const candidates = [
    path.join(sidecarRoot, '.skills', skillId, 'SKILL.md'),
    path.join(sidecarRoot, '.github', 'skills', skillId, 'SKILL.md'),
    path.join(sidecarRoot, skillId, 'SKILL.md'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const content     = fs.readFileSync(candidate, 'utf8');
      const contentHash = crypto.createHash('sha256').update(content).digest('hex');
      return { skillId, content, contentHash };
    }
  }

  return null;
}

// ── verifyHash ────────────────────────────────────────────────────────────────

/**
 * Compare expected hash against actual hash.
 * Returns a structured HASH_MISMATCH error object when they differ, null when they match.
 *
 * C5: hash match is non-negotiable; no override parameter is permitted.
 *
 * @param {{ skillId: string, expected: string, actual: string }} opts
 * @returns {{ error: 'HASH_MISMATCH', skillId: string, expected: string, actual: string } | null}
 */
function verifyHash({ skillId, expected, actual }) {
  if (expected !== actual) {
    return { error: 'HASH_MISMATCH', skillId, expected, actual };
  }
  return null;
}

// ── evaluateGate ──────────────────────────────────────────────────────────────

/**
 * Evaluate a named governance gate against the supplied context.
 *
 * Supported gate names: 'dor', 'review', 'test-plan', 'definition-of-done'
 * Unknown gates are treated as not-passed with a finding.
 *
 * @param {{ gate: string, context: object }} opts
 * @returns {{ passed: boolean, findings: string[] }}
 */
function evaluateGate({ gate, context }) {
  const ctx      = context || {};
  const findings = [];

  switch (gate) {
    case 'dor': {
      if (ctx.dorStatus !== 'signed-off') findings.push('dorStatus must be signed-off');
      break;
    }
    case 'review': {
      if (ctx.reviewStatus !== 'passed') findings.push('reviewStatus must be passed');
      break;
    }
    case 'test-plan': {
      if (!ctx.testPlanWritten) findings.push('testPlanWritten must be true');
      break;
    }
    case 'definition-of-done': {
      if (ctx.dodStatus !== 'complete') findings.push('dodStatus must be complete');
      break;
    }
    default: {
      findings.push(`Unknown gate: "${gate}"`);
    }
  }

  return { passed: findings.length === 0, findings };
}

// ── advanceState ──────────────────────────────────────────────────────────────

/**
 * Advance the current workflow state to next, provided the transition is declared.
 *
 * @param {{ current: string, next: string, declaration: { nodes: Array<{ id: string, allowedTransitions: string[] }> } }} opts
 * @returns {{ current: string, previous: string } | null}
 */
function advanceState({ current, next, declaration }) {
  if (!declaration || !Array.isArray(declaration.nodes)) return null;

  const node = declaration.nodes.find(function(n) { return n.id === current; });
  if (!node) return null;

  if (!Array.isArray(node.allowedTransitions) || !node.allowedTransitions.includes(next)) {
    return null;
  }

  return { current: next, previous: current };
}

// ── writeTrace ────────────────────────────────────────────────────────────────

/**
 * Produce a validated trace entry object and optionally write it to outputPath.
 *
 * Required fields: skillHash, inputHash, outputRef, transitionTaken, surfaceType, timestamp.
 * Returns the entry object. If outputPath is provided, also writes as JSON to that file.
 *
 * @param {{
 *   skillId?: string,
 *   skillHash: string,
 *   inputHash: string,
 *   outputRef: string,
 *   transitionTaken: string,
 *   surfaceType: string,
 *   timestamp: string,
 *   outputPath?: string
 * }} opts
 * @returns {object}
 */
function writeTrace({ skillId, skillHash, inputHash, outputRef, transitionTaken, surfaceType, timestamp, outputPath }) {
  const entry = {
    skillId:         skillId || null,
    skillHash:       skillHash,
    inputHash:       inputHash,
    outputRef:       outputRef,
    transitionTaken: transitionTaken,
    surfaceType:     surfaceType,
    timestamp:       timestamp,
  };

  if (outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(entry, null, 2), 'utf8');
  }

  return entry;
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  resolveSkill,
  verifyHash,
  evaluateGate,
  advanceState,
  writeTrace,
};
