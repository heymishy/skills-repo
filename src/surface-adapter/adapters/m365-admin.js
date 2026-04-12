#!/usr/bin/env node
/**
 * surface-adapter/adapters/m365-admin.js
 *
 * M365-admin surface adapter.
 *
 * Implements the execute(surface, context) → result interface from p1.2.
 * Assesses the M365-admin delivery surface by inspecting the m365 configuration
 * block in the provided context. Returns a conforming result with status,
 * surface, findings (M365-admin-specific vocabulary), trace (object with
 * adapterName, adapterVersion, policySource, runId), and adapterVersion.
 *
 * Findings vocabulary uses M365-admin-specific rule keys sourced from
 * standards/m365-admin/POLICY.md — not generic software-engineering terms.
 *
 * Security: this adapter does not authenticate to any M365 tenant, does not
 * call the Microsoft Graph API, and does not read, log, persist, or transmit
 * credential values. No external network calls are made from inside execute()
 * (MC-SEC-03).
 *
 * Reference: artefacts/2026-04-11-skills-platform-phase2/stories/p2.5b-saas-gui-m365-manual-adapters.md
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const ADAPTER_VERSION = '1.0.0';

// M365-admin-specific rule keys sourced from standards/m365-admin/POLICY.md
const RULES = {
  AUDIT_LOG:      'm365-admin-audit-log',
  CHANGE_TICKET:  'm365-admin-change-ticket',
  ADMIN_APPROVAL: 'm365-admin-approval',
};

/**
 * Execute the M365-admin surface adapter against the provided context.
 *
 * @param {object} context - Execution context (content of context.yml or equivalent)
 * @returns {{ status: string, surface: string, findings: object[], trace: object, adapterVersion: string }}
 */
const _repoRoot = path.join(__dirname, '..', '..', '..');

function execute(context) {
  const policyPath = module.exports._policyPath;
  const runId = `m365-admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const trace = {
    adapterName:    'm365-admin',
    adapterVersion: ADAPTER_VERSION,
    policySource:   path.relative(_repoRoot, policyPath).replace(/\\/g, '/'),
    runId,
  };

  if (!fs.existsSync(policyPath)) {
    return {
      status:         'error',
      surface:        'm365-admin',
      findings:       [],
      trace,
      adapterVersion: ADAPTER_VERSION,
      error:          `M365-admin POLICY.md not found at: ${policyPath}`,
    };
  }

  if (!context || typeof context !== 'object') {
    return {
      status:         'error',
      surface:        'm365-admin',
      findings:       [{ rule: RULES.AUDIT_LOG, message: 'context must be a non-null object' }],
      trace,
      adapterVersion: ADAPTER_VERSION,
    };
  }

  const findings = [];
  const m365 = context.m365;

  if (!m365 || typeof m365 !== 'object') {
    findings.push({ rule: RULES.AUDIT_LOG,      message: 'm365.audit_log is not configured — admin audit log reference required for all M365 admin changes' });
    findings.push({ rule: RULES.CHANGE_TICKET,  message: 'm365.change_ticket is not configured — change ticket linkage required before applying M365 admin changes' });
    findings.push({ rule: RULES.ADMIN_APPROVAL, message: 'm365.admin_approval is not configured — admin approval required before M365 tenant configuration changes' });
  } else {
    if (!m365.audit_log) {
      findings.push({ rule: RULES.AUDIT_LOG,      message: 'm365.audit_log is not configured — admin audit log reference required for all M365 admin changes' });
    }
    if (!m365.change_ticket) {
      findings.push({ rule: RULES.CHANGE_TICKET,  message: 'm365.change_ticket is not configured — change ticket linkage required before applying M365 admin changes' });
    }
    if (!m365.admin_approval) {
      findings.push({ rule: RULES.ADMIN_APPROVAL, message: 'm365.admin_approval is not configured — admin approval required before M365 tenant configuration changes' });
    }
  }

  const status = findings.length === 0 ? 'pass' : 'fail';

  return {
    status,
    surface:        'm365-admin',
    findings,
    trace,
    adapterVersion: ADAPTER_VERSION,
  };
}

module.exports = {
  execute,
  adapterVersion: ADAPTER_VERSION,
  // Exported for testing — allows path override in tests
  _policyPath: path.join(__dirname, '..', '..', '..', 'standards', 'm365-admin', 'POLICY.md'),
};
