'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const BUILT_INS = new Set([
  'fs', 'path', 'crypto', 'child_process', 'os', 'http', 'https', 'url',
  'stream', 'buffer', 'util', 'events', 'assert', 'readline', 'net',
  'tls', 'zlib', 'querystring', 'string_decoder', 'module', 'process',
  'v8', 'vm', 'worker_threads', 'cluster', 'dgram', 'dns', 'domain',
  'inspector', 'perf_hooks', 'punycode', 'repl', 'sys', 'timers',
  'tty', 'wasi'
]);

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

function mktmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'i1.2-test-'));
}

function rmtmp(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

function runInit(targetDir, args) {
  const script = path.join(root, 'scripts', 'platform-init.js');
  return execFileSync(process.execPath, [script, targetDir, ...(args || [])], {
    encoding: 'utf8',
    env: { ...process.env, PLATFORM_ROOT: root }
  });
}

function runFetch(targetDir, sourceDir) {
  const script = path.join(root, 'scripts', 'platform-fetch.js');
  return execFileSync(process.execPath, [script, targetDir, sourceDir || root], {
    encoding: 'utf8',
    env: { ...process.env, PLATFORM_ROOT: root }
  });
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

console.log('\n[i1.2] Unit tests\n');

test('platform-init-script-exists', () => {
  const exists = fs.existsSync(path.join(root, 'scripts', 'platform-init.js'));
  assert.ok(exists, 'scripts/platform-init.js does not exist');
});

test('package-json-has-platform-init-entry', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.ok(pkg.scripts && pkg.scripts['platform:init'],
    'package.json missing platform:init script entry');
  assert.ok(pkg.scripts['platform:init'].includes('platform-init.js'),
    'platform:init entry should point to scripts/platform-init.js');
});

test('package-json-has-platform-fetch-entry', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.ok(pkg.scripts && pkg.scripts['platform:fetch'],
    'package.json missing platform:fetch script entry');
  assert.ok(pkg.scripts['platform:fetch'].includes('platform-fetch.js'),
    'platform:fetch entry should point to scripts/platform-fetch.js');
});

test('platform-init-copies-skills-directory', () => {
  const tmp = mktmp();
  try {
    runInit(tmp);
    const skillsDir = path.join(tmp, '.github', 'skills');
    assert.ok(fs.existsSync(skillsDir), '.github/skills/ not created in target');
    const files = fs.readdirSync(skillsDir, { recursive: true })
      .filter(f => f.endsWith('.md'));
    assert.ok(files.length > 0, 'no .md files found under target/.github/skills/');
  } finally { rmtmp(tmp); }
});

test('platform-init-copies-templates-directory', () => {
  const tmp = mktmp();
  try {
    runInit(tmp);
    const templatesDir = path.join(tmp, '.github', 'templates');
    assert.ok(fs.existsSync(templatesDir), '.github/templates/ not created in target');
    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.md'));
    assert.ok(files.length > 0, 'no template files found under target/.github/templates/');
  } finally { rmtmp(tmp); }
});

test('platform-init-creates-copilot-instructions', () => {
  const tmp = mktmp();
  try {
    runInit(tmp);
    const ciFile = path.join(tmp, '.github', 'copilot-instructions.md');
    assert.ok(fs.existsSync(ciFile), '.github/copilot-instructions.md not created');
    const content = fs.readFileSync(ciFile, 'utf8');
    assert.ok(content.length > 0, 'copilot-instructions.md is empty');
  } finally { rmtmp(tmp); }
});

test('platform-init-outputs-install-summary', () => {
  const tmp = mktmp();
  try {
    const stdout = runInit(tmp);
    assert.ok(
      stdout.toLowerCase().includes('install') ||
      stdout.toLowerCase().includes('copied') ||
      stdout.toLowerCase().includes('done'),
      `stdout did not contain install summary. Got: ${stdout.slice(0, 200)}`
    );
  } finally { rmtmp(tmp); }
});

test('platform-init-skips-existing-files-by-default', () => {
  const tmp = mktmp();
  try {
    const skillsDir = path.join(tmp, '.github', 'skills', 'orient');
    fs.mkdirSync(skillsDir, { recursive: true });
    const testFile = path.join(skillsDir, 'SKILL.md');
    const marker = 'CUSTOM_MARKER_DO_NOT_OVERWRITE_12345';
    fs.writeFileSync(testFile, marker, 'utf8');
    runInit(tmp);
    const content = fs.readFileSync(testFile, 'utf8');
    assert.ok(content.includes(marker),
      'platform-init overwrote existing file when --force was not passed');
  } finally { rmtmp(tmp); }
});

test('platform-init-reports-skipped-files', () => {
  const tmp = mktmp();
  try {
    const skillsDir = path.join(tmp, '.github', 'skills', 'orient');
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'SKILL.md'), 'existing', 'utf8');
    const stdout = runInit(tmp);
    assert.ok(
      stdout.toLowerCase().includes('skip'),
      `stdout did not mention skipped files. Got: ${stdout.slice(0, 300)}`
    );
  } finally { rmtmp(tmp); }
});

test('platform-init-force-flag-overwrites-existing', () => {
  const tmp = mktmp();
  try {
    const skillsDir = path.join(tmp, '.github', 'skills', 'orient');
    fs.mkdirSync(skillsDir, { recursive: true });
    const testFile = path.join(skillsDir, 'SKILL.md');
    const marker = 'CUSTOM_MARKER_SHOULD_BE_OVERWRITTEN_67890';
    fs.writeFileSync(testFile, marker, 'utf8');
    runInit(tmp, ['--force']);
    const content = fs.readFileSync(testFile, 'utf8');
    assert.ok(!content.includes(marker),
      '--force flag did not overwrite existing file');
  } finally { rmtmp(tmp); }
});

test('platform-fetch-records-timestamp', () => {
  const tmp = mktmp();
  try {
    const workspaceDir = path.join(tmp, 'workspace');
    fs.mkdirSync(workspaceDir, { recursive: true });
    runFetch(tmp, root);
    const logFile = path.join(workspaceDir, 'platform-fetch-log.json');
    assert.ok(fs.existsSync(logFile), 'workspace/platform-fetch-log.json not created');
    const log = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    assert.ok(log.fetchedAt, 'platform-fetch-log.json missing fetchedAt field');
    assert.ok(!isNaN(Date.parse(log.fetchedAt)), 'fetchedAt is not a valid ISO-8601 date');
  } finally { rmtmp(tmp); }
});

test('platform-fetch-copies-latest-skill-files', () => {
  const tmp = mktmp();
  try {
    fs.mkdirSync(path.join(tmp, 'workspace'), { recursive: true });
    runFetch(tmp, root);
    const skillsDir = path.join(tmp, '.github', 'skills');
    assert.ok(fs.existsSync(skillsDir), '.github/skills/ not present after fetch');
    const files = fs.readdirSync(skillsDir, { recursive: true })
      .filter(f => f.endsWith('.md'));
    assert.ok(files.length > 0, 'no skill .md files found after fetch');
  } finally { rmtmp(tmp); }
});

test('platform-init-adds-no-runtime-dependencies', () => {
  const tmp = mktmp();
  try {
    const depsKey = JSON.stringify(
      JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).dependencies || {}
    );
    runInit(tmp);
    // Check that running init did not modify the repo's own package.json
    const depsAfter = JSON.stringify(
      JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).dependencies || {}
    );
    assert.strictEqual(depsKey, depsAfter, 'platform:init added runtime dependencies to package.json');
  } finally { rmtmp(tmp); }
});

test('platform-init-no-require-of-external-modules', () => {
  const initSrc = fs.readFileSync(path.join(root, 'scripts', 'platform-init.js'), 'utf8');
  const fetchSrc = fs.readFileSync(path.join(root, 'scripts', 'platform-fetch.js'), 'utf8');
  const requireRe = /require\(['"]([^'"]+)['"]\)/g;
  [['platform-init.js', initSrc], ['platform-fetch.js', fetchSrc]].forEach(([name, src]) => {
    let m;
    while ((m = requireRe.exec(src)) !== null) {
      const mod = m[1];
      const isBuiltIn = BUILT_INS.has(mod) || mod.startsWith('node:');
      assert.ok(isBuiltIn,
        `${name} requires external module '${mod}' — only Node.js built-ins allowed`);
    }
  });
});

test('platform-init-is-idempotent', () => {
  const tmp = mktmp();
  try {
    runInit(tmp);
    // Snapshot after first run
    function snapshot(dir) {
      const result = {};
      function walk(d, rel) {
        for (const entry of fs.readdirSync(d)) {
          const full = path.join(d, entry);
          const relPath = path.join(rel, entry);
          if (fs.statSync(full).isDirectory()) walk(full, relPath);
          else result[relPath] = fs.readFileSync(full);
        }
      }
      walk(dir, '');
      return result;
    }
    const before = snapshot(tmp);
    runInit(tmp);
    const after = snapshot(tmp);
    assert.deepStrictEqual(Object.keys(before).sort(), Object.keys(after).sort(),
      'second run of platform:init changed the file list');
    for (const k of Object.keys(before)) {
      assert.ok(before[k].equals(after[k]),
        `second run modified file content: ${k}`);
    }
  } finally { rmtmp(tmp); }
});

test('platform-init-exits-nonzero-on-failure', () => {
  // Pass a non-existent path as target — init should fail gracefully
  const badPath = path.join(os.tmpdir(), 'nonexistent-readonly-' + Date.now(), 'subdir');
  let exitCode = 0;
  try {
    const script = path.join(root, 'scripts', 'platform-init.js');
    execFileSync(process.execPath, [script, badPath], {
      encoding: 'utf8',
      env: { ...process.env, PLATFORM_ROOT: root, PLATFORM_INIT_FAIL_IF_MISSING: '1' }
    });
  } catch (err) {
    exitCode = err.status || 1;
  }
  assert.ok(exitCode !== 0, 'platform-init exited 0 on failure — expected non-zero');
});

test('platform-init-outputs-human-readable-error', () => {
  const badPath = path.join(os.tmpdir(), 'nonexistent-readonly-' + Date.now(), 'subdir');
  let stderr = '';
  try {
    const script = path.join(root, 'scripts', 'platform-init.js');
    execFileSync(process.execPath, [script, badPath], {
      encoding: 'utf8',
      env: { ...process.env, PLATFORM_ROOT: root, PLATFORM_INIT_FAIL_IF_MISSING: '1' }
    });
  } catch (err) {
    stderr = err.stderr || '';
  }
  assert.ok(stderr.length > 0, 'stderr was empty on failure — expected human-readable error');
  assert.ok(
    !stderr.trim().startsWith('Error:') || stderr.includes(badPath) || stderr.toLowerCase().includes('cannot'),
    `stderr did not contain a helpful error message. Got: ${stderr.slice(0, 200)}`
  );
});

// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------

console.log('\n[i1.2] Integration tests\n');

test('platform-init-full-install-skills-accessible', () => {
  const tmp = mktmp();
  try {
    runInit(tmp);
    const checks = [
      path.join(tmp, '.github', 'skills'),
      path.join(tmp, '.github', 'templates'),
      path.join(tmp, 'scripts'),
      path.join(tmp, '.github', 'copilot-instructions.md')
    ];
    for (const p of checks) {
      assert.ok(fs.existsSync(p), `Expected path not found after platform:init: ${p}`);
    }
  } finally { rmtmp(tmp); }
});

test('platform-fetch-produces-workspace-timestamp', () => {
  const tmp = mktmp();
  try {
    fs.mkdirSync(path.join(tmp, 'workspace'), { recursive: true });
    runFetch(tmp, root);
    const logFile = path.join(tmp, 'workspace', 'platform-fetch-log.json');
    assert.ok(fs.existsSync(logFile), 'workspace/platform-fetch-log.json not found after fetch');
    const log = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    const ts = new Date(log.fetchedAt);
    assert.ok(!isNaN(ts.getTime()), 'fetchedAt is not a valid date');
    const age = Date.now() - ts.getTime();
    assert.ok(age < 10000, `fetchedAt is stale (${age}ms ago) — expected within last 10 seconds`);
  } finally { rmtmp(tmp); }
});

test('platform-init-then-fetch-no-duplicate-dependencies', () => {
  const tmp = mktmp();
  try {
    // Create minimal package.json with no dependencies
    fs.writeFileSync(
      path.join(tmp, 'package.json'),
      JSON.stringify({ name: 'test-consumer', version: '0.0.1' }, null, 2),
      'utf8'
    );
    fs.mkdirSync(path.join(tmp, 'workspace'), { recursive: true });
    runInit(tmp);
    runFetch(tmp, root);
    // The consumer's package.json should still have no runtime dependencies
    const pkg = JSON.parse(fs.readFileSync(path.join(tmp, 'package.json'), 'utf8'));
    const deps = pkg.dependencies || {};
    assert.strictEqual(Object.keys(deps).length, 0,
      `platform:init + platform:fetch added runtime dependencies: ${JSON.stringify(deps)}`);
  } finally { rmtmp(tmp); }
});

// ---------------------------------------------------------------------------

console.log('');
console.log(`[i1.2-platform-init-fetch] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
