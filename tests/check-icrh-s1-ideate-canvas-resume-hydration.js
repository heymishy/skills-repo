#!/usr/bin/env node
// check-icrh-s1-ideate-canvas-resume-hydration.js — AC verification for icrh-s1
// (Hydrate the ideate canvas from restored session.canvasBlocks on page load/session-resume)
//
// Root cause (see artefacts/2026-07-23-ideate-canvas-resume-hydration-fix/decisions.md):
// tests/e2e/a4-ideate-session-resume.spec.js's AC2/AC3 test failed against real
// wuce-staging (CI run 29996127983) with a resumed session showing ZERO
// .canvas-block elements, even though turn 1 had rendered blocks before the
// browser was closed. tests/check-a4-session-store-state.js independently
// proves the data layer (mergeRedisSessionData) already restores
// session.canvasBlocks correctly -- the gap is entirely that
// _renderChatPage/handleGetChatHtml never read session.canvasBlocks to seed
// the initial HTML or an initial client-side hydration payload. This test
// verifies AC1-AC4 of icrh-s1's story (window.__SW_INITIAL_CANVAS_BLOCKS__
// init script + client-side appendCanvasBlock hydration call on load).
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

const { _setHtmlSession, handleGetChatHtml } = require('../src/web-ui/routes/skills');

function makeRes() {
  return {
    _status: null,
    _body: '',
    writeHead: function(status) { this._status = status; },
    end: function(body) { this._body = body || ''; }
  };
}

function makeReq(sessionId, skillName) {
  return {
    session: { accessToken: 'test-token', login: 'test-user' },
    params: { id: sessionId, name: skillName || 'ideate' }
  };
}

async function run() {
  // ── AC1: non-empty canvasBlocks on an ideate session -> init script present, matches exactly ──
  console.log('\n  AC1 -- window.__SW_INITIAL_CANVAS_BLOCKS__ present and matches session.canvasBlocks exactly');
  {
    const sessionId = 'icrh-s1-ac1-session';
    const blocks = [
      { type: 'cluster-tree', title: 'Opp Map',   content: { clusters: ['C1', 'C2'] } },
      { type: 'text',         title: 'Summary',   content: { paragraphs: ['para one'] } }
    ];
    _setHtmlSession(sessionId, {
      skillName: 'ideate', sessionPath: '/tmp/test', systemPrompt: 'test',
      turns: [{ role: 'assistant', content: 'Hi' }], artefactContent: null, artefactPath: null, done: false,
      journeyId: null, canvasBlocks: blocks
    });
    const req = makeReq(sessionId, 'ideate');
    const res = makeRes();
    await handleGetChatHtml(req, res);
    eq(res._status, 200, 'AC1: response status 200');
    ok(res._body.includes('window.__SW_INITIAL_CANVAS_BLOCKS__'), 'AC1: init script variable present in HTML');

    const m = res._body.match(/window\.__SW_INITIAL_CANVAS_BLOCKS__=(\[[\s\S]*?\]);<\/script>/);
    ok(m !== null, 'AC1: init script JSON payload is extractable');
    if (m) {
      let parsed = null;
      try { parsed = JSON.parse(m[1]); } catch (_) {}
      ok(Array.isArray(parsed), 'AC1: payload parses as an array');
      eq(parsed && parsed.length, 2, 'AC1: payload length matches session.canvasBlocks length');
      eq(parsed && parsed[0] && parsed[0].type,  'cluster-tree', 'AC1: entry 0 type matches');
      eq(parsed && parsed[0] && parsed[0].title, 'Opp Map',      'AC1: entry 0 title matches');
      eq(parsed && parsed[1] && parsed[1].type,  'text',         'AC1: entry 1 type matches');
      eq(parsed && parsed[1] && parsed[1].title, 'Summary',      'AC1: entry 1 title matches');
    }
  }

  // ── AC2: empty/absent canvasBlocks on an ideate session -> no init script emitted ──
  console.log('\n  AC2 -- no init script emitted when session.canvasBlocks is empty/absent (ideate)');
  {
    const sessionIdEmpty = 'icrh-s1-ac2-empty-session';
    _setHtmlSession(sessionIdEmpty, {
      skillName: 'ideate', sessionPath: '/tmp/test', systemPrompt: 'test',
      turns: [], artefactContent: null, artefactPath: null, done: false,
      journeyId: null, canvasBlocks: []
    });
    const resEmpty = makeRes();
    await handleGetChatHtml(makeReq(sessionIdEmpty, 'ideate'), resEmpty);
    ok(!resEmpty._body.includes('window.__SW_INITIAL_CANVAS_BLOCKS__'), 'AC2: no init script for empty canvasBlocks array');

    const sessionIdAbsent = 'icrh-s1-ac2-absent-session';
    _setHtmlSession(sessionIdAbsent, {
      skillName: 'ideate', sessionPath: '/tmp/test', systemPrompt: 'test',
      turns: [], artefactContent: null, artefactPath: null, done: false,
      journeyId: null
      // canvasBlocks intentionally absent
    });
    const resAbsent = makeRes();
    await handleGetChatHtml(makeReq(sessionIdAbsent, 'ideate'), resAbsent);
    ok(!resAbsent._body.includes('window.__SW_INITIAL_CANVAS_BLOCKS__'), 'AC2: no init script when canvasBlocks is absent entirely');
  }

  // ── AC3: non-ideate session with a canvasBlocks-shaped field -> no init script (ideate-scoped only) ──
  console.log('\n  AC3 -- non-ideate session with canvasBlocks set does NOT get the init script (ideate-scoped boundary)');
  {
    const sessionId = 'icrh-s1-ac3-definition-session';
    _setHtmlSession(sessionId, {
      skillName: 'definition', sessionPath: '/tmp/test', systemPrompt: 'test',
      turns: [], artefactContent: null, artefactPath: null, done: false,
      journeyId: null, canvasBlocks: [{ type: 'text', title: 'Should not leak', content: {} }]
    });
    const res = makeRes();
    await handleGetChatHtml(makeReq(sessionId, 'definition'), res);
    ok(!res._body.includes('window.__SW_INITIAL_CANVAS_BLOCKS__'), 'AC3: non-ideate session never gets the canvas-blocks init script, even if the field happens to be set');
  }

  // ── AC4: inline client script hydrates by calling appendCanvasBlock once per entry, in order ──
  console.log('\n  AC4 -- inline script hydrates via appendCanvasBlock, once per entry, in array order');
  {
    const sessionId = 'icrh-s1-ac4-session';
    const blocks = [
      { type: 'table', title: 'First',  content: { headers: [], rows: [] } },
      { type: 'text',  title: 'Second', content: { paragraphs: [] } }
    ];
    _setHtmlSession(sessionId, {
      skillName: 'ideate', sessionPath: '/tmp/test', systemPrompt: 'test',
      turns: [], artefactContent: null, artefactPath: null, done: false,
      journeyId: null, canvasBlocks: blocks
    });
    const res = makeRes();
    await handleGetChatHtml(makeReq(sessionId, 'ideate'), res);

    // The hydration call itself: guarded by IS_IDEATE, iterating __SW_INITIAL_CANVAS_BLOCKS__
    // and calling appendCanvasBlock(block) once per entry.
    const hydrationCallPattern = /IS_IDEATE[\s\S]{0,40}__SW_INITIAL_CANVAS_BLOCKS__[\s\S]{0,400}__SW_INITIAL_CANVAS_BLOCKS__\.forEach\(function\(block\)\s*\{\s*appendCanvasBlock\(block\);\s*\}\);/;
    ok(hydrationCallPattern.test(res._body), 'AC4: inline script calls appendCanvasBlock(block) once per __SW_INITIAL_CANVAS_BLOCKS__ entry, guarded by IS_IDEATE');

    // Ordering: the forEach iterates the array in its natural (insertion) order --
    // confirm the init script's own JSON array preserves session.canvasBlocks' order
    // (appendCanvasBlock always appends to the end of #canvas-panel, so array order
    // determines DOM order / .first()).
    const m = res._body.match(/window\.__SW_INITIAL_CANVAS_BLOCKS__=(\[[\s\S]*?\]);<\/script>/);
    let parsed = null;
    try { parsed = JSON.parse(m[1]); } catch (_) {}
    eq(parsed && parsed[0] && parsed[0].title, 'First',  'AC4: entry order preserved -- index 0 is "First"');
    eq(parsed && parsed[1] && parsed[1].title, 'Second', 'AC4: entry order preserved -- index 1 is "Second"');
  }

  console.log('\n[icrh-s1-ideate-canvas-resume-hydration] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed > 0 ? 1 : 0);
}

run();
