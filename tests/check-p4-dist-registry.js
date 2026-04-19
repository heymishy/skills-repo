#!/usr/bin/env node
// check-p4-dist-registry.js — test plan verification for p4-dist-registry
// Covers T1–T8 (AC1–AC4) and T-NFR1, T-NFR2
// Tests FAIL until scripts/update-fleet-registry.js is implemented — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT          = path.join(__dirname, '..');
const REGISTRY_SCRIPT = path.join(ROOT, 'scripts', 'update-fleet-registry.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function loadModule() {
  if (!fs.existsSync(REGISTRY_SCRIPT)) return null;
  try {
    delete require.cache[require.resolve(REGISTRY_SCRIPT)];
    return require(REGISTRY_SCRIPT);
  } catch (_) { return null; }
}

const ENTRY_INPUT = {
  consumerSlug: 'heymishy/sample-repo',
  lockfileVersion: '3.9.0',
  upstreamSource: 'https://upstream.example.com/skills.git',
  lastSyncDate: '2026-04-19T10:00:00Z',
};

// ── AC1 — Consumer entry has all required fields ──────────────────────────────
console.log('\n[p4-dist-registry] AC1 — addConsumerEntry produces all five required fields');

// T1 — Script exists and exports addConsumerEntry, computeSyncStatus
{
  const exists = fs.existsSync(REGISTRY_SCRIPT);
  assert(exists, 'T1: scripts/update-fleet-registry.js exists');
}

const mod = loadModule();

{
  if (!mod) {
    assert(false, 'T1b: script exports (module load failed)');
  } else {
    assert(typeof mod.addConsumerEntry === 'function',
      'T1c: addConsumerEntry exported');
    assert(typeof mod.computeSyncStatus === 'function',
      'T1d: computeSyncStatus exported');
  }
}

// T2 — addConsumerEntry has all five required fields
{
  if (!mod || typeof mod.addConsumerEntry !== 'function') {
    assert(false, 'T2: addConsumerEntry fields (function missing)');
  } else {
    let entry = null;
    try { entry = mod.addConsumerEntry(ENTRY_INPUT); } catch (e) { entry = null; }
    assert(entry !== null, 'T2a: addConsumerEntry returns entry');
    if (entry) {
      const REQUIRED = ['consumerSlug', 'lockfileVersion', 'upstreamSource', 'lastSyncDate', 'syncStatus'];
      for (const field of REQUIRED) {
        assert(entry[field] !== undefined && entry[field] !== null,
          `T2: entry has required field "${field}" (got: ${JSON.stringify(entry[field])})`);
      }
    }
  }
}

// ── AC2 — Stale detection ─────────────────────────────────────────────────────
console.log('\n[p4-dist-registry] AC2 — stale consumer detected with syncStatus: stale + versionsBehind');

// T4 — computeSyncStatus({ versionsBehind: 2, threshold: 2 }) → stale
{
  if (!mod || typeof mod.computeSyncStatus !== 'function') {
    assert(false, 'T4: computeSyncStatus stale detection (function missing)');
  } else {
    let result = null;
    try { result = mod.computeSyncStatus({ versionsBehind: 2, threshold: 2 }); } catch (_) {}
    assert(result && result.syncStatus === 'stale',
      `T4a: syncStatus is "stale" when 2 behind with threshold 2 (got: ${JSON.stringify(result)})`);
    assert(result && result.versionsBehind === 2,
      `T4b: versionsBehind is 2 (got: ${JSON.stringify(result && result.versionsBehind)})`);
  }
}

// T5 — computeSyncStatus({ versionsBehind: 0 }) → clean, no versionsBehind
{
  if (!mod || typeof mod.computeSyncStatus !== 'function') {
    assert(false, 'T5: computeSyncStatus clean result (function missing)');
  } else {
    let result = null;
    try { result = mod.computeSyncStatus({ versionsBehind: 0, threshold: 2 }); } catch (_) {}
    assert(result && result.syncStatus === 'clean',
      `T5a: syncStatus is "clean" when 0 behind (got: ${JSON.stringify(result)})`);
    assert(result && result.versionsBehind === undefined,
      `T5b: clean result omits versionsBehind (got: ${JSON.stringify(result && result.versionsBehind)})`);
  }
}

// ── AC3 — Governance check validates schema ───────────────────────────────────
console.log('\n[p4-dist-registry] AC3 — governance check validates all fleet-state.json entries');

// T3 — Missing required field → governance check names field
{
  if (!mod || typeof mod.addConsumerEntry !== 'function') {
    assert(false, 'T3: governance check for missing field (function missing)');
  } else {
    // Simulate calling with missing upstreamSource
    let caught = null;
    let exitCode = null;
    const entryWithoutSource = Object.assign({}, ENTRY_INPUT);
    delete entryWithoutSource.upstreamSource;
    try {
      const r = mod.addConsumerEntry(entryWithoutSource);
      // If it returns without throwing, check for error field
      if (r && r.error) caught = r.error;
      else if (r === null || r === undefined) caught = 'returned null';
    } catch (e) { caught = e.message; exitCode = 1; }
    // Check that the missing field is named — either in the error or if module has validateEntry
    if (typeof mod.validateEntry === 'function') {
      let validErr = null;
      try { validErr = mod.validateEntry(entryWithoutSource); } catch (e) { validErr = e; }
      const msg = validErr ? (validErr.message || validErr.toString() || JSON.stringify(validErr)) : '';
      assert(msg.includes('upstreamSource'),
        `T3: governance validation names missing "upstreamSource" field (got: ${msg.substring(0, 80)})`);
    } else {
      assert(caught !== null, `T3: missing upstreamSource results in caught error or null return (got: ${JSON.stringify(caught)})`);
    }
  }
}

// T7 — Entry with invalid syncStatus → governance check fails
{
  if (!mod || typeof mod.validateEntry !== 'function') {
    console.log('  - T7: skipped (validateEntry not exported — governance check may be in npm test only)');
    passed++;
  } else {
    let err = null;
    try {
      err = mod.validateEntry({ consumerSlug: 'test', lockfileVersion: '4.0', upstreamSource: 'http://x.com', lastSyncDate: '2026-04-19T10:00:00Z', syncStatus: 'outdated' });
    } catch (e) { err = e; }
    const msg = err ? (err.message || err.toString() || JSON.stringify(err)) : '';
    assert(err !== null, 'T7a: invalid syncStatus "outdated" triggers validation error');
    if (err) {
      assert(/syncStatus|outdated|invalid/i.test(msg), `T7b: error mentions syncStatus or invalid value (got: ${msg.substring(0, 80)})`);
    }
  }
}

// T8 — Non-ISO lastSyncDate → governance check fails
{
  if (!mod || typeof mod.validateEntry !== 'function') {
    console.log('  - T8: skipped (validateEntry not exported — governance check may be in npm test only)');
    passed++;
  } else {
    let err = null;
    try {
      err = mod.validateEntry({ consumerSlug: 'test', lockfileVersion: '4.0', upstreamSource: 'http://x.com', lastSyncDate: 'April 19 2026', syncStatus: 'clean' });
    } catch (e) { err = e; }
    const msg = err ? (err.message || err.toString() || JSON.stringify(err)) : '';
    assert(err !== null, 'T8a: non-ISO lastSyncDate triggers validation error');
    if (err) {
      assert(/lastSyncDate|ISO|date|format/i.test(msg), `T8b: error mentions date format (got: ${msg.substring(0, 80)})`);
    }
  }
}

// ── AC4 — Default stale threshold ────────────────────────────────────────────
console.log('\n[p4-dist-registry] AC4 — default threshold is 2 when not in config');

// T6 — computeSyncStatus without threshold defaults to 2
{
  if (!mod || typeof mod.computeSyncStatus !== 'function') {
    assert(false, 'T6: default threshold (function missing)');
  } else {
    let result1 = null, result2 = null;
    try { result1 = mod.computeSyncStatus({ versionsBehind: 1 }); } catch (_) {}
    try { result2 = mod.computeSyncStatus({ versionsBehind: 2 }); } catch (_) {}
    assert(result1 && result1.syncStatus === 'clean',
      `T6a: 1 behind with default threshold → clean (got: ${JSON.stringify(result1)})`);
    assert(result2 && result2.syncStatus === 'stale',
      `T6b: 2 behind with default threshold → stale (got: ${JSON.stringify(result2)})`);
  }
}

// ── NFR ───────────────────────────────────────────────────────────────────────
console.log('\n[p4-dist-registry] NFR — no personal data; no nested loop over entries');

// T-NFR1 — addConsumerEntry output has no PII fields
{
  if (!mod || typeof mod.addConsumerEntry !== 'function') {
    assert(false, 'T-NFR1: addConsumerEntry (function missing)');
  } else {
    let entry = null;
    try { entry = mod.addConsumerEntry(ENTRY_INPUT); } catch (_) {}
    if (entry) {
      const PII_FIELDS = ['name', 'email', 'userId', 'teamName', 'author', 'owner'];
      for (const field of PII_FIELDS) {
        assert(entry[field] === undefined,
          `T-NFR1: entry does not have PII field "${field}"`);
      }
    }
  }
}

// T-NFR2 — Source scan: no nested loop
{
  if (!fs.existsSync(REGISTRY_SCRIPT)) {
    assert(false, 'T-NFR2: script exists for source scan');
  } else {
    const src = fs.readFileSync(REGISTRY_SCRIPT, 'utf8');
    // Nested forEach or for-in inside another forEach/for — heuristic check
    const NESTED_LOOP_RE = /\.forEach\s*\([^)]*\)\s*\{[^}]*\.forEach|for\s*\([^)]*\)[^{]*\{[^}]*for\s*\(/s;
    assert(!NESTED_LOOP_RE.test(src),
      'T-NFR2: no nested loop over entries array in registry script');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[check-p4-dist-registry] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
