#!/usr/bin/env node
/**
 * check-sptu-s4-signals-dismiss.js -- AC verification for sptu-s4
 * (dismiss / mark-reviewed for the signals panel).
 *
 * Story: artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s4.md
 * Test plan: artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s4-test-plan.md
 *
 * Run: node tests/check-sptu-s4-signals-dismiss.js
 */
'use strict';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-minimum32chars!!';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const store = require('../src/web-ui/modules/dismissed-signals-store');

let passed = 0, failed = 0;
function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  ✓ ' + name); },
    function(err) { failed++; console.log('  ✗ ' + name + ' -- ' + (err && err.message || err)); }
  );
}

function makeTempFilePath() {
  return path.join(os.tmpdir(), 'sptu-s4-dismissed-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.json');
}

const SIGNAL_A = { source: 'capture-log', type: 'gap', text: 'A real gap worth dismissing' };
const SIGNAL_B = { source: 'decisions', type: 'decision', text: 'A real decision worth dismissing' };

// ---- Unit tests (store module, in-memory adapter) ----

(async function main() {

  await test('dismiss(key) then isDismissed(key) returns true for that key only', function() {
    store._resetDismissedSignalsStoreForTesting();
    const mem = new Set();
    store.setDismissedSignalsStore({
      isDismissed: function(k) { return mem.has(k); },
      dismiss: function(k) { mem.add(k); },
      undismiss: function(k) { mem.delete(k); },
    });
    store.dismiss('keyA');
    assert.strictEqual(store.isDismissed('keyA'), true);
    assert.strictEqual(store.isDismissed('keyB'), false);
  });

  await test('undismiss(key) reverses a prior dismiss(key) and only that key', function() {
    store._resetDismissedSignalsStoreForTesting();
    const mem = new Set(['keyA', 'keyB']);
    store.setDismissedSignalsStore({
      isDismissed: function(k) { return mem.has(k); },
      dismiss: function(k) { mem.add(k); },
      undismiss: function(k) { mem.delete(k); },
    });
    store.undismiss('keyA');
    assert.strictEqual(store.isDismissed('keyA'), false);
    assert.strictEqual(store.isDismissed('keyB'), true);
  });

  await test('Two signals with different source+type+text produce two different, individually-correct dismiss outcomes', function() {
    store._resetDismissedSignalsStoreForTesting();
    const mem = new Set();
    store.setDismissedSignalsStore({
      isDismissed: function(k) { return mem.has(k); },
      dismiss: function(k) { mem.add(k); },
      undismiss: function(k) { mem.delete(k); },
    });
    const keyA = store.deriveDismissKey(SIGNAL_A);
    const keyB = store.deriveDismissKey(SIGNAL_B);
    assert.notStrictEqual(keyA, keyB, 'expected two distinct signals to derive two distinct keys');
    store.dismiss(keyA);
    assert.strictEqual(store.isDismissed(keyA), true);
    assert.strictEqual(store.isDismissed(keyB), false);
  });

  await test('isDismissed returns false for every key when the backing file does not exist or contains invalid JSON', function() {
    const missingPath = makeTempFilePath(); // never created
    const adapterMissing = store.createFsDismissedSignalsStoreAdapter(missingPath);
    assert.strictEqual(adapterMissing.isDismissed('anyKey'), false);

    const corruptPath = makeTempFilePath();
    fs.writeFileSync(corruptPath, '{not valid json', 'utf8');
    const adapterCorrupt = store.createFsDismissedSignalsStoreAdapter(corruptPath);
    assert.strictEqual(adapterCorrupt.isDismissed('anyKey'), false);
    fs.unlinkSync(corruptPath);
  });

  await test('NFR-Security: the persisted file stores only derived hash strings, never raw signal content', function() {
    const tmpPath = makeTempFilePath();
    const adapter = store.createFsDismissedSignalsStoreAdapter(tmpPath);
    const key = store.deriveDismissKey(SIGNAL_A);
    adapter.dismiss(key);
    const raw = fs.readFileSync(tmpPath, 'utf8');
    const parsed = JSON.parse(raw);
    assert.ok(Array.isArray(parsed), 'expected the persisted file to be a JSON array');
    parsed.forEach(function(entry) {
      assert.strictEqual(typeof entry, 'string', 'expected every persisted entry to be a plain hash string, not an object with raw signal fields');
      assert.ok(!entry.includes(SIGNAL_A.text), 'expected no raw signal text to appear anywhere in a persisted entry');
    });
    fs.unlinkSync(tmpPath);
  });

  await test('Real persistence: dismissal survives a fresh adapter instance reading the same real file (simulated reload/new session)', function() {
    const tmpPath = makeTempFilePath();
    const firstInstance = store.createFsDismissedSignalsStoreAdapter(tmpPath);
    const key = store.deriveDismissKey(SIGNAL_A);
    firstInstance.dismiss(key);

    const secondInstance = store.createFsDismissedSignalsStoreAdapter(tmpPath); // independent instance, same file
    assert.strictEqual(secondInstance.isDismissed(key), true, 'expected a second, independent adapter instance pointed at the same file to also report the key as dismissed');
    fs.unlinkSync(tmpPath);
  });

  // ---- View / route-level tests require the view and routes to exist (Tasks 2-3) ----
  // The remaining tests below are written now (RED) and will pass once
  // Task 2 (store module -- already covered above) and Task 3 (routes + view
  // wiring) land. They are listed here so the full 14-test file exists
  // up front, per this feature's own established one-shot-test-file convention.

  const { renderSignalsPanel } = require('../src/web-ui/views/signals-panel-view');

  await test('Dismiss/Undismiss controls render as plain, focusable elements with no tabindex override', function() {
    const signals = [{ id: 's1', source: SIGNAL_A.source, type: SIGNAL_A.type, text: SIGNAL_A.text, timestamp: null, cta: { label: 'Review', skill: '/improve' } }];
    const notDismissedHtml = renderSignalsPanel(signals, 'csrf-abc', undefined, undefined, { showDismissed: false, dismissedKeys: new Set() });
    assert.ok(/action="\/signals\/dismiss"/.test(notDismissedHtml), 'expected a Dismiss form action when not dismissed');
    assert.ok(!/tabindex/.test(notDismissedHtml), 'expected no tabindex override anywhere in the dismiss control markup');

    const key = store.deriveDismissKey(SIGNAL_A);
    const dismissedHtml = renderSignalsPanel(signals, 'csrf-abc', undefined, undefined, { showDismissed: true, dismissedKeys: new Set([key]) });
    assert.ok(/action="\/signals\/undismiss"/.test(dismissedHtml), 'expected an Undismiss form action when dismissed and showDismissed is true');
    assert.ok(!/tabindex/.test(dismissedHtml), 'expected no tabindex override anywhere in the dismiss control markup');
  });

  const signalsPanelRoute = require('../src/web-ui/routes/signals-panel');
  const _csrf = require('../src/web-ui/middleware/csrf');

  function fakeReqRes(method, body, query, session) {
    const req = {
      method: method,
      session: session || { accessToken: 'tok', login: 'tester' },
      query: query || {},
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      on: function(event, cb) {
        if (event === 'data') { cb(new URLSearchParams(body || {}).toString()); }
        if (event === 'end') { cb(); }
        return req;
      },
    };
    const res = {
      statusCode: null,
      headers: {},
      body: '',
      writeHead: function(code, headers) { this.statusCode = code; this.headers = headers || {}; },
      end: function(chunk) { this.body = chunk || ''; },
    };
    return { req: req, res: res };
  }

  await test('Real route dispatch: POST /signals/dismiss removes the signal from the next GET /signals', async function() {
    const fixture = [{ id: 's1', source: SIGNAL_A.source, type: SIGNAL_A.type, text: SIGNAL_A.text, timestamp: null, cta: { label: 'Review', skill: '/improve' } }];
    signalsPanelRoute.setSignalsSource(function() { return fixture; });
    store._resetDismissedSignalsStoreForTesting();
    const mem = new Set();
    store.setDismissedSignalsStore({
      isDismissed: function(k) { return mem.has(k); },
      dismiss: function(k) { mem.add(k); },
      undismiss: function(k) { mem.delete(k); },
    });
    const session = {};
    const csrfToken = await _csrf.generateCsrfToken({ session: session, sessionId: 'sid-1' });

    const dismissCall = fakeReqRes('POST', { _csrf: csrfToken, signalSource: SIGNAL_A.source, signalType: SIGNAL_A.type, signalText: SIGNAL_A.text }, {}, session);
    await signalsPanelRoute.handlePostDismissSignal(dismissCall.req, dismissCall.res);
    assert.ok(dismissCall.res.statusCode === 302 || dismissCall.res.statusCode === 303, 'expected a redirect after a successful dismiss');

    const getCall = fakeReqRes('GET', null, {}, session);
    getCall.req.session.accessToken = 'tok';
    await signalsPanelRoute.handleGetSignalsPanelHtml(getCall.req, getCall.res);
    assert.ok(!getCall.res.body.includes(SIGNAL_A.text), 'expected the dismissed signal to no longer appear in the default view');

    signalsPanelRoute._resetSignalsSourceForTesting();
  });

  await test('Real route dispatch: "show dismissed" reveals a dismissed signal with a working Undismiss action', async function() {
    const fixture = [{ id: 's1', source: SIGNAL_A.source, type: SIGNAL_A.type, text: SIGNAL_A.text, timestamp: null, cta: { label: 'Review', skill: '/improve' } }];
    signalsPanelRoute.setSignalsSource(function() { return fixture; });
    store._resetDismissedSignalsStoreForTesting();
    const mem = new Set();
    store.setDismissedSignalsStore({
      isDismissed: function(k) { return mem.has(k); },
      dismiss: function(k) { mem.add(k); },
      undismiss: function(k) { mem.delete(k); },
    });
    const session = {};
    const csrfToken = await _csrf.generateCsrfToken({ session: session, sessionId: 'sid-2' });

    const dismissCall = fakeReqRes('POST', { _csrf: csrfToken, signalSource: SIGNAL_A.source, signalType: SIGNAL_A.type, signalText: SIGNAL_A.text }, {}, session);
    await signalsPanelRoute.handlePostDismissSignal(dismissCall.req, dismissCall.res);

    const showDismissedCall = fakeReqRes('GET', null, { showDismissed: 'true' }, session);
    showDismissedCall.req.session.accessToken = 'tok';
    await signalsPanelRoute.handleGetSignalsPanelHtml(showDismissedCall.req, showDismissedCall.res);
    assert.ok(showDismissedCall.res.body.includes(SIGNAL_A.text), 'expected the dismissed signal to reappear under showDismissed=true');
    assert.ok(/action="\/signals\/undismiss"/.test(showDismissedCall.res.body), 'expected an Undismiss action for the dismissed signal');

    const undismissCall = fakeReqRes('POST', { _csrf: csrfToken, signalSource: SIGNAL_A.source, signalType: SIGNAL_A.type, signalText: SIGNAL_A.text }, {}, session);
    await signalsPanelRoute.handlePostUndismissSignal(undismissCall.req, undismissCall.res);

    const defaultCall = fakeReqRes('GET', null, {}, session);
    defaultCall.req.session.accessToken = 'tok';
    await signalsPanelRoute.handleGetSignalsPanelHtml(defaultCall.req, defaultCall.res);
    assert.ok(defaultCall.res.body.includes(SIGNAL_A.text), 'expected the signal back in the default view after undismiss');

    signalsPanelRoute._resetSignalsSourceForTesting();
  });

  await test('Real route dispatch: the wired production adapter correctly differentiates two real dismiss-key inputs (D37 AC5)', async function() {
    const tmpPath = makeTempFilePath();
    store._resetDismissedSignalsStoreForTesting();
    store.setDismissedSignalsStore(store.createFsDismissedSignalsStoreAdapter(tmpPath)); // the REAL production adapter, not a test override
    const fixture = [
      { id: 's1', source: SIGNAL_A.source, type: SIGNAL_A.type, text: SIGNAL_A.text, timestamp: null, cta: { label: 'Review', skill: '/improve' } },
      { id: 's2', source: SIGNAL_B.source, type: SIGNAL_B.type, text: SIGNAL_B.text, timestamp: null, cta: { label: 'Review', skill: '/improve' } },
    ];
    signalsPanelRoute.setSignalsSource(function() { return fixture; });
    const session = {};
    const csrfToken = await _csrf.generateCsrfToken({ session: session, sessionId: 'sid-3' });

    const dismissCall = fakeReqRes('POST', { _csrf: csrfToken, signalSource: SIGNAL_A.source, signalType: SIGNAL_A.type, signalText: SIGNAL_A.text }, {}, session);
    await signalsPanelRoute.handlePostDismissSignal(dismissCall.req, dismissCall.res);

    const getCall = fakeReqRes('GET', null, {}, session);
    getCall.req.session.accessToken = 'tok';
    await signalsPanelRoute.handleGetSignalsPanelHtml(getCall.req, getCall.res);
    assert.ok(!getCall.res.body.includes(SIGNAL_A.text), 'expected signal A excluded');
    assert.ok(getCall.res.body.includes(SIGNAL_B.text), 'expected signal B NOT excluded -- proves real differentiation, not a blanket effect');

    signalsPanelRoute._resetSignalsSourceForTesting();
    fs.unlinkSync(tmpPath);
  });

  await test('Real route dispatch: POST /signals/dismiss without a valid CSRF token is rejected (closes review finding 1-M1)', async function() {
    const fixture = [{ id: 's1', source: SIGNAL_A.source, type: SIGNAL_A.type, text: SIGNAL_A.text, timestamp: null, cta: { label: 'Review', skill: '/improve' } }];
    signalsPanelRoute.setSignalsSource(function() { return fixture; });
    store._resetDismissedSignalsStoreForTesting();
    const mem = new Set();
    store.setDismissedSignalsStore({
      isDismissed: function(k) { return mem.has(k); },
      dismiss: function(k) { mem.add(k); },
      undismiss: function(k) { mem.delete(k); },
    });
    const session = {};

    const noCsrfCall = fakeReqRes('POST', { signalSource: SIGNAL_A.source, signalType: SIGNAL_A.type, signalText: SIGNAL_A.text }, {}, session);
    await signalsPanelRoute.handlePostDismissSignal(noCsrfCall.req, noCsrfCall.res);
    assert.strictEqual(noCsrfCall.res.statusCode, 403, 'expected 403 for a missing CSRF token');

    const badCsrfCall = fakeReqRes('POST', { _csrf: 'not-a-real-token', signalSource: SIGNAL_A.source, signalType: SIGNAL_A.type, signalText: SIGNAL_A.text }, {}, session);
    await signalsPanelRoute.handlePostDismissSignal(badCsrfCall.req, badCsrfCall.res);
    assert.strictEqual(badCsrfCall.res.statusCode, 403, 'expected 403 for an invalid CSRF token');

    const getCall = fakeReqRes('GET', null, {}, session);
    getCall.req.session.accessToken = 'tok';
    await signalsPanelRoute.handleGetSignalsPanelHtml(getCall.req, getCall.res);
    assert.ok(getCall.res.body.includes(SIGNAL_A.text), 'expected the signal NOT dismissed -- both rejected requests must have no effect');

    signalsPanelRoute._resetSignalsSourceForTesting();
  });

  await test('Real route dispatch: POST /signals/dismiss with a valid CSRF token succeeds', async function() {
    const fixture = [{ id: 's1', source: SIGNAL_A.source, type: SIGNAL_A.type, text: SIGNAL_A.text, timestamp: null, cta: { label: 'Review', skill: '/improve' } }];
    signalsPanelRoute.setSignalsSource(function() { return fixture; });
    store._resetDismissedSignalsStoreForTesting();
    const mem = new Set();
    store.setDismissedSignalsStore({
      isDismissed: function(k) { return mem.has(k); },
      dismiss: function(k) { mem.add(k); },
      undismiss: function(k) { mem.delete(k); },
    });
    const session = {};
    const csrfToken = await _csrf.generateCsrfToken({ session: session, sessionId: 'sid-4' });

    const dismissCall = fakeReqRes('POST', { _csrf: csrfToken, signalSource: SIGNAL_A.source, signalType: SIGNAL_A.type, signalText: SIGNAL_A.text }, {}, session);
    await signalsPanelRoute.handlePostDismissSignal(dismissCall.req, dismissCall.res);
    assert.ok(dismissCall.res.statusCode === 302 || dismissCall.res.statusCode === 303, 'expected a redirect on success');

    const getCall = fakeReqRes('GET', null, {}, session);
    getCall.req.session.accessToken = 'tok';
    await signalsPanelRoute.handleGetSignalsPanelHtml(getCall.req, getCall.res);
    assert.ok(!getCall.res.body.includes(SIGNAL_A.text), 'expected the signal dismissed');

    signalsPanelRoute._resetSignalsSourceForTesting();
  });

  await test('Real route dispatch: a corrupt dismissed-signals.json degrades gracefully at the route level too', async function() {
    const tmpPath = makeTempFilePath();
    fs.writeFileSync(tmpPath, '{not valid json', 'utf8');
    store._resetDismissedSignalsStoreForTesting();
    store.setDismissedSignalsStore(store.createFsDismissedSignalsStoreAdapter(tmpPath));
    const fixture = [{ id: 's1', source: SIGNAL_A.source, type: SIGNAL_A.type, text: SIGNAL_A.text, timestamp: null, cta: { label: 'Review', skill: '/improve' } }];
    signalsPanelRoute.setSignalsSource(function() { return fixture; });

    const getCall = fakeReqRes('GET', null, {}, { accessToken: 'tok', login: 'tester' });
    await signalsPanelRoute.handleGetSignalsPanelHtml(getCall.req, getCall.res);
    assert.strictEqual(getCall.res.statusCode, 200, 'expected a normal 200 response, not a 500, when the dismissed-signals file is corrupt');
    assert.ok(getCall.res.body.includes(SIGNAL_A.text), 'expected the signal to render normally -- corrupt file treated as an empty dismissed-set');

    signalsPanelRoute._resetSignalsSourceForTesting();
    fs.unlinkSync(tmpPath);
  });

  await test('NFR-Performance: dismissed-set lookup stays within the established <100ms render budget', function() {
    store._resetDismissedSignalsStoreForTesting();
    const dismissedSet = new Set();
    for (let i = 0; i < 500; i++) { dismissedSet.add('key-' + i); }
    store.setDismissedSignalsStore({
      isDismissed: function(k) { return dismissedSet.has(k); },
      dismiss: function(k) { dismissedSet.add(k); },
      undismiss: function(k) { dismissedSet.delete(k); },
    });
    const { filterSignals } = require('../src/web-ui/utils/filter-signals');
    const { paginateSignals } = require('../src/web-ui/utils/paginate-signals');
    const big = [];
    for (let i = 0; i < 5340; i++) {
      big.push({ id: 's' + i, source: 'capture-log', type: 'gap', text: 'signal number ' + i, timestamp: null, cta: { label: 'Review', skill: '/improve' } });
    }
    const start = Date.now();
    const afterTypeSource = filterSignals(big, { hideTypes: [], hideSources: [] });
    const afterDismiss = afterTypeSource.filter(function(s) { return !store.isDismissed(store.deriveDismissKey(s)); });
    paginateSignals(afterDismiss, '1');
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 100, 'expected filterSignals + dismissed-filter + paginateSignals on 5,340 items to complete in under 100ms, took ' + elapsed + 'ms');
  });

  console.log('\n[sptu-s4-signals-dismiss] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('[sptu-s4-signals-dismiss] Unexpected error:', err && err.stack || err);
  process.exit(1);
});
