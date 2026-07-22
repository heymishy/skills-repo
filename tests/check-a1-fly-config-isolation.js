'use strict';

/**
 * check-a1-fly-config-isolation.js — story a1-staging-safe-auth-stub, AC3
 *
 * Verifies AC3: the staging-safe auth stub mechanism's enabling environment
 * variable (E2E_STAGING_AUTH_STUB_SECRET, src/web-ui/routes/auth-stub.js) is
 * confirmed absent from the real production Fly app configuration (fly.toml) --
 * production auth behaviour is unchanged. Read-only, no staging network call
 * (per the test plan's Test Data Strategy row for AC3).
 *
 * Reference: artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/a1-staging-safe-auth-stub-test-plan.md
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const PROD_FLY_PATH = path.join(ROOT, 'fly.toml');

// The exact name of the stub-enabling env var, as referenced by
// src/web-ui/routes/auth-stub.js's _stubEnabled()/_secretMatches().
const STUB_ENV_VAR_NAME = 'E2E_STAGING_AUTH_STUB_SECRET';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    failed++;
  }
}

test('T1: fly.toml (production) exists at repo root', () => {
  assert.strictEqual(fs.existsSync(PROD_FLY_PATH), true, 'fly.toml not found at repo root');
});

if (!fs.existsSync(PROD_FLY_PATH)) {
  console.log(`\n[a1-fly-config-isolation] Results: ${passed} passed, ${failed + 1} failed (blocked -- fly.toml missing)`);
  process.exit(1);
}

const prodFlyContent = fs.readFileSync(PROD_FLY_PATH, 'utf8');

test(`T2 (AC3): "${STUB_ENV_VAR_NAME}" does not appear anywhere in fly.toml`, () => {
  assert.strictEqual(
    prodFlyContent.includes(STUB_ENV_VAR_NAME),
    false,
    `fly.toml (production) must never reference ${STUB_ENV_VAR_NAME} -- found it in the file. ` +
      'This variable gates a staging-only auth bypass and must exist only as a Fly secret on ' +
      'the wuce-staging app, never in production config.'
  );
});

test('T3: fly.toml declares the production app name (sanity check this is the right file)', () => {
  assert.match(prodFlyContent, /app\s*=\s*['"][^'"]+['"]/, 'fly.toml should declare an app name');
  assert.doesNotMatch(prodFlyContent, /app\s*=\s*['"]wuce-staging['"]/, 'fly.toml must not declare the staging app name');
});

console.log(`\n[a1-fly-config-isolation] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
