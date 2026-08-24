// check-psms-s1-pipeline-state-merge-safety.js — unit/integration tests for
// psms-s1's SKILL.md instruction change: implementation-plan, subagent-
// execution, branch-complete, and verify-completion gain an explicit
// instruction that a checkpoint write's "this story's fields" must be read
// from the current LOCAL worktree file on disk, not reconstructed from only
// the current step's own new outputs -- closing the residual ambiguity the
// 2026-08-23 subagent-execution fetch-scoping fix left in place, which is
// the actual mechanism behind the wsi-s2/vrne-s1 tasks[] data-loss bug.
//
// artefacts/2026-08-24-pipeline-state-merge-safety/stories/psms-s1-explicit-local-first-merge.md
// artefacts/2026-08-24-pipeline-state-merge-safety/test-plans/psms-s1-test-plan.md
//
// This is a SKILL.md instruction-text change, not runtime application code --
// these are conversational instructions consumed by a model, not executable
// functions. Tests therefore assert on the actual instruction text present in
// the real files, following the established pattern in
// tests/check-csd-s4-data-model-diagram-instruction.js,
// tests/check-dta-s1-domain-tag-activation.js, and
// tests/check-evcg-s1-verify-completion-e2e-check.js.
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
      console.log('[psms-s1] PASS: ' + name);
      passed++;
    } else {
      console.error('[psms-s1] FAIL: ' + name);
      failed++;
    }
  } catch (e) {
    console.error('[psms-s1] FAIL: ' + name + ' (threw: ' + e.message + ')');
    failed++;
  }
}

const implementationPlanPath = path.join(__dirname, '../skills/implementation-plan/SKILL.md');
const subagentExecutionPath  = path.join(__dirname, '../skills/subagent-execution/SKILL.md');
const branchCompletePath     = path.join(__dirname, '../skills/branch-complete/SKILL.md');
const verifyCompletionPath   = path.join(__dirname, '../skills/verify-completion/SKILL.md');
const contractsPath          = path.join(__dirname, '../.github/scripts/check-skill-contracts.js');

const implementationPlanMd = fs.readFileSync(implementationPlanPath, 'utf8');
const subagentExecutionMd  = fs.readFileSync(subagentExecutionPath, 'utf8');
const branchCompleteMd     = fs.readFileSync(branchCompletePath, 'utf8');
const verifyCompletionMd   = fs.readFileSync(verifyCompletionPath, 'utf8');
const contractsSrc         = fs.readFileSync(contractsPath, 'utf8');

// This repo's SKILL.md files use CRLF and hard-wrap prose, so a phrase can
// be split across a line break -- normalise runs of whitespace to a single
// space before phrase-matching, matching the established pattern.
function norm(text) {
  return text.replace(/\s+/g, ' ');
}
const implNorm    = norm(implementationPlanMd);
const subagentNorm = norm(subagentExecutionMd);
const branchNorm  = norm(branchCompleteMd);
const verifyNorm  = norm(verifyCompletionMd);

const LOCAL_FIRST_PHRASE = "read this story's own current entry from the local worktree file on disk";

// ---------------------------------------------------------------------------
// Test 1 — AC1: subagentExecutionStep4ExplicitLocalFirstMerge
// ---------------------------------------------------------------------------
runTest('subagentExecutionStep4ExplicitLocalFirstMerge (AC1)', function() {
  const oldAmbiguousStepGone = subagentExecutionMd.indexOf('4. Apply only this story\'s fields to the fetched state') === -1;
  const hasNewInstruction = subagentNorm.indexOf(LOCAL_FIRST_PHRASE) !== -1;
  const codeHasReadFileSyncForLocal = /const localNow = JSON\.parse\(require\('fs'\)\.readFileSync\('\.github\/pipeline-state\.json', 'utf8'\)\);/.test(subagentExecutionMd);
  const codeCommentsMergeDirection = subagentNorm.indexOf('merge localStoryEntry\'s fields onto s\'s corresponding story entry') !== -1;
  return oldAmbiguousStepGone && hasNewInstruction && codeHasReadFileSyncForLocal && codeCommentsMergeDirection;
});

// ---------------------------------------------------------------------------
// Test 2 — AC2: implementationPlanGetsLocalFirstMergeAndCorrectedFraming
// ---------------------------------------------------------------------------
runTest('implementationPlanGetsLocalFirstMergeAndCorrectedFraming (AC2)', function() {
  const hasNewInstruction = implNorm.indexOf(LOCAL_FIRST_PHRASE) !== -1;
  const explainsWhyAlwaysFetchIsCorrectHere = /writes exactly once, at the very start of the inner coding loop/.test(implNorm);
  const crossReferencesSubagentExecution = /subagent-execution\/SKILL\.md.{0,80}Pipeline-state write safety/.test(implNorm) ||
    /Pipeline-state write safety.{0,80}subagent-execution\/SKILL\.md/.test(implNorm);
  return hasNewInstruction && explainsWhyAlwaysFetchIsCorrectHere && crossReferencesSubagentExecution;
});

// ---------------------------------------------------------------------------
// Test 3 — AC2: branchCompleteGetsLocalFirstMergeAndCorrectedFraming
// ---------------------------------------------------------------------------
runTest('branchCompleteGetsLocalFirstMergeAndCorrectedFraming (AC2)', function() {
  const hasNewInstruction = branchNorm.indexOf(LOCAL_FIRST_PHRASE) !== -1;
  const referencesEarlierAccumulation = /subagent-execution.{0,40}own per-task local writes have already accumulated this story's `tasks\[\]` array/.test(branchNorm);
  const criticalNotOptional = /reading the local file first before merging is critical here, not optional/.test(branchNorm);
  return hasNewInstruction && referencesEarlierAccumulation && criticalNotOptional;
});

// ---------------------------------------------------------------------------
// Test 4 — AC3: verifyCompletionGainsExplicitFetchSafetyStatement
// ---------------------------------------------------------------------------
runTest('verifyCompletionGainsExplicitFetchSafetyStatement (AC3)', function() {
  const hasHeading = /Pipeline-state write safety \(psms-s1\)/.test(verifyCompletionMd);
  const instructsLocalOnlyWrite = /Write to the \*\*local worktree file directly\*\*/.test(verifyNorm);
  const explainsNoConcurrentRisk = /no concurrent-worktree-collision risk yet/.test(verifyNorm);
  const noFetchInstruction = /no `git fetch`/.test(verifyNorm) || /no git fetch/.test(verifyNorm);
  return hasHeading && instructsLocalOnlyWrite && explainsNoConcurrentRisk && noFetchInstruction;
});

// ---------------------------------------------------------------------------
// Test 5 — AC4: skillContractsGuardAllFourSections
// ---------------------------------------------------------------------------
runTest('skillContractsGuardAllFourSections (AC4)', function() {
  function blockFor(skillName) {
    const re = new RegExp("skill:\\s*'" + skillName + "'[\\s\\S]*?\\],\\s*\\},");
    const m = contractsSrc.match(re);
    return m ? m[0] : null;
  }
  const implBlock = blockFor('implementation-plan');
  const subagentBlock = blockFor('subagent-execution');
  const verifyBlock = blockFor('verify-completion');
  const branchBlock = blockFor('branch-complete');
  if (!implBlock || !subagentBlock || !verifyBlock || !branchBlock) { return false; }
  const implGuards = implBlock.indexOf('local worktree file on disk') !== -1;
  const subagentGuards = subagentBlock.indexOf('local worktree file on disk') !== -1;
  const verifyGuards = verifyBlock.indexOf('psms-s1') !== -1;
  const branchGuards = branchBlock.indexOf('local worktree file on disk') !== -1;
  return implGuards && subagentGuards && verifyGuards && branchGuards;
});

// ---------------------------------------------------------------------------
// Test 6 — AC4: skillContractsScriptActuallyPasses (integration)
// Runs the real governance script (not just inspects its source) to confirm
// the new required strings genuinely match the live SKILL.md content.
// ---------------------------------------------------------------------------
runTest('skillContractsScriptActuallyPasses (AC4, integration)', function() {
  try {
    const output = execSync('node "' + contractsPath + '"', { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
    return /skill-contracts\].*OK/.test(output);
  } catch (e) {
    console.error('  check-skill-contracts.js failed: ' + (e.stdout || e.message));
    return false;
  }
});

// ---------------------------------------------------------------------------
// Test 7 — AC5: allFourFilesDescribeConsistentMergeDirection
// ---------------------------------------------------------------------------
runTest('allFourFilesDescribeConsistentMergeDirection (AC5)', function() {
  const implSaysNeverReverse = implNorm.indexOf(LOCAL_FIRST_PHRASE) !== -1 &&
    /not the fetched master copy's version of this story/.test(implNorm);
  // subagent-execution's "never the reverse" note is a 2-line JS comment
  // (each line has its own `//` prefix) inside the fenced code block, so
  // norm() leaves a `// ` marker mid-phrase at the line-wrap point -- allow
  // an optional `// ` between "from the" and "fetched master".
  const subagentSaysNeverReverse = /never the reverse: s's own version of this story's entry, from the (?:\/\/ )?fetched master, must never replace what has already accumulated locally/.test(subagentNorm);
  const branchSaysNeverReverse = /not the fetched master copy's version of this story/.test(branchNorm);
  const verifySaysLocalIsSourceOfTruth = /accumulated this story's `tasks\[\]` array/.test(verifyNorm);
  return implSaysNeverReverse && subagentSaysNeverReverse && branchSaysNeverReverse && verifySaysLocalIsSourceOfTruth;
});

// ---------------------------------------------------------------------------
// Test 8 — Non-regression: subagentExecutionScopingRuleUntouched
// The existing, already-correct 2026-08-23 fetch-scoping clarification must
// still be present word-for-word -- this story only adds to it.
// ---------------------------------------------------------------------------
runTest('subagentExecutionScopingRuleUntouched (non-regression)', function() {
  const scopingRuleIntact = subagentExecutionMd.indexOf(
    '**Scope this correctly (2026-08-23 clarification, added after this exact ambiguity caused a real data-loss bug on `vrne-s1`):**'
  ) !== -1;
  const doesNotApplyToStep2dIntact = subagentExecutionMd.indexOf(
    "It does **not** apply to Step 2d's per-task local-only writes"
  ) !== -1;
  return scopingRuleIntact && doesNotApplyToStep2dIntact;
});

// ---------------------------------------------------------------------------
// Test 9 — Non-regression: existing sections untouched
// ---------------------------------------------------------------------------
runTest('non-regression: existing sections untouched', function() {
  const implStateUpdateIntact = implementationPlanMd.indexOf('## State update — mandatory final step') !== -1;
  const subagentIronLawIntact = subagentExecutionMd.indexOf('Fresh subagent per task') !== -1;
  const branchDraftRuleIntact = branchCompleteMd.indexOf('always draft - merge is a human action') !== -1;
  const verifyIronLawIntact = verifyCompletionMd.indexOf('NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE') !== -1;
  return implStateUpdateIntact && subagentIronLawIntact && branchDraftRuleIntact && verifyIronLawIntact;
});

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('\n[psms-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) { process.exit(1); }
