// check-iwu4-confirm-flag.js — unit tests for iwu.4 assumption card confirm/flag
// Tests: handlePostAssumptionConfirm — auth, validation, happy path, error bodies.

'use strict';

const {
  handlePostAssumptionConfirm,
  _setHtmlSession,
  _getHtmlSession
} = require('../src/web-ui/routes/skills');

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log('[iwu4] PASS: ' + label);
    passed++;
  } else {
    console.error('[iwu4] FAIL: ' + label);
    failed++;
  }
}

// Helper: mock req/res pair with body
function makeReq(sessionId, cardId, bodyObj, authed) {
  var bodyStr = JSON.stringify(bodyObj);
  return {
    session: authed !== false ? { accessToken: 'test-token' } : {},
    params:  { id: sessionId || '', cardId: cardId || '', name: 'ideate' },
    on: function(event, cb) {
      if (event === 'data') { cb(Buffer.from(bodyStr)); }
      if (event === 'end')  { cb(); }
      if (event === 'error') {}
    }
  };
}

function makeRes() {
  var res = {
    statusCode:  null,
    body:        null,
    writeHead: function(code) { this.statusCode = code; },
    end:       function(data) {
      if (data) {
        try { this.body = JSON.parse(data); } catch (_) { this.body = data; }
      }
    }
  };
  return res;
}

// Seed a session with an assumption card
const SESSION_WITH_CARD = 'session-iwu4-001';
_setHtmlSession(SESSION_WITH_CARD, {
  skillName: 'ideate', sessionPath: '/tmp/t', systemPrompt: 'sp',
  turns: [], artefactContent: null, artefactPath: null, done: false,
  journeyId: null, assumptionCardsEnabled: true,
  assumptionCards: {
    'abcd1234': { id: 'a1', text: 'Some assumption', type: 'user', risk: 'low', knowness: 'unknown', cardId: 'abcd1234', state: 'default' }
  }
});

// ---------------------------------------------------------------------------
// T1: 401 when unauthenticated
// ---------------------------------------------------------------------------
(async function() {
  var req = makeReq(SESSION_WITH_CARD, 'abcd1234', { action: 'confirm' }, false);
  var res = makeRes();
  await handlePostAssumptionConfirm(req, res);
  assert('T1: returns 401 when unauthenticated', res.statusCode === 401);
  assert('T1: error body does not contain session state', res.body && !res.body.assumptionCards && !res.body.accessToken);

  // ---------------------------------------------------------------------------
  // T2: 400 when cardId is not 8-char hex (path traversal guard)
  // ---------------------------------------------------------------------------
  var req2 = makeReq(SESSION_WITH_CARD, '../etc/passwd', { action: 'confirm' });
  var res2 = makeRes();
  await handlePostAssumptionConfirm(req2, res2);
  assert('T2: 400 for path traversal cardId', res2.statusCode === 400);
  assert('T2: error body contains INVALID_CARD_ID', res2.body && res2.body.error === 'INVALID_CARD_ID');
  assert('T2: error body does not contain raw cardId', res2.body && !res2.body.cardId);

  // Also test with too-short ID
  var req2b = makeReq(SESSION_WITH_CARD, 'abcd', { action: 'confirm' });
  var res2b = makeRes();
  await handlePostAssumptionConfirm(req2b, res2b);
  assert('T2: 400 for too-short cardId', res2b.statusCode === 400);

  // Test uppercase hex rejected (must be lowercase)
  var req2c = makeReq(SESSION_WITH_CARD, 'ABCD1234', { action: 'confirm' });
  var res2c = makeRes();
  await handlePostAssumptionConfirm(req2c, res2c);
  assert('T2: 400 for uppercase cardId', res2c.statusCode === 400);

  // ---------------------------------------------------------------------------
  // T3: 404 when session not found
  // ---------------------------------------------------------------------------
  var req3 = makeReq('no-such-session', 'abcd1234', { action: 'confirm' });
  var res3 = makeRes();
  await handlePostAssumptionConfirm(req3, res3);
  assert('T3: 404 when session not found', res3.statusCode === 404);
  assert('T3: error is SESSION_NOT_FOUND', res3.body && res3.body.error === 'SESSION_NOT_FOUND');
  assert('T3: no session fields in error body', res3.body && !res3.body.assumptionCards && !res3.body.turns);

  // ---------------------------------------------------------------------------
  // T4: 404 when cardId not in session.assumptionCards
  // ---------------------------------------------------------------------------
  var req4 = makeReq(SESSION_WITH_CARD, 'deadbeef', { action: 'confirm' });
  var res4 = makeRes();
  await handlePostAssumptionConfirm(req4, res4);
  assert('T4: 404 when cardId not in assumptionCards', res4.statusCode === 404);
  assert('T4: error is CARD_NOT_FOUND', res4.body && res4.body.error === 'CARD_NOT_FOUND');
  assert('T4: no session fields in error body', res4.body && !res4.body.assumptionCards);

  // ---------------------------------------------------------------------------
  // T5: 400 when action is invalid
  // ---------------------------------------------------------------------------
  var req5 = makeReq(SESSION_WITH_CARD, 'abcd1234', { action: 'delete' });
  var res5 = makeRes();
  await handlePostAssumptionConfirm(req5, res5);
  assert('T5: 400 for invalid action', res5.statusCode === 400);
  assert('T5: error is INVALID_ACTION', res5.body && res5.body.error === 'INVALID_ACTION');

  // Also missing action
  var req5b = makeReq(SESSION_WITH_CARD, 'abcd1234', {});
  var res5b = makeRes();
  await handlePostAssumptionConfirm(req5b, res5b);
  assert('T5: 400 for missing action field', res5b.statusCode === 400);

  // ---------------------------------------------------------------------------
  // T6: 200 confirm — state becomes "confirmed"
  // ---------------------------------------------------------------------------
  var req6 = makeReq(SESSION_WITH_CARD, 'abcd1234', { action: 'confirm' });
  var res6 = makeRes();
  await handlePostAssumptionConfirm(req6, res6);
  assert('T6: 200 on confirm', res6.statusCode === 200);
  assert('T6: response body has cardId', res6.body && res6.body.cardId === 'abcd1234');
  assert('T6: response body has state=confirmed', res6.body && res6.body.state === 'confirmed');
  var sess6 = _getHtmlSession(SESSION_WITH_CARD);
  assert('T6: session state mutated to confirmed', sess6 && sess6.assumptionCards && sess6.assumptionCards['abcd1234'].state === 'confirmed');

  // ---------------------------------------------------------------------------
  // T7: 200 flag — state becomes "flagged" (non-terminal — re-flag after confirm)
  // ---------------------------------------------------------------------------
  var req7 = makeReq(SESSION_WITH_CARD, 'abcd1234', { action: 'flag' });
  var res7 = makeRes();
  await handlePostAssumptionConfirm(req7, res7);
  assert('T7: 200 on flag after confirm (non-terminal)', res7.statusCode === 200);
  assert('T7: response body has state=flagged', res7.body && res7.body.state === 'flagged');
  var sess7 = _getHtmlSession(SESSION_WITH_CARD);
  assert('T7: session state mutated to flagged', sess7 && sess7.assumptionCards && sess7.assumptionCards['abcd1234'].state === 'flagged');

  // ---------------------------------------------------------------------------
  // T8: security — response bodies never contain session state
  // (Already checked in T3 and T4 — extra explicit check with a 200 response)
  // ---------------------------------------------------------------------------
  assert('T8: 200 body contains only cardId and state (no session fields)',
    res6.body && Object.keys(res6.body).sort().join(',') === 'cardId,state');

  // Summary
  console.log('\n[iwu4] ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) { process.exit(1); }
})().catch(function(err) {
  console.error('[iwu4] FATAL: ' + err.message);
  console.error(err.stack);
  process.exit(1);
});
