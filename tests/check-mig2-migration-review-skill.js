#!/usr/bin/env node
// check-mig2-migration-review-skill.js
// Tests for mig.2: .github/skills/schema-migration-review/SKILL.md content assertions
// 12 unit + 1 NFR = 13 tests
// Run: node tests/check-mig2-migration-review-skill.js
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT     = path.resolve(__dirname, '..');
const SKILL_MD = path.join(ROOT, '.github', 'skills', 'schema-migration-review', 'SKILL.md');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    process.stdout.write('  ✓ ' + label + '\n');
    passed++;
  } else {
    process.stdout.write('  ✗ FAIL: ' + label + '\n');
    failed++;
  }
}

const skillExists = fs.existsSync(SKILL_MD);
const content     = skillExists ? fs.readFileSync(SKILL_MD, 'utf8') : '';
const lower       = content.toLowerCase();

// ── Unit Tests ────────────────────────────────────────────────────────────────

process.stdout.write('\n[mig.2] Unit tests\n');

// migration-review-skill-file-exists (AC1)
assert(skillExists, 'migration-review-skill-file-exists: .github/skills/schema-migration-review/SKILL.md exists');

// skill-requires-ci-rollback-evidence-for-breaking (AC1)
assert(
  lower.includes('breaking') && lower.includes('ci') && (lower.includes('rollback') || lower.includes('roll back')) && (lower.includes('evidence') || lower.includes('execution')),
  'skill-requires-ci-rollback-evidence-for-breaking: SKILL.md requires CI-tier rollback execution evidence for breaking migrations');

// skill-defines-acceptable-rollback-evidence-formats (AC1)
assert(
  lower.includes('log snippet') || lower.includes('test result') || lower.includes('attestation') || lower.includes('operator attestation'),
  'skill-defines-acceptable-rollback-evidence-formats: SKILL.md describes acceptable rollback evidence formats (log snippet / test result / attestation)');

// skill-accepts-declaration-for-additive-rollback (AC2)
assert(
  lower.includes('additive') && lower.includes('declaration') && (lower.includes('sufficient') || lower.includes('not yet executed') || lower.includes('not required')),
  'skill-accepts-declaration-for-additive-rollback: SKILL.md accepts declaration as sufficient for additive-only rollback evidence');

// skill-distinguishes-evidence-requirements-by-classification (AC2)
assert(
  lower.includes('breaking') && lower.includes('additive') &&
  (lower.includes('execution required') || lower.includes('required for breaking') || lower.includes('execution evidence is required')),
  'skill-distinguishes-evidence-requirements-by-classification: SKILL.md distinguishes evidence requirements between breaking and additive-only');

// skill-blocks-pass-on-blank-staging-privacy (AC3)
assert(
  (lower.includes('staging') && lower.includes('snapshot') && lower.includes('blank') || lower.includes('staging-snapshot-privacy') || lower.includes('staging snapshot privacy')) &&
  (lower.includes('pass') || lower.includes('block') || lower.includes('cannot')),
  'skill-blocks-pass-on-blank-staging-privacy: SKILL.md blocks PASS when staging-snapshot-privacy is blank/missing');

// skill-staging-privacy-check-tied-to-staging-scope (AC3)
assert(
  (lower.includes('staging') && (lower.includes('in scope') || lower.includes('not applicable') || lower.includes('when staging'))),
  'skill-staging-privacy-check-tied-to-staging-scope: staging privacy check is conditional on staging tier being in scope');

// skill-coherence-check-flags-breaking-in-additive (AC4)
assert(
  (lower.includes('drop column') || lower.includes('alter column')) && lower.includes('additive'),
  'skill-coherence-check-flags-breaking-in-additive: SKILL.md flags DROP COLUMN or ALTER COLUMN TYPE in additive-only artefact');

// skill-coherence-check-produces-finding (AC4)
assert(
  lower.includes('coherence') || (lower.includes('classification') && lower.includes('finding')),
  'skill-coherence-check-produces-finding: classification coherence mismatch produces a finding');

// skill-specifies-pass-artefact-path (AC5)
assert(
  content.includes('migration-review.md') || (lower.includes('migrations/') && lower.includes('-migration-review')),
  'skill-specifies-pass-artefact-path: SKILL.md specifies migration-review.md output path');

// skill-pass-requires-zero-unresolved-findings (AC5)
assert(
  lower.includes('zero') && lower.includes('finding') || (lower.includes('no unresolved') && lower.includes('finding')) || (lower.includes('zero unresolved')),
  'skill-pass-requires-zero-unresolved-findings: SKILL.md states zero unresolved findings → PASS artefact');

// skill-no-hardcoded-tool-cli-references (ADR-004)
{
  const forbiddenCLIs = ['alembic downgrade', 'flyway repair', 'redis-cli', 'psql -c'];
  const hasRequired = forbiddenCLIs.some(function(cli) { return lower.includes(cli); });
  assert(!hasRequired, 'skill-no-hardcoded-tool-cli-references: no required tool CLI references (ADR-004)');
}

// ── NFR Tests ─────────────────────────────────────────────────────────────────

process.stdout.write('\n[mig.2] NFR tests\n');

// skill-checklist-includes-credentials-check (NFR-SEC)
assert(
  (lower.includes('credential') || lower.includes('connection string') || lower.includes('password')) &&
  (lower.includes('checklist') || lower.includes('check:') || lower.includes('- [') || lower.includes('mandatory')),
  'skill-checklist-includes-credentials-check: mandatory credentials check in review checklist (NFR-SEC)');

// ── Summary ───────────────────────────────────────────────────────────────────

process.stdout.write('\n[mig.2] Results: ' + passed + ' passed, ' + failed + ' failed\n');
if (failed > 0) process.exit(1);
