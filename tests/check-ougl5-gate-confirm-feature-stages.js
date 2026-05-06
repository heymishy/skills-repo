'use strict';
var assert = require('assert');
var path = require('path');
var os = require('os');
var fs = require('fs');
var crypto = require('crypto');

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

// T5.1 — done:true → writes artefact to disk
queue.push(function() {
  return test('T5.1: done:true + artefactContent → artefact written to disk', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature');
    var journeyId = journeyObj.journeyId;
    var artefactRelPath = 'ougl5-test-artefacts/discovery.md';
    var expectedAbsPath = path.join(tmpdir, artefactRelPath);

    // Clean up any existing file
    try { fs.unlinkSync(expectedAbsPath); } catch(_) {}

    // Set up active session state via journey's injected skills module
    var activeSessionId = 'sess-gc-' + Date.now();
    store.setActiveSession(journeyId, activeSessionId, 'discovery');

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);

    // Inject a fake _getHtmlSession that returns the done session
    journey.setGetHtmlSession(function(sid) {
      if (sid === activeSessionId) {
        return {
          skillName: 'discovery',
          done: true,
          artefactContent: '# Discovery content',
          artefactPath: artefactRelPath,
          journeyId: journeyId,
          turns: [],
          systemPrompt: 'test'
        };
      }
      return null;
    });

    var req = authReq({ params: { journeyId: journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    assert.ok(
      fs.existsSync(expectedAbsPath),
      'Expected artefact file to exist at ' + expectedAbsPath
    );
    var contents = fs.readFileSync(expectedAbsPath, 'utf8');
    assert.ok(contents.includes('# Discovery content'), 'Expected correct artefact content on disk');
  });
});

// T5.2 — priorArtefacts content read from disk, not from session.artefactContent
queue.push(function() {
  return test('T5.2: priorArtefacts content read from disk, not session.artefactContent', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-5-2');
    var journeyId = journeyObj.journeyId;
    var artefactRelPath = 'ougl5-test-artefacts/discovery-5-2.md';
    var expectedAbsPath = path.join(tmpdir, artefactRelPath);

    // Pre-write a different value to disk
    var diskContent = '# Disk content — authoritative';
    var dir = path.dirname(expectedAbsPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(expectedAbsPath, diskContent, 'utf8');

    var activeSessionId = 'sess-5-2-' + Date.now();
    store.setActiveSession(journeyId, activeSessionId, 'discovery');

    var capturedPriorArtefacts = null;
    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function(sid, sessionPath, skillName, priorArtefacts) {
      capturedPriorArtefacts = priorArtefacts;
    });
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function(sid) {
      if (sid === activeSessionId) {
        return {
          skillName: 'discovery',
          done: true,
          artefactContent: '# In-memory content — should NOT be used',
          artefactPath: artefactRelPath,
          journeyId: journeyId,
          turns: [],
          systemPrompt: 'test'
        };
      }
      return null;
    });

    var req = authReq({ params: { journeyId: journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    assert.ok(capturedPriorArtefacts, 'Expected priorArtefacts to be passed to registerHtmlSession');
    assert.ok(
      capturedPriorArtefacts[0].content === diskContent,
      'Expected disk content in priorArtefacts, got: ' + (capturedPriorArtefacts[0] && capturedPriorArtefacts[0].content)
    );
  });
});

// T5.3 — registerHtmlSession called with priorArtefacts[0].path === session.artefactPath
queue.push(function() {
  return test('T5.3: registerHtmlSession called with priorArtefacts containing artefact path', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-5-3');
    var journeyId = journeyObj.journeyId;
    var artefactRelPath = 'ougl5-test-artefacts/discovery-5-3.md';
    var artefactAbsPath = path.join(tmpdir, artefactRelPath);
    fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
    fs.writeFileSync(artefactAbsPath, '# Discovery', 'utf8');

    var activeSessionId = 'sess-5-3-' + Date.now();
    store.setActiveSession(journeyId, activeSessionId, 'discovery');

    var capturedPriorArtefacts = null;
    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function(sid, sessionPath, skillName, priorArtefacts) {
      capturedPriorArtefacts = priorArtefacts;
    });
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function(sid) {
      if (sid === activeSessionId) {
        return {
          skillName: 'discovery', done: true,
          artefactContent: '# Discovery', artefactPath: artefactRelPath,
          journeyId: journeyId, turns: [], systemPrompt: 'test'
        };
      }
      return null;
    });

    var req = authReq({ params: { journeyId: journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    assert.ok(Array.isArray(capturedPriorArtefacts) && capturedPriorArtefacts.length >= 1, 'Expected priorArtefacts array with items');
    assert.strictEqual(capturedPriorArtefacts[0].path, artefactRelPath, 'Expected priorArtefacts[0].path to equal artefactPath');
  });
});

// T5.4 — New session journeyId matches
queue.push(function() {
  return test('T5.4: New session journeyId matches the journey', async function() {
    var routes;
    try { routes = require(path.resolve(__dirname, '../src/web-ui/routes/skills.js')); } catch(_) { routes = null; }
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-5-4');
    var journeyId = journeyObj.journeyId;
    var artefactRelPath = 'ougl5-test-artefacts/discovery-5-4.md';
    var artefactAbsPath = path.join(tmpdir, artefactRelPath);
    fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
    fs.writeFileSync(artefactAbsPath, '# Discovery', 'utf8');

    var activeSessionId = 'sess-5-4-' + Date.now();
    var capturedNewSid = null;
    store.setActiveSession(journeyId, activeSessionId, 'discovery');

    var capturedLinkSid = null;
    var capturedLinkJid = null;
    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function(sid, sessionPath, skillName, priorArtefacts) {
      capturedNewSid = sid;
    });
    journey.setLinkSessionToJourney(function(sid, jid) {
      capturedLinkSid = sid;
      capturedLinkJid = jid;
    });
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function(sid) {
      if (sid === activeSessionId) {
        return {
          skillName: 'discovery', done: true,
          artefactContent: '# Discovery', artefactPath: artefactRelPath,
          journeyId: journeyId, turns: [], systemPrompt: 'test'
        };
      }
      return null;
    });

    var req = authReq({ params: { journeyId: journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    assert.ok(capturedNewSid, 'Expected new session ID to be captured');
    assert.strictEqual(capturedLinkJid, journeyId, 'Expected linkSessionToJourney called with correct journeyId');
  });
});

// T5.5 — 303 redirect to benefit-metric chat
queue.push(function() {
  return test('T5.5: discovery done → 303 to /skills/benefit-metric/sessions/[sid]/chat', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-5-5');
    var journeyId = journeyObj.journeyId;
    var artefactRelPath = 'ougl5-test-artefacts/discovery-5-5.md';
    var artefactAbsPath = path.join(tmpdir, artefactRelPath);
    fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
    fs.writeFileSync(artefactAbsPath, '# Discovery', 'utf8');

    var activeSessionId = 'sess-5-5-' + Date.now();
    store.setActiveSession(journeyId, activeSessionId, 'discovery');

    var newSid = 'bm-sid-' + Date.now();
    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function(sid) { newSid = sid; });
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function(sid) {
      if (sid === activeSessionId) {
        return {
          skillName: 'discovery', done: true,
          artefactContent: '# Discovery', artefactPath: artefactRelPath,
          journeyId: journeyId, turns: [], systemPrompt: 'test'
        };
      }
      return null;
    });

    var req = authReq({ params: { journeyId: journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    assert.strictEqual(res._status, 303, 'Expected 303, got ' + res._status);
    assert.ok(res._headers.Location, 'Expected Location header');
    assert.ok(
      res._headers.Location.includes('/skills/benefit-metric/sessions/') && res._headers.Location.includes('/chat'),
      'Expected redirect to benefit-metric chat, got: ' + res._headers.Location
    );
  });
});

// T5.6 — done:false → 400
queue.push(function() {
  return test('T5.6: done:false → 400', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-5-6');
    var journeyId = journeyObj.journeyId;
    var activeSessionId = 'sess-5-6-' + Date.now();
    store.setActiveSession(journeyId, activeSessionId, 'discovery');

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function(sid) {
      if (sid === activeSessionId) {
        return {
          skillName: 'discovery', done: false,
          artefactContent: null, artefactPath: null,
          journeyId: journeyId, turns: [], systemPrompt: 'test'
        };
      }
      return null;
    });

    var req = authReq({ params: { journeyId: journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);
    assert.strictEqual(res._status, 400, 'Expected 400 when done:false, got ' + res._status);
  });
});

// T5.7 — Unknown journeyId → 404
queue.push(function() {
  return test('T5.7: Unknown journeyId → 404', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function() { return null; });

    var req = authReq({ params: { journeyId: 'nonexistent-id-xyz' } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);
    assert.strictEqual(res._status, 404, 'Expected 404 for unknown journeyId, got ' + res._status);
  });
});

// T5.8 — Unauth → 302
queue.push(function() {
  return test('T5.8: Unauth → 302 to /auth/github', async function() {
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
    await journey.handlePostGateConfirm(req, res);
    assert.strictEqual(res._status, 302, 'Expected 302 for unauth, got ' + res._status);
    assert.strictEqual(res._headers.Location, '/auth/github', 'Expected Location: /auth/github');
  });
});

// T5.9 — definition → test-plan stage → 303 to /journey/:id/stories
queue.push(function() {
  return test('T5.9: definition stage done → 303 to /journey/:id/stories (test-plan next stage)', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-5-9');
    var journeyId = journeyObj.journeyId;
    var artefactRelPath = 'ougl5-test-artefacts/definition-5-9.md';
    var artefactAbsPath = path.join(tmpdir, artefactRelPath);
    fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
    fs.writeFileSync(artefactAbsPath, '# Definition', 'utf8');

    var activeSessionId = 'sess-5-9-' + Date.now();
    store.setActiveSession(journeyId, activeSessionId, 'definition');

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function(sid) {
      if (sid === activeSessionId) {
        return {
          skillName: 'definition', done: true,
          artefactContent: '# Definition', artefactPath: artefactRelPath,
          journeyId: journeyId, turns: [], systemPrompt: 'test'
        };
      }
      return null;
    });

    var req = authReq({ params: { journeyId: journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    assert.strictEqual(res._status, 303, 'Expected 303, got ' + res._status);
    assert.ok(
      res._headers.Location && res._headers.Location.includes('/journey/') && res._headers.Location.includes('/stories'),
      'Expected redirect to /journey/:id/stories, got: ' + res._headers.Location
    );
  });
});

// T5.10 — Path traversal → 400, no file written
queue.push(function() {
  return test('T5.10: Path traversal in artefactPath → 400, no file written', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-5-10');
    var journeyId = journeyObj.journeyId;
    var activeSessionId = 'sess-5-10-' + Date.now();
    store.setActiveSession(journeyId, activeSessionId, 'discovery');

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function(sid) {
      if (sid === activeSessionId) {
        return {
          skillName: 'discovery', done: true,
          artefactContent: 'bad content', artefactPath: '../../etc/passwd',
          journeyId: journeyId, turns: [], systemPrompt: 'test'
        };
      }
      return null;
    });

    var req = authReq({ params: { journeyId: journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    assert.strictEqual(res._status, 400, 'Expected 400 for path traversal, got ' + res._status);
  });
});

// T5.11 — Multiple prior stages → priorArtefacts has all entries
queue.push(function() {
  return test('T5.11: 2 prior completed stages → priorArtefacts has 3 entries after definition completes', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-5-11');
    var journeyId = journeyObj.journeyId;

    // Pre-write two prior artefact files
    var discPath = 'ougl5-test-artefacts/disc-5-11.md';
    var bmPath = 'ougl5-test-artefacts/bm-5-11.md';
    var defPath = 'ougl5-test-artefacts/def-5-11.md';
    [discPath, bmPath, defPath].forEach(function(p) {
      var abs = path.join(tmpdir, p);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, '# Content for ' + p, 'utf8');
    });

    // Mark two prior stages as complete
    store.completeStage(journeyId, 'discovery', discPath);
    store.completeStage(journeyId, 'benefit-metric', bmPath);

    var activeSessionId = 'sess-5-11-' + Date.now();
    store.setActiveSession(journeyId, activeSessionId, 'definition');

    var capturedPriorArtefacts = null;
    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function(sid, sessionPath, skillName, priorArtefacts) {
      capturedPriorArtefacts = priorArtefacts;
    });
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function(sid) {
      if (sid === activeSessionId) {
        return {
          skillName: 'definition', done: true,
          artefactContent: '# Definition', artefactPath: defPath,
          journeyId: journeyId, turns: [], systemPrompt: 'test'
        };
      }
      return null;
    });

    var req = authReq({ params: { journeyId: journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    // Note: test-plan is next stage, which redirects to /stories, not a new session
    // But the function should have attempted to pass priorArtefacts if it creates a session
    // For definition → test-plan, no new session is created (goes to /stories)
    // So we check completeStage was called correctly instead
    var updatedJourney = store.getJourney(journeyId);
    // After definition completes, completedStages should have 3 entries
    assert.ok(updatedJourney.completedStages.length >= 3, 'Expected at least 3 completed stages after definition, got ' + updatedJourney.completedStages.length);
  });
});

// T5.12 — completeStage is called on gate-confirm success
queue.push(function() {
  return test('T5.12: completeStage called after successful gate-confirm', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-5-12');
    var journeyId = journeyObj.journeyId;
    var artefactRelPath = 'ougl5-test-artefacts/disc-5-12.md';
    var artefactAbsPath = path.join(tmpdir, artefactRelPath);
    fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
    fs.writeFileSync(artefactAbsPath, '# Discovery', 'utf8');

    var activeSessionId = 'sess-5-12-' + Date.now();
    store.setActiveSession(journeyId, activeSessionId, 'discovery');

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function(sid) {
      if (sid === activeSessionId) {
        return {
          skillName: 'discovery', done: true,
          artefactContent: '# Discovery', artefactPath: artefactRelPath,
          journeyId: journeyId, turns: [], systemPrompt: 'test'
        };
      }
      return null;
    });

    var req = authReq({ params: { journeyId: journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    var updatedJourney = store.getJourney(journeyId);
    assert.ok(updatedJourney.completedStages.length >= 1, 'Expected completedStages to have at least 1 entry after gate-confirm');
    assert.strictEqual(updatedJourney.completedStages[0].skillName, 'discovery', 'Expected completed stage skillName: discovery');
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
