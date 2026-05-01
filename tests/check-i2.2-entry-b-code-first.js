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

console.log('[i2.2-entry-b-code-first] Running tests...');

// ── Unit: orient-entry-b-routing-block-present ───────────────────────────────
// AC1 prerequisite — Entry B routing logic exists in SKILL.md
assert(
  'orient-entry-b-routing-block-present',
  skillContent.includes('Entry B'),
  '"Entry B" not found in orient SKILL.md'
);

// ── Unit: orient-entry-b-names-state-code-first-brownfield ───────────────────
// AC1(a) — output names state "Entry B — code-first brownfield"
assert(
  'orient-entry-b-names-state-code-first-brownfield',
  skillContent.includes('Entry B') && (
    skillContent.includes('code-first brownfield') ||
    skillContent.includes('code-first') ||
    skillContent.includes('Entry B — code-first')
  ),
  'Entry B canonical label "code-first brownfield" not found'
);

// ── Unit: orient-entry-b-explains-reverse-engineer ───────────────────────────
// AC1(b) — explains /reverse-engineer and extraction of business rules or design
assert(
  'orient-entry-b-explains-reverse-engineer',
  (function() {
    const entryBIdx = skillContent.indexOf('Entry B');
    if (entryBIdx < 0) return false;
    const afterEntryB = skillContent.slice(entryBIdx, entryBIdx + 2000);
    return afterEntryB.includes('/reverse-engineer') && (
      afterEntryB.toLowerCase().includes('business rule') ||
      afterEntryB.toLowerCase().includes('extract') ||
      afterEntryB.toLowerCase().includes('artefact') ||
      afterEntryB.toLowerCase().includes('design')
    );
  })(),
  'Entry B section must reference /reverse-engineer and extraction of rules/design'
);

// ── Unit: orient-entry-b-shows-full-path ─────────────────────────────────────
// AC1(c) — lays out full path: /reverse-engineer → /discovery → /benefit-metric → /definition
assert(
  'orient-entry-b-shows-full-path',
  (function() {
    const entryBIdx = skillContent.indexOf('Entry B');
    if (entryBIdx < 0) return false;
    const afterEntryB = skillContent.slice(entryBIdx, entryBIdx + 2000);
    return (
      afterEntryB.includes('/reverse-engineer') &&
      afterEntryB.includes('/discovery') &&
      afterEntryB.includes('/benefit-metric') &&
      afterEntryB.includes('/definition')
    );
  })(),
  'Entry B section must show full path: /reverse-engineer → /discovery → /benefit-metric → /definition'
);

// ── Unit: orient-entry-b-names-detection-signal ──────────────────────────────
// AC2 — routing output names specific detection signal
assert(
  'orient-entry-b-names-detection-signal',
  (function() {
    const entryBIdx = skillContent.indexOf('Entry B');
    if (entryBIdx < 0) return false;
    const afterEntryB = skillContent.slice(entryBIdx, entryBIdx + 2000).toLowerCase();
    return (
      afterEntryB.includes('found:') ||
      afterEntryB.includes('detected:') ||
      afterEntryB.includes('src/') ||
      afterEntryB.includes('app/') ||
      afterEntryB.includes('lib/') ||
      afterEntryB.includes('code director') ||
      afterEntryB.includes('application file') ||
      afterEntryB.includes('detection signal')
    );
  })(),
  'Entry B section must instruct naming the detection signal (code directories found)'
);

// ── Unit: orient-entry-b-signal-allows-operator-correction ───────────────────
// AC2 — operator can verify and correct the classification (hedged language)
assert(
  'orient-entry-b-signal-allows-operator-correction',
  (function() {
    const entryBIdx = skillContent.indexOf('Entry B');
    if (entryBIdx < 0) return false;
    const afterEntryB = skillContent.slice(entryBIdx, entryBIdx + 2000).toLowerCase();
    return (
      afterEntryB.includes('looks like') ||
      afterEntryB.includes('appears to be') ||
      afterEntryB.includes('detected as') ||
      afterEntryB.includes('this looks') ||
      afterEntryB.includes('seems like') ||
      afterEntryB.includes('classified as')
    );
  })(),
  'Entry B section must use hedged/confirmatory language (e.g. "This looks like Entry B")'
);

// ── Unit: orient-entry-b-entry-a-takes-precedence ────────────────────────────
// AC3 — Entry A fires before Entry B when story artefacts AND code present
assert(
  'orient-entry-b-entry-a-takes-precedence',
  (function() {
    const entryBIdx = skillContent.indexOf('Entry B');
    if (entryBIdx < 0) return false;
    const afterEntryB = skillContent.slice(entryBIdx, entryBIdx + 2000).toLowerCase();
    return (
      afterEntryB.includes('entry a') ||
      afterEntryB.includes('story artefact') ||
      afterEntryB.includes('no artefact') ||
      afterEntryB.includes('pipeline artefact') ||
      afterEntryB.includes('precedence') ||
      afterEntryB.includes('takes priority')
    );
  })(),
  'Entry B must state Entry A takes precedence / condition on no story artefacts present'
);

// ── Unit: orient-entry-b-nfr-config-files-not-app-logic ──────────────────────
// NFR — config-only files do NOT trigger Entry B
assert(
  'orient-entry-b-nfr-config-files-not-app-logic',
  (function() {
    const entryBIdx = skillContent.indexOf('Entry B');
    if (entryBIdx < 0) return false;
    const afterEntryB = skillContent.slice(entryBIdx, entryBIdx + 2000).toLowerCase();
    return (
      afterEntryB.includes('.yml') ||
      afterEntryB.includes('.json') ||
      afterEntryB.includes('dockerfile') ||
      afterEntryB.includes('config') ||
      afterEntryB.includes('infrastructure') ||
      afterEntryB.includes('.js') ||
      afterEntryB.includes('.ts') ||
      afterEntryB.includes('application logic') ||
      afterEntryB.includes('source file')
    );
  })(),
  'Entry B must distinguish application logic files from config-only files'
);

// ── Integration: orient-entry-b-entry-a-priority-order-enforced ──────────────
// AC3 integration — routing priority: Entry A before Entry B; conditions mutually exclusive
assert(
  'orient-entry-b-entry-a-priority-order-enforced',
  (function() {
    const entryBIdx = skillContent.indexOf('Entry B');
    if (entryBIdx < 0) return false;
    const afterEntryB = skillContent.slice(entryBIdx, entryBIdx + 2000).toLowerCase();
    // Entry B must require absence of story artefacts OR explicitly defer to Entry A
    return (
      afterEntryB.includes('no story artefact') ||
      afterEntryB.includes('no pipeline artefact') ||
      afterEntryB.includes('artefacts/ does not exist') ||
      afterEntryB.includes('empty artefacts') ||
      afterEntryB.includes('entry a takes precedence') ||
      afterEntryB.includes('entry a') ||
      afterEntryB.includes('story artefacts are present') ||
      afterEntryB.includes('no artefact')
    );
  })(),
  'Entry B conditions must be mutually exclusive with Entry A; Entry B must require absence of story artefacts'
);

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[i2.2-entry-b-code-first] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
