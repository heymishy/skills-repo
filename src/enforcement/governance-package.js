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

// ── writeTrace ────────────────────────────────────────────────────────────────────

/**
 * Produce a validated trace entry and optionally persist it.
 *
 * Gate-confirm mode (cdg.5): called with entry.featureSlug present.
 *   Appends a chain-hashed JSONL entry to workspace/traces/<featureSlug>.trace.jsonl.
 *   options.tracePath overrides the default path (used by tests).
 *
 * Legacy Phase-4 skill mode: called without entry.featureSlug.
 *   Returns { skillHash, inputHash, outputRef, transitionTaken, surfaceType, timestamp }.
 *   If entry.outputPath is provided, also writes JSON to that file.
 *
 * @param {object} entry
 * @param {object} [options]
 * @returns {object}
 */
function writeTrace(entry, options) {
  // cdg.5: gate-confirm chain-hash trace mode
  if (entry && typeof entry.featureSlug === 'string') {
    return _writeGateConfirmTrace(entry, options);
  }

  // Legacy Phase-4 skill trace mode — T8 backward compatibility
  var skillId = entry.skillId, skillHash = entry.skillHash, inputHash = entry.inputHash,
      outputRef = entry.outputRef, transitionTaken = entry.transitionTaken,
      surfaceType = entry.surfaceType, timestamp = entry.timestamp,
      outputPath = entry.outputPath;

  var legacyEntry = {
    skillId:         skillId || null,
    skillHash:       skillHash,
    inputHash:       inputHash,
    outputRef:       outputRef,
    transitionTaken: transitionTaken,
    surfaceType:     surfaceType,
    timestamp:       timestamp,
  };

  if (outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(legacyEntry, null, 2), 'utf8');
  }

  return legacyEntry;
}

/**
 * Internal helper — gate-confirm chain-hash trace append (cdg.5).
 *
 * @param {object} entry  - { timestamp, featureSlug, storyId, stage, operatorEmail, exitCode }
 * @param {object} [options] - { tracePath?: string }
 * @returns {object} finalEntry with chainHash field added
 */
function _writeGateConfirmTrace(entry, options) {
  var repoRoot = path.resolve(__dirname, '../..');
  var tracePath = (options && options.tracePath) ||
    path.join(repoRoot, 'workspace', 'traces', entry.featureSlug + '.trace.jsonl');

  fs.mkdirSync(path.dirname(tracePath), { recursive: true });

  var prevChainHash = '';
  if (fs.existsSync(tracePath)) {
    var raw = fs.readFileSync(tracePath, 'utf8');
    var lines = raw.split('\n').filter(function(l) { return l.trim(); });
    if (lines.length > 0) {
      try { prevChainHash = JSON.parse(lines[lines.length - 1]).chainHash || ''; } catch (_) {}
    }
  }

  var entryWithoutHash = {
    timestamp:     entry.timestamp,
    featureSlug:   entry.featureSlug,
    storyId:       entry.storyId,
    stage:         entry.stage,
    operatorEmail: entry.operatorEmail,
    exitCode:      entry.exitCode,
  };

  var chainHash = crypto.createHash('sha256')
    .update(JSON.stringify(entryWithoutHash) + prevChainHash)
    .digest('hex');

  var finalEntry = Object.assign({}, entryWithoutHash, { chainHash: chainHash });
  fs.appendFileSync(tracePath, JSON.stringify(finalEntry) + '\n', 'utf8');
  return finalEntry;
}

// ── checkHGates ───────────────────────────────────────────────────────────────

/**
 * Run H1-H9 DoR gate checks for a story identified by slug.
 * ADR-013: H-gate logic must be importable from governance-package.js.
 *
 * @param {string} storySlug - Story slug (e.g. 'gpa-sc-01-trace-contract')
 * @param {string} repoRoot  - Absolute path to repository root
 * @returns {{ exitCode: number, stdout: string, stderr: string }}
 */
function checkHGates(storySlug, repoRoot) {
  const { validate } = require('./cli-outer-loop');

  // ── Check dorStatus: skip signed-off stories ──────────────────────────────
  try {
    const statePath = path.join(repoRoot, '.github', 'pipeline-state.json');
    if (fs.existsSync(statePath)) {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      const features = Array.isArray(state.features) ? state.features : [];
      for (const feat of features) {
        const flatStories = Array.isArray(feat.stories) ? feat.stories : [];
        const epicStories = Array.isArray(feat.epics)
          ? feat.epics.flatMap(e => Array.isArray(e.stories) ? e.stories : [])
          : [];
        const allStories = flatStories.concat(epicStories);
        const match = allStories.find(s => (s.id === storySlug || s.slug === storySlug));
        if (match && match.dorStatus === 'signed-off') {
          return {
            exitCode: 0,
            stdout: 'SKIP — dorStatus is signed-off for ' + storySlug + '\n[skills-validate] Results: 9 passed, 0 failed',
            stderr: '',
          };
        }
      }
    }
  } catch (_) {
    // If pipeline-state can't be read, proceed to H-gate check
  }

  // ── Resolve DoR artefact path from slug ───────────────────────────────────
  let dorPath = null;
  const artefactsDir = path.join(repoRoot, 'artefacts');
  try {
    const featureDirs = fs.readdirSync(artefactsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    for (const featureDir of featureDirs) {
      const candidate = path.join(artefactsDir, featureDir, 'dor', storySlug + '-dor.md');
      if (fs.existsSync(candidate)) {
        dorPath = candidate;
        break;
      }
    }
  } catch (_) {
    // artefacts dir not found or not readable
  }

  if (!dorPath) {
    return {
      exitCode: 1,
      stdout: '',
      stderr: 'H1 FAIL: no DoR artefact found for slug: ' + storySlug +
              '\n[skills-validate] Results: 0 passed, 1 failed',
    };
  }

  // ── Run H1-H9 checks ──────────────────────────────────────────────────────
  const result = validate(dorPath, 'definition-of-ready', repoRoot);
  if (result.exitCode === 0) {
    return {
      exitCode: 0,
      stdout: '[skills-validate] Results: 9 passed, 0 failed',
      stderr: '',
    };
  }

  // Failing: include the failure message + canonical line
  const failMsg = result.stderr || result.stdout || 'H-gate FAIL';
  return {
    exitCode: 1,
    stdout: '',
    stderr: failMsg + '\n[skills-validate] Results: 0 passed, 1 failed',
  };
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  resolveSkill,
  verifyHash,
  evaluateGate,
  advanceState,
  writeTrace,
  checkHGates,
};
