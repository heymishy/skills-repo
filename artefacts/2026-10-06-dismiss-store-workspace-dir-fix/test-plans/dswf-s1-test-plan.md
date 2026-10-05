## Test Plan: dismissed-signals-store's _persist() must create its parent directory before writing

**Story reference:** artefacts/2026-10-06-dismiss-store-workspace-dir-fix/stories/dswf-s1-create-parent-dir-before-persist.md
**Epic reference:** None — short-track
**Test plan author:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-06

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`. This story's own tests extend the existing dedicated test file `tests/check-sptu-s4-signals-dismiss.js` (not a new file — the module under test is `sptu-s4`'s own, and the existing file already has the right fixtures/helpers, including `makeTempFilePath()`).

**Real architecture grounding (confirmed by direct code read and live production log, 2026-10-06):**
- `src/web-ui/modules/dismissed-signals-store.js`'s `createFsDismissedSignalsStoreAdapter(filePath)`'s inner `_persist()` function (currently line 81) calls `fs.writeFileSync(filePath, ...)` directly, with no directory-existence check.
- Real production stack trace (via `fly logs --app wuce-staging --no-tail`, 2026-10-05) confirms the exact failure: `ENOENT: no such file or directory, open '/app/workspace/dismissed-signals.json'` at `_persist` → `dismiss` → `handlePostDismissSignal`.
- The fix pattern is already established twice in this codebase: `src/web-ui/server.js:2750` (`_fsForDurable.mkdirSync(_path.dirname(durableArtefactAbsPath), { recursive: true })`) and `src/web-ui/modules/reference-validator.js:54` (`fs.mkdirSync(refDir, { recursive: true })`).
- `makeTempFilePath()` (already in `tests/check-sptu-s4-signals-dismiss.js`) builds a path directly under `os.tmpdir()` — to test AC1 (missing directory), a new helper is needed that builds a path under a NESTED, not-yet-existing subdirectory of `os.tmpdir()`, since the existing helper's target directory (`os.tmpdir()` itself) always already exists.

**E2E/browser-layout detection (Step 3a):** N/A — this is a pure Node module fix, no rendered UI change. AC4 (real staging re-verification) is explicitly a live/manual check, not an automated E2E spec — tracked as a post-deploy verification step, not a Playwright test.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Write succeeds when the parent directory does not exist | 1 test | — | — | — | — | 🟢 |
| AC2 | Write behaviour unchanged when the parent directory already exists | 1 test | — | — | — | — | 🟢 |
| AC3 | All 14 pre-existing sptu-s4 tests still pass | — | — | — | — | — | 🟢 (regression — reuses the existing suite unchanged) |
| AC4 | Real staging re-verification: a real dismiss succeeds post-deploy, no new ENOENT in logs | — | — | — | ✅ Manual (post-deploy) | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Real temp files/directories under `os.tmpdir()` — no mocking of `fs`, since the whole point of this fix is real filesystem directory-creation behaviour.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A path under a nested, not-yet-existing temp subdirectory (e.g. `os.tmpdir()/dswf-s1-<random>/nested/dismissed-signals.json`) | Real temp dir | None | The nested subdirectory must NOT be pre-created — that is the whole point of the test |
| AC2 | A path under `os.tmpdir()` directly (already exists) | Real temp dir | None | Confirms no regression for the common case |
| AC3 | `tests/check-sptu-s4-signals-dismiss.js`'s own existing fixtures | Synthetic | None | Regression only, no new fixtures |
| AC4 | Real `wuce-staging` signal data | Real staging | None | Manual, post-deploy, performed via Claude-in-Chrome + `fly logs` |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### dismiss() succeeds and persists when the target file's directory does not exist yet

- **Verifies:** AC1
- **Precondition:** A path built as `path.join(os.tmpdir(), 'dswf-s1-test-' + Date.now() + '-' + Math.random().toString(36).slice(2), 'nested', 'dismissed-signals.json')` — the intermediate directories do NOT exist
- **Action:** Call `createFsDismissedSignalsStoreAdapter(thatPath).dismiss('some-key')`
- **Expected result:** No exception thrown; `fs.existsSync(thatPath)` is `true` afterward; a second adapter instance pointed at the same path reports `isDismissed('some-key') === true` (proves the write actually landed, not just that the call didn't throw)
- **Edge case:** Yes — this is the exact production failure mode, reproduced directly

### dismiss() behaves identically when the target directory already exists

- **Verifies:** AC2
- **Precondition:** `makeTempFilePath()`'s existing pattern (a path directly under `os.tmpdir()`, which always already exists)
- **Action:** Call `createFsDismissedSignalsStoreAdapter(thatPath).dismiss('some-key')`
- **Expected result:** Identical behaviour to before this fix — no exception, file written, key persisted. (This test already exists in spirit via the current "Real persistence" test; this plan's addition specifically confirms `mkdirSync` being called unconditionally does not change behaviour when the directory is already present.)
- **Edge case:** No — this is the common-case regression guard

---

## Integration Tests

None — this is a pure module-level fix with no new route/handler behaviour. AC3's regression coverage is the full existing `tests/check-sptu-s4-signals-dismiss.js` suite (14 tests, already integration-level for the route-dispatch cases), re-run unchanged.

---

## NFR Tests

### Performance — mkdirSync adds no measurable overhead to the existing write path

- **NFR addressed:** Performance
- **Measurement method:** No dedicated test — `fs.mkdirSync` with `{ recursive: true }` on an already-existing directory is a single fast syscall (documented Node.js behaviour), well within the existing `<100ms` render-path budget this story's own call sites are not even part of (this fix lives in the POST dismiss/undismiss path, not the GET render path `sptu-s4`'s own NFR-Performance test already covers).
- **Pass threshold:** N/A
- **Tool:** N/A

---

## Out of Scope for This Test Plan

- A broader audit of other file-write call sites in this codebase for the same missing-`mkdirSync` gap — named explicitly as a follow-up `/improve` candidate in the story's own Out of Scope section, not this test plan's job.
- Any Dockerfile-level test (e.g. a container-build-and-run smoke test) — the story's own Architecture Constraints explicitly reject the Dockerfile-change approach; the fix is verified at the module level plus a real manual staging check (AC4).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC4 (real staging re-verification) has no automated test of its own | Deliberately manual — the whole premise of this story is that automated/local tests did not catch the original bug; a second round of purely-automated-only verification would not actually close that gap | Performed live via Claude-in-Chrome against `https://wuce-staging.fly.dev` plus a real `fly logs` check, after this fix deploys — tracked explicitly at `/verify-completion` and `/definition-of-done`, not skipped |
