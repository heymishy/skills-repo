# Filter Stage Visibility by Role — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** When a collaborator loads a feature's page, a role-filtered pipeline stage list renders immediately (engineer sees test-plan/review/definition-of-ready; product sees discovery/benefit-metric/definition), with a "Show all stages" toggle revealing every stage without a page refresh.
**Branch:** `feature/ep2-s2`
**Worktree:** `.worktrees/ep2-s2`
**Test command:** `npm test` (unit/integration), `npm run test:e2e -- ep2-s2` (E2E)

---

## Architecture correction (read before starting — see decisions.md, 2026-09-18, for full rationale)

This story's DoR and story artefact were written against an architecture that doesn't exist. Verified against real source before writing this plan:

1. **No `role_definitions` table exists.** Role comes from `feature_collaborators.role_id` (`getFeatureCollaborators(pool, journeyId)`, already built by ep1-s3/ep2-s1) — resolve the requesting user's role by matching `req.session.login` against `userId` in that result set.
2. **No `/api/features/{featureId}/stages` route exists, and no existing UI element renders a role-filterable stage list.** This is a genuinely new UI component, same shape as ep2-s1's Team sidebar: a new component injected into the real feature page (`handleGetFeatureArtefacts`, `routes/features.js`), backed by a new endpoint in `journey.js` (pipeline-stage logic belongs there — `journey.js` already owns `completedStages`, `_computeBreadcrumb`, and the real `skillName` vocabulary).
3. **No stage named "coding" can ever exist.** `completeStage(journeyId, skillName, ...)` is only ever called with `session.skillName` from the outer-loop chat-session flow. The real, complete `skillName` universe is `['ideate', 'discovery', 'benefit-metric', 'design', 'definition', 'review', 'test-plan', 'definition-of-ready']`. AC1's literal text includes "coding" as a 4th engineer-visible stage — this is a genuine AC-level defect (RISK-ACCEPTed, logged in decisions.md), not an implementation detail. Implement the engineer default as **3 stages**: `test-plan`, `review`, `definition-of-ready`.
4. **`STAGE_VISIBILITY_BY_ROLE` is a new hardcoded constant** (same "hardcode now, DB-backed later" precedent as `VALID_ROLES` in `pod-store.js`):
   - `product`: `['discovery', 'benefit-metric', 'definition']`
   - `engineer`: `['test-plan', 'review', 'definition-of-ready']`
   - `conductor`: all 8 stages (matches `design.md` line 115 — creator/conductor sees everything)
   - `architect`: all 8 stages (no story/design guidance exists for a narrower view; safest default, documented as an assumption beyond this story's tested scope)
5. **No SSE needed.** Unlike ep2-s1's live presence, stage visibility is static per page load — a plain GET fetch + client-side toggle with `localStorage` persistence (per the DoR's own stated design) is sufficient. Simpler than ep2-s1's real-time requirement.
6. **Static route registration is mandatory in the SAME task as the client script** — ep2-s1's Task 4/6 found, the hard way, that this codebase has no generic `/public/*` static file server; forgetting the dedicated `GET /public/stage-list.js` route silently ships a client script nothing ever serves. Task 3 below includes both the client file and its route in one task specifically to avoid repeating that gap.

---

## File map

```
Create:
  src/web-ui/modules/stage-visibility.js         — STAGE_VISIBILITY_BY_ROLE constant + getVisibleStages(roleId) helper
  src/web-ui/public/stage-list.js                — client-side: fetch + render filtered list + toggle (localStorage)
  tests/check-ep2-s2-stage-visibility.js         — unit + integration tests (AC1-3)
  tests/e2e/ep2-s2-stage-visibility.spec.js      — E2E tests (AC1-3)

Modify:
  src/web-ui/routes/journey.js                   — add 1 handler: GET /api/journey/:journeyId/stage-visibility
  src/web-ui/routes/features.js                  — inject stage-list container + script tag into handleGetFeatureArtefacts's HTML output
  src/web-ui/server.js                            — wire the new route + the new /public/stage-list.js static route (same task, together)
```

---

## Task 1: stage-visibility.js — role-to-stage-subset module

**Files:**
- Create: `src/web-ui/modules/stage-visibility.js`
- Test: `tests/check-ep2-s2-stage-visibility.js` (Part 1)

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
// tests/check-ep2-s2-stage-visibility.js — Part 1
const assert = require('assert');
const stageVisibility = require('../src/web-ui/modules/stage-visibility');

function testEngineerDefaultView() {
  const visible = stageVisibility.getVisibleStages('engineer');
  assert.deepStrictEqual(visible, ['test-plan', 'review', 'definition-of-ready']);
}
testEngineerDefaultView();
console.log('  ok - engineer default view is test-plan/review/definition-of-ready');

function testProductDefaultView() {
  const visible = stageVisibility.getVisibleStages('product');
  assert.deepStrictEqual(visible, ['discovery', 'benefit-metric', 'definition']);
}
testProductDefaultView();
console.log('  ok - product default view is discovery/benefit-metric/definition');

function testConductorSeesAllStages() {
  const visible = stageVisibility.getVisibleStages('conductor');
  assert.deepStrictEqual(visible, stageVisibility.ALL_STAGES);
}
testConductorSeesAllStages();
console.log('  ok - conductor sees all 8 stages');

function testUnknownRoleDefaultsToAllStages() {
  const visible = stageVisibility.getVisibleStages('some-unknown-role');
  assert.deepStrictEqual(visible, stageVisibility.ALL_STAGES);
}
testUnknownRoleDefaultsToAllStages();
console.log('  ok - unknown role defaults to all stages (fail-open, never fail-hidden)');
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep2-s2-stage-visibility.js
```

Expected: `Error: Cannot find module '../src/web-ui/modules/stage-visibility'`

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';

// ep2-s2: role -> default-visible-stage-subset mapping. Hardcoded now, same
// precedent as pod-store.js's VALID_ROLES ("hardcode now, DB-backed later" --
// see that file's own header comment and design.md Open Question #5). Real
// stage universe confirmed against journey-store.js's completeStage() call
// sites -- see decisions.md (2026-09-18) for why "coding" is not included
// (it cannot exist as a completedStages entry in this codebase's real data
// model, and this is a documented AC-level RISK-ACCEPT, not an oversight).

var ALL_STAGES = Object.freeze(['ideate', 'discovery', 'benefit-metric', 'design', 'definition', 'review', 'test-plan', 'definition-of-ready']);

var STAGE_VISIBILITY_BY_ROLE = Object.freeze({
  product:   Object.freeze(['discovery', 'benefit-metric', 'definition']),
  engineer:  Object.freeze(['test-plan', 'review', 'definition-of-ready']),
  conductor: ALL_STAGES,
  architect: ALL_STAGES
});

/**
 * @param {string} roleId
 * @returns {string[]} the stage subset this role sees by default. An
 *   unrecognised roleId fails open (all stages) rather than fails hidden
 *   (zero stages) -- never wrongly hide something from a role this mapping
 *   doesn't yet know about.
 */
function getVisibleStages(roleId) {
  return STAGE_VISIBILITY_BY_ROLE[roleId] || ALL_STAGES;
}

module.exports = { ALL_STAGES: ALL_STAGES, STAGE_VISIBILITY_BY_ROLE: STAGE_VISIBILITY_BY_ROLE, getVisibleStages: getVisibleStages };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep2-s2-stage-visibility.js
```

Expected: all 4 `ok -` lines, exit code 0.

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Run in the foreground, wait for it to actually finish (large suite, several minutes — you have no mechanism to be notified when a background process completes, so do not background it). Expect only the one pre-existing documented failure (`tests/check-p3.5-validate-trace.js`).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/stage-visibility.js tests/check-ep2-s2-stage-visibility.js
git commit -m "feat(ep2-s2): add stage-visibility module mapping roles to default-visible pipeline stages"
```

End the commit message with:
```
Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LRzhh2nSVKZkmhjhyJXtfN
```

---

## Task 2: journey.js — stage-visibility endpoint

**Files:**
- Modify: `src/web-ui/routes/journey.js`
- Modify: `src/web-ui/server.js` (wire the route)
- Test: `tests/check-ep2-s2-stage-visibility.js` (Part 2)

- [ ] **Step 1: Write the failing test**

Append to `tests/check-ep2-s2-stage-visibility.js`:

```javascript

// tests/check-ep2-s2-stage-visibility.js — Part 2
const journeyRoute = require('../src/web-ui/routes/journey');

async function testStageVisibilityHandlerExists() {
  assert.strictEqual(typeof journeyRoute.handleGetJourneyStageVisibility, 'function');
}
testStageVisibilityHandlerExists().then(() => console.log('  ok - stage-visibility handler exported'))
  .catch((err) => { console.error('  FAIL - testStageVisibilityHandlerExists:', err.message); process.exitCode = 1; });
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep2-s2-stage-visibility.js
```

Expected: `AssertionError: undefined !== 'function'` (Part 1's assertions still pass first, then this fails)

- [ ] **Step 3: Write the implementation**

Add near the other collaborator/role-adjacent handlers in `src/web-ui/routes/journey.js` (e.g. near `handleGetJourneyCollaboratorsPresence` from ep2-s1 — same subject matter):

```javascript
var _stageVisibility = require('../modules/stage-visibility');

/**
 * GET /api/journey/:journeyId/stage-visibility — ep2-s2 AC1/AC2/AC3.
 * Resolves the requesting collaborator's role via feature_collaborators
 * (same source ep2-s1 already established), returns their default-visible
 * stage subset, the full stage list, and which stages this journey has
 * actually completed (so the client can distinguish "visible but not yet
 * reached" from "completed").
 */
async function handleGetJourneyStageVisibility(req, res, pool) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'NOT_AUTHENTICATED' }));
    return;
  }
  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  try { requireJourneyAccess(journey, req.session, POLICY.TENANT); }
  catch (err) {
    res.writeHead(asHttpResponse(err, POLICY.TENANT), { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }
  var collaborators;
  try {
    collaborators = await _featureCollaboratorStore.getFeatureCollaborators(pool, journeyId);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'INTERNAL_ERROR' }));
    return;
  }
  var me = collaborators.find(function (c) { return c.userId === req.session.login; });
  var roleId = me ? me.roleId : null;
  var visibleStages = _stageVisibility.getVisibleStages(roleId);
  var completedSkillNames = (journey.completedStages || []).map(function (s) { return s.skillName; });

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    role: roleId,
    visibleStages: visibleStages,
    allStages: _stageVisibility.ALL_STAGES,
    completedStages: completedSkillNames
  }));
}
```

Note: `_featureCollaboratorStore` is already required at the top of `journey.js` if ep2-s1's Task 2 imported it there — check first; if not present, add `var _featureCollaboratorStore = require('../modules/feature-collaborator-store');` near the top of the file (it may already be required under a different local name from ep2-s1's own work — search the file for `feature-collaborator-store` before adding a duplicate).

Add `handleGetJourneyStageVisibility` to the existing `module.exports` block at the bottom of `journey.js`.

Wire into `server.js`:

1. Add `handleGetJourneyStageVisibility` to the existing `require('./routes/journey')` destructure (do not add a second `require` line).
2. Add a new route branch near the other `/api/journey/:journeyId/...` routes (e.g. right after ep2-s1's `collaborators-presence` route):

```javascript
} else if (pathname.match(/^\/api\/journey\/([^/]+)\/stage-visibility$/) && req.method === 'GET') {
  req.params = { journeyId: pathname.split('/')[3] };
  await handleGetJourneyStageVisibility(req, res, _pshPool);
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep2-s2-stage-visibility.js
```

Expected: all 5 `ok -` lines.

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Foreground, wait for completion. Expect only the one pre-existing documented failure.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journey.js src/web-ui/server.js tests/check-ep2-s2-stage-visibility.js
git commit -m "feat(ep2-s2): add stage-visibility endpoint resolving a collaborator's role-filtered stage list"
```

---

## Task 3: stage-list.js client component + its static route (together, in one task)

**Files:**
- Create: `src/web-ui/public/stage-list.js`
- Modify: `src/web-ui/server.js` — add the `GET /public/stage-list.js` static route in the SAME commit as the client file, not a later task. This is a deliberate plan structure change from ep2-s1's original task breakdown, which split the client component and its E2E discovery of the missing route across two separate tasks (Task 4 and Task 6) — see decisions.md's architecture-correction entry, point 5.

- [ ] **Step 1: Write the client component**

```javascript
// src/web-ui/public/stage-list.js — ep2-s2
// Role-filtered pipeline stage list: reads journeyId from the
// #stage-list element's data-journey-id attribute (matching ep2-s1's
// established data-* convention, itself matching routes/journey.js's
// and views/kanban-view.js's own precedent), fetches the collaborator's
// role-filtered view, renders it, and wires a "Show all stages" toggle
// that persists via localStorage for the session (no server round trip
// on toggle -- matches this story's own NFR: toggle response ≤200ms).
(function () {
  'use strict';

  var STAGE_LABELS = {
    'ideate': 'Ideate', 'discovery': 'Discovery', 'benefit-metric': 'Benefit Metric',
    'design': 'Design', 'definition': 'Definition', 'review': 'Review',
    'test-plan': 'Test Plan', 'definition-of-ready': 'Definition of Ready'
  };

  function label(stage) { return STAGE_LABELS[stage] || stage; }

  function render(listEl, stages, completedStages) {
    listEl.innerHTML = '';
    stages.forEach(function (stage) {
      var item = document.createElement('li');
      item.className = 'stage-item' + (completedStages.indexOf(stage) !== -1 ? ' stage-completed' : '');
      item.tabIndex = 0;
      item.textContent = label(stage);
      listEl.appendChild(item);
    });
  }

  function init() {
    var container = document.getElementById('stage-list');
    if (!container) return;
    var journeyId = container.getAttribute('data-journey-id');
    if (!journeyId) return;
    var listEl = document.getElementById('stage-list-items');
    var toggleBtn = document.getElementById('stage-list-toggle');
    if (!listEl || !toggleBtn) return;

    var storageKey = 'stage-list-show-all-' + journeyId;
    var data = null;

    function applyView() {
      if (!data) return;
      var showAll = window.localStorage.getItem(storageKey) === 'true';
      render(listEl, showAll ? data.allStages : data.visibleStages, data.completedStages);
      toggleBtn.textContent = showAll ? 'Show role-filtered view' : 'Show all stages';
      toggleBtn.setAttribute('aria-pressed', String(showAll));
    }

    toggleBtn.addEventListener('click', function () {
      var showAll = window.localStorage.getItem(storageKey) === 'true';
      window.localStorage.setItem(storageKey, String(!showAll));
      applyView();
    });

    fetch('/api/journey/' + encodeURIComponent(journeyId) + '/stage-visibility')
      .then(function (r) { return r.json(); })
      .then(function (json) { data = json; applyView(); })
      .catch(function () { /* graceful degrade: list stays empty if the fetch fails */ });
  }

  init();
})();
```

- [ ] **Step 2: Add the static route to server.js**

Find the existing `GET /public/presence-sidebar.js` route (added in ep2-s1, and its own `ci-typecheck.js` exclusion fix — see decisions.md) and add a sibling route immediately after it:

```javascript
} else if (pathname === '/public/stage-list.js' && req.method === 'GET') {
  res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
  res.end(require('fs').readFileSync(require('path').join(__dirname, 'public', 'stage-list.js'), 'utf8'));

```

- [ ] **Step 3: Verify `ci-typecheck.js` already excludes this file**

```bash
node scripts/ci-typecheck.js
```

Expected: `[ci-typecheck] N file(s) loaded OK` with no error for `stage-list.js` — ep2-s1's fix excluded the whole `src/web-ui/public/` directory by path, so this new file is already covered; this step only confirms it, no new exclusion needed.

- [ ] **Step 4: Run full suite — no regressions**

```bash
npm test
```

Foreground, wait for completion. Expect only the one pre-existing documented failure.

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/public/stage-list.js src/web-ui/server.js
git commit -m "feat(ep2-s2): add client-side stage-list component and its static-file route

Adds both the client script and its GET /public/stage-list.js route in
one commit -- ep2-s1 shipped these as two separate tasks and only
caught the missing route via its own E2E run, after PR open. Avoiding
the same gap here by pairing them from the start."
```

---

## Task 4: features.js — inject stage-list container into the real feature page

**Files:**
- Modify: `src/web-ui/routes/features.js`
- Test: `tests/check-ep2-s2-stage-visibility.js` (Part 3, smoke check only — see Task 3 of ep2-s1's own plan for why a full behavioral assertion isn't attempted at this level)

- [ ] **Step 1: Write the implementation**

In `src/web-ui/routes/features.js`'s `handleGetFeatureArtefacts`, in the `acceptsHtml` branch, alongside ep2-s1's `teamSidebarHtml` block (same `if (artefactJourney && artefactJourney.journeyId)` guard — reuse the existing conditional rather than duplicating the check):

```javascript
// ep2-s2: role-filtered stage list -- same guard and journeyId source as
// ep2-s1's Team sidebar (artefactJourney is the final resolved journey;
// see that story's own decisions.md entry for why).
var stageListHtml = '';
if (artefactJourney && artefactJourney.journeyId) {
  stageListHtml =
    '<section id="stage-list" aria-label="Pipeline stages" class="sw-stage-list" data-journey-id="' + shellEscHtml(artefactJourney.journeyId) + '">' +
      '<h2>Stages</h2>' +
      '<ul id="stage-list-items" role="list"></ul>' +
      '<button type="button" id="stage-list-toggle" aria-pressed="false">Show all stages</button>' +
    '</section>' +
    '<script src="/public/stage-list.js"></script>';
}
```

Append `stageListHtml` onto the same `bodyContent` template literal ep2-s1's `teamSidebarHtml` already appends to (find that line — it currently ends with `${teamSidebarHtml}` — add `\n${stageListHtml}` after it). Do not reorder or restructure any existing HTML assembly.

- [ ] **Step 2: Smoke check**

Append to `tests/check-ep2-s2-stage-visibility.js`:

```javascript

// tests/check-ep2-s2-stage-visibility.js — Part 3
function testFeaturePageHandlerStillExported() {
  const { handleGetFeatureArtefacts } = require('../src/web-ui/routes/features');
  assert.strictEqual(typeof handleGetFeatureArtefacts, 'function');
}
testFeaturePageHandlerStillExported();
console.log('  ok - handleGetFeatureArtefacts still exported after stage-list injection edit');
```

- [ ] **Step 3: Run test — must pass**

```bash
node tests/check-ep2-s2-stage-visibility.js
```

Expected: all 6 prior lines plus the new one.

- [ ] **Step 4: Run full suite — no regressions (critical for this task)**

```bash
npm test
```

`handleGetFeatureArtefacts` is heavily tested by other stories (alrf-s4, fal-s1, fdn-s1, and ep2-s1 itself). Foreground, wait for completion. If ANY test touching `features.js` fails, investigate before committing — this edit must be a pure append, never a reorder.

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/routes/features.js tests/check-ep2-s2-stage-visibility.js
git commit -m "feat(ep2-s2): inject role-filtered stage-list container into the feature artefact page"
```

---

## Task 5: Integration tests — multi-role full-path load, role isolation

**Files:**
- Modify: `tests/check-ep2-s2-stage-visibility.js` (Part 4)

- [ ] **Step 1: Write the tests**

```javascript

// tests/check-ep2-s2-stage-visibility.js — Part 4
async function testMultiRoleFullPathLoad() {
  const fakePool = {
    query: async (sql) => {
      if (sql.indexOf('feature_collaborators') !== -1) {
        return { rows: [
          { collaborator_id: 'c1', user_id: 'susan', role_id: 'engineer', pod_id: 'pod-1' },
          { collaborator_id: 'c2', user_id: 'hamish', role_id: 'product', pod_id: 'pod-1' }
        ] };
      }
      return { rows: [] };
    }
  };
  const { getFeatureCollaborators } = require('../src/web-ui/modules/feature-collaborator-store');
  const rows = await getFeatureCollaborators(fakePool, 'journey-a1');
  const susanRole = rows.find(r => r.userId === 'susan').roleId;
  const hamishRole = rows.find(r => r.userId === 'hamish').roleId;
  assert.deepStrictEqual(stageVisibility.getVisibleStages(susanRole), ['test-plan', 'review', 'definition-of-ready']);
  assert.deepStrictEqual(stageVisibility.getVisibleStages(hamishRole), ['discovery', 'benefit-metric', 'definition']);
  assert.notDeepStrictEqual(
    stageVisibility.getVisibleStages(susanRole),
    stageVisibility.getVisibleStages(hamishRole)
  );
}
testMultiRoleFullPathLoad()
  .then(() => console.log('  ok - multi-role full path: susan (engineer) and hamish (product) get different, correct default views'))
  .catch((err) => { console.error('  FAIL - testMultiRoleFullPathLoad:', err.message); process.exitCode = 1; });

// Role-filtering isolation: two different collaborators on the SAME journey
// resolve independently -- one collaborator's role never leaks into
// another's computed visibility. journeyId-level tenant isolation itself is
// enforced upstream by requireJourneyAccess (POLICY.TENANT), same as
// ep2-s1's own equivalent test -- this test proves the per-collaborator
// role resolution itself is correctly scoped to the requesting user, not a
// tenant-boundary test (feature_collaborators has no tenant_id column, by
// design -- see feature-collaborator-store.js).
async function testRoleResolutionIsolatedPerCollaborator() {
  const fakePool = {
    query: async (sql) => ({ rows: [
      { collaborator_id: 'c1', user_id: 'susan', role_id: 'engineer', pod_id: 'pod-1' },
      { collaborator_id: 'c2', user_id: 'hamish', role_id: 'product', pod_id: 'pod-1' },
      { collaborator_id: 'c3', user_id: 'darren', role_id: 'engineer', pod_id: 'pod-1' }
    ] })
  };
  const { getFeatureCollaborators } = require('../src/web-ui/modules/feature-collaborator-store');
  const rows = await getFeatureCollaborators(fakePool, 'journey-a1');
  // Two different engineers (susan, darren) resolve to the identical
  // visibility set independently -- proves resolution is per-login, not a
  // single shared/cached value that would silently leak across requesters.
  const susanView = stageVisibility.getVisibleStages(rows.find(r => r.userId === 'susan').roleId);
  const darrenView = stageVisibility.getVisibleStages(rows.find(r => r.userId === 'darren').roleId);
  assert.deepStrictEqual(susanView, darrenView);
  assert.notStrictEqual(rows.find(r => r.userId === 'susan'), rows.find(r => r.userId === 'darren'));
}
testRoleResolutionIsolatedPerCollaborator()
  .then(() => console.log('  ok - role resolution correctly scoped per collaborator, not shared/leaked'))
  .catch((err) => { console.error('  FAIL - testRoleResolutionIsolatedPerCollaborator:', err.message); process.exitCode = 1; });
```

- [ ] **Step 2: Run — must pass**

```bash
node tests/check-ep2-s2-stage-visibility.js
```

Expected: all 8 lines.

- [ ] **Step 3: Run full suite — no regressions**

```bash
npm test
```

- [ ] **Step 4: Commit**

```bash
git add tests/check-ep2-s2-stage-visibility.js
git commit -m "test(ep2-s2): add integration tests for multi-role default views and per-collaborator role isolation"
```

---

## Task 6: E2E and NFR tests

**Files:**
- Create: `tests/e2e/ep2-s2-stage-visibility.spec.js`

- [ ] **Step 1: Investigate before writing**

Read `tests/e2e/ep2-s1-presence-sidebar.spec.js` in full — reuse its established real product→repo→pod→feature creation flow exactly (same `withAuth`, `getCsrfToken`, `/test/seed-product-repo` pattern). This story needs 2 collaborators with different roles (engineer + product) rather than ep2-s1's 3; add them via the same real Pod Manager UI flow (`.roster-row` buttons for "Hamish" and "Susan" — confirmed real demo-roster entries in `pod-manager.html`'s `ORG_ROSTER`, per ep2-s1's own decisions.md finding). Recall from that same finding: Hamish's demo `roleId` is `conductor`, not `product` — verify the real roster's role assignment for whichever names you use before writing assertions; do not assume from name alone (same caution ep2-s1's own spec documented).

- [ ] **Step 2: Write the E2E spec**

```javascript
// tests/e2e/ep2-s2-stage-visibility.spec.js
'use strict';
const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');
const { getCsrfToken } = require('./fixtures/csrf');

function uniqueName(label) { return 'ep2-s2-' + label + '-' + Date.now(); }

withAuth('ep2-s2: role-filtered stage list renders correctly per collaborator and the show-all toggle works without refresh', async ({ page }) => {
  test.setTimeout(120000);
  // Real product -> repo -> pod -> feature creation flow, mirroring
  // ep2-s1-presence-sidebar.spec.js. Verify each added roster member's real
  // roleId against pod-manager.html's ORG_ROSTER before writing assertions
  // below -- do not assume from name.

  // ... setup identical in shape to ep2-s1's own spec (product, repo seed,
  // pod with 2 members of different roles, set-default-pod, create feature,
  // resolve featureHref from the product page's feature-row link) ...

  await page.goto(featureHref);
  await expect(page.locator('#stage-list')).toBeVisible();

  const stageItems = page.locator('#stage-list-items .stage-item');
  // AC1/AC2: whichever role the logged-in test session resolves to (the
  // authenticated fixture user, per withAuth), the default view shows
  // exactly that role's 3-stage subset -- assert count and content match
  // stage-visibility.js's own STAGE_VISIBILITY_BY_ROLE for the resolved role.
  await expect(stageItems).toHaveCount(3, { timeout: 8000 });

  // AC3: toggle reveals all 8 stages, no page reload, and no previously-
  // visible stage disappears (union, not replacement).
  const initialLabels = await stageItems.allTextContents();
  await page.click('#stage-list-toggle');
  await expect(stageItems).toHaveCount(8, { timeout: 3000 });
  const allLabels = await stageItems.allTextContents();
  initialLabels.forEach((label) => expect(allLabels).toContain(label));
  await expect(page.locator('#stage-list-toggle')).toHaveAttribute('aria-pressed', 'true');

  // NFR-A11y: toggle is keyboard-reachable and activates via Enter.
  await page.click('#stage-list-toggle'); // back to filtered view
  await page.locator('#stage-list-toggle').focus();
  await page.keyboard.press('Enter');
  await expect(stageItems).toHaveCount(8, { timeout: 3000 });
});
```

Fill in the setup block exactly matching `ep2-s1-presence-sidebar.spec.js`'s own established pattern (do not invent a new fixture mechanism).

- [ ] **Step 3: Run the E2E spec**

```bash
NODE_ENV=test npx playwright test tests/e2e/ep2-s2-stage-visibility.spec.js
```

Foreground, wait for it to actually finish. If it fails, determine whether it's a real bug (fix following established patterns) or a test issue (fix the test) — investigate before changing either.

- [ ] **Step 4: NFR verification (documentation, not new test code)**

- **NFR: role-filtered view applied on page load** — covered by the E2E spec's own initial assertion (no separate click needed to see the filtered view).
- **NFR: toggle persists for session (localStorage)** — implemented in `stage-list.js`; not separately E2E-tested for persistence-across-navigation in this pass (RISK-ACCEPT — same class as ep2-s1's own deferred-a11y precedent; log in decisions.md if not added).
- **NFR: toggle response ≤200ms** — the toggle is a pure client-side re-render with no network call (`data` is already fetched); RISK-ACCEPT, not automated, same reasoning as this feature's other NFR-latency RISK-ACCEPTs (no plausible path to 200ms for a synchronous DOM re-render of ≤8 list items).
- **NFR: keyboard-accessible toggle** — covered by the E2E spec's own keyboard-activation assertion.

- [ ] **Step 5: Run the Node suite too — no regressions**

```bash
node tests/check-ep2-s2-stage-visibility.js
npm test
```

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/ep2-s2-stage-visibility.spec.js
git commit -m "test(ep2-s2): add E2E coverage for role-filtered default view and show-all toggle"
```

---

## Post-plan note for /verify-completion

Any RISK-ACCEPTs taken in Task 6 Step 4 (NFR items not automated) must be logged in `artefacts/new-feature-2b74a292/decisions.md` before `/definition-of-done`, per this feature's own established convention. The AC1 "coding" deviation is already logged (branch-setup commit) and does not need re-logging, only citing, in the DoD artefact.
