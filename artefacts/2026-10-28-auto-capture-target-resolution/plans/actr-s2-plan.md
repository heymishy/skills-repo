# Auto-resolve the single-AC capture target before falling back to manual entry — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Before showing the manual capture-target form for an AC, attempt to auto-resolve it from the story's own `test-plans/<story-slug>-test-plan.md` + the named E2E spec file (via the existing `fetchArtefact`/`fetchRepoPath` adapters and `actr-s1`'s `deriveCaptureTargetFromSpec`), falling back to today's manual form whenever resolution is unavailable or fails. A manually-set target always wins when both exist.
**Branch:** `feature/actr-s2`
**Worktree:** `.worktrees/actr-s2`
**Test command:** `node scripts/run-all-tests.js` (confirmed from `package.json`'s `scripts.test`); individual files run via `node tests/check-<name>.js`.

---

## Design notes (read before starting — these resolve ambiguity the DoR flagged as a known unknown)

> **SUPERSEDED 2026-10-29 (post-implementation correction — see `decisions.md`'s "SUPERSEDED" entry for the full rationale):** Design note #1 immediately below, and every code sample in this plan built on it, chose the GitHub Contents API (`fetchArtefact`/`fetchRepoPath`) to read a story's `test-plan.md` and its named E2E spec file. That choice made the feature's happy path impossible to exercise in any automated test — both functions need a real OAuth-authenticated access token, which cannot be materialised in a test process, and `fetchRepoPath` is explicitly never wired under `NODE_ENV=test` by design. `_resolveAutoCaptureTarget` (`src/web-ui/routes/playback-evidence.js`) was redesigned to read both files via the local-clone pattern (`getRepoRoot` + `ensureRepoFresh` + `fs.readFileSync`, with the file's own pre-existing `_resolveSafeShotPath` guard) already used elsewhere in this same file for committed screenshots/videos. `fetchRepoPath`/`setRepoPathFetcherModule` were removed as dead code; `_fetchArtefact`/`setFetcherModule` remain in place, since `_getDodAcList`'s own DoD-list read (a separate, still-unchanged concern) still legitimately needs the GitHub API. The rest of this plan document is left as-written as the historical record of the original implementation pass — the code samples below referencing `fetchRepoPath`/`setRepoPathFetcherModule` no longer match the shipped code; see `_resolveAutoCaptureTarget`'s own current source and `tests/check-actr-s2-auto-resolve-single-ac.js`'s current T3a-h/T4a-c/T5/T6a-b for what actually shipped.

1. **Which adapter fetches the spec file** (superseded — see note above). `src/web-ui/adapters/artefact-fetcher.js` has TWO relevant functions: `fetchArtefact(featureSlug, artefactType, token, repoOverride)` (fixed `artefacts/<slug>/<type>.md` shape — already used in this file for `test-plans/<storySlug>-test-plan`) and `fetchRepoPath(owner, repo, path, token)` (arbitrary repo path — already built, already D37-wired to a real implementation in `server.js:252`, never yet used in `playback-evidence.js`). Use `fetchArtefact` for the test-plan (it fits the artefact-shaped convention) and `fetchRepoPath` for the spec file (`tests/e2e/....spec.js` does not fit `fetchArtefact`'s fixed shape at all). Both are existing adapters — no new one is introduced, satisfying the story's own Architecture Constraint.
2. **Which journeys can be auto-resolved at all.** `_getDodAcList` has two branches: a Postgres single-row branch (`dodRow`, one row total per journey per `UNIQUE(journey_id, skill_name)` — chat-walkthrough-originated, storySlug not reliably recoverable) and a `storySlugs`-loop branch (`journey.pipelineStateStorySlugs`, GitHub-sync fallback — storySlug known with certainty per iteration, per `ppc-s4`'s own AC6). **Auto-resolution only applies to AC rows that carry a known `storySlug`** — Task 1 attaches it in the loop branch only. The Postgres-row branch's AC rows get no `storySlug`, so `_resolveAutoCaptureTarget` returns `null` for them immediately — this is the correct, honest behaviour (AC5: never guess), not a gap to fix later.
3. **Real test-plan `E2E Tests` section shape**, confirmed against the real file `artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s6-test-plan.md` (lines 144–161): a `## E2E Tests` heading, then one `### <test name>` subheading per test, each containing a `**Verifies:** AC_n...` line and a `**File:** <path>` line — but a SECOND test verifying the same AC may say `**File:** Same spec file, second test` instead of repeating the path. The parser must fall back to the nearest PRECEDING real file path within the same `## E2E Tests` section when a block's own `File:` line has no real path. Task 2's parser and its tests are built against this real shape, not a simplified assumption.

---

## File map

```
Modify:
  src/web-ui/routes/playback-evidence.js       — storySlug on DoD AC rows (Task 1); _findE2eSpecFileForAc + _resolveAutoCaptureTarget (Tasks 2-3); render wiring (Task 4); dispatch wiring (Task 5); Override link/query-param handling (Task 6)

Create:
  tests/check-actr-s2-auto-resolve-single-ac.js — unit + route-level tests for all 6 tasks
```

No other files change. `src/utils/capture-target-derivation.js` (actr-s1) is consumed, not modified.

---

## Task 1: Attach storySlug to DoD AC rows (prerequisite for AC1-AC6)

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Create: `tests/check-actr-s2-auto-resolve-single-ac.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/check-actr-s2-auto-resolve-single-ac.js` with this content:

```javascript
'use strict';
// check-actr-s2-auto-resolve-single-ac.js -- TDD tests for actr-s2
// (2026-10-28-auto-capture-target-resolution).
// Story: artefacts/2026-10-28-auto-capture-target-resolution/stories/actr-s2-auto-resolve-single-ac-capture-target.md
var assert = require('assert');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  var result;
  try { result = fn(); } catch (err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve(); }
  if (result && typeof result.then === 'function') {
    return result.then(function() { passed++; console.log('  PASS: ' + name); }, function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); });
  }
  passed++; console.log('  PASS: ' + name); return Promise.resolve();
}
var queue = [];

var store = require('../src/web-ui/modules/journey-store');
var pe = require('../src/web-ui/routes/playback-evidence');
var fetcher = require('../src/web-ui/adapters/artefact-fetcher');
pe.setJourneyStoreModule(store);

function getStore() { store._clearForTesting(); return store; }
function makeRes() {
  var res = { _status: null, _body: null, _headers: {},
    writeHead: function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); },
    end: function(body) { res._body = (res._body || '') + (body || ''); } };
  return res;
}
var _n = 0;
function makeReq(tenantId, productId, featureSlug, extra) {
  _n++;
  return Object.assign({ session: { tenantId: tenantId, userId: 'actr-s2-user-' + _n, accessToken: 'test-token', login: 'user' },
    sessionId: 'sid-' + tenantId, params: { productId: productId, featureSlug: featureSlug }, headers: { accept: 'text/html' }, query: {} }, extra || {});
}
function makeMockPool() { return { query: async function() { return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] }; } }; }

// Sets up a GitHub-sync-fallback journey (the storySlugs-loop branch of
// _getDodAcList) -- the only branch Task 1 attaches storySlug to.
function setupPipelineStateJourney(store, storySlugs, acId, acDescription) {
  var slug = 'actr-s2-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  var j = store.createJourney(slug);
  store.setJourneyFields(j.journeyId, {
    tenantId: 'tenant-a', productId: 'product-a',
    completedStages: [{ skillName: 'definition-of-done', artefactPath: null, completedAt: new Date().toISOString() }],
    pipelineStateStorySlugs: storySlugs
  });
  return { journeyId: j.journeyId, featureSlug: slug };
}

console.log('\n[actr-s2] Task 1: storySlug attached to DoD AC rows');

queue.push(function() {
  return test('T1 (prerequisite): _getDodAcList attaches storySlug to each AC row in the storySlugs-loop branch', function() {
    pe.setFetcherModule(async function(featureSlug, artefactType) {
      if (artefactType === 'dod/story-one-dod') return '## AC Coverage\n\n| AC | Satisfied? | Evidence |\n|----|----|----|\n| AC1 — First | Yes | x |\n';
      if (artefactType === 'dod/story-two-dod') return '## AC Coverage\n\n| AC | Satisfied? | Evidence |\n|----|----|----|\n| AC1 — Second | Yes | y |\n';
      throw new fetcher.ArtefactNotFoundError(featureSlug, artefactType);
    });
    var store2 = getStore();
    var setup = setupPipelineStateJourney(store2, ['story-one', 'story-two']);
    var journey = store2.getJourneyByTenantProductSlug('tenant-a', 'product-a', setup.featureSlug);
    return pe._getDodAcList(journey, makeReq('tenant-a', 'product-a', setup.featureSlug), makeMockPool()).then(function(acs) {
      pe.setFetcherModule(fetcher.fetchArtefact);
      assert.strictEqual(acs.length, 2);
      assert.strictEqual(acs[0].storySlug, 'story-one', 'first story\'s own AC row must carry its own storySlug');
      assert.strictEqual(acs[1].storySlug, 'story-two', 'second story\'s own AC row must carry ITS storySlug, not the first one\'s');
    }, function(err) { pe.setFetcherModule(fetcher.fetchArtefact); throw err; });
  });
});

// Driver: runs every queued test in order and prints the final summary.
// Added HERE, in Task 1, not at the end of the file -- every later task's
// own RED/GREEN step depends on this actually executing and printing
// PASS/FAIL output. Do NOT add a second copy of this block in any later
// task; each later task's "Step 1: Write the failing tests" instruction
// only means "insert new queue.push(...) blocks ABOVE this runner," never
// duplicate the runner itself. Confirm exactly one `runAll` invocation
// exists in the file before finishing any task.
console.log('\n[actr-s2] Running all queued tests...');
(function runAll(i) {
  if (i >= queue.length) {
    console.log('\n[actr-s2-auto-resolve-single-ac] Results: ' + passed + ' passed, ' + failed + ' failed');
    process.exit(failed > 0 ? 1 : 0);
    return;
  }
  queue[i]().then(function() { runAll(i + 1); });
})(0);
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-actr-s2-auto-resolve-single-ac.js
```

Expected output: `FAIL: T1 ...` — `pe._getDodAcList` is not currently exported, or if it is, `acs[0].storySlug` is `undefined`.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/playback-evidence.js`, find `_getDodAcList` (currently around line 333). Change the `storySlugs` loop body from:

```javascript
      var content = await _fetchArtefact(journey.featureSlug, 'dod/' + storySlugs[i] + '-dod', accessToken, ownerRepo);
      acs = acs.concat(parseDodAcCoverage(content));
```

to:

```javascript
      var content = await _fetchArtefact(journey.featureSlug, 'dod/' + storySlugs[i] + '-dod', accessToken, ownerRepo);
      var storySlug = storySlugs[i];
      var storyAcs = parseDodAcCoverage(content).map(function(ac) {
        // actr-s2 (prerequisite for AC1-AC6): tags each AC row with the
        // story it came from -- an AC id (e.g. "AC1") is only unique WITHIN
        // one story, not across a whole feature, so auto-resolution
        // (Task 3) needs this to know which story's own test-plan.md to
        // fetch. The Postgres single-row branch above (dodRow) does NOT
        // get this treatment -- see this plan's own Design notes #2.
        ac.storySlug = storySlug;
        return ac;
      });
      acs = acs.concat(storyAcs);
```

Also add `_getDodAcList` to this file's `module.exports` (find the existing `module.exports = { ... }` block near the end of the file and add `_getDodAcList` to it) — the test above calls it directly.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-actr-s2-auto-resolve-single-ac.js
```

Expected output: `[actr-s2] ... PASS: T1 ...` — 1 passed, 0 failed (this is the only test so far).

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing, including the existing `check-ppc-s4-pipeline-state-dod-fallback.js` (which exercises this exact loop branch and must be unaffected by the added `storySlug` field, since it only asserts on `acId`/`description`/etc., not the full object shape).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-actr-s2-auto-resolve-single-ac.js
git commit -m "feat(actr-s2): attach storySlug to DoD AC rows (prerequisite for auto-resolution)"
```

---

## Task 2: E2E spec-file finder (pure logic, AC2/AC4's "no E2E coverage" case)

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Modify: `tests/check-actr-s2-auto-resolve-single-ac.js`

- [ ] **Step 1: Write the failing tests**

Insert ABOVE the `runAll` driver at the bottom of the test file (added in Task 1 -- do not duplicate it):

```javascript
console.log('\n[actr-s2] Task 2: E2E spec-file finder');

queue.push(function() {
  return test('T2a: finds the File: path for the AC named in a Verifies: line', function() {
    var content = require('fs').readFileSync('artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s6-test-plan.md', 'utf8');
    var result = pe._findE2eSpecFileForAc(content, 'AC6');
    assert.strictEqual(result, 'tests/e2e/ppc-s6-responsive-summary.spec.js', 'must resolve the real backtick-wrapped File: path from the real ppc-s6 test-plan.md');
  });
});

queue.push(function() {
  return test('T2b: a second test block saying "Same spec file..." falls back to the nearest preceding real path', function() {
    var content = [
      '## E2E Tests', '',
      '### firstTest',
      '- **Verifies:** AC1',
      '- **File:** `tests/e2e/fixture.spec.js`',
      '',
      '### secondTest',
      '- **Verifies:** AC1',
      '- **File:** Same spec file, second test',
      ''
    ].join('\n');
    var result = pe._findE2eSpecFileForAc(content, 'AC1');
    assert.strictEqual(result, 'tests/e2e/fixture.spec.js', 'the FIRST matching block already has the real path -- confirms the loop returns on first match, not last');
  });
});

queue.push(function() {
  return test('T2c: returns null when the AC is not named in any Verifies: line (manual-only AC, AC4\'s own case)', function() {
    var content = [
      '## E2E Tests', '',
      '### someTest',
      '- **Verifies:** AC9',
      '- **File:** `tests/e2e/fixture.spec.js`',
      ''
    ].join('\n');
    var result = pe._findE2eSpecFileForAc(content, 'AC1');
    assert.strictEqual(result, null);
  });
});

queue.push(function() {
  return test('T2d: returns null (never throws) when the test-plan has no E2E Tests section at all', function() {
    var content = '## Unit Tests\n\nAC1 is covered by a unit test only.\n';
    var result = pe._findE2eSpecFileForAc(content, 'AC1');
    assert.strictEqual(result, null);
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-actr-s2-auto-resolve-single-ac.js
```

Expected output: `FAIL: T2a/T2b/T2c/T2d` — `pe._findE2eSpecFileForAc` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add this function to `src/web-ui/routes/playback-evidence.js` (place it near the top-level helper functions, e.g. just above `_getDodAcList`):

```javascript
/**
 * actr-s2 (Task 2): finds the E2E spec file path covering a given AC in a
 * story's own test-plan.md content, by scanning its "## E2E Tests" section
 * for a "### <test name>" block whose "**Verifies:** AC_n..." line names
 * the AC, then reading that block's "**File:**" line. If that block's own
 * File: line has no real path (e.g. "Same spec file, second test" --
 * confirmed real shape, artefacts/2026-10-20-production-playback-capture/
 * test-plans/ppc-s6-test-plan.md lines 154-157), falls back to the nearest
 * PRECEDING block's real path within the same section.
 * Pure, synchronous, no I/O. Never throws -- returns null for any shape it
 * doesn't recognise (no E2E Tests section, AC not named, etc.), per AC4's
 * "manual-only AC" case and AC5's "never surface an error" requirement.
 * @param {string} testPlanContent
 * @param {string} acId
 * @returns {string|null}
 */
function _findE2eSpecFileForAc(testPlanContent, acId) {
  var sectionMatch = /^## E2E Tests\s*$/m.exec(testPlanContent || '');
  if (!sectionMatch) return null;

  var afterHeading = testPlanContent.slice(sectionMatch.index + sectionMatch[0].length);
  var nextHeadingMatch = /^## /m.exec(afterHeading);
  var sectionText = nextHeadingMatch ? afterHeading.slice(0, nextHeadingMatch.index) : afterHeading;

  var blocks = sectionText.split(/^### /m).slice(1);
  var lastRealFile = null;
  var acRe = new RegExp('\\b' + acId + '\\b');

  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    var fileMatch = /\*\*File:\*\*\s*(.+)/.exec(block);
    var realPath = null;
    if (fileMatch) {
      var pathMatch = /`?([\w-./]+\.spec\.js)`?/.exec(fileMatch[1]);
      if (pathMatch) {
        realPath = pathMatch[1];
        lastRealFile = realPath;
      }
    }
    var verifiesMatch = /\*\*Verifies:\*\*\s*(.+)/.exec(block);
    if (verifiesMatch && acRe.test(verifiesMatch[1])) {
      return realPath || lastRealFile;
    }
  }
  return null;
}
```

Add `_findE2eSpecFileForAc` to the file's `module.exports` block (the test calls it directly).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-actr-s2-auto-resolve-single-ac.js
```

Expected output: 5 passed, 0 failed (T1 + T2a-T2d).

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-actr-s2-auto-resolve-single-ac.js
git commit -m "feat(actr-s2): add E2E spec-file finder, tested against the real ppc-s6 test-plan.md shape"
```

---

## Task 3: Auto-resolution function (AC4, AC5 — the fail-safe wiring)

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Modify: `tests/check-actr-s2-auto-resolve-single-ac.js`

- [ ] **Step 1: Write the failing tests**

Insert ABOVE the `runAll` driver at the bottom of the test file:

```javascript
console.log('\n[actr-s2] Task 3: _resolveAutoCaptureTarget (AC4, AC5)');

function makeFakeJourney(featureSlug) {
  return { featureSlug: featureSlug, productId: 'product-a', tenantId: 'tenant-a' };
}

queue.push(function() {
  return test('T3a (AC resolution, happy path): resolves url+selector via test-plan.md + spec file', function() {
    pe.setFetcherModule(async function(featureSlug, artefactType) {
      if (artefactType === 'test-plans/story-one-test-plan') {
        return ['## E2E Tests', '', '### t', '- **Verifies:** AC1', '- **File:** `tests/e2e/actr-s2-fixture.spec.js`', ''].join('\n');
      }
      throw new fetcher.ArtefactNotFoundError(featureSlug, artefactType);
    });
    pe.setRepoPathFetcherModule(async function(owner, repo, path) {
      if (path === 'tests/e2e/actr-s2-fixture.spec.js') {
        return '// fixture.spec.js (story-one AC1)\nwithAuth(\'x\', async ({ page }) => {\n  await page.goto(\'/actr-s2-fixture\');\n  const el = page.locator(\'.actr-s2-target\');\n});\n';
      }
      throw new fetcher.ArtefactNotFoundError(owner + '/' + repo, path);
    });
    var journey = makeFakeJourney('actr-s2-t3a-feature');
    var acRow = { acId: 'AC1', storySlug: 'story-one' };
    var req = makeReq('tenant-a', 'product-a', journey.featureSlug);
    return pe._resolveAutoCaptureTarget(req, makeMockPool(), journey, acRow).then(function(result) {
      pe.setFetcherModule(fetcher.fetchArtefact);
      pe.setRepoPathFetcherModule(fetcher.fetchRepoPath);
      assert.deepStrictEqual(result, { url: '/actr-s2-fixture', selector: '.actr-s2-target', specFile: 'tests/e2e/actr-s2-fixture.spec.js' });
    }, function(err) { pe.setFetcherModule(fetcher.fetchArtefact); pe.setRepoPathFetcherModule(fetcher.fetchRepoPath); throw err; });
  });
});

queue.push(function() {
  return test('T3b (AC4): no storySlug on the AC row -- returns null without attempting any fetch', function() {
    var fetchAttempted = false;
    pe.setFetcherModule(async function() { fetchAttempted = true; throw new Error('should never be called'); });
    var journey = makeFakeJourney('actr-s2-t3b-feature');
    var acRow = { acId: 'AC1' }; // no storySlug -- the Postgres single-row-branch case
    var req = makeReq('tenant-a', 'product-a', journey.featureSlug);
    return pe._resolveAutoCaptureTarget(req, makeMockPool(), journey, acRow).then(function(result) {
      pe.setFetcherModule(fetcher.fetchArtefact);
      assert.strictEqual(result, null);
      assert.strictEqual(fetchAttempted, false, 'must not attempt any fetch when storySlug is unknown');
    }, function(err) { pe.setFetcherModule(fetcher.fetchArtefact); throw err; });
  });
});

queue.push(function() {
  return test('T3c (AC4): test-plan exists but names no E2E spec for this AC -- returns null, no spec fetch attempted', function() {
    var specFetchAttempted = false;
    pe.setFetcherModule(async function(featureSlug, artefactType) {
      if (artefactType === 'test-plans/story-one-test-plan') return '## Unit Tests\n\nAC1 is unit-only.\n';
      throw new fetcher.ArtefactNotFoundError(featureSlug, artefactType);
    });
    pe.setRepoPathFetcherModule(async function() { specFetchAttempted = true; throw new Error('should never be called'); });
    var journey = makeFakeJourney('actr-s2-t3c-feature');
    var acRow = { acId: 'AC1', storySlug: 'story-one' };
    var req = makeReq('tenant-a', 'product-a', journey.featureSlug);
    return pe._resolveAutoCaptureTarget(req, makeMockPool(), journey, acRow).then(function(result) {
      pe.setFetcherModule(fetcher.fetchArtefact);
      pe.setRepoPathFetcherModule(fetcher.fetchRepoPath);
      assert.strictEqual(result, null);
      assert.strictEqual(specFetchAttempted, false);
    }, function(err) { pe.setFetcherModule(fetcher.fetchArtefact); pe.setRepoPathFetcherModule(fetcher.fetchRepoPath); throw err; });
  });
});

queue.push(function() {
  return test('T3d (AC5): test-plan.md fetch 404s -- returns null, never throws', function() {
    pe.setFetcherModule(async function(featureSlug, artefactType) { throw new fetcher.ArtefactNotFoundError(featureSlug, artefactType); });
    var journey = makeFakeJourney('actr-s2-t3d-feature');
    var acRow = { acId: 'AC1', storySlug: 'story-one' };
    var req = makeReq('tenant-a', 'product-a', journey.featureSlug);
    return pe._resolveAutoCaptureTarget(req, makeMockPool(), journey, acRow).then(function(result) {
      pe.setFetcherModule(fetcher.fetchArtefact);
      assert.strictEqual(result, null);
    }, function(err) { pe.setFetcherModule(fetcher.fetchArtefact); throw err; });
  });
});

queue.push(function() {
  return test('T3e (AC5): spec file fetch fails -- returns null, never throws', function() {
    pe.setFetcherModule(async function(featureSlug, artefactType) {
      if (artefactType === 'test-plans/story-one-test-plan') {
        return ['## E2E Tests', '', '### t', '- **Verifies:** AC1', '- **File:** `tests/e2e/missing.spec.js`', ''].join('\n');
      }
      throw new fetcher.ArtefactNotFoundError(featureSlug, artefactType);
    });
    pe.setRepoPathFetcherModule(async function(owner, repo, path) { throw new fetcher.ArtefactNotFoundError(owner + '/' + repo, path); });
    var journey = makeFakeJourney('actr-s2-t3e-feature');
    var acRow = { acId: 'AC1', storySlug: 'story-one' };
    var req = makeReq('tenant-a', 'product-a', journey.featureSlug);
    return pe._resolveAutoCaptureTarget(req, makeMockPool(), journey, acRow).then(function(result) {
      pe.setFetcherModule(fetcher.fetchArtefact);
      pe.setRepoPathFetcherModule(fetcher.fetchRepoPath);
      assert.strictEqual(result, null);
    }, function(err) { pe.setFetcherModule(fetcher.fetchArtefact); pe.setRepoPathFetcherModule(fetcher.fetchRepoPath); throw err; });
  });
});

queue.push(function() {
  return test('T3f (AC5): no connected repo (ownerRepo null) -- returns null, never throws', function() {
    var journey = makeFakeJourney('actr-s2-t3f-feature');
    var acRow = { acId: 'AC1', storySlug: 'story-one' };
    var req = makeReq('tenant-a', 'product-a', journey.featureSlug);
    var poolWithNoRepo = { query: async function() { return { rows: [] }; } };
    return pe._resolveAutoCaptureTarget(req, poolWithNoRepo, journey, acRow).then(function(result) {
      assert.strictEqual(result, null);
    });
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-actr-s2-auto-resolve-single-ac.js
```

Expected output: `FAIL: T3a-T3f` — `pe._resolveAutoCaptureTarget`/`pe.setRepoPathFetcherModule` do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add near the top of `src/web-ui/routes/playback-evidence.js`, alongside the existing `_fetchArtefact`/`setFetcherModule` pair (around line 48-49):

```javascript
// actr-s2 (Task 3): same test-seam-wrapper convention as _fetchArtefact/
// setFetcherModule immediately above -- fetchRepoPath already has its own
// full D37 adapter in artefact-fetcher.js (already wired to a real
// implementation in server.js:252), this is just this file's own
// injectable reference to it, not a new adapter.
var _fetchRepoPath = require('../adapters/artefact-fetcher').fetchRepoPath;
function setRepoPathFetcherModule(fn) { _fetchRepoPath = fn; }
```

Add this import near the top of the file, alongside the other requires:

```javascript
const { deriveCaptureTargetFromSpec } = require('../../utils/capture-target-derivation');
```

Add this function, placed after `_findE2eSpecFileForAc` (Task 2):

```javascript
/**
 * actr-s2 (Task 3, AC4/AC5): attempts to auto-resolve a capture target for
 * one AC from its own story's test-plan.md + the E2E spec file it names.
 * Returns {url, selector, specFile} on success, or null for EVERY failure
 * mode below -- never throws, per AC5's "an auto-resolution failure must
 * never surface as a page error" requirement:
 *  - acRow has no storySlug (Postgres single-row-branch journeys -- see
 *    this plan's own Design notes #2)
 *  - no connected repo / no access token
 *  - the test-plan.md fetch 404s or fails for any other reason
 *  - the test-plan names no E2E spec for this AC (_findE2eSpecFileForAc
 *    returns null) -- the normal, expected case for a manual-only AC
 *  - the spec-file fetch fails
 *  - deriveCaptureTargetFromSpec resolves neither a url nor a selector
 * @param {object} req
 * @param {object} pool
 * @param {object} journey
 * @param {{acId: string, storySlug?: string}} acRow
 * @returns {Promise<{url: string, selector: string, specFile: string}|null>}
 */
async function _resolveAutoCaptureTarget(req, pool, journey, acRow) {
  if (!acRow.storySlug) return null;
  try {
    var accessToken = req.session && req.session.accessToken;
    var ownerRepo = await _resolveOwnerRepo(journey.productId, journey.tenantId, pool);
    if (!ownerRepo || !accessToken) return null;

    var testPlanContent = await _fetchArtefact(journey.featureSlug, 'test-plans/' + acRow.storySlug + '-test-plan', accessToken, ownerRepo);
    var specFile = _findE2eSpecFileForAc(testPlanContent, acRow.acId);
    if (!specFile) return null;

    var specContent = await _fetchRepoPath(ownerRepo.owner, ownerRepo.repo, specFile, accessToken);
    var derived = deriveCaptureTargetFromSpec(specContent, acRow.acId);
    if (!derived || !derived.url || !derived.selector) return null;

    return { url: derived.url, selector: derived.selector, specFile: specFile };
  } catch (_) {
    return null;
  }
}
```

Add `_resolveAutoCaptureTarget`, `setRepoPathFetcherModule` to the file's `module.exports` block.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-actr-s2-auto-resolve-single-ac.js
```

Expected output: 11 passed, 0 failed (T1 + T2a-T2d + T3a-T3f).

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-actr-s2-auto-resolve-single-ac.js
git commit -m "feat(actr-s2): add fail-safe auto-resolution wiring (test-plan + spec fetch + deriveCaptureTargetFromSpec)"
```

---

## Task 4: Render wiring (AC1, AC3)

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Modify: `tests/check-actr-s2-auto-resolve-single-ac.js`

- [ ] **Step 1: Write the failing tests**

Insert ABOVE the `runAll` driver at the bottom of the test file. This task needs a full `setupPipelineStateJourney`-driven render test — extend the helper from Task 1 to accept a `dodContentByStory` map:

```javascript
console.log('\n[actr-s2] Task 4: render wiring (AC1, AC3)');

function setupSingleAcJourney(store, acDescription) {
  var slug = 'actr-s2-render-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  var j = store.createJourney(slug);
  store.setJourneyFields(j.journeyId, {
    tenantId: 'tenant-a', productId: 'product-a',
    completedStages: [{ skillName: 'definition-of-done', artefactPath: null, completedAt: new Date().toISOString() }],
    pipelineStateStorySlugs: ['story-one']
  });
  return { journeyId: j.journeyId, featureSlug: slug };
}
function installHappyPathFetchers() {
  pe.setFetcherModule(async function(featureSlug, artefactType) {
    if (artefactType === 'dod/story-one-dod') return '## AC Coverage\n\n| AC | Satisfied? | Evidence |\n|----|----|----|\n| AC1 — Shows the thing | Yes | x |\n';
    if (artefactType === 'test-plans/story-one-test-plan') {
      return ['## E2E Tests', '', '### t', '- **Verifies:** AC1', '- **File:** `tests/e2e/actr-s2-render-fixture.spec.js`', ''].join('\n');
    }
    throw new fetcher.ArtefactNotFoundError(featureSlug, artefactType);
  });
  pe.setRepoPathFetcherModule(async function(owner, repo, path) {
    if (path === 'tests/e2e/actr-s2-render-fixture.spec.js') {
      return '// fixture.spec.js (story-one AC1)\nwithAuth(\'x\', async ({ page }) => {\n  await page.goto(\'/actr-s2-render-fixture\');\n  const el = page.locator(\'.actr-s2-render-target\');\n});\n';
    }
    throw new fetcher.ArtefactNotFoundError(owner + '/' + repo, path);
  });
}
function restoreRealFetchers() { pe.setFetcherModule(fetcher.fetchArtefact); pe.setRepoPathFetcherModule(fetcher.fetchRepoPath); }

queue.push(function() {
  return test('T4a (AC1): no manual target, resolvable auto-target -- renders auto-detected block, no manual form for that AC', function() {
    installHappyPathFetchers();
    var store4 = getStore();
    var setup = setupSingleAcJourney(store4);
    var req = makeReq('tenant-a', 'product-a', setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, makeMockPool()).then(function() {
      restoreRealFetchers();
      assert.strictEqual(res._status, 200);
      assert.ok(res._body.indexOf('Auto-detected from') !== -1, 'must show the auto-detected block');
      assert.ok(res._body.indexOf('/actr-s2-render-fixture') !== -1, 'must show the resolved url');
      assert.ok(res._body.indexOf('.actr-s2-render-target') !== -1, 'must show the resolved selector');
      assert.ok(res._body.indexOf('name="url"') === -1, 'the manual entry form must NOT be present for this AC when auto-resolved and not overridden');
    }, function(err) { restoreRealFetchers(); throw err; });
  });
});

queue.push(function() {
  return test('T4b (AC1): the capture button is available immediately (no manual entry required first)', function() {
    installHappyPathFetchers();
    var store4 = getStore();
    var setup = setupSingleAcJourney(store4);
    var req = makeReq('tenant-a', 'product-a', setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, makeMockPool()).then(function() {
      restoreRealFetchers();
      assert.ok(res._body.indexOf('Capture evidence') !== -1, 'capture button must render for an auto-resolved target, same as a manually-set one');
    }, function(err) { restoreRealFetchers(); throw err; });
  });
});

queue.push(function() {
  return test('T4c (AC3): a manually-set target takes priority over a resolvable auto-target', function() {
    installHappyPathFetchers();
    var store4 = getStore();
    var setup = setupSingleAcJourney(store4);
    store4.setCaptureTarget(setup.journeyId, 'AC1', '/manually-set-url', '.manually-set-selector');
    var req = makeReq('tenant-a', 'product-a', setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, makeMockPool()).then(function() {
      restoreRealFetchers();
      assert.ok(res._body.indexOf('/manually-set-url') !== -1, 'the manual value must be shown');
      assert.ok(res._body.indexOf('/actr-s2-render-fixture') === -1, 'the auto-resolved value must NEVER be shown when a manual target already exists');
      assert.ok(res._body.indexOf('Auto-detected from') === -1, 'the auto-detected label must not appear when a manual target wins');
    }, function(err) { restoreRealFetchers(); throw err; });
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-actr-s2-auto-resolve-single-ac.js
```

Expected output: `FAIL: T4a/T4b/T4c` — today's render always shows the manual form and never shows "Auto-detected from".

- [ ] **Step 3: Write minimal implementation**

In `handleGetPlaybackEvidence`, find the `var acs = acRows.map(function(ac) { ... });` block (around line 691-710). This needs to become async per-AC (since auto-resolution is async) — change `.map` to a loop building the array, and add the resolution call. Read the current exact code first, then apply this shape:

```javascript
  var acs = [];
  for (var acIdx = 0; acIdx < acRows.length; acIdx++) {
    var acRow = acRows[acIdx];
    var manualTarget = _journeyStore.getCaptureTargetState(captureTargets, acRow.acId);
    var hasManualTarget = manualTarget !== _journeyStore.CAPTURE_TARGET_NOT_SET;
    // actr-s2 (AC3, NFR-Performance): only attempt auto-resolution when no
    // manual target already exists -- a manual target always wins, and
    // skipping the fetch entirely when it's not even needed keeps this
    // bounded to "one extra fetch pair per AC lacking a manual target",
    // not "one extra fetch pair per AC unconditionally".
    var autoResolved = hasManualTarget ? null : await _resolveAutoCaptureTarget(req, pool, journey, acRow);
    var activeTarget = hasManualTarget ? manualTarget : autoResolved;
    var targetSet = !!activeTarget;
    acs.push({
      acId: acRow.acId,
      description: acRow.description,
      targetSet: targetSet,
      target: targetSet ? activeTarget : null,
      isAutoResolved: !hasManualTarget && !!autoResolved,
      autoResolvedSpecFile: (!hasManualTarget && autoResolved) ? autoResolved.specFile : null,
      overrideRequested: !!(req.query && req.query.override === acRow.acId),
      screenshotPath: screenshots[acRow.acId] || null,
      videoPath: videos[acRow.acId] || null,
      lastCaptureFailure: captureAllFailed[acRow.acId] || null,
      captureInProgress: !!inProgressAcIds[acRow.acId]
    });
  }
```

This replaces the existing `.map(...)` block entirely (keep the existing `coCoveredAcIds` computation immediately after it, which reads from `acs` and is unaffected by this change).

In `_renderPlaybackEvidenceHtml`'s per-AC `rows = acs.map(function(ac) {...})` block, change the `statusHtml` and the manual-form rendering. Read the current exact code first (around lines 234-298), then apply:

Replace:
```javascript
    var statusHtml = ac.targetSet
      ? '<p>Target: <code>' + _escapeHtml(ac.target.url) + '</code> / <code>' + _escapeHtml(ac.target.selector) + '</code></p>'
      : '<p role="status">Capture target not set</p>';
```
with:
```javascript
    // actr-s2 (AC1, AC6): an auto-resolved target gets its own distinct
    // label + an Override link (query-param driven, no client JS -- matches
    // this page's own established no-JS convention) instead of the generic
    // "Target: ..." line a manually-set target still uses unchanged.
    var statusHtml;
    if (ac.isAutoResolved) {
      statusHtml = '<p>Auto-detected from <code>' + _escapeHtml(ac.autoResolvedSpecFile) + '</code>: <code>' + _escapeHtml(ac.target.url) + '</code> / <code>' + _escapeHtml(ac.target.selector) + '</code> ' +
        '— <a href="' + baseUrl + '?override=' + encodeURIComponent(ac.acId) + '">Override</a></p>';
    } else if (ac.targetSet) {
      statusHtml = '<p>Target: <code>' + _escapeHtml(ac.target.url) + '</code> / <code>' + _escapeHtml(ac.target.selector) + '</code></p>';
    } else {
      statusHtml = '<p role="status">Capture target not set</p>';
    }
```

Then find the manual `<form>` block (the one with `action="' + baseUrl + '/targets/' + ...`, lines ~285-292) and wrap it so it is skipped when auto-resolved and not overridden:

Replace:
```javascript
      '<form method="POST" action="' + baseUrl + '/targets/' + encodeURIComponent(ac.acId) + '">' +
        _csrf.csrfField(csrfToken) +
        '<label for="url-' + _escapeHtml(ac.acId) + '">Page URL</label><br>' +
        '<input id="url-' + _escapeHtml(ac.acId) + '" name="url" type="url" required value="' + (ac.target ? _escapeHtml(ac.target.url) : '') + '"><br>' +
        '<label for="selector-' + _escapeHtml(ac.acId) + '">CSS selector</label><br>' +
        '<input id="selector-' + _escapeHtml(ac.acId) + '" name="selector" type="text" required value="' + (ac.target ? _escapeHtml(ac.target.selector) : '') + '"><br>' +
        '<button type="submit">Set capture target</button>' +
      '</form>' +
```
with:
```javascript
      // actr-s2 (AC1, AC4, AC6): hidden ONLY when this AC's target is
      // auto-resolved and no override has been requested for it -- every
      // other case (not auto-resolved at all, AC4's manual-only case,
      // override requested) renders this exact unchanged form, so AC4's
      // "no behavioural regression" requirement holds by construction, not
      // by a separate code path.
      ((ac.isAutoResolved && !ac.overrideRequested) ? '' :
      '<form method="POST" action="' + baseUrl + '/targets/' + encodeURIComponent(ac.acId) + '">' +
        _csrf.csrfField(csrfToken) +
        '<label for="url-' + _escapeHtml(ac.acId) + '">Page URL</label><br>' +
        '<input id="url-' + _escapeHtml(ac.acId) + '" name="url" type="url" required value="' + (ac.target && !ac.isAutoResolved ? _escapeHtml(ac.target.url) : '') + '"><br>' +
        '<label for="selector-' + _escapeHtml(ac.acId) + '">CSS selector</label><br>' +
        '<input id="selector-' + _escapeHtml(ac.acId) + '" name="selector" type="text" required value="' + (ac.target && !ac.isAutoResolved ? _escapeHtml(ac.target.selector) : '') + '"><br>' +
        '<button type="submit">Set capture target</button>' +
      '</form>') +
```

(Note: the pre-filled `value="..."` for url/selector inputs now checks `!ac.isAutoResolved` too — when the form IS shown for an auto-resolved-but-overridden AC, it should start blank for a fresh entry, not silently pre-filled with the auto-detected guess as if it were already a saved manual value.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-actr-s2-auto-resolve-single-ac.js
```

Expected output: 14 passed, 0 failed (T1 + T2a-T2d + T3a-T3f + T4a-T4c).

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing — pay particular attention to `check-ppc-s1-ui-layer.js`/`check-ppc-s6-dashboard-shell-parity.js` and any other existing test asserting on the manual form's presence/pre-filled values for a NON-auto-resolved AC (i.e. every existing fixture, since none of them have a resolvable test-plan+spec) — these must all still show the form exactly as before.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-actr-s2-auto-resolve-single-ac.js
git commit -m "feat(actr-s2): render auto-detected capture target read-only, manual-priority (AC1, AC3)"
```

---

## Task 5: Dispatch wiring (AC2)

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Modify: `tests/check-actr-s2-auto-resolve-single-ac.js`

- [ ] **Step 1: Write the failing test**

Insert ABOVE the `runAll` driver at the bottom of the test file:

```javascript
console.log('\n[actr-s2] Task 5: dispatch wiring (AC2)');

var captureDispatchAdapter = require('../src/web-ui/adapters/capture-dispatch-adapter');
var nonceStore = require('../src/web-ui/adapters/capture-nonce-store');

queue.push(function() {
  return test('T5 (AC2): triggering capture with no manual entry dispatches the auto-resolved target', function() {
    installHappyPathFetchers();
    var originalIssueNonce = nonceStore.issueNonce;
    nonceStore.setNonceStoreAdapter && nonceStore.setNonceStoreAdapter({ issue: async function() { return 'fake-nonce'; }, exchange: async function() { return null; } });
    var dispatched = null;
    var originalDispatchAdapter = captureDispatchAdapter.getCaptureDispatchAdapter();
    captureDispatchAdapter.setCaptureDispatchAdapter({
      dispatchCaptureWorkflow: async function(args) { dispatched = args; },
      checkCaptureArtifact: async function() { return { found: false }; },
      downloadCaptureArtifact: async function() { return {}; }
    });
    var store5 = getStore();
    var setup = setupSingleAcJourney(store5);
    var req = makeReq('tenant-a', 'product-a', setup.featureSlug, {
      method: 'POST', params: { productId: 'product-a', featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { _csrf: 'test-csrf-token' }, headers: { accept: 'application/json', host: 'localhost' }
    });
    var res = makeRes();
    return pe.handlePostCaptureTrigger(req, res, null, makeMockPool()).then(function() {
      restoreRealFetchers();
      captureDispatchAdapter.setCaptureDispatchAdapter(originalDispatchAdapter);
      assert.ok(dispatched, 'dispatchCaptureWorkflow must have been called');
      assert.deepStrictEqual(dispatched.targets, [{ acId: 'AC1', url: '/actr-s2-render-fixture', selector: '.actr-s2-render-target' }]);
    }, function(err) { restoreRealFetchers(); captureDispatchAdapter.setCaptureDispatchAdapter(originalDispatchAdapter); throw err; });
  });
});
```

**Before writing this test for real:** read `handlePostCaptureTrigger`'s actual current CSRF-guard and rate-limiter requirements (`_csrf.csrfGuard`, `_captureRateLimiter`) and `tests/check-ppc-s3-capture-rate-limit.js`/`check-ppc-s9-capture-dispatch-wiring.js` for the exact fake-request shape (CSRF token value, nonce-store mocking convention, rate-limiter reset between tests) already established for THIS exact handler — do not guess the mock shape; copy the established convention exactly, per this repo's own CLAUDE.md "Mock-shape verification" rule. The test skeleton above is a starting point, not a guaranteed-correct final form — adjust it to match what those existing test files actually do for CSRF/nonce/rate-limit setup before trusting a RED result.

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-actr-s2-auto-resolve-single-ac.js
```

Expected output: `FAIL: T5` — `dispatched` is `null` or the 400 "no capture target set for this AC" response fires instead, since `handlePostCaptureTrigger` doesn't attempt auto-resolution yet.

- [ ] **Step 3: Write minimal implementation**

In `handlePostCaptureTrigger` (around line 1020-1100), find:

```javascript
  var captureTargets = journey.captureTargets || [];
  var target = _journeyStore.getCaptureTargetState(captureTargets, acId);
  if (target === _journeyStore.CAPTURE_TARGET_NOT_SET) {
    _sendJson(res, 400, { error: 'no capture target set for this AC' });
    return;
  }
```

Replace with:

```javascript
  var captureTargets = journey.captureTargets || [];
  var target = _journeyStore.getCaptureTargetState(captureTargets, acId);
  if (target === _journeyStore.CAPTURE_TARGET_NOT_SET) {
    // actr-s2 (AC2): no manual target -- attempt the same auto-resolution
    // the render path already uses, before giving up. Needs this AC's own
    // storySlug, which isn't known from acId alone here -- resolve the DoD
    // AC list the same way the render path does.
    var acRows = await _getDodAcList(journey, req, pool);
    var acRow = acRows.find(function(row) { return row.acId === acId; });
    var autoResolved = acRow ? await _resolveAutoCaptureTarget(req, pool, journey, acRow) : null;
    if (!autoResolved) {
      _sendJson(res, 400, { error: 'no capture target set for this AC' });
      return;
    }
    target = { acId: acId, url: autoResolved.url, selector: autoResolved.selector };
  }
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-actr-s2-auto-resolve-single-ac.js
```

Expected output: 15 passed, 0 failed.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing — pay particular attention to the existing capture-trigger tests (`check-ppc-s1-playback-evidence-route.js`, `check-ppc-s3-capture-rate-limit.js`, `check-ppc-s9-capture-dispatch-wiring.js`) that exercise the `CAPTURE_TARGET_NOT_SET` → 400 path for an AC with genuinely no target at all (not auto-resolvable either) — these must still 400 exactly as before, since `_resolveAutoCaptureTarget` returns `null` for them too.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-actr-s2-auto-resolve-single-ac.js
git commit -m "feat(actr-s2): dispatch capture using the auto-resolved target when no manual entry exists (AC2)"
```

---

## Task 6: Override round-trip confirmation (AC6)

**Files:**
- Modify: `tests/check-actr-s2-auto-resolve-single-ac.js` only — Task 4's `?override=` query-param check and Task 4/existing `handlePostCaptureTarget`'s manual-priority write path already implement AC6's full behaviour; this task is the dedicated end-to-end test proving the round-trip, not new production code.

- [ ] **Step 1: Write the failing test**

Insert ABOVE the `runAll` driver at the bottom of the test file:

```javascript
console.log('\n[actr-s2] Task 6: Override round-trip (AC6)');

queue.push(function() {
  return test('T6a: ?override=<acId> reveals the manual form even though the target is auto-resolved', function() {
    installHappyPathFetchers();
    var store6 = getStore();
    var setup = setupSingleAcJourney(store6);
    var req = makeReq('tenant-a', 'product-a', setup.featureSlug, { query: { override: 'AC1' } });
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, makeMockPool()).then(function() {
      restoreRealFetchers();
      assert.ok(res._body.indexOf('Auto-detected from') !== -1, 'the auto-detected info line should still show for context');
      assert.ok(res._body.indexOf('name="url"') !== -1, 'the manual form must now be present because override was requested');
    }, function(err) { restoreRealFetchers(); throw err; });
  });
});

queue.push(function() {
  return test('T6b: submitting the override form, then reloading without ?override, shows the overridden value and hides the auto-detected block', function() {
    installHappyPathFetchers();
    var store6 = getStore();
    var setup = setupSingleAcJourney(store6);
    store6.setCaptureTarget(setup.journeyId, 'AC1', '/overridden-url', '.overridden-selector');
    var req = makeReq('tenant-a', 'product-a', setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, makeMockPool()).then(function() {
      restoreRealFetchers();
      assert.ok(res._body.indexOf('/overridden-url') !== -1, 'the overridden value must now be the active target');
      assert.ok(res._body.indexOf('Auto-detected from') === -1, 'the auto-detected label must be gone -- manual now wins, per AC3\'s own priority rule');
    }, function(err) { restoreRealFetchers(); throw err; });
  });
});
```

**Where to insert this:** these two `queue.push(...)` blocks go ABOVE the existing `runAll` driver that Task 1 already added at the bottom of the file — do not add a second runner. Confirm exactly one `runAll` invocation exists in the file before finishing this task.

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-actr-s2-auto-resolve-single-ac.js
```

Expected output: T6a/T6b should actually already PASS at this point, since Tasks 4 and 5's own logic already implements this behaviour — this task has no RED step of its own beyond confirming the runner executes all queued tests. If T6a or T6b genuinely fails, that means Task 4's render logic has a real gap — stop and fix Task 4 rather than adding new logic here.

- [ ] **Step 3: No new implementation expected**

If Step 2 shows all tests passing already, there is nothing to implement for this task — it exists purely to prove the AC6 round-trip explicitly, end to end, rather than relying on it being an incidental consequence of Tasks 4/5.

- [ ] **Step 4: Run test — confirm pass**

```bash
node tests/check-actr-s2-auto-resolve-single-ac.js
```

Expected output: `[actr-s2-auto-resolve-single-ac] Results: 17 passed, 0 failed` (all tasks' tests combined).

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing.

- [ ] **Step 6: Commit**

```bash
git add tests/check-actr-s2-auto-resolve-single-ac.js
git commit -m "test(actr-s2): confirm the Override round-trip end-to-end (AC6)"
```

---

## Post-implementation note for /verify-completion

This story touches `src/web-ui/routes/playback-evidence.js` — a route file. Per `/verify-completion`'s own "Route/handler E2E coverage check," grep `tests/e2e/*.spec.js` for any spec referencing `/products/:productId/playback-evidence/...` or `/capture/` paths and run any matching, non-`@real-staging` spec locally before claiming completion. `tests/e2e/ppc-s5-video-lazy-load.spec.js` and any `ppc-s6-*`/`ppc-s9-*` E2E specs are the most likely matches — confirm none of them assert on the manual form's unconditional presence in a way this story's own render change would break.
