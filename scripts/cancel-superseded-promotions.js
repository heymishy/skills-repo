#!/usr/bin/env node
'use strict';

// cancel-superseded-promotions.js -- spg-s1. Once a newer commit has reached
// staging, any older Staging Deploy run still waiting for production approval
// is superseded: approving it would promote old code. This cancels exactly the
// runs of staging-deploy.yml that are waiting and have a lower run number than
// the current run. Queued, in-progress, newer and other-workflow runs are left
// alone. A cancel (or a listing) that fails is reported as a warning and never
// fails the job: nothing is deployed or deleted by cancelling a waiting run.

const { githubRequest } = require('./lib/github-request');

const WORKFLOW_FILE = 'staging-deploy.yml';
const WORKFLOW_PATH = '.github/workflows/' + WORKFLOW_FILE;
const PAGE_SIZE = 100;
const MAX_PAGES = 20;

// Injectable adapters (D37): the defaults throw, so an unwired script cannot silently do nothing.
let _listWaitingRuns = function () {
  throw new Error('Adapter not wired: listWaitingRuns. Call setApi() with a real implementation before use.');
};
let _cancelRun = function () {
  throw new Error('Adapter not wired: cancelRun. Call setApi() with a real implementation before use.');
};
function setApi(api) { _listWaitingRuns = api.listWaitingRuns; _cancelRun = api.cancelRun; }

async function cancelSuperseded(currentRunNumber, log) {
  const cancelled = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const runs = await _listWaitingRuns(page);
    for (const run of runs) {
      if (run.status !== 'waiting' || run.path !== WORKFLOW_PATH) continue;
      if (!(Number(run.run_number) < currentRunNumber)) continue;
      try {
        await _cancelRun(run.id);
        cancelled.push(run.id);
      } catch (e) {
        log('::warning::could not cancel run ' + run.id + ': ' + e.message);
      }
    }
    if (runs.length < PAGE_SIZE) break;
  }
  return cancelled;
}

async function main(env, log) {
  const apiUrl = env.GITHUB_API_URL || 'https://api.github.com';
  const repo = env.GITHUB_REPOSITORY;
  const token = env.GITHUB_TOKEN;
  const current = Number(env.GITHUB_RUN_NUMBER);
  if (!repo || !token || !Number.isFinite(current)) {
    log('::warning::cancel-superseded-promotions: GITHUB_REPOSITORY, GITHUB_TOKEN and GITHUB_RUN_NUMBER are all required; nothing was cancelled');
    return 0;
  }
  setApi({
    listWaitingRuns: async function (page) {
      const res = await githubRequest('GET', apiUrl, '/repos/' + repo + '/actions/workflows/' + WORKFLOW_FILE + '/runs?status=waiting&per_page=' + PAGE_SIZE + '&page=' + page, token);
      if (res.status !== 200 || !res.json || !Array.isArray(res.json.workflow_runs)) throw new Error('listing runs answered ' + res.status);
      return res.json.workflow_runs;
    },
    cancelRun: async function (id) {
      const res = await githubRequest('POST', apiUrl, '/repos/' + repo + '/actions/runs/' + id + '/cancel', token);
      if (res.status !== 202) throw new Error('cancel answered ' + res.status);
    }
  });
  try {
    const cancelled = await cancelSuperseded(current, log);
    log('[cancel-superseded-promotions] cancelled ' + cancelled.length + ' superseded waiting run(s) older than run number ' + current);
  } catch (e) {
    log('::warning::cancel-superseded-promotions: ' + e.message);
  }
  return 0;
}

if (require.main === module) {
  main(process.env, console.log).then(function (code) { process.exit(code); });
}

module.exports = { cancelSuperseded, setApi, main };
