#!/usr/bin/env node
// check-p4-nta-surface.js — test plan verification for p4-nta-surface
// Covers T1–T8, T-NFR1, T-NFR2
// Tests FAIL until src/teams-bot/bot-handler.js is implemented — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT        = path.join(__dirname, '..');
const BOT_HANDLER = path.join(ROOT, 'src', 'teams-bot', 'bot-handler.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function loadModule() {
  if (!fs.existsSync(BOT_HANDLER)) return null;
  try {
    delete require.cache[require.resolve(BOT_HANDLER)];
    return require(BOT_HANDLER);
  } catch (_) { return null; }
}

// ── T1 — Module exists and exports state machine functions ───────────────────
console.log('\n[p4-nta-surface] T1 — module exists and exports state machine functions');
{
  const exists = fs.existsSync(BOT_HANDLER);
  assert(exists, 'T1a: src/teams-bot/bot-handler.js exists');
  const mod = loadModule();
  assert(mod !== null, 'T1b: module loads without error');
  if (mod) {
    assert(typeof mod.initSession    === 'function', 'T1c: exports initSession as function');
    assert(typeof mod.sendQuestion   === 'function', 'T1d: exports sendQuestion as function');
    assert(typeof mod.recordAnswer   === 'function', 'T1e: exports recordAnswer as function');
  }
}

const mod = loadModule();

// ── T2 — initSession returns AWAITING_RESPONSE ───────────────────────────────
console.log('\n[p4-nta-surface] T2 — initSession returns AWAITING_RESPONSE');
{
  if (!mod || typeof mod.initSession !== 'function') {
    assert(false, 'T2: initSession (function missing)');
  } else {
    let result = null;
    try {
      result = mod.initSession({ step: 'problem-statement', question: 'What problem are you solving?' });
    } catch (_) {}
    assert(result !== null && result !== undefined, 'T2a: result is not null');
    if (result) {
      assert(result.status === 'AWAITING_RESPONSE',
        `T2b: result.status is "AWAITING_RESPONSE" (got: ${JSON.stringify(result.status)})`);
      assert(result.questionId !== undefined && result.questionId !== null,
        'T2c: result has questionId');
    }
  }
}

// ── T3 — sendQuestion when AWAITING_RESPONSE returns error ───────────────────
console.log('\n[p4-nta-surface] T3 — sendQuestion when AWAITING_RESPONSE returns error (C7)');
{
  if (!mod || typeof mod.initSession !== 'function' || typeof mod.sendQuestion !== 'function') {
    assert(false, 'T3: initSession or sendQuestion (function missing)');
  } else {
    const session = mod.initSession({ step: 'problem-statement', question: 'First question?' });
    let result = null;
    let threw  = false;
    try {
      result = mod.sendQuestion(session, { question: 'Follow-up?' });
    } catch (_) { threw = true; }
    // Either returns error or throws
    const blocked = threw ||
      (result && result.error) ||
      (result && typeof result === 'object' && result.status === 'AWAITING_RESPONSE');
    assert(blocked,
      `T3: second question rejected when AWAITING_RESPONSE (threw: ${threw}, result: ${JSON.stringify(result)})`);
  }
}

// ── T4 — recordAnswer transitions to READY_FOR_NEXT_QUESTION ─────────────────
console.log('\n[p4-nta-surface] T4 — recordAnswer transitions to READY_FOR_NEXT_QUESTION');
{
  if (!mod || typeof mod.initSession !== 'function' || typeof mod.recordAnswer !== 'function') {
    assert(false, 'T4: initSession or recordAnswer (function missing)');
  } else {
    const session = mod.initSession({ step: 'problem-statement', question: 'Q?' });
    let result = null;
    try {
      result = mod.recordAnswer(session, { answer: 'test answer' });
    } catch (_) {}
    assert(result !== null && result !== undefined,
      'T4a: recordAnswer returns a value');
    if (result) {
      assert(result.status === 'READY_FOR_NEXT_QUESTION',
        `T4b: status transitions to READY_FOR_NEXT_QUESTION (got: ${JSON.stringify(result.status)})`);
    }
  }
}

// ── T5 — recordAnswer stores the answer ──────────────────────────────────────
console.log('\n[p4-nta-surface] T5 — recordAnswer stores the answer in state');
{
  if (!mod || typeof mod.initSession !== 'function' || typeof mod.recordAnswer !== 'function') {
    assert(false, 'T5: initSession or recordAnswer (function missing)');
  } else {
    const session = mod.initSession({ step: 'problem-statement', question: 'Q?', questionId: 'q-001' });
    let result = null;
    try { result = mod.recordAnswer(session, { answer: 'my answer' }); } catch (_) {}
    if (!result) {
      assert(false, 'T5: no result from recordAnswer');
    } else {
      const stateStr = JSON.stringify(result);
      assert(stateStr.includes('my answer'),
        `T5: recorded answer present in returned state (state: ${stateStr.substring(0, 100)})`);
    }
  }
}

// ── T6 — No top-level mutable session state (C11 stateless) ─────────────────
console.log('\n[p4-nta-surface] T6 — no top-level mutable session state (C11)');
{
  if (!fs.existsSync(BOT_HANDLER)) {
    assert(false, 'T6: cannot scan source (file missing)');
  } else {
    const src = fs.readFileSync(BOT_HANDLER, 'utf8');
    // Module-level mutable session containers look like:
    // let sessions = / let session = / const sessions = {} / const state = {}
    // We allow 'const STATES = ' (constant enum-like) but not runtime mutable state
    const hasMutableSession = /^(?:let|var)\s+(sessions?|state|store)\s*=/m.test(src);
    assert(!hasMutableSession,
      `T6: no module-scope "let/var sessions/state/store" mutable variable (found: ${hasMutableSession})`);
  }
}

// ── T7 — No persistent process patterns (C11) ────────────────────────────────
console.log('\n[p4-nta-surface] T7 — no persistent process patterns (C11)');
{
  if (!fs.existsSync(BOT_HANDLER)) {
    assert(false, 'T7: cannot scan source (file missing)');
  } else {
    const src = fs.readFileSync(BOT_HANDLER, 'utf8');
    assert(!/setInterval/.test(src),          'T7a: no setInterval');
    assert(!/\.listen\s*\(/.test(src),        'T7b: no server.listen(');
    assert(!/process\.stdin\.resume/.test(src),'T7c: no process.stdin.resume');
    assert(!/new Server\s*\(/.test(src),      'T7d: no new Server(');
  }
}

// ── T8 — No hardcoded config (ADR-004) ───────────────────────────────────────
console.log('\n[p4-nta-surface] T8 — no hardcoded tenant/channel IDs (ADR-004)');
{
  if (!fs.existsSync(BOT_HANDLER)) {
    assert(false, 'T8: cannot scan source (file missing)');
  } else {
    const src = fs.readFileSync(BOT_HANDLER, 'utf8');
    // GUIDs like xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx indicate hardcoded tenant/channel IDs
    assert(!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(src),
      'T8: no hardcoded GUID-format tenant/channel IDs in source');
  }
}

// ── T-NFR1 — No credentials in source (MC-SEC-02) ────────────────────────────
console.log('\n[p4-nta-surface] T-NFR1 — no credentials in source (MC-SEC-02)');
{
  if (!fs.existsSync(BOT_HANDLER)) {
    assert(false, 'T-NFR1: cannot scan source (file missing)');
  } else {
    const src = fs.readFileSync(BOT_HANDLER, 'utf8');
    assert(!/bearer /i.test(src),              'T-NFR1a: no Bearer token literal');
    assert(!/password\s*[:=]/i.test(src),      'T-NFR1b: no password assignment');
    assert(!/client_secret\s*[:=]/i.test(src), 'T-NFR1c: no client_secret literal');
  }
}

// ── T-NFR2 — State machine returns structured objects ─────────────────────────
console.log('\n[p4-nta-surface] T-NFR2 — state machine returns structured objects');
{
  if (!mod || typeof mod.initSession !== 'function') {
    assert(false, 'T-NFR2: initSession (function missing)');
  } else {
    let init = null;
    try { init = mod.initSession({ step: 's', question: 'q' }); } catch (_) {}
    assert(init !== null && typeof init === 'object' && !(init instanceof Error),
      `T-NFR2a: initSession returns plain object (got: ${typeof init})`);

    if (mod.recordAnswer && init) {
      let rec = null;
      try { rec = mod.recordAnswer(init, { answer: 'a' }); } catch (_) {}
      assert(rec !== null && typeof rec === 'object' && !(rec instanceof Error),
        `T-NFR2b: recordAnswer returns plain object (got: ${typeof rec})`);
    }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[p4-nta-surface] Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
