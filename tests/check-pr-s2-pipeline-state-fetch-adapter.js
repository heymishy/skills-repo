'use strict';

// tests/check-pr-s2-pipeline-state-fetch-adapter.js
// pr-s2 AC5 -- the Contents API fetch adapter follows this repo's D37
// injectable-adapter convention (see repo-adapter.js): throw-on-unwired
// stub default, real implementation wired separately in server.js.

var assert = require('assert');
var path = require('path');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

var MODULE_PATH = path.resolve(__dirname, '../src/web-ui/adapters/pipeline-state-fetch-adapter.js');

function freshRequire() {
  delete require.cache[require.resolve(MODULE_PATH)];
  return require(MODULE_PATH);
}

async function main() {
  var queue = [];

  // T1: unwired adapter default throws, does not return null/empty (D37 rule 1)
  queue.push(function() {
    console.log('\n[pr-s2] T1 -- unwired adapter throws rather than returning a silent empty value (AC5)');
    return test('getPipelineStateFetchAdapter: default stub throws when called unwired', async function() {
      var mod = freshRequire();
      try {
        await mod.getPipelineStateFetchAdapter()('owner', 'repo', 'fake-token');
        assert.fail('Expected the unwired stub to throw');
      } catch (err) {
        assert.ok(/not wired/i.test(err.message), 'Error message must name the adapter as not wired: ' + err.message);
      }
    });
  });

  // T2: setPipelineStateFetchAdapter replaces the implementation
  queue.push(function() {
    console.log('\n[pr-s2] T2 -- setPipelineStateFetchAdapter replaces the default stub');
    return test('setPipelineStateFetchAdapter: wired implementation is used on next call', async function() {
      var mod = freshRequire();
      var called = false;
      mod.setPipelineStateFetchAdapter(async function(owner, repo, token) {
        called = true;
        return { content: '{}', encoding: 'base64' };
      });
      await mod.getPipelineStateFetchAdapter()('owner', 'repo', 'fake-token');
      assert.ok(called, 'Expected the wired implementation to be invoked');
    });
  });

  // T3: realFetchPipelineState calls GitHub's Contents API with the correct URL and auth header
  queue.push(function() {
    console.log('\n[pr-s2] T3 -- realFetchPipelineState calls the Contents API with the correct URL and Authorization header (AC1)');
    return test('realFetchPipelineState: fetches /repos/{owner}/{repo}/contents/.github/pipeline-state.json with Bearer token', async function() {
      var originalFetch = global.fetch;
      var capturedUrl = null;
      var capturedHeaders = null;
      global.fetch = async function(url, opts) {
        capturedUrl = url;
        capturedHeaders = opts.headers;
        return {
          ok: true,
          status: 200,
          json: async function() { return { content: Buffer.from('{"features":[]}').toString('base64'), encoding: 'base64' }; }
        };
      };
      try {
        var mod = freshRequire();
        await mod.realFetchPipelineState('acme', 'widgets', 'fake-token-123');
        assert.ok(capturedUrl.indexOf('/repos/acme/widgets/contents/.github/pipeline-state.json') !== -1,
          'Expected Contents API URL for the correct owner/repo/path, got: ' + capturedUrl);
        assert.strictEqual(capturedHeaders.Authorization, 'Bearer fake-token-123', 'Expected Authorization: Bearer <token> header');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  // T4: realFetchPipelineState surfaces a distinguishable error on non-200 responses (AC3)
  queue.push(function() {
    console.log('\n[pr-s2] T4 -- realFetchPipelineState surfaces a distinguishable error on 404/403 (AC3)');
    return test('realFetchPipelineState: throws with the HTTP status on a non-ok response', async function() {
      var originalFetch = global.fetch;
      global.fetch = async function() {
        return { ok: false, status: 404, json: async function() { return { message: 'Not Found' }; } };
      };
      try {
        var mod = freshRequire();
        try {
          await mod.realFetchPipelineState('acme', 'missing-repo', 'fake-token');
          assert.fail('Expected realFetchPipelineState to throw on a 404');
        } catch (err) {
          assert.ok(/404/.test(err.message), 'Expected the error to mention the HTTP status: ' + err.message);
        }
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  // T5: server.js creates the product_rollups table and wires the real adapter (AC1, AC5)
  queue.push(function() {
    console.log('\n[pr-s2] T5 -- server.js creates the product_rollups table and wires the real Contents API adapter (AC1, AC5)');
    return test('server.js: requires pipeline-state-fetch-adapter, creates product_rollups table, wires real implementation', function() {
      var fs = require('fs');
      var SERVER_PATH = path.resolve(__dirname, '../src/web-ui/server.js');
      var src = fs.readFileSync(SERVER_PATH, 'utf8');
      assert.ok(/require\(['"]\.\/adapters\/pipeline-state-fetch-adapter['"]\)/.test(src),
        "server.js must require('./adapters/pipeline-state-fetch-adapter')");
      assert.ok(/CREATE TABLE IF NOT EXISTS product_rollups/i.test(src),
        'server.js must create the product_rollups table');
      assert.ok(/setPipelineStateFetchAdapter\(\s*realFetchPipelineState/.test(src),
        "server.js must wire setPipelineStateFetchAdapter(realFetchPipelineState), matching the existing NODE_ENV !== 'test' wiring convention");
    });
  });

  // T6: the wired adapter produces correct, differentiated output for two different repos (AC5 -- D37 rule 4)
  queue.push(function() {
    console.log('\n[pr-s2] T6 -- wired adapter produces correct, differentiated output for two different repos, not just proof a setter was called (AC5)');
    return test('realFetchPipelineState: two different mocked repos return their own distinct, correct content', async function() {
      var originalFetch = global.fetch;
      var repoAContent = Buffer.from('{"features":[{"slug":"repo-a-feature"}]}').toString('base64');
      var repoBContent = Buffer.from('{"features":[{"slug":"repo-b-feature"}]}').toString('base64');
      global.fetch = async function(url) {
        var isRepoA = url.indexOf('/repos/org-a/repo-a/') !== -1;
        return {
          ok: true, status: 200,
          json: async function() { return { content: isRepoA ? repoAContent : repoBContent, encoding: 'base64' }; }
        };
      };
      try {
        var mod = freshRequire();
        var resultA = await mod.realFetchPipelineState('org-a', 'repo-a', 'token');
        var resultB = await mod.realFetchPipelineState('org-b', 'repo-b', 'token');
        var decodedA = Buffer.from(resultA.content, 'base64').toString('utf8');
        var decodedB = Buffer.from(resultB.content, 'base64').toString('utf8');
        assert.ok(decodedA.indexOf('repo-a-feature') !== -1, 'Expected repo A result to contain repo A\'s own fixture content');
        assert.ok(decodedB.indexOf('repo-b-feature') !== -1, 'Expected repo B result to contain repo B\'s own fixture content');
        assert.notStrictEqual(decodedA, decodedB, 'Expected the two repos to produce different, individually-correct results -- not the same output regardless of input');
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[pr-s2-pipeline-state-fetch-adapter] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) { console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('[pr-s2-pipeline-state-fetch-adapter] Unexpected error:', err);
  process.exit(1);
});
