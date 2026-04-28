'use strict';
/**
 * Tests for asd.1 — audit gate story dispatch cross-check
 * Tests: T1–T9  |  Expected baseline: 0/9 passing (RED)
 * extractStorySlug() and buildDispatchNote() do not yet exist in scripts/extract-pr-slug.js
 */

const path = require('path');
const SCRIPT = path.resolve(__dirname, '../scripts/extract-pr-slug.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    failed++;
  }
}

let mod;
try {
  mod = require(SCRIPT);
} catch (e) {
  console.error('Cannot require scripts/extract-pr-slug.js:', e.message);
  process.exit(1);
}

const { extractStorySlug, buildDispatchNote } = mod;

const FEATURE = '2026-04-24-platform-onboarding-distribution';

// ── T1: extractStorySlug from backtick-wrapped stories/ path ──
try {
  const body = `| Story | \`artefacts/${FEATURE}/stories/p11.6-start-skill.md\` |`;
  const result = extractStorySlug(body, FEATURE);
  assert(result === 'p11.6', `T1: backtick-wrapped stories/ path → "p11.6" (got ${JSON.stringify(result)})`);
} catch (e) {
  assert(false, `T1: threw unexpectedly — ${e.message}`);
}

// ── T2: extractStorySlug from plain (non-backtick) stories/ path ──
try {
  const body = `See artefacts/${FEATURE}/stories/sar.1-audit-record-slug-fix.md for context`;
  const result = extractStorySlug(body, FEATURE);
  assert(result === 'sar.1', `T2: plain stories/ path → "sar.1" (got ${JSON.stringify(result)})`);
} catch (e) {
  assert(false, `T2: threw unexpectedly — ${e.message}`);
}

// ── T3: returns "" when no stories/ path for the given feature ──
try {
  const body = `| Discovery | \`artefacts/${FEATURE}/\` |`;
  const result = extractStorySlug(body, FEATURE);
  assert(result === '', `T3: no stories/ path → "" (got ${JSON.stringify(result)})`);
} catch (e) {
  assert(false, `T3: threw unexpectedly — ${e.message}`);
}

// ── T4: returns "" when stories/ path is for a different feature ──
try {
  const body = `| Story | \`artefacts/2026-04-23-ci-artefact-attachment/stories/caa.1-collect-flag.md\` |`;
  const result = extractStorySlug(body, FEATURE);
  assert(result === '', `T4: different feature slug → "" (got ${JSON.stringify(result)})`);
} catch (e) {
  assert(false, `T4: threw unexpectedly — ${e.message}`);
}

// ── T5: null body does not throw ──
try {
  const result = extractStorySlug(null, FEATURE);
  assert(result === '', `T5: null body → "" (got ${JSON.stringify(result)})`);
} catch (e) {
  assert(false, `T5: threw on null body — ${e.message}`);
}

// ── T6: empty body does not throw ──
try {
  const result = extractStorySlug('', FEATURE);
  assert(result === '', `T6: empty body → "" (got ${JSON.stringify(result)})`);
} catch (e) {
  assert(false, `T6: threw on empty body — ${e.message}`);
}

// ── T7: buildDispatchNote for verified dispatch ──
try {
  const note = buildDispatchNote('verified', 'p11.6', 'https://github.com/heymishy/skills-repo/issues/207');
  assert(
    note.includes('Dispatch verified') && note.includes('✅') && note.includes('Issue #207'),
    `T7: verified → contains "Dispatch verified", "✅", "Issue #207" (got ${JSON.stringify(note)})`
  );
} catch (e) {
  assert(false, `T7: threw unexpectedly — ${e.message}`);
}

// ── T8: buildDispatchNote for story not found ──
try {
  const note = buildDispatchNote('not-found', 'p11.6');
  assert(
    note.includes('⚠️') && note.includes('not found in pipeline-state'),
    `T8: not-found → contains "⚠️" and "not found in pipeline-state" (got ${JSON.stringify(note)})`
  );
} catch (e) {
  assert(false, `T8: threw unexpectedly — ${e.message}`);
}

// ── T9: buildDispatchNote for no dispatch record ──
try {
  const note = buildDispatchNote('no-dispatch', 'p11.6');
  assert(
    note.includes('⚠️') && note.includes('No dispatch record'),
    `T9: no-dispatch → contains "⚠️" and "No dispatch record" (got ${JSON.stringify(note)})`
  );
} catch (e) {
  assert(false, `T9: threw unexpectedly — ${e.message}`);
}

// ── Summary ──
console.log(`\nasd.1 story dispatch cross-check: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
