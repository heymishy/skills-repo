#!/usr/bin/env node
// check-p4-enf-package.js — test plan verification for p4-enf-package
// Covers T1–T8 (AC1–AC3) and T-NFR1, T-NFR2
// Tests FAIL until src/enforcement/governance-package.js is implemented — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const ROOT           = path.join(__dirname, '..');
const GOV_MODULE     = path.join(ROOT, 'src', 'enforcement', 'governance-package.js');
const VALIDATE_TRACE = path.join(ROOT, 'scripts', 'validate-trace.sh');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function loadModule() {
  if (!fs.existsSync(GOV_MODULE)) return null;
  try {
    delete require.cache[require.resolve(GOV_MODULE)];
    return require(GOV_MODULE);
  } catch (_) { return null; }
}

// ── T1 — Module exists and exports all five entry points ─────────────────────
console.log('\n[p4-enf-package] T1 — module exists and exports all five entry points');
{
  const exists = fs.existsSync(GOV_MODULE);
  assert(exists, 'T1a: src/enforcement/governance-package.js exists');
  const mod = loadModule();
  assert(mod !== null, 'T1b: module loads without error');
  if (mod) {
    const exports = ['resolveSkill', 'verifyHash', 'evaluateGate', 'advanceState', 'writeTrace'];
    for (const name of exports) {
      assert(typeof mod[name] === 'function',
        `T1: exports ${name} as function`);
    }
  }
}

const mod = loadModule();

// ── T2 — resolveSkill returns skill with hash ─────────────────────────────────
console.log('\n[p4-enf-package] T2 — resolveSkill returns skill with contentHash');
{
  if (!mod || typeof mod.resolveSkill !== 'function') {
    assert(false, 'T2: resolveSkill (function missing)');
  } else {
    // Create a temporary sidecar dir with one SKILL.md
    const tmpDir  = fs.mkdtempSync(path.join(os.tmpdir(), 'p4-pkg-'));
    const skillDir = path.join(tmpDir, '.skills', 'discovery');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Discovery skill\n\nTest content.');

    let result = null;
    try { result = mod.resolveSkill({ skillId: 'discovery', sidecarRoot: tmpDir }); } catch (e) { result = null; }

    assert(result !== null, 'T2a: resolveSkill returns non-null for existing skill');
    if (result) {
      assert(typeof result.skillId === 'string', 'T2b: result has skillId');
      assert(typeof result.content === 'string', 'T2c: result has content');
      assert(typeof result.contentHash === 'string' && result.contentHash.length === 64,
        `T2d: result has 64-char contentHash (got: ${result.contentHash && result.contentHash.length})`);
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ── T3 — verifyHash mismatch returns HASH_MISMATCH object ─────────────────────
console.log('\n[p4-enf-package] T3 — verifyHash mismatch returns HASH_MISMATCH (no throw)');
{
  if (!mod || typeof mod.verifyHash !== 'function') {
    assert(false, 'T3: verifyHash (function missing)');
  } else {
    let result = null;
    let threw  = false;
    try {
      result = mod.verifyHash({ skillId: 'test', expected: 'a'.repeat(64), actual: 'b'.repeat(64) });
    } catch (_) { threw = true; }
    assert(!threw, 'T3a: verifyHash does not throw on mismatch');
    assert(result !== null && result !== undefined, 'T3b: verifyHash returns a value on mismatch');
    if (result) {
      assert(result.error === 'HASH_MISMATCH',
        `T3c: result.error is "HASH_MISMATCH" (got: ${JSON.stringify(result.error)})`);
      assert(result.skillId === 'test',
        `T3d: result.skillId is "test" (got: ${JSON.stringify(result.skillId)})`);
      assert(typeof result.expected === 'string', 'T3e: result.expected is a string');
      assert(typeof result.actual === 'string',   'T3f: result.actual is a string');
    }
  }
}

// ── T4 — verifyHash HASH_MISMATCH is error object ────────────────────────────
console.log('\n[p4-enf-package] T4 — verifyHash mismatch result has error property');
{
  if (!mod || typeof mod.verifyHash !== 'function') {
    assert(false, 'T4: verifyHash (function missing)');
  } else {
    let result = null;
    try {
      result = mod.verifyHash({ skillId: 'test', expected: 'a'.repeat(64), actual: 'b'.repeat(64) });
    } catch (_) {}
    assert(result !== null && typeof result === 'object' && result.error !== undefined,
      `T4: result is error object with error property (got: ${JSON.stringify(result)})`);
  }
}

// ── T5 — verifyHash match returns null ────────────────────────────────────────
console.log('\n[p4-enf-package] T5 — verifyHash matching hash returns null');
{
  if (!mod || typeof mod.verifyHash !== 'function') {
    assert(false, 'T5: verifyHash (function missing)');
  } else {
    let result;
    try {
      result = mod.verifyHash({ skillId: 'test', expected: 'c'.repeat(64), actual: 'c'.repeat(64) });
    } catch (_) { result = 'THREW'; }
    assert(result === null || result === undefined,
      `T5: matching hash returns null (got: ${JSON.stringify(result)})`);
  }
}

// ── T6 — evaluateGate returns structured result ───────────────────────────────
console.log('\n[p4-enf-package] T6 — evaluateGate returns structured result with passed boolean');
{
  if (!mod || typeof mod.evaluateGate !== 'function') {
    assert(false, 'T6: evaluateGate (function missing)');
  } else {
    let result = null;
    try {
      result = mod.evaluateGate({ gate: 'dor', context: { reviewStatus: 'passed' } });
    } catch (_) {}
    assert(result !== null, 'T6a: evaluateGate returns a result');
    if (result) {
      assert(typeof result.passed === 'boolean',
        `T6b: result.passed is boolean (got: ${typeof result.passed})`);
    }
  }
}

// ── T7 — advanceState returns updated state ───────────────────────────────────
console.log('\n[p4-enf-package] T7 — advanceState returns object with updated current state');
{
  if (!mod || typeof mod.advanceState !== 'function') {
    assert(false, 'T7: advanceState (function missing)');
  } else {
    const declaration = {
      nodes: [
        { id: 'discovery', allowedTransitions: ['definition'] },
        { id: 'definition', allowedTransitions: [] }
      ]
    };
    let result = null;
    try {
      result = mod.advanceState({ current: 'discovery', next: 'definition', declaration });
    } catch (_) {}
    assert(result !== null, 'T7a: advanceState returns non-null');
    if (result) {
      assert(result.current === 'definition',
        `T7b: result.current is "definition" (got: ${JSON.stringify(result.current)})`);
    }
  }
}

// ── T8 — writeTrace passes trace schema structure ─────────────────────────────
console.log('\n[p4-enf-package] T8 — writeTrace returns entry with all required trace fields');
{
  if (!mod || typeof mod.writeTrace !== 'function') {
    assert(false, 'T8: writeTrace (function missing)');
  } else {
    let trace = null;
    const tmpFile = path.join(os.tmpdir(), `p4-pkg-trace-${Date.now()}.json`);
    try {
      trace = mod.writeTrace({
        skillId:         'test',
        skillHash:       'a'.repeat(64),
        inputHash:       'b'.repeat(64),
        outputRef:       'artefact.md',
        transitionTaken: 'discovery\u2192definition',
        surfaceType:     'cli',
        timestamp:       '2026-04-19T10:00:00Z',
        outputPath:      tmpFile,
      });
    } catch (_) {}

    // If writeTrace returns an object, check fields
    if (trace && typeof trace === 'object') {
      const REQUIRED = ['skillHash', 'inputHash', 'outputRef', 'transitionTaken', 'surfaceType', 'timestamp'];
      for (const field of REQUIRED) {
        assert(trace[field] !== undefined,
          `T8: trace has required field "${field}"`);
      }
    } else if (fs.existsSync(tmpFile)) {
      // writeTrace wrote to file
      let parsed = null;
      try { parsed = JSON.parse(fs.readFileSync(tmpFile, 'utf8')); } catch (_) {}
      assert(parsed !== null, 'T8: trace file is valid JSON');
      if (parsed) {
        const REQUIRED = ['skillHash', 'inputHash', 'outputRef', 'transitionTaken', 'surfaceType', 'timestamp'];
        for (const field of REQUIRED) {
          assert(parsed[field] !== undefined,
            `T8: trace file has required field "${field}"`);
        }
      }
      fs.unlinkSync(tmpFile);
    } else {
      assert(false, 'T8: writeTrace returned null and produced no file');
    }
  }
}

// ── T-NFR1 — No force/skip bypass in verifyHash ───────────────────────────────
console.log('\n[p4-enf-package] T-NFR1 — no force/skip/bypass parameter in verifyHash source');
{
  if (!fs.existsSync(GOV_MODULE)) {
    assert(false, 'T-NFR1: cannot scan source (file missing)');
  } else {
    const src = fs.readFileSync(GOV_MODULE, 'utf8');
    // Find verifyHash function body (rough extraction)
    const verifyIdx = src.indexOf('verifyHash');
    if (verifyIdx === -1) {
      assert(false, 'T-NFR1: verifyHash not found in source');
    } else {
      const funcSection = src.slice(verifyIdx, verifyIdx + 500);
      assert(!/\bforce\b/.test(funcSection),   'T-NFR1a: no "force" parameter in verifyHash');
      assert(!/\bskip\b/.test(funcSection),    'T-NFR1b: no "skip" parameter in verifyHash');
      assert(!/\bbypass\b/.test(funcSection),  'T-NFR1c: no "bypass" parameter in verifyHash');
    }
  }
}

// ── T-NFR2 — No external network call in source ───────────────────────────────
console.log('\n[p4-enf-package] T-NFR2 — no external network call in governance package source');
{
  if (!fs.existsSync(GOV_MODULE)) {
    assert(false, 'T-NFR2: cannot scan source (file missing)');
  } else {
    const src = fs.readFileSync(GOV_MODULE, 'utf8');
    assert(!src.includes("require('http')") && !src.includes('require("http")'),
      'T-NFR2a: no require("http")');
    assert(!src.includes("require('https')") && !src.includes('require("https")'),
      'T-NFR2b: no require("https")');
    assert(!src.includes('fetch('),          'T-NFR2c: no fetch()');
    assert(!src.includes("require('dns')") && !src.includes('require("dns")'),
      'T-NFR2d: no require("dns")');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[p4-enf-package] Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
