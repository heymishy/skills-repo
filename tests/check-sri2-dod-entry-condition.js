/**
 * Tests for sri.2: expanded DoD entry condition message.
 * Content assertion tests against skills/definition-of-done/SKILL.md.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const SKILL_PATH = path.join(__dirname, '..', 'skills', 'definition-of-done', 'SKILL.md');
const content = fs.readFileSync(SKILL_PATH, 'utf8');

// Extract the entry condition section (between ## Entry condition check and next ##)
const entryMatch = content.match(/## Entry condition check([\s\S]*?)(?=\n## )/);
const entrySection = entryMatch ? entryMatch[1] : '';

let passed = 0;
let failed = 0;

function assert(name, condition, detail) {
  if (condition) {
    console.log(`  PASS  ${name}`);
    passed++;
  } else {
    console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

// ─── T1: PR status check in entry condition ──────────────────────────────────
{
  const hasPrCheck = /gh pr view|check.*PR.*status|PR.*status.*check/i.test(entrySection);
  assert('T1 dod-entry-condition-contains-pr-status-check', hasPrCheck);
}

// ─── T2: Next steps sequence in entry condition ──────────────────────────────
{
  const hasNextSteps = /mark.*ready|ready for review|next steps/i.test(entrySection);
  assert('T2 dod-entry-condition-contains-next-steps-sequence', hasNextSteps);
}

// ─── T3: Gate rationale in entry condition ───────────────────────────────────
{
  const hasRationale = /what.*actually.*shipped|validates.*merged|validates what has.*shipped|DoD validates/i.test(entrySection);
  assert('T3 dod-entry-condition-contains-gate-rationale', hasRationale);
}

// ─── T4: All three elements within the same bounded section ──────────────────
{
  const hasPrCheck = /gh pr view|check.*PR.*status|PR.*status.*check/i.test(entrySection);
  const hasNextSteps = /mark.*ready|ready for review|next steps/i.test(entrySection);
  const hasRationale = /what.*actually.*shipped|validates.*merged|validates what has.*shipped|DoD validates/i.test(entrySection);
  assert(
    'T4 dod-entry-condition-all-three-elements-present-in-same-section',
    hasPrCheck && hasNextSteps && hasRationale,
    `prCheck=${hasPrCheck} nextSteps=${hasNextSteps} rationale=${hasRationale}`
  );
}

// ─── T5: Regression guard — post-merge flow sections still intact ─────────────
{
  const hasAcCoverage = /AC coverage/i.test(content);
  const hasTestPlan = /test plan/i.test(content);
  const hasMetric = /metric/i.test(content);
  assert(
    'T5 post-merge-flow-sections-still-intact',
    hasAcCoverage && hasTestPlan && hasMetric,
    `acCoverage=${hasAcCoverage} testPlan=${hasTestPlan} metric=${hasMetric}`
  );
}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
