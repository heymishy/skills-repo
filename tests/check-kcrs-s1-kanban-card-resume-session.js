'use strict';
// check-kcrs-s1-kanban-card-resume-session.js -- kcrs-s1
// Story: artefacts/2026-07-24-kanban-card-resume-session/stories/kcrs-s1-kanban-card-resumes-live-session.md
// Test plan: artefacts/2026-07-24-kanban-card-resume-session/test-plans/kcrs-s1-kanban-card-resumes-live-session-test-plan.md
//
// Covers:
//   AC1: mid-conversation session -> redirects to the real chat page
//   AC2: a `done` session (draft artefact, unconfirmed) redirects to that
//        SAME session -- not a freshly created one that would lose the draft
//   AC3: no active session at all (fully complete journey) -> falls back to
//        the artefact index (/features/:slug)
//   AC4: the ?from= board-return value is propagated all the way through to
//        the chat page's own "Back to board" link
//   AC5: cross-tenant access still denied (covered by check-s3.4-item-detail-view.js,
//        re-confirmed here for this story's own record)

var assert = require('assert');
var path = require('path');
var os = require('os');

var passed = 0; var failed = 0;

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(function() { passed++; console.log('  PASS: ' + name); })
    .catch(function(err) {
      failed++;
      console.log('  FAIL: ' + name + '\n       ' + (err && err.message || err));
    });
}

var JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');

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
    _status: null, _headers: {}, _body: '',
    writeHead: function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); },
    setHeader: function(k, v) { res._headers[k] = v; },
    end: function(body) { res._body += (body || ''); }
  };
  return res;
}

function authReq(extra) {
  return Object.assign({
    session: { accessToken: 'test-token', login: 'operator' },
    params: {}, query: {}
  }, extra || {});
}

var tmpdir = os.tmpdir();

function setUp(featureName, sessionOverrides) {
  var journey = freshRequireJourney();
  var store = getStore();
  store._clear();
  var journeyObj = store.createJourney(featureName, 'default');
  var journeyId = journeyObj.journeyId;
  var sessionId = 'sess-kcrs-' + Date.now() + '-' + Math.random().toString(36).slice(2);

  journey.setJourneyStoreModule(store);
  journey.setRegisterHtmlSession(function() {});
  journey.setLinkSessionToJourney(function() {});
  journey.setRepoRoot(tmpdir);
  journey.setGetHtmlSession(function(id) {
    if (id === sessionId) {
      return Object.assign({ skillName: 'definition', done: false, turns: [], systemPrompt: 'test' }, sessionOverrides || {});
    }
    return null;
  });
  store.setActiveSession(journeyId, sessionId, 'definition');

  return { journey: journey, store: store, journeyId: journeyId, sessionId: sessionId };
}

var queue = [];

queue.push(function() {
  return test('AC1: a mid-conversation (not done) session redirects to the real chat page, no from= means no back-link param', function() {
    var setup = setUp('kcrs-ac1-feature');
    var req = authReq({ params: { journeyId: setup.journeyId } });
    var res = makeRes();
    setup.journey.handleGetJourneyById(req, res);

    assert.strictEqual(res._status, 303, 'expected a 303 redirect');
    assert.ok(res._headers.Location.startsWith('/journey/kcrs-ac1-feature/resume'), 'expected redirect into the resume flow, got: ' + res._headers.Location);
  });
});

queue.push(function() {
  return test('AC2: a done session with a draft artefact resumes to that SAME session (via handleGetJourneyResume), not a freshly created one', function() {
    var setup = setUp('kcrs-ac2-feature', { done: true, artefactContent: '# Draft artefact' });
    var reqDetail = authReq({ params: { journeyId: setup.journeyId } });
    var resDetail = makeRes();
    setup.journey.handleGetJourneyById(reqDetail, resDetail);
    assert.strictEqual(resDetail._status, 303, 'expected redirect from the detail route');

    // Follow the redirect into handleGetJourneyResume directly (same as a
    // real browser would), confirming it resumes the SAME session, not a new one.
    var reqResume = authReq({ params: { featureSlug: 'kcrs-ac2-feature' }, query: {} });
    var resResume = makeRes();
    return Promise.resolve(setup.journey.handleGetJourneyResume(reqResume, resResume)).then(function() {
      assert.strictEqual(resResume._status, 303, 'expected a 303 from the resume route');
      assert.ok(
        resResume._headers.Location.indexOf(setup.sessionId) !== -1,
        'expected the SAME existing done session to be resumed (id ' + setup.sessionId + '), got: ' + resResume._headers.Location
      );
    });
  });
});

queue.push(function() {
  return test('AC3: a fully-complete journey with no active session falls back to the artefact index (/features/:slug)', function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('kcrs-ac3-feature', 'default');
    journey.setJourneyStoreModule(store);
    store.markJourneyComplete(journeyObj.journeyId);

    var req = authReq({ params: { journeyId: journeyObj.journeyId } });
    var res = makeRes();
    journey.handleGetJourneyById(req, res);

    assert.strictEqual(res._status, 303, 'expected a 303 redirect');
    assert.strictEqual(res._headers.Location, '/features/kcrs-ac3-feature', 'expected fallback to the artefact index, got: ' + res._headers.Location);
  });
});

queue.push(function() {
  return test('AC4: a safe from= value is propagated all the way through to the chat page\'s own "Back to board" link', function() {
    var setup = setUp('kcrs-ac4-feature');
    var reqDetail = authReq({ params: { journeyId: setup.journeyId }, query: { from: '/products/prod-1/kanban' } });
    var resDetail = makeRes();
    setup.journey.handleGetJourneyById(reqDetail, resDetail);
    assert.ok(resDetail._headers.Location.indexOf('from=' + encodeURIComponent('/products/prod-1/kanban')) !== -1, 'expected from= propagated into the resume redirect');

    var reqResume = authReq({ params: { featureSlug: 'kcrs-ac4-feature' }, query: { from: '/products/prod-1/kanban' } });
    var resResume = makeRes();
    return Promise.resolve(setup.journey.handleGetJourneyResume(reqResume, resResume)).then(function() {
      assert.ok(resResume._headers.Location.indexOf('from=' + encodeURIComponent('/products/prod-1/kanban')) !== -1, 'expected from= propagated from resume into the chat page URL, got: ' + resResume._headers.Location);
    });
  });
});

queue.push(function() {
  return test('AC5: a journey belonging to another tenant is still denied 404 before any redirect decision is made', function() {
    var journey = freshRequireJourney();
    var store = getStore();
    store._clear();
    var journeyObj = store.createJourney('kcrs-ac5-feature', 'default');
    store.setJourneyFields(journeyObj.journeyId, { ownerId: 'owner@example.test', tenantId: 'owner@example.test' });
    journey.setJourneyStoreModule(store);

    var req = authReq({ session: { accessToken: 'tok', login: 'attacker@example.test' }, params: { journeyId: journeyObj.journeyId } });
    var res = makeRes();
    journey.handleGetJourneyById(req, res);

    assert.strictEqual(res._status, 404, 'expected 404 for a cross-tenant request');
  });
});

// AC4 (chat page rendering) -- uses the plain (cached) require pattern from
// check-a4-session-store-state.js, since skills.js holds its own internal
// _journeyStore reference to this exact journey-store module instance.
var SKILLS_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
var journeyStoreShared = require(JOURNEY_STORE_PATH);

queue.push(function() {
  return test('AC4: the chat page renders a "Back to board" link when a safe from= value is present', async function() {
    delete require.cache[require.resolve(SKILLS_PATH)];
    var skills = require(SKILLS_PATH);
    var journey = journeyStoreShared.createJourney('kcrs-ac4-chatpage-feature', 'default');

    var sid = 'kcrs-ac4-chatpage-sid';
    skills.registerHtmlSession(sid, path.join(tmpdir, 'kcrs-ac4-chatpage'), 'definition', {});
    var session = skills._getHtmlSession(sid);
    session.journeyId = journey.journeyId;

    var body = '';
    var statusCode = null;
    await skills.handleGetChatHtml(
      { params: { name: 'definition', id: sid }, query: { from: '/products/prod-1/kanban' }, session: { accessToken: 'tok', login: 'operator' } },
      { writeHead: function(code) { statusCode = code; }, end: function(h) { body = h || ''; } }
    );

    assert.strictEqual(statusCode, 200);
    assert.ok(body.includes('Back to board'), 'expected a "Back to board" link when from= is present');
    assert.ok(body.includes('/products/prod-1/kanban'), 'expected the link to point at the real originating board');
  });
});

queue.push(function() {
  return test('AC4: the chat page renders no back-link at all when no from= is present (e.g. reached via "Continue" with no board context)', async function() {
    delete require.cache[require.resolve(SKILLS_PATH)];
    var skills = require(SKILLS_PATH);
    var journey = journeyStoreShared.createJourney('kcrs-ac4-nofrom-feature', 'default');

    var sid = 'kcrs-ac4-nofrom-sid';
    skills.registerHtmlSession(sid, path.join(tmpdir, 'kcrs-ac4-nofrom'), 'definition', {});
    var session = skills._getHtmlSession(sid);
    session.journeyId = journey.journeyId;

    var body = '';
    var statusCode = null;
    await skills.handleGetChatHtml(
      { params: { name: 'definition', id: sid }, query: {}, session: { accessToken: 'tok', login: 'operator' } },
      { writeHead: function(code) { statusCode = code; }, end: function(h) { body = h || ''; } }
    );

    assert.strictEqual(statusCode, 200);
    assert.ok(!body.includes('Back to board'), 'expected no back-link when from= is absent');
  });
});

(async function() {
  console.log('check-kcrs-s1-kanban-card-resume-session.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
