# Dismiss / mark-reviewed for the signals panel — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in `artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s4-test-plan.md` pass. Add a reversible, persistent per-signal Dismiss/Undismiss mechanism — a new D37 injectable adapter (`dismissed-signals-store.js`), two new CSRF-guarded POST routes, and view changes — composed with `sptu-s2`'s existing pre-pagination filter pass, not a second parallel filtering path.
**Branch:** `feature/sptu-s4`
**Worktree:** `.worktrees/sptu-s4`
**Test command:** `npm test` (full suite via `node scripts/run-all-tests.js`); a single new file can be run directly via `node tests/check-sptu-s4-signals-dismiss.js`

---

## File map

```
Create:
  src/web-ui/modules/dismissed-signals-store.js — D37 injectable adapter: isDismissed(key)/dismiss(key)/undismiss(key), deriveDismissKey(signal) (sha256 of source+type+text), setDismissedSignalsStore(adapter), _resetDismissedSignalsStoreForTesting(), createFsDismissedSignalsStoreAdapter(filePath) (real fs-backed adapter, in-memory cache per instance, never throws on missing/corrupt file)
  tests/check-sptu-s4-signals-dismiss.js — 14 tests per the test plan (5 unit, 7 integration, 2 NFR)

Modify:
  src/web-ui/routes/signals-panel.js — two new route handlers (handlePostDismissSignal, handlePostUndismissSignal), CSRF-guarded via middleware/csrf.js's csrfGuard; handleGetSignalsPanelHtml extended to compose the dismissed-set filter (pre-pagination, after sptu-s2's own filterSignals call) and read req.query.showDismissed
  src/web-ui/views/signals-panel-view.js — Dismiss/Undismiss form per item (reusing the existing _hiddenField/_csrf.csrfField convention), a "✓ Dismissed" text marker, a show-dismissed toggle link
  src/web-ui/server.js — register POST /signals/dismiss and POST /signals/undismiss in the route dispatch (authGuard-wrapped, matching GET /signals); separate D37 production-wiring block calling setDismissedSignalsStore(createFsDismissedSignalsStoreAdapter(...)), alongside the existing signals-aggregator wiring
```

---

## Task 1: Write failing tests for the full story (AC1-AC7 + CSRF)

**Files:**
- Create: `tests/check-sptu-s4-signals-dismiss.js`

- [ ] **Step 1: Write the failing test file**

```javascript
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
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-sptu-s4-signals-dismiss.js
```

Expected output: the module-require lines themselves throw (`Cannot find module '../src/web-ui/modules/dismissed-signals-store'`), since no implementation exists yet. This is RED — expected and correct. Do NOT implement anything in `src/` yet; that is Tasks 2-4's job, different subagents will do each.

- [ ] **Step 3: Commit**

```bash
git add tests/check-sptu-s4-signals-dismiss.js
git commit -m "test: add failing AC1-AC7 and CSRF tests for the signals dismiss story"
```

---

## Task 2: Implement the dismissed-signals-store module (pure logic + fs adapter)

**Files:**
- Create: `src/web-ui/modules/dismissed-signals-store.js`

- [ ] **Step 1: Write the module**

```javascript
'use strict';
// dismissed-signals-store.js -- sptu-s4: D37 injectable adapter for a
// reversible per-signal "dismiss" mechanism. Matches
// signals-aggregator.js's own _fileReadAdapter/createFsFileReadAdapter
// precedent exactly: stub default throws, production adapter wired once in
// server.js at startup.
const fs = require('fs');
const crypto = require('crypto');

// D37: default stub MUST throw, never return empty/null.
let _dismissedSignalsStore = function() {
  throw new Error('Adapter not wired: dismissed-signals-store. Call setDismissedSignalsStore() with a real implementation before use.');
};

function setDismissedSignalsStore(adapter) { _dismissedSignalsStore = adapter; }
function _resetDismissedSignalsStoreForTesting() {
  _dismissedSignalsStore = function() {
    throw new Error('Adapter not wired: dismissed-signals-store. Call setDismissedSignalsStore() with a real implementation before use.');
  };
}

// Stable key -- source+type+text, NEVER signal.id (confirmed non-deterministic
// for parse-error signals, ep1-s2-dod.md AC5 deviation). Node's built-in
// crypto module only -- no new npm dependency. The separator is a real NUL
// character built via String.fromCharCode(0) -- deliberately NOT a printable
// character like a space, since a space (or any printable separator) can
// appear inside source/type/text itself and create a real collision between
// two different signals (e.g. source="a b", type="c" vs source="a",
// type="b c" joined with a space both produce "a b c"). NUL cannot appear in
// normal signal text, so this separator is collision-safe for AC4's own
// "two distinct signals never collide" requirement.
const _DISMISS_KEY_SEPARATOR = String.fromCharCode(0);
function deriveDismissKey(signal) {
  const raw = String((signal && signal.source) || '') + _DISMISS_KEY_SEPARATOR +
              String((signal && signal.type) || '') + _DISMISS_KEY_SEPARATOR +
              String((signal && signal.text) || '');
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}

function isDismissed(key) {
  const adapter = _dismissedSignalsStore;
  if (typeof adapter === 'function') return adapter(); // triggers the D37 throw
  return adapter.isDismissed(key);
}
function dismiss(key) {
  const adapter = _dismissedSignalsStore;
  if (typeof adapter === 'function') return adapter();
  return adapter.dismiss(key);
}
function undismiss(key) {
  const adapter = _dismissedSignalsStore;
  if (typeof adapter === 'function') return adapter();
  return adapter.undismiss(key);
}

// The real, production fs-backed adapter -- wired in server.js at startup.
// Caches the parsed Set in memory per adapter instance (loaded lazily on
// first use, kept in sync by dismiss()/undismiss()) so that a single
// long-lived server process only pays the file-read cost once, not once per
// signal per request -- required to stay within the <100ms render budget
// when composed with filterSignals()/paginateSignals() over ~5,340 signals.
// A SEPARATE adapter instance (e.g. in AC2's own persistence test) always
// re-reads the real file on its own first use, so this caching never masks
// a real cross-instance persistence bug.
function createFsDismissedSignalsStoreAdapter(filePath) {
  let _cache = null; // Set<string> | null
  function _load() {
    if (_cache) return _cache;
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      _cache = new Set(Array.isArray(parsed) ? parsed.filter(function(x) { return typeof x === 'string'; }) : []);
    } catch (_) {
      // AC7: missing file (first use) or invalid JSON -- treat as empty, never throw.
      _cache = new Set();
    }
    return _cache;
  }
  function _persist() {
    fs.writeFileSync(filePath, JSON.stringify(Array.from(_cache)), 'utf8');
  }
  return {
    isDismissed: function(key) { return _load().has(key); },
    dismiss: function(key) { _load().add(key); _persist(); },
    undismiss: function(key) { _load().delete(key); _persist(); },
  };
}

module.exports = {
  isDismissed,
  dismiss,
  undismiss,
  deriveDismissKey,
  setDismissedSignalsStore,
  _resetDismissedSignalsStoreForTesting,
  createFsDismissedSignalsStoreAdapter,
};
```

- [ ] **Step 2: Run the store-level tests — must pass**

```bash
node tests/check-sptu-s4-signals-dismiss.js
```

Expected output: the first 6 tests (dismiss/isDismissed, undismiss isolation, AC4 collision, AC7 unit, NFR-Security, AC2 persistence) now PASS. The remaining 8 tests (view/route-level) still FAIL with `Cannot find module '../src/web-ui/routes/signals-panel'` resolution errors for the new handler exports, or assertion failures — expected, since Tasks 3-4 haven't run yet.

- [ ] **Step 3: Commit**

```bash
git add src/web-ui/modules/dismissed-signals-store.js
git commit -m "feat: add the dismissed-signals-store D37 adapter with a stable source+type+text derived key"
```

---

## Task 3: Implement the routes and view wiring (handler task — D37 rule 3: NOT the wiring task)

**Files:**
- Modify: `src/web-ui/routes/signals-panel.js`
- Modify: `src/web-ui/views/signals-panel-view.js`

- [ ] **Step 1: Extend `src/web-ui/routes/signals-panel.js`**

Add these requires near the top (after the existing `filter-signals` require):

```javascript
const _dismissedStore = require('../modules/dismissed-signals-store');
```

Add a helper to safely resolve a redirect target (defense-in-depth even though the view only ever generates `/signals`-prefixed values):

```javascript
function _safeSignalsRedirect(returnTo) {
  if (typeof returnTo === 'string' && returnTo.indexOf('/signals') === 0) return returnTo;
  return '/signals';
}
```

Extend `handleGetSignalsPanelHtml`: after the existing `const signals = filterSignals(allSignals, { hideTypes, hideSources });` line, add the dismissed-set composition (same pre-pagination integration point, not a second parallel filtering path).

> **SCOPE NOTE (added 2026-10-05, caught by the Task 3 implementer, decision logged in `decisions.md`):** the dismissed-set computation below MUST be wrapped in a try/catch. `dismissed-signals-store.js`'s D37 stub correctly throws when unwired — but this same `handleGetSignalsPanelHtml` function is also called directly by pre-existing tests (`check-ep2-s1-signals-panel.js`, `check-sptu-s2-signals-filter.js`) that have no reason to wire a dismiss-store adapter. Without the try/catch, those callers get an unhandled throw → the route's own catch-all turns it into a 500, regressing two previously-green test suites (confirmed via a stash round-trip: both were fully green immediately before this change). On any caught error, treat the dismissed-set as empty and proceed — this matches AC7's own "corrupt/missing file degrades gracefully" philosophy, just extended to also cover "adapter not wired."

```javascript
    const showDismissed = (req.query && req.query.showDismissed === 'true');
    const dismissedKeys = new Set();
    try {
      allSignals.forEach(function(s) {
        const k = _dismissedStore.deriveDismissKey(s);
        if (_dismissedStore.isDismissed(k)) dismissedKeys.add(k);
      });
    } catch (_) {
      // Adapter not wired (D37 stub throw) or any other store failure --
      // degrade to "nothing is dismissed" rather than a 500. See the SCOPE
      // NOTE above and decisions.md's 2026-10-05 entry.
    }
    const visibleSignals = showDismissed
      ? signals
      : signals.filter(function(s) { return !dismissedKeys.has(_dismissedStore.deriveDismissKey(s)); });
```

Change the `paginateSignals(signals, ...)` call to use `visibleSignals` instead of `signals`, and pass a 5th `dismissState` argument to `renderSignalsPanel`:

```javascript
    const pagination = paginateSignals(visibleSignals, req.query && req.query.page);
    const csrfToken = await _csrf.generateCsrfToken(req);
    const _nav = await _getSkillsNavContext(req, null);
    const filterState = { availableTypes, availableSources, hideTypes, hideSources };
    const dismissState = { showDismissed: showDismissed, dismissedKeys: dismissedKeys };
    const html = renderShell({
      title: 'Improvement Signals',
      bodyContent: renderSignalsPanel(pagination.pageSignals, csrfToken, pagination, filterState, dismissState),
      user: { login: req.session.login || '' }, active: 'signals',
      products: _nav.products, activeProductId: _nav.activeProductId, noProductJourneyCount: _nav.noProductJourneyCount
    });
```

Add the two new handlers at the bottom of the file, before `module.exports`:

```javascript
async function handlePostDismissSignal(req, res) {
  const csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;
  const body = req.body || {};
  const signal = { source: body.signalSource, type: body.signalType, text: body.signalText };
  const key = _dismissedStore.deriveDismissKey(signal);
  _dismissedStore.dismiss(key);
  res.writeHead(302, { Location: _safeSignalsRedirect(body.returnTo) });
  res.end();
}

async function handlePostUndismissSignal(req, res) {
  const csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;
  const body = req.body || {};
  const signal = { source: body.signalSource, type: body.signalType, text: body.signalText };
  const key = _dismissedStore.deriveDismissKey(signal);
  _dismissedStore.undismiss(key);
  res.writeHead(302, { Location: _safeSignalsRedirect(body.returnTo) });
  res.end();
}
```

Update `module.exports` to include the two new handlers:

```javascript
module.exports = {
  handleGetSignalsPanelHtml,
  handlePostDismissSignal,
  handlePostUndismissSignal,
  setSignalsSource,
  _resetSignalsSourceForTesting
};
```

- [ ] **Step 2: Extend `src/web-ui/views/signals-panel-view.js`**

Add a require near the top:

```javascript
const { deriveDismissKey } = require('../modules/dismissed-signals-store');
```

Add a dismiss-control helper after `_hiddenField`:

```javascript
// sptu-s4: Dismiss/Undismiss as a plain <form> POST, matching the existing
// CTA-form convention in this same file (zero client-JS, native keyboard
// focusability -- AC6). The server recomputes the dismiss key from these raw
// fields rather than trusting a client-submitted hash (DoR contract).
function _dismissControl(signal, csrfToken, isDismissedFlag, currentUrl) {
  const action = isDismissedFlag ? '/signals/undismiss' : '/signals/dismiss';
  const label = isDismissedFlag ? 'Undismiss' : 'Dismiss';
  return [
    '<form method="POST" action="' + action + '" style="margin-top:6px">',
    '  ' + _csrf.csrfField(csrfToken),
    '  ' + _hiddenField('signalSource', signal.source),
    '  ' + _hiddenField('signalType', signal.type),
    '  ' + _hiddenField('signalText', signal.text),
    '  ' + _hiddenField('returnTo', currentUrl || '/signals'),
    '  <button type="submit" class="sw-btn">' + label + '</button>',
    '</form>'
  ].join('\n');
}
```

Modify `_signalItem`'s signature and body to accept and render the dismiss control + marker:

```javascript
function _signalItem(signal, csrfToken, isDismissedFlag, currentUrl) {
  const safeText = escHtml(signal.text || '');
  const safeSource = escHtml(signal.source || '');
  const safeType = escHtml(signal.type || '');
  const cta = signal.cta || { label: 'Review', skill: '/improve' };
  const safeCtaLabel = escHtml(cta.label || 'Review');
  const skillName = (cta.skill || '/improve').replace(/^\//, '');
  const safeSkillName = escHtml(skillName);
  const isParseError = signal.type === 'parse-error';
  const itemStyle = 'display:flex;align-items:flex-start;justify-content:space-between;gap:16px' +
    (isParseError ? ';border-left:3px solid #b45309;background:rgba(180,83,9,0.08);padding-left:12px' : '');
  // sptu-s4: a text marker, not colour alone (AC6/NFR Accessibility).
  const dismissedMarkerHtml = isDismissedFlag ? '<span class="signal-dismissed-marker">✓ Dismissed</span>' : '';

  return [
    '<div class="sw-card signal-item" data-signal-type="' + safeType + '"' + (isDismissedFlag ? ' data-signal-dismissed="true"' : '') + ' style="' + itemStyle + '">',
    '  <div>',
    '    <div class="signal-source">' + safeSource + '</div>',
    '    <div class="signal-type">' + safeType + '</div>' + (dismissedMarkerHtml ? ' ' + dismissedMarkerHtml : ''),
    '    <div class="signal-text">' + safeText + '</div>',
    '  </div>',
    '  <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">',
    '    <form method="POST" action="/api/skills/' + safeSkillName + '/sessions">',
    '      ' + _csrf.csrfField(csrfToken),
    '      ' + _hiddenField('signalSource', signal.source),
    '      ' + _hiddenField('signalType', signal.type),
    '      ' + _hiddenField('signalText', signal.text),
    '      ' + _hiddenField('signalTimestamp', signal.timestamp),
    '      <button type="submit" class="sw-btn sw-btn--primary">' + safeCtaLabel + '</button>',
    '    </form>',
    '    ' + _dismissControl(signal, csrfToken, isDismissedFlag, currentUrl),
    '  </div>',
    '</div>'
  ].join('\n');
}
```

Add a show-dismissed toggle helper after `_filterBar`:

```javascript
// sptu-s4 (AC3): plain <a> link, same zero-client-JS/keyboard-native
// convention as the filter-bar toggles.
function _dismissToggleBar(showDismissed) {
  const href = showDismissed ? '/signals' : '/signals?showDismissed=true';
  const label = showDismissed ? 'Hide dismissed' : 'Show dismissed';
  return '<p class="sw-dismiss-toggle"><a href="' + href + '" class="sw-btn">' + escHtml(label) + '</a></p>';
}
```

Modify `renderSignalsPanel` to accept and thread through the 5th `dismissState` parameter:

```javascript
/**
 * @param {Array<{id:string,source:string,type:string,text:string,timestamp:?string,cta:{label:string,skill:string}}>} signals -- already the current page's own slice
 * @param {string} csrfToken
 * @param {object} [pagination] -- ep2-s3: optional pagination metadata from paginateSignals(). Omitted -> renders exactly as before ep2-s3.
 * @param {object} [filterState] -- sptu-s2: optional {availableTypes, availableSources, hideTypes, hideSources}. Omitted -> no filter bar, renders exactly as before sptu-s2.
 * @param {object} [dismissState] -- sptu-s4: optional {showDismissed, dismissedKeys: Set<string>, currentUrl}. Omitted -> every item renders as not-dismissed, no toggle bar, matching every pre-sptu-s4 test call exactly.
 * @returns {string} HTML body content for the /signals panel page
 */
function renderSignalsPanel(signals, csrfToken, pagination, filterState, dismissState) {
  const filterBarHtml = _filterBar(filterState);
  const hasActiveFilter = !!(filterState && ((filterState.hideTypes || []).length || (filterState.hideSources || []).length));
  const showDismissed = !!(dismissState && dismissState.showDismissed);
  const dismissedKeys = (dismissState && dismissState.dismissedKeys) || new Set();
  const currentUrl = (dismissState && dismissState.currentUrl) || '/signals';
  const dismissToggleHtml = _dismissToggleBar(showDismissed);

  if (!signals || signals.length === 0) {
    if (hasActiveFilter) {
      return [
        filterBarHtml,
        dismissToggleHtml,
        '<div class="sw-empty"><div class="sw-empty-icon">❖</div><h1>No signals match the current filters</h1><p>Try clearing a filter to see more.</p><p><a href="/signals" class="sw-btn">Clear filters</a></p></div>'
      ].join('\n');
    }
    return [dismissToggleHtml, '<div class="sw-empty"><div class="sw-empty-icon">❖</div><h1>No signals yet</h1><p>No improvement signals were found in the workspace.</p></div>'].join('\n');
  }
  const items = signals.map(function(s) {
    const key = deriveDismissKey(s);
    const isDismissedFlag = dismissedKeys.has(key);
    return _signalItem(s, csrfToken, isDismissedFlag, currentUrl);
  }).join('\n');
  return [
    filterBarHtml,
    dismissToggleHtml,
    '<p class="sw-section-title">Improvement signals</p>',
    '<div class="signals-list" style="display:flex;flex-direction:column;gap:12px">',
    items,
    '</div>',
    _paginationBar(pagination)
  ].join('\n');
}
```

**Important:** `_signalItem`'s signature changed from `(signal, csrfToken)` to `(signal, csrfToken, isDismissedFlag, currentUrl)`. `renderSignalsPanel`'s internal call site (`signals.map(...)` above) is the only caller, so this is safe — confirm no other file calls `_signalItem` directly (it is not exported).

- [ ] **Step 3: Pass `currentUrl` from the route into `dismissState`**

Back in `signals-panel.js`'s `handleGetSignalsPanelHtml`, set `dismissState.currentUrl` from the real incoming request URL so the "returnTo" hidden field round-trips the operator back to their exact current page/filter/showDismissed state after a dismiss/undismiss POST:

```javascript
    const dismissState = { showDismissed: showDismissed, dismissedKeys: dismissedKeys, currentUrl: req.url };
```

- [ ] **Step 4: Run the full new test file — expect progress but NOT all green yet**

```bash
node tests/check-sptu-s4-signals-dismiss.js
```

Expected output: all 14 tests PASS at the end of this task, including the D37 AC5 test (`the wired production adapter correctly differentiates...`) — that test calls `store.setDismissedSignalsStore(store.createFsDismissedSignalsStoreAdapter(tmpPath))` directly within the test itself (matching the AC5 test's own "temp file substituted only at the fs-path level, not by overriding the adapter function itself" design), so it does NOT depend on `server.js`'s own startup wiring (that is Task 4's job — a real `.github` production concern, not something any of these 14 tests exercises directly, since this codebase's own established convention is to call route handlers as direct function exports rather than through the real HTTP dispatcher). If the D37 AC5 test fails here, the bug is in `createFsDismissedSignalsStoreAdapter` or the route handlers themselves, not in server.js wiring.

- [ ] **Step 5: Run targeted regressions**

```bash
node tests/check-ep2-s1-signals-panel.js
node tests/check-sptu-s2-signals-filter.js
```

Expected output: both still pass unchanged — confirms `_signalItem`'s signature change is backward-compatible (the 3rd/4th params default to `undefined`/falsy, matching pre-sptu-s4 behaviour) and `renderSignalsPanel`'s 5th param is additive-only.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/signals-panel.js src/web-ui/views/signals-panel-view.js
git commit -m "feat: add dismiss/undismiss routes and view controls for the signals panel"
```

---

## Task 4: Wire the real fs-backed adapter in server.js (D37 mandatory separate wiring task)

**Files:**
- Modify: `src/web-ui/server.js`

- [ ] **Step 1: Register the two new routes**

Find the existing `} else if (pathname === '/signals' && req.method === 'GET') {` block (around line 3065) and add the two new routes immediately after it:

```javascript
  } else if (pathname === '/signals' && req.method === 'GET') {
    authGuard(req, res, async () => {
      await handleGetSignalsPanelHtml(req, res);
    });

  } else if (pathname === '/signals/dismiss' && req.method === 'POST') {
    authGuard(req, res, async () => {
      await handlePostDismissSignal(req, res);
    });

  } else if (pathname === '/signals/undismiss' && req.method === 'POST') {
    authGuard(req, res, async () => {
      await handlePostUndismissSignal(req, res);
    });

```

Update the existing import line near the top of the file (around line 111):

```javascript
const { handleGetSignalsPanelHtml, handlePostDismissSignal, handlePostUndismissSignal } = require('./routes/signals-panel');      // ep2-s1, sptu-s4
```

- [ ] **Step 2: Wire the real fs-backed adapter (D37 rule 3 — separate from the handler task above)**

Find the existing signals-aggregator wiring block (around line 1237-1243):

```javascript
  // ep1-s1 (weeb-ui-learnings-and-improvements) — Wire real fs-backed file-read
  // adapter for the signals aggregator (D37 mandatory separate wiring task)
  {
    const _signalsAggregator = require('./modules/signals-aggregator');
    _signalsAggregator.setFileReadAdapter(_signalsAggregator.createFsFileReadAdapter());
    console.log('[ep1-s1] signals-aggregator file-read adapter wired');
  }
```

Add a new, separate block immediately after it:

```javascript
  // sptu-s4 (signals-panel-triage-ux) — Wire real fs-backed adapter for the
  // dismissed-signals store (D37 mandatory separate wiring task)
  {
    const _dismissedSignalsStore = require('./modules/dismissed-signals-store');
    const _dismissedSignalsPath = _path.join(
      process.env.COPILOT_REPO_PATH || _path.resolve(__dirname, '../..'),
      'workspace',
      'dismissed-signals.json'
    );
    _dismissedSignalsStore.setDismissedSignalsStore(_dismissedSignalsStore.createFsDismissedSignalsStoreAdapter(_dismissedSignalsPath));
    console.log('[sptu-s4] dismissed-signals-store file-backed adapter wired');
  }
```

- [ ] **Step 3: Run the full new test file — expect all 14 green**

```bash
node tests/check-sptu-s4-signals-dismiss.js
```

Expected output: `[sptu-s4-signals-dismiss] Results: 14 passed, 0 failed`

- [ ] **Step 4: Run the full suite — no regressions (AC4-equivalent cross-check for this story, plus general regression)**

```bash
npm test
```

Expected output: all tests passing, except possibly the one pre-existing, already-RISK-ACCEPTed environmental flake `tests/check-pcr-s1-test-runner.js` (logged in `decisions.md` at `/branch-setup`, 2026-10-05). If you see ANY OTHER failure, investigate — do not assume it's pre-existing without checking.

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/server.js
git commit -m "feat: wire the real fs-backed dismissed-signals-store adapter in server.js"
```

---

## Task 5: Final regression confirmation and PR

**Files:** none (verification only)

- [ ] **Step 1: Run the full suite one more time**

```bash
npm test
```

Expected output: `71x file(s) run, 0 failed` (or `1 failed` if the pre-existing `check-pcr-s1-test-runner.js` environmental flake is still present — confirm it is the same perf-floor finding, not a new failure, before proceeding).

- [ ] **Step 2: Open a draft PR**

```bash
git push -u origin feature/sptu-s4
gh pr create --draft --title "Dismiss / mark-reviewed for the signals panel" --body-file <PR body file, see branch-complete skill>
```

Do not mark ready for review — DoR's own Coding Agent Instructions specify Low oversight, draft PR only.
