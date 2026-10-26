'use strict';
var assert = require('assert');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve();
  }
}
var queue = [];

var ADAPTER_PATH = '../src/web-ui/adapters/capture-dispatch-adapter';

var ALL_PLATFORM_ENV = {
  PLATFORM_GITHUB_TOKEN:        'platform-token-xyz',
  PLATFORM_REPO_OWNER:          'acme',
  PLATFORM_REPO_NAME:           'skills-platform',
  PLATFORM_CAPTURE_WORKFLOW_ID: 'ppc-capture-worker.yml'
};

function withEnv(vars, fn) {
  var saved = {};
  Object.keys(vars).forEach(function(k) {
    saved[k] = process.env[k];
    if (vars[k] === undefined) delete process.env[k];
    else process.env[k] = vars[k];
  });
  return Promise.resolve().then(fn).finally(function() {
    Object.keys(saved).forEach(function(k) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    });
  });
}

function withMockFetch(impl, fn) {
  var originalFetch = global.fetch;
  global.fetch = impl;
  return Promise.resolve().then(fn).finally(function() {
    global.fetch = originalFetch;
  });
}

// --- D37 stub-throws, all three functions, before any wiring ---
queue.push(function() {
  return test('D37 (CLAUDE.md): dispatchCaptureWorkflow/checkCaptureArtifact/downloadCaptureArtifact all throw until wired', async function() {
    delete require.cache[require.resolve(ADAPTER_PATH)];
    var mod = require(ADAPTER_PATH);

    var threwDispatch = false;
    try { await mod.dispatchCaptureWorkflow({}); } catch (err) {
      threwDispatch = true;
      assert.ok(/not wired/i.test(err.message), 'error must name the adapter and instruct how to wire it');
    }
    assert.ok(threwDispatch, 'dispatchCaptureWorkflow must throw, never silently no-op');

    var threwCheck = false;
    try { await mod.checkCaptureArtifact('corr-1'); } catch (err) {
      threwCheck = true;
      assert.ok(/not wired/i.test(err.message), 'error must name the adapter and instruct how to wire it');
    }
    assert.ok(threwCheck, 'checkCaptureArtifact must throw, never silently no-op');

    var threwDownload = false;
    try { await mod.downloadCaptureArtifact('https://example.test/archive.zip'); } catch (err) {
      threwDownload = true;
      assert.ok(/not wired/i.test(err.message), 'error must name the adapter and instruct how to wire it');
    }
    assert.ok(threwDownload, 'downloadCaptureArtifact must throw, never silently no-op');
  });
});

// --- dispatchCaptureWorkflow: nonce present, no accidental session-value leak ---
queue.push(function() {
  return test('realDispatchCaptureWorkflow: call body contains the nonce and never contains a raw session-like fixture value', function() {
    return withEnv(ALL_PLATFORM_ENV, function() {
      var mod = require(ADAPTER_PATH);
      var SESSION_FIXTURE = 'should-never-leak-raw-session-value-789';
      var capturedUrl, capturedOptions;

      return withMockFetch(
        async function(url, options) {
          capturedUrl = url;
          capturedOptions = options;
          return { ok: true, status: 204, json: async function() { return {}; } };
        },
        async function() {
          await mod.realDispatchCaptureWorkflow({
            nonce:         'nonce-value-abc123',
            baseUrl:       'https://example.test',
            featureSlug:   'ppc-s9',
            acIds:         ['AC1', 'AC2'],
            targets:       [{ acId: 'AC1', url: 'https://example.test/x', selector: '#y' }],
            correlationId: 'corr-1',
            // Simulates an accidental extra field a future caller might pass
            // through -- the implementation must explicitly allow-list the
            // fields it forwards into `inputs`, never spread the whole args
            // object, so a stray session-shaped field can never leak even by
            // accident.
            sessionId: SESSION_FIXTURE
          });

          assert.ok(capturedUrl, 'fetch must have been called');
          assert.ok(/\/actions\/workflows\/.*\/dispatches$/.test(capturedUrl), 'must POST to the workflow dispatches endpoint');
          var bodyStr = capturedOptions.body;
          assert.ok(bodyStr.indexOf('nonce-value-abc123') !== -1, 'the nonce must be present in the dispatch body');
          assert.ok(bodyStr.indexOf(SESSION_FIXTURE) === -1, 'the raw session-like value must never appear in the dispatch body');
          assert.ok(capturedOptions.headers.Authorization.indexOf('platform-token-xyz') !== -1, 'must authenticate with the PLATFORM token, not a tenant token');
        }
      );
    });
  });
});

// --- dispatchCaptureWorkflow: fail-closed on each of the 4 required env vars ---
['PLATFORM_GITHUB_TOKEN', 'PLATFORM_REPO_OWNER', 'PLATFORM_REPO_NAME', 'PLATFORM_CAPTURE_WORKFLOW_ID'].forEach(function(missingVar) {
  queue.push(function() {
    return test('realDispatchCaptureWorkflow: fails closed when ' + missingVar + ' is not configured', function() {
      var envOverride = Object.assign({}, ALL_PLATFORM_ENV);
      envOverride[missingVar] = undefined;
      return withEnv(envOverride, async function() {
        var mod = require(ADAPTER_PATH);
        var threw = false;
        await withMockFetch(
          async function() { throw new Error('fetch must never be called when platform config is incomplete'); },
          async function() {
            try {
              await mod.realDispatchCaptureWorkflow({
                nonce: 'n', baseUrl: 'b', featureSlug: 'f', acIds: [], targets: [], correlationId: 'c'
              });
            } catch (err) {
              threw = true;
            }
          }
        );
        assert.ok(threw, 'must throw (fail closed), never silently proceed, when ' + missingVar + ' is missing');
      });
    });
  });
});

// --- checkCaptureArtifact: exact-name match only ---
queue.push(function() {
  return test('realCheckCaptureArtifact: exact name match only -- a near-miss (prefix/suffix variant) name must not be returned', function() {
    return withEnv(ALL_PLATFORM_ENV, function() {
      var mod = require(ADAPTER_PATH);
      var CORRELATION_ID = 'corr-xyz-123';

      return withMockFetch(
        async function() {
          return {
            ok: true,
            status: 200,
            headers: { get: function() { return ''; } },
            json: async function() {
              return {
                artifacts: [
                  // Near-miss: same correlation id but with an extra suffix --
                  // must NOT match a plain string-contains/startsWith check.
                  { name: 'capture-result-' + CORRELATION_ID + '-retry', archive_download_url: 'https://wrong.example/near-miss.zip' },
                  { name: 'capture-result-' + CORRELATION_ID, archive_download_url: 'https://correct.example/exact.zip' }
                ]
              };
            }
          };
        },
        async function() {
          var result = await mod.realCheckCaptureArtifact(CORRELATION_ID);
          assert.strictEqual(result.found, true, 'the exact-match artifact must be found');
          assert.strictEqual(result.archiveDownloadUrl, 'https://correct.example/exact.zip', 'must return the exact match, never the near-miss');
        }
      );
    });
  });
});

queue.push(function() {
  return test('realCheckCaptureArtifact: returns found:false when nothing matches exactly', function() {
    return withEnv(ALL_PLATFORM_ENV, function() {
      var mod = require(ADAPTER_PATH);
      return withMockFetch(
        async function() {
          return {
            ok: true,
            status: 200,
            headers: { get: function() { return ''; } },
            json: async function() {
              return { artifacts: [{ name: 'capture-result-someone-elses-id', archive_download_url: 'https://wrong.example/x.zip' }] };
            }
          };
        },
        async function() {
          var result = await mod.realCheckCaptureArtifact('no-such-correlation-id');
          assert.strictEqual(result.found, false);
          assert.strictEqual(result.archiveDownloadUrl, undefined);
        }
      );
    });
  });
});

queue.push(function() {
  return test('realCheckCaptureArtifact: follows link-header pagination to find a match on a later page', function() {
    return withEnv(ALL_PLATFORM_ENV, function() {
      var mod = require(ADAPTER_PATH);
      var CORRELATION_ID = 'corr-page-2-only';
      var calls = 0;

      return withMockFetch(
        async function(url) {
          calls++;
          var isPageOne = !/[?&]page=2\b/.test(url);
          if (isPageOne) {
            return {
              ok: true,
              status: 200,
              headers: { get: function(h) { return h.toLowerCase() === 'link' ? '<https://api.github.com/x?per_page=100&page=2>; rel="next"' : null; } },
              json: async function() { return { artifacts: [{ name: 'capture-result-unrelated', archive_download_url: 'https://wrong.example/1.zip' }] }; }
            };
          }
          return {
            ok: true,
            status: 200,
            headers: { get: function() { return ''; } },
            json: async function() { return { artifacts: [{ name: 'capture-result-' + CORRELATION_ID, archive_download_url: 'https://correct.example/2.zip' }] }; }
          };
        },
        async function() {
          var result = await mod.realCheckCaptureArtifact(CORRELATION_ID);
          assert.strictEqual(calls, 2, 'must have followed pagination to the second page');
          assert.strictEqual(result.found, true);
          assert.strictEqual(result.archiveDownloadUrl, 'https://correct.example/2.zip');
        }
      );
    });
  });
});

(async function() {
  console.log('\ncheck-ppc-s9-capture-dispatch-adapter.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
