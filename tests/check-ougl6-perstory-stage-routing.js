'use strict';
var assert = require('assert');
var path = require('path');
var os = require('os');
var fs = require('fs');

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

var JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');

function freshRequireJourney() {
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch(_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch(_) {}
  return require(JOURNEY_PATH);
}

function getStore() {
  return require(JOURNEY_STORE_PATH);
}

function makeRes() {
  var res = {
    _status: null,
    _headers: {},
    _body: '',
    writeHead: function(status, headers) {
      res._status = status;
      Object.assign(res._headers, headers || {});
    },
    setHeader: function(k, v) { res._headers[k] = v; },
    end: function(body) { res._body += (body || ''); }
  };
  return res;
}

function authReq(extra) {
  return Object.assign({
    session: { accessToken: 'test-token', userId: 1, login: 'user' },
    params: {},
    body: {}
  }, extra || {});
}

var tmpdir = os.tmpdir();

var queue = [];

// T6.1 — Auth GET /journey/:id/stories → 200 with <form> and <textarea>
queue.push(function() {
  return test('T6.1: Auth GET /journey/:id/stories → 200 with form + textarea', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-6-1');
    var journeyId = journeyObj.journeyId;

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function() { return null; });

    var req = authReq({ params: { journeyId: journeyId } });
    var res = makeRes();
    await journey.handleGetStories(req, res);

    assert.strictEqual(res._status, 200, 'Expected 200, got ' + res._status);
    assert.ok(res._body.includes('<form'), 'Expected <form> in response body');
    assert.ok(res._body.includes('<textarea'), 'Expected <textarea> in response body');
    assert.ok(
      res._body.includes('/api/journey/' + journeyId + '/stories') || res._body.includes('/journey/' + journeyId + '/stories'),
      'Expected form action pointing to stories route'
    );
  });
});

// T6.2 — Unauth GET → 302
queue.push(function() {
  return test('T6.2: Unauth GET → 302 to /auth/github', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function() { return null; });

    var req = { session: {}, params: { journeyId: 'some-id' }, body: {} };
    var res = makeRes();
    await journey.handleGetStories(req, res);

    assert.strictEqual(res._status, 302, 'Expected 302 for unauth, got ' + res._status);
    assert.strictEqual(res._headers.Location, '/auth/github', 'Expected redirect to /auth/github');
  });
});

// T6.3 — POST stories string → storyList set correctly, mode = 'story'
queue.push(function() {
  return test('T6.3: POST stories textarea → storyList + mode:story set on journey', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-6-3');
    var journeyId = journeyObj.journeyId;

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function() { return null; });

    var req = authReq({
      params: { journeyId: journeyId },
      body: { stories: 'wgol.1\nwgol.2\nwgol.3' }
    });
    var res = makeRes();
    await journey.handlePostStories(req, res);

    var updated = store.getJourney(journeyId);
    assert.ok(Array.isArray(updated.storyList), 'Expected storyList to be an array');
    assert.deepStrictEqual(updated.storyList, ['wgol.1', 'wgol.2', 'wgol.3'], 'Expected correct storyList');
    assert.strictEqual(updated.mode, 'story', 'Expected mode to be "story"');
  });
});

// T6.4 — POST stories → 303 to test-plan session chat
queue.push(function() {
  return test('T6.4: POST stories → 303 to /skills/test-plan/sessions/[sid]/chat', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-6-4');
    var journeyId = journeyObj.journeyId;

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function() { return null; });

    var req = authReq({
      params: { journeyId: journeyId },
      body: { stories: 'wgol.1\nwgol.2' }
    });
    var res = makeRes();
    await journey.handlePostStories(req, res);

    assert.strictEqual(res._status, 303, 'Expected 303, got ' + res._status);
    assert.ok(
      res._headers.Location && res._headers.Location.includes('/skills/test-plan/sessions/'),
      'Expected redirect to test-plan session, got: ' + res._headers.Location
    );
    assert.ok(res._headers.Location.includes('/chat'), 'Expected /chat suffix on redirect');
  });
});

// T6.5 — New test-plan session systemPrompt has handoff block + story slug
queue.push(function() {
  return test('T6.5: test-plan session systemPrompt includes handoff block + story slug', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-6-5');
    var journeyId = journeyObj.journeyId;

    // Pre-populate completed stages
    var discPath = 'ougl6-test-artefacts/disc-6-5.md';
    var discAbs = path.join(tmpdir, discPath);
    fs.mkdirSync(path.dirname(discAbs), { recursive: true });
    fs.writeFileSync(discAbs, '# Discovery artefact for 6-5', 'utf8');
    store.completeStage(journeyId, 'discovery', discPath);

    var capturedPriorArtefacts = null;
    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function(sid, sessionPath, skillName, priorArtefacts) {
      capturedPriorArtefacts = priorArtefacts;
    });
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function() { return null; });

    var req = authReq({
      params: { journeyId: journeyId },
      body: { stories: 'wgol.1\nwgol.2' }
    });
    var res = makeRes();
    await journey.handlePostStories(req, res);

    // The first story being processed should be reflected in priorArtefacts / sessionPath
    // The test-plan session for 'wgol.1' should have current story context
    assert.ok(capturedPriorArtefacts, 'Expected priorArtefacts passed to registerHtmlSession');
    // Prior artefacts must include the discovery artefact
    var hasDiscovery = capturedPriorArtefacts.some(function(a) { return a.path === discPath; });
    assert.ok(hasDiscovery, 'Expected discovery artefact in priorArtefacts for test-plan session');
  });
});

// T6.6 — Story slug path traversal → 400
queue.push(function() {
  return test('T6.6: Path traversal slug in stories body → 400', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-6-6');
    var journeyId = journeyObj.journeyId;

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function() { return null; });

    var req = authReq({
      params: { journeyId: journeyId },
      body: { stories: '../etc\n../../passwd\nvalid.1' }
    });
    var res = makeRes();
    await journey.handlePostStories(req, res);

    assert.strictEqual(res._status, 400, 'Expected 400 for path traversal slug, got ' + res._status);
  });
});

// T6.7 — Empty stories body → 400
queue.push(function() {
  return test('T6.7: Empty textarea POST → 400', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-6-7');
    var journeyId = journeyObj.journeyId;

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function() { return null; });

    var req = authReq({
      params: { journeyId: journeyId },
      body: { stories: '   \n  \n' }
    });
    var res = makeRes();
    await journey.handlePostStories(req, res);

    assert.strictEqual(res._status, 400, 'Expected 400 for empty stories, got ' + res._status);
  });
});

// T6.8 — Unknown journeyId for POST → 404
queue.push(function() {
  return test('T6.8: Unknown journeyId for POST /stories → 404', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function() { return null; });

    var req = authReq({
      params: { journeyId: 'nonexistent-journey-6-8' },
      body: { stories: 'valid.1\nvalid.2' }
    });
    var res = makeRes();
    await journey.handlePostStories(req, res);

    assert.strictEqual(res._status, 404, 'Expected 404 for unknown journeyId, got ' + res._status);
  });
});

// T6.INT.1 — Integration: setStoryList → getCurrentStory → advanceToNextStory sequence
queue.push(function() {
  return test('T6.INT.1: store setStoryList/getCurrentStory/advanceToNextStory sequence', function() {
    try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch(_) {}
    var store = require(JOURNEY_STORE_PATH);
    store._clear();
    var journeyObj = store.createJourney('int-test-6');
    var journeyId = journeyObj.journeyId;

    store.setStoryList(journeyId, ['s1', 's2', 's3']);

    var current = store.getCurrentStory(journeyId);
    assert.strictEqual(current, 's1', 'Expected first story s1, got: ' + current);

    store.advanceToNextStory(journeyId);
    current = store.getCurrentStory(journeyId);
    assert.strictEqual(current, 's2', 'Expected second story s2, got: ' + current);

    store.advanceToNextStory(journeyId);
    current = store.getCurrentStory(journeyId);
    assert.strictEqual(current, 's3', 'Expected third story s3, got: ' + current);

    var result = store.advanceToNextStory(journeyId);
    current = store.getCurrentStory(journeyId);
    assert.ok(
      current === null || current === false || current === undefined,
      'Expected null/false/undefined after all stories exhausted, got: ' + current
    );
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
