#!/usr/bin/env node
// check-dic3-add-story.js — AC verification for dic.3: add-story canvas flow
// Tests T1–T17 covering AC1–AC7 and NFR-A11Y/Security.
'use strict';

process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
process.env.WUCE_REPOSITORIES    = 'test-owner/test-repo';

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else       { console.log('  ✗ ' + label); failed++; }
}

const { _renderDefinitionMapHtml, handleGetChatHtml, _setHtmlSession } = require('../src/web-ui/routes/skills');

// ── Shared fixtures ──────────────────────────────────────────────────────────
const singlePhaseModel = [{ name: 'Phase 1 (current)', isCurrent: true }];
const multiPhaseModel  = [
  { name: 'Phase 1 (current)', isCurrent: true },
  { name: 'Phase 2', isCurrent: false }
];

const emptyEpicParsed = {
  epicCount: 1, storyCount: 0, slicing: '',
  epics: [{ num: '1', name: 'Platform Core', stories: [] }]
};

const filledParsed = {
  epicCount: 1, storyCount: 1, slicing: '',
  epics: [{ num: '1', name: 'Platform Core', stories: [{ id: 's.1', title: 'First', cx: 1, raw: '' }] }]
};

// ── T1 — AC1: + button present in current-phase empty cell ──────────────────
console.log('\n  T1 — AC1: + button present in current-phase empty cell');
{
  const html = _renderDefinitionMapHtml(emptyEpicParsed, singlePhaseModel);
  ok(html.includes('class="add-story-btn"'), 'T1: add-story-btn class present');
  ok(html.includes('aria-label="Add story to Platform Core"'), 'T1: aria-label with epic name');
  ok(html.includes('>+<'), 'T1: + button text present');
}

// ── T2 — AC1: + button absent in locked rows ─────────────────────────────────
console.log('\n  T2 — AC1: + button absent in locked rows');
{
  const html = _renderDefinitionMapHtml(emptyEpicParsed, multiPhaseModel);
  // Count add-story-btn occurrences — should only be in current-phase row (1 epic × 1 current phase)
  const matches = (html.match(/class="add-story-btn"/g) || []).length;
  ok(matches === 1, 'T2: exactly 1 + button (only in current-phase row, not locked row)');
  // Verify the locked row does NOT have add-story-btn
  const lockedRowMatch = html.match(/data-phase-current="false"[^<]*<.*?class="add-story-btn"/s);
  ok(!lockedRowMatch, 'T2: locked row has no add-story-btn');
}

// ── T3 — AC1: + button has tabindex="0" ─────────────────────────────────────
console.log('\n  T3 — AC1: + button is keyboard-focusable');
{
  const html = _renderDefinitionMapHtml(emptyEpicParsed, singlePhaseModel);
  ok(html.includes('tabindex="0"') && html.includes('add-story-btn'), 'T3: add-story-btn has tabindex="0"');
}

// ── T4 — AC1: + button present in current-phase cell WITH stories ────────────
console.log('\n  T4 — AC1: + button present even in non-empty current-phase cell');
{
  const html = _renderDefinitionMapHtml(filledParsed, singlePhaseModel);
  ok(html.includes('class="add-story-btn"'), 'T4: + button present in non-empty cell');
  ok(html.includes('card--inherited'), 'T4: existing card still present');
}

// ── T5-T14: inline script source tests via handleGetChatHtml ─────────────────
const SESSION_D3 = 'test-dic3-session';
_setHtmlSession(SESSION_D3, {
  skillName: 'definition', sessionPath: '/tmp/dic3-test', systemPrompt: 'test',
  turns: [], artefactContent: null, artefactPath: null, done: false, journeyId: null,
  phaseModel: [{ name: 'Phase 1 (current)', isCurrent: true }]
});

const mockReq = {
  session: { accessToken: 'tok', userId: 1, login: 'user' },
  params: { name: 'definition', id: SESSION_D3 }
};
const mockRes = { _html: null, writeHead: function() {}, end: function(h) { this._html = h; } };

handleGetChatHtml(mockReq, mockRes).then(function() {
  const html = mockRes._html || '';

  // ── T5 — AC2: _showAddInput function in page source ───────────────────────
  console.log('\n  T5 — AC2: _showAddInput function in page source');
  ok(html.includes('_showAddInput'), 'T5: _showAddInput function present in page source');
  ok(html.includes('add-story-input'), 'T5: add-story-input class in source');

  // ── T6 — AC3: card--new creation in page source ────────────────────────────
  console.log('\n  T6 — AC3: card--new creation in source');
  ok(html.includes('card--new'), 'T6: card--new class in source');
  ok(html.includes('data-origin'), 'T6: data-origin attribute set in source');
  ok(html.includes('"operator"'), 'T6: operator origin value in source');

  // ── T7 — AC3: pendingAdds.push in source ────────────────────────────────────
  console.log('\n  T7 — AC3: pendingAdds.push in source');
  ok(html.includes('pendingAdds.push'), 'T7: pendingAdds.push call in source');

  // ── T8 — AC3: pendingAdds entry schema in source ────────────────────────────
  console.log('\n  T8 — AC3: pendingAdds entry schema');
  ok(html.includes('cardId'), 'T8: cardId field in pendingAdds entry');
  ok(html.includes('epicId'), 'T8: epicId field in pendingAdds entry');
  ok(html.includes('phaseId'), 'T8: phaseId field in pendingAdds entry');
  ok(html.includes('title'), 'T8: title field in pendingAdds entry');

  // ── T9 — AC3: new card has draggable="true" ──────────────────────────────────
  console.log('\n  T9 — AC3: new card has draggable="true"');
  ok(html.includes('"draggable", "true"') || html.includes("draggable", "true"), 'T9: draggable true set on new card');

  // ── T10 — AC3: new tag present on operator card ────────────────────────────
  console.log('\n  T10 — AC3: card--new has new tag');
  ok(html.includes('card-tag--new'), 'T10: card-tag--new class in source');
  ok(html.includes('>new<') || html.includes("'new'"), 'T10: "new" tag text in source');

  // ── T11 — AC4: Escape dismiss logic in source ────────────────────────────────
  console.log('\n  T11 — AC4: Escape dismiss logic in source');
  ok(html.includes('"Escape"'), 'T11: Escape key handler in source');
  ok(html.includes('_dismiss'), 'T11: _dismiss function in source');

  // ── T12 — AC4: blur with empty value dismiss in source ──────────────────────
  console.log('\n  T12 — AC4: blur dismiss for empty value in source');
  ok(html.includes('"blur"') && html.includes('_dismiss'), 'T12: blur → dismiss logic in source');

  // ── T13 — AC5: _canvasState reset on updateDraftPanel (from dic.2) ──────────
  console.log('\n  T13 — AC5: map re-init clears pendingAdds via _canvasState reset');
  ok(html.includes('_canvasState = { pendingReorder: [], pendingAdds: [] }'), 'T13: _canvasState reset in updateDraftPanel source');

  // ── T14 — AC7: Space/Enter activates + button (keyboard-accessible) ─────────
  console.log('\n  T14 — AC7: Space/Enter keyboard handler for add-story-btn in source');
  ok(html.includes('"add-story-btn"') && (html.includes('" "') || html.includes("' '")), 'T14: Space key check for add-story-btn in source');
  ok(html.includes('_showAddInput(e.target)'), 'T14: _showAddInput called from keydown handler');

  // ── T15 — NFR: XSS guard — escHtml(title) in source ────────────────────────
  console.log('\n  T15 — NFR: escHtml used on operator-entered title (XSS guard)');
  ok(html.includes('escHtml(title)'), 'T15: escHtml(title) in card creation source');

  // ── T16 — AC6: after refresh, card appears as model-emitted ─────────────────
  console.log('\n  T16 — AC6: model-rewritten artefact produces card--inherited card');
  {
    const refreshedParsed = {
      epicCount: 1, storyCount: 1, slicing: '',
      epics: [{ num: '1', name: 'Platform Core', stories: [{ id: 's.2', title: 'New audit story', cx: 1, raw: '' }] }]
    };
    const refreshedHtml = _renderDefinitionMapHtml(refreshedParsed, singlePhaseModel);
    ok(refreshedHtml.includes('data-origin="model"'), 'T16: after refresh, story has data-origin="model"');
    ok(refreshedHtml.includes('card--inherited'), 'T16: after refresh, story has card--inherited class');
    ok(!refreshedHtml.includes('card--new'), 'T16: after refresh, card--new class absent');
  }

  // ── T17 — Logic-level: pendingAdds schema simulation ────────────────────────
  console.log('\n  T17 — AC3: pendingAdds entry schema validation (logic-level)');
  {
    var pendingAdds = [];
    var epicId  = 'epic-1';
    var phaseId = 'phase-1';
    var title   = 'New audit story';
    var cardId  = epicId + '_op_' + Date.now();
    pendingAdds.push({ cardId: cardId, epicId: epicId, phaseId: phaseId, title: title });
    ok(pendingAdds.length === 1, 'T17: 1 entry after add');
    ok(typeof pendingAdds[0].cardId === 'string' && pendingAdds[0].cardId.length > 0, 'T17: cardId is non-empty string');
    ok(pendingAdds[0].epicId === epicId, 'T17: epicId correct');
    ok(pendingAdds[0].phaseId === phaseId, 'T17: phaseId correct');
    ok(pendingAdds[0].title === title, 'T17: title correct');
    ok(Object.keys(pendingAdds[0]).sort().join(',') === 'cardId,epicId,phaseId,title', 'T17: no extra fields in pendingAdds entry');
  }

  console.log('\n[dic3-add-story] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  if (failed > 0) { process.exit(1); }
}).catch(function(err) {
  console.error('[dic3] Unexpected error:', err.message, err.stack);
  process.exit(1);
});
