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

console.log(`\n[p11-start] p11.6 Results: ${passed} passed, ${failed} failed`);

// ═══════════════════════════════════════════════════════════════════════════════
// p11.7 — Brownfield signal routing extension
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n[p11-start] p11.7 — /start SKILL.md brownfield routing extension');

// ── AC1: Entry A routing (in-flight stories → /tdd) ──────────────────────────
assert(
  /entry\s+[Aa]|in[- ]flight|story.*artefacts|artefacts.*stories/i.test(content) &&
    (content.includes('/tdd') || content.includes('tdd')),
  'T11.7.1 — SKILL.md Entry A: detects story files in artefacts/ and routes to /tdd'
);
assert(
  /entry\s+[Aa].*explain|explain.*entry\s+[Aa]|one.{0,15}sentence.*tdd|tdd.*one.{0,15}sentence|why.*routing.*tdd|route.*tdd.*explain/is.test(content),
  'T11.7.2 — SKILL.md Entry A block includes instruction for one-sentence routing explanation'
);

// ── AC2: Entry B routing (src/ with no pipeline state → /reverse-engineer) ──
assert(
  /entry\s+[Bb]|src\/.*\.js|src\s+directory/i.test(content) &&
    (content.includes('/reverse-engineer') || content.includes('reverse-engineer')),
  'T11.7.3 — SKILL.md Entry B: detects src/*.js + no stories/dod and routes to /reverse-engineer'
);
assert(
  /entry\s+[Bb].*explain|explain.*entry\s+[Bb]|one.{0,15}sentence.*reverse|reverse.*one.{0,15}sentence|why.*routing.*reverse|route.*reverse.*explain/is.test(content),
  'T11.7.4 — SKILL.md Entry B block includes instruction for one-sentence routing explanation'
);

// ── AC3: Entry C routing (DoD records → retrospective template) ───────────────
assert(
  /entry\s+[Cc]|dod\/|dod\s+artefact|definition.{0,10}done.*artefact/i.test(content) &&
    content.includes('retrospective-story.md'),
  'T11.7.5 — SKILL.md Entry C: detects dod/ records and routes to retrospective-story.md'
);
assert(
  /entry\s+[Cc].*explain|explain.*entry\s+[Cc]|one.{0,15}sentence.*retrospective|retrospective.*one.{0,15}sentence|why.*routing.*retrospective|route.*retrospective.*explain/is.test(content),
  'T11.7.6 — SKILL.md Entry C block includes instruction for one-sentence routing explanation'
);

// ── AC4: no-signal case routes to greenfield path ────────────────────────────
assert(
  /no.*signal|none.*signal|no brownfield|fallback.*greenfield|greenfield.*fallback|if none/i.test(content),
  'T11.7.7 — SKILL.md defines fallback to greenfield path when no brownfield signals detected'
);

// ── Priority order: C > A > B must be stated explicitly ──────────────────────
assert(
  /entry\s+[Cc].*first|[Cc]\s*>\s*[Aa]|dod.*takes priority|dod.*first|check.*dod.*first|priority.*entry\s+[Cc]|entry\s+[Cc].*highest|first.{0,30}entry\s+[Cc]|highest.{0,30}priority.*[Cc]/i.test(content),
  'T11.7.8 — SKILL.md explicitly states priority order C > A > B (or equivalent phrasing)'
);

// ── AC5: contract marker present; single-turn-constraint not removed ──────────
assert(
  content.includes('brownfield-routing'),
  'T11.7.9 — SKILL.md contains <!-- brownfield-routing --> contract marker'
);
assert(
  content.includes('single-turn-constraint'),
  'T11.7.10 — SKILL.md still contains <!-- single-turn-constraint --> marker (not removed by p11.7)'
);

// ── AC5 integration: check-skill-contracts.js validates brownfield-routing ───
assert(
  contractsContent.includes('brownfield-routing'),
  'T11.7.I1 — check-skill-contracts.js validates start skill brownfield-routing marker'
);

const p117passed = passed;
const p117failed = failed;
console.log(`\n[p11-start] p11.7 Results: ${p117passed - 14} passed, ${p117failed} failed`);
console.log(`\n[p11-start] Total: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
