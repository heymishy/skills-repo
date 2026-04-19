#!/usr/bin/env node
// check-p4-nta-gate-translation.js — test plan verification for p4-nta-gate-translation
// Covers T1–T8, T-NFR1, T-NFR2
// Tests FAIL until src/teams-bot/bot-approval-router.js is implemented — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT            = path.join(__dirname, '..');
const APPROVAL_ROUTER = path.join(ROOT, 'src', 'teams-bot', 'bot-approval-router.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function loadModule() {
  if (!fs.existsSync(APPROVAL_ROUTER)) return null;
  try {
    delete require.cache[require.resolve(APPROVAL_ROUTER)];
    return require(APPROVAL_ROUTER);
  } catch (_) { return null; }
}

// Valid config fixture
const VALID_CONFIG = {
  approval_channels: {
    teams: {
      approvers: ['alice', 'bob'],
      tenantId:  null // read from env in real use
    }
  }
};

// ── T1 — Module exists and exports routeApproval ─────────────────────────────
console.log('\n[p4-nta-gate-translation] T1 — module exists and exports routeApproval');
{
  const exists = fs.existsSync(APPROVAL_ROUTER);
  assert(exists, 'T1a: src/teams-bot/bot-approval-router.js exists');
  const mod = loadModule();
  assert(mod !== null, 'T1b: module loads without error');
  if (mod) {
    assert(typeof mod.routeApproval === 'function', 'T1c: exports routeApproval as function');
  }
}

const mod = loadModule();

// ── T2 — routeApproval calls processApproveCommentEvent with equivalent args ─
console.log('\n[p4-nta-gate-translation] T2 — routeApproval calls processApproveCommentEvent with storySlug');
{
  if (!mod || typeof mod.routeApproval !== 'function') {
    assert(false, 'T2: routeApproval (function missing)');
  } else {
    let calledWith = null;
    const mockProcessDor = (args) => { calledWith = args; return { success: true }; };
    let result = null;
    try {
      result = mod.routeApproval(
        { storySlug: 'test-story', approver: 'alice', config: VALID_CONFIG },
        { processApproveCommentEvent: mockProcessDor }
      );
    } catch (_) {}
    assert(calledWith !== null, 'T2a: processApproveCommentEvent was called');
    if (calledWith) {
      const calledStr = JSON.stringify(calledWith);
      assert(calledStr.includes('test-story'),
        `T2b: called with storySlug (args: ${calledStr.substring(0, 120)})`);
    }
  }
}

// ── T3 — Approval event includes channel and timestamp ────────────────────────
console.log('\n[p4-nta-gate-translation] T3 — approval event includes channel: "teams" and approvedAt');
{
  if (!mod || typeof mod.routeApproval !== 'function') {
    assert(false, 'T3: routeApproval (function missing)');
  } else {
    let capturedEvent = null;
    const mockProcessDor = (args) => { capturedEvent = args; return { success: true }; };
    try {
      mod.routeApproval(
        { storySlug: 'test-story', approver: 'alice', config: VALID_CONFIG },
        { processApproveCommentEvent: mockProcessDor }
      );
    } catch (_) {}
    if (!capturedEvent) {
      assert(false, 'T3: no event captured');
    } else {
      const evStr = JSON.stringify(capturedEvent);
      assert(evStr.includes('"teams"') || (capturedEvent.channel === 'teams'),
        `T3a: channel: "teams" in event (event: ${evStr.substring(0, 120)})`);
      // approvedAt should be present as an ISO timestamp or Date
      const hasApprovedAt = capturedEvent.approvedAt || capturedEvent.dorSignedOffAt;
      assert(!!hasApprovedAt,
        `T3b: approvedAt or dorSignedOffAt timestamp present (event: ${evStr.substring(0, 120)})`);
    }
  }
}

// ── T4 — Successful approval produces dorStatus: signed-off ──────────────────
console.log('\n[p4-nta-gate-translation] T4 — successful approval → dorStatus: signed-off');
{
  if (!mod || typeof mod.routeApproval !== 'function') {
    assert(false, 'T4: routeApproval (function missing)');
  } else {
    const mockProcessDor = () => ({ success: true, dorStatus: 'signed-off' });
    let result = null;
    try {
      result = mod.routeApproval(
        { storySlug: 'test-story', approver: 'alice', config: VALID_CONFIG },
        { processApproveCommentEvent: mockProcessDor }
      );
    } catch (_) {}
    const resultStr = JSON.stringify(result || {});
    assert(resultStr.includes('signed-off') || resultStr.includes('"success":true'),
      `T4: result indicates success or signed-off (got: ${resultStr.substring(0, 120)})`);
  }
}

// ── T5 — Missing config → MISSING_CONFIG error ───────────────────────────────
console.log('\n[p4-nta-gate-translation] T5 — missing Teams config → MISSING_CONFIG error message');
{
  if (!mod || typeof mod.routeApproval !== 'function') {
    assert(false, 'T5: routeApproval (function missing)');
  } else {
    let result = null;
    let threw  = false;
    try {
      result = mod.routeApproval(
        { storySlug: 'test-story', approver: 'alice', config: {} },
        {}
      );
    } catch (e) { threw = true; result = { error: e.message }; }
    const resultStr = JSON.stringify(result || {});
    const hasError = threw ||
      (result && result.error) ||
      (result && typeof result.message === 'string');
    assert(hasError, `T5a: error returned on missing config (threw: ${threw}, result: ${resultStr.substring(0, 120)})`);
    const text = resultStr + (threw ? '' : '');
    assert(/approval routing configuration is missing/i.test(text) ||
           /missing/i.test(text) ||
           (result && typeof result.message === 'string' && /missing/i.test(result.message)),
      `T5b: error message matches "Approval routing configuration is missing" (got: ${text.substring(0, 120)})`);
  }
}

// ── T6 — No auto-approval mechanism (C4) ─────────────────────────────────────
console.log('\n[p4-nta-gate-translation] T6 — no auto-approval mechanism in source (C4)');
{
  if (!fs.existsSync(APPROVAL_ROUTER)) {
    assert(false, 'T6: cannot scan source (file missing)');
  } else {
    const src = fs.readFileSync(APPROVAL_ROUTER, 'utf8');
    assert(!/setTimeout/.test(src),   'T6a: no setTimeout in source');
    assert(!/setInterval/.test(src),  'T6b: no setInterval in source');
    assert(!/autoApprove/.test(src),  'T6c: no autoApprove pattern');
    assert(!/auto.approve/i.test(src),'T6d: no auto_approve/auto-approve pattern');
  }
}

// ── T7 — Approver validated against config list ───────────────────────────────
console.log('\n[p4-nta-gate-translation] T7 — unknown approver rejected');
{
  if (!mod || typeof mod.routeApproval !== 'function') {
    assert(false, 'T7: routeApproval (function missing)');
  } else {
    const mockProcessDor = () => ({ success: true });
    let result = null;
    let threw  = false;
    try {
      result = mod.routeApproval(
        { storySlug: 'test-story', approver: 'unknown-user', config: VALID_CONFIG },
        { processApproveCommentEvent: mockProcessDor }
      );
    } catch (e) { threw = true; result = { error: e.message }; }
    const isRejected = threw ||
      (result && result.error) ||
      (result && result.success === false);
    assert(isRejected,
      `T7: unknown approver rejected (threw: ${threw}, result: ${JSON.stringify(result || {}).substring(0, 100)})`);
  }
}

// ── T8 — No hardcoded tenant/channel IDs (ADR-004) ───────────────────────────
console.log('\n[p4-nta-gate-translation] T8 — no hardcoded tenant/channel IDs (ADR-004)');
{
  if (!fs.existsSync(APPROVAL_ROUTER)) {
    assert(false, 'T8: cannot scan source (file missing)');
  } else {
    const src = fs.readFileSync(APPROVAL_ROUTER, 'utf8');
    assert(!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(src),
      'T8: no hardcoded GUID-format tenant/channel IDs');
  }
}

// ── T-NFR1 — No credentials in approval event payload (MC-SEC-02) ────────────
console.log('\n[p4-nta-gate-translation] T-NFR1 — no credentials in approval event payload (MC-SEC-02)');
{
  if (!mod || typeof mod.routeApproval !== 'function') {
    assert(false, 'T-NFR1: routeApproval (function missing)');
  } else {
    let capturedEvent = null;
    const mockProcessDor = (args) => { capturedEvent = args; return { success: true }; };
    try {
      mod.routeApproval(
        { storySlug: 'test-story', approver: 'alice', config: VALID_CONFIG },
        { processApproveCommentEvent: mockProcessDor }
      );
    } catch (_) {}
    if (!capturedEvent) {
      assert(false, 'T-NFR1: no event to check');
    } else {
      const evStr = JSON.stringify(capturedEvent).toLowerCase();
      assert(!/\btoken\b/.test(evStr) && !/bearer /.test(evStr),
        'T-NFR1a: no token/Bearer in event payload');
      assert(!/\bsecret\b/.test(evStr) && !/\bpassword\b/.test(evStr),
        'T-NFR1b: no secret/password in event payload');
    }
  }
}

// ── T-NFR2 — No bypass or force-approve path in source ───────────────────────
console.log('\n[p4-nta-gate-translation] T-NFR2 — no bypass path in source');
{
  if (!fs.existsSync(APPROVAL_ROUTER)) {
    assert(false, 'T-NFR2: cannot scan source (file missing)');
  } else {
    const src = fs.readFileSync(APPROVAL_ROUTER, 'utf8');
    assert(!/skipApproval/i.test(src), 'T-NFR2a: no skipApproval');
    assert(!/bypassC4/i.test(src),     'T-NFR2b: no bypassC4');
    assert(!/forceApprove/i.test(src), 'T-NFR2c: no forceApprove');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[p4-nta-gate-translation] Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
