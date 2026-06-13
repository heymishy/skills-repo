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

  // Strip markdown code fences before checking — model may wrap output in ```markdown ... ```
  const strippedOutput = outputText.replace(/^```[\w]*\n/gm, '').replace(/^```$/gm, '');

  // Gate 1: Artefact path
  // Feature dirs and story slugs may include dots (e.g. retry.1, credit.fairness-eval-1).
  const pathMatch = strippedOutput.match(
    /artefacts\/[\w.-]+\/plans\/[\w.-]+-plan\.md/
  );
  const validPath = pathMatch ? validateArtefactPath(pathMatch[0]) : false;
  checks.push({
    name: 'implementation-plan-artefact-path',
    passed: validPath,
    reason: validPath ? undefined :
      'No artefacts/[feature]/plans/[story-slug]-plan.md path found in output',
  });

  // Gate 2: TDD RED step
  // At least one task must have a failing test step before the implementation step.
  // Broadened to catch common model phrasings: "expect N failures", "run to confirm",
  // "T1 must fail", "test first", explicit RED label, npm test failure expectation.
  const hasRedStep = /\bRED\b|failing test|watch.*fail|run.*fail|confirm.*fail|write.*test.*before|test.*first|npm test.*fail|\bT\d+.*must fail\b|run to confirm|expected.*fail/i
    .test(strippedOutput);
  checks.push({
    name: 'implementation-plan-tdd-red-step',
    passed: hasRedStep,
    reason: hasRedStep ? undefined :
      'No TDD RED step found — implementation tasks must write failing test before code',
  });

  return checks;
}

module.exports = { checkImplementationPlanGates };
