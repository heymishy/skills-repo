#!/usr/bin/env node
// check-p1-hash-defect.js — failing tests for P1 hash self-comparison defect
// Story: artefacts/2026-04-27-p1-hash-defect/stories/p1-hash-defect.md
// Covers AC1–AC5 — all tests must FAIL until the fix is applied to
// src/enforcement/cli-adapter.js.
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

// Fixture workflow declaration (same as existing cli tests)
const FIXTURE_DECL = {
  nodes: [
    { id: 'discovery',  allowedTransitions: ['definition'] },
    { id: 'definition', allowedTransitions: ['review'] },
    { id: 'review',     allowedTransitions: [] },
  ]
};

const mod = loadModule();

// ── AC1: verifyHash receives actual from resolveSkill, NOT from expectedHash ──
console.log('\n[p1-hash-defect] AC1 — verifyHash actual param comes from resolveSkill, not expectedHash');
{
  if (!mod || typeof mod.advance !== 'function') {
    assert(false, 'AC1: advance function missing');
  } else {
    const EXPECTED_HASH   = 'a'.repeat(64);
    const RESOLVED_HASH   = 'c'.repeat(64);  // deliberately different content hash

    let capturedActual    = '__not_called__';
    let capturedExpected  = '__not_called__';
    let resolveSkillCalled = false;

    const mockGovPackage = {
      resolveSkill: (opts) => {
        resolveSkillCalled = true;
        // Return a content hash that is NOT the same as expectedHash
        return { skillId: opts.skillId, content: 'fake content', contentHash: RESOLVED_HASH };
      },
      verifyHash: (opts) => {
        capturedActual   = opts.actual;
        capturedExpected = opts.expected;
        // Return null (no mismatch) so we can inspect what was passed
        return null;
      },
      advanceState: (args) => ({ current: args.next, previous: args.current }),
    };

    mod.advance({
      current:      'discovery',
      next:         'definition',
      declaration:  FIXTURE_DECL,
      govPackage:   mockGovPackage,
      skillId:      'discovery',
      sidecarRoot:  '/fake/root',
      expectedHash: EXPECTED_HASH,
    });

    assert(resolveSkillCalled,
      'AC1a: resolveSkill was called by advance()');
    assert(capturedActual !== '__not_called__',
      'AC1b: verifyHash was called');
    assert(capturedActual === RESOLVED_HASH,
      `AC1c: verifyHash received actual from resolveSkill contentHash (expected "${RESOLVED_HASH.substring(0,8)}...", got "${String(capturedActual).substring(0,8)}...")`);
    assert(capturedActual !== EXPECTED_HASH,
      `AC1d: verifyHash actual is NOT the same as expectedHash (must not be self-comparison)`);
    assert(capturedExpected === EXPECTED_HASH,
      `AC1e: verifyHash expected param equals the caller-supplied expectedHash`);
  }
}

// ── AC2: hash mismatch (resolveSkill contentHash ≠ expectedHash) → HASH_MISMATCH ──
console.log('\n[p1-hash-defect] AC2 — resolveSkill returns different hash → HASH_MISMATCH, advanceState not called');
{
  if (!mod || typeof mod.advance !== 'function') {
    assert(false, 'AC2: advance function missing');
  } else {
    const EXPECTED_HASH = 'a'.repeat(64);
    const ACTUAL_HASH   = 'b'.repeat(64);   // different — mismatch

    let advanceStateCalled = false;

    const mockGovPackage = {
      resolveSkill: () => ({ skillId: 'discovery', content: '', contentHash: ACTUAL_HASH }),
      verifyHash: (opts) => {
        if (opts.expected !== opts.actual) {
          return { error: 'HASH_MISMATCH', skillId: opts.skillId, expected: opts.expected, actual: opts.actual };
        }
        return null;
      },
      advanceState: () => { advanceStateCalled = true; return { current: 'definition' }; },
    };

    let result = null;
    try {
      result = mod.advance({
        current:      'discovery',
        next:         'definition',
        declaration:  FIXTURE_DECL,
        govPackage:   mockGovPackage,
        skillId:      'discovery',
        sidecarRoot:  '/fake/root',
        expectedHash: EXPECTED_HASH,
      });
    } catch (e) { result = { error: e.message }; }

    assert(result !== null,
      'AC2a: advance returns a result');
    assert(result && result.error === 'HASH_MISMATCH',
      `AC2b: result.error is HASH_MISMATCH (got: ${result && result.error})`);
    assert(!advanceStateCalled,
      'AC2c: advanceState was NOT called after hash mismatch');
  }
}

// ── AC3: resolveSkill returns null → SKILL_NOT_FOUND, advanceState not called ──
console.log('\n[p1-hash-defect] AC3 — resolveSkill returns null → SKILL_NOT_FOUND, no advance');
{
  if (!mod || typeof mod.advance !== 'function') {
    assert(false, 'AC3: advance function missing');
  } else {
    let advanceStateCalled = false;
    let verifyHashCalled   = false;

    const mockGovPackage = {
      resolveSkill: () => null,   // skill not found
      verifyHash: () => { verifyHashCalled = true; return null; },
      advanceState: () => { advanceStateCalled = true; return { current: 'definition' }; },
    };

    let result = null;
    try {
      result = mod.advance({
        current:      'discovery',
        next:         'definition',
        declaration:  FIXTURE_DECL,
        govPackage:   mockGovPackage,
        skillId:      'discovery',
        sidecarRoot:  '/fake/root',
        expectedHash: 'a'.repeat(64),
      });
    } catch (e) { result = { error: e.message }; }

    assert(result !== null,
      'AC3a: advance returns a result');
    assert(result && result.error === 'SKILL_NOT_FOUND',
      `AC3b: result.error is SKILL_NOT_FOUND (got: ${result && result.error})`);
    assert(!advanceStateCalled,
      'AC3c: advanceState was NOT called when skill not found');
  }
}

// ── AC4: matching hashes → no error, advanceState called ──────────────────────
console.log('\n[p1-hash-defect] AC4 — contentHash matches expectedHash → success, advanceState called');
{
  if (!mod || typeof mod.advance !== 'function') {
    assert(false, 'AC4: advance function missing');
  } else {
    const HASH = 'a'.repeat(64);   // same in both expected and resolved
    let advanceStateCalled = false;

    const mockGovPackage = {
      resolveSkill: () => ({ skillId: 'discovery', content: '', contentHash: HASH }),
      verifyHash: (opts) => {
        return opts.expected !== opts.actual
          ? { error: 'HASH_MISMATCH', skillId: opts.skillId, expected: opts.expected, actual: opts.actual }
          : null;
      },
      advanceState: (args) => { advanceStateCalled = true; return { current: args.next, previous: args.current }; },
    };

    let result = null;
    let threw  = false;
    try {
      result = mod.advance({
        current:      'discovery',
        next:         'definition',
        declaration:  FIXTURE_DECL,
        govPackage:   mockGovPackage,
        skillId:      'discovery',
        sidecarRoot:  '/fake/root',
        expectedHash: HASH,
      });
    } catch (e) { threw = true; result = { error: e.message }; }

    assert(!threw, `AC4a: advance does not throw on matching hash (threw: ${threw})`);
    assert(result && !result.error,
      `AC4b: result has no error on matching hash (got: ${result && result.error})`);
    assert(advanceStateCalled,
      'AC4c: advanceState was called after successful hash match');
  }
}

// ── AC5 regression: advance without skillId/sidecarRoot preserves existing behaviour ──
console.log('\n[p1-hash-defect] AC5 regression — advance without skillId still enforces transition rules');
{
  if (!mod || typeof mod.advance !== 'function') {
    assert(false, 'AC5: advance function missing');
  } else {
    // Non-permitted transition without skillId — should still fail on transition check
    let result = null;
    try {
      result = mod.advance({
        current:     'discovery',
        next:        'review',     // not permitted from discovery
        declaration: FIXTURE_DECL,
        govPackage:  { verifyHash: () => null, advanceState: () => ({ current: 'review' }) },
        // No skillId, no sidecarRoot
      });
    } catch (e) { result = { error: e.message }; }

    assert(result && result.error === 'TRANSITION_NOT_PERMITTED',
      `AC5a: non-permitted transition without skillId still returns TRANSITION_NOT_PERMITTED (got: ${result && result.error})`);

    // Permitted transition without skillId — should succeed (no hash check when no skillId)
    let result2 = null;
    try {
      result2 = mod.advance({
        current:     'discovery',
        next:        'definition',
        declaration: FIXTURE_DECL,
        govPackage:  { verifyHash: () => null, advanceState: (a) => ({ current: a.next, previous: a.current }) },
        // No skillId, no sidecarRoot
      });
    } catch (e) { result2 = { error: e.message }; }

    assert(result2 && !result2.error,
      `AC5b: permitted transition without skillId succeeds (got: ${result2 && result2.error})`);
  }
}

// ── Summary ────────────────────────────────────────────────────────────────────
console.log(`\n[p1-hash-defect] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('[p1-hash-defect] FAIL — fix src/enforcement/cli-adapter.js advance() to call');
  console.log('  govPackage.resolveSkill({ skillId, sidecarRoot }) and pass contentHash as actual');
  process.exit(1);
} else {
  console.log('[p1-hash-defect] PASS');
}
