#!/usr/bin/env node
// tests/check-ep2-s4-integration.js — AC verification tests for ep2-s4
// Task 5 (Wire the real save route + SSE stream + client script), story
// artefacts/new-feature-2b74a292 (Concurrent Write Merge for Artefact
// Edits).
//
// AC1: POST /api/journey/:journeyId/stage/:stageName/artefact (JSON body
//      path) detects a concurrent save via modules/concurrent-edit-buffer.js
//      and, when detected, runs modules/merge-artefact-edits.js's real
//      three-way merge rather than last-write-wins.
// AC2: A merge triggered by one user's save pushes the merged content over
//      SSE (GET .../artefact-merged) to every OTHER subscriber for that
//      journey+stage, via modules/artefact-merge-broadcast.js's keyFor() /
//      subscribe() / publish() -- the save route and the SSE route MUST
//      derive the exact same key via keyFor() (Task 4's correction: no
//      inline `journeyId + ':' + stageName` re-derivation at either site).
// AC3: Every save/merge is recorded to feature_edits via
//      modules/feature-edits.js's recordEdit(), with the correct
//      operation ('save' | 'merge'), userId (the acting user, not a
//      hardcoded session login), mergedWith, and lineAttributions.
//
// Test-approach decision (see Step 1's own implementer note in the plan):
// this test reaches a REAL, full save -> concurrent-save -> merge -> SSE
// push -> feature_edits-record round trip, in-process, via direct handler
// invocation -- not a real HTTP round trip. This follows the established
// precedent in tests/check-ep2-s3-approval.js Part 3 (freshRequireP3 /
// makeReqP3 / makeResP3): a real fs.mkdtempSync temp dir as repoRoot, a
// real journey created via journey-store's own createJourney(), and (new
// here) journey-store's completeStage() to seed a completed stage with a
// KNOWN, real artefactPath -- exactly the piece Task 5's Step 1 note flagged
// as needing investigation. completeStage() populates
// journey.completedStages, which handlePostJourneyStageArtefact reads
// directly (routes/journey.js:~1533) -- no need to fall back to
// _journeyDisk's own on-disk stage format at all. This is real, not a
// stand-in: the same createJourney/completeStage functions server.js wires
// on every real journey advance are called here directly.
//
// The two-user distinct-login limitation that motivated Task 5's own
// planned /test/session HTTP-based escape hatch does not apply to this
// direct-invocation approach at all -- req.session.login is set directly
// per call, no fixture endpoint involved, so "Susan" and "Darren" are
// trivially distinguishable without needing the JSON body's actingUserId
// test-only escape hatch. (That escape hatch is still implemented in the
// handler per the plan, since production JSON callers may run through a
// real HTTP path in the future E2E spec -- Task 6 -- where the session
// fixture limitation genuinely does apply; it just isn't needed by THIS
// test.)
//
// Concurrency-window determinism: modules/concurrent-edit-buffer.js's
// registerSave() flags concurrency via `(now - prior.timestamp) < 100`.
// Rather than relying on two real Date.now() calls happening to land
// within 100ms of each other (flaky under load), this test uses the
// module's own injectable setNow() (see check-ep2-s4-concurrent-edit-buffer.js
// for the precedent) to pin both saves to the exact same instant --
// deterministically inside the window on every run.
//
// Follows this repo's hand-rolled test()/assert convention (see
// tests/check-ep2-s4-merge-artefact-edits.js, tests/check-ep2-s4-concurrent-edit-buffer.js,
// this same story's own Task 1/2 files) -- no Jest/Mocha, Node.js built-ins only.

'use strict';

process.env.NODE_ENV = 'test';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
const JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
const REPO_ROOT_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/repo-root.js');

// concurrent-edit-buffer.js / artefact-merge-broadcast.js / feature-edits.js
// are NOT cache-busted -- journey.js's own handler local-requires these by
// the same resolved path, so requiring them here (without busting) yields
// the exact same singleton instances the handler under test will use. Each
// test below uses a fresh, random journeyId (via createJourney's
// crypto.randomUUID()), so the concurrent-edit-buffer and broadcast Maps'
// per-key state never collides across test cases even though the modules
// themselves are shared.
const mergeBuffer = require('../src/web-ui/modules/concurrent-edit-buffer');
const broadcastModule = require('../src/web-ui/modules/artefact-merge-broadcast');

function freshRequire() {
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(REPO_ROOT_ADAPTER_PATH)]; } catch (_) {}
  const jStore = require(JOURNEY_STORE_PATH);
  const j = require(JOURNEY_PATH);
  return { jStore: jStore, j: j };
}

function makeRes() {
  const res = { _code: null, _body: '', _headers: {}, _writes: [], _closeHandlers: [] };
  res.writeHead = function (code, headers) { res._code = code; Object.assign(res._headers, headers || {}); };
  res.end = function (body) { res._body += (body || ''); };
  res.write = function (chunk) { res._writes.push(chunk); return true; };
  res.on = function (event, handler) { if (event === 'close') res._closeHandlers.push(handler); };
  return res;
}

function makeReq(overrides) {
  return Object.assign({
    session: { accessToken: 'tok', login: 'fallback-user', tenantId: 'test-tenant' },
    params: {},
    headers: { 'content-type': 'application/json' }
  }, overrides);
}

function makeFakePool() {
  const calls = [];
  return {
    calls: calls,
    query: async function (sql, params) {
      calls.push({ sql: sql, params: params });
      // Mirrors feature-edits.js's INSERT ... RETURNING shape closely enough
      // for recordEdit() to resolve a row -- this test asserts against the
      // CALL params (the real inputs recordEdit computed and sent), not
      // against a round-tripped "returned row", so the exact RETURNING
      // column shape here doesn't need to be byte-perfect.
      return { rows: [{ id: calls.length }] };
    }
  };
}

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function () { passed++; console.log('  [PASS]', name); },
        function (err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', (err && err.message) || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', (err && err.message) || err);
    return Promise.resolve();
  }
}

// Seeds a real journey with a real completed stage backed by a real file on
// disk -- the "cheap fixture" this test's own header comment describes.
function seedJourneyStage(r, tmpDir, featureSlug, stageName, initialContent) {
  r.j.setRepoRoot(tmpDir);
  const jobj = r.jStore.createJourney(featureSlug);
  const artefactRelPath = 'artefacts/' + featureSlug + '/' + stageName + '.md';
  const absPath = path.join(tmpDir, artefactRelPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, initialContent, 'utf8');
  r.jStore.completeStage(jobj.journeyId, stageName, artefactRelPath);
  return { journeyId: jobj.journeyId, artefactRelPath: artefactRelPath, absPath: absPath };
}

async function testFirstSaveIsPlainSaveNotMerge() {
  const r = freshRequire();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep2-s4-test-'));
  const fixture = seedJourneyStage(r, tmpDir, 'ep2s4-plain-save', 'discovery', 'Original line 1\nOriginal line 2\n');
  const fakePool = makeFakePool();
  r.j.setFeatureEditsPool(fakePool);

  const res = makeRes();
  await r.j.handlePostJourneyStageArtefact(makeReq({
    params: { journeyId: fixture.journeyId, stageName: 'discovery' },
    session: { accessToken: 'tok', login: 'susan', tenantId: 'test-tenant' },
    headers: { 'content-type': 'application/json' },
    body: { content: 'Susan edit line 1\nOriginal line 2\n' }
  }), res);

  await test('first save (no prior concurrent save): 200 with merged:false', function () {
    assert.strictEqual(res._code, 200, 'expected 200, got ' + res._code + ' -- ' + res._body);
    const parsed = JSON.parse(res._body);
    assert.strictEqual(parsed.merged, false, 'a lone first save must not be reported as a merge');
    assert.strictEqual(parsed.content, 'Susan edit line 1\nOriginal line 2\n');
  });
  await test('first save: content actually written to disk', function () {
    const onDisk = fs.readFileSync(fixture.absPath, 'utf8');
    assert.strictEqual(onDisk, 'Susan edit line 1\nOriginal line 2\n');
  });
  await test('first save: feature_edits recorded with operation=save and the real acting user', function () {
    assert.strictEqual(fakePool.calls.length, 1, 'expected exactly one feature_edits INSERT');
    const params = fakePool.calls[0].params;
    // [featureId, artefactName, userId, operation, editHash, mergedWithJson, lineAttributionsJson, tenantId]
    assert.strictEqual(params[2], 'susan', 'userId must be the real acting user (susan), not a hardcoded/fallback login');
    assert.strictEqual(params[3], 'save');
    assert.strictEqual(params[5], null, 'mergedWith must be null for a non-merge save');
  });

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

async function testConcurrentSaveTriggersRealMergeAndBroadcastsOverSSE() {
  const r = freshRequire();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep2-s4-test-'));
  const fixture = seedJourneyStage(
    r, tmpDir, 'ep2s4-concurrent-merge', 'discovery',
    'Line one unchanged\nLine two original\nLine three unchanged\n'
  );
  const fakePool = makeFakePool();
  r.j.setFeatureEditsPool(fakePool);

  // Pin the concurrency clock so both saves land at the exact same instant
  // -- deterministically inside concurrent-edit-buffer.js's 100ms window,
  // regardless of real wall-clock timing on the machine running this test.
  const FIXED_NOW = 5000000;
  mergeBuffer.setNow(function () { return FIXED_NOW; });

  // Subscribe a fake SSE client to the merge stream BEFORE either save, via
  // the real route handler -- proves handleGetArtefactMergeStream and the
  // save route build the identical subscription key via keyFor() (Task 4's
  // correction). If either site drifted back to inline concatenation, this
  // subscriber would receive nothing below.
  const sseRes = makeRes();
  await r.j.handleGetArtefactMergeStream(makeReq({
    params: { journeyId: fixture.journeyId, stageName: 'discovery' },
    session: { accessToken: 'tok', login: 'observer', tenantId: 'test-tenant' }
  }), sseRes);

  // Susan saves first: no prior save for this key yet -> plain save, no merge.
  const resSusan = makeRes();
  await r.j.handlePostJourneyStageArtefact(makeReq({
    params: { journeyId: fixture.journeyId, stageName: 'discovery' },
    session: { accessToken: 'tok', login: 'susan', tenantId: 'test-tenant' },
    headers: { 'content-type': 'application/json' },
    body: { content: 'Line one unchanged\nLine two from SUSAN\nLine three unchanged\n' }
  }), resSusan);

  await test('susan\'s save (first, no concurrency yet): merged:false, 200', function () {
    assert.strictEqual(resSusan._code, 200);
    assert.strictEqual(JSON.parse(resSusan._body).merged, false);
  });

  // Darren saves immediately after (same pinned instant) -- concurrent with
  // Susan's save on the SAME journeyId+stageName key -> real merge.
  const resDarren = makeRes();
  await r.j.handlePostJourneyStageArtefact(makeReq({
    params: { journeyId: fixture.journeyId, stageName: 'discovery' },
    session: { accessToken: 'tok', login: 'darren', tenantId: 'test-tenant' },
    headers: { 'content-type': 'application/json' },
    body: { content: 'Line one unchanged\nLine two original\nLine three from DARREN\n' }
  }), resDarren);

  // Expected merge result, traced against merge-artefact-edits.js's real
  // documented algorithm (module header, steps 1-4) for these exact inputs:
  //   base (disk, after Susan's save)       = "...unchanged / from SUSAN / unchanged"
  //   userAContent param (Darren's request) = "...unchanged / original    / from DARREN"
  //   userBContent param (Susan's buffered content, == base exactly)
  // Since userBContent == base line-for-line, every base line trivially
  // matches its own "B" alignment (bChanged is always false), so the merge
  // reduces to: wherever Darren's content differs from base, Darren's line
  // wins (attributed to darren, the acting user of this second request);
  // everywhere else, base (Susan's already-saved line) passes through
  // unattributed. Concretely: line 2 reverts to "original" (attributed to
  // darren -- Darren's content differed from base there) and line 3 becomes
  // Darren's edit (attributed to darren). This is a real property of the
  // shipped Task 1 algorithm (base = current disk state, not a true
  // pre-edit common ancestor) -- not a hand-tuned expectation.
  const expectedMerged = 'Line one unchanged\nLine two original\nLine three from DARREN\n';

  await test('darren\'s concurrent save: 200, merged:true, real three-way-merged content', function () {
    assert.strictEqual(resDarren._code, 200, 'expected 200, got ' + resDarren._code + ' -- ' + resDarren._body);
    const parsed = JSON.parse(resDarren._body);
    assert.strictEqual(parsed.merged, true, 'a genuinely concurrent second save must be reported as a merge');
    assert.strictEqual(parsed.content, expectedMerged, 'merged content must match the real mergeArtefactEdits() output for these inputs');
    assert.deepStrictEqual(parsed.lineAttributions, { '2': 'darren', '3': 'darren' });
  });
  await test('merged content is what actually landed on disk (not just in the response)', function () {
    const onDisk = fs.readFileSync(fixture.absPath, 'utf8');
    assert.strictEqual(onDisk, expectedMerged);
  });
  await test('SSE subscriber received a push for EVERY save via the SAME keyFor() key as the save route (susan\'s plain save, then darren\'s merge)', function () {
    // publish() is called unconditionally at the end of every save (merge or
    // not) -- see handlePostJourneyStageArtefact's final broadcastModule.publish()
    // call, which runs regardless of the `merged` flag -- so this subscriber,
    // registered before either save, sees BOTH pushes. If the SSE route and
    // the save route built the subscription key differently (the exact drift
    // Task 4's keyFor() correction guards against), this subscriber would
    // have received zero frames instead.
    assert.strictEqual(sseRes._writes.length, 2, 'expected one SSE push for susan\'s save and one for darren\'s merge');

    const susanFrame = sseRes._writes[0];
    assert.ok(susanFrame.indexOf('data: ') === 0, 'SSE frame must be a well-formed "data: " event');
    const susanPayload = JSON.parse(susanFrame.slice('data: '.length).trim());
    assert.strictEqual(susanPayload.merged, false);
    assert.deepStrictEqual(susanPayload.userIds, ['susan']);

    const mergeFrame = sseRes._writes[1];
    const mergePayload = JSON.parse(mergeFrame.slice('data: '.length).trim());
    assert.strictEqual(mergePayload.content, expectedMerged);
    assert.strictEqual(mergePayload.merged, true);
    assert.deepStrictEqual(mergePayload.userIds, ['darren', 'susan']);
  });
  await test('feature_edits recorded BOTH the plain save and the merge, in order, with correct attribution', function () {
    assert.strictEqual(fakePool.calls.length, 2, 'expected one feature_edits INSERT for susan\'s save and one for darren\'s merge');
    const susanParams = fakePool.calls[0].params;
    assert.strictEqual(susanParams[2], 'susan');
    assert.strictEqual(susanParams[3], 'save');
    assert.strictEqual(susanParams[5], null);

    const darrenParams = fakePool.calls[1].params;
    assert.strictEqual(darrenParams[2], 'darren', 'the merge row must attribute to darren -- the acting user of the concurrent request -- not susan');
    assert.strictEqual(darrenParams[3], 'merge');
    assert.deepStrictEqual(JSON.parse(darrenParams[5]), ['darren', 'susan'], 'mergedWith must list both users involved');
    assert.deepStrictEqual(JSON.parse(darrenParams[6]), { '2': 'darren', '3': 'darren' });
  });

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

async function testEmptyContentRejectedWith400() {
  const r = freshRequire();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep2-s4-test-'));
  const fixture = seedJourneyStage(r, tmpDir, 'ep2s4-empty-reject', 'discovery', 'Original\n');
  r.j.setFeatureEditsPool(makeFakePool());

  const res = makeRes();
  await r.j.handlePostJourneyStageArtefact(makeReq({
    params: { journeyId: fixture.journeyId, stageName: 'discovery' },
    session: { accessToken: 'tok', login: 'susan', tenantId: 'test-tenant' },
    headers: { 'content-type': 'application/json' },
    body: { content: '   ' }
  }), res);

  await test('empty/whitespace-only JSON content: 400, disk untouched', function () {
    assert.strictEqual(res._code, 400, 'expected 400, got ' + res._code + ' -- ' + res._body);
    const onDisk = fs.readFileSync(fixture.absPath, 'utf8');
    assert.strictEqual(onDisk, 'Original\n', 'disk content must be untouched by a rejected save');
  });

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

async function testLegacyFormEncodedPathStillWorksUnchanged() {
  const r = freshRequire();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep2-s4-test-'));
  const fixture = seedJourneyStage(r, tmpDir, 'ep2s4-legacy-form', 'discovery', 'Original\n');

  const res = makeRes();
  await r.j.handlePostJourneyStageArtefact(makeReq({
    params: { journeyId: fixture.journeyId, stageName: 'discovery' },
    session: { accessToken: 'tok', login: 'susan', tenantId: 'test-tenant' },
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: { content: 'Legacy form save\n' }
  }), res);

  await test('legacy (non-JSON) save path: 302 redirect, plain overwrite, no merge/attribution involved', function () {
    assert.strictEqual(res._code, 302, 'expected 302 redirect, got ' + res._code);
    const onDisk = fs.readFileSync(fixture.absPath, 'utf8');
    assert.strictEqual(onDisk, 'Legacy form save\n');
  });

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

async function testCrossTenantWriteIsRejected() {
  const r = freshRequire();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep2-s4-test-'));
  const fixture = seedJourneyStage(r, tmpDir, 'ep2s4-cross-tenant', 'discovery', 'Original\n');
  // Give the fixture journey a real owner/tenant -- createJourney() alone
  // leaves both null, which triggers requireJourneyAccess()'s own
  // unconditional-access passthrough for ownerId == null (a real,
  // pre-existing, documented behavior shared by every POLICY.TENANT-guarded
  // route in this file -- see decisions.md). Setting both here is what
  // makes this test actually exercise the guard rather than the passthrough.
  r.jStore.setJourneyFields(fixture.journeyId, { ownerId: 'susan', tenantId: 'tenant-a' });

  const resJson = makeRes();
  await r.j.handlePostJourneyStageArtefact(makeReq({
    params: { journeyId: fixture.journeyId, stageName: 'discovery' },
    session: { accessToken: 'tok', login: 'attacker', tenantId: 'tenant-b' },
    headers: { 'content-type': 'application/json' },
    body: { content: 'Malicious cross-tenant overwrite\n' }
  }), resJson);

  await test('final-review fix: cross-tenant JSON save is rejected, disk untouched', function () {
    assert.notStrictEqual(resJson._code, 200, 'a different-tenant, non-owner request must not succeed, got ' + resJson._code + ' -- ' + resJson._body);
    const onDisk = fs.readFileSync(fixture.absPath, 'utf8');
    assert.strictEqual(onDisk, 'Original\n', 'disk content must be untouched by a rejected cross-tenant write');
  });

  const resForm = makeRes();
  await r.j.handlePostJourneyStageArtefact(makeReq({
    params: { journeyId: fixture.journeyId, stageName: 'discovery' },
    session: { accessToken: 'tok', login: 'attacker', tenantId: 'tenant-b' },
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: { content: 'Malicious cross-tenant overwrite via legacy path\n' }
  }), resForm);

  await test('final-review fix: cross-tenant LEGACY form save is also rejected, disk untouched', function () {
    assert.notStrictEqual(resForm._code, 302, 'a different-tenant, non-owner request must not succeed via the legacy path either, got ' + resForm._code);
    const onDisk = fs.readFileSync(fixture.absPath, 'utf8');
    assert.strictEqual(onDisk, 'Original\n', 'disk content must be untouched by a rejected cross-tenant legacy-path write');
  });

  // Same-tenant, non-owner-but-tenant-matched request must still succeed --
  // confirms the fix is a genuine tenant/ownership check, not an
  // overly-broad block on every non-owner request.
  const resSameTenant = makeRes();
  await r.j.handlePostJourneyStageArtefact(makeReq({
    params: { journeyId: fixture.journeyId, stageName: 'discovery' },
    session: { accessToken: 'tok', login: 'darren', tenantId: 'tenant-a' },
    headers: { 'content-type': 'application/json' },
    body: { content: 'Legitimate same-tenant collaborator save\n' }
  }), resSameTenant);

  await test('final-review fix: same-tenant collaborator (not the owner) can still save -- fix is not overly broad', function () {
    assert.strictEqual(resSameTenant._code, 200, 'expected 200, got ' + resSameTenant._code + ' -- ' + resSameTenant._body);
    const onDisk = fs.readFileSync(fixture.absPath, 'utf8');
    assert.strictEqual(onDisk, 'Legitimate same-tenant collaborator save\n');
  });

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

async function main() {
  console.log('\n[ep2-s4-integration] Task 5 -- real save->merge->broadcast->attribution round trip');
  await testFirstSaveIsPlainSaveNotMerge();
  await testConcurrentSaveTriggersRealMergeAndBroadcastsOverSSE();
  await testEmptyContentRejectedWith400();
  await testLegacyFormEncodedPathStillWorksUnchanged();
  await testCrossTenantWriteIsRejected();

  console.log('\n[ep2-s4-integration] ' + (passed + failed) + ' run, ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    failures.forEach(function (f) { console.log('  FAILURE:', f.name, '--', (f.err && f.err.message) || f.err); });
    process.exitCode = 1;
  }
}

main().catch(function (err) { console.error('FAIL (crash):', err); process.exitCode = 1; });
