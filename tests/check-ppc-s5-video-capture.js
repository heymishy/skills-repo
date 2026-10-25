'use strict';
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var os = require('os');
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

queue.push(function() {
  return test('captureVideoRecording_extractedToSrc_producesDifferentCorrectPathsForDifferentClips', async function() {
    var capVideo = require('../src/utils/capture-video');
    // Two distinct fake video paths, one per clip, assigned after newPage()
    // via a wrapper so each clip's own mock page resolves its own path.
    var pathsToReturn = ['artefacts/fx/playback/ppc-s1/video/clip1.webm', 'artefacts/fx/playback/ppc-s1/video/clip2.webm'];
    var callIndex = 0;
    var mockBrowser = {};
    mockBrowser.newContext = async function() {
      var myPath = pathsToReturn[callIndex++];
      var mockPage = {
        goto: async function() {},
        context: function() { return { addCookies: async function() {} }; },
        video: function() { return { path: async function() { return myPath; } }; }
      };
      return { newPage: async function() { return mockPage; }, close: async function() {} };
    };
    var results = await capVideo.captureVideoRecording({
      browser: mockBrowser,
      featureSlug: 'fx',
      storySlug: 'ppc-s1',
      clips: [{ name: 'AC1', run: async function(p) { await p.goto('http://x'); } }, { name: 'AC2', run: async function(p) { await p.goto('http://y'); } }]
    });
    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].path, pathsToReturn[0]);
    assert.strictEqual(results[1].path, pathsToReturn[1]);
    assert.notStrictEqual(results[0].path, results[1].path, 'two different clips must produce two different, individually-correct paths');
  });
});

queue.push(function() {
  return test('captureVideoRecording_midCaptureFailure_deletesPartialFileAndRethrowsOriginalErrorEvenWhenContextCloseAlsoThrows', async function() {
    var capVideo = require('../src/utils/capture-video');
    // Mirrors tests/check-rpca-s3-video-capture-wired-for-real.js's own AC3
    // ("a mid-capture failure leaves no partial file on disk") mocking shape,
    // extended to also make context.close() throw a SECOND, unrelated error
    // during cleanup -- proving the ORIGINAL clip.run error still wins and
    // the partial file is still deleted, rather than the secondary close()
    // failure masking the original error or aborting cleanup.
    var fixtureDir = path.join(__dirname, '..', 'artefacts', 'ppc-s5-test-fixture-cleanup', 'playback', 'ppc-fixture-story', 'video');
    fs.mkdirSync(fixtureDir, { recursive: true });
    var partialVideoPath = path.join(fixtureDir, 'partial-fixture.webm');
    fs.writeFileSync(partialVideoPath, 'fake partial video bytes written by Playwright before the failure');
    var closeCallCount = 0;
    var mockPage = {
      video: function() { return { path: async function() { return partialVideoPath; } }; }
    };
    var mockContext = {
      newPage: async function() { return mockPage; },
      close: async function() {
        closeCallCount++;
        throw new Error('simulated secondary failure closing context');
      }
    };
    var mockBrowser = { newContext: async function() { return mockContext; } };
    var clip = { name: 'AC1', run: async function() { throw new Error('simulated mid-recording failure'); } };
    var threw = null;
    try {
      await capVideo.captureVideoRecording({ browser: mockBrowser, featureSlug: 'ppc-s5-test-fixture-cleanup', storySlug: 'ppc-fixture-story', clips: [clip] });
    } catch (e) { threw = e; }
    try {
      assert.ok(threw, 'expected the failure to be surfaced, not swallowed');
      assert.strictEqual(threw.message, 'simulated mid-recording failure', 'expected the ORIGINAL error to propagate unmasked, even though context.close() also threw during cleanup');
      assert.strictEqual(closeCallCount, 1, 'expected context.close() to still be attempted during cleanup');
      assert.strictEqual(fs.existsSync(partialVideoPath), false, 'expected the partial file to be deleted even though context.close() threw during cleanup');
    } finally {
      fs.rmSync(path.join(__dirname, '..', 'artefacts', 'ppc-s5-test-fixture-cleanup'), { recursive: true, force: true });
    }
  });
});

(async function() {
  console.log('\ncheck-ppc-s5-video-capture.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
