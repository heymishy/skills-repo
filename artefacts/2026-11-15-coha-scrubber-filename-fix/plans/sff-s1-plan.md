# Keep a placeholder filename on every scrubbed stack frame so PostHog accepts the error events - Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every scrubbed stack frame carry a string `filename` (the repository path, or the fixed constant `[redacted]`), proved by tests that fail first.
**Branch:** `feature/sff-s1-keep-a-filename-on-every-scrubbed-frame`
**Worktree:** `.worktrees/sff-s1-keep-a-filename-on-every-scrubbed-frame` (verify this prefix before every edit; CLAUDE.md)
**Test command:** `node tests/check-coha-s5-error-capture.js` (single file; full suite is `npm test`). Baseline of 6 failing files acknowledged in `artefacts/2026-11-15-coha-scrubber-filename-fix/decisions.md`.
**Story:** `artefacts/2026-11-15-coha-scrubber-filename-fix/stories/sff-s1-keep-a-filename-on-every-scrubbed-frame.md` | **Test plan:** `.../test-plans/sff-s1-test-plan.md` | **Contract:** `.../dor/sff-s1-dor-contract.md`

**Constraints (from the DoR):** ASCII only (count non-ASCII after each edit); never copy input text into the placeholder; the ONLY existing assertion that may change is in `scrubEvent_filename_keptOnlyWhenRepoRelative`; do not edit `.github/pipeline-state.json` or `workspace/state.json` from the worktree; draft PR only; no production deploy. Edit tools have turned backslash escapes into literal characters before (learnings D60): prefer Edit with plain text and verify afterwards.

---

## File map

```
Create:
  tests/fixtures/sff-s1-posthog-frames.json   - real-shape frames captured from PostHog 2026-11-15 (truncated capture, noted in the header)

Modify:
  tests/check-coha-s5-error-capture.js        - append UT1 to UT6 and IT1 before the "// ---- runner" comment (line ~798); change two assertions in scrubEvent_filename_keptOnlyWhenRepoRelative
  src/web-ui/modules/error-capture.js         - scrubFrame (lines 52 to 66) plus one constant near line 25
```

---

## Task 1: Fixture, unit tests UT1 to UT6, and the edited assertions (all red)

Model class: `balanced`. Covers AC1, AC2, AC3.

**Files:**
- Create: `tests/fixtures/sff-s1-posthog-frames.json`
- Modify: `tests/check-coha-s5-error-capture.js`

- [ ] **Step 1: Create the fixture** (exact content):

```json
{
  "_comment": "Frame shapes captured from PostHog project 10908 on 2026-11-15 ($exception_list of a staging event rejected with 'missing field filename'). The readback was truncated after four frames; frames beyond those are written to the same shapes. The Node internal frame has NO filename and in_app false: that is the live defect.",
  "frames": [
    { "colno": 5, "filename": "src/web-ui/server.js", "function": "router", "in_app": true, "lineno": 3444, "platform": "node:javascript" },
    { "colno": 27, "filename": "src/web-ui/routes/auth.js", "function": "handleAuthCallback", "in_app": true, "lineno": 398, "platform": "node:javascript" },
    { "colno": 5, "function": "process.processTicksAndRejections", "in_app": false, "lineno": 95, "platform": "node:javascript" },
    { "colno": 66, "filename": "src/web-ui/routes/auth.js", "function": "handleAuthCallback", "in_app": true, "lineno": 398, "platform": "node:javascript" }
  ]
}
```

- [ ] **Step 2: Change the two assertions in `scrubEvent_filename_keptOnlyWhenRepoRelative`.** Replace

`assert.strictEqual(fr('/tenants/' + hex() + '/a.js'), undefined);  // no basename fallback`
with
`assert.strictEqual(fr('/tenants/' + hex() + '/a.js'), '[redacted]');  // no basename fallback, fixed placeholder instead`

and replace
`assert.strictEqual(fr('/home/mysrc/a.js'), undefined);  // 'src/' must sit at a segment boundary`
with
`assert.strictEqual(fr('/home/mysrc/a.js'), '[redacted]');  // 'src/' must sit at a segment boundary`

- [ ] **Step 3: Append these tests** immediately above the line `// ---- runner (supports async tests; runs sequentially) ----`:

```js
// ---- sff-s1: every scrubbed frame carries a string filename (PostHog rejects frames without one) ----
const _fx = require('./fixtures/sff-s1-posthog-frames.json');
// The only consumer rule evidenced on 2026-11-15: every frame of every $exception_list entry has a string filename.
function everyFrameHasFilename(ev) {
  const list = ev && ev.properties && ev.properties.$exception_list;
  if (!Array.isArray(list) || !list.length) return false;
  return list.every(x => x && x.stacktrace && Array.isArray(x.stacktrace.frames) &&
    x.stacktrace.frames.every(f => f && typeof f === 'object' && typeof f.filename === 'string'));
}
function eventWithFrames(frames) { const e = sdkEvent('m'); e.properties.$exception_list[0].stacktrace.frames = frames; return e; }
const outFrames = (e) => ec.scrubEvent(e, 'production').properties.$exception_list[0].stacktrace.frames;

test('sff_UT1_repoFrames_keepRepoRelativeFilename', () => {
  const f = outFrames(eventWithFrames([{ filename: '/app/src/web-ui/server.js' }, { filename: '/app/src/x/node_modules/pkg/i.js' }]));
  assert.strictEqual(f[0].filename, 'src/web-ui/server.js');
  assert.strictEqual(f[1].filename, 'node_modules/pkg/i.js');
});
test('sff_UT2_frameWithNoFilename_getsRedactedPlaceholder_keepsOtherFields', () => {
  const f = outFrames(eventWithFrames([{ function: 'process.processTicksAndRejections', in_app: false, lineno: 95, platform: 'node:javascript' }]))[0];
  assert.strictEqual(f.filename, '[redacted]');
  assert.strictEqual(f.function, 'process.processTicksAndRejections');
  assert.strictEqual(f.in_app, false);
  assert.strictEqual(f.lineno, 95);
  assert.strictEqual(f.platform, 'node:javascript');
});
test('sff_UT3_outsideRepoNonStringAndNonObjectFrames_allGetPlaceholder', () => {
  const frames = [{ filename: 'node:internal/process/task_queues' }, { filename: '/tenants/' + seed + '/a.js' }, { filename: '/home/mysrc/a.js' },
    { filename: 123 }, { filename: null }, null, 'str', 42];
  const f = outFrames(eventWithFrames(frames));
  assert.strictEqual(f.length, frames.length);
  f.forEach((fr, i) => { assert.strictEqual(typeof fr, 'object'); assert.strictEqual(fr.filename, '[redacted]', 'frame ' + i); });
});
test('sff_UT4_canariesInPathLikeFields_neverReachTheOutput', () => {
  const c = 'canary-' + seed;
  const frames = [{ filename: '/tenants/' + c + '/a.js', abs_path: '/tenants/' + c + '/a.js', module: c, function: 'f ' + c, context_line: c, pre_context: [c], post_context: [c] }, { module: c }];
  const out = ec.scrubEvent(eventWithFrames(frames), 'production');
  assert.ok(!JSON.stringify(out).includes(c), 'canary leaked');
  assert.strictEqual(out.properties.$exception_list[0].stacktrace.frames[0].filename, '[redacted]');
});
test('sff_UT6_realCapturedShapes_schemaCheckTrueAfterFalseBefore', () => {
  const scrubbed = ec.scrubEvent(eventWithFrames(_fx.frames.map(x => Object.assign({}, x))), 'production');
  assert.strictEqual(everyFrameHasFilename(scrubbed), true);
  // Negative control: the OLD frame logic (filename kept only when repo-relative, otherwise omitted) must fail the check.
  const oldStyle = JSON.parse(JSON.stringify(scrubbed));
  oldStyle.properties.$exception_list[0].stacktrace.frames.forEach(fr => { if (fr.filename === '[redacted]') delete fr.filename; });
  assert.strictEqual(everyFrameHasFilename(oldStyle), false, 'the check must fail for frames with no filename');
});

```

(UT5, "the whole existing file still passes", is satisfied by running the file; it needs no new test.)

- [ ] **Step 4: Run, must fail**

```bash
node tests/check-coha-s5-error-capture.js
```

Expected: `sff_UT2`, `sff_UT3`, `sff_UT6` and `scrubEvent_filename_keptOnlyWhenRepoRelative` print `FAIL`; `sff_UT1` and `sff_UT4` may pass (UT4 passes today because nothing leaks; its placeholder assertion on frame 0 fails). Final line `N passed, 4 failed` or more. If UT2, UT3 or UT6 pass, stop: the test is wrong.

- [ ] **Step 5: Check ASCII, commit**

```bash
node -e "const t=require('fs').readFileSync('tests/check-coha-s5-error-capture.js','utf8');console.log('non-ascii',(t.match(/[^\x00-\x7F]/g)||[]).length)"
git add tests/fixtures/sff-s1-posthog-frames.json tests/check-coha-s5-error-capture.js
git commit -m "test: sff-s1 frame filename tests and fixture (red)"
```

Expected: `non-ascii 0` (the file already had the same count before; if it was not 0, compare with `git show HEAD:tests/check-coha-s5-error-capture.js` and add no new ones).

---

## Task 2: End-to-end test IT1 through the real createApp (red)

Model class: `balanced`. Covers AC4.

**Files:** Modify `tests/check-coha-s5-error-capture.js`

- [ ] **Step 1: Append** below the Task 1 tests, still above the runner comment:

```js
test('sff_IT1_throwingRequest_sinkEventEveryFrameHasFilename', async () => {
  const sink = await sinkLib.start(); let ch;
  try {
    ch = await spawnChild({ POSTHOG_KEY_PROD: FAKE_PROD, POSTHOG_HOST: sink.url });
    const r = await get(ch.port, '/boom/' + seed);
    assert.strictEqual(r.status, 500);
    assert.ok(await waitFor(() => sink.events.length >= 1, 5000), 'no event reached the sink within 5s');
    await new Promise(r2 => setTimeout(r2, 300));
    assert.strictEqual(sink.events.length, 1);
    assert.strictEqual(everyFrameHasFilename(sink.events[0]), true, 'a frame reached the sink without a filename');
  } finally { if (ch) await ch.stop(); await sink.stop(); }
});
```

- [ ] **Step 2: Run, must fail**

```bash
node tests/check-coha-s5-error-capture.js
```

Expected: `sff_IT1_...` prints `FAIL ... a frame reached the sink without a filename`. If it PASSES, the real stack has no non-repo frame and the test is vacuous: stop, report, and make the child throw from inside an async callback so Node internals appear in the stack (change only the new test or add a new route to the existing helper `tests/helpers/error-capture-child.js`, not production code).

- [ ] **Step 3: Commit**

```bash
git add tests/check-coha-s5-error-capture.js
git commit -m "test: sff-s1 end-to-end frame filename check through createApp (red)"
```

---

## Task 3: The fix in scrubFrame (green)

Model class: `balanced`. Covers AC1 to AC4.

**Files:** Modify `src/web-ui/modules/error-capture.js`

- [ ] **Step 1: Add the constant** after the line `const MAX_ROUTE_SEGMENTS = 8;` (line 25):

```js
const REDACTED_FILENAME = '[redacted]';  // sff-s1: PostHog requires a string filename on every frame; this fixed value is the only thing sent when the real path must not be
```

- [ ] **Step 2: Change `scrubFrame`.** Replace

```js
  if (!f || typeof f !== 'object') return g;
```
with
```js
  if (!f || typeof f !== 'object') { g.filename = REDACTED_FILENAME; return g; }
```

and, immediately after the `['filename', 'abs_path'].forEach(...)` block (before the comment that begins `// coha-s5 review round 3`), add:

```js
  if (typeof g.filename !== 'string') g.filename = REDACTED_FILENAME;  // keep the key, never the value
```

- [ ] **Step 3: Run, must pass**

```bash
node tests/check-coha-s5-error-capture.js
```

Expected: `0 failed` and a total of 77 + 6 = 83 passed (UT1, UT2, UT3, UT4, UT6 and IT1 are the 6 new tests).

- [ ] **Step 4: Run the neighbouring files and ASCII check**

```bash
node tests/check-coha-s6-error-bridge.js
node -e "const t=require('fs').readFileSync('src/web-ui/modules/error-capture.js','utf8');console.log('non-ascii',(t.match(/[^\x00-\x7F]/g)||[]).length)"
```

Expected: coha-s6 `83 passed, 0 failed, 7 skipped`; `non-ascii 0` (compare with `git show HEAD:src/web-ui/modules/error-capture.js` if not 0).

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/modules/error-capture.js
git commit -m "fix: keep a placeholder filename on every scrubbed stack frame so PostHog accepts the events"
```

---

## Self-review

- Every AC has a task: AC1 (UT1 to UT3, Task 1), AC2 (UT4 and the whole file, Tasks 1 and 3), AC3 (UT6, Task 1), AC4 (IT1, Task 2), AC5 and AC6 (live, after merge, not in this plan).
- Tasks 1 and 2 are red before Task 3 turns them green (checked by the expected outputs).
- No scope beyond the story: one constant, two lines in `scrubFrame`, tests, one fixture.
- No adapter introduced, so no D37 wiring task is needed.
- Production deploy and the staging verification are NOT tasks here (operator, after merge).
