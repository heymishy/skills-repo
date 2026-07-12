'use strict';

/**
 * bri-s2.5 AC4 - CI-native static check: no push-to-master-triggered GitHub
 * Actions workflow step deploys to the production Fly app (wuce-prod, or
 * this repo's current prod app name, skills-framework), outside the
 * manual-approval promote job bri-s2.6 will introduce (job id convention:
 * promote-to-prod, per this story's DoR Coding Agent Instructions).
 *
 * Text/regex-based (no js-yaml dependency), consistent with this repo's
 * existing workflow-check convention (see
 * tests/check-dviz2-pages-workflow.js).
 *
 * Run standalone: node scripts/check-no-prod-deploy-on-push.js
 */

const fs = require('fs');
const path = require('path');

const PROD_APP_NAMES = ['wuce-prod', 'skills-framework'];
const ALLOWLISTED_JOB_IDS = ['promote-to-prod'];

function isProdDeployLine(line) {
  return PROD_APP_NAMES.some((appName) => {
    const flagPattern = new RegExp('--app[\\s=]+["\']?' + appName + '\\b', 'i');
    const keyPattern = new RegExp('\\bapp:\\s*["\']?' + appName + '\\b', 'i');
    return flagPattern.test(line) || keyPattern.test(line);
  });
}

function hasPushTrigger(content) {
  return /(^|\n)\s*push:\s*(\n|$)/.test(content);
}

/**
 * Splits a workflow file's content into per-job blocks using GitHub
 * Actions' standard 2-space-per-level indentation
 * (jobs: -> 2-space job ids -> 4+ space job bodies).
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

function findProdDeployViolations(workflowsDir) {
  const violations = [];
  if (!fs.existsSync(workflowsDir)) return violations;

  const files = fs.readdirSync(workflowsDir)
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));

  for (const file of files) {
    const fullPath = path.join(workflowsDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');

    if (!hasPushTrigger(content)) continue;

    const jobs = splitJobs(content);
    for (const job of jobs) {
      if (ALLOWLISTED_JOB_IDS.includes(job.id)) continue;
      for (const line of job.lines) {
        if (isProdDeployLine(line)) {
          violations.push({ file, job: job.id, line: line.trim() });
        }
      }
    }
  }

  return violations;
}

module.exports = { findProdDeployViolations, ALLOWLISTED_JOB_IDS, PROD_APP_NAMES };

if (require.main === module) {
  const workflowsDir = path.resolve(__dirname, '..', '.github', 'workflows');
  const violations = findProdDeployViolations(workflowsDir);
  if (violations.length > 0) {
    console.error('[check-no-prod-deploy-on-push] VIOLATIONS FOUND:');
    for (const v of violations) {
      console.error('  ' + v.file + ' :: job "' + v.job + '" :: ' + v.line);
    }
    process.exit(1);
  }
  console.log('[check-no-prod-deploy-on-push] 0 violations - no push-to-master workflow deploys to prod outside the promote job');
}
