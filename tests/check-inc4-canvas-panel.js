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
// (appended in Task 2)

// ── T6 — #canvas-panel in renderChat ─────────────────────────────────────────
// (appended in Task 3)

// ── T7/T8/T9 — renderCanvasBlock ─────────────────────────────────────────────
// (appended in Task 4)

// ── Report ───────────────────────────────────────────────────────────────────
console.log('\n[inc4-canvas-panel] Results: ' + passed + ' passed, ' + failed + ' failed\n');
if (failed > 0) { process.exit(1); }
