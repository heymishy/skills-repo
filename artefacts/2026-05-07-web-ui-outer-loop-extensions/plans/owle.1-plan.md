# Implementation Plan: owle.1 — Clarify side-trip

**Story:** artefacts/2026-05-07-web-ui-outer-loop-extensions/stories/owle.1-clarify-side-trip.md
**DoR:** artefacts/2026-05-07-web-ui-outer-loop-extensions/dor/owle.1-dor.md
**Branch:** feature/owle.1
**Worktree:** .worktrees/owle.1

**Loaded:**
ACs: 6 | Tests: T1–T6 | Arch constraints: path traversal guard, parentJourneyId server-side only, no new adapters (D37 N/A), ADR-019 no new persistent state

**Pre-existing baseline failure (acknowledged):** spc5 T7 — unrelated to owle.1 scope.

---

## File map

| File | Action | Notes |
|------|--------|-------|
| `tests/check-owle1-clarify-side-trip.js` | CREATE | T1–T6 test file |
| `src/web-ui/routes/journey.js` | MODIFY | Add handleGetStageControls, handlePostSideTripClarify, handleDeleteSideTrip, handleGetJourneyState |
| `src/web-ui/server.js` | MODIFY | Wire 4 new routes |

---

## Task 1 — Write failing test scaffold (TDD: RED)

**File:** `tests/check-owle1-clarify-side-trip.js`

```js
'use strict';
// check-owle1-clarify-side-trip.js — owle.1 test suite
// TDD: run before implementation — all assertions must FAIL initially.

const assert = require('assert');
const crypto = require('crypto');
const path = require('path');
const os = require('os');
const fs = require('fs');

// --- Test helpers ---

let _journeyStore;
let _setRegisterHtmlSession, _setLinkSessionToJourney, _setGetHtmlSession, _setJourneyStoreModule, _setRepoRoot;
let _handleGetStageControls, _handlePostSideTripClarify, _handleDeleteSideTrip, _handleGetJourneyState;

function loadJourney() {
  // Clear module cache so each require gets a fresh instance
  Object.keys(require.cache).forEach(k => {
    if (k.includes('journey') || k.includes('journey-store') || k.includes('skills')) {
      delete require.cache[k];
    }
  });
  _journeyStore = require('./src/web-ui/modules/journey-store');
  const journey = require('./src/web-ui/routes/journey');
  _setRegisterHtmlSession = journey.setRegisterHtmlSession;
  _setLinkSessionToJourney = journey.setLinkSessionToJourney;
  _setGetHtmlSession = journey.setGetHtmlSession;
  _setJourneyStoreModule = journey.setJourneyStoreModule;
  _setRepoRoot = journey.setRepoRoot;
  _handleGetStageControls = journey.handleGetStageControls;
  _handlePostSideTripClarify = journey.handlePostSideTripClarify;
  _handleDeleteSideTrip = journey.handleDeleteSideTrip;
  _handleGetJourneyState = journey.handleGetJourneyState;
  return journey;
}

function makeRes() {
  const res = { _code: null, _body: null, _headers: {} };
  res.writeHead = (code, headers) => { res._code = code; Object.assign(res._headers, headers || {}); };
  res.end = (body) => { res._body = body || ''; };
  return res;
}

function makeReq(overrides) {
  return Object.assign({ session: { accessToken: 'tok', login: 'user' }, params: {}, body: {}, headers: {} }, overrides);
}

// In-memory session store (doubles for _setGetHtmlSession)
function makeSessionStore() {
  const store = new Map();
  return {
    register: (id, path, skill) => store.set(id, { skillName: skill, sessionPath: path, systemPrompt: 'SP-' + skill, turns: [], artefactContent: null, artefactPath: null, done: false, journeyId: null }),
    get: (id) => store.get(id),
    store,
  };
}

let passed = 0;
let failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log('  [PASS]', name);
    passed++;
  } catch (e) {
    console.log('  [FAIL]', name, '—', e.message);
    failed++;
  }
}
async function testAsync(name, fn) {
  try {
    await fn();
    console.log('  [PASS]', name);
    passed++;
  } catch (e) {
    console.log('  [FAIL]', name, '—', e.message);
    failed++;
  }
}

// ── T1: clarifyAvailable flag at discovery vs benefit-metric ─────────────

console.log('\n[owle1-clarify-side-trip] T1 — stage-controls clarifyAvailable flag');

loadJourney();

test('T1a: clarifyAvailable=true when activeSkill=discovery', () => {
  const j = _journeyStore.createJourney('test-feature');
  _journeyStore.setActiveSession(j.journeyId, 'sess-1', 'discovery');
  const res = makeRes();
  const req = makeReq({ params: { journeyId: j.journeyId } });
  _handleGetStageControls(req, res);
  assert.strictEqual(res._code, 200);
  const body = JSON.parse(res._body);
  assert.strictEqual(body.clarifyAvailable, true);
});

test('T1b: clarifyAvailable=false when activeSkill=benefit-metric', () => {
  const j = _journeyStore.createJourney('test-feature');
  _journeyStore.setActiveSession(j.journeyId, 'sess-2', 'benefit-metric');
  const res = makeRes();
  const req = makeReq({ params: { journeyId: j.journeyId } });
  _handleGetStageControls(req, res);
  assert.strictEqual(res._code, 200);
  const body = JSON.parse(res._body);
  assert.ok(!body.clarifyAvailable);
});

test('T1c: 401 when unauthenticated', () => {
  const j = _journeyStore.createJourney('test-feature');
  const res = makeRes();
  const req = makeReq({ session: {}, params: { journeyId: j.journeyId } });
  _handleGetStageControls(req, res);
  assert.strictEqual(res._code, 401);
});

// ── T2/T3: POST side-trip opens session with discovery content ────────────

console.log('\n[owle1-clarify-side-trip] T2/T3 — POST side-trip/clarify');

await (async () => {
  loadJourney();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle1-test-'));
  const artefactDir = path.join(tmpDir, 'artefacts', 'test-feature');
  fs.mkdirSync(artefactDir, { recursive: true });
  const marker = 'DISCOVERY_MARKER_' + crypto.randomUUID();
  fs.writeFileSync(path.join(artefactDir, 'discovery.md'), '# Discovery\n\n' + marker, 'utf8');
  _setRepoRoot(tmpDir);

  const sessions = makeSessionStore();
  _setRegisterHtmlSession(sessions.register.bind(sessions));
  _setLinkSessionToJourney(() => {});
  _setGetHtmlSession(sessions.get.bind(sessions));

  const j = _journeyStore.createJourney('test-feature');
  _journeyStore.setActiveSession(j.journeyId, 'prev-sess', 'discovery');

  const res = makeRes();
  const req = makeReq({ params: { journeyId: j.journeyId } });
  await _handlePostSideTripClarify(req, res);

  await testAsync('T2a: response 200 with sideTripSessionId', async () => {
    assert.strictEqual(res._code, 200);
    const body = JSON.parse(res._body);
    assert.ok(body.sideTripSessionId, 'sideTripSessionId missing');
  });

  const body = JSON.parse(res._body);
  const sid = body && body.sideTripSessionId;

  await testAsync('T2b: session system prompt contains discovery marker', async () => {
    const session = sessions.get(sid);
    assert.ok(session, 'session not found');
    assert.ok(
      session.systemPrompt.includes(marker),
      'marker not found in systemPrompt: ' + session.systemPrompt.slice(0, 200)
    );
  });

  await testAsync('T2c: session has parentJourneyId set (server-side)', async () => {
    const session = sessions.get(sid);
    assert.strictEqual(session.parentJourneyId, j.journeyId);
  });

  await testAsync('T3: parent journey activeSkill and activeSessionId unchanged', async () => {
    const updated = _journeyStore.getJourney(j.journeyId);
    assert.strictEqual(updated.activeSkill, 'discovery');
    assert.strictEqual(updated.activeSessionId, 'prev-sess');
  });

  // cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
})();

// ── T4: DELETE side-trip marks session closed ─────────────────────────────

console.log('\n[owle1-clarify-side-trip] T4 — DELETE side-trip');

await (async () => {
  loadJourney();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle1-test-'));
  const artefactDir = path.join(tmpDir, 'artefacts', 'test-feature');
  fs.mkdirSync(artefactDir, { recursive: true });
  fs.writeFileSync(path.join(artefactDir, 'discovery.md'), '# Discovery', 'utf8');
  _setRepoRoot(tmpDir);

  const sessions = makeSessionStore();
  _setRegisterHtmlSession(sessions.register.bind(sessions));
  _setLinkSessionToJourney(() => {});
  _setGetHtmlSession(sessions.get.bind(sessions));

  const j = _journeyStore.createJourney('test-feature');
  _journeyStore.setActiveSession(j.journeyId, 'prev-sess', 'discovery');

  // Open side-trip first
  const openRes = makeRes();
  await _handlePostSideTripClarify(makeReq({ params: { journeyId: j.journeyId } }), openRes);
  const openBody = JSON.parse(openRes._body);
  const sid = openBody.sideTripSessionId;

  // Delete side-trip
  const delRes = makeRes();
  await _handleDeleteSideTrip(makeReq({ params: { journeyId: j.journeyId } }), delRes);

  await testAsync('T4a: DELETE returns 200', async () => {
    assert.strictEqual(delRes._code, 200);
  });

  await testAsync('T4b: side-trip session is marked closed (done=true)', async () => {
    const session = sessions.get(sid);
    assert.ok(session, 'session not found');
    assert.strictEqual(session.done, true);
  });

  await testAsync('T4c: parent journey is still accessible at prior state', async () => {
    const updated = _journeyStore.getJourney(j.journeyId);
    assert.ok(updated, 'journey not found');
    assert.strictEqual(updated.activeSkill, 'discovery');
  });

  fs.rmSync(tmpDir, { recursive: true, force: true });
})();

// ── T5: path traversal guard ──────────────────────────────────────────────

console.log('\n[owle1-clarify-side-trip] T5 — path traversal guard');

await (async () => {
  loadJourney();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owle1-test-'));
  _setRepoRoot(tmpDir);

  const sessions = makeSessionStore();
  _setRegisterHtmlSession(sessions.register.bind(sessions));
  _setLinkSessionToJourney(() => {});
  _setGetHtmlSession(sessions.get.bind(sessions));

  // Journey with a traversal slug
  const j = _journeyStore.createJourney('../../../etc');
  _journeyStore.setActiveSession(j.journeyId, 'prev-sess', 'discovery');

  const res = makeRes();
  await _handlePostSideTripClarify(makeReq({ params: { journeyId: j.journeyId } }), res);

  await testAsync('T5: path traversal returns 400', async () => {
    assert.strictEqual(res._code, 400);
  });

  fs.rmSync(tmpDir, { recursive: true, force: true });
})();

// ── T6: GET /api/journey/:id — clean state (no side-trip exposed) ─────────

console.log('\n[owle1-clarify-side-trip] T6 — GET journey state excludes side-trip');

await (async () => {
  loadJourney();
  const j = _journeyStore.createJourney('test-feature');
  _journeyStore.setActiveSession(j.journeyId, 'prev-sess', 'discovery');

  // Simulate side-trip by setting it on the journey object
  const jObj = _journeyStore.getJourney(j.journeyId);
  jObj.sideTripSessionId = 'some-side-trip-session';

  const res = makeRes();
  _handleGetJourneyState(makeReq({ params: { journeyId: j.journeyId } }), res);

  await testAsync('T6a: returns 200', async () => {
    assert.strictEqual(res._code, 200);
  });
  await testAsync('T6b: response does not expose sideTripSessionId', async () => {
    const body = JSON.parse(res._body);
    assert.ok(!('sideTripSessionId' in body), 'sideTripSessionId must not be in response');
  });
  await testAsync('T6c: response includes activeSkill=discovery', async () => {
    const body = JSON.parse(res._body);
    assert.strictEqual(body.activeSkill, 'discovery');
  });
})();

// ── Results ───────────────────────────────────────────────────────────────

console.log(`\n[owle1-clarify-side-trip] ${passed + failed} run, ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
```

**Run command (expect all FAIL):**
```
node tests/check-owle1-clarify-side-trip.js
```

**Expected output (RED):** All tests fail with "... is not a function" or similar — the handlers don't exist yet.

**Commit message:** `test(owle.1): add failing test scaffold — T1–T6 clarify side-trip`

---

## Task 2 — Implement `handleGetStageControls` (AC1, AC5)

**File:** `src/web-ui/routes/journey.js`

Add after the `handleGetJourneyComplete` function, before `module.exports`:

```js
/**
 * GET /api/journey/:journeyId/stage-controls
 * Returns clarifyAvailable:true only when the journey's active skill is 'discovery'.
 */
function handleGetStageControls(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorised' }));
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Journey not found' }));
    return;
  }
  var clarifyAvailable = journey.activeSkill === 'discovery';
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ clarifyAvailable: clarifyAvailable }));
}
```

Also add `handleGetStageControls` to `module.exports`.

**Run tests:** `node tests/check-owle1-clarify-side-trip.js` — T1 tests now pass.

**Commit message:** `feat(owle.1): add handleGetStageControls — AC1/AC5`

---

## Task 3 — Implement `handlePostSideTripClarify` (AC2, AC3)

**File:** `src/web-ui/routes/journey.js`

```js
/**
 * POST /api/journey/:journeyId/side-trip/clarify
 * Opens a /clarify skill session with the journey's discovery.md pre-loaded as context.
 * Returns { sideTripSessionId }.
 * parentJourneyId is stored server-side on the session only — never sent to client.
 */
async function handlePostSideTripClarify(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorised' }));
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Journey not found' }));
    return;
  }

  // Path traversal guard: validate featureSlug resolves within repoRoot
  var featureSlug = journey.featureSlug || '';
  var repoRoot = getRepoRoot();
  var discoveryRel = path.join('artefacts', featureSlug, 'discovery.md');
  var discoveryAbs = path.resolve(path.join(repoRoot, discoveryRel));
  var resolvedRoot = path.resolve(repoRoot);
  if (!discoveryAbs.startsWith(resolvedRoot + path.sep) && discoveryAbs !== resolvedRoot) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid feature slug' }));
    return;
  }

  // Read discovery.md — tolerate missing file (no context injection if absent)
  var discoveryContent = '';
  try {
    discoveryContent = fs.readFileSync(discoveryAbs, 'utf8');
  } catch (_) {
    // file absent — proceed without context injection
  }

  // Create clarify session
  var sid = crypto.randomUUID();
  var sessionPath = path.join(os.tmpdir(), 'ougl-sessions', sid + '-clarify.md');
  getRegisterHtmlSession()(sid, sessionPath, 'clarify');
  getLinkSessionToJourney()(sid, journeyId);

  // Inject discovery content into the session's system prompt (server-side mutation only)
  var session = getGetHtmlSession()(sid);
  if (session && discoveryContent) {
    session.systemPrompt += '\n\n---\n\n**Pre-loaded discovery artefact (read-only context):**\n\n' + discoveryContent;
  }
  // Store parentJourneyId server-side — NEVER sent to client
  if (session) {
    session.parentJourneyId = journeyId;
  }

  // Record side-trip session on journey for later cleanup (does NOT change activeSkill/activeSessionId)
  journey.sideTripSessionId = sid;

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ sideTripSessionId: sid }));
}
```

Add `handlePostSideTripClarify` to `module.exports`.

**Run tests:** T2 and T3 now pass.

**Commit message:** `feat(owle.1): add handlePostSideTripClarify — AC2/AC3`

---

## Task 4 — Implement `handleDeleteSideTrip` and `handleGetJourneyState` (AC4, AC6)

**File:** `src/web-ui/routes/journey.js`

```js
/**
 * DELETE /api/journey/:journeyId/side-trip
 * Closes the active side-trip session linked to this journey.
 * Does not modify parent journey state.
 */
async function handleDeleteSideTrip(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorised' }));
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Journey not found' }));
    return;
  }
  var sideTripSid = journey.sideTripSessionId;
  if (sideTripSid) {
    var stSession = getGetHtmlSession()(sideTripSid);
    if (stSession) {
      stSession.done = true;
    }
    journey.sideTripSessionId = null;
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ closed: true }));
}

/**
 * GET /api/journey/:journeyId
 * Returns the main journey state. Side-trip session ID is intentionally excluded.
 */
function handleGetJourneyState(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorised' }));
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Journey not found' }));
    return;
  }
  // Return public journey state — sideTripSessionId is intentionally omitted
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    journeyId: journey.journeyId,
    featureSlug: journey.featureSlug,
    activeSkill: journey.activeSkill,
    activeSessionId: journey.activeSessionId,
    completedStages: journey.completedStages,
    complete: journey.complete
  }));
}
```

Add both to `module.exports`.

**Run tests:** All T1–T6 should now pass.

**Commit message:** `feat(owle.1): add handleDeleteSideTrip + handleGetJourneyState — AC4/AC6`

---

## Task 5 — Wire routes in `server.js`

**File:** `src/web-ui/server.js`

1. Update the `require('./routes/journey')` import to include the 4 new handlers:

```js
const { handleGetJourney, handlePostJourney, handlePostGateConfirm, handleGetStories, handlePostStories, handleGetJourneyComplete, handleGetStageControls, handlePostSideTripClarify, handleDeleteSideTrip, handleGetJourneyState } = require('./routes/journey'); // ougl.3 / owle.1
```

2. Add 4 new route blocks in `router()` before the `else` fallback:

```js
  } else if (pathname.match(/^\/api\/journey\/[^/]+\/stage-controls$/) && req.method === 'GET') {
    // owle.1 — stage controls (clarifyAvailable flag)
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    authGuard(req, res, () => handleGetStageControls(req, res));

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/side-trip\/clarify$/) && req.method === 'POST') {
    // owle.1 — open clarify side-trip
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    authGuard(req, res, async () => await handlePostSideTripClarify(req, res));

  } else if (pathname.match(/^\/api\/journey\/[^/]+\/side-trip$/) && req.method === 'DELETE') {
    // owle.1 — close side-trip
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    authGuard(req, res, async () => await handleDeleteSideTrip(req, res));

  } else if (pathname.match(/^\/api\/journey\/[^/]+$/) && req.method === 'GET') {
    // owle.1 — journey state (excludes side-trip data)
    const journeyIdPart = pathname.split('/')[3];
    req.params = { journeyId: journeyIdPart };
    authGuard(req, res, () => handleGetJourneyState(req, res));
```

**Run full test suite:** `npm test` — 70+N passed (1 pre-existing failure unchanged).

**Commit message:** `feat(owle.1): wire stage-controls + side-trip routes in server.js — AC1–AC6`

---

## Step 4 — Self-review

- [x] Exact file paths — no placeholders
- [x] Complete code in every task step
- [x] Failing tests written before implementation
- [x] Expected output for every run command
- [x] Commit messages in imperative mood
- [x] Scope bounded to owle.1 ACs only
- [x] Path traversal guard present (Task 3)
- [x] `parentJourneyId` server-side only — never in JSON response (Tasks 3, 4)
- [x] `req.session.accessToken` used throughout (not `req.session.token`)
- [x] No new npm dependencies
- [x] D37 N/A — no new injectable adapters
