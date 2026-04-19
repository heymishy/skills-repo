#!/usr/bin/env node
// check-p4-enf-mcp.js — test plan verification for p4-enf-mcp
// Covers T1–T8 (AC1–AC4) and T-NFR1, T-NFR2
// Tests FAIL until src/enforcement/mcp-adapter.js is implemented — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const MCP_MODULE = path.join(ROOT, 'src', 'enforcement', 'mcp-adapter.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function loadModule() {
  if (!fs.existsSync(MCP_MODULE)) return null;
  try {
    delete require.cache[require.resolve(MCP_MODULE)];
    return require(MCP_MODULE);
  } catch (_) { return null; }
}

// ── T1 — Module exists and exports handleToolCall ─────────────────────────────
console.log('\n[p4-enf-mcp] T1 — mcp-adapter module exists and exports handleToolCall');
{
  const exists = fs.existsSync(MCP_MODULE);
  assert(exists, 'T1a: src/enforcement/mcp-adapter.js exists');
  const mod = loadModule();
  assert(mod !== null, 'T1b: module loads without error');
  if (mod) {
    assert(typeof mod.handleToolCall === 'function', 'T1c: exports handleToolCall as function');
  }
}

const mod = loadModule();

// ── T2 — verifyHash called before skill body ──────────────────────────────────
console.log('\n[p4-enf-mcp] T2 — verifyHash is called before skill body assembly');
{
  if (!mod || typeof mod.handleToolCall !== 'function') {
    assert(false, 'T2: handleToolCall (function missing)');
  } else {
    let verifyHashCalled = false;
    let verifyCalledBeforeSkillBody = true;
    let skillBodyAssembled = false;

    const stub = {
      verifyHash: (args) => {
        verifyHashCalled = true;
        if (skillBodyAssembled) verifyCalledBeforeSkillBody = false;
        return null; // match
      },
      resolveSkill: (args) => {
        skillBodyAssembled = true;
        return { skillId: 'discovery', content: '# test skill', contentHash: 'a'.repeat(64) };
      },
      evaluateGate: () => ({ passed: true }),
      advanceState: () => ({ current: 'definition' }),
      writeTrace: () => null,
    };

    try {
      mod.handleToolCall(
        { skillId: 'discovery', operatorInput: 'start', expectedHash: 'a'.repeat(64) },
        { govPackage: stub }
      );
    } catch (_) {}

    assert(verifyHashCalled, 'T2a: verifyHash was called');
    assert(verifyCalledBeforeSkillBody, 'T2b: verifyHash called before skill body assembled');
  }
}

// ── T3 — HASH_MISMATCH → structured error, no skill body ─────────────────────
console.log('\n[p4-enf-mcp] T3 — HASH_MISMATCH returns error; skill body absent');
{
  if (!mod || typeof mod.handleToolCall !== 'function') {
    assert(false, 'T3: handleToolCall (function missing)');
  } else {
    const hashMismatch = { error: 'HASH_MISMATCH', skillId: 'discovery', expected: 'a'.repeat(64), actual: 'b'.repeat(64) };
    const stub = {
      verifyHash: () => hashMismatch,
      resolveSkill: () => ({ skillId: 'discovery', content: '# skill', contentHash: 'a'.repeat(64) }),
      evaluateGate: () => ({ passed: true }),
      advanceState: () => ({}),
      writeTrace: () => null,
    };

    let result = null;
    try {
      result = mod.handleToolCall(
        { skillId: 'discovery', operatorInput: 'start', expectedHash: 'a'.repeat(64) },
        { govPackage: stub }
      );
    } catch (e) { result = { threwError: e.message }; }

    if (result && result.error) {
      assert(result.error === 'HASH_MISMATCH',
        `T3a: error is "HASH_MISMATCH" (got: ${JSON.stringify(result.error)})`);
      assert(!result.skillBody && result.skillBody !== '',
        `T3b: no skillBody in HASH_MISMATCH response (got: ${JSON.stringify(result.skillBody)})`);
    } else {
      // May throw or return error in different shape
      assert(result !== null, 'T3: response is not null');
      assert(!result || !result.skillBody,
        `T3b: no skillBody when hash mismatches (got: ${JSON.stringify(result && result.skillBody)})`);
    }
  }
}

// ── T4 — Valid hash → P2 context injection ────────────────────────────────────
console.log('\n[p4-enf-mcp] T4 — valid hash → P2 context injection (skillBody + standards + stateContext)');
{
  if (!mod || typeof mod.handleToolCall !== 'function') {
    assert(false, 'T4: handleToolCall (function missing)');
  } else {
    const stub = {
      verifyHash: () => null,
      resolveSkill: () => ({ skillId: 'discovery', content: '# skill body', contentHash: 'a'.repeat(64) }),
      evaluateGate: () => ({ passed: true }),
      advanceState: () => ({ current: 'definition' }),
      writeTrace: () => null,
    };

    let result = null;
    try {
      result = mod.handleToolCall(
        { skillId: 'discovery', operatorInput: 'start', expectedHash: 'a'.repeat(64) },
        { govPackage: stub, stateContext: { currentPhase: 'discovery' }, standards: ['std1'] }
      );
    } catch (_) {}

    assert(result !== null, 'T4a: result not null');
    if (result && !result.error) {
      assert(result.skillBody !== undefined && result.skillBody !== null,
        `T4b: skillBody present in response (got: ${JSON.stringify(result.skillBody)})`);
      assert(result.standards !== undefined || result.stateContext !== undefined,
        `T4c: standards or stateContext in response`);
    }
  }
}

// ── T5 — writeTrace called with all six required fields ───────────────────────
console.log('\n[p4-enf-mcp] T5 — writeTrace called with all six required fields');
{
  if (!mod || typeof mod.handleToolCall !== 'function') {
    assert(false, 'T5: handleToolCall (function missing)');
  } else {
    let traceArgs = null;
    const stub = {
      verifyHash: () => null,
      resolveSkill: () => ({ skillId: 'discovery', content: '# skill', contentHash: 'a'.repeat(64) }),
      evaluateGate: () => ({ passed: true }),
      advanceState: () => ({ current: 'definition' }),
      writeTrace: (args) => { traceArgs = args; return null; },
    };

    try {
      mod.handleToolCall(
        { skillId: 'discovery', operatorInput: 'start', expectedHash: 'a'.repeat(64) },
        { govPackage: stub }
      );
    } catch (_) {}

    if (!traceArgs) {
      assert(false, 'T5: writeTrace was not called');
    } else {
      const REQUIRED = ['skillHash', 'inputHash', 'outputRef', 'transitionTaken', 'surfaceType', 'timestamp'];
      for (const field of REQUIRED) {
        assert(traceArgs[field] !== undefined,
          `T5: writeTrace called with "${field}"`);
      }
    }
  }
}

// ── T6 — surfaceType is "mcp-interactive" ─────────────────────────────────────
console.log('\n[p4-enf-mcp] T6 — surfaceType in trace is "mcp-interactive"');
{
  if (!mod || typeof mod.handleToolCall !== 'function') {
    assert(false, 'T6: handleToolCall (function missing)');
  } else {
    let traceArgs = null;
    const stub = {
      verifyHash: () => null,
      resolveSkill: () => ({ skillId: 'discovery', content: '# skill', contentHash: 'a'.repeat(64) }),
      evaluateGate: () => ({ passed: true }),
      advanceState: () => ({}),
      writeTrace: (args) => { traceArgs = args; },
    };

    try {
      mod.handleToolCall(
        { skillId: 'discovery', operatorInput: 'start', expectedHash: 'a'.repeat(64) },
        { govPackage: stub }
      );
    } catch (_) {}

    assert(traceArgs !== null, 'T6a: writeTrace was called');
    if (traceArgs) {
      assert(traceArgs.surfaceType === 'mcp-interactive',
        `T6b: surfaceType is "mcp-interactive" (got: ${JSON.stringify(traceArgs.surfaceType)})`);
    }
  }
}

// ── T7 — No persistent process pattern in source ──────────────────────────────
console.log('\n[p4-enf-mcp] T7 — no persistent process patterns in mcp-adapter source');
{
  if (!fs.existsSync(MCP_MODULE)) {
    assert(false, 'T7: cannot scan source (file missing)');
  } else {
    const src = fs.readFileSync(MCP_MODULE, 'utf8');
    assert(!src.includes('setInterval'),      'T7a: no setInterval at module scope');
    assert(!/process\.stdin\.resume\(\)/.test(src), 'T7b: no process.stdin.resume()');
    // server.listen outside a function body — rough check
    const serverListenMatch = src.match(/server\.listen\s*\(/g) || [];
    assert(serverListenMatch.length === 0,     'T7c: no server.listen() call');
  }
}

// ── T8 — Multi-question payload rejected (C7) ─────────────────────────────────
console.log('\n[p4-enf-mcp] T8 — multi-question payload rejected per C7');
{
  if (!mod || typeof mod.handleToolCall !== 'function') {
    assert(false, 'T8: handleToolCall (function missing)');
  } else {
    const stub = {
      verifyHash: () => null,
      resolveSkill: () => ({ skillId: 'discovery', content: '#', contentHash: 'a'.repeat(64) }),
      evaluateGate: () => ({ passed: true }),
      advanceState: () => ({}),
      writeTrace: () => null,
    };

    let result = null;
    let threw  = false;
    try {
      result = mod.handleToolCall(
        { skillId: 'discovery', questions: ['q1', 'q2'], operatorInput: 'multi', expectedHash: 'a'.repeat(64) },
        { govPackage: stub }
      );
    } catch (_) { threw = true; }

    const hasError = threw || (result && result.error !== undefined);
    assert(hasError,
      `T8: multi-question payload results in error or rejection (threw: ${threw}, result: ${JSON.stringify(result)})`);
  }
}

// ── T-NFR1 — No skill content in console.log ─────────────────────────────────
console.log('\n[p4-enf-mcp] T-NFR1 — no skill content in external log calls');
{
  if (!fs.existsSync(MCP_MODULE)) {
    assert(false, 'T-NFR1: cannot scan source (file missing)');
  } else {
    const src = fs.readFileSync(MCP_MODULE, 'utf8');
    // Look for console.log/error/warn with skill content variables
    assert(!/console\.(log|error|warn)\s*\([^)]*skillBody/.test(src),
      'T-NFR1a: no console output with skillBody');
    assert(!/console\.(log|error|warn)\s*\([^)]*content/.test(src),
      'T-NFR1b: no console output with content (skill text)');
  }
}

// ── T-NFR2 — No bypass path in source ────────────────────────────────────────
console.log('\n[p4-enf-mcp] T-NFR2 — no hash bypass path in mcp-adapter source');
{
  if (!fs.existsSync(MCP_MODULE)) {
    assert(false, 'T-NFR2: cannot scan source (file missing)');
  } else {
    const src = fs.readFileSync(MCP_MODULE, 'utf8');
    assert(!src.includes('skipVerify'),    'T-NFR2a: no skipVerify');
    assert(!src.includes('bypassHash'),    'T-NFR2b: no bypassHash');
    assert(!src.includes('--no-verify'),   'T-NFR2c: no --no-verify string');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[p4-enf-mcp] Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
