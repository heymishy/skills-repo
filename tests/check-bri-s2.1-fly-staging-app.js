'use strict';

/**
 * bri-s2.1 -- Provision the wuce-staging Fly app
 *
 * Static-analysis unit tests against fly.staging.toml and fly.toml.
 * No network calls, no real `fly deploy` -- see the story's test plan
 * Coverage gaps table for the two External-dependency gaps (real Fly
 * build/start, real weekly billing) that remain manual verification steps.
 *
 * Reference: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.1-fly-staging-app-test-plan.md
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const PROD_PATH = path.join(ROOT, 'fly.toml');
const STAGING_PATH = path.join(ROOT, 'fly.staging.toml');

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

/**
 * Minimal hand-rolled parser for this repo's flat-structure fly.toml files.
 * This is not a general TOML parser -- the repo has no TOML dependency
 * (per the test plan's T2 note) -- it is sufficient only for the sections
 * used here: top-level `app = '...'`, `[build]`, `[env]`, `[http_service]`,
 * `[http_service.concurrency]`, and `[[vm]]`.
 */
function parseFlyToml(content) {
  const lines = content.split(/\r?\n/);
  const result = { app: null, sections: {} };
  let currentSection = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const sectionMatch = line.match(/^\[\[?([a-zA-Z0-9_.]+)\]\]?$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      if (!result.sections[currentSection]) result.sections[currentSection] = {};
      continue;
    }

    const kvMatch = line.match(/^([a-zA-Z0-9_]+)\s*=\s*(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      let value = kvMatch[2].trim();

      const commentIdx = value.indexOf(' #');
      if (commentIdx !== -1) value = value.slice(0, commentIdx).trim();

      if (
        (value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"'))
      ) {
        value = value.slice(1, -1);
      }

      if (currentSection === null) {
        if (key === 'app') result.app = value;
      } else {
        result.sections[currentSection][key] = value;
      }
    }
  }

  return result;
}

function readFly(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return parseFlyToml(content);
}

// ---------------------------------------------------------------------------
// T1 -- fly.staging.toml exists at repo root
// ---------------------------------------------------------------------------
test('T1: fly.staging.toml exists at repo root', () => {
  assert.strictEqual(
    fs.existsSync(STAGING_PATH),
    true,
    'fly.staging.toml not found at repo root'
  );
});

// Guard: everything below needs both files to exist and parse. If
// fly.staging.toml is missing, fail loudly rather than throwing an
// unhandled ENOENT out of the remaining tests.
if (!fs.existsSync(STAGING_PATH) || !fs.existsSync(PROD_PATH)) {
  console.log(`\n[bri-s2.1] Results: ${passed} passed, ${failed + 7} failed (blocked -- fly.staging.toml or fly.toml missing)`);
  process.exit(1);
}

const prod = readFly(PROD_PATH);
const staging = readFly(STAGING_PATH);

// ---------------------------------------------------------------------------
// T2 -- app name is 'wuce-staging' and distinct from fly.toml's app
// ---------------------------------------------------------------------------
test("T2: fly.staging.toml declares app = 'wuce-staging', distinct from fly.toml's app", () => {
  assert.strictEqual(staging.app, 'wuce-staging', `expected staging app to be 'wuce-staging', got '${staging.app}'`);
  assert.notStrictEqual(staging.app, prod.app, 'staging app name must not equal prod app name');
});

// ---------------------------------------------------------------------------
// T3 -- [build], [http_service] (incl [http_service.concurrency]), [[vm]]
// sections match fly.toml exactly
// ---------------------------------------------------------------------------
test('T3a: [build] section matches fly.toml exactly', () => {
  assert.deepStrictEqual(staging.sections.build || {}, prod.sections.build || {});
});

test('T3b: [http_service] section (incl. concurrency) matches fly.toml exactly', () => {
  assert.deepStrictEqual(
    staging.sections.http_service || {},
    prod.sections.http_service || {}
  );
  assert.deepStrictEqual(
    staging.sections['http_service.concurrency'] || {},
    prod.sections['http_service.concurrency'] || {}
  );
});

test('T3c: [[vm]] section matches fly.toml exactly', () => {
  assert.deepStrictEqual(staging.sections.vm || {}, prod.sections.vm || {});
});

// ---------------------------------------------------------------------------
// T4 -- [env] block differs only in documented staging-specific keys
// ---------------------------------------------------------------------------
test('T4: [env] key set has no unexplained divergence from fly.toml', () => {
  // No staging-specific env key is documented at implementation time (see
  // test plan Test Gaps row for T4), so the [env] key sets must match
  // exactly. If a genuinely staging-only key is introduced later, add it
  // to this allowlist rather than loosening the assertion.
  const ALLOWED_STAGING_ONLY_ENV_KEYS = [];

  const prodEnv = prod.sections.env || {};
  const stagingEnv = staging.sections.env || {};

  const prodKeys = Object.keys(prodEnv);
  const stagingKeys = Object.keys(stagingEnv);

  const missingFromStaging = prodKeys.filter((k) => !stagingKeys.includes(k));
  const extraInStaging = stagingKeys
    .filter((k) => !prodKeys.includes(k))
    .filter((k) => !ALLOWED_STAGING_ONLY_ENV_KEYS.includes(k));

  assert.deepStrictEqual(
    missingFromStaging,
    [],
    `fly.staging.toml is missing [env] keys present in fly.toml: ${missingFromStaging.join(', ')}`
  );
  assert.deepStrictEqual(
    extraInStaging,
    [],
    `fly.staging.toml has undocumented extra [env] keys: ${extraInStaging.join(', ')}`
  );

  for (const key of prodKeys) {
    if (stagingKeys.includes(key)) {
      assert.strictEqual(
        stagingEnv[key],
        prodEnv[key],
        `[env] key "${key}" differs between fly.toml and fly.staging.toml`
      );
    }
  }
});

// ---------------------------------------------------------------------------
// T5 / NFR2 -- no hardcoded secret-shaped values in fly.staging.toml
// ---------------------------------------------------------------------------
test('T5/NFR2: fly.staging.toml contains no hardcoded secret-shaped values', () => {
  const content = fs.readFileSync(STAGING_PATH, 'utf8');
  const secretPatterns = [
    /postgres:\/\//i,
    /redis:\/\//i,
    /rediss:\/\//i,
    /sk_[a-zA-Z0-9]/,
    /whsec_[a-zA-Z0-9]/,
    /UPSTASH_REDIS_REST_TOKEN\s*=\s*['"][^'"]+['"]/,
  ];

  const matches = secretPatterns.filter((re) => re.test(content));
  assert.deepStrictEqual(
    matches,
    [],
    `fly.staging.toml appears to contain secret-shaped literal(s): ${matches
      .map((re) => re.toString())
      .join(', ')}`
  );
});

// ---------------------------------------------------------------------------
// NFR3 -- scale-to-zero config proxy for near-zero staging cost (AC3)
// ---------------------------------------------------------------------------
test('NFR3: scale-to-zero config present and matches fly.toml (cost proxy for AC3)', () => {
  const stagingHttp = staging.sections.http_service || {};
  const prodHttp = prod.sections.http_service || {};

  assert.strictEqual(stagingHttp.auto_stop_machines, 'suspend');
  assert.strictEqual(stagingHttp.min_machines_running, '0');
  assert.strictEqual(stagingHttp.auto_stop_machines, prodHttp.auto_stop_machines);
  assert.strictEqual(stagingHttp.min_machines_running, prodHttp.min_machines_running);
});

console.log(`\n[bri-s2.1] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
