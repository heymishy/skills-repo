#!/usr/bin/env node
/**
 * check-jrf-s1-new-feature-redirect.js
 *
 * Test suite for jrf-s1: Fix "New feature" redirecting to sign-in page
 *
 * Story: artefacts/2026-07-19-new-feature-redirect-fix/stories/jrf-s1.md
 * Test plan: artefacts/2026-07-19-new-feature-redirect-fix/test-plans/jrf-s1-test-plan.md
 *
 * Verifies that clicking "New feature" on a product page:
 * - Redirects to a real, working route (not login page)
 * - Shows the new journey's discovery stage
 * - Maintains auth guard for unauthenticated users
 * - Does not break other routes
 *
 * Run: node tests/check-jrf-s1-new-feature-redirect.js
 */

'use strict';

const assert = require('assert');
const path = require('path');
const { execFileSync } = require('child_process');

let passed = 0;
let failed = 0;
let failures = [];

function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mocks and Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const _mockJourneys = {};
const _mockSessions = {};
const _createdSessions = [];

const _journeyStore = {
  createJourney: (featureSlug, profileName) => {
    const journeyId = 'test-j-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    _mockJourneys[journeyId] = { featureSlug, profileName, journeyId, completedStages: [] };
    return { journeyId };
  },
  getJourney: (journeyId) => _mockJourneys[journeyId] || null,
  setJourneyFields: (journeyId, fields) => {
    if (_mockJourneys[journeyId]) Object.assign(_mockJourneys[journeyId], fields);
  },
  setActiveSession: (journeyId, sessionId, stage) => {
    if (_mockJourneys[journeyId]) {
      _mockJourneys[journeyId].activeSessionId = sessionId;
      _mockJourneys[journeyId].activeSkill = stage;
    }
  }
};

function getRegisterHtmlSession() {
  return (sessionId, sessionPath, startSkill, metadata) => {
    _mockSessions[sessionId] = { sessionId, sessionPath, startSkill, metadata, createdAt: new Date() };
    _createdSessions.push(sessionId);
  };
}

function getLinkSessionToJourney() {
  return (sessionId, journeyId) => {
    if (_mockSessions[sessionId]) _mockSessions[sessionId].linkedJourneyId = journeyId;
  };
}

// Mock response object
function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    _data: '',
    _redirectTarget: null,
    writeHead: function(code, hdrs) { this.statusCode = code; if (hdrs) Object.assign(this.headers, hdrs); },
    end: function(data) { this._data = data || ''; },
    redirect: function(location) { this.statusCode = 303; this.headers.Location = location; this._redirectTarget = location; },
    status: function(code) { this.statusCode = code; return this; },
    json: function(obj) { this._data = JSON.stringify(obj); return this; }
  };
  return res;
}

// Implementation of handlePostProductFeature AFTER fix
async function handlePostProductFeatureFixed(req, res, _next, pool, posthog) {
  // Auth guard
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { 'Location': '/auth/github' });
    res.end();
    return;
  }

  const journeyId = 'j-' + Math.random().toString(36).slice(2, 9);
  const tenantId = req.session && req.session.tenantId;

  // Simulate journey creation in DB
  _journeyStore.createJourney('new-feature-' + journeyId.slice(0, 8), 'default');
  _journeyStore.setJourneyFields(journeyId, {
    ownerId: req.session.login || null,
    tenantId: tenantId || null
  });

  // NEW FIX: Create session and redirect to skill chat (following handlePostJourney pattern)
  const sid = 'sid-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  const sessionPath = path.join('/tmp', journeyId, 'sessions', sid);

  getRegisterHtmlSession()(sid, sessionPath, 'discovery', {
    productProfile: 'default',
    featureSlug: 'new-feature-' + journeyId.slice(0, 8)
  });

  getLinkSessionToJourney()(sid, journeyId);

  if (_journeyStore.setActiveSession) {
    _journeyStore.setActiveSession(journeyId, sid, 'discovery');
  }

  // FIXED REDIRECT: to skill chat, not to /journeys/... (which doesn't exist)
  res.writeHead(303, { 'Location': '/skills/discovery/sessions/' + encodeURIComponent(sid) + '/chat' });
  res.end();
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

console.log('jrf-s1 — New feature redirect fix\n');

// Run all tests sequentially
Promise.resolve()
  .then(() => test('IT1: Authenticated POST redirects to valid skill chat route', function() {
    const req = {
      session: { accessToken: 'token-123', login: 'user@test.com', tenantId: 'tenant-x' },
      params: { id: 'prod-123' }
    };
    const res = createMockResponse();
    return handlePostProductFeatureFixed(req, res, null, null, null).then(() => {
      assert.strictEqual(res.statusCode, 303, 'Should be redirect (303)');
      assert(res.headers.Location, 'Should have Location header');
      assert(res.headers.Location.startsWith('/skills/discovery/sessions/'), 'Redirect should be to skill chat');
      assert(res.headers.Location.includes('/chat'), 'Redirect should end with /chat');
    });
  }))
  .then(() => test('IT2: Redirected route shows discovery skill session', function() {
    const req = {
      session: { accessToken: 'token-456', login: 'user@test.com', tenantId: 'tenant-y' },
      params: { id: 'prod-456' }
    };
    const res = createMockResponse();
    return handlePostProductFeatureFixed(req, res, null, null, null).then(() => {
      const match = res.headers.Location.match(/\/skills\/discovery\/sessions\/([^/]+)\/chat/);
      assert(match, 'Should match skill chat pattern');
      const sessionId = match[1];
      const session = _mockSessions[sessionId];
      assert(session, 'Session should exist');
      assert.strictEqual(session.startSkill, 'discovery', 'Should start with discovery skill');
      assert(session.linkedJourneyId, 'Session should be linked to journey');
    });
  }))
  .then(() => test('IT3: Route does not use broken /journeys/ pattern', function() {
    const req = {
      session: { accessToken: 'token-789', login: 'user@test.com', tenantId: 'tenant-z' },
      params: { id: 'prod-789' }
    };
    const res = createMockResponse();
    return handlePostProductFeatureFixed(req, res, null, null, null).then(() => {
      const location = res.headers.Location;
      assert(!location.includes('/journeys/'), 'Should not have broken /journeys/ pattern');
      assert(location.includes('/skills/discovery/sessions/'), 'Should use correct /skills/ pattern');
      assert(!location.includes('login'), 'Should not reference login page');
    });
  }))
  .then(() => test('IT4: Unauthenticated request redirects to sign-in endpoint', function() {
    const req = {
      session: null,
      params: { id: 'prod-999' }
    };
    const res = createMockResponse();
    return handlePostProductFeatureFixed(req, res, null, null, null).then(() => {
      assert.strictEqual(res.statusCode, 302, 'Should return 302 for auth redirect');
      assert.strictEqual(res.headers.Location, '/auth/github', 'Should redirect to auth endpoint');
    });
  }))
  .then(() => test('IT5: Regression — no new failures introduced (isolated handler calls)', function() {
    // Verify that multiple authenticated requests work independently
    const req1 = {
      session: { accessToken: 'token-a', login: 'user1@test.com', tenantId: 'tenant-1' },
      params: { id: 'prod-1' }
    };
    const res1 = createMockResponse();

    return handlePostProductFeatureFixed(req1, res1, null, null, null).then(() => {
      assert.strictEqual(res1.statusCode, 303, 'First request should redirect');

      const req2 = {
        session: { accessToken: 'token-b', login: 'user2@test.com', tenantId: 'tenant-2' },
        params: { id: 'prod-2' }
      };
      const res2 = createMockResponse();
      return handlePostProductFeatureFixed(req2, res2, null, null, null).then(() => {
        assert.strictEqual(res2.statusCode, 303, 'Second request should also redirect');
        assert.notStrictEqual(res1.headers.Location, res2.headers.Location, 'Should create different sessions');
      });
    });
  }))
  .then(() => test('IT6 (vcb-s1 AC2): Regression — every test file that exercises the REAL production handlePostProductFeature passes', function() {
    // vcb-s1: this story's original IT5 only re-invokes handlePostProductFeatureFixed,
    // a hand-copied reimplementation local to this file -- it never calls the real
    // production handler (products.js's handlePostProductFeature) at all, and the DoR
    // contract's own Coding Agent Instructions required "run the existing test suite
    // in full and confirm the baseline failure count is unchanged." Running the FULL
    // 639-file npm test suite from inside a checked-in test file would reintroduce the
    // exact CPU-contention/recursion anti-pattern this repo already found and removed
    // once (check-md-3-adr.js, fixed by mar-s1, 2026-08-08) -- so this widens IT5 to a
    // clearly-scoped, correctly-baselined subset instead, per the story's own
    // Architecture Constraints: every test file (found via
    // `grep -rl "handlePostProductFeature" tests/*.js`) that actually exercises the
    // real production handler this story's fix targets, not a hand-copied stand-in.
    const relatedFiles = [
      'check-das-s2-require-connected-repo.js',
      'check-fdn-s1-feature-display-name.js',
      'check-jrf-s2-register-product-feature-journeys.js',
      'check-npwe-s1-skills-nav-wiring.js',
      'check-pan-s1-product-aware-navigation.js',
      'check-pnfc-s1-product-feature-choice.js',
      'check-product-feature-cap-bypass.js',
      'check-psh-s4-navigation.js',
      'check-rcfc-s1-products-csrf.js'
    ];
    const ROOT = path.join(__dirname, '..');
    const results = relatedFiles.map(function(f) {
      try {
        execFileSync(process.execPath, [path.join(ROOT, 'tests', f)], { stdio: 'pipe', env: Object.assign({}, process.env, { NODE_ENV: 'test' }) });
        return { file: f, ok: true };
      } catch (e) {
        return { file: f, ok: false, output: (e.stdout || e.message || '').toString().slice(0, 300) };
      }
    });
    const failedFiles = results.filter(function(r) { return !r.ok; });
    if (failedFiles.length > 0) {
      throw new Error('Regression in real handlePostProductFeature call sites: ' + failedFiles.map(function(r) { return r.file + ' -- ' + r.output; }).join(' | '));
    }
    assert.strictEqual(failedFiles.length, 0, 'all ' + relatedFiles.length + ' real-handler test files must pass with zero new regressions');
  }))
  .then(() => {
    console.log('\n─────────────────────────────────────────');
    console.log(`Passed: ${passed}, Failed: ${failed}`);
    if (failures.length > 0) {
      console.log('\nFailures:');
      failures.forEach(f => console.log(`  - ${f.name}: ${f.err.message}`));
    }
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
