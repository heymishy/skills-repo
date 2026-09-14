#!/usr/bin/env node
/**
 * check-wsd-s2-github-pipeline-state-writer.js
 *
 * Tests for wsd-s2 — GitHub-API-backed pipeline-state writer for the
 * production container, wired by environment, with failure visibility.
 * Mocks `fetch` directly (mirrors artefact-commit-writer.js's own
 * `fetch`-based mechanics, adapted from `check-s6.1`/`check-pla-s2`'s
 * established `https.request`-mocking convention).
 *
 * Covers: T1-T9.
 *
 * Run: node tests/check-wsd-s2-github-pipeline-state-writer.js
 */
'use strict';

const fs   = require('fs');
const os   = require('os');
const path = require('path');

const pipelineStateGithubWriterFactory = require('../src/web-ui/adapters/pipeline-state-github-writer');
const { selectPipelineStateWriterFactory } = require('../src/web-ui/adapters/pipeline-state-writer-selector');

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix + '-'));
}
function rmDir(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function ok() { totalPassed++; }
function fail(label, message) {
  totalFailed++;
  issues.push(`  ✗ [${label}] ${message}`);
}
function assert(label, condition, message) {
  if (condition) { ok(); } else { fail(label, message); }
}

function b64(obj) {
  return Buffer.from(JSON.stringify(obj, null, 2) + '\n', 'utf8').toString('base64');
}

function makeFixtureState() {
  return {
    schemaVersion: '1',
    features: [
      { slug: 'test-feat', id: 'test-feat', updatedAt: 'T0', stories: [
        { id: 's1', slug: 's1', dorStatus: 'not-started', updatedAt: 'T0' },
      ] },
    ],
  };
}

/**
 * Installs a fetch mock. `handlers` is an ordered array of functions
 * (url, opts) => response-shaped-object | null (null = fall through to the
 * next handler). Each call is recorded in `calls`.
 */
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
  console.log('\n[wsd-s2] GitHub-API pipeline-state writer tests\n');

  // ── T3: isRealCheckout=true (local .git present) — local-fs factory selected, not GitHub-API ──
  (function T3() {
    const dir = makeTempDir('wsd-s2-real-checkout');
    try {
      fs.mkdirSync(path.join(dir, '.git'));
      let localFsInvoked = false;
      let githubApiInvoked = false;
      const factories = {
        localFs:   function(repoRoot) { localFsInvoked = true; return function() {}; },
        githubApi: function() { githubApiInvoked = true; return function() {}; },
      };
      const chosen = selectPipelineStateWriterFactory(dir, factories);
      chosen(dir);
      assert('T3-local-fs-invoked', localFsInvoked === true, 'expected the local-fs factory to be invoked when .git is present');
      assert('T3-github-api-not-invoked', githubApiInvoked === false, 'expected the GitHub-API factory NOT to be invoked when .git is present');
    } finally {
      rmDir(dir);
    }
  })();

  // ── T4: isRealCheckout=false (no local .git) — GitHub-API factory selected ──
  (function T4() {
    const dir = makeTempDir('wsd-s2-no-checkout');
    try {
      let localFsInvoked = false;
      let githubApiInvoked = false;
      const factories = {
        localFs:   function() { localFsInvoked = true; return function() {}; },
        githubApi: function() { githubApiInvoked = true; return function() {}; },
      };
      const chosen = selectPipelineStateWriterFactory(dir, factories);
      chosen(dir);
      assert('T4-github-api-invoked', githubApiInvoked === true, 'expected the GitHub-API factory to be invoked when .git is absent');
      assert('T4-local-fs-not-invoked', localFsInvoked === false, 'expected the local-fs factory NOT to be invoked when .git is absent');
    } finally {
      rmDir(dir);
    }
  })();

  // ── T1: successful GET+PUT, PUT sha matches GET sha, content correct ──
  await (async function T1() {
    const state = makeFixtureState();
    let putBody = null;
    const mock = installFetchMock([
      userHandler(),
      (url, opts) => {
        if (/\/contents\/\.github\/pipeline-state\.json$/.test(url) && (!opts || opts.method === undefined)) {
          return jsonResponse(200, { content: b64(state), sha: 'sha-abc' });
        }
        return null;
      },
      (url, opts) => {
        if (/\/contents\/\.github\/pipeline-state\.json$/.test(url) && opts && opts.method === 'PUT') {
          putBody = JSON.parse(opts.body);
          return jsonResponse(200, { commit: { sha: 'newcommit' } });
        }
        return null;
      },
    ]);
    try {
      const writer = pipelineStateGithubWriterFactory();
      await writer('test-feat', 's1', { dorStatus: 'signed-off' }, { token: 'tok', owner: 'acme', repo: 'proj' });
      assert('T1-sha-match', putBody.sha === 'sha-abc', `expected PUT sha to match GET sha "sha-abc", got "${putBody && putBody.sha}"`);
      const decoded = JSON.parse(Buffer.from(putBody.content, 'base64').toString('utf8'));
      const story = decoded.features[0].stories[0];
      assert('T1-field-change', story.dorStatus === 'signed-off', `expected dorStatus=signed-off in PUT content, got ${story.dorStatus}`);
    } finally {
      mock.restore();
    }
  })();

  // ── T2: feature-level-only stateUpdate — no phantom story created ──
  await (async function T2() {
    const state = makeFixtureState();
    let putBody = null;
    const mock = installFetchMock([
      userHandler(),
      (url, opts) => {
        if (/\/contents\//.test(url) && (!opts || opts.method === undefined)) {
          return jsonResponse(200, { content: b64(state), sha: 'sha-abc' });
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
      await writer('test-feat', null, { health: 'amber' }, { token: 'tok', owner: 'acme', repo: 'proj' });
      const decoded = JSON.parse(Buffer.from(putBody.content, 'base64').toString('utf8'));
      assert('T2-feature-field', decoded.features[0].health === 'amber', `expected feature health=amber, got ${decoded.features[0].health}`);
      assert('T2-no-phantom-story', decoded.features[0].stories.length === 1, `expected story count unchanged at 1, got ${decoded.features[0].stories.length}`);
    } finally {
      mock.restore();
    }
  })();

  // ── T5: second call's own GET already reflects a concurrent write — no false conflict ──
  await (async function T5() {
    const state1 = makeFixtureState();
    const state2 = makeFixtureState();
    state2.features[0].stories[0].dorStatus = 'in-progress'; // simulates a landed concurrent write
    let getCount = 0;
    let putBody = null;
    const mock = installFetchMock([
      userHandler(),
      (url, opts) => {
        if (/\/contents\//.test(url) && (!opts || opts.method === undefined)) {
          getCount++;
          if (getCount === 1) return jsonResponse(200, { content: b64(state1), sha: 'sha-abc' });
          return jsonResponse(200, { content: b64(state2), sha: 'sha-def' });
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
      await writer('test-feat', 's1', { prStatus: 'open' }, { token: 'tok', owner: 'acme', repo: 'proj' });
      await writer('test-feat', 's1', { prStatus: 'merged' }, { token: 'tok', owner: 'acme', repo: 'proj' });
      assert('T5-second-sha', putBody.sha === 'sha-def', `expected second call's PUT sha to be its own fresh GET sha "sha-def", got "${putBody.sha}"`);
      const decoded = JSON.parse(Buffer.from(putBody.content, 'base64').toString('utf8'));
      assert('T5-second-content-fresh', decoded.features[0].stories[0].dorStatus === 'in-progress', 'expected second PUT content to build on the fresh GET, not stale first-call data');
    } finally {
      mock.restore();
    }
  })();

  // ── T6: genuine 409 conflict — retries with a fresh GET, retry succeeds ──
  await (async function T6() {
    const staleState = makeFixtureState();
    const freshState = makeFixtureState();
    freshState.features[0].stories[0].updatedAt = 'T-concurrent';
    let getCount = 0;
    let putCount = 0;
    const putBodies = [];
    const mock = installFetchMock([
      userHandler(),
      (url, opts) => {
        if (/\/contents\//.test(url) && (!opts || opts.method === undefined)) {
          getCount++;
          if (getCount === 1) return jsonResponse(200, { content: b64(staleState), sha: 'sha-stale' });
          return jsonResponse(200, { content: b64(freshState), sha: 'sha-fresh' });
        }
        return null;
      },
      (url, opts) => {
        if (/\/contents\//.test(url) && opts && opts.method === 'PUT') {
          putCount++;
          putBodies.push(JSON.parse(opts.body));
          if (putCount === 1) return jsonResponse(409, {});
          return jsonResponse(200, {});
        }
        return null;
      },
    ]);
    try {
      const writer = pipelineStateGithubWriterFactory();
      await writer('test-feat', 's1', { dorStatus: 'signed-off' }, { token: 'tok', owner: 'acme', repo: 'proj' });
      assert('T6-two-gets', getCount === 2, `expected 2 GETs (initial + retry), got ${getCount}`);
      assert('T6-two-puts', putCount === 2, `expected 2 PUTs (failed + retried), got ${putCount}`);
      assert('T6-retry-sha', putBodies[1].sha === 'sha-fresh', `expected retried PUT to use the fresh GET's sha, got "${putBodies[1].sha}"`);
      const decoded = JSON.parse(Buffer.from(putBodies[1].content, 'base64').toString('utf8'));
      assert('T6-retry-content-fresh', decoded.features[0].stories[0].dorStatus === 'signed-off', 'expected retried PUT content to include this call\'s own field change');
    } finally {
      mock.restore();
    }
  })();

  // ── T7: all 3 PUT attempts return 409 — PostHog capture fires, throws ──
  await (async function T7() {
    const state = makeFixtureState();
    let putCount = 0;
    const mock = installFetchMock([
      userHandler(),
      (url, opts) => {
        if (/\/contents\//.test(url) && (!opts || opts.method === undefined)) {
          return jsonResponse(200, { content: b64(state), sha: 'sha-' + Math.random() });
        }
        return null;
      },
      (url, opts) => {
        if (/\/contents\//.test(url) && opts && opts.method === 'PUT') {
          putCount++;
          return jsonResponse(409, {});
        }
        return null;
      },
    ]);
    const posthogServer = require('../src/web-ui/modules/posthog-server');
    const originalCapture = posthogServer.captureException;
    let captured = null;
    posthogServer.captureException = function(err, distinctId, extra) { captured = { err, distinctId, extra }; };
    process.env.POSTHOG_KEY = process.env.POSTHOG_KEY || 'test-key-for-wsd-s2';
    try {
      const writer = pipelineStateGithubWriterFactory();
      let threw = false;
      try {
        await writer('test-feat', 's1', { dorStatus: 'signed-off' }, { token: 'tok', owner: 'acme', repo: 'proj' });
      } catch (_) {
        threw = true;
      }
      assert('T7-throws', threw, 'expected the writer to throw after exhausting all retries');
      assert('T7-three-attempts', putCount === 3, `expected exactly 3 PUT attempts, got ${putCount}`);
      assert('T7-posthog-captured', !!captured, 'expected a PostHog captureException call on exhausted retry');
      if (captured) {
        assert('T7-posthog-feature', captured.extra.featureSlug === 'test-feat', 'expected featureSlug in captured extra props');
        assert('T7-posthog-story', captured.extra.storyId === 's1', 'expected storyId in captured extra props');
      }
    } finally {
      posthogServer.captureException = originalCapture;
      mock.restore();
    }
  })();

  // ── T8: GET fails with a network error (not 409) — same failure-visibility path ──
  await (async function T8() {
    const mock = installFetchMock([
      userHandler(),
      (url, opts) => {
        if (/\/contents\//.test(url) && (!opts || opts.method === undefined)) {
          return jsonResponse(500, {});
        }
        return null;
      },
    ]);
    const posthogServer = require('../src/web-ui/modules/posthog-server');
    const originalCapture = posthogServer.captureException;
    let captured = null;
    posthogServer.captureException = function(err, distinctId, extra) { captured = { err, distinctId, extra }; };
    try {
      const writer = pipelineStateGithubWriterFactory();
      let threw = false;
      try {
        await writer('test-feat', 's1', { dorStatus: 'signed-off' }, { token: 'tok', owner: 'acme', repo: 'proj' });
      } catch (_) {
        threw = true;
      }
      assert('T8-throws', threw, 'expected the writer to throw on a non-409 GET failure');
      assert('T8-posthog-captured', !!captured, 'expected PostHog capture to fire for non-409 failures too, not only conflict exhaustion');
    } finally {
      posthogServer.captureException = originalCapture;
      mock.restore();
    }
  })();

  // ── T9: invalid enum value rejected by applyAdvance — no PUT attempted, failure-visibility fires ──
  await (async function T9() {
    const state = makeFixtureState();
    let putCalled = false;
    const mock = installFetchMock([
      userHandler(),
      (url, opts) => {
        if (/\/contents\//.test(url) && (!opts || opts.method === undefined)) {
          return jsonResponse(200, { content: b64(state), sha: 'sha-abc' });
        }
        return null;
      },
      (url, opts) => {
        if (/\/contents\//.test(url) && opts && opts.method === 'PUT') {
          putCalled = true;
          return jsonResponse(200, {});
        }
        return null;
      },
    ]);
    const posthogServer = require('../src/web-ui/modules/posthog-server');
    const originalCapture = posthogServer.captureException;
    let captured = null;
    posthogServer.captureException = function(err, distinctId, extra) { captured = { err, distinctId, extra }; };
    try {
      const writer = pipelineStateGithubWriterFactory();
      let threw = false;
      try {
        await writer('test-feat', 's1', { dorStatus: 'not-a-real-status' }, { token: 'tok', owner: 'acme', repo: 'proj' });
      } catch (_) {
        threw = true;
      }
      assert('T9-throws', threw, 'expected the writer to throw on invalid enum value');
      assert('T9-no-put', !putCalled, 'expected fetch mock for PUT to never be called for a rejected update');
      assert('T9-posthog-captured', !!captured, 'expected failure-visibility PostHog capture to fire for a validation rejection too');
    } finally {
      posthogServer.captureException = originalCapture;
      mock.restore();
    }
  })();

  console.log(`[wsd-s2] ${totalPassed} passed, ${totalFailed} failed\n`);
  if (issues.length > 0) {
    console.log(issues.join('\n'));
    console.log('');
  }
  process.exit(totalFailed === 0 ? 0 : 1);
}

run();
