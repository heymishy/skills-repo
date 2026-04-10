#!/usr/bin/env node
/**
 * suite-parser/index.js
 *
 * Core library for workspace/suite.json validation, parsing, and gate evaluation.
 *
 * Implements p1.6 deliverables:
 *   (2) Schema validator  — validates required fields present and non-null,
 *                           taskId unique within suite, reviewNote non-null
 *   (3) Suite parser      — classifies active vs retired scenarios;
 *                           missing retiredReason is a silent-removal policy violation
 *   (4) Gate evaluator    — evaluates expectedOutcome string presence in gate run output;
 *                           records pass or fail per scenario; does NOT evaluate procedure
 *
 * Zero external dependencies — plain Node.js only.
 */
'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS = [
  'taskId',
  'description',
  'skillSurfaceCombination',
  'expectedOutcome',
  'failurePatternGuarded',
];

// ── Schema validator ──────────────────────────────────────────────────────────

/**
 * Validates a single scenario object against the required schema fields.
 * Also checks that reviewNote is non-null and non-empty (audit check).
 *
 * @param {object} scenario - scenario object to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateScenario(scenario) {
  const errors = [];

  if (!scenario || typeof scenario !== 'object') {
    return { valid: false, errors: ['scenario must be a non-null object'] };
  }

  for (const field of REQUIRED_FIELDS) {
    const value = scenario[field];
    if (value === undefined || value === null || value === '') {
      errors.push(`required field "${field}" is missing, null, or empty`);
    } else if (typeof value !== 'string') {
      errors.push(`required field "${field}" must be a string`);
    } else if (value.trim() === '') {
      errors.push(`required field "${field}" must not be blank`);
    }
  }

  // reviewNote audit check (AC3b / Audit NFR)
  if (scenario.reviewNote === undefined || scenario.reviewNote === null || scenario.reviewNote === '') {
    errors.push('reviewNote is null or absent — audit gap');
  } else if (typeof scenario.reviewNote !== 'string' || scenario.reviewNote.trim() === '') {
    errors.push('reviewNote must be a non-empty string — audit gap');
  }

  return errors.length === 0 ? { valid: true, errors: [] } : { valid: false, errors };
}

/**
 * Validates the full suite object (all scenarios + duplicate taskId check).
 *
 * @param {object} suite - parsed suite.json object
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateSuite(suite) {
  const errors = [];

  if (!suite || typeof suite !== 'object') {
    return { valid: false, errors: ['suite must be a non-null object'] };
  }

  const scenarios = Array.isArray(suite.scenarios) ? suite.scenarios : [];

  if (scenarios.length === 0) {
    errors.push('suite must contain at least one scenario');
  }

  const seenIds = new Set();
  for (const scenario of scenarios) {
    const result = validateScenario(scenario);
    if (!result.valid) {
      const id = (scenario && scenario.taskId) ? scenario.taskId : '(unknown)';
      for (const e of result.errors) {
        errors.push(`scenario "${id}": ${e}`);
      }
    }

    if (scenario && scenario.taskId) {
      if (seenIds.has(scenario.taskId)) {
        errors.push(`duplicate taskId: "${scenario.taskId}"`);
      } else {
        seenIds.add(scenario.taskId);
      }
    }
  }

  return errors.length === 0 ? { valid: true, errors: [] } : { valid: false, errors };
}

// ── Suite parser ──────────────────────────────────────────────────────────────

/**
 * Parses the suite and classifies each scenario as active or retired.
 *
 * A scenario is retired only when BOTH retiredAt and retiredReason are populated.
 * A scenario that has retiredAt set but is missing retiredReason is a silent-removal
 * policy violation (retirement without a recorded reason is not permitted).
 *
 * @param {object} suite - parsed suite.json object
 * @returns {{ active: object[], retired: object[], violations: Array<{scenario: object, message: string}> }}
 */
function parseSuite(suite) {
  const active     = [];
  const retired    = [];
  const violations = [];

  const scenarios = (suite && Array.isArray(suite.scenarios)) ? suite.scenarios : [];

  for (const scenario of scenarios) {
    const hasRetiredAt = scenario.retiredAt
      && typeof scenario.retiredAt === 'string'
      && scenario.retiredAt.trim() !== '';

    const hasRetiredReason = scenario.retiredReason
      && typeof scenario.retiredReason === 'string'
      && scenario.retiredReason.trim() !== '';

    if (hasRetiredAt && hasRetiredReason) {
      retired.push(scenario);
    } else if (hasRetiredAt && !hasRetiredReason) {
      // retiredAt present but retiredReason absent — silent-removal policy violation
      violations.push({
        scenario,
        message: `silent-removal policy violation: scenario "${scenario.taskId}" `
          + 'has retiredAt set but retiredReason is missing or empty',
      });
    } else {
      active.push(scenario);
    }
  }

  return { active, retired, violations };
}

// ── Gate evaluator ────────────────────────────────────────────────────────────

/**
 * Evaluates a single scenario against a gate run output string.
 * Checks whether the scenario's expectedOutcome string is present in gateOutput.
 * Does NOT evaluate which procedure produced the output.
 *
 * @param {object} scenario   - scenario object (must have taskId and expectedOutcome)
 * @param {string} gateOutput - string output from the gate run
 * @returns {{ taskId: string, result: 'pass' | 'fail', expectedOutcome: string }}
 */
function evaluateScenario(scenario, gateOutput) {
  const found = typeof gateOutput === 'string'
    && typeof scenario.expectedOutcome === 'string'
    && gateOutput.includes(scenario.expectedOutcome);

  return {
    taskId:          scenario.taskId,
    result:          found ? 'pass' : 'fail',
    expectedOutcome: scenario.expectedOutcome,
  };
}

/**
 * Evaluates all active scenarios in the suite against a gate run output string.
 * Retired scenarios and silent-removal violations are excluded from evaluation.
 *
 * @param {object} suite      - parsed suite.json object
 * @param {string} gateOutput - string output from the gate run
 * @returns {Array<{ taskId: string, result: 'pass' | 'fail', expectedOutcome: string }>}
 */
function evaluateSuite(suite, gateOutput) {
  const { active } = parseSuite(suite);
  return active.map(scenario => evaluateScenario(scenario, gateOutput));
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  REQUIRED_FIELDS,
  validateScenario,
  validateSuite,
  parseSuite,
  evaluateScenario,
  evaluateSuite,
};
