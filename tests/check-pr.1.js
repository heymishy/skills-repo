'use strict';
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT       = path.resolve(__dirname, '..');
const SKILL_PATH = path.join(ROOT, '.github', 'skills', 'prioritise', 'SKILL.md');

let passed = 0;
let failed = 0;

function assert(name, condition, detail) {
  if (condition) {
    process.stdout.write(`  \u2714 ${name}\n`);
    passed++;
  } else {
    process.stderr.write(`  \u2718 ${name}\n`);
    if (detail) process.stderr.write(`    \u2514\u2500 ${detail}\n`);
    failed++;
  }
}

process.stdout.write('\npr.1 \u2014 Candidate intake and framework selection\n\n');

// Pre-condition check
const skillExists = fs.existsSync(SKILL_PATH);
assert('SKILL.md exists at .github/skills/prioritise/SKILL.md', skillExists);

const content = skillExists ? fs.readFileSync(SKILL_PATH, 'utf8') : '';

// AC1 — WSJF and "cost of delay" in proximity (within 500 chars)
const wsjfIdx = content.toLowerCase().indexOf('wsjf');
const codIdx  = content.toLowerCase().indexOf('cost of delay');
const wsjfCodProximity = wsjfIdx !== -1 && codIdx !== -1 && Math.abs(wsjfIdx - codIdx) < 500;
assert(
  'AC1: names WSJF and mentions "cost of delay" in proximity',
  wsjfCodProximity,
  '"WSJF" and "cost of delay" must both appear within 500 chars of each other'
);

// AC1 — RICE + all four factors
const hasRice       = content.includes('RICE');
const hasReach      = content.includes('Reach');
const hasImpact     = content.includes('Impact');
const hasConfidence = content.includes('Confidence');
const hasEffort     = content.includes('Effort');
assert(
  'AC1: names RICE with all four factors (Reach, Impact, Confidence, Effort)',
  hasRice && hasReach && hasImpact && hasConfidence && hasEffort,
  'One or more of: RICE, Reach, Impact, Confidence, Effort — not found'
);

// AC1 — MoSCoW + all four buckets
const hasMoscow = content.includes('MoSCoW');
const hasMust   = content.includes('Must-have');
const hasShould = content.includes('Should-have');
const hasCould  = content.includes('Could-have');
const hasWont   = content.includes("Won't-have") || content.includes("Won't have");
assert(
  "AC1: names MoSCoW with all four buckets (Must-have, Should-have, Could-have, Won't-have)",
  hasMoscow && hasMust && hasShould && hasCould && hasWont,
  'One or more MoSCoW buckets not found'
);

// AC2 — acknowledge/confirm candidate list
const ac2IntakePatterns = [
  'acknowledge', 'confirm the list', 'candidate list is complete',
  'complete the list', 'confirm the candidate',
];
const hasAc2Intake = ac2IntakePatterns.some(p => content.toLowerCase().includes(p.toLowerCase()));
assert(
  'AC2: instructs skill to acknowledge/confirm candidate list before proceeding',
  hasAc2Intake,
  `Expected one of: ${ac2IntakePatterns.join(', ')}`
);

// AC2 — ask for missing context
const ac2ContextPatterns = ['goals', 'time horizon', 'decision audience', 'missing context'];
const hasAc2Context = ac2ContextPatterns.some(p => content.toLowerCase().includes(p.toLowerCase()));
assert(
  'AC2: instructs skill to ask for missing context before framework selection',
  hasAc2Context,
  `Expected one of: ${ac2ContextPatterns.join(', ')}`
);

// AC3 — framework suggestion states a reason/rationale
const ac3Rationale = ['primary reason', 'fits', 'because', 'rationale', 'reason it fits'];
const hasAc3Rationale = ac3Rationale.some(p => content.toLowerCase().includes(p.toLowerCase()));
assert(
  'AC3: framework suggestion includes a stated reason/rationale',
  hasAc3Rationale,
  `Expected one of: ${ac3Rationale.join(', ')}`
);

// AC3 — confirm or override before proceeding to scoring
const ac3Confirm = [
  'confirm or override', 'explicit confirm', 'does not proceed without',
  'proceed without an explicit', 'confirm before', 'without confirmation',
];
const hasAc3Confirm = ac3Confirm.some(p => content.toLowerCase().includes(p.toLowerCase()));
assert(
  'AC3: instructs skill to wait for confirm/override before scoring',
  hasAc3Confirm,
  `Expected one of: ${ac3Confirm.join(', ')}`
);

// AC4 — override accepted without re-arguing
const ac4Override = [
  'without re-arguing', 'accept the choice', 'does not re-suggest',
  'accepts the override', 'override is final',
];
const hasAc4 = ac4Override.some(p => content.toLowerCase().includes(p.toLowerCase()));
assert(
  'AC4: instructs skill to accept override without re-arguing',
  hasAc4,
  `Expected one of: ${ac4Override.join(', ')}`
);

// AC5 — at most two clarifying questions
const ac5Limit = ['at most two', 'two clarifying', 'no more than two', 'maximum two', 'max two'];
const hasAc5 = ac5Limit.some(p => content.toLowerCase().includes(p.toLowerCase()));
assert(
  'AC5: instructs skill to ask at most two clarifying questions before suggesting',
  hasAc5,
  `Expected one of: ${ac5Limit.join(', ')}`
);

// AC6 — check-skill-contracts.js exits 0
// Note: the 'prioritise' contract entry is added by pr.5; this test verifies the
// partial file does not break any existing contracts.
try {
  execSync('node .github/scripts/check-skill-contracts.js', { cwd: ROOT, stdio: 'pipe' });
  assert('AC6: check-skill-contracts.js exits 0 with no violations', true);
} catch (e) {
  const stderr = e.stderr ? e.stderr.toString().slice(0, 300) : e.message;
  assert('AC6: check-skill-contracts.js exits 0 with no violations', false, stderr);
}

// NFR — no non-comment HTML tags in SKILL.md
const commentStripped = content.replace(/<!--[\s\S]*?-->/g, '');
const htmlTags = commentStripped.match(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g) || [];
assert(
  'NFR: SKILL.md contains no embedded HTML except HTML comments',
  htmlTags.length === 0,
  `Found ${htmlTags.length} non-comment HTML tag(s): ${htmlTags.slice(0, 3).join(', ')}`
);

// Summary
process.stdout.write(`\n[check-pr.1] Results: ${passed} passed, ${failed} failed\n\n`);
if (failed > 0) process.exit(1);
