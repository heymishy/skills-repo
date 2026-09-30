# Signals panel route handler: `/api/signals` endpoint — Implementation Plan

> **For agent execution:** Implemented directly, task by task (/tdd), in this session.

**Goal:** A `GET /api/signals` route returning `ep1-s1`'s aggregator output as JSON, with structured 500 handling and a test-only aggregator override.
**Branch:** `feature/ep1-s2-wuli`
**Worktree:** `.worktrees/ep1-s2`
**Test command:** `node tests/check-ep1-s2-signals-route.js` (this repo's own `run-all-tests.js` auto-discovers any `tests/check-*.js` file)

**Cross-story finding (documented in `decisions.md`, not fixed here per this story's own explicit DoR constraint "Do NOT modify ep1-s1's own aggregator module"):** `ep1-s1`'s `_makeSignal` generates `id` via `Math.random()` and a fresh `new Date().toISOString()` for `parse-error` signals — confirmed live to produce different IDs/timestamps across two successive real (unstubbed) calls to `getSignals()`. This story's own AC5/NFR ("no random IDs... calling the endpoint twice with no file changes returns identical responses") is fully satisfiable and tested here because the test plan explicitly stubs the aggregator (a stub trivially returns the same fixed array twice). The real, unstubbed, end-to-end repeatability gap this surfaces is out of this story's scope by explicit DoR instruction; flagged for the post-merge smoke test and a follow-up story.

---

## File map

```
Create:
  src/web-ui/routes/signals.js          — GET /api/signals route handler + test-only aggregator override
  tests/check-ep1-s2-signals-route.js   — unit + integration tests for all 5 ACs

Modify:
  src/web-ui/server.js                  — require signals.js, register GET /api/signals in the router dispatch chain
```

---

## Task 1: Route handler skeleton + test-only aggregator override

**Files:**
- Create: `src/web-ui/routes/signals.js`
- Test: `tests/check-ep1-s2-signals-route.js`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/check-ep1-s2-signals-route.js (new file — full harness built up across all tasks)
'use strict';
const assert = require('assert');
const { handleGetSignals, setSignalsAggregator, _resetSignalsAggregatorForTesting } = require('../src/web-ui/routes/signals');

let passed = 0, failed = 0;
function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  ✓ ' + name); },
    function(err) { failed++; console.log('  ✗ ' + name + ' -- ' + (err && err.message || err)); }
  );
}

function mockRes() {
  const res = { statusCode: null, headers: null, body: null };
  res.writeHead = function(code, headers) { res.statusCode = code; res.headers = headers; };
  res.end = function(body) { res.body = body; };
  return res;
}

(async function main() {
  await test('AC1: endpoint returns 200 with the aggregator Signal array verbatim', async function() {
    _resetSignalsAggregatorForTesting();
    const fixed = [{ id: 's1', source: 'capture-log', type: 'gap', text: 'x', timestamp: '2026-01-01', cta: { label: 'Review', skill: '/improve' } }];
    setSignalsAggregator(function() { return fixed; });
    const res = mockRes();
    await handleGetSignals({}, res);
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(JSON.parse(res.body), fixed);
  });

  console.log('\n[ep1-s2] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s2-signals-route.js
```

Expected output: `Cannot find module '../src/web-ui/routes/signals'`

- [ ] **Step 3: Write minimal implementation**

```javascript
// src/web-ui/routes/signals.js
'use strict';
const path = require('path');

let _signalsAggregatorOverride = null;
function setSignalsAggregator(fn) { _signalsAggregatorOverride = fn; }
function _resetSignalsAggregatorForTesting() { _signalsAggregatorOverride = null; }

function _getRepoPath() {
  return process.env.CLAUDE_REPO_PATH || process.env.COPILOT_REPO_PATH || path.resolve(__dirname, '../../..');
}

async function handleGetSignals(req, res) {
  try {
    const getSignals = _signalsAggregatorOverride || require('../modules/signals-aggregator').getSignals;
    const signals = getSignals(_getRepoPath());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(signals));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message, timestamp: new Date().toISOString() }));
  }
}

module.exports = { handleGetSignals, setSignalsAggregator, _resetSignalsAggregatorForTesting };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s2-signals-route.js
```

Expected output: `  ✓ AC1: endpoint returns 200 with the aggregator Signal array verbatim`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (plus the known pre-existing environmental failures)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/signals.js tests/check-ep1-s2-signals-route.js
git commit -m "feat(ep1-s2): add signals route handler skeleton with test-only aggregator override"
```

---

## Task 2: AC2 — required fields present, optional fields tolerated absent

**Files:**
- Modify: `tests/check-ep1-s2-signals-route.js`

No implementation change needed — the handler already passes the aggregator's output through verbatim (Task 1). This task's own test confirms that passthrough preserves required fields regardless of whether optional `context` is present.

- [ ] **Step 1: Write the failing test**

```javascript
await test('AC2: required fields present regardless of optional context presence', async function() {
  _resetSignalsAggregatorForTesting();
  const withContext = { id: 's1', source: 'decisions', type: 'note', text: 'x', timestamp: '2026-01-01', cta: { label: 'Review', skill: '/improve' }, context: { relatedStory: 'a', featureSlug: 'b', severity: 'low', metadata: null } };
  const withoutContext = { id: 's2', source: 'learnings', type: 'note', text: 'y', timestamp: null, cta: { label: 'Review', skill: '/improve' } };
  setSignalsAggregator(function() { return [withContext, withoutContext]; });
  const res = mockRes();
  await handleGetSignals({}, res);
  const body = JSON.parse(res.body);
  body.forEach(function(s) {
    ['id', 'source', 'type', 'text', 'timestamp', 'cta'].forEach(function(f) { assert.ok(f in s, 'missing ' + f); });
    assert.ok('label' in s.cta && 'skill' in s.cta);
  });
  assert.ok(!('context' in body[1]) || body[1].context === undefined, 'entry without context must not fail any check for its absence');
});
```

- [ ] **Step 2: Run test — must fail (or pass; confirms existing passthrough behaviour)**

```bash
node tests/check-ep1-s2-signals-route.js
```

Expected output: likely passes immediately since Task 1's passthrough is already correct — this test exists to lock the behaviour in, not to drive new code

- [ ] **Step 3: Write minimal implementation**

No new code — confirmation-only task.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s2-signals-route.js
```

Expected output: `  ✓ AC2: required fields present regardless of optional context presence`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-ep1-s2-signals-route.js
git commit -m "test(ep1-s2): confirm required-field passthrough regardless of optional context (AC2)"
```

---

## Task 3: AC3 — aggregator exception returns 500 with structured error, never a partial 200

**Files:**
- Modify: `tests/check-ep1-s2-signals-route.js`

- [ ] **Step 1: Write the failing test**

```javascript
await test('AC3: aggregator exception returns 500 with structured error, not a partial 200', async function() {
  _resetSignalsAggregatorForTesting();
  setSignalsAggregator(function() { throw new Error('disk read failed'); });
  const res = mockRes();
  await handleGetSignals({}, res);
  assert.strictEqual(res.statusCode, 500);
  const body = JSON.parse(res.body);
  assert.strictEqual(body.error, 'disk read failed');
  assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(body.timestamp), 'timestamp must be ISO 8601');
});
```

- [ ] **Step 2: Run test — must fail (or pass; confirms existing try/catch behaviour)**

```bash
node tests/check-ep1-s2-signals-route.js
```

Expected output: likely already passes given Task 1's try/catch — this test locks the exact structured-error shape in

- [ ] **Step 3: Write minimal implementation**

No new code — Task 1's try/catch already implements this. Confirmation-only task.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s2-signals-route.js
```

Expected output: `  ✓ AC3: aggregator exception returns 500 with structured error, not a partial 200`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-ep1-s2-signals-route.js
git commit -m "test(ep1-s2): confirm 500 structured-error shape on aggregator exception (AC3)"
```

---

## Task 4: AC4 — endpoint latency budget

**Files:**
- Modify: `tests/check-ep1-s2-signals-route.js`

- [ ] **Step 1: Write the failing test**

```javascript
await test('AC4: endpoint completes within the latency budget (aggregator <200ms + route overhead <50ms)', async function() {
  _resetSignalsAggregatorForTesting();
  setSignalsAggregator(function() {
    const start = Date.now();
    while (Date.now() - start < 150) { /* busy-wait to simulate a 150ms aggregator */ }
    return [];
  });
  const res = mockRes();
  const t0 = Date.now();
  await handleGetSignals({}, res);
  const duration = Date.now() - t0;
  assert.ok(duration < 250, 'expected <250ms total, took ' + duration + 'ms');
});
```

- [ ] **Step 2: Run test — must fail (or pass)**

```bash
node tests/check-ep1-s2-signals-route.js
```

Expected output: likely already passes since the handler adds negligible overhead over a synchronous call

- [ ] **Step 3: Write minimal implementation**

No new code — confirmation-only task.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s2-signals-route.js
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-ep1-s2-signals-route.js
git commit -m "test(ep1-s2): confirm endpoint latency budget under a simulated 150ms aggregator (AC4)"
```

---

## Task 5: AC5 — repeatability with a stubbed aggregator

**Files:**
- Modify: `tests/check-ep1-s2-signals-route.js`

- [ ] **Step 1: Write the failing test**

```javascript
await test('AC5: calling the endpoint twice with an unchanged stubbed aggregator returns identical responses', async function() {
  _resetSignalsAggregatorForTesting();
  const fixed = [{ id: 'a', source: 'suite', type: 'eval-scenario', text: 'x', timestamp: null, cta: { label: 'Review', skill: '/improve' } }];
  setSignalsAggregator(function() { return fixed; });
  const res1 = mockRes();
  await handleGetSignals({}, res1);
  const res2 = mockRes();
  await handleGetSignals({}, res2);
  assert.strictEqual(res1.body, res2.body, 'both responses must be byte-identical JSON');
});
```

- [ ] **Step 2: Run test — must fail (or pass)**

```bash
node tests/check-ep1-s2-signals-route.js
```

Expected output: passes given a stubbed aggregator returning a fixed array both times

- [ ] **Step 3: Write minimal implementation**

No new code — confirmation-only task.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s2-signals-route.js
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-ep1-s2-signals-route.js
git commit -m "test(ep1-s2): confirm repeatability with an unchanged stubbed aggregator (AC5)"
```

---

## Task 6: Real router-dispatch integration tests (AC1/AC3 wiring checks)

**Files:**
- Modify: `src/web-ui/server.js`
- Modify: `tests/check-ep1-s2-signals-route.js`

Registers the route in the real dispatch chain and confirms real HTTP dispatch reaches it — not just that the handler function works in isolation (the D37-lesson wiring check this test plan explicitly calls for).

- [ ] **Step 1: Write the failing test**

Uses this codebase's own established real-dispatch-testing convention (confirmed against `tests/check-ep2-s4-artefact-edit-merge-static-route.js`): `require('../src/web-ui/server').router`, a bare `mockReq({ url, method })`, and a `mockRes()` with `writeHead`/`end`/`_get()`.

```javascript
const router = require('../src/web-ui/server').router;

function mockReq(overrides) {
  return Object.assign({ headers: {}, method: 'GET', url: '/' }, overrides || {});
}
function mockResForRouter() {
  var _statusCode = null, _headers = {}, _chunks = [];
  return {
    writeHead: function(code, headers) { _statusCode = code; Object.assign(_headers, headers || {}); return this; },
    setHeader: function(k, v) { _headers[k] = v; },
    end: function(body) { if (body != null) _chunks.push(body); },
    _get: function() { return { statusCode: _statusCode, headers: _headers, body: _chunks.join('') }; }
  };
}

await test('Integration: real router dispatch reaches GET /api/signals and returns the stubbed array', async function() {
  _resetSignalsAggregatorForTesting();
  const fixed = [{ id: 'a', source: 'suite', type: 'eval-scenario', text: 'x', timestamp: null, cta: { label: 'Review', skill: '/improve' } }];
  setSignalsAggregator(function() { return fixed; });
  const req = mockReq({ url: '/api/signals' });
  const res = mockResForRouter();
  await router(req, res);
  const result = res._get();
  assert.strictEqual(result.statusCode, 200);
  assert.deepStrictEqual(JSON.parse(result.body), fixed);
});

await test('Integration: real router dispatch surfaces an aggregator exception as 500', async function() {
  _resetSignalsAggregatorForTesting();
  setSignalsAggregator(function() { throw new Error('disk read failed'); });
  const req = mockReq({ url: '/api/signals' });
  const res = mockResForRouter();
  await router(req, res);
  const result = res._get();
  assert.strictEqual(result.statusCode, 500);
  assert.strictEqual(JSON.parse(result.body).error, 'disk read failed');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep1-s2-signals-route.js
```

Expected output: 404/fall-through to the sign-in page (route not yet registered in `server.js`)

- [ ] **Step 3: Write minimal implementation**

```javascript
// In src/web-ui/server.js:
// 1. Add near the other route requires at the top:
const { handleGetSignals } = require('./routes/signals');

// 2. Register in the dispatch chain, alongside the other /api/* GET routes
// (exact insertion point: immediately after the /api/journey/:id GET route
// block, matching this codebase's existing convention of grouping /api/*
// routes together):
  } else if (pathname === '/api/signals' && req.method === 'GET') {
    await handleGetSignals(req, res);

// Note: this route intentionally has NO authGuard/session check, matching
// this story's own explicit scope (persona: "Solo operator (you, today)";
// no auth-related AC or test in the story/test plan; multi-tenant isolation
// explicitly out of scope). See decisions.md for this documented choice.
```

(The exact dispatch-function export name and req/res shape used in the integration test above must be confirmed against `server.js`'s own real, already-existing test-harness convention — if `server.js` does not already export a directly-callable dispatch function for testing, use this codebase's existing pattern instead, e.g. an `http` test server spun up on an ephemeral port, matching whatever convention `tests/check-ougl5-gate-confirm-feature-stages.js` or a similar existing route-integration test already uses.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep1-s2-signals-route.js
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js tests/check-ep1-s2-signals-route.js
git commit -m "feat(ep1-s2): register GET /api/signals in the real router dispatch chain"
```

---

<!-- End of plan. 6 tasks covering AC1-AC5 plus the real-dispatch wiring check the test plan explicitly calls for. -->
