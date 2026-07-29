'use strict';

/**
 * check-pmec-s1-post-merge-e2e-confirmation.js
 * Verifies AC1-AC5 of pmec-s1 (U1-U5 from the story's test plan).
 *
 * Text/regex-based YAML assertions (no js-yaml dependency), consistent with
 * this repo's existing convention (see tests/check-cif-s1-deploy-concurrency-guard.js
 * and tests/check-bri-s2.6-smoke-test-promote-gate.js).
 *
 * Run: node tests/check-pmec-s1-post-merge-e2e-confirmation.js
 * Story: pmec-s1  Feature: 2026-07-29-post-merge-e2e-confirmation
 */

const fs = require('fs');
const path = require('path');

const SUITE = '[check-pmec-s1-post-merge-e2e-confirmation]';

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
const e2ePath = path.join(workflowsDir, 'e2e.yml');
const deliveryPatternsPath = path.join(repoRoot, 'standards', 'governance', 'delivery-patterns.md');

const stagingDeployContent = fs.existsSync(stagingDeployPath) ? fs.readFileSync(stagingDeployPath, 'utf8') : '';
const e2eContent = fs.existsSync(e2ePath) ? fs.readFileSync(e2ePath, 'utf8') : '';
const deliveryPatternsContent = fs.existsSync(deliveryPatternsPath) ? fs.readFileSync(deliveryPatternsPath, 'utf8') : '';

/**
 * Splits a workflow file's content into per-job blocks using GitHub Actions'
 * standard 2-space-per-level indentation. Local copy, matching the existing
 * convention of not sharing this helper across test files (see
 * check-bri-s2.6-smoke-test-promote-gate.js / check-cif-s1-deploy-concurrency-guard.js).
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

function jobById(jobs, id) {
  return jobs.find((j) => j.id === id);
}

function jobText(job) {
  return job ? job.lines.join('\n') : '';
}

/** Extracts the first playwright test file-list argument from a run: block. */
function extractSpecFiles(text) {
  const match = /npx playwright test\s+((?:tests\/e2e\/[A-Za-z0-9_.-]+\.spec\.js\s*)+)/.exec(text);
  if (!match) return [];
  return match[1].trim().split(/\s+/);
}

const stagingJobs = splitJobs(stagingDeployContent);
const e2eJobs = splitJobs(e2eContent);

const newJob = jobById(stagingJobs, 'post-deploy-e2e-confirm');
const promoteJob = jobById(stagingJobs, 'promote-to-prod');
const scenarioAJob = jobById(e2eJobs, 'scenario-a-staging-e2e');
const scenarioBJob = jobById(e2eJobs, 'scenario-b-staging-e2e');

// ---------------------------------------------------------------------------
// U1 (AC1) - new job exists with needs: deploy-staging
// ---------------------------------------------------------------------------
(function u1() {
  if (!newJob) {
    fail('U1', 'no "post-deploy-e2e-confirm" job found in .github/workflows/staging-deploy.yml');
    return;
  }
  const text = jobText(newJob);
  const needsDeployStaging = /needs:\s*deploy-staging\s*($|\n)/.test(text);
  if (needsDeployStaging) {
    pass('U1', 'post-deploy-e2e-confirm job exists and declares needs: deploy-staging');
  } else {
    fail('U1', 'post-deploy-e2e-confirm job does not declare needs: deploy-staging');
  }
})();

// ---------------------------------------------------------------------------
// U2 (AC2) - new job runs the same specs behind the same flags as Scenario A/B
// ---------------------------------------------------------------------------
(function u2() {
  if (!newJob || !scenarioAJob || !scenarioBJob) {
    fail('U2', `missing job(s) - newJob=${!!newJob} scenarioAJob=${!!scenarioAJob} scenarioBJob=${!!scenarioBJob}`);
    return;
  }
  const newText = jobText(newJob);
  const scenarioAText = jobText(scenarioAJob);
  const scenarioBText = jobText(scenarioBJob);

  const newSpecsA = extractSpecFiles(newText.split('Scenario B')[0]);
  const realSpecsA = extractSpecFiles(scenarioAText);
  const newSpecsB = extractSpecFiles(newText.split('Scenario B')[1] || '');
  const realSpecsB = extractSpecFiles(scenarioBText);

  const specsAMatch = newSpecsA.length > 0 && JSON.stringify(newSpecsA) === JSON.stringify(realSpecsA);
  const specsBMatch = newSpecsB.length > 0 && JSON.stringify(newSpecsB) === JSON.stringify(realSpecsB);
  const usesScenarioAFlag = /staging_e2e_scenario_a/.test(newText);
  const usesScenarioBFlag = /staging_e2e_scenario_b/.test(newText);

  if (specsAMatch && specsBMatch && usesScenarioAFlag && usesScenarioBFlag) {
    pass('U2', `post-deploy-e2e-confirm reuses Scenario A's ${realSpecsA.length} spec(s) and Scenario B's ${realSpecsB.length} spec(s) behind the same flags`);
  } else {
    fail('U2', `specsAMatch=${specsAMatch} specsBMatch=${specsBMatch} usesScenarioAFlag=${usesScenarioAFlag} usesScenarioBFlag=${usesScenarioBFlag} newSpecsA=${JSON.stringify(newSpecsA)} realSpecsA=${JSON.stringify(realSpecsA)} newSpecsB=${JSON.stringify(newSpecsB)} realSpecsB=${JSON.stringify(realSpecsB)}`);
  }
})();

// ---------------------------------------------------------------------------
// U3 (AC3) - promote-to-prod's needs: is unchanged (still only smoke-test)
// ---------------------------------------------------------------------------
(function u3() {
  if (!promoteJob) {
    fail('U3', 'no "promote-to-prod" job found');
    return;
  }
  const text = jobText(promoteJob);
  const needsMatch = /needs:\s*(\S+)\s*($|\n)/.exec(text);
  const needsValue = needsMatch ? needsMatch[1] : null;

  if (needsValue === 'smoke-test') {
    pass('U3', 'promote-to-prod needs: is unchanged (still only smoke-test)');
  } else {
    fail('U3', `promote-to-prod needs: is "${needsValue}", expected exactly "smoke-test"`);
  }
})();

// ---------------------------------------------------------------------------
// U4 (AC4) - new job cannot block promote-to-prod: no job's needs: names it
// ---------------------------------------------------------------------------
(function u4() {
  if (!newJob) {
    fail('U4', 'no "post-deploy-e2e-confirm" job found (already reported above)');
    return;
  }
  const dependents = stagingJobs.filter((j) => {
    const needsMatch = /needs:[\s\S]{0,120}/.exec(jobText(j));
    return needsMatch && needsMatch[0].includes('post-deploy-e2e-confirm');
  });

  if (dependents.length === 0) {
    pass('U4', 'no job in staging-deploy.yml depends on post-deploy-e2e-confirm — structurally non-blocking');
  } else {
    fail('U4', `job(s) unexpectedly depend on post-deploy-e2e-confirm: ${dependents.map((j) => j.id).join(', ')}`);
  }
})();

// ---------------------------------------------------------------------------
// U5 (AC5) - standards doc covers all 4 required points
// ---------------------------------------------------------------------------
(function u5() {
  if (!deliveryPatternsContent) {
    fail('U5', 'standards/governance/delivery-patterns.md not found');
    return;
  }
  const hasD44Section = /##\s*New-Endpoint Same-PR Real-Staging E2E Bootstrapping Gap/.test(deliveryPatternsContent);
  const explainsWhy = /no PR-preview deploy mechanism/.test(deliveryPatternsContent);
  const explainsRecognition = /JSON-parse error|sign-in page/.test(deliveryPatternsContent);
  const explainsWorkaround = /gh run rerun/.test(deliveryPatternsContent) && /flyctl ssh console/.test(deliveryPatternsContent);
  const pointsToAutomatedJob = /post-deploy-e2e-confirm/.test(deliveryPatternsContent);

  if (hasD44Section && explainsWhy && explainsRecognition && explainsWorkaround && pointsToAutomatedJob) {
    pass('U5', 'delivery-patterns.md D44 section covers all 4 required points (why, recognise, workaround, automated job pointer)');
  } else {
    fail('U5', `hasD44Section=${hasD44Section} explainsWhy=${explainsWhy} explainsRecognition=${explainsRecognition} explainsWorkaround=${explainsWorkaround} pointsToAutomatedJob=${pointsToAutomatedJob}`);
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
