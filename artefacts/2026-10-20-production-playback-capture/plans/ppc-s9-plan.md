# Implementation Plan: Move capture execution to a GitHub Actions worker, retiring the in-process Chromium launch

**Story:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s9-github-actions-capture-worker.md
**Test plan:** artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s9-test-plan.md
**DoR:** artefacts/2026-10-20-production-playback-capture/dor/ppc-s9-dor.md

---

## Task 1: Nonce-store adapter (Redis-backed, D37)

**Files:**
- Create: `src/web-ui/adapters/capture-nonce-store.js`
- Test: `tests/check-ppc-s9-capture-nonce-store.js` (new)

**Design (from DoR/decisions.md):**
- D37 convention, mirroring `artefact-commit-writer.js`'s own shape exactly: `setNonceStoreAdapter(fn)`/`getNonceStoreAdapter()`, a default stub that throws `'Adapter not wired: nonceStoreAdapter. Call setNonceStoreAdapter() with a real implementation before use.'`
- Two route-callable functions: `issueNonce(sessionId)` → generates a random nonce (`crypto.randomBytes(32).toString('hex')`), calls the wired adapter's own `set(nonce, sessionId, ttlSeconds)`, returns the nonce. `exchangeNonce(nonce)` → calls the wired adapter's own `getAndDelete(nonce)` (single atomic-enough get+del — Upstash doesn't have a single GETDEL primitive in its REST client as far as this repo's own existing Redis usage shows, so do a `get` then `del`, accepting the narrow race window as acceptable for this threat model — note this explicitly in a comment, do not silently assume atomicity), returns the `sessionId` or `null`.
- TTL: 600 seconds (10 minutes, per the story's own AC2 wording).
- Real implementation (`realNonceStoreAdapter`): mirrors `session-redis.js`'s own `_getClient()` pattern exactly (lazy-init `Redis` client from `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` env vars), key prefix `capture-nonce:`, `client.set(key, sessionId, { ex: 600 })` for issue, `client.get(key)` + `client.del(key)` for exchange.

- [ ] **Step 1: Write the failing tests**

```js
// tests/check-ppc-s9-capture-nonce-store.js
'use strict';
var assert = require('assert');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve();
  }
}
var queue = [];

queue.push(function() {
  return test('AC2 (D37 stub): issueNonce/exchangeNonce throw until wired', async function() {
    delete require.cache[require.resolve('../src/web-ui/adapters/capture-nonce-store')];
    var mod = require('../src/web-ui/adapters/capture-nonce-store');
    var threw = false;
    try { await mod.issueNonce('some-session-id'); } catch (err) {
      threw = true;
      assert.ok(/not wired/i.test(err.message), 'error must name the adapter and instruct how to wire it');
    }
    assert.ok(threw, 'must throw, never return null/undefined silently');
  });
});

queue.push(function() {
  return test('AC2: nonce exchanges for the real sessionId exactly once, second attempt fails', async function() {
    var mod = require('../src/web-ui/adapters/capture-nonce-store');
    var store = {};
    mod.setNonceStoreAdapter({
      set: async function(key, value) { store[key] = value; },
      get: async function(key) { return store[key] !== undefined ? store[key] : null; },
      del: async function(key) { delete store[key]; }
    });
    var nonce = await mod.issueNonce('abc123sessionid');
    var first = await mod.exchangeNonce(nonce);
    assert.strictEqual(first, 'abc123sessionid');
    var second = await mod.exchangeNonce(nonce);
    assert.strictEqual(second, null, 'a second exchange of the same nonce must fail -- single-use');
  });
});

queue.push(function() {
  return test('AC2: an expired nonce (TTL already elapsed) fails exchange, same as never-existed', async function() {
    var mod = require('../src/web-ui/adapters/capture-nonce-store');
    // Simulate TTL expiry: the fake adapter's own set() never persists past a
    // simulated "already expired" marker -- get() returns null regardless of
    // what was stored, modelling what a real Redis EX-expired key does.
    mod.setNonceStoreAdapter({
      set: async function() {},
      get: async function() { return null; },
      del: async function() {}
    });
    var nonce = await mod.issueNonce('xyz');
    var result = await mod.exchangeNonce(nonce);
    assert.strictEqual(result, null, 'an expired/never-persisted nonce must fail exchange, not throw and not return a stale value');
  });
});

queue.push(function() {
  return test('AC2: two different sessions issue two different, individually-correct nonces (D37 behavioural correctness, not just wiring)', async function() {
    var mod = require('../src/web-ui/adapters/capture-nonce-store');
    var store = {};
    mod.setNonceStoreAdapter({
      set: async function(key, value) { store[key] = value; },
      get: async function(key) { return store[key] !== undefined ? store[key] : null; },
      del: async function(key) { delete store[key]; }
    });
    var nonceA = await mod.issueNonce('session-A');
    var nonceB = await mod.issueNonce('session-B');
    assert.notStrictEqual(nonceA, nonceB, 'two different sessions must get two different nonces');
    var resultA = await mod.exchangeNonce(nonceA);
    var resultB = await mod.exchangeNonce(nonceB);
    assert.strictEqual(resultA, 'session-A');
    assert.strictEqual(resultB, 'session-B');
    assert.notStrictEqual(resultA, resultB, 'nonce A must never resolve to session B\'s own id or vice versa');
  });
});

(async function() {
  console.log('\ncheck-ppc-s9-capture-nonce-store.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s9-capture-nonce-store.js
```

Expected: `FAIL` on the module-not-found require (file doesn't exist yet).

- [ ] **Step 3: Write minimal implementation**

Write `src/web-ui/adapters/capture-nonce-store.js` per the Design section above. Model the D37 wiring boilerplate directly on `artefact-commit-writer.js`'s own `setArtefactCommitAdapter`/`getArtefactCommitAdapter` shape (same function names, pattern, comment style — substitute "nonceStoreAdapter" for "artefactCommitAdapter"). The wired adapter itself exposes `{set, get, del}` (NOT the full Upstash client surface) — `issueNonce`/`exchangeNonce` call these three methods only, so the test's own fake adapter object (above) is the complete contract.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s9-capture-nonce-store.js
```

Expected: all 4 tests pass.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/capture-nonce-store.js tests/check-ppc-s9-capture-nonce-store.js
git commit -m "feat(ppc-s9): add Redis-backed, single-use nonce store adapter (AC2)"
```

---

## Task 2: Nonce-exchange internal HTTP endpoint

**Files:**
- Create: `src/web-ui/routes/capture-worker-auth.js`
- Modify: `src/web-ui/server.js` (route registration — wiring task, separate from the handler itself per D37 rule 3)
- Test: `tests/check-ppc-s9-capture-worker-auth.js` (new)

**Design:**
- `POST /internal/capture/exchange`, body `{ nonce: string }`.
- Double-gate, modelled directly on `auth-stub.js`'s own `handleAuthStubGithub`: (1) the route is a no-op (404) unless `process.env.CAPTURE_EXCHANGE_SECRET` is set; (2) the request must carry a matching `x-capture-exchange-secret` header, checked via `crypto.timingSafeEqual` (reuse `auth-stub.js`'s own `_secretMatches` shape — same length-mismatch-returns-false-never-throws convention).
- On success: calls `capture-nonce-store.js`'s own `exchangeNonce(nonce)`; if it resolves to a real sessionId, responds `200 {"sessionId": "..."}`; if `null` (already used, expired, or never existed), responds `404` (or `410 Gone` — pick one, be consistent) with a body that names the failure WITHOUT ever echoing the submitted nonce or any session_id value back in the response body or in any log line (mirrors the existing path-traversal guard rule's own "do not log the raw resolved path on failure" convention already used elsewhere in `playback-evidence.js`).
- This endpoint is NOT behind the normal tenant `authGuard` — it is machine-to-machine (the GitHub Actions workflow calling in), authenticated purely by the shared secret, same precedent as `auth-stub.js`'s own routes.

- [ ] **Step 1: Write the failing tests**

(Follow this file's own established `test`/`queue` harness shape, same as Task 1 and every other `ppc-*` test file in this repo — do not invent a different harness.)

Cover:
- `handleCaptureExchange_disabledWhenSecretNotConfigured_404sRegardlessOfInput` — `process.env.CAPTURE_EXCHANGE_SECRET` unset → 404, even with a header present.
- `handleCaptureExchange_wrongSecret_403sRegardlessOfNonceValidity` — secret set, a valid unexpired nonce exists (via a mocked nonce-store adapter), but the request's own header doesn't match → 403, nonce is NEVER consulted (verify the mocked adapter's own `exchangeNonce`/`get` was never called — ordering matters, same as `auth-stub.js`'s own secret-check-before-business-logic convention).
- `handleCaptureExchange_correctSecretValidNonce_returns200WithSessionId` — the real exchange path, happy case.
- `handleCaptureExchange_correctSecretAlreadyUsedNonce_404sWithoutEchoingSessionId` — exchange returns `null`; response body and any logged output never contain the real session_id value (a dedicated assertion, not just "it 404s").

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s9-capture-worker-auth.js
```

- [ ] **Step 3: Write minimal implementation**

Write `src/web-ui/routes/capture-worker-auth.js` per Design above, directly modelled on `auth-stub.js`'s own structure (`_stubEnabled`-equivalent `_exchangeEnabled`, `_secretMatches`-equivalent reusing the exact same `crypto.timingSafeEqual` pattern — consider literally extracting a tiny shared `_constantTimeSecretMatch(candidate, envVarName)` helper if that doesn't violate any existing scope boundary, or duplicate the ~6-line function in place if simpler; either is acceptable, note your choice in the commit message).

Wire into `server.js`: register `POST /internal/capture/exchange` → `handleCaptureExchange`. This route must be reachable in the PRODUCTION environment (unlike `auth-stub.js`'s own staging-only convention) — do not gate it behind `NODE_ENV=test` or any staging-only check; its own `CAPTURE_EXCHANGE_SECRET`-presence check IS the gate.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s9-capture-worker-auth.js
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/capture-worker-auth.js src/web-ui/server.js tests/check-ppc-s9-capture-worker-auth.js
git commit -m "feat(ppc-s9): add shared-secret-gated nonce-exchange endpoint (AC2), wired in server.js"
```

---

## Task 3: GitHub-dispatch adapter (D37)

**Files:**
- Create: `src/web-ui/adapters/capture-dispatch-adapter.js`
- Test: `tests/check-ppc-s9-capture-dispatch-adapter.js` (new)

**Design:**
- D37 convention again, mirroring `artefact-commit-writer.js`. Three route-callable functions behind one adapter boundary (`setCaptureDispatchAdapter`/`getCaptureDispatchAdapter`, stub throws):
  - `dispatchCaptureWorkflow({ nonce, baseUrl, featureSlug, acIds, targets, correlationId })` → `POST {apiBase}/repos/{PLATFORM_REPO_OWNER}/{PLATFORM_REPO_NAME}/actions/workflows/{PLATFORM_CAPTURE_WORKFLOW_ID}/dispatches` with `ref: 'master'` and `inputs` carrying every field EXCEPT any session/token value (the nonce is the only auth-adjacent value present, and it is meaningless without the Task-2 exchange). Uses a PLATFORM-level GitHub token (`process.env.PLATFORM_GITHUB_TOKEN` — a NEW env var, distinct from any tenant's own `req.session.accessToken`; this token only needs `actions:write` scope on THIS platform's own repo, never a tenant's repo, and is never passed to or derived from a tenant session). Fail-closed if `PLATFORM_GITHUB_TOKEN`/`PLATFORM_REPO_OWNER`/`PLATFORM_REPO_NAME`/`PLATFORM_CAPTURE_WORKFLOW_ID` are not configured — mirrors `realCommitArtefact`'s own "owner and repo parameters are required" fail-closed convention.
  - `checkCaptureArtifact(correlationId)` → `GET {apiBase}/repos/{owner}/{repo}/actions/artifacts` (paginated — follow `link` headers or `page`/`per_page` params same as this repo's own existing paginated-fetch conventions elsewhere, e.g. check `src/web-ui/modules/github-org-bulk-add.js` for an established pagination pattern before writing a new one), filters for `name === 'capture-result-' + correlationId`, returns `{ found: true, archiveDownloadUrl }` or `{ found: false }`.
  - `downloadCaptureArtifact(archiveDownloadUrl)` → fetches the zip (GitHub artifact downloads are zip archives; the response needs to be followed through GitHub's own redirect to blob storage — confirm this empirically against a real artifact during implementation, do not assume a single fetch suffices), unzips in-memory (check whether a zip library is already a dependency before adding one — if not, and only a single-file extraction is needed, consider whether Node's own `zlib`/a minimal manual zip-central-directory parse is sufficient rather than pulling in a new npm dependency, consistent with `web-ui-patterns.md`'s "no new npm dependencies" convention; if a new dependency is genuinely unavoidable, flag this explicitly in the implementation report rather than silently adding one), returns `{ screenshotBuffer, videoBuffer }` (or whichever files are present).
- Tests (injectable adapter, mocked `fetch`): assert `dispatchCaptureWorkflow`'s own call body contains the nonce and NEVER contains the string "session" value used in the test fixture's own sessionId, confirming no accidental leak; assert artifact-check correctly filters by exact name match (not a substring/prefix match that could false-positive on a similarly-named correlation id); assert the stub-throws-until-wired D37 behaviour for all three functions.

- [ ] **Step 1: Write the failing tests** — follow the same harness shape as Tasks 1-2. Cover: D37 stub-throws for all 3 functions; `dispatchCaptureWorkflow` call-body inspection (nonce present, raw session value absent); `checkCaptureArtifact` exact-name-match filtering (fixture with 2 artifacts, one a near-miss name, confirm only the exact match is returned); fail-closed when platform env vars are missing.

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s9-capture-dispatch-adapter.js
```

- [ ] **Step 3: Write minimal implementation** per Design above.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s9-capture-dispatch-adapter.js
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/adapters/capture-dispatch-adapter.js tests/check-ppc-s9-capture-dispatch-adapter.js
git commit -m "feat(ppc-s9): add GitHub Actions dispatch/artifact-check adapter (AC1, AC3, AC4)"
```

---

## Task 4: New GitHub Actions workflow + its own capture script

**Files:**
- Create: `.github/workflows/ppc-capture-worker.yml`
- Create: `.github/scripts/ppc-capture-worker.js`
- Test: `tests/check-ppc-s9-capture-worker-script.js` (new, unit-tests the script's own internal orchestration logic only — not a real workflow run)

**Design:**
- Workflow: `on: workflow_dispatch` with `inputs: nonce, baseUrl, featureSlug, acIds (JSON array string), targetsJson (JSON array of {acId, url, selector}), correlationId` (all `required: true`, `type: string` — GitHub Actions inputs are always strings; parse JSON ones in the script). Steps: checkout (shallow, this repo only needs `.github/scripts/` + `src/utils/`), setup-node, `npm ci` (full install — this runner is NOT the production Alpine image, no `--omit=dev`/`--ignore-scripts` needed; mirrors `staging-deploy.yml`'s own smoke-test job, which already installs full Playwright successfully), run `node .github/scripts/ppc-capture-worker.js` with the inputs passed as env vars, then `actions/upload-artifact@v4` named `capture-result-${{ inputs.correlationId }}` for whatever output directory the script writes to.
- Script (`ppc-capture-worker.js`): reads its own inputs from env vars, `POST {baseUrl}/internal/capture/exchange` with `x-capture-exchange-secret: ${process.env.CAPTURE_EXCHANGE_SECRET}` (a GitHub Actions secret, configured once on this platform repo) and `{nonce}` body, receives the real `sessionId`, launches `require('playwright').chromium` (full `playwright` package is fine here — a normal Ubuntu GitHub-hosted runner, not Alpine; this script's own `require` should explicitly use `'playwright'`, NOT `'playwright-core'`, since there is no Alpine/executablePath concern on this runner and the ppc-s8-era distinction doesn't apply here), seeds the `session_id` cookie (same shape `_captureVideoForAcIds` already builds — domain from `baseUrl`, `secure` from its own protocol), then for each entry in `targetsJson` calls the EXISTING, UNCHANGED `captureAcScreenshots`/`captureVideoRecording` (`require('../../src/utils/capture-screenshots')`/`require('../../src/utils/capture-video')`) exactly as `_captureOneAc`/`_captureVideoForAcIds` already do today, writing results to a known local output directory the workflow's own upload-artifact step picks up. **Never requires, imports, or references `accessToken` anywhere in this script — the AC3 unit test below enforces this structurally, not just by convention.**

- [ ] **Step 1: Write the failing test**

```js
// tests/check-ppc-s9-capture-worker-script.js -- unit tests the script's own
// orchestration logic via an injectable chromium module, same pattern
// session-page-adapter.js's own realGetAuthenticatedPage used (now retired,
// pattern relocated here) and capture-video.js's own captureVideoRecording
// already use. Does NOT invoke a real Playwright browser (ADR-018).
```

Cover:
- `captureWorkerScript_neverReferencesAccessToken` — structural: read the script's OWN source text (`fs.readFileSync`) and assert it contains no substring matching `/accessToken/i` anywhere. This is the AC3 test named in the test plan — deliberately a static/structural check, not a runtime one, since the whole point is the script's own code surface never NEEDS that credential, which a source-text check proves directly.
- `captureWorkerScript_exchangesNonceBeforeLaunchingBrowser` — with a mocked `fetch` for the exchange call and an injectable fake chromium module, assert the exchange call happens, its returned `sessionId` is the one seeded into the browser context's cookie (not some other value), and no browser launch is attempted before a successful exchange.
- `captureWorkerScript_multipleAcIds_navigatesEachInSequenceInOneContext` — mirrors `ppc-s5`'s own `handlePostCaptureAll_combinedVideo_coversEveryScreenshottedAc` assertion shape: one browser/context, N navigations for N targets.

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s9-capture-worker-script.js
```

- [ ] **Step 3: Write minimal implementation** per Design above. Write the script so its own core orchestration function is exported and independently callable with an injected chromium module (mirrors `realGetAuthenticatedPage(sessionId, baseUrl, chromiumModule)`'s own injectable-third-parameter convention) — the file's own top-level `require('playwright')` + env-var reading + `actions/upload-artifact`-facing file writes happen only when the script is run as `node .github/scripts/ppc-capture-worker.js` directly (check `require.main === module`), not when required as a module by the test.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s9-capture-worker-script.js
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/ppc-capture-worker.yml .github/scripts/ppc-capture-worker.js tests/check-ppc-s9-capture-worker-script.js
git commit -m "feat(ppc-s9): add the GitHub Actions capture-worker workflow + its own script (AC3)"
```

---

## Task 5: Wire `handlePostCaptureTrigger`/`handlePostCaptureAll` to dispatch instead of launching in-process

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js` (`handlePostCaptureTrigger`, `handlePostCaptureAll`; remove `_captureOneAc`'s and `_captureVideoForAcIds`'s CURRENT in-process bodies — their orchestration moves into Task 4's script, which reuses the same underlying `src/utils/` calls)
- Test: append to `tests/check-ppc-s9-capture-dispatch-wiring.js` (new — do NOT keep piling onto `check-ppc-s5-video-capture.js`, which is being migrated/retired in Task 8, not extended)

**Design:**
- `handlePostCaptureTrigger`: after existing validation (CSRF, rate-limit, target-set, DoD-complete, repo-connected — ALL unchanged), generate `correlationId` (`crypto.randomBytes(16).toString('hex')`), call `issueNonce(req.sessionId)`, call `dispatchCaptureWorkflow({ nonce, baseUrl, featureSlug: journey.featureSlug, acIds: [acId], targets: [{acId, url: target.url, selector: target.selector}], correlationId })`, write `journey.captureInProgress = Object.assign({}, journey.captureInProgress, { [acId]: { correlationId, dispatchedAt: new Date().toISOString() } })` via `_journeyStore.setJourneyFields`, respond/redirect WITHOUT waiting for the dispatch's own completion.
- `handlePostCaptureAll`: same shape, but ONE `dispatchCaptureWorkflow` call carrying every AC in `listResult.toCapture`, and `captureInProgress` set for every AC id in that group to the SAME `correlationId` (mirrors `ppc-s5`'s own "same video path for every AC in the group" convention, now "same correlationId for every AC in the group").
- `ownerRepo` is still resolved and still needed — NOT for the dispatch itself (the workflow never touches the tenant's repo directly), but it's still required by Task 6's own finalise step (the `commitArtefact` call), so keep this resolution where it already is, just don't pass it into anything capture-related until Task 6.

- [ ] **Step 1: Write the failing tests** — cover AC1 (dispatch called with nonce, never raw session_id — spy on the mocked dispatch adapter's own call args and assert the session_id fixture value appears NOWHERE in them), AC6 (capture-all → exactly one dispatch call, correlationId applied to every AC in the group), and migrate-in-place the existing CSRF/rate-limit/target/DoD/repo rejection tests that currently live inline in `handlePostCaptureTrigger`'s/`handlePostCaptureAll`'s own existing test coverage (check `check-ppc-s1-playback-evidence-route.js` and `check-ppc-s2-capture-all-route.js` for exactly which ones currently cover these two handlers before duplicating — Task 8 handles the FULL migration of those two files' own `session-page-adapter`-dependent tests; this task's own new test file only needs the NEW dispatch-specific assertions, not a full copy of every pre-existing rejection-path test, to avoid duplicate coverage drifting out of sync).

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s9-capture-dispatch-wiring.js
```

- [ ] **Step 3: Write minimal implementation** per Design above.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s9-capture-dispatch-wiring.js
```

- [ ] **Step 5: Run full suite — no regressions.** Expected: `check-ppc-s1-playback-evidence-route.js`, `check-ppc-s2-capture-all-route.js`, `check-ppc-s3-capture-rate-limit.js`, `check-ppc-s5-video-capture.js` will likely now FAIL (their own `setSessionPageAdapter` mocks no longer match what these handlers actually call) — this is EXPECTED at this point in the plan; Task 8 migrates them. Confirm the failures are exactly the ones you'd expect from this task's own change (session-page-adapter-shaped mocks no longer invoked), not something unrelated, before moving on.

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-ppc-s9-capture-dispatch-wiring.js
git commit -m "feat(ppc-s9): wire capture-trigger/capture-all to dispatch instead of launching Chromium in-process (AC1, AC6)"
```

---

## Task 6: `handleGetPlaybackEvidence` artifact-check + finalise logic

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js` (`handleGetPlaybackEvidence`, `_renderPlaybackEvidenceHtml`)
- Test: append to `tests/check-ppc-s9-capture-dispatch-wiring.js`

**Design:**
- In `handleGetPlaybackEvidence`, for each AC with a `captureInProgress` entry: call `checkCaptureArtifact(correlationId)`.
  - **Found:** `downloadCaptureArtifact(...)`, then call the EXISTING, UNCHANGED `commitArtefact(screenshotPath, screenshotBuffer.toString('base64'), req.session.accessToken, ownerRepo.owner, ownerRepo.repo, 'base64')` (and the video equivalent) — same call shape `_captureOneAc`/`_captureVideoForAcIds` already used, just fed from a downloaded buffer instead of a local `fs.readFileSync`. Update `journey.captureScreenshots`/`captureVideos`, clear the AC's own `captureInProgress` entry, proceed to render the normal completed state (unchanged rendering).
  - **Not found, within the wait window** (`Date.now() - dispatchedAt < 5 * 60 * 1000`, a named constant, not a magic number): render a new "capture in progress" fragment in `_renderPlaybackEvidenceHtml` (plain text state, no new component, per the story's own NFR/Out-of-Scope — no spinner/websocket).
  - **Not found, past the wait window:** write a `captureAllFailed`-shaped entry for the AC (`{error: 'capture workflow did not complete within the expected window', retry: true}` — reuses the EXISTING `captureAllFailed` field/rendering path already established by `ppc-s2`, do not invent a new failure-state field), clear `captureInProgress`, render the existing failure-notice fragment unchanged.
- `ownerRepo` resolution (already happening earlier in the handler for other reasons, or added here if not) is required for the finalise step's own `commitArtefact` call — confirm it's available at this point in the function without re-fetching it redundantly.

- [ ] **Step 1: Write the failing tests** — cover: artifact-found → `commitArtefact` called with the exact real tenant token/owner/repo/encoding shape (spy assertion), fields updated, normal render; artifact-not-found-recent → in-progress render, no `commitArtefact` call; artifact-not-found-timed-out → `captureAllFailed` entry written (reusing the EXISTING field, assert this explicitly rather than assuming a new one), failure render.

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s9-capture-dispatch-wiring.js
```

- [ ] **Step 3: Write minimal implementation** per Design above.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s9-capture-dispatch-wiring.js
```

- [ ] **Step 5: Run full suite — no regressions** (same expected-failures note as Task 5 — Task 8 still pending).

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-ppc-s9-capture-dispatch-wiring.js
git commit -m "feat(ppc-s9): finalise completed captures via existing commitArtefact path; named failure state on timeout (AC4, AC5)"
```

---

## Task 7: Remove dead code

**Files:**
- Delete: `src/web-ui/adapters/session-page-adapter.js`
- Delete: `tests/check-ppc-s1-session-page-adapter.js`
- Modify: `src/web-ui/server.js` (remove `getAuthenticatedPage`/`setSessionPageAdapter` require + wiring call)
- Modify: `Dockerfile` (revert the `ppc-s8` production-stage additions)

**Design:**
- Before deleting anything, `grep -rn "session-page-adapter\|getAuthenticatedPage\|setSessionPageAdapter" src/ tests/` and confirm the ONLY remaining references are inside `playback-evidence.js` itself if Tasks 5/6 somehow left a stray call (they should not — re-verify Task 5 fully removed both call sites at `getAuthenticatedPage(req.sessionId, baseUrl)`), and inside `server.js`'s own wiring line. If anything else still references it, stop and investigate before deleting — do not delete a file something else still depends on.
- Dockerfile: identify the exact hunks to revert — `git log --oneline -- Dockerfile` to find the `ppc-s8` commits (`8ddebf03` first fix's Dockerfile hunk is actually in the PACKAGE/adapter commit, not Dockerfile — re-check with `git log -p -- Dockerfile` directly rather than assuming specific SHAs from memory, since exact commit boundaries may not be what's recalled here) that added: the `RUN apk add --no-cache chromium ca-certificates ttf-freefont` line + its preceding comment block, the `ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=...` line, and the `RUN npm install playwright-core@1.59.1 --no-save --ignore-scripts` line + its preceding comment block. Remove exactly these additions, restoring the file to its pre-`ppc-s8` shape for these specific hunks — do not touch anything else in the Dockerfile.
- `package.json`: confirm (it should already be true, since `ppc-s8` deliberately never added `playwright-core` there) that there is nothing to revert in `package.json`/`package-lock.json` for this task.

- [ ] **Step 1: Confirm via grep (not a traditional failing test — this task starts from a verification step, not new test code)**

```bash
grep -rn "session-page-adapter\|getAuthenticatedPage\|setSessionPageAdapter" src/ tests/
```

Expected at this point in the plan (after Tasks 5-6): matches ONLY in `session-page-adapter.js` itself, its own test file, and `server.js`'s wiring line. If `playback-evidence.js` or any OTHER file still shows a match, stop — Task 5/6 left something unremoved; fix that first.

- [ ] **Step 2: N/A** (this task removes code rather than adding a new failing test first — the "test" that must pass is the full suite continuing to pass with the file gone, Step 4 below)

- [ ] **Step 3: Delete the files, remove the Dockerfile hunks and server.js wiring line**, per Design above.

- [ ] **Step 4: Run full suite — must still pass, with these files genuinely gone**

```bash
grep -rln "session-page-adapter\|chromiumSandbox\|PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH\|ttf-freefont" src/ Dockerfile tests/ 2>/dev/null
node scripts/run-all-tests.js
```

Expected: the grep returns NOTHING (zero matches, confirming AC7's own "dead code genuinely removed" requirement); the full suite passes (modulo the Task 8 test-migration files, still pending until that task).

- [ ] **Step 5: N/A** (folded into Step 4 above)

- [ ] **Step 6: Commit**

```bash
git add -A -- src/web-ui/adapters/session-page-adapter.js tests/check-ppc-s1-session-page-adapter.js src/web-ui/server.js Dockerfile
git commit -m "chore(ppc-s9): remove session-page-adapter.js and the ppc-s8 in-process-Chromium Dockerfile changes (AC7)"
```

---

## Task 8: Migrate the 6 existing tests to the new dispatch-based mocking shape

**Files:**
- Modify: `tests/check-ppc-s1-playback-evidence-route.js`
- Modify: `tests/check-ppc-s1-ui-layer.js`
- Modify: `tests/check-ppc-s2-capture-all-route.js`
- Modify: `tests/check-ppc-s3-capture-rate-limit.js`
- Modify: `tests/check-ppc-s5-video-capture.js`

**Design:**
- For each file: find every `setSessionPageAdapter(...)` call (and the `sessionPageAdapter` require at the top of the file), replace with the equivalent `setCaptureDispatchAdapter(...)`/`setNonceStoreAdapter(...)` mocks needed for THAT file's own specific assertions to keep working under the new dispatch-based flow. **Do not weaken, skip, or delete any existing assertion in any of these 5 files** — every one currently verifies real, still-applicable behaviour (CSRF, rate-limiting, tenant isolation, combined-video grouping, the "also covers" note, etc.) that must keep being verified, just via the new code path.
- This is the highest-risk task in the whole plan for silently losing coverage — after each file's own migration, diff the OLD test names against the NEW ones and confirm a 1:1 (or intentionally-consolidated-with-a-comment, same convention `ppc-s5`'s own Task 7 established) correspondence; do not let a test quietly vanish during the rewrite.
- Some assertions that previously inspected the FAKE chromium/page/browser objects directly (e.g. "the context's own cookie was seeded with X") no longer have an equivalent in the NEW flow, since the actual cookie-seeding now happens in Task 4's own script, not in these route handlers at all — for those specific assertions, either (a) confirm the SAME behaviour is already covered by Task 4's own new test file (`check-ppc-s9-capture-worker-script.js`) and explicitly note the assertion moved there rather than being dropped, or (b) if no equivalent exists yet, add one to `check-ppc-s9-capture-worker-script.js` as part of THIS task, not silently drop the coverage.

- [ ] **Step 1: For each of the 5 files, identify every assertion whose own continued meaning depends on the OLD in-process flow vs. the NEW dispatch-based flow.** Write down (in the commit message or a short comment block at the top of each migrated file) which assertions moved to `check-ppc-s9-capture-worker-script.js`, which were rewritten in place, and which needed no change at all (e.g. a pure CSRF-rejection test needs no change beyond removing the now-unnecessary mock setup).

- [ ] **Step 2: Run each file — expect failures from the stale mocks (already true going into this task, from Tasks 5-6's own expected regressions).**

```bash
node tests/check-ppc-s1-playback-evidence-route.js
node tests/check-ppc-s1-ui-layer.js
node tests/check-ppc-s2-capture-all-route.js
node tests/check-ppc-s3-capture-rate-limit.js
node tests/check-ppc-s5-video-capture.js
```

- [ ] **Step 3: Migrate each file's own mocks**, per Design above, one file at a time — confirm each file passes on its own before moving to the next, rather than rewriting all 5 blind and debugging in bulk.

- [ ] **Step 4: Run all 5 — must pass**, plus re-run Task 4's own test file to confirm any moved assertions actually landed there.

```bash
node tests/check-ppc-s1-playback-evidence-route.js
node tests/check-ppc-s1-ui-layer.js
node tests/check-ppc-s2-capture-all-route.js
node tests/check-ppc-s3-capture-rate-limit.js
node tests/check-ppc-s5-video-capture.js
node tests/check-ppc-s9-capture-worker-script.js
```

- [ ] **Step 5: Run full suite — must pass, zero regressions anywhere in the repo, not just these 5 files.**

```bash
node scripts/run-all-tests.js
```

- [ ] **Step 6: Commit**

```bash
git add tests/check-ppc-s1-playback-evidence-route.js tests/check-ppc-s1-ui-layer.js tests/check-ppc-s2-capture-all-route.js tests/check-ppc-s3-capture-rate-limit.js tests/check-ppc-s5-video-capture.js tests/check-ppc-s9-capture-worker-script.js
git commit -m "test(ppc-s9): migrate 6 existing tests from session-page-adapter mocks to the new dispatch-based flow, preserving every existing assertion (AC7)"
```

---

## Final task: Full regression + AC verification walkthrough

After all 8 tasks: dispatch a final reviewer subagent reviewing the complete diff from this plan's own starting commit through the last task's end, against ALL of `ppc-s9`'s ACs (AC1-AC8), confirming nothing is missing, nothing extra, and the dead-code removal (AC7) is genuinely complete — same closing-review convention `ppc-s5` and `ppc-s8` both already established in this session.

AC3's "real workflow uploads a named artifact" and AC8's "real production trigger succeeds end-to-end" are both manual/live verification scenarios per the test plan — not completable inside this coding-loop alone; name them explicitly as the final verification steps in the completion report, same convention `ppc-s8`'s own DoR already established for its own AC3.
