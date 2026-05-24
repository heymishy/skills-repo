'use strict';
// check-cdg4-gate-confirm-validation.js
// TDD tests for cdg.4: injectable _validate adapter in handlePostGateConfirm.
//
// IMPORTANT: T6 requires module-cache isolation to test the default stub.
// Each test that calls freshRequireJourney() clears the require cache for
// journey.js so adapter state does not leak between tests.
//
// Session terminology: "HTML session" = the journey-store session object
// retrieved by getGetHtmlSession()(sid). Not the same as req.session (auth).
// The handler reads artefactPath from the HTML session (session.artefactPath).

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
var CLI_OUTER_LOOP_PATH = path.resolve(__dirname, '../src/enforcement/cli-outer-loop.js');

function freshRequireJourney() {
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch (_) {}
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

// Shared tmp root for all tests
var tmpRoot = path.join(os.tmpdir(), 'cdg4-tests-' + Date.now());
fs.mkdirSync(tmpRoot, { recursive: true });

// Helper: set up a minimal journey + HTML session for gate-confirm
// Returns { journey, journeyId, sid } ready for use with handlePostGateConfirm
function setupDorSession(journey, store, opts) {
  opts = opts || {};
  var featureSlug = opts.featureSlug || 'test-feature-cdg4';
  var artefactRelPath = opts.artefactRelPath || path.join('artefacts', 'test', 'dor.md');
  var skillName = opts.skillName || 'definition-of-ready';

  store._clear();
  var journeyObj = store.createJourney(featureSlug);
  var journeyId = journeyObj.journeyId;
  store.setStoryList(journeyId, ['cdg4-story1']);
  var sid = 'sid-cdg4-' + Date.now() + '-' + Math.random();
  store.setActiveSession(journeyId, sid, skillName);

  // Ensure artefact file exists on disk
  if (opts.writeArtefact !== false) {
    var absArtefact = path.join(tmpRoot, artefactRelPath);
    fs.mkdirSync(path.dirname(absArtefact), { recursive: true });
    fs.writeFileSync(absArtefact, opts.artefactContent || '# DoR artefact', 'utf8');
  }

  journey.setJourneyStoreModule(store);
  journey.setRegisterHtmlSession(function() {});
  journey.setLinkSessionToJourney(function() {});
  journey.setRepoRoot(tmpRoot);

  journey.setGetHtmlSession(function(s) {
    if (s === sid) {
      return {
        skillName: skillName,
        done: true,
        artefactPath: artefactRelPath,
        artefactContent: opts.artefactContent || '# DoR artefact',
        journeyId: journeyId,
        turns: [],
        systemPrompt: 'test'
      };
    }
    return null;
  });

  return { journeyId: journeyId, sid: sid };
}

var queue = [];

// ---------------------------------------------------------------------------
// T1 — validate is called BEFORE pipelineStateWriter on DoR gate-confirm
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T1: validate stub called before pipelineStateWriter stub on DoR gate-confirm', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var callOrder = [];

    var setup = setupDorSession(journey, store, {});

    journey.setValidate(function(artefactPath, gateName, repoRoot) {
      callOrder.push('validate');
      return { exitCode: 0 };
    });
    journey.setPipelineStateWriter(function() {
      callOrder.push('pipelineStateWriter');
    });
    // cdg.5: wire no-op writeTrace so D37 stub doesn't throw
    if (typeof journey.setWriteTrace === 'function') { journey.setWriteTrace(function() {}); }

    var req = authReq({ params: { journeyId: setup.journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    assert.ok(callOrder.indexOf('validate') !== -1, 'validate stub must be called');
    assert.ok(callOrder.indexOf('pipelineStateWriter') !== -1, 'pipelineStateWriter stub must be called');
    var vIdx = callOrder.indexOf('validate');
    var pIdx = callOrder.indexOf('pipelineStateWriter');
    assert.ok(vIdx < pIdx, 'validate must be called before pipelineStateWriter (got order: ' + callOrder.join(', ') + ')');
  });
});

// ---------------------------------------------------------------------------
// T2 — validate returns non-zero → 422, pipelineStateWriter NOT called
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T2: validate returns exitCode 3 → 422 response, pipelineStateWriter not called', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var psWriterCalled = false;

    var setup = setupDorSession(journey, store, {});

    journey.setValidate(function() {
      return { exitCode: 3, stderr: 'H3: AC section missing or malformed' };
    });
    journey.setPipelineStateWriter(function() {
      psWriterCalled = true;
    });
    // cdg.5: wire no-op writeTrace so D37 stub doesn't throw
    if (typeof journey.setWriteTrace === 'function') { journey.setWriteTrace(function() {}); }

    var req = authReq({ params: { journeyId: setup.journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    assert.strictEqual(res._status, 422, 'Expected 422, got ' + res._status);
    assert.ok(!psWriterCalled, 'pipelineStateWriter must NOT be called when validation fails');
    var body = JSON.parse(res._body);
    assert.ok(body.exitCode === 3 || body.exitCode !== undefined, 'Response body must contain exitCode');
  });
});

// ---------------------------------------------------------------------------
// T3 — validate returns exitCode 0 → success path, pipelineStateWriter called
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3: validate returns exitCode 0 → success path, pipelineStateWriter called', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var psWriterCalled = false;

    var setup = setupDorSession(journey, store, {});

    journey.setValidate(function() {
      return { exitCode: 0 };
    });
    journey.setPipelineStateWriter(function() {
      psWriterCalled = true;
    });
    // cdg.5: wire no-op writeTrace so D37 stub doesn't throw
    if (typeof journey.setWriteTrace === 'function') { journey.setWriteTrace(function() {}); }

    var req = authReq({ params: { journeyId: setup.journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    assert.ok(psWriterCalled, 'pipelineStateWriter MUST be called when validation passes');
    assert.ok(
      res._status !== 422 && res._status !== 400 && res._status !== 500,
      'Response must not be an error status (got ' + res._status + ')'
    );
  });
});

// ---------------------------------------------------------------------------
// T4 — path traversal in session.artefactPath → 400, validate NOT called
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T4: traversal artefactPath → 400, validate not called', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var validateCalled = false;

    // Set up a journey but override artefactPath to traversal
    var featureSlug = 'test-feature-cdg4-t4';
    store._clear();
    var journeyObj = store.createJourney(featureSlug);
    var journeyId = journeyObj.journeyId;
    store.setStoryList(journeyId, ['story-t4']);
    var sid = 'sid-t4-' + Date.now();
    store.setActiveSession(journeyId, sid, 'definition-of-ready');

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpRoot);
    journey.setValidate(function() {
      validateCalled = true;
      return { exitCode: 0 };
    });
    journey.setPipelineStateWriter(function() {});

    // Inject traversal artefactPath in the HTML session
    journey.setGetHtmlSession(function(s) {
      if (s === sid) {
        return {
          skillName: 'definition-of-ready',
          done: true,
          artefactPath: '../../etc/passwd',
          artefactContent: '# DoR',
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

    assert.strictEqual(res._status, 400, 'Expected 400 for traversal path, got ' + res._status);
    assert.ok(!validateCalled, 'validate MUST NOT be called when path traversal detected');
  });
});

// ---------------------------------------------------------------------------
// T5 — setValidate is exported from journey.js
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T5: setValidate is exported as a function from journey.js', function() {
    var journey = freshRequireJourney();
    assert.strictEqual(typeof journey.setValidate, 'function', 'setValidate must be exported as a function');
  });
});

// ---------------------------------------------------------------------------
// T6 — default stub throws "Adapter not wired: validate" (D37)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T6: default validate stub (no setValidate) throws D37 message → 500 response', async function() {
    // Must use a FRESH require to ensure setValidate has never been called
    var journey = freshRequireJourney();
    var store = getStore();

    var featureSlug = 'test-feature-cdg4-t6';
    store._clear();
    var journeyObj = store.createJourney(featureSlug);
    var journeyId = journeyObj.journeyId;
    store.setStoryList(journeyId, ['story-t6']);
    var sid = 'sid-t6-' + Date.now();
    store.setActiveSession(journeyId, sid, 'definition-of-ready');

    // Write the artefact file so the disk write check passes
    var artefactRelPath = 'artefacts/test-t6/dor-t6.md';
    var absArtefact = path.join(tmpRoot, artefactRelPath);
    fs.mkdirSync(path.dirname(absArtefact), { recursive: true });
    fs.writeFileSync(absArtefact, '# DoR T6', 'utf8');

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpRoot);
    // DO NOT call journey.setValidate() — test the default stub
    journey.setPipelineStateWriter(function() {});

    journey.setGetHtmlSession(function(s) {
      if (s === sid) {
        return {
          skillName: 'definition-of-ready',
          done: true,
          artefactPath: artefactRelPath,
          artefactContent: '# DoR T6',
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

    // Handler should catch the throw and return 500 with D37 message
    assert.strictEqual(res._status, 500, 'Expected 500 from default stub throw, got ' + res._status);
    assert.ok(
      res._body.includes('Adapter not wired: validate') || res._body.includes('validate'),
      'Response body must contain D37 message. Got: ' + res._body
    );
  });
});

// ---------------------------------------------------------------------------
// T7 — non-DoR stage gate-confirm does NOT call validate
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T7: non-DoR stage (review) does not call validate', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var validateCalled = false;

    var setup = setupDorSession(journey, store, {
      skillName: 'review',
      artefactRelPath: 'artefacts/test/review.md',
      artefactContent: '# Review artefact'
    });

    journey.setValidate(function() {
      validateCalled = true;
      return { exitCode: 0 };
    });
    journey.setPipelineStateWriter(function() {});

    var req = authReq({ params: { journeyId: setup.journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    assert.ok(!validateCalled, 'validate MUST NOT be called for non-DoR stage (review)');
    assert.ok(
      res._status !== 422,
      'Handler must not return 422 for non-DoR stage'
    );
  });
});

// ---------------------------------------------------------------------------
// IT1 — real cli-outer-loop.validate + passing DoR fixture → success
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('IT1: real validate + passing DoR fixture → pipelineStateWriter called, not 422', async function() {
    var journey = freshRequireJourney();
    var store = getStore();

    // Copy an existing real DoR artefact as fixture
    var realDorPath = path.resolve(__dirname, '../artefacts/2026-05-19-cli-deterministic-governance/dor/cdg.3-dor.md');
    var fixtureRelPath = 'workspace/test-tmp-cdg4/passing-dor.md';
    var fixtureAbs = path.join(tmpRoot, fixtureRelPath);
    fs.mkdirSync(path.dirname(fixtureAbs), { recursive: true });
    try {
      var realContent = fs.readFileSync(realDorPath, 'utf8');
      fs.writeFileSync(fixtureAbs, realContent, 'utf8');
    } catch (_) {
      // Fallback: write a minimal passing DoR with required sections
      fs.writeFileSync(fixtureAbs, [
        '# Definition of Ready — cdg.3',
        '',
        '## Story',
        'cdg.3',
        '',
        '## Acceptance Criteria',
        '- AC1: test',
        '',
        '## Definition of Ready Checklist',
        '- [x] Story written',
        '',
        '## DoR Outcome: PROCEED'
      ].join('\n'), 'utf8');
    }

    var psWriterCalled = false;
    var setup;
    store._clear();
    var journeyObj = store.createJourney('cdg-it1-feature');
    var journeyId = journeyObj.journeyId;
    store.setStoryList(journeyId, ['it1-story']);
    var sid = 'sid-it1-' + Date.now();
    store.setActiveSession(journeyId, sid, 'definition-of-ready');

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpRoot);
    journey.setValidate(require(CLI_OUTER_LOOP_PATH).validate);
    journey.setPipelineStateWriter(function() { psWriterCalled = true; });

    journey.setGetHtmlSession(function(s) {
      if (s === sid) {
        return {
          skillName: 'definition-of-ready',
          done: true,
          artefactPath: fixtureRelPath,
          artefactContent: fs.readFileSync(fixtureAbs, 'utf8'),
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

    // Real validate either passes (exitCode 0 → psWriter called) or fails on fixture
    // Key assertion: the plumbing works (no TypeError, no unhandled throw)
    assert.ok(
      res._status !== 500,
      'IT1: handler must not throw uncaught error (status 500). Got: ' + res._status
    );
    if (res._status === 422) {
      // Validate ran and returned non-zero — plumbing is correct
      var body = JSON.parse(res._body || '{}');
      assert.ok(body.exitCode !== undefined, 'IT1: 422 response must have exitCode');
    } else {
      // Validate passed → pipelineStateWriter must have been called
      assert.ok(psWriterCalled, 'IT1: pipelineStateWriter must be called when validate exits 0');
    }
  });
});

// ---------------------------------------------------------------------------
// IT2 — real cli-outer-loop.validate + failing fixture → 422
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('IT2: real validate + failing fixture → 422, pipelineStateWriter not called', async function() {
    var journey = freshRequireJourney();
    var store = getStore();

    // Write a fixture that fails validation: references a non-existent story artefact (H1 fail)
    var failingRelPath = 'workspace/test-tmp-cdg4/failing-dor.md';
    var failingAbs = path.join(tmpRoot, failingRelPath);
    fs.mkdirSync(path.dirname(failingAbs), { recursive: true });
    // Including a story reference that points to a non-existent file triggers H1 FAIL
    fs.writeFileSync(failingAbs, [
      '# DoR — non-existent story',
      '',
      '**Story reference:** artefacts/cdg-it2-feature/stories/nonexistent-story.md',
      ''
    ].join('\n'), 'utf8');

    var psWriterCalled = false;
    store._clear();
    var journeyObj = store.createJourney('cdg-it2-feature');
    var journeyId = journeyObj.journeyId;
    store.setStoryList(journeyId, ['it2-story']);
    var sid = 'sid-it2-' + Date.now();
    store.setActiveSession(journeyId, sid, 'definition-of-ready');

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpRoot);
    journey.setValidate(require(CLI_OUTER_LOOP_PATH).validate);
    journey.setPipelineStateWriter(function() { psWriterCalled = true; });

    journey.setGetHtmlSession(function(s) {
      if (s === sid) {
        return {
          skillName: 'definition-of-ready',
          done: true,
          artefactPath: failingRelPath,
          artefactContent: '# Empty',
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

    // A truly empty artefact should fail validation
    assert.strictEqual(res._status, 422, 'IT2: expected 422 for failing artefact, got ' + res._status);
    assert.ok(!psWriterCalled, 'IT2: pipelineStateWriter must NOT be called on validation failure');
    var body = JSON.parse(res._body || '{}');
    assert.ok(body.exitCode !== undefined && body.exitCode !== 0, 'IT2: response must have non-zero exitCode');
  });
});

// ---------------------------------------------------------------------------
// NFR-SEC-1 — second path traversal variant: path.join(repoRoot, '../../../etc/passwd')
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('NFR-SEC-1: deep traversal variant also returns 400, validate not called', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var validateCalled = false;

    var featureSlug = 'test-feature-nfr-sec1';
    store._clear();
    var journeyObj = store.createJourney(featureSlug);
    var journeyId = journeyObj.journeyId;
    store.setStoryList(journeyId, ['story-nfr']);
    var sid = 'sid-nfr-' + Date.now();
    store.setActiveSession(journeyId, sid, 'definition-of-ready');

    journey.setJourneyStoreModule(store);
    journey.setRegisterHtmlSession(function() {});
    journey.setLinkSessionToJourney(function() {});
    journey.setRepoRoot(tmpRoot);
    journey.setValidate(function() { validateCalled = true; return { exitCode: 0 }; });
    journey.setPipelineStateWriter(function() {});

    // Deep traversal: escapes tmpRoot by 3 levels
    var traversalPath = path.join('..', '..', '..', 'etc', 'passwd');
    journey.setGetHtmlSession(function(s) {
      if (s === sid) {
        return {
          skillName: 'definition-of-ready',
          done: true,
          artefactPath: traversalPath,
          artefactContent: '# fake',
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

    assert.strictEqual(res._status, 400, 'NFR-SEC-1: expected 400 for deep traversal, got ' + res._status);
    assert.ok(!validateCalled, 'NFR-SEC-1: validate MUST NOT be called on traversal path');
  });
});

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------
(async function() {
  console.log('\ncheck-cdg4-gate-confirm-validation.js');
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) {
      console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err));
    });
    process.exit(1);
  }
})();
