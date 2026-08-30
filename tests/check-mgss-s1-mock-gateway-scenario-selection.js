#!/usr/bin/env node
// check-mgss-s1-mock-gateway-scenario-selection.js -- mgss-s1: let an operator
// select any mock-gateway scenario when creating a feature via /journey, and
// close the design/definition diagram-showcase + clarify fixture gaps.
//
// Story:     artefacts/2026-08-30-mock-gateway-scenario-selection/stories/mgss-s1-mock-gateway-scenario-selection-and-fixtures.md
// Test plan: artefacts/2026-08-30-mock-gateway-scenario-selection/test-plans/mgss-s1-test-plan.md

'use strict';

process.env.NODE_ENV             = process.env.NODE_ENV || 'test';
process.env.SESSION_SECRET       = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = process.env.GITHUB_CLIENT_ID || 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'test-secret';
process.env.GITHUB_CALLBACK_URL  = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback';
process.env.WUCE_REPOSITORIES    = process.env.WUCE_REPOSITORIES || 'test-owner/test-repo';

const assert = require('assert');

const journeyRoutes = require('../src/web-ui/routes/journey');
const mockGateway   = require('../src/web-ui/modules/mock-llm-gateway');

mockGateway.wireDefaultMockGatewayClient();

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(function() { passed++; console.log('  PASS: ' + name); })
    .catch(function(err) {
      failed++;
      const msg = err && err.message ? err.message : String(err);
      failures.push({ name: name, msg: msg });
      console.log('  FAIL: ' + name + '\n       ' + msg);
    });
}

const queue = [];

// ── Task 1: _mockScenarioForStage generalization ──

queue.push(function runTask1() {
  console.log('\n-- Task 1 -- _mockScenarioForStage generalization');
  return test('mockScenarioForStageAppliesAcrossEveryStageWhenSet', function() {
    mockGateway.setRuntimeMockGatewayOverride(true);
    try {
      const journey = { e2eMockScenario: 'diagram-showcase' };
      assert.strictEqual(journeyRoutes._mockScenarioForStage(journey, 'design'), 'diagram-showcase');
      assert.strictEqual(journeyRoutes._mockScenarioForStage(journey, 'definition'), 'diagram-showcase');
    } finally {
      mockGateway.resetRuntimeMockGatewayOverride();
    }
  });
});

queue.push(function runTask1b() {
  return test('mockScenarioForStagePrioritizesE2eMockScenarioOverForceFailStage', function() {
    mockGateway.setRuntimeMockGatewayOverride(true);
    try {
      const journey = { e2eMockScenario: 'diagram-showcase', e2eForceFailStage: 'design' };
      assert.strictEqual(journeyRoutes._mockScenarioForStage(journey, 'design'), 'diagram-showcase');
    } finally {
      mockGateway.resetRuntimeMockGatewayOverride();
    }
  });
});

queue.push(function runTask1c() {
  return test('mockScenarioForStageStillSupportsForceFailStageAlone', function() {
    mockGateway.setRuntimeMockGatewayOverride(true);
    try {
      const journey = { e2eForceFailStage: 'design' };
      assert.strictEqual(journeyRoutes._mockScenarioForStage(journey, 'design'), 'failure');
      assert.strictEqual(journeyRoutes._mockScenarioForStage(journey, 'definition'), undefined);
    } finally {
      mockGateway.resetRuntimeMockGatewayOverride();
    }
  });
});

// ── Task 2: handlePostJourney threading ──

function noopRes() {
  let _statusCode = null;
  const _headers = {};
  let _body = '';
  return {
    writeHead: function(code, headers) { _statusCode = code; Object.assign(_headers, headers || {}); },
    end: function(body) { if (body != null) _body = body; },
    _get: function() { return { statusCode: _statusCode, headers: _headers, body: _body }; }
  };
}

function mockReq(bodyFields) {
  return {
    session: { accessToken: 'tok', login: 'test-user', csrfToken: 'test-csrf-token' },
    body: Object.assign({}, bodyFields, { _csrf: 'test-csrf-token' }),
    params: {},
    query: {},
    headers: {},
    on: function() {},
    url: '/api/journey'
  };
}

queue.push(function runTask2() {
  console.log('\n-- Task 2 -- handlePostJourney threading');
  return test('handlePostJourneyThreadsE2eMockScenarioIntoFirstStageSession', async function() {
    mockGateway.setRuntimeMockGatewayOverride(true);
    let capturedOptions = null;
    journeyRoutes.setRegisterHtmlSession(function(sid, sessionPath, stage, options) {
      capturedOptions = options;
    });
    try {
      const req = mockReq({
        featureName: 'mgss-s1 test feature ' + Date.now(),
        startSkill: 'discovery',
        e2eMockScenario: 'diagram-showcase'
      });
      const res = noopRes();
      await journeyRoutes.handlePostJourney(req, res);
      assert.ok(capturedOptions, 'expected registerHtmlSession to have been called');
      assert.strictEqual(capturedOptions.mockScenarioName, 'diagram-showcase');
    } finally {
      journeyRoutes.setRegisterHtmlSession(null);
      mockGateway.resetRuntimeMockGatewayOverride();
    }
  });
});

queue.push(function runTask2b() {
  return test('handlePostJourneyPersistsE2eMockScenarioOnTheJourneyRecordForLaterStages', async function() {
    mockGateway.setRuntimeMockGatewayOverride(true);
    const journeyStore = require('../src/web-ui/modules/journey-store');
    journeyRoutes.setRegisterHtmlSession(function() {});
    try {
      const featureName = 'mgss-s1 persist test ' + Date.now();
      const req = mockReq({ featureName: featureName, startSkill: 'discovery', e2eMockScenario: 'diagram-showcase' });
      const res = noopRes();
      await journeyRoutes.handlePostJourney(req, res);
      const all = journeyStore.listJourneys ? journeyStore.listJourneys() : [];
      const created = all.find(function(j) { return j.featureSlug && j.featureSlug.indexOf('mgss-s1-persist-test') !== -1; });
      assert.ok(created, 'expected to find the created journey by its feature slug');
      const full = journeyStore.getJourney(created.journeyId);
      assert.strictEqual(full.e2eMockScenario, 'diagram-showcase');
    } finally {
      journeyRoutes.setRegisterHtmlSession(null);
      mockGateway.resetRuntimeMockGatewayOverride();
    }
  });
});

queue.push(function runTask2c() {
  return test('e2eMockScenarioIgnoredWhenMockGatewayDisabled', async function() {
    mockGateway.setRuntimeMockGatewayOverride(false);
    let capturedOptions = null;
    journeyRoutes.setRegisterHtmlSession(function(sid, sessionPath, stage, options) {
      capturedOptions = options;
    });
    try {
      const req = mockReq({
        featureName: 'mgss-s1 disabled test ' + Date.now(),
        startSkill: 'discovery',
        e2eMockScenario: 'diagram-showcase'
      });
      const res = noopRes();
      await journeyRoutes.handlePostJourney(req, res);
      assert.ok(capturedOptions, 'expected registerHtmlSession to have been called');
      assert.strictEqual(capturedOptions.mockScenarioName, undefined, 'expected e2eMockScenario to be ignored when the mock gateway is disabled');
    } finally {
      journeyRoutes.setRegisterHtmlSession(null);
      mockGateway.resetRuntimeMockGatewayOverride();
    }
  });
});

// ── Task 3: query-param -> hidden field ──

queue.push(function runTask3() {
  console.log('\n-- Task 3 -- query-param -> hidden field');
  return test('handleGetJourneyRendersHiddenMockScenarioFieldWhenQueryParamPresent', async function() {
    const req = {
      session: { accessToken: 'tok', login: 'test-user' },
      query: { new: '1', mockScenario: 'diagram-showcase' },
      params: {}
    };
    const res = noopRes();
    await journeyRoutes.handleGetJourney(req, res, null, null);
    const result = res._get();
    assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
    assert.ok(
      /<input[^>]*type="hidden"[^>]*name="e2eMockScenario"[^>]*value="diagram-showcase"/.test(result.body) ||
      /<input[^>]*name="e2eMockScenario"[^>]*type="hidden"[^>]*value="diagram-showcase"/.test(result.body),
      'expected a hidden e2eMockScenario input carrying the query-param value'
    );
  });
});

queue.push(function runTask3b() {
  return test('handleGetJourneyRendersNoHiddenFieldWhenQueryParamAbsent', async function() {
    const req = {
      session: { accessToken: 'tok', login: 'test-user' },
      query: { new: '1' },
      params: {}
    };
    const res = noopRes();
    await journeyRoutes.handleGetJourney(req, res, null, null);
    const result = res._get();
    assert.strictEqual(result.statusCode, 200);
    assert.ok(result.body.indexOf('name="e2eMockScenario"') === -1, 'did not expect a hidden e2eMockScenario field when no query param was given');
  });
});

// ── Task 4: unrecognized-scenario regression ──

queue.push(function runTask4() {
  console.log('\n-- Task 4 -- unrecognized-scenario regression');
  return test('unrecognizedScenarioNameStillThrowsNoFixtureFoundError', function() {
    assert.throws(function() {
      mockGateway.getMockResponse('design', 'mock', 'nonexistent-scenario-xyz');
    }, /No fixture found/);
  });
});

// ── Task 5: sequence marker in diagram-showcase fixtures ──

function extractCanvasTypes(text) {
  const re = /---CANVAS-JSON:\s*(\{[\s\S]*?\})\s*---/g;
  const types = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    try { types.push(JSON.parse(m[1]).type); } catch (_) { /* skip */ }
  }
  return types;
}

queue.push(function runTask5() {
  console.log('\n-- Task 5 -- sequence marker in diagram-showcase fixtures');
  return test('designDiagramShowcaseIncludesSequenceMarker', function() {
    const result = mockGateway.getMockResponse('design', 'mock', 'diagram-showcase');
    const types = extractCanvasTypes(result.text);
    assert.ok(types.indexOf('sequence') !== -1, 'expected a sequence marker, found types: ' + types.join(', '));
    assert.ok(types.indexOf('system-architecture') !== -1, 'expected the pre-existing system-architecture marker to remain');
  });
});

queue.push(function runTask5b() {
  return test('definitionDiagramShowcaseIncludesSequenceMarker', function() {
    const result = mockGateway.getMockResponse('definition', 'mock', 'diagram-showcase');
    const types = extractCanvasTypes(result.text);
    assert.ok(types.indexOf('sequence') !== -1, 'expected a sequence marker, found types: ' + types.join(', '));
    assert.ok(types.indexOf('program-design') !== -1, 'expected the pre-existing program-design marker to remain');
  });
});

// ── Task 6: clarify fixtures ──

queue.push(function runTask6() {
  console.log('\n-- Task 6 -- clarify fixtures');
  return test('clarifySuccessFixtureIsWellFormed', function() {
    const turn0 = mockGateway.getMockResponse('clarify', 'mock', 'success', 0);
    const turn1 = mockGateway.getMockResponse('clarify', 'mock', 'success', 1);
    assert.ok(/Q:/.test(turn0.text), 'expected turn 0 to contain a clarifying question');
    assert.ok(/Clarification complete/i.test(turn1.text), 'expected turn 1 to contain the completion phrase');
    assert.ok(turn0.text.indexOf('CANVAS-JSON') === -1, 'clarify must never emit a CANVAS-JSON marker');
    assert.ok(turn1.text.indexOf('CANVAS-JSON') === -1, 'clarify must never emit a CANVAS-JSON marker');
  });
});

queue.push(function runTask6b() {
  return test('clarifyFailureFixtureIsWellFormed', function() {
    const result = mockGateway.getMockResponse('clarify', 'mock', 'failure');
    assert.ok(/no discovery artefact found/i.test(result.text), 'expected the entry-condition failure message');
  });
});

// ── Task 7: NFR ──

queue.push(function runTask7() {
  console.log('\n-- Task 7 -- NFR');
  return test('e2eMockScenarioNeverActivatesInProduction', async function() {
    const originalNodeEnv = process.env.NODE_ENV;
    let capturedOptions = null;
    journeyRoutes.setRegisterHtmlSession(function(sid, sessionPath, stage, options) {
      capturedOptions = options;
    });
    process.env.NODE_ENV = 'production';
    try {
      assert.strictEqual(mockGateway.isMockGatewayEnabled(), false, 'expected the mock gateway to be hard-disabled under NODE_ENV=production');
      const req = mockReq({
        featureName: 'mgss-s1 prod test ' + Date.now(),
        startSkill: 'discovery',
        e2eMockScenario: 'diagram-showcase'
      });
      const res = noopRes();
      await journeyRoutes.handlePostJourney(req, res);
      assert.ok(capturedOptions, 'expected registerHtmlSession to have been called');
      assert.strictEqual(capturedOptions.mockScenarioName, undefined, 'expected e2eMockScenario to have zero effect in production');
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      journeyRoutes.setRegisterHtmlSession(null);
    }
  });
});

(async function run() {
  console.log('mgss-s1 -- Mock-gateway scenario selection and fixture gaps\n');
  for (const fn of queue) { await fn(); }
  console.log('\n-----------------------------------------');
  console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailed tests:');
    failures.forEach(function(f) { console.log('  x ' + f.name + '\n    ' + f.msg); });
    process.exit(1);
  } else {
    console.log('\nAll tests passed.');
    process.exit(0);
  }
})();
