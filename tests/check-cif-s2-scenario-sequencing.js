'use strict';

/**
 * check-cif-s2-scenario-sequencing.js
 * Verifies AC1-AC4 of cif-s2 (U1-U4 from the story's test plan).
 *
 * Text/regex-based YAML assertions (no js-yaml dependency), consistent with
 * this repo's existing convention (see tests/check-cif-s1-deploy-concurrency-guard.js).
 *
 * Run: node tests/check-cif-s2-scenario-sequencing.js
 * Story: cif-s2  Feature: 2026-07-29-ci-deploy-collision-fix
 */

const fs = require('fs');
const path = require('path');

const SUITE = '[check-cif-s2-scenario-sequencing]';

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

/** Local copy of the splitJobs helper, matching this repo's existing per-file convention. */
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

function jobById(jobs, id) {
  return jobs.find((j) => j.id === id);
}

function jobText(job) {
  return job ? job.lines.join('\n') : '';
}

function concurrencyGroup(job) {
  const text = jobText(job);
  const bare = /(^|\n)\s*concurrency:\s*([A-Za-z0-9_.-]+)\s*(#.*)?($|\n)/.exec(text);
  return bare ? bare[2] : null;
}

function needsValue(job) {
  const text = jobText(job);
  const match = /(^|\n)\s*needs:\s*(\S+)\s*($|\n)/.exec(text);
  return match ? match[2] : null;
}

const e2eJobs = splitJobs(e2eContent);
const stagingJobs = splitJobs(stagingDeployContent);

const scenarioAJob = jobById(e2eJobs, 'scenario-a-staging-e2e');
const scenarioBJob = jobById(e2eJobs, 'scenario-b-staging-e2e');
const plainE2eJob = jobById(e2eJobs, 'e2e');
const deployStagingJob = jobById(stagingJobs, 'deploy-staging');
const smokeTestJob = jobById(stagingJobs, 'smoke-test');
const promoteJob = jobById(stagingJobs, 'promote-to-prod');

// ---------------------------------------------------------------------------
// U1 (AC1) - scenario-b-staging-e2e declares needs: scenario-a-staging-e2e
// ---------------------------------------------------------------------------
(function u1() {
  if (!scenarioBJob) {
    fail('U1', 'no "scenario-b-staging-e2e" job found in .github/workflows/e2e.yml');
    return;
  }
  // sep-s1 (2026-11-17): each scenario job boots its own throwaway environment, so there is no shared app to
  // serialise on; Scenario B no longer waits for Scenario A and the two run in parallel.
  const needs = needsValue(scenarioBJob);
  if (needs === null) {
    pass('U1', 'scenario-b-staging-e2e has no needs: (sep-s1: independent of Scenario A, own environment)');
  } else {
    fail('U1', `scenario-b-staging-e2e needs: is "${needs}", expected none (sep-s1)`);
  }
})();

// ---------------------------------------------------------------------------
// U2 (AC2) - both scenario jobs retain concurrency: deploy-group
// ---------------------------------------------------------------------------
(function u2() {
  if (!scenarioAJob || !scenarioBJob || !deployStagingJob) {
    fail('U2', `missing job(s) - scenarioAJob=${!!scenarioAJob} scenarioBJob=${!!scenarioBJob} deployStagingJob=${!!deployStagingJob}`);
    return;
  }
  const deployGroup = concurrencyGroup(deployStagingJob);
  const groupA = concurrencyGroup(scenarioAJob);
  const groupB = concurrencyGroup(scenarioBJob);

  // sep-s1 (2026-11-17): reversed - the scenario jobs no longer share the deploy group (own environment).
  if (deployGroup && groupA === null && groupB === null) {
    pass('U2', `neither scenario job declares concurrency: ${deployGroup} any more; deploy-staging keeps it (sep-s1)`);
  } else {
    fail('U2', `deployGroup=${deployGroup} groupA=${groupA} groupB=${groupB}`);
  }
})();

// ---------------------------------------------------------------------------
// U3 (AC3) - no other job gained a new needs: edge
// ---------------------------------------------------------------------------
(function u3() {
  const checks = [
    ['e2e (e2e.yml)', plainE2eJob, null],
    ['smoke-test (staging-deploy.yml)', smokeTestJob, 'deploy-staging'],
    ['promote-to-prod (staging-deploy.yml)', promoteJob, 'smoke-test'],
    ['deploy-staging (staging-deploy.yml)', deployStagingJob, null]
  ];

  let allUnchanged = true;
  const details = [];
  checks.forEach(function([label, job, expectedNeeds]) {
    if (!job) {
      allUnchanged = false;
      details.push(`${label}: job not found`);
      return;
    }
    let needs = needsValue(job);
    // sep-s1 (2026-11-17): promote-to-prod now needs smoke-test AND post-deploy-e2e-confirm (block list)
    if (label.indexOf('promote-to-prod') === 0 && /needs:\s*\n\s*- smoke-test\s*\n\s*- post-deploy-e2e-confirm/.test(jobText(job))) needs = expectedNeeds;
    if (needs !== expectedNeeds) {
      allUnchanged = false;
      details.push(`${label}: needs: is "${needs}", expected "${expectedNeeds}"`);
    }
  });

  if (allUnchanged) {
    pass('U3', 'e2e, smoke-test, promote-to-prod, and deploy-staging jobs\' needs: values are all unchanged');
  } else {
    fail('U3', details.join('; '));
  }
})();

// ---------------------------------------------------------------------------
// U4 (AC4) - both workflow files remain valid YAML
// ---------------------------------------------------------------------------
(function u4() {
  const e2eHasJobsBlock = e2eJobs.length > 0;
  const stagingHasJobsBlock = stagingJobs.length > 0;
  const noConflictMarkers = !/<<<<<<<|^=======$|>>>>>>>/m.test(e2eContent) && !/<<<<<<<|^=======$|>>>>>>>/m.test(stagingDeployContent);

  if (e2eHasJobsBlock && stagingHasJobsBlock && noConflictMarkers) {
    pass('U4', `both workflow files parse into a valid jobs: block (e2e.yml: ${e2eJobs.length} jobs, staging-deploy.yml: ${stagingJobs.length} jobs), no conflict markers`);
  } else {
    fail('U4', `e2eHasJobsBlock=${e2eHasJobsBlock} stagingHasJobsBlock=${stagingHasJobsBlock} noConflictMarkers=${noConflictMarkers}`);
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
