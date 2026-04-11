#!/usr/bin/env node
/**
 * surface-adapter/adapters/iac.js
 *
 * IaC (Infrastructure as Code) surface adapter.
 *
 * Implements the execute(surface, context) → result interface from p1.2.
 * Assesses the IaC delivery surface by inspecting the iac configuration block
 * in the provided context. Returns a conforming result with status, surface,
 * findings (IaC-specific vocabulary), trace (object with adapterName,
 * adapterVersion, policySource, runId), and adapterVersion.
 *
 * Findings vocabulary uses IaC-specific rule keys sourced from
 * standards/iac/POLICY.md — not generic software-engineering terms.
 *
 * Security: this adapter does not read, log, persist, or transmit credential
 * values. No external network calls are made from inside execute() (MC-SEC-03).
 *
 * Reference: artefacts/2026-04-11-skills-platform-phase2/stories/p2.5a-iac-saas-api-adapters.md
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const ADAPTER_VERSION = '1.0.0';

// IaC-specific rule keys sourced from standards/iac/POLICY.md
const RULES = {
  STATE_BACKEND:    'iac-state-backend',
  MODULE_VERSIONING: 'iac-module-versioning',
  CHANGESET_REVIEW: 'iac-changeset-review',
  DRIFT_DETECTION:  'iac-drift-detection',
};

/**
 * Execute the IaC surface adapter against the provided context.
 *
 * @param {object} context - Execution context (content of context.yml or equivalent)
 * @returns {{ status: string, surface: string, findings: object[], trace: object, adapterVersion: string }}
 */
const _repoRoot = path.join(__dirname, '..', '..', '..');

function execute(context) {
  const policyPath = module.exports._policyPath;
  const runId = `iac-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const trace = {
    adapterName:    'iac',
    adapterVersion: ADAPTER_VERSION,
    policySource:   path.relative(_repoRoot, policyPath).replace(/\\/g, '/'),
    runId,
  };

  if (!fs.existsSync(policyPath)) {
    return {
      status:         'error',
      surface:        'iac',
      findings:       [],
      trace,
      adapterVersion: ADAPTER_VERSION,
      error:          `IaC POLICY.md not found at: ${policyPath}`,
    };
  }

  if (!context || typeof context !== 'object') {
    return {
      status:         'error',
      surface:        'iac',
      findings:       [{ rule: RULES.STATE_BACKEND, message: 'context must be a non-null object' }],
      trace,
      adapterVersion: ADAPTER_VERSION,
    };
  }

  const findings = [];
  const iac = context.iac;

  if (!iac || typeof iac !== 'object') {
    findings.push({ rule: RULES.STATE_BACKEND,    message: 'iac.state_backend is not configured — remote state backend required' });
    findings.push({ rule: RULES.MODULE_VERSIONING, message: 'iac.module_version is not specified — version-pinned modules required' });
    findings.push({ rule: RULES.CHANGESET_REVIEW, message: 'iac.changeset_review is not configured — changeset must be reviewed before apply' });
  } else {
    if (!iac.state_backend) {
      findings.push({ rule: RULES.STATE_BACKEND,    message: 'iac.state_backend is not configured — remote state backend required' });
    }
    if (!iac.module_version) {
      findings.push({ rule: RULES.MODULE_VERSIONING, message: 'iac.module_version is not specified — version-pinned modules required' });
    }
    if (!iac.changeset_review) {
      findings.push({ rule: RULES.CHANGESET_REVIEW, message: 'iac.changeset_review is not configured — changeset must be reviewed before apply' });
    }
    if (!iac.drift_detection) {
      findings.push({ rule: RULES.DRIFT_DETECTION,  message: 'iac.drift_detection is not configured — periodic drift detection required' });
    }
  }

  const status = findings.length === 0 ? 'pass' : 'fail';

  return {
    status,
    surface:        'iac',
    findings,
    trace,
    adapterVersion: ADAPTER_VERSION,
  };
}

module.exports = {
  execute,
  adapterVersion: ADAPTER_VERSION,
  // Exported for testing — allows path override in tests (see p2.5a test plan AC1 error path)
  _policyPath: path.join(__dirname, '..', '..', '..', 'standards', 'iac', 'POLICY.md'),
};
