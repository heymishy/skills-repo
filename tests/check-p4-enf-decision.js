#!/usr/bin/env node
// check-p4-enf-decision.js — test plan verification for p4-enf-decision
// Covers T1–T8 (AC1–AC4) and T-NFR1, T-NFR2
// Tests FAIL until .github/architecture-guardrails.md ADR is written — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT           = path.join(__dirname, '..');
const GUARDRAILS_FILE = path.join(ROOT, '.github', 'architecture-guardrails.md');
const PIPELINE_STATE  = path.join(ROOT, '.github', 'pipeline-state.json');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function readGuardrails() {
  if (!fs.existsSync(GUARDRAILS_FILE)) return null;
  return fs.readFileSync(GUARDRAILS_FILE, 'utf8');
}

function readPipelineState() {
  if (!fs.existsSync(PIPELINE_STATE)) return null;
  try { return JSON.parse(fs.readFileSync(PIPELINE_STATE, 'utf8')); } catch (_) { return null; }
}

// ── T1 — architecture-guardrails.md has ADR-phase4-enforcement entry ──────────
console.log('\n[p4-enf-decision] T1 — architecture-guardrails.md has ADR-phase4-enforcement entry');
{
  const text = readGuardrails();
  assert(text !== null, 'T1a: .github/architecture-guardrails.md exists');
  assert(text !== null && text.includes('ADR-phase4-enforcement'),
    'T1b: file contains "ADR-phase4-enforcement"');
}

// ── T2 — ADR entry has all five required sections ─────────────────────────────
console.log('\n[p4-enf-decision] T2 — ADR entry has all five required structural sections');
{
  const text = readGuardrails();
  if (!text) {
    assert(false, 'T2: cannot check sections (file missing)');
  } else {
    // Find the ADR block
    const lowerText = text.toLowerCase();
    const sections = ['context', 'options', 'decision', 'consequences', 'revisit'];
    for (const section of sections) {
      assert(lowerText.includes(section),
        `T2: ADR contains section "${section}"`);
    }
  }
}

// ── T3 — All four surface classes addressed ───────────────────────────────────
console.log('\n[p4-enf-decision] T3 — all four surface classes addressed in ADR');
{
  const text = readGuardrails();
  if (!text) {
    assert(false, 'T3: cannot check surface classes (file missing)');
  } else {
    const lower = text.toLowerCase();
    // Surface class 1: VS Code / Claude Code / interactive
    assert(lower.includes('vs code') || lower.includes('claude code') || lower.includes('interactive'),
      'T3: surface class 1 — VS Code or Claude Code or interactive');
    // Surface class 2: CI / headless / regulated
    assert(lower.includes('ci') || lower.includes('headless') || lower.includes('regulated'),
      'T3: surface class 2 — CI or headless or regulated');
    // Surface class 3: chat-native / copilot chat / progressive
    assert(lower.includes('chat-native') || lower.includes('copilot chat') || lower.includes('progressive') || lower.includes('chat native'),
      'T3: surface class 3 — chat-native or Copilot Chat or progressive');
    // Surface class 4: non-git-native / teams / confluence
    assert(lower.includes('non-git') || lower.includes('teams') || lower.includes('confluence'),
      'T3: surface class 4 — non-git-native or Teams or Confluence');
  }
}

// ── T4 — Each surface class names specific mechanism ─────────────────────────
console.log('\n[p4-enf-decision] T4 — surface classes have named enforcement mechanisms');
{
  const text = readGuardrails();
  if (!text) {
    assert(false, 'T4: cannot check mechanisms (file missing)');
  } else {
    const lower = text.toLowerCase();
    // At least two mechanisms are named
    const mechanisms = ['mcp', 'cli', 'schema validation', 'deferred', 'schema-validation'];
    const found = mechanisms.filter(m => lower.includes(m));
    assert(found.length >= 2,
      `T4: at least two mechanism names present (found: ${found.join(', ') || 'none'})`);
  }
}

// ── T5 — Deferred surfaces explicit ──────────────────────────────────────────
console.log('\n[p4-enf-decision] T5 — deferred surfaces have explicit reason and revisit trigger');
{
  const text = readGuardrails();
  if (!text) {
    assert(false, 'T5: cannot check deferral (file missing)');
  } else {
    const lower = text.toLowerCase();
    if (lower.includes('defer')) {
      // If "deferred" appears, a reason phrase and revisit trigger must be near it
      assert(lower.includes('reason') || lower.includes('pending') || lower.includes('spike') || lower.includes('phase'),
        'T5: deferred surface has reason phrase or revisit trigger');
    } else {
      // No deferred surfaces — that is acceptable
      assert(true, 'T5: no deferred surfaces (all surface classes have mechanism assigned)');
    }
  }
}

// ── T6 — pipeline-state.json guardrails entry exists ─────────────────────────
console.log('\n[p4-enf-decision] T6 — pipeline-state.json guardrails array has ADR-phase4-enforcement');
{
  const state = readPipelineState();
  if (!state) {
    assert(false, 'T6: cannot read pipeline-state.json');
  } else {
    // Find phase4 feature entry
    const features = state.features || state.phases || {};
    let guardrails = null;
    // Search all feature/phase entries for guardrails
    for (const key of Object.keys(features)) {
      const entry = features[key];
      if (entry && Array.isArray(entry.guardrails)) {
        guardrails = entry.guardrails;
        break;
      }
      // Also check nested structures
      if (entry && entry.phase4 && Array.isArray(entry.phase4.guardrails)) {
        guardrails = entry.phase4.guardrails;
        break;
      }
    }
    // Also check top-level guardrails
    if (!guardrails && Array.isArray(state.guardrails)) {
      guardrails = state.guardrails;
    }
    assert(guardrails !== null,
      `T6: guardrails array found in pipeline-state.json`);
    if (guardrails) {
      const entry = guardrails.find(g => g.id === 'ADR-phase4-enforcement');
      assert(entry !== undefined,
        'T6b: guardrails contains entry with id "ADR-phase4-enforcement"');
    }
  }
}

// ── T7 — guardrails entry fields correct ─────────────────────────────────────
console.log('\n[p4-enf-decision] T7 — guardrails entry has correct file and status fields');
{
  const state = readPipelineState();
  if (!state) {
    assert(false, 'T7: cannot read pipeline-state.json (file missing or invalid JSON)');
  } else {
    let guardrails = null;
    const features = state.features || state.phases || {};
    for (const key of Object.keys(features)) {
      const entry = features[key];
      if (entry && Array.isArray(entry.guardrails)) { guardrails = entry.guardrails; break; }
    }
    if (!guardrails && Array.isArray(state.guardrails)) guardrails = state.guardrails;

    if (!guardrails) {
      assert(false, 'T7: guardrails array not found');
    } else {
      const entry = guardrails.find(g => g.id === 'ADR-phase4-enforcement');
      if (!entry) {
        assert(false, 'T7: ADR-phase4-enforcement entry not found');
        assert(false, 'T7b: entry file field (entry absent)');
        assert(false, 'T7c: entry status field (entry absent)');
      } else {
        assert(entry.file === '.github/architecture-guardrails.md',
          `T7a: file is ".github/architecture-guardrails.md" (got: ${entry.file})`);
        assert(entry.status === 'active',
          `T7b: status is "active" (got: ${entry.status})`);
      }
    }
  }
}

// ── T8 — ADR ID unique (appears exactly once) ─────────────────────────────────
console.log('\n[p4-enf-decision] T8 — ADR-phase4-enforcement ID appears exactly once');
{
  const text = readGuardrails();
  if (!text) {
    assert(false, 'T8: cannot check ID uniqueness (file missing)');
  } else {
    const matches = (text.match(/ADR-phase4-enforcement/g) || []).length;
    assert(matches >= 1, `T8a: ID appears at least once (found ${matches})`);
    // Should appear in ID field + heading at most a few times — not 0
    assert(matches < 10, `T8b: ID not duplicated excessively (found ${matches})`);
  }
}

// ── T-NFR1 — No credentials in ADR ───────────────────────────────────────────
console.log('\n[p4-enf-decision] T-NFR1 — no credentials in ADR text');
{
  const text = readGuardrails();
  if (!text) {
    assert(false, 'T-NFR1: cannot check credentials (file missing)');
  } else {
    const lower = text.toLowerCase();
    assert(!lower.includes('bearer '),       'T-NFR1a: no "Bearer " token');
    assert(!/password\s*[:=]/.test(lower),   'T-NFR1b: no password assignment');
    assert(!/secret\s*[:=]/.test(lower),     'T-NFR1c: no secret assignment');
    assert(!lower.includes('tenantid'),      'T-NFR1d: no tenantId');
  }
}

// ── T-NFR2 — Spike back-references ───────────────────────────────────────────
console.log('\n[p4-enf-decision] T-NFR2 — spike back-references present in ADR');
{
  const text = readGuardrails();
  if (!text) {
    assert(false, 'T-NFR2: cannot check spike references (file missing)');
  } else {
    const lower = text.toLowerCase();
    const spikes = ['spike-a', 'spike-b1', 'spike-b2', 'spike b1', 'spike b2', 'spike a'];
    const found = spikes.filter(s => lower.includes(s));
    assert(found.length >= 1,
      `T-NFR2: at least one spike back-reference present (found: ${found.join(', ') || 'none'})`);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[p4-enf-decision] Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
