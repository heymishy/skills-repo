#!/usr/bin/env node
// check-p11-init-fetch.js — p11.5 CLI init() and fetch() implementation tests
// Tests that init() and fetch() in src/enforcement/cli-adapter.js meet all ACs.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const os   = require('os');
const path = require('path');

const ROOT         = path.join(__dirname, '..');
const CLI_ADAPTER  = path.join(ROOT, 'src', 'enforcement', 'cli-adapter.js');
const LOCKFILE_REL = path.join('.github', 'skills', 'skill-lockfile.json');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

/** Write a minimal context.yml to tempRoot for fetch() tests */
function writeContext(tempRoot, content) {
  const cfgDir = path.join(tempRoot, '.github');
  fs.mkdirSync(cfgDir, { recursive: true });
  fs.writeFileSync(path.join(cfgDir, 'context.yml'), content, 'utf8');
}

const { init, fetch } = require(CLI_ADAPTER);

console.log('\n[p11-init-fetch] p11.5 — CLI init() and fetch() implementation');

// ── AC1: init() creates directory and lockfile on fresh repo ──────────────────
console.log('\n  AC1: init() on fresh repo');

const tmpRoot1 = fs.mkdtempSync(path.join(os.tmpdir(), 'p11-init-'));
const result1 = init(tmpRoot1);

assert(
  fs.existsSync(path.join(tmpRoot1, '.github', 'skills')),
  'T1 — init() creates .github/skills/ directory on fresh repo'
);

const lf1Path = path.join(tmpRoot1, LOCKFILE_REL);
let lf1data = null;
try { lf1data = JSON.parse(fs.readFileSync(lf1Path, 'utf8')); } catch (_) {}

assert(
  lf1data !== null &&
    (lf1data.schemaVersion === '1.0.0' || lf1data.version === 1 || lf1data.version === '1.0.0') &&
    (typeof lf1data.pinnedAt === 'string' || typeof lf1data.generated === 'string') &&
    Array.isArray(lf1data.skills) &&
    lf1data.skills.length === 0,
  'T2 — init() writes stub lockfile with correct schema (version, timestamp, empty skills array)'
);

assert(
  result1 && result1.status === 'ok' && result1.command === 'init' && result1.created === true,
  'T3 — init() returns {status:"ok", command:"init", created:true} on fresh repo'
);

// ── AC2: init() is idempotent when lockfile already exists ────────────────────
console.log('\n  AC2: init() with existing lockfile');

const tmpRoot2 = fs.mkdtempSync(path.join(os.tmpdir(), 'p11-init-exist-'));
const lfDir2 = path.join(tmpRoot2, '.github', 'skills');
fs.mkdirSync(lfDir2, { recursive: true });
const existingContent = JSON.stringify({
  schemaVersion: '1.0.0',
  pinnedAt: '2026-01-01T00:00:00.000Z',
  skills: [{ skill: 'existing', path: '.github/skills/existing/SKILL.md', sha256: 'abc123' }]
});
fs.writeFileSync(path.join(tmpRoot2, LOCKFILE_REL), existingContent, 'utf8');

const result2 = init(tmpRoot2);

assert(
  result2 && result2.created === false,
  'T4 — init() returns created:false when lockfile already exists'
);

const afterContent = fs.readFileSync(path.join(tmpRoot2, LOCKFILE_REL), 'utf8');
assert(
  afterContent === existingContent,
  'T5 — init() does not modify existing lockfile content'
);

// ── AC3: fetch() graceful no-op when remote not configured ───────────────────
console.log('\n  AC3: fetch() with no remote');

const tmpRoot3 = fs.mkdtempSync(path.join(os.tmpdir(), 'p11-fetch-null-'));
writeContext(tmpRoot3, 'skills_upstream:\n  remote: null\n');
let result3;
let threw3 = false;
try { result3 = fetch(tmpRoot3); } catch (_) { threw3 = true; }

assert(
  !threw3 && result3 && result3.status === 'not-configured' && result3.command === 'fetch',
  'T6 — fetch() with remote:null returns {status:"not-configured"} without throwing'
);

const tmpRoot3b = fs.mkdtempSync(path.join(os.tmpdir(), 'p11-fetch-nokey-'));
writeContext(tmpRoot3b, 'tools:\n  ci_platform: github-actions\n');
let result3b;
let threw3b = false;
try { result3b = fetch(tmpRoot3b); } catch (_) { threw3b = true; }

assert(
  !threw3b && result3b && result3b.status === 'not-configured',
  'T7 — fetch() with no skills_upstream key returns {status:"not-configured"} without throwing'
);

// ── AC4: fetch() with valid remote executes git fetch via execSync ────────────
console.log('\n  AC4: fetch() with valid remote');

const tmpRoot4 = fs.mkdtempSync(path.join(os.tmpdir(), 'p11-fetch-ok-'));
writeContext(tmpRoot4, 'skills_upstream:\n  remote: https://github.com/heymishy/skills-repo.git\n');

// Monkey-patch execSync on the loaded module to capture the call
let capturedCmd = null;
const cpMod = require('child_process');
const originalExecSync = cpMod.execSync;
cpMod.execSync = (cmd, opts) => { capturedCmd = cmd; return ''; };

let result4;
let threw4 = false;
try { result4 = fetch(tmpRoot4); } catch (_) { threw4 = true; }
cpMod.execSync = originalExecSync; // restore

assert(
  !threw4 && capturedCmd !== null &&
    capturedCmd.includes('git') && capturedCmd.includes('fetch') &&
    capturedCmd.includes('https://github.com/heymishy/skills-repo.git'),
  'T8 — fetch() executes git fetch <remote> via execSync (ADR-004: URL from context.yml)'
);

assert(
  !threw4 && result4 && result4.status === 'ok' && result4.command === 'fetch' &&
    result4.remote === 'https://github.com/heymishy/skills-repo.git',
  'T9 — fetch() returns {status:"ok", command:"fetch", remote:"<url>"}'
);

// ── NFR1: init() completes in under 1 second ─────────────────────────────────
console.log('\n  NFR1: init() performance');

const tmpRootNfr1 = fs.mkdtempSync(path.join(os.tmpdir(), 'p11-perf-'));
const t0 = Date.now();
init(tmpRootNfr1);
const elapsed = Date.now() - t0;

assert(elapsed < 1000, `NFR1 — init() completes in < 1s (took ${elapsed}ms)`);

// ── NFR2: fetch() does not leak credentials from context.yml ─────────────────
console.log('\n  NFR2: fetch() security');

const tmpRootNfr2 = fs.mkdtempSync(path.join(os.tmpdir(), 'p11-sec-'));
writeContext(tmpRootNfr2, [
  'skills_upstream:',
  '  remote: https://github.com/heymishy/skills-repo.git',
  'tools:',
  '  api_token: sk-faketoken456'
].join('\n') + '\n');

let resultNfr2;
let threwNfr2 = false;
const cpMod2 = require('child_process');
cpMod2.execSync = (cmd, opts) => '';
try { resultNfr2 = fetch(tmpRootNfr2); } catch (_) { threwNfr2 = true; }
cpMod2.execSync = originalExecSync;

assert(
  !threwNfr2 && resultNfr2 &&
    !JSON.stringify(resultNfr2).includes('sk-faketoken456'),
  'NFR2 — fetch() return value does not contain credentials from context.yml'
);

console.log(`\n[p11-init-fetch] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
