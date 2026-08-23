# Wire the viewer-write-block gate to Skill session routes — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/vrne-s2`
**Worktree:** `.worktrees/vrne-s2`
**Test command:** `node tests/check-vrne-s2-skill-session-gate.js` (targeted) / `node scripts/run-all-tests.js` (full suite — reserved for branch-setup baseline, verify-completion, and branch-complete only, per `skills/subagent-execution/SKILL.md`'s loop-design update)

**Commit cadence:** Write task state locally after each task (no fetch, no commit). Commit in a batch at natural checkpoints — after each RED+GREEN pair for a route group (Tasks 2, 4, 6, 8) and once more after Tasks 9–11 — not after every individual task. See `skills/subagent-execution/SKILL.md` Step 2d.

---

## Background: two wiring patterns

`requireNonViewer` (built in `vrne-s1`, `src/web-ui/middleware/require-non-viewer.js`) is already wired into `server.js` for 33 other routes using this idiom, always nested inside the route's existing `authGuard(req, res, async () => {...})` callback, immediately before the real handler call:

```js
let _rnvOk = false;
await requireNonViewer(req, res, () => { _rnvOk = true; });
if (!_rnvOk) return;
```

Of this story's 11 call sites, **8 are `authGuard`-wrapped at the `server.js` level ("Pattern A")** — the idiom above goes directly into `server.js`'s router block. **3 are gated only by an internal `_checkAuth(req, res)` call inside the handler function itself, in `src/web-ui/routes/skills.js` ("Pattern B")** — no `server.js` wrapper exists for these JSON-API paths, so the same idiom is inserted directly inside the handler body, immediately after the existing `_checkAuth` check. `server.js` is raw `http.createServer` (no Express) throughout, and `requireNonViewer` itself uses `res.writeHead`/`res.end` — both patterns use the identical idiom with no signature adaptation needed.

`requireNonViewer` is already imported in `server.js` (line 75). It is **not** yet imported in `skills.js` — Task 2 adds that import once, for reuse by all 3 Pattern-B call sites.

---

## File map

```
Modify:
  src/web-ui/server.js          — wire requireNonViewer into 8 Pattern-A call sites (AC1 form-path, AC2 turn/turn-stream/answer-form, AC3 commit-form/execute, AC5 canvas-edit/assumption-confirm)
  src/web-ui/routes/skills.js   — import requireNonViewer; wire into 3 Pattern-B call sites (AC1 handlePostSession, AC2 handlePostAnswer, AC3 handleCommitArtefact)

Create:
  tests/check-vrne-s2-skill-session-gate.js — all AC1-AC6 tests + 2 real-dispatch integration tests
```

---

## Task 1: RED — write failing tests for AC1 (session start, 2 call sites)

**Files:**
- Create: `tests/check-vrne-s2-skill-session-gate.js` (this task creates the file; later tasks append to it)

- [ ] **Step 1: Write the failing tests**

Create the test file with its scaffold (queue-based custom runner, matching `tests/check-vrne-s1-require-non-viewer.js`'s established pattern in this codebase) plus the two AC1 tests. Both call `requireNonViewer` directly — isolated gate-behaviour tests, matching `vrne-s1`'s own actually-shipped pattern (not a duplicated per-route spy on the underlying handler; the cost-prevention guarantee for the expensive/write calls is proven once, at the integration-test level, in Task 10 — see that task's note for why).

```js
'use strict';

var assert = require('assert');
var path = require('path');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

var REQUIRE_NON_VIEWER_PATH = path.resolve(__dirname, '../src/web-ui/middleware/require-non-viewer.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

function makeRes() {
  var r = { _status: null, _headers: {}, _body: '' };
  r.writeHead = function(s, h) { r._status = s; Object.assign(r._headers, h || {}); };
  r.end = function(b) { r._body += (b || ''); };
  return r;
}

function viewerSession() {
  return { session: { userId: 'u1', role: 'viewer', tenantId: 't1', login: 'viewer@test' } };
}

async function main() {
  var queue = [];

  // AC1 — session start (2 call sites: form path server.js-wrapped, JSON path skills.js-internal)
  ['session-start-form', 'session-start-json'].forEach(function(routeName) {
    queue.push(function() {
      console.log('\n[vrne-s2] T-ac1-' + routeName + ' -- viewer denied');
      return test('AC1: viewer denied on ' + routeName, async function() {
        var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
        var req = viewerSession();
        var res = makeRes();
        var nextCalled = false;
        await gate.requireNonViewer(req, res, function() { nextCalled = true; });
        assert.strictEqual(nextCalled, false, routeName + ': next() must not be called for viewer');
        assert.strictEqual(res._status, 403, routeName + ': status must be 403');
      });
    });
  });

  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }

  console.log('\n[vrne-s2-skill-session-gate] AC1 subtotal: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-vrne-s2-skill-session-gate.js
```

Expected output: `2 passed, 0 failed` — **wait, this will actually PASS immediately**, because these two tests call `requireNonViewer` directly (already built in `vrne-s1`), not the not-yet-wired routes. This is expected and correct: the RED state for THIS story is not "the gate rejects a viewer" (already proven) but "the route doesn't yet call the gate at all". Step 2's real RED check is therefore deferred to Task 2's own Step 2 (the grep-count assertion), not this file's own test run. Proceed to Task 2.

- [ ] **Step 3–6:** N/A for this task — Task 1 is test-authoring only, no implementation step. Commit is deferred to the Task 2 checkpoint (see Commit cadence above).

---

## Task 2: GREEN — wire requireNonViewer into AC1's 2 call sites

**Files:**
- Modify: `src/web-ui/routes/skills.js`
- Modify: `src/web-ui/server.js`

- [ ] **Step 1: Add the missing import to `skills.js`**

Near the top of `src/web-ui/routes/skills.js`, alongside the other `require(...)` lines (e.g. near the existing `const { sanitiseAnswer } = require('../../answer-sanitiser');` import), add:

```js
const { requireNonViewer } = require('../middleware/require-non-viewer');
```

- [ ] **Step 2: Wire Pattern B — `handlePostSession` (JSON path, `skills.js:401`)**

```js
async function handlePostSession(req, res) {
  if (!_checkAuth(req, res)) { return; }
  let _rnvOk = false;
  await requireNonViewer(req, res, () => { _rnvOk = true; });
  if (!_rnvOk) return;
  try {
```

(Only the two new lines are inserted between the existing `_checkAuth` check and `try {` — the rest of the function is unchanged.)

- [ ] **Step 3: Wire Pattern A — session start form path (`server.js`, inside the `/api/skills/:name/sessions` POST branch)**

```js
    if (ct.includes('application/x-www-form-urlencoded')) {
      authGuard(req, res, async () => {
        let _rnvOk = false;
        await requireNonViewer(req, res, () => { _rnvOk = true; });
        if (!_rnvOk) return;
        await handlePostSkillSessionHtml(req, res);
      });
    } else {
      await handlePostSession(req, res);
    }
```

- [ ] **Step 4: Run targeted test — must pass**

```bash
node tests/check-vrne-s2-skill-session-gate.js
```

Expected output: `AC1 subtotal: 2 passed, 0 failed`

- [ ] **Step 5: Grep-count check — confirms real wiring, not just isolated gate behaviour**

```bash
grep -c "requireNonViewer" src/web-ui/server.js src/web-ui/routes/skills.js
```

Expected output: `server.js` count increases by 3 (1 import + 8 call sites, but only 1 of those 8 belongs to Task 2 — the other 7 land in Tasks 4/6/8) and `skills.js` count increases by 2 (1 import + 1 call site for `handlePostSession`; the other 2 `skills.js` call sites land in Tasks 4/6). Confirm both counts moved from Task 1's baseline, not just that the file still parses.

- [ ] **Step 6: Commit (batched — deferred to end of Task 2, per Commit cadence above)**

```bash
git add src/web-ui/routes/skills.js src/web-ui/server.js tests/check-vrne-s2-skill-session-gate.js
git commit -m "feat: wire viewer-write-block gate into skill-session-start routes (AC1)"
```

---

## Task 3: RED — write failing tests for AC2 (turn/turn-stream/answers/answer, 4 call sites)

**Files:**
- Modify: `tests/check-vrne-s2-skill-session-gate.js` (append)

- [ ] **Step 1: Append the AC2 tests**

Same isolated-gate pattern as Task 1, for the 4 AC2 routes: `turn`, `turn-stream`, `answers-json`, `answer-form`.

```js
  // AC2 — turn/turn-stream/answers/answer (4 call sites)
  ['turn', 'turn-stream', 'answers-json', 'answer-form'].forEach(function(routeName) {
    queue.push(function() {
      console.log('\n[vrne-s2] T-ac2-' + routeName + ' -- viewer denied');
      return test('AC2: viewer denied on ' + routeName, async function() {
        var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
        var req = viewerSession();
        var res = makeRes();
        var nextCalled = false;
        await gate.requireNonViewer(req, res, function() { nextCalled = true; });
        assert.strictEqual(nextCalled, false, routeName + ': next() must not be called for viewer');
        assert.strictEqual(res._status, 403, routeName + ': status must be 403');
      });
    });
  });
```

Insert this block into the `main()` function, after the AC1 `forEach` block and before the final `for` loop that drains `queue`.

- [ ] **Step 2: Run test — passes immediately (same reasoning as Task 1 Step 2)**

```bash
node tests/check-vrne-s2-skill-session-gate.js
```

Expected output: `6 passed, 0 failed` (2 AC1 + 4 AC2). RED for this story is proven by Task 4's grep-count delta, not this run.

- [ ] **Steps 3–6:** N/A — commit deferred to Task 4 checkpoint.

---

## Task 4: GREEN — wire requireNonViewer into AC2's 4 call sites

**Files:**
- Modify: `src/web-ui/server.js`
- Modify: `src/web-ui/routes/skills.js`

- [ ] **Step 1: Wire Pattern A — `turn` (`server.js`, inside the `/turn` POST branch)**

Insert `requireNonViewer` **before** the existing `creditsGuard` check (a viewer must be denied before any credit-balance check runs):

```js
    authGuard(req, res, async () => {
      let _rnvOk = false;
      await requireNonViewer(req, res, () => { _rnvOk = true; });
      if (!_rnvOk) return;
      let _cgOk = false;
      await creditsGuard(req, res, () => { _cgOk = true; });
      if (!_cgOk) return;
      await handlePostTurnHtml(req, res);
    });
```

- [ ] **Step 2: Wire Pattern A — `turn-stream` (`server.js`, inside the `/turn-stream` POST branch)**

Same idiom, inserted before `creditsGuard` and the rate limiter — critical because once the handler writes SSE headers (`Content-Type: text/event-stream`) a JSON 403 can no longer be sent, so the gate must run before the handler is even called:

```js
    authGuard(req, res, async () => {
      let _rnvOk = false;
      await requireNonViewer(req, res, () => { _rnvOk = true; });
      if (!_rnvOk) return;
      let _cgOk = false;
      await creditsGuard(req, res, () => { _cgOk = true; });
      if (!_cgOk) return;
      let _rlOk = false;
      _turnStreamRateLimiter(req, res, () => { _rlOk = true; });
      if (!_rlOk) return;
      await handlePostTurnStreamHtml(req, res);
    });
```

- [ ] **Step 3: Wire Pattern B — `handlePostAnswer` (JSON path, `skills.js:440`)**

```js
async function handlePostAnswer(req, res) {
  if (!_checkAuth(req, res)) { return; }
  let _rnvOk = false;
  await requireNonViewer(req, res, () => { _rnvOk = true; });
  if (!_rnvOk) return;
  try {
```

- [ ] **Step 4: Wire Pattern A — `answer` form path (`server.js`, inside the `/answer` POST branch)**

```js
    authGuard(req, res, async () => {
      let _rnvOk = false;
      await requireNonViewer(req, res, () => { _rnvOk = true; });
      if (!_rnvOk) return;
      await handlePostAnswerHtml(req, res);
    });
```

- [ ] **Step 5: Run targeted test — must pass**

```bash
node tests/check-vrne-s2-skill-session-gate.js
```

Expected output: `AC1+AC2 subtotal: 6 passed, 0 failed`

- [ ] **Step 6: Commit (batched)**

```bash
git add src/web-ui/server.js src/web-ui/routes/skills.js tests/check-vrne-s2-skill-session-gate.js
git commit -m "feat: wire viewer-write-block gate into skill-session turn/answer routes (AC2)"
```

---

## Task 5: RED — write failing tests for AC3 (commit-form/commit-json/execute, 3 call sites)

**Files:**
- Modify: `tests/check-vrne-s2-skill-session-gate.js` (append)

- [ ] **Step 1: Append the AC3 tests**

```js
  // AC3 — commit-form/commit-json/execute (3 call sites)
  ['commit-form', 'commit-json', 'execute'].forEach(function(routeName) {
    queue.push(function() {
      console.log('\n[vrne-s2] T-ac3-' + routeName + ' -- viewer denied');
      return test('AC3: viewer denied on ' + routeName, async function() {
        var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
        var req = viewerSession();
        var res = makeRes();
        var nextCalled = false;
        await gate.requireNonViewer(req, res, function() { nextCalled = true; });
        assert.strictEqual(nextCalled, false, routeName + ': next() must not be called for viewer');
        assert.strictEqual(res._status, 403, routeName + ': status must be 403');
      });
    });
  });
```

- [ ] **Step 2: Run test — passes immediately (same reasoning as Tasks 1/3)**

Expected: `9 passed, 0 failed` (2 AC1 + 4 AC2 + 3 AC3).

- [ ] **Steps 3–6:** N/A — commit deferred to Task 6 checkpoint.

---

## Task 6: GREEN — wire requireNonViewer into AC3's 3 call sites

**Files:**
- Modify: `src/web-ui/server.js`
- Modify: `src/web-ui/routes/skills.js`

- [ ] **Step 1: Wire Pattern A — `commit` form path (`server.js`, inside the `/commit` POST branch)**

```js
    if (ct.includes('application/x-www-form-urlencoded')) {
      authGuard(req, res, async () => {
        let _rnvOk = false;
        await requireNonViewer(req, res, () => { _rnvOk = true; });
        if (!_rnvOk) return;
        await handlePostCommitHtml(req, res);
      });
    } else {
      await handleCommitArtefact(req, res);
    }
```

- [ ] **Step 2: Wire Pattern B — `handleCommitArtefact` (JSON path, `skills.js:523`)**

```js
async function handleCommitArtefact(req, res) {
  if (!_checkAuth(req, res)) { return; }
  let _rnvOk = false;
  await requireNonViewer(req, res, () => { _rnvOk = true; });
  if (!_rnvOk) return;
  try {
```

- [ ] **Step 3: Wire `execute` (`server.js`, inside the `/execute` POST branch)**

This route has no `authGuard` wrapper today (the handler does its own inline session check) — insert the idiom directly, no `authGuard` needed:

```js
    const skillNameParam = pathname.split('/')[3];
    req.params = { name: skillNameParam };
    let _rnvOk = false;
    await requireNonViewer(req, res, () => { _rnvOk = true; });
    if (!_rnvOk) return;
    await handleExecuteSkill(req, res);
```

- [ ] **Step 4: Run targeted test — must pass**

Expected: `AC1+AC2+AC3 subtotal: 9 passed, 0 failed`

- [ ] **Step 5: Commit (batched)**

```bash
git add src/web-ui/server.js src/web-ui/routes/skills.js tests/check-vrne-s2-skill-session-gate.js
git commit -m "feat: wire viewer-write-block gate into skill-session commit/execute routes (AC3)"
```

---

## Task 7: RED — write failing tests for AC5 (canvas-edit/assumption-confirm, 2 call sites)

**Files:**
- Modify: `tests/check-vrne-s2-skill-session-gate.js` (append)

- [ ] **Step 1: Append the AC5 tests**

```js
  // AC5 — canvas-edit/assumption-confirm (2 call sites, added via /decisions 2026-08-22 SCOPE entry)
  ['canvas-edit', 'assumption-confirm'].forEach(function(routeName) {
    queue.push(function() {
      console.log('\n[vrne-s2] T-ac5-' + routeName + ' -- viewer denied');
      return test('AC5: viewer denied on ' + routeName, async function() {
        var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
        var req = viewerSession();
        var res = makeRes();
        var nextCalled = false;
        await gate.requireNonViewer(req, res, function() { nextCalled = true; });
        assert.strictEqual(nextCalled, false, routeName + ': next() must not be called for viewer');
        assert.strictEqual(res._status, 403, routeName + ': status must be 403');
      });
    });
  });
```

- [ ] **Step 2: Run test — passes immediately.** Expected: `11 passed, 0 failed`.

- [ ] **Steps 3–6:** N/A — commit deferred to Task 8 checkpoint.

---

## Task 8: GREEN — wire requireNonViewer into AC5's 2 call sites

**Files:**
- Modify: `src/web-ui/server.js`

- [ ] **Step 1: Wire Pattern A — `canvas-edit` (`server.js`, inside the `/canvas-edit` POST branch)**

```js
    authGuard(req, res, async () => {
      let _rnvOk = false;
      await requireNonViewer(req, res, () => { _rnvOk = true; });
      if (!_rnvOk) return;
      await handlePostCanvasEditHtml(req, res);
    });
```

- [ ] **Step 2: Wire Pattern A — `assumption-confirm` (`server.js`, inside the `/assumption/:cardId/confirm` POST branch)**

```js
    authGuard(req, res, async () => {
      let _rnvOk = false;
      await requireNonViewer(req, res, () => { _rnvOk = true; });
      if (!_rnvOk) return;
      await handlePostAssumptionConfirm(req, res);
    });
```

- [ ] **Step 3: Run targeted test — must pass.** Expected: `AC1+AC2+AC3+AC5 subtotal: 11 passed, 0 failed`

- [ ] **Step 4: Grep-count check — confirms all 11 call sites are wired**

```bash
grep -c "requireNonViewer" src/web-ui/server.js
grep -c "requireNonViewer" src/web-ui/routes/skills.js
```

Expected: `server.js` count = 1 import + 33 pre-existing (`vrne-s1`) + 8 new = 42. `skills.js` count = 1 import + 3 new = 4.

- [ ] **Step 5: Commit (batched)**

```bash
git add src/web-ui/server.js tests/check-vrne-s2-skill-session-gate.js
git commit -m "feat: wire viewer-write-block gate into canvas-edit/assumption-confirm routes (AC5)"
```

---

## Task 9: AC4 regression tests + AC6 denial-logging test (no new wiring — gate already reused everywhere)

**Files:**
- Modify: `tests/check-vrne-s2-skill-session-gate.js` (append)

No implementation step in this task — `vrne-s1`'s existing `require-non-viewer.js` already allows `admin`/`engineer`/`product`/`user` and logs every denial; this task only proves that behaviour holds for skill-session routes too (no route-specific logic exists that could regress it independently, but the ACs require it be explicitly tested per route group, not assumed from `vrne-s1`'s own test suite).

- [ ] **Step 1: Write and run the AC4 + AC6 tests together (RED and GREEN are the same step — no code change needed to make them pass)**

```js
  // AC4 — non-viewer roles unaffected (regression guard)
  [
    { role: 'engineer', route: 'turn' },
    { role: 'product',  route: 'commit-json' },
    { role: 'admin',    route: 'execute' }
  ].forEach(function(c) {
    queue.push(function() {
      console.log('\n[vrne-s2] T-ac4-' + c.role + '-' + c.route + ' -- non-viewer unaffected');
      return test('AC4: role=' + c.role + ' proceeds on ' + c.route, async function() {
        var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
        var req = { session: { userId: 'u2', role: c.role, tenantId: 't1', login: c.role + '@test' } };
        var res = makeRes();
        var nextCalled = false;
        await gate.requireNonViewer(req, res, function() { nextCalled = true; });
        assert.ok(nextCalled, 'next() should be called for role=' + c.role);
        assert.strictEqual(res._status, null, 'no response should be written for allowed roles');
      });
    });
  });

  // AC6 — denial logging, same shape as vrne-s1's AC5
  queue.push(function() {
    console.log('\n[vrne-s2] T-ac6-denial-logged -- skill-session denial logged');
    return test('AC6: denial on a skill-session route logs personId, tenantId, timestamp, route', async function() {
      var gate = freshRequire(REQUIRE_NON_VIEWER_PATH);
      var loggedEvent = null;
      var loggedPayload = null;
      gate.setLogger({ warn: function(event, payload) { loggedEvent = event; loggedPayload = payload; } });
      var req = { session: { userId: 'u1', role: 'viewer', tenantId: 't1', login: 'viewer@test' }, url: '/api/skills/discovery/sessions/abc/turn' };
      var res = makeRes();
      await gate.requireNonViewer(req, res, function() {});
      assert.strictEqual(loggedEvent, 'viewer_write_denied');
      assert.strictEqual(loggedPayload.personId, 'u1');
      assert.strictEqual(loggedPayload.tenantId, 't1');
      assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(loggedPayload.timestamp));
      assert.strictEqual(loggedPayload.route, '/api/skills/discovery/sessions/abc/turn');
    });
  });
```

- [ ] **Step 2: Run test — must pass immediately (no implementation change needed)**

Expected: `AC1+AC2+AC3+AC4+AC5+AC6 subtotal: 15 passed, 0 failed`

- [ ] **Step 3: Commit (batched — deferred to Task 11 checkpoint along with Task 10)**

---

## Task 10: Integration tests — real `server.js` dispatch for one Pattern-A route and one Pattern-B route

**Files:**
- Modify: `tests/check-vrne-s2-skill-session-gate.js` (append)

**Why two integration tests, not one (test plan names one):** the test plan's `gate-wired-in-real-skill-session-flow` names `/turn` (Pattern A, `authGuard`-wrapped in `server.js`) as its representative route. Since 3 of this story's 11 call sites are Pattern B (gated internally in `skills.js`, no `server.js` wrapper at all), a single Pattern-A integration test would leave the Pattern-B wiring mechanism itself unverified by any real-dispatch test — only by the isolated gate-only tests in Tasks 1–9, which (as `vrne-s1`'s own CI incident showed) can pass without proving the gate is actually reachable via the real route. Adding a second integration test for `/api/skills/:name/sessions/:id/answers` (Pattern B) closes that gap. This is additional coverage beyond the written test plan, not a deviation from it — flag in the DoD as "test count updated from 16 planned to 17 actual, +1 Pattern-B integration test."

- [ ] **Step 1: Write both integration tests**

Mirror `check-vrne-s1-server-wiring.js`'s own `T-integration-real-dispatch` test exactly — same `router`/`seedTestSession`/`dispatchAndAwaitResponse` helpers, same `/test/seed-multi-user-roles` seeding call, same `e2e-viewer` identity (this is the exact fix already proven necessary in `vrne-s1`'s post-merge-CI-catch: an unseeded fake identity falls through to the `'user'` default and produces a false pass, not a false fail — using the real seeded `e2e-viewer` identity from the start avoids repeating that mistake here).

```js
var router = require('../src/web-ui/server').router;
var seedTestSession = require('../src/web-ui/middleware/session').seedTestSession;
var EventEmitter = require('events').EventEmitter;

function integrationMockRes() {
  var _statusCode = null;
  var _headers = {};
  var _chunks = [];
  return {
    writeHead: function(code, headers) { _statusCode = code; Object.assign(_headers, headers || {}); return this; },
    setHeader: function(k, v) { _headers[k] = v; },
    end: function(body) { if (body != null) _chunks.push(body); },
    _get: function() { return { statusCode: _statusCode, headers: _headers, body: _chunks.join('') }; }
  };
}

function dispatchAndAwaitResponse(req) {
  return new Promise(function(resolve, reject) {
    var res = integrationMockRes();
    var settled = false;
    var origEnd = res.end;
    res.end = function(body) {
      origEnd(body);
      if (!settled) { settled = true; resolve(res._get()); }
    };
    router(req, res).catch(function(err) {
      if (!settled) { settled = true; reject(err); }
    });
  });
}

function seedMultiUserRolesForIntegrationTest(sharedOrg) {
  return new Promise(function(resolve, reject) {
    var req = new EventEmitter();
    req.method = 'POST';
    req.url = '/test/seed-multi-user-roles';
    req.headers = { 'content-type': 'application/json' };
    var res = integrationMockRes();
    var origEnd = res.end;
    res.end = function(body) {
      origEnd(body);
      var result = res._get();
      if (result.statusCode !== 200) {
        reject(new Error('seed-multi-user-roles failed: ' + result.statusCode + ' ' + result.body));
      } else {
        resolve(result);
      }
    };
    router(req, res).then(function() {
      req.emit('data', JSON.stringify({ sharedOrg: sharedOrg }));
      req.emit('end');
    }).catch(reject);
  });
}

queue.push(function() {
  console.log('\n[vrne-s2] T-integration-real-dispatch -- real server.js dispatch denies viewer on representative Pattern-A and Pattern-B routes');
  return test('integration: requireNonViewer reachable via real server.js dispatch (both wiring patterns)', async function() {
    var sharedOrg = 'e2e-vrne-s2-integration';
    await seedMultiUserRolesForIntegrationTest(sharedOrg);

    var sessionId = 'faceb00c02';
    seedTestSession(sessionId, {
      accessToken: 'e2e-test-access-token',
      userId: 9001,
      login: 'e2e-viewer',
      tenantId: sharedOrg
    });
    var cookieHeader = { cookie: 'session_id=' + sessionId };

    // Pattern A representative: POST /turn (authGuard-wrapped in server.js)
    var req1 = { headers: cookieHeader, method: 'POST', url: '/api/skills/discovery/sessions/dummy-session/turn' };
    var result1 = await dispatchAndAwaitResponse(req1);
    assert.strictEqual(result1.statusCode, 403, 'POST /turn must return 403 for a viewer-role session, got ' + result1.statusCode + ' -- ' + result1.body);

    // Pattern B representative: POST /answers (internally gated in skills.js, no server.js wrapper)
    var req2 = { headers: Object.assign({ 'content-type': 'application/json' }, cookieHeader), method: 'POST', url: '/api/skills/discovery/sessions/dummy-session/answers' };
    var result2 = await dispatchAndAwaitResponse(req2);
    assert.strictEqual(result2.statusCode, 403, 'POST /answers must return 403 for a viewer-role session, got ' + result2.statusCode + ' -- ' + result2.body);
  });
});
```

- [ ] **Step 2: Run targeted test — must pass**

```bash
node tests/check-vrne-s2-skill-session-gate.js
```

Expected output: `17 passed, 0 failed`

- [ ] **Step 3: Commit (batched — this is the final code+test commit before Task 11's full regression)**

```bash
git add tests/check-vrne-s2-skill-session-gate.js
git commit -m "test: add AC4/AC6 regression coverage and Pattern-A/Pattern-B integration tests (vrne-s2)"
```

---

## Task 11: Full regression — confirm all 17 planned tests pass, zero regressions

**Files:** None modified — verification only.

- [ ] **Step 1: Run the story's own targeted test file**

```bash
node tests/check-vrne-s2-skill-session-gate.js
```

Expected output: `17 passed, 0 failed`

- [ ] **Step 2: Run the full suite (this is one of the 3 anchor points reserved for full-suite runs — branch-setup baseline, this verify-completion check, and branch-complete)**

```bash
node scripts/run-all-tests.js
```

Expected output: `536 file(s) run` (535 baseline + this story's new test file), `0 failed` or exactly the one pre-existing `check-p3.5-validate-trace.js` pwsh-timeout flake already RISK-ACCEPTed for this feature — no other failures.

- [ ] **Step 3: Confirm `vrne-s1`'s own test suites still pass unmodified (regression guard — this story reuses `vrne-s1`'s gate, must not have altered its behaviour)**

```bash
node tests/check-vrne-s1-require-non-viewer.js
node tests/check-vrne-s1-server-wiring.js
```

Expected output: `10 passed, 0 failed` and `35 passed, 0 failed` respectively — identical to their post-fix counts from `vrne-s1`'s own DoD.

- [ ] **Step 4: Final commit (if any state/plan-tracking files changed since Task 10's commit — otherwise this is a no-op verification task)**

No code changes expected at this step; this task exists to produce the verify-completion evidence for `/verify-completion`, not to modify files.
