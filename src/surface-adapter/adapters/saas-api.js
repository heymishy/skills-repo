#!/usr/bin/env node
/**
 * surface-adapter/adapters/saas-api.js
 *
 * SaaS-API surface adapter.
 *
 * Implements the execute(surface, context) → result interface from p1.2.
 * Assesses the SaaS-API delivery surface by inspecting the api configuration
 * block in the provided context. Returns a conforming result with status,
 * surface, findings (API-specific vocabulary), trace (object with adapterName,
 * adapterVersion, policySource, runId), and adapterVersion.
 *
 * Findings vocabulary uses API-specific rule keys sourced from
 * standards/saas-api/POLICY.md — not generic software-engineering terms or
 * IaC-specific terms.
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

// SaaS-API-specific rule keys sourced from standards/saas-api/POLICY.md
const RULES = {
  API_VERSIONING:       'api-versioning',
  API_AUTH_REQUIRED:    'api-auth-required',
  API_BREAKING_CHANGE:  'api-breaking-change',
  API_CONTRACT_TEST:    'api-contract-test',
};

/**
 * Execute the SaaS-API surface adapter against the provided context.
 *
 * @param {object} context - Execution context (content of context.yml or equivalent)
 * @returns {{ status: string, surface: string, findings: object[], trace: object, adapterVersion: string }}
 */
const _repoRoot = path.join(__dirname, '..', '..', '..');

function execute(context) {
  const policyPath = module.exports._policyPath;
  const runId = `saas-api-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const trace = {
    adapterName:    'saas-api',
    adapterVersion: ADAPTER_VERSION,
    policySource:   path.relative(_repoRoot, policyPath).replace(/\\/g, '/'),
    runId,
  };

  if (!fs.existsSync(policyPath)) {
    return {
      status:         'error',
      surface:        'saas-api',
      findings:       [],
      trace,
      adapterVersion: ADAPTER_VERSION,
      error:          `SaaS-API POLICY.md not found at: ${policyPath}`,
    };
  }

  if (!context || typeof context !== 'object') {
    return {
      status:         'error',
      surface:        'saas-api',
      findings:       [{ rule: RULES.API_VERSIONING, message: 'context must be a non-null object' }],
      trace,
      adapterVersion: ADAPTER_VERSION,
    };
  }

  const findings = [];
  const api = context.api;

  if (!api || typeof api !== 'object') {
    findings.push({ rule: RULES.API_VERSIONING,      message: 'api.version is not declared — API version pinning required' });
    findings.push({ rule: RULES.API_AUTH_REQUIRED,   message: 'api.auth is not configured — authentication scheme required for all endpoints' });
    findings.push({ rule: RULES.API_BREAKING_CHANGE, message: 'api.breaking_change_detection is not configured — breaking-change detection required' });
  } else {
    if (!api.version) {
      findings.push({ rule: RULES.API_VERSIONING,    message: 'api.version is not declared — API version pinning required' });
    }
    if (!api.auth) {
      findings.push({ rule: RULES.API_AUTH_REQUIRED, message: 'api.auth is not configured — authentication scheme required for all endpoints' });
    }
    if (!api.breaking_change_detection) {
      findings.push({ rule: RULES.API_BREAKING_CHANGE, message: 'api.breaking_change_detection is not configured — breaking-change detection required' });
    }
    if (!api.contract_tests) {
      findings.push({ rule: RULES.API_CONTRACT_TEST, message: 'api.contract_tests is not configured — contract test reference required' });
    }
  }

  const status = findings.length === 0 ? 'pass' : 'fail';

  return {
    status,
    surface:        'saas-api',
    findings,
    trace,
    adapterVersion: ADAPTER_VERSION,
  };
}

module.exports = {
  execute,
  adapterVersion: ADAPTER_VERSION,
  // Exported for testing — allows path override in tests (see p2.5a test plan AC2 error path)
  _policyPath: path.join(__dirname, '..', '..', '..', 'standards', 'saas-api', 'POLICY.md'),
};
