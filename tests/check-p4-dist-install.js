#!/usr/bin/env node
// check-p4-dist-install.js — test plan verification for p4-dist-install
// Covers T1–T8 (AC1–AC4) and T-NFR1, T-NFR2
// Tests FAIL until src/distribution/install.js is implemented — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const ROOT       = path.join(__dirname, '..');
const INSTALL_MOD = path.join(ROOT, 'src', 'distribution', 'install.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function loadModule() {
  if (!fs.existsSync(INSTALL_MOD)) return null;
  try {
    delete require.cache[require.resolve(INSTALL_MOD)];
    return require(INSTALL_MOD);
  } catch (_) { return null; }
}

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'dist-install-test-'));
}

function cleanup(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

// Fixture config for tests that need a valid context
const FIXTURE_CONFIG = {
  skills_upstream: {
    repo: 'https://test-upstream.example.com/skills.git',
    paths: ['.github/skills'],
    strategy: 'copy',
  },
};

// ── AC1 — Install creates sidecar, lockfile, and gitignore entry ──────────────
console.log('\n[p4-dist-install] AC1 — install creates sidecar, lockfile, gitignore; zero commits');

// T1 — Module exists
{
  assert(fs.existsSync(INSTALL_MOD), 'T1: src/distribution/install.js exists');
}

const mod = loadModule();

// T2 — install with valid config creates sidecar directory
{
  if (!mod || typeof mod.install !== 'function') {
    assert(false, 'T2: install exported and creates sidecar directory (module or function missing)');
  } else {
    const tmp = makeTempDir();
    try {
      mod.install({ root: tmp, config: FIXTURE_CONFIG });
      // Sidecar directory should exist — accept .skills-repo or the path from Spike C
      const candidates = ['.skills-repo', 'skills-sidecar', '.skills'];
      const found = candidates.find(c => fs.existsSync(path.join(tmp, c)));
      assert(!!found, `T2: sidecar directory created (checked: ${candidates.join(', ')})`);
    } catch (e) {
      assert(false, `T2: install threw unexpectedly: ${e.message}`);
    } finally { cleanup(tmp); }
  }
}

// T3 — Sidecar is listed in .gitignore
{
  if (!mod || typeof mod.install !== 'function') {
    assert(false, 'T3: sidecar in .gitignore (function missing)');
  } else {
    const tmp = makeTempDir();
    try {
      mod.install({ root: tmp, config: FIXTURE_CONFIG });
      const gitignorePath = path.join(tmp, '.gitignore');
      if (!fs.existsSync(gitignorePath)) {
        assert(false, 'T3: .gitignore created by install');
      } else {
        const content = fs.readFileSync(gitignorePath, 'utf8');
        // Accept any sidecar path entry
        const hasSidecarEntry = /\.skills-repo|skills-sidecar|\.skills/.test(content);
        assert(hasSidecarEntry, `T3: sidecar directory appears in .gitignore (content: ${content.substring(0, 80)})`);
      }
    } catch (e) {
      assert(false, `T3: sidecar gitignore check threw: ${e.message}`);
    } finally { cleanup(tmp); }
  }
}

// T4 — Lockfile exists inside sidecar
{
  if (!mod || typeof mod.install !== 'function') {
    assert(false, 'T4: lockfile exists in sidecar (function missing)');
  } else {
    const tmp = makeTempDir();
    try {
      mod.install({ root: tmp, config: FIXTURE_CONFIG });
      const candidates = [
        path.join(tmp, '.skills-repo', 'skills-lock.json'),
        path.join(tmp, 'skills-sidecar', 'skills-lock.json'),
        path.join(tmp, '.skills', 'skills-lock.json'),
      ];
      const found = candidates.find(c => fs.existsSync(c));
      assert(!!found, 'T4: lockfile (skills-lock.json) exists inside sidecar');
    } catch (e) {
      assert(false, `T4: lockfile check threw: ${e.message}`);
    } finally { cleanup(tmp); }
  }
}

// T5 — Lockfile has all minimum required fields
{
  if (!mod || typeof mod.install !== 'function') {
    assert(false, 'T5: lockfile minimum fields (function missing)');
  } else {
    const tmp = makeTempDir();
    try {
      mod.install({ root: tmp, config: FIXTURE_CONFIG });
      const candidates = [
        path.join(tmp, '.skills-repo', 'skills-lock.json'),
        path.join(tmp, 'skills-sidecar', 'skills-lock.json'),
        path.join(tmp, '.skills', 'skills-lock.json'),
      ];
      const lockPath = candidates.find(c => fs.existsSync(c));
      if (!lockPath) {
        assert(false, 'T5: lockfile not found for field check');
      } else {
        const lf = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
        const REQUIRED = ['upstreamSource', 'pinnedRef', 'pinnedAt', 'platformVersion', 'skills'];
        for (const field of REQUIRED) {
          assert(lf[field] !== undefined && lf[field] !== null,
            `T5: lockfile has required field "${field}" (got: ${JSON.stringify(lf[field])})`);
        }
        assert(Array.isArray(lf.skills), 'T5f: lockfile.skills is an array');
      }
    } catch (e) {
      assert(false, `T5: lockfile fields check threw: ${e.message}`);
    } finally { cleanup(tmp); }
  }
}

// ── AC2 — SKILL.md isolated to sidecar ───────────────────────────────────────
console.log('\n[p4-dist-install] AC2 — SKILL.md files isolated inside sidecar, not in root');

// T6 — No SKILL.md outside sidecar
{
  if (!mod || typeof mod.install !== 'function') {
    assert(false, 'T6: no SKILL.md outside sidecar (function missing)');
  } else {
    const tmp = makeTempDir();
    try {
      mod.install({ root: tmp, config: FIXTURE_CONFIG });
      const SIDECAR_DIRS = ['.skills-repo', 'skills-sidecar', '.skills'];
      function findSkillMds(dir, excludes) {
        const results = [];
        if (!fs.existsSync(dir)) return results;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (excludes.some(e => full.endsWith(path.sep + e))) continue;
            results.push(...findSkillMds(full, excludes));
          } else if (entry.name === 'SKILL.md') {
            results.push(full);
          }
        }
        return results;
      }
      const outside = findSkillMds(tmp, SIDECAR_DIRS);
      assert(outside.length === 0, `T6: zero SKILL.md files outside sidecar (found: ${outside.join(', ')})`);
    } catch (e) {
      assert(false, `T6: SKILL.md isolation check threw: ${e.message}`);
    } finally { cleanup(tmp); }
  }
}

// ── AC3 — Missing upstream config → pre-network error ────────────────────────
console.log('\n[p4-dist-install] AC3 — missing upstream config → error before any network call');

// T7 — Error message for missing skills_upstream.repo
{
  if (!mod || typeof mod.install !== 'function') {
    assert(false, 'T7: missing config error (function missing)');
  } else {
    const tmp = makeTempDir();
    let caught = null;
    try {
      const r = mod.install({ root: tmp, config: {} });
      if (r && r.message) caught = r.message;
    } catch (e) { caught = e.message; }
    finally { cleanup(tmp); }
    assert(caught && caught.includes('No upstream source configured'),
      `T7: missing config error includes required phrase (got: ${JSON.stringify(caught)})`);
    assert(caught && caught.includes('skills_upstream.repo'),
      `T7b: error mentions 'skills_upstream.repo' (got: ${JSON.stringify(caught)})`);
  }
}

// ── AC4 — Already installed → error or idempotent ────────────────────────────
console.log('\n[p4-dist-install] AC4 — second install: error or idempotent with zero new commits');

// T8 — Second install does not throw unrecognised error and no extra commits
{
  if (!mod || typeof mod.install !== 'function') {
    assert(false, 'T8: second install behavior (function missing)');
  } else {
    const tmp = makeTempDir();
    try {
      mod.install({ root: tmp, config: FIXTURE_CONFIG });
      // Second install
      let secondError = null;
      try {
        mod.install({ root: tmp, config: FIXTURE_CONFIG });
      } catch (e) { secondError = e; }
      // Either it errored with a specific message, or it succeeded idempotently
      if (secondError) {
        const msg = secondError.message || '';
        assert(/already installed|sidecar already/i.test(msg),
          `T8: second install error mentions "already installed" (got: ${msg})`);
      } else {
        assert(true, 'T8: second install completed idempotently (no error)');
      }
    } catch (e) {
      assert(false, `T8: first install threw unexpectedly: ${e.message}`);
    } finally { cleanup(tmp); }
  }
}

// ── NFR ───────────────────────────────────────────────────────────────────────
console.log('\n[p4-dist-install] NFR — no credentials; lockfile has audit fields');

// T-NFR1 — No credentials in install module source
{
  if (!fs.existsSync(INSTALL_MOD)) {
    assert(false, 'T-NFR1: module exists for source scan');
  } else {
    const src = fs.readFileSync(INSTALL_MOD, 'utf8');
    // Credentials should not be written: no token/password write to fs
    const CRED_WRITE = /fs\.(write|append).*(?:token|password|secret|apikey)/i;
    assert(!CRED_WRITE.test(src), 'T-NFR1: no credential write call in install module');
  }
}

// T-NFR2 — Lockfile audit fields (upstreamSource, pinnedRef, contentHash)
{
  if (!mod || typeof mod.install !== 'function') {
    assert(false, 'T-NFR2: lockfile audit fields (function missing)');
  } else {
    const tmp = makeTempDir();
    try {
      mod.install({ root: tmp, config: FIXTURE_CONFIG });
      const candidates = [
        path.join(tmp, '.skills-repo', 'skills-lock.json'),
        path.join(tmp, 'skills-sidecar', 'skills-lock.json'),
        path.join(tmp, '.skills', 'skills-lock.json'),
      ];
      const lockPath = candidates.find(c => fs.existsSync(c));
      if (!lockPath) {
        assert(false, 'T-NFR2: lockfile not found for audit field check');
      } else {
        const lf = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
        assert(typeof lf.upstreamSource === 'string' && lf.upstreamSource.length > 0,
          'T-NFR2a: lockfile has non-empty upstreamSource');
        assert(typeof lf.pinnedRef === 'string' && lf.pinnedRef.length > 0,
          'T-NFR2b: lockfile has non-empty pinnedRef');
        if (Array.isArray(lf.skills) && lf.skills.length > 0) {
          const firstSkill = lf.skills[0];
          const hash = firstSkill.contentHash || firstSkill.hash;
          assert(typeof hash === 'string' && hash.length === 64,
            `T-NFR2c: skills[0] has 64-char SHA-256 contentHash (got length: ${hash ? hash.length : 'missing'})`);
        } else {
          console.log('  - T-NFR2c: skipped (no skills in lockfile — empty sidecar from fixture)');
          passed++;
        }
      }
    } catch (e) {
      assert(false, `T-NFR2: audit fields check threw: ${e.message}`);
    } finally { cleanup(tmp); }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[check-p4-dist-install] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
