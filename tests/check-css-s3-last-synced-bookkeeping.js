'use strict';
// check-css-s3-last-synced-bookkeeping.js
// Unit test for css-s3: after a successful CLI -> web-UI sync
// (gateAdvance for the discovery-approved gate, with a connected journey),
// the local pipeline-state.json's own lastSyncedStage field for that story
// is updated to the synced stage value. Bookkeeping only -- no conflict
// branch on this direction (see decisions.md).

var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');

var passed = 0; var failed = 0;

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve();
  }
}

function freshRequire(modPath) {
  var resolved = require.resolve(modPath);
  try { delete require.cache[resolved]; } catch (_) {}
  return require(modPath);
}

(async function runAll() {
  await test('gateAdvance_updatesLastSyncedStage_afterSuccessfulSync', async function() {
    var tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'css-s3-cga-'));
    var stateDir = path.join(tmpRoot, '.github');
    fs.mkdirSync(stateDir, { recursive: true });
    var featureSlug = 'test-feat-css-s3';
    var initialState = {
      schemaVersion: '1',
      features: [
        { slug: featureSlug, id: featureSlug, updatedAt: 'T0', stories: [
          { id: 's1', slug: 's1', stage: 'definition', updatedAt: 'T0' },
        ] },
      ],
    };
    fs.writeFileSync(path.join(stateDir, 'pipeline-state.json'), JSON.stringify(initialState, null, 2));

    var artefactPath = path.join(tmpRoot, 'artefacts', featureSlug, 'discovery.md');
    fs.mkdirSync(path.dirname(artefactPath), { recursive: true });
    // Adjusted from the plan's literal '# Discovery\n\n## Approved By\n- test\n':
    // validateDiscoveryApproved() (src/enforcement/cli-outer-loop.js) requires
    // five more non-blank sections (Problem Statement, Who It Affects, Why Now,
    // MVP Scope, Out of Scope) plus a non-placeholder "Approved By" body -- a
    // minimal artefact satisfying all of them is used here so gateAdvance's own
    // validate() call passes and the test reaches the post-sync bookkeeping code
    // this task is actually about.
    fs.writeFileSync(artefactPath, [
      '# Discovery',
      '',
      '## Problem Statement',
      'Something needs solving.',
      '',
      '## Who It Affects',
      'Operators.',
      '',
      '## Why Now',
      'Because.',
      '',
      '## MVP Scope',
      'Minimal thing.',
      '',
      '## Out of Scope',
      'Everything else.',
      '',
      '## Approved By',
      '- Test Operator - Engineer - 2026-10-25',
      '',
    ].join('\n'));

    var journeySyncClient = freshRequire('../src/sync/journey-sync-client');
    var cliGateAdvance = freshRequire('../src/enforcement/cli-gate-advance');

    journeySyncClient.setJourneySyncClient(async function(action) {
      if (action === 'resolve') {
        return { found: true, journey: { journeyId: 'j1', featureSlug: featureSlug, repoOwner: null, repoName: null } };
      }
      return { updated: true };
    });

    var validate = require('../src/enforcement/cli-outer-loop').validate;
    var origValidate = validate;
    // gateAdvance calls the real validate() against the real artefact above;
    // discovery-approved's own gate validation is exercised elsewhere (not
    // this test's concern) -- this test only cares about the post-sync
    // lastSyncedStage write, so a minimal valid-enough artefact is used.

    // Two further adjustments beyond the plan's literal Step 1 code were
    // needed to actually reach the sync block gateAdvance() guards with
    // `if (advanceResult.exitCode === 0 && gateName === journeySyncClient.SYNC_GATE)`:
    //
    // 1. rawFields=[] (as literally given in the plan) makes cli-advance.js's
    //    applyAdvance() return exitCode 8 ("Usage: skills advance ...") before
    //    advance() ever reports success -- confirmed by direct invocation.
    //    advanceResult.exitCode must be 0 to enter the sync block at all, so a
    //    non-empty rawFields is required. Mirrored from the sibling
    //    integration test exercising this exact call shape
    //    (tests/check-css-s1-gate-advance-integration.js:81, ['stage=discovery-approved']).
    //
    // 2. journeySyncClient._syncConfigured() (src/sync/journey-sync-client.js)
    //    gates resolveJourneyForFeatureSlug() on
    //    process.env.INTERNAL_SYNC_URL && process.env.INTERNAL_SYNC_SECRET
    //    being set, checked *before* the mocked transport above is ever
    //    called -- confirmed by direct invocation returning a null journey
    //    with neither var set, even with the mock installed. Saved/restored
    //    around the gateAdvance() call so this test doesn't leak env state
    //    into the rest of the suite.
    var savedSyncUrl = process.env.INTERNAL_SYNC_URL;
    var savedSyncSecret = process.env.INTERNAL_SYNC_SECRET;
    process.env.INTERNAL_SYNC_URL = 'http://fake.test';
    process.env.INTERNAL_SYNC_SECRET = 'secret';
    try {
      await cliGateAdvance.gateAdvance(featureSlug, 's1', 'discovery-approved', artefactPath, ['stage=discovery-approved'], tmpRoot);
    } finally {
      if (savedSyncUrl === undefined) delete process.env.INTERNAL_SYNC_URL; else process.env.INTERNAL_SYNC_URL = savedSyncUrl;
      if (savedSyncSecret === undefined) delete process.env.INTERNAL_SYNC_SECRET; else process.env.INTERNAL_SYNC_SECRET = savedSyncSecret;
    }

    var finalState = JSON.parse(fs.readFileSync(path.join(stateDir, 'pipeline-state.json'), 'utf8'));
    var story = finalState.features[0].stories[0];
    assert.strictEqual(story.lastSyncedStage, journeySyncClient.SYNC_STAGE, 'expected lastSyncedStage to be updated to the synced stage ("discovery") after a successful sync');
  });

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
})();
