'use strict';
// tests/check-ppc-s9-capture-worker-script.js -- ppc-s9 Task 4. Unit-tests
// .github/scripts/ppc-capture-worker.js's own internal orchestration logic
// via an injectable chromium module (same pattern session-page-adapter.js's
// own realGetAuthenticatedPage used before its Task 7 retirement, and
// capture-video.js's own captureVideoRecording already use) plus an
// injectable fetch implementation for the nonce-exchange call. NEVER
// invokes a real Playwright browser or a real HTTP call (ADR-018: unit
// test chain must not invoke Playwright).

var assert = require('assert');
var fs = require('fs');
var path = require('path');

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

var SCRIPT_PATH = path.join(__dirname, '..', '.github', 'scripts', 'ppc-capture-worker.js');
var SCRIPT_MODULE_PATH = '../.github/scripts/ppc-capture-worker';

/**
 * Builds a fake chromium module + a shared `tracking` object recording every
 * call the script's own orchestration makes against it, without ever
 * launching a real browser. Mirrors the two distinct newContext shapes the
 * real script produces: a plain context for screenshots (no recordVideo
 * option) and a `recordVideo`-configured context for the combined video
 * clip (src/utils/capture-video.js's own captureVideoRecording creates this
 * one itself, unchanged).
 */
function makeFakeChromium() {
  var tracking = {
    launchCalled: false,
    newContextCalls: [],
    screenshotContextCallCount: 0,
    videoContextCallCount: 0,
    screenshotCookies: null,
    videoCookies: null,
    screenshotGotoUrls: [],
    videoGotoUrls: [],
    browserClosed: false
  };

  function makeScreenshotContext() {
    tracking.screenshotContextCallCount++;
    return {
      addCookies: async function(cookies) { tracking.screenshotCookies = cookies; },
      newPage: async function() {
        return {
          goto: async function(url) { tracking.screenshotGotoUrls.push(url); },
          screenshot: async function() { /* no real file write needed for this unit test */ }
        };
      },
      close: async function() {}
    };
  }

  function makeVideoContext() {
    tracking.videoContextCallCount++;
    return {
      newPage: async function() {
        return {
          goto: async function(url) { tracking.videoGotoUrls.push(url); },
          context: function() {
            return { addCookies: async function(cookies) { tracking.videoCookies = cookies; } };
          },
          video: function() {
            return { path: async function() { return 'artefacts/fake-feature/playback/ppc-s1/video/combined.webm'; } };
          }
        };
      },
      close: async function() {}
    };
  }

  var fakeBrowser = {
    newContext: async function(opts) {
      tracking.newContextCalls.push(opts || null);
      if (opts && opts.recordVideo) return makeVideoContext();
      return makeScreenshotContext();
    },
    close: async function() { tracking.browserClosed = true; }
  };

  var chromiumModule = {
    launch: async function() {
      tracking.launchCalled = true;
      return fakeBrowser;
    }
  };

  return { chromiumModule: chromiumModule, tracking: tracking };
}

function makeFakeFetch(impl) {
  return impl;
}

// --- captureWorkerScript_neverReferencesAccessToken ---
queue.push(function() {
  return test('captureWorkerScript_neverReferencesAccessToken', function() {
    var source = fs.readFileSync(SCRIPT_PATH, 'utf8');
    assert.ok(!/accessToken/i.test(source), 'the capture-worker script must never reference accessToken -- it authenticates purely via the exchanged sessionId cookie (ADR-018)');
  });
});

// --- captureWorkerScript_exchangesNonceBeforeLaunchingBrowser ---
queue.push(function() {
  return test('captureWorkerScript_exchangesNonceBeforeLaunchingBrowser', async function() {
    delete require.cache[require.resolve(SCRIPT_MODULE_PATH)];
    var worker = require(SCRIPT_MODULE_PATH);
    var fake = makeFakeChromium();
    var callOrder = [];
    var capturedExchangeUrl, capturedExchangeOptions;

    var fetchImpl = makeFakeFetch(async function(url, options) {
      callOrder.push('exchange');
      capturedExchangeUrl = url;
      capturedExchangeOptions = options;
      return {
        ok: true,
        status: 200,
        json: async function() { return { sessionId: 'exchanged-session-abc' }; }
      };
    });

    var originalLaunch = fake.chromiumModule.launch;
    fake.chromiumModule.launch = async function() {
      callOrder.push('launch');
      return originalLaunch();
    };

    await worker.runCaptureWorker({
      nonce: 'nonce-xyz',
      baseUrl: 'https://capture.example.test',
      featureSlug: 'fake-feature',
      acIds: ['AC1'],
      targets: [{ acId: 'AC1', url: 'https://capture.example.test/page1', selector: '#el1' }],
      correlationId: 'corr-1'
    }, fake.chromiumModule, fetchImpl);

    assert.ok(capturedExchangeUrl.indexOf('/internal/capture/exchange') !== -1, 'must POST to the nonce-exchange endpoint');
    assert.strictEqual(capturedExchangeOptions.headers['x-capture-exchange-secret'], process.env.CAPTURE_EXCHANGE_SECRET, 'must send the configured exchange secret header');
    assert.ok(capturedExchangeOptions.body.indexOf('nonce-xyz') !== -1, 'must send the real nonce in the exchange body');

    assert.deepStrictEqual(callOrder, ['exchange', 'launch'], 'the exchange call must happen BEFORE any browser launch is attempted');

    assert.ok(fake.tracking.screenshotCookies, 'the screenshot context must have had a session_id cookie seeded');
    assert.strictEqual(fake.tracking.screenshotCookies[0].value, 'exchanged-session-abc', 'the seeded cookie value must be the sessionId RETURNED by the exchange, not some other value');
    assert.strictEqual(fake.tracking.screenshotCookies[0].name, 'session_id');
  });
});

queue.push(function() {
  return test('captureWorkerScript_exchangesNonceBeforeLaunchingBrowser: never launches a browser when the exchange fails', async function() {
    delete require.cache[require.resolve(SCRIPT_MODULE_PATH)];
    var worker = require(SCRIPT_MODULE_PATH);
    var fake = makeFakeChromium();

    var fetchImpl = makeFakeFetch(async function() {
      return { ok: false, status: 404, text: async function() { return 'Exchange failed: not found, expired, or already used'; } };
    });

    var threw = false;
    try {
      await worker.runCaptureWorker({
        nonce: 'bad-nonce',
        baseUrl: 'https://capture.example.test',
        featureSlug: 'fake-feature',
        acIds: ['AC1'],
        targets: [{ acId: 'AC1', url: 'https://capture.example.test/page1', selector: '#el1' }],
        correlationId: 'corr-1'
      }, fake.chromiumModule, fetchImpl);
    } catch (err) {
      threw = true;
    }

    assert.ok(threw, 'a failed exchange must throw, never silently proceed');
    assert.strictEqual(fake.tracking.launchCalled, false, 'no browser launch must ever be attempted after a failed exchange');
  });
});

// --- captureWorkerScript_multipleAcIds_navigatesEachInSequenceInOneContext ---
// Mirrors check-ppc-s5-video-capture.js's own
// handlePostCaptureAll_combinedVideo_coversEveryScreenshottedAc assertion
// shape: one combined recording context for the WHOLE group of ACs (not one
// per AC), with one navigation per AC inside that same combined recording.
queue.push(function() {
  return test('captureWorkerScript_multipleAcIds_navigatesEachInSequenceInOneContext', async function() {
    delete require.cache[require.resolve(SCRIPT_MODULE_PATH)];
    var worker = require(SCRIPT_MODULE_PATH);
    var fake = makeFakeChromium();

    var fetchImpl = makeFakeFetch(async function() {
      return { ok: true, status: 200, json: async function() { return { sessionId: 'exchanged-session-multi' }; } };
    });

    var targets = [
      { acId: 'AC1', url: 'https://capture.example.test/page1', selector: '#el1' },
      { acId: 'AC2', url: 'https://capture.example.test/page2', selector: '#el2' },
      { acId: 'AC3', url: 'https://capture.example.test/page3', selector: '#el3' }
    ];

    await worker.runCaptureWorker({
      nonce: 'nonce-multi',
      baseUrl: 'https://capture.example.test',
      featureSlug: 'fake-feature',
      acIds: ['AC1', 'AC2', 'AC3'],
      targets: targets,
      correlationId: 'corr-multi'
    }, fake.chromiumModule, fetchImpl);

    assert.strictEqual(fake.tracking.videoContextCallCount, 1, 'exactly ONE combined recording context for the whole group of 3 ACs, not one per AC');
    assert.strictEqual(fake.tracking.videoGotoUrls.length, 3, 'three ACs in this fixture -- one navigation per AC, inside that SAME combined recording context, in sequence');
    assert.deepStrictEqual(fake.tracking.videoGotoUrls, [targets[0].url, targets[1].url, targets[2].url], 'navigations must happen in the same order the targets were supplied, inside one context');

    assert.strictEqual(fake.tracking.screenshotContextCallCount, 1, 'all screenshot navigations must happen inside a single shared context, not one per AC');
    assert.strictEqual(fake.tracking.screenshotGotoUrls.length, 3, 'one screenshot navigation per AC target');
  });
});

(async function() {
  console.log('\ncheck-ppc-s9-capture-worker-script.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
