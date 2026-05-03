'use strict';
/**
 * check-wuce17-e2e-infra.js — AC verification for wuce.17
 * T1–T5: 22 tests validating Playwright infrastructure files
 * Run: node tests/check-wuce17-e2e-infra.js
 * Exit 0 if all pass, exit 1 if any fail.
 */

const assert = require('assert');
const path   = require('path');
const fs     = require('fs');

const ROOT = path.join(__dirname, '..');

let passed   = 0;
let failed   = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  \u2713 ' + name);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log('  \u2717 ' + name + ': ' + err.message);
  }
}

// ── T1 — Playwright config file ───────────────────────────────────────────────
console.log('\nT1 \u2014 Playwright config file (AC3)');

test('T1.1 \u2014 playwright.config.js exists at repo root', () => {
  const configPath = path.join(ROOT, 'playwright.config.js');
  assert.ok(fs.existsSync(configPath), 'playwright.config.js must exist at repo root');
});

test('T1.2 \u2014 config exports testDir: \'tests/e2e\'', () => {
  const config = require('../playwright.config.js');
  const cfg = config.default || config;
  assert.strictEqual(cfg.testDir, 'tests/e2e', "testDir must be 'tests/e2e'");
});

test('T1.3 \u2014 config has use.headless: true', () => {
  const config = require('../playwright.config.js');
  const cfg = config.default || config;
  assert.strictEqual(cfg.use && cfg.use.headless, true, 'use.headless must be true');
});

test('T1.4 \u2014 config has timeout \u2264 30000 ms', () => {
  const config = require('../playwright.config.js');
  const cfg = config.default || config;
  assert.ok(
    typeof cfg.timeout === 'number' && cfg.timeout <= 30000,
    'timeout must be a number \u2264 30000 ms'
  );
});

test('T1.5 \u2014 config has webServer block with command and url fields', () => {
  const config = require('../playwright.config.js');
  const cfg = config.default || config;
  assert.ok(cfg.webServer && typeof cfg.webServer.command === 'string',
    'webServer.command must be set');
  assert.ok(cfg.webServer && typeof cfg.webServer.url === 'string',
    'webServer.url must be set (health check URL for the started server)');
});

// ── T2 — Auth bypass fixture ──────────────────────────────────────────────────
console.log('\nT2 \u2014 Auth bypass fixture (AC2)');

test('T2.1 \u2014 tests/e2e/fixtures/auth.js exists', () => {
  const fixturePath = path.join(ROOT, 'tests', 'e2e', 'fixtures', 'auth.js');
  assert.ok(fs.existsSync(fixturePath), 'tests/e2e/fixtures/auth.js must exist');
});

test('T2.2 \u2014 fixture exports a withAuth property (Playwright test.extend pattern)', () => {
  const auth = require('../tests/e2e/fixtures/auth.js');
  assert.ok(auth.withAuth !== undefined, 'auth.js must export a withAuth extended test object');
});

test('T2.3 \u2014 fixture source does NOT contain real token patterns (gho_ or ghp_)', () => {
  const authSource = fs.readFileSync(
    path.join(ROOT, 'tests', 'e2e', 'fixtures', 'auth.js'), 'utf8');
  assert.ok(
    !authSource.includes('gho_'),
    'auth fixture must not contain real GitHub OAuth token prefix (gho_)'
  );
  assert.ok(
    !authSource.includes('ghp_'),
    'auth fixture must not contain real personal access token prefix (ghp_)'
  );
});

test('T2.4 \u2014 fixture guards activation with NODE_ENV check', () => {
  const authSource = fs.readFileSync(
    path.join(ROOT, 'tests', 'e2e', 'fixtures', 'auth.js'), 'utf8');
  assert.ok(
    authSource.includes('NODE_ENV') && authSource.includes("'test'"),
    "auth fixture must guard bypass with NODE_ENV === 'test' check"
  );
});

// ── T3 — npm scripts and devDependency declaration ────────────────────────────
console.log('\nT3 \u2014 npm scripts and devDependency (AC1)');

test('T3.1 \u2014 package.json has a test:e2e script', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.ok(
    typeof pkg.scripts['test:e2e'] === 'string',
    'package.json must have a test:e2e script'
  );
});

test('T3.2 \u2014 test:e2e script invokes playwright test', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.ok(
    pkg.scripts['test:e2e'].includes('playwright test'),
    "test:e2e script must invoke 'playwright test'"
  );
});

test('T3.3 \u2014 @playwright/test is in devDependencies, NOT dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.ok(
    pkg.devDependencies && pkg.devDependencies['@playwright/test'],
    '@playwright/test must be in devDependencies'
  );
  assert.ok(
    !pkg.dependencies || !pkg.dependencies['@playwright/test'],
    '@playwright/test must NOT be in production dependencies'
  );
});

test('T3.4 \u2014 npm test (unit chain) does not include test:e2e or playwright', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.ok(
    !pkg.scripts.test.includes('test:e2e') && !pkg.scripts.test.includes('playwright'),
    'npm test (unit chain) must not include test:e2e or playwright'
  );
});

// ── T4 — Placeholder spec files ───────────────────────────────────────────────
console.log('\nT4 \u2014 Placeholder spec files (AC5)');

test('T4.1 \u2014 tests/e2e/skill-launcher.spec.js exists', () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, 'tests', 'e2e', 'skill-launcher.spec.js')),
    'tests/e2e/skill-launcher.spec.js must exist'
  );
});

test('T4.2 \u2014 tests/e2e/artefact-preview.spec.js exists', () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, 'tests', 'e2e', 'artefact-preview.spec.js')),
    'tests/e2e/artefact-preview.spec.js must exist'
  );
});

test('T4.3 \u2014 tests/e2e/artefact-writeback.spec.js exists', () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, 'tests', 'e2e', 'artefact-writeback.spec.js')),
    'tests/e2e/artefact-writeback.spec.js must exist'
  );
});

test('T4.4 \u2014 tests/e2e/session-persistence.spec.js exists', () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, 'tests', 'e2e', 'session-persistence.spec.js')),
    'tests/e2e/session-persistence.spec.js must exist'
  );
});

test('T4.5 — each placeholder spec file contains at least 3 placeholder stubs (test.todo or test.skip)', () => {
  const specFiles = [
    'tests/e2e/skill-launcher.spec.js',
    'tests/e2e/artefact-preview.spec.js',
    'tests/e2e/artefact-writeback.spec.js',
    'tests/e2e/session-persistence.spec.js',
  ];
  for (const f of specFiles) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    // Playwright uses test.skip (not test.todo); accept either for compatibility
    const count = (src.match(/test\.(todo|skip)\(/g) || []).length;
    assert.ok(count >= 3, `${f} must contain at least 3 placeholder stubs, found ${count}`);
  }
});

test('T4.6 \u2014 tests/e2e/smoke.spec.js exists', () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, 'tests', 'e2e', 'smoke.spec.js')),
    'tests/e2e/smoke.spec.js must exist'
  );
});

// ── T5 — CI workflow ──────────────────────────────────────────────────────────
console.log('\nT5 \u2014 CI workflow (AC4)');

test('T5.1 \u2014 .github/workflows/e2e.yml exists', () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, '.github', 'workflows', 'e2e.yml')),
    '.github/workflows/e2e.yml must exist'
  );
});

test('T5.2 \u2014 workflow source contains npm run test:e2e', () => {
  const workflow = fs.readFileSync(
    path.join(ROOT, '.github', 'workflows', 'e2e.yml'), 'utf8');
  assert.ok(
    workflow.includes('npm run test:e2e'),
    'e2e.yml must contain "npm run test:e2e"'
  );
});

test('T5.3 \u2014 workflow does NOT declare contents: write permission', () => {
  const workflow = fs.readFileSync(
    path.join(ROOT, '.github', 'workflows', 'e2e.yml'), 'utf8');
  assert.ok(
    !workflow.includes('contents: write'),
    'e2e.yml must not use contents: write permission (ADR-009)'
  );
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n\u2500\u2500 Summary \u2500\u2500');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);

if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(({ name, err }) => {
    console.log(`  \u2717 ${name}`);
    console.log(`      ${err.message}`);
  });
}

if (failed > 0) {
  process.exit(1);
}
