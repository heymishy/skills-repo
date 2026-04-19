#!/usr/bin/env node
// check-p4-nta-artefact-parity.js — test plan verification for p4-nta-artefact-parity
// Covers T1–T8, T-NFR1, T-NFR2
// Tests FAIL until src/teams-bot/artefact-assembler.js is implemented — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const ASSEMBLER  = path.join(ROOT, 'src', 'teams-bot', 'artefact-assembler.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function loadModule() {
  if (!fs.existsSync(ASSEMBLER)) return null;
  try {
    delete require.cache[require.resolve(ASSEMBLER)];
    return require(ASSEMBLER);
  } catch (_) { return null; }
}

// A complete session fixture with all required discovery fields answered
const COMPLETE_SESSION = {
  featureSlug: 'test-feature',
  template:    'discovery',
  answers: {
    problem:   'We need to solve X',
    who:       'non-technical product managers',
    outcome:   'Faster delivery cycles',
    scope:     'Teams bot for outer loop participation',
  },
  standardsInjected: true,
  sessionId: 'sess-001',
};

// An incomplete session missing some answers
const INCOMPLETE_SESSION = {
  featureSlug: 'test-feature',
  template:    'discovery',
  answers: {
    problem: 'We need to solve X',
    // missing: who, outcome, scope
  },
  standardsInjected: false,
  sessionId: 'sess-002',
};

// ── T1 — Module exists and exports assembleArtefact ──────────────────────────
console.log('\n[p4-nta-artefact-parity] T1 — module exists and exports assembleArtefact');
{
  const exists = fs.existsSync(ASSEMBLER);
  assert(exists, 'T1a: src/teams-bot/artefact-assembler.js exists');
  const mod = loadModule();
  assert(mod !== null, 'T1b: module loads without error');
  if (mod) {
    assert(typeof mod.assembleArtefact === 'function',
      'T1c: exports assembleArtefact as function');
  }
}

const mod = loadModule();

// ── T2 — Complete session → artefact with required template fields ────────────
console.log('\n[p4-nta-artefact-parity] T2 — complete session → artefact with required fields');
{
  if (!mod || typeof mod.assembleArtefact !== 'function') {
    assert(false, 'T2: assembleArtefact (function missing)');
  } else {
    let result = null;
    try {
      result = mod.assembleArtefact(COMPLETE_SESSION);
    } catch (_) {}
    assert(result !== null && result !== undefined,
      'T2a: assembleArtefact returns a value for complete session');
    if (result) {
      const resultStr = JSON.stringify(result).toLowerCase();
      // Check that at least some required discovery fields are present
      assert(resultStr.includes('problem') || resultStr.includes('who') || resultStr.includes('outcome'),
        `T2b: assembled artefact contains template fields (sample: ${JSON.stringify(result).substring(0, 120)})`);
    }
  }
}

// ── T3 — No placeholder strings in assembled artefact ─────────────────────────
console.log('\n[p4-nta-artefact-parity] T3 — no placeholder strings in assembled artefact');
{
  if (!mod || typeof mod.assembleArtefact !== 'function') {
    assert(false, 'T3: assembleArtefact (function missing)');
  } else {
    let result = null;
    try { result = mod.assembleArtefact(COMPLETE_SESSION); } catch (_) {}
    if (!result) {
      assert(false, 'T3: no result to check');
    } else {
      const str = JSON.stringify(result);
      assert(!/\[FILL IN\]/i.test(str),   'T3a: no [FILL IN] placeholder');
      assert(!/\bTODO\b/.test(str),        'T3b: no TODO placeholder');
      assert(!/PLACEHOLDER/i.test(str),    'T3c: no PLACEHOLDER text');
    }
  }
}

// ── T4 — No empty required fields ─────────────────────────────────────────────
console.log('\n[p4-nta-artefact-parity] T4 — no empty required fields in assembled artefact');
{
  if (!mod || typeof mod.assembleArtefact !== 'function') {
    assert(false, 'T4: assembleArtefact (function missing)');
  } else {
    let result = null;
    try { result = mod.assembleArtefact(COMPLETE_SESSION); } catch (_) {}
    if (!result || typeof result !== 'object') {
      assert(false, 'T4: no object result to check');
    } else {
      const values = Object.values(result);
      const hasEmpty = values.some(v => v === '' || v === null || v === undefined);
      assert(!hasEmpty,
        'T4: no empty required fields in assembled artefact');
    }
  }
}

// ── T5 — Branch name follows convention ───────────────────────────────────────
console.log('\n[p4-nta-artefact-parity] T5 — branch name follows chore/nta-<slug>-<date>');
{
  if (!mod || typeof mod.assembleArtefact !== 'function') {
    assert(false, 'T5: assembleArtefact (function missing)');
  } else {
    // Try getBranchName helper or inspect result
    let branchName = null;
    if (typeof mod.getBranchName === 'function') {
      try { branchName = mod.getBranchName({ featureSlug: 'my-feature' }); } catch (_) {}
    } else {
      let result = null;
      try { result = mod.assembleArtefact(COMPLETE_SESSION); } catch (_) {}
      if (result) { branchName = result.branchName || result.branch; }
    }
    if (!branchName) {
      // Branch naming may be in a separate commit function — check source for the pattern
      if (fs.existsSync(ASSEMBLER)) {
        const src = fs.readFileSync(ASSEMBLER, 'utf8');
        assert(/chore\/nta-/.test(src),
          'T5: branch naming convention "chore/nta-" found in source');
      } else {
        assert(false, 'T5: cannot verify branch naming (no branchName in result and file missing)');
      }
    } else {
      assert(/^chore\/nta-[a-z0-9-]+-\d{4}-\d{2}-\d{2}$/.test(branchName),
        `T5: branch name matches chore/nta-<slug>-YYYY-MM-DD (got: "${branchName}")`);
    }
  }
}

// ── T6 — Incomplete session → null returned ───────────────────────────────────
console.log('\n[p4-nta-artefact-parity] T6 — incomplete session → null (no partial commit)');
{
  if (!mod || typeof mod.assembleArtefact !== 'function') {
    assert(false, 'T6: assembleArtefact (function missing)');
  } else {
    let result;
    let threw = false;
    try {
      result = mod.assembleArtefact(INCOMPLETE_SESSION);
    } catch (_) { threw = true; }
    const blocked = threw || result === null || result === undefined;
    assert(blocked,
      `T6: incomplete session returns null or throws (threw: ${threw}, result: ${JSON.stringify(result)})`);
  }
}

// ── T7 — Session output includes standards_injected field ─────────────────────
console.log('\n[p4-nta-artefact-parity] T7 — session output includes standards_injected field');
{
  if (!mod || typeof mod.assembleArtefact !== 'function') {
    assert(false, 'T7: assembleArtefact (function missing)');
  } else {
    let result = null;
    try {
      result = mod.assembleArtefact({ ...COMPLETE_SESSION, standardsInjected: true });
    } catch (_) {}
    if (!result) {
      assert(false, 'T7: no result to inspect');
    } else {
      const str = JSON.stringify(result);
      assert(str.includes('standards_injected') || str.includes('standardsInjected'),
        `T7: standards_injected field present in output (sample: ${str.substring(0, 120)})`);
    }
  }
}

// ── T8 — No hardcoded artefact paths (ADR-004) ────────────────────────────────
console.log('\n[p4-nta-artefact-parity] T8 — no hardcoded artefact paths (ADR-004)');
{
  if (!fs.existsSync(ASSEMBLER)) {
    assert(false, 'T8: cannot scan source (file missing)');
  } else {
    const src = fs.readFileSync(ASSEMBLER, 'utf8');
    // Hardcoded feature-slug like '2026-04-' prefix
    assert(!/artefacts\/2026-/.test(src),
      'T8a: no hardcoded dated artefact paths');
    assert(!/artefacts\/2025-/.test(src),
      'T8b: no hardcoded dated artefact paths (2025)');
  }
}

// ── T-NFR1 — No PII in external logs (MC-SEC-02) ──────────────────────────────
console.log('\n[p4-nta-artefact-parity] T-NFR1 — no PII in external log calls (MC-SEC-02)');
{
  if (!fs.existsSync(ASSEMBLER)) {
    assert(false, 'T-NFR1: cannot scan source (file missing)');
  } else {
    const src = fs.readFileSync(ASSEMBLER, 'utf8');
    assert(!/console\.(log|error|warn)\s*\([^)]*session\.answers/.test(src),
      'T-NFR1a: no console.log(session.answers)');
    assert(!/console\.(log|error|warn)\s*\([^)]*answer/.test(src),
      'T-NFR1b: no console.log with "answer" variable');
  }
}

// ── T-NFR2 — No fork references in source ─────────────────────────────────────
console.log('\n[p4-nta-artefact-parity] T-NFR2 — no fork references in source (C1)');
{
  if (!fs.existsSync(ASSEMBLER)) {
    assert(false, 'T-NFR2: cannot scan source (file missing)');
  } else {
    const src = fs.readFileSync(ASSEMBLER, 'utf8');
    assert(!/forked_from/i.test(src),
      'T-NFR2a: no forked_from reference');
    assert(!/create.*fork/i.test(src),
      'T-NFR2b: no fork creation logic');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[p4-nta-artefact-parity] Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
