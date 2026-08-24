// check-s3fw-s1-final-review-background-warning.js — unit/integration tests
// for s3fw-s1's SKILL.md instruction change: subagent-execution's Step 3
// (final review) dispatch gains the same mandatory background-process
// warning that Steps 2a/2b/2c already carry -- closing the one dispatch
// site in this skill confirmed to recur the false-wait failure (rcfc-s1's
// own Step 3 dispatch hit it despite the warning being present verbatim at
// every other dispatch site in the same run) after the original 2026-08-14
// fix landed everywhere else.
//
// artefacts/2026-08-24-step3-final-review-false-wait/stories/s3fw-s1-add-missing-background-warning.md
// artefacts/2026-08-24-step3-final-review-false-wait/test-plans/s3fw-s1-test-plan.md
//
// This is a SKILL.md instruction-text change, not runtime application code --
// these are conversational instructions consumed by a model, not executable
// functions. Tests therefore assert on the actual instruction text present
// in the real file, following the established pattern in
// tests/check-csd-s4-data-model-diagram-instruction.js,
// tests/check-dta-s1-domain-tag-activation.js,
// tests/check-evcg-s1-verify-completion-e2e-check.js, and
// tests/check-psms-s1-pipeline-state-merge-safety.js.
'use strict';

const fs   = require('fs');
const { execSync } = require('child_process');
const path = require('path');

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    const ok = fn();
    if (ok) {
      console.log('[s3fw-s1] PASS: ' + name);
      passed++;
    } else {
      console.error('[s3fw-s1] FAIL: ' + name);
      failed++;
    }
  } catch (e) {
    console.error('[s3fw-s1] FAIL: ' + name + ' (threw: ' + e.message + ')');
    failed++;
  }
}

const subagentExecutionPath = path.join(__dirname, '../skills/subagent-execution/SKILL.md');
const contractsPath         = path.join(__dirname, '../.github/scripts/check-skill-contracts.js');

const subagentExecutionMd = fs.readFileSync(subagentExecutionPath, 'utf8');
const contractsSrc        = fs.readFileSync(contractsPath, 'utf8');

// This repo's SKILL.md files use CRLF and hard-wrap prose, so a phrase can
// be split across a line break -- normalise runs of whitespace to a single
// space before phrase-matching, matching the established pattern.
function norm(text) {
  return text.replace(/\s+/g, ' ');
}
const subagentNorm = norm(subagentExecutionMd);

// ---------------------------------------------------------------------------
// Test 1 — AC1: step3HasMandatoryBackgroundWarning
// ---------------------------------------------------------------------------
runTest('step3HasMandatoryBackgroundWarning (AC1)', function() {
  const step3Idx = subagentExecutionMd.indexOf('## Step 3 — Final review');
  const nextSectionIdx = subagentExecutionMd.indexOf('## Model selection');
  if (step3Idx === -1 || nextSectionIdx === -1 || nextSectionIdx <= step3Idx) { return false; }
  const step3Section = subagentExecutionMd.slice(step3Idx, nextSectionIdx);
  const step3SectionNorm = norm(step3Section);
  const hasMandatoryLine = /\*\*Mandatory, every dispatch:\*\* the same background-process warning as 2a\/2b\/2c/.test(step3SectionNorm);
  return hasMandatoryLine;
});

// ---------------------------------------------------------------------------
// Test 2 — AC2: warningNamesConcreteEvidence
// ---------------------------------------------------------------------------
runTest('warningNamesConcreteEvidence (AC2)', function() {
  const namesPsmsS1 = subagentNorm.indexOf('psms-s1') !== -1 &&
    subagentNorm.indexOf('this step was the one dispatch site in this skill missing the warning') !== -1;
  const namesRcfcS1Recurrence = /`?rcfc-s1`?'s own Step 3 dispatch hit the false-wait trap even with the warning present verbatim at every other dispatch site in the same run/.test(subagentNorm);
  const explainsWhyStillApplies = /A cross-cutting final-review subagent that runs a verification command.{0,80}has the identical no-notification failure mode as a per-task implementer or reviewer/.test(subagentNorm);
  return namesPsmsS1 && namesRcfcS1Recurrence && explainsWhyStillApplies;
});

// ---------------------------------------------------------------------------
// Test 3 — AC3: skillContractsGuardsStep3Warning
// ---------------------------------------------------------------------------
runTest('skillContractsGuardsStep3Warning (AC3)', function() {
  const re = /skill:\s*'subagent-execution'[\s\S]*?\],\s*\},/;
  const m = contractsSrc.match(re);
  if (!m) { return false; }
  const block = m[0];
  return block.indexOf('one dispatch site in this skill missing the warning') !== -1;
});

// ---------------------------------------------------------------------------
// Test 4 — AC3: skillContractsScriptActuallyPasses (integration)
// Runs the real governance script (not just inspects its source) to confirm
// the new required string genuinely matches the live SKILL.md content.
// ---------------------------------------------------------------------------
runTest('skillContractsScriptActuallyPasses (AC3, integration)', function() {
  try {
    const output = execSync('node "' + contractsPath + '"', { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
    return /skill-contracts\].*OK/.test(output);
  } catch (e) {
    console.error('  check-skill-contracts.js failed: ' + (e.stdout || e.message));
    return false;
  }
});

// ---------------------------------------------------------------------------
// Test 5 — AC4: steps2a2b2cAndStatusTableUnchanged (non-regression)
// ---------------------------------------------------------------------------
runTest('steps2a2b2cAndStatusTableUnchanged (AC4, non-regression)', function() {
  const step2aWarningIntact = subagentExecutionMd.indexOf(
    "**Mandatory, every dispatch:** \"You have no mechanism to be notified when a background/detached process you start completes"
  ) !== -1;
  const step2bWarningIntact = subagentExecutionMd.indexOf(
    '**Mandatory, every dispatch:** the same background-process warning as 2a — a reviewer subagent has no mechanism to be notified'
  ) !== -1;
  const step2cWarningIntact = subagentExecutionMd.indexOf(
    '**Mandatory, every dispatch:** the same background-process warning as 2a/2b.'
  ) !== -1;
  const statusTableIntact = subagentExecutionMd.indexOf('| `DONE`') !== -1 &&
    subagentExecutionMd.indexOf('| `DONE_WITH_CONCERNS`') !== -1 &&
    subagentExecutionMd.indexOf('| `NEEDS_CONTEXT`') !== -1 &&
    subagentExecutionMd.indexOf('| `BLOCKED`') !== -1;
  return step2aWarningIntact && step2bWarningIntact && step2cWarningIntact && statusTableIntact;
});

// ---------------------------------------------------------------------------
// Test 6 — Non-regression: existing sections untouched
// ---------------------------------------------------------------------------
runTest('non-regression: existing sections untouched', function() {
  const corePrincipleIntact = subagentExecutionMd.indexOf('## Core principle') !== -1;
  const step2dIntact = subagentExecutionMd.indexOf('### 2d — Mark task complete') !== -1;
  const pipelineStateWriteSafetyIntact = subagentExecutionMd.indexOf('## State update — mandatory final step') !== -1;
  const psmsS1FixIntact = subagentExecutionMd.indexOf('read this story\'s own current entry from the local worktree file on disk') !== -1;
  return corePrincipleIntact && step2dIntact && pipelineStateWriteSafetyIntact && psmsS1FixIntact;
});

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('\n[s3fw-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) { process.exit(1); }
