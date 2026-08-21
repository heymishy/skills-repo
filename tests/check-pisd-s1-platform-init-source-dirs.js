'use strict';
// check-pisd-s1-platform-init-source-dirs.js
// AC verification for pisd-s1 (AC1, AC2, AC3, AC6's regression check).
// AC4 is covered by re-running the existing, unmodified check-i1.2-platform-init-fetch.js.
// AC5 is a documented investigation, not an automated test — see decisions.md.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');

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
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pisd-s1-test-'));
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

// ── AC1: COPY_DIRS src paths point at repo-root skills/ and templates/ ────────

test('AC1: platform-init.js sources skills COPY_DIR from repo-root skills/, not .github/skills/', () => {
  const source = fs.readFileSync(path.join(root, 'scripts', 'platform-init.js'), 'utf8');
  assert.ok(
    /src:\s*path\.join\(sourceRoot,\s*'skills'\)/.test(source),
    'Expected a COPY_DIRS entry with src: path.join(sourceRoot, \'skills\')'
  );
  assert.ok(
    !/src:\s*path\.join\(sourceRoot,\s*'\.github',\s*'skills'\)/.test(source),
    'Did not expect src: path.join(sourceRoot, \'.github\', \'skills\') to remain'
  );
});

test('AC1: platform-init.js sources templates COPY_DIR from repo-root templates/, not .github/templates/', () => {
  const source = fs.readFileSync(path.join(root, 'scripts', 'platform-init.js'), 'utf8');
  assert.ok(
    /src:\s*path\.join\(sourceRoot,\s*'templates'\)/.test(source),
    'Expected a COPY_DIRS entry with src: path.join(sourceRoot, \'templates\')'
  );
  assert.ok(
    !/src:\s*path\.join\(sourceRoot,\s*'\.github',\s*'templates'\)/.test(source),
    'Did not expect src: path.join(sourceRoot, \'.github\', \'templates\') to remain'
  );
});

// ── AC2: full skill set installed ──────────────────────────────────────────────

test('AC2: runInit against a fresh target copies every skill from this repo\'s root skills/', () => {
  const tmp = mktmp();
  try {
    runInit(tmp);
    const installed = fs.readdirSync(path.join(tmp, '.github', 'skills'));
    const real = fs.readdirSync(path.join(root, 'skills'));
    assert.ok(installed.includes('orient'), 'Expected orient to be installed');
    assert.ok(installed.includes('benefit-metric'), 'Expected benefit-metric to be installed');
    assert.ok(installed.includes('discovery'), 'Expected discovery to be installed');
    assert.strictEqual(installed.length, real.length,
      `Expected ${real.length} installed skills (matching live skills/), got ${installed.length}`);
  } finally { rmtmp(tmp); }
});

test('AC2 (integration): installed skills are independently loadable by skill-discovery.js', () => {
  const tmp = mktmp();
  try {
    runInit(tmp);
    delete require.cache[require.resolve(path.join(root, 'src', 'adapters', 'skill-discovery.js'))];
    const { listAvailableSkills } = require(path.join(root, 'src', 'adapters', 'skill-discovery.js'));
    const found = listAvailableSkills(tmp);
    assert.ok(Array.isArray(found) && found.length > 0, 'Expected a non-empty skills array');
    assert.ok(found.some(s => s.name === 'benefit-metric'), 'Expected benefit-metric to be discoverable');
  } finally { rmtmp(tmp); }
});

// ── AC3: full template set installed ───────────────────────────────────────────

test('AC3: runInit against a fresh target copies every template from this repo\'s root templates/', () => {
  const tmp = mktmp();
  try {
    runInit(tmp);
    const installed = fs.readdirSync(path.join(tmp, '.github', 'templates'));
    const real = fs.readdirSync(path.join(root, 'templates'));
    assert.ok(installed.includes('story.md'), 'Expected story.md to be installed');
    assert.ok(installed.includes('test-plan.md'), 'Expected test-plan.md to be installed');
    assert.strictEqual(installed.length, real.length,
      `Expected ${real.length} installed templates (matching live templates/), got ${installed.length}`);
  } finally { rmtmp(tmp); }
});

test('AC3 (integration): installed story.md matches this repo\'s own templates/story.md byte-for-byte', () => {
  const tmp = mktmp();
  try {
    runInit(tmp);
    const installedContent = fs.readFileSync(path.join(tmp, '.github', 'templates', 'story.md'), 'utf8');
    const realContent = fs.readFileSync(path.join(root, 'templates', 'story.md'), 'utf8');
    assert.strictEqual(installedContent, realContent, 'Expected installed story.md to match the real template exactly');
  } finally { rmtmp(tmp); }
});

// ── AC5 spot check: the 6 relocated files are now part of the real skill/template set ──

test('AC5: infra-definition and schema-migration-plan skills are installed by platform-init.js', () => {
  const tmp = mktmp();
  try {
    runInit(tmp);
    const installed = fs.readdirSync(path.join(tmp, '.github', 'skills'));
    assert.ok(installed.includes('infra-definition'), 'Expected infra-definition to be installed (relocated to skills/ per AC5)');
    assert.ok(installed.includes('schema-migration-plan'), 'Expected schema-migration-plan to be installed (relocated to skills/ per AC5)');
  } finally { rmtmp(tmp); }
});

test('AC5: staging-data-policy.md template is installed by platform-init.js', () => {
  const tmp = mktmp();
  try {
    runInit(tmp);
    const installed = fs.readdirSync(path.join(tmp, '.github', 'templates'));
    assert.ok(installed.includes('staging-data-policy.md'), 'Expected staging-data-policy.md to be installed (relocated to templates/ per AC5)');
  } finally { rmtmp(tmp); }
});

console.log(`\n[pisd-s1] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
