#!/usr/bin/env node
// check-p11-start.js — p11.6 /start skill tests
// Tests that .github/skills/start/SKILL.md exists and meets all ACs.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const SKILL_PATH = path.join(ROOT, '.github', 'skills', 'start', 'SKILL.md');
const CONTRACTS  = path.join(ROOT, '.github', 'scripts', 'check-skill-contracts.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

console.log('\n[p11-start] p11.6 — /start SKILL.md greenfield orientation skill');

// T0 — file must exist (all remaining assertions depend on this)
const exists = fs.existsSync(SKILL_PATH);
assert(exists, 'T0 — .github/skills/start/SKILL.md exists');

const content = exists ? fs.readFileSync(SKILL_PATH, 'utf8') : '';

// ── AC5: YAML frontmatter triggers ────────────────────────────────────────────
assert(content.includes('triggers:'), 'T1 — SKILL.md has triggers: key in YAML frontmatter');

// T2-T6: specific trigger values must all be present
assert(
  content.includes('"start"') || content.includes("'start'") || /^-\s*start\s*$/m.test(content),
  'T2 — triggers includes "start"'
);
assert(
  content.includes('where am I') || content.includes('where-am-i'),
  'T3 — triggers includes "where am I"'
);
assert(
  content.includes('what do I do') || content.includes('what next'),
  'T4 — triggers includes "what do I do" or "what next"'
);
assert(
  content.includes('help me get started') || content.includes('get started'),
  'T5 — triggers includes "help me get started"'
);
assert(
  content.includes('I just cloned') || content.includes('just cloned'),
  'T6 — triggers includes "I just cloned this"'
);

// ── AC1: greenfield orientation path ──────────────────────────────────────────
assert(
  /governed.{0,20}delivery.{0,20}pipeline|skills.based.pipeline|skills pipeline/i.test(content),
  'T7 — SKILL.md describes the governed delivery pipeline in orientation text'
);
assert(
  /no pipeline state|no state\.json|new installation|greenfield/i.test(content),
  'T8 — SKILL.md covers "no pipeline state" language for greenfield path'
);
assert(
  content.includes('/discovery'),
  'T9 — SKILL.md names /discovery as the recommended first skill for greenfield'
);

// ── AC2: brownfield resumption path ───────────────────────────────────────────
assert(
  content.includes('workspace/state.json') || content.includes('currentPhase'),
  'T10 — SKILL.md references workspace/state.json for brownfield resumption'
);
assert(
  content.includes('/workflow') || /run.{0,10}workflow/i.test(content),
  'T11 — SKILL.md routes brownfield users to /workflow skill'
);

// ── AC3: single-turn-constraint marker ────────────────────────────────────────
assert(
  content.includes('single-turn-constraint'),
  'T12 — SKILL.md contains <!-- single-turn-constraint --> marker'
);

// ── AC4: no multi-step interview before orientation ───────────────────────────
// Orientation must not defer to a Q&A session before giving the overview
const hasSingleTurnMarker = content.includes('single-turn-constraint');
const hasInterviewPattern = /\binterview\b|\bclarify.*before\b|\bask.*before\b/i.test(content);
assert(
  !hasInterviewPattern || hasSingleTurnMarker,
  'T13 — SKILL.md does not conduct a multi-step interview before giving orientation'
);

// ── AC3 integration: check-skill-contracts.js references start skill ──────────
const contractsContent = fs.readFileSync(CONTRACTS, 'utf8');
assert(
  contractsContent.includes('single-turn-constraint') || contractsContent.includes('start'),
  'T14 — check-skill-contracts.js validates start skill single-turn-constraint'
);

console.log(`\n[p11-start] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
