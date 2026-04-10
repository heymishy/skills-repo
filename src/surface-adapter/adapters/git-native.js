#!/usr/bin/env node
/**
 * surface-adapter/adapters/git-native.js
 *
 * Git-native surface adapter — reference implementation for the
 * execute(surface, context) → result interface (p1.2).
 *
 * A working (not stub) implementation: assesses the git-native delivery surface
 * by inspecting the source_control configuration in the provided context. Returns
 * a conforming result with status, surface (echoed), findings (array of any issues
 * found), trace (run identifier), and adapterVersion.
 *
 * Security: this adapter does not read, log, persist, or transmit credential values.
 * Authentication is handled via secrets store references in context.yml only
 * (product constraint #12).
 *
 * Reference: artefacts/2026-04-09-skills-platform-phase1/stories/p1.2-surface-adapter-model-foundations.md
 */
'use strict';

const ADAPTER_VERSION = '1.0.0';

const RECOGNISED_PLATFORMS = ['github', 'gitlab', 'bitbucket', 'azure-devops', 'other'];

/**
 * Execute the git-native surface adapter against the provided context.
 *
 * @param {object} context - Execution context (content of context.yml or equivalent)
 * @returns {{ status: string, surface: string, findings: string[], trace: string, adapterVersion: string }}
 */
function execute(context) {
  const trace = `trace-git-native-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const findings = [];

  if (!context || typeof context !== 'object') {
    return {
      status: 'error',
      surface: 'git-native',
      findings: ['context must be a non-null object'],
      trace,
      adapterVersion: ADAPTER_VERSION,
    };
  }

  const sc = context.source_control;

  if (!sc || typeof sc !== 'object') {
    findings.push('source_control block is missing from context');
  } else {
    if (!sc.platform) {
      findings.push('source_control.platform is not specified');
    } else if (!RECOGNISED_PLATFORMS.includes(sc.platform)) {
      findings.push(
        `source_control.platform "${sc.platform}" is not a recognised value ` +
        `(expected one of: ${RECOGNISED_PLATFORMS.join(', ')})`
      );
    }

    if (!sc.base_branch) {
      findings.push('source_control.base_branch is not specified');
    }
  }

  const status = findings.length === 0 ? 'pass' : 'fail';

  return {
    status,
    surface: 'git-native',
    findings,
    trace,
    adapterVersion: ADAPTER_VERSION,
  };
}

module.exports = { execute, adapterVersion: ADAPTER_VERSION };
