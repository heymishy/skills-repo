'use strict';

/**
 * check-bri-s2.5-ci-pipeline-staging-deploy.js
 * Verifies AC1-AC4 of bri-s2.5 (T1-T6, IT1 from the story's test plan).
 *
 * Text/regex-based YAML assertions (no js-yaml dependency), consistent with
 * this repo's existing convention (see tests/check-dviz2-pages-workflow.js:
 * "js-yaml is not a listed dependency; structural YAML checks use
 * text-based assertions consistent with the no-external-deps ADR-001 rule").
 *
 * Run: node tests/check-bri-s2.5-ci-pipeline-staging-deploy.js
 * Story: bri-s2.5  Feature: 2026-07-09-beta-readiness-infra
 *
 * Repo-fact note (see decisions.md 2026-07-11 ASSUMPTION entry): this repo's
 * actual trunk branch is `master`, not `main` as the story/ACs/test plan
 * text says -- all "push to main" checks below target `master`.
 *
 * Post-bri-s2.6 update note: bri-s2.6 extended this same staging-deploy.yml
 * file with a `promote-to-prod` job that legitimately does deploy to the
 * production Fly app (skills-framework/wuce-prod), gated behind an
 * `environment:` approval and a `needs: smoke-test` dependency. T4 below
 * was originally a whole-file regex asserting the production app name never
 * appears anywhere in this file at all -- that assumption predates bri-s2.6
 * and is no longer correct now that the two stories share one workflow
 * file. Fixed to be job-scoped: it now only asserts that the
 * `deploy-staging` job itself never targets the production app, which is
 * the property this test was actually meant to verify. The whole-file
 * "no prod deploy outside the allowlisted promote job" property is already
 * covered separately and correctly by T5 (findProdDeployViolations, which
 * is job-scoped with an allowlist from the start).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const { findProdDeployViolations } = require('../scripts/check-no-prod-deploy-on-push');

/**
 * Splits a workflow file's content into per-job blocks using GitHub
 * Actions' standard 2-space-per-level indentation. Mirrors
 * scripts/check-no-prod-deploy-on-push.js's own splitJobs helper (kept
 * local here since that module does not export it).
 */
function splitJobs(content) {
  const lines = content.split(/\r?\n/);
  const jobsIdx = lines.findIndex((l) => /^jobs:\s*$/.test(l));
  if (jobsIdx === -1) return [];

  const jobs = [];
  let current = null;
  for (let i = jobsIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^\S/.test(line)) break;
    const jobHeaderMatch = /^  ([A-Za-z0-9_.-]+):\s*$/.exec(line);
    if (jobHeaderMatch) {
      if (current) jobs.push(current);
      current = { id: jobHeaderMatch[1], lines: [line] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) jobs.push(current);
  return jobs;
}

const SUITE = '[check-bri-s2.5-ci-pipeline-staging-deploy]';

let passed = 0;
let failed = 0;

function pass(id, msg) {
  console.log('  ✔ ' + id + ' ' + msg);
  passed++;
}

function fail(id, msg) {
  console.error('  ✖ ' + id + ' ' + msg);
  failed++;
}

const repoRoot = path.resolve(__dirname, '..');
const workflowsDir = path.join(repoRoot, '.github', 'workflows');
const prChecksPath = path.join(workflowsDir, 'pr-checks.yml');
const stagingDeployPath = path.join(workflowsDir, 'staging-deploy.yml');

const prChecksContent = fs.existsSync(prChecksPath) ? fs.readFileSync(prChecksPath, 'utf8') : '';
const stagingDeployContent = fs.existsSync(stagingDeployPath) ? fs.readFileSync(stagingDeployPath, 'utf8') : '';

// ---------------------------------------------------------------------------
// T1 — a pull_request-triggered workflow includes lint, typecheck, npm test,
// and a build step (AC1)
// ---------------------------------------------------------------------------
(function t1() {
  if (!prChecksContent) {
    fail('T1', '.github/workflows/pr-checks.yml not found');
    return;
  }
  const isPrTriggered = /(^|\n)\s*pull_request:\s*(\n|$)/.test(prChecksContent);
  const hasLint = /npm run lint/.test(prChecksContent);
  const hasTypecheck = /npm run typecheck|\btsc\b/.test(prChecksContent);
  const hasTest = /npm test\b/.test(prChecksContent);
  const hasBuild = /npm run build/.test(prChecksContent);

  if (isPrTriggered && hasLint && hasTypecheck && hasTest && hasBuild) {
    pass('T1', 'pull_request-triggered workflow includes lint, typecheck, npm test, and build');
  } else {
    fail('T1', `missing coverage - pr_trigger=${isPrTriggered} lint=${hasLint} typecheck=${hasTypecheck} test=${hasTest} build=${hasBuild}`);
  }
})();

// ---------------------------------------------------------------------------
// T2 — none of the four checks has continue-on-error: true (AC1)
// ---------------------------------------------------------------------------
(function t2() {
  if (!prChecksContent) {
    fail('T2', '.github/workflows/pr-checks.yml not found');
    return;
  }
  const hasContinueOnError = /continue-on-error:\s*true/.test(prChecksContent);
  if (!hasContinueOnError) {
    pass('T2', 'no continue-on-error: true present on any PR-check step');
  } else {
    fail('T2', 'found continue-on-error: true in pr-checks.yml - a failing check would not block merge');
  }
})();

// ---------------------------------------------------------------------------
// T3 — the wuce-staging deploy job's trigger is push to master only, not
// also pull_request (AC1, AC2)
// ---------------------------------------------------------------------------
(function t3() {
  if (!stagingDeployContent) {
    fail('T3', '.github/workflows/staging-deploy.yml not found');
    return;
  }
  const hasPushMaster = /(^|\n)\s*push:\s*\n\s*branches:\s*\n?\s*-?\s*master/.test(stagingDeployContent)
    || /(^|\n)\s*push:\s*\n\s*branches:\s*\[\s*master\s*\]/.test(stagingDeployContent);
  const alsoHasPullRequest = /(^|\n)\s*pull_request:\s*(\n|$)/.test(stagingDeployContent);

  if (hasPushMaster && !alsoHasPullRequest) {
    pass('T3', 'staging-deploy.yml is scoped to push:branches:[master] only, not pull_request');
  } else {
    fail('T3', `push_master=${hasPushMaster} also_pull_request=${alsoHasPullRequest}`);
  }
})();

// ---------------------------------------------------------------------------
// T4 — the push-to-master deploy step targets wuce-staging, not wuce-prod
// (AC2)
// ---------------------------------------------------------------------------
(function t4() {
  if (!stagingDeployContent) {
    fail('T4', '.github/workflows/staging-deploy.yml not found');
    return;
  }
  const jobs = splitJobs(stagingDeployContent);
  const deployStagingJob = jobs.find((j) => j.id === 'deploy-staging');
  const deployStagingText = deployStagingJob ? deployStagingJob.lines.join('\n') : stagingDeployContent;

  const targetsStaging = /--app[\s=]+["']?wuce-staging\b/.test(deployStagingText);
  const targetsProd = /--app[\s=]+["']?(wuce-prod|skills-framework)\b/.test(deployStagingText);

  if (targetsStaging && !targetsProd) {
    pass('T4', 'deploy-staging job targets --app wuce-staging, not wuce-prod/skills-framework (scoped to that job - a separate, allowlisted promote-to-prod job may legitimately target prod, verified by T5)');
  } else {
    fail('T4', `targets_staging=${targetsStaging} targets_prod=${targetsProd}`);
  }
})();

// ---------------------------------------------------------------------------
// T5 — no push-to-master-triggered workflow step deploys to the prod Fly app
// outside the S2.6 promote-to-prod job (AC4)
// ---------------------------------------------------------------------------
(function t5() {
  const violations = findProdDeployViolations(workflowsDir);
  if (violations.length === 0) {
    pass('T5', 'no push-to-master workflow deploys to wuce-prod/skills-framework outside promote-to-prod');
  } else {
    fail('T5', `found ${violations.length} violation(s): ${JSON.stringify(violations)}`);
  }
})();

// ---------------------------------------------------------------------------
// T6 — synthetic fixture: the same check function correctly flags a
// deliberately-introduced violation (AC4, proves the check is real)
// ---------------------------------------------------------------------------
(function t6() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bri-s2.5-fixture-'));
  try {
    const fixtureYml = [
      'name: Fixture Bad Workflow',
      'on:',
      '  push:',
      '    branches:',
      '      - master',
      'jobs:',
      '  deploy:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      '      - run: flyctl deploy --remote-only --app wuce-prod',
      ''
    ].join('\n');
    fs.writeFileSync(path.join(tmpDir, 'fixture-bad.yml'), fixtureYml, 'utf8');

    const violations = findProdDeployViolations(tmpDir);
    if (violations.length > 0) {
      pass('T6', `synthetic fixture correctly flagged (${violations.length} violation(s)) - check is a real detector`);
    } else {
      fail('T6', 'synthetic fixture with a deliberate wuce-prod deploy was NOT flagged - check is vacuous');
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
})();

// ---------------------------------------------------------------------------
// IT1 — the seed-script step runs immediately after the deploy step, within
// the same job (AC3)
// ---------------------------------------------------------------------------
(function it1() {
  if (!stagingDeployContent) {
    fail('IT1', '.github/workflows/staging-deploy.yml not found');
    return;
  }
  const lines = stagingDeployContent.split(/\r?\n/);
  const deployIdx = lines.findIndex((l) => /wuce-staging/.test(l) && /run:/.test(l));
  const seedIdx = lines.findIndex((l) => /seed-staging\.js/.test(l));
  const jobHeaderIdxs = lines
    .map((l, i) => (/^  [A-Za-z0-9_.-]+:\s*$/.test(l) ? i : -1))
    .filter((i) => i !== -1);

  if (deployIdx === -1 || seedIdx === -1) {
    fail('IT1', `could not locate both steps (deployIdx=${deployIdx} seedIdx=${seedIdx})`);
    return;
  }
  if (seedIdx <= deployIdx) {
    fail('IT1', 'seed step does not come after the deploy step');
    return;
  }
  // Confirm no job boundary falls strictly between deploy and seed (same job).
  const boundaryBetween = jobHeaderIdxs.some((i) => i > deployIdx && i < seedIdx);
  if (boundaryBetween) {
    fail('IT1', 'a new job starts between the deploy step and the seed step - not the same job');
    return;
  }
  pass('IT1', 'seed-staging.js step runs immediately after the wuce-staging deploy step, within the same job');
})();

// ---------------------------------------------------------------------------
console.log('');
if (failed > 0) {
  console.error(SUITE + ' ' + passed + ' passed, ' + failed + ' failed');
  process.exit(1);
} else {
  console.log(SUITE + ' ' + passed + ' passed, 0 failed');
}
