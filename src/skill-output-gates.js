'use strict';

const { validateArtefactPath } = require('./artefact-path-validator');

/**
 * Structural output gates for the /implementation-plan skill.
 * Pure functions — no filesystem I/O, no external dependencies.
 *
 * @param {string} outputText - raw model output to validate
 * @returns {{ name: string, passed: boolean, reason?: string }[]}
 */
function checkImplementationPlanGates(outputText) {
  const checks = [];

  // Gate 1: Artefact path
  // Plan output must reference a path matching artefacts/[feature]/plans/[story-slug]-plan.md
  // Story slugs may include dots (e.g. credit.fairness-eval-1), so [\w.-]+ for the plan filename.
  const pathMatch = outputText.match(
    /artefacts\/[\w-]+\/plans\/[\w.-]+-plan\.md/
  );
  const validPath = pathMatch ? validateArtefactPath(pathMatch[0]) : false;
  checks.push({
    name: 'implementation-plan-artefact-path',
    passed: validPath,
    reason: validPath ? undefined :
      'No artefacts/[feature]/plans/[story-slug]-plan.md path found in output',
  });

  // Gate 2: TDD RED step
  // At least one task must have a failing test step before the implementation step
  const hasRedStep = /\bRED\b|run.*confirm.*fail|watch.*fail|failing test/i
    .test(outputText);
  checks.push({
    name: 'implementation-plan-tdd-red-step',
    passed: hasRedStep,
    reason: hasRedStep ? undefined :
      'No TDD RED step found — implementation tasks must write failing test before code',
  });

  return checks;
}

module.exports = { checkImplementationPlanGates };
