#!/usr/bin/env node
// check-sro1-skill-routing.js — governance tests for src.1 (skill routing CLI tools integration)
// Covers T1–T8 (AC1–AC4) and T-NFR1a, T-NFR1b (AC5)
// Tests FAIL until .github/skills/workflow/SKILL.md and .github/skills/improve/SKILL.md
// are updated to include the CLI observability routing hooks — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT          = path.join(__dirname, '..');
const WORKFLOW_SKILL = path.join(ROOT, '.github', 'skills', 'workflow', 'SKILL.md');
const IMPROVE_SKILL  = path.join(ROOT, '.github', 'skills', 'improve', 'SKILL.md');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function readFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

// ── T1 — workflow SKILL.md contains generate-status-report.js ────────────────
console.log('\n[sro1] T1 — workflow SKILL.md references generate-status-report.js');
{
  const text = readFile(WORKFLOW_SKILL);
  assert(text !== null, 'T1a: .github/skills/workflow/SKILL.md exists');
  assert(text !== null && text.includes('generate-status-report.js'),
    'T1b: workflow SKILL.md contains "generate-status-report.js"');
}

// ── T2 — workflow SKILL.md references --daily flag ───────────────────────────
console.log('\n[sro1] T2 — workflow SKILL.md references --daily flag');
{
  const text = readFile(WORKFLOW_SKILL);
  if (!text) {
    assert(false, 'T2: cannot check (file missing)');
  } else {
    assert(text.includes('--daily'),
      'T2: workflow SKILL.md contains "--daily"');
  }
}

// ── T3 — workflow SKILL.md references --weekly flag ──────────────────────────
console.log('\n[sro1] T3 — workflow SKILL.md references --weekly flag');
{
  const text = readFile(WORKFLOW_SKILL);
  if (!text) {
    assert(false, 'T3: cannot check (file missing)');
  } else {
    assert(text.includes('--weekly'),
      'T3: workflow SKILL.md contains "--weekly"');
  }
}

// ── T4 — workflow SKILL.md has status report trigger phrases ─────────────────
console.log('\n[sro1] T4 — workflow SKILL.md includes status report trigger routing phrases');
{
  const text = readFile(WORKFLOW_SKILL);
  if (!text) {
    assert(false, 'T4: cannot check (file missing)');
  } else {
    const lower = text.toLowerCase();
    const hasTrigger =
      lower.includes('daily report') ||
      lower.includes('weekly report') ||
      lower.includes('status report') ||
      lower.includes('pipeline status report');
    assert(hasTrigger,
      'T4: workflow SKILL.md contains at least one status report trigger phrase');
  }
}

// ── T5 — improve SKILL.md contains record-benefit-comparison.js ──────────────
console.log('\n[sro1] T5 — improve SKILL.md references record-benefit-comparison.js');
{
  const text = readFile(IMPROVE_SKILL);
  assert(text !== null, 'T5a: .github/skills/improve/SKILL.md exists');
  assert(text !== null && text.includes('record-benefit-comparison.js'),
    'T5b: improve SKILL.md contains "record-benefit-comparison.js"');
}

// ── T6 — improve SKILL.md references --feature flag ──────────────────────────
console.log('\n[sro1] T6 — improve SKILL.md references --feature flag');
{
  const text = readFile(IMPROVE_SKILL);
  if (!text) {
    assert(false, 'T6: cannot check (file missing)');
  } else {
    assert(text.includes('--feature'),
      'T6: improve SKILL.md contains "--feature"');
  }
}

// ── T7 — improve SKILL.md references EXP-001 or Benefit Measurement ──────────
console.log('\n[sro1] T7 — improve SKILL.md references EXP-001 or Benefit Measurement');
{
  const text = readFile(IMPROVE_SKILL);
  if (!text) {
    assert(false, 'T7: cannot check (file missing)');
  } else {
    const lower = text.toLowerCase();
    const hasRef =
      text.includes('EXP-001') ||
      lower.includes('benefit measurement');
    assert(hasRef,
      'T7: improve SKILL.md contains "EXP-001" or "benefit measurement"');
  }
}

// ── T8 — improve SKILL.md benefit comparison section is non-blocking ──────────
console.log('\n[sro1] T8 — improve SKILL.md benefit comparison section is explicitly non-blocking');
{
  const text = readFile(IMPROVE_SKILL);
  if (!text) {
    assert(false, 'T8: cannot check (file missing)');
  } else if (!text.includes('record-benefit-comparison.js')) {
    assert(false, 'T8: record-benefit-comparison.js not found — cannot check non-blocking language');
  } else {
    const lower = text.toLowerCase();
    const hasNonBlocking =
      lower.includes('defer') ||
      lower.includes('skip') ||
      lower.includes('optional') ||
      lower.includes('non-blocking');
    assert(hasNonBlocking,
      'T8: improve SKILL.md contains non-blocking language (defer/skip/optional/non-blocking) near benefit comparison');
  }
}

// ── T-NFR1a — workflow SKILL.md uses correct node invocation prefix ───────────
console.log('\n[sro1] T-NFR1a — workflow SKILL.md uses "node scripts/generate-status-report.js" invocation');
{
  const text = readFile(WORKFLOW_SKILL);
  if (!text) {
    assert(false, 'T-NFR1a: cannot check (file missing)');
  } else {
    assert(text.includes('node scripts/generate-status-report.js'),
      'T-NFR1a: workflow SKILL.md contains "node scripts/generate-status-report.js"');
  }
}

// ── T-NFR1b — improve SKILL.md uses correct node invocation prefix ────────────
console.log('\n[sro1] T-NFR1b — improve SKILL.md uses "node scripts/record-benefit-comparison.js" invocation');
{
  const text = readFile(IMPROVE_SKILL);
  if (!text) {
    assert(false, 'T-NFR1b: cannot check (file missing)');
  } else {
    assert(text.includes('node scripts/record-benefit-comparison.js'),
      'T-NFR1b: improve SKILL.md contains "node scripts/record-benefit-comparison.js"');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[sro1] Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
