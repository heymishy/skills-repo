/**
 * check-ncdv-s1-npm-ci-foreground-scripts.js
 *
 * ncdv-s1 - deploy-staging and post-deploy-e2e-confirm's own npm ci steps
 * (both observed silently taking 6-7 minutes despite a reported npm-cache
 * hit) must stream lifecycle-script output via --foreground-scripts, so the
 * next real occurrence of the slow pattern is diagnosable. smoke-test's own
 * npm ci must NOT gain the flag -- it is already fast, out of scope. The
 * existing cpco-s1 env/cache settings must remain unchanged.
 *
 * Run: node tests/check-ncdv-s1-npm-ci-foreground-scripts.js
 */

const fs = require('fs');
const path = require('path');

const SUITE = '[check-ncdv-s1-npm-ci-foreground-scripts]';
let failures = 0;

function pass(id, msg) {
  console.log(`${SUITE} PASS ${id}: ${msg}`);
}

function fail(id, msg) {
  failures++;
  console.error(`${SUITE} FAIL ${id}: ${msg}`);
}

const content = fs.readFileSync(
  path.join(__dirname, '..', '.github', 'workflows', 'staging-deploy.yml'),
  'utf8'
);

// Split into per-job blocks using the top-level job name lines as anchors.
const deployStagingBlock = content.slice(
  content.indexOf('  deploy-staging:'),
  content.indexOf('  smoke-test:')
);
const smokeTestBlock = content.slice(
  content.indexOf('  smoke-test:'),
  content.indexOf('  post-deploy-e2e-confirm:')
);
const pmecBlock = content.slice(
  content.indexOf('  post-deploy-e2e-confirm:'),
  content.indexOf('  promote-to-prod:')
);

// T1 - AC1: deploy-staging's npm ci has --foreground-scripts
(function t1() {
  if (/run:\s*npm ci --foreground-scripts/.test(deployStagingBlock)) {
    pass('T1', "deploy-staging's npm ci includes --foreground-scripts");
  } else {
    fail('T1', "deploy-staging's npm ci is missing --foreground-scripts");
  }
})();

// T2 - AC1: post-deploy-e2e-confirm's npm ci has --foreground-scripts
(function t2() {
  if (/run:\s*npm ci --foreground-scripts/.test(pmecBlock)) {
    pass('T2', "post-deploy-e2e-confirm's npm ci includes --foreground-scripts");
  } else {
    fail('T2', "post-deploy-e2e-confirm's npm ci is missing --foreground-scripts");
  }
})();

// T3 - AC2 regression: smoke-test's npm ci does NOT gain the flag (out of scope)
(function t3() {
  if (/run:\s*npm ci --foreground-scripts/.test(smokeTestBlock)) {
    fail('T3', 'smoke-test\'s npm ci unexpectedly gained --foreground-scripts -- out of scope per the story');
  } else if (/run:\s*npm ci\s*\n/.test(smokeTestBlock)) {
    pass('T3', "smoke-test's npm ci remains unmodified (no --foreground-scripts, as scoped)");
  } else {
    fail('T3', "could not find smoke-test's own npm ci step at all -- block boundaries may be wrong");
  }
})();

// T4 - AC2 regression: PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD and cache: 'npm' unchanged
(function t4() {
  const bothHaveSkipEnv =
    /PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD:\s*['"]1['"]/.test(deployStagingBlock) &&
    /PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD:\s*['"]1['"]/.test(pmecBlock);
  const bothHaveNpmCache =
    /cache:\s*['"]npm['"]/.test(deployStagingBlock) && /cache:\s*['"]npm['"]/.test(pmecBlock);

  if (bothHaveSkipEnv && bothHaveNpmCache) {
    pass('T4', "cpco-s1's own PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD and cache: 'npm' settings are unchanged");
  } else {
    fail('T4', `cpco-s1 settings disturbed -- skipEnv present: ${bothHaveSkipEnv}, npmCache present: ${bothHaveNpmCache}`);
  }
})();

console.log(`${SUITE} ${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
