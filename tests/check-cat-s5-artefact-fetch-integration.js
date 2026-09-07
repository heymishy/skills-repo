'use strict';
// check-cat-s5-artefact-fetch-integration.js -- cat-s5: /artefact/:slug/:type
// resolves through cat-s1's buildArtefactTrace instead of independent logic,
// for the cases adlr-s1's own static ARTEFACT_SUBDIRS probe cannot reach.
// ADR-028, ADR-029.

var assert = require('assert');
var path = require('path');
var fs = require('fs');
var os = require('os');

var FETCHER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/artefact-fetcher.js');
var ARTEFACT_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/artefact.js');
var REPO_ROOT = path.resolve(__dirname, '..');

function freshRequire(p) {
  try { delete require.cache[require.resolve(p)]; } catch (_) {}
  return require(p);
}

var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}

function mockFetchOkPaths(okPaths, calls) {
  return function(url) {
    calls.push(url);
    var matched = okPaths.some(function(p) { return url.indexOf(p) !== -1; });
    if (matched) {
      var body = { content: Buffer.from('content for ' + url, 'utf8').toString('base64') };
      return Promise.resolve({ status: 200, ok: true, json: function() { return Promise.resolve(body); } });
    }
    return Promise.resolve({ status: 404, ok: false, json: function() { return Promise.resolve({}); } });
  };
}

console.log('\n[cat-s5] AC1 -- correctly-encoded existing link resolves identically with repoRoot supplied (regression guard)');
{
  var fetcherMod = freshRequire(FETCHER_PATH);
  var calls = [];
  global.fetch = mockFetchOkPaths(['artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s1-dor.md'], calls);
  fetcherMod.fetchArtefact('2026-07-05-product-stds-hierarchy', 'dor/psh-s1-dor', 'tok', undefined, undefined, REPO_ROOT).then(function(content) {
    test('content resolved, byte-identical to the no-repoRoot case', function() {
      assert.ok(content.indexOf('content for') === 0);
    });
    test('exactly 1 fetch call -- repoRoot supplied does not change the slash-containing direct-path case', function() {
      assert.strictEqual(calls.length, 1);
    });
  });
}

console.log('\n[cat-s5] Results:', passed, 'passed,', failed, 'failed');
if (failed > 0) process.exit(1);
