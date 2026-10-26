'use strict';
var assert = require('assert');
var zlib = require('zlib');
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

// Builds a minimal, valid ZIP archive in memory (local file headers + central
// directory + EOCD) so realDownloadCaptureArtifact's hand-written _unzipEntries
// parser can be exercised without needing a real GitHub Actions artifact
// archive or live credentials. Supports STORED (0) and DEFLATE (8) entries --
// the only two methods _unzipEntries implements. CRC-32 fields are left as 0
// since the parser does not validate them (confirmed by reading the source).
function buildTestZip(entries) {
  var localParts = [];
  var centralParts = [];
  var offset = 0;

  entries.forEach(function(entry) {
    var compressed = entry.method === 8 ? zlib.deflateRawSync(entry.data) : entry.data;
    var nameBuf = Buffer.from(entry.name, 'utf8');

    var localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(entry.method, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(0, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(entry.data.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);
    var localEntry = Buffer.concat([localHeader, nameBuf, compressed]);
    localParts.push(localEntry);

    var centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(entry.method, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(0, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(entry.data.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(Buffer.concat([centralHeader, nameBuf]));

    offset += localEntry.length;
  });

  var localSection = Buffer.concat(localParts);
  var centralSection = Buffer.concat(centralParts);
  var cdOffset = localSection.length;

  var eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralSection.length, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([localSection, centralSection, eocd]);
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

// --- downloadCaptureArtifact: real _unzipEntries parser against a synthetic
// in-memory zip (STORED + DEFLATE entries), exercised without needing a real
// GitHub Actions artifact archive or live credentials. ---
queue.push(function() {
  return test('realDownloadCaptureArtifact: unzips a synthetic archive (STORED AC1.png + DEFLATE video.webm) into result.screenshots[acId] + the shared videoBuffer', function() {
    return withEnv(ALL_PLATFORM_ENV, function() {
      var mod = require(ADAPTER_PATH);
      var screenshotData = Buffer.from('FAKE-PNG-BYTES-' + 'X'.repeat(50));
      var videoData = Buffer.from('FAKE-WEBM-BYTES-' + 'Y'.repeat(500));

      // Realistic Task 4 naming convention (ppc-capture-worker.js): per-AC
      // screenshots are named '<acId>.png' (e.g. 'AC1.png'), so the key this
      // test asserts against is a realistic acId, not an arbitrary fixture
      // name -- see this story's Task 9 fix.
      var zipBuffer = buildTestZip([
        { name: 'AC1.png', data: screenshotData, method: 0 },
        { name: 'video.webm', data: videoData, method: 8 }
      ]);

      return withMockFetch(
        async function() {
          return { ok: true, status: 200, arrayBuffer: async function() { return zipBuffer; } };
        },
        async function() {
          var result = await mod.realDownloadCaptureArtifact('https://example.test/archive.zip');
          assert.ok(result.screenshots, 'result.screenshots must be present');
          assert.ok(Buffer.isBuffer(result.screenshots.AC1), 'result.screenshots.AC1 must be present and a Buffer');
          assert.ok(result.screenshots.AC1.equals(screenshotData), 'STORED AC1.png entry must round-trip byte-for-byte, keyed by its own acId');
          assert.ok(Buffer.isBuffer(result.videoBuffer), 'videoBuffer must be present and a Buffer');
          assert.ok(result.videoBuffer.equals(videoData), 'DEFLATE video.webm entry must inflate back to the original bytes');
        }
      );
    });
  });
});

// --- downloadCaptureArtifact: the exact regression this fix exists for --
// 2+ distinctly-named .png entries (a real capture-all group) must each map
// to their OWN distinct buffer, never one shared/overwritten buffer. ---
queue.push(function() {
  return test('realDownloadCaptureArtifact: a capture-all archive with 2+ distinctly-named .png entries maps EACH to its own distinct buffer in result.screenshots, not one shared overwritten buffer', function() {
    return withEnv(ALL_PLATFORM_ENV, function() {
      var mod = require(ADAPTER_PATH);
      var ac1Data = Buffer.from('FAKE-PNG-AC1-' + 'A'.repeat(40));
      var ac2Data = Buffer.from('FAKE-PNG-AC2-' + 'B'.repeat(60));
      var videoData = Buffer.from('FAKE-WEBM-GROUP-' + 'Z'.repeat(300));

      var zipBuffer = buildTestZip([
        { name: 'AC1.png', data: ac1Data, method: 0 },
        { name: 'AC2.png', data: ac2Data, method: 8 },
        { name: 'video.webm', data: videoData, method: 8 }
      ]);

      return withMockFetch(
        async function() {
          return { ok: true, status: 200, arrayBuffer: async function() { return zipBuffer; } };
        },
        async function() {
          var result = await mod.realDownloadCaptureArtifact('https://example.test/archive.zip');
          assert.ok(result.screenshots, 'result.screenshots must be present');
          assert.ok(Buffer.isBuffer(result.screenshots.AC1), 'result.screenshots.AC1 must be present and a Buffer');
          assert.ok(Buffer.isBuffer(result.screenshots.AC2), 'result.screenshots.AC2 must be present and a Buffer');
          assert.ok(result.screenshots.AC1.equals(ac1Data), 'AC1 must map to its OWN distinct buffer');
          assert.ok(result.screenshots.AC2.equals(ac2Data), 'AC2 must map to its OWN distinct buffer');
          assert.ok(!result.screenshots.AC1.equals(result.screenshots.AC2), 'AC1 and AC2 buffers must be genuinely different -- this is the exact regression this test covers (previously the last .png entry silently overwrote every other one)');
          assert.ok(Buffer.isBuffer(result.videoBuffer), 'the single shared videoBuffer must still be present');
          assert.ok(result.videoBuffer.equals(videoData));
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
