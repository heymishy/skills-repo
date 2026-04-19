#!/usr/bin/env node
// check-p4-enf-cli.js — test plan verification for p4-enf-cli
// Covers T1–T8 (AC1–AC4) and T-NFR1, T-NFR2
// Tests FAIL until src/enforcement/cli-adapter.js is implemented — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const ROOT       = path.join(__dirname, '..');
const CLI_MODULE = path.join(ROOT, 'src', 'enforcement', 'cli-adapter.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function loadModule() {
  if (!fs.existsSync(CLI_MODULE)) return null;
  try {
    delete require.cache[require.resolve(CLI_MODULE)];
    return require(CLI_MODULE);
  } catch (_) { return null; }
}

const NINE_COMMANDS = ['init', 'fetch', 'pin', 'verify', 'workflow', 'advance', 'back', 'navigate', 'emitTrace'];

// Fixture workflow declaration for advance tests
const FIXTURE_DECL = {
  nodes: [
    { id: 'discovery',  allowedTransitions: ['definition'] },
    { id: 'definition', allowedTransitions: ['review'] },
    { id: 'review',     allowedTransitions: [] },
  ]
};

// ── T1 — Module exists and exports all 9 commands ────────────────────────────
console.log('\n[p4-enf-cli] T1 — cli-adapter module exists and exports all 9 commands');
{
  const exists = fs.existsSync(CLI_MODULE);
  assert(exists, 'T1a: src/enforcement/cli-adapter.js exists');
  const mod = loadModule();
  assert(mod !== null, 'T1b: module loads without error');
  if (mod) {
    for (const cmd of NINE_COMMANDS) {
      assert(mod[cmd] !== undefined, `T1: exports "${cmd}"`);
    }
  }
}

const mod = loadModule();

// ── T2 — All 9 exports are functions ─────────────────────────────────────────
console.log('\n[p4-enf-cli] T2 — all 9 exported commands are functions');
{
  if (!mod) {
    assert(false, 'T2: module missing');
  } else {
    for (const cmd of NINE_COMMANDS) {
      assert(typeof mod[cmd] === 'function',
        `T2: ${cmd} is a function (got: ${typeof mod[cmd]})`);
    }
  }
}

// ── T3 — advance from non-permitted state → error with allowed list ───────────
console.log('\n[p4-enf-cli] T3 — advance to non-permitted state produces structured error');
{
  if (!mod || typeof mod.advance !== 'function') {
    assert(false, 'T3: advance (function missing)');
  } else {
    let result = null;
    let threw  = false;
    try {
      result = mod.advance({
        current: 'discovery',
        next: 'review',      // NOT a permitted transition (only 'definition' is allowed)
        declaration: FIXTURE_DECL,
        govPackage: { verifyHash: () => null, advanceState: () => ({ current: 'review' }) }
      });
    } catch (e) { threw = true; result = e; }

    const msg = result
      ? (result.message || result.error || JSON.stringify(result))
      : '';
    const hasError = threw || (result && (result.error !== undefined || result.message !== undefined));

    assert(hasError,
      `T3a: advance to non-permitted state produces error (threw: ${threw})`);
    assert(/not permitted|not allowed|transition/i.test(msg),
      `T3b: error mentions "not permitted" or "not allowed" or "transition" (got: ${msg.substring(0, 120)})`);
    assert(/review/.test(msg),
      `T3c: error mentions target state "review" (got: ${msg.substring(0, 120)})`);
    assert(/discover|allowed/i.test(msg),
      `T3d: error mentions current state or allowed list (got: ${msg.substring(0, 120)})`);
  }
}

// ── T4 — advance to permitted state succeeds ──────────────────────────────────
console.log('\n[p4-enf-cli] T4 — advance to permitted state succeeds');
{
  if (!mod || typeof mod.advance !== 'function') {
    assert(false, 'T4: advance (function missing)');
  } else {
    let result = null;
    let threw  = false;
    try {
      result = mod.advance({
        current: 'discovery',
        next: 'definition',  // PERMITTED
        declaration: FIXTURE_DECL,
        govPackage: {
          verifyHash: () => null,
          advanceState: (args) => ({ current: args.next, previous: args.current })
        }
      });
    } catch (e) { threw = true; result = e; }

    assert(!threw, `T4a: advance to permitted state does not throw (threw: ${threw})`);
    assert(result !== null, 'T4b: advance returns a result');
    if (result && !result.error) {
      assert(result.error === undefined, 'T4c: no error field in success result');
    }
  }
}

// ── T5 — advance with matching hash → envelope built ─────────────────────────
console.log('\n[p4-enf-cli] T5 — advance with matching hash returns envelope');
{
  if (!mod || typeof mod.advance !== 'function') {
    assert(false, 'T5: advance (function missing)');
  } else {
    let result = null;
    try {
      result = mod.advance({
        current: 'discovery',
        next: 'definition',
        declaration: FIXTURE_DECL,
        govPackage: {
          verifyHash: () => null,  // no mismatch
          advanceState: (args) => ({ current: args.next, previous: args.current })
        },
        skillId:      'discovery',
        expectedHash: 'a'.repeat(64),
      });
    } catch (_) {}

    assert(result !== null, 'T5a: advance returns result');
    if (result) {
      // envelope may be result.envelope or result itself
      const hasEnvelope = result.envelope !== undefined || result.current !== undefined;
      assert(hasEnvelope,
        `T5b: result has envelope or current state (got keys: ${result ? Object.keys(result).join(',') : 'n/a'})`);
    }
  }
}

// ── T6 — advance with mismatching hash → HASH_MISMATCH, no envelope ───────────
console.log('\n[p4-enf-cli] T6 — advance with hash mismatch → HASH_MISMATCH error');
{
  if (!mod || typeof mod.advance !== 'function') {
    assert(false, 'T6: advance (function missing)');
  } else {
    const hashMismatch = {
      error: 'HASH_MISMATCH',
      skillId: 'discovery',
      expected: 'a'.repeat(64),
      actual:   'b'.repeat(64)
    };

    let result = null;
    let threw  = false;
    try {
      result = mod.advance({
        current: 'discovery',
        next: 'definition',
        declaration: FIXTURE_DECL,
        govPackage: {
          verifyHash: () => hashMismatch,
          advanceState: () => ({ current: 'definition' })
        },
        skillId:      'discovery',
        expectedHash: 'a'.repeat(64),
      });
    } catch (e) { threw = true; result = e; }

    const msg = result
      ? (result.message || result.error || JSON.stringify(result))
      : '';
    const hasError = threw || (result && (result.error !== undefined || /hash mismatch/i.test(msg)));

    assert(hasError,
      `T6a: hash mismatch causes error (threw: ${threw})`);
    assert(/hash mismatch|HASH_MISMATCH/i.test(msg),
      `T6b: error mentions hash mismatch (got: ${msg.substring(0, 120)})`);
    assert(!result || !result.envelope,
      `T6c: no envelope in hash mismatch response (got: ${JSON.stringify(result && result.envelope)})`);
  }
}

// ── T7 — emitTrace output has all required trace fields ───────────────────────
console.log('\n[p4-enf-cli] T7 — emitTrace produces trace entry with all required fields');
{
  if (!mod || typeof mod.emitTrace !== 'function') {
    assert(false, 'T7: emitTrace (function missing)');
  } else {
    const tmpFile = path.join(os.tmpdir(), `p4-cli-trace-${Date.now()}.json`);
    let trace = null;
    try {
      trace = mod.emitTrace({
        skillId:         'discovery',
        skillHash:       'a'.repeat(64),
        inputHash:       'b'.repeat(64),
        outputRef:       'artefact.md',
        transitionTaken: 'discovery\u2192definition',
        surfaceType:     'cli',
        timestamp:       '2026-04-19T10:00:00Z',
        outputPath:      tmpFile,
      });
    } catch (_) {}

    const REQUIRED = ['skillHash', 'inputHash', 'outputRef', 'transitionTaken', 'surfaceType', 'timestamp'];

    if (trace && typeof trace === 'object') {
      for (const field of REQUIRED) {
        assert(trace[field] !== undefined,
          `T7: trace has field "${field}"`);
      }
    } else if (fs.existsSync(tmpFile)) {
      let parsed = null;
      try { parsed = JSON.parse(fs.readFileSync(tmpFile, 'utf8')); } catch (_) {}
      assert(parsed !== null, 'T7: trace file is valid JSON');
      if (parsed) {
        for (const field of REQUIRED) {
          assert(parsed[field] !== undefined,
            `T7: trace file has field "${field}"`);
        }
      }
      fs.unlinkSync(tmpFile);
    } else {
      assert(false, 'T7: emitTrace returned null and produced no file');
    }
  }
}

// ── T8 — No hardcoded upstream URL in source ──────────────────────────────────
console.log('\n[p4-enf-cli] T8 — ADR-004: no hardcoded github.com URL in cli-adapter source');
{
  if (!fs.existsSync(CLI_MODULE)) {
    assert(false, 'T8: cannot scan source (file missing)');
  } else {
    const src = fs.readFileSync(CLI_MODULE, 'utf8');
    // Remove comment lines before scanning
    const noComments = src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    assert(!noComments.includes('github.com/heymishy'),
      'T8: no hardcoded "github.com/heymishy" in source (outside comments)');
  }
}

// ── T-NFR1 — No skip-verify bypass ───────────────────────────────────────────
console.log('\n[p4-enf-cli] T-NFR1 — no skip-verify bypass in cli-adapter source (C5)');
{
  if (!fs.existsSync(CLI_MODULE)) {
    assert(false, 'T-NFR1: cannot scan source (file missing)');
  } else {
    const src = fs.readFileSync(CLI_MODULE, 'utf8');
    assert(!src.includes('skipVerify'),   'T-NFR1a: no skipVerify');
    assert(!src.includes('skip-verify'),  'T-NFR1b: no skip-verify');
    assert(!src.includes('--no-verify'),  'T-NFR1c: no --no-verify');
    assert(!/\bforce\b/.test(src) || !/advance/.test(src.slice(src.indexOf('force'), src.indexOf('force') + 100)),
      'T-NFR1d: no "force" bypass in advance context');
  }
}

// ── T-NFR2 — No credentials in emitTrace output ──────────────────────────────
console.log('\n[p4-enf-cli] T-NFR2 — no credentials in emitTrace output');
{
  if (!mod || typeof mod.emitTrace !== 'function') {
    assert(false, 'T-NFR2: emitTrace (function missing)');
  } else {
    let traceStr = '';
    let trace = null;
    try {
      trace = mod.emitTrace({
        skillId:         'test',
        skillHash:       'a'.repeat(64),
        inputHash:       'b'.repeat(64),
        outputRef:       'test.md',
        transitionTaken: 'A\u2192B',
        surfaceType:     'cli',
        timestamp:       '2026-04-19T10:00:00Z',
      });
      if (trace) traceStr = JSON.stringify(trace);
    } catch (e) { traceStr = e.message || ''; }

    if (!traceStr) traceStr = '(empty)';
    const lower = traceStr.toLowerCase();
    assert(!lower.includes('bearer '),       'T-NFR2a: no Bearer token in trace output');
    assert(!/password\s*[:=]/.test(lower),   'T-NFR2b: no password in trace output');
    assert(!/secret\s*[:=]/.test(lower),     'T-NFR2c: no secret in trace output');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[p4-enf-cli] Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
