'use strict';
// check-frsr-s1-feature-row-session-resume.js — frsr-s1
// Story: artefacts/2026-07-24-feature-row-session-resume-link/stories/frsr-s1.md
// Test plan: artefacts/2026-07-24-feature-row-session-resume-link/test-plans/frsr-s1-test-plan.md
//
// Covers:
//   AC1: feature rows in a product's view are real, keyboard-activatable links
//   AC2: completeStage() records the sessionId active at completion time
//   AC3: the artefact-index page shows a "Resume conversation" link alongside
//        the existing "View" link when a stage's sessionId is resolvable
//   AC4: the resume link reaches handleGetChatHtml's own real rendering, unmodified
//   AC5: an evicted/unresolvable session shows the existing honest "not found"
//        message, not a silent failure
//   NFR-Performance: the featureSlug->journeyId->completedStages lookup runs
//        once per page render, not once per artefact row
//   NFR-Security: the resume link is subject to the exact same tenant/
//        ownership guard handleGetChatHtml already enforces

var assert = require('assert');
var path = require('path');
var crypto = require('crypto');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var result = fn();
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

var PRODUCTS_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
var FEATURES_PATH = path.resolve(__dirname, '../src/web-ui/routes/features.js');
var SKILLS_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');

function freshRequire(p) {
  try { delete require.cache[require.resolve(p)]; } catch (_) {}
  return require(p);
}

function freshRequireAll() {
  try { delete require.cache[require.resolve(PRODUCTS_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(FEATURES_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(SKILLS_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch (_) {}
  return {
    products: require(PRODUCTS_PATH),
    features: require(FEATURES_PATH),
    skills: require(SKILLS_PATH),
    journeyStore: require(JOURNEY_STORE_PATH)
  };
}

function mockRes() {
  var r = { statusCode: null, headers: {}, body: '' };
  r.writeHead = function(code, hdrs) { r.statusCode = code; if (hdrs) Object.assign(r.headers, hdrs); };
  r.end = function(body) { r.body = body != null ? String(body) : ''; };
  return r;
}

function mockReq(overrides) {
  return Object.assign({
    session: { accessToken: 'test-token', userId: 42, login: 'alice' },
    headers: { accept: 'text/html' },
    params: {}
  }, overrides || {});
}

var TEST_ARTEFACTS = [
  { type: 'discovery', createdAt: '2026-07-24', path: 'artefacts/frsr-test-feature/discovery.md' },
  { type: 'definition', createdAt: '2026-07-24', path: 'artefacts/frsr-test-feature/definition.md' }
];

var queue = [];

// ===========================================================================
// AC1 — feature rows are real, keyboard-activatable links
// ===========================================================================

queue.push(function() {
  console.log('\n[frsr-s1] AC1 -- feature row renders as a real link');
  return test('_renderPvcItemRow: output contains a real <a href="/features/..."> wrapping the row, not a bare <div>', function() {
    var m = freshRequireAll();
    var item = { slug: 'frsr-test-feature', name: 'FRSR Test Feature', health: 'green', coverageLabel: '80%', stage: 'definition' };
    var html = m.products._renderPvcItemRow(item);
    assert.ok(/<a class="pvc-item-link" href="\/features\/frsr-test-feature"/.test(html), 'expected a real <a href="/features/frsr-test-feature"> link wrapping the card');
    assert.ok(!/^<li[^>]*><div>/.test(html.replace(/\s+/g, ' ')), 'expected the row NOT to start with a plain, non-interactive <div>');
  });
});

queue.push(function() {
  console.log('\n[frsr-s1] AC1 -- the discoveryArtefact suffix link remains present and separate (no nested anchors)');
  return test('_renderPvcItemRow: discoveryArtefact link is a sibling, not nested inside the card link (invalid HTML)', function() {
    var m = freshRequireAll();
    var item = { slug: 'frsr-test-feature-2', name: 'FRSR Test Feature 2', health: 'unknown', discoveryArtefact: 'discovery.md' };
    var html = m.products._renderPvcItemRow(item);
    assert.ok(/<a class="pvc-item-link" href="\/features\/frsr-test-feature-2"/.test(html), 'expected the card link');
    assert.ok(/<a href="\/artefact\/frsr-test-feature-2\/discovery"/.test(html), 'expected the discoveryArtefact link');
    // No anchor tag should appear inside another anchor's own content before its close.
    var cardLinkBlock = html.slice(html.indexOf('<a class="pvc-item-link"'), html.indexOf('</a>') + 4);
    assert.ok(!/<a /.test(cardLinkBlock.slice(cardLinkBlock.indexOf('>') + 1)), 'expected no nested <a> inside the card link');
  });
});

// ===========================================================================
// AC2 — completeStage() records the active sessionId
// ===========================================================================

queue.push(function() {
  console.log('\n[frsr-s1] AC2 -- completeStage() records sessionId alongside existing fields');
  return test('completeStage: resulting completedStages entry includes sessionId matching activeSessionId at call time', function() {
    var m = freshRequireAll();
    var journey = m.journeyStore.createJourney('frsr-ac2-feature', 'default');
    var sid = crypto.randomUUID();
    m.journeyStore.setActiveSession(journey.journeyId, sid, 'discovery');

    m.journeyStore.completeStage(journey.journeyId, 'discovery', 'artefacts/frsr-ac2-feature/discovery.md', null, sid);

    var updated = m.journeyStore.getJourney(journey.journeyId);
    assert.strictEqual(updated.completedStages.length, 1, 'expected exactly one completedStages entry');
    var entry = updated.completedStages[0];
    assert.strictEqual(entry.sessionId, sid, 'expected the recorded sessionId to match activeSessionId at call time');
    assert.strictEqual(entry.skillName, 'discovery', 'expected skillName still recorded (existing field)');
    assert.strictEqual(entry.artefactPath, 'artefacts/frsr-ac2-feature/discovery.md', 'expected artefactPath still recorded (existing field)');
    assert.ok(entry.completedAt, 'expected completedAt still recorded (existing field)');
  });
});

queue.push(function() {
  console.log('\n[frsr-s1] AC2 -- omitting sessionId (existing callers) does not break the entry');
  return test('completeStage: sessionId omitted -> entry has no sessionId field, no throw (backward compatible)', function() {
    var m = freshRequireAll();
    var journey = m.journeyStore.createJourney('frsr-ac2b-feature', 'default');
    assert.doesNotThrow(function() {
      m.journeyStore.completeStage(journey.journeyId, 'discovery', 'artefacts/frsr-ac2b-feature/discovery.md');
    });
    var updated = m.journeyStore.getJourney(journey.journeyId);
    assert.strictEqual(updated.completedStages[0].sessionId, undefined, 'expected no sessionId field when omitted');
  });
});

// ===========================================================================
// AC3 — artefact-index page shows a "Resume conversation" link when resolvable
// ===========================================================================

queue.push(function() {
  console.log('\n[frsr-s1] AC3 -- /features/:slug shows a Resume conversation link alongside View, when a session is resolvable');
  return test('handleGetFeatureArtefacts: resolvable stage gets a Resume conversation link; the existing View link is still present', async function() {
    var m = freshRequireAll();
    m.features.setListArtefacts(async function() {
      return { artefacts: TEST_ARTEFACTS, grouped: {}, noArtefacts: false };
    });
    m.features.setJourneyStoreModule(m.journeyStore);

    var journey = m.journeyStore.createJourney('frsr-test-feature', 'default');
    var sid = crypto.randomUUID();
    m.journeyStore.completeStage(journey.journeyId, 'discovery', 'artefacts/frsr-test-feature/discovery.md', null, sid);
    // The 'definition' artefact has no completed stage / no sessionId -- should get no resume link.

    var req = mockReq();
    var res = mockRes();
    await m.features.handleGetFeatureArtefacts(req, res, 'frsr-test-feature');

    assert.strictEqual(res.statusCode, 200, 'expected 200, got ' + res.statusCode);
    assert.ok(res.body.includes('/skills/discovery/sessions/' + sid + '/chat'), 'expected a resume link to the resolvable discovery session');
    assert.ok(res.body.includes('Resume conversation'), 'expected the "Resume conversation" label');
    assert.ok(res.body.includes('/artefact/frsr-test-feature/discovery'), 'expected the existing View link to still be present, not replaced');
    // The definition artefact (no resolvable session) must not get a resume link to a bogus URL.
    assert.ok(!res.body.includes('/skills/definition/sessions/'), 'expected no resume link for a stage with no resolvable sessionId');
  });
});

// ===========================================================================
// AC4 — the resume link reaches handleGetChatHtml's own real rendering
// ===========================================================================

queue.push(function() {
  console.log('\n[frsr-s1] AC4 -- following the resume link reaches the exact same rendering handleGetChatHtml already produces');
  return test('handleGetChatHtml: the resume link\'s skillName/sessionId reaches the real, unmodified chat-history rendering', async function() {
    var m = freshRequireAll();
    var journey = m.journeyStore.createJourney('frsr-ac4-feature', 'default');
    var sid = crypto.randomUUID();
    m.skills.registerHtmlSession(sid, '/tmp/frsr-ac4-session', 'discovery', {});
    var session = m.skills._getHtmlSession(sid);
    session.journeyId = journey.journeyId;
    session.turns = [
      { role: 'assistant', content: 'FRSR_AC4_UNIQUE_QUESTION' },
      { role: 'user', content: 'FRSR_AC4_UNIQUE_ANSWER' }
    ];
    m.journeyStore.completeStage(journey.journeyId, 'discovery', 'artefacts/frsr-ac4-feature/discovery.md', null, sid);

    // Simulate following the resume link built from the completedStages entry.
    var updated = m.journeyStore.getJourney(journey.journeyId);
    var entry = updated.completedStages[0];
    var req = mockReq({ params: { name: entry.skillName, id: entry.sessionId } });
    var res = mockRes();
    await m.skills.handleGetChatHtml(req, res);

    assert.strictEqual(res.statusCode, 200, 'expected 200, got ' + res.statusCode);
    assert.ok(res.body.includes('FRSR_AC4_UNIQUE_QUESTION'), 'expected the real turn history to be rendered, not new/duplicated logic');
    assert.ok(res.body.includes('FRSR_AC4_UNIQUE_ANSWER'), 'expected the full turn history, not a partial view');
  });
});

// ===========================================================================
// AC5 — an evicted/unresolvable session shows the existing honest message
// ===========================================================================

queue.push(function() {
  console.log('\n[frsr-s1] AC5 -- an evicted session\'s resume link shows the existing honest "not found" message');
  return test('handleGetChatHtml: a sessionId that resolves in neither memory nor Redis -> 404 with the existing not-found message', async function() {
    var m = freshRequireAll();
    var journey = m.journeyStore.createJourney('frsr-ac5-feature', 'default');
    var evictedSid = crypto.randomUUID();
    // Recorded at completion time, but never registered in memory and no
    // Redis adapter wired -- simulates a session evicted beyond SESSION_MAX_AGE_DAYS.
    m.journeyStore.completeStage(journey.journeyId, 'discovery', 'artefacts/frsr-ac5-feature/discovery.md', null, evictedSid);

    var updated = m.journeyStore.getJourney(journey.journeyId);
    var entry = updated.completedStages[0];
    var req = mockReq({ params: { name: entry.skillName, id: entry.sessionId } });
    var res = mockRes();
    await m.skills.handleGetChatHtml(req, res);

    assert.strictEqual(res.statusCode, 404, 'expected 404 for an unresolvable session, got ' + res.statusCode);
    assert.ok(/session not found/i.test(res.body), 'expected the existing honest "Session not found" message, not a silent/blank failure');
  });
});

// ===========================================================================
// NFR-Performance — the lookup runs once per page render, not once per row
// ===========================================================================

queue.push(function() {
  console.log('\n[frsr-s1] NFR-Performance -- featureSlug->journeyId->completedStages lookup runs exactly once per render');
  return test('handleGetFeatureArtefacts: getJourneyByFeatureSlug is called exactly once regardless of artefact-row count', async function() {
    var m = freshRequireAll();
    m.features.setListArtefacts(async function() {
      return { artefacts: TEST_ARTEFACTS, grouped: {}, noArtefacts: false }; // 2 rows
    });
    var realJourney = m.journeyStore.createJourney('frsr-nfr-feature', 'default');
    m.journeyStore.completeStage(realJourney.journeyId, 'discovery', 'artefacts/frsr-nfr-feature/discovery.md', null, crypto.randomUUID());

    var callCount = 0;
    var spyStore = Object.assign({}, m.journeyStore, {
      getJourneyByFeatureSlug: function(slug) {
        callCount++;
        return m.journeyStore.getJourneyByFeatureSlug(slug);
      }
    });
    m.features.setJourneyStoreModule(spyStore);

    var req = mockReq();
    var res = mockRes();
    await m.features.handleGetFeatureArtefacts(req, res, 'frsr-nfr-feature');

    assert.strictEqual(callCount, 1, 'expected exactly 1 call to getJourneyByFeatureSlug regardless of the ' + TEST_ARTEFACTS.length + ' artefact rows, got ' + callCount);
  });
});

// ===========================================================================
// NFR-Security — the resume link respects the exact same tenant/ownership guard
// ===========================================================================

queue.push(function() {
  console.log('\n[frsr-s1] NFR-Security -- a resume link for another tenant\'s journey is rejected, not the session content');
  return test('handleGetChatHtml via a resume link: cross-tenant request rejected identically to the existing direct-route guard', async function() {
    var m = freshRequireAll();
    var journey = m.journeyStore.createJourney('frsr-nfr-sec-feature', 'default');
    m.journeyStore.setJourneyFields(journey.journeyId, { ownerId: 'owner-login@example.test', tenantId: 'owner-login@example.test' });
    var sid = crypto.randomUUID();
    m.skills.registerHtmlSession(sid, '/tmp/frsr-nfr-sec-session', 'discovery', {});
    var session = m.skills._getHtmlSession(sid);
    session.journeyId = journey.journeyId;
    session.turns = [{ role: 'assistant', content: 'FRSR_SECRET_CONTENT_MUST_NOT_LEAK' }];
    m.journeyStore.completeStage(journey.journeyId, 'discovery', 'artefacts/frsr-nfr-sec-feature/discovery.md', null, sid);

    var updated = m.journeyStore.getJourney(journey.journeyId);
    var entry = updated.completedStages[0];
    // A different, non-owning user follows the resume link.
    var req = mockReq({ params: { name: entry.skillName, id: entry.sessionId }, session: { accessToken: 'tok', login: 'different-login@example.test' } });
    var res = mockRes();
    await m.skills.handleGetChatHtml(req, res);

    assert.notStrictEqual(res.statusCode, 200, 'a different tenant following the resume link must not receive HTTP 200');
    assert.ok(!res.body.includes('FRSR_SECRET_CONTENT_MUST_NOT_LEAK'), 'a different tenant\'s response must not contain the session\'s actual content');
  });
});

queue.push(function() {
  console.log('\n[frsr-s1] NFR-Security -- the owning user\'s own resume link still succeeds (guard is not overly broad)');
  return test('handleGetChatHtml via a resume link: the owning user\'s own request still succeeds', async function() {
    var m = freshRequireAll();
    var journey = m.journeyStore.createJourney('frsr-nfr-sec-owner-feature', 'default');
    m.journeyStore.setJourneyFields(journey.journeyId, { ownerId: 'owner-login@example.test', tenantId: 'owner-login@example.test' });
    var sid = crypto.randomUUID();
    m.skills.registerHtmlSession(sid, '/tmp/frsr-nfr-sec-owner-session', 'discovery', {});
    var session = m.skills._getHtmlSession(sid);
    session.journeyId = journey.journeyId;
    session.turns = [{ role: 'assistant', content: 'FRSR_OWNER_VISIBLE_CONTENT' }];
    m.journeyStore.completeStage(journey.journeyId, 'discovery', 'artefacts/frsr-nfr-sec-owner-feature/discovery.md', null, sid);

    var updated = m.journeyStore.getJourney(journey.journeyId);
    var entry = updated.completedStages[0];
    var req = mockReq({ params: { name: entry.skillName, id: entry.sessionId }, session: { accessToken: 'tok', login: 'owner-login@example.test' } });
    var res = mockRes();
    await m.skills.handleGetChatHtml(req, res);

    assert.strictEqual(res.statusCode, 200, 'the owning user\'s own resume link must still succeed, got ' + res.statusCode);
  });
});

(async function() {
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }
  console.log('\n[frsr-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
