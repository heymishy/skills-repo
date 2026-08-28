# Overwrite a reopened stage's artefact in place on revision — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/res-s2-overwrite-artefact-in-place-on-revision`
**Worktree:** `.worktrees/res-s2-overwrite-artefact-in-place-on-revision`
**Test command:** `node tests/check-res-s2-overwrite-artefact-in-place-on-revision.js` (single file); full suite: `npm test`

---

## Codebase context (read this before starting — no prior context assumed)

- **Correction from the DoR contract (see `dor/res-s2-dor-contract.md`'s revision note and `decisions.md`'s 2026-08-28 ARCH entry):** the real artefact-completion/disk-write/`completeStage()` logic lives in `src/web-ui/routes/skills.js`'s `handlePostTurnStreamHtml` function (the SSE streaming turn endpoint the live chat page actually uses, registered as `POST /api/skills/:name/sessions/:id/turn-stream` in `server.js`). It does NOT live in `journey.js`. The non-streaming `POST .../turn` endpoint (`handlePostTurnHtml`/`htmlSubmitTurn`) does not write to disk or call `completeStage()` at all — it is out of scope, not touched by this story.
- `handlePostTurnStreamHtml`'s artefact-completion block starts with `if (done && _artefactText) {` (search for this exact text) — this fires when the model's SSE response contains a `---ARTEFACT-START---...---ARTEFACT-END---` marker. This detection logic is existing and unchanged — do not modify it.
- Inside that block: `session.artefactPath` is computed as `'artefacts/' + slug + '/' + (session.skillName || skillName) + '.md'`. For a session created via res-s1's reopen flow, `session.featureSlug` and `session.skillName` are set identically to the original stage's session, so this recomputes the *same* path automatically — no new path-construction logic is needed, only a validation guard.
- `_journeyStore` (module-level `const`, line ~35) and `_getRepoPath()` (line ~266, reads `CLAUDE_REPO_PATH || COPILOT_REPO_PATH || repo root`) are both already available in `skills.js` — reuse them, do not require new instances.
- **The bug this story must fix, not just the new capability:** the existing code calls `_journeyStore.completeStage(...)` unconditionally the first time any session (`!session._stageDone`) completes an artefact. A session created by res-s1's reopen flow is a *fresh* session object, so `_stageDone` starts unset — a revision turn on an already-completed stage would call `completeStage()` again, which unconditionally `.push()`es a *new* entry onto `journey.completedStages`. This must be guarded (see Task 2).
- **Existing D37-exception precedent to follow exactly:** `_skillTurnGitCommit` (`skills.js` ~line 1435-1453) is an injectable adapter whose default is a *real* implementation, not a throwing stub, with an explicit code comment explaining why. This story's new `_materialityCheckHook` adapter follows the same *shape* of exception (documented deliberate no-op default) for a different reason: res-s3 (which will wire the real implementation) doesn't exist yet.
- Test convention: plain Node.js, no Jest. `tests/check-alrf-s8-journey-slug-priority.js` is the closest existing test exercising this exact function — reuse its fixture pattern: `routes._setHtmlSession(sid, {...})` to inject session state directly, `routes.setSkillTurnExecutorStreamAdapter(fn)` to stub the model call, `COPILOT_REPO_PATH` env var pointed at a throwaway temp dir so the auto-save never touches the real `artefacts/` tree, and a `noopRes()`-style stub (extend it to capture `.write()` calls for asserting SSE error events).

---

## File map

```
Create:
  tests/check-res-s2-overwrite-artefact-in-place-on-revision.js  — all ACs, built up across the 2 tasks below

Modify:
  src/web-ui/routes/skills.js  — path traversal guard, write-failure SSE surfacing, pre-revision content capture (Task 1); duplicate-completion guard, materiality-check hook + setter + export (Task 2)
```

---

## Task 1: Path traversal guard, write-failure surfacing, pre-revision content capture

**Files:**
- Modify: `src/web-ui/routes/skills.js`
- Create: `tests/check-res-s2-overwrite-artefact-in-place-on-revision.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';

// check-res-s2-overwrite-artefact-in-place-on-revision.js
// Verifies res-s2: a revision turn on a reopened stage's session overwrites
// the artefact file in place (no new file, no dated copy), surfaces write
// failures to the operator instead of silently swallowing them, captures
// the pre-revision content before the write for res-s3's later use, and
// does not push a duplicate completedStages entry when revising an
// already-completed stage.
//
// Run: node tests/check-res-s2-overwrite-artefact-in-place-on-revision.js

var fs   = require('fs');
var os   = require('os');
var path = require('path');
var ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

function freshRoutes() {
  var resolved = require.resolve(ROUTES_PATH);
  delete require.cache[resolved];
  return require(resolved);
}

function fakeRes() {
  var r = { _chunks: [], _ended: false };
  r.writeHead = function() {};
  r.write = function(s) { r._chunks.push(s); };
  r.end = function() { r._ended = true; };
  r.lastEvent = function() {
    var last = r._chunks[r._chunks.length - 1] || '';
    var m = last.match(/^data: (.*)\n\n$/);
    return m ? JSON.parse(m[1]) : null;
  };
  return r;
}

var ARTEFACT_RESPONSE =
  'Understood.\n\n---ARTEFACT-START---\n# Discovery\n\nRevised content.\n---ARTEFACT-END---\n---SLUG---\nres-s2-fixture-feature';

var _tmpRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'res-s2-'));

(async function main() {

console.log('\nTask 1 — path traversal guard, write-failure surfacing, pre-revision capture');

await (async function() {
  // AC4: a disk write failure surfaces an SSE error, not just a console log.
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes();
  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(ARTEFACT_RESPONSE);
    return Promise.resolve({ text: ARTEFACT_RESPONSE, usage: {} });
  });
  var sid = 'test-res-s2-t1-writefail-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 'res-s2-writefail-feature'
  });
  // Force the write to fail: make the target directory path collide with an
  // existing FILE (not a directory), so fs.mkdirSync/writeFileSync both throw.
  var _collidePath = path.join(_tmpRepoRoot, 'artefacts', 'res-s2-writefail-feature');
  fs.mkdirSync(path.dirname(_collidePath), { recursive: true });
  fs.writeFileSync(_collidePath, 'this is a file, not a directory', 'utf8');

  var res = fakeRes();
  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'hi' } },
    res
  );

  var lastEvent = res.lastEvent();
  ok('AC4: write failure surfaces an SSE error event', lastEvent && typeof lastEvent.error === 'string');
  ok('AC4: stream ends after the error', res._ended === true);
})();

await (async function() {
  // AC5 (partial — capture only): pre-revision content is read into memory
  // before the write executes.
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes();
  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(ARTEFACT_RESPONSE);
    return Promise.resolve({ text: ARTEFACT_RESPONSE, usage: {} });
  });
  var slug = 'res-s2-capture-feature';
  var artefactRelPath = 'artefacts/' + slug + '/discovery.md';
  var artefactAbsPath = path.join(_tmpRepoRoot, artefactRelPath);
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, '# Discovery\n\nOriginal content.', 'utf8');

  var sid = 'test-res-s2-t1-capture-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: slug
  });

  var res = fakeRes();
  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'revise it' } },
    res
  );

  var onDiskAfter = fs.readFileSync(artefactAbsPath, 'utf8');
  ok('AC1: the file is overwritten in place with the new content', onDiskAfter.indexOf('Revised content.') !== -1);
  ok('AC1: no second/dated file was created', fs.readdirSync(path.dirname(artefactAbsPath)).length === 1);
})();

await (async function() {
  // AC3: a turn with no artefact markers (a plain question) does not touch
  // the artefact file at all.
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes();
  var PLAIN_RESPONSE = 'Sure — here is the answer to your question, no artefact this turn.';
  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(PLAIN_RESPONSE);
    return Promise.resolve({ text: PLAIN_RESPONSE, usage: {} });
  });
  var slug = 'res-s2-noop-feature';
  var artefactRelPath = 'artefacts/' + slug + '/discovery.md';
  var artefactAbsPath = path.join(_tmpRepoRoot, artefactRelPath);
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, '# Discovery\n\nUnchanged.', 'utf8');
  var beforeStat = fs.statSync(artefactAbsPath);
  var beforeContent = fs.readFileSync(artefactAbsPath, 'utf8');

  var sid = 'test-res-s2-t1-noop-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: '# Discovery\n\nUnchanged.', artefactPath: artefactRelPath, done: true, featureSlug: slug
  });

  var res = fakeRes();
  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'just a question' } },
    res
  );

  var afterContent = fs.readFileSync(artefactAbsPath, 'utf8');
  var afterStat = fs.statSync(artefactAbsPath);
  ok('AC3: artefact content byte-identical after a no-revision turn', afterContent === beforeContent);
  ok('AC3: file mtime unchanged (no write attempted)', afterStat.mtimeMs === beforeStat.mtimeMs);
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
fs.rmSync(_tmpRepoRoot, { recursive: true, force: true });
delete process.env.COPILOT_REPO_PATH;
process.exit(failed > 0 ? 1 : 0);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-res-s2-overwrite-artefact-in-place-on-revision.js
```

Expected output: `FAIL: AC4: write failure surfaces an SSE error event` (the current code only logs the failure, never writes an SSE error event) — AC1/AC3 assertions should already pass since that behaviour is pre-existing and unmodified at this point.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/skills.js`, find the artefact-completion block by searching for `if (done && _artefactText) {` inside `handlePostTurnStreamHtml`. Replace the section from `session.artefactPath = 'artefacts/' + slug + ...` through the end of the existing `try { fs.mkdirSync(...); fs.writeFileSync(...); console.info(...); } catch (_autoErr) { console.warn(...); }` block with:

```javascript
    session.artefactPath = 'artefacts/' + slug + '/' + (session.skillName || skillName) + '.md';
    session.done = true;

    // Auto-save artefact to disk
    var _autoRepoRoot = _getRepoPath();
    var _resolvedRepoRoot = path.resolve(_autoRepoRoot);
    var _autoAbsPath = path.resolve(path.join(_autoRepoRoot, session.artefactPath));

    // res-s2: path traversal guard (CLAUDE.md mandatory rule) — session.artefactPath
    // is derived from session-stored featureSlug/skillName, which counts as a
    // "session-stored slug" under that rule. This is a streaming SSE response,
    // not a request/response endpoint, so the SSE-appropriate equivalent of an
    // HTTP 400 rejection is an error event + ending the stream (headers/status
    // are already committed by this point in an SSE response).
    if (!_autoAbsPath.startsWith(_resolvedRepoRoot + path.sep)) {
      console.warn(JSON.stringify({ event: 'artefact_path_traversal_rejected', sessionId: sessionId, artefactPath: session.artefactPath }));
      res.write('data: ' + JSON.stringify({ error: 'Could not save your revision — invalid artefact path.' }) + '\n\n');
      res.end();
      return;
    }

    var _isAmendment = fs.existsSync(_autoAbsPath);
    // res-s2 (AC5): capture the pre-revision content into memory BEFORE the
    // write executes — this is the only point at which "before" content is
    // still readable from disk. Handed forward to the materiality-check hook
    // in Task 2 (this task only captures it; Task 2 consumes it).
    var _preRevisionContent = null;
    if (_isAmendment) {
      try { _preRevisionContent = fs.readFileSync(_autoAbsPath, 'utf8'); } catch (_) {}
    }
    try {
      fs.mkdirSync(path.dirname(_autoAbsPath), { recursive: true });
      fs.writeFileSync(_autoAbsPath, session.artefactContent, 'utf8');
      console.info(JSON.stringify({ event: _isAmendment ? 'artefact_auto_amended' : 'artefact_auto_saved', sessionId: sessionId, artefactPath: session.artefactPath }));
    } catch (_autoErr) {
      // res-s2 (AC4): surface the failure to the operator instead of only
      // logging it — the pre-fix behaviour silently swallowed this.
      console.warn(JSON.stringify({ event: 'artefact_disk_save_failed', sessionId: sessionId, error: _autoErr.message }));
      res.write('data: ' + JSON.stringify({ error: 'Could not save your revision — please try again.' }) + '\n\n');
      res.end();
      return;
    }
```

Everything below this (the git commit call, the strategy-metrics hook, and the `if (session.journeyId && !session._stageDone)` block) stays exactly as-is for this task — Task 2 modifies the `_stageDone` block.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-res-s2-overwrite-artefact-in-place-on-revision.js
```

Expected output: `6 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (562/562 — 1 pre-existing flake in `check-p3.5-validate-trace.js` is possible and acceptable, matching the RISK-ACCEPT already logged in `decisions.md`). Pay particular attention to `tests/check-alrf-s8-journey-slug-priority.js` (exercises the exact same code block) — it must still pass unmodified.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/skills.js tests/check-res-s2-overwrite-artefact-in-place-on-revision.js
git commit -m "feat(res-s2): path traversal guard, write-failure surfacing, pre-revision capture"
```

---

## Task 2: Duplicate-completion guard and the materiality-check hook

**Files:**
- Modify: `src/web-ui/routes/skills.js`
- Modify: `tests/check-res-s2-overwrite-artefact-in-place-on-revision.js`

- [ ] **Step 1: Write the failing test**

Append to the test file, replacing the closing `console.log('\n' + passed ...)` / cleanup / `process.exit(...)` block with this new Task 2 block followed by the same closing block moved to the very end:

```javascript
console.log('\nTask 2 — duplicate-completion guard and materiality-check hook');

await (async function() {
  // AC1/AC3: revising an already-completed stage must NOT push a second
  // completedStages entry.
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();

  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(ARTEFACT_RESPONSE);
    return Promise.resolve({ text: ARTEFACT_RESPONSE, usage: {} });
  });

  var slug = 'res-s2-duplicate-guard-feature';
  var artefactRelPath = 'artefacts/' + slug + '/discovery.md';
  var artefactAbsPath = path.join(_tmpRepoRoot, artefactRelPath);
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, '# Discovery\n\nOriginal.', 'utf8');

  var created = journeyStore.createJourney(slug, 'default');
  var jid = created.journeyId;
  journeyStore.completeStage(jid, 'discovery', artefactRelPath, null, 'old-live-sid');

  var sid = 'test-res-s2-t2-dupguard-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: slug, journeyId: jid
  });

  var res = fakeRes();
  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'revise it' } },
    res
  );

  var journeyAfter = journeyStore.getJourney(jid);
  var discoveryEntries = journeyAfter.completedStages.filter(function(cs) { return cs.skillName === 'discovery'; });
  ok('AC1/AC3: exactly one completedStages entry for discovery after a revision (no duplicate pushed)', discoveryEntries.length === 1);
  ok('AC1: the artefact file was still overwritten with the revision', fs.readFileSync(artefactAbsPath, 'utf8').indexOf('Revised content.') !== -1);
})();

await (async function() {
  // AC5: the materiality-check hook fires on a revision with the correct
  // pre/post content pair, and does NOT fire on a stage's first-ever
  // completion (nothing to compare against).
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();

  var hookCalls = [];
  routes.setMaterialityCheckHook(function(payload) { hookCalls.push(payload); });

  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(ARTEFACT_RESPONSE);
    return Promise.resolve({ text: ARTEFACT_RESPONSE, usage: {} });
  });

  // First-ever completion — hook must NOT fire.
  var slugFirst = 'res-s2-hook-first-feature';
  var sidFirst = 'test-res-s2-t2-hook-first-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sidFirst, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: slugFirst,
    journeyId: journeyStore.createJourney(slugFirst, 'default').journeyId
  });
  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sidFirst }, body: { answer: 'go' } },
    fakeRes()
  );
  ok('AC5: hook does not fire on a stage\'s first-ever completion', hookCalls.length === 0);

  // Revision — hook must fire with the correct pre/post pair.
  var slugRevise = 'res-s2-hook-revise-feature';
  var artefactRelPath = 'artefacts/' + slugRevise + '/discovery.md';
  var artefactAbsPath = path.join(_tmpRepoRoot, artefactRelPath);
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, '# Discovery\n\nPre-revision text.', 'utf8');
  var jidRevise = journeyStore.createJourney(slugRevise, 'default').journeyId;
  journeyStore.completeStage(jidRevise, 'discovery', artefactRelPath, null, 'old-live-sid-2');

  var sidRevise = 'test-res-s2-t2-hook-revise-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sidRevise, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: slugRevise, journeyId: jidRevise
  });
  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sidRevise }, body: { answer: 'revise it' } },
    fakeRes()
  );

  ok('AC5: hook fires exactly once on a revision', hookCalls.length === 1);
  ok('AC5: hook receives the correct pre-revision content', hookCalls[0] && hookCalls[0].preRevisionContent === '# Discovery\n\nPre-revision text.');
  ok('AC5: hook receives the correct post-revision content', hookCalls[0] && hookCalls[0].postRevisionContent.indexOf('Revised content.') !== -1);
  ok('AC5: hook receives journeyId and skillName', hookCalls[0] && hookCalls[0].journeyId === jidRevise && hookCalls[0].skillName === 'discovery');
})();

await (async function() {
  // AC2: a downstream read of the artefact path after a revision returns
  // the new content, not the pre-revision content — simulating what a
  // /trace-style disk re-read or a later stage's session would see.
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();

  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(ARTEFACT_RESPONSE);
    return Promise.resolve({ text: ARTEFACT_RESPONSE, usage: {} });
  });

  var slug = 'res-s2-downstream-read-feature';
  var artefactRelPath = 'artefacts/' + slug + '/discovery.md';
  var artefactAbsPath = path.join(_tmpRepoRoot, artefactRelPath);
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, '# Discovery\n\nOld content nobody should see again.', 'utf8');
  var jid = journeyStore.createJourney(slug, 'default').journeyId;
  journeyStore.completeStage(jid, 'discovery', artefactRelPath, null, 'old-live-sid-3');

  var sid = 'test-res-s2-t2-downstream-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: slug, journeyId: jid
  });
  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'revise it' } },
    fakeRes()
  );

  // Simulate an immediate downstream read (no delay) — proves the write
  // completed synchronously before this point, not fire-and-forget.
  var downstreamRead = fs.readFileSync(artefactAbsPath, 'utf8');
  ok('AC2: downstream read immediately after the turn returns the new content', downstreamRead.indexOf('Revised content.') !== -1);
  ok('AC2: downstream read does not return the pre-revision content', downstreamRead.indexOf('Old content nobody should see again.') === -1);
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
fs.rmSync(_tmpRepoRoot, { recursive: true, force: true });
delete process.env.COPILOT_REPO_PATH;
process.exit(failed > 0 ? 1 : 0);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-res-s2-overwrite-artefact-in-place-on-revision.js
```

Expected output: `TypeError: routes.setMaterialityCheckHook is not a function`, plus `FAIL: AC1/AC3: exactly one completedStages entry for discovery after a revision` (the current code pushes a duplicate).

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/skills.js`, find the D37-exception adapter block for `_skillTurnGitCommit` (search for `let _skillTurnGitCommit = function defaultSkillTurnGitCommit`). Immediately after its `setSkillTurnGitCommitAdapter` function (and its closing `}`), add:

```javascript
// res-s2: D37 exception (documented) — injectable hook for res-s3's
// materiality check. Default is a no-op, not a throwing stub, because
// res-s3 hasn't been built yet and this hook's whole purpose is to be
// safely inert until something wires into it — matches the
// _skillTurnGitCommit precedent immediately above for the same reasoning.
let _materialityCheckHook = function defaultMaterialityCheckHook() {};

/**
 * Replace the materiality-check hook (for res-s3 to wire a real
 * implementation, or for tests to assert it was called).
 * @param {function({journeyId:string, skillName:string, preRevisionContent:?string, postRevisionContent:string}): void} fn
 */
function setMaterialityCheckHook(fn) { _materialityCheckHook = fn; }
```

Then find the `if (session.journeyId && !session._stageDone) {` block (added context by Task 1's changes just above it, but this block itself is unmodified by Task 1). Replace it with:

```javascript
    // Mark stage complete in journey so resume can load it as a prior artefact
    if (session.journeyId && !session._stageDone) {
      session._stageDone = true;
      // res-s2 (AC1/AC3): a reopened session revising an already-completed
      // stage must NOT push a second completedStages entry — completeStage()
      // unconditionally pushes, which would violate "no entry added" for a
      // revision. Only the stage's first-ever completion calls completeStage();
      // an existing entry means this is a revision, handled via the
      // materiality-check hook instead (AC5).
      var _revisionJourney = _journeyStore.getJourney(session.journeyId);
      var _existingStageEntry = _revisionJourney && (_revisionJourney.completedStages || []).find(function(cs) { return cs.skillName === session.skillName; });

      if (!_existingStageEntry) {
        try { _journeyStore.completeStage(session.journeyId, session.skillName, session.artefactPath, null, sessionId); } catch (_) {}
      } else {
        try {
          _materialityCheckHook({
            journeyId: session.journeyId,
            skillName: session.skillName,
            preRevisionContent: _preRevisionContent,
            postRevisionContent: session.artefactContent
          });
        } catch (_matErr) {
          console.warn(JSON.stringify({ event: 'materiality_check_hook_failed', sessionId: sessionId, error: _matErr.message }));
        }
      }

      // Persist artefact content to Postgres so cross-device / post-deploy resume works.
      // (completeStage only writes the artefact path; content must be saved separately.)
      // res-s2: runs on both first-completion and revision paths — Postgres
      // is a persistence layer for artefact content, not a completion-event
      // record, so a revision's new content must overwrite it there too.
      if (process.env.DATABASE_URL && session.artefactContent) {
        require('../adapters/journey-store-pg').saveArtefact(
          session.journeyId, session.skillName, session.artefactPath, session.artefactContent
        ).catch(function(e) {
          console.warn(JSON.stringify({ event: 'artefact_pg_save_failed', sessionId: sessionId, error: e.message }));
        });
      }
      // dsh-s1: durably persist this stage's conversation turns — separate
      // from the artefact-content save above, so the conversation survives a
      // restart even though it's stored in a different table (session_turns,
      // not artefacts). Non-fatal: a failure here must never block the rest
      // of the completion flow (artefact save, Redis delete, response).
      if (process.env.DATABASE_URL) {
        var _turnsJourney = _journeyStore.getJourney(session.journeyId);
        // AC1 fix: session.turns doesn't yet include the completing assistant
        // turn at this point in the flow (it's pushed below, after this
        // block) — append it explicitly so the persisted row is complete.
        var _finalTurns = (session.turns || []).concat([{ role: 'assistant', content: fullText }]);
        require('../adapters/session-turns-pg').writeSessionTurns({
          journeyId: session.journeyId,
          tenantId: _turnsJourney ? _turnsJourney.tenantId : null,
          skillName: session.skillName,
          turns: _finalTurns
        }).catch(function(e) {
          console.warn(JSON.stringify({ event: 'session_turns_pg_save_failed', sessionId: sessionId, error: e.message }));
        });
      }
    }
```

Finally, add `setMaterialityCheckHook` to `module.exports` — search for `setSkillTurnGitCommitAdapter,` in the exports object and add `setMaterialityCheckHook,` on the line immediately after it.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-res-s2-overwrite-artefact-in-place-on-revision.js
```

Expected output: `17 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (562/562, or the one documented pre-existing flake only). `tests/check-alrf-s8-journey-slug-priority.js` and any other test that exercises a session's *first-ever* artefact completion must still pass unmodified — the duplicate-completion guard must not change behaviour for that case.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/skills.js tests/check-res-s2-overwrite-artefact-in-place-on-revision.js
git commit -m "feat(res-s2): duplicate-completion guard and materiality-check hook"
```

---

## AC coverage confirmation

| AC | Covered by |
|----|-----------|
| AC1 | Task 1's overwrite-in-place test + Task 2's duplicate-guard test (revision path still writes correctly) |
| AC2 | Task 2's downstream-read test |
| AC3 | Task 1's no-revision-turn test + Task 2's duplicate-guard test (no second `completedStages` entry) |
| AC4 | Task 1's write-failure test |
| AC5 | Task 1's pre-revision-capture assertion (indirect, via Task 2's hook test asserting the correct pre-content reaches the hook) + Task 2's hook-firing tests (fires on revision, not on first completion, correct payload) |

All 5 ACs covered, plus the path traversal guard (Architecture Constraints / NFR, not a numbered AC) and the newly-identified duplicate-completion guard (necessary for AC1/AC3, added to the DoR contract before this plan was written). No gaps.
