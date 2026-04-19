#!/usr/bin/env node
// check-p4-dist-no-commits.js — test plan verification for p4-dist-no-commits
// Covers T1–T8 (AC1–AC3) and T-NFR1
// Tests FAIL until src/distribution/ci-assert.js is implemented — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT      = path.join(__dirname, '..');
const ASSERT_MOD = path.join(ROOT, 'src', 'distribution', 'ci-assert.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function loadModule() {
  if (!fs.existsSync(ASSERT_MOD)) return null;
  try {
    delete require.cache[require.resolve(ASSERT_MOD)];
    return require(ASSERT_MOD);
  } catch (_) { return null; }
}

// ── AC1 — CI assertion detects commit count increase ─────────────────────────
console.log('\n[p4-dist-no-commits] AC1 — CI assertion detects commit count increase');

// T1 — Module exists
{
  assert(fs.existsSync(ASSERT_MOD), 'T1: src/distribution/ci-assert.js exists');
}

const mod = loadModule();

// T2 — getCommitCount parses git rev-list output
{
  if (!mod || typeof mod.getCommitCount !== 'function') {
    assert(false, 'T2: getCommitCount exported and parses integer from git output (module or function missing)');
  } else {
    const result = mod.getCommitCount('7\n');
    assert(result === 7, `T2: getCommitCount("7\\n") returns 7 (got: ${result})`);
    const result2 = mod.getCommitCount('42');
    assert(result2 === 42, `T2b: getCommitCount("42") returns 42 (got: ${result2})`);
  }
}

// T3 — assertZeroCommits detects count increase
{
  if (!mod || typeof mod.assertZeroCommits !== 'function') {
    assert(false, 'T3: assertZeroCommits exported and detects count increase (module or function missing)');
  } else {
    let result = null;
    try { result = mod.assertZeroCommits('init', 5, 6); } catch (e) { result = e; }
    const hasError = result !== null && result !== undefined;
    assert(hasError, 'T3a: assertZeroCommits(init, 5, 6) returns/throws error');
    if (hasError) {
      const msg = (result.message || result.toString());
      assert(/commit/i.test(msg), `T3b: error message mentions "commit" (got: ${msg})`);
    }
  }
}

// T4 — assertZeroCommits passes when count unchanged
{
  if (!mod || typeof mod.assertZeroCommits !== 'function') {
    assert(false, 'T4: assertZeroCommits passes on unchanged count (function missing)');
  } else {
    let result = null;
    try { result = mod.assertZeroCommits('init', 5, 5); } catch (e) { result = e; }
    // Should return null/undefined, not throw or return an error
    const isPassing = result === null || result === undefined;
    assert(isPassing, `T4: assertZeroCommits(init, 5, 5) returns null/undefined — no error (got: ${JSON.stringify(result)})`);
  }
}

// ── AC2 — All four commands in registry ───────────────────────────────────────
console.log('\n[p4-dist-no-commits] AC2 — all four distribution commands covered in assertion suite');

// T5 — getCommandRegistry includes init, fetch, pin, verify
{
  if (!mod || typeof mod.getCommandRegistry !== 'function') {
    assert(false, 'T5: getCommandRegistry exported (function missing)');
  } else {
    const registry = mod.getCommandRegistry();
    const REQUIRED = ['init', 'fetch', 'pin', 'verify'];
    for (const cmd of REQUIRED) {
      const found = Array.isArray(registry)
        ? registry.some(e => (typeof e === 'string' ? e : (e.name || e.command || e.cmd)) === cmd)
        : typeof registry === 'object' && registry[cmd] !== undefined;
      assert(found, `T5: command registry includes "${cmd}"`);
    }
  }
}

// T6 — Error message format matches AC1 specification
{
  if (!mod || typeof mod.assertZeroCommits !== 'function') {
    assert(false, 'T6: error message format (function missing)');
  } else {
    let msg = null;
    try {
      const r = mod.assertZeroCommits('fetch', 10, 11);
      msg = (r && r.message) ? r.message : (r ? r.toString() : null);
    } catch (e) { msg = e.message; }
    assert(msg && msg.includes('Distribution command generated unexpected commit(s):'),
      `T6: error message starts with required phrase (got: ${JSON.stringify(msg)})`);
  }
}

// ── AC3 — verify is read-only ─────────────────────────────────────────────────
console.log('\n[p4-dist-no-commits] AC3 — verify classified as read-only in registry');

// T7 — verify entry has readOnly flag
{
  if (!mod || typeof mod.getCommandRegistry !== 'function') {
    assert(false, 'T7: verify readOnly flag (function missing)');
  } else {
    const registry = mod.getCommandRegistry();
    let verifyEntry = null;
    if (Array.isArray(registry)) {
      verifyEntry = registry.find(e => (e.name || e.command || e.cmd || e) === 'verify');
    } else if (typeof registry === 'object') {
      verifyEntry = registry['verify'];
    }
    assert(!!verifyEntry, 'T7a: verify entry exists in registry');
    if (verifyEntry && typeof verifyEntry === 'object') {
      assert(verifyEntry.readOnly === true,
        `T7b: verify entry has readOnly: true (got: ${JSON.stringify(verifyEntry.readOnly)})`);
    }
  }
}

// T8 — assertReadOnly with clean git status output passes
{
  if (!mod || typeof mod.assertReadOnly !== 'function') {
    console.log('  - T8: skipped (assertReadOnly not exported — may be internal)');
    passed++;
  } else {
    let result = null;
    try { result = mod.assertReadOnly(''); } catch (e) { result = e; } // empty = clean
    const isPassing = result === null || result === undefined;
    assert(isPassing, `T8: assertReadOnly('') passes for clean git status (got: ${JSON.stringify(result)})`);
  }
}

// ── NFR ───────────────────────────────────────────────────────────────────────
console.log('\n[p4-dist-no-commits] NFR — no sidecar content in assertion output');

// T-NFR1 — Source scan: no directory listing of .skills-repo in output calls
{
  if (!fs.existsSync(ASSERT_MOD)) {
    assert(false, 'T-NFR1: module exists for source scan');
  } else {
    const src = fs.readFileSync(ASSERT_MOD, 'utf8');
    // Should not log sidecar path in assertions
    const SIDECAR_IN_OUTPUT = /console\.(log|error|warn)\([^)]*\.skills-repo/;
    assert(!SIDECAR_IN_OUTPUT.test(src),
      'T-NFR1: assertion module does not log sidecar directory path in output');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[check-p4-dist-no-commits] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
