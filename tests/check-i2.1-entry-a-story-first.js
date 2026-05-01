'use strict';

const fs = require('fs');
const path = require('path');

const SKILL_PATH = path.join(__dirname, '..', '.github', 'skills', 'orient', 'SKILL.md');

let passed = 0;
let failed = 0;

function assert(name, condition, detail) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.error(`  ✗ ${name}${detail ? ': ' + detail : ''}`);
    failed++;
  }
}

// Read the SKILL.md file once
let skillContent = '';
try {
  skillContent = fs.readFileSync(SKILL_PATH, 'utf8');
} catch (e) {
  console.error(`FATAL: Could not read ${SKILL_PATH}: ${e.message}`);
  process.exit(1);
}

console.log('[i2.1-entry-a-story-first] Running tests...');

// ── Unit: orient-entry-a-routing-block-present ───────────────────────────────
// AC1 prerequisite — Entry A routing logic exists in SKILL.md
assert(
  'orient-entry-a-routing-block-present',
  skillContent.includes('Entry A'),
  '"Entry A" not found in orient SKILL.md'
);

// ── Unit: orient-entry-a-names-state-story-first-brownfield ──────────────────
// AC1(a) — output identifies state as "Entry A — story-first brownfield" by name
assert(
  'orient-entry-a-names-state-story-first-brownfield',
  skillContent.includes('Entry A') && (
    skillContent.includes('story-first brownfield') ||
    skillContent.includes('story-first') ||
    skillContent.includes('Entry A — story-first')
  ),
  'Entry A canonical label "story-first brownfield" not found'
);

// ── Unit: orient-entry-a-explains-adoption-path ──────────────────────────────
// AC1(b) — explains that existing stories can be adopted by creating a discovery artefact
assert(
  'orient-entry-a-explains-adoption-path',
  skillContent.includes('Entry A') && (
    skillContent.includes('discovery artefact') ||
    skillContent.includes('/discovery')
  ) && (
    skillContent.toLowerCase().includes('adopt') ||
    skillContent.toLowerCase().includes('existing stories') ||
    skillContent.toLowerCase().includes('existing story')
  ),
  'Entry A section must explain adoption path via discovery artefact'
);

// ── Unit: orient-entry-a-names-tdd-as-inner-loop-entry-with-no-rederivation ──
// AC1(c) — explicitly names /tdd AND states existing artefacts can be attached without re-derivation
assert(
  'orient-entry-a-names-tdd-as-inner-loop-entry-with-no-rederivation',
  skillContent.includes('/tdd') && (
    skillContent.toLowerCase().includes('re-deriv') ||
    skillContent.toLowerCase().includes('rederiv') ||
    skillContent.toLowerCase().includes('without re-') ||
    skillContent.toLowerCase().includes('no need to re-') ||
    skillContent.toLowerCase().includes('existing story artefacts') ||
    skillContent.toLowerCase().includes('existing artefacts')
  ),
  'Entry A section must name /tdd and state existing artefacts can be attached without re-deriving'
);

// ── Unit: orient-entry-a-routes-to-discovery-as-outer-anchor ─────────────────
// AC1(d) — routes to /discovery with note to use existing stories as input scope
assert(
  'orient-entry-a-routes-to-discovery-as-outer-anchor',
  // /discovery must appear in Entry A section (we check it appears after "Entry A" in the file)
  (function() {
    const entryAIdx = skillContent.indexOf('Entry A');
    if (entryAIdx < 0) return false;
    const afterEntryA = skillContent.slice(entryAIdx, entryAIdx + 2000);
    return afterEntryA.includes('/discovery') && (
      afterEntryA.toLowerCase().includes('existing stories') ||
      afterEntryA.toLowerCase().includes('input scope') ||
      afterEntryA.toLowerCase().includes('as input') ||
      afterEntryA.toLowerCase().includes('existing story')
    );
  })(),
  'Entry A section must route to /discovery and reference existing stories as input scope'
);

// ── Unit: orient-entry-a-names-detection-signal ──────────────────────────────
// AC2 — routing output names the specific detection signal (what files were found)
assert(
  'orient-entry-a-names-detection-signal',
  (function() {
    const entryAIdx = skillContent.indexOf('Entry A');
    if (entryAIdx < 0) return false;
    const afterEntryA = skillContent.slice(entryAIdx, entryAIdx + 2000);
    return (
      afterEntryA.toLowerCase().includes('found:') ||
      afterEntryA.toLowerCase().includes('detected:') ||
      afterEntryA.toLowerCase().includes('story artefacts') ||
      afterEntryA.toLowerCase().includes('stories/') ||
      afterEntryA.toLowerCase().includes('what was found') ||
      afterEntryA.toLowerCase().includes('detection signal')
    );
  })(),
  'Entry A section must instruct naming the detection signal (what files were found)'
);

// ── Unit: orient-entry-a-signal-allows-operator-correction ───────────────────
// AC2 — operator can confirm or correct the classification (hedged language)
assert(
  'orient-entry-a-signal-allows-operator-correction',
  (function() {
    const entryAIdx = skillContent.indexOf('Entry A');
    if (entryAIdx < 0) return false;
    const afterEntryA = skillContent.slice(entryAIdx, entryAIdx + 2000).toLowerCase();
    return (
      afterEntryA.includes('looks like') ||
      afterEntryA.includes('appears to be') ||
      afterEntryA.includes('detected as') ||
      afterEntryA.includes('this looks') ||
      afterEntryA.includes('seems like') ||
      afterEntryA.includes('classified as')
    );
  })(),
  'Entry A section must use hedged/confirmatory language (e.g. "This looks like Entry A")'
);

// ── Unit: orient-entry-a-nfr-no-false-entry-a-with-discovery-present ─────────
// NFR/AC3 — Entry A detection requires ABSENCE of discovery.md
assert(
  'orient-entry-a-nfr-no-false-entry-a-with-discovery-present',
  (function() {
    const entryAIdx = skillContent.indexOf('Entry A');
    if (entryAIdx < 0) return false;
    const afterEntryA = skillContent.slice(entryAIdx, entryAIdx + 2000).toLowerCase();
    return (
      afterEntryA.includes('no discovery') ||
      afterEntryA.includes('discovery.md') ||
      afterEntryA.includes('discovery not') ||
      afterEntryA.includes('absent') ||
      afterEntryA.includes('not present') ||
      afterEntryA.includes('does not exist') ||
      afterEntryA.includes('no pipeline artefact')
    );
  })(),
  'Entry A detection must be gated on discovery.md being absent'
);

// ── Integration: orient-entry-a-does-not-fire-when-discovery-present ─────────
// NFR/AC3 integration — Entry A is subordinate to discovery-in-progress states
assert(
  'orient-entry-a-does-not-fire-when-discovery-present',
  (function() {
    // Entry A must appear AFTER the discovery-in-progress states (State 2, State 3) in the file
    // or Entry A condition must explicitly exclude repos with discovery.md
    const state2Idx = skillContent.indexOf('State 2');
    const state3Idx = skillContent.indexOf('State 3');
    const entryAIdx = skillContent.indexOf('Entry A');
    if (entryAIdx < 0) return false;
    // Either Entry A appears after discovery states in the routing order,
    // or Entry A explicitly conditions on no discovery.md
    const afterEntryA = skillContent.slice(entryAIdx, entryAIdx + 2000).toLowerCase();
    const hasExplicitExclusion = (
      afterEntryA.includes('no discovery') ||
      afterEntryA.includes('discovery.md') ||
      afterEntryA.includes('discovery not present')
    );
    const hasCorrectOrdering = (state2Idx > 0 && entryAIdx > state2Idx) || (state3Idx > 0 && entryAIdx > state3Idx);
    return hasExplicitExclusion || hasCorrectOrdering;
  })(),
  'Entry A must be subordinate to discovery-in-progress routing states (State 2/3)'
);

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[i2.1-entry-a-story-first] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
