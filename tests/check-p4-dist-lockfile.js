#!/usr/bin/env node
// check-p4-dist-lockfile.js — test plan verification for p4-dist-lockfile
// Covers T1–T8 (AC1–AC4) and T-NFR1, T-NFR2
// Tests FAIL until src/distribution/lockfile.js is implemented — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs     = require('fs');
const path   = require('path');
const os     = require('os');
const crypto = require('crypto');

const ROOT       = path.join(__dirname, '..');
const LOCK_MOD   = path.join(ROOT, 'src', 'distribution', 'lockfile.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function loadModule() {
  if (!fs.existsSync(LOCK_MOD)) return null;
  try {
    delete require.cache[require.resolve(LOCK_MOD)];
    return require(LOCK_MOD);
  } catch (_) { return null; }
}

function cleanup(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

// Minimal valid lockfile fixture
const VALID_FIXTURE = {
  upstreamSource: 'https://upstream.example.com/skills.git',
  pinnedRef: 'abc1234',
  pinnedAt: '2026-04-19T10:00:00Z',
  platformVersion: '4.0.0',
  skills: [
    { skillId: 'discovery', contentHash: 'a'.repeat(64) },
  ],
};

// ── AC1 — Schema validation ───────────────────────────────────────────────────
console.log('\n[p4-dist-lockfile] AC1 — schema validation detects missing fields');

// T1 — Module exists
{
  assert(fs.existsSync(LOCK_MOD), 'T1: src/distribution/lockfile.js exists');
}

const mod = loadModule();

// T2 — validateSchema with valid fixture returns null
{
  if (!mod || typeof mod.validateSchema !== 'function') {
    assert(false, 'T2: validateSchema exported (module or function missing)');
  } else {
    let result = null;
    try { result = mod.validateSchema(VALID_FIXTURE); } catch (e) { result = e; }
    assert(result === null || result === undefined,
      `T2: validateSchema(validFixture) returns null (got: ${JSON.stringify(result)})`);
  }
}

// T3 — validateSchema with missing pinnedRef returns error naming the field
{
  if (!mod || typeof mod.validateSchema !== 'function') {
    assert(false, 'T3: validateSchema detects missing field (function missing)');
  } else {
    const bad = Object.assign({}, VALID_FIXTURE);
    delete bad.pinnedRef;
    let err = null;
    try {
      const r = mod.validateSchema(bad);
      if (r !== null && r !== undefined) err = r;
    } catch (e) { err = e; }
    const msg = err ? (err.message || err.toString() || JSON.stringify(err)) : '';
    assert(err !== null, 'T3a: validateSchema(missingPinnedRef) returns error');
    assert(msg.includes('pinnedRef'), `T3b: error message names "pinnedRef" field (got: ${msg.substring(0, 80)})`);
  }
}

// ── AC2 — verifyLockfile uses content hash ────────────────────────────────────
console.log('\n[p4-dist-lockfile] AC2 — verifyLockfile detects tampered skill content');

// T4 — verifyLockfile with matching hash passes
{
  if (!mod || typeof mod.verifyLockfile !== 'function' || typeof mod.computeHash !== 'function') {
    assert(false, 'T4: verifyLockfile with matching hash passes (module/functions missing)');
  } else {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lockfile-test-'));
    try {
      const content = Buffer.from('skill content for test');
      const hash = mod.computeHash(content);
      const lf = Object.assign({}, VALID_FIXTURE, {
        skills: [{ skillId: 'test-skill', contentHash: hash }],
      });
      const skillPath = path.join(tmp, 'test-skill.md');
      fs.writeFileSync(skillPath, content);
      let result = null;
      try { result = mod.verifyLockfile(lf, tmp); } catch (e) { result = e; }
      assert(result === null || result === undefined,
        `T4: verifyLockfile with matching hash returns null (got: ${JSON.stringify(result)})`);
    } finally { cleanup(tmp); }
  }
}

// T5 — verifyLockfile with mismatching hash returns error with skillId and expected/got
{
  if (!mod || typeof mod.verifyLockfile !== 'function' || typeof mod.computeHash !== 'function') {
    assert(false, 'T5: verifyLockfile with mismatching hash (functions missing)');
  } else {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lockfile-test-'));
    try {
      const content = Buffer.from('original skill content');
      const hash = mod.computeHash(content);
      const lf = Object.assign({}, VALID_FIXTURE, {
        skills: [{ skillId: 'tampered-skill', contentHash: hash }],
      });
      const skillPath = path.join(tmp, 'tampered-skill.md');
      // Write different content to simulate tampering
      fs.writeFileSync(skillPath, 'tampered content differs from hash');
      let err = null;
      try {
        const r = mod.verifyLockfile(lf, tmp);
        if (r !== null && r !== undefined) err = r;
      } catch (e) { err = e; }
      const msg = err ? (err.message || err.toString() || JSON.stringify(err)) : '';
      assert(err !== null, 'T5a: verifyLockfile with mismatching hash returns error');
      assert(msg.includes('tampered-skill'), `T5b: error message includes skillId (got: ${msg.substring(0, 120)})`);
      assert(/expected|got/i.test(msg), `T5c: error message includes "expected" or "got" (got: ${msg.substring(0, 120)})`);
    } finally { cleanup(tmp); }
  }
}

// ── AC3 — computeHash is deterministic ───────────────────────────────────────
console.log('\n[p4-dist-lockfile] AC3 — SHA-256 hash is deterministic (same input → same output)');

// T6 — computeHash called twice → same result
{
  if (!mod || typeof mod.computeHash !== 'function') {
    assert(false, 'T6: computeHash exported (function missing)');
  } else {
    const buf = Buffer.from('test content for hashing consistency');
    const hash1 = mod.computeHash(buf);
    const hash2 = mod.computeHash(buf);
    assert(hash1 === hash2, `T6: two computeHash calls produce same result (${hash1} vs ${hash2})`);
  }
}

// ── AC4 — End-to-end: modify file → verify fails ─────────────────────────────
console.log('\n[p4-dist-lockfile] AC4 — end-to-end: pin then tamper then verify → hash mismatch');

// T7 — pin + modify skill + verify → hash mismatch
{
  if (!mod || typeof mod.computeHash !== 'function' || typeof mod.writeLockfile !== 'function' || typeof mod.verifyLockfile !== 'function') {
    assert(false, 'T7: end-to-end pin/tamper/verify (writeLockfile or verifyLockfile missing)');
  } else {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lockfile-e2e-'));
    try {
      // Write a skill file
      const skillPath = path.join(tmp, 'discovery.md');
      fs.writeFileSync(skillPath, '# Discovery skill — original content');
      const content = fs.readFileSync(skillPath);
      const hash = mod.computeHash(content);

      // Write lockfile
      const lf = Object.assign({}, VALID_FIXTURE, {
        skills: [{ skillId: 'discovery', contentHash: hash }],
      });
      const lockPath = path.join(tmp, 'skills-lock.json');
      mod.writeLockfile(lockPath, lf);
      const written = JSON.parse(fs.readFileSync(lockPath, 'utf8'));

      // Tamper
      fs.appendFileSync(skillPath, '\n<!-- tampered -->');

      // Verify should fail
      let err = null;
      try {
        const r = mod.verifyLockfile(written, tmp);
        if (r !== null && r !== undefined) err = r;
      } catch (e) { err = e; }
      assert(err !== null, 'T7: verify after tampering returns error (hash mismatch detected)');
    } finally { cleanup(tmp); }
  }
}

// T8 — This test file is part of npm test coverage
{
  const pkgPath = path.join(ROOT, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    assert(false, 'T8: package.json exists for coverage check');
  } else {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const testScript = (pkg.scripts && pkg.scripts.test) || '';
    // Either directly named or covered by glob
    const covered = testScript.includes('check-p4-dist-lockfile')
      || testScript.includes('tests/**')
      || testScript.includes('tests/*.js')
      || testScript.includes('check-p4-dist-');
    assert(covered, `T8: check-p4-dist-lockfile.js covered by npm test script (script: ${testScript.substring(0, 120)})`);
  }
}

// ── NFR ───────────────────────────────────────────────────────────────────────
console.log('\n[p4-dist-lockfile] NFR — no credentials in lockfile; hash is 64-char hex');

// T-NFR1 — writeLockfile output has no credential fields
{
  if (!mod || typeof mod.writeLockfile !== 'function') {
    assert(false, 'T-NFR1: writeLockfile exported for credential check (function missing)');
  } else {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lockfile-nfr-'));
    try {
      const lockPath = path.join(tmp, 'skills-lock.json');
      mod.writeLockfile(lockPath, VALID_FIXTURE);
      const content = fs.readFileSync(lockPath, 'utf8');
      const CRED_RE = /\btoken\b|\bpassword\b|\bsecret\b|\bemail\b|\btenantId\b/i;
      assert(!CRED_RE.test(content),
        `T-NFR1: no credential fields in written lockfile (found in: ${content.substring(0, 120)})`);
    } finally { cleanup(tmp); }
  }
}

// T-NFR2 — computeHash(Buffer.from('test')).length === 64
{
  if (!mod || typeof mod.computeHash !== 'function') {
    assert(false, 'T-NFR2: computeHash exported (function missing)');
  } else {
    const hash = mod.computeHash(Buffer.from('test'));
    assert(typeof hash === 'string' && hash.length === 64,
      `T-NFR2: computeHash produces 64-char hex string (got length: ${typeof hash === 'string' ? hash.length : typeof hash})`);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[check-p4-dist-lockfile] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
