# Implementation Plan: ctpr-s1 — Persist a newly-generated CSRF token to Redis immediately, not never

**Story:** artefacts/2026-08-27-csrf-token-not-persisted-across-restart/stories/ctpr-s1-persist-csrf-token-on-generation.md
**Test plan:** artefacts/2026-08-27-csrf-token-not-persisted-across-restart/test-plans/ctpr-s1-test-plan.md
**DoR:** artefacts/2026-08-27-csrf-token-not-persisted-across-restart/dor/ctpr-s1-dor.md
**Worktree:** .worktrees/ctpr-s1 (branch `ctpr-s1`, based on origin/master)

---

## Tasks

### Task 1 — Fix `generateCsrfToken` to persist on generation
- `src/web-ui/middleware/csrf.js`: `require('./session')` and call `persistSession(req.sessionId)` inside the `if (!req.session.csrfToken)` branch, right after minting the new token. Never on the idempotent-reuse path.
- ACs covered: AC1, AC2, AC3.

### Task 2 — Tests
- New file `tests/check-ctpr-s1-csrf-token-persistence.js` covering AC1-AC4 per the test plan.
- Re-run all 8 existing CSRF-focused test files individually (AC5), then the full suite.

---

## Sequencing

Single-file change, single task effectively; split into 2 for clean TDD (write failing tests first if practical, then the fix, matching this repo's RED-GREEN convention).
