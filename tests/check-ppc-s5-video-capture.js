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
    var mockBrowser = {
      newContext: async function() {
        return {
          newPage: async function() {
            return {
              _calls: [],
              goto: async function(url) { this._calls.push(url); },
              context: function() { return { addCookies: async function() {} }; },
              video: function() { return { path: async function() { return this._fakePath; }.bind(this) }; }
            };
          },
          close: async function() {}
        };
      }
    };
    // Two distinct fake video paths, one per clip, assigned after newPage()
    // via a wrapper so each clip's own mock page resolves its own path.
    var pathsToReturn = ['artefacts/fx/playback/ppc-s1/video/clip1.webm', 'artefacts/fx/playback/ppc-s1/video/clip2.webm'];
    var callIndex = 0;
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
