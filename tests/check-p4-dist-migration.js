#!/usr/bin/env node
// check-p4-dist-migration.js — test plan verification for p4-dist-migration
// Covers T1–T8 (AC1–AC4) and T-NFR1, T-NFR2
// Tests FAIL until docs/migration-guide.md is written — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT  = path.join(__dirname, '..');
const GUIDE = path.join(ROOT, 'docs', 'migration-guide.md');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function readGuide() {
  if (!fs.existsSync(GUIDE)) return null;
  return fs.readFileSync(GUIDE, 'utf8');
}

// ── AC1 — Guide exists and has required sections ──────────────────────────────
console.log('\n[p4-dist-migration] AC1 — migration guide exists and has pre-migration checklist');

// T1 — docs/migration-guide.md exists
{
  assert(fs.existsSync(GUIDE), 'T1: docs/migration-guide.md exists');
}

const content = readGuide();

// T2 — Guide has section heading with "pre-migration" or "checklist"
{
  if (!content) {
    assert(false, 'T2: guide has pre-migration checklist section (file missing)');
  } else {
    const HEADING_RE = /^##?\s+.*(pre.?migration|checklist)/im;
    assert(HEADING_RE.test(content),
      'T2: guide has a heading containing "pre-migration" or "checklist"');
  }
}

// ── AC2 — Artefact history preserved ─────────────────────────────────────────
console.log('\n[p4-dist-migration] AC2 — guide explains artefact preservation steps');

// T5 — "abandon" or "custom" appears near decision context
{
  if (!content) {
    assert(false, 'T5: guide documents custom content fate (file missing)');
  } else {
    const CUSTOM_RE = /\babandon\b|\bcustom skill\b|\bcustom content\b|\bfork.{0,40}decision\b|\bmodified.{0,50}fate\b/i;
    assert(CUSTOM_RE.test(content),
      'T5: guide documents custom skill / abandoned fork decision (mentions "abandon", "custom skill", or equivalent)');
  }
}

// ── AC3 — Verify step is final ────────────────────────────────────────────────
console.log('\n[p4-dist-migration] AC3 — skills-repo verify appears as final confirmation step');

// T3 — "skills-repo verify" appears after main migration steps
{
  if (!content) {
    assert(false, 'T3: skills-repo verify final step (file missing)');
  } else {
    const idx = content.indexOf('skills-repo verify');
    const altIdx = content.indexOf('skills repo verify');
    const found = idx !== -1 || altIdx !== -1;
    assert(found, 'T3a: "skills-repo verify" appears in guide');
    // Check that it appears after the word "step" or numbered item or "#" heading
    // Acceptable: any placement as long as "verify" appears after install/migration steps
    if (found) {
      const verifyIdx = Math.max(idx, altIdx);
      const beforeVerify = content.substring(0, verifyIdx);
      const INSTALL_RE = /skills-repo init|skills.repo install|skills_upstream/i;
      assert(INSTALL_RE.test(beforeVerify),
        'T3b: install/config step appears before verify step');
    }
  }
}

// T7 — "verify" appears after main install steps (confirm-and-verify)
{
  if (!content) {
    assert(false, 'T7: confirm-and-verify sequence (file missing)');
  } else {
    // verify must follow install or pin instructions
    const installIdx = content.search(/skills.repo (init|install|pin)/i);
    const verifyIdx  = content.search(/skills.repo verify/i);
    if (installIdx === -1) {
      assert(false, 'T7a: guide contains install/pin command before verify');
    } else if (verifyIdx === -1) {
      assert(false, 'T7b: guide contains verify step after install');
    } else {
      assert(verifyIdx > installIdx,
        `T7: verify step (char ${verifyIdx}) appears after install step (char ${installIdx})`);
    }
  }
}

// ── AC4 — skills_upstream config step present ────────────────────────────────
console.log('\n[p4-dist-migration] AC4 — skills_upstream config step documented');

// T4 — "skills_upstream" appears in guide
{
  if (!content) {
    assert(false, 'T4: skills_upstream config step (file missing)');
  } else {
    assert(content.includes('skills_upstream'),
      'T4: guide contains "skills_upstream" config key reference');
  }
}

// T6 — Spike C cross-reference present
{
  if (!content) {
    assert(false, 'T6: Spike C reference (file missing)');
  } else {
    const SPIKE_C_RE = /spike.?c|spike c/i;
    assert(SPIKE_C_RE.test(content),
      'T6: guide references Spike C (sidecar path decision)');
  }
}

// ── NFR ───────────────────────────────────────────────────────────────────────
console.log('\n[p4-dist-migration] NFR — no credentials instructed; decisions.md referenced');

// T8 — No "git add" adjacent to token/password/secret/tenantId
{
  if (!content) {
    assert(false, 'T8: credential-adjacent git add check (file missing)');
  } else {
    const lines = content.split('\n');
    let violation = null;
    const CRED_RE = /token|password|secret|tenantId/i;
    for (let i = 0; i < lines.length; i++) {
      if (/git add/i.test(lines[i])) {
        // Check ±3 lines around it
        const window = lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 4)).join('\n');
        if (CRED_RE.test(window)) {
          violation = `Line ${i + 1}: ${lines[i].trim()}`;
          break;
        }
      }
    }
    assert(violation === null,
      `T8: no "git add" within 3 lines of credential keyword (violation: ${JSON.stringify(violation)})`);
  }
}

// T-NFR1 — No UUID-shaped strings or Bearer tokens outside code blocks
{
  if (!content) {
    assert(false, 'T-NFR1: UUID/Bearer check (file missing)');
  } else {
    // Strip fenced code blocks before scanning
    const stripped = content.replace(/```[\s\S]*?```/g, '');
    const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;
    const BEARER_RE = /Bearer\s+[A-Za-z0-9._-]{10,}/;
    assert(!UUID_RE.test(stripped),
      'T-NFR1a: no UUID-shaped strings in guide outside code blocks');
    assert(!BEARER_RE.test(stripped),
      'T-NFR1b: no Bearer token strings in guide outside code blocks');
  }
}

// T-NFR2 — "decisions.md" appears in guide
{
  if (!content) {
    assert(false, 'T-NFR2: decisions.md reference (file missing)');
  } else {
    assert(content.includes('decisions.md'),
      'T-NFR2: guide references decisions.md for migration decision record');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[check-p4-dist-migration] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
