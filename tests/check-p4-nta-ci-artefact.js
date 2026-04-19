#!/usr/bin/env node
// check-p4-nta-ci-artefact.js — test plan verification for p4-nta-ci-artefact
// Covers T1–T8, T-NFR1, T-NFR2
// Tests FAIL until src/teams-bot/ci-reporter.js is implemented — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT        = path.join(__dirname, '..');
const CI_REPORTER = path.join(ROOT, 'src', 'teams-bot', 'ci-reporter.js');
const TESTS_DIR   = path.join(ROOT, 'tests');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function loadModule() {
  if (!fs.existsSync(CI_REPORTER)) return null;
  try {
    delete require.cache[require.resolve(CI_REPORTER)];
    return require(CI_REPORTER);
  } catch (_) { return null; }
}

// ── T1 — Module exists and exports checkBotArtefact ─────────────────────────
console.log('\n[p4-nta-ci-artefact] T1 — module exists and exports checkBotArtefact');
{
  const exists = fs.existsSync(CI_REPORTER);
  assert(exists, 'T1a: src/teams-bot/ci-reporter.js exists');
  const mod = loadModule();
  assert(mod !== null, 'T1b: module loads without error');
  if (mod) {
    assert(typeof mod.checkBotArtefact === 'function',
      'T1c: exports checkBotArtefact as function');
  }
}

const mod = loadModule();

// ── T2 — standards_injected: false → warning (not error) ─────────────────────
console.log('\n[p4-nta-ci-artefact] T2 — standards_injected: false → warning (not error)');
{
  if (!mod || typeof mod.checkBotArtefact !== 'function') {
    assert(false, 'T2: checkBotArtefact (function missing)');
  } else {
    let result = null;
    try {
      result = mod.checkBotArtefact({
        artefactPath:     'artefacts/test-feature/discovery.md',
        standardsInjected: false,
      });
    } catch (_) {}
    assert(result !== null && result !== undefined,
      'T2a: result is not null for standards_injected: false');
    if (result) {
      assert(result.level === 'warning',
        `T2b: result.level is "warning" (got: ${JSON.stringify(result.level)})`);
    }
  }
}

// ── T3 — standards_injected: true → null ─────────────────────────────────────
console.log('\n[p4-nta-ci-artefact] T3 — standards_injected: true → null (no warning)');
{
  if (!mod || typeof mod.checkBotArtefact !== 'function') {
    assert(false, 'T3: checkBotArtefact (function missing)');
  } else {
    let result;
    try {
      result = mod.checkBotArtefact({
        artefactPath:     'artefacts/test-feature/discovery.md',
        standardsInjected: true,
      });
    } catch (_) {}
    assert(result === null || result === undefined,
      `T3: clean artefact returns null/undefined (got: ${JSON.stringify(result)})`);
  }
}

// ── T4 — Warning message identifies artefact and flag ────────────────────────
console.log('\n[p4-nta-ci-artefact] T4 — warning message identifies artefact path and flag');
{
  if (!mod || typeof mod.checkBotArtefact !== 'function') {
    assert(false, 'T4: checkBotArtefact (function missing)');
  } else {
    let result = null;
    try {
      result = mod.checkBotArtefact({
        artefactPath:     'artefacts/my-feature/discovery.md',
        standardsInjected: false,
      });
    } catch (_) {}
    if (!result || !result.message) {
      assert(false, 'T4: no message in result');
    } else {
      assert(result.message.includes('artefacts/my-feature/discovery.md') ||
             result.message.includes('my-feature'),
        `T4a: message contains artefact path (got: "${result.message}")`);
      assert(/standards_injected/i.test(result.message),
        `T4b: message contains "standards_injected" (got: "${result.message}")`);
    }
  }
}

// ── T5 — standards_injected: false never produces level: error ───────────────
console.log('\n[p4-nta-ci-artefact] T5 — standards_injected: false never produces level: error');
{
  if (!mod || typeof mod.checkBotArtefact !== 'function') {
    assert(false, 'T5: checkBotArtefact (function missing)');
  } else {
    let result = null;
    try {
      result = mod.checkBotArtefact({
        artefactPath:     'artefacts/test/discovery.md',
        standardsInjected: false,
      });
    } catch (_) {}
    assert(result === null || (result && result.level !== 'error' && result.level !== 'failure'),
      `T5: level is not "error" or "failure" (got: ${JSON.stringify(result && result.level)})`);
  }
}

// ── T6 — Governance check scripts have no bot-specific bypass ────────────────
console.log('\n[p4-nta-ci-artefact] T6 — governance scripts have no bot-specific bypass (MC-CORRECT-02)');
{
  if (!fs.existsSync(TESTS_DIR)) {
    assert(false, 'T6: tests/ directory not found');
  } else {
    const SELF = path.basename(__filename);
    let botBypassFound = false;
    let bypassFile     = '';
    for (const file of fs.readdirSync(TESTS_DIR)) {
      if (!file.endsWith('.js')) continue;
      if (file === SELF) continue; // exclude this test file from the scan
      const filePath = path.join(TESTS_DIR, file);
      const src      = fs.readFileSync(filePath, 'utf8');
      // Look for bot-specific conditional bypass patterns in actual governance scripts
      if (/\bskipIfBot\b|\bisBotProduced\b|\bif\s*\(.*bot.*artefact/i.test(src)) {
        botBypassFound = true;
        bypassFile     = file;
        break;
      }
    }
    assert(!botBypassFound,
      `T6a: no bot-specific bypass in governance scripts (found in: "${bypassFile}")`);
  }
}

// ── T7 — CI summary has no surface-specific annotation for clean artefact ─────
console.log('\n[p4-nta-ci-artefact] T7 — clean artefact produces null (no annotation)');
{
  if (!mod || typeof mod.checkBotArtefact !== 'function') {
    assert(false, 'T7: checkBotArtefact (function missing)');
  } else {
    let result;
    try {
      result = mod.checkBotArtefact({
        artefactPath:     'artefacts/any/discovery.md',
        standardsInjected: true,
      });
    } catch (_) {}
    // For clean artefact, must return null — no "bot artefact validated" annotation
    assert(result === null || result === undefined,
      `T7: clean artefact returns null (no surface annotation) (got: ${JSON.stringify(result)})`);
  }
}

// ── T8 — No credentials in CI reporter output ─────────────────────────────────
console.log('\n[p4-nta-ci-artefact] T8 — no credentials in CI reporter output (MC-SEC-02)');
{
  if (!mod || typeof mod.checkBotArtefact !== 'function') {
    assert(false, 'T8: checkBotArtefact (function missing)');
  } else {
    let result = null;
    try {
      result = mod.checkBotArtefact({
        artefactPath:     'artefacts/test/discovery.md',
        standardsInjected: false,
      });
    } catch (_) {}
    if (!result) {
      assert(true, 'T8: no result to check (null is clean)');
    } else {
      const str = JSON.stringify(result).toLowerCase();
      assert(!/bearer /.test(str) && !/\btoken\b/.test(str),
        'T8a: no Bearer/token in warning');
      assert(!/\bsecret\b/.test(str) && !/\bpassword\b/.test(str),
        'T8b: no secret/password in warning');
    }
  }
}

// ── T-NFR1 — No hardcoded paths in ci-reporter source (ADR-004) ───────────────
console.log('\n[p4-nta-ci-artefact] T-NFR1 — no hardcoded artefact paths (ADR-004)');
{
  if (!fs.existsSync(CI_REPORTER)) {
    assert(false, 'T-NFR1: cannot scan source (file missing)');
  } else {
    const src = fs.readFileSync(CI_REPORTER, 'utf8');
    assert(!/artefacts\/2026-/.test(src), 'T-NFR1a: no hardcoded 2026 dated paths');
    assert(!/artefacts\/2025-/.test(src), 'T-NFR1b: no hardcoded 2025 dated paths');
  }
}

// ── T-NFR2 — Level values are only "warning" or null (MC-CORRECT-02) ──────────
console.log('\n[p4-nta-ci-artefact] T-NFR2 — checkBotArtefact only returns "warning" or null (MC-CORRECT-02)');
{
  if (!mod || typeof mod.checkBotArtefact !== 'function') {
    assert(false, 'T-NFR2: checkBotArtefact (function missing)');
  } else {
    const inputs = [
      { artefactPath: 'a.md', standardsInjected: false },
      { artefactPath: 'b.md', standardsInjected: true  },
      { artefactPath: 'c.md', standardsInjected: false, extra: 'field' },
    ];
    let onlyValidLevels = true;
    for (const input of inputs) {
      let r = null;
      try { r = mod.checkBotArtefact(input); } catch (_) {}
      if (r !== null && r !== undefined && r.level !== 'warning') {
        onlyValidLevels = false;
      }
    }
    assert(onlyValidLevels,
      'T-NFR2: checkBotArtefact only returns null or level: "warning" for all inputs');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[p4-nta-ci-artefact] Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
