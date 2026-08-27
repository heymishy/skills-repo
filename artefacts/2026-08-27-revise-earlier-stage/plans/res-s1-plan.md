# Reopen a completed stage's live session from the step-nav — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/res-s1-reopen-completed-stage-live-session`
**Worktree:** `.worktrees/res-s1-reopen-completed-stage-live-session`
**Test command:** `node tests/check-res-s1-reopen-completed-stage-live-session.js` (single file); full suite: `npm test`

---

## Codebase context (read this before starting — no prior context assumed)

- `journey.completedStages` is an array of entries `{ skillName, artefactPath, completedAt, sessionId? }` (see `src/web-ui/modules/journey-store.js` `completeStage()`, docblock at line ~201). `sessionId` was added by `frsr-s1` specifically so a later "resume conversation" link can resolve which session to point at — this story is the second consumer of that field (the first is `handleGetJourneyStage`, `src/web-ui/routes/journey.js` line ~3135, used by the read-only stage view's own turn history).
- The step-nav renderer that needs modifying lives inside `handleGetJourneyStageView` (`src/web-ui/routes/journey.js`, function starts line 743). Its `_stepsHtml` build (line ~894-923) has an `isDone && !isViewing` branch (line 903-905) that currently links every completed, non-viewed stage to the static `/journey/:journeyId/stage/:skillName` view — this is the one to change.
- `getGetHtmlSession()` (line 41) is the existing injectable read-only session lookup, already reused by `handleGetJourneyById` (kcrs-s1) and `handleGetJourneyStage`. Do not invent a second lookup mechanism.
- `getRegisterHtmlSession()` (line 31) wraps session creation + `buildSystemPrompt`'s `priorArtefacts` injection. See `handleGetJourneyResume` (line 1447) for the exact call shape: `getRegisterHtmlSession()(sid, sessionPath, stageName, { productProfile, priorArtefacts, featureSlug })`.
- **Do not** replicate `handleGetJourneyResume`'s local `STAGE_ORDER` array (line ~1547) — it is an already-known, already-flagged duplicate of `journey-store.js`'s own (unexported) `STAGE_SEQUENCE`. This story's `priorArtefacts` only needs the ONE reopened stage's own artefact content (per the signed-off DoR contract), so no stage-ordering list is needed at all here.
- Routes are registered in `src/web-ui/server.js` as a long `if/else if` chain matching `pathname` against regexes (see line ~2811 for `/resume`, line ~2821 for the existing `/stage/:stageName` static view).
- Test convention: plain Node.js, no Jest. See `tests/check-aslr-s1-active-stage-link-resume.js` for the exact style — a `ok(label, cond)` counter helper, `fakeReq`/`fakeRes` stubs, `journeyStore._clear()` before each file run, injectable adapters stubbed via the route module's own `setX()` functions.

---

## File map

```
Create:
  tests/check-res-s1-reopen-completed-stage-live-session.js  — all 4 ACs, built up incrementally across the 3 tasks below

Modify:
  src/web-ui/modules/journey-store.js   — add updateCompletedStageSessionId(journeyId, skillName, sessionId)
  src/web-ui/routes/journey.js          — add handleGetJourneyStageReopen() handler + export it; modify the isDone step-nav branch in handleGetJourneyStageView
  src/web-ui/server.js                  — register the new /journey/:journeyId/stage/:skillName/reopen route
```

---

## Task 1: `updateCompletedStageSessionId` on the journey store

**Files:**
- Modify: `src/web-ui/modules/journey-store.js`
- Create: `tests/check-res-s1-reopen-completed-stage-live-session.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';

// check-res-s1-reopen-completed-stage-live-session.js
// Verifies res-s1: a completed stage's step-nav link routes directly to a
// live session (existing or freshly created), instead of the static
// read-only /journey/:id/stage/:skill view -- extending the kcrs-s1/adsr-s1
// existing-session-first pattern to ANY completed stage, not just the
// journey's current active one.
//
// Run: node tests/check-res-s1-reopen-completed-stage-live-session.js

var path = require('path');
var fs   = require('fs');
var os   = require('os');

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-res-s1-'));

var journeyStore = require('../src/web-ui/modules/journey-store');
journeyStore._clear();

(function main() {

console.log('\nTask 1 — updateCompletedStageSessionId');
(function() {
  var slug = 'res-s1-store-feature';
  var created = journeyStore.createJourney(slug, 'default');
  var jid = created.journeyId;

  journeyStore.completeStage(jid, 'discovery', 'artefacts/' + slug + '/discovery.md', null, 'old-sid');

  journeyStore.updateCompletedStageSessionId(jid, 'discovery', 'new-sid');

  var journey = journeyStore.getJourney(jid);
  var entry = journey.completedStages.find(function(cs) { return cs.skillName === 'discovery'; });

  ok('sessionId updated to the new session', entry.sessionId === 'new-sid');
  ok('skillName unchanged', entry.skillName === 'discovery');
  ok('artefactPath unchanged', entry.artefactPath === 'artefacts/' + slug + '/discovery.md');
  ok('completedAt unchanged (not a re-completion)', !!entry.completedAt);
  ok('journey.sessions map updated', journey.sessions['new-sid'] === 'discovery');
})();

(function() {
  // Negative case: unknown journeyId or skillName — must not throw
  var threw = false;
  try {
    journeyStore.updateCompletedStageSessionId('nonexistent-journey', 'discovery', 'sid');
    journeyStore.updateCompletedStageSessionId(journeyStore.createJourney('res-s1-neg-feature', 'default').journeyId, 'not-a-real-stage', 'sid');
  } catch (_) { threw = true; }
  ok('unknown journeyId/skillName does not throw', !threw);
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-res-s1-reopen-completed-stage-live-session.js
```

Expected output: `TypeError: journeyStore.updateCompletedStageSessionId is not a function`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/modules/journey-store.js`, add this function immediately after `completeStage` (after its closing `}`, around line 236):

```javascript
/**
 * res-s1 (AC3) — update a specific completedStages entry's sessionId after
 * a reopen creates a fresh session for it. Only sessionId changes; the
 * entry's skillName, artefactPath, and completedAt are left untouched, so
 * a later reopen of the same stage can use the cheap existing-session path
 * instead of creating another fresh session every time.
 * @param {string} journeyId
 * @param {string} skillName
 * @param {string} sessionId
 */
function updateCompletedStageSessionId(journeyId, skillName, sessionId) {
  var journey = _journeys.get(journeyId);
  if (!journey) return;
  var entry = (journey.completedStages || []).find(function(cs) { return cs.skillName === skillName; });
  if (!entry) return;
  entry.sessionId = sessionId;
  journey.sessions[sessionId] = skillName;
  _pgWrite(journey);
  if (_diskAdapter) {
    try { _diskAdapter.updateStage(journey.featureSlug, skillName, { sessionId: sessionId }); } catch (_) {}
  }
}
```

Add `updateCompletedStageSessionId` to the `module.exports` object (after `setJourneyFields`, before `_clear`):

```javascript
module.exports = {
  createJourney,
  getJourney,
  setActiveSession,
  getJourneyBySession,
  getJourneyByFeatureSlug,
  getArtefactsForJourney,
  deleteJourney,
  completeStage,
  updateCompletedStageSessionId,
  getNextStage,
  getJourneyStories,
  advanceToNextStory,
  setStoryList,
  getCurrentStory,
  markJourneyComplete,
  setDiskAdapter,
  loadAllFromDisk,
  setPgAdapter,
  setPgAdapterForTesting,
  loadAllFromPg,
  listJourneys,
  setJourneyFields,
  _clear,
  _clearForTesting
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-res-s1-reopen-completed-stage-live-session.js
```

Expected output: `6 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (561/562 — 1 pre-existing flake in `check-p3.5-validate-trace.js`, unrelated, acknowledged in `decisions.md`)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/journey-store.js tests/check-res-s1-reopen-completed-stage-live-session.js
git commit -m "feat(res-s1): add updateCompletedStageSessionId to journey store"
```

---

## Task 2: `handleGetJourneyStageReopen` handler + route registration

**Files:**
- Modify: `src/web-ui/routes/journey.js`
- Modify: `src/web-ui/server.js`
- Modify: `tests/check-res-s1-reopen-completed-stage-live-session.js`

- [ ] **Step 1: Write the failing test**

Append to the existing test file, before the final `console.log('\n' + passed ...)` block (inside the `(function main() { ... })();` IIFE, still synchronous since `handleGetJourneyStageReopen` doesn't need `await` for the fixture setup, but the handler itself is `async` so the test block must be):

```javascript
console.log('\nTask 2 — handleGetJourneyStageReopen handler');
await (async function() {
  var journeyRoute = require('../src/web-ui/routes/journey');
  journeyRoute.setJourneyStoreModule(journeyStore);
  journeyRoute.setRepoRoot(tmpDir);
  journeyRoute.setLinkSessionToJourney(function() {});

  function fakeRes() {
    var r = { _status: null, _location: null };
    r.writeHead = function(s, h) { r._status = s; if (h && h.Location) r._location = h.Location; };
    r.end = function() {};
    return r;
  }
  function fakeReq(session, params) {
    return { session: session, params: params || {} };
  }
  function writeArtefact(relPath, content) {
    var abs = path.join(tmpDir, relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, 'utf8');
  }

  var slug = 'res-s1-reopen-feature';
  var created = journeyStore.createJourney(slug, 'default');
  var jid = created.journeyId;
  var artefactPath = 'artefacts/' + slug + '/discovery.md';
  writeArtefact(artefactPath, '# Discovery\n\nOriginal content.');
  journeyStore.completeStage(jid, 'discovery', artefactPath, null, null); // no sessionId -- simulates a pruned/pre-frsr-s1 session
  journeyStore.setJourneyFields(jid, { ownerId: 'alice', tenantId: 'alice' });

  // AC2: no live session exists -- expect a fresh one to be created
  journeyRoute.setGetHtmlSession(function() { return null; });
  var registeredCalls = [];
  journeyRoute.setRegisterHtmlSession(function(sid, sessionPath, skillName, opts) {
    registeredCalls.push({ sid: sid, skillName: skillName, opts: opts });
  });

  var req = fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' }, { journeyId: jid, skillName: 'discovery' });
  var res = fakeRes();
  await journeyRoute.handleGetJourneyStageReopen(req, res);

  ok('AC2: redirects (303) to a new chat session', res._status === 303 && /^\/skills\/discovery\/sessions\/.+\/chat$/.test(res._location || ''));
  ok('AC2: a fresh session was registered for the "discovery" skill', registeredCalls.length === 1 && registeredCalls[0].skillName === 'discovery');
  ok('AC2: priorArtefacts contains the stage\'s own artefact content read from disk', registeredCalls.length === 1 &&
    registeredCalls[0].opts.priorArtefacts.length === 1 &&
    registeredCalls[0].opts.priorArtefacts[0].path === artefactPath &&
    registeredCalls[0].opts.priorArtefacts[0].content === '# Discovery\n\nOriginal content.');

  var updatedJourney = journeyStore.getJourney(jid);
  var updatedEntry = updatedJourney.completedStages.find(function(cs) { return cs.skillName === 'discovery'; });
  ok('AC3: completedStages sessionId updated to the new session', updatedEntry.sessionId && updatedEntry.sessionId === registeredCalls[0].sid);
  ok('AC3: completedStages artefactPath unchanged', updatedEntry.artefactPath === artefactPath);

  // AC1 (safety-net re-check): session now exists -- a second reopen call
  // must NOT create another fresh session.
  journeyRoute.setGetHtmlSession(function(sid) {
    return sid === registeredCalls[0].sid ? { skillName: 'discovery', turns: [] } : null;
  });
  var res2 = fakeRes();
  await journeyRoute.handleGetJourneyStageReopen(fakeReq({ accessToken: 'tok', login: 'alice', tenantId: 'alice' }, { journeyId: jid, skillName: 'discovery' }), res2);
  ok('AC1: second reopen with an existing session redirects directly, no new session created', res2._status === 303 && registeredCalls.length === 1 &&
    res2._location === '/skills/discovery/sessions/' + registeredCalls[0].sid + '/chat');
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-res-s1-reopen-completed-stage-live-session.js
```

Expected output: `TypeError: journeyRoute.handleGetJourneyStageReopen is not a function`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/journey.js`, add this new handler immediately after `handleGetJourneyResume`'s closing `}` (after line 1614):

```javascript
/**
 * GET /journey/:journeyId/stage/:skillName/reopen
 * res-s1 (AC1/AC2/AC3) — resolve or create a live, resumable session for a
 * specific completed stage (not necessarily the journey's active stage),
 * then redirect to its chat URL. Mirrors handleGetJourneyResume's shape but
 * is scoped to one named stage instead of "the active stage". Re-checks for
 * an existing session as a safety net (the step-nav's own render-time check
 * could race a concurrent tab or a second click) before creating a new one.
 */
async function handleGetJourneyStageReopen(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var skillName = req.params && req.params.skillName;
  var journey = _journeyStore.getJourney(journeyId);
  if (!journey) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Not Found', bodyContent: '<div class="sw-page-content"><p>Journey not found.</p><a href="/journey">Back to journeys</a></div>', user: { login: req.session.login || '' } }));
    return;
  }
  try { requireJourneyAccess(journey, req.session, POLICY.TENANT); }
  catch (err) {
    res.writeHead(asHttpResponse(err, POLICY.TENANT), { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Not Found', bodyContent: '<p>Not found.</p>', user: { login: req.session.login || '' } }));
    return;
  }

  var stageEntry = (journey.completedStages || []).find(function(cs) { return cs.skillName === skillName; });
  if (!stageEntry) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Not Found', bodyContent: '<div class="sw-page-content"><p>Stage not completed yet.</p></div>', user: { login: req.session.login || '' } }));
    return;
  }

  // AC1 safety-net re-check: session may already exist despite the step-nav
  // link having pointed here (a concurrent tab, or a race with the render).
  if (stageEntry.sessionId) {
    var existingSession = getGetHtmlSession()(stageEntry.sessionId);
    if (existingSession) {
      res.writeHead(303, { Location: '/skills/' + encodeURIComponent(existingSession.skillName || skillName) + '/sessions/' + encodeURIComponent(stageEntry.sessionId) + '/chat' });
      res.end();
      return;
    }
  }

  // AC2: no live session — create a fresh one, injecting this stage's own
  // artefact content as priorArtefacts (ADR-023: read fresh from disk).
  var repoRoot = getRepoRoot(req);
  var priorArtefacts = [];
  if (stageEntry.artefactPath) {
    var absPath = path.resolve(path.join(repoRoot, stageEntry.artefactPath));
    try {
      var content = fs.readFileSync(absPath, 'utf8');
      priorArtefacts.push({ path: stageEntry.artefactPath, content: content });
    } catch (_) {}
  }

  var sid = crypto.randomUUID();
  var sessionPath = path.join(repoRoot, 'artefacts', journey.featureSlug, 'sessions', sid);
  getRegisterHtmlSession()(sid, sessionPath, skillName, { productProfile: journey.productProfile || 'default', priorArtefacts: priorArtefacts, featureSlug: journey.featureSlug });
  getLinkSessionToJourney()(sid, journeyId);

  // AC3: point this stage's completedStages entry at the new session so a
  // future reopen uses the cheap existing-session path (AC1) instead.
  _journeyStore.updateCompletedStageSessionId(journeyId, skillName, sid);

  _posthog.capture(req.session.login || journey.ownerId || journeyId, 'earlier_stage_reopened', {
    skillName:   skillName,
    featureSlug: journey.featureSlug,
    journeyId:   journeyId
  }, { company: req.session.tenantId || journey.tenantId });

  res.writeHead(303, { Location: '/skills/' + encodeURIComponent(skillName) + '/sessions/' + sid + '/chat' });
  res.end();
}
```

Add `handleGetJourneyStageReopen` to `module.exports` (the first, larger exports object — insert it near `handleGetJourneyStageView`, around line 4271):

```javascript
  handleGetJourneyStageView,
  handleGetJourneyStageReopen,
```

In `src/web-ui/server.js`, register the route immediately before the existing `/journey/:journeyId/stage/:stageName` static-view route (before line 2821's `else if`):

```javascript
  } else if (pathname.match(/^\/journey\/[^/]+\/stage\/[^/]+\/reopen$/) && req.method === 'GET') {
    // res-s1 — resolve or create a live session for a specific completed
    // stage (not necessarily the journey's active stage) and redirect to it.
    req.params = { journeyId: pathname.split('/')[2], skillName: decodeURIComponent(pathname.split('/')[4]) };
    await handleGetJourneyStageReopen(req, res);

  } else if (pathname.match(/^\/journey\/[^/]+\/stage\/[^/]+$/) && req.method === 'GET') {
```

(Everything else in that `else if` block for the static view is unchanged — only the new block above it is added.) Add `handleGetJourneyStageReopen` to server.js's destructured import from `./routes/journey` at the top of the file, alongside the existing `handleGetJourneyStageView` import.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-res-s1-reopen-completed-stage-live-session.js
```

Expected output: `11 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (561/562 — same pre-existing flake as Task 1)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journey.js src/web-ui/server.js tests/check-res-s1-reopen-completed-stage-live-session.js
git commit -m "feat(res-s1): add handleGetJourneyStageReopen handler and route"
```

---

## Task 3: Route the step-nav's done-stage link through the reopen mechanism

**Files:**
- Modify: `src/web-ui/routes/journey.js`
- Modify: `tests/check-res-s1-reopen-completed-stage-live-session.js`

- [ ] **Step 1: Write the failing test**

Append to the test file (still inside `main()`, before the final summary block):

```javascript
console.log('\nTask 3 — step-nav done-stage link');
await (async function() {
  var journeyRoute = require('../src/web-ui/routes/journey');
  var { handleGetJourneyStageView } = journeyRoute;

  function fakeRes() {
    var r = { _status: null, _body: '' };
    r.writeHead = function(s) { r._status = s; };
    r.end = function(b) { r._body = b || ''; };
    return r;
  }
  function writeArtefact(relPath, content) {
    var abs = path.join(tmpDir, relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, 'utf8');
  }

  var slug = 'res-s1-stepnav-feature';
  var created = journeyStore.createJourney(slug, 'default');
  var jid = created.journeyId;

  // "discovery" is done with a live session -- expect a direct chat link
  var discoveryPath = 'artefacts/' + slug + '/discovery.md';
  writeArtefact(discoveryPath, '# Discovery');
  journeyStore.completeStage(jid, 'discovery', discoveryPath, null, 'live-sid');

  // "benefit-metric" is done but its session is gone -- expect a /reopen link
  var bmPath = 'artefacts/' + slug + '/benefit-metric.md';
  writeArtefact(bmPath, '# Benefit Metric');
  journeyStore.completeStage(jid, 'benefit-metric', bmPath, null, 'stale-sid');

  journeyStore.setJourneyFields(jid, { ownerId: 'alice', tenantId: 'alice', activeSkill: 'definition' });

  journeyRoute.setGetHtmlSession(function(sid) {
    return sid === 'live-sid' ? { skillName: 'discovery', turns: [] } : null;
  });

  var req = { session: { accessToken: 'tok', login: 'alice', tenantId: 'alice' }, params: { journeyId: jid, stageName: 'discovery' } };
  var res = fakeRes();
  await handleGetJourneyStageView(req, res, null);

  ok('AC1: done stage with a live session links directly to its chat', res._body.indexOf('/skills/discovery/sessions/live-sid/chat') !== -1);
  ok('AC1: does NOT link to the static read-only view for that stage', res._body.indexOf('/journey/' + jid + '/stage/discovery"') === -1);
  ok('AC2: done stage with no live session links to the reopen route', res._body.indexOf('/journey/' + jid + '/stage/benefit-metric/reopen') !== -1);
  ok('AC4: a not-yet-completed stage (definition, active) is unaffected -- still an active-stage link, not a done-stage link', res._body.indexOf('sn-step--active') !== -1);
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);

})();
```

Remove the old, now-superseded `console.log('\n' + passed ...)` block that was left over from Task 1/2's incremental append (there should be exactly one copy of the summary block, at the very end of the file, after this Task 3 block — delete any earlier duplicate introduced while appending Task 2).

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-res-s1-reopen-completed-stage-live-session.js
```

Expected output: `FAIL: AC2: done stage with no live session links to the reopen route` (the static `/journey/:id/stage/:skill` link is still being rendered instead)

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/journey.js`, inside `handleGetJourneyStageView`'s `_stepsHtml` build, replace the `isDone && !isViewing` branch (currently lines 903-905):

```javascript
    if (isDone && !isViewing) {
      return '<li class="sn-step ' + cls + '"><a href="/journey/' + safeJourneyId + '/stage/' + encodeURIComponent(s.id) + '" class="sn-step-link">' + inner + '</a></li>';
    }
```

with:

```javascript
    if (isDone && !isViewing) {
      // res-s1: link directly to a live session when one exists for this
      // specific completed stage (any stage, not just the active one);
      // otherwise link to the reopen route, which creates a fresh session
      // with this stage's own artefact injected as priorArtefacts.
      var _doneStageEntry = (journey.completedStages || []).find(function(cs) { return cs.skillName === s.id; });
      var _doneStageSession = _doneStageEntry && _doneStageEntry.sessionId ? getGetHtmlSession()(_doneStageEntry.sessionId) : null;
      var _doneStageHref = _doneStageSession
        ? '/skills/' + encodeURIComponent(_doneStageSession.skillName || s.id) + '/sessions/' + encodeURIComponent(_doneStageEntry.sessionId) + '/chat'
        : '/journey/' + safeJourneyId + '/stage/' + encodeURIComponent(s.id) + '/reopen';
      return '<li class="sn-step ' + cls + '"><a href="' + _doneStageHref + '" class="sn-step-link">' + inner + '</a></li>';
    }
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-res-s1-reopen-completed-stage-live-session.js
```

Expected output: `15 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (561/562 — same pre-existing flake, plus this story's own new file now included in the count)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journey.js tests/check-res-s1-reopen-completed-stage-live-session.js
git commit -m "feat(res-s1): route the step-nav's done-stage link through live-session resolution"
```

---

## AC coverage confirmation

| AC | Covered by |
|----|-----------|
| AC1 | Task 2's safety-net re-check test + Task 3's step-nav direct-link test |
| AC2 | Task 2's fresh-session creation test |
| AC3 | Task 1's `updateCompletedStageSessionId` test + Task 2's completedStages-updated-after-reopen test |
| AC4 | Task 3's not-yet-completed-stage-unaffected test |

All 4 ACs covered. No gaps.
