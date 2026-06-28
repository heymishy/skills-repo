#!/usr/bin/env node
// check-dic1-story-cards.js — AC verification for dic.1: interactive story cards
// Tests T1–T15. Manual smoke tests (DnD, AT, frame-rate) noted in comments.
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
function eq(a, b, label) {
  if (a === b) { console.log('  ✓ ' + label); passed++; }
  else {
    console.log('  ✗ ' + label + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');
    failed++;
  }
}

const { _renderDefinitionMapHtml } = require('../src/web-ui/routes/skills');

// Test data
const sampleParsed = {
  epicCount: 2,
  storyCount: 3,
  slicing: 'vertical',
  epics: [
    {
      num: '1',
      name: 'Platform Core',
      stories: [
        { id: 's.1', title: 'First story', cx: 1, raw: '' },
        { id: 's.2', title: 'Second story', cx: 2, raw: '' }
      ]
    },
    {
      num: '2',
      name: 'Operator Tools',
      stories: [
        { id: 's.3', title: 'Third story', cx: 3, raw: '' }
      ]
    }
  ]
};

// ── T1 — renderDefinitionMap: card has data-origin="model" ───────────────────
console.log('\n  T1 — card has data-origin="model"');
{
  const html = _renderDefinitionMapHtml(sampleParsed);
  ok(html.includes('data-origin="model"'), 'T1: data-origin="model" present on cards');
}

// ── T2 — card has class card--inherited ──────────────────────────────────────
console.log('\n  T2 — card has class card--inherited');
{
  const html = _renderDefinitionMapHtml(sampleParsed);
  ok(html.includes('card--inherited'), 'T2: card--inherited class present');
  ok(html.includes('story-card'), 'T2: story-card class present');
}

// ── T3 — card has model tag ───────────────────────────────────────────────────
console.log('\n  T3 — card has model tag');
{
  const html = _renderDefinitionMapHtml(sampleParsed);
  ok(html.includes('card-tag--model'), 'T3: card-tag--model class present');
  ok(html.includes('>model<'), 'T3: model tag text present');
}

// ── T4 — card has draggable="true" ───────────────────────────────────────────
console.log('\n  T4 — card has draggable="true"');
{
  const html = _renderDefinitionMapHtml(sampleParsed);
  ok(html.includes('draggable="true"'), 'T4: draggable="true" attribute present');
}

// ── T5 — card has data-card-id ───────────────────────────────────────────────
console.log('\n  T5 — card has data-card-id');
{
  const html = _renderDefinitionMapHtml(sampleParsed);
  ok(html.includes('data-card-id="epic-1_s.1"'), 'T5: data-card-id has epicId_storyId format');
  ok(html.includes('data-card-id="epic-2_s.3"'), 'T5: second epic cards have correct card-id');
}

// ── T6 — card has data-epic-id ───────────────────────────────────────────────
console.log('\n  T6 — card has data-epic-id');
{
  const html = _renderDefinitionMapHtml(sampleParsed);
  ok(html.includes('data-epic-id="epic-1"'), 'T6: data-epic-id="epic-1" present');
  ok(html.includes('data-epic-id="epic-2"'), 'T6: data-epic-id="epic-2" present');
}

// ── T7 — card has data-phase-id ──────────────────────────────────────────────
console.log('\n  T7 — card has data-phase-id');
{
  const html = _renderDefinitionMapHtml(sampleParsed);
  ok(html.includes('data-phase-id="phase-1"'), 'T7: data-phase-id="phase-1" present (default)');
}

// ── T8 — card has tabindex and role="button" ──────────────────────────────────
console.log('\n  T8 — card has tabindex="0" and role="button"');
{
  const html = _renderDefinitionMapHtml(sampleParsed);
  ok(html.includes('tabindex="0"'), 'T8: tabindex="0" present');
  ok(html.includes('role="button"'), 'T8: role="button" present');
}

// ── T9 — Apply changes button in canvas header ────────────────────────────────
console.log('\n  T9 — Apply changes button in canvas header');
{
  const html = _renderDefinitionMapHtml(sampleParsed);
  ok(html.includes('id="dm-apply-btn"'), 'T9: dm-apply-btn present');
  ok(html.includes('Apply changes (0 pending)'), 'T9: correct initial button text');
  ok(html.includes('disabled'), 'T9: button disabled when no pending changes');
}

// ── T10 — empty / null input returns dm-empty ─────────────────────────────────
console.log('\n  T10 — empty/null returns dm-empty');
{
  ok(_renderDefinitionMapHtml(null).includes('dm-empty'), 'T10: null → dm-empty');
  ok(_renderDefinitionMapHtml({ epicCount: 0, epics: [] }).includes('dm-empty'), 'T10: epicCount=0 → dm-empty');
}

// ── T11 — XSS: title is escaped ──────────────────────────────────────────────
console.log('\n  T11 — XSS: epic/story content is escaped');
{
  const xss = {
    epicCount: 1, storyCount: 1, slicing: '',
    epics: [{
      num: '1',
      name: '<script>alert(1)</script>',
      stories: [{ id: 's.1', title: '<img onerror="x">', cx: 0, raw: '' }]
    }]
  };
  const html = _renderDefinitionMapHtml(xss);
  ok(!html.includes('<script>alert(1)</script>'), 'T11: script tag not present raw');
  ok(html.includes('&lt;script&gt;'), 'T11: epic name is HTML-escaped');
  ok(!html.includes('<img onerror="x">'), 'T11: img onerror not present raw');
}

// ── T12 — complexity badge rendered for cx>=3 cards ──────────────────────────
console.log('\n  T12 — complexity badge present');
{
  const html = _renderDefinitionMapHtml(sampleParsed);
  ok(html.includes('dm-cx--h'), 'T12: cx=3 card gets dm-cx--h class');
  ok(html.includes('dm-cx--m'), 'T12: cx=2 card gets dm-cx--m class');
  ok(html.includes('dm-cx--l'), 'T12: cx=1 card gets dm-cx--l class');
}

// ── T13 — initCanvasInteractivity present in inline script source ─────────────
console.log('\n  T13 — initCanvasInteractivity in page source');
{
  const { _renderChatPage_forTest, handleGetChatHtml, _setHtmlSession } = require('../src/web-ui/routes/skills');
  // Use the route to get the HTML page source
  const SESSION_D1 = 'test-dic1-session';
  const { _setHtmlSession: setSession } = require('../src/web-ui/routes/skills');
  setSession(SESSION_D1, {
    skillName: 'definition', sessionPath: '/tmp/dic1-test', systemPrompt: 'test',
    turns: [], artefactContent: null, artefactPath: null, done: false, journeyId: null
  });

  let capturedHtml = null;
  const mockReq = {
    session: { accessToken: 'tok', userId: 1, login: 'user' },
    params:  { name: 'definition', id: SESSION_D1 }
  };
  const mockRes = {
    _html: null,
    writeHead: function() {},
    end: function(h) { this._html = h; }
  };

  handleGetChatHtml(mockReq, mockRes).then(function() {
    const html = mockRes._html || '';
    ok(html.includes('function initCanvasInteractivity'), 'T13: initCanvasInteractivity function present in page source');
    ok(html.includes('card--inherited'), 'T13: card--inherited class in renderDefinitionMap source');
    ok(html.includes('draggable'), 'T13: draggable in renderDefinitionMap source');
    ok(html.includes('data-origin'), 'T13: data-origin in renderDefinitionMap source');

    // ── T14 — Epic rename tooltip text in source ──────────────────────────────
    console.log('\n  T14 — Epic rename tooltip code in source');
    ok(html.includes('Epic names are set by the Definition skill'), 'T14: rename tooltip text in source');
    ok(html.includes('epic-rename-tooltip'), 'T14: epic-rename-tooltip class in source');
    ok(html.includes('"alert"'), 'T14: role="alert" in source for tooltip');

    // ── T15 — ArrowUp/ArrowDown handlers in source ────────────────────────────
    console.log('\n  T15 — Keyboard reorder handlers in source');
    ok(html.includes('ArrowUp'), 'T15: ArrowUp handler in source');
    ok(html.includes('ArrowDown'), 'T15: ArrowDown handler in source');
    ok(html.includes('pendingReorder'), 'T15: pendingReorder state reference in source');

    console.log('\n[dic1-story-cards] Results: ' + passed + ' passed, ' + failed + ' failed\n');
    if (failed > 0) { process.exit(1); }
  }).catch(function(err) {
    console.error('[dic1] Unexpected error:', err.message, err.stack);
    process.exit(1);
  });
}
