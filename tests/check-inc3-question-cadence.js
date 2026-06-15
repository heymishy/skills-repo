// check-inc3-question-cadence.js — unit tests for inc3 SKILL.md cadence instruction
// Tests: T1 inference instruction, T2 question-limit guidance, T3 assume-and-proceed
//        pattern, T4 existing lens headings unmodified.

'use strict';

const fs   = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log('[inc3] PASS: ' + label);
    passed++;
  } else {
    console.error('[inc3] FAIL: ' + label);
    failed++;
  }
}

const skillMdPath = path.join(__dirname, '../.github/skills/ideate/SKILL.md');
const skillMd = fs.readFileSync(skillMdPath, 'utf8');

// ---------------------------------------------------------------------------
// T1 — AC1: inference-first instruction present
// ---------------------------------------------------------------------------
assert('T1: "Infer" or "inference" instruction present in SKILL.md',
  skillMd.indexOf('Infer,') !== -1 || skillMd.toLowerCase().indexOf('inference') !== -1);
assert('T1: "Conversation cadence" section heading present',
  skillMd.indexOf('Conversation cadence') !== -1);

// ---------------------------------------------------------------------------
// T2 — AC2: question-limit guidance present
// ---------------------------------------------------------------------------
assert('T2: question-limit guidance present (one question per step)',
  skillMd.toLowerCase().indexOf('one question') !== -1 ||
  skillMd.toLowerCase().indexOf('one focused question') !== -1);

// ---------------------------------------------------------------------------
// T3 — AC3: assume-and-proceed pattern documented
// ---------------------------------------------------------------------------
assert('T3: assume-and-state pattern present ("I\'m assuming" or "correct me")',
  skillMd.indexOf("I'm assuming") !== -1 || skillMd.indexOf('correct me') !== -1);

// ---------------------------------------------------------------------------
// T4 — AC4: existing lens step headings unmodified
// ---------------------------------------------------------------------------
var lensHeadings = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'E1', 'E2', 'E3', 'E4'];
var allPresent = lensHeadings.every(function(h) { return skillMd.indexOf('### ' + h) !== -1; });
assert('T4: all lens step headings (A1-A4, B1-B3, C1-C3, E1-E4) still present', allPresent);

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('\n[inc3] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) { process.exit(1); }
