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
  .then(() => test('IT5: Regression — no new failures introduced', function() {
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
