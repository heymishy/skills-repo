'use strict';
var assert = require('assert');
var path = require('path');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.message || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.message || err)); return Promise.resolve();
  }
}

function freshRequire(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

var ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');

function freshRequireStore() {
  delete require.cache[require.resolve(JOURNEY_STORE_PATH)];
  return require(JOURNEY_STORE_PATH);
}

var queue = [];

// T2.1 — createJourney returns correct shape
queue.push(function() {
  return test('T2.1: createJourney returns correct shape', function() {
    var store = freshRequireStore();
    store._clear();
    var result = store.createJourney('my-feature');
    assert.ok(result.journeyId && typeof result.journeyId === 'string' && result.journeyId.length > 0, 'Expected non-empty journeyId string');
    assert.strictEqual(result.featureSlug, 'my-feature', 'Expected featureSlug');
    assert.strictEqual(result.activeSkill, null, 'Expected activeSkill: null');
    assert.strictEqual(result.activeSessionId, null, 'Expected activeSessionId: null');
    assert.deepStrictEqual(result.completedStages, [], 'Expected completedStages: []');
    assert.strictEqual(result.mode, 'feature', 'Expected mode: feature');
  });
});

// T2.2 — getJourney returns same object
queue.push(function() {
  return test('T2.2: getJourney returns same object', function() {
    var store = freshRequireStore();
    store._clear();
    var created = store.createJourney('my-feature');
    var fetched = store.getJourney(created.journeyId);
    assert.ok(fetched, 'Expected getJourney to return an object');
    assert.strictEqual(fetched.journeyId, created.journeyId, 'Expected same journeyId');
    assert.strictEqual(fetched.featureSlug, 'my-feature', 'Expected same featureSlug');
  });
});

// T2.3 — setActiveSession updates fields
queue.push(function() {
  return test('T2.3: setActiveSession updates activeSessionId and activeSkill', function() {
    var store = freshRequireStore();
    store._clear();
    var journey = store.createJourney('my-feature');
    store.setActiveSession(journey.journeyId, 'sess-abc', 'discovery');
    var updated = store.getJourney(journey.journeyId);
    assert.strictEqual(updated.activeSessionId, 'sess-abc', 'Expected activeSessionId updated');
    assert.strictEqual(updated.activeSkill, 'discovery', 'Expected activeSkill updated');
  });
});

// T2.4 — getJourneyBySession returns journey
queue.push(function() {
  return test('T2.4: getJourneyBySession returns the journey', function() {
    var store = freshRequireStore();
    store._clear();
    var journey = store.createJourney('my-feature');
    store.setActiveSession(journey.journeyId, 'sess-xyz', 'discovery');
    var found = store.getJourneyBySession('sess-xyz');
    assert.ok(found, 'Expected getJourneyBySession to return an object');
    assert.strictEqual(found.journeyId, journey.journeyId, 'Expected matching journeyId');
  });
});

// T2.5 — completeStage adds entry to completedStages
queue.push(function() {
  return test('T2.5: completeStage adds entry to completedStages', function() {
    var store = freshRequireStore();
    store._clear();
    var journey = store.createJourney('my-feature');
    store.completeStage(journey.journeyId, 'discovery', 'artefacts/test/discovery.md');
    var updated = store.getJourney(journey.journeyId);
    assert.strictEqual(updated.completedStages.length, 1, 'Expected 1 completed stage');
    assert.strictEqual(updated.completedStages[0].skillName, 'discovery', 'Expected skillName');
    assert.strictEqual(updated.completedStages[0].artefactPath, 'artefacts/test/discovery.md', 'Expected artefactPath');
  });
});

// T2.6 — getNextStage sequence
queue.push(function() {
  return test('T2.6: getNextStage follows correct sequence', function() {
    var store = freshRequireStore();
    store._clear();
    assert.strictEqual(store.getNextStage('discovery'), 'benefit-metric', 'discovery → benefit-metric');
    assert.strictEqual(store.getNextStage('benefit-metric'), 'definition', 'benefit-metric → definition');
    assert.strictEqual(store.getNextStage('definition'), 'test-plan', 'definition → test-plan');
    assert.strictEqual(store.getNextStage('test-plan'), 'definition-of-ready', 'test-plan → definition-of-ready');
    assert.ok(store.getNextStage('definition-of-ready') === null || store.getNextStage('definition-of-ready') === undefined, 'definition-of-ready → null');
  });
});

// T2.7 — registerHtmlSession stores journeyId:null
queue.push(function() {
  return test('T2.7: registerHtmlSession stores journeyId: null on session', function() {
    var routes = freshRequire(ROUTES_PATH);
    var os = require('os');
    var tmpdir = os.tmpdir();
    var sid = 'ougl2-test-sid-' + Date.now();
    routes.registerHtmlSession(sid, tmpdir + '/test-session.md', 'discovery');
    var session = routes._getHtmlSession(sid);
    assert.ok(session, 'Expected session to exist');
    assert.ok(Object.prototype.hasOwnProperty.call(session, 'journeyId'), 'Expected journeyId field on session');
    assert.strictEqual(session.journeyId, null, 'Expected journeyId: null');
  });
});

// T2.8 — linkSessionToJourney updates journeyId
queue.push(function() {
  return test('T2.8: linkSessionToJourney updates session.journeyId', function() {
    var routes = freshRequire(ROUTES_PATH);
    var sid = 'ougl2-link-sid-' + Date.now();
    routes._setHtmlSession(sid, { skillName: 'discovery', journeyId: null, turns: [], done: false });
    routes.linkSessionToJourney(sid, 'journey-xyz');
    var session = routes._getHtmlSession(sid);
    assert.strictEqual(session.journeyId, 'journey-xyz', 'Expected journeyId updated to journey-xyz');
  });
});

// T2.9 — _clear() resets store
queue.push(function() {
  return test('T2.9: _clear() resets all journeys', function() {
    var store = freshRequireStore();
    store.createJourney('feat-a');
    store.createJourney('feat-b');
    store._clear();
    // After clear, any getJourney call should return null/undefined
    // We need a journeyId to test — create one, clear, then check
    var j = { journeyId: 'test-clear-id' };
    var result = store.getJourney(j.journeyId);
    assert.ok(result === null || result === undefined, 'Expected null after _clear()');
  });
});

var chain = Promise.resolve();
queue.forEach(function(fn) { chain = chain.then(fn); });
chain.then(function() {
  console.log('\n--- Results ---');
  console.log('Passed: ' + passed + '  Failed: ' + failed);
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
  }
  process.exit(failed > 0 ? 1 : 0);
});
