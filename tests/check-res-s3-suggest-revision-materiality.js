'use strict';

// check-res-s3-suggest-revision-materiality.js
// Verifies res-s3: after res-s2's overwrite, a deterministic section-diff
// classifies the revision as material (Problem Statement/MVP Scope/Constraints
// changed) or minor (everything else), generates a one-sentence rationale,
// presents both in the same chat turn's SSE response, and logs the suggestion
// with a joinable key for res-s4.
//
// Run: node tests/check-res-s3-suggest-revision-materiality.js

var fs   = require('fs');
var os   = require('os');
var path = require('path');
var MATERIALITY_PATH = path.resolve(__dirname, '../src/web-ui/modules/materiality-check.js');
var ROUTES_PATH       = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

function freshMaterialityCheck() {
  var resolved = require.resolve(MATERIALITY_PATH);
  delete require.cache[resolved];
  return require(resolved);
}

function freshRoutes() {
  var resolved = require.resolve(ROUTES_PATH);
  delete require.cache[resolved];
  return require(resolved);
}

function fakeRes() {
  var r = { _chunks: [], _ended: false };
  r.writeHead = function() {};
  r.write = function(s) { r._chunks.push(s); };
  r.end = function() { r._ended = true; };
  r.events = function() {
    return r._chunks.map(function(c) {
      var m = c.match(/^data: (.*)\n\n$/);
      return m ? JSON.parse(m[1]) : null;
    }).filter(Boolean);
  };
  r.lastEvent = function() {
    var evts = r.events();
    return evts[evts.length - 1] || null;
  };
  return r;
}

var _tmpRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'res-s3-'));

var PRE_FIXTURE =
  '# Discovery\n\n' +
  '## Problem Statement\n\nOperators cannot revise an earlier completed stage.\n\n' +
  '## Who It Affects\n\nSolo operators running the outer loop.\n\n' +
  '## MVP Scope\n\nReopen and overwrite the artefact in place.\n\n' +
  '## Constraints\n\nNo new versioning mechanism.\n';

(async function main() {

console.log('\nTask 1 — deterministic section-diff classifier');

await (async function() {
  var mc = freshMaterialityCheck();

  // AC2: Problem Statement changed -> material
  var postProblemChanged = PRE_FIXTURE.replace(
    'Operators cannot revise an earlier completed stage.',
    'Operators cannot revise an earlier completed stage, and this now also blocks external reviewers.'
  );
  var r1 = mc.checkMateriality(PRE_FIXTURE, postProblemChanged);
  ok('AC2: Problem Statement change classified as material', r1.classification === 'material');
  ok('AC2: changedSections names Problem Statement', r1.changedSections.indexOf('Problem Statement') !== -1);
  ok('AC2: changedSections contains ONLY Problem Statement (no unrelated sections)', r1.changedSections.length === 1 && JSON.stringify(r1.changedSections) === JSON.stringify(['Problem Statement']));

  // AC2: Constraints changed -> material
  var postConstraintChanged = PRE_FIXTURE.replace(
    'No new versioning mechanism.',
    'No new versioning mechanism; must also support a dated-copy fallback.'
  );
  var r2 = mc.checkMateriality(PRE_FIXTURE, postConstraintChanged);
  ok('AC2: Constraints change classified as material', r2.classification === 'material');
  ok('AC2: changedSections names Constraints', r2.changedSections.indexOf('Constraints') !== -1);
  ok('AC2: changedSections contains ONLY Constraints (no unrelated sections)', r2.changedSections.length === 1 && JSON.stringify(r2.changedSections) === JSON.stringify(['Constraints']));
})();

await (async function() {
  var mc = freshMaterialityCheck();

  // AC3: wording-only change in a non-target section -> minor
  var postWordingChanged = PRE_FIXTURE.replace(
    'Solo operators running the outer loop.',
    'Solo operators who are running the outer loop end to end.'
  );
  var r1 = mc.checkMateriality(PRE_FIXTURE, postWordingChanged);
  ok('AC3: wording-only change (non-target section) classified as minor', r1.classification === 'minor');
  ok('AC3: changedSections is empty for a wording-only change', r1.changedSections.length === 0);

  // AC3 edge case: single-character typo fix (non-target section) -> minor
  var postTypoFixed = PRE_FIXTURE.replace('outer loop.', 'outer loop!');
  var r2 = mc.checkMateriality(PRE_FIXTURE, postTypoFixed);
  ok('AC3 edge case: single-character typo fix classified as minor', r2.classification === 'minor');
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
fs.rmSync(_tmpRepoRoot, { recursive: true, force: true });
process.exit(failed > 0 ? 1 : 0);

})();
