'use strict';

/**
 * check-bri-s2.6-smoke-test-promote-gate.js
 * Verifies AC1-AC4 of bri-s2.6 (T1-T8, NFR1, NFR2 from the story's test plan).
 *
 * Text/regex-based YAML assertions (no js-yaml dependency), consistent with
 * this repo's existing convention (see tests/check-dviz2-pages-workflow.js
 * and tests/check-bri-s2.5-ci-pipeline-staging-deploy.js).
 *
 * Run: node tests/check-bri-s2.6-smoke-test-promote-gate.js
 * Story: bri-s2.6  Feature: 2026-07-09-beta-readiness-infra
 *
 * Job id convention (fixed by bri-s2.5, reused here): the promote job's id
 * is `promote-to-prod` — this is also the allowlisted job id in
 * scripts/check-no-prod-deploy-on-push.js, so both stories' checks agree.
 */

const fs = require('fs');
const path = require('path');

const { findProdDeployViolations, ALLOWLISTED_JOB_IDS, PROD_APP_NAMES } = require('../scripts/check-no-prod-deploy-on-push');

const SUITE = '[check-bri-s2.6-smoke-test-promote-gate]';

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
const stagingDeployPath = path.join(workflowsDir, 'staging-deploy.yml');
const runbookPath = path.join(repoRoot, 'docs', 'rollback-runbook.md');

const stagingDeployContent = fs.existsSync(stagingDeployPath) ? fs.readFileSync(stagingDeployPath, 'utf8') : '';
const runbookContent = fs.existsSync(runbookPath) ? fs.readFileSync(runbookPath, 'utf8') : '';

/**
 * Splits a workflow file's content into per-job blocks using GitHub
 * Actions' standard 2-space-per-level indentation (jobs: -> 2-space job
 * ids -> 4+ space job bodies). Mirrors scripts/check-no-prod-deploy-on-push.js's
 * own splitJobs helper (kept local here since that module does not export it).
 */
function splitJobs(content) {
  const lines = content.split(/\r?\n/);
  const jobsIdx = lines.findIndex((l) => /^jobs:\s*$/.test(l));
  if (jobsIdx === -1) return [];

  const jobs = [];
  let current = null;
  for (let i = jobsIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^\S/.test(line)) break; // dedent back to a new top-level key
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

function jobById(jobs, id) {
  return jobs.find((j) => j.id === id);
}

function jobText(job) {
  return job ? job.lines.join('\n') : '';
}

const jobs = splitJobs(stagingDeployContent);
const smokeTestJob = jobById(jobs, 'smoke-test');
const promoteJob = jobById(jobs, 'promote-to-prod');

// ---------------------------------------------------------------------------
// T1 - a workflow job runs the @mocked-tagged Playwright suite against the
// staging URL (AC1)
// ---------------------------------------------------------------------------
(function t1() {
  if (!smokeTestJob) {
    fail('T1', 'no "smoke-test" job found in .github/workflows/staging-deploy.yml');
    return;
  }
  const text = jobText(smokeTestJob);
  const runsPlaywright = /playwright test/.test(text);
  const targetsMocked = /--grep[\s=]+["']?@mocked/.test(text) || /-g[\s=]+["']?@mocked/.test(text);
  const targetsStagingNotLocalhost = /(wuce-staging|\.fly\.dev)/.test(text) && !/localhost/.test(text);
  const needsDeployStaging = /needs:\s*\n?\s*-?\s*deploy-staging|needs:\s*deploy-staging/.test(text);

  if (runsPlaywright && targetsMocked && targetsStagingNotLocalhost && needsDeployStaging) {
    pass('T1', 'smoke-test job runs the @mocked Playwright suite against staging, after deploy-staging');
  } else {
    fail('T1', `runsPlaywright=${runsPlaywright} targetsMocked=${targetsMocked} targetsStaging=${targetsStagingNotLocalhost} needsDeployStaging=${needsDeployStaging}`);
  }
})();

// ---------------------------------------------------------------------------
// T2 - the smoke-test job reports a clear pass/fail result before the
// promote job is offered (AC1)
// ---------------------------------------------------------------------------
(function t2() {
  if (!smokeTestJob || !promoteJob) {
    fail('T2', `missing job(s) - smokeTestJob=${!!smokeTestJob} promoteJob=${!!promoteJob}`);
    return;
  }
  const smokeText = jobText(smokeTestJob);
  const noContinueOnError = !/continue-on-error:\s*true/.test(smokeText);
  const promoteNeedsSmokeTest = /needs:[\s\S]{0,80}smoke-test/.test(jobText(promoteJob));

  if (noContinueOnError && promoteNeedsSmokeTest) {
    pass('T2', 'smoke-test result is real (no continue-on-error) and gates the promote job via needs:');
  } else {
    fail('T2', `noContinueOnError=${noContinueOnError} promoteNeedsSmokeTest=${promoteNeedsSmokeTest}`);
  }
})();

// ---------------------------------------------------------------------------
// T3 - the promote job requires a manual trigger or environment approval,
// not an automatic condition (AC2)
// ---------------------------------------------------------------------------
(function t3() {
  if (!promoteJob) {
    fail('T3', 'no "promote-to-prod" job found');
    return;
  }
  const text = jobText(promoteJob);
  const hasEnvironmentGate = /(^|\n)\s*environment:\s*\S/.test(text);
  const hasWorkflowDispatch = /(^|\n)\s*workflow_dispatch:\s*(\n|$)/.test(stagingDeployContent);

  if (hasEnvironmentGate || hasWorkflowDispatch) {
    pass('T3', 'promote-to-prod job is gated by a GitHub Actions environment (reviewer approval) or workflow_dispatch');
  } else {
    fail('T3', 'promote-to-prod job has neither an environment: gate nor a workflow_dispatch trigger - reachable purely by push');
  }
})();

// ---------------------------------------------------------------------------
// T4 - the promote job does not deploy on the same trigger as the staging
// deploy; --app skills-framework/wuce-prod appears only inside the gated job
// (AC2)
// ---------------------------------------------------------------------------
(function t4() {
  if (!promoteJob) {
    fail('T4', 'no "promote-to-prod" job found');
    return;
  }
  const promoteDeploysProd = PROD_APP_NAMES.some((name) => new RegExp('--app[\\s=]+["\']?' + name + '\\b').test(jobText(promoteJob)));
  const violations = findProdDeployViolations(workflowsDir);

  if (promoteDeploysProd && violations.length === 0) {
    pass('T4', '--app ' + PROD_APP_NAMES.join('/') + ' appears only inside the allowlisted promote-to-prod job');
  } else {
    fail('T4', `promoteDeploysProd=${promoteDeploysProd} violations=${JSON.stringify(violations)}`);
  }
})();

// ---------------------------------------------------------------------------
// T5 - the promote job declares a needs: dependency on the smoke-test job
// (AC3)
// ---------------------------------------------------------------------------
(function t5() {
  if (!promoteJob) {
    fail('T5', 'no "promote-to-prod" job found');
    return;
  }
  const text = jobText(promoteJob);
  const needsSmokeTest = /needs:\s*\n?\s*-?\s*smoke-test|needs:\s*smoke-test/.test(text)
    || /needs:[\s\S]{0,80}-\s*smoke-test/.test(text);

  if (needsSmokeTest) {
    pass('T5', 'promote-to-prod job declares needs: smoke-test');
  } else {
    fail('T5', 'promote-to-prod job has no needs: dependency on smoke-test');
  }
})();

// ---------------------------------------------------------------------------
// T6 - the promote job has no if: override that would let it run despite a
// failed smoke-test job (AC3)
// ---------------------------------------------------------------------------
(function t6() {
  if (!promoteJob) {
    fail('T6', 'no "promote-to-prod" job found');
    return;
  }
  const text = jobText(promoteJob);
  const hasAlwaysOverride = /if:\s*.*always\(\)/.test(text);

  if (!hasAlwaysOverride) {
    pass('T6', 'no if: always() (or equivalent) override on promote-to-prod - default skip-on-failed-needs behaviour intact');
  } else {
    fail('T6', 'found an if: always() override on promote-to-prod - this would defeat the red-suite-blocks-promote guarantee');
  }
})();

// ---------------------------------------------------------------------------
// T7 - a rollback runbook document exists (AC4)
// ---------------------------------------------------------------------------
(function t7() {
  if (fs.existsSync(runbookPath)) {
    pass('T7', 'docs/rollback-runbook.md exists');
  } else {
    fail('T7', 'docs/rollback-runbook.md not found');
  }
})();

// ---------------------------------------------------------------------------
// T8 - the rollback runbook contains a concrete, copy-pasteable rollback
// command (AC4)
// ---------------------------------------------------------------------------
(function t8() {
  if (!runbookContent) {
    fail('T8', 'docs/rollback-runbook.md not found or empty');
    return;
  }
  const hasReleasesList = /fly releases[\s\S]{0,40}--app/.test(runbookContent);
  const hasRollbackCommand = /fly deploy[\s\S]{0,60}--image/.test(runbookContent)
    || /fly releases rollback/.test(runbookContent);

  if (hasReleasesList && hasRollbackCommand) {
    pass('T8', 'runbook contains a literal "fly releases --app" command and a rollback/redeploy command');
  } else {
    fail('T8', `hasReleasesList=${hasReleasesList} hasRollbackCommand=${hasRollbackCommand}`);
  }
})();

// ---------------------------------------------------------------------------
// NFR1 - Performance: smoke-test job's timeout-minutes is at/below the
// epic's 10-minute Metric 6 target
// ---------------------------------------------------------------------------
(function nfr1() {
  if (!smokeTestJob) {
    fail('NFR1', 'no "smoke-test" job found');
    return;
  }
  const match = /timeout-minutes:\s*(\d+)/.exec(jobText(smokeTestJob));
  if (match && Number(match[1]) <= 10) {
    pass('NFR1', `smoke-test job timeout-minutes=${match[1]} (<=10, coordinated with Metric 6)`);
  } else {
    fail('NFR1', match ? `timeout-minutes=${match[1]} exceeds the 10-minute budget` : 'no timeout-minutes set on smoke-test job');
  }
})();

// ---------------------------------------------------------------------------
// NFR2 - Security: the manual promote action requires Hamish's own GitHub
// authentication (workflow-level gate; no schedule/cron bypass)
// ---------------------------------------------------------------------------
(function nfr2() {
  if (!promoteJob) {
    fail('NFR2', 'no "promote-to-prod" job found');
    return;
  }
  const hasEnvironmentGate = /(^|\n)\s*environment:\s*\S/.test(jobText(promoteJob));
  const hasScheduleTrigger = /(^|\n)\s*schedule:\s*(\n|$)/.test(stagingDeployContent);

  if (hasEnvironmentGate && !hasScheduleTrigger) {
    pass('NFR2', 'promote-to-prod requires human GitHub Actions environment approval; no schedule/cron trigger could bypass it');
  } else {
    fail('NFR2', `hasEnvironmentGate=${hasEnvironmentGate} hasScheduleTrigger=${hasScheduleTrigger}`);
  }
})();

// ---------------------------------------------------------------------------
console.log('');
if (failed > 0) {
  console.error(SUITE + ' ' + passed + ' passed, ' + failed + ' failed');
  process.exit(1);
} else {
  console.log(SUITE + ' ' + passed + ' passed, 0 failed');
}
