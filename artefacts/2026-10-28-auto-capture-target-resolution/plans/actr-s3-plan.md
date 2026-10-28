# Extend bulk "Capture all" to include auto-resolved targets — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** `buildCaptureAllList` currently only includes an AC in `toCapture` when a MANUAL target exists (`journey.captureTargets`). Extend it to also include an AC when `actr-s2`'s own `_resolveAutoCaptureTarget` can resolve one, with manual always winning when both exist — and wire `handlePostCaptureAll` to compute that per-AC auto-resolution before calling it.
**Branch:** `feature/actr-s3`
**Worktree:** `.worktrees/actr-s3`
**Test command:** `node scripts/run-all-tests.js`; individual files via `node tests/check-<name>.js`.

---

## Design notes (read before starting)

1. **Test plan's own fixture description is stale — same correction as actr-s2's.** `tests/5`/`6` in the story's test plan describe mocking `fetchArtefact` to fake a test-plan+spec fixture for `_resolveAutoCaptureTarget`. That description predates `actr-s2`'s post-review redesign: `_resolveAutoCaptureTarget` (`src/web-ui/routes/playback-evidence.js`) now reads via the local repo clone (`getRepoRoot` + `fs`), not the GitHub Contents API — see `decisions.md`'s 2026-10-29 SUPERSEDED entry. The real fixture mechanism for these integration tests is `repoRootAdapter.setRepoRoot(tmpDir)` + writing real `test-plans/<slug>-test-plan.md` + spec files to that temp dir, exactly the convention `tests/check-ppc-s2-capture-all-route.js`'s own `setupFakeCapture()` helper already uses for an unrelated purpose (it already calls `setRepoRoot` for the capture-dispatch mechanics) — this story's own tests extend that same temp dir with real auto-resolution fixtures rather than mocking `fetchArtefact`.
2. **`_resolveAutoCaptureTarget` is synchronous, not async.** No `await`, no Promise handling needed when calling it from the new per-AC loop in `handlePostCaptureAll`.
3. **Skip-when-manual-exists is an established pattern, not new scope.** `actr-s2`'s own `handleGetPlaybackEvidence` only calls `_resolveAutoCaptureTarget` when `!hasManualTarget` (AC3/NFR-Performance there). Mirror that exact skip in `handlePostCaptureAll`'s new per-AC loop — never call `_resolveAutoCaptureTarget` for an AC that already has a manual target, since its result would be discarded by `buildCaptureAllList`'s own priority rule anyway (Task 1). This is what satisfies this story's own NFR-Performance ("must not re-fetch per AC more than once within that single request").
4. **`captureAllLock.setTotal` needs no handler change.** It already reads `listResult.toCapture.length` (line ~1309 today) — once Task 1's merge logic is correct, AC5 (`setTotal` reflects the merged count) falls out of Task 1 + Task 2's wiring automatically. Test 7 (`setTotalReflectsMergedCount`) is written as a regression guard proving this, not because new handler code is needed for it specifically.
5. **AC4's "no new error path"** means: `_resolveAutoCaptureTarget` already never throws (actr-s2's own AC5 guarantee) — the new per-AC loop just needs to treat a `null` result as "no auto-resolved target for this AC," pushing nothing into `autoResolvedTargets` for it. No try/catch needed around the call itself (though wrapping it is harmless defense-in-depth, matching this file's own existing conventions elsewhere).

---

## Task 1: Extend `buildCaptureAllList` to merge manual + auto-resolved targets (AC1, AC2)

**File:** `src/utils/capture-all.js`

### Step 1: Write the failing tests

Add to `tests/check-ppc-s2-capture-all-helpers.js` (same file the existing `buildCaptureAllList` test already lives in — do not create a new file for pure-function tests, matching this repo's own convention of one test file per production module unless a story's own test plan says otherwise):

```javascript
queue.push(function() {
  return test('buildCaptureAllList (actr-s3 AC1): an AC with no manual target but a resolvable auto-target is included; an AC with neither is skipped', function() {
    var feature = {
      acs: [{ acId: 'AC1' }, { acId: 'AC2' }, { acId: 'AC3' }],
      captureTargets: [{ acId: 'AC1', url: '/manual', selector: '#m' }],
      autoResolvedTargets: [{ acId: 'AC2', url: '/auto', selector: '#a' }]
    };
    var result = ca.buildCaptureAllList(feature);
    assert.strictEqual(result.toCapture.length, 2);
    assert.deepStrictEqual(result.toCapture.map(function(t) { return t.acId; }), ['AC1', 'AC2']);
    assert.strictEqual(result.skipped.length, 1);
    assert.strictEqual(result.skipped[0].acId, 'AC3');
  });
});

queue.push(function() {
  return test('buildCaptureAllList (actr-s3 AC2): a manual target takes priority over a resolvable auto-target for the same AC', function() {
    var feature = {
      acs: [{ acId: 'AC1' }],
      captureTargets: [{ acId: 'AC1', url: '/manual', selector: '#m' }],
      autoResolvedTargets: [{ acId: 'AC1', url: '/auto', selector: '#a' }]
    };
    var result = ca.buildCaptureAllList(feature);
    assert.deepStrictEqual(result.toCapture[0].target, { url: '/manual', selector: '#m' });
  });
});

queue.push(function() {
  return test('buildCaptureAllList (actr-s3 AC1, edge case): an auto-resolved-only AC is included even when captureTargets is empty', function() {
    var feature = {
      acs: [{ acId: 'AC1' }],
      captureTargets: [],
      autoResolvedTargets: [{ acId: 'AC1', url: '/auto', selector: '#a' }]
    };
    var result = ca.buildCaptureAllList(feature);
    assert.strictEqual(result.toCapture.length, 1);
    assert.deepStrictEqual(result.toCapture[0].target, { url: '/auto', selector: '#a' });
  });
});

queue.push(function() {
  return test('buildCaptureAllList (actr-s3 AC4, regression guard): an AC absent from BOTH captureTargets and autoResolvedTargets stays skipped, same as pre-actr-s3 behaviour', function() {
    var feature = {
      acs: [{ acId: 'AC1' }],
      captureTargets: [],
      autoResolvedTargets: []
    };
    var result = ca.buildCaptureAllList(feature);
    assert.strictEqual(result.toCapture.length, 0);
    assert.deepStrictEqual(result.skipped[0], { acId: 'AC1', reason: 'no capture target set' });
  });
});
```

Also confirm (do not modify) that the EXISTING test in this file — `'buildCaptureAllList: returns only ACs with a stored target...'` — still passes unmodified: it calls `buildCaptureAllList(feature)` with no `autoResolvedTargets` key at all, so the implementation must default a missing `autoResolvedTargets` to `[]`, exactly like the existing `captureTargets` default.

Run: `node tests/check-ppc-s2-capture-all-helpers.js` — confirm the 4 new tests fail (function doesn't look at `autoResolvedTargets` yet) and the 1 existing test still passes (RED for new, GREEN for existing).

### Step 2: Implement

In `src/utils/capture-all.js`, extend `buildCaptureAllList`:

```javascript
function buildCaptureAllList(feature) {
  var acs = (feature && feature.acs) || [];
  var targets = (feature && feature.captureTargets) || [];
  var autoTargets = (feature && feature.autoResolvedTargets) || [];
  var toCapture = [];
  var skipped = [];
  acs.forEach(function(ac) {
    var manual = targets.find(function(t) { return t.acId === ac.acId; });
    var auto = autoTargets.find(function(t) { return t.acId === ac.acId; });
    var source = manual || auto;
    if (source) {
      toCapture.push({ acId: ac.acId, target: { url: source.url, selector: source.selector } });
    } else {
      skipped.push({ acId: ac.acId, reason: 'no capture target set' });
    }
  });
  return { toCapture: toCapture, skipped: skipped };
}
```

Update the function's own JSDoc `@param` to document `autoResolvedTargets` alongside `captureTargets`.

### Step 3: Verify (GREEN)

Run `node tests/check-ppc-s2-capture-all-helpers.js` — all tests (the 1 pre-existing + 4 new) pass.

### Step 4: Spec-compliance review, then code-quality review

Dispatch both, same two-stage pattern as `actr-s1`/`actr-s2`. Confirm:
- AC1/AC2 literally satisfied by the 4 new tests' own assertions.
- `manual || auto` correctly implements "manual wins" (short-circuit: `manual` truthy → used; only falls to `auto` when `manual` is `undefined`).
- No behavioural change to the pre-existing manual-only path (Architecture Constraint: `buildCaptureAllList`'s own signature/contract is *extended*, not replaced).

---

## Task 2: Wire `handlePostCaptureAll` to compute auto-resolution before calling `buildCaptureAllList` (AC3, AC4, AC5)

**File:** `src/web-ui/routes/playback-evidence.js`

### Step 1: Write the failing tests

Add to `tests/check-ppc-s2-capture-all-route.js` (the existing `handlePostCaptureAll` integration test file — reuse its own `setupDodCompleteJourney`/`setupFakeCapture`/`makeReq`/`makeRes` helpers, do not duplicate them). New tests use `setupFakeCapture`'s own `tmpRoot` (already wired to `repoRootAdapter.setRepoRoot`) to write real test-plan.md + spec-file fixtures, per Design note #1 above — require `fs`/`path` at the top of the file if not already present (confirm first; `fs`/`path`/`os` are already required per the grep above).

```javascript
function writeAutoResolutionFixture(tmpRoot, featureSlug, storySlug, acId, specRelPath, specContent) {
  var testPlanDir = path.join(tmpRoot, 'artefacts', featureSlug, 'test-plans');
  fs.mkdirSync(testPlanDir, { recursive: true });
  fs.writeFileSync(
    path.join(testPlanDir, storySlug + '-test-plan.md'),
    ['## E2E Tests', '', '### t', '- **Verifies:** ' + acId, '- **File:** `' + specRelPath + '`', ''].join('\n')
  );
  var specDir = path.join(tmpRoot, path.dirname(specRelPath));
  fs.mkdirSync(specDir, { recursive: true });
  fs.writeFileSync(path.join(tmpRoot, specRelPath), specContent);
}

queue.push(function() {
  return test('actr-s3 AC3: handlePostCaptureAll dispatches a targets array with correct per-AC values for both a manual and an auto-resolved AC', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {});
    // AC1 real manual target; AC2 gets an auto-resolved one via a real
    // fixture; AC3 gets neither (no storySlug attached by the Postgres
    // single-row DoD branch this fixture uses -- stays skipped).
    store2.setCaptureTarget(setup.journeyId, 'AC1', '/manual-page', '.manual-sel');
    var fake = setupFakeCapture('actr-s3-dispatch');
    // _resolveAutoCaptureTarget requires a storySlug on the AC row, which
    // only the storySlugs-loop DoD branch attaches (actr-s2's own Task 1) --
    // setupDodCompleteJourney here uses the Postgres single-row branch, so
    // AC2 will never get a storySlug and this test's own auto-resolution
    // premise can't be exercised against it. Attach pipelineStateStorySlugs
    // directly so _getDodAcList's storySlugs-loop branch also contributes a
    // SEPARATE, real AC2 entry with a storySlug (same dual-source shape
    // _getDodAcList itself already supports -- see its own `acs.concat`).
    store2.setJourneyFields(setup.journeyId, { pipelineStateStorySlugs: ['actr-s3-story'] });
    store2.setPgAdapterForTesting({
      saveJourney: async function() {},
      getArtefactsForJourney: async function() {
        return [{ skill_name: 'definition-of-done', artefact_path: 'x', content:
          ['## AC Coverage', '', '| AC | Satisfied? | Evidence |', '|----|----|----|', '| AC1 — First | Yes | x |'].join('\n') }];
      }
    });
    writeAutoResolutionFixture(fake.tmpRoot, setup.featureSlug, 'actr-s3-story', 'AC2',
      'tests/e2e/fixture.spec.js',
      '// (AC2)\nwithAuth(\'x\', async ({ page }) => {\n  await page.goto(\'/auto-page\');\n  const el = page.locator(\'.auto-sel\');\n});\n');

    var dispatchedTargets = null;
    captureDispatchAdapter.setCaptureDispatchAdapter({
      dispatchCaptureWorkflow: async function(args) { dispatchedTargets = args.targets; },
      checkCaptureArtifact: async function() { return { found: false }; },
      downloadCaptureArtifact: async function() { return {}; }
    });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { body: { _csrf: 'test-csrf-token' } });
    var res = makeRes();
    await pe.handlePostCaptureAll(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));

    assert.ok(dispatchedTargets, 'dispatchCaptureWorkflow must have been called');
    var byAcId = {};
    dispatchedTargets.forEach(function(t) { byAcId[t.acId] = t; });
    assert.deepStrictEqual(byAcId.AC1, { acId: 'AC1', url: '/manual-page', selector: '.manual-sel' });
    assert.deepStrictEqual(byAcId.AC2, { acId: 'AC2', url: '/auto-page', selector: '.auto-sel' });
  });
});

queue.push(function() {
  return test('actr-s3 AC4: an AC whose auto-resolution fails lands in skipped, request still succeeds', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {
      dodContent: ['## AC Coverage', '', '| AC | Satisfied? | Evidence |', '|----|----|----|', '| AC1 — First | Yes | x |'].join('\n')
    });
    setupFakeCapture('actr-s3-fail'); // empty tmpRoot -- no test-plan.md for AC1 -> auto-resolution returns null
    // No manual target either -- AC1 must land in skipped, no manual, no auto.
    var dispatchCalled = false;
    captureDispatchAdapter.setCaptureDispatchAdapter({
      dispatchCaptureWorkflow: async function() { dispatchCalled = true; },
      checkCaptureArtifact: async function() { return { found: false }; },
      downloadCaptureArtifact: async function() { return {}; }
    });
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { body: { _csrf: 'test-csrf-token' }, headers: { accept: 'application/json' } });
    var res = makeRes();
    await pe.handlePostCaptureAll(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));
    assert.strictEqual(res._status, 200, 'must not 500 when an AC has no resolvable target of any kind');
    assert.strictEqual(dispatchCalled, false, 'nothing to dispatch when the only AC is unresolvable');
    assert.strictEqual(res._json.skipped[0].acId, 'AC1');
  });
});

queue.push(function() {
  return test('actr-s3 AC5: captureAllLock.setTotal reflects the merged manual+auto-resolved count, not just manual', async function() {
    var store2 = getStore();
    var setup = setupDodCompleteJourney(store2, {
      dodContent: ['## AC Coverage', '', '| AC | Satisfied? | Evidence |', '|----|----|----|',
        '| AC1 — First | Yes | x |', '| AC2 — Second | Yes | x |', '| AC3 — Third | Yes | x |'].join('\n')
    });
    store2.setCaptureTarget(setup.journeyId, 'AC1', '/m1', '#m1');
    store2.setCaptureTarget(setup.journeyId, 'AC2', '/m2', '#m2');
    var fake = setupFakeCapture('actr-s3-total');
    store2.setJourneyFields(setup.journeyId, { pipelineStateStorySlugs: ['actr-s3-story'] });
    store2.setPgAdapterForTesting({
      saveJourney: async function() {},
      getArtefactsForJourney: async function() {
        return [{ skill_name: 'definition-of-done', artefact_path: 'x', content:
          ['## AC Coverage', '', '| AC | Satisfied? | Evidence |', '|----|----|----|',
            '| AC1 — First | Yes | x |', '| AC2 — Second | Yes | x |'].join('\n') }];
      }
    });
    writeAutoResolutionFixture(fake.tmpRoot, setup.featureSlug, 'actr-s3-story', 'AC3',
      'tests/e2e/fixture3.spec.js',
      '// (AC3)\nwithAuth(\'x\', async ({ page }) => {\n  await page.goto(\'/auto3\');\n  const el = page.locator(\'.auto3\');\n});\n');
    captureDispatchAdapter.setCaptureDispatchAdapter({
      dispatchCaptureWorkflow: async function() {},
      checkCaptureArtifact: async function() { return { found: false }; },
      downloadCaptureArtifact: async function() { return {}; }
    });
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { body: { _csrf: 'test-csrf-token' } });
    var res = makeRes();
    await pe.handlePostCaptureAll(req, res, null, makeMockPool([{ repo_owner: 'acme', repo_name: 'widgets' }]));
    // setTotal already fired and the lock is released by the time the
    // response returns (handler's own try/finally) -- assert via the
    // dispatched target count instead, the same observable proxy
    // check-ppc-s2-capture-all-route.js's OWN existing tests already use
    // for "how many ACs did this run actually include."
  });
});
```

Note on the third test: `captureAllLock` releases and clears per-journey state once the handler's own request completes (confirmed by reading the existing file's own `assert.strictEqual(captureAllLock.getLockState(setup.journeyId), null, 'lock must be released once the run completes')` pattern) — so asserting `setTotal`'s call argument directly requires either a spy on `captureAllLock.setTotal` itself (preferred — add a thin spy wrapper in this test only, restore after) or asserting the dispatched `targets.length === 3` as an equivalent observable proxy. Pick whichever the real `capture-all-lock.js` module's own exports make straightforward once this task starts — confirm by reading `src/web-ui/modules/capture-all-lock.js`'s exports before finalizing this test's exact assertion mechanism.

Run: `node tests/check-ppc-s2-capture-all-route.js` — confirm the 3 new tests fail (handler doesn't compute `autoResolvedTargets` yet).

### Step 2: Implement

In `handlePostCaptureAll` (`src/web-ui/routes/playback-evidence.js`, ~line 1306-1309 today), between `_getDodAcList` and `buildCaptureAllList`:

```javascript
var acRows = await _getDodAcList(journey, req, pool);
var manualTargets = journey.captureTargets || [];
var autoResolvedTargets = [];
acRows.forEach(function(acRow) {
  var hasManual = manualTargets.some(function(t) { return t.acId === acRow.acId; });
  if (hasManual) return; // actr-s2's own skip-when-manual-exists optimization (NFR-Performance)
  var resolved = _resolveAutoCaptureTarget(req, journey, acRow);
  if (resolved) {
    autoResolvedTargets.push({ acId: acRow.acId, url: resolved.url, selector: resolved.selector });
  }
});
var listResult = buildCaptureAllList({ acs: acRows, captureTargets: manualTargets, autoResolvedTargets: autoResolvedTargets });
```

No other line in `handlePostCaptureAll` needs to change — `captureAllLock.setTotal(journey.journeyId, listResult.toCapture.length)` and the `targets`-building `.map()` just below already consume `listResult.toCapture`, which now correctly includes the merged set (Task 1).

### Step 3: Verify (GREEN)

Run `node tests/check-ppc-s2-capture-all-route.js` — all tests (pre-existing + 3 new) pass.
Run `node tests/check-ppc-s2-capture-all-helpers.js` — still passing (Task 1 untouched by this task).

### Step 4: Spec-compliance review, then code-quality review

Dispatch both. Confirm:
- AC3/AC4/AC5 literally satisfied.
- The skip-when-manual-exists optimization (Design note #3) is actually present — a reviewer should specifically check this isn't accidentally resolving for every AC regardless of manual-target status (would violate NFR-Performance and waste disk reads for no behavioural benefit, since `buildCaptureAllList`'s own priority rule would discard the auto-resolved value anyway).
- `_resolveAutoCaptureTarget`'s own null-safety (actr-s2's AC5) is relied upon correctly — no new try/catch needed, but confirm the reviewer actually traces this rather than assuming it.

---

## After both tasks: full regression run

`node scripts/run-all-tests.js` — 0 failures, full suite (not just the two touched files), before `/verify-completion`.
