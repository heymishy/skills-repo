// check-s3.4-item-detail-view.js -- TDD tests for s3.4 (Epic 3, kanban boards feature)
// Story: artefacts/2026-07-24-interactive-kanban-boards/stories/s3.4-item-detail-view.md
// Test plan: artefacts/2026-07-24-interactive-kanban-boards/test-plans/s3.4-item-detail-view-test-plan.md
//
// Route/identifier investigation outcome (documented in decisions.md): the
// confirmed destination is GET /journey/:id (handleGetJourneyById, journey.js)
// -- card.id already IS the journeyId, no separate identifier mapping needed.
// This route already implemented requireJourneyAccess(journey, session,
// POLICY.TENANT) -- the same 404-not-403 tenant-ownership pattern used at 3
// other call sites in journey.js -- but was never registered as a live route
// before this story (confirmed via server.js's router() having no matching
// branch), and never had a "back to board" link or artefacts link. This
// story wires the route, adds those two links, and makes kanban cards real
// links to it (AC1).
//
// Covers: Unit (cardIsRealLinkWithCorrectIdentifier), Integration
// (destinationShowsUsefulState, clearWayBackToBoard, crossTenantDetailAccessDenied404).

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(function() { passed++; console.log('  PASS: ' + name); })
    .catch(function(err) {
      failed++;
      failures.push({ name: name, err: err });
      console.log('  FAIL: ' + name + '\n       ' + (err && err.message || err));
    });
}

const { _renderKanbanColumns } = require('../src/web-ui/views/kanban-view');

const JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
const JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
const SERVER_PATH = path.resolve(__dirname, '../src/web-ui/server.js');

function freshJourney() {
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch (_) {}
  const journey = require(JOURNEY_PATH);
  const store = require(JOURNEY_STORE_PATH);
  store._clear();
  return { journey: journey, store: store };
}

function makeMockRes() {
  return {
    _statusCode: null, _headers: {}, _body: '',
    writeHead(code, headers) { this._statusCode = code; this._headers = headers || {}; },
    end(body) { this._body += (body || ''); }
  };
}

function makeAuthReq(login, extra) {
  return Object.assign({
    session: { accessToken: 'test-token', login: login || 'operator' },
    params: {},
    query: {}
  }, extra || {});
}

async function main() {
  const queue = [];

  // ===========================================================================
  // AC1 -- card is a real link with the correct identifier
  // ===========================================================================

  queue.push(function() {
    return test('cardIsRealLinkWithCorrectIdentifier: a rendered kanban card is a real <a href="/journey/:id"> element, not a plain <div>', function() {
      const html = _renderKanbanColumns({
        columns: [{ stage: 'review', cards: [{ id: 'journey-abc-123', title: 'Test Feature', health: 'green' }] }]
      });
      // s2.2 adds a title="" attribute (full untruncated title, AC3) between href and
      // the tag close, so match on the required attributes and tolerate any others.
      assert.ok(/<a class="kb-card kb-card-link[^"]*" data-journey-id="journey-abc-123" href="\/journey\/journey-abc-123"[^>]*>/.test(html),
        'expected a real <a> element linking to /journey/journey-abc-123, got: ' + html.slice(0, 300));
      assert.ok(!/<div class="kb-card /.test(html), 'expected the card wrapper NOT to be a plain <div> anymore');
    });
  });

  queue.push(function() {
    return test('cardIsRealLinkWithCorrectIdentifier: the Advance button inside a ready card stops its click reaching the wrapping <a>', function() {
      const html = _renderKanbanColumns({
        columns: [{ stage: 'review', cards: [{ id: 'journey-ready-1', title: 'Ready Feature', health: 'green', ready: true }] }]
      });
      assert.ok(/onclick="kbAdvanceCard\(this, event\)"/.test(html), 'expected kbAdvanceCard to receive the click event to stop it reaching the wrapping <a>');
      assert.ok(/function kbAdvanceCard\(btn, event\)/.test(html), 'expected kbAdvanceCard to accept an event parameter');
      assert.ok(/event\.preventDefault\(\); event\.stopPropagation\(\);/.test(html), 'expected kbAdvanceCard to actually stop the event from reaching the wrapping <a>');
    });
  });

  // ===========================================================================
  // AC2 -- destination shows useful state (current stage + artefacts link)
  // ===========================================================================

  queue.push(function() {
    return test('destinationShowsUsefulState: GET /journey/:id shows the current stage and a link to artefact files', async function() {
      const { journey, store } = freshJourney();
      const j = store.createJourney('s3-4-ac2-feature', 'default');
      store.setJourneyFields(j.journeyId, { activeSkill: 'review' });
      journey.setJourneyStoreModule(store);

      const req = makeAuthReq('operator', { params: { journeyId: j.journeyId } });
      const res = makeMockRes();
      await journey.handleGetJourneyById(req, res);

      assert.strictEqual(res._statusCode, 200, 'expected 200, got ' + res._statusCode);
      assert.ok(res._body.includes('review'), 'expected the current stage (review) to be shown');
      assert.ok(res._body.includes('/features/s3-4-ac2-feature'), 'expected a link to the artefact files (/features/:slug)');
    });
  });

  // ===========================================================================
  // AC3 -- a clear way back to the board exists
  // ===========================================================================

  queue.push(function() {
    return test('clearWayBackToBoard: the destination page includes a back-to-board link', async function() {
      const { journey, store } = freshJourney();
      const j = store.createJourney('s3-4-ac3-feature', 'default');
      journey.setJourneyStoreModule(store);

      const req = makeAuthReq('operator', { params: { journeyId: j.journeyId }, query: { from: '/products/prod-1/kanban' } });
      const res = makeMockRes();
      await journey.handleGetJourneyById(req, res);

      assert.strictEqual(res._statusCode, 200, 'expected 200, got ' + res._statusCode);
      assert.ok(res._body.includes('Back to board'), 'expected a "Back to board" link');
      assert.ok(res._body.includes('/products/prod-1/kanban'), 'expected the back-link to point at the real originating board (a safe, allowlisted from= value)');
    });
  });

  queue.push(function() {
    return test('clearWayBackToBoard: an unsafe/unrecognised from= value falls back to the tenant dashboard board, never an open redirect', async function() {
      const { journey, store } = freshJourney();
      const j = store.createJourney('s3-4-ac3b-feature', 'default');
      journey.setJourneyStoreModule(store);

      const req = makeAuthReq('operator', { params: { journeyId: j.journeyId }, query: { from: '//evil.example.com/phishing' } });
      const res = makeMockRes();
      await journey.handleGetJourneyById(req, res);

      assert.strictEqual(res._statusCode, 200, 'expected 200, got ' + res._statusCode);
      assert.ok(!res._body.includes('evil.example.com'), 'expected the unsafe from= value to be rejected, not reflected into the page');
      assert.ok(res._body.includes('/dashboard?view=board'), 'expected the safe fallback destination');
    });
  });

  // ===========================================================================
  // AC4 -- cross-tenant detail access is denied (404, not 403)
  // ===========================================================================

  queue.push(function() {
    return test('crossTenantDetailAccessDenied404: a journey belonging to another tenant/owner returns 404, not the real content', async function() {
      const { journey, store } = freshJourney();
      const j = store.createJourney('s3-4-ac4-feature', 'default');
      store.setJourneyFields(j.journeyId, { ownerId: 'owner-login@example.test', tenantId: 'owner-login@example.test' });
      journey.setJourneyStoreModule(store);

      const req = makeAuthReq('different-login@example.test', { params: { journeyId: j.journeyId } });
      const res = makeMockRes();
      await journey.handleGetJourneyById(req, res);

      assert.strictEqual(res._statusCode, 404, 'expected 404 (not 403, per this repo\'s POLICY.TENANT convention), got ' + res._statusCode);
      assert.ok(!res._body.includes('s3-4-ac4-feature'), 'expected no real journey data leaked in the 404 response');
    });
  });

  queue.push(function() {
    return test('crossTenantDetailAccessDenied404: the owning user\'s own request still succeeds (the guard is not overly broad)', async function() {
      const { journey, store } = freshJourney();
      const j = store.createJourney('s3-4-ac4b-feature', 'default');
      store.setJourneyFields(j.journeyId, { ownerId: 'owner-login@example.test', tenantId: 'owner-login@example.test' });
      journey.setJourneyStoreModule(store);

      const req = makeAuthReq('owner-login@example.test', { params: { journeyId: j.journeyId } });
      const res = makeMockRes();
      await journey.handleGetJourneyById(req, res);

      assert.strictEqual(res._statusCode, 200, 'expected the owning user\'s own request to still succeed, got ' + res._statusCode);
    });
  });

  // ===========================================================================
  // Route wiring -- confirms server.js actually registers the route (a real
  // gap this story closes: handleGetJourneyById existed but was never called
  // from any live route before this story).
  // ===========================================================================

  queue.push(function() {
    return test('route wiring: server.js registers GET /journey/:id -> handleGetJourneyById', function() {
      const src = fs.readFileSync(SERVER_PATH, 'utf8');
      assert.ok(/pathname\.match\(\/\^\\\/journey\\\/\[\^\/\]\+\$\/\)/.test(src), 'expected server.js to register a single-segment /journey/:id route');
      assert.ok(/handleGetJourneyById\(req, res\)/.test(src), 'expected the route to call handleGetJourneyById');
    });
  });

  console.log('check-s3.4-item-detail-view.js');
  for (let i = 0; i < queue.length; i++) {
    await queue[i]();
  }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
}

main();
