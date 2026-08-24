// check-evcg-s1-verify-completion-e2e-check.js — unit/integration tests for
// evcg-s1's SKILL.md instruction change: /verify-completion and
// /branch-complete gain a mandatory route/handler E2E coverage check, closing
// the blind spot where a clean local "full suite" result never covered
// tests/e2e/*.spec.js (a separate npm command).
//
// artefacts/2026-08-24-e2e-verification-coverage-gap/stories/evcg-s1-verify-completion-route-e2e-check.md
// artefacts/2026-08-24-e2e-verification-coverage-gap/test-plans/evcg-s1-test-plan.md
//
// This is a SKILL.md instruction change, not runtime application code --
// /verify-completion and /branch-complete are conversational skill
// instructions consumed by a model, not executable functions. Tests
// therefore assert on the actual instruction text, following the same
// pattern as tests/check-csd-s4-data-model-diagram-instruction.js and
// tests/check-dta-s1-domain-tag-activation.js.
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
      console.log('[evcg-s1] PASS: ' + name);
      passed++;
    } else {
      console.error('[evcg-s1] FAIL: ' + name);
      failed++;
    }
  } catch (e) {
    console.error('[evcg-s1] FAIL: ' + name + ' (threw: ' + e.message + ')');
    failed++;
  }
}

const verifyCompletionPath = path.join(__dirname, '../skills/verify-completion/SKILL.md');
const branchCompletePath   = path.join(__dirname, '../skills/branch-complete/SKILL.md');
const contractsPath        = path.join(__dirname, '../.github/scripts/check-skill-contracts.js');

const verifyCompletionMd = fs.readFileSync(verifyCompletionPath, 'utf8');
const branchCompleteMd   = fs.readFileSync(branchCompletePath, 'utf8');
const contractsSrc       = fs.readFileSync(contractsPath, 'utf8');

// This repo's SKILL.md files use CRLF and hard-wrap prose, so a phrase can
// be split across a line break -- normalise runs of whitespace to a single
// space before phrase-matching, matching the established pattern in
// check-csd-s4-data-model-diagram-instruction.js.
function norm(text) {
  return text.replace(/\s+/g, ' ');
}
const verifyNorm = norm(verifyCompletionMd);
const branchNorm = norm(branchCompleteMd);

// ---------------------------------------------------------------------------
// Test 1 — AC1: routeDiffTriggersGrepBothTestSuites
// ---------------------------------------------------------------------------
runTest('routeDiffTriggersGrepBothTestSuites (AC1)', function() {
  const hasHeading = /Route\/handler E2E coverage check/.test(verifyCompletionMd);
  const namesRouteDir = /src\/web-ui\/routes\//.test(verifyNorm);
  const grepsBothSuites = /Grep `tests\/\*\.js`/.test(verifyNorm) &&
    /Grep `tests\/e2e\/\*\.spec\.js`/.test(verifyNorm);
  const notJustNewTests = /not just this story's own new test files/.test(verifyNorm);
  return hasHeading && namesRouteDir && grepsBothSuites && notJustNewTests;
});

// ---------------------------------------------------------------------------
// Test 2 — AC2: mockedMatchRunsLocallyAndBlocksOnFailure
// ---------------------------------------------------------------------------
runTest('mockedMatchRunsLocallyAndBlocksOnFailure (AC2)', function() {
  const runsLocally = /npx playwright test tests\/e2e\/<file> --repeat-each=1/.test(verifyNorm);
  const noStagingOverride = /no `E2E_STAGING_BASE_URL` override/.test(verifyNorm);
  const blocksLikeUnitTest = /blocks completion exactly like a failing unit test/.test(verifyNorm);
  return runsLocally && noStagingOverride && blocksLikeUnitTest;
});

// ---------------------------------------------------------------------------
// Test 3 — AC3: realStagingMatchNamedAsResidualRiskNotRunLocally
// ---------------------------------------------------------------------------
runTest('realStagingMatchNamedAsResidualRiskNotRunLocally (AC3)', function() {
  const cannotVerifyByDesign = /cannot be verified pre-merge by design/.test(verifyNorm);
  const doNotRunLocally = /do not attempt to run it locally against real staging/.test(verifyNorm);
  const nameAsResidualRisk = /name it explicitly in Step 4's completion report as a residual risk/.test(verifyNorm);
  const neverOmitSilently = /never omit it silently/.test(verifyNorm);
  const step4HasResidualRiskLine = /E2E route coverage:/.test(verifyCompletionMd) &&
    /residual risk/.test(verifyNorm);
  return cannotVerifyByDesign && doNotRunLocally && nameAsResidualRisk &&
    neverOmitSilently && step4HasResidualRiskLine;
});

// ---------------------------------------------------------------------------
// Test 4 — AC4: branchCompleteReferencesVerifyCompletionCheckByReference
// ---------------------------------------------------------------------------
runTest('branchCompleteReferencesVerifyCompletionCheckByReference (AC4)', function() {
  const referencesCheck = /route\/handler E2E coverage check/i.test(branchNorm);
  const referencesVerifyCompletion = /`\/verify-completion`'s route\/handler E2E coverage check/.test(branchNorm);
  const doesNotDuplicateFullInstructions = branchCompleteMd.indexOf('Grep `tests/e2e/*.spec.js`') === -1;
  return referencesCheck && referencesVerifyCompletion && doesNotDuplicateFullInstructions;
});

// ---------------------------------------------------------------------------
// Test 5 — AC5: skillContractsGuardBothNewSections
// ---------------------------------------------------------------------------
runTest('skillContractsGuardBothNewSections (AC5)', function() {
  const verifyCompletionBlockMatch = contractsSrc.match(/skill:\s*'verify-completion'[\s\S]*?\],\s*\},/);
  const branchCompleteBlockMatch = contractsSrc.match(/skill:\s*'branch-complete'[\s\S]*?\],\s*\},/);
  if (!verifyCompletionBlockMatch || !branchCompleteBlockMatch) { return false; }
  const verifyBlock = verifyCompletionBlockMatch[0];
  const branchBlock = branchCompleteBlockMatch[0];
  const verifyGuardsHeading = verifyBlock.indexOf('Route/handler E2E coverage check') !== -1;
  const verifyGuardsResidualRisk = verifyBlock.indexOf('cannot be verified pre-merge by design') !== -1;
  const verifyGuardsScopeLimit = verifyBlock.indexOf('Do not run the full, unscoped `npm run test:e2e` suite') !== -1;
  const branchGuardsReference = branchBlock.indexOf('route/handler E2E coverage check') !== -1;
  return verifyGuardsHeading && verifyGuardsResidualRisk && verifyGuardsScopeLimit && branchGuardsReference;
});

// ---------------------------------------------------------------------------
// Test 6 — Integration: skillContractsScriptActuallyPasses
// Runs the real governance script (not just inspects its source) to confirm
// the new required strings genuinely match the live SKILL.md content --
// proves the contract entries aren't silently out of sync with the prose.
// ---------------------------------------------------------------------------
runTest('skillContractsScriptActuallyPasses (integration)', function() {
  try {
    const output = execSync('node "' + contractsPath + '"', { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
    return /skill-contracts\].*OK/.test(output);
  } catch (e) {
    console.error('  check-skill-contracts.js failed: ' + (e.stdout || e.message));
    return false;
  }
});

// ---------------------------------------------------------------------------
// Test 7 — NFR-performance: nonRouteTouchingDiffSkipsCheckExplicitly
// ---------------------------------------------------------------------------
runTest('nonRouteTouchingDiffSkipsCheckExplicitly (NFR-performance)', function() {
  const explicitNA = /Route\/handler E2E coverage check: N\/A/.test(verifyNorm);
  const doNotRunUnconditionally = /do not run this check unconditionally/.test(verifyNorm);
  return explicitNA && doNotRunUnconditionally;
});

// ---------------------------------------------------------------------------
// Test 8 — Out of scope guard: doesNotMandateFullUnscopedE2ESuite
// ---------------------------------------------------------------------------
runTest('doesNotMandateFullUnscopedE2ESuite (out of scope guard)', function() {
  const explicitlyRejectsFullSuite = /Do not run the full, unscoped `npm run test:e2e` suite/.test(verifyNorm);
  const explainsWhy = /opt-in.*`audit\.e2e_tests`.*flag.*continue-on-error: true|continue-on-error: true/.test(verifyNorm);
  return explicitlyRejectsFullSuite && explainsWhy;
});

// ---------------------------------------------------------------------------
// Non-regression: pre-existing sections in both SKILL.md files untouched.
// evcg-s1 only inserts new sections, it does not rewrite existing ones.
// ---------------------------------------------------------------------------
runTest('non-regression: existing sections untouched', function() {
  const verifyStep1Intact = verifyCompletionMd.indexOf('## Step 1 — Run the full test suite') !== -1;
  const verifyStep2Intact = verifyCompletionMd.indexOf('## Step 2 — Walk through the AC verification script') !== -1;
  const verifyIronLawIntact = verifyCompletionMd.indexOf('NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE') !== -1;
  const branchStep1Intact = branchCompleteMd.indexOf('## Step 1 - Final test verification') !== -1;
  const branchStep3Intact = branchCompleteMd.indexOf('## Step 3 - Present options') !== -1;
  return verifyStep1Intact && verifyStep2Intact && verifyIronLawIntact &&
    branchStep1Intact && branchStep3Intact;
});

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('\n[evcg-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) { process.exit(1); }
