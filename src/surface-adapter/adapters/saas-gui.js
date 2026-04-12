#!/usr/bin/env node
/**
 * surface-adapter/adapters/saas-gui.js
 *
 * SaaS-GUI surface adapter.
 *
 * Implements the execute(surface, context) → result interface from p1.2.
 * Assesses the SaaS-GUI delivery surface by inspecting the gui configuration
 * block in the provided context. Returns a conforming result with status,
 * surface, findings (GUI-specific vocabulary), trace (object with adapterName,
 * adapterVersion, policySource, runId), and adapterVersion.
 *
 * Findings vocabulary uses GUI-specific rule keys sourced from
 * standards/saas-gui/POLICY.md — not generic software-engineering terms or
 * IaC-specific terms.
 *
 * Security: this adapter does not read, log, persist, or transmit credential
 * values. No external network calls are made from inside execute() (MC-SEC-03).
 *
 * Reference: artefacts/2026-04-11-skills-platform-phase2/stories/p2.5b-saas-gui-m365-manual-adapters.md
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const ADAPTER_VERSION = '1.0.0';

// SaaS-GUI-specific rule keys sourced from standards/saas-gui/POLICY.md
const RULES = {
  CHANGE_REVIEW:       'gui-change-review',
  SCREENSHOT_EVIDENCE: 'gui-screenshot-evidence',
  ACCESS_CONTROL:      'gui-access-control',
};

/**
 * Execute the SaaS-GUI surface adapter against the provided context.
 *
 * @param {object} context - Execution context (content of context.yml or equivalent)
 * @returns {{ status: string, surface: string, findings: object[], trace: object, adapterVersion: string }}
 */
const _repoRoot = path.join(__dirname, '..', '..', '..');

function execute(context) {
  const policyPath = module.exports._policyPath;
  const runId = `saas-gui-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const trace = {
    adapterName:    'saas-gui',
    adapterVersion: ADAPTER_VERSION,
    policySource:   path.relative(_repoRoot, policyPath).replace(/\\/g, '/'),
    runId,
  };

  if (!fs.existsSync(policyPath)) {
    return {
      status:         'error',
      surface:        'saas-gui',
      findings:       [],
      trace,
      adapterVersion: ADAPTER_VERSION,
      error:          `SaaS-GUI POLICY.md not found at: ${policyPath}`,
    };
  }

  if (!context || typeof context !== 'object') {
    return {
      status:         'error',
      surface:        'saas-gui',
      findings:       [{ rule: RULES.CHANGE_REVIEW, message: 'context must be a non-null object' }],
      trace,
      adapterVersion: ADAPTER_VERSION,
    };
  }

  const findings = [];
  const gui = context.gui;

  if (!gui || typeof gui !== 'object') {
    findings.push({ rule: RULES.CHANGE_REVIEW,       message: 'gui.change_review is not configured — change-review approval required before GUI changes are deployed' });
    findings.push({ rule: RULES.SCREENSHOT_EVIDENCE, message: 'gui.screenshot_evidence is not configured — screenshot evidence required to document GUI changes' });
    findings.push({ rule: RULES.ACCESS_CONTROL,      message: 'gui.access_control is not configured — access control review required for GUI-facing features' });
  } else {
    if (!gui.change_review) {
      findings.push({ rule: RULES.CHANGE_REVIEW,       message: 'gui.change_review is not configured — change-review approval required before GUI changes are deployed' });
    }
    if (!gui.screenshot_evidence) {
      findings.push({ rule: RULES.SCREENSHOT_EVIDENCE, message: 'gui.screenshot_evidence is not configured — screenshot evidence required to document GUI changes' });
    }
    if (!gui.access_control) {
      findings.push({ rule: RULES.ACCESS_CONTROL,      message: 'gui.access_control is not configured — access control review required for GUI-facing features' });
    }
  }

  const status = findings.length === 0 ? 'pass' : 'fail';

  return {
    status,
    surface:        'saas-gui',
    findings,
    trace,
    adapterVersion: ADAPTER_VERSION,
  };
}

module.exports = {
  execute,
  adapterVersion: ADAPTER_VERSION,
  // Exported for testing — allows path override in tests
  _policyPath: path.join(__dirname, '..', '..', '..', 'standards', 'saas-gui', 'POLICY.md'),
};
