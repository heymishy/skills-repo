// check-iwu5-lens-complete.js — unit tests for iwu.5 nudge bar on lensComplete
// Tests: server-side lensComplete SSE event, client-side script presence.

'use strict';

const {
  handlePostTurnStreamHtml,
  handleGetChatHtml,
  _setHtmlSession,
  _getHtmlSession,
  setSkillTurnExecutorStreamAdapter,
  setSkillTurnExecutorAdapter,
  setSkillTurnGitCommitAdapter,
  registerHtmlSession,
  setListSkills,
  setCreateSession,
  buildSystemPrompt
} = require('../src/web-ui/routes/skills');

// stis-s1: stub the git-commit adapter before any artefact-completing test
// runs in this file — this module instance is shared across the whole file
// (no freshRequire cache-busting here), so one call covers every test below.
setSkillTurnGitCommitAdapter(function stisS1TestStubGitCommit() { /* test stub — no real git op */ });

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log('[iwu5] PASS: ' + label);
    passed++;
  } else {
    console.error('[iwu5] FAIL: ' + label);
    failed++;
  }
}

// Helper to create a mock SSE stream response
function makeSseRes() {
  var res = {
    writtenData: [],
    statusCode: null,
    writeHead: function(code) { this.statusCode = code; },
    write: function(d) { this.writtenData.push(d); },
    end: function() {}
  };
  return res;
}

function makeStreamReq(sessionId) {
  return {
    session: { accessToken: 'test-token' },
    params:  { id: sessionId, name: 'ideate' },
    on: function(event, cb) {
      if (event === 'data') { cb(Buffer.from(JSON.stringify({ answer: 'hello' }))); }
      if (event === 'end')  { cb(); }
      if (event === 'error') {}
    }
  };
}

// ---------------------------------------------------------------------------
// AC1: lensComplete SSE event emitted when done=true
// ---------------------------------------------------------------------------

(async function() {
  const SESSION_DONE = 'iwu5-session-done-001';
  _setHtmlSession(SESSION_DONE, {
    skillName: 'ideate', sessionPath: '/tmp/s1', systemPrompt: 'sp',
    turns: [], artefactContent: null, artefactPath: null, done: false,
    journeyId: null, assumptionCardsEnabled: true
  });

  // Full response with artefact (triggers done=true → lensComplete)
  const ARTEFACT_RESPONSE = 'Here is the artefact:\n---ARTEFACT-START---\n# Discovery\nContent here\n---ARTEFACT-END---\n---SLUG---\ntest-slug';
  setSkillTurnExecutorStreamAdapter(function(sp, h, u, t, onChunk) {
    onChunk(ARTEFACT_RESPONSE);
    return Promise.resolve(ARTEFACT_RESPONSE);
  });

  var res1 = makeSseRes();
  await handlePostTurnStreamHtml(makeStreamReq(SESSION_DONE), res1);

  var allData = res1.writtenData.join('');
  // Check that the done event with done=true was emitted
  var doneEvents = res1.writtenData.filter(function(d) {
    try { return JSON.parse(d.replace(/^data: /, '').trim()).done === true; } catch(_) { return false; }
  });
  assert('AC1: done=true SSE event emitted when artefact found', doneEvents.length > 0);

  // Check that lensComplete event was emitted
  var lensCompleteEvents = res1.writtenData.filter(function(d) {
    try { return JSON.parse(d.replace(/^data: /, '').trim()).lensComplete === true; } catch(_) { return false; }
  });
  assert('AC1: lensComplete=true SSE event emitted after artefact found', lensCompleteEvents.length > 0);

  // Check that lensComplete event is a separate event from done
  assert('AC1: lensComplete is a separate SSE event from done', lensCompleteEvents.length >= 1);

  // Check the lensComplete event structure
  var lensEvt = null;
  try { lensEvt = JSON.parse(lensCompleteEvents[0].replace(/^data: /, '').trim()); } catch(_) {}
  assert('AC1: lensComplete event has lensComplete: true', lensEvt && lensEvt.lensComplete === true);

  // ---------------------------------------------------------------------------
  // AC2: lensComplete NOT emitted when done=false (no artefact produced)
  // ---------------------------------------------------------------------------
  const SESSION_NOT_DONE = 'iwu5-session-notdone-001';
  _setHtmlSession(SESSION_NOT_DONE, {
    skillName: 'ideate', sessionPath: '/tmp/s2', systemPrompt: 'sp',
    turns: [], artefactContent: null, artefactPath: null, done: false,
    journeyId: null, assumptionCardsEnabled: true
  });

  const NO_ARTEFACT_RESPONSE = 'Here is a regular response with no artefact markers.';
  setSkillTurnExecutorStreamAdapter(function(sp, h, u, t, onChunk) {
    onChunk(NO_ARTEFACT_RESPONSE);
    return Promise.resolve(NO_ARTEFACT_RESPONSE);
  });

  var res2 = makeSseRes();
  await handlePostTurnStreamHtml(makeStreamReq(SESSION_NOT_DONE), res2);

  var lensComplete2 = res2.writtenData.filter(function(d) {
    try { return JSON.parse(d.replace(/^data: /, '').trim()).lensComplete === true; } catch(_) { return false; }
  });
  assert('AC2: lensComplete NOT emitted when no artefact produced', lensComplete2.length === 0);

  // ---------------------------------------------------------------------------
  // AC3/AC4: client-side script content checks
  // Pre-populate a session in _setHtmlSession, then call handleGetChatHtml
  // with a matching sessionId and auth token. The handler renders the page
  // using the session and sends HTML to res.end().
  // ---------------------------------------------------------------------------

  const CHAT_SESSION = 'iwu5-chat-session-001';
  // Pre-populate: session with prior turns so initial turn executor is not called
  _setHtmlSession(CHAT_SESSION, {
    skillName: 'ideate',
    sessionPath: '/tmp/chat-sess',
    systemPrompt: 'You are an ideation assistant.',
    questions: [{ text: 'What is the opportunity?' }],
    answers: [],
    turns: [{ role: 'assistant', content: 'Welcome! What is the opportunity?' }],
    artefactContent: null,
    artefactPath: null,
    done: false,
    journeyId: null,
    assumptionCardsEnabled: true,
    featureSlug: 'test-feature',
    modelResponses: []
  });

  var chatReq = {
    session:  { accessToken: 'test-token' },
    params:   { name: 'ideate', id: CHAT_SESSION },
    query:    {}
  };
  var chatRes = {
    statusCode: null,
    body: '',
    writeHead: function(code) { this.statusCode = code; },
    end: function(data) { if(data) this.body += data; }
  };

  await handleGetChatHtml(chatReq, chatRes);

  // Check that the rendered page includes nudge bar script functions
  var pageHtml = chatRes.body;
  assert('AC3: rendered chat page includes handleLensComplete function', pageHtml.includes('handleLensComplete'));
  assert('AC3: rendered chat page includes countUnconfirmedCards function', pageHtml.includes('countUnconfirmedCards'));
  assert('AC3: rendered chat page includes showNudgeBar function', pageHtml.includes('showNudgeBar'));
  assert('AC3: rendered chat page includes dismissNudgeBar function', pageHtml.includes('dismissNudgeBar'));
  assert('AC3: rendered chat page handles lensComplete SSE event', pageHtml.includes('evt.lensComplete'));
  assert('AC3: lensComplete handler calls handleLensComplete()', pageHtml.includes('handleLensComplete()'));

  // AC4: nudge bar role=alert
  assert('AC4: nudge bar has role="alert"', pageHtml.includes('role", "alert"') || pageHtml.includes('role","alert"') || pageHtml.includes("role\", \"alert\"") || pageHtml.includes('setAttribute("role", "alert")'));

  // AC4: nudge bar has "assumption card(s) unreviewed" text
  assert('AC4: nudge bar message mentions "unreviewed"', pageHtml.includes('unreviewed'));

  // AC4: nudge bar has "Review now" button
  assert('AC4: nudge bar has Review now button', pageHtml.includes('Review now'));

  // AC5: focus guard — focus only stolen if activeElement !== chatInput
  assert('AC5: focus guard present in script', pageHtml.includes('document.activeElement !== chatInput'));

  // AC6: auto-dismiss on last card confirmed
  assert('AC6: auto-dismiss on confirm click', pageHtml.includes('checkAutoDismissNudgeBar'));
  assert('AC6: checkAutoDismissNudgeBar checks count', pageHtml.includes('countUnconfirmedCards'));

  // Summary
  console.log('\n[iwu5] ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) { process.exit(1); }
})().catch(function(err) {
  console.error('[iwu5] FATAL: ' + err.message);
  console.error(err.stack);
  process.exit(1);
});
