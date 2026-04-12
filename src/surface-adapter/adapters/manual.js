#!/usr/bin/env node
/**
 * surface-adapter/adapters/manual.js
 *
 * Manual surface adapter.
 *
 * Implements the execute(surface, context) → result interface from p1.2.
 * Assesses the manual delivery surface by evaluating checklist items declared
 * in the context. Returns a conforming result with status, surface,
 * findings (checklist item objects), trace (object with adapterName,
 * adapterVersion, policySource, runId), adapterVersion, and resultPattern.
 *
 * Key distinction from other adapters:
 * - resultPattern is always "checklist" (ADR-003 / MC-CORRECT-02)
 * - Findings represent checklist item completions — each finding has an
 *   `item` (string) and `status` ("complete" | "incomplete") field.
 * - Findings do NOT contain diff-analysis or code-review fields (no `file`,
 *   `line`, `rule` in a static-analysis sense, or `severity`).
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
const RESULT_PATTERN  = 'checklist';

/**
 * Execute the manual surface adapter against the provided context.
 *
 * @param {object} context - Execution context; may contain context.manual.checklist array
 * @returns {{ status: string, surface: string, findings: object[], trace: object, adapterVersion: string, resultPattern: string }}
 */
const _repoRoot = path.join(__dirname, '..', '..', '..');

function execute(context) {
  const policyPath = module.exports._policyPath;
  const runId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const trace = {
    adapterName:    'manual',
    adapterVersion: ADAPTER_VERSION,
    policySource:   path.relative(_repoRoot, policyPath).replace(/\\/g, '/'),
    runId,
  };

  if (!fs.existsSync(policyPath)) {
    return {
      status:         'error',
      surface:        'manual',
      findings:       [],
      trace,
      adapterVersion: ADAPTER_VERSION,
      resultPattern:  RESULT_PATTERN,
      error:          `Manual POLICY.md not found at: ${policyPath}`,
    };
  }

  if (!context || typeof context !== 'object') {
    return {
      status:         'error',
      surface:        'manual',
      findings:       [],
      trace,
      adapterVersion: ADAPTER_VERSION,
      resultPattern:  RESULT_PATTERN,
    };
  }

  // Read checklist items from context.manual.checklist
  const manual = context.manual;
  const checklist = (manual && Array.isArray(manual.checklist)) ? manual.checklist : [];

  // Map checklist entries to findings with item + status structure
  const findings = checklist.map(entry => {
    if (entry && typeof entry === 'object') {
      return {
        item:   typeof entry.item === 'string' ? entry.item : String(entry.item || ''),
        status: entry.status === 'complete' ? 'complete' : 'incomplete',
      };
    }
    return { item: String(entry), status: 'incomplete' };
  });

  // Status is fail if any checklist item is incomplete, pass if all complete (or empty)
  const hasIncomplete = findings.some(f => f.status === 'incomplete');
  const status = hasIncomplete ? 'fail' : 'pass';

  return {
    status,
    surface:        'manual',
    findings,
    trace,
    adapterVersion: ADAPTER_VERSION,
    resultPattern:  RESULT_PATTERN,
  };
}

module.exports = {
  execute,
  adapterVersion: ADAPTER_VERSION,
  resultPattern:  RESULT_PATTERN,
  // Exported for testing — allows path override in tests
  _policyPath: path.join(__dirname, '..', '..', '..', 'standards', 'manual', 'POLICY.md'),
};
