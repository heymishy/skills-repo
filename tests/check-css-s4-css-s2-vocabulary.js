#!/usr/bin/env node
/**
 * check-css-s4-css-s2-vocabulary.js
 *
 * css-s4 AC1, css-s2's own direction: confirms pipeline-state-github-writer.js
 * is ALREADY generic across all 7 gate-map.js stage values -- no
 * implementation change was needed there (see decisions.md's DoR-contract
 * correction). This test is the evidence for that claim, exercising the
 * real applyStateUpdate with each of the 7 values in turn.
 *
 * Run: node tests/check-css-s4-css-s2-vocabulary.js
 */
'use strict';

const GATE_MAP = require('../src/enforcement/gate-map');
const syncLog = require('../src/web-ui/adapters/sync-log');
const pipelineStateGithubWriterFactory = require('../src/web-ui/adapters/pipeline-state-github-writer');

let totalPassed = 0;
let totalFailed = 0;
const issues = [];

function assert(label, condition, message) {
  if (condition) { totalPassed++; } else { totalFailed++; issues.push(`  ✗ [${label}] ${message}`); }
}

function b64(obj) { return Buffer.from(JSON.stringify(obj, null, 2) + '\n', 'utf8').toString('base64'); }

function installFetchMock(handlers) {
  const calls = [];
  const original = global.fetch;
  global.fetch = async function(url, opts) {
    calls.push({ url, opts });
    for (const h of handlers) { const result = h(url, opts, calls.length - 1); if (result) return result; }
    throw new Error('Unhandled fetch call: ' + url);
  };
  return { calls, restore: function() { global.fetch = original; } };
}
function jsonResponse(status, body, extra) {
  return Object.assign({ ok: status >= 200 && status < 300, status: status, json: async () => body }, extra || {});
}
function userHandler() {
  return (url) => /\/user$/.test(url) ? jsonResponse(200, { login: 'octocat', name: 'The Octocat', email: 'octocat@example.com' }) : null;
}

async function run() {
  console.log('\n[css-s4] css-s2-direction full-vocabulary test\n');

  const gateNames = Object.keys(GATE_MAP);
  assert('T0-seven-gates', gateNames.length === 7, `expected gate-map.js to export exactly 7 gates, got ${gateNames.length}`);

  for (const gateName of gateNames) {
    await (async function() {
      const pool = { calls: [], query: async function(sql, params) { this.calls.push({ sql, params }); return { rows: [] }; } };
      syncLog._setPoolForTesting(pool);

      const state = {
        schemaVersion: '1',
        features: [{ slug: 'test-feat-vocab', id: 'test-feat-vocab', updatedAt: 'T0', stories: [
          { id: 's1', slug: 's1', stage: 'some-prior-value', lastSyncedStage: 'some-prior-value', updatedAt: 'T0' },
        ] }],
      };
      let putBody = null;
      const mock = installFetchMock([
        userHandler(),
        (url, opts) => /\/contents\//.test(url) && (!opts || opts.method === undefined) ? jsonResponse(200, { sha: 'sha-' + gateName }) : null,
        (url) => /\/git\/blobs\//.test(url) ? jsonResponse(200, { content: b64(state), encoding: 'base64' }) : null,
        (url, opts) => { if (/\/contents\//.test(url) && opts && opts.method === 'PUT') { putBody = JSON.parse(opts.body); return jsonResponse(200, {}); } return null; },
      ]);
      try {
        const writer = pipelineStateGithubWriterFactory();
        await writer('test-feat-vocab', 's1', { stage: gateName }, { token: 'tok', owner: 'acme', repo: 'proj' });
        const decoded = JSON.parse(Buffer.from(putBody.content, 'base64').toString('utf8'));
        assert('T-' + gateName, decoded.features[0].stories[0].stage === gateName, `expected gate value "${gateName}" to flow through uniformly (no special-casing), got "${decoded.features[0].stories[0].stage}"`);
      } finally {
        mock.restore();
      }
    })();
  }

  console.log(`[css-s4] ${totalPassed} passed, ${totalFailed} failed\n`);
  if (issues.length > 0) { console.log(issues.join('\n')); console.log(''); }
  process.exit(totalFailed === 0 ? 0 : 1);
}

run();
