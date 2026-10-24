#!/usr/bin/env node
/**
 * check-css-s3-pipeline-state-conflict-wiring.js
 *
 * Integration test for css-s3: pipeline-state-github-writer.js's real,
 * unmocked applyStateUpdate detects a genuine conflict (both
 * pipeline-state.json's current stage and an incoming stateUpdate.stage
 * have moved away from lastSyncedStage, to DIFFERENT values), resolves it
 * to pipeline-state.json's own value, logs it, and updates lastSyncedStage.
 *
 * Covers AC1, AC2 (fullSyncFlow_detectsAndResolvesConflict_endToEnd) per
 * the revised css-s3-test-plan.md.
 *
 * Run: node tests/check-css-s3-pipeline-state-conflict-wiring.js
 */
'use strict';

const syncLog = require('../src/web-ui/adapters/sync-log');
const pipelineStateGithubWriterFactory = require('../src/web-ui/adapters/pipeline-state-github-writer');

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function assert(label, condition, message) {
  if (condition) { totalPassed++; } else { totalFailed++; issues.push(`  ✗ [${label}] ${message}`); }
}

function b64(obj) {
  return Buffer.from(JSON.stringify(obj, null, 2) + '\n', 'utf8').toString('base64');
}

function installFetchMock(handlers) {
  const calls = [];
  const original = global.fetch;
  global.fetch = async function(url, opts) {
    calls.push({ url, opts });
    for (const h of handlers) {
      const result = h(url, opts, calls.length - 1);
      if (result) return result;
    }
    throw new Error('Unhandled fetch call: ' + url);
  };
  return { calls, restore: function() { global.fetch = original; } };
}

function jsonResponse(status, body, extra) {
  return Object.assign({
    ok: status >= 200 && status < 300,
    status: status,
    json: async () => body,
  }, extra || {});
}

function userHandler() {
  return (url) => {
    if (/\/user$/.test(url)) {
      return jsonResponse(200, { login: 'octocat', name: 'The Octocat', email: 'octocat@example.com' });
    }
    return null;
  };
}

async function run() {
  console.log('\n[css-s3] pipeline-state-github-writer.js conflict wiring (integration)\n');

  // T1 (AC1, AC2): a genuine conflict -- pipeline-state.json's own value wins, is NOT overwritten by the incoming stateUpdate.stage
  await (async function T1() {
    const fakePool = { calls: [], query: async function(sql, params) { this.calls.push({ sql, params }); return { rows: [] }; } };
    syncLog._setPoolForTesting(fakePool);

    const state = {
      schemaVersion: '1',
      features: [
        { slug: 'test-feat', id: 'test-feat', updatedAt: 'T0', stories: [
          { id: 's1', slug: 's1', stage: 'definition-of-ready', lastSyncedStage: 'test-plan', updatedAt: 'T0' },
        ] },
      ],
    };

    let putBody = null;
    const mock = installFetchMock([
      userHandler(),
      (url, opts) => {
        if (/\/contents\//.test(url) && (!opts || opts.method === undefined)) {
          return jsonResponse(200, { sha: 'sha-abc' });
        }
        return null;
      },
      (url) => {
        if (/\/git\/blobs\//.test(url)) {
          return jsonResponse(200, { content: b64(state), encoding: 'base64' });
        }
        return null;
      },
      (url, opts) => {
        if (/\/contents\//.test(url) && opts && opts.method === 'PUT') {
          putBody = JSON.parse(opts.body);
          return jsonResponse(200, {});
        }
        return null;
      },
    ]);

    try {
      const writer = pipelineStateGithubWriterFactory();
      // The incoming stateUpdate's own stage ("review") differs from BOTH
      // pipeline-state.json's current stage ("definition-of-ready") AND the
      // last-synced marker ("test-plan") -- both sides moved, to different
      // values: a genuine conflict.
      await writer('test-feat', 's1', { stage: 'review' }, { token: 'tok', owner: 'acme', repo: 'proj' });

      const decoded = JSON.parse(Buffer.from(putBody.content, 'base64').toString('utf8'));
      const story = decoded.features[0].stories[0];
      assert('T1-pipeline-state-value-wins', story.stage === 'definition-of-ready', `expected pipeline-state.json's own stage "definition-of-ready" to win, got "${story.stage}"`);
      assert('T1-last-synced-updated', story.lastSyncedStage === 'definition-of-ready', `expected lastSyncedStage updated to the resolved (winning) value, got "${story.lastSyncedStage}"`);

      const conflictCall = fakePool.calls.find(function(c) {
        return String(c.sql).toUpperCase().indexOf('SYNC_LOG') !== -1 && c.params.indexOf('conflict') !== -1;
      });
      assert('T1-conflict-logged', !!conflictCall, 'expected a sync_log conflict entry to have been written');
    } finally {
      mock.restore();
    }
  })();

  // T2: an ordinary single-sided advance (no conflict) -- stage applies normally, lastSyncedStage tracks it, no sync_log write
  await (async function T2() {
    const fakePool = { calls: [], query: async function(sql, params) { this.calls.push({ sql, params }); return { rows: [] }; } };
    syncLog._setPoolForTesting(fakePool);

    const state = {
      schemaVersion: '1',
      features: [
        { slug: 'test-feat-2', id: 'test-feat-2', updatedAt: 'T0', stories: [
          { id: 's1', slug: 's1', stage: 'test-plan', lastSyncedStage: 'test-plan', updatedAt: 'T0' },
        ] },
      ],
    };

    let putBody = null;
    const mock = installFetchMock([
      userHandler(),
      (url, opts) => {
        if (/\/contents\//.test(url) && (!opts || opts.method === undefined)) {
          return jsonResponse(200, { sha: 'sha-def' });
        }
        return null;
      },
      (url) => {
        if (/\/git\/blobs\//.test(url)) {
          return jsonResponse(200, { content: b64(state), encoding: 'base64' });
        }
        return null;
      },
      (url, opts) => {
        if (/\/contents\//.test(url) && opts && opts.method === 'PUT') {
          putBody = JSON.parse(opts.body);
          return jsonResponse(200, {});
        }
        return null;
      },
    ]);

    try {
      const writer = pipelineStateGithubWriterFactory();
      // Only the web-UI side is moving (stage: 'definition-of-ready'); the
      // story's own current stage already equals lastSyncedStage
      // ('test-plan') -- an ordinary single-sided advance, not a conflict.
      await writer('test-feat-2', 's1', { stage: 'definition-of-ready' }, { token: 'tok', owner: 'acme', repo: 'proj' });

      const decoded = JSON.parse(Buffer.from(putBody.content, 'base64').toString('utf8'));
      const story = decoded.features[0].stories[0];
      assert('T2-stage-applied-normally', story.stage === 'definition-of-ready', `expected the ordinary single-sided advance to apply normally, got "${story.stage}"`);
      assert('T2-last-synced-tracks', story.lastSyncedStage === 'definition-of-ready', `expected lastSyncedStage to track the new value, got "${story.lastSyncedStage}"`);

      const conflictCall = fakePool.calls.find(function(c) {
        return String(c.sql).toUpperCase().indexOf('SYNC_LOG') !== -1 && c.params.indexOf('conflict') !== -1;
      });
      assert('T2-no-conflict-logged', !conflictCall, 'expected NO sync_log conflict entry for an ordinary single-sided advance');
    } finally {
      mock.restore();
    }
  })();

  console.log(`[css-s3] ${totalPassed} passed, ${totalFailed} failed\n`);
  if (issues.length > 0) {
    console.log(issues.join('\n'));
    console.log('');
  }
  process.exit(totalFailed === 0 ? 0 : 1);
}

run();
