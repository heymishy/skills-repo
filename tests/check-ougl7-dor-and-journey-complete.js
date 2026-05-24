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

// T7.1 — review session done + gate-confirm → DoR session created, priorArtefacts includes test-plan + review
queue.push(function() {
  return test('T7.1: review done + gate-confirm → DoR session priorArtefacts has test-plan + review', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-7-1');
    var journeyId = journeyObj.journeyId;

    // Pre-create test-plan and review artefact files
    var tpPath = 'ougl7-test-artefacts/test-plan-7-1.md';
    var revPath = 'ougl7-test-artefacts/review-7-1.md';
    [tpPath, revPath].forEach(function(p) {
      var abs = path.join(tmpdir, p);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, '# Content for ' + p, 'utf8');
    });

    // Mark test-plan as a prior completed stage
    store.completeStage(journeyId, 'test-plan', tpPath);

    // Active session is review, and it is done
    var reviewSid = 'sess-review-7-1-' + Date.now();
    store.setActiveSession(journeyId, reviewSid, 'review');

    var capturedPriorArtefacts = null;
    var capturedSkillName = null;
    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function(sid, sessionPath, skillName, priorArtefacts) {
      capturedPriorArtefacts = priorArtefacts;
      capturedSkillName = skillName;
    });
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function(sid) {
      if (sid === reviewSid) {
        return {
          skillName: 'review', done: true,
          artefactContent: '# Review artefact', artefactPath: revPath,
          journeyId: journeyId, turns: [], systemPrompt: 'test'
        };
      }
      return null;
    });

    var req = authReq({ params: { journeyId: journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    assert.strictEqual(capturedSkillName, 'definition-of-ready', 'Expected next skill to be definition-of-ready, got: ' + capturedSkillName);
    assert.ok(Array.isArray(capturedPriorArtefacts), 'Expected priorArtefacts to be an array');
    var hasTp = capturedPriorArtefacts.some(function(a) { return a.path === tpPath; });
    var hasRev = capturedPriorArtefacts.some(function(a) { return a.path === revPath; });
    assert.ok(hasTp, 'Expected test-plan artefact in priorArtefacts');
    assert.ok(hasRev, 'Expected review artefact in priorArtefacts');
  });
});

// T7.2 — DoR session → 303 to /skills/definition-of-ready/sessions/:id/chat
queue.push(function() {
  return test('T7.2: review gate-confirm → 303 to definition-of-ready session chat', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-7-2');
    var journeyId = journeyObj.journeyId;

    var revPath = 'ougl7-test-artefacts/review-7-2.md';
    var revAbs = path.join(tmpdir, revPath);
    fs.mkdirSync(path.dirname(revAbs), { recursive: true });
    fs.writeFileSync(revAbs, '# Review', 'utf8');

    var reviewSid = 'sess-review-7-2-' + Date.now();
    store.setActiveSession(journeyId, reviewSid, 'review');

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function(sid) {
      if (sid === reviewSid) {
        return {
          skillName: 'review', done: true,
          artefactContent: '# Review', artefactPath: revPath,
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
      res._headers.Location && res._headers.Location.includes('/skills/definition-of-ready/sessions/'),
      'Expected redirect to definition-of-ready session, got: ' + res._headers.Location
    );
    assert.ok(res._headers.Location.includes('/chat'), 'Expected /chat in Location');
  });
});

// T7.3 — DoR done + advanceToNextStory has next story → 303 to test-plan for next story
queue.push(function() {
  return test('T7.3: DoR done + more stories → 303 to next story test-plan session', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-7-3');
    var journeyId = journeyObj.journeyId;

    // Set up story list with 2 stories, currently on first
    store.setStoryList(journeyId, ['s7-3-a', 's7-3-b']);
    // getCurrentStory returns 's7-3-a' (index 0)

    var dorPath = 'ougl7-test-artefacts/dor-7-3.md';
    var dorAbs = path.join(tmpdir, dorPath);
    fs.mkdirSync(path.dirname(dorAbs), { recursive: true });
    fs.writeFileSync(dorAbs, '# DoR artefact for s7-3-a', 'utf8');

    var dorSid = 'sess-dor-7-3-' + Date.now();
    store.setActiveSession(journeyId, dorSid, 'definition-of-ready');

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    // cdg.4: inject passing validate stub so DoR gate-confirm guard does not block routing test
    if (typeof journey.setValidate === 'function') {
      journey.setValidate(function() { return { exitCode: 0 }; });
    }
    journey.setGetHtmlSession(function(sid) {
      if (sid === dorSid) {
        return {
          skillName: 'definition-of-ready', done: true,
          artefactContent: '# DoR', artefactPath: dorPath,
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
      res._headers.Location && res._headers.Location.includes('/skills/test-plan/sessions/'),
      'Expected redirect to test-plan session for next story, got: ' + res._headers.Location
    );
  });
});

// T7.4 — DoR done + no more stories → 303 to /journey/:id/complete
queue.push(function() {
  return test('T7.4: DoR done + no more stories → 303 to /journey/:id/complete', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-7-4');
    var journeyId = journeyObj.journeyId;

    // Set up story list with 1 story only
    store.setStoryList(journeyId, ['s7-4-only']);
    // getCurrentStory returns 's7-4-only', after advance there are no more

    var dorPath = 'ougl7-test-artefacts/dor-7-4.md';
    var dorAbs = path.join(tmpdir, dorPath);
    fs.mkdirSync(path.dirname(dorAbs), { recursive: true });
    fs.writeFileSync(dorAbs, '# DoR for s7-4-only', 'utf8');

    var dorSid = 'sess-dor-7-4-' + Date.now();
    store.setActiveSession(journeyId, dorSid, 'definition-of-ready');

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    // cdg.4: inject passing validate stub so DoR gate-confirm guard does not block routing test
    if (typeof journey.setValidate === 'function') {
      journey.setValidate(function() { return { exitCode: 0 }; });
    }
    journey.setGetHtmlSession(function(sid) {
      if (sid === dorSid) {
        return {
          skillName: 'definition-of-ready', done: true,
          artefactContent: '# DoR', artefactPath: dorPath,
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
      res._headers.Location && res._headers.Location.includes('/journey/') && res._headers.Location.includes('/complete'),
      'Expected redirect to /journey/:id/complete, got: ' + res._headers.Location
    );
    assert.ok(res._headers.Location.includes(journeyId), 'Expected journeyId in complete URL');
  });
});

// T7.5 — Auth GET /journey/:id/complete → 200 with completedStages listed
queue.push(function() {
  return test('T7.5: Auth GET /journey/:id/complete → 200 with completedStages in HTML', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-7-5');
    var journeyId = journeyObj.journeyId;

    // Add some completed stages
    store.completeStage(journeyId, 'discovery', 'artefacts/feat/discovery.md');
    store.completeStage(journeyId, 'benefit-metric', 'artefacts/feat/benefit-metric.md');
    store.completeStage(journeyId, 'definition', 'artefacts/feat/definition.md');

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function() { return null; });

    var req = authReq({ params: { journeyId: journeyId } });
    var res = makeRes();
    await journey.handleGetJourneyComplete(req, res);

    assert.strictEqual(res._status, 200, 'Expected 200, got ' + res._status);
    assert.ok(res._body.includes('artefacts/'), 'Expected artefact paths listed in complete page');
    assert.ok(res._body.includes('discovery'), 'Expected discovery in complete page');
  });
});

// T7.6 — Unauth GET /journey/:id/complete → 302
queue.push(function() {
  return test('T7.6: Unauth GET /journey/:id/complete → 302', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function() { return null; });

    var req = { session: {}, params: { journeyId: 'any-id' }, body: {} };
    var res = makeRes();
    await journey.handleGetJourneyComplete(req, res);

    assert.strictEqual(res._status, 302, 'Expected 302 for unauth complete page, got ' + res._status);
    assert.strictEqual(res._headers.Location, '/auth/github', 'Expected redirect to /auth/github');
  });
});

// T7.7 — 9 completedStages → HTML has ≥9 artefacts/ references
queue.push(function() {
  return test('T7.7: 9 completedStages → HTML has ≥9 artefacts/ references', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('test-feature-7-7');
    var journeyId = journeyObj.journeyId;

    var skills = ['discovery', 'benefit-metric', 'definition', 'test-plan', 'review',
                  'definition-of-ready', 'test-plan-s2', 'review-s2', 'definition-of-ready-s2'];
    skills.forEach(function(s, i) {
      store.completeStage(journeyId, s, 'artefacts/feat-7-7/' + s + '-artefact.md');
    });

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function() { return null; });

    var req = authReq({ params: { journeyId: journeyId } });
    var res = makeRes();
    await journey.handleGetJourneyComplete(req, res);

    // Count occurrences of 'artefacts/' in body
    var matches = (res._body.match(/artefacts\//g) || []).length;
    assert.ok(matches >= 9, 'Expected at least 9 artefacts/ references, got: ' + matches);
  });
});

// T7.8 — Unknown journeyId GET /complete → 404
queue.push(function() {
  return test('T7.8: Unknown journeyId GET /complete → 404', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpdir);
    journey.setGetHtmlSession(function() { return null; });

    var req = authReq({ params: { journeyId: 'nonexistent-7-8' } });
    var res = makeRes();
    await journey.handleGetJourneyComplete(req, res);

    assert.strictEqual(res._status, 404, 'Expected 404 for unknown journeyId, got ' + res._status);
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
