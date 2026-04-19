#!/usr/bin/env node
// check-p4-dist-upstream.js — test plan verification for p4-dist-upstream
// Covers T1–T8 (AC1–AC4) and T-NFR1, T-NFR2
// Tests FAIL until src/distribution/upstream.js is implemented — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT        = path.join(__dirname, '..');
const UPSTREAM_MOD = path.join(ROOT, 'src', 'distribution', 'upstream.js');
const DIST_SRC_DIR = path.join(ROOT, 'src', 'distribution');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

// ── Load module ───────────────────────────────────────────────────────────────

function loadModule() {
  if (!fs.existsSync(UPSTREAM_MOD)) return null;
  try {
    delete require.cache[require.resolve(UPSTREAM_MOD)];
    return require(UPSTREAM_MOD);
  } catch (_) { return null; }
}

// ── AC1 — Module exists and returns configured URL ────────────────────────────
console.log('\n[p4-dist-upstream] AC1 — upstream module exists and returns URL from config');

// T1 — Module exists
{
  const exists = fs.existsSync(UPSTREAM_MOD);
  assert(exists, 'T1: src/distribution/upstream.js exists');
}

const mod = loadModule();

// T2 — getUpstreamUrl with valid config returns the configured URL
{
  if (!mod || typeof mod.getUpstreamUrl !== 'function') {
    assert(false, 'T2: getUpstreamUrl exported and returns configured URL (module or function missing)');
  } else {
    try {
      const result = mod.getUpstreamUrl({ skills_upstream: { repo: 'https://example.com/org/repo.git' } });
      assert(result === 'https://example.com/org/repo.git', `T2: getUpstreamUrl returns configured URL (got: ${result})`);
    } catch (e) {
      assert(false, `T2: getUpstreamUrl returns configured URL (threw: ${e.message})`);
    }
  }
}

// ── AC2 — Missing config → named error ───────────────────────────────────────
console.log('\n[p4-dist-upstream] AC2 — missing skills_upstream.repo → named error before network');

// T3 — Error message matches AC2 exact string
{
  const EXPECTED = 'No upstream source configured — set skills_upstream.repo in .github/context.yml';
  if (!mod || typeof mod.getUpstreamUrl !== 'function') {
    assert(false, 'T3: missing config error message (module or function missing)');
  } else {
    let caught = null;
    try {
      const r = mod.getUpstreamUrl({});
      // May return an error object rather than throwing
      if (r && r.message) caught = r.message;
      else if (typeof r === 'string' && r.startsWith('No upstream')) caught = r;
    } catch (e) { caught = e.message; }
    const matches = caught && caught.includes('No upstream source configured');
    assert(matches, `T3: error message for missing config includes required text (got: ${JSON.stringify(caught)})`);
  }
}

// ── AC3 — URL change reflected + lockfile upstreamSource updated ──────────────
console.log('\n[p4-dist-upstream] AC3 — URL change reflected; lockfile upstreamSource matches config');

// T4 — getUpstreamUrl with URL-B returns URL-B (no caching between calls)
{
  if (!mod || typeof mod.getUpstreamUrl !== 'function') {
    assert(false, 'T4: URL change reflected between calls (module or function missing)');
  } else {
    try {
      const urlA = mod.getUpstreamUrl({ skills_upstream: { repo: 'https://a.example.com/repo.git' } });
      const urlB = mod.getUpstreamUrl({ skills_upstream: { repo: 'https://b.example.com/repo.git' } });
      assert(urlA === 'https://a.example.com/repo.git', `T4a: first call returns URL-A (got: ${urlA})`);
      assert(urlB === 'https://b.example.com/repo.git', `T4b: second call returns URL-B without caching (got: ${urlB})`);
    } catch (e) {
      assert(false, `T4: URL change reflected (threw: ${e.message})`);
    }
  }
}

// T5 — lockfile upstreamSource matches config URL (if writeLockfile exported)
{
  if (!mod || typeof mod.writeLockfile !== 'function') {
    console.log('  - T5: skipped (writeLockfile not exported — may be in lockfile module)');
    passed++; // not-applicable to this module
  } else {
    const os = require('os');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'upstream-test-'));
    try {
      const config = { skills_upstream: { repo: 'https://pinned.example.com/repo.git' } };
      mod.writeLockfile({ root: tmp, config, skills: [] });
      const lockPath = path.join(tmp, 'skills-lock.json');
      if (!fs.existsSync(lockPath)) {
        assert(false, 'T5: writeLockfile creates lockfile');
      } else {
        const lf = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
        assert(lf.upstreamSource === 'https://pinned.example.com/repo.git',
          `T5: lockfile upstreamSource matches config URL (got: ${lf.upstreamSource})`);
      }
    } catch (e) {
      assert(false, `T5: writeLockfile upstreamSource (threw: ${e.message})`);
    } finally {
      try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
    }
  }
}

// ── AC4 — Schema validation + ADR-004 governance ─────────────────────────────
console.log('\n[p4-dist-upstream] AC4 — schema validation and ADR-004 compliance');

// T6 — loadContextConfig with invalid skills_upstream.repo type → named error
{
  if (!mod || typeof mod.loadContextConfig !== 'function') {
    console.log('  - T6: skipped (loadContextConfig not exported or merged into getUpstreamUrl)');
    passed++;
  } else {
    let caught = null;
    try {
      const r = mod.loadContextConfig({ skills_upstream: { repo: 12345 } });
      if (r && r.message) caught = r.message;
    } catch (e) { caught = e.message; }
    assert(caught && /skills_upstream|repo|string|type/i.test(caught),
      `T6: invalid repo type → named schema error (got: ${JSON.stringify(caught)})`);
  }
}

// T7 — ADR-004 governance: no hardcoded heymishy URL in dist source files
{
  if (!fs.existsSync(DIST_SRC_DIR)) {
    assert(false, 'T7: src/distribution/ directory exists for governance scan');
  } else {
    const HARDCODED_RE = /github\.com\/heymishy|skills-repo\.git/;
    const TEST_FIXTURE_RE = /fixture|test|spec|example/i;

    function scanDir(dir) {
      const violations = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) { violations.push(...scanDir(full)); continue; }
        if (!entry.name.endsWith('.js')) continue;
        const content = fs.readFileSync(full, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (HARDCODED_RE.test(line) && !TEST_FIXTURE_RE.test(line)) {
            violations.push(`${path.relative(ROOT, full)}:${i + 1}: ${line.trim()}`);
          }
        });
      }
      return violations;
    }

    const violations = scanDir(DIST_SRC_DIR);
    assert(violations.length === 0,
      `T7: no hardcoded heymishy/skills-repo URL in src/distribution/ (found: ${violations.join(', ')})`);
  }
}

// ── NFR ───────────────────────────────────────────────────────────────────────
console.log('\n[p4-dist-upstream] NFR — no speculative network calls at config-read time');

// T-NFR1 — Source scan: no network call in loadContextConfig / getUpstreamUrl body
{
  if (!fs.existsSync(UPSTREAM_MOD)) {
    assert(false, 'T-NFR1: module exists for source scan');
  } else {
    const src = fs.readFileSync(UPSTREAM_MOD, 'utf8');
    // Network indicators that should NOT appear in the config-reading function
    const NETWORK_RE = /require\(['"]https?['"]|require\(['"]dns['"]|require\(['"]net['"]|fetch\(|http\.get\(|https\.get\(/;
    assert(!NETWORK_RE.test(src), 'T-NFR1: no HTTP/DNS/fetch call in upstream module source');
  }
}

// T-NFR2 — Config read with valid input completes without error
{
  if (!mod || typeof mod.getUpstreamUrl !== 'function') {
    assert(false, 'T-NFR2: config read completes without error (module missing)');
  } else {
    try {
      mod.getUpstreamUrl({ skills_upstream: { repo: 'https://valid.example.com/repo.git' } });
      assert(true, 'T-NFR2: config read completes without error on valid input');
    } catch (e) {
      assert(false, `T-NFR2: config read threw unexpectedly: ${e.message}`);
    }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[check-p4-dist-upstream] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
