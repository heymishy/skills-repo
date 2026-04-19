#!/usr/bin/env node
// check-p4-dist-upgrade.js — test plan verification for p4-dist-upgrade
// Covers T1–T8 (AC1–AC4) and T-NFR1, T-NFR2
// Tests FAIL until src/distribution/upgrade.js is implemented — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const ROOT       = path.join(__dirname, '..');
const UPGRADE_MOD = path.join(ROOT, 'src', 'distribution', 'upgrade.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function loadModule() {
  if (!fs.existsSync(UPGRADE_MOD)) return null;
  try {
    delete require.cache[require.resolve(UPGRADE_MOD)];
    return require(UPGRADE_MOD);
  } catch (_) { return null; }
}

function cleanup(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'upgrade-test-'));
}

const OLD_LOCKFILE = {
  upstreamSource: 'https://upstream.example.com/skills.git',
  pinnedRef: 'old-ref-abc',
  pinnedAt: '2026-04-01T10:00:00Z',
  platformVersion: '3.9.0',
  skills: [
    { skillId: 'discovery', contentHash: 'a'.repeat(64) },
    { skillId: 'definition', contentHash: 'b'.repeat(64) },
  ],
};

const NEW_LOCKFILE = {
  upstreamSource: 'https://upstream.example.com/skills.git',
  pinnedRef: 'new-ref-xyz',
  pinnedAt: '2026-04-19T10:00:00Z',
  platformVersion: '4.0.0',
  skills: [
    { skillId: 'discovery', contentHash: 'c'.repeat(64) },   // modified
    { skillId: 'definition', contentHash: 'b'.repeat(64) },  // unchanged
    { skillId: 'test-plan', contentHash: 'd'.repeat(64) },   // added
  ],
};

const POLICY_LOCKFILE_OLD = {
  upstreamSource: 'https://upstream.example.com/skills.git',
  pinnedRef: 'old-policy-ref',
  pinnedAt: '2026-04-01T10:00:00Z',
  platformVersion: '3.9.0',
  skills: [
    { skillId: 'POLICY', contentHash: 'a'.repeat(64), floor: '3.9.0' },
  ],
};

const POLICY_LOCKFILE_NEW = {
  upstreamSource: 'https://upstream.example.com/skills.git',
  pinnedRef: 'new-policy-ref',
  pinnedAt: '2026-04-19T10:00:00Z',
  platformVersion: '4.0.0',
  skills: [
    { skillId: 'POLICY', contentHash: 'e'.repeat(64), floor: '4.0.0' },
  ],
};

// ── AC1 — generateDiff returns structured diff ────────────────────────────────
console.log('\n[p4-dist-upgrade] AC1 — generateDiff returns added/modified/removed arrays');

// T1 — Module exists
{
  assert(fs.existsSync(UPGRADE_MOD), 'T1: src/distribution/upgrade.js exists');
}

const mod = loadModule();

// T2 — generateDiff returns added, modified, removed arrays
{
  if (!mod || typeof mod.generateDiff !== 'function') {
    assert(false, 'T2: generateDiff exported (module or function missing)');
  } else {
    let result = null;
    try { result = mod.generateDiff(OLD_LOCKFILE, NEW_LOCKFILE); } catch (e) { result = null; }
    assert(result !== null, 'T2a: generateDiff does not throw');
    if (result) {
      assert(Array.isArray(result.added),    'T2b: generateDiff result has "added" array');
      assert(Array.isArray(result.modified), 'T2c: generateDiff result has "modified" array');
      assert(Array.isArray(result.removed),  'T2d: generateDiff result has "removed" array');
      assert(result.added.some(e => (e.skillId || e) === 'test-plan'),
        'T2e: added includes "test-plan"');
      assert(result.modified.some(e => (e.skillId || e) === 'discovery'),
        'T2f: modified includes "discovery"');
    }
  }
}

// T3 — POLICY.md floor change highlighted in diff
{
  if (!mod || typeof mod.generateDiff !== 'function') {
    assert(false, 'T3: POLICY floor change highlighted (function missing)');
  } else {
    let result = null;
    try { result = mod.generateDiff(POLICY_LOCKFILE_OLD, POLICY_LOCKFILE_NEW); } catch (e) { result = null; }
    if (!result) {
      assert(false, 'T3: generateDiff for POLICY change returns result');
    } else {
      const allEntries = [
        ...(result.added || []),
        ...(result.modified || []),
      ];
      const policyEntry = allEntries.find(e => {
        const label = e.label || e.description || e.note || JSON.stringify(e);
        return /POLICY FLOOR CHANGE/i.test(label);
      });
      assert(!!policyEntry, 'T3: POLICY.md floor change results in diff entry with "POLICY FLOOR CHANGE" label');
    }
  }
}

// ── AC2 — performUpgrade: confirm → updates lockfile ─────────────────────────
console.log('\n[p4-dist-upgrade] AC2 — performUpgrade with confirm updates lockfile with audit trail');

// T4 — performUpgrade with confirm: false → no file changes
{
  if (!mod || typeof mod.performUpgrade !== 'function') {
    assert(false, 'T4: performUpgrade exported (function missing)');
  } else {
    const tmp = makeTempDir();
    const lockPath = path.join(tmp, 'skills-lock.json');
    fs.writeFileSync(lockPath, JSON.stringify(OLD_LOCKFILE));
    const snapshot = fs.readFileSync(lockPath, 'utf8');
    try {
      mod.performUpgrade({ root: tmp, newLockfile: NEW_LOCKFILE, confirm: false });
    } catch (_) {} // allowed to throw or silently no-op
    const after = fs.existsSync(lockPath) ? fs.readFileSync(lockPath, 'utf8') : '';
    assert(after === snapshot, 'T4: performUpgrade(confirm:false) leaves lockfile unchanged');
    cleanup(tmp);
  }
}

// T5 — performUpgrade with confirm: true → lockfile pinnedRef updated
{
  if (!mod || typeof mod.performUpgrade !== 'function') {
    assert(false, 'T5: performUpgrade(confirm:true) updates pinnedRef (function missing)');
  } else {
    const tmp = makeTempDir();
    const lockPath = path.join(tmp, 'skills-lock.json');
    fs.writeFileSync(lockPath, JSON.stringify(OLD_LOCKFILE));
    try {
      mod.performUpgrade({ root: tmp, newLockfile: NEW_LOCKFILE, confirm: true });
    } catch (_) {}
    if (!fs.existsSync(lockPath)) {
      assert(false, 'T5: lockfile still exists after upgrade');
    } else {
      const lf = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      assert(lf.pinnedRef === 'new-ref-xyz',
        `T5: pinnedRef updated to new value (got: ${lf.pinnedRef})`);
    }
    cleanup(tmp);
  }
}

// T6 — After confirmed upgrade, lockfile has previousPinnedRef
{
  if (!mod || typeof mod.performUpgrade !== 'function') {
    assert(false, 'T6: previousPinnedRef audit trail (function missing)');
  } else {
    const tmp = makeTempDir();
    const lockPath = path.join(tmp, 'skills-lock.json');
    fs.writeFileSync(lockPath, JSON.stringify(OLD_LOCKFILE));
    try {
      mod.performUpgrade({ root: tmp, newLockfile: NEW_LOCKFILE, confirm: true });
    } catch (_) {}
    if (!fs.existsSync(lockPath)) {
      assert(false, 'T6: lockfile exists after upgrade for previousPinnedRef check');
    } else {
      const lf = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      assert(lf.previousPinnedRef === 'old-ref-abc',
        `T6: lockfile has previousPinnedRef = old ref (got: ${lf.previousPinnedRef})`);
    }
    cleanup(tmp);
  }
}

// ── AC3 — Non-interactive / no confirm → error ────────────────────────────────
console.log('\n[p4-dist-upgrade] AC3 — non-interactive upgrade without confirm → error');

// T8 — performUpgrade in non-interactive CI mode without --confirm → error
{
  if (!mod || typeof mod.performUpgrade !== 'function') {
    assert(false, 'T8: performUpgrade CI guard (function missing)');
  } else {
    const tmp = makeTempDir();
    let caught = null;
    try {
      const r = mod.performUpgrade({ root: tmp, newLockfile: NEW_LOCKFILE, interactive: false, confirmFlag: false });
      if (r && r.message) caught = r.message;
    } catch (e) { caught = e.message; }
    finally { cleanup(tmp); }
    assert(caught && /upgrade requires operator confirmation/i.test(caught),
      `T8: error message for non-interactive non-confirm mode (got: ${JSON.stringify(caught)})`);
  }
}

// ── AC4 — verifyLockfile called after upgrade ─────────────────────────────────
console.log('\n[p4-dist-upgrade] AC4 — performUpgrade calls verifyLockfile before returning');

// T7 — source scan: performUpgrade calls verifyLockfile
{
  if (!fs.existsSync(UPGRADE_MOD)) {
    assert(false, 'T7: module exists for source scan');
  } else {
    const src = fs.readFileSync(UPGRADE_MOD, 'utf8');
    // Either direct call or require of lockfile module + verify call
    const VERIFY_RE = /verifyLockfile|verify_lockfile|lockfile\.verify/;
    assert(VERIFY_RE.test(src), 'T7: upgrade module source references verifyLockfile call');
  }
}

// ── NFR ───────────────────────────────────────────────────────────────────────
console.log('\n[p4-dist-upgrade] NFR — no credentials in diff output; atomicity on failure');

// T-NFR1 — generateDiff output contains no credential strings
{
  if (!mod || typeof mod.generateDiff !== 'function') {
    assert(false, 'T-NFR1: generateDiff (function missing)');
  } else {
    let result = null;
    try { result = mod.generateDiff(OLD_LOCKFILE, NEW_LOCKFILE); } catch (_) {}
    const serialised = result ? JSON.stringify(result) : '';
    const CRED_RE = /token|bearer|password|secret/i;
    assert(!CRED_RE.test(serialised),
      `T-NFR1: diff output has no credential strings (checked in: ${serialised.substring(0, 120)})`);
  }
}

// T-NFR2 — sidecar unchanged if upgrade fails mid-write
{
  // This is an implementation contract test — check that upgrade.js handles atomic write
  if (!fs.existsSync(UPGRADE_MOD)) {
    assert(false, 'T-NFR2: module exists for atomicity check');
  } else {
    const src = fs.readFileSync(UPGRADE_MOD, 'utf8');
    // Acceptable patterns: tmp file + rename, try/catch with restore, rollback function reference
    const ATOMIC_RE = /\.tmp['"]|tmp.*rename|rename.*tmp|rollback|catch.*restore|catch.*cleanup/i;
    assert(ATOMIC_RE.test(src), 'T-NFR2: upgrade module uses atomic write pattern (tmp rename or rollback)');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[check-p4-dist-upgrade] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
