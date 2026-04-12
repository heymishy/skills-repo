#!/usr/bin/env node
/**
 * check-docs-structure.js
 *
 * Enforces that human-readable reference docs and diagram assets live
 * under docs/ (not at repo root).  Catches accidental regression from
 * the repo-tidy restructure introduced in feat/repo-tidy.
 *
 * Checks:
 *   D1 — docs/HANDOFF.md exists
 *   D2 — docs/MODEL-RISK.md exists
 *   D3 — docs/ONBOARDING.md exists
 *   D4 — docs/skill-pipeline-instructions.md exists
 *   D5 — docs/feature-additions.md exists
 *   D6 — docs/diagrams/skills-pipeline-flow.jpg exists
 *   D7 — docs/diagrams/pipeline-vis-example.png exists
 *   D8 — docs/validation-playbook.md exists
 *
 *   R1 — HANDOFF.md must NOT exist at repo root (was moved)
 *   R2 — MODEL-RISK.md must NOT exist at repo root (was moved)
 *   R3 — ONBOARDING.md must NOT exist at repo root (was moved)
 *   R4 — skill-pipeline-instructions.md must NOT exist at repo root (was moved)
 *
 * Run:  node .github/scripts/check-docs-structure.js
 * Used: npm test chain (package.json)
 *
 * Zero external dependencies — plain Node.js fs only.
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');

let passed = 0;
let failed = 0;
const failures = [];

function pass(id, label) {
  passed++;
  console.log(`  ✓ ${id} — ${label}`);
}

function fail(id, label, reason) {
  failed++;
  failures.push({ id, label, reason });
  console.log(`  ✗ ${id} — ${label}`);
  console.log(`    → ${reason}`);
}

console.log('[docs-structure] Checking docs/ layout…');
console.log('');
console.log('  Expected locations:');

// ── D-checks: files must exist at new locations ───────────────────────────────
//
// MANIFEST — when adding a new canonical doc to docs/ or docs/diagrams/, add an
// entry to EXPECTED below.  When removing or renaming a doc that was moved from
// root, update the MUST_NOT_EXIST_AT_ROOT list too.  These lists are the sole
// authoritative registry for the docs/ layout convention.  There is no separate
// manifest file — this array IS the manifest.

const EXPECTED = [
  { id: 'D1', file: 'docs/HANDOFF.md',                        label: 'docs/HANDOFF.md exists' },
  { id: 'D2', file: 'docs/MODEL-RISK.md',                     label: 'docs/MODEL-RISK.md exists' },
  { id: 'D3', file: 'docs/ONBOARDING.md',                     label: 'docs/ONBOARDING.md exists' },
  { id: 'D4', file: 'docs/skill-pipeline-instructions.md',    label: 'docs/skill-pipeline-instructions.md exists' },
  { id: 'D5', file: 'docs/feature-additions.md',              label: 'docs/feature-additions.md exists' },
  { id: 'D6', file: 'docs/diagrams/skills-pipeline-flow.jpg', label: 'docs/diagrams/skills-pipeline-flow.jpg exists' },
  { id: 'D7', file: 'docs/diagrams/pipeline-vis-example.png', label: 'docs/diagrams/pipeline-vis-example.png exists' },
  { id: 'D8', file: 'docs/validation-playbook.md',            label: 'docs/validation-playbook.md exists' },
];

for (const { id, file, label } of EXPECTED) {
  if (fs.existsSync(path.join(root, file))) {
    pass(id, label);
  } else {
    fail(id, label, `File not found: ${file}`);
  }
}

console.log('');
console.log('  Root must not contain moved files:');

// ── R-checks: files must NOT exist at old root locations ──────────────────────

const MUST_NOT_EXIST_AT_ROOT = [
  { id: 'R1', file: 'HANDOFF.md',                       label: 'HANDOFF.md absent from root' },
  { id: 'R2', file: 'MODEL-RISK.md',                    label: 'MODEL-RISK.md absent from root' },
  { id: 'R3', file: 'ONBOARDING.md',                    label: 'ONBOARDING.md absent from root' },
  { id: 'R4', file: 'skill-pipeline-instructions.md',   label: 'skill-pipeline-instructions.md absent from root' },
];

for (const { id, file, label } of MUST_NOT_EXIST_AT_ROOT) {
  if (!fs.existsSync(path.join(root, file))) {
    pass(id, label);
  } else {
    fail(id, label, `File still exists at root: ${file} — run git mv ${file} docs/${file}`);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('');
if (failed > 0) {
  console.error(`[docs-structure] FAIL — ${failed} check(s) failed:\n`);
  for (const f of failures) {
    console.error(`  ${f.id}: ${f.reason}`);
  }
  console.error('\nEnsure all reference docs and diagram assets live under docs/.\n');
  process.exit(1);
}

console.log(`[docs-structure] ${passed} check(s) OK ✓`);
process.exit(0);
