// check-dvlg-s1-verification-strength-and-ui-gate.js — unit/integration tests
// for dvlg-s1's SKILL.md instruction change: /verify-completion gains a
// mandatory live browser render check, and /definition-of-done gains
// per-AC verification-strength tagging plus the same three-option
// UI-evidence gate, closing the gap where a COMPLETE DoD verdict could rest
// on unit-test evidence alone for a claim about a real, external effect
// (a third-party system receiving data, a UI element being visible, a
// system surviving a real restart).
//
// artefacts/2026-09-13-dod-live-verification-gate/stories/dvlg-s1-dod-verification-strength-and-live-ui-gate.md
// artefacts/2026-09-13-dod-live-verification-gate/test-plans/dvlg-s1-test-plan.md
//
// This is a SKILL.md instruction change, not runtime application code --
// /verify-completion and /definition-of-done are conversational skill
// instructions consumed by a model, not executable functions. Tests
// therefore assert on the actual instruction text, following the same
// pattern as tests/check-evcg-s1-verify-completion-e2e-check.js.
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
      console.log('[dvlg-s1] PASS: ' + name);
      passed++;
    } else {
      console.error('[dvlg-s1] FAIL: ' + name);
      failed++;
    }
  } catch (e) {
    console.error('[dvlg-s1] FAIL: ' + name + ' (threw: ' + e.message + ')');
    failed++;
  }
}

const verifyCompletionPath = path.join(__dirname, '../skills/verify-completion/SKILL.md');
const definitionOfDonePath = path.join(__dirname, '../skills/definition-of-done/SKILL.md');
const contractsPath        = path.join(__dirname, '../.github/scripts/check-skill-contracts.js');

const verifyCompletionMd = fs.readFileSync(verifyCompletionPath, 'utf8');
const definitionOfDoneMd = fs.readFileSync(definitionOfDonePath, 'utf8');
const contractsSrc       = fs.readFileSync(contractsPath, 'utf8');

// This repo's SKILL.md files use CRLF and hard-wrap prose, so a phrase can
// be split across a line break -- normalise runs of whitespace to a single
// space before phrase-matching, matching the established pattern in
// check-evcg-s1-verify-completion-e2e-check.js.
function norm(text) {
  return text.replace(/\s+/g, ' ');
}
const verifyNorm = norm(verifyCompletionMd);
const dodNorm     = norm(definitionOfDoneMd);

// ---------------------------------------------------------------------------
// Test 1 — AC1: verifyCompletionRequiresThreeOptionGateAndBlocks
// ---------------------------------------------------------------------------
runTest('verifyCompletionRequiresThreeOptionGateAndBlocks (AC1)', function() {
  const hasHeading = /Live browser render check \(mandatory when the diff changes rendered UI output\)/.test(verifyCompletionMd);
  const hasRealBrowserOption = /\*\*Real browser check\*\*/.test(verifyNorm);
  const hasPlaywrightOption = /\*\*Playwright evidence\*\*/.test(verifyNorm);
  const hasRiskAcceptOption = /\*\*RISK-ACCEPT\*\*/.test(verifyNorm);
  const blocksProceeding = /neither a real check, Playwright evidence, nor a documented RISK-ACCEPT exists: stop\. Do not proceed to Step 4/.test(verifyNorm);
  return hasHeading && hasRealBrowserOption && hasPlaywrightOption && hasRiskAcceptOption && blocksProceeding;
});

// ---------------------------------------------------------------------------
// Test 2 — AC2: verifyCompletionStatesExplicitNAPath
// ---------------------------------------------------------------------------
runTest('verifyCompletionStatesExplicitNAPath (AC2)', function() {
  const explicitNA = /Live browser render check: N\/A — no rendered UI output touched/.test(verifyNorm);
  const doNotRunUnconditionally = /do not run this check unconditionally/.test(verifyNorm);
  return explicitNA && doNotRunUnconditionally;
});

// ---------------------------------------------------------------------------
// Test 3 — AC3: dodRequiresVerificationStrengthTagAndExternalEffectRule
// ---------------------------------------------------------------------------
runTest('dodRequiresVerificationStrengthTagAndExternalEffectRule (AC3)', function() {
  const hasHeading = /Verification strength — tag every AC's evidence, not just its pass\/fail state/.test(definitionOfDoneMd);
  const hasFourTags = /`unit`/.test(dodNorm) && /`integration-real-code`/.test(dodNorm) &&
    /`live-verified`/.test(dodNorm) && /`production-observed`/.test(dodNorm);
  const namesExternalEffectRule = /is not fully verified/.test(dodNorm);
  const requiresFollowUpOrLiveCheck = /either perform the live check now, or mark the AC.*⚠️.*and record a Follow-up Action naming the specific evidence-class gap/.test(dodNorm);
  return hasHeading && hasFourTags && namesExternalEffectRule && requiresFollowUpOrLiveCheck;
});

// ---------------------------------------------------------------------------
// Test 4 — AC4: dodAppliesSameThreeOptionUIGateBeforeMarkingAcSatisfied
// ---------------------------------------------------------------------------
runTest('dodAppliesSameThreeOptionUIGateBeforeMarkingAcSatisfied (AC4)', function() {
  const hasHeading = /UI-evidence gate \(mandatory when an AC describes browser-observable behaviour\)/.test(definitionOfDoneMd);
  const cannotBeUnitAlone = /cannot be `unit` or `integration-real-code` alone/.test(dodNorm);
  const hasThreeOptions = /\*\*A real browser check\*\*/.test(dodNorm) &&
    /\*\*Playwright evidence\*\*/.test(dodNorm) &&
    /\*\*An explicit RISK-ACCEPT\*\*/.test(dodNorm);
  const blocksMarkingSatisfied = /do not mark the AC ✅ — record it `⚠️` with a Follow-up Action naming the missing UI verification/.test(dodNorm);
  return hasHeading && cannotBeUnitAlone && hasThreeOptions && blocksMarkingSatisfied;
});

// ---------------------------------------------------------------------------
// Test 5 — AC5: skillContractsGuardBothNewSections (source inspection)
// ---------------------------------------------------------------------------
runTest('skillContractsGuardBothNewSections (AC5)', function() {
  const verifyBlockMatch = contractsSrc.match(/skill:\s*'verify-completion'[\s\S]*?\],\s*\},/);
  const dodBlockMatch = contractsSrc.match(/skill:\s*'definition-of-done'[\s\S]*?\],\s*\},/);
  if (!verifyBlockMatch || !dodBlockMatch) { return false; }
  const verifyBlock = verifyBlockMatch[0];
  const dodBlock = dodBlockMatch[0];
  const verifyGuardsHeading = verifyBlock.indexOf('Live browser render check') !== -1;
  const verifyGuardsDomDistinction = verifyBlock.indexOf('not merely DOM presence') !== -1;
  const dodGuardsVerificationStrength = dodBlock.indexOf('Verification strength') !== -1;
  const dodGuardsProductionObserved = dodBlock.indexOf('production-observed') !== -1;
  const dodGuardsUiGate = dodBlock.indexOf('UI-evidence gate') !== -1;
  return verifyGuardsHeading && verifyGuardsDomDistinction && dodGuardsVerificationStrength &&
    dodGuardsProductionObserved && dodGuardsUiGate;
});

// ---------------------------------------------------------------------------
// Test 6 — Integration: skillContractsScriptActuallyPasses
// Runs the real governance script (not just inspects its source) to confirm
// the new required strings genuinely match the live SKILL.md content.
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
// Non-regression: pre-existing sections in both SKILL.md files untouched.
// dvlg-s1 only inserts new sections, it does not rewrite existing ones.
// ---------------------------------------------------------------------------
runTest('non-regression: existing sections untouched', function() {
  const verifyIronLawIntact = verifyCompletionMd.indexOf('NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE') !== -1;
  const verifyE2ECheckIntact = verifyCompletionMd.indexOf('## Route/handler E2E coverage check (mandatory when the diff touches route/handler files)') !== -1;
  const verifyStep2Intact = verifyCompletionMd.indexOf('## Step 2 — Walk through the AC verification script') !== -1;
  const dodStep3Intact = definitionOfDoneMd.indexOf('## Step 3 - Out-of-scope check') !== -1;
  const dodStep4LayoutAuditIntact = definitionOfDoneMd.indexOf('CSS-layout-dependent') !== -1;
  const dodCompletionOutputIntact = definitionOfDoneMd.indexOf('COMPLETE WITH DEVIATIONS') !== -1;
  return verifyIronLawIntact && verifyE2ECheckIntact && verifyStep2Intact &&
    dodStep3Intact && dodStep4LayoutAuditIntact && dodCompletionOutputIntact;
});

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('\n[dvlg-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) { process.exit(1); }
