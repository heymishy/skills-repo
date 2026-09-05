'use strict';
// check-adlr-s1-artefact-link-resolution.js -- adlr-s1: fixes the platform-wide
// defect where artefact detail links 404 for anything not a root-level,
// non-archived artefact (93.5% of all artefact files repo-wide). Two parts:
// (1) features.js's link generation must encode the artefact's real relative
// path (including subdirectory and archived/ prefix awareness), not just its
// bare filename; (2) fetchArtefact must resolve that path directly, fall back
// to the archived/ prefix, and (only for a bare legacy input) probe known
// subdirectories before giving up.

var assert = require('assert');
var path = require('path');

var FEATURES_PATH = path.resolve(__dirname, '../src/web-ui/routes/features.js');
var FETCHER_PATH  = path.resolve(__dirname, '../src/web-ui/adapters/artefact-fetcher.js');

function freshRequire(p) {
  try { delete require.cache[require.resolve(p)]; } catch (_) {}
  return require(p);
}

var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}

function extractHref(html) {
  var m = html.match(/href="([^"]+)"/);
  return m ? m[1] : null;
}

function decodedUrlSegment(html) {
  var href = extractHref(html);
  if (!href) return null;
  var parts = href.split('/').filter(Boolean); // ['artefact', slug, encodedType]
  return decodeURIComponent(parts[parts.length - 1]);
}

// ── AC1: link generation ────────────────────────────────────────────────────

console.log('\n[adlr-s1] AC1 -- nested artefact link encodes the full relative path');
{
  var featuresMod = freshRequire(FEATURES_PATH);
  var html = featuresMod.renderArtefactIndexHtml(
    [{ path: 'artefacts/f/dor/x-dor.md', type: 'dor' }],
    'f'
  );
  test('decoded URL segment equals dor/x-dor', function() {
    assert.strictEqual(decodedUrlSegment(html), 'dor/x-dor');
  });
}

console.log('\n[adlr-s1] AC1 -- archived artefact link strips the archived/ prefix, keeps the subdirectory');
{
  var featuresMod = freshRequire(FEATURES_PATH);
  var html = featuresMod.renderArtefactIndexHtml(
    [{ path: 'artefacts/archived/f/dod/x-dod.md', type: 'dod' }],
    'f'
  );
  test('decoded URL segment equals dod/x-dod', function() {
    assert.strictEqual(decodedUrlSegment(html), 'dod/x-dod');
  });
}

console.log('\n[adlr-s1] AC1 / AC4 -- root-level artefact link is unchanged');
{
  var featuresMod = freshRequire(FEATURES_PATH);
  var html = featuresMod.renderArtefactIndexHtml(
    [{ path: 'artefacts/f/discovery.md', type: 'discovery' }],
    'f'
  );
  test('decoded URL segment equals discovery', function() {
    assert.strictEqual(decodedUrlSegment(html), 'discovery');
  });
}

// ── AC2/AC3/AC4/AC5: fetchArtefact resolution ───────────────────────────────

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

console.log('\n[adlr-s1] AC2 -- resolves a nested path directly, exactly one request');
{
  var fetcherMod = freshRequire(FETCHER_PATH);
  var calls = [];
  // fetchArtefact calls fetchGithubContentsResponse internally -- swap fetch itself.
  global.fetch = mockFetchOkPaths(['artefacts/f/dor/x-dor.md'], calls);
  return fetcherMod.fetchArtefact('f', 'dor/x-dor', 'tok').then(function(content) {
    test('content resolved', function() { assert.ok(content.indexOf('content for') === 0); });
    test('exactly 1 fetch call', function() { assert.strictEqual(calls.length, 1); });
  }).then(function() {

console.log('\n[adlr-s1] AC2 -- no subdirectory guessing for an already-nested path that does not exist');
    var calls2 = [];
    global.fetch = mockFetchOkPaths([], calls2);
    return fetcherMod.fetchArtefact('f', 'dor/does-not-exist', 'tok').catch(function(err) {
      test('throws ArtefactNotFoundError', function() { assert.strictEqual(err.name, 'ArtefactNotFoundError'); });
      test('exactly 2 fetch calls (non-archived + archived direct, no probing)', function() {
        assert.strictEqual(calls2.length, 2);
      });
    });
  }).then(function() {

console.log('\n[adlr-s1] AC3 -- falls back to archived/ prefix when non-archived 404s (nested)');
    var calls3 = [];
    global.fetch = mockFetchOkPaths(['artefacts/archived/f/dor/x-dor.md'], calls3);
    return fetcherMod.fetchArtefact('f', 'dor/x-dor', 'tok').then(function(content) {
      test('content resolved from archived path', function() { assert.ok(content.indexOf('content for') === 0); });
    });
  }).then(function() {

console.log('\n[adlr-s1] AC3 -- falls back to archived/ prefix for a root-level type too');
    var calls4 = [];
    global.fetch = mockFetchOkPaths(['artefacts/archived/f/discovery.md'], calls4);
    return fetcherMod.fetchArtefact('f', 'discovery', 'tok').then(function(content) {
      test('content resolved from archived path', function() { assert.ok(content.indexOf('content for') === 0); });
    });
  }).then(function() {

console.log('\n[adlr-s1] AC4 (regression guard) -- existing root-level, non-archived type resolves unchanged, one request');
    var calls5 = [];
    global.fetch = mockFetchOkPaths(['artefacts/f/discovery.md'], calls5);
    return fetcherMod.fetchArtefact('f', 'discovery', 'tok').then(function(content) {
      test('content resolved', function() { assert.ok(content.indexOf('content for') === 0); });
      test('exactly 1 fetch call', function() { assert.strictEqual(calls5.length, 1); });
    });
  }).then(function() {

console.log('\n[adlr-s1] AC5 -- bare legacy input is found by probing known subdirectories');
    var calls6 = [];
    global.fetch = mockFetchOkPaths(['artefacts/f/dor/x-dor.md'], calls6);
    return fetcherMod.fetchArtefact('f', 'x-dor', 'tok').then(function(content) {
      test('content resolved via subdirectory probe', function() { assert.ok(content.indexOf('content for') === 0); });
      test('the successful path was among the calls made', function() {
        assert.ok(calls6.some(function(u) { return u.indexOf('artefacts/f/dor/x-dor.md') !== -1; }));
      });
    });
  }).then(function() {

console.log('\n[adlr-s1] AC5 -- exhausts all candidates and throws a real 404 for a genuinely missing bare artefact');
    var calls7 = [];
    global.fetch = mockFetchOkPaths([], calls7);
    return fetcherMod.fetchArtefact('f', 'does-not-exist-anywhere', 'tok').then(function() {
      test('should have thrown', function() { assert.fail('expected ArtefactNotFoundError'); });
    }, function(err) {
      test('throws ArtefactNotFoundError', function() { assert.strictEqual(err.name, 'ArtefactNotFoundError'); });
      test('call count is bounded (<= 24: 2 direct + up to 22 subdirectory probes)', function() {
        assert.ok(calls7.length <= 24, 'got ' + calls7.length + ' calls');
        assert.ok(calls7.length >= 2, 'expected at least the 2 direct attempts');
      });
    });
  }).then(function() {
    console.log('\n--- adlr-s1 Results ---');
    console.log('Passed:', passed, ' Failed:', failed);
    process.exit(failed > 0 ? 1 : 0);
  }).catch(function(err) {
    console.log('UNEXPECTED ERROR:', err.stack || err.message);
    process.exit(1);
  });
}
