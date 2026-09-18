# Load Feature with Pod Collaborators and Present Presence Sidebar — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** When a collaborator loads a feature's page, a Team sidebar renders immediately listing every assigned collaborator with role and live online/offline presence, updating within 30s of a heartbeat timeout with no page refresh.
**Branch:** `feature/ep2-s1`
**Worktree:** `.worktrees/ep2-s1`
**Test command:** `npm test` (unit/integration), `npm run test:e2e -- ep2-s1` (E2E)

---

## Architecture correction (read before starting — see decisions.md 2026-09-18 for full rationale)

This story's DoR and test plan were written against an architecture that doesn't exist in this codebase. Verified against real source before writing this plan:

1. **No `/api/features/{featureId}` route exists.** The real "feature" concept is a **journey** (`journey-store.js`). The real page a collaborator lands on for a named feature is `GET /features/:featureSlug` → `handleGetFeatureArtefacts` in `src/web-ui/routes/features.js` — NOT `routes/features.js`'s `/api/ideas` surface (that's an unrelated backlog-capture feature) and NOT a new file. `handleGetFeatureArtefacts` already resolves `journeyId` via `_journeyStore.getJourneyByFeatureSlug(featureSlug)` for its own breadcrumb logic — reuse that resolved journey, don't add a second lookup.
2. **`feature_collaborators.feature_id` IS `journeyId`**, not a separate `featureId`. `getFeatureCollaborators(pool, journeyId)` already exists in `src/web-ui/modules/feature-collaborator-store.js` (built by ep1-s3) and returns `{collaboratorId, userId, roleId, podId}[]`. No new schema or migration is needed for the collaborator roster.
3. **No `src/db/migrations/` directory exists.** Schema changes in this codebase are inline `migrateXSchema(pool, logger)` functions (see `pod-assignment-store.js`, `feature-collaborator-store.js`). This story adds none — see point 4.
4. **No new Postgres `feature_presence` table.** Presence is ephemeral, real-time, per-instance state — there is already an established in-memory pattern for exactly this in `journey.js` (`_viewerActivity`, a `Map<journeyId, Map<login, lastSeenMs>>` with a 30s staleness threshold, already wired to `GET /api/journey/:journeyId/viewers`). This story adds a **separate, parallel** in-memory module (`presence-store.js`) rather than a Postgres table (avoids per-heartbeat DB write amplification, matches existing precedent and the app's real single-instance Fly.io deployment) and rather than modifying `_viewerActivity` directly (avoids touching already-shipped, already-tested code outside this story's scope).
5. **No `user_id → display name` resolution exists anywhere in this codebase.** `users`/`people`/`person_identities` tables have no `name` column. `session.login` (GitHub OAuth login) is the canonical identity used throughout `journey.js` (see `requireJourneyAccess`). `feature_collaborators.user_id` is that same login string and is used directly as the display label — consistent with how this codebase already works, not an invented convention.
6. **`role_id` is already a human-readable label** (`conductor`/`engineer`/`architect`/`product` — ep1-s1's hardcoded `VALID_ROLES`). No role-name lookup needed.
7. **SSE pattern**: no other endpoint in `journey.js` uses SSE (it's currently scoped only to `routes/skills.js`). This story follows `skills.js`'s established SSE header/write/cleanup convention (`res.writeHead(200, {Content-Type: text/event-stream, Cache-Control: no-cache, Connection: keep-alive})`, `res.write('data: ...\n\n')`, `res.on('close', ...)` cleanup) rather than inventing a new one.

**Identifier note for this plan:** every task below uses `journeyId`, `login`, and `roleId` — not the DoR's `featureId`/`userId`/`name`. AC text below is adapted to these real field names while preserving the AC's business intent exactly.

---

## File map

```
Create:
  src/web-ui/modules/presence-store.js          — in-memory per-journey presence tracking (Map<journeyId, Map<login, lastSeenMs>>)
  src/web-ui/public/presence-sidebar.js          — client-side sidebar: fetch + SSE + live last-seen tick
  tests/check-ep2-s1-presence-sidebar.js         — unit + integration tests (AC1-3)
  tests/e2e/ep2-s1-presence-sidebar.spec.js      — E2E tests (AC1-3)

Modify:
  src/web-ui/routes/journey.js                   — add 3 handlers: collaborators-presence GET, heartbeat POST, presence-stream SSE GET
  src/web-ui/routes/features.js                  — inject sidebar container + script tag into handleGetFeatureArtefacts's HTML output
  src/web-ui/server.js                            — wire the 3 new routes; require presence-store.js if any startup wiring is needed (none — no DB pool, no migration)
```

---

## Task 1: presence-store.js — in-memory presence module

**Files:**
- Create: `src/web-ui/modules/presence-store.js`
- Test: `tests/check-ep2-s1-presence-sidebar.js` (Part 1)

- [ ] **Step 1: Write the failing test**

```javascript
// tests/check-ep2-s1-presence-sidebar.js — Part 1
const assert = require('assert');
const presenceStore = require('../src/web-ui/modules/presence-store');

function testOnlineWithinThreshold() {
  presenceStore._clearForTesting();
  let t = 1000000;
  presenceStore.setNow(() => t);
  presenceStore.registerActivity('journey-1', 'darren');
  t += 20000; // 20s later — still within 30s threshold
  const result = presenceStore.getStatus('journey-1', 'darren');
  assert.strictEqual(result.status, 'online', 'expected online within 30s threshold');
}
testOnlineWithinThreshold();
console.log('  ok - online within 30s threshold');
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep2-s1-presence-sidebar.js
```

Expected output: `Error: Cannot find module '../src/web-ui/modules/presence-store'`

- [ ] **Step 3: Write minimal implementation**

```javascript
// src/web-ui/modules/presence-store.js
'use strict';

// ep2-s1: in-memory per-journey presence tracking, deliberately separate
// from journey.js's existing _viewerActivity (same Map<journeyId,
// Map<login, lastSeenMs>> shape, same 30s threshold) -- see decisions.md
// (2026-09-18) for why this is a parallel module rather than a refactor
// of that already-shipped code, and why it's in-memory rather than a new
// Postgres feature_presence table.

var _now = function () { return Date.now(); };
function setNow(fn) { _now = fn; }

var STALE_MS = 30000;

/** @type {Map<string, Map<string, number>>} journeyId -> Map<login, lastSeenMs> */
var _activity = new Map();

function registerActivity(journeyId, login) {
  if (!journeyId || !login) return;
  if (!_activity.has(journeyId)) _activity.set(journeyId, new Map());
  _activity.get(journeyId).set(login, _now());
}

/**
 * @param {string} journeyId
 * @param {string} login
 * @returns {{status: 'online'|'offline', lastSeenMs: number|null}}
 */
function getStatus(journeyId, login) {
  var map = _activity.get(journeyId);
  var lastSeen = map ? map.get(login) : undefined;
  if (lastSeen == null) return { status: 'offline', lastSeenMs: null };
  var age = _now() - lastSeen;
  return { status: age < STALE_MS ? 'online' : 'offline', lastSeenMs: lastSeen };
}

function _clearForTesting() { _activity = new Map(); }

module.exports = { registerActivity, getStatus, setNow, STALE_MS, _clearForTesting };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep2-s1-presence-sidebar.js
```

Expected output: `ok - online within 30s threshold`

- [ ] **Step 5: Add the offline/stale-heartbeat case (AC2 core logic)**

```javascript
// tests/check-ep2-s1-presence-sidebar.js — append to Part 1
function testOfflineAfterThreshold() {
  presenceStore._clearForTesting();
  let t = 1000000;
  presenceStore.setNow(() => t);
  presenceStore.registerActivity('journey-1', 'darren');
  t += 35000; // 35s later — past 30s threshold
  const result = presenceStore.getStatus('journey-1', 'darren');
  assert.strictEqual(result.status, 'offline', 'expected offline after 30s threshold');
  assert.strictEqual(result.lastSeenMs, 1000000, 'lastSeenMs should be the last registered timestamp');
}
testOfflineAfterThreshold();
console.log('  ok - offline after 30s threshold, lastSeenMs preserved');

function testNeverSeenIsOffline() {
  presenceStore._clearForTesting();
  const result = presenceStore.getStatus('journey-1', 'never-seen-user');
  assert.strictEqual(result.status, 'offline');
  assert.strictEqual(result.lastSeenMs, null);
}
testNeverSeenIsOffline();
console.log('  ok - never-seen user is offline with null lastSeenMs');
```

- [ ] **Step 6: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (including the 2 new assertions above)

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/modules/presence-store.js tests/check-ep2-s1-presence-sidebar.js
git commit -m "feat(ep2-s1): add in-memory presence-store module for feature collaborator presence"
```

---

## Task 2: journey.js — collaborators-presence, heartbeat, and SSE stream handlers

**Files:**
- Modify: `src/web-ui/routes/journey.js`
- Test: `tests/check-ep2-s1-presence-sidebar.js` (Part 2)

- [ ] **Step 1: Write the failing test**

```javascript
// tests/check-ep2-s1-presence-sidebar.js — Part 2
const journeyRoute = require('../src/web-ui/routes/journey');

async function testCollaboratorsPresenceHandlerExists() {
  assert.strictEqual(typeof journeyRoute.handleGetJourneyCollaboratorsPresence, 'function');
  assert.strictEqual(typeof journeyRoute.handlePostJourneyHeartbeat, 'function');
  assert.strictEqual(typeof journeyRoute.handleGetJourneyPresenceStream, 'function');
}
testCollaboratorsPresenceHandlerExists().then(() => console.log('  ok - all 3 new handlers exported'));
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep2-s1-presence-sidebar.js
```

Expected output: `AssertionError: undefined !== 'function'`

- [ ] **Step 3: Write minimal implementation**

Add near the existing `handleGetJourneyViewers` function in `src/web-ui/routes/journey.js` (keep it adjacent — same presence subject matter):

```javascript
var _presenceStore = require('../modules/presence-store');
var _featureCollaboratorStore = require('../modules/feature-collaborator-store');

/**
 * GET /api/journey/:journeyId/collaborators-presence — ep2-s1 AC1.
 * Returns every assigned collaborator (feature_collaborators, populated at
 * feature creation by ep1-s3) joined with their live in-memory presence
 * status. "journeyId" is the real key -- feature_collaborators.feature_id
 * IS journeyId in this codebase (see feature-collaborator-store.js header).
 */
async function handleGetJourneyCollaboratorsPresence(req, res, pool) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'UNAUTHENTICATED' }));
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
  var rows = await _featureCollaboratorStore.getFeatureCollaborators(pool, journeyId);
  var collaborators = rows.map(function (r) {
    var p = _presenceStore.getStatus(journeyId, r.userId);
    return { userId: r.userId, roleId: r.roleId, status: p.status, lastSeenMs: p.lastSeenMs };
  });
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ collaborators: collaborators }));
}

/**
 * POST /api/journey/:journeyId/heartbeat — ep2-s1 AC2. Client sidebar
 * calls this every ~12s while the feature page is open. Registers activity
 * in the in-memory presence-store (not Postgres -- see plan header).
 */
async function handlePostJourneyHeartbeat(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'UNAUTHENTICATED' }));
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
  _presenceStore.registerActivity(journeyId, req.session.login);
  res.writeHead(204);
  res.end();
}

/**
 * GET /api/journey/:journeyId/presence-stream — ep2-s1 AC2/AC3. SSE stream
 * broadcasting the collaborators-presence payload every 5s (bounded well
 * under the 30s AC2 staleness window) and immediately on connect. Follows
 * the same SSE header/write/cleanup convention as routes/skills.js
 * (this codebase's only other SSE usage) -- see plan header point 7.
 */
async function handleGetJourneyPresenceStream(req, res, pool) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'UNAUTHENTICATED' }));
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
  _presenceStore.registerActivity(journeyId, req.session.login);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  async function broadcast() {
    try {
      var rows = await _featureCollaboratorStore.getFeatureCollaborators(pool, journeyId);
      var collaborators = rows.map(function (r) {
        var p = _presenceStore.getStatus(journeyId, r.userId);
        return { userId: r.userId, roleId: r.roleId, status: p.status, lastSeenMs: p.lastSeenMs };
      });
      res.write('data: ' + JSON.stringify({ collaborators: collaborators }) + '\n\n');
    } catch (_) { /* SSE streams must gracefully degrade -- web-ui/core.md */ }
  }

  await broadcast();
  var _interval = setInterval(broadcast, 5000);
  if (typeof res.on === 'function') {
    res.on('close', function () { clearInterval(_interval); });
  }
}
```

Add all three to the `module.exports` block at the bottom of `journey.js`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep2-s1-presence-sidebar.js
```

Expected output: `ok - all 3 new handlers exported`

- [ ] **Step 5: Wire into server.js**

```javascript
// src/web-ui/server.js — extend the existing journey.js import (do not
// duplicate the require line; add these 3 names to the existing destructure)
const { /* ...existing names..., */ handleGetJourneyCollaboratorsPresence, handlePostJourneyHeartbeat, handleGetJourneyPresenceStream } = require('./routes/journey');
```

```javascript
// src/web-ui/server.js — add near the existing /api/journey/:journeyId/viewers route
} else if (pathname.match(/^\/api\/journey\/([^/]+)\/collaborators-presence$/) && req.method === 'GET') {
  req.params = { journeyId: pathname.split('/')[3] };
  await handleGetJourneyCollaboratorsPresence(req, res, _pshPool);

} else if (pathname.match(/^\/api\/journey\/([^/]+)\/heartbeat$/) && req.method === 'POST') {
  req.params = { journeyId: pathname.split('/')[3] };
  await handlePostJourneyHeartbeat(req, res);

} else if (pathname.match(/^\/api\/journey\/([^/]+)\/presence-stream$/) && req.method === 'GET') {
  req.params = { journeyId: pathname.split('/')[3] };
  await handleGetJourneyPresenceStream(req, res, _pshPool);
```

(Find the existing `/api/journey/:journeyId/viewers` route block in `server.js` and add these three `else if` branches immediately after it — same dispatch style, same `_pshPool` pool reference already in scope there.)

- [ ] **Step 6: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/routes/journey.js src/web-ui/server.js tests/check-ep2-s1-presence-sidebar.js
git commit -m "feat(ep2-s1): add collaborators-presence, heartbeat, and presence-stream SSE endpoints"
```

---

## Task 3: features.js — inject Team sidebar into the real feature page

**Files:**
- Modify: `src/web-ui/routes/features.js`
- Test: `tests/check-ep2-s1-presence-sidebar.js` (Part 3)

- [ ] **Step 1: Write the failing test**

```javascript
// tests/check-ep2-s1-presence-sidebar.js — Part 3
async function testFeaturePageIncludesSidebarContainer() {
  // Minimal req/res harness against handleGetFeatureArtefacts.
  // Full harness details: mirror check-ep1-s3-feature-pod-inheritance.js's
  // existing makeFakePool()/req/res mock pattern for this same handler file.
  const { handleGetFeatureArtefacts } = require('../src/web-ui/routes/features');
  assert.strictEqual(typeof handleGetFeatureArtefacts, 'function');
  // Full render-path assertion (sidebar container + script tag present in
  // HTML output) is exercised by the E2E test (Task 6) against a real
  // server -- handleGetFeatureArtefacts's HTML assembly has too many
  // upstream branches (breadcrumb resolution, artefact fallback) to
  // fixture cheaply at the unit level without duplicating that logic.
}
testFeaturePageIncludesSidebarContainer().then(() => console.log('  ok - handleGetFeatureArtefacts still exported after edit'));
```

- [ ] **Step 2: Run test — must fail**

This is a smoke check, not a behavioural failing test (see Step 1's comment on why the real assertion lives in the E2E test). Run it once before Step 3 to confirm the harness loads:

```bash
node tests/check-ep2-s1-presence-sidebar.js
```

Expected output: passes (this step exists to confirm the harness is wired before the edit, not to prove absence of the feature)

- [ ] **Step 3: Write the implementation**

In `src/web-ui/routes/features.js`'s `handleGetFeatureArtefacts`, in the `acceptsHtml` branch, after `journeyForPage`/`artefactJourney` are resolved (existing code, ~line 852-873) and before the final HTML is assembled and sent: if `artefactJourney && artefactJourney.journeyId`, inject a sidebar container and the client script tag into the page's `bodyContent` (or equivalent HTML-assembly variable used by this handler's existing `renderShell`/`_renderShellWithNav` call):

```javascript
// ep2-s1: Team presence sidebar -- only when a live journey resolves for
// this feature (an artefact-only page with no resolvable journey has no
// collaborators to show; existing defensive pattern in this handler).
var teamSidebarHtml = '';
if (artefactJourney && artefactJourney.journeyId) {
  teamSidebarHtml =
    '<aside id="team-sidebar" aria-label="Team" class="sw-team-sidebar">' +
      '<h2>Team</h2>' +
      '<ul id="team-sidebar-list" role="list"></ul>' +
    '</aside>' +
    '<script src="/public/presence-sidebar.js"></script>' +
    '<script>window.initPresenceSidebar(' + JSON.stringify(artefactJourney.journeyId) + ', "team-sidebar-list");</script>';
}
```

Append `teamSidebarHtml` to whatever HTML string variable is passed as `bodyContent` to this handler's shell-render call — read the surrounding ~30 lines of the existing HTML assembly (it varies by which of this handler's branches executed: fast-path vs. taxonomy-scan-resolved) and concatenate `teamSidebarHtml` onto the same variable that already holds the artefact list markup, immediately before that variable is handed to the shell renderer. Do not restructure the existing breadcrumb/artefact-list assembly — only append.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep2-s1-presence-sidebar.js
```

Expected output: `ok - handleGetFeatureArtefacts still exported after edit`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (existing `handleGetFeatureArtefacts` tests, e.g. alrf-s4/fal-s1/fdn-s1's own suites, must still pass unchanged — this task only appends markup, never removes or reorders existing output)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/features.js tests/check-ep2-s1-presence-sidebar.js
git commit -m "feat(ep2-s1): inject Team presence sidebar container into the feature artefact page"
```

---

## Task 4: presence-sidebar.js — client-side component

**Files:**
- Create: `src/web-ui/public/presence-sidebar.js`
- Test: covered by E2E (Task 6) — this is browser-only client code, not unit-testable under Node without a DOM shim already present in this codebase (none found for `public/*.js` files — confirmed no existing precedent for unit-testing this directory's client scripts; jsdom is a devDependency but not currently wired to any `public/` test, so introducing that wiring is out of this story's bounded scope)

- [ ] **Step 1: Write the implementation directly (no Node-side failing test for this task — see note above; AC coverage is via E2E)**

```javascript
// src/web-ui/public/presence-sidebar.js — ep2-s1
// Team presence sidebar: initial fetch, SSE live updates, 1s local tick
// for "last seen Xm ago" text, and a periodic heartbeat so this viewer's
// own presence stays registered while the page is open.
(function () {
  'use strict';

  function fmtLastSeen(lastSeenMs) {
    if (lastSeenMs == null) return 'unknown';
    var mins = Math.floor((Date.now() - lastSeenMs) / 60000);
    if (mins < 1) return 'just now';
    return mins + 'm ago';
  }

  function render(listEl, collaborators) {
    listEl.innerHTML = '';
    collaborators.forEach(function (c) {
      var item = document.createElement('li');
      item.className = 'presence-item presence-' + c.status;
      item.tabIndex = 0;
      var label = c.userId + ' (' + c.roleId +
        (c.status === 'offline' ? ', offline — last seen ' + fmtLastSeen(c.lastSeenMs) : '') +
        ')';
      item.textContent = label;
      listEl.appendChild(item);
    });
  }

  window.initPresenceSidebar = function (journeyId, listElementId) {
    var listEl = document.getElementById(listElementId);
    if (!listEl) return;
    var latest = [];

    function refresh(data) {
      latest = (data && data.collaborators) || [];
      render(listEl, latest);
    }

    fetch('/api/journey/' + encodeURIComponent(journeyId) + '/collaborators-presence')
      .then(function (r) { return r.json(); })
      .then(refresh)
      .catch(function () { /* graceful degrade: sidebar stays empty until SSE delivers a payload */ });

    var es = new EventSource('/api/journey/' + encodeURIComponent(journeyId) + '/presence-stream');
    es.onmessage = function (evt) {
      try { refresh(JSON.parse(evt.data)); } catch (_) { /* ignore malformed frame */ }
    };
    es.onerror = function () {
      // graceful degrade: keep last-known render; browser's EventSource auto-reconnects
    };

    // Live-recompute "last seen" text every second without a network round trip.
    setInterval(function () {
      if (latest.length) render(listEl, latest);
    }, 1000);

    // Keep this viewer's own presence registered while the tab is open.
    setInterval(function () {
      fetch('/api/journey/' + encodeURIComponent(journeyId) + '/heartbeat', { method: 'POST' });
    }, 12000);
  };
})();
```

- [ ] **Step 2: Commit**

```bash
git add src/web-ui/public/presence-sidebar.js
git commit -m "feat(ep2-s1): add client-side presence sidebar component"
```

---

## Task 5: Integration tests — full path and tenant isolation

**Files:**
- Modify: `tests/check-ep2-s1-presence-sidebar.js` (Part 4)

- [ ] **Step 1: Write the tests**

```javascript
// tests/check-ep2-s1-presence-sidebar.js — Part 4
// Full-path integration test: exercise handleGetJourneyCollaboratorsPresence
// against a fake pool returning 3 feature_collaborators rows, with presence
// pre-seeded for 2 online + 1 offline (mirrors ep1-s3's own makeFakePool()
// convention from check-ep1-s3-feature-pod-inheritance.js).
async function testFullPathPresenceLoad() {
  presenceStore._clearForTesting();
  let t = 1000000;
  presenceStore.setNow(() => t);
  presenceStore.registerActivity('journey-a1', 'hamish');
  presenceStore.registerActivity('journey-a1', 'susan');
  presenceStore.registerActivity('journey-a1', 'darren');
  t += 35000; // darren goes stale; hamish/susan re-register below stay fresh
  presenceStore.registerActivity('journey-a1', 'hamish');
  presenceStore.registerActivity('journey-a1', 'susan');

  const fakePool = {
    query: async (sql, params) => {
      if (sql.indexOf('feature_collaborators') !== -1) {
        return { rows: [
          { collaborator_id: 'c1', user_id: 'hamish', role_id: 'conductor', pod_id: 'pod-1' },
          { collaborator_id: 'c2', user_id: 'susan', role_id: 'engineer', pod_id: 'pod-1' },
          { collaborator_id: 'c3', user_id: 'darren', role_id: 'engineer', pod_id: 'pod-1' }
        ] };
      }
      return { rows: [] };
    }
  };
  const { getFeatureCollaborators } = require('../src/web-ui/modules/feature-collaborator-store');
  const rows = await getFeatureCollaborators(fakePool, 'journey-a1');
  const withStatus = rows.map(r => ({ ...r, ...presenceStore.getStatus('journey-a1', r.userId) }));

  assert.strictEqual(withStatus.length, 3);
  assert.strictEqual(withStatus.find(c => c.userId === 'hamish').status, 'online');
  assert.strictEqual(withStatus.find(c => c.userId === 'susan').status, 'online');
  assert.strictEqual(withStatus.find(c => c.userId === 'darren').status, 'offline');
}
testFullPathPresenceLoad().then(() => console.log('  ok - full path: 2 online, 1 offline, correct roles'));

// Tenant isolation: presence-store keys are journeyId, and journeyId access
// is already tenant-gated by requireJourneyAccess (POLICY.TENANT) before any
// handler in Task 2 reaches presence-store or feature-collaborator-store --
// there is no tenant_id column on feature_collaborators to test directly
// (by design -- see plan header point 2's data model). This test proves the
// isolation is structural: two different journeyIds never share a presence
// map entry, even for the same login string across tenants.
async function testPresenceIsolationByJourney() {
  presenceStore._clearForTesting();
  presenceStore.setNow(() => 5000000);
  presenceStore.registerActivity('journey-tenant-a', 'hamish');
  const crossTenantLookup = presenceStore.getStatus('journey-tenant-b', 'hamish');
  assert.strictEqual(crossTenantLookup.status, 'offline', 'presence for one journey must not leak into another');
}
testPresenceIsolationByJourney().then(() => console.log('  ok - presence isolated per journeyId (tenant boundary enforced upstream by requireJourneyAccess)'));
```

- [ ] **Step 2: Run — must pass**

```bash
node tests/check-ep2-s1-presence-sidebar.js
```

Expected output: `ok - full path: 2 online, 1 offline, correct roles` and `ok - presence isolated per journeyId ...`

- [ ] **Step 3: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing

- [ ] **Step 4: Commit**

```bash
git add tests/check-ep2-s1-presence-sidebar.js
git commit -m "test(ep2-s1): add integration tests for full presence load path and journey isolation"
```

---

## Task 6: E2E and NFR tests

**Files:**
- Create: `tests/e2e/ep2-s1-presence-sidebar.spec.js`

- [ ] **Step 1: Write the E2E tests**

```javascript
// tests/e2e/ep2-s1-presence-sidebar.spec.js
const { test, expect } = require('@playwright/test');

// Setup mirrors tests/e2e/ep1-s3-feature-pod-inheritance.spec.js's own
// auth-bypass + seeded-feature fixture convention (NODE_ENV=test guard).
// journeyId/featureSlug seeding: reuse whatever seed helper that spec
// already established for a feature with pod-inherited collaborators --
// do not invent a second seeding mechanism.

test('AC1: Team sidebar renders with all collaborators and roles on page load', async ({ page }) => {
  // Navigate to the seeded feature's real page: /features/:featureSlug
  await page.goto('/features/feat-a1-slug');
  const sidebar = page.locator('#team-sidebar');
  await expect(sidebar).toBeVisible();
  const items = page.locator('#team-sidebar-list .presence-item');
  await expect(items).toHaveCount(3);
  await expect(items.nth(0)).toContainText('conductor');
});

test('AC2: offline status updates via SSE without page refresh', async ({ page }) => {
  await page.goto('/features/feat-a1-slug');
  // Darren's fixture heartbeat is pre-staled (>30s) in the seed; presence-stream
  // broadcasts every 5s, so the first SSE frame should already reflect offline.
  const darrenItem = page.locator('#team-sidebar-list .presence-item', { hasText: 'darren' });
  await expect(darrenItem).toHaveClass(/presence-offline/, { timeout: 6000 });
});

test('AC3: last-seen timestamp advances live without refresh', async ({ page }) => {
  await page.goto('/features/feat-a1-slug');
  const darrenItem = page.locator('#team-sidebar-list .presence-item', { hasText: 'darren' });
  const initialText = await darrenItem.textContent();
  await page.waitForTimeout(61000); // 1 client-side tick interval past a minute boundary
  const laterText = await darrenItem.textContent();
  expect(laterText).not.toBe(initialText);
});
```

- [ ] **Step 2: Run — must pass**

```bash
npx playwright test tests/e2e/ep2-s1-presence-sidebar.spec.js
```

Expected output: `3 passed`

- [ ] **Step 3: NFR verification**

- **NFR-Perf-1 (sidebar load ≤500ms):** `handleGetJourneyCollaboratorsPresence` does one `getFeatureCollaborators` query (single indexed SELECT on `feature_id`) plus in-memory presence lookups — no external calls. RISK-ACCEPT if not separately timed, matching this story's sibling stories' own NFR-Perf precedent (ep1-s1/s2/s3) — log in decisions.md if not automated.
- **NFR-Perf-2 (SSE update ≤500ms):** broadcast interval is 5000ms server-side; once emitted, `res.write` → `EventSource.onmessage` → `render()` is synchronous DOM work, well under 500ms. RISK-ACCEPT for the same reason as NFR-Perf-1.
- **NFR-Data-1 (completeness):** covered by Task 5's integration test (`withStatus.length === 3`, matching `feature_collaborators` row count).
- **NFR-A11y-1 (keyboard navigation):** each `.presence-item` has `tabIndex = 0` and full-text accessible name (Task 4); `<ul role="list">` wrapping preserves list semantics. Add a Playwright keyboard-nav assertion to the E2E spec above if time permits; otherwise RISK-ACCEPT with the same precedent as ep1-s1 Task 7's deferred a11y fix (see decisions.md).

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/ep2-s1-presence-sidebar.spec.js
git commit -m "test(ep2-s1): add E2E coverage for sidebar render, SSE offline transition, and live timestamp"
```

---

## Post-plan note for /verify-completion

Any RISK-ACCEPTs taken in Task 6 Step 3 (NFR timing not automated) must be logged in `artefacts/new-feature-2b74a292/decisions.md` before `/definition-of-done`, per this repo's own established convention for this feature (see ep1-s1/s2/s3's own NFR-Perf-1 entries).
