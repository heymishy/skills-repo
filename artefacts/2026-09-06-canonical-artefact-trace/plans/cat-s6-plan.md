# The two existing non-trace consumers of artefact fetching keep working unchanged — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in `tests/check-cat-s6-regression-verification.js` pass. This is a VERIFICATION-ONLY story — no production code changes. Do not add scope beyond what the tests and ACs specify.
**Branch:** `feature/cat-s6`
**Worktree:** `.worktrees/cat-s6`
**Test command:** `node tests/check-cat-s6-regression-verification.js` (new file), `node tests/check-bsgm-s1-*.js check-sri-s1-*.js check-adlr-s1-*.js check-fadm-s1-*.js` (4 prior regression suites), `node scripts/run-all-tests.js` (full suite)

---

## Critical findings from reading the REAL current code (read before starting any task)

1. **AC1's real call site is buried inside a large route handler, reached only after two other fallback layers fail — this plan grounds the test in an already-proven, passing pattern rather than inventing a new one.** `journey.js`'s `fetchArtefact` call (line 921) sits inside `handleGetJourneyStageView(req, res, pool)`, and is only reached if (1) the completed stage has an `artefactPath`, (2) a local disk read of that path fails, and (3) `resolveArtefactFromDiskOrPg`'s Postgres fallback also comes up empty. `tests/check-das-s1-commit-artefact-git-fallback.js` (the story that originally built this exact code path) already has a test — `missingLocalFile_gitFallbackRendersContent` — that constructs precisely this precondition chain (via `setupStageSession`, `createMockPool`, `store.completeStage`, deleting the local file, then mocking `global.fetch` for the GitHub Contents API) and asserts the real content renders. **This plan's own AC1 test reuses that exact, already-proven setup pattern** (not a reinvented one) inside the new `check-cat-s6-regression-verification.js` file, satisfying the story's own "direct test against the real call site, not a reimplemented mock of it" language while minimizing the risk of an incorrectly-shaped fixture (the exact `tir-s5` class of risk this story's own Architecture Constraints names).

2. **`export-data-source.js`'s real `repoOverride` shape and call chain, confirmed by direct code read.** `realExportDataSource(slug, credential, storySlug)` calls `ownerRepoForFeature(slug, credential)` (needs `_dbPool` wired via `setDbPool()`, queries `journeys` then `products` tables), then `realFetchPipelineState(owner, repo, credential)` (a real `fetch()` call to `${apiBase}/repos/${owner}/${repo}/contents/.github/pipeline-state.json`, not independently injectable — mocked via `global.fetch` like everything else), then finds the DoR-approved story and calls `fetchArtefact(slug, artefactType, credential, { owner, repo })` — **exactly 4 positional arguments, matching `journey.js`'s own call shape**, confirming `repoRoot` (position 6) is `undefined` here too, so `cat-s5`'s new trace-based logic is provably a no-op for this call site by the same guard-clause reasoning already verified for `journey.js` in `cat-s5`'s own plan. **Fix for AC2's cross-tenant test:** construct TWO complete tenant fixtures (two different `owner`/`repo` pairs, two different mock DB pool rows), mock `global.fetch` to route on the `owner/repo` segment of the URL (both the pipeline-state.json fetch AND the artefact fetch use this same segment), and assert tenant A's resolved content/URLs never reference tenant B's `owner`/`repo` identifiers and vice versa — this is the real mechanism `mtrr-s1`'s cross-tenant isolation depends on, not a separate mechanism this story needs to invent.

3. **AC3's "four prior suites" are a fixed, real, already-existing list — no test-writing needed, only correct invocation.** Confirmed via `Glob`/`ls` that `tests/check-bsgm-s1-*.js`, `tests/check-sri-s1-*.js`, `tests/check-adlr-s1-*.js`, `tests/check-fadm-s1-*.js` all exist. This AC is satisfied by running each file and confirming its own reported pass count is unchanged from its own last-known-good baseline (which, for `adlr-s1`, is the exact same 15/15 count re-confirmed at every checkpoint throughout `cat-s5`'s own delivery) — not by writing new test code.

4. **AC4's "two documented pre-existing baseline failures" are a specific, named pair — confirm both by name, not just "the suite mostly passes."** `tests/check-p3.5-validate-trace.js` (confirmed throughout `cat-s4`/`cat-s5`'s own delivery this session) and `tests/check-pcr-s1-test-runner.js` (observed once during `cat-s5`'s own Task 1 review as a flaky, test-isolation-sensitive failure that clears on a clean, non-concurrent re-run — this story's own AC4 text independently confirms this is a KNOWN, already-documented baseline failure, not something discovered fresh this session). The full-suite check must name both explicitly if either appears, and treat a clean run (0 or 1 of the two present) as passing — but any THIRD, different failing file is a real regression requiring investigation, not silent acceptance.

---

## File map

```
Modify: (none — this story is verification-only, per its own Out of Scope section)

Create:
  tests/check-cat-s6-regression-verification.js
```

---

## Task 1: journey.js and export-data-source.js real-call-site verification (AC1, AC2)

**Two-stage review:** not yet run.

**Recommended model class:** balanced — low implementation complexity (test-only, story rating 1), but AC2's cross-tenant fixture correctness matters (mirrors `mtrr-s1`'s own security-relevant precedent).

**Files:**
- Create: `tests/check-cat-s6-regression-verification.js`

- [ ] **Step 1: Write the test** (this is verification-only — there is no "must fail first" step, since no production code is being changed; write the test, run it, and it is expected to pass immediately if `cat-s1`-`cat-s5` are correctly merged)

```js
'use strict';
// check-cat-s6-regression-verification.js -- cat-s6: explicit regression
// proof that journey.js's gate-confirm flow and export-data-source.js's SaaS
// export both behave identically after cat-s5's changes to fetchArtefact's
// internals. Verification-only -- no production code changes in this story.

var assert = require('assert');
var path = require('path');
var os = require('os');
var fs = require('fs');
var cp = require('child_process');

var JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
var EXPORT_DATA_SOURCE_PATH = path.resolve(__dirname, '../src/web-ui/adapters/export-data-source.js');
var FETCHER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/artefact-fetcher.js');
var REPO_ROOT = path.resolve(__dirname, '..');

function freshRequire(p) {
  try { delete require.cache[require.resolve(p)]; } catch (_) {}
  return require(p);
}

var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}

async function main() {

console.log('\n[cat-s6] AC1 -- journey.js\'s real gate-confirm/stage-view call site (line ~921) resolves via git-fallback exactly as before cat-s5 (real call site, not a reimplemented mock)');
{
  var journey = freshRequire(JOURNEY_PATH);
  var store = freshRequire(JOURNEY_STORE_PATH);

  var tmpRoot = path.join(os.tmpdir(), 'cat-s6-journey-' + Date.now());
  fs.mkdirSync(tmpRoot, { recursive: true });

  var featureSlug = 'cat-s6-journey-test-' + Date.now();
  var skillName = 'review';
  var artefactRelPath = 'artefacts/' + featureSlug + '/' + skillName + '.md';
  var marker = 'CAT-S6-JOURNEY-MARKER-' + Date.now();
  var artefactContent = '# Review\n\n' + marker;

  var journeyObj = store.createJourney(featureSlug);
  var journeyId = journeyObj.journeyId;
  store.setStoryList(journeyId, ['cat-s6-story']);
  var sid = 'sid-cat-s6-' + Date.now();
  store.setActiveSession(journeyId, sid, skillName);

  journey.setJourneyStoreModule(store);
  journey.setRegisterHtmlSession(function() {});
  journey.setLinkSessionToJourney(function() {});
  journey.setRepoRoot(tmpRoot);
  journey.setPipelineStateWriter(function() {});
  journey.setGetHtmlSession(function(s) {
    if (s === sid) {
      return { skillName: skillName, done: true, artefactPath: artefactRelPath, artefactContent: artefactContent, journeyId: journeyId, turns: [], systemPrompt: 'test' };
    }
    return null;
  });

  var eds = freshRequire(EXPORT_DATA_SOURCE_PATH);
  var pool = {
    query: async function(sql, params) {
      var s = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
      if (s.indexOf('SELECT PRODUCT_ID, TENANT_ID FROM JOURNEYS') === 0) {
        return params[0] === featureSlug ? { rows: [{ product_id: 'p1', tenant_id: 't1' }] } : { rows: [] };
      }
      if (s.indexOf('SELECT REPO_OWNER, REPO_NAME FROM PRODUCTS') === 0) {
        return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
      }
      return { rows: [] };
    }
  };
  eds.setDbPool(pool);

  store.completeStage(journeyId, skillName, artefactRelPath, null, sid);
  // Simulate a redeploy with no persistent volume -- local disk file is gone.
  fs.unlinkSync(path.join(tmpRoot, artefactRelPath));

  var b64 = Buffer.from(artefactContent, 'utf8').toString('base64');
  var originalFetch = global.fetch;
  global.fetch = async function(url) {
    if (url.indexOf('/repos/acme/widgets/contents/' + artefactRelPath) !== -1) {
      return { ok: true, status: 200, json: async function() { return { content: b64, encoding: 'base64' }; } };
    }
    return { ok: false, status: 404, json: async function() { return { message: 'Not Found' }; } };
  };

  try {
    var req = { session: { accessToken: 'test-token', userId: 1, login: 'user' }, params: { journeyId: journeyId, stageName: skillName } };
    var res = { _status: null, _body: '', writeHead: function(s) { res._status = s; }, setHeader: function() {}, end: function(b) { res._body += (b || ''); } };
    await journey.handleGetJourneyStageView(req, res);

    test('the real journey.js gate-confirm/stage-view call site (line ~921) still resolves content via git-fallback after cat-s5\'s changes', function() {
      assert.ok(res._body.indexOf(marker) !== -1, 'expected the git-fallback-fetched content to render, got body snippet: ' + res._body.slice(0, 300));
    });
    test('does not fall back to the default "no artefact content found" message', function() {
      assert.strictEqual(res._body.indexOf('No artefact content found'), -1);
    });
  } finally {
    global.fetch = originalFetch;
  }
}

console.log('\n[cat-s6] AC2 -- export-data-source.js\'s real per-tenant repoOverride resolves independently for two different tenants (real call site, cross-tenant isolation NFR)');
{
  var eds2 = freshRequire(EXPORT_DATA_SOURCE_PATH);

  var slugA = 'cat-s6-tenant-a-' + Date.now();
  var slugB = 'cat-s6-tenant-b-' + Date.now();
  var storySlugA = 'story-a';
  var storySlugB = 'story-b';

  var pool2 = {
    query: async function(sql, params) {
      var s = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
      if (s.indexOf('SELECT PRODUCT_ID, TENANT_ID FROM JOURNEYS') === 0) {
        if (params[0] === slugA) return { rows: [{ product_id: 'product-a', tenant_id: 'tenant-a' }] };
        if (params[0] === slugB) return { rows: [{ product_id: 'product-b', tenant_id: 'tenant-b' }] };
        return { rows: [] };
      }
      if (s.indexOf('SELECT REPO_OWNER, REPO_NAME FROM PRODUCTS') === 0) {
        if (params[0] === 'product-a' && params[1] === 'tenant-a') return { rows: [{ repo_owner: 'owner-a', repo_name: 'repo-a' }] };
        if (params[0] === 'product-b' && params[1] === 'tenant-b') return { rows: [{ repo_owner: 'owner-b', repo_name: 'repo-b' }] };
        return { rows: [] };
      }
      return { rows: [] };
    }
  };
  eds2.setDbPool(pool2);

  function pipelineStateFor(slug, storySlug) {
    return JSON.stringify({
      features: [{
        slug: slug,
        stories: [{ id: storySlug, dorStatus: 'signed-off', dorArtefact: 'artefacts/' + slug + '/dor/' + storySlug + '-dor.md' }]
      }]
    });
  }

  var requestedUrls = [];
  var originalFetch2 = global.fetch;
  global.fetch = async function(url) {
    requestedUrls.push(url);
    if (url.indexOf('/repos/owner-a/repo-a/contents/.github/pipeline-state.json') !== -1) {
      return { ok: true, status: 200, json: async function() { return { content: Buffer.from(pipelineStateFor(slugA, storySlugA), 'utf8').toString('base64') }; } };
    }
    if (url.indexOf('/repos/owner-b/repo-b/contents/.github/pipeline-state.json') !== -1) {
      return { ok: true, status: 200, json: async function() { return { content: Buffer.from(pipelineStateFor(slugB, storySlugB), 'utf8').toString('base64') }; } };
    }
    if (url.indexOf('/repos/owner-a/repo-a/contents/artefacts/' + slugA + '/dor/' + storySlugA + '-dor.md') !== -1) {
      return { ok: true, status: 200, json: async function() { return { content: Buffer.from('# Tenant A DoR', 'utf8').toString('base64') }; } };
    }
    if (url.indexOf('/repos/owner-b/repo-b/contents/artefacts/' + slugB + '/dor/' + storySlugB + '-dor.md') !== -1) {
      return { ok: true, status: 200, json: async function() { return { content: Buffer.from('# Tenant B DoR', 'utf8').toString('base64') }; } };
    }
    return { ok: false, status: 404, json: async function() { return { message: 'Not Found' }; } };
  };

  try {
    var resultA = await eds2.realExportDataSource(slugA, 'token-a');
    var resultB = await eds2.realExportDataSource(slugB, 'token-b');

    test('tenant A resolves tenant A\'s own content', function() {
      assert.strictEqual(resultA.artefactContent, '# Tenant A DoR');
    });
    test('tenant B resolves tenant B\'s own content', function() {
      assert.strictEqual(resultB.artefactContent, '# Tenant B DoR');
    });
    test('tenant A\'s requests never referenced tenant B\'s owner/repo (cross-tenant isolation, mtrr-s1)', function() {
      var aRequestsToB = requestedUrls.filter(function(u) { return u.indexOf('/owner-b/repo-b/') !== -1; });
      // Only tenant B's OWN two calls (pipeline-state + artefact) may reference owner-b/repo-b.
      assert.ok(aRequestsToB.length <= 2, 'expected tenant A\'s own calls to never touch owner-b/repo-b, got: ' + JSON.stringify(aRequestsToB));
    });
    test('tenant B\'s requests never referenced tenant A\'s owner/repo', function() {
      var bRequestsToA = requestedUrls.filter(function(u) { return u.indexOf('/owner-a/repo-a/') !== -1; });
      assert.ok(bRequestsToA.length <= 2, 'expected tenant B\'s own calls to never touch owner-a/repo-a, got: ' + JSON.stringify(bRequestsToA));
    });
  } finally {
    global.fetch = originalFetch2;
  }
}

}

main().then(function() {
  console.log('\n[cat-s6] Results:', passed, 'passed,', failed, 'failed');
  process.exit(failed > 0 ? 1 : 0);
}).catch(function(err) {
  console.log('UNEXPECTED ERROR:', err.stack || err.message);
  process.exit(1);
});
```

- [ ] **Step 2: Run test**

```bash
node tests/check-cat-s6-regression-verification.js
```

Expected output: `[cat-s6] Results: 6 passed, 0 failed` (all AC1/AC2 assertions pass — no production code exists yet to break, this is verification-only). If ANY assertion fails, this is a REAL signal per the story's own Out of Scope section: stop, do not fix `journey.js`/`export-data-source.js` inline — flag it as a discovered defect requiring a separate follow-up story, and report this explicitly rather than silently working around it.

- [ ] **Step 3: No implementation step** — this story makes no production code changes (per its own Out of Scope section). If Step 2 passes cleanly, there is nothing to implement.

- [ ] **Step 4: Commit**

```bash
git add tests/check-cat-s6-regression-verification.js
git commit -m "test(cat-s6): verify journey.js and export-data-source.js's real call sites are unaffected by cat-s5's changes"
```

---

## Task 2: four prior regression suites + full-suite baseline confirmation (AC3, AC4)

**Two-stage review:** not yet run.

**Recommended model class:** fast/cheap — pure command execution and output comparison, no code to write.

**Files:**
- Modify: `tests/check-cat-s6-regression-verification.js` (append verification-only summary logging, no new assertions requiring implementation)

- [ ] **Step 1: Confirm the 4 named suites' real filenames**

```bash
ls tests/ | grep -E "^check-(bsgm-s1|sri-s1|adlr-s1|fadm-s1)-"
```

Expected: exactly 4 files (one per story). Record their exact names — the story text names the stories, not guaranteed-exact filenames.

- [ ] **Step 2: Run each of the 4 suites individually and record pass counts**

```bash
node tests/check-bsgm-s1-*.js
node tests/check-sri-s1-*.js
node tests/check-adlr-s1-*.js
node tests/check-fadm-s1-*.js
```

Expected: all 4 report 100% pass, with the exact same pass count each has reported at every checkpoint throughout this epic's delivery so far (e.g. `adlr-s1`: 15/15, unchanged from `cat-s5`'s very first commit through its last). If any count differs from a previously-recorded baseline, this is AC3's own named failure condition — stop and report it, do not silently note "still passes" without the count comparison.

- [ ] **Step 3: Run the full suite and diff against the exact 2 named baseline failures**

```bash
node scripts/run-all-tests.js
```

Expected: only `tests/check-p3.5-validate-trace.js` and/or `tests/check-pcr-s1-test-runner.js` (0, 1, or both of these two specific files — `pcr-s1`'s is a known test-isolation-sensitive flake that doesn't always reproduce, confirmed during `cat-s5`'s own delivery) appear as failures. **If a full-suite run shows a third, different failing file, re-run the full suite once more, by itself with no concurrent test runs** (this repo has documented test-isolation flakiness when multiple full-suite runs overlap) before concluding it's a real regression — if it persists on a clean second run, this is a REAL finding requiring investigation, not silent acceptance, per AC4's own explicit language.

- [ ] **Step 4: Append a summary block to the test file recording this task's findings**

Append INSIDE the existing `async function main() { ... }` body (before its closing `}`), documenting the confirmed results as executable assertions rather than only a prose report — this keeps AC3/AC4's evidence machine-checkable, not just narrated in a commit message:

```js
console.log('\n[cat-s6] AC3 -- the four prior stories\' own regression suites report their expected, unchanged pass counts');
{
  var suiteResults = [
    // Fill in the exact filenames confirmed in Step 1, and the exact pass
    // counts confirmed in Step 2 -- do not guess or round, use real numbers.
    { file: 'check-bsgm-s1-<confirmed-filename>.js', expectedPassing: /* confirmed count */ null },
    { file: 'check-sri-s1-<confirmed-filename>.js', expectedPassing: /* confirmed count */ null },
    { file: 'check-adlr-s1-artefact-link-resolution.js', expectedPassing: 15 },
    { file: 'check-fadm-s1-<confirmed-filename>.js', expectedPassing: /* confirmed count */ null }
  ];
  suiteResults.forEach(function(s) {
    var out = cp.execSync('node tests/' + s.file, { cwd: REPO_ROOT, encoding: 'utf8' });
    test(s.file + ' reports exactly ' + s.expectedPassing + ' passing, 0 failing (unchanged baseline)', function() {
      assert.ok(out.indexOf(String(s.expectedPassing)) !== -1, 'expected to see ' + s.expectedPassing + ' in the output, got tail: ' + out.slice(-300));
      assert.strictEqual(/\b0\s+fail/i.test(out) || /Failed:\s*0/i.test(out) || out.toLowerCase().indexOf('failed: 0') !== -1, true, 'expected 0 failures, got tail: ' + out.slice(-300));
    });
  });
}
```

(Adjust the exact pass/fail string-matching to each suite's own actual reporting format, confirmed by reading each file's own final `console.log` line during Step 2 — do not assume they all share `check-adlr-s1`'s exact format.)

- [ ] **Step 5: Run test — must pass**

```bash
node tests/check-cat-s6-regression-verification.js
```

Expected: full file green, Task 1 + Task 2 tests all passing.

- [ ] **Step 6: Run full suite one final time — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected: only the 2 named baseline failures (0, 1, or both present), no others.

- [ ] **Step 7: Commit**

```bash
git add tests/check-cat-s6-regression-verification.js
git commit -m "test(cat-s6): confirm the 4 prior regression suites and full test suite show no new failures, completing cat-s6's full AC coverage"
```

---

## Post-implementation note for /verify-completion

This story is verification-only and has no UI/route surface of its own to manually walk through — its own "manual" equivalent IS the full-suite run itself (AC4), which already happens as part of `/verify-completion`'s own Step 1. No additional manual browser walkthrough is meaningful here, unlike `cat-s4`/`cat-s5`. If AC1 or AC2 surfaces a real defect in `journey.js` or `export-data-source.js` (not a test-authoring gap), stop immediately, do not attempt a fix within this story, and report it as a new finding requiring a separate follow-up story — per this story's own explicit Out of Scope section.
