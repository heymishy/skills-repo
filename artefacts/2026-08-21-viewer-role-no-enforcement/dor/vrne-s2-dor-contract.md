# Contract Proposal: Wire the viewer-write-block gate to Skill session routes

**Story reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s2-skill-sessions.md`
**Date:** 2026-08-22

## What will be built

`src/web-ui/routes/skills.js` updated to call `requireNonViewer` (from `vrne-s1`, `src/web-ui/middleware/require-non-viewer.js`) at 9 call sites: `POST /sessions` (both form-`authGuard` and JSON-`_checkAuth` paths), `POST .../turn`, `POST .../turn-stream`, `POST .../answers`, `POST .../answer`, `POST .../commit` (both paths), `POST /api/skills/:name/execute` (`routes/execute.js`), `POST .../canvas-edit`, `POST .../assumption/:cardId/confirm`.

## What will NOT be built

- No changes to the shared gate itself (`require-non-viewer.js`) — this story only adds call sites, consistent with `vrne-s1`'s own "build once, wire everywhere" design.
- No changes to read-only skill-session routes (session/transcript viewing).
- No changes to the mock-gateway LLM adapter or model-call logic itself — this story only prevents the call from being reached for a `viewer`.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | 2 unit tests (form + JSON session-start paths), mock `role='viewer'`, assert 403 + session-creation function never called | unit |
| AC2 | 4 unit tests (turn/turn-stream/answers/answer), assert 403 + model-call function never invoked | unit |
| AC3 | 3 unit tests (commit form/JSON, execute), assert 403 + artefact-commit/execute function never invoked | unit |
| AC4 | 3 unit tests (engineer/product/admin on turn/commit/execute), assert `next()` called, behaviour unchanged | unit |
| AC5 | 2 unit tests (canvas-edit, assumption-confirm), assert 403 + dispatch function never invoked | unit |
| AC6 | 1 unit test (injectable test logger, same shape as `vrne-s1`'s AC5) | unit |

## Assumptions

- `require-non-viewer.js` (from `vrne-s1`) is DoD-complete and merged before this story's implementation starts — this is a **code-level dependency** (the module and its exported `requireNonViewer` function must exist and behave per its own DoD), not a `pipeline-state.json` field-level dependency. No specific schema field from `vrne-s1`'s pipeline-state entry is read or depended upon by this story's own implementation — hence `schemaDepends: []` below.
- The mock-gateway LLM adapter (this repo's existing staging-safe default) remains wired during test runs, so no real model cost is ever incurred even if a test somehow reached the model call unexpectedly.

**H8-ext declaration:** `schemaDepends: []` — no `pipeline-state.json` field dependency. The Dependencies block names `vrne-s1` as upstream because this story's code imports `vrne-s1`'s module output, not because it reads any specific field from `vrne-s1`'s pipeline-state.json story entry.

## Estimated touch points

**Files:** `src/web-ui/routes/skills.js` (8 call sites), `src/web-ui/routes/execute.js` (1 call site)
**Services:** None external.
**APIs:** None new.
