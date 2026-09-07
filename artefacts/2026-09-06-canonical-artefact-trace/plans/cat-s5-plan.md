# Opening any single document resolves through the canonical trace, not independent logic — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in `tests/check-cat-s5-artefact-fetch-integration.js` pass, and keep `tests/check-adlr-s1-artefact-link-resolution.js` passing byte-for-byte unchanged. Do not add scope beyond what the tests and ACs specify.
**Branch:** `feature/cat-s5`
**Worktree:** `.worktrees/cat-s5`
**Test command:** `node tests/check-cat-s5-artefact-fetch-integration.js` (new file), `node tests/check-adlr-s1-artefact-link-resolution.js` (existing regression suite — must stay green with zero changes), `node scripts/run-all-tests.js` (full suite)

---

## Critical findings from reading the REAL current code (read before starting any task)

This story's DoR/design described the change at a level that undersells two real architectural constraints. Both were found by reading `src/web-ui/adapters/artefact-fetcher.js`, `src/web-ui/routes/artefact.js`, `src/web-ui/adapters/artefact-trace.js`, and all 3 real call sites of `fetchArtefact` before writing this plan.

1. **`fetchArtefact` has no access to a local `repoRoot`, and `buildArtefactTrace` needs one.** `fetchArtefact(featureSlug, artefactType, token, repoOverride, timeoutMs)` resolves content purely via the GitHub Contents API — no filesystem awareness at all. `buildArtefactTrace(repoRoot, featureSlug)` (cat-s1) is purely local-`fs`-based and requires a `repoRoot` disk path. The only caller of `fetchArtefact` that has natural access to a `repoRoot` is `artefact.js`'s `handleArtefactRoute`, via `req` — mirroring exactly how `cat-s4`'s `features.js` already does `const repoRoot = getRepoRoot(req);` inside its own route handler. **The other 2 real callers of `fetchArtefact` — `journey.js:921` and `export-data-source.js:199` — do NOT have a natural `repoRoot` and MUST NOT be touched (the story's own explicit constraint).** Both currently call `fetchArtefact` with only 3–4 positional arguments (`featureSlug, artefactType, token[, repoOverride]`), never `timeoutMs` or beyond — confirmed by reading both call sites directly. **Fix: add `repoRoot` as a NEW, OPTIONAL trailing parameter to `fetchArtefact`, after `timeoutMs`.** `journey.js` and `export-data-source.js` remain completely unmodified and automatically get `repoRoot === undefined` — trace-based resolution never engages for them, so their behaviour is byte-identical to today by construction, not by careful re-testing. Only `artefact.js`'s `handleArtefactRoute` is modified to compute `repoRoot` via `getRepoRoot(req)` and pass it through.

2. **AC1's "correctly-generated link" case already works today, unchanged — the only genuinely NEW resolution logic is for bare (no-slash) legacy inputs.** Every link `cat-s4`'s rendering generates already encodes the artefact's real, full relative path (subdirectory included, `.md` stripped) via `_relativeArtefactPath` — confirmed by reading all 3 of `features.js`'s `viewUrl` construction sites, which all use the identical `_relativeArtefactPath(a.path, featureSlug)` + `encodeURIComponent` pattern. `fetchArtefact`'s existing direct-path attempt (`${prefix}/${featureSlug}/${artefactType}.md` for `prefix` in `['artefacts', 'artefacts/archived']`) already resolves this correctly today, in exactly 1–2 requests, with zero probing. **AC1 is therefore a pure regression guard, not new logic** — do not add any new code path for slash-containing `artefactType` inputs; the existing direct-path resolution stays completely untouched. The only place genuinely new trace-based logic is needed is the FALLBACK path: today, a bare (no-slash) `artefactType` (a legacy/bookmarked link with no subdirectory) is resolved by probing a **static, manually-maintained subdirectory list** (`ARTEFACT_SUBDIRS`, itself already sourced from `cat-s2`'s canonical table but still a finite, hardcoded list that explicitly excludes `review`/`decisions`/`spikes` — see `NOT_PROBED_AS_FALLBACK` in `artefact-fetcher.js`). A bare-name link to a document that happens to live in one of those excluded subdirectories (e.g. `spikes/spike-a-output`, a real file on the real `phase4` fixture) **404s today** even though the file genuinely exists — this is AC2's exact named regression class. **Fix: when `repoRoot` is supplied and `artefactType` has no `/`, before (or instead of) the static-probe loop, consult `buildArtefactTrace(repoRoot, featureSlug)`'s real, dynamically-derived artefact list for a file whose filename (`.md` stripped) exactly matches `artefactType`.** If exactly one match is found, fetch that artefact's own real relative path directly (one confident attempt, using the caller's normal `timeoutMs`, not the reduced `FALLBACK_PROBE_TIMEOUT_MS` — this is a genuine latency win over the old up-to-22-attempt probe, not just a correctness fix). If the trace isn't `'found'`, or zero matches, or more than one match (ambiguous bare name across subdirectories — a real but rare case, not worth resolving cleverly here), **fall through to the existing static-probe loop unchanged** — this makes the new logic strictly additive: it can only find MORE documents than before, never fewer, and never changes behaviour for any input the old logic already handled.

3. **AC3's "orphaned-registration" is a STORY-level classification, not a document-level one — there is no natural generated link for this case.** `cat-s3`'s `classifyDivergence` marks a *story* `orphaned-registration` when it's registered in `pipeline-state.json` but has zero matching files; `cat-s4`'s own gap-state row for such a story renders **no link at all** (there's nothing to link to). So AC3's scenario is necessarily a manually-typed or previously-bookmarked URL — parallel to `adlr-s1`'s own documented "old bookmarked or externally-shared... link" scenario, just for a story whose backing file was deleted after the link was shared, rather than a document that was always missing. **Resolution:** after the trace-based match (finding #2) AND the fallback probe both fail to resolve a real file, check whether `trace.stories` contains an entry with `divergence === 'orphaned-registration'` whose `slug` matches the requested `artefactType`'s basename using the **exact same convention `cat-s1`'s own `buildArtefactTrace` already uses to attribute files to stories** (`artefactType.indexOf(story.slug + '-') === 0 || artefactType === story.slug`, mirroring `artefact-trace.js`'s own `artefact.filename.indexOf(story.slug + '-') === 0 || artefact.filename === story.slug + '.md'` line) — reusing an established convention rather than inventing a new one. If matched, mark the thrown error distinguishably (see finding #4) rather than inventing new matching logic from scratch.

4. **AC4 requires the `ArtefactNotFoundError` constructor signature to stay unchanged — so the orphaned-registration distinction must be a property set AFTER construction, not a constructor change.** `artefact.js`'s existing `catch` branch (postgres-fallback attempt, then the generic 404 page) must keep running exactly as it does today for the ordinary "never existed" case — an orphaned-registration 404 should still attempt the postgres-fallback first (a stage can be durably stored in Postgres via a skill session even with no backing git file — `alrf-s4`'s own precedent — so postgres-fallback is still a legitimate content source here) and only render the *distinguishing* message if that fallback also comes up empty. **Fix: after constructing the normal `new ArtefactNotFoundError(featureSlug, artefactType)` (constructor signature untouched), set `err.orphanedRegistration = true` as a plain property when finding #3's story match succeeds**, and have `artefact.js`'s existing `catch (err.name === 'ArtefactNotFoundError')` branch check this new property — only after its existing postgres-fallback attempt fails — to choose between the existing generic message and a new, distinct one. This keeps the class shape, the constructor signature, and the postgres-fallback/error-page call sites all genuinely unchanged, satisfying AC4's own explicit language.

---

## File map

```
Modify:
  src/web-ui/adapters/artefact-fetcher.js  — fetchArtefact gains an optional trailing
                                              repoRoot parameter; new trace-consulting
                                              resolution branch for bare-name inputs,
                                              additive only (falls through to the
                                              existing static probe on any miss);
                                              orphaned-registration property set on
                                              the thrown error when applicable
  src/web-ui/routes/artefact.js            — handleArtefactRoute computes repoRoot via
                                              getRepoRoot(req) and passes it through;
                                              new distinguishing 404 branch checking
                                              err.orphanedRegistration, placed AFTER
                                              the existing postgres-fallback attempt

Create:
  tests/check-cat-s5-artefact-fetch-integration.js

Do NOT modify:
  src/web-ui/routes/journey.js              — named regression surface, out of scope
  src/web-ui/adapters/export-data-source.js — named regression surface, out of scope
  src/web-ui/adapters/artefact-trace.js     — cat-s1/cat-s3, pure consumer only
```

---

## Task 1: `repoRoot` plumbing + golden-fixture regression guard (AC1) ✅ DONE (be5b4e8e, fixup applied same-session)

**Result:** signature change landed exactly as planned, additive and unused by `journey.js`/`export-data-source.js`. **A real async-structure defect was found and fixed directly (not via the two-stage review cycle — caught during direct verification before that review even ran):** the test file's original `.then()`-based structure never actually gated the exit code on test failure (see the "Important" note inline below, in this task's own Step 1 code block, for the full root-cause explanation and the fix). Restructured into an `async function main()` + `main().then(...)` pattern, verified correct by deliberately breaking an assertion and confirming the file now genuinely reports the failure and exits 1. All 3 test commands (targeted file, `adlr-s1` regression suite, full suite) re-confirmed passing after the fix. **This corrected pattern is now mandatory for every subsequent task's test code in this plan — see the note.**

**Two-stage review:** not yet run.

**Recommended model class:** balanced.

**Files:**
- Modify: `src/web-ui/adapters/artefact-fetcher.js`, `src/web-ui/routes/artefact.js`
- Test: `tests/check-cat-s5-artefact-fetch-integration.js`

- [ ] **Step 1: Write the failing test**

```js
'use strict';
// check-cat-s5-artefact-fetch-integration.js -- cat-s5: /artefact/:slug/:type
// resolves through cat-s1's buildArtefactTrace instead of independent logic,
// for the cases adlr-s1's own static ARTEFACT_SUBDIRS probe cannot reach.
// ADR-028, ADR-029.

var assert = require('assert');
var path = require('path');
var fs = require('fs');
var os = require('os');

var FETCHER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/artefact-fetcher.js');
var ARTEFACT_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/artefact.js');
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

function mockFetchOkPaths(okPaths, calls) {
  return function(url) {
    calls.push(url);
    var matched = okPaths.some(function(p) { return url.indexOf(p) !== -1; });
    if (matched) {
      var body = { content: Buffer.from('content for ' + url, 'utf8').toString('base64') };
      return Promise.resolve({ status: 200, ok: true, json: function() { return Promise.resolve(body); } });
    }
    return Promise.resolve({ status: 404, ok: false, json: function() { return Promise.resolve({}); } });
  };
}

// All test bodies run inside this async function, awaited in sequence, so
// the final Results/exit-code logic at the bottom of the file only runs
// after every async assertion has actually executed -- EVERY LATER TASK IN
// THIS STORY APPENDS ITS OWN NEW BLOCKS INSIDE THIS SAME FUNCTION, using
// `await` before each `fetchArtefact(...)`/`handleArtefactRoute(...)` call,
// NEVER a new top-level `.then()` chain placed after this function's closing
// brace. A dangling, un-awaited `.then()` here would let the Results line
// print and the exit-code gate evaluate before the promise resolves --
// silently making the whole file's pass/fail reporting and CI gating
// meaningless, since `failed` would still read its pre-assertion value no
// matter what the async assertions actually found. (This exact mistake was
// made and caught during Task 1's own two-stage review — see that task's
// review note below before writing any of Tasks 2-4's test code.)
async function main() {

console.log('\n[cat-s5] AC1 -- correctly-encoded existing link resolves identically with repoRoot supplied (regression guard)');
{
  var fetcherMod = freshRequire(FETCHER_PATH);
  var calls = [];
  global.fetch = mockFetchOkPaths(['artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s1-dor.md'], calls);
  var content = await fetcherMod.fetchArtefact('2026-07-05-product-stds-hierarchy', 'dor/psh-s1-dor', 'tok', undefined, undefined, REPO_ROOT);
  test('content resolved, byte-identical to the no-repoRoot case', function() {
    assert.ok(content.indexOf('content for') === 0);
  });
  test('exactly 1 fetch call -- repoRoot supplied does not change the slash-containing direct-path case', function() {
    assert.strictEqual(calls.length, 1);
  });
}

}

main().then(function() {
  console.log('\n[cat-s5] Results:', passed, 'passed,', failed, 'failed');
  process.exit(failed > 0 ? 1 : 0);
}).catch(function(err) {
  console.log('UNEXPECTED ERROR:', err.stack || err.message);
  process.exit(1);
});
```

**Important — a real defect was found and fixed during this task's own execution (not by the reviewer, by direct verification while running the test):** the FIRST version of this test used a dangling `.then()` before the `Results`/`process.exit` lines, which ran unconditionally right after registering the promise, not after it resolved — meaning `failed` was always read as `0` regardless of the actual assertion outcomes, and the whole file's exit code could never be non-zero no matter what failed. Confirmed by deliberately breaking an assertion and observing the file still reported "0 passed, 0 failed" / exit 0. **Fixed by wrapping the entire test body in an `async function main()`, awaiting each async call directly, and moving the Results/exit logic into `main().then(...)`.** Verified the fix is real, not cosmetic, by deliberately breaking an assertion afterward and confirming it now correctly reports the failure and exits 1. **Every subsequent task in this plan must add its new test blocks INSIDE this same `main()` function, using `await`— not a new dangling `.then()` chain.**

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-cat-s5-artefact-fetch-integration.js
```

Expected output: `TypeError` or wrong-arity failure — `fetchArtefact` does not yet accept a 6th `repoRoot` argument.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/adapters/artefact-fetcher.js`, change `fetchArtefact`'s signature to accept the new trailing parameter (do not reorder or touch any existing parameter):

```js
async function fetchArtefact(featureSlug, artefactType, token, repoOverride, timeoutMs, repoRoot) {
```

Do not add any behaviour yet that consults `repoRoot` — Task 1 is purely the additive signature change plus the golden-fixture regression guard. Update the JSDoc to document the new parameter:

```js
 * @param {string} [repoRoot] - cat-s5: when supplied, enables trace-based
 *   resolution of a bare (no-slash) artefactType via buildArtefactTrace,
 *   before falling back to the static ARTEFACT_SUBDIRS probe (see Task 2).
 *   Optional and additive -- omitted entirely by journey.js and
 *   export-data-source.js's own call sites, which therefore see zero
 *   behavioural change. Has no effect on a slash-containing artefactType,
 *   which always resolves via the existing direct-path attempt unchanged.
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-cat-s5-artefact-fetch-integration.js
```

Expected output: `[cat-s5] Results: 2 passed, 0 failed`.

- [ ] **Step 5: Run the existing adlr-s1 regression suite — must stay green, unchanged**

```bash
node tests/check-adlr-s1-artefact-link-resolution.js
```

Expected output: identical pass count to before this task (all calls in that file omit the new 6th argument entirely, so `repoRoot` is `undefined` for every one of them — confirm this explicitly, do not just trust it).

- [ ] **Step 6: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: only the known pre-existing baseline failure (`tests/check-p3.5-validate-trace.js`).

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/adapters/artefact-fetcher.js tests/check-cat-s5-artefact-fetch-integration.js
git commit -m "feat(cat-s5): add optional repoRoot parameter to fetchArtefact, additive and unused by existing callers"
```

---

## Task 2: trace-based bare-name resolution (AC2) ✅ DONE (88876ba3, critical fixup b9b8e1b8)

**Result:** implementation deviated safely from the plan's own Step 3 layout (trace check moved before, not between, the direct-path loop — see the deviation note above, independently re-verified correct). **Two-stage review found 1 Critical issue not caught by any of the 8 originally-passing tests:** this plan's own Task 1 file map said `artefact.js` needed `getRepoRoot(req)` wiring, but no task ever actually wrote that step — `handleArtefactRoute` never passed `repoRoot` into `fetchArtefact`, so the entire trace-based resolution this task built could never fire on a real HTTP request. Fixed in `b9b8e1b8`: wired `getRepoRoot(req)` into `handleArtefactRoute`, added a genuine route-level integration test (real `fetchArtefact`, real repo root, real file content — not a mocked fetcher) that was confirmed to FAIL before the fix and PASS after, proving the test would have caught the original gap. Re-verified independently (not just trusting the implementer): 11/11 targeted tests, 15/15 `adlr-s1` regression suite unchanged, full suite 627 files/1 pre-existing-unrelated-failure/0 regressions. **AC2 now genuinely reachable in production, confirmed end-to-end.**

**Two-stage review:** ✅ Approved (after the critical fixup above).

**Recommended model class:** deep-reasoning — this is the task with the real new resolution logic; getting the fall-through conditions wrong could silently regress AC1 or change adlr-s1's own existing bare-name probe behaviour.

**Files:**
- Modify: `src/web-ui/adapters/artefact-fetcher.js`
- Test: `tests/check-cat-s5-artefact-fetch-integration.js`

- [ ] **Step 1: Write the failing test**

Append INSIDE the existing `async function main() { ... }` body (before its closing `}`, after Task 1's own block) — use `await`, per Task 1's own review note; do NOT add a new dangling `.then()` chain after `main`'s closing brace. This uses the REAL `phase4` fixture (`2026-04-19-skills-platform-phase4`), specifically a real file under `spikes/` — a subdirectory `NOT_PROBED_AS_FALLBACK` explicitly excludes from the old static probe, so this is a genuine, currently-broken, real-world case, not a synthetic one:

```js
console.log('\n[cat-s5] AC2 -- bare legacy link to a real spikes/ file resolves via the trace, not the old excluded-subdirectory probe');
{
  var fetcherMod = freshRequire(FETCHER_PATH);
  var calls = [];
  // spikes/ is in NOT_PROBED_AS_FALLBACK -- the OLD static probe can never
  // find this file no matter how many subdirectories it tries. Confirm this
  // file is real on disk first, so the test fixture is grounded in fact.
  var realSpikeFile = path.join(REPO_ROOT, 'artefacts', 'archived', '2026-04-19-skills-platform-phase4', 'spikes', 'spike-a-output.md');
  test('fixture precondition: the real spikes/ file exists on disk', function() {
    assert.ok(fs.existsSync(realSpikeFile), 'expected ' + realSpikeFile + ' to exist');
  });
  global.fetch = mockFetchOkPaths(['artefacts/archived/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md'], calls);
  var content = await fetcherMod.fetchArtefact('2026-04-19-skills-platform-phase4', 'spike-a-output', 'tok', undefined, undefined, REPO_ROOT);
  test('content resolved via the trace, not a 404', function() {
    assert.ok(content.indexOf('content for') === 0);
  });
  test('resolved in a single confident attempt, not a multi-subdirectory probe', function() {
    assert.strictEqual(calls.length, 1);
  });
}

console.log('\n[cat-s5] AC2 (structural check) -- trace-based match takes priority over the static probe for a bare name the trace can resolve');
{
  var fetcherMod = freshRequire(FETCHER_PATH);
  var calls = [];
  global.fetch = mockFetchOkPaths(['artefacts/archived/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md'], calls);
  await fetcherMod.fetchArtefact('2026-04-19-skills-platform-phase4', 'spike-a-output', 'tok', undefined, undefined, REPO_ROOT);
  test('no probe attempts against any OTHER known subdirectory were made', function() {
    var nonSpikeProbes = calls.filter(function(u) { return u.indexOf('/spikes/') === -1; });
    assert.strictEqual(nonSpikeProbes.length, 0, 'expected zero non-spikes probe attempts, got: ' + JSON.stringify(nonSpikeProbes));
  });
}

console.log('\n[cat-s5] AC2 (fall-through) -- trace has no match falls through to the existing static probe unchanged');
{
  var fetcherMod = freshRequire(FETCHER_PATH);
  var calls = [];
  global.fetch = mockFetchOkPaths(['artefacts/2026-07-05-product-stds-hierarchy/dor/x-dor.md'], calls);
  var content2 = await fetcherMod.fetchArtefact('2026-07-05-product-stds-hierarchy', 'x-dor', 'tok', undefined, undefined, REPO_ROOT);
  test('resolves via the old static probe when the trace has no filename match', function() {
    assert.ok(content2.indexOf('content for') === 0);
  });
}

console.log('\n[cat-s5] AC2 (fall-through) -- no repoRoot supplied behaves exactly as adlr-s1 always has (regression guard)');
{
  var fetcherMod = freshRequire(FETCHER_PATH);
  var calls = [];
  global.fetch = mockFetchOkPaths(['artefacts/archived/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md'], calls);
  try {
    await fetcherMod.fetchArtefact('2026-04-19-skills-platform-phase4', 'spike-a-output', 'tok');
    test('should have thrown -- spikes/ is excluded from the old static probe and no repoRoot was supplied', function() {
      assert.fail('expected ArtefactNotFoundError');
    });
  } catch (err) {
    test('throws ArtefactNotFoundError exactly as it did before this story, when repoRoot is omitted', function() {
      assert.strictEqual(err.name, 'ArtefactNotFoundError');
    });
  }
}
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-cat-s5-artefact-fetch-integration.js
```

Expected output: the new AC2 tests fail (trace-based resolution doesn't exist yet — the `spike-a-output` case 404s exactly like the last test's own expectation, even WITH `repoRoot` supplied).

- [ ] **Step 3: Write minimal implementation**

Require `buildArtefactTrace` at the top of `artefact-fetcher.js`:

```js
const { buildArtefactTrace } = require('./artefact-trace');
```

Add a helper function, and call it from `fetchArtefact` between the existing direct-path attempt and the existing static-probe loop:

```js
/**
 * cat-s5: for a bare (no-slash) artefactType, consult the canonical trace's
 * real, dynamically-derived artefact list for an exact filename match,
 * before falling back to the static ARTEFACT_SUBDIRS probe. Additive only --
 * returns null (never throws) on any condition that should fall through to
 * the existing behaviour unchanged: no repoRoot, trace not 'found', zero
 * matches, or more than one match (an ambiguous bare name across
 * subdirectories -- rare, and not worth resolving cleverly here since the
 * old probe loop remains a safe, correct fallback for this one case).
 * @returns {{repoPath: string}|null}
 */
function _resolveViaTraceForBareName(repoRoot, featureSlug, artefactType) {
  if (!repoRoot || artefactType.indexOf('/') !== -1) return null;
  const trace = buildArtefactTrace(repoRoot, featureSlug);
  if (trace.status !== 'found') return null;
  const matches = trace.artefacts.filter((a) => a.filename.replace(/\.md$/, '') === artefactType);
  if (matches.length !== 1) return null;
  const path = require('path');
  const isArchived = trace.resolvedDir === path.join(repoRoot, 'artefacts', 'archived', featureSlug);
  const prefix = isArchived ? 'artefacts/archived' : 'artefacts';
  return { repoPath: `${prefix}/${featureSlug}/${matches[0].path}`, trace };
}
```

**Deviation applied during implementation (verified safe):** the trace-based call was placed BEFORE the existing direct-path loop, not between it and the static probe as originally written here — otherwise a bare name pays for 2 guaranteed-404 direct attempts before the trace check ever runs, producing 3 fetch calls instead of 1. Verified safe because `_resolveViaTraceForBareName`'s own guard clauses (`!repoRoot`, slash-containing `artefactType`) make it a complete no-op for every case this reordering could otherwise affect (AC1's own slash-containing case, and every caller that omits `repoRoot`); for a bare, root-level match with `repoRoot` supplied, the trace's own reconstructed path is byte-identical to what the old direct-path loop would have tried at the same prefix, so only call count/order changes, never final content.

In `fetchArtefact`, insert the new call BEFORE the existing direct-path loop (not between it and the static probe — see the deviation note above):

```js
  for (const prefix of prefixes) {
    const result = await _tryFetchAtPath(`${prefix}/${featureSlug}/${artefactType}.md`, targetRepo, token, featureSlug, artefactType, timeoutMs);
    if (result !== null) return result;
  }

  // cat-s5 AC2: trace-based resolution for a bare name, before the old
  // static-subdirectory probe -- see this plan's "Critical findings" #2.
  const traceMatch = _resolveViaTraceForBareName(repoRoot, featureSlug, artefactType);
  if (traceMatch) {
    const result = await _tryFetchAtPath(traceMatch.repoPath, targetRepo, token, featureSlug, artefactType, timeoutMs);
    if (result !== null) return result;
  }

  if (artefactType.indexOf('/') === -1) {
    for (const prefix of prefixes) {
      for (const dir of ARTEFACT_SUBDIRS) {
        const result = await _tryFetchAtPath(`${prefix}/${featureSlug}/${dir}/${artefactType}.md`, targetRepo, token, featureSlug, artefactType, FALLBACK_PROBE_TIMEOUT_MS);
        if (result !== null) return result;
      }
    }
  }
```

(`_tryFetchAtPath`'s own 404-to-null behaviour means this integrates cleanly — if the trace-resolved path somehow also 404s in a real GitHub fetch, e.g. local disk and GitHub have drifted, it falls through to the old probe loop rather than failing hard.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-cat-s5-artefact-fetch-integration.js
```

Expected output: all Task 1 + Task 2 tests pass.

- [ ] **Step 5: Run the existing adlr-s1 regression suite — must stay green, unchanged**

```bash
node tests/check-adlr-s1-artefact-link-resolution.js
```

Expected output: identical pass count — every call in that file omits `repoRoot`, so `_resolveViaTraceForBareName` returns `null` on its very first check for every one of them, and the rest of `fetchArtefact` executes identically to before.

- [ ] **Step 6: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: only the known pre-existing baseline failure.

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/adapters/artefact-fetcher.js tests/check-cat-s5-artefact-fetch-integration.js
git commit -m "feat(cat-s5): resolve bare-name artefact links via the canonical trace before the static subdirectory probe"
```

## Task 2 review finding — Critical, fix required before Task 3 (found at two-stage review, not caught by any of the 8 passing tests)

**This is a genuine gap in this plan itself, not an implementer error.** Critical Finding #1 (top of this plan) correctly identified that `artefact.js`'s `handleArtefactRoute` needed to compute `repoRoot` via `getRepoRoot(req)` and pass it into `fetchArtefact` — but no task in this plan ever actually wrote that wiring step. `src/web-ui/routes/artefact.js:61` still calls `_fetchArtefact(slug, artefactType, token)` with only 3 arguments, so `repoRoot` is always `undefined` on every real request, and `_resolveViaTraceForBareName`'s very first guard clause (`!repoRoot`) means the entire trace-based resolution this task just built **can never fire in production**. All 8 of Task 2's tests pass only because they call `fetchArtefact`/`_resolveViaTraceForBareName` directly with a manually-supplied `repoRoot` — none of them exercise the real `handleArtefactRoute → fetchArtefact` call chain the way an actual HTTP request would. The plan's own manual walkthrough note below (`/artefact/2026-04-19-skills-platform-phase4/spike-a-output`) would have caught this at `/verify-completion` — the review caught it earlier instead.

**Fix (apply as a fixup on top of `88876ba3`, same task):**

1. In `src/web-ui/routes/artefact.js`, add the import: `const { getRepoRoot } = require('../adapters/repo-root');` (the exact module `features.js` already uses for the same purpose).
2. In `handleArtefactRoute`, compute `repoRoot` right after the existing `const token = req.session.accessToken;` line: `const repoRoot = getRepoRoot(req);`
3. Change the fetch call from `const markdown = await _fetchArtefact(slug, artefactType, token);` to `const markdown = await _fetchArtefact(slug, artefactType, token, undefined, undefined, repoRoot);` — passing `undefined` for the unused `repoOverride`/`timeoutMs` positions, matching `fetchArtefact`'s real parameter order.
4. Add a genuine route-level integration test inside `main()` (mirroring `cat-s4`'s own AC5 route-level fix from earlier in this epic — a direct-call test proved insufficient there too, for the same reason): call `handleArtefactRoute` itself, with a `repoOverride`-free session and a real `repoRoot` pointing at this repo, requesting the real bare-name `spike-a-output` for the real `2026-04-19-skills-platform-phase4` feature, and assert the response body actually contains the real file's content — not just that `fetchArtefact` in isolation can resolve it.
5. Confirm this new test FAILS before the fix (proving it would have caught the gap) and PASSES after.
6. Re-run `tests/check-cat-s5-artefact-fetch-integration.js` (all 8 + the new test), `tests/check-adlr-s1-artefact-link-resolution.js` (15/15 unchanged — none of its fixtures call the real route with a real `repoRoot` either, so this wiring fix cannot affect them), and `node scripts/run-all-tests.js` (only the known pre-existing failure).
7. Commit as a fixup: `git commit -m "fix(cat-s5): wire getRepoRoot(req) into handleArtefactRoute -- Task 2's trace-based resolution could never fire without this"`

---

## Task 3: orphaned-registration distinct 404 (AC3, AC4) ✅ DONE (3a7560da)

**Result:** implemented exactly per plan, reusing `artefact-trace.js`'s own filename-attribution predicate (correctly re-derived for the `.md`-stripped `artefactType` shape). AC4's constructor-unchanged requirement independently verified byte-identical against the pre-story baseline; postgres-fallback ordering independently traced and confirmed non-racing (single-threaded, fallback `return`s before the new branch is reachable). **The implementer, explicitly briefed on Task 2's route-wiring gap, judged the plan's own stubbed-fetcher route-level test insufficient on its own initiative and added a 4th test using the real, non-stubbed `fetchArtefact` end-to-end through the real `handleArtefactRoute`** — independently traced by review and confirmed genuinely real (only `global.fetch` and the journey store, both legitimate external boundaries, are mocked; `getRepoRoot`, `buildArtefactTrace`, and the orphaned-detection logic all run for real). This is exactly the rigor Task 2's fixup required, applied proactively this time. Re-verified independently: 22/22 targeted tests, 15/15 `adlr-s1` unchanged, full suite 627/1-pre-existing-unrelated. **2 Minor, non-blocking findings** (accepted as-is, not fixed): re-deriving the trace a second time in the not-found path (already flagged by this plan itself as acceptable), and the orphaned-story `.find()` doesn't replicate `artefact-trace.js`'s own longest-prefix-first disambiguation ordering for two stories with overlapping slug prefixes — low real-world likelihood, and even in that case a distinguishing message still renders, just possibly attributed to the wrong of two ghost stories internally (not exposed in the message text).

**Two-stage review:** ✅ Approved.

**Recommended model class:** deep-reasoning — must not disturb the existing postgres-fallback/error-page contract (AC4).

**Files:**
- Modify: `src/web-ui/adapters/artefact-fetcher.js`, `src/web-ui/routes/artefact.js`
- Test: `tests/check-cat-s5-artefact-fetch-integration.js`

- [ ] **Step 1: Write the failing test**

Append INSIDE the existing `async function main() { ... }` body (before its closing `}`), using `await` per Task 1's established pattern — do NOT use a dangling `.then()` chain:

```js
console.log('\n[cat-s5] AC3 -- orphaned-registration link is flagged distinctly from a never-registered link');
{
  var tmpRoot = path.join(os.tmpdir(), 'cat-s5-orphan-' + Date.now());
  var featureDir = path.join(tmpRoot, 'artefacts', 'ghost-feature');
  fs.mkdirSync(featureDir, { recursive: true });
  fs.mkdirSync(path.join(tmpRoot, '.github'), { recursive: true });
  fs.writeFileSync(path.join(tmpRoot, '.github', 'pipeline-state.json'), JSON.stringify({
    features: [{ slug: 'ghost-feature', stories: [{ id: 'ghost-s1', name: 'Ghost Story' }] }]
  }), 'utf8');
  // Deliberately no file matching ghost-s1 anywhere on disk -- an
  // orphaned-registration story per cat-s3's own classification.

  var fetcherMod = freshRequire(FETCHER_PATH);
  var calls = [];
  global.fetch = mockFetchOkPaths([], calls);
  try {
    await fetcherMod.fetchArtefact('ghost-feature', 'ghost-s1-notes', 'tok', undefined, undefined, tmpRoot);
    test('should have thrown', function() { assert.fail('expected ArtefactNotFoundError'); });
  } catch (err) {
    test('throws ArtefactNotFoundError (AC4: same error class, unchanged constructor)', function() {
      assert.strictEqual(err.name, 'ArtefactNotFoundError');
    });
    test('is flagged orphanedRegistration -- distinct from a genuinely never-registered path', function() {
      assert.strictEqual(err.orphanedRegistration, true);
    });
  }

console.log('\n[cat-s5] AC3 (non-conflation) -- a genuinely never-registered path is NOT flagged orphanedRegistration');
  var calls2 = [];
  global.fetch = mockFetchOkPaths([], calls2);
  try {
    await fetcherMod.fetchArtefact('ghost-feature', 'totally-unrelated-name', 'tok', undefined, undefined, tmpRoot);
    test('should have thrown', function() { assert.fail('expected ArtefactNotFoundError'); });
  } catch (err) {
    test('throws ArtefactNotFoundError', function() { assert.strictEqual(err.name, 'ArtefactNotFoundError'); });
    test('is NOT flagged orphanedRegistration -- an operator must be able to tell these two 404 causes apart', function() {
      assert.notStrictEqual(err.orphanedRegistration, true);
    });
  }
}

console.log('\n[cat-s5] AC4 -- ArtefactNotFoundError constructor signature is unchanged');
{
  var fetcherMod = freshRequire(FETCHER_PATH);
  var err = new fetcherMod.ArtefactNotFoundError('some-slug', 'some-type');
  test('constructor still takes (featureSlug, artefactType) and sets the same properties', function() {
    assert.strictEqual(err.featureSlug, 'some-slug');
    assert.strictEqual(err.artefactType, 'some-type');
    assert.strictEqual(err.name, 'ArtefactNotFoundError');
  });
  test('orphanedRegistration is undefined by default -- an additive property, not a constructor argument', function() {
    assert.strictEqual(err.orphanedRegistration, undefined);
  });
}

console.log('\n[cat-s5] AC3/AC4 (route-level) -- the distinguishing 404 message renders only after postgres-fallback also fails, via handleArtefactRoute\\'s real branch');
{
  var routeMod = freshRequire(ARTEFACT_ROUTE_PATH);
  var fetcherModForRoute = require(FETCHER_PATH);
  routeMod.setFetcher(function() {
    var err = new fetcherModForRoute.ArtefactNotFoundError('ghost-feature', 'ghost-s1-notes');
    err.orphanedRegistration = true;
    return Promise.reject(err);
  });
  routeMod.setJourneyStore({
    getJourneyByFeatureSlug: function() { return null; },
    getArtefactsForJourney: function() { return Promise.resolve([]); }
  });
  var body = '';
  var statusCode = null;
  var req = { session: { accessToken: 'tok', userId: 1, login: 'u', tenantId: 't1' } };
  var res = {
    writeHead: function(code) { statusCode = code; },
    end: function(b) { body = b || ''; }
  };
  await routeMod.handleArtefactRoute(req, res, 'ghost-feature', 'ghost-s1-notes', {});
  test('renders a 404 status', function() { assert.strictEqual(statusCode, 404); });
  test('the orphaned-registration message is distinct from the plain "artefact not found" text', function() {
    assert.notStrictEqual(body.indexOf('registered'), -1, 'expected the body to mention the registration, got: ' + body);
  });
}
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-cat-s5-artefact-fetch-integration.js
```

Expected output: the `orphanedRegistration` assertions fail (property doesn't exist yet); the route-level test's message-distinction assertion fails (no new branch exists yet in `artefact.js`).

- [ ] **Step 3: Write minimal implementation**

In `artefact-fetcher.js`, after the trace-based and static-probe resolution attempts in `fetchArtefact` both fail (i.e., immediately before the final `throw new ArtefactNotFoundError(featureSlug, artefactType);`), add the orphaned-registration check:

```js
  const finalErr = new ArtefactNotFoundError(featureSlug, artefactType);
  if (repoRoot) {
    const trace = buildArtefactTrace(repoRoot, featureSlug);
    if (trace.status === 'found') {
      const orphanedStory = trace.stories.find((s) =>
        s.divergence === 'orphaned-registration' &&
        (artefactType.indexOf(s.slug + '-') === 0 || artefactType === s.slug)
      );
      if (orphanedStory) finalErr.orphanedRegistration = true;
    }
  }
  throw finalErr;
```

(This re-derives the trace a second time in the not-found path. That's acceptable here — it only runs on the already-slow "nothing resolved" path, not the common case, and keeps this task's diff isolated from Task 2's helper. Do not refactor to share the trace lookup across both call sites in this task — that's a Minor optimisation, not a correctness requirement; note it for the code-quality reviewer to flag if they consider it worth a follow-up.)

In `src/web-ui/routes/artefact.js`, inside the existing `ArtefactNotFoundError` catch branch, AFTER the existing postgres-fallback attempt fails (i.e., after the `if (fallbackContent) { ... return; }` block, before the existing generic 404 render):

```js
      const notFoundBody = err.orphanedRegistration
        ? '<p>This document is registered but the file could not be found — it may have been renamed or removed.</p>'
        : '<p>artefact not found</p>';
      const page = renderShell({
        title:       'Artefact Not Found',
        bodyContent: notFoundBody,
        user:        { login: (req.session && req.session.login) || '' }
      });
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(page);
```

(Replace the existing hardcoded `bodyContent: '<p>artefact not found</p>'` literal with this conditional — the surrounding `renderShell`/`writeHead`/`res.end` calls are unchanged, satisfying AC4's "error handling itself is not changed" requirement; only the body text is now conditional on the new property.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-cat-s5-artefact-fetch-integration.js
```

Expected output: all Task 1–3 tests pass.

- [ ] **Step 5: Run the existing adlr-s1 regression suite — must stay green, unchanged**

```bash
node tests/check-adlr-s1-artefact-link-resolution.js
```

Expected output: identical pass count — none of that file's fixtures set up a `pipeline-state.json` with an orphaned-registration story, so `orphanedRegistration` is never set to `true` for any of its cases, and the rendered message stays the plain, pre-existing text.

- [ ] **Step 6: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: only the known pre-existing baseline failure. Also specifically re-run any existing test file that exercises `handleArtefactRoute` (`grep -rln "handleArtefactRoute" tests/`) and confirm each still passes — list them explicitly in the task report.

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/adapters/artefact-fetcher.js src/web-ui/routes/artefact.js tests/check-cat-s5-artefact-fetch-integration.js
git commit -m "feat(cat-s5): flag orphaned-registration 404s distinctly from never-registered 404s, postgres-fallback contract unchanged"
```

---

## Task 4: NFR tests, AC4 contract verification, final regression pass ✅ DONE (0bbca6de)

**Result:** test-only change, no implementation needed (as the plan predicted) — all 3 NFR assertions passed cleanly on the first run (single-request resolution at 0.1ms, well under the 100ms budget; no new `eval`/`child_process` surface; audit logging call-count/shape unchanged). Targeted file: 25/25. `adlr-s1` regression suite: 15/15 — confirmed genuinely unchanged across the ENTIRE story, from `/branch-setup`'s own baseline through all 4 tasks, never touched once. Full suite: 627 files/1 pre-existing-unrelated-failure/0 regressions, independently re-verified. **All 4 tasks of cat-s5 are now complete.**

**Two-stage review:** not yet run.

**Recommended model class:** fast/cheap.

**Files:**
- Modify: `tests/check-cat-s5-artefact-fetch-integration.js`

- [ ] **Step 1: Write the failing test**

Append INSIDE the existing `async function main() { ... }` body (before its closing `}`), using `await` per Task 1's established pattern:

```js
console.log('\n[cat-s5] NFR -- no regression vs. adlr-s1\\'s existing bounded-probe performance for the common case');
{
  var fetcherMod = freshRequire(FETCHER_PATH);
  var calls = [];
  global.fetch = mockFetchOkPaths(['artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s1-dor.md'], calls);
  var start = process.hrtime.bigint();
  await fetcherMod.fetchArtefact('2026-07-05-product-stds-hierarchy', 'dor/psh-s1-dor', 'tok', undefined, undefined, REPO_ROOT);
  var elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
  test('resolves the common case in a single request, well under 100ms (measured: ' + elapsedMs.toFixed(1) + 'ms)', function() {
    assert.strictEqual(calls.length, 1);
    assert.ok(elapsedMs < 100, 'expected < 100ms, got ' + elapsedMs.toFixed(1) + 'ms');
  });
}

console.log('\n[cat-s5] NFR -- no new unvalidated input surface (source review, asserted structurally)');
{
  var fetcherSource = fs.readFileSync(FETCHER_PATH, 'utf8');
  test('artefactType and featureSlug still flow only into path template strings already validated upstream (no new eval/exec/require-by-string introduced)', function() {
    assert.strictEqual(/\beval\s*\(/.test(fetcherSource), false);
    assert.strictEqual(/child_process/.test(fetcherSource), false);
  });
}

console.log('\n[cat-s5] NFR -- existing artefact_read audit logging fires identically for the AC1 common case');
{
  var routeMod = freshRequire(ARTEFACT_ROUTE_PATH);
  var logCalls = [];
  routeMod.setLogger({ info: function(event, data) { logCalls.push({ event: event, data: data }); }, warn: function() {} });
  routeMod.setFetcher(function() { return Promise.resolve('# some markdown'); });
  routeMod.setJourneyStore({ getJourneyByFeatureSlug: function() { return null; }, getArtefactsForJourney: function() { return Promise.resolve([]); } });
  var req = { session: { accessToken: 'tok', userId: 42, login: 'u', tenantId: 't1' } };
  var res = { writeHead: function() {}, end: function() {} };
  await routeMod.handleArtefactRoute(req, res, 'some-feature', 'dor/some-dor', {});
  test('exactly one artefact_read audit call, same shape as before this story', function() {
    assert.strictEqual(logCalls.length, 1);
    assert.strictEqual(logCalls[0].event, 'artefact_read');
    assert.strictEqual(logCalls[0].data.featureSlug, 'some-feature');
    assert.strictEqual(logCalls[0].data.artefactType, 'dor/some-dor');
  });
}
```

- [ ] **Step 2: Run test**

```bash
node tests/check-cat-s5-artefact-fetch-integration.js
```

These are NOT expected to fail if Tasks 1–3 are correct — they're NFR assertions against already-working code. If either genuinely fails, investigate and fix (do not weaken the threshold to force a pass).

- [ ] **Step 3: Write minimal implementation**

No implementation change expected if Tasks 1–3 are correct.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-cat-s5-artefact-fetch-integration.js
```

Expected output: full file green (all 4 tasks' tests).

- [ ] **Step 5: Run the existing adlr-s1 regression suite one final time**

```bash
node tests/check-adlr-s1-artefact-link-resolution.js
```

Expected output: identical pass count to `/branch-setup`'s own baseline run — zero change across the whole story.

- [ ] **Step 6: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: only the known pre-existing baseline failure (`tests/check-p3.5-validate-trace.js`).

- [ ] **Step 7: Commit**

```bash
git add tests/check-cat-s5-artefact-fetch-integration.js
git commit -m "test(cat-s5): add NFR performance/security/audit checks, completing cat-s5's full AC coverage"
```

---

## Post-implementation note for /verify-completion

Per this epic's own established practice (`cat-s4`'s manual walkthrough caught a Critical, 86%-of-documents data-loss bug that 24 passing fixture-based tests missed entirely), do not treat this story's automated tests alone as sufficient completion evidence. Manually start the local server (`NODE_ENV=test`), seed a session, and:
1. Open `/artefact/2026-07-05-product-stds-hierarchy/dor%2Fpsh-s1-dor` — confirm it renders the real document (AC1 regression guard, in the actual running app, not just a mocked-fetch unit test).
2. Open `/artefact/2026-04-19-skills-platform-phase4/spike-a-output` — confirm it now resolves instead of 404ing (AC2's own named regression class, the exact motivating case for this story).
3. If a real orphaned-registration case can be constructed on a test tenant, open its link and confirm the distinguishing message renders (AC3) — otherwise RISK-ACCEPT this specific scenario as synthetic-fixture-only coverage in `decisions.md`, per the same pattern DoR's own W4 warning already accepted for the verification script.
