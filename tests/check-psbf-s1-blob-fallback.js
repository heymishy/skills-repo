'use strict';

// tests/check-psbf-s1-blob-fallback.js
// psbf-s1 -- when GitHub's Contents API returns a truncated `content` field
// (GitHub's own ~1MB threshold; this repo's own pipeline-state.json is
// 1.34MB), syncProductRollup detects it, logs + captures diagnostics to
// PostHog, and falls back to the Git Blobs API (no such size ceiling).

var assert = require('assert');
var path = require('path');

var passed = 0; var failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}

var ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js');
var PRODUCT_ROLLUP_PATH = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');
function freshAdapter() { delete require.cache[require.resolve(ADAPTER_PATH)]; return require(ADAPTER_PATH); }
function freshRollup() { delete require.cache[require.resolve(PRODUCT_ROLLUP_PATH)]; return require(PRODUCT_ROLLUP_PATH); }

console.log('\n[psbf-s1] D37 adapter -- realFetchBlobBySha exists, throws when unwired, wired implementation works');

(async function() {
  await (async function() {
    try {
      var mod = freshAdapter();
      if (typeof mod.realFetchBlobBySha !== 'function') throw new Error('Expected realFetchBlobBySha to be exported');
      if (typeof mod.setPipelineStateBlobFetchAdapter !== 'function') throw new Error('Expected setPipelineStateBlobFetchAdapter to be exported');
      if (typeof mod.getPipelineStateBlobFetchAdapter !== 'function') throw new Error('Expected getPipelineStateBlobFetchAdapter to be exported');
      passed++; console.log('  [PASS] pipeline-state-fetch-adapter.js exports realFetchBlobBySha and its D37 set/get pair');

      try {
        await mod.getPipelineStateBlobFetchAdapter()('acme', 'widgets', 'sha123', 'fake-token');
        assert.fail('Expected the unwired stub to throw');
      } catch (err) {
        if (!/not wired/i.test(err.message)) throw new Error('Expected "not wired" in message: ' + err.message);
      }
      passed++; console.log('  [PASS] getPipelineStateBlobFetchAdapter: default stub throws when called unwired (D37 rule 1)');
    } catch (err) { failed++; console.log('  [FAIL] D37 adapter shape --', err.message); }
  })();

  await (async function() {
    try {
      var originalFetch = global.fetch;
      var capturedUrl = null;
      global.fetch = async function(url) {
        capturedUrl = url;
        return {
          ok: true, status: 200,
          headers: { get: function() { return null; } },
          text: async function() { return JSON.stringify({ content: Buffer.from('{"features":[]}').toString('base64'), encoding: 'base64', size: 15, sha: 'sha123' }); }
        };
      };
      try {
        var mod = freshAdapter();
        var result = await mod.realFetchBlobBySha('acme', 'widgets', 'sha123', 'fake-token');
        if (capturedUrl.indexOf('/repos/acme/widgets/git/blobs/sha123') === -1) throw new Error('Expected Blobs API URL, got: ' + capturedUrl);
        if (!result || !result.content) throw new Error('Expected a parsed response with a content field');
        passed++; console.log('  [PASS] realFetchBlobBySha: fetches /repos/{owner}/{repo}/git/blobs/{sha}, returns parsed content');
      } finally {
        global.fetch = originalFetch;
      }
    } catch (err) { failed++; console.log('  [FAIL] realFetchBlobBySha happy path --', err.message); }
  })();

  console.log('\n[psbf-s1] AC1/AC2 -- truncation detected, logged + captured to PostHog, Blobs API fallback used');

  await (async function() {
    try {
      var posthogModPath = path.resolve(__dirname, '../src/web-ui/modules/posthog-server.js');
      delete require.cache[require.resolve(posthogModPath)];
      var posthogMod = require(posthogModPath);
      var captureExceptionCalls = [];
      var originalCaptureException = posthogMod.captureException;
      posthogMod.captureException = function() { captureExceptionCalls.push(Array.prototype.slice.call(arguments)); };

      var adapterMod = freshAdapter();
      var fullPipelineState = { features: [{ slug: 'full-feature-only-in-blob' }] };
      var fullContentB64 = Buffer.from(JSON.stringify(fullPipelineState)).toString('base64');
      var truncatedContentB64 = fullContentB64.slice(0, 20); // deliberately short

      adapterMod.setPipelineStateFetchAdapter(async function() {
        return { content: truncatedContentB64, encoding: 'base64', size: Buffer.from(fullContentB64, 'base64').length + 500, sha: 'blob-sha-1' };
      });
      var blobCalls = [];
      adapterMod.setPipelineStateBlobFetchAdapter(async function(owner, repo, sha, token) {
        blobCalls.push({ owner: owner, repo: repo, sha: sha, token: token });
        return { content: fullContentB64, encoding: 'base64', size: Buffer.from(fullContentB64, 'base64').length, sha: sha };
      });

      var writtenParams = null;
      var mockPool = {
        query: async function(sql, params) {
          if (/INSERT INTO product_rollups/i.test(sql)) { writtenParams = params; return { rows: [] }; }
          return { rows: [] };
        }
      };

      var rollupMod = freshRollup();
      try {
        await rollupMod.syncProductRollup(mockPool, adapterMod, { productId: 'p-trunc', repoOwner: 'acme', repoName: 'widgets', accessToken: 'fake-token' });

        if (captureExceptionCalls.length < 1) throw new Error('Expected captureException to be called at least once for the detected truncation');
        var firstCall = captureExceptionCalls[0];
        var firstProps = firstCall[2] || {};
        if (firstProps.fallbackAttempted !== false) throw new Error('Expected the first captureException call to have fallbackAttempted:false, got: ' + JSON.stringify(firstProps));
        passed++; console.log('  [PASS] syncProductRollup: truncation detected and captured to PostHog before any fallback (AC1)');

        if (blobCalls.length !== 1) throw new Error('Expected exactly 1 Blobs API call, got ' + blobCalls.length);
        if (blobCalls[0].sha !== 'blob-sha-1') throw new Error('Expected the fallback to use the Contents API response\'s own sha, got: ' + blobCalls[0].sha);
        passed++; console.log('  [PASS] syncProductRollup: Blobs API fallback called with the correct sha (AC2)');

        if (!writtenParams || writtenParams.join('|').indexOf('full-feature-only-in-blob') === -1) throw new Error('Expected the written rollup to reflect the FULL (blob-fetched) content, not the truncated original');
        passed++; console.log('  [PASS] syncProductRollup: rollup reflects the full Blobs-API content, not the truncated original (AC2)');
      } finally {
        posthogMod.captureException = originalCaptureException;
      }
    } catch (err) { failed++; console.log('  [FAIL] AC1/AC2 truncation + fallback --', err.message); }
  })();

  console.log('\n[psbf-s1] Results so far: ' + passed + ' passed, ' + failed + ' failed');
  process.exitCode = failed > 0 ? 1 : 0;
})();
