#!/usr/bin/env node
/**
 * check-changelog-readme.js
 *
 * Enforces that CHANGELOG.md (and optionally README.md) are kept in sync
 * whenever substantive pipeline files are changed.
 *
 * HARD BLOCK  — staged changes to skills, templates, copilot-instructions.md,
 *               or scripts/ without a staged change to CHANGELOG.md.
 *
 * ADVISORY    — same trigger, but README.md also not staged (non-blocking).
 *
 * Run:  node .github/scripts/check-changelog-readme.js
 * Used: .git/hooks/pre-commit
 *
 * Zero external dependencies — plain Node.js child_process + fs only.
 */
'use strict';
const { execSync } = require('child_process');

// ── Trigger patterns (relative to repo root) ─────────────────────────────────
// If ANY staged file matches one of these, the CHANGELOG check fires.
const TRIGGER_PATTERNS = [
  /^\.github\/skills\/.+\/SKILL\.md$/,
  /^\.github\/templates\/.+\.md$/,
  /^\.github\/copilot-instructions\.md$/,
  /^scripts\/.+\.(ps1|sh)$/,
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStagedFiles() {
  try {
    return execSync('git diff --cached --name-only', { encoding: 'utf8' })
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);
  } catch (_) {
    return [];
  }
}

function matchesTrigger(file) {
  return TRIGGER_PATTERNS.some(re => re.test(file));
}

// ── Main ──────────────────────────────────────────────────────────────────────
const staged = getStagedFiles();
const substantiveChanges = staged.filter(matchesTrigger);

if (substantiveChanges.length === 0) {
  // Nothing that requires a CHANGELOG entry — pass silently.
  process.exit(0);
}

const changelogStaged = staged.includes('CHANGELOG.md');
const readmeStaged    = staged.includes('README.md');

let failed = false;

if (!changelogStaged) {
  console.error('[changelog-readme] ✗ CHANGELOG.md not staged.');
  console.error('[changelog-readme]   Substantive files changed:');
  substantiveChanges.forEach(f => console.error(`[changelog-readme]     ${f}`));
  console.error('[changelog-readme]   Add a CHANGELOG entry and stage CHANGELOG.md before committing.');
  failed = true;
}

if (!readmeStaged) {
  // Non-blocking advisory only.
  console.warn('[changelog-readme] ⚠  README.md not staged — consider whether the diagram or pipeline text needs updating.');
}

process.exit(failed ? 1 : 0);
