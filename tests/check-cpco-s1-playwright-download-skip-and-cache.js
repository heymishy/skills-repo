/**
 * check-cpco-s1-playwright-download-skip-and-cache.js
 *
 * cpco-s1 - every npm ci step across the CI workflows must skip
 * @playwright/test's own postinstall browser download
 * (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD), every job that explicitly installs
 * Chromium afterward must cache that download (actions/cache targeting
 * ~/.cache/ms-playwright), and every setup-node step that runs npm ci must
 * use cache: 'npm'. Checked per-file with exact expected counts, not just
 * "at least one instance found" -- this story's whole point is completeness
 * across every call site, so a single missed instance must fail the check.
 *
 * Run: node tests/check-cpco-s1-playwright-download-skip-and-cache.js
 */

const fs = require('fs');
const path = require('path');

const SUITE = '[check-cpco-s1-playwright-download-skip-and-cache]';
let failures = 0;

function pass(id, msg) {
  console.log(`${SUITE} PASS ${id}: ${msg}`);
}

function fail(id, msg) {
  failures++;
  console.error(`${SUITE} FAIL ${id}: ${msg}`);
}

function readWorkflow(name) {
  return fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', name), 'utf8');
}

function countMatches(content, regex) {
  const matches = content.match(regex);
  return matches ? matches.length : 0;
}

const SKIP_ENV_RE = /run:\s*npm ci[^\n]*\n\s*env:\s*\n\s*PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD:\s*['"]1['"]/g;
const CACHE_STEP_RE = /uses:\s*actions\/cache@v4[\s\S]{0,150}?ms-playwright/g;
const NPM_CACHE_RE = /cache:\s*['"]npm['"]/g;

// T1 - AC1: every npm ci step sets PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD
(function t1() {
  const expected = {
    'staging-deploy.yml': 3,
    'e2e.yml': 3,
    'bri-s3.4-cross-tenant-repeat-gate.yml': 1,
    'pr-checks.yml': 1,
    'archive-session-turns.yml': 1,
  };

  let allOk = true;
  for (const [file, expectedCount] of Object.entries(expected)) {
    const content = readWorkflow(file);
    const found = countMatches(content, SKIP_ENV_RE);
    if (found !== expectedCount) {
      allOk = false;
      fail('T1', `${file}: expected ${expectedCount} npm-ci-with-skip-env instance(s), found ${found}`);
    }
  }
  if (allOk) {
    pass('T1', 'every npm ci step across all 5 files sets PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD (9 total call sites)');
  }
})();

// T2 - AC2: every job that installs Chromium explicitly caches it first
(function t2() {
  const expected = {
    'staging-deploy.yml': 2, // smoke-test, post-deploy-e2e-confirm (deploy-staging never installs Chromium)
    'e2e.yml': 3,
    'bri-s3.4-cross-tenant-repeat-gate.yml': 1,
    'pr-checks.yml': 0,
    'archive-session-turns.yml': 0,
  };

  let allOk = true;
  for (const [file, expectedCount] of Object.entries(expected)) {
    const content = readWorkflow(file);
    const found = countMatches(content, CACHE_STEP_RE);
    if (found !== expectedCount) {
      allOk = false;
      fail('T2', `${file}: expected ${expectedCount} Playwright-cache-step instance(s), found ${found}`);
    }
  }
  if (allOk) {
    pass('T2', 'every job that installs Chromium explicitly has a cache step for it (6 total call sites)');
  }
})();

// T3 - AC3: cache: 'npm' present on every setup-node step that runs npm ci
(function t3() {
  const expected = {
    'staging-deploy.yml': 3, // deploy-staging (pre-existing) + smoke-test (pre-existing) + post-deploy-e2e-confirm (new)
    'e2e.yml': 3,
    'bri-s3.4-cross-tenant-repeat-gate.yml': 1,
    'pr-checks.yml': 1, // pre-existing, unchanged
    'archive-session-turns.yml': 1,
  };

  let allOk = true;
  for (const [file, expectedCount] of Object.entries(expected)) {
    const content = readWorkflow(file);
    const found = countMatches(content, NPM_CACHE_RE);
    if (found !== expectedCount) {
      allOk = false;
      fail('T3', `${file}: expected ${expectedCount} cache:'npm' instance(s), found ${found}`);
    }
  }
  if (allOk) {
    pass('T3', "cache: 'npm' present on every setup-node step across all 5 files (9 total call sites)");
  }
})();

console.log(`${SUITE} ${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
