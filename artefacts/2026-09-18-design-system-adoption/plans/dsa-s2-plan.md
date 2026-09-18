# Implementation Plan: Restyle the Dashboard and Wire Its Real Content to Match DESIGN.md (dsa-s2)

**Story:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s2.md
**Test plan:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s2-test-plan.md
**DoR:** artefacts/2026-09-18-design-system-adoption/dor/dsa-s2-dor.md
**Worktree:** `.worktrees/dsa-s2`, branch `feature/dsa-s2`

## Pre-flight facts (verified before writing this plan, do not re-derive)

- `handleDashboard` (`src/web-ui/routes/dashboard.js`) currently renders a placeholder `bodyContent = '<h1>Dashboard</h1>'`. It never calls `renderDashboard`.
- `renderDashboard` (`src/web-ui/views/dashboard-view.js`) is a fully-built, already-token-correct view function (uses only `var(--surface)`, `var(--line)`, `var(--ink)`, `var(--muted)`, `var(--muted-2)`, `var(--accent)`, `var(--accent-ink)` — no `--green`/`--amber`/`--red` usage, no token-aliasing work needed in this file). Its only other references are inside `src/web-ui/port-extract/port/` (a scratch directory, not live code) — confirmed dead code otherwise.
- **CRITICAL, already-found regression risk:** `renderDashboard`'s own markup includes `'<a href="/skills">Browse all →</a>'` in the "Run a skill" section header. `tests/check-wuce18-html-shell.js`'s T9.3 explicitly asserts `!res.body.includes('href="/skills"')` ("Run a Skill link removed (pan-s1)") — a real, already-shipped product-navigation decision. **This link must be removed** from `renderDashboard`'s markup before wiring it in, or T9.3 will fail immediately. The 6 skill cards' own individual `href="/api/skills/:name/sessions"` links are unaffected (different string, not matched by T9.3's check) and already satisfy AC6 on their own — no replacement link is needed.
- `adapters/action-queue.js`'s `getPendingActions(userIdentity, token)` returns `{ items: [{featureName, artefactType, daysPending, artefactUrl}], bannerMessage }`. `dashboard.js` already has an injectable seam for it: `let _getPendingActions = defaultGetPendingActions; function setGetPendingActions(fn) { _getPendingActions = fn; }` — already imported, already used by the sibling `handleGetActions`. `renderDashboard` expects `actions: [{what, feature, age, you}]` and `pendingActionsCount: number` — shapes do not match, a mapping function is required.
- `modules/journey-store.js`'s `listJourneys(repoRoot)` is genuinely wired in real production (`server.js:426-434`, inside the real Postgres/disk startup branch — not test-only; a SEPARATE `NODE_ENV=test`-only wiring also exists at `server.js:~1684`, confirmed by `dsa-s1`'s own Task 6 finding, but this is in addition to, not instead of, real production wiring). The real production wiring filters by `tenantId`: `all.filter(function(j) { return j.tenantId === tenantId; })` — `dashboard.js` should replicate this exact same tenant-filter pattern when it calls `listJourneys` directly (do not depend on `routes/journey.js`'s own private `_listJourneys` variable — it is not exported; only `setListJourneys`/`handleJourneys` are).
- Each journey object has `completedStages: [{skillName, artefactPath, completedAt, sessionId?}]` (populated by `completeStage()`) and `complete: boolean`.
- `req.session.userId`, `req.session.login`, `req.session.tenantId` are the real, already-used session fields in this file and elsewhere in this codebase (`req.session.accessToken` is the canonical token field per `CLAUDE.md`).
- No existing skills-catalog metadata array exists anywhere (`routes/skills.js` only has inline `skillName === '...'` conditionals). A new small static array is required for AC6.
- Real, valid skill names to use in the new catalog (confirmed present as real `skillName === '...'` branches in `routes/skills.js`): `discovery`, `definition`, `test-plan`, `implementation-plan`, `definition-of-ready`, `review`. Use these 6 real names — do not invent new ones.

---

## Task 1: Wire `renderDashboard` into `handleDashboard`, fix the T9.3 regression, add the static skills catalog

**Files:**
- Modify: `src/web-ui/views/dashboard-view.js` (remove the `/skills` link)
- Modify: `src/web-ui/routes/dashboard.js` (wire `renderDashboard`, add the static catalog, supply minimal real props for greeting/date; `actions`/`pendingActionsCount`/`inProgressCount`/`recent` stay empty/zero in this task — Tasks 2/3 wire those)

- [ ] **Step 1: Read the exact current state first**

Re-read `src/web-ui/routes/dashboard.js`'s full `handleDashboard` function and `src/web-ui/views/dashboard-view.js`'s full `renderDashboard` function — confirm line numbers are still as described above (this plan was written before any code in this task was touched, but re-confirm regardless per this codebase's own established discipline).

- [ ] **Step 2: Write the failing test**

Create `tests/check-dsa-s2-dashboard-wiring.js`:

```javascript
'use strict';
// tests/check-dsa-s2-dashboard-wiring.js -- AC3, AC6
const assert = require('assert');
const { handleDashboard, setGetPendingActions, setLogger } = require('../src/web-ui/routes/dashboard');

setLogger({ info: function(){}, warn: function(){} });
setGetPendingActions(async function() { return { items: [], bannerMessage: null }; });

function makeRes() {
  var statusCode = null, headers = {}, chunks = [];
  return {
    writeHead: function (code, h) { statusCode = code; Object.assign(headers, h || {}); },
    end: function (body) { if (body != null) chunks.push(body); },
    _get: function () { return { statusCode: statusCode, headers: headers, body: chunks.join('') }; }
  };
}

async function testRendersRealDashboardNotPlaceholder() {
  var req = { session: { accessToken: 'tok', userId: 1, login: 'tester', tenantId: null } };
  var res = makeRes();
  await handleDashboard(req, res);
  var result = res._get();
  assert.strictEqual(result.statusCode, 200);
  assert.ok(!result.body.includes('<h1>Dashboard</h1>'), 'the old placeholder must be gone');
  assert.ok(result.body.includes('Run a skill'), 'expected the real renderDashboard section header');
  assert.ok(result.body.includes('sw-skill-grid'), 'expected the real skill-card grid');
}

async function testNoStaleSkillsLinkRegression() {
  // T9.3 in check-wuce18-html-shell.js asserts this exact string is absent
  // repo-wide from handleDashboard's response -- a real, already-shipped
  // pan-s1 navigation decision. Re-asserted here directly at the source of
  // the change, not just relying on the pre-existing spec catching it later.
  var req = { session: { accessToken: 'tok', userId: 1, login: 'tester', tenantId: null } };
  var res = makeRes();
  await handleDashboard(req, res);
  assert.ok(!res._get().body.includes('href="/skills"'), 'the removed /skills browse link must not reappear');
}

async function testSkillCatalogRendersSixRealCards() {
  var req = { session: { accessToken: 'tok', userId: 1, login: 'tester', tenantId: null } };
  var res = makeRes();
  await handleDashboard(req, res);
  var body = res._get().body;
  ['discovery', 'definition', 'test-plan', 'implementation-plan', 'definition-of-ready', 'review'].forEach(function(name) {
    assert.ok(body.includes('/api/skills/' + name + '/sessions'), 'expected a real session-start link for ' + name);
  });
}

async function main() {
  await testRendersRealDashboardNotPlaceholder();
  console.log('  ok - renders real renderDashboard content, not the placeholder');
  await testNoStaleSkillsLinkRegression();
  console.log('  ok - no stale /skills browse link (T9.3 regression guard)');
  await testSkillCatalogRendersSixRealCards();
  console.log('  ok - static skills catalog renders 6 real session-start links');
}
main().catch(function (err) { console.error('FAIL:', err.message); process.exitCode = 1; });
```

- [ ] **Step 3: Run test — must fail**

```bash
node tests/check-dsa-s2-dashboard-wiring.js
```

Expected: fails on the first assertion (`<h1>Dashboard</h1>` is still present, since `handleDashboard` hasn't been wired to `renderDashboard` yet).

- [ ] **Step 4: Write the implementation**

In `src/web-ui/views/dashboard-view.js`, remove the stale link line:

```javascript
// REMOVE this line from the "Run a skill" section header (pan-s1 already
// removed the sidebar's own /skills link; this dead-code view still had it):
'<a href="#">Browse all →</a>',
```

(Confirm the exact current line via Step 1's read — remove only this one `<a>` element, leave the rest of the `.sw-section-head` div's structure — the `<h2>` and closing `</div>` — untouched.)

In `src/web-ui/routes/dashboard.js`, add near the top (after existing requires):

```javascript
const { renderDashboard } = require('../views/dashboard-view');

// dsa-s2 -- static, platform-wide skill catalog for the "Run a skill" grid.
// Real skill names confirmed against routes/skills.js's own real
// skillName === '...' branches -- do not invent names not present there.
const _DASHBOARD_SKILLS_CATALOG = [
  { name: 'discovery', label: 'Discovery', stage: 'outer', desc: 'Structure a raw idea into a formal discovery artefact.', est: '15m' },
  { name: 'definition', label: 'Definition', stage: 'outer', desc: 'Break approved discovery into epics and stories.', est: '20m' },
  { name: 'test-plan', label: 'Test plan', stage: 'outer', desc: 'Write failing tests and an AC verification script.', est: '10m' },
  { name: 'implementation-plan', label: 'Implementation plan', stage: 'inner', desc: 'Task-by-task plan with exact file paths.', est: '12m' },
  { name: 'definition-of-ready', label: 'Definition of ready', stage: 'outer', desc: 'Sign off scope, tests, and architecture before coding.', est: '8m' },
  { name: 'review', label: 'Review', stage: 'outer', desc: 'Quality-check stories for traceability and scope discipline.', est: '10m' }
];
```

(Note: `renderDashboard`'s own skill-card markup reads `s.name` as the URL segment and `s.label`/`s.stage`/`s.desc`/`s.est` for display — confirm this exact field mapping from Step 1's read of `dashboard-view.js` before finalizing the catalog's field names.)

Replace the existing `const bodyContent = \`<h1>Dashboard</h1>\`;` line with:

```javascript
  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const bodyContent = renderDashboard({
    greetingName: login || 'there',
    dateLabel: dateLabel,
    pendingActionsCount: 0,   // dsa-s2 Task 2 wires the real value
    inProgressCount: 0,       // dsa-s2 Task 3 wires the real value
    skills: _DASHBOARD_SKILLS_CATALOG,
    actions: [],              // dsa-s2 Task 2 wires the real value
    recent: []                // dsa-s2 Task 3 wires the real value
  });
```

(This is a pure-append/replace at the exact same `bodyContent` assignment point — the `renderShell` call immediately below stays completely unchanged, still receiving `bodyContent` exactly as before.)

- [ ] **Step 5: Run test — must pass**

```bash
node tests/check-dsa-s2-dashboard-wiring.js
```

Expected:
```
  ok - renders real renderDashboard content, not the placeholder
  ok - no stale /skills browse link (T9.3 regression guard)
  ok - static skills catalog renders 6 real session-start links
```

- [ ] **Step 6: Run the T9.3 regression test directly, plus the full pre-existing dashboard suite**

```bash
node tests/check-wuce18-html-shell.js
node tests/check-wuce23-skill-launcher-landing.js
node tests/check-npwe-s1-skills-nav-wiring.js
node tests/check-d4-nfr-security-review-and-hardening.js
node tests/check-d2-banner-exit-permission-visibility.js
node tests/check-b2-account-nav.js
```

Expected: all pass, including T9.3 specifically. If any fail, investigate whether this task's change caused it (likely, if it's a content-shape assertion this task's own markup change affects) versus pre-existing/unrelated — do not just report, determine which.

- [ ] **Step 7: Run ci-typecheck**

```bash
node scripts/ci-typecheck.js
```

- [ ] **Step 8: Commit**

```bash
git add src/web-ui/routes/dashboard.js src/web-ui/views/dashboard-view.js tests/check-dsa-s2-dashboard-wiring.js
git commit -m "feat(dsa-s2): wire renderDashboard into handleDashboard, add static skills catalog, fix stale /skills link regression"
```

---

## Task 2: Pending-actions mapping function (AC5)

**Files:**
- Modify: `src/web-ui/routes/dashboard.js`
- Create/modify: `tests/check-dsa-s2-pending-actions-mapping.js`

- [ ] **Step 1: Read the exact current state first**

Confirm `getPendingActions`'s real return shape (`adapters/action-queue.js`) and `renderDashboard`'s expected `actions` shape (`views/dashboard-view.js`) are unchanged from the Pre-flight facts above.

- [ ] **Step 2: Write the failing test**

Create `tests/check-dsa-s2-pending-actions-mapping.js`:

```javascript
'use strict';
// tests/check-dsa-s2-pending-actions-mapping.js -- AC5 (unit: mapping shape)
const assert = require('assert');
const { _mapPendingActionsForDashboard } = require('../src/web-ui/routes/dashboard');

function testMapsRealShapeToRenderDashboardShape() {
  var raw = {
    items: [
      { featureName: 'interactive-kanban-boards', artefactType: 'discovery', daysPending: 2, artefactUrl: '/features/x/discovery' },
      { featureName: 'streaming-live-draft', artefactType: 'test-plan', daysPending: 0, artefactUrl: '/features/y/test-plan' }
    ],
    bannerMessage: null
  };
  var result = _mapPendingActionsForDashboard(raw);
  assert.strictEqual(result.pendingActionsCount, 2);
  assert.strictEqual(result.actions.length, 2);
  assert.ok(result.actions[0].what.toLowerCase().includes('discovery'));
  assert.strictEqual(result.actions[0].feature, 'interactive-kanban-boards');
  assert.strictEqual(result.actions[0].you, true);
  assert.ok(/2d|2 day/i.test(result.actions[0].age));
  assert.ok(/today|0d/i.test(result.actions[1].age));
}

function testEmptyItemsMapsToEmptyActions() {
  var result = _mapPendingActionsForDashboard({ items: [], bannerMessage: null });
  assert.strictEqual(result.pendingActionsCount, 0);
  assert.deepStrictEqual(result.actions, []);
}

testMapsRealShapeToRenderDashboardShape();
console.log('  ok - maps real getPendingActions shape to renderDashboard actions shape');
testEmptyItemsMapsToEmptyActions();
console.log('  ok - empty items maps to empty actions, 0 count');
```

- [ ] **Step 3: Run test — must fail** (function doesn't exist yet)

- [ ] **Step 4: Write the implementation**

In `src/web-ui/routes/dashboard.js`, add the mapping function (export it for the unit test above) and call it in `handleDashboard`:

```javascript
function _mapPendingActionsForDashboard(raw) {
  var items = (raw && raw.items) || [];
  var actions = items.map(function(item) {
    return {
      what: 'Sign off ' + item.artefactType,
      feature: item.featureName,
      age: item.daysPending === 0 ? 'today' : (item.daysPending + 'd ago'),
      you: true
    };
  });
  return { actions: actions, pendingActionsCount: items.length };
}
```

In `handleDashboard`, after the existing auth check, add:

```javascript
  var pendingResult;
  try {
    pendingResult = await _getPendingActions({ id: userId, login: login }, req.session.accessToken);
  } catch (err) {
    _logger.warn('dashboard_pending_actions_error', { userId: userId, reason: err.message });
    pendingResult = { items: [], bannerMessage: null };
  }
  var mapped = _mapPendingActionsForDashboard(pendingResult);
```

Update the `renderDashboard({...})` call from Task 1 to use `mapped.actions`/`mapped.pendingActionsCount` instead of the `[]`/`0` placeholders.

Add `_mapPendingActionsForDashboard` to `module.exports`.

- [ ] **Step 5: Run test — must pass**

- [ ] **Step 6: Run ci-typecheck**

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/routes/dashboard.js tests/check-dsa-s2-pending-actions-mapping.js
git commit -m "feat(dsa-s2): wire real pending-actions data into the dashboard via a mapping function (AC5)"
```

---

## Task 3: Journey-derivation function for in-progress count and recent sessions (AC7)

**Files:**
- Modify: `src/web-ui/routes/dashboard.js`
- Create: `tests/check-dsa-s2-journey-derivation.js`

- [ ] **Step 1: Read the exact current state first**

Re-confirm `journey-store.js`'s `listJourneys(repoRoot)` signature and each journey's `completedStages`/`complete`/`featureSlug`/`tenantId` fields are unchanged from the Pre-flight facts above. Confirm the real production wiring at `server.js:426-434`'s tenant-filter pattern.

- [ ] **Step 2: Write the failing test**

Create `tests/check-dsa-s2-journey-derivation.js`:

```javascript
'use strict';
// tests/check-dsa-s2-journey-derivation.js -- AC7 (unit: derivation shape)
const assert = require('assert');
const { _deriveDashboardJourneyData } = require('../src/web-ui/routes/dashboard');

function testDerivesInProgressCountAndRecentSessions() {
  var journeys = [
    { featureSlug: 'feature-a', complete: false, completedStages: [
      { skillName: 'discovery', completedAt: '2026-09-17T10:00:00.000Z' }
    ] },
    { featureSlug: 'feature-b', complete: true, completedStages: [
      { skillName: 'test-plan', completedAt: '2026-09-18T09:00:00.000Z' },
      { skillName: 'definition', completedAt: '2026-09-16T09:00:00.000Z' }
    ] }
  ];
  var result = _deriveDashboardJourneyData(journeys, 5);
  assert.strictEqual(result.inProgressCount, 1, 'only feature-a is incomplete');
  assert.strictEqual(result.recent.length, 3);
  assert.strictEqual(result.recent[0].skill, 'test-plan', 'most recent completedAt first');
  assert.strictEqual(result.recent[0].feature, 'feature-b');
  assert.strictEqual(result.recent[0].stage, 'done');
  assert.ok(result.recent[0].pillColor, 'expected a pill color token reference');
}

function testEmptyJourneysDerivesToZeroAndEmpty() {
  var result = _deriveDashboardJourneyData([], 5);
  assert.strictEqual(result.inProgressCount, 0);
  assert.deepStrictEqual(result.recent, []);
}

function testRespectsTopNLimit() {
  var manyStages = [];
  for (var i = 0; i < 10; i++) {
    manyStages.push({ skillName: 'discovery', completedAt: '2026-09-' + (10 + i) + 'T00:00:00.000Z' });
  }
  var result = _deriveDashboardJourneyData([{ featureSlug: 'f', complete: true, completedStages: manyStages }], 5);
  assert.strictEqual(result.recent.length, 5, 'must cap at the requested top-N');
}

testDerivesInProgressCountAndRecentSessions();
console.log('  ok - derives in-progress count and recent sessions sorted newest-first');
testEmptyJourneysDerivesToZeroAndEmpty();
console.log('  ok - zero journeys derives to 0 count and empty recent array');
testRespectsTopNLimit();
console.log('  ok - recent sessions respects the top-N cap');
```

- [ ] **Step 3: Run test — must fail**

- [ ] **Step 4: Write the implementation**

In `src/web-ui/routes/dashboard.js`, add:

```javascript
const { listJourneys } = require('../modules/journey-store');

function _deriveDashboardJourneyData(journeys, topN) {
  var inProgressCount = journeys.filter(function(j) { return !j.complete; }).length;
  var allStages = [];
  journeys.forEach(function(j) {
    (j.completedStages || []).forEach(function(cs) {
      allStages.push({
        skill: cs.skillName,
        feature: j.featureSlug,
        when: cs.completedAt,
        stage: 'done',
        pillBg: 'var(--success-soft)',
        pillColor: 'var(--success)'
      });
    });
  });
  allStages.sort(function(a, b) { return a.when < b.when ? 1 : (a.when > b.when ? -1 : 0); });
  return { inProgressCount: inProgressCount, recent: allStages.slice(0, topN) };
}
```

In `handleDashboard`, after the pending-actions block from Task 2, add:

```javascript
  var journeys;
  try {
    var repoRoot = process.env.COPILOT_REPO_PATH || require('path').resolve(__dirname, '../../..');
    journeys = listJourneys(repoRoot).filter(function(j) { return req.session.tenantId ? j.tenantId === req.session.tenantId : true; });
  } catch (err) {
    _logger.warn('dashboard_journeys_error', { userId: userId, reason: err.message });
    journeys = [];
  }
  var journeyData = _deriveDashboardJourneyData(journeys, 5);
```

(Confirm the exact real `repoRoot` resolution pattern against `server.js:429`'s own `_journeyRootForBee2` at Step 1 time — do not assume the relative path depth without checking, since `dashboard.js` lives at a different directory depth than `server.js`.)

Update the `renderDashboard({...})` call to use `journeyData.inProgressCount`/`journeyData.recent` instead of the `0`/`[]` placeholders.

Add `_deriveDashboardJourneyData` to `module.exports`.

**Also format `when` for display** — `renderDashboard`'s markup interpolates `{{ r.when }}`-equivalent directly as display text (not a raw ISO string) in the mock; confirm at implementation time whether `dashboard-view.js`'s real markup expects a pre-formatted relative-time string or formats it itself, and match accordingly (do not display a raw ISO timestamp to the user if the view expects pre-formatted text).

- [ ] **Step 5: Run test — must pass**

- [ ] **Step 6: Run ci-typecheck**

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/routes/dashboard.js tests/check-dsa-s2-journey-derivation.js
git commit -m "feat(dsa-s2): wire real in-progress count and recent-session data from journey-store (AC7)"
```

---

## Task 4: E2E tests for AC1-AC3, AC5-AC7 (AC4 covered separately by re-running pre-existing specs)

**Files:**
- Create: `tests/e2e/dsa-s2-dashboard-restyle.spec.js`

- [ ] **Step 1: Investigate before writing**

Read `tests/e2e/dsa-s1-artefact-viewer-restyle.spec.js` (this feature's own established E2E pattern: `withAuth` fixture, `readTokens`/`ensureTheme` helpers, real fixture-backed data) and `tests/e2e/psh-s4-dashboard-layout.spec.js` (the pre-existing dashboard spec, for its own real navigation/fixture pattern) before writing new tests — reuse conventions, don't reinvent them.

- [ ] **Step 2: Write the E2E spec**

Cover:
- **AC1/AC2** (dark/light token values): same `readTokens`/`ensureTheme` pattern as `dsa-s1`'s own spec, against the dashboard page instead of the artefact viewer.
- **AC3** (layout matches the mock): assert the sidebar (`.sw-sidebar`, already real and shared) and the main column's `max-width: 1080px` / grid structure are present.
- **AC5** (real pending actions): seed a real pending item (via whatever test-seeding mechanism the real `getPendingActions` path supports in `NODE_ENV=test` — investigate at implementation time; if no real seed path exists, use `page.route` interception on the underlying GitHub API calls `getPendingActions` makes, matching `dsa-s1`'s own precedent for external-dependency test boundaries) and confirm it renders in "Waiting on you".
- **AC6** (skill catalog): assert the 6 real skill cards render with real labels, and that clicking one submits to the real `/api/skills/:name/sessions` route.
- **AC7** (in-progress count / recent sessions): seed a journey with real `completedStages`, confirm "Recent sessions" and the in-progress count reflect it; a second test for the zero-journeys empty state.

- [ ] **Step 3: Run the E2E spec**

```bash
NODE_ENV=test npx playwright test tests/e2e/dsa-s2-dashboard-restyle.spec.js
```

Foreground, wait for it to actually finish. Investigate and fix real bugs found; do not weaken assertions to pass.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/dsa-s2-dashboard-restyle.spec.js
git commit -m "test(dsa-s2): add E2E coverage for restyled dashboard with real data wiring"
```

---

## Task 5: Full regression verification (AC4) + Node suite + npm test

**Files:** none new — verification only.

- [ ] **Step 1: Run every pre-existing dashboard-touching test file**

```bash
node tests/check-wuce18-html-shell.js
node tests/check-wuce23-skill-launcher-landing.js
node tests/check-wuce5-action-queue.js
node tests/check-npwe-s1-skills-nav-wiring.js
node tests/check-d4-nfr-security-review-and-hardening.js
node tests/check-d2-banner-exit-permission-visibility.js
node tests/check-b2-account-nav.js
```

- [ ] **Step 2: Run the pre-existing E2E dashboard spec**

```bash
NODE_ENV=test npx playwright test tests/e2e/psh-s4-dashboard-layout.spec.js
```

- [ ] **Step 3: Grep for any additional dashboard-touching spec not already named above**

```bash
grep -rl "routes/dashboard\|handleDashboard\|/dashboard'" tests/ tests/e2e/ 2>/dev/null
```

Run anything found that isn't already covered above.

- [ ] **Step 4: Run all 5 new dsa-s2-specific test files + the new E2E spec together**

```bash
node tests/check-dsa-s2-dashboard-wiring.js
node tests/check-dsa-s2-pending-actions-mapping.js
node tests/check-dsa-s2-journey-derivation.js
NODE_ENV=test npx playwright test tests/e2e/dsa-s2-dashboard-restyle.spec.js
```

- [ ] **Step 5: Run the full Node suite**

```bash
npm test
```

Foreground, wait for completion (~7-8 minutes based on this session's own established baseline). Expect only the same pre-existing, unrelated failure already confirmed multiple times this session (`tests/check-p3.5-validate-trace.js`) — nothing new.

- [ ] **Step 6: Commit if any fixes were needed** (separate commit from Task 4's, with its own clear message)

---

## Post-plan note for /verify-completion

This story's diff touches `src/web-ui/routes/dashboard.js` (a route/handler file) — `/verify-completion`'s mandatory route/handler E2E coverage check applies. At minimum, re-confirm and run: `psh-s4-dashboard-layout.spec.js`, plus any others found by Task 5's own grep. This story's diff also changes rendered UI output (the dashboard's entire main content column) — `/verify-completion`'s mandatory live browser render check applies too; given `dsa-s1`'s own experience, budget for this catching something the automated tests alone would miss (unstyled elements, a stale link, an unformatted timestamp).

Any RISK-ACCEPTs already logged in `decisions.md` for this story (the 2 MEDIUM AC-wording findings, the `listJourneys` production-wiring confirmation) carry forward — no new action needed at `/verify-completion` for those, they are already closed decisions.
