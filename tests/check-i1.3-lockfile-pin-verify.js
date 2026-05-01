'use strict';
// RED: All tests fail before scripts/platform-pin.js, scripts/platform-verify.js exist
// and package.json entries are added.

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFileSync, spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const results = { passed: 0, failed: 0 };

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    results.passed++;
  } catch (e) {
    console.log(`  [FAIL] ${name}: ${e.message}`);
    results.failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function makeTmpDir(files) {
  // files: { [relativePath]: content }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i1.3-test-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }
  return dir;
}

function runPin(targetDir, extraEnv) {
  const pinScript = path.join(root, 'scripts/platform-pin.js');
  return spawnSync('node', [pinScript, '--target', targetDir], {
    env: { ...process.env, ...extraEnv },
    encoding: 'utf8'
  });
}

function runVerify(targetDir) {
  const verifyScript = path.join(root, 'scripts/platform-verify.js');
  return spawnSync('node', [verifyScript, '--target', targetDir], {
    encoding: 'utf8'
  });
}

function readLock(targetDir) {
  const lockPath = path.join(targetDir, 'platform-lock.json');
  return JSON.parse(fs.readFileSync(lockPath, 'utf8'));
}

console.log('[i1.3-lockfile-pin-verify] Running tests...\n');

// ─── Script/package existence ────────────────────────────────────────────────

test('platform-pin-script-exists', () => {
  const p = path.join(root, 'scripts/platform-pin.js');
  assert(fs.existsSync(p), `scripts/platform-pin.js not found at ${p}`);
});

test('package-json-has-platform-pin-entry', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const entry = pkg.scripts && pkg.scripts['platform:pin'];
  assert(entry, 'package.json missing scripts["platform:pin"]');
  assert(entry.includes('platform-pin.js'), `platform:pin entry should reference platform-pin.js, got: ${entry}`);
});

test('package-json-has-platform-verify-entry', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const entry = pkg.scripts && pkg.scripts['platform:verify'];
  assert(entry, 'package.json missing scripts["platform:verify"]');
});

// ─── platform:pin output ─────────────────────────────────────────────────────

test('platform-pin-creates-lock-file', () => {
  const dir = makeTmpDir({
    '.github/skills/test-skill/SKILL.md': '# Test Skill\n'
  });
  try {
    const r = runPin(dir);
    assert(r.status === 0, `platform:pin exited ${r.status}: ${r.stderr}`);
    assert(fs.existsSync(path.join(dir, 'platform-lock.json')), 'platform-lock.json not created');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('platform-pin-lock-file-has-schema-version-1', () => {
  const dir = makeTmpDir({ '.github/skills/s/SKILL.md': 'content' });
  try {
    runPin(dir);
    const lock = readLock(dir);
    assert(lock.version === '1', `Expected version "1" (string), got ${JSON.stringify(lock.version)}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('platform-pin-lock-file-has-iso8601-timestamp', () => {
  const dir = makeTmpDir({ '.github/skills/s/SKILL.md': 'content' });
  try {
    runPin(dir);
    const lock = readLock(dir);
    assert(lock.pinnedAt, 'lock.pinnedAt is missing');
    const dt = new Date(lock.pinnedAt);
    assert(!isNaN(dt.getTime()), `pinnedAt is not a valid date: ${lock.pinnedAt}`);
    assert(dt.toISOString() === lock.pinnedAt || lock.pinnedAt.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/), `pinnedAt not ISO-8601: ${lock.pinnedAt}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('platform-pin-lock-file-has-platform-identifier', () => {
  const dir = makeTmpDir({ '.github/skills/s/SKILL.md': 'content' });
  try {
    runPin(dir);
    const lock = readLock(dir);
    assert(lock.platform && lock.platform.length > 0, 'lock.platform is missing or empty');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('platform-pin-hashes-each-skill-file', () => {
  const c1 = 'skill file one content';
  const c2 = 'skill file two content';
  const dir = makeTmpDir({
    '.github/skills/alpha/SKILL.md': c1,
    '.github/skills/beta/SKILL.md': c2
  });
  try {
    runPin(dir);
    const lock = readLock(dir);
    assert(lock.skills, 'lock.skills is missing');
    const keys = Object.keys(lock.skills);
    assert(keys.length >= 2, `Expected >=2 skill hashes, got ${keys.length}`);
    const expectedHashes = [sha256(Buffer.from(c1)), sha256(Buffer.from(c2))];
    const actualHashes = Object.values(lock.skills);
    for (const expected of expectedHashes) {
      assert(actualHashes.includes(expected), `Expected SHA ${expected} not found in lock. Got: ${JSON.stringify(actualHashes)}`);
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('platform-pin-keys-by-relative-path', () => {
  const dir = makeTmpDir({ '.github/skills/s/SKILL.md': 'content' });
  try {
    runPin(dir);
    const lock = readLock(dir);
    for (const key of Object.keys(lock.skills)) {
      assert(!path.isAbsolute(key), `Key is absolute path: ${key}`);
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('platform-pin-paths-use-forward-slashes', () => {
  const dir = makeTmpDir({ '.github/skills/nested/deep/SKILL.md': 'content' });
  try {
    runPin(dir);
    const lock = readLock(dir);
    for (const key of Object.keys(lock.skills)) {
      assert(!key.includes('\\'), `Key uses backslash: ${key}`);
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ─── platform:verify — clean ─────────────────────────────────────────────────

test('platform-verify-exits-0-on-clean-repo', () => {
  const dir = makeTmpDir({ '.github/skills/s/SKILL.md': 'stable content' });
  try {
    runPin(dir);
    const r = runVerify(dir);
    assert(r.status === 0, `Expected exit 0, got ${r.status}. stderr: ${r.stderr}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('platform-verify-outputs-one-line-confirmation', () => {
  const dir = makeTmpDir({ '.github/skills/s/SKILL.md': 'stable' });
  try {
    runPin(dir);
    const r = runVerify(dir);
    const out = (r.stdout || '').trim();
    const lines = out.split('\n').filter(l => l.trim());
    assert(lines.length >= 1, 'No output from platform:verify');
    // Should mention file count or confirmation
    const combined = out + (r.stderr || '');
    assert(
      combined.match(/\d+/) && (combined.includes('match') || combined.includes('✓') || combined.includes('OK') || combined.includes('pass')),
      `Expected confirmation with count, got: ${combined}`
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ─── platform:verify — drift ─────────────────────────────────────────────────

test('platform-verify-exits-nonzero-on-drift', () => {
  const dir = makeTmpDir({ '.github/skills/s/SKILL.md': 'original content' });
  try {
    runPin(dir);
    fs.writeFileSync(path.join(dir, '.github/skills/s/SKILL.md'), 'modified content', 'utf8');
    const r = runVerify(dir);
    assert(r.status !== 0, `Expected non-zero exit on drift, got 0`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('platform-verify-names-drifted-file', () => {
  const dir = makeTmpDir({ '.github/skills/drifted/SKILL.md': 'original' });
  try {
    runPin(dir);
    fs.writeFileSync(path.join(dir, '.github/skills/drifted/SKILL.md'), 'changed', 'utf8');
    const r = runVerify(dir);
    const combined = (r.stdout || '') + (r.stderr || '');
    assert(combined.includes('drifted'), `Expected drifted file path in output. Got: ${combined}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('platform-verify-shows-expected-vs-actual-sha', () => {
  const original = 'original content abc';
  const modified = 'modified content xyz';
  const dir = makeTmpDir({ '.github/skills/s/SKILL.md': original });
  try {
    runPin(dir);
    fs.writeFileSync(path.join(dir, '.github/skills/s/SKILL.md'), modified, 'utf8');
    const r = runVerify(dir);
    const combined = (r.stdout || '') + (r.stderr || '');
    const expectedSha = sha256(Buffer.from(original));
    const actualSha = sha256(Buffer.from(modified));
    assert(combined.includes(expectedSha.slice(0, 8)), `Expected hash prefix not found. Got: ${combined.slice(0, 500)}`);
    assert(combined.includes(actualSha.slice(0, 8)), `Actual hash prefix not found. Got: ${combined.slice(0, 500)}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('platform-verify-names-fix-command', () => {
  const dir = makeTmpDir({ '.github/skills/s/SKILL.md': 'original' });
  try {
    runPin(dir);
    fs.writeFileSync(path.join(dir, '.github/skills/s/SKILL.md'), 'changed', 'utf8');
    const r = runVerify(dir);
    const combined = (r.stdout || '') + (r.stderr || '');
    assert(
      combined.includes('platform:pin') || combined.includes('platform:fetch'),
      `Expected fix command in output. Got: ${combined}`
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ─── platform:verify — no lock file ──────────────────────────────────────────

test('platform-verify-exits-nonzero-when-no-lock-file', () => {
  const dir = makeTmpDir({ '.github/skills/s/SKILL.md': 'content' });
  try {
    // Do NOT run pin
    const r = runVerify(dir);
    assert(r.status !== 0, `Expected non-zero exit when no lock file, got 0`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('platform-verify-instructs-run-pin-when-no-lock', () => {
  const dir = makeTmpDir({ '.github/skills/s/SKILL.md': 'content' });
  try {
    const r = runVerify(dir);
    const combined = (r.stdout || '') + (r.stderr || '');
    assert(combined.includes('platform:pin'), `Expected "platform:pin" instruction when no lock. Got: ${combined}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ─── Determinism / NFR ───────────────────────────────────────────────────────

test('platform-pin-sha256-deterministic', () => {
  const content = 'deterministic content 12345';
  const dir1 = makeTmpDir({ '.github/skills/s/SKILL.md': content });
  const dir2 = makeTmpDir({ '.github/skills/s/SKILL.md': content });
  try {
    runPin(dir1);
    runPin(dir2);
    const lock1 = readLock(dir1);
    const lock2 = readLock(dir2);
    const hash1 = Object.values(lock1.skills)[0];
    const hash2 = Object.values(lock2.skills)[0];
    assert(hash1 === hash2, `Hash differs across runs: ${hash1} vs ${hash2}`);
  } finally {
    fs.rmSync(dir1, { recursive: true, force: true });
    fs.rmSync(dir2, { recursive: true, force: true });
  }
});

test('platform-pin-sha256-is-raw-content-only', () => {
  const content = 'raw content hash test';
  const dir = makeTmpDir({ '.github/skills/s/SKILL.md': content });
  try {
    runPin(dir);
    const lock = readLock(dir);
    const expected = sha256(Buffer.from(content));
    const actual = Object.values(lock.skills)[0];
    assert(actual === expected, `Expected hash ${expected}, got ${actual}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('platform-verify-nfr-actionable-error', () => {
  const original = 'actionable error test content';
  const dir = makeTmpDir({ '.github/skills/s/SKILL.md': original });
  try {
    runPin(dir);
    fs.writeFileSync(path.join(dir, '.github/skills/s/SKILL.md'), 'changed actionable', 'utf8');
    const r = runVerify(dir);
    const combined = (r.stdout || '') + (r.stderr || '');
    // (a) file path
    assert(combined.includes('SKILL.md'), `File path not in output: ${combined.slice(0, 400)}`);
    // (b) two SHA hex strings (at least 8 chars each)
    const hexMatches = combined.match(/[0-9a-f]{8,}/g) || [];
    assert(hexMatches.length >= 2, `Expected >=2 SHA hex strings, got ${hexMatches.length}. Output: ${combined.slice(0, 400)}`);
    // (c) fix command
    assert(combined.includes('platform:pin') || combined.includes('platform:fetch'), `Fix command not in output: ${combined.slice(0, 400)}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ─── Integration tests ────────────────────────────────────────────────────────

test('platform-pin-then-verify-clean-passes', () => {
  const dir = makeTmpDir({
    '.github/skills/a/SKILL.md': 'content a',
    '.github/skills/b/SKILL.md': 'content b',
    '.github/skills/c/SKILL.md': 'content c'
  });
  try {
    const pinR = runPin(dir);
    assert(pinR.status === 0, `pin failed: ${pinR.stderr}`);
    const verR = runVerify(dir);
    assert(verR.status === 0, `verify failed after clean pin: ${verR.stderr}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('platform-pin-then-modify-then-verify-fails', () => {
  const dir = makeTmpDir({
    '.github/skills/a/SKILL.md': 'original a',
    '.github/skills/b/SKILL.md': 'original b'
  });
  try {
    runPin(dir);
    fs.writeFileSync(path.join(dir, '.github/skills/a/SKILL.md'), 'tampered a', 'utf8');
    const r = runVerify(dir);
    assert(r.status !== 0, 'Expected non-zero exit after drift');
    const combined = (r.stdout || '') + (r.stderr || '');
    assert(combined.includes('a'), `Expected drifted file 'a' in output. Got: ${combined}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('platform-lock-portable-across-paths', () => {
  const dir = makeTmpDir({ '.github/skills/s/SKILL.md': 'portable' });
  try {
    runPin(dir);
    // Replace forward slashes with backslashes in key names to simulate cross-OS
    const lockPath = path.join(dir, 'platform-lock.json');
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    const newSkills = {};
    for (const [k, v] of Object.entries(lock.skills)) {
      newSkills[k.replace(/\//g, '\\')] = v;
    }
    lock.skills = newSkills;
    fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2), 'utf8');
    // platform:verify should either normalise and pass, or give a clear error (not crash/throw)
    const r = runVerify(dir);
    // Acceptable outcomes: exit 0 (normalised) or exit non-zero with a message (not a crash)
    const combined = (r.stdout || '') + (r.stderr || '');
    assert(typeof r.status === 'number', `spawnSync returned null status`);
    // If it exits non-zero it should have output (not a silent crash)
    if (r.status !== 0) {
      assert(combined.length > 0, 'Exited non-zero with no output — likely a crash');
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ─── Results ─────────────────────────────────────────────────────────────────

console.log(`\n[i1.3-lockfile-pin-verify] Results: ${results.passed} passed, ${results.failed} failed`);
if (results.failed > 0) process.exit(1);
