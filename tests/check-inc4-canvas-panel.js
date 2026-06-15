#!/usr/bin/env node
// check-inc4-canvas-panel.js — AC verification for inc4 canvas output panel
// Tests T1–T9. T10 = npm test (full suite regression).
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

const {
  parseCanvasBlock,
  _setHtmlSession,
  _getHtmlSession,
  setSkillTurnExecutorStreamAdapter,
  handlePostTurnStreamHtml
} = require('../src/web-ui/routes/skills');

const { renderChat } = require('../src/web-ui/views/chat-view');

// ── T1 — parseCanvasBlock: valid marker ──────────────────────────────────────
console.log('\n  T1 — parseCanvasBlock: valid marker');
{
  const m = '---CANVAS-JSON: {"type":"cluster-tree","title":"Opp Map","content":{"clusters":[]}}---';
  const r = parseCanvasBlock(m);
  ok(r !== null, 'T1: returns non-null for valid cluster-tree marker');
  eq(r && r.type, 'cluster-tree', 'T1: type field correct');
  eq(r && r.title, 'Opp Map', 'T1: title field correct');
  ok(r && r.content !== undefined, 'T1: content field present');
  // Other valid types
  ok(parseCanvasBlock('---CANVAS-JSON: {"type":"table","title":"T","content":{}}---') !== null, 'T1: "table" is valid type');
  ok(parseCanvasBlock('---CANVAS-JSON: {"type":"text","title":"T","content":{}}---') !== null, 'T1: "text" is valid type');
}

// ── T2 — parseCanvasBlock: invalid JSON → null ───────────────────────────────
console.log('\n  T2 — parseCanvasBlock: invalid JSON → null');
{
  ok(parseCanvasBlock('---CANVAS-JSON: {bad json}---') === null, 'T2: invalid JSON → null');
  ok(parseCanvasBlock('no marker here') === null, 'T2: no marker → null');
  ok(parseCanvasBlock('') === null, 'T2: empty string → null');
}

// ── T3 — parseCanvasBlock: unknown type → null ───────────────────────────────
console.log('\n  T3 — parseCanvasBlock: unknown type → null');
{
  ok(parseCanvasBlock('---CANVAS-JSON: {"type":"diagram","title":"x","content":{}}---') === null, 'T3: "diagram" → null');
  ok(parseCanvasBlock('---CANVAS-JSON: {"type":"","title":"x","content":{}}---') === null, 'T3: empty type → null');
  ok(parseCanvasBlock('---CANVAS-JSON: {"title":"x","content":{}}---') === null, 'T3: missing type → null');
}

// ── T4/T5 — SSE pipeline ─────────────────────────────────────────────────────
console.log('\n  T4/T5 — SSE: canvasBlock emitted + stripped from chunk');
const SESSION_CV = 'test-inc4-canvas-session';
_setHtmlSession(SESSION_CV, {
  skillName: 'ideate', sessionPath: '/tmp/test', systemPrompt: 'test',
  turns: [], artefactContent: null, artefactPath: null, done: false,
  journeyId: null, assumptionCardsEnabled: true
});

const CV_MARKER = '---CANVAS-JSON: {"type":"cluster-tree","title":"Opp Map","content":{"clusters":["C1","C2"]}}---';
const CV_STREAM  = 'Text before. ' + CV_MARKER + ' Text after.';

setSkillTurnExecutorStreamAdapter(function(sp, hist, content, token, onChunk) {
  onChunk(CV_STREAM);
  return Promise.resolve(CV_STREAM);
});

const cvReq = {
  session: { accessToken: 'test-token' },
  params:  { id: SESSION_CV, name: 'ideate' },
  on: function(event, cb) {
    if (event === 'data')  { cb(Buffer.from(JSON.stringify({ answer: 'hi' }))); }
    if (event === 'end')   { cb(); }
    if (event === 'error') {}
  }
};
const cvRes = {
  writtenData: [],
  writeHead: function() {},
  write: function(d) { this.writtenData.push(d); },
  end:   function() {}
};

async function runT4T5() {
  await handlePostTurnStreamHtml(cvReq, cvRes);

  const canvasEvents = cvRes.writtenData.filter(function(d) { return d.includes('"canvasBlock"'); });
  ok(canvasEvents.length >= 1, 'T4: canvasBlock SSE event emitted');

  var firstCanvas = null;
  try { firstCanvas = JSON.parse(canvasEvents[0].replace(/^data: /, '').trim()); } catch (_) {}
  eq(firstCanvas && firstCanvas.canvasBlock && firstCanvas.canvasBlock.type, 'cluster-tree', 'T4: canvasBlock.type correct');
  eq(firstCanvas && firstCanvas.canvasBlock && firstCanvas.canvasBlock.title, 'Opp Map', 'T4: canvasBlock.title correct');

  const sess = _getHtmlSession(SESSION_CV);
  ok(sess && sess.canvasBlocks && sess.canvasBlocks.length >= 1, 'T4: session.canvasBlocks populated');

  // T5: chunk events must not contain the raw CANVAS-JSON marker text
  const chunkEvents = cvRes.writtenData.filter(function(d) { return d.includes('"chunk"'); });
  const allChunkText = chunkEvents.map(function(d) {
    try { return JSON.parse(d.replace(/^data: /, '')).chunk || ''; } catch (_) { return ''; }
  }).join('');
  ok(!allChunkText.includes('---CANVAS-JSON:'), 'T5: CANVAS-JSON marker stripped from chunk display events');
}

// ── T6 — #canvas-panel in renderChat ─────────────────────────────────────────
// (appended in Task 3)

// ── T7/T8/T9 — renderCanvasBlock ─────────────────────────────────────────────
// (appended in Task 4)

// ── Report ───────────────────────────────────────────────────────────────────
runT4T5().then(function() {
  console.log('\n[inc4-canvas-panel] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  if (failed > 0) { process.exit(1); }
}).catch(function(err) {
  console.error('[inc4] Unexpected error:', err.message);
  process.exit(1);
});
