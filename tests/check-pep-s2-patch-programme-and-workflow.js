#!/usr/bin/env node
/**
 * check-pep-s2-patch-programme-and-workflow.js
 *
 * Tests for pep-s2 AC1-AC5 — patches to skills/programme/SKILL.md,
 * skills/workflow/SKILL.md, and skills/orient/SKILL.md.
 *
 * AC6 (any additional gap from pep-s1's findings traces to a named finding,
 * or is RISK-ACCEPTed) is Untestable-by-nature per the test plan — verified
 * by a manual scenario against decisions.md, not here.
 *
 * Run: node tests/check-pep-s2-patch-programme-and-workflow.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function ok() { totalPassed++; }
function fail(label, message) {
  totalFailed++;
  issues.push(`  ✗ [${label}] ${message}`);
}
function assert(label, condition, message) {
  if (condition) { ok(); } else { fail(label, message); }
}

const { scoreStep0Patched, buildProfile, EPIC_COUNT_THRESHOLD } =
  require('../src/pep-s2-patch-programme-and-workflow/step0-scorer');

const programmeSkillPath = path.join(root, 'skills/programme/SKILL.md');
const workflowSkillPath = path.join(root, 'skills/workflow/SKILL.md');
const orientSkillPath = path.join(root, 'skills/orient/SKILL.md');

const programmeSkill = fs.readFileSync(programmeSkillPath, 'utf8');
const workflowSkill = fs.readFileSync(workflowSkillPath, 'utf8');
const orientSkill = fs.readFileSync(orientSkillPath, 'utf8');

// ── AC1: scoring table has the new, concretely-pinned epic-count signal ────

assert('T1-scoring-table-has-epic-count-row',
  /Epic count within a single feature.*≥4 epics/.test(programmeSkill),
  'Step 0\'s scoring table must state the threshold as "≥4 epics", not a placeholder');

assert('T1-no-stale-placeholder-language',
  !/a defined threshold/i.test(programmeSkill),
  'no unpinned "a defined threshold" placeholder language should remain in the patched skill');

assert('T1-epic-count-threshold-matches-pep-s3',
  EPIC_COUNT_THRESHOLD === 4,
  `expected EPIC_COUNT_THRESHOLD imported from pep-s3's script to be 4, got ${EPIC_COUNT_THRESHOLD}`);

// ── AC1: epic-count signal alone flips an otherwise-failing verdict, boundary at exactly 4 ──

const boundaryProfile = buildProfile(root, { epicCount: 4 });
const boundaryResult = scoreStep0Patched(boundaryProfile);
assert('T2-boundary-epic-count-4-passes',
  boundaryResult.verdict === 'pass' && boundaryResult.firingSignals.length === 1 && boundaryResult.firingSignals[0] === 'epicCountAtLeastFour',
  `epicCount=4 with all other signals false must pass via epicCountAtLeastFour alone; got verdict=${boundaryResult.verdict}, firingSignals=${JSON.stringify(boundaryResult.firingSignals)}`);

const belowBoundaryProfile = buildProfile(root, { epicCount: 3 });
const belowBoundaryResult = scoreStep0Patched(belowBoundaryProfile);
assert('T2-below-boundary-epic-count-3-fails',
  belowBoundaryResult.verdict === 'fail',
  `epicCount=3 with all other signals false must still fail (threshold is inclusive at 4, not 3); got verdict=${belowBoundaryResult.verdict}`);

// ── AC2: real phase4 profile (5 epics, 1 operator, no other signal) flips fail -> pass ──

const phase4Dir = path.join(root, 'artefacts/archived/2026-04-19-skills-platform-phase4');
const phase4Profile = buildProfile(phase4Dir, {
  operatorCount: 1,
  operatorNames: ['Hamish King'],
  timelineSpanDays: 3,
});
const phase4Result = scoreStep0Patched(phase4Profile);
assert('T3-phase4-epic-count-is-5',
  phase4Profile.epicCount === 5,
  `expected phase4's real epic count to be 5, got ${phase4Profile.epicCount}`);
assert('T3-phase4-flips-to-pass',
  phase4Result.verdict === 'pass',
  `phase4's real profile must flip to pass via the new epic-count signal; got ${phase4Result.verdict}`);
assert('T3-phase4-pass-is-via-epic-count-specifically',
  phase4Result.firingSignals.length === 1 && phase4Result.firingSignals[0] === 'epicCountAtLeastFour',
  `phase4's pass must be caused specifically by epicCountAtLeastFour, not multipleTeams/timeline/etc; got firingSignals=${JSON.stringify(phase4Result.firingSignals)}`);

// ── AC3: real team-identity-roles profile (1 epic) stays fail, no false positive ──

const tirDir = path.join(root, 'artefacts/2026-07-09-team-identity-roles');
const tirProfile = buildProfile(tirDir, { operatorCount: 1 });
const tirResult = scoreStep0Patched(tirProfile);
assert('T4-tir-epic-count-is-1',
  tirProfile.epicCount === 1,
  `expected team-identity-roles' real epic count to be 1, got ${tirProfile.epicCount}`);
assert('T4-tir-stays-fail',
  tirResult.verdict === 'fail',
  `team-identity-roles (1 epic, below the ≥4 threshold) must still fail — the new signal must introduce no false positive; got ${tirResult.verdict}`);

// ── AC4: /workflow's "If 5" branch no longer duplicates Q1-Q4, defers to /programme Step 0 ──

const ifFiveMatch = workflowSkill.match(/\*\*If 5 — Programme track:\*\*([\s\S]*?)(?=\n\*\*If 6|\n---)/);
assert('T5-if-five-branch-found',
  !!ifFiveMatch,
  'could not locate the "If 5 — Programme track" branch in skills/workflow/SKILL.md');

if (ifFiveMatch) {
  const ifFiveText = ifFiveMatch[1];

  assert('T5-defers-to-programme-step0',
    /\/programme.{0,40}Step 0/i.test(ifFiveText) || /Step 0.{0,40}\/programme/i.test(ifFiveText),
    '"If 5" branch must explicitly instruct running /programme\'s own Step 0');

  assert('T5-no-duplicated-cross-team-question',
    !/hard dependencies.{0,80}between teams/i.test(ifFiveText),
    '"If 5" branch must not re-ask the cross-team-dependency question inline — that duplicates /programme\'s Step 0 Q2');

  assert('T5-no-duplicated-phase-gate-question',
    !/formal phase gates/i.test(ifFiveText),
    '"If 5" branch must not re-ask the phase-gate question inline — that duplicates /programme\'s Step 0 Q3');

  assert('T5-no-inline-verdict-computation',
    !/the answer to all of these is/i.test(ifFiveText),
    '"If 5" branch must not independently compute a pass/fail verdict inline (MC-CONSIST-02) — it must defer to /programme\'s own Step 0 as the single source of truth');
}

// ── AC5: /orient has at least one /programme cross-reference under a scale-framing signal ──

assert('T6-orient-mentions-programme',
  /\/programme/.test(orientSkill),
  '/orient must contain at least one cross-reference to /programme');

assert('T6-orient-programme-mention-is-scale-framed',
  /(large-scale|multiple teams|multiple phases|transformative|migration-scale)[\s\S]{0,300}\/programme/i.test(orientSkill) ||
  /\/programme[\s\S]{0,300}(large-scale|multiple teams|multiple phases|transformative|migration-scale)/i.test(orientSkill),
  '/orient\'s /programme cross-reference must be placed under a transformative/multi-team/multi-phase framing signal, not an unrelated section');

// ── Report ───────────────────────────────────────────────────────────────────

if (totalFailed > 0) {
  console.error(`[check-pep-s2-patch-programme-and-workflow] FAIL — ${issues.length} issue(s) found:`);
  issues.forEach((i) => console.error(i));
  process.exit(1);
} else {
  console.log(`[check-pep-s2-patch-programme-and-workflow] ${totalPassed} check(s) OK ✓`);
}
