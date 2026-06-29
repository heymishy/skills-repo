#!/usr/bin/env node
// check-bee2-empty-state.js — AC verification tests for bee.2 (first-run empty-state)
// Tests T1–T12 (unit + integration + NFR)
// All tests FAIL until src/web-ui/routes/journey.js has handleJourneys with
// injectable listJourneys adapter and the /journeys route is wired in server.js.
// No external dependencies — Node.js built-ins only.

'use strict';

const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function ok(condition, label) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else           { console.log(`  ✗ ${label}`); failed++; }
}

function eq(actual, expected, label) {
  if (actual === expected) { console.log(`  ✓ ${label}`); passed++; }
  else {
    console.log(`  ✗ ${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
    failed++;
  }
}

// Environment setup
process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;

// Helpers
function mockRes() {
  return {
    statusCode: null,
    headers: {},
    body: '',
    writeHead(code, hdrs) {
      this.statusCode = code;
      if (hdrs) Object.assign(this.headers, hdrs);
    },
    end(b) { this.body = b != null ? String(b) : ''; },
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; }
  };
}

function mockReq(overrides) {
  return Object.assign({
    session: { accessToken: 'test-token', login: 'alice', tenantId: 'org-alice' },
    method: 'GET',
    url: '/journeys',
    params: {},
    query: {},
    headers: {}
  }, overrides || {});
}

// Load handler under test — will throw if module/export not yet present (TDD red)
let handleJourneys;
let setListJourneys;

try {
  const journeyRoute = require('../src/web-ui/routes/journey');
  handleJourneys  = journeyRoute.handleJourneys;
  setListJourneys = journeyRoute.setListJourneys;

  if (!handleJourneys)  { console.log('✗ FATAL: handleJourneys not exported from routes/journey.js');  failed++; }
  if (!setListJourneys) { console.log('✗ FATAL: setListJourneys not exported from routes/journey.js'); failed++; }
} catch (e) {
  console.log('\n✗ FATAL: src/web-ui/routes/journey.js did not load — ' + e.message);
  console.log('  All T1–T10 tests will fail');
  failed++;
}

// ─────────────────────────────────────────────────────────────────────────────
// T1 — Unit: empty listJourneys returns 200 with empty-state block
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT1 — empty listJourneys() → 200 with empty-state block');
async function t1() {
  if (!handleJourneys || !setListJourneys) { ok(false, 'T1: skipped — handler not loaded'); return; }
  setListJourneys(async function() { return []; });
  const req = mockReq();
  const res = mockRes();
  await handleJourneys(req, res);
  eq(res.statusCode, 200, 'T1.1: status 200');
  ok(
    res.body.includes('id="empty-state"') || res.body.toLowerCase().includes('empty-state') || res.body.toLowerCase().includes('no skill sessions') || res.body.toLowerCase().includes("haven't started") || res.body.toLowerCase().includes('no sessions'),
    'T1.2: body contains empty-state block indicator'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// T2 — Unit: empty state — journey card elements absent
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT2 — empty state: no journey card elements in body');
async function t2() {
  if (!handleJourneys || !setListJourneys) { ok(false, 'T2: skipped'); return; }
  setListJourneys(async function() { return []; });
  const req = mockReq();
  const res = mockRes();
  await handleJourneys(req, res);
  ok(
    !res.body.includes('data-journey-id') && !res.body.includes('journey-card'),
    'T2.1: no journey card elements when list is empty'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// T3 — Unit: empty-state body contains explanation of no sessions (AC2a)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT3 — empty-state contains explanation text (AC2a)');
async function t3() {
  if (!handleJourneys || !setListJourneys) { ok(false, 'T3: skipped'); return; }
  setListJourneys(async function() { return []; });
  const req = mockReq();
  const res = mockRes();
  await handleJourneys(req, res);
  const lower = res.body.toLowerCase();
  ok(
    lower.includes('no skill session') || lower.includes("haven't started") || lower.includes('no sessions') || lower.includes('no journeys') || lower.includes('get started'),
    'T3.1: empty-state explains no sessions started yet'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// T4 — Unit: empty-state body describes what a skill session produces (AC2b)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT4 — empty-state describes what a skill session produces (AC2b)');
async function t4() {
  if (!handleJourneys || !setListJourneys) { ok(false, 'T4: skipped'); return; }
  setListJourneys(async function() { return []; });
  const req = mockReq();
  const res = mockRes();
  await handleJourneys(req, res);
  const lower = res.body.toLowerCase();
  ok(
    lower.includes('artefact') || lower.includes('artifact') || lower.includes('governed') || lower.includes('discovery') || lower.includes('specification') || lower.includes('document'),
    'T4.1: empty-state describes skill session output'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// T5 — Unit: empty-state body contains link to skill picker at /skills (AC2c)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT5 — empty-state contains skill picker link (AC2c)');
async function t5() {
  if (!handleJourneys || !setListJourneys) { ok(false, 'T5: skipped'); return; }
  setListJourneys(async function() { return []; });
  const req = mockReq();
  const res = mockRes();
  await handleJourneys(req, res);
  ok(res.body.includes('href="/skills"'), 'T5.1: body contains href="/skills"');
}

// ─────────────────────────────────────────────────────────────────────────────
// T6 — Unit: populated listJourneys returns 200 with journey cards (AC3)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT6 — populated listJourneys → 200 with journey cards');
async function t6() {
  if (!handleJourneys || !setListJourneys) { ok(false, 'T6: skipped'); return; }
  const journeys = [
    { id: 'j1', title: 'First Journey',  featureSlug: 'feat-1' },
    { id: 'j2', title: 'Second Journey', featureSlug: 'feat-2' }
  ];
  setListJourneys(async function() { return journeys; });
  const req = mockReq();
  const res = mockRes();
  await handleJourneys(req, res);
  eq(res.statusCode, 200, 'T6.1: status 200');
  ok(res.body.includes('j1'), 'T6.2: body contains journey id j1');
  ok(res.body.includes('j2'), 'T6.3: body contains journey id j2');
}

// ─────────────────────────────────────────────────────────────────────────────
// T7 — Unit: populated list — empty-state block absent (AC3)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT7 — populated list: empty-state block absent (AC3)');
async function t7() {
  if (!handleJourneys || !setListJourneys) { ok(false, 'T7: skipped'); return; }
  setListJourneys(async function() {
    return [{ id: 'j1', title: 'Test Journey', featureSlug: 'feat-1' }];
  });
  const req = mockReq();
  const res = mockRes();
  await handleJourneys(req, res);
  const lower = res.body.toLowerCase();
  ok(
    !lower.includes('no skill sessions') && !lower.includes("haven't started") && !lower.includes('no sessions yet'),
    'T7.1: empty-state text absent when journeys exist'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// T8 — Unit: listJourneys throws → HTTP 500 (AC5)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT8 — listJourneys throws → HTTP 500 (AC5)');
async function t8() {
  if (!handleJourneys || !setListJourneys) { ok(false, 'T8: skipped'); return; }
  setListJourneys(async function() { throw new Error('db connection refused'); });
  const req = mockReq();
  const res = mockRes();
  await handleJourneys(req, res);
  eq(res.statusCode, 500, 'T8.1: status 500 on listJourneys error');
}

// ─────────────────────────────────────────────────────────────────────────────
// T9 — Unit: error path — empty-state block absent, not a silent 200 (AC5)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT9 — error path: empty-state absent, not a silent 200 (AC5)');
async function t9() {
  if (!handleJourneys || !setListJourneys) { ok(false, 'T9: skipped'); return; }
  setListJourneys(async function() { throw new Error('store error'); });
  const req = mockReq();
  const res = mockRes();
  await handleJourneys(req, res);
  const lower = res.body.toLowerCase();
  ok(
    !lower.includes('no skill sessions') && !lower.includes("haven't started") && !lower.includes('no sessions yet'),
    'T9.1: empty-state content absent on error path'
  );
  // Must not be a silent 200 with empty list
  ok(res.statusCode !== 200, 'T9.2: status is NOT 200 on error (must be 4xx or 5xx)');
}

// ─────────────────────────────────────────────────────────────────────────────
// T10 — Unit: default listJourneys adapter throws (D37 injectable adapter rule)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT10 — default listJourneys adapter throws (D37)');
async function t10() {
  // Re-require a fresh copy to avoid stub from earlier tests
  let freshListJourneys;
  try {
    // Clear require cache for routes/journey.js
    const routePath = require.resolve('../src/web-ui/routes/journey');
    delete require.cache[routePath];
    const freshRoute = require('../src/web-ui/routes/journey');
    // Restore the stub for other tests after this one
    if (freshRoute.setListJourneys && setListJourneys) {
      setListJourneys(async function() { return []; }); // reset for safety
    }
    // Try to call the default un-wired adapter
    // The journey store module should expose the default
    const journeyStore = require('../src/web-ui/modules/journey-store');
    if (journeyStore && typeof journeyStore.listJourneys === 'function') {
      let threw = false;
      try {
        await journeyStore.listJourneys('test-tenant');
      } catch (e) {
        threw = true;
        ok(e.message.includes('Adapter not wired') || e.message.includes('not wired'), 'T10.1: default stub throws with "not wired" message');
      }
      if (!threw) {
        ok(false, 'T10.1: default stub MUST throw — returned silently instead');
      }
    } else {
      // If journey-store doesn't have listJourneys directly, check route handler behaviour
      ok(false, 'T10: journey-store.listJourneys not found — verify D37 compliance manually');
    }
  } catch (e) {
    ok(false, 'T10: could not load journey-store — ' + e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// T11 — NFR: empty-state content present in raw body string (no JS required)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT11 — NFR: empty-state content is in raw response body string (AC4)');
async function t11() {
  if (!handleJourneys || !setListJourneys) { ok(false, 'T11: skipped'); return; }
  setListJourneys(async function() { return []; });
  const req = mockReq();
  const res = mockRes();
  await handleJourneys(req, res);
  // The empty-state content must be in the raw string — no need to run JS
  const lower = res.body.toLowerCase();
  ok(
    lower.includes('skill') || lower.includes('session') || lower.includes('journey'),
    'T11.1: empty-state text present in raw HTML before any JS execution'
  );
  ok(
    res.body.includes('href="/skills"'),
    'T11.2: skill picker link present in raw HTML'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// T12 — NFR: response time < 50ms when listJourneys is synchronous
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT12 — NFR: response time < 50ms for empty state');
async function t12() {
  if (!handleJourneys || !setListJourneys) { ok(false, 'T12: skipped'); return; }
  setListJourneys(async function() { return []; });
  const req = mockReq();
  const res = mockRes();
  const start = Date.now();
  await handleJourneys(req, res);
  const elapsed = Date.now() - start;
  ok(elapsed < 50, 'T12.1: handler completed in < 50ms (took ' + elapsed + 'ms)');
}

// ─────────────────────────────────────────────────────────────────────────────
// Run all async tests sequentially
// ─────────────────────────────────────────────────────────────────────────────
(async function main() {
  await t1();
  await t2();
  await t3();
  await t4();
  await t5();
  await t6();
  await t7();
  await t8();
  await t9();
  await t10();
  await t11();
  await t12();

  console.log('\n─────────────────────────────');
  console.log('bee.2 empty-state: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    process.exit(1);
  }
})();
