# Contract Proposal: dismissed-signals-store's _persist() must create its parent directory before writing

**Story:** artefacts/2026-10-06-dismiss-store-workspace-dir-fix/stories/dswf-s1-create-parent-dir-before-persist.md
**Date:** 2026-10-06

---

## What will be built

- `src/web-ui/modules/dismissed-signals-store.js`'s `createFsDismissedSignalsStoreAdapter(filePath)`'s inner `_persist()` function modified to call `fs.mkdirSync(require('path').dirname(filePath), { recursive: true })` immediately before the existing `fs.writeFileSync(filePath, ...)` call — matching the exact pattern already used in `server.js:2750` and `modules/reference-validator.js:54`.
- A `path` require added to the top of the file (not currently imported).
- 2 new tests added to the existing `tests/check-sptu-s4-signals-dismiss.js` (no new test file).

## What will NOT be built

- Any change to the Dockerfile's `COPY` allowlist — explicitly rejected in the story's own Architecture Constraints and `decisions.md`.
- Any change to `_load()`'s own existing graceful-degradation behaviour (missing/corrupt file → empty set) — that is correct and unrelated to this bug.
- Any change to `isDismissed`/`dismiss`/`undismiss`'s public signatures, or to `server.js`'s own D37 wiring of this adapter.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — write succeeds when parent directory doesn't exist | Unit test: fresh adapter against a path under a not-yet-created nested temp subdirectory | unit |
| AC2 — write behaviour unchanged when directory already exists | Unit test: fresh adapter against a path directly under `os.tmpdir()` | unit |
| AC3 — all 14 pre-existing sptu-s4 tests still pass | Full re-run of `tests/check-sptu-s4-signals-dismiss.js`, unmodified | regression (no new test) |
| AC4 — real staging re-verification | Manual, live, post-deploy: Claude-in-Chrome against `https://wuce-staging.fly.dev` + `fly logs --app wuce-staging --no-tail` check for absence of new ENOENT errors | manual/live |

## Assumptions

- `fs.mkdirSync(dir, { recursive: true })` is a safe, idempotent no-op when `dir` already exists — documented Node.js `fs` module behaviour, not re-verified from first principles, but confirmed by this same pattern already running correctly in production at `server.js:2750`/`reference-validator.js:54` for an unrelated purpose.
- The fix deploys to `wuce-staging` automatically on merge to `master`, per `.github/workflows/staging-deploy.yml`'s own `on: push: branches: [master]` trigger — confirmed directly earlier this session (the `sptu-s4` merge commit `d484bd6e` triggered a real, successful `staging-deploy` run). AC4's real re-verification can happen as soon as that deploy completes post-merge.

## Estimated touch points

**Files:** `src/web-ui/modules/dismissed-signals-store.js` (modified), `tests/check-sptu-s4-signals-dismiss.js` (modified — 2 new tests added)
**Services:** none
**APIs:** none — no route/handler change

---

## Contract Review

Cross-checked against the story's own 4 ACs and the test plan's AC Coverage table — every AC maps to a specific, named test approach matching the test plan exactly. No mismatch found.

**Verdict:** ✅ PASSED — proposed implementation aligns with all ACs.
