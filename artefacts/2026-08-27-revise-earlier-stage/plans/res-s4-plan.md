# Act on a materiality suggestion without auto-triggering downstream changes — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/res-s4-operator-acts-on-materiality-suggestion`
**Worktree:** `.worktrees/res-s4-operator-acts-on-materiality-suggestion`
**Test command:** `node tests/check-res-s4-operator-acts-on-materiality-suggestion.js` (single file); `npm test` (full suite)

---

## Corrections made before this plan was written

See `decisions.md`'s 2026-08-28 ARCH entry (res-s4) and `dor/res-s4-dor-contract.md`'s inline corrections for full detail. Summary:
1. The operator's flag/leave-as-is choice is a deterministic button click, not a chat-turn/free-text mechanism — follows the existing `handlePostAssumptionConfirm` precedent in `skills.js`, not a new `journey.js` chat handler.
2. `journey.js` has TWO independent step-nav render functions (`handleGetStageReview`, `handleGetJourneyStageView`) — both need the flag marker for AC1 to be genuinely true regardless of which page the operator views.
3. `journey.flaggedStages` (new top-level array field) persists via the EXISTING generic `journeyStore.setJourneyFields(journeyId, fields)` helper (already does the correct `saveJourney`-then-`_pgWrite` pattern — no new journey-store.js persistence function needed), but `journey-store-pg.js`'s `_sanitise()` allowlist must have `flaggedStages` added or it silently vanishes on a Postgres-backed restart.
4. `journeyStore.getDownstreamStages(currentStage)` — a new small helper, sibling to the existing `getNextStage(currentStage)`, both built on the single `STAGE_SEQUENCE` constant (no second stage-ordering list).

---

## File map

```
Create:
  tests/check-res-s4-operator-acts-on-materiality-suggestion.js  — all 15 tests

Modify:
  src/web-ui/modules/journey-store.js       — flaggedStages default, getDownstreamStages() helper
  src/web-ui/adapters/journey-store-pg.js   — _sanitise() allowlist addition
  src/web-ui/routes/skills.js               — handlePostMaterialityAction handler, client-side buttons on the materiality bubble
  src/web-ui/routes/journey.js              — flag marker in both step-nav render sites; flag-clear in handleGetJourneyStageReopen
  src/web-ui/server.js                      — new route registration for the flag-action endpoint
```

---

## Task 1: journey-store.js flaggedStages default + getDownstreamStages() + Postgres allowlist

**Files:**
- Modify: `src/web-ui/modules/journey-store.js` (add `flaggedStages: []` to `createJourney`'s default shape; add `getDownstreamStages(currentStage)`)
- Modify: `src/web-ui/adapters/journey-store-pg.js` (add `flaggedStages` to `_sanitise()`'s allowlist)
- Test: `tests/check-res-s4-operator-acts-on-materiality-suggestion.js` (this task's section)

**Model class:** balanced

- [x] **Step 1: Write the failing test**

Create `tests/check-res-s4-operator-acts-on-materiality-suggestion.js`:

```javascript
'use strict';

// check-res-s4-operator-acts-on-materiality-suggestion.js
// Verifies res-s4: the operator can flag downstream stages or leave a
// materiality suggestion as-is, without any downstream artefact ever being
// touched; the choice is paired with res-3's suggestionId for an acceptance-
// rate computation; and a flagged stage's marker clears when that stage is
// reopened via res-s1's flow.
//
// Run: node tests/check-res-s4-operator-acts-on-materiality-suggestion.js

var fs   = require('fs');
var os   = require('os');
var path = require('path');
var SKILLS_PATH  = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
var JOURNEY_PATH  = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var PG_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/journey-store-pg.js');

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

function freshSkillsRoutes() {
  var resolved = require.resolve(SKILLS_PATH);
  delete require.cache[resolved];
  return require(resolved);
}

function freshJourneyRoutes() {
  var resolved = require.resolve(JOURNEY_PATH);
  delete require.cache[resolved];
  return require(resolved);
}

function freshPgAdapter() {
  var resolved = require.resolve(PG_ADAPTER_PATH);
  delete require.cache[resolved];
  return require(resolved);
}

function fakeRes() {
  var r = { _chunks: [], _ended: false, _status: null, _location: null };
  r.writeHead = function(s, h) { r._status = s; if (h && h.Location) r._location = h.Location; };
  r.write = function(s) { r._chunks.push(s); };
  // Captures BOTH calling conventions this codebase's handlers use: SSE
  // streaming (res.write(chunk) ... res.end() with no argument) and a
  // single full-body write (res.end(fullHtmlString), no prior res.write
  // calls) -- handleGetStageReview/handleGetJourneyStageView use the
  // latter. Safe for both: when end() is called with no argument (the SSE
  // case), typeof body !== 'string' and nothing is pushed.
  r.end = function(body) { r._ended = true; if (typeof body === 'string') r._chunks.push(body); };
  r.events = function() {
    return r._chunks.map(function(c) {
      var m = c.match(/^data: (.*)\n\n$/);
      return m ? JSON.parse(m[1]) : null;
    }).filter(Boolean);
  };
  return r;
}
function fakeReq(session, params, body) {
  // _readBody(req) already short-circuits on req.body !== undefined --
  // this is the existing test-friendly convention, matching how
  // handlePostAssumptionConfirm's own real request bodies are read.
  return { session: session, params: params || {}, body: body };
}
function fakePool() {
  // Minimal stub for _renderShellWithNav's unconditional pool.query() chain
  // (handleGetStageReview) -- empty result sets are a safe, valid
  // resolution for the products/journeys nav-summary queries this pulls in,
  // none of which are under test here.
  return { query: async function() { return { rows: [] }; } };
}

function createMockPool(rowCounts) {
  rowCounts = rowCounts || {};
  var calls = [];
  async function query(sql, params) {
    calls.push({ sql: String(sql).replace(/\s+/g, ' ').trim(), params: params });
    var s = String(sql).toUpperCase();
    if (s.indexOf('JOURNEYS') !== -1) return { rowCount: rowCounts.journeys !== undefined ? rowCounts.journeys : 1 };
    return { rowCount: 0 };
  }
  return { query: query, calls: calls };
}

var _tmpRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'res-s4-'));

(async function main() {

console.log('\nTask 1 — flaggedStages default, getDownstreamStages(), Postgres allowlist');

await (async function() {
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();

  var journey = journeyStore.createJourney('res-s4-t1-feature', 'default');
  ok('createJourney defaults flaggedStages to an empty array', Array.isArray(journey.flaggedStages) && journey.flaggedStages.length === 0);

  var downstream = journeyStore.getDownstreamStages('discovery');
  ok('getDownstreamStages("discovery") returns everything after it in STAGE_SEQUENCE', JSON.stringify(downstream) === JSON.stringify(['benefit-metric', 'design', 'definition', 'review', 'test-plan', 'definition-of-ready']));

  var downstreamOfLast = journeyStore.getDownstreamStages('definition-of-ready');
  ok('getDownstreamStages() on the last stage returns an empty array', Array.isArray(downstreamOfLast) && downstreamOfLast.length === 0);

  var downstreamOfUnknown = journeyStore.getDownstreamStages('not-a-real-stage');
  ok('getDownstreamStages() on an unknown stage returns an empty array, does not throw', Array.isArray(downstreamOfUnknown) && downstreamOfUnknown.length === 0);
})();

await (async function() {
  var pg = freshPgAdapter();
  var pool = createMockPool({ journeys: 1 });
  pg._setPoolForTesting(pool);

  await pg.saveJourney({
    journeyId: 'jid-1', tenantId: null, ownerId: null, featureSlug: 'res-s4-pg-feature', productId: null,
    flaggedStages: ['benefit-metric', 'definition']
  });

  var savedDataParam = pool.calls[0].params[5];
  var savedData = JSON.parse(savedDataParam);
  ok('Postgres allowlist fix: flaggedStages is present in the serialized data blob', Array.isArray(savedData.flaggedStages) && savedData.flaggedStages.length === 2);
  ok('Postgres allowlist fix: flaggedStages content is preserved exactly', JSON.stringify(savedData.flaggedStages) === JSON.stringify(['benefit-metric', 'definition']));

  pg._setPoolForTesting(null);
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);

})();
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-res-s4-operator-acts-on-materiality-suggestion.js
```

Expected output: `TypeError: journeyStore.getDownstreamStages is not a function` (and the `flaggedStages` assertions would also fail once that's fixed, since `_sanitise()` doesn't include the field yet)

- [x] **Step 3: Write minimal implementation**

In `src/web-ui/modules/journey-store.js`, find `createJourney`'s object literal (search for `sessions:       {}`):

```javascript
    stories:        [],
    currentStoryIndex: 0,
    sessions:       {}
  };
```

Add `flaggedStages: []` (any position in the object is fine; placed near `completedStages` for readability):

```javascript
    stories:        [],
    currentStoryIndex: 0,
    sessions:       {},
    flaggedStages:  []
  };
```

Then, immediately after `getNextStage` (search for `function getNextStage`), add a sibling function:

```javascript
/**
 * res-s4: every stage after currentStage in STAGE_SEQUENCE — the single
 * ordering source, reused rather than a second hardcoded list (named
 * anti-pattern, previously caught in dtra-s1/dspw-s1).
 * @param {string} currentStage
 * @returns {string[]}
 */
function getDownstreamStages(currentStage) {
  var idx = STAGE_SEQUENCE.indexOf(currentStage);
  if (idx === -1) return [];
  return STAGE_SEQUENCE.slice(idx + 1);
}
```

Add both `getDownstreamStages` to `module.exports` (find the existing `getNextStage,` line and add directly after it):

```javascript
  getNextStage,
  getDownstreamStages,
```

In `src/web-ui/adapters/journey-store-pg.js`, find `_sanitise`'s object literal (search for `displayName:       journey.displayName        || null`):

```javascript
    // fdn-s1: this allowlist is the only thing standing between a field
    // working in-memory/on-disk and silently vanishing after a Postgres-
    // backed restart -- must be added explicitly, not inferred.
    displayName:       journey.displayName        || null
  };
```

Add `flaggedStages` to the same allowlist:

```javascript
    // fdn-s1: this allowlist is the only thing standing between a field
    // working in-memory/on-disk and silently vanishing after a Postgres-
    // backed restart -- must be added explicitly, not inferred.
    displayName:       journey.displayName        || null,
    // res-s4: same fdn-s1 rule applies -- flaggedStages must be listed here
    // explicitly or it silently vanishes on a Postgres-backed restart.
    flaggedStages:     journey.flaggedStages       || []
  };
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-res-s4-operator-acts-on-materiality-suggestion.js
```

Expected output: `6 passed, 0 failed`

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (baseline was 564 files, 1 pre-existing flake — `tests/check-p3.5-validate-trace.js`, already RISK-ACCEPTed at branch-setup, fourth occurrence in this feature)

- [x] **Step 6: Commit**

```bash
git add src/web-ui/modules/journey-store.js src/web-ui/adapters/journey-store-pg.js tests/check-res-s4-operator-acts-on-materiality-suggestion.js
git commit -m "feat(res-s4): flaggedStages default, getDownstreamStages() helper, Postgres allowlist fix"
```

---

## Task 2: handlePostMaterialityAction endpoint + client-side flag/leave-as-is buttons

**Files:**
- Modify: `src/web-ui/routes/skills.js` (new `handlePostMaterialityAction`, client-side button rendering + wiring on the materiality bubble)
- Modify: `src/web-ui/server.js` (route registration)
- Test: `tests/check-res-s4-operator-acts-on-materiality-suggestion.js` (append this task's section)

**Model class:** deep-reasoning (new endpoint + modifies the shared inlined client script alongside res-s3's own recent changes to the same script — regression risk if not precisely scoped)

- [x] **Step 1: Write the failing test**

Append to `tests/check-res-s4-operator-acts-on-materiality-suggestion.js`, before the final `console.log('\n' + passed ...)` line:

```javascript
console.log('\nTask 2 — handlePostMaterialityAction endpoint');

await (async function() {
  // AC1/AC3: "flag" action sets flaggedStages on the journey and records the
  // choice paired with the suggestionId.
  var routes = freshSkillsRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();

  var jid = journeyStore.createJourney('res-s4-t2-flag-feature', 'default').journeyId;
  var sid = 'test-res-s4-t2-flag-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 'res-s4-t2-flag-feature', journeyId: jid
  });

  var captured = [];
  var posthogServer = require('../src/web-ui/modules/posthog-server');
  var _originalCapture = posthogServer.capture;
  posthogServer.capture = function(distinctId, event, properties, groups) {
    captured.push({ event: event, properties: properties });
  };

  var res = fakeRes();
  try {
    await routes.handlePostMaterialityAction(
      fakeReq({ accessToken: 'tok', tenantId: 'org-a' }, { name: 'discovery', id: sid }, { action: 'flag', suggestionId: 'suggestion-t2-1' }),
      res
    );
  } finally {
    posthogServer.capture = _originalCapture;
  }

  var journeyAfter = journeyStore.getJourney(jid);
  ok('AC1: "flag" action sets journey.flaggedStages to the downstream stages', JSON.stringify(journeyAfter.flaggedStages) === JSON.stringify(journeyStore.getDownstreamStages('discovery')));

  var choiceEvent = captured.find(function(c) { return c.event === 'materiality_operator_choice_recorded'; });
  ok('AC3: the operator choice is recorded via PostHog', !!choiceEvent);
  ok('AC3: the choice event carries the same suggestionId as the original suggestion', choiceEvent && choiceEvent.properties.suggestionId === 'suggestion-t2-1');
  ok('AC3: the choice event records the operator action as "flag"', choiceEvent && choiceEvent.properties.operatorAction === 'flag');

  var flagSetEvents = captured.filter(function(c) { return c.event === 'materiality_flag_set'; });
  ok('NFR-Audit: one flag_set event per downstream stage, each with journeyId/stageName/timestamp', flagSetEvents.length === journeyStore.getDownstreamStages('discovery').length &&
    flagSetEvents.every(function(e) { return e.properties.journeyId === jid && !!e.properties.stageName && !!e.properties.timestamp; }));
})();

await (async function() {
  // AC2: "leave-as-is" applies no flag, still records the choice.
  var routes = freshSkillsRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();

  var jid = journeyStore.createJourney('res-s4-t2-leave-feature', 'default').journeyId;
  var sid = 'test-res-s4-t2-leave-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 'res-s4-t2-leave-feature', journeyId: jid
  });

  var captured = [];
  var posthogServer = require('../src/web-ui/modules/posthog-server');
  var _originalCapture = posthogServer.capture;
  posthogServer.capture = function(distinctId, event, properties) { captured.push({ event: event, properties: properties }); };

  var res = fakeRes();
  try {
    await routes.handlePostMaterialityAction(
      fakeReq({ accessToken: 'tok', tenantId: 'org-a' }, { name: 'discovery', id: sid }, { action: 'leave-as-is', suggestionId: 'suggestion-t2-2' }),
      res
    );
  } finally {
    posthogServer.capture = _originalCapture;
  }

  var journeyAfter = journeyStore.getJourney(jid);
  ok('AC2: "leave-as-is" applies no flag', Array.isArray(journeyAfter.flaggedStages) && journeyAfter.flaggedStages.length === 0);

  var choiceEvent = captured.find(function(c) { return c.event === 'materiality_operator_choice_recorded'; });
  ok('AC2/AC3: "leave-as-is" is still recorded (not just a no-op)', !!choiceEvent && choiceEvent.properties.operatorAction === 'leave-as-is');

  var flagSetEvents = captured.filter(function(c) { return c.event === 'materiality_flag_set'; });
  ok('AC2: no flag_set events fire for leave-as-is', flagSetEvents.length === 0);
})();

await (async function() {
  // Reject an invalid action — matches handlePostAssumptionConfirm's
  // INVALID_ACTION precedent.
  var routes = freshSkillsRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();
  var jid = journeyStore.createJourney('res-s4-t2-invalid-feature', 'default').journeyId;
  var sid = 'test-res-s4-t2-invalid-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 'res-s4-t2-invalid-feature', journeyId: jid
  });

  var res = fakeRes();
  await routes.handlePostMaterialityAction(
    fakeReq({ accessToken: 'tok', tenantId: 'org-a' }, { name: 'discovery', id: sid }, { action: 'do-something-else', suggestionId: 'x' }),
    res
  );
  ok('Invalid action is rejected with 400', res._status === 400);
})();

await (async function() {
  // AC1 client-side: the materiality bubble's flag/leave-as-is buttons must
  // exist and be wired via the same fetch-and-update pattern as assumption
  // cards (attachCardHandlers precedent) -- verified via source inspection,
  // consistent with how Task 5 of res-s3 verified its own client-side branch.
  var skillsSrc = fs.readFileSync(SKILLS_PATH, 'utf8');
  var materialityBranchMatch = skillsSrc.match(/if\(evt\.materialitySuggestion\)\s*\{([\s\S]*?)\n\s*\}/);
  ok('AC1/AC2 client render: the materiality branch renders a flag button', !!materialityBranchMatch && /btn-flag-downstream/.test(materialityBranchMatch[1]));
  ok('AC1/AC2 client render: the materiality branch renders a leave-as-is button', !!materialityBranchMatch && /btn-leave-as-is/.test(materialityBranchMatch[1]));
})();
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-res-s4-operator-acts-on-materiality-suggestion.js
```

Expected output: `TypeError: routes.handlePostMaterialityAction is not a function`

- [x] **Step 3: Write minimal implementation**

In `src/web-ui/routes/skills.js`, add a new handler immediately after `handlePostAssumptionConfirm` (search for the closing `}` of that function, right before the `buildSystemPromptWithProductContext` comment block):

```javascript
/**
 * res-s4: record the operator's response to a materiality suggestion —
 * "flag" applies a visible marker to every downstream stage (AC1), or
 * "leave-as-is" applies nothing (AC2). Either way the choice is logged
 * paired with the original suggestionId so an acceptance rate can be
 * computed later (AC3). Follows handlePostAssumptionConfirm's exact shape.
 */
async function handlePostMaterialityAction(req, res) {
  if (!req.session || !req.session.accessToken) {
    _json(res, 401, { error: 'Not authenticated' });
    return;
  }

  var sessionId = (req.params && req.params.id) || '';
  var session = await _getSessionOrRestore(sessionId);
  if (!session) {
    _json(res, 404, { error: 'SESSION_NOT_FOUND' });
    return;
  }

  var body = await _readBody(req);
  var action = body && body.action;
  var suggestionId = body && body.suggestionId;
  if (action !== 'flag' && action !== 'leave-as-is') {
    _json(res, 400, { error: 'INVALID_ACTION' });
    return;
  }

  var journeyId = session.journeyId;
  var journey = journeyId ? _journeyStore.getJourney(journeyId) : null;
  var downstream = journey ? _journeyStore.getDownstreamStages(session.skillName) : [];
  var now = new Date().toISOString();

  if (action === 'flag' && journey) {
    _journeyStore.setJourneyFields(journeyId, { flaggedStages: downstream });
    downstream.forEach(function(stageName) {
      _posthog.capture(req.session.login || journey.ownerId || journeyId, 'materiality_flag_set', {
        journeyId: journeyId, stageName: stageName, timestamp: now
      }, { company: req.session.tenantId || journey.tenantId });
    });
  }

  if (journey) {
    _posthog.capture(req.session.login || journey.ownerId || journeyId, 'materiality_operator_choice_recorded', {
      journeyId: journeyId, skillName: session.skillName, suggestionId: suggestionId || null, operatorAction: action
    }, { company: req.session.tenantId || journey.tenantId });
  }

  _json(res, 200, { action: action, flaggedStages: journey ? (journey.flaggedStages || []) : [] });
}
```

Note: `_posthog` is already required near the top of `skills.js` — check the top of the file for the existing `require('../modules/posthog-server')` and reuse that same variable name (do not add a second require).

Change `module.exports` to add the new handler (find the existing `handlePostAssumptionConfirm,` line and add directly after it):

```javascript
  handlePostAssumptionConfirm,
  handlePostMaterialityAction,
```

Now, in the same file's inlined client script, find the materiality-suggestion render branch (search for `if(evt.materialitySuggestion) {`):

```javascript
    '              if(evt.materialitySuggestion) {',
    '                var ms = evt.materialitySuggestion;',
    '                var msLabel = ms.classification === "material" ? "Material change" : "Minor change";',
    '                appendBubble("assistant", "<strong>" + escHtmlClient(msLabel) + ":</strong> " + escHtmlClient(ms.rationale || ""));',
    '              }',
```

Replace with (capture the bubble element, add two buttons, wire them via the same fetch-and-update pattern `attachCardHandlers` already uses for assumption cards):

```javascript
    '              if(evt.materialitySuggestion) {',
    '                var ms = evt.materialitySuggestion;',
    '                var msLabel = ms.classification === "material" ? "Material change" : "Minor change";',
    '                var msBubble = appendBubble("assistant",',
    '                  "<strong>" + escHtmlClient(msLabel) + ":</strong> " + escHtmlClient(ms.rationale || "") +',
    '                  \'<div class="materiality-actions">\' +',
    '                    \'<button class="btn-flag-downstream" type="button" aria-label="Flag downstream stages">Flag downstream stages</button> \' +',
    '                    \'<button class="btn-leave-as-is" type="button" aria-label="Leave as-is">Leave as-is</button>\' +',
    '                  \'</div>\');',
    '                attachMaterialityHandlers(msBubble, ms.suggestionId);',
    '              }',
```

Add a new client-side function near `attachCardHandlers` (search for `function attachCardHandlers(cardEl) {` and insert this new function immediately before it, so it can reuse the same `SKILL_NAME_ENC`/`SESSION_ID_ENC` globals already declared above):

```javascript
    '  function materialityActionUrl() {',
    '    return "/api/skills/" + SKILL_NAME_ENC + "/sessions/" + SESSION_ID_ENC + "/materiality-action";',
    '  }',
    '  function attachMaterialityHandlers(bubbleEl, suggestionId) {',
    '    var flagBtn  = bubbleEl.querySelector(".btn-flag-downstream");',
    '    var leaveBtn = bubbleEl.querySelector(".btn-leave-as-is");',
    '    function doAction(action) {',
    '      fetch(materialityActionUrl(), {',
    '        method: "POST",',
    '        headers: {"Content-Type": "application/json"},',
    '        body: JSON.stringify({action: action, suggestionId: suggestionId})',
    '      }).then(function(r) {',
    '        if(!r.ok) throw new Error("Request failed: " + r.status);',
    '        return r.json();',
    '      }).then(function() {',
    '        if(flagBtn)  flagBtn.disabled  = true;',
    '        if(leaveBtn) leaveBtn.disabled = true;',
    '        var actionsDiv = bubbleEl.querySelector(".materiality-actions");',
    '        if(actionsDiv) actionsDiv.insertAdjacentHTML("beforeend", \'<span class="materiality-confirmed">Recorded.</span>\');',
    '      }).catch(function() {',
    '        var actionsDiv = bubbleEl.querySelector(".materiality-actions");',
    '        if(actionsDiv) actionsDiv.insertAdjacentHTML("beforeend", \'<span class="materiality-error">Could not record — please try again.</span>\');',
    '      });',
    '    }',
    '    if(flagBtn)  flagBtn.addEventListener("click",  function(){ doAction("flag"); });',
    '    if(leaveBtn) leaveBtn.addEventListener("click", function(){ doAction("leave-as-is"); });',
    '  }',
```

Finally, in `src/web-ui/server.js`, find the assumption-confirm route (search for `assumption/[^/]+/confirm`):

```javascript
  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions\/[^/]+\/assumption\/[^/]+\/confirm$/) && req.method === 'POST') {
    // iwu.4 — confirm/flag assumption card endpoint
    const parts = pathname.split('/');
    req.params = { name: parts[3], id: parts[5], cardId: parts[7] };
    authGuard(req, res, async () => {
      // vrne-s2 — viewer-role write-block gate (AC5)
      let _rnvOk = false;
      await requireNonViewer(req, res, () => { _rnvOk = true; });
      if (!_rnvOk) return;
      await handlePostAssumptionConfirm(req, res);
    });
```

Add a new route immediately after it (before the next `} else if`):

```javascript

  } else if (pathname.match(/^\/api\/skills\/[^/]+\/sessions\/[^/]+\/materiality-action$/) && req.method === 'POST') {
    // res-s4 — record the operator's flag/leave-as-is choice on a materiality suggestion
    const parts = pathname.split('/');
    req.params = { name: parts[3], id: parts[5] };
    authGuard(req, res, async () => {
      let _rnvOk = false;
      await requireNonViewer(req, res, () => { _rnvOk = true; });
      if (!_rnvOk) return;
      await handlePostMaterialityAction(req, res);
    });
```

And add `handlePostMaterialityAction` to the destructured import from `./routes/skills` at the top of `server.js` (find the existing `handlePostAssumptionConfirm` in that destructure and add `handlePostMaterialityAction` directly after it).

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-res-s4-operator-acts-on-materiality-suggestion.js
```

Expected output: `18 passed, 0 failed` (6 from Task 1 + 11 from Task 2 -- adjusted +1 for a code-quality-review-driven skillName-dynamism test added after the initial commit; see commit `49c9247a`)

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (same 1 pre-existing flake). Pay particular attention to res-s3's own test file (`check-res-s3-suggest-revision-materiality.js`, 34 tests) since this task modifies the same inlined client script res-s3's Task 5 last touched.

- [x] **Step 6: Commit**

```bash
git add src/web-ui/routes/skills.js src/web-ui/server.js tests/check-res-s4-operator-acts-on-materiality-suggestion.js
git commit -m "feat(res-s4): handlePostMaterialityAction endpoint, flag/leave-as-is buttons on the materiality bubble"
```

---

## Task 3: Flag marker on both step-nav render sites

**Files:**
- Modify: `src/web-ui/routes/journey.js` (`handleGetStageReview`, `handleGetJourneyStageView`)
- Test: `tests/check-res-s4-operator-acts-on-materiality-suggestion.js` (append this task's section)

**Model class:** balanced

- [x] **Step 1: Write the failing test**

Append to `tests/check-res-s4-operator-acts-on-materiality-suggestion.js`:

```javascript
console.log('\nTask 3 — flag marker on both step-nav render sites');

await (async function() {
  var journeyRoute = freshJourneyRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();
  journeyRoute.setJourneyStoreModule(journeyStore);
  journeyRoute.setRepoRoot(_tmpRepoRoot);
  journeyRoute.setGetHtmlSession(function() { return null; });

  var slug = 'res-s4-t3-feature';
  var journey = journeyStore.createJourney(slug, 'default');
  var jid = journey.journeyId;
  journeyStore.completeStage(jid, 'discovery', 'artefacts/' + slug + '/discovery.md', null, 'sid-discovery');
  journeyStore.completeStage(jid, 'benefit-metric', 'artefacts/' + slug + '/benefit-metric.md', null, 'sid-bm');
  journeyStore.setJourneyFields(jid, { flaggedStages: ['benefit-metric'] });

  var artefactAbsPath = path.join(_tmpRepoRoot, 'artefacts', slug, 'discovery.md');
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, '# Discovery', 'utf8');

  var res = fakeRes();
  await journeyRoute.handleGetJourneyStageView(
    fakeReq({ accessToken: 'tok' }, { journeyId: jid, stageName: 'discovery' }),
    res
  );

  var html = res._chunks.join('');
  ok('AC1: handleGetJourneyStageView renders a flag marker for the flagged stage', /sn-step--flagged/.test(html) && /May need review/.test(html));

  var flaggedStepMatch = html.match(/<li class="sn-step[^"]*sn-step--flagged[^"]*"[\s\S]*?<\/li>/);
  ok('Accessibility: the flag marker includes a text label, not colour alone', !!flaggedStepMatch && /May need review/.test(flaggedStepMatch[0]));
})();

await (async function() {
  // Same fixture, but exercising handleGetStageReview's independent render.
  var journeyRoute = freshJourneyRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();
  journeyRoute.setJourneyStoreModule(journeyStore);
  journeyRoute.setRepoRoot(_tmpRepoRoot);

  var slug = 'res-s4-t3-review-feature';
  var journey = journeyStore.createJourney(slug, 'default');
  var jid = journey.journeyId;
  journeyStore.setJourneyFields(jid, { activeSkill: 'definition', activeSessionId: 'sid-active' });
  journeyStore.setJourneyFields(jid, { flaggedStages: ['review'] });

  journeyRoute.setGetHtmlSession(function() {
    return { skillName: 'definition', done: true, artefactContent: '# Definition', turns: [] };
  });

  var res = fakeRes();
  await journeyRoute.handleGetStageReview(
    fakeReq({ accessToken: 'tok' }, { journeyId: jid }),
    res,
    fakePool()
  );

  var html = res._chunks.join('');
  ok('AC1: handleGetStageReview ALSO renders a flag marker for the flagged stage (both render sites consistent)', /sn-step--flagged/.test(html) && /May need review/.test(html));
})();
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-res-s4-operator-acts-on-materiality-suggestion.js
```

Expected output: `FAIL: AC1: handleGetJourneyStageView renders a flag marker for the flagged stage`

- [x] **Step 3: Write minimal implementation**

In `src/web-ui/routes/journey.js`, in `handleGetJourneyStageView`'s step-nav loop (search for `var _doneSet = new Set((journey.completedStages || []).map(function(s) { return s.skillName; }));` — the SECOND occurrence in the file, inside `handleGetJourneyStageView`, around line 891):

```javascript
  var _doneSet = new Set((journey.completedStages || []).map(function(s) { return s.skillName; }));
  var _activeSkill = journey.activeSkill;
  var _activeSid = journey.activeSessionId || '';
  var _stepsHtml = STAGE_META.map(function(s) {
    var isDone = _doneSet.has(s.id);
    var isActive = s.id === _activeSkill;
    var isViewing = s.id === stageName;
    var cls = isViewing ? 'sn-step--viewing' : isDone ? 'sn-step--done' : isActive ? 'sn-step--active' : 'sn-step--pending';
    var icon = isDone || isViewing ? '●' : isActive ? '▶' : '○';
    var inner = '<span class="sn-num">' + escHtml(String(s.num)) + '</span>' +
      '<span class="sn-label">' + escHtml(s.label) + '</span>' +
      '<span class="sn-icon" aria-hidden="true">' + icon + '</span>';
```

Replace with (add a `_flaggedSet`, fold `sn-step--flagged` into `cls`, and append a visible text marker to `inner`):

```javascript
  var _doneSet = new Set((journey.completedStages || []).map(function(s) { return s.skillName; }));
  var _flaggedSet = new Set(journey.flaggedStages || []);
  var _activeSkill = journey.activeSkill;
  var _activeSid = journey.activeSessionId || '';
  var _stepsHtml = STAGE_META.map(function(s) {
    var isDone = _doneSet.has(s.id);
    var isActive = s.id === _activeSkill;
    var isViewing = s.id === stageName;
    var isFlagged = _flaggedSet.has(s.id);
    var cls = (isViewing ? 'sn-step--viewing' : isDone ? 'sn-step--done' : isActive ? 'sn-step--active' : 'sn-step--pending') + (isFlagged ? ' sn-step--flagged' : '');
    var icon = isDone || isViewing ? '●' : isActive ? '▶' : '○';
    var inner = '<span class="sn-num">' + escHtml(String(s.num)) + '</span>' +
      '<span class="sn-label">' + escHtml(s.label) + '</span>' +
      '<span class="sn-icon" aria-hidden="true">' + icon + '</span>' +
      // res-s4 (AC1, Accessibility NFR): text label, not colour alone.
      (isFlagged ? '<span class="sn-flag-marker">⚑ May need review</span>' : '');
```

In `handleGetStageReview`'s step-nav loop (search for the FIRST occurrence of `var _doneSet = new Set((journey.completedStages || []).map(function(s) { return s.skillName; }));`, around line 656):

```javascript
  var _doneSet = new Set((journey.completedStages || []).map(function(s) { return s.skillName; }));
  var _stepsHtml = STAGE_META.map(function(s) {
    var isDone = _doneSet.has(s.id);
    var isActive = s.id === skillName;
    var cls = isDone ? 'sn-step--done' : isActive ? 'sn-step--active' : 'sn-step--pending';
    var icon = isDone ? '●' : isActive ? '▶' : '○';
    return '<li class="sn-step ' + cls + '">' +
      '<span class="sn-num">' + escHtml(String(s.num)) + '</span>' +
      '<span class="sn-label">' + escHtml(s.label) + '</span>' +
      '<span class="sn-icon" aria-hidden="true">' + icon + '</span>' +
      '</li>';
  }).join('');
```

Replace with:

```javascript
  var _doneSet = new Set((journey.completedStages || []).map(function(s) { return s.skillName; }));
  var _flaggedSet = new Set(journey.flaggedStages || []);
  var _stepsHtml = STAGE_META.map(function(s) {
    var isDone = _doneSet.has(s.id);
    var isActive = s.id === skillName;
    var isFlagged = _flaggedSet.has(s.id);
    var cls = (isDone ? 'sn-step--done' : isActive ? 'sn-step--active' : 'sn-step--pending') + (isFlagged ? ' sn-step--flagged' : '');
    var icon = isDone ? '●' : isActive ? '▶' : '○';
    return '<li class="sn-step ' + cls + '">' +
      '<span class="sn-num">' + escHtml(String(s.num)) + '</span>' +
      '<span class="sn-label">' + escHtml(s.label) + '</span>' +
      '<span class="sn-icon" aria-hidden="true">' + icon + '</span>' +
      (isFlagged ? '<span class="sn-flag-marker">⚑ May need review</span>' : '') +
      '</li>';
  }).join('');
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-res-s4-operator-acts-on-materiality-suggestion.js
```

Expected output: `21 passed, 0 failed` (adjusted +1 for Task 2's post-review count — see Task 2's Step 4 note above)

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (same 1 pre-existing flake). This task modifies step-nav rendering that res-s1's Task 3 also touched — re-confirm `tests/check-res-s1-reopen-completed-stage-live-session.js` (19 tests) still passes.

- [x] **Step 6: Commit**

```bash
git add src/web-ui/routes/journey.js tests/check-res-s4-operator-acts-on-materiality-suggestion.js
git commit -m "feat(res-s4): flag marker on both step-nav render sites (AC1, accessibility)"
```

---

## Task 4: Flag clears when a flagged stage is reopened

**Files:**
- Modify: `src/web-ui/routes/journey.js` (`handleGetJourneyStageReopen`)
- Test: `tests/check-res-s4-operator-acts-on-materiality-suggestion.js` (append this task's section)

**Model class:** balanced

- [x] **Step 1: Write the failing test**

Append to `tests/check-res-s4-operator-acts-on-materiality-suggestion.js`:

```javascript
console.log('\nTask 4 — flag clears on reopen (AC4)');

await (async function() {
  // Fresh-session-creation path: no live session exists yet.
  var journeyRoute = freshJourneyRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();
  journeyRoute.setJourneyStoreModule(journeyStore);
  journeyRoute.setRepoRoot(_tmpRepoRoot);
  journeyRoute.setRegisterHtmlSession(function() {});
  journeyRoute.setLinkSessionToJourney(function() {});
  journeyRoute.setGetHtmlSession(function() { return null; });

  var slug = 'res-s4-t4-fresh-feature';
  var artefactRelPath = 'artefacts/' + slug + '/discovery.md';
  var artefactAbsPath = path.join(_tmpRepoRoot, artefactRelPath);
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, '# Discovery', 'utf8');

  var journey = journeyStore.createJourney(slug, 'default');
  var jid = journey.journeyId;
  journeyStore.completeStage(jid, 'discovery', artefactRelPath, null, 'old-sid');
  journeyStore.setJourneyFields(jid, { flaggedStages: ['discovery', 'benefit-metric'] });

  var res = fakeRes();
  await journeyRoute.handleGetJourneyStageReopen(
    fakeReq({ accessToken: 'tok' }, { journeyId: jid, skillName: 'discovery' }),
    res
  );

  var journeyAfter = journeyStore.getJourney(jid);
  ok('AC4: reopening a flagged stage (fresh-session path) clears its own flag', journeyAfter.flaggedStages.indexOf('discovery') === -1);
  ok('AC4 negative control: an UNRELATED flagged stage remains flagged', journeyAfter.flaggedStages.indexOf('benefit-metric') !== -1);
})();

await (async function() {
  // Early-return path: a live session ALREADY exists for the flagged stage.
  var journeyRoute = freshJourneyRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();
  journeyRoute.setJourneyStoreModule(journeyStore);
  journeyRoute.setRepoRoot(_tmpRepoRoot);
  journeyRoute.setGetHtmlSession(function(sid) { return sid === 'live-sid' ? { skillName: 'discovery' } : null; });

  var slug = 'res-s4-t4-existing-feature';
  var journey = journeyStore.createJourney(slug, 'default');
  var jid = journey.journeyId;
  journeyStore.completeStage(jid, 'discovery', 'artefacts/' + slug + '/discovery.md', null, 'live-sid');
  journeyStore.setJourneyFields(jid, { flaggedStages: ['discovery'] });

  var res = fakeRes();
  await journeyRoute.handleGetJourneyStageReopen(
    fakeReq({ accessToken: 'tok' }, { journeyId: jid, skillName: 'discovery' }),
    res
  );

  ok('AC4: the early-return (existing live session) path also redirects correctly', res._status === 303);
  var journeyAfter = journeyStore.getJourney(jid);
  ok('AC4: the flag clears on the early-return path too, not only the fresh-session path', journeyAfter.flaggedStages.indexOf('discovery') === -1);
})();
```

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-res-s4-operator-acts-on-materiality-suggestion.js
```

Expected output: `FAIL: AC4: reopening a flagged stage (fresh-session path) clears its own flag`

- [x] **Step 3: Write minimal implementation**

In `src/web-ui/routes/journey.js`'s `handleGetJourneyStageReopen`, find the block right after `stageEntry` is confirmed to exist (search for `var stageEntry = (journey.completedStages || []).find`):

```javascript
  var stageEntry = (journey.completedStages || []).find(function(cs) { return cs.skillName === skillName; });
  if (!stageEntry) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Not Found', bodyContent: '<div class="sw-page-content"><p>Stage not completed yet.</p></div>', user: { login: req.session.login || '' } }));
    return;
  }

  // AC1 safety-net re-check: session may already exist despite the step-nav
  // link having pointed here (a concurrent tab, or a race with the render).
  if (stageEntry.sessionId) {
```

Insert the flag-clear logic between the `if (!stageEntry)` guard and the early-return check (so it fires on BOTH the early-return and fresh-session paths below it):

```javascript
  var stageEntry = (journey.completedStages || []).find(function(cs) { return cs.skillName === skillName; });
  if (!stageEntry) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderShell({ title: 'Not Found', bodyContent: '<div class="sw-page-content"><p>Stage not completed yet.</p></div>', user: { login: req.session.login || '' } }));
    return;
  }

  // res-s4 (AC4): clear this stage's own flag on reopen, if it was flagged --
  // placed BEFORE the early-return check below so it fires whether or not a
  // live session already exists (both are genuine "reopen" outcomes per
  // res-s1's own AC1). An unrelated flagged stage is untouched.
  if ((journey.flaggedStages || []).indexOf(skillName) !== -1) {
    var _clearedFlags = journey.flaggedStages.filter(function(s) { return s !== skillName; });
    _journeyStore.setJourneyFields(journeyId, { flaggedStages: _clearedFlags });
    journey.flaggedStages = _clearedFlags;
    _posthog.capture(req.session.login || journey.ownerId || journeyId, 'materiality_flag_cleared', {
      journeyId: journeyId, stageName: skillName, timestamp: new Date().toISOString()
    }, { company: req.session.tenantId || journey.tenantId });
  }

  // AC1 safety-net re-check: session may already exist despite the step-nav
  // link having pointed here (a concurrent tab, or a race with the render).
  if (stageEntry.sessionId) {
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-res-s4-operator-acts-on-materiality-suggestion.js
```

Expected output: `25 passed, 0 failed` (adjusted +1 for Task 2's post-review count — see Task 2's Step 4 note above)

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (same 1 pre-existing flake). This is Task 4's own first (and only) touch to `handleGetJourneyStageReopen` — Task 3 touched a different pair of functions (`handleGetStageReview`/`handleGetJourneyStageView`), not this one. This handler was originally built by a sibling story, res-s1, whose own test file (`tests/check-res-s1-reopen-completed-stage-live-session.js`) directly exercises it — re-confirm all 19 of its tests still pass, not just this story's own.

- [x] **Step 6: Commit**

```bash
git add src/web-ui/routes/journey.js tests/check-res-s4-operator-acts-on-materiality-suggestion.js
git commit -m "feat(res-s4): clear a stage's flag when it is reopened (AC4)"
```

---

## Task 5 (corrective, added post final-review 2026-08-29): third render site + flag-union fix

The mandatory Step 3 final cross-task review (per `/subagent-execution`) found two genuine gaps across the completed 4-task implementation — see `decisions.md`'s 2026-08-29 ARCH entry for full rationale.

- [x] **Step 1: F1 — add the flag marker to `_renderChatPage`'s step-nav strip in `src/web-ui/routes/skills.js`**

The DoR contract correction (2026-08-28 ARCH entry) found and fixed two step-nav render sites in `journey.js`, but missed a THIRD, structurally-identical one in `skills.js`'s `_renderChatPage` — the chat page itself, the exact page the operator is looking at when they click the flag button. Added `_flaggedSet` (mirroring `journey.js`'s pattern) and folded `isFlagged`/`sn-step--flagged`/the `sn-flag-marker` span into the existing `_NAV_STAGES.map(...)` block, gated on `!s.subStep` (sub-steps `clarify`/`estimate` are never members of `STAGE_SEQUENCE`, so they can never be flagged). No new CSS rule added — `journey.js`'s own two sites also have none (the marker inherits `.sn-step--pending`'s existing opacity), so this stays consistent with the established (if imperfect) precedent rather than introducing new visual scope.

- [x] **Step 2: O1 — union `flaggedStages` instead of replacing wholesale, in `handlePostMaterialityAction`**

`downstream` was being assigned directly as the new `flaggedStages` value, silently discarding any earlier stage's still-unresolved flags on a second flag action from a later stage. Changed to `Array.from(new Set((journey.flaggedStages || []).concat(downstream)))`. AC4's own text is the only sanctioned way for a flag to disappear (the operator reopening and resolving that specific stage) — a second flag action must not be an implicit alternate way to clear unrelated flags.

- [x] **Step 3: Add tests to `tests/check-res-s4-operator-acts-on-materiality-suggestion.js`**

Two new tests appended after the existing Task 4 tests: (1) call `handleGetChatHtml` directly (via `routes._setHtmlSession` + a session with a flagged downstream stage) and assert the returned HTML contains `sn-step--flagged` and `May need review` — proving F1's render site actually emits the marker, not just that the two `journey.js` sites do. (2) call `handlePostMaterialityAction` twice against the same journey — once flagging from `discovery`, once flagging from a later stage — and assert the final `flaggedStages` is the UNION of both calls' downstream sets, not just the second call's, proving O1's fix.

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-res-s4-operator-acts-on-materiality-suggestion.js
```

Expected output: `27 passed, 0 failed` (25 existing + 2 new).

- [x] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (same 1 pre-existing flake, `tests/check-p3.5-validate-trace.js`, already RISK-ACCEPTed four times this feature).

- [x] **Step 6: Commit**

```bash
git add src/web-ui/routes/skills.js tests/check-res-s4-operator-acts-on-materiality-suggestion.js artefacts/2026-08-27-revise-earlier-stage/decisions.md workspace/capture-log.md artefacts/2026-08-27-revise-earlier-stage/plans/res-s4-plan.md
git commit -m "fix(res-s4): third step-nav render site + flag-union fix (final review F1/O1)"
```

---

## Task 5b (corrective, added post re-run final-review 2026-08-29): N1 — flag marker didn't appear without a page reload

The re-run final review confirmed F1 and O1 genuinely fixed, then found one more gap on a fresh AC1 trace: `_renderChatPage`'s flag marker (added by Task 5/F1) is correct render logic, but the operator who just clicked "Flag downstream stages" is on an already-loaded page — nothing re-ran that render logic, so the marker did not actually appear until a subsequent fresh load. See `decisions.md`'s second 2026-08-29 ARCH entry for full rationale, including why a client-side DOM patch (following `attachCardHandlers`' existing precedent) was chosen over `window.location.reload()`.

- [x] **Step 1:** Added `data-stage-id` attribute to each step-nav `<li>` in `_renderChatPage` (`src/web-ui/routes/skills.js`), so client JS can target the correct one.
- [x] **Step 2:** `attachMaterialityHandlers`'s success handler now reads `data.flaggedStages` from `handlePostMaterialityAction`'s JSON response and patches the matching `<li>`(s) in place: adds `sn-step--flagged` class + the `sn-flag-marker` span, matching the server-rendered markup exactly.
- [x] **Step 3:** Added 8 new tests (2 direct-HTML `data-stage-id` assertions in the existing F1 render test, 6 source-inspection assertions on `attachMaterialityHandlers`'s own bounded function body). One test's initial regex (checking `data-stage-id` presence file-wide) was caught as vacuous during self-review — it would have passed even with the server-side attribute removed, since the string also legitimately appears in the client-side consumer code — and was replaced with a direct HTML assertion instead. Both the `data-stage-id`-removed and the (source-detectable) `data.flaggedStages`-removed mutations were independently re-run to confirm the tests fail as expected; a `false &&`-disabled mutation of the DOM-patch block was also tried and, as expected, was NOT caught by these source-inspection tests — an accepted limitation shared with this file's other client-side-behaviour tests (e.g. the existing Task 2 "AC1 client render" test), since there is no browser/DOM test harness in this repo to assert actual runtime behaviour.
- [x] **Step 4:** `node tests/check-res-s4-operator-acts-on-materiality-suggestion.js` → `36 passed, 0 failed`.
- [x] **Step 5:** `npm test` → `565 file(s) run, 0 failed`.
- [x] **Step 6:** Commit.

```bash
git add src/web-ui/routes/skills.js tests/check-res-s4-operator-acts-on-materiality-suggestion.js artefacts/2026-08-27-revise-earlier-stage/decisions.md workspace/capture-log.md artefacts/2026-08-27-revise-earlier-stage/plans/res-s4-plan.md
git commit -m "fix(res-s4): flag marker updates in place after the operator's own action (final review N1)"
```

---

## After all tasks: open the draft PR

Once all tasks are committed and the full suite passes, run `/verify-completion` then `/branch-complete` per the standard inner-loop sequence. Per the DoR's Coding Agent Instructions: open a draft PR when tests pass — do not mark ready for review.
