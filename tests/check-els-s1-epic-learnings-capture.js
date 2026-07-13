'use strict';

// check-els-s1-epic-learnings-capture.js — TDD for els-s1
// Story: artefacts/2026-07-13-epic-learnings-capture/stories/els-s1-capture-epic-delivery-learnings.md
// Content-verification checks (grep-style), matching the check-md-*.js convention
// for governed-file content assertions -- no application code is touched by this story.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CLAUDE_MD = path.join(ROOT, 'CLAUDE.md');
const GUARDRAILS = path.join(ROOT, '.github', 'architecture-guardrails.md');
const PROPOSALS_DIR = path.join(ROOT, 'workspace', 'proposals');

let passed = 0;
let failed = 0;

function assert(label, condition, detail) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    process.stderr.write(`  ✗ ${label}${detail ? ': ' + detail : ''}\n`);
    failed++;
  }
}

const claudeMd = fs.readFileSync(CLAUDE_MD, 'utf8');
const guardrails = fs.readFileSync(GUARDRAILS, 'utf8');

// ── AC1/AC2: CLAUDE.md D37 section gains wiring-correctness and mock-shape rules ──
console.log('[els-s1] U1: CLAUDE.md D37 section names both new mandatory points (AC1, AC2)');

assert(
  'U1.1 — D37 section now describes four mandatory points, not three',
  /four things are mandatory/i.test(claudeMd),
);

assert(
  'U1.2 — wiring test must assert behavioural correctness, not just that a function was assigned',
  /wiring test must assert behavioural correctness/i.test(claudeMd),
);

assert(
  'U1.3 — references the tir-s1/tir-s7 originating bug as the source',
  claudeMd.includes('tir-s1') && claudeMd.includes('tir-s7'),
);

assert(
  'U1.4 — mock-shape verification rule exists for adapters reused for a new purpose',
  /verify the test's mock payload shape against that adapter's actual, currently-wired production response shape/i.test(claudeMd),
);

assert(
  'U1.5 — references the tir-s5/tir-s8 originating bug as the source',
  claudeMd.includes('tir-s5') && claudeMd.includes('tir-s8'),
);

// ── AC3: CLAUDE.md session conventions gain a dispatch-verification rule ─────
console.log('\n[els-s1] U2: CLAUDE.md session conventions include the dispatch-verification rule (AC3)');

assert(
  'U2.1 — rule requires independent verification of coding-agent completion reports',
  /do not trust the agent's self-report/i.test(claudeMd),
);

assert(
  'U2.2 — names git status/log as part of the verification mechanism',
  /`git status`\/`git log`/.test(claudeMd),
);

assert(
  'U2.3 — names gh pr list/view as part of the verification mechanism',
  /`gh pr list`\/`gh pr view`/.test(claudeMd),
);

// ── AC4: architecture-guardrails.md Anti-Patterns table gains a matching row ─
console.log('\n[els-s1] U3: architecture-guardrails.md Anti-Patterns table has the new rows (AC4)');

assert(
  'U3.1 — new row exists for trusting self-reported agent completion',
  guardrails.includes('| Trusting a coding agent\'s self-reported task completion instead of verifying git/PR state directly |'),
);

assert(
  'U3.2 — new row exists for D37 wiring tests only asserting a function reference was assigned',
  guardrails.includes('| A D37 wiring test that only asserts a function reference was assigned |'),
);

assert(
  'U3.3 — new row exists for mocking a reused adapter with a convenient shape',
  guardrails.includes('| Mocking a reused adapter\'s new call site with a convenient shape instead of its real response shape |'),
);

// ── AC5: workspace/proposals/ contains the estimate-skip proposal with all 8 fields ──
console.log('\n[els-s1] U4: workspace/proposals/ contains the estimate-skip-marker proposal with all 8 required fields (AC5)');

const proposalPath = path.join(PROPOSALS_DIR, '2026-07-13-estimate-skip-marker-improve-proposal.md');
const proposalExists = fs.existsSync(proposalPath);
assert('U4.1 — proposal file exists at the expected path', proposalExists);

if (proposalExists) {
  const proposal = fs.readFileSync(proposalPath, 'utf8');
  const requiredFields = [
    'evidence:',
    'proposed_diff:',
    'confidence:',
    'anti_overfitting_gate:',
    'status: pending_review',
    'created_at:',
    'skill_target:',
    'source: improve',
  ];
  requiredFields.forEach((field) => {
    assert(`U4.2 — front-matter contains "${field}"`, proposal.includes(field));
  });
} else {
  console.log('  (skipping front-matter field checks — file not found)');
}

console.log(`\n[els-s1] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
