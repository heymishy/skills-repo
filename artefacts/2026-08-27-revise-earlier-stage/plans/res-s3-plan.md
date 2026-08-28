# Suggest whether a stage revision is material to downstream stages — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass (plus the AC5 wiring test added at implementation-plan time). Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/res-s3-suggest-revision-materiality`
**Worktree:** `.worktrees/res-s3-suggest-revision-materiality`
**Test command:** `node tests/check-res-s3-suggest-revision-materiality.js` (single file); `npm test` (full suite)

---

## Corrections made before this plan was written

See `decisions.md`'s 2026-08-28 ARCH entry (res-s3) and `dor/res-s3-dor-contract.md`'s inline corrections for full detail. Summary:
1. DoR contract's touch points named `journey.js` — wrong. Real integration point is `skills.js`'s `_materialityCheckHook` D37 adapter (introduced by res-s2).
2. That hook's existing call site is fire-and-forget (never awaited, return value discarded) — must be fixed for AC1 to be achievable at all.
3. Rationale generation is deterministic (template, derived from `changedSections`), not a live model call — `_skillTurnExecutor`/`_skillTurnExecutorStream` have no exported getter from `skills.js` (setters only), so reaching either from a new sibling module would require new coupling for no real benefit given the rationale's content is already fully derivable from the diff.
4. Story was missing an explicit AC for the mandatory D37 wiring of `setMaterialityCheckHook` — added as AC5.

---

## File map

```
Create:
  src/web-ui/modules/materiality-check.js              — deterministic section-diff classifier, rationale template, PostHog audit logging (AC1-AC4)
  tests/check-res-s3-suggest-revision-materiality.js    — all 10 tests

Modify:
  src/web-ui/routes/skills.js   — await the _materialityCheckHook call site (~line 5089-5102), forward its result as an SSE event before the final `done` write
  src/web-ui/server.js          — D37 wiring task: setMaterialityCheckHook -> materiality-check.js's real implementation (AC5)
```

---

## Task 1: Deterministic section-diff classifier

**Files:**
- Create: `src/web-ui/modules/materiality-check.js` (this task only — `checkMateriality` and `generateRationale`)
- Test: `tests/check-res-s3-suggest-revision-materiality.js` (this task's section)

**Model class:** balanced (pure deterministic logic, no integration surface)

- [x] **Step 1: Write the failing test**

Create `tests/check-res-s3-suggest-revision-materiality.js` with this header and Task 1's tests:

```javascript
'use strict';

// check-res-s3-suggest-revision-materiality.js
// Verifies res-s3: after res-s2's overwrite, a deterministic section-diff
// classifies the revision as material (Problem Statement/MVP Scope/Constraints
// changed) or minor (everything else), generates a one-sentence rationale,
// presents both in the same chat turn's SSE response, and logs the suggestion
// with a joinable key for res-s4.
//
// Run: node tests/check-res-s3-suggest-revision-materiality.js

var fs   = require('fs');
var os   = require('os');
var path = require('path');
var MATERIALITY_PATH = path.resolve(__dirname, '../src/web-ui/modules/materiality-check.js');
var ROUTES_PATH       = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

function freshMaterialityCheck() {
  var resolved = require.resolve(MATERIALITY_PATH);
  delete require.cache[resolved];
  return require(resolved);
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
  r.events = function() {
    return r._chunks.map(function(c) {
      var m = c.match(/^data: (.*)\n\n$/);
      return m ? JSON.parse(m[1]) : null;
    }).filter(Boolean);
  };
  r.lastEvent = function() {
    var evts = r.events();
    return evts[evts.length - 1] || null;
  };
  return r;
}

var _tmpRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'res-s3-'));

var PRE_FIXTURE =
  '# Discovery\n\n' +
  '## Problem Statement\n\nOperators cannot revise an earlier completed stage.\n\n' +
  '## Who It Affects\n\nSolo operators running the outer loop.\n\n' +
  '## MVP Scope\n\nReopen and overwrite the artefact in place.\n\n' +
  '## Constraints\n\nNo new versioning mechanism.\n';

(async function main() {

console.log('\nTask 1 — deterministic section-diff classifier');

await (async function() {
  var mc = freshMaterialityCheck();

  // AC2: Problem Statement changed -> material
  var postProblemChanged = PRE_FIXTURE.replace(
    'Operators cannot revise an earlier completed stage.',
    'Operators cannot revise an earlier completed stage, and this now also blocks external reviewers.'
  );
  var r1 = mc.checkMateriality(PRE_FIXTURE, postProblemChanged);
  ok('AC2: Problem Statement change classified as material', r1.classification === 'material');
  ok('AC2: changedSections names Problem Statement', r1.changedSections.indexOf('Problem Statement') !== -1);

  // AC2: Constraints changed -> material
  var postConstraintChanged = PRE_FIXTURE.replace(
    'No new versioning mechanism.',
    'No new versioning mechanism; must also support a dated-copy fallback.'
  );
  var r2 = mc.checkMateriality(PRE_FIXTURE, postConstraintChanged);
  ok('AC2: Constraints change classified as material', r2.classification === 'material');
  ok('AC2: changedSections names Constraints', r2.changedSections.indexOf('Constraints') !== -1);
})();

await (async function() {
  var mc = freshMaterialityCheck();

  // AC3: wording-only change in a non-target section -> minor
  var postWordingChanged = PRE_FIXTURE.replace(
    'Solo operators running the outer loop.',
    'Solo operators who are running the outer loop end to end.'
  );
  var r1 = mc.checkMateriality(PRE_FIXTURE, postWordingChanged);
  ok('AC3: wording-only change (non-target section) classified as minor', r1.classification === 'minor');
  ok('AC3: changedSections is empty for a wording-only change', r1.changedSections.length === 0);

  // AC3 edge case: single-character typo fix (non-target section) -> minor
  var postTypoFixed = PRE_FIXTURE.replace('outer loop.', 'outer loop!');
  var r2 = mc.checkMateriality(PRE_FIXTURE, postTypoFixed);
  ok('AC3 edge case: single-character typo fix classified as minor', r2.classification === 'minor');
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);

})();
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-res-s3-suggest-revision-materiality.js
```

Expected output: `Error: Cannot find module '.../src/web-ui/modules/materiality-check.js'`

- [x] **Step 3: Write minimal implementation**

Create `src/web-ui/modules/materiality-check.js`:

```javascript
'use strict';

// materiality-check.js — res-s3: deterministic section-diff classifier +
// rationale generation + PostHog audit logging for res-s2's
// _materialityCheckHook (skills.js) integration point.

var crypto = require('crypto');
var _journeyStore = require('./journey-store');
var _posthog = require('./posthog-server');

// Target sections match discovery.md's real heading names (Problem Statement,
// MVP Scope, Constraints) — see decisions.md's 2026-08-28 ARCH entry (res-s3)
// for why this corrects the DoR contract's slightly imprecise
// "MVP Scope boundary"/"named Constraint" phrasing.
var TARGET_SECTIONS = ['Problem Statement', 'MVP Scope', 'Constraints'];

function _parseSections(markdown) {
  var sections = {};
  var lines = (markdown || '').split('\n');
  var currentHeading = null;
  var currentLines = [];
  function flush() {
    if (currentHeading !== null) {
      sections[currentHeading] = currentLines.join('\n').trim();
    }
  }
  for (var i = 0; i < lines.length; i++) {
    var m = lines[i].match(/^##\s+(.+?)\s*$/);
    if (m) {
      flush();
      currentHeading = m[1].trim();
      currentLines = [];
    } else if (currentHeading !== null) {
      currentLines.push(lines[i]);
    }
  }
  flush();
  return sections;
}

/**
 * Deterministic materiality classifier (AC2/AC3). Compares only
 * TARGET_SECTIONS' text between pre- and post-revision content — a change
 * anywhere else (wording, phrasing, typos) never flips the classification.
 * @param {string} preContent
 * @param {string} postContent
 * @returns {{classification: 'material'|'minor', changedSections: string[]}}
 */
function checkMateriality(preContent, postContent) {
  var preSections = _parseSections(preContent);
  var postSections = _parseSections(postContent);
  var changedSections = TARGET_SECTIONS.filter(function(name) {
    return (preSections[name] || '') !== (postSections[name] || '');
  });
  return {
    classification: changedSections.length > 0 ? 'material' : 'minor',
    changedSections: changedSections
  };
}

/**
 * One-sentence rationale, deterministically derived from the diff's own
 * output — no model call (see decisions.md 2026-08-28 ARCH entry, res-s3).
 * @param {'material'|'minor'} classification
 * @param {string[]} changedSections
 * @returns {string}
 */
function generateRationale(classification, changedSections) {
  if (classification === 'material') {
    var joined = changedSections.length > 1
      ? changedSections.slice(0, -1).join(', ') + ' and ' + changedSections[changedSections.length - 1]
      : changedSections[0];
    return 'This looks like a material change — the ' + joined + ' section' + (changedSections.length > 1 ? 's' : '') + ' changed.';
  }
  return 'This looks like a minor change — no scope or constraint impact detected.';
}

module.exports = { checkMateriality, generateRationale, TARGET_SECTIONS };
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-res-s3-suggest-revision-materiality.js
```

Expected output: `7 passed, 0 failed`

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (baseline was 563 files, 1 pre-existing flake — `tests/check-p3.5-validate-trace.js`, RISK-ACCEPTed at branch-setup)

- [x] **Step 6: Commit**

```bash
git add src/web-ui/modules/materiality-check.js tests/check-res-s3-suggest-revision-materiality.js
git commit -m "feat(res-s3): deterministic section-diff materiality classifier"
```

---

## Task 2: Orchestration — runMaterialityCheck (suggestion ID, PostHog audit log)

**Files:**
- Modify: `src/web-ui/modules/materiality-check.js` (add `runMaterialityCheck`)
- Test: `tests/check-res-s3-suggest-revision-materiality.js` (append this task's section)

**Model class:** balanced

- [x] **Step 1: Write the failing test**

Append to `tests/check-res-s3-suggest-revision-materiality.js`, before the final `console.log('\n' + passed ...)` line:

```javascript
console.log('\nTask 2 — orchestration: runMaterialityCheck (suggestion ID, PostHog audit log)');

await (async function() {
  var mc = freshMaterialityCheck();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();
  var jid = journeyStore.createJourney('res-s3-t2-feature', 'default').journeyId;

  // AC1: the function receives and uses BOTH pre and post content — not
  // just post, and not attempting to re-derive pre from disk.
  var result = await mc.runMaterialityCheck({
    journeyId: jid,
    skillName: 'discovery',
    preRevisionContent: PRE_FIXTURE,
    postRevisionContent: PRE_FIXTURE.replace('No new versioning mechanism.', 'A new dated-copy mechanism is required.')
  });
  ok('AC1: classification reflects the real pre/post diff (material)', result.classification === 'material');
  ok('AC1: rationale is a non-empty one-sentence string', typeof result.rationale === 'string' && result.rationale.length > 0 && result.rationale.indexOf('\n') === -1);
  ok('AC4: a suggestionId is returned for later joining (res-s4)', typeof result.suggestionId === 'string' && result.suggestionId.length > 0);
})();

await (async function() {
  // AC4: the suggestion is recorded via PostHog capture with a joinable key.
  var mc = freshMaterialityCheck();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();
  var jid = journeyStore.createJourney('res-s3-t2-audit-feature', 'default').journeyId;

  var posthogServer = require('../src/web-ui/modules/posthog-server');
  var _originalCapture = posthogServer.capture;
  var captured = [];
  posthogServer.capture = function(distinctId, event, properties, groups) {
    captured.push({ distinctId: distinctId, event: event, properties: properties, groups: groups });
  };

  var result;
  try {
    result = await mc.runMaterialityCheck({
      journeyId: jid,
      skillName: 'discovery',
      preRevisionContent: PRE_FIXTURE,
      postRevisionContent: PRE_FIXTURE.replace('outer loop.', 'outer loop, end to end.')
    });
  } finally {
    posthogServer.capture = _originalCapture;
  }

  ok('AC4: exactly one PostHog capture call recorded', captured.length === 1);
  ok('AC4: capture event is materiality_suggestion_generated', captured[0] && captured[0].event === 'materiality_suggestion_generated');
  ok('AC4: capture properties include the same suggestionId returned to the caller', captured[0] && captured[0].properties.suggestionId === result.suggestionId);
  ok('AC4: capture properties include journeyId and skillName for joining', captured[0] && captured[0].properties.journeyId === jid && captured[0].properties.skillName === 'discovery');
  ok('AC4: capture properties include the classification', captured[0] && captured[0].properties.classification === 'minor');
})();

await (async function() {
  // NFR: materiality check adds zero additional model/executor calls
  // (comfortably within "at most one additional model turn").
  var routes = freshRoutes();
  var mc = freshMaterialityCheck();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();
  var jid = journeyStore.createJourney('res-s3-t2-nfr-feature', 'default').journeyId;

  var streamCalls = 0;
  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    streamCalls++;
    onFirstChunk(0);
    onChunk('ok');
    return Promise.resolve({ text: 'ok', usage: {} });
  });

  await mc.runMaterialityCheck({
    journeyId: jid,
    skillName: 'discovery',
    preRevisionContent: PRE_FIXTURE,
    postRevisionContent: PRE_FIXTURE.replace('outer loop.', 'outer loop, end to end.')
  });

  ok('NFR: materiality check invokes zero additional skill-turn-executor calls', streamCalls === 0);
})();
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-res-s3-suggest-revision-materiality.js
```

Expected output: `TypeError: mc.runMaterialityCheck is not a function`

- [x] **Step 3: Write minimal implementation**

In `src/web-ui/modules/materiality-check.js`, add before the `module.exports` line:

```javascript
/**
 * Full orchestration for res-s2's _materialityCheckHook integration point
 * (AC1/AC4). Classifies, generates a rationale, mints a joinable
 * suggestionId, and logs the suggestion via PostHog.
 * @param {{journeyId: string, skillName: string, preRevisionContent: string, postRevisionContent: string}} payload
 * @returns {Promise<{classification: 'material'|'minor', rationale: string, suggestionId: string}>}
 */
async function runMaterialityCheck(payload) {
  var preContent = payload.preRevisionContent || '';
  var postContent = payload.postRevisionContent || '';
  var result = checkMateriality(preContent, postContent);
  var rationale = generateRationale(result.classification, result.changedSections);
  var suggestionId = crypto.randomUUID();

  var journey = payload.journeyId ? _journeyStore.getJourney(payload.journeyId) : null;
  _posthog.capture(
    (journey && journey.ownerId) || payload.journeyId || 'anonymous',
    'materiality_suggestion_generated',
    {
      journeyId: payload.journeyId || null,
      skillName: payload.skillName || null,
      suggestionId: suggestionId,
      classification: result.classification,
      changedSections: result.changedSections
    },
    { company: journey ? journey.tenantId : null }
  );

  return { classification: result.classification, rationale: rationale, suggestionId: suggestionId };
}
```

And change the `module.exports` line to:

```javascript
module.exports = { checkMateriality, generateRationale, runMaterialityCheck, TARGET_SECTIONS };
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-res-s3-suggest-revision-materiality.js
```

Expected output: `18 passed, 0 failed` (Task 1 ended at 9, not the originally-planned 7 — a code-quality review after Task 1 added 2 exclusivity assertions; see commit `0c7a5359`. Task 2 itself still adds exactly 9 new assertions.)

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (same 1 pre-existing flake as Task 1)

- [x] **Step 6: Commit**

```bash
git add src/web-ui/modules/materiality-check.js tests/check-res-s3-suggest-revision-materiality.js
git commit -m "feat(res-s3): runMaterialityCheck orchestration with PostHog audit logging"
```

---

## Task 3: Await the hook and forward its result as an SSE event (skills.js)

**Files:**
- Modify: `src/web-ui/routes/skills.js`
- Test: `tests/check-res-s3-suggest-revision-materiality.js` (append this task's section)

**Model class:** deep-reasoning (touches the shared streaming handler used by every skill session — regression risk if the change is not precisely scoped to the existing `else` branch)

- [x] **Step 1: Write the failing test**

Append to `tests/check-res-s3-suggest-revision-materiality.js`:

```javascript
console.log('\nTask 3 — hook awaited and forwarded as an SSE event');

var ARTEFACT_RESPONSE =
  'Understood.\n\n---ARTEFACT-START---\n' + PRE_FIXTURE.replace('No new versioning mechanism.', 'A new dated-copy mechanism is required.') + '\n---ARTEFACT-END---\n---SLUG---\nres-s3-fixture-feature';

// Reuses the header's fakeRes() (already defines .events()) — do NOT define
// a separate fakeResT3() here; that would duplicate identical SSE-mock logic
// for no reason. (Corrected 2026-08-28 at code review of Task 1 — the plan
// originally had this task define its own copy instead of reusing the
// header's helper, which is exactly what made the header's fakeRes()
// spuriously look like dead code from Task 1's own isolated point of view.)

await (async function() {
  // AC1 (integration): materiality suggestion fires immediately after the
  // overwrite completes, in the SAME turn's SSE response.
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();

  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(ARTEFACT_RESPONSE);
    return Promise.resolve({ text: ARTEFACT_RESPONSE, usage: {} });
  });

  routes.setMaterialityCheckHook(function(payload) {
    return Promise.resolve({ classification: 'material', rationale: 'Test rationale.', suggestionId: 'suggestion-t3-1' });
  });

  var slug = 'res-s3-t3-feature';
  var artefactRelPath = 'artefacts/' + slug + '/discovery.md';
  var artefactAbsPath = path.join(_tmpRepoRoot, artefactRelPath);
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, PRE_FIXTURE, 'utf8');

  var jid = journeyStore.createJourney(slug, 'default').journeyId;
  journeyStore.completeStage(jid, 'discovery', artefactRelPath, null, 'old-live-sid');

  var sid = 'test-res-s3-t3-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: slug, journeyId: jid
  });

  var res = fakeRes();
  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'revise it' } },
    res
  );

  var events = res.events();
  var materialityEvent = events.find(function(e) { return e && e.materialitySuggestion; });
  ok('AC1: a materialitySuggestion SSE event was emitted', !!materialityEvent);
  ok('AC1: the suggestion carries the real classification', materialityEvent && materialityEvent.materialitySuggestion.classification === 'material');
  ok('AC1: the suggestion carries a rationale', materialityEvent && typeof materialityEvent.materialitySuggestion.rationale === 'string' && materialityEvent.materialitySuggestion.rationale.length > 0);

  var doneEventIndex = events.findIndex(function(e) { return e && e.done === true; });
  var materialityEventIndex = events.indexOf(materialityEvent);
  ok('AC1: the materiality suggestion arrives in the SAME turn, before the final done event', materialityEventIndex !== -1 && doneEventIndex !== -1 && materialityEventIndex < doneEventIndex);
})();

await (async function() {
  // AC4 (integration): the suggestionId returned to the client is the SAME
  // key logged via PostHog, so res-s4 can join on it later.
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();

  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(ARTEFACT_RESPONSE);
    return Promise.resolve({ text: ARTEFACT_RESPONSE, usage: {} });
  });

  var hookPayloads = [];
  routes.setMaterialityCheckHook(function(payload) {
    hookPayloads.push(payload);
    return Promise.resolve({ classification: 'material', rationale: 'Test rationale.', suggestionId: 'suggestion-t3-2' });
  });

  var slug = 'res-s3-t3-joinable-feature';
  var artefactRelPath = 'artefacts/' + slug + '/discovery.md';
  var artefactAbsPath = path.join(_tmpRepoRoot, artefactRelPath);
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, PRE_FIXTURE, 'utf8');

  var jid = journeyStore.createJourney(slug, 'default').journeyId;
  journeyStore.completeStage(jid, 'discovery', artefactRelPath, null, 'old-live-sid');

  var sid = 'test-res-s3-t3-joinable-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: slug, journeyId: jid
  });

  var res = fakeRes();
  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'revise it' } },
    res
  );

  var materialityEvent = res.events().find(function(e) { return e && e.materialitySuggestion; });
  ok('AC4: hook received the correct pre/post content pair (producer-side contract, matches res-s2 AC5)', hookPayloads.length === 1 && hookPayloads[0].preRevisionContent === PRE_FIXTURE);
  ok('AC4: the client-visible suggestionId matches what the hook returned (joinable with res-s4)', materialityEvent && materialityEvent.materialitySuggestion.suggestionId === 'suggestion-t3-2');
})();

await (async function() {
  // Regression guard: an UNWIRED hook (default no-op) must not emit any
  // materiality event and must not break the existing turn/response flow.
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes(); // fresh require -> hook resets to the D37 no-op default

  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(ARTEFACT_RESPONSE);
    return Promise.resolve({ text: ARTEFACT_RESPONSE, usage: {} });
  });

  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();
  var slug = 'res-s3-t3-unwired-feature';
  var artefactRelPath = 'artefacts/' + slug + '/discovery.md';
  var artefactAbsPath = path.join(_tmpRepoRoot, artefactRelPath);
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, PRE_FIXTURE, 'utf8');
  var jid = journeyStore.createJourney(slug, 'default').journeyId;
  journeyStore.completeStage(jid, 'discovery', artefactRelPath, null, 'old-live-sid');

  var sid = 'test-res-s3-t3-unwired-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: slug, journeyId: jid
  });

  var res = fakeRes();
  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'revise it' } },
    res
  );

  var materialityEvent = res.events().find(function(e) { return e && e.materialitySuggestion; });
  ok('Regression guard: unwired hook (default no-op) emits no materiality event', !materialityEvent);
  ok('Regression guard: the turn still completes normally (done:true reached)', res.events().some(function(e) { return e && e.done === true; }));
})();
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-res-s3-suggest-revision-materiality.js
```

Expected output: `FAIL: AC1: a materialitySuggestion SSE event was emitted` (the hook's return value is currently discarded, not awaited)

- [x] **Step 3: Write minimal implementation**

In `src/web-ui/routes/skills.js`, locate the existing block (search for `_existingStageEntry`):

```javascript
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
```

Replace with (declare `_materialitySuggestion` just before the `if (!_existingStageEntry)` line, await the hook, and keep everything else — including the sibling Postgres/dsh-s1 blocks below — unconditional exactly as before):

```javascript
      var _materialitySuggestion = null;
      if (!_existingStageEntry) {
        try { _journeyStore.completeStage(session.journeyId, session.skillName, session.artefactPath, null, sessionId); } catch (_) {}
      } else {
        try {
          // res-s3: await the hook and keep its result so it can be forwarded
          // as an SSE event before the final `done` write (AC1) — the D37
          // default no-op hook returns undefined, so _materialitySuggestion
          // stays null and no event is emitted when unwired.
          _materialitySuggestion = await _materialityCheckHook({
            journeyId: session.journeyId,
            skillName: session.skillName,
            preRevisionContent: _preRevisionContent,
            postRevisionContent: session.artefactContent
          });
        } catch (_matErr) {
          console.warn(JSON.stringify({ event: 'materiality_check_hook_failed', sessionId: sessionId, error: _matErr.message }));
        }
      }
```

Then, in the same function, immediately before the final SSE write (`res.write('data: ' + JSON.stringify({ done: done, ...`), add:

```javascript
  // res-s3 (AC1): present the materiality suggestion in the same turn's
  // response, before the final done event.
  if (_materialitySuggestion && _materialitySuggestion.classification) {
    res.write('data: ' + JSON.stringify({ materialitySuggestion: _materialitySuggestion }) + '\n\n');
  }

```

(`_materialitySuggestion` is declared with `var`, which is function-scoped in this codebase's existing style — it remains in scope from the block above down to the final SSE writes at the end of the function, matching how `fullText`/`_turnUsage` and other `var`-declared turn-scoped values are already used across this same function.)

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-res-s3-suggest-revision-materiality.js
```

Expected output: `26 passed, 0 failed` (adjusted +2 for Task 1's post-review count — see Task 2's Step 4 note above)

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing, including res-s1's 19/19 and res-s2's 19/19 (this task touches a block those tests also exercise — must not regress either)

- [x] **Step 6: Commit**

```bash
git add src/web-ui/routes/skills.js tests/check-res-s3-suggest-revision-materiality.js
git commit -m "feat(res-s3): await materiality hook and forward suggestion as an SSE event"
```

---

## Task 4: D37 wiring — setMaterialityCheckHook (AC5)

**Files:**
- Modify: `src/web-ui/server.js`
- Test: `tests/check-res-s3-suggest-revision-materiality.js` (append this task's section)

**Model class:** balanced

- [ ] **Step 1: Write the failing test**

Append to `tests/check-res-s3-suggest-revision-materiality.js`:

```javascript
console.log('\nTask 4 — D37 wiring: setMaterialityCheckHook (AC5)');

await (async function() {
  // AC5 / D37 rule #4: behavioural correctness, not just "a function got
  // wired" — two different pre/post pairs must resolve to two different,
  // individually-correct classifications through the REAL wired chain
  // (server.js's setMaterialityCheckHook call -> materiality-check.js's
  // real runMaterialityCheck -> skills.js's hook call site).
  var fsServer = require('fs');
  var serverSrc = fsServer.readFileSync(path.resolve(__dirname, '../src/web-ui/server.js'), 'utf8');
  ok('AC5: server.js wires setMaterialityCheckHook to the real implementation', /setMaterialityCheckHook\(\s*runMaterialityCheck\s*\)/.test(serverSrc));

  var mc = freshMaterialityCheck();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();
  var jid = journeyStore.createJourney('res-s3-t4-feature', 'default').journeyId;

  var materialResult = await mc.runMaterialityCheck({
    journeyId: jid, skillName: 'discovery',
    preRevisionContent: PRE_FIXTURE,
    postRevisionContent: PRE_FIXTURE.replace('No new versioning mechanism.', 'A new dated-copy mechanism is required.')
  });
  var minorResult = await mc.runMaterialityCheck({
    journeyId: jid, skillName: 'discovery',
    preRevisionContent: PRE_FIXTURE,
    postRevisionContent: PRE_FIXTURE.replace('outer loop.', 'outer loop, end to end.')
  });

  ok('AC5: a scope-changing pair resolves to material through the wired chain', materialResult.classification === 'material');
  ok('AC5: a wording-only pair resolves to minor through the wired chain', minorResult.classification === 'minor');
  ok('AC5: the two pairs produce two DIFFERENT classifications (not a stub that always returns the same value)', materialResult.classification !== minorResult.classification);
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-res-s3-suggest-revision-materiality.js
```

Expected output: `FAIL: AC5: server.js wires setMaterialityCheckHook to the real implementation`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/server.js`, immediately after the existing block:

```javascript
  const { setSkillTurnExecutorAdapter, setSkillTurnExecutorStreamAdapter, setSessionStore: _setSessionStore, _setHtmlSession: _restoreHtmlSession, startSessionEviction } = require('./routes/skills');
  setSkillTurnExecutorAdapter(realSkillTurnExecutor);
  setSkillTurnExecutorStreamAdapter(realSkillTurnExecutorStream);
  // _nextQuestionExecutorAdapter and _sectionDraftExecutorAdapter are no-ops (AC9 — mfc.1);
  // no wiring required.
```

Add:

```javascript

  // res-s3 / D37 mandatory separate wiring task — wire the real
  // materiality-check implementation to res-s2's setMaterialityCheckHook adapter
  const { setMaterialityCheckHook } = require('./routes/skills');
  const { runMaterialityCheck } = require('./modules/materiality-check');
  setMaterialityCheckHook(runMaterialityCheck);
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-res-s3-suggest-revision-materiality.js
```

Expected output: `30 passed, 0 failed` (adjusted +2 for Task 1's post-review count — see Task 2's Step 4 note above)

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (same 1 pre-existing flake)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/server.js tests/check-res-s3-suggest-revision-materiality.js
git commit -m "feat(res-s3): wire setMaterialityCheckHook to the real materiality-check implementation (D37, AC5)"
```

---

## After all tasks: open the draft PR

Once all 4 tasks are committed and the full suite passes, run `/verify-completion` then `/branch-complete` per the standard inner-loop sequence. Per the DoR's Coding Agent Instructions: open a draft PR when tests pass — do not mark ready for review.
