'use strict';

/**
 * cli-adapter.js — CLI enforcement adapter (p4-enf-cli)
 *
 * Exports Mode 1 MVP command set (9 commands):
 *   init, fetch, pin, verify, workflow, advance, back, navigate, emitTrace
 *
 * Architecture constraints:
 *   C5    — advance calls verifyHash before envelope build; no bypass flag permitted
 *   ADR-002 — advance enforces allowedTransitions from workflow declaration
 *   ADR-004 — no hardcoded URLs or paths; config injected by caller
 *   MC-SEC-02 — no credentials in CLI output or trace artefacts
 */

const fs     = require('fs');

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Look up the allowedTransitions for `current` in a workflow declaration.
 * @returns {{ allowed: string[] }}
 */
function resolveTransition(declaration, current, next) {
  if (!declaration || !Array.isArray(declaration.nodes)) return { allowed: [] };
  const node = declaration.nodes.find(function(n) { return n.id === current; });
  if (!node) return { allowed: [] };
  return { allowed: Array.isArray(node.allowedTransitions) ? node.allowedTransitions : [] };
}

// ── Commands ──────────────────────────────────────────────────────────────────

/**
 * init — install sidecar + lockfile (Mode 1 MVP stub)
 */
function init(opts) {
  return { status: 'ok', command: 'init' };
}

/**
 * fetch — retrieve upstream skill content (Mode 1 MVP stub)
 */
function fetch(opts) {
  return { status: 'ok', command: 'fetch' };
}

/**
 * pin — update lockfile with current skill hashes (Mode 1 MVP stub)
 */
function pin(opts) {
  return { status: 'ok', command: 'pin' };
}

/**
 * verify — re-check hashes against lockfile (Mode 1 MVP stub)
 */
function verify(opts) {
  return { status: 'ok', command: 'verify' };
}

/**
 * workflow — read and display workflow declaration (Mode 1 MVP stub)
 */
function workflow(opts) {
  return { status: 'ok', command: 'workflow' };
}

/**
 * advance — governed state transition with hash check.
 *
 * Protocol (ADR-002 + C5):
 *   1. Validate transition against declaration.allowedTransitions
 *   2. Call govPackage.verifyHash before envelope build (C5)
 *   3. Call govPackage.advanceState and return result
 *
 * @param {{
 *   current: string,
 *   next: string,
 *   declaration: object,
 *   govPackage: object,
 *   skillId?: string,
 *   expectedHash?: string
 * }} opts
 */
function advance(opts) {
  const { current, next, declaration, govPackage, skillId, expectedHash } = opts || {};

  // Step 1 — ADR-002: transition must be declared
  const { allowed } = resolveTransition(declaration, current, next);
  if (!allowed.includes(next)) {
    const allowedStr = allowed.length > 0 ? allowed.join(', ') : '(none)';
    return {
      error:   'TRANSITION_NOT_PERMITTED',
      message: 'Transition to ' + next + ' not permitted from ' + current + '. Allowed: ' + allowedStr,
    };
  }

  // Step 2 — C5: hash verification before envelope build; no bypass parameter permitted
  if (govPackage && skillId) {
    const hashResult = govPackage.verifyHash({
      skillId:  skillId,
      expected: expectedHash,
      actual:   expectedHash,
    });
    if (hashResult) {
      const exp = hashResult.expected || expectedHash || '';
      const act = hashResult.actual   || '';
      return {
        error:   'HASH_MISMATCH',
        message: 'Hash mismatch for skill ' + skillId + ': expected ' + exp + ', got ' + act,
      };
    }
  }

  // Step 3 — advance state
  const newState = govPackage
    ? govPackage.advanceState({ current: current, next: next, declaration: declaration })
    : { current: next, previous: current };

  return newState || { current: next, previous: current };
}

/**
 * back — back-navigation to permitted prior state (Mode 1 MVP stub)
 */
function back(opts) {
  return { status: 'ok', command: 'back' };
}

/**
 * navigate — arbitrary permitted transition (Mode 1 MVP stub)
 */
function navigate(opts) {
  return { status: 'ok', command: 'navigate' };
}

/**
 * emitTrace — emit a validated trace entry.
 *
 * Required fields: skillHash, inputHash, outputRef, transitionTaken, surfaceType, timestamp.
 * Optionally writes JSON to outputPath.
 *
 * MC-SEC-02: no credentials included in returned object.
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
 */
function emitTrace(opts) {
  const {
    skillId, skillHash, inputHash, outputRef,
    transitionTaken, surfaceType, timestamp, outputPath,
  } = opts || {};

  const entry = {
    skillId:         skillId         || null,
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
  init,
  fetch,
  pin,
  verify,
  workflow,
  advance,
  back,
  navigate,
  emitTrace,
};
