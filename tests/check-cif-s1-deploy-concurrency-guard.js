'use strict';

/**
 * check-cif-s1-deploy-concurrency-guard.js
 * Verifies AC1-AC4 of cif-s1 (U1-U3 from the story's test plan).
 *
 * Text/regex-based YAML assertions (no js-yaml dependency), consistent with
 * this repo's existing convention (see tests/check-bri-s2.6-smoke-test-promote-gate.js
 * and tests/check-dviz2-pages-workflow.js).
 *
 * Run: node tests/check-cif-s1-deploy-concurrency-guard.js
 * Story: cif-s1  Feature: 2026-07-29-ci-deploy-collision-fix
 */

const fs = require('fs');
const path = require('path');

const SUITE = '[check-cif-s1-deploy-concurrency-guard]';

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
const e2ePath = path.join(workflowsDir, 'e2e.yml');
const stagingDeployPath = path.join(workflowsDir, 'staging-deploy.yml');

const e2eContent = fs.existsSync(e2ePath) ? fs.readFileSync(e2ePath, 'utf8') : '';
const stagingDeployContent = fs.existsSync(stagingDeployPath) ? fs.readFileSync(stagingDeployPath, 'utf8') : '';

/**
 * Splits a workflow file's content into per-job blocks using GitHub Actions'
 * standard 2-space-per-level indentation (jobs: -> 2-space job ids -> 4+
 * space job bodies). Mirrors check-bri-s2.6-smoke-test-promote-gate.js's own
 * local splitJobs helper (kept local here too, matching that file's own note
 * that this helper is not shared/exported across test files).
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

function concurrencyGroup(job) {
  const text = jobText(job);
  // Bare-string form: `concurrency: deploy-group` (optionally followed by
  // trailing whitespace and a # comment, e.g. staging-deploy.yml's own
  // "# optional: ensure only one action runs at a time").
  const bare = /(^|\n)\s*concurrency:\s*([A-Za-z0-9_.-]+)\s*(#.*)?($|\n)/.exec(text);
  if (bare) return bare[2];
  // Object form: `concurrency:\n  group: deploy-group`
  const objectForm = /(^|\n)\s*concurrency:\s*\n\s*group:\s*([A-Za-z0-9_.-]+)/.exec(text);
  if (objectForm) return objectForm[2];
  return null;
}

const e2eJobs = splitJobs(e2eContent);
const stagingJobs = splitJobs(stagingDeployContent);

const scenarioAJob = jobById(e2eJobs, 'scenario-a-staging-e2e');
const scenarioBJob = jobById(e2eJobs, 'scenario-b-staging-e2e');
const plainE2eJob = jobById(e2eJobs, 'e2e');
const deployStagingJob = jobById(stagingJobs, 'deploy-staging');
const smokeTestJob = jobById(stagingJobs, 'smoke-test');
const promoteJob = jobById(stagingJobs, 'promote-to-prod');

const deployGroupName = deployStagingJob ? concurrencyGroup(deployStagingJob) : null;

// ---------------------------------------------------------------------------
// U1 (AC1) - scenario-a-staging-e2e declares the same concurrency group as
// deploy-staging
// ---------------------------------------------------------------------------
(function u1a() {
  if (!deployStagingJob) {
    fail('U1', 'no "deploy-staging" job found in .github/workflows/staging-deploy.yml');
    return;
  }
  if (!deployGroupName) {
    fail('U1', 'deploy-staging job has no concurrency group to compare against');
    return;
  }
  if (!scenarioAJob) {
    fail('U1', 'no "scenario-a-staging-e2e" job found in .github/workflows/e2e.yml');
    return;
  }
  const group = concurrencyGroup(scenarioAJob);
  if (group === deployGroupName) {
    pass('U1', `scenario-a-staging-e2e concurrency group ("${group}") matches deploy-staging's ("${deployGroupName}")`);
  } else {
    fail('U1', `scenario-a-staging-e2e concurrency group is "${group}", expected "${deployGroupName}"`);
  }
})();

// ---------------------------------------------------------------------------
// U1 (AC2) - scenario-b-staging-e2e declares the same concurrency group as
// deploy-staging
// ---------------------------------------------------------------------------
(function u1b() {
  if (!deployGroupName) {
    fail('U1', 'deploy-staging job has no concurrency group to compare against (already reported above)');
    return;
  }
  if (!scenarioBJob) {
    fail('U1', 'no "scenario-b-staging-e2e" job found in .github/workflows/e2e.yml');
    return;
  }
  const group = concurrencyGroup(scenarioBJob);
  if (group === deployGroupName) {
    pass('U1', `scenario-b-staging-e2e concurrency group ("${group}") matches deploy-staging's ("${deployGroupName}")`);
  } else {
    fail('U1', `scenario-b-staging-e2e concurrency group is "${group}", expected "${deployGroupName}"`);
  }
})();

// ---------------------------------------------------------------------------
// U2 (AC3) - no new concurrency declarations on the unrelated jobs:
// e2e.yml's `e2e` job, staging-deploy.yml's `smoke-test` and
// `promote-to-prod` jobs
// ---------------------------------------------------------------------------
(function u2() {
  const checks = [
    ['e2e (e2e.yml)', plainE2eJob],
    ['smoke-test (staging-deploy.yml)', smokeTestJob],
    ['promote-to-prod (staging-deploy.yml)', promoteJob]
  ];

  let allClean = true;
  const details = [];
  checks.forEach(function([label, job]) {
    if (!job) {
      allClean = false;
      details.push(`${label}: job not found`);
      return;
    }
    const group = concurrencyGroup(job);
    if (group) {
      allClean = false;
      details.push(`${label}: unexpectedly has concurrency group "${group}"`);
    }
  });

  if (allClean) {
    pass('U2', 'e2e, smoke-test, and promote-to-prod jobs have no concurrency key (scope discipline intact)');
  } else {
    fail('U2', details.join('; '));
  }
})();

// ---------------------------------------------------------------------------
// U3 (AC4) - both workflow files parse into a jobs: block (structural sanity
// check acting as a lightweight YAML validity proxy, matching this repo's
// existing text/regex-based convention rather than adding a js-yaml
// dependency)
// ---------------------------------------------------------------------------
(function u3() {
  const e2eHasJobsBlock = e2eJobs.length > 0;
  const stagingHasJobsBlock = stagingJobs.length > 0;
  // Sanity: no unresolved merge-conflict markers, which would otherwise make
  // a file look structurally intact to a regex parser while being invalid
  // YAML (see workspace's D40 conflict-marker-verification convention).
  const noConflictMarkers = !/<<<<<<<|=======|>>>>>>>/.test(e2eContent) && !/<<<<<<<|=======|>>>>>>>/.test(stagingDeployContent);

  if (e2eHasJobsBlock && stagingHasJobsBlock && noConflictMarkers) {
    pass('U3', `both workflow files parse into a valid jobs: block (e2e.yml: ${e2eJobs.length} jobs, staging-deploy.yml: ${stagingJobs.length} jobs), no conflict markers`);
  } else {
    fail('U3', `e2eHasJobsBlock=${e2eHasJobsBlock} stagingHasJobsBlock=${stagingHasJobsBlock} noConflictMarkers=${noConflictMarkers}`);
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
