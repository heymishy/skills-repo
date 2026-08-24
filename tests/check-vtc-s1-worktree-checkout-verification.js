// check-vtc-s1-worktree-checkout-verification.js — unit/integration tests for
// vtc-s1's CLAUDE.md instruction change: an explicit rule instructing
// checkout verification before the first Edit/Write call of a new turn or
// after a context-compaction boundary, whenever a .worktrees/<slug>/
// worktree exists for the active story -- closing a gap that recurred
// twice in one session (rcfc-s1, 2026-08-24) with the same trigger and the
// same manual recovery cost each time.
//
// artefacts/2026-08-24-worktree-checkout-verification/stories/vtc-s1-verify-target-checkout-before-edit.md
// artefacts/2026-08-24-worktree-checkout-verification/test-plans/vtc-s1-test-plan.md
//
// This is a CLAUDE.md instruction-text change, not runtime application code
// -- CLAUDE.md is a conversational instruction file consumed by a model, not
// executable functions. Tests therefore assert on the actual instruction
// text present in the real file, following the established pattern in
// tests/check-csd-s4-data-model-diagram-instruction.js,
// tests/check-dta-s1-domain-tag-activation.js,
// tests/check-evcg-s1-verify-completion-e2e-check.js,
// tests/check-psms-s1-pipeline-state-merge-safety.js, and
// tests/check-s3fw-s1-final-review-background-warning.js, generalised from
// SKILL.md files to CLAUDE.md.
'use strict';

const fs   = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    const ok = fn();
    if (ok) {
      console.log('[vtc-s1] PASS: ' + name);
      passed++;
    } else {
      console.error('[vtc-s1] FAIL: ' + name);
      failed++;
    }
  } catch (e) {
    console.error('[vtc-s1] FAIL: ' + name + ' (threw: ' + e.message + ')');
    failed++;
  }
}

const claudeMdPath   = path.join(__dirname, '../CLAUDE.md');
const captureLogPath = path.join(__dirname, '../workspace/capture-log.md');

const claudeMd   = fs.readFileSync(claudeMdPath, 'utf8');
const captureLog = fs.readFileSync(captureLogPath, 'utf8');

// This repo's markdown files use CRLF and hard-wrap prose, so a phrase can
// be split across a line break -- normalise runs of whitespace to a single
// space before phrase-matching, matching the established pattern.
function norm(text) {
  return text.replace(/\s+/g, ' ');
}
const claudeNorm = norm(claudeMd);

// ---------------------------------------------------------------------------
// Test 1 — AC1: claudeMdHasCheckoutVerificationRule
// ---------------------------------------------------------------------------
runTest('claudeMdHasCheckoutVerificationRule (AC1)', function() {
  const sessionSectionStart = claudeMd.indexOf('### During a session');
  const sessionSectionEnd = claudeMd.indexOf('### Ending a session');
  if (sessionSectionStart === -1 || sessionSectionEnd === -1 || sessionSectionEnd <= sessionSectionStart) { return false; }
  const sessionSection = claudeMd.slice(sessionSectionStart, sessionSectionEnd);
  const sessionSectionNorm = norm(sessionSection);
  const hasBoldedRule = /\*\*Verify the target checkout before editing files once an inner-loop worktree exists for the active story\.\*\*/.test(sessionSectionNorm);
  const namesWorktreePrefix = sessionSectionNorm.indexOf('.worktrees/<slug>/') !== -1;
  const namesEditWriteTrigger = /first `Edit`\/`Write` call/.test(sessionSectionNorm);
  const namesCompactionBoundary = /context-window summarisation\/compaction boundary/.test(sessionSectionNorm);
  return hasBoldedRule && namesWorktreePrefix && namesEditWriteTrigger && namesCompactionBoundary;
});

// ---------------------------------------------------------------------------
// Test 2 — AC2: ruleNamesConcreteTriggerAndRecoveryCost
// ---------------------------------------------------------------------------
runTest('ruleNamesConcreteTriggerAndRecoveryCost (AC2)', function() {
  const namesRcfcS1 = claudeNorm.indexOf('rcfc-s1') !== -1 && claudeNorm.indexOf('2026-08-24') !== -1;
  const namesTrigger = /a tool-result or system-reminder block showed a bare path with no `\.worktrees\/` prefix for a file already open in context from an earlier turn/.test(claudeNorm);
  const namesRecoverySteps = /copy the edited file into the worktree, diff-verify it matches byte-for-byte, discard the duplicate from the main checkout via `git checkout --`/.test(claudeNorm);
  return namesRcfcS1 && namesTrigger && namesRecoverySteps;
});

// ---------------------------------------------------------------------------
// Test 3 — AC3: existingDispatchVerificationRuleUnchanged (non-regression)
// ---------------------------------------------------------------------------
runTest('existingDispatchVerificationRuleUnchanged (AC3, non-regression)', function() {
  const existingRuleIntact = claudeMd.indexOf(
    '**Verify coding-agent dispatch completion independently — do not trust the agent\'s self-report.** After a dispatched coding-agent subagent reports finishing (implementation done, tests passing, PR opened), independently confirm the actual state before treating the report as ground truth'
  ) !== -1;
  const teamIdentityEvidenceIntact = claudeMd.indexOf(
    'In the `team-identity-roles` epic, 4 of 8 coding-agent dispatches reported completion'
  ) !== -1;
  return existingRuleIntact && teamIdentityEvidenceIntact;
});

// ---------------------------------------------------------------------------
// Test 4 — AC4: captureLogEntriesUnmodified (non-regression)
// ---------------------------------------------------------------------------
runTest('captureLogEntriesUnmodified (AC4, non-regression)', function() {
  const firstEntryIntact = captureLog.indexOf(
    'Worktree/wrong-checkout edits recurred twice with no fix, only manual workarounds'
  ) !== -1 || captureLog.indexOf(
    'edits meant for `.worktrees/rcfc-s1/...` landed in the main checkout twice'
  ) !== -1;
  // Also accept the exact recurring-mistake capture-log entries by their
  // distinctive phrasing (written during rcfc-s1's own session), tolerant
  // of exact wording since these are prose, not a fixed schema.
  const mentionsRcfcS1Twice = (captureLog.match(/rcfc-s1/g) || []).length >= 2;
  const isGapType = captureLog.indexOf('signal-type: gap') !== -1;
  return (firstEntryIntact || mentionsRcfcS1Twice) && isGapType;
});

// ---------------------------------------------------------------------------
// Test 5 — Non-regression: existing sections untouched
// ---------------------------------------------------------------------------
runTest('non-regression: existing sections untouched', function() {
  const endingSessionIntact = claudeMd.indexOf('### Ending a session') !== -1;
  const codingStandardsIntact = claudeMd.indexOf('## Coding standards') !== -1;
  const agentSelfRecordingIntact = claudeMd.indexOf('**Agent self-recording.**') !== -1;
  return endingSessionIntact && codingStandardsIntact && agentSelfRecordingIntact;
});

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('\n[vtc-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) { process.exit(1); }
