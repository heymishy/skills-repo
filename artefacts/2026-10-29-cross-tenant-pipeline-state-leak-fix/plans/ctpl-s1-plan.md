# Tenant-match guard on pipeline-state-derived journey features — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Stop `GET /journey` from merging `heymishy/skills-repo`'s own internal `pipeline-state.json` features into every tenant's journey list. Add a tenant-match guard before the existing `_mergeStateFeaturesIntoJourneyListFn` call in `handleGetJourney`, comparing `req.session.tenantId` against `process.env.PLATFORM_TENANT_ID`.
**Branch:** `feature/ctpl-s1`
**Worktree:** `.worktrees/ctpl-s1`
**Test command:** `node scripts/run-all-tests.js`; individual files via `node tests/check-<name>.js`.

---

## Design notes

1. **One task, one call site.** This is a single, well-understood guard at `journey.js:450`. No new module, no new adapter.
2. **Fail-closed, not fail-open.** Both `req.session.tenantId` and `process.env.PLATFORM_TENANT_ID` must be non-empty strings AND equal. An empty-string/empty-string "match" must never pass — this is the exact AC3 risk, and it's a real one: `'' === ''` is `true` in JS, so the guard's own non-empty check must come first, not be an afterthought.
3. **Named predicate, not inline.** Per the DoR's own instruction: `_isPlatformSelfTenant(req)`, matching this file's existing convention of small named boolean helpers (e.g. nearby code already has similarly-shaped tenant checks).

---

## Task 1: Add the tenant-match guard (AC1, AC2, AC3)

**File:** `src/web-ui/routes/journey.js`

### Step 0: Required update to a PRE-EXISTING test (found by reading the real file, not assumed)

`tests/check-ep1-s1-journey-feature-merge.js` already has a real integration test at (today's) lines 128-149, `'integration: handleGetJourney renders a merged-in CLI-only feature with jh-continue'`, using `mockReq({params: {}})` (default `tenantId: 't1'`) with no `PLATFORM_TENANT_ID` set. Once the guard ships, this test's own merge will never fire (`'t1' !== undefined`), and its existing assertions (`href="/journey/ep1s1-render-active/resume"` present) will start failing — a real regression this task must fix, not a side effect to discover later. Wrap this existing test's body with `process.env.PLATFORM_TENANT_ID = 't1'` (matching the mock request's own default tenantId) before the `handleGetJourney` call, and restore (`delete`) it afterward, in a `try/finally` around the existing body — do not change what the test asserts, only add the precondition its own scenario now requires.

### Step 1: Write the failing tests

Add to `tests/check-ep1-s1-journey-feature-merge.js` (the existing file covering `_mergeStateFeaturesIntoJourneyList` and, by extension, its call site — do not create a new file for 5 small tests on an already-covered area):

```javascript
// ctpl-s1: tenant-match guard tests. These call handleGetJourney directly
// (not just _mergeStateFeaturesIntoJourneyList in isolation) because the
// guard lives at the CALL SITE in handleGetJourney, not inside the merge
// function itself -- a unit test on the merge function alone would prove
// nothing about whether the guard actually runs before it.
var journeyStore = require('../src/web-ui/modules/journey-store');

function mockReqWithTenant(tenantId) {
  return mockReq({ session: { accessToken: 'tok', userId: '1', login: 'alice', tenantId: tenantId } });
}

function withPlatformTenantId(value, fn) {
  var original = process.env.PLATFORM_TENANT_ID;
  if (value === undefined) delete process.env.PLATFORM_TENANT_ID;
  else process.env.PLATFORM_TENANT_ID = value;
  try { return fn(); }
  finally {
    if (original === undefined) delete process.env.PLATFORM_TENANT_ID;
    else process.env.PLATFORM_TENANT_ID = original;
  }
}

checkAsync('AC1: mismatched tenantId -- journey page has no merged pipeline-state features', async () => {
  writeState([{ slug: 'ctpl-leak-fixture-1', stage: 'definition', updatedAt: '2026-10-29T00:00:00.000Z' }]);
  await withPlatformTenantId('platform-tenant-x', async () => {
    var req = mockReqWithTenant('some-other-tenant');
    var res = mockRes();
    journeyStore.setRepoRoot && journeyStore.setRepoRoot(_scratchRoot); // if journey-store itself also needs pointing; confirm during implementation whether this line is needed
    await journeyRoutes.handleGetJourney(req, res, null, null);
    var body = res._get().body;
    assert.ok(body.indexOf('ctpl-leak-fixture-1') === -1, 'must not show a feature belonging to a different tenant');
  });
});

checkAsync('AC2: matching tenantId -- journey page still shows merged pipeline-state features (no regression)', async () => {
  writeState([{ slug: 'ctpl-leak-fixture-2', stage: 'definition', updatedAt: '2026-10-29T00:00:00.000Z' }]);
  await withPlatformTenantId('platform-tenant-x', async () => {
    var req = mockReqWithTenant('platform-tenant-x');
    var res = mockRes();
    await journeyRoutes.handleGetJourney(req, res, null, null);
    var body = res._get().body;
    assert.ok(body.indexOf('ctpl-leak-fixture-2') !== -1, 'the one legitimate (self-hosted) case must be unaffected by this fix');
  });
});

checkAsync('AC3: PLATFORM_TENANT_ID unset -- no merged features for anyone, even an empty-string tenantId (fail-closed)', async () => {
  writeState([{ slug: 'ctpl-leak-fixture-3', stage: 'definition', updatedAt: '2026-10-29T00:00:00.000Z' }]);
  await withPlatformTenantId(undefined, async () => {
    var req = mockReqWithTenant('');
    var res = mockRes();
    await journeyRoutes.handleGetJourney(req, res, null, null);
    var body = res._get().body;
    assert.ok(body.indexOf('ctpl-leak-fixture-3') === -1, 'an unset PLATFORM_TENANT_ID must never wildcard-match, including against an empty-string tenantId');
  });
});
```

**Before finalizing these 3 tests:** read `handleGetJourney`'s actual signature and what a null `pool` does to it (some earlier code paths in this file may need a real or mock pool for an unrelated reason — e.g. CSRF token generation, admin checks). Adjust the mock `req`/`pool` shape to whatever `mockReq`/an existing passing test in this same file already uses for a full `handleGetJourney` call — do not guess a shape that doesn't match this file's own established fixtures. If this file has no existing full `handleGetJourney` integration test to crib from, check `tests/check-sob-s2-journey-dashboard-integration.js` (also matched the earlier grep for `_mergeStateFeaturesIntoJourneyList`-adjacent tests) for a working fixture shape.

Run: `node tests/check-ep1-s1-journey-feature-merge.js` — confirm the 3 new tests fail (guard doesn't exist yet, so AC1 and AC3 both currently show the leaked feature).

### Step 2: Implement

Add near the top of `journey.js` (alongside other small helper functions in this file, not buried mid-file):

```javascript
// ctpl-s1 (AC1, AC2, AC3): only the platform's own self-hosted tenant may
// see pipeline-state.json features merged from getRepoRoot()'s content --
// getRepoRoot() has no real per-tenant repo clone to resolve to today (no
// WUCE_TENANT_ROOT_BASE configured on any known deployment), so for every
// OTHER tenant, getRepoRoot()'s content is never genuinely theirs. Reuses
// the exact identity check registerSelfAsProduct (server.js, pr-s1) already
// uses for "is this the self-hosted tenant" -- not a new concept.
// Fail-closed: both sides must be non-empty AND equal; '' === '' must never
// be treated as a match.
function _isPlatformSelfTenant(req) {
  var tenantId = req && req.session && req.session.tenantId;
  var platformTenantId = process.env.PLATFORM_TENANT_ID;
  return !!tenantId && !!platformTenantId && tenantId === platformTenantId;
}
```

Change line ~450 from:
```javascript
journeys = _mergeStateFeaturesIntoJourneyListFn(journeys, repoRoot); // ep1-s1
```
to:
```javascript
if (_isPlatformSelfTenant(req)) {
  journeys = _mergeStateFeaturesIntoJourneyListFn(journeys, repoRoot); // ep1-s1
}
```

### Step 3: Verify (GREEN)

Run `node tests/check-ep1-s1-journey-feature-merge.js` — all tests (pre-existing + 3 new) pass.
Run `node scripts/run-all-tests.js` — full suite, 0 regressions (confirms the pure `_mergeStateFeaturesIntoJourneyList` function's own existing tests are untouched, and no other caller of `handleGetJourney` broke).

### Step 4: Spec-compliance review, then code-quality review

Dispatch both. Confirm specifically:
- The guard genuinely SKIPS the merge call (not just filters its output afterward) — re-read the diff, don't just trust the plan's own prose.
- The empty-string collision case (AC3) is both implemented correctly (`!!tenantId` catches `''`) AND has a real test proving it, not just an assertion in a comment.
- No other code path in `handleGetJourney` between the old call site and the new one accidentally reads `repoRoot`'s pipeline-state.json content a second, unguarded way.

---

## After the task: live staging confirmation (DoR's own High oversight instruction)

Per this story's own DoR: before calling this done, do a live Chrome check on staging (once merged) repeating the exact navigation this session used to find the leak — confirm the leak is actually gone for a real non-self-hosted tenant session. Do not substitute test-suite evidence for this; the DoR explicitly calls for the real check.
