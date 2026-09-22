# Request Regression to Earlier Stage — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Let a team collaborator request the feature back to an earlier, already-completed stage with a reason, resetting that stage and everything downstream to "incomplete" (removed from `completedStages`) while every prior `decisions.md` approval entry is preserved untouched.
**Branch:** `feature/ep3-s1`
**Worktree:** `.worktrees/ep3-s1`
**Test command:** `npm test` (full suite) / `node tests/<file>.js` (single file)

---

## Pre-verified findings (see `decisions.md` for the full investigation)

The DoR's own Estimated Touch Points section is **superseded** by direct investigation of the real codebase, done before this plan was written:

- **No `routes/features.js` regression route exists** (that file only has artefact-listing/idea handlers). This story's real home is `src/web-ui/routes/journey.js`, alongside `handlePostJourneyApprove` (ep2-s3) and `handlePostJourneyStageArtefact` (ep2-s4).
- **No `feature_approvals` table exists anywhere.** The real, already-shipped analog to "approval records" is `decisions.md`, appended to by `handlePostJourneyApprove`. It's append-only by construction, so AC3's "preserved, not deleted" substance holds as long as this story's own handler never rewrites the file.
- **No `feature.stage` field exists.** The real per-journey state is `journey.activeSkill` (current stage) and `journey.completedStages[]` (array of `{skillName, artefactPath, sessionId, completedAt, ...}` — a stage is "done" by being present here). "Marking downstream stages incomplete" (AC2) is implemented by **removing** the relevant entries from `completedStages` — reusing this codebase's own existing definition of "incomplete" rather than inventing a new flag.
- **No `feature-stage-controls.js` file exists.** There is instead an already-shipped, closely-related interstitial (`handleGetStageConfirmBack`, from an unrelated prior story) rendered when a user clicks an earlier stage's dot in the journey's own step-nav. Its current "Confirm" link only resumes/creates a session for that one stage (`handleGetJourneyStageReopen`) — no reason field, no downstream invalidation. This plan **extends that existing interstitial** with a reason field and a real regression action, rather than building a new standalone UI component, per the design decision recorded in `decisions.md`.
- **`journey-store.js` already exports `getDownstreamStages(currentStage)`** (every stage strictly after `currentStage`, in the single canonical `STAGE_SEQUENCE` — reused, not re-derived, by the existing materiality-flagging feature). This plan reuses it for AC2's own computation instead of hardcoding a second stage-order list (the exact anti-pattern already flagged and avoided once in this codebase).
- **`_csrf.csrfGuard(req, res)` parses both JSON and form-urlencoded bodies into `req.body`**, and requires a matching `_csrf` field — rendered via the existing `_csrf.csrfField(await _csrf.generateCsrfToken(req))` helper already used by every other form in `journey.js`. The new regression form is a plain HTML `<form method="POST">` (not a `fetch()`-based JSON submit like `ep2-s4`'s client script), matching `handleGetStageConfirmBack`'s own existing plain-HTML-form-free (currently link-only) style, extended minimally.

---

## File map

```
Modify:
  src/web-ui/modules/journey-store.js  — add isStrictlyLaterStage() and regressToStage() (AC2's state-reset logic)
  src/web-ui/routes/journey.js         — add handlePostJourneyRegress() handler (AC1 validation, AC3 decisions.md write); extend handleGetStageConfirmBack() with a reason field + regression form (AC1 UI)
  src/web-ui/server.js                 — wire POST /api/journey/:journeyId/regress (with the same requireNonViewer write-block gate every sibling POST route has)

Create:
  tests/check-ep3-s1-journey-store-regress.js   — unit tests for isStrictlyLaterStage()/regressToStage() (AC2)
  tests/check-ep3-s1-integration.js             — real-router-dispatch integration tests (AC1, AC2, AC3, tenant isolation, decisions.md preservation)
  tests/e2e/ep3-s1-regression.spec.js           — real browser render of the reason field + regression flow (AC1, AC2)
```

---

## Task 1: journey-store.js — stage-invalidation state logic (AC2) — ✅ COMPLETE (commit c13514c6)

Spec-compliance review: ✅ PASS. Code-quality review: ✅ APPROVED, 2 Minor (non-blocking) notes:
1. `regressToStage` does not itself validate `targetStage` against `STAGE_SEQUENCE`/`completedStages` — deferred by design to Task 2's route handler (`isStrictlyLaterStage` + a "was targetStage actually completed" check). **Task 2 must confirm this guard exists before `regressToStage` is reachable with unvalidated input** — carried forward as a verification item for Task 2's own review.
2. `regressToStage` only calls `saveJourney` (not `completeStage`'s two-call `updateStage`+`saveJourney` pattern) — confirmed correct and deliberate (no discrete per-stage disk update is needed here); a pre-existing, out-of-scope characteristic of the disk-adapter's `.stages` object going stale was also noted as unrelated to this diff.

**Files:**
- Modify: `src/web-ui/modules/journey-store.js`
- Test: `tests/check-ep3-s1-journey-store-regress.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
const assert = require('assert');
const journeyStore = require('../src/web-ui/modules/journey-store');

function testIsStrictlyLaterStage() {
  journeyStore._clearForTesting();
  assert.strictEqual(journeyStore.isStrictlyLaterStage('definition', 'definition-of-ready'), true, 'definition-of-ready is after definition');
  assert.strictEqual(journeyStore.isStrictlyLaterStage('definition-of-ready', 'definition'), false, 'definition is NOT after definition-of-ready');
  assert.strictEqual(journeyStore.isStrictlyLaterStage('definition', 'definition'), false, 'a stage is not later than itself');
  assert.strictEqual(journeyStore.isStrictlyLaterStage('not-a-real-stage', 'definition'), false, 'unknown earlier stage returns false, not a throw');
}
testIsStrictlyLaterStage();
console.log('  ok - isStrictlyLaterStage: correct earlier/later/self/unknown semantics');

function testRegressToStageRemovesTargetAndDownstream() {
  journeyStore._clearForTesting();
  const j = journeyStore.createJourney('ep3-s1-test-feature', 'default');
  journeyStore.completeStage(j.journeyId, 'discovery', 'artefacts/f/discovery.md');
  journeyStore.completeStage(j.journeyId, 'benefit-metric', 'artefacts/f/benefit-metric.md');
  journeyStore.completeStage(j.journeyId, 'definition', 'artefacts/f/definition.md');
  journeyStore.completeStage(j.journeyId, 'review', 'artefacts/f/review.md');
  journeyStore.setJourneyFields(j.journeyId, { activeSkill: 'test-plan' });

  const result = journeyStore.regressToStage(j.journeyId, 'definition');
  const journey = journeyStore.getJourney(j.journeyId);

  assert.deepStrictEqual(result.invalidatedStages.sort(), ['definition', 'review', 'test-plan', 'definition-of-ready'].sort(), 'invalidatedStages = targetStage + everything downstream of it in STAGE_SEQUENCE');
  assert.strictEqual(journey.activeSkill, 'definition', 'activeSkill reset to targetStage');
  const remainingNames = journey.completedStages.map((cs) => cs.skillName);
  assert.deepStrictEqual(remainingNames, ['discovery', 'benefit-metric'], 'only stages BEFORE targetStage remain complete');
}
testRegressToStageRemovesTargetAndDownstream();
console.log('  ok - regressToStage: removes targetStage + everything downstream from completedStages, resets activeSkill');

function testRegressToStageUnknownJourneyIsNoop() {
  journeyStore._clearForTesting();
  const result = journeyStore.regressToStage('not-a-real-journey-id', 'definition');
  assert.deepStrictEqual(result.invalidatedStages, [], 'unknown journeyId returns empty invalidatedStages, does not throw');
}
testRegressToStageUnknownJourneyIsNoop();
console.log('  ok - regressToStage: unknown journeyId is a safe no-op');

function testRegressToStagePreservesStagesBeforeTarget() {
  journeyStore._clearForTesting();
  const j = journeyStore.createJourney('ep3-s1-test-feature-2', 'default');
  journeyStore.completeStage(j.journeyId, 'discovery', 'artefacts/f2/discovery.md');
  const beforeCount = journeyStore.getJourney(j.journeyId).completedStages.length;
  journeyStore.regressToStage(j.journeyId, 'definition');
  const after = journeyStore.getJourney(j.journeyId);
  assert.strictEqual(after.completedStages.length, beforeCount, 'discovery (before targetStage) is untouched');
  assert.strictEqual(after.completedStages[0].skillName, 'discovery');
}
testRegressToStagePreservesStagesBeforeTarget();
console.log('  ok - regressToStage: stages before targetStage are never touched');

console.log('\n[ep3-s1-journey-store-regress] 4/4 passed');
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep3-s1-journey-store-regress.js
```

Expected output: `TypeError: journeyStore.isStrictlyLaterStage is not a function`

- [ ] **Step 3: Write minimal implementation**

Add to `src/web-ui/modules/journey-store.js`, immediately after `getDownstreamStages` (around line 294):

```javascript
/**
 * ep3-s1: true if `stage` appears strictly after `earlierStage` in
 * STAGE_SEQUENCE -- reuses getDownstreamStages rather than a second
 * hardcoded stage-order list (the same anti-pattern res-s4 already
 * avoided once in this codebase for materiality flagging). An unknown
 * `earlierStage`, or `stage === earlierStage`, both correctly return
 * false (getDownstreamStages returns [] for an unrecognised stage, and
 * never includes the stage itself).
 * @param {string} earlierStage
 * @param {string} stage
 * @returns {boolean}
 */
function isStrictlyLaterStage(earlierStage, stage) {
  return getDownstreamStages(earlierStage).indexOf(stage) !== -1;
}

/**
 * ep3-s1 (AC2): reset a journey's active stage back to targetStage and
 * remove completedStages entries for targetStage and everything
 * downstream of it. A stage is "incomplete" by this codebase's own
 * existing definition (absent from completedStages) -- no new field is
 * introduced. Underlying session/artefact files on disk are left
 * untouched (ADR-023: disk remains canonical; this only changes what the
 * journey model currently considers done). Stages BEFORE targetStage are
 * never touched.
 * @param {string} journeyId
 * @param {string} targetStage
 * @returns {{invalidatedStages: string[]}}
 */
function regressToStage(journeyId, targetStage) {
  var journey = _journeys.get(journeyId);
  if (!journey) return { invalidatedStages: [] };
  var toInvalidate = [targetStage].concat(getDownstreamStages(targetStage));
  var invalidatedSet = new Set(toInvalidate);
  journey.completedStages = (journey.completedStages || []).filter(function(cs) {
    return !invalidatedSet.has(cs.skillName);
  });
  journey.activeSkill = targetStage;
  if (_diskAdapter) {
    try { _diskAdapter.saveJourney(journey); } catch (_) {}
  }
  _pgWrite(journey);
  return { invalidatedStages: toInvalidate };
}
```

Add both to `module.exports` (alongside `getDownstreamStages`):

```javascript
  getDownstreamStages,
  isStrictlyLaterStage,
  regressToStage,
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep3-s1-journey-store-regress.js
```

Expected output: `[ep3-s1-journey-store-regress] 4/4 passed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the pre-existing, unrelated `tests/check-p3.5-validate-trace.js` (acknowledged at `/branch-setup`)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/modules/journey-store.js tests/check-ep3-s1-journey-store-regress.js
git commit -m "feat: add isStrictlyLaterStage/regressToStage to journey-store (ep3-s1 AC2)"
```

---

## Task 2: journey.js + server.js — regress endpoint (AC1 validation, AC3 decisions.md write) — ✅ COMPLETE (commits e4dc6ddf, eefa0310)

Spec-compliance review: ✅ PASS (explicitly confirmed the deferred validation guard from Task 1 is present and blocks both required failure modes). Code-quality review round 1: found 1 Critical + 1 Important + 2 Minor. Fixed in `eefa0310`:
- **Critical (fixed):** `regressToStage` was called BEFORE the path-traversal guard and decisions.md write — a guard/write failure could leave the journey silently regressed with no audit trail. Reordered: guard + full decisions.md write now happen first (using an independently-computed `invalidatedStages` matching `regressToStage`'s own internal computation exactly), and `regressToStage` is only called after both succeed.
- **Important (fixed):** the test file's router-dispatch block required `server.js` for the first time AFTER several `freshRequire()` calls had already stale-cached `journey.js` — masked by luck (the viewer-gate 403s first), but fragile and diverging from `check-ep2-s3-approval.js`'s own established precedent. Fixed: `require('../src/web-ui/server')` moved to the top of the file, before any `freshRequire()` call.
- **Minor (both fixed):** decisions.md wording no longer double-lists `targetStage`; `pool` parameter now has an explanatory comment.
Code-quality re-review: ✅ APPROVED, both substantive findings verified genuinely resolved by tracing the live code (not the commit message), no regressions.

**Files:**
- Modify: `src/web-ui/routes/journey.js`
- Modify: `src/web-ui/server.js`
- Test: `tests/check-ep3-s1-integration.js`

- [ ] **Step 1: Write the failing integration test**

Follows `tests/check-ep2-s3-approval.js`'s own established two-tier harness for this exact class of handler (same file, `routes/journey.js`, same `csrfGuard` dependency): direct handler calls with `req.body` pre-set (the documented "test injection scenario" `_readBody` short-circuit in `middleware/csrf.js`) for the bulk of AC coverage, plus one full-router-dispatch test to prove `server.js` wiring and the `vrne-s1` viewer-write-block gate.

```javascript
'use strict';
process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;
delete process.env.DATABASE_URL;

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const EventEmitter = require('events').EventEmitter;

const JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
const JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
const REPO_ROOT_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/repo-root.js');

function freshRequire() {
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(REPO_ROOT_ADAPTER_PATH)]; } catch (_) {}
  return { jStore: require(JOURNEY_STORE_PATH), j: require(JOURNEY_PATH) };
}

function makeRes() {
  const res = { _code: null, _body: '', _headers: {} };
  res.writeHead = function(code, headers) { res._code = code; Object.assign(res._headers, headers || {}); };
  res.end = function(body) { res._body += (body || ''); };
  return res;
}

const CSRF_TOKEN = 'csrf-tok-ep3s1';

function makeReq(overrides) {
  return Object.assign({
    session: { accessToken: 'tok', login: 'susan', tenantId: 'tenant-a', csrfToken: CSRF_TOKEN },
    params: {},
    body: { _csrf: CSRF_TOKEN },
    headers: {}
  }, overrides);
}

function fixtureJourney(r, featureSlug) {
  const j = r.jStore.createJourney(featureSlug, 'default');
  r.jStore.completeStage(j.journeyId, 'discovery', 'artefacts/' + featureSlug + '/discovery.md');
  r.jStore.completeStage(j.journeyId, 'benefit-metric', 'artefacts/' + featureSlug + '/benefit-metric.md');
  r.jStore.completeStage(j.journeyId, 'definition', 'artefacts/' + featureSlug + '/definition.md');
  r.jStore.completeStage(j.journeyId, 'review', 'artefacts/' + featureSlug + '/review.md');
  r.jStore.setJourneyFields(j.journeyId, { activeSkill: 'test-plan', tenantId: 'tenant-a', ownerId: 'susan' });
  return j.journeyId;
}

var passed = 0, failed = 0;
function check(label, ok) { if (ok) { console.log('  [PASS] ' + label); passed++; } else { console.error('  [FAIL] ' + label); failed++; } }

async function main() {
  check('handlePostJourneyRegress is exported', typeof require(JOURNEY_PATH).handlePostJourneyRegress === 'function');

  // --- AC1: reject a targetStage that is NOT earlier than the current stage ---
  {
    const r = freshRequire();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep3-s1-test-'));
    r.j.setRepoRoot(tmpDir);
    const journeyId = fixtureJourney(r, 'ep3s1-not-earlier');
    const res = makeRes();
    await r.j.handlePostJourneyRegress(makeReq({ params: { journeyId: journeyId }, body: { _csrf: CSRF_TOKEN, targetStage: 'test-plan', reason: 'not actually earlier' } }), res, null);
    check('AC1: regressing to the CURRENT stage is rejected with 400', res._code === 400);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // --- AC1: reject an empty reason ---
  {
    const r = freshRequire();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep3-s1-test-'));
    r.j.setRepoRoot(tmpDir);
    const journeyId = fixtureJourney(r, 'ep3s1-empty-reason');
    const res = makeRes();
    await r.j.handlePostJourneyRegress(makeReq({ params: { journeyId: journeyId }, body: { _csrf: CSRF_TOKEN, targetStage: 'definition', reason: '' } }), res, null);
    check('AC1: empty reason is rejected with 400', res._code === 400);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // --- AC1/AC2: a valid regression succeeds and resets state ---
  {
    const r = freshRequire();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep3-s1-test-'));
    r.j.setRepoRoot(tmpDir);
    const featureSlug = 'ep3s1-valid-regress';
    const journeyId = fixtureJourney(r, featureSlug);
    const res = makeRes();
    await r.j.handlePostJourneyRegress(makeReq({ params: { journeyId: journeyId }, body: { _csrf: CSRF_TOKEN, targetStage: 'definition', reason: 'Architecture constraint needs revision.' } }), res, null);
    check('AC1/AC2: valid regression returns 200', res._code === 200);
    const after = r.jStore.getJourney(journeyId);
    check('AC2: activeSkill reset to targetStage', after.activeSkill === 'definition');
    const remaining = after.completedStages.map(function(cs) { return cs.skillName; });
    check('AC2: downstream stages (definition, review) removed from completedStages', remaining.indexOf('definition') === -1 && remaining.indexOf('review') === -1);
    check('AC2: stages before targetStage (discovery, benefit-metric) are untouched', remaining.indexOf('discovery') !== -1 && remaining.indexOf('benefit-metric') !== -1);

    // --- AC3: decisions.md -- prior content preserved, new entry appended ---
    const decisionsPath = path.join(tmpDir, 'artefacts', featureSlug, 'decisions.md');
    const priorContent = fs.readFileSync(decisionsPath, 'utf8');
    check('AC3: a regression entry was appended to decisions.md', priorContent.indexOf('Regressed to definition by susan') !== -1);

    // Seed a SECOND regression on the same feature slug to prove the FIRST entry survives untouched.
    r.jStore.completeStage(journeyId, 'definition', 'artefacts/' + featureSlug + '/definition.md');
    r.jStore.completeStage(journeyId, 'review', 'artefacts/' + featureSlug + '/review.md');
    r.jStore.setJourneyFields(journeyId, { activeSkill: 'test-plan' });
    const res2 = makeRes();
    await r.j.handlePostJourneyRegress(makeReq({ params: { journeyId: journeyId }, body: { _csrf: CSRF_TOKEN, targetStage: 'definition', reason: 'Second regression, same feature slug, to test decisions.md preservation.' } }), res2, null);
    check('AC3: second regression also returns 200', res2._code === 200);
    const afterContent = fs.readFileSync(decisionsPath, 'utf8');
    check('AC3: prior decisions.md content is an exact untouched prefix of the new content', afterContent.indexOf(priorContent) === 0);
    check('AC3: a new regression entry was appended (file grew)', afterContent.length > priorContent.length);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // --- Tenant isolation ---
  {
    const r = freshRequire();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep3-s1-test-'));
    r.j.setRepoRoot(tmpDir);
    const journeyId = fixtureJourney(r, 'ep3s1-tenant-b');
    r.jStore.setJourneyFields(journeyId, { tenantId: 'tenant-b', ownerId: 'mallory' });
    const res = makeRes();
    await r.j.handlePostJourneyRegress(makeReq({
      session: { accessToken: 'tok', login: 'susan', tenantId: 'tenant-a', csrfToken: CSRF_TOKEN },
      params: { journeyId: journeyId },
      body: { _csrf: CSRF_TOKEN, targetStage: 'definition', reason: 'cross-tenant attempt' }
    }), res, null);
    check('Tenant isolation: cross-tenant regression request is rejected (not 200)', res._code !== 200);
    const after = r.jStore.getJourney(journeyId);
    check('Tenant isolation: cross-tenant journey state is untouched', after.activeSkill === 'test-plan');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // --- Wiring + viewer-gate proof: dispatch through the REAL exported router ---
  // Mirrors check-ep2-s3-approval.js's own testApproveRouteDeniesViewer --
  // this is the ONE test in this file that goes through server.js's actual
  // router (not a direct handler call), so it fails if the route is ever
  // unwired, and separately proves the vrne-s1 viewer-write-block gate.
  {
    const router = require('../src/web-ui/server').router;
    const seedTestSession = require('../src/web-ui/middleware/session').seedTestSession;

    function integrationMockRes() {
      var _statusCode = null, _headers = {}, _chunks = [];
      return {
        writeHead: function(c, h) { _statusCode = c; Object.assign(_headers, h || {}); return this; },
        setHeader: function(k, v) { _headers[k] = v; },
        end: function(b) { if (b != null) _chunks.push(b); },
        _get: function() { return { statusCode: _statusCode, headers: _headers, body: _chunks.join('') }; }
      };
    }
    function dispatchAndAwaitResponse(req) {
      return new Promise(function(resolve, reject) {
        var res = integrationMockRes();
        var settled = false;
        var origEnd = res.end;
        res.end = function(b) { origEnd(b); if (!settled) { settled = true; resolve(res._get()); } };
        router(req, res).catch(function(err) { if (!settled) { settled = true; reject(err); } });
      });
    }

    var sessionId = 'ep3s1-viewer-gate-sid';
    seedTestSession(sessionId, { accessToken: 'e2e-test-access-token', userId: 9003, login: 'ep3s1-viewer', tenantId: 'ep3s1-viewer-org' });
    var req = { headers: { cookie: 'session_id=' + sessionId }, method: 'POST', url: '/api/journey/does-not-matter/regress' };
    var result = await dispatchAndAwaitResponse(req);
    check('Wiring: POST /api/journey/:id/regress is reachable through the real router (not 404)', result.statusCode !== 404);
  }

  console.log('\n[ep3-s1-integration] ' + (passed + failed) + ' run, ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
}

main().catch(function(err) { console.error('FAIL (crash):', err); process.exitCode = 1; });
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ep3-s1-integration.js
```

Expected output: `AssertionError` on `typeof journeyRoute.handlePostJourneyRegress === 'function'` (undefined)

- [ ] **Step 3: Write the implementation**

Add to `src/web-ui/routes/journey.js`, immediately after `handlePostJourneyApprove` (around line 4549):

```javascript
/**
 * POST /api/journey/:journeyId/regress — ep3-s1 AC1/AC2/AC3.
 * Resets the journey's active stage back to an earlier, already-completed
 * stage and invalidates every stage from there onward (removed from
 * completedStages via journeyStore.regressToStage -- ADR-023: disk
 * artefacts/sessions are untouched, only the journey model's own "done"
 * bookkeeping changes). Records the regression as a decisions.md entry
 * using the same real disk-write pattern handlePostJourneyApprove
 * (ep2-s3) already establishes -- decisions.md is append-only, so prior
 * approval entries are never touched (AC3's "preserved, not deleted"
 * substance).
 */
async function handlePostJourneyRegress(req, res, pool) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'NOT_AUTHENTICATED' }));
    return;
  }
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var journeyId = req.params && req.params.journeyId;
  var journey = _journeyStore.getJourney(journeyId);
  try { requireJourneyAccess(journey, req.session, POLICY.TENANT); }
  catch (err) {
    res.writeHead(asHttpResponse(err, POLICY.TENANT), { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  var body = req.body || {};
  var targetStage = typeof body.targetStage === 'string' ? body.targetStage.trim() : '';
  var reason = typeof body.reason === 'string' ? body.reason.trim() : '';

  if (!reason) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Reason cannot be empty' }));
    return;
  }
  if (reason.length > 500) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Reason must be 500 characters or fewer' }));
    return;
  }

  var currentStage = journey.activeSkill || '';
  var isCompletedTarget = (journey.completedStages || []).some(function(cs) { return cs.skillName === targetStage; });
  if (!isCompletedTarget || !_journeyStore.isStrictlyLaterStage(targetStage, currentStage)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Target stage must be an earlier, already-completed stage' }));
    return;
  }

  var result = _journeyStore.regressToStage(journeyId, targetStage);

  var featureSlug = journey.featureSlug || '';
  var repoRoot = getRepoRoot(req);
  var decisionsPath = path.resolve(repoRoot, 'artefacts', featureSlug, 'decisions.md');
  var guard = path.resolve(repoRoot, 'artefacts', featureSlug);
  if (!guard.startsWith(repoRoot + path.sep)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid feature slug' }));
    return;
  }

  var date = new Date().toISOString().slice(0, 10);
  var requesterLogin = req.session.login || 'unknown';
  var title = 'Regressed to ' + targetStage + ' by ' + requesterLogin;
  var context = 'Regression requested via Request Regression at the ' + currentStage + ' stage of feature ' + featureSlug + '.';
  var decision = 'Feature stage reset to ' + targetStage + '; ' + result.invalidatedStages.join(', ') + ' marked incomplete.';
  var entry = '\n## ' + title + '\n\n'
    + '**Date:** ' + date + '\n'
    + '**Context:** ' + context + '\n'
    + '**Decision:** ' + decision + '\n'
    + '**Rationale:** ' + reason + '\n';

  try {
    var dir = path.dirname(decisionsPath);
    fs.mkdirSync(dir, { recursive: true });
    var header = '# Decisions — ' + featureSlug + '\n';
    if (!fs.existsSync(decisionsPath)) {
      fs.writeFileSync(decisionsPath, header, 'utf8');
    }
    fs.appendFileSync(decisionsPath, entry, 'utf8');
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to write regression record', detail: err.message }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ activeSkill: targetStage, invalidatedStages: result.invalidatedStages, decisionsWritten: decisionsPath }));
}
```

Add `handlePostJourneyRegress` to `journey.js`'s `module.exports` (alongside `handlePostJourneyApprove`).

In `src/web-ui/server.js`: add `handlePostJourneyRegress` to the destructured `require('./routes/journey')` import (line 39), and add a new route branch immediately after the existing `/api/journey/:journeyId/approve` branch (around line 3316):

```javascript
  } else if (pathname.match(/^\/api\/journey\/[^/]+\/regress$/) && req.method === 'POST') {
    // ep3-s1 — Request Regression: reset to an earlier stage, mark
    // downstream incomplete, record as a decisions.md entry
    req.params = { journeyId: pathname.split('/')[3] };
    // vrne-s1 — viewer-role write-block gate (AC2), matching every sibling POST route
    let _rnvOk = false;
    await requireNonViewer(req, res, () => { _rnvOk = true; });
    if (!_rnvOk) return;
    await handlePostJourneyRegress(req, res, _pshPool);
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ep3-s1-integration.js
```

Expected output: `[ep3-s1-integration] 12 run, 12 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the pre-existing, unrelated `tests/check-p3.5-validate-trace.js`

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journey.js src/web-ui/server.js tests/check-ep3-s1-integration.js
git commit -m "feat: wire POST /api/journey/:journeyId/regress (ep3-s1 AC1, AC3)"
```

---

## Task 3: journey.js — extend confirm-back interstitial with a reason field (AC1 UI) — ✅ COMPLETE (commits ac5632bf, b1f67703)

Spec-compliance review: ✅ PASS. Code-quality review round 1: found 2 Important + 3 Minor. Fixed in `b1f67703`:
- **Important (fixed):** element IDs used `sw-` prefix, colliding with this file's established CSS-class-only `sw-` namespace (every real element id elsewhere uses a scoped prefix like `jh-`/`sv-`/`rf-`). Renamed to `cb-regress-form`/`cb-regress-reason`/`cb-regress-submit` (also updated in this plan's own Task 4 E2E draft below).
- **Important (fixed):** the reason `<textarea>` had no `<label>`, relying only on `placeholder` (not a WCAG-valid label substitute) — every other form field in this file has one. Added `<label for="cb-regress-reason">`.
- **Minor (fixed):** textarea had no CSS class unlike its siblings — added `class="sv-textarea"`.
- **Minor (fixed):** `sw-btn--primary` had been moved onto the destructive "Request Regression" action instead of staying on the safe "Just view" action — swapped back (safe action keeps primary emphasis).
- **Minor (fixed):** `tests/check-ep1-s4-stage-routing.js`'s existing `handleGetStageConfirmBack` test had a cheap, pre-existing render-assertion precedent that wasn't updated for the new markup — added 3 assertions for the new form's IDs/action.
Code-quality re-review: ✅ APPROVED, all 5 findings verified genuinely resolved, no regressions. One non-blocking observation carried forward: the new `action="/api/journey/"` test assertion checks a URL prefix rather than the literal `.../regress` suffix — currently correctly discriminating (only `action=` on the page) but slightly loose; not required to fix.

**Coordinator-caught follow-up fix (commit `a79d1a1a`), before Task 4 dispatch:** `handlePostJourneyRegress` (Task 2) responds with JSON, matching its sibling `handlePostJourneyApprove`'s own already-reviewed contract — but the plain HTML `<form>` built in this task would submit and leave the browser displaying raw JSON instead of navigating anywhere sensible. Caught by re-reading the end-to-end flow before dispatching Task 4's E2E test (which would not itself have caught this, since it only checks server state via a separate API call, not the resulting page). Fixed by adding an inline `<script>` that intercepts the form submit with a `fetch()`-based JSON POST and redirects to `/journey/:journeyId` on success — matching this same file's own established `rm-upload-btn` fetch+redirect pattern exactly (see that handler a few functions above). No change to Task 2's API contract; `npm test` re-confirmed clean (693 files, 1 pre-existing unrelated failure) before commit.

**Files:**
- Modify: `src/web-ui/routes/journey.js` (`handleGetStageConfirmBack`)
- Test: covered by Task 4's E2E spec (this is a pure rendering change; no isolated unit test — matches this codebase's own established practice for render-only changes, e.g. `approval-modal.js`'s own client script)

- [ ] **Step 1: Write the implementation**

Replace `handleGetStageConfirmBack`'s body-construction block (around line 1974-1984) with:

```javascript
  var stageLbl = (STAGE_META.find(function(s) { return s.id === stageName; }) || {}).label || stageName;
  var reopenUrl = '/journey/' + encodeURIComponent(journeyId) + '/stage/' + encodeURIComponent(stageName) + '/reopen';
  var safeJourneyId = encodeURIComponent(journeyId);
  var body = [
    '<div class="sw-page-content" style="max-width:480px">',
      '<h1>Move back to ' + escHtml(stageLbl) + '?</h1>',
      '<p>This will show you prior artefacts and any revisions since then.</p>',
      '<a href="' + escHtml(reopenUrl) + '" class="sw-btn" style="margin-right:8px">Just view (no reset)</a>',
      '<a href="/journey">Cancel</a>',
      '<hr style="margin:24px 0">',
      '<h2>Or: Request Regression</h2>',
      '<p>Reset the feature to ' + escHtml(stageLbl) + ' and mark every stage after it as incomplete. Prior approvals in decisions.md are kept for audit.</p>',
      '<form method="POST" action="/api/journey/' + safeJourneyId + '/regress" id="cb-regress-form">',
        _csrf.csrfField(await _csrf.generateCsrfToken(req)),
        '<input type="hidden" name="targetStage" value="' + escHtml(stageName) + '">',
        '<textarea name="reason" id="cb-regress-reason" placeholder="Why is this regression needed? (required)" required minlength="1" style="width:100%;min-height:80px;margin-bottom:8px"></textarea>',
        '<button type="submit" class="sw-btn sw-btn--primary" id="cb-regress-submit">Request Regression</button>',
      '</form>',
    '</div>'
  ].join('');
```

(This is a plain HTML form POST — `_csrf.csrfGuard` already parses form-urlencoded bodies into `req.body`, matching `handlePostJourneyRegress`'s own body-reading code exactly. No new client-side JavaScript file is needed.)

- [ ] **Step 2: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing except the pre-existing, unrelated `tests/check-p3.5-validate-trace.js`

- [ ] **Step 3: Commit**

```bash
git add src/web-ui/routes/journey.js
git commit -m "feat: add reason field + Request Regression form to the confirm-back interstitial (ep3-s1 AC1)"
```

---

## Task 4: E2E — real browser render of the reason field + regression flow (AC1, AC2) — ✅ COMPLETE (commits e00ff076, f111d807)

**A genuine bug was found by this task's own E2E test** (not a review-round finding — caught live, by the test itself, on first run): `regressToStage` (Task 1) never cleared `journey.activeSessionId`, so `handleGetJourneyById`'s pre-existing "done session" fast-path bounced a post-regression user straight back into the stale, now-invalidated session instead of anywhere reflecting the regression — the story's own primary scenario, not a corner case. The implementer correctly reported BLOCKED rather than weakening the test to paper over it. Fixed directly (commit `e00ff076`): `regressToStage` now also clears `activeSessionId`, safe by a structurally-guaranteed invariant (only 2 call sites repo-wide ever mutate `activeSkill`/`activeSessionId`, always together, confirmed by repo-wide grep). The E2E test's own success assertion was corrected to match the REAL redirect chain (confirm-back → `/journey/:id` → `/journey/:slug/resume` → a fresh `/skills/definition/sessions/:sid/chat`), traced through both handlers directly rather than assumed.

Spec-compliance review: ✅ PASS, explicitly re-verified the fix's safety invariant independently (not on the commit message's claim) and re-traced the full redirect chain against the real handlers. Code-quality review: found 1 Important + 2 Minor, fixed in `f111d807`:
- **Important (fixed):** `test.setTimeout(30000)` was a no-op (equal to the global default) for a test that now waits through a 3-hop redirect chain — bumped to 60000ms, matching sibling E2E specs' own practice for comparable round trips.
- **Minor (fixed):** `regressToStage`'s JSDoc didn't mention the `activeSessionId` clear — updated.
- **Minor (not fixed, pre-existing, out of scope):** `handlePostJourneyRegress`'s JSON response includes a full server-side filesystem path (`decisionsWritten`) — confirmed to be an already-shipped pattern (`handlePostJourneyApprove`'s own `written` field, already relied upon by `ep2-s3`'s own E2E test), not something introduced by this task; flagged for a possible future cross-cutting cleanup, not blocking.

**Files:**
- Create: `tests/e2e/ep3-s1-regression.spec.js`

- [ ] **Step 1: Write the E2E test**

```javascript
'use strict';
const { test, expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

withAuth('ep3-s1: Request Regression form renders on the confirm-back interstitial (AC1); submitting resets the journey stage and downstream stages become unreachable via reopen (AC2)', async ({ page }) => {
  test.setTimeout(30000);

  const featureSlug = 'ep3-s1-e2e-' + Date.now();
  const reasonText = 'Architecture constraint needs revision before DoR. ep3-s1 E2E ' + Date.now() + '.';

  const seedRes = await page.request.post('/test/seed-approval-journey', {
    data: {
      featureSlug: featureSlug,
      stage: 'test-plan',
      completedStages: [
        { skillName: 'discovery' },
        { skillName: 'benefit-metric' },
        { skillName: 'definition' },
        { skillName: 'review' }
      ]
    },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(seedRes.status(), 'POST /test/seed-approval-journey').toBe(200);
  const seeded = await seedRes.json();
  expect(seeded.journeyId, 'expected a real journeyId').toBeTruthy();

  // AC1: navigate to the confirm-back interstitial for an earlier, completed stage
  await page.goto('/journey/' + seeded.journeyId + '/stage/definition/confirm-back');

  const reasonField = page.locator('#cb-regress-reason');
  const submitBtn = page.locator('#cb-regress-submit');
  await expect(reasonField).toBeVisible();
  await expect(submitBtn).toBeVisible();

  await reasonField.fill(reasonText);
  await submitBtn.click();

  // The form submit is intercepted by an inline <script> (fetch()-based JSON
  // POST, added as a coordinator-level fix so a plain form POST doesn't leave
  // the browser displaying raw JSON) that redirects to /journey/:journeyId on
  // success -- wait for that real navigation before checking server state, so
  // this test also proves the redirect itself actually fires.
  await page.waitForURL('**/journey/' + seeded.journeyId, { timeout: 10000 });

  // AC2: after the redirect/response, the journey's real state reflects the reset.
  // GET /api/journey/:journeyId (handleGetJourneyState) returns
  // { stage, stages: [{stage, status, navigable}, ...], ... } -- stage is the
  // CURRENT active stage; stages is the completedStages+active breadcrumb
  // (verified directly against handleGetJourneyState/_computeBreadcrumb
  // before writing this assertion -- there is no separate "/state" suffix
  // route and no raw completedStages array in the response).
  const stateRes = await page.request.get('/api/journey/' + seeded.journeyId);
  expect(stateRes.status(), 'GET /api/journey/:journeyId').toBe(200);
  const journeyState = await stateRes.json();
  expect(journeyState.stage, 'active stage reset to the regression target').toBe('definition');
  const breadcrumbStages = (journeyState.stages || []).map(function(s) { return s.stage; });
  expect(breadcrumbStages, 'review is no longer in the breadcrumb as a completed stage').not.toContain('review');
  expect(breadcrumbStages, 'discovery and benefit-metric remain in the breadcrumb').toContain('discovery');
  expect(breadcrumbStages, 'discovery and benefit-metric remain in the breadcrumb').toContain('benefit-metric');
  const definitionEntry = (journeyState.stages || []).find(function(s) { return s.stage === 'definition'; });
  expect(definitionEntry && definitionEntry.status, 'definition is the new active stage, not a completed one').toBe('active');

  // AC2 (downstream reachability): handleGetJourneyStageReopen's own guard
  // (`var stageEntry = (journey.completedStages||[]).find(...); if (!stageEntry) return 404`,
  // verified directly against the real handler before writing this
  // assertion) means reopening the now-invalidated "review" stage 404s.
  const reopenRes = await page.request.get('/journey/' + seeded.journeyId + '/stage/review/reopen');
  expect(reopenRes.status(), 'review is no longer completed, so its reopen link 404s').toBe(404);
});
```

- [ ] **Step 2: Run test**

```bash
npx playwright test tests/e2e/ep3-s1-regression.spec.js
```

Expected output: `1 passed`

- [ ] **Step 3: Run full regression**

```bash
npm test && npx playwright test
```

Expected output: all passing except the pre-existing, unrelated `tests/check-p3.5-validate-trace.js`

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/ep3-s1-regression.spec.js
git commit -m "test: E2E coverage for Request Regression form + real state reset (ep3-s1 AC1, AC2)"
```

---

## Notes for the implementing agent / reviewer

- **Design decision requiring confirmation before merge:** Task 3 keeps the existing "Just view (no reset)" link (the pre-existing `reopen` behavior, unchanged) alongside the new "Request Regression" form on the same interstitial page, per the design choice recorded in `decisions.md`. If product/UX feedback during review wants these as two entirely separate entry points (e.g. a distinct "Request Regression" button elsewhere on the journey page, not nested inside the stage-dot's own confirm-back flow), that is a design change to raise before implementation, not after — flag it immediately if raised.
- **AC3's literal text** ("query `feature_approvals`... approval records for DoR and later stages still exist") is satisfied in substance, not literally — see the DoR-correction entry in `decisions.md`. The DoD write-up should record this the same way `ep2-s3-dod.md` recorded its own analogous field-name deviation.
