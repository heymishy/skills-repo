/**
 * Tests for sri.3: measurement-ready gate in DoD Step 6.
 * Content assertion tests against skills/definition-of-done/SKILL.md.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const SKILL_PATH = path.join(__dirname, '..', 'skills', 'definition-of-done', 'SKILL.md');
const content = fs.readFileSync(SKILL_PATH, 'utf8');

// Extract Step 6 section (between ## Step 6 and next ##)
const step6Match = content.match(/## Step 6[\s\S]*?(?=\n## )/);
const step6 = step6Match ? step6Match[0] : '';

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

// ─── T1: Step 6 contains the measurement-ready gate question ────────────────
{
  const hasGateQuestion = /measurement.*possible|possible.*yet/i.test(step6);
  assert('T1 dod-step6-contains-measurement-ready-gate-question', hasGateQuestion);
}

// ─── T2: Gate question precedes signal prompt in Step 6 ──────────────────────
{
  // Gate question must appear before "on-track" / "at-risk" / signal prompt
  const gateIdx = step6.search(/measurement.*possible|possible.*yet/i);
  const signalIdx = step6.search(/on-track|at-risk|off-track/i);
  const gateFound = gateIdx !== -1;
  const signalFound = signalIdx !== -1;
  const gateFirst = gateFound && signalFound && gateIdx < signalIdx;
  assert(
    'T2 dod-step6-gate-question-precedes-signal-prompt',
    gateFirst,
    `gateIdx=${gateIdx} signalIdx=${signalIdx}`
  );
}

// ─── T3: "not yet" path records not-yet-measured label ───────────────────────
{
  const hasLabel = /not.yet.measured/i.test(step6);
  assert('T3 dod-step6-not-yet-path-records-not-yet-measured', hasLabel);
}

// ─── T4: "not yet" path requests an evidence note ────────────────────────────
{
  const hasNote = /evidence.*note|brief.*note/i.test(step6);
  assert('T4 dod-step6-not-yet-path-requests-evidence-note', hasNote);
}

// ─── T5: "not yet" path moves on without further signal prompts ──────────────
{
  const hasMoveOn = /move.*on|next story|no further/i.test(step6);
  assert('T5 dod-step6-not-yet-path-moves-on-without-signal-prompts', hasMoveOn);
}

// ─── T6: Regression guard — normal signal options still present ───────────────
{
  const hasOnTrack = /on-track/i.test(step6);
  const hasAtRisk = /at-risk/i.test(step6);
  const hasOffTrack = /off-track/i.test(step6);
  assert(
    'T6 regression-normal-signal-options-still-present',
    hasOnTrack && hasAtRisk && hasOffTrack,
    `onTrack=${hasOnTrack} atRisk=${hasAtRisk} offTrack=${hasOffTrack}`
  );
}

// ─── T7: Artefact-write instruction mentions evidence note ────────────────────
{
  // Look in the state-write / state update section (after Step 6, before Output)
  const stateWriteMatch = content.match(/State write for metrics[\s\S]*?(?=\n---)/);
  const stateSection = stateWriteMatch ? stateWriteMatch[0] : '';
  const hasEvidenceNote = /evidence.*note|brief.*note/i.test(stateSection);
  // Also accept if the artefact template block includes evidence note instruction
  const templateMatch = content.match(/not-yet-measured[\s\S]*?evidence/i);
  const hasAny = hasEvidenceNote || templateMatch !== null;
  assert('T7 dod-step6-artefact-instruction-records-evidence-note', hasAny);
}

// ─── T8: Regression guard — per-story loop structure intact ──────────────────
{
  // Step 6 must still reference iterating over metrics / contributing stories
  const hasLoop = /each metric|contributing[Ss]tories|metrics.*array/i.test(step6);
  assert('T8 regression-per-story-loop-structure-intact', hasLoop);
}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
