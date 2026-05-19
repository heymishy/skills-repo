# Definition of Ready: wsm.4 — Journey API GET response shape fix

**Story reference:** artefacts/2026-05-07-web-ui-session-management/stories/wsm.4-get-response-shape-fix.md
**Test plan reference:** artefacts/2026-05-07-web-ui-session-management/test-plans/wsm.4-test-plan.md
**Verification script:** artefacts/2026-05-07-web-ui-session-management/test-plans/wsm.4-test-plan.md (plain-language section)
**Review report:** Short-track — no formal review run. Zero HIGH findings.
**NFR profile:** artefacts/2026-05-07-web-ui-session-management/nfr-profile.md
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-08

---

## Contract Proposal

**What will be built:**
- A single code deletion in `src/web-ui/routes/journey.js`: remove the duplicate `handleGetJourneyState` synchronous function declaration (the one that returns only `{ journeyId, featureSlug, activeSkill, activeSessionId, completedStages, complete }` and sends a 401 on unauthenticated requests).
- The async implementation already on master (returns `{ turns, stage, stages, activeUsers, completedStages, complete }`, redirects to /auth/github on unauthenticated) becomes the sole active handler after the deletion.
- No other files are modified.

**Identifying the duplicate:** Search `src/web-ui/routes/journey.js` for the second occurrence of `function handleGetJourneyState`. The correct (first) declaration is `async function handleGetJourneyState` — do NOT remove this one. Remove the second declaration which is a plain (non-async) `function handleGetJourneyState`.

**What will NOT be built:**
- New tests (all tests already exist and will pass once the duplicate is removed).
- New behaviour — the async handler already implements all required response fields.
- Changes to any file other than `src/web-ui/routes/journey.js`.

**How each AC will be verified:**

| AC | Existing test | Type |
|----|--------------|------|
| AC1 — `turns` is an array in response | wsm2-T2c | Integration |
| AC2 — `stage` is a string in response | wsm2-T2d | Integration |
| AC3 — Viewer sees owner's turns | wsm2-T4b | Integration |
| AC4 — Viewer count 2 after two users poll; drops to 1 after timeout | wsm2-T5b, wsm2-T5c | Unit |
| AC5 — Handler returns a Promise | wsm2-T7c | Unit |
| AC6 — `stages` array with correct navigable flags | wsm3-T1b, T1c, T1d, T1e | Unit |
| AC7 — Session-boundary marker passes through turns | wsm3-T6b, T6c, T6d, T6e | Unit |

**Regression:** Run full test suite (`npm test`). Zero new failures. All 46 currently-passing wsm2 and wsm3 assertions must remain passing.

---

## Contract Review

✅ **Contract review passed** — single deletion, no new code paths, no new dependencies, no schema changes. Root cause fully verified by examining the two function declarations in journey.js.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format | ✅ PASS | Story has As/Want/So format |
| H2 | ≥3 ACs in GWT format | ✅ PASS | 7 ACs, all described in GWT terms in story |
| H3 | Every AC has ≥1 test | ✅ PASS | All ACs covered by existing failing tests in wsm2/wsm3 test files |
| H4 | Out-of-scope populated | ✅ PASS | "No new tests, no new behaviour, no other file changes" explicitly stated |
| H5 | Benefit linkage | ✅ PASS | Collaborative use rate (wsm.2) and Journey completion rate (wsm.3) named |
| H6 | Complexity rated | ✅ PASS | Complexity 1, Stable |
| H7 | No unresolved HIGH findings | ✅ PASS | Short-track — 0 HIGH findings |
| H8 | No uncovered ACs | ✅ PASS | All 7 ACs covered by existing tests |
| H8-ext | Cross-story schema dep | ✅ PASS | Upstream: wsm.2, wsm.3 (both merged). No schema deps. |
| H9 | Architecture constraints populated | ✅ PASS | D37 not applicable (no new adapters). ADR-024 / D41 GET response shape contract — fix restores compliance. |
| H-E2E | CSS-layout ACs | ✅ PASS (N/A) | No CSS-layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md present; no new NFRs introduced |

---

## Warnings

None.

---

## Proceed: YES

All hard blocks pass. No warnings.

---

## Coding Agent Instructions

**Entry condition:** `npm test` shows 14 failures (wsm2: 6, wsm3: 8). All other tests pass.

**Task — single deletion:**

1. Open `src/web-ui/routes/journey.js`.
2. Find the SECOND occurrence of `function handleGetJourneyState` — the synchronous (non-async) one. It returns `{ journeyId, featureSlug, activeSkill, activeSessionId, completedStages, complete }` and sends 401 on unauthenticated. It is approximately 25 lines long.
3. Delete that function declaration entirely (from the `function handleGetJourneyState(req, res) {` line through its closing `}`).
4. Do NOT modify the first (async) occurrence or any other code.
5. Verify: `node tests/check-wsm2-collaborative-sessions.js` → "22 passed, 0 failed". `node tests/check-wsm3-non-happy-path.js` → "38 passed, 0 failed".
6. Run `npm test` and confirm 0 new failures.
7. Commit: `fix(wsm.4): remove duplicate handleGetJourneyState — restore GET response contract`
8. Open a draft PR.

**Files to touch:**
- `src/web-ui/routes/journey.js` — DELETE the duplicate function only

**Files NOT to touch:**
- `tests/` — all test files are already correct; do not modify
- `artefacts/` — do not modify
- `src/web-ui/server.js` — do not modify
- Any other file

**Conflict marker check (D40):** After editing, run `Select-String -Pattern '<<<<<<|======|>>>>>>' src/web-ui/routes/journey.js` — must return zero results before `git add`.
