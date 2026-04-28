#!/usr/bin/env node
// check-ilc3-checkpoint-bridge.js — governance tests for ilc.3
// Covers 12 tests across AC1–AC5 and NFR checks.
// Tests FAIL until copilot-instructions.md is updated with capture-bridge step.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT         = path.join(__dirname, '..');
const INSTRUCTIONS = path.join(ROOT, '.github', 'copilot-instructions.md');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function readInstructions() {
  // Normalise CRLF → LF so extraction works on Windows and Linux alike
  return fs.readFileSync(INSTRUCTIONS, 'utf8').replace(/\r\n/g, '\n');
}

// Extract the capture bridge paragraph — from "**Capture bridge" to next blank line
function extractBridgeSection(text) {
  const start = text.indexOf('**Capture bridge');
  if (start === -1) return '';
  const end = text.indexOf('\n\n', start);
  return end === -1 ? text.slice(start) : text.slice(start, end);
}

// Extract the /checkpoint convention block — from the heading to the next ---
function extractCheckpointBlock(text) {
  const start = text.indexOf("### `/checkpoint` convention");
  const end   = text.indexOf('\n---', start);
  return (start === -1) ? '' : (end === -1 ? text.slice(start) : text.slice(start, end));
}

const instructions    = readInstructions();
const bridge          = extractBridgeSection(instructions);
const checkpointBlock = extractCheckpointBlock(instructions);

// ── AC1: bridge present and reports count of new captures ────────────────────

console.log('\n[ilc3-checkpoint-bridge] AC1 — bridge present and reports count');

assert(
  instructions.includes('workspace/capture-log.md') && bridge.includes('promote'),
  'checkpoint-bridge-instruction-present: checkpoint section references workspace/capture-log.md and describes promoting entries'
);

assert(
  bridge.includes('count') || bridge.includes('Report'),
  'checkpoint-bridge-reports-count: bridge instruction contains count-reporting language'
);

assert(
  bridge.includes('No new captures'),
  'checkpoint-no-new-captures-message: bridge instruction specifies "No new captures" message for zero-entry case'
);

// ── AC2: presents signal-type + signal-text ──────────────────────────────────

console.log('\n[ilc3-checkpoint-bridge] AC2 — presents signal-type and signal-text');

assert(
  bridge.includes('signal-type'),
  'checkpoint-presents-signal-type: bridge instruction references signal-type field'
);

assert(
  bridge.includes('signal-text'),
  'checkpoint-presents-signal-text: bridge instruction references signal-text field'
);

// ── AC3: promoted entries include date + session-phase, target learnings.md ──

console.log('\n[ilc3-checkpoint-bridge] AC3 — promoted entries include date, session-phase, target learnings.md');

assert(
  bridge.includes('workspace/learnings.md'),
  'checkpoint-promotion-target-learnings-md: bridge instruction names workspace/learnings.md as promotion target'
);

assert(
  bridge.includes('date') && bridge.includes('session-phase'),
  'checkpoint-promotion-preserves-date-session-phase: bridge instruction requires date and session-phase in promoted entries'
);

// ── AC4: handles zero-capture and absent capture-log ─────────────────────────

console.log('\n[ilc3-checkpoint-bridge] AC4 — handles absent capture-log and zero-capture case');

assert(
  bridge.includes('capture-log.md not found') || bridge.includes('skipping capture review'),
  'checkpoint-non-blocking-no-capture-log: bridge instruction handles absent capture-log.md with skip message'
);

assert(
  bridge.includes('lastUpdated') && bridge.includes('state.json'),
  'checkpoint-boundary-uses-last-updated: bridge uses lastUpdated from workspace/state.json as session boundary'
);

// ── AC5: skip is non-blocking; state-write proceeds ──────────────────────────

console.log('\n[ilc3-checkpoint-bridge] AC5 — skip is non-blocking');

assert(
  bridge.toLowerCase().includes('non-blocking') ||
    (bridge.toLowerCase().includes('skip') && bridge.includes('state-write')),
  'checkpoint-skip-non-blocking: bridge instruction states skipping is non-blocking and proceeds to state-write'
);

assert(
  bridge.toLowerCase().includes('skip'),
  'checkpoint-skip-path-present: bridge instruction contains a skip path for operator to decline promotion'
);

// ── NFR: total addition ≤ 80 words ───────────────────────────────────────────

console.log('\n[ilc3-checkpoint-bridge] NFR — total addition ≤ 80 words');

const wordCount = bridge.split(/\s+/).filter(Boolean).length;
assert(
  wordCount > 0 && wordCount <= 80,
  `checkpoint-bridge-word-count-nfr: bridge section ≤ 80 words (actual: ${wordCount})`
);

// ── Location: bridge is inside the /checkpoint convention block ───────────────

console.log('\n[ilc3-checkpoint-bridge] Location — bridge is in /checkpoint convention block');

assert(
  checkpointBlock.includes('workspace/capture-log.md'),
  'checkpoint-bridge-in-checkpoint-section: capture bridge appears inside the /checkpoint convention block'
);

// ── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n[ilc3-checkpoint-bridge] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
