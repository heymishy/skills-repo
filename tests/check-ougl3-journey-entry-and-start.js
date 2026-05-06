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
    end: function(body) { res._body += (body || ''); },
    write: function(chunk) { res._body += (chunk || ''); }
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

var queue = [];

// T3.1 — Auth GET /journey → 200 with form
queue.push(function() {
  return test('T3.1: Auth GET /journey → 200 with form pointing to /api/journey', function() {
    var journey = freshRequireJourney();
    getStore()._clear();
    var req = authReq({ method: 'GET' });
    var res = makeRes();
    journey.handleGetJourney(req, res);
    assert.strictEqual(res._status, 200, 'Expected status 200, got ' + res._status);
    assert.ok(res._body.includes('<form'), 'Expected <form in response body');
    assert.ok(res._body.toLowerCase().includes('/api/journey'), 'Expected /api/journey action in form');
  });
});

// T3.2 — Unauth GET → 302 /auth/github
queue.push(function() {
  return test('T3.2: Unauth GET /journey → 302 to /auth/github', function() {
    var journey = freshRequireJourney();
    getStore()._clear();
    var req = { session: {}, method: 'GET', params: {}, body: {} };
    var res = makeRes();
    journey.handleGetJourney(req, res);
    assert.strictEqual(res._status, 302, 'Expected status 302, got ' + res._status);
    assert.strictEqual(res._headers.Location, '/auth/github', 'Expected Location: /auth/github');
  });
});

// T3.3 — Auth POST → creates journey + session correctly
queue.push(function() {
  return test('T3.3: Auth POST /api/journey → createJourney, registerHtmlSession, setActiveSession, linkSessionToJourney called', function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var registerCalled = false;
    var linkCalled = false;
    var setActiveCalled = false;
    journey.setRegisterHtmlSession(function(sid, sessionPath, skillName) {
      registerCalled = true;
      assert.strictEqual(skillName, 'discovery', 'Expected skillName: discovery');
    });
    journey.setLinkSessionToJourney(function(sid, journeyId) {
      linkCalled = true;
    });
    journey.setJourneyStoreModule(store);
    var req = authReq({ method: 'POST' });
    var res = makeRes();
    return Promise.resolve().then(function() {
      return journey.handlePostJourney(req, res);
    }).then(function() {
      assert.ok(registerCalled, 'Expected registerHtmlSession to be called');
      assert.ok(linkCalled, 'Expected linkSessionToJourney to be called');
    });
  });
});

// T3.4 — POST → 303 to /skills/discovery/sessions/[sid]/chat
queue.push(function() {
  return test('T3.4: Auth POST → 303 to /skills/discovery/sessions/[sid]/chat', function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var capturedSid = 'disc-sid-' + Date.now();
    journey.setRegisterHtmlSession(function(sid, sessionPath, skillName) {
      capturedSid = sid;
    });
    journey.setLinkSessionToJourney(function() {});
    journey.setJourneyStoreModule(store);
    var req = authReq({ method: 'POST' });
    var res = makeRes();
    return Promise.resolve().then(function() {
      return journey.handlePostJourney(req, res);
    }).then(function() {
      assert.strictEqual(res._status, 303, 'Expected status 303, got ' + res._status);
      assert.ok(res._headers.Location, 'Expected Location header');
      assert.ok(
        res._headers.Location.includes('/skills/discovery/sessions/') && res._headers.Location.includes('/chat'),
        'Expected redirect to /skills/discovery/sessions/[sid]/chat, got: ' + res._headers.Location
      );
    });
  });
});

// T3.5 — Unauth POST → 302 /auth/github
queue.push(function() {
  return test('T3.5: Unauth POST /api/journey → 302 to /auth/github', function() {
    var journey = freshRequireJourney();
    getStore()._clear();
    var req = { session: {}, method: 'POST', params: {}, body: {} };
    var res = makeRes();
    return Promise.resolve().then(function() {
      return journey.handlePostJourney(req, res);
    }).then(function() {
      assert.strictEqual(res._status, 302, 'Expected status 302, got ' + res._status);
      assert.strictEqual(res._headers.Location, '/auth/github', 'Expected Location: /auth/github');
    });
  });
});

// T3.6 — HTML has "journey" in heading, no hidden inputs
queue.push(function() {
  return test('T3.6: GET /journey HTML has journey in heading and no hidden inputs', function() {
    var journey = freshRequireJourney();
    getStore()._clear();
    var req = authReq({ method: 'GET' });
    var res = makeRes();
    journey.handleGetJourney(req, res);
    assert.ok(
      res._body.toLowerCase().includes('journey'),
      'Expected "journey" in page content'
    );
    assert.ok(
      !res._body.includes('<input type="hidden"') && !res._body.includes("<input type='hidden'"),
      'Expected no hidden inputs in form'
    );
  });
});

// T3.7 — POST error → 500 with renderShell HTML error page
queue.push(function() {
  return test('T3.7: POST error (createJourney throws) → 500 with rendered HTML error page', function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    // Inject a store mock that throws on createJourney
    var brokenStore = {
      createJourney: function() { throw new Error('Test store error'); },
      setActiveSession: function() {},
      getJourney: store.getJourney.bind(store),
      getNextStage: store.getNextStage.bind(store)
    };
    journey.setJourneyStoreModule(brokenStore);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    var req = authReq({ method: 'POST' });
    var res = makeRes();
    return Promise.resolve().then(function() {
      return journey.handlePostJourney(req, res);
    }).then(function() {
      assert.strictEqual(res._status, 500, 'Expected status 500 on error, got ' + res._status);
      assert.ok(res._body.includes('<'), 'Expected rendered HTML (not raw text/JSON)');
      assert.ok(!res._body.includes('Error: Test store error\n    at'), 'Expected no raw stack trace in response');
    });
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
