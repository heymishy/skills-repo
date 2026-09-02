# Implementation Plan: acdg-s1 — Fix the Silent Artefact-Commit Failure in Stage-Completion (AC2 Guard)

**Story:** artefacts/2026-09-01-artefact-commit-durability-gap/stories/acdg-s1.md
**DoR:** artefacts/2026-09-01-artefact-commit-durability-gap/dor/acdg-s1-dor.md (Revision 2)
**Test plan:** artefacts/2026-09-01-artefact-commit-durability-gap/test-plans/acdg-s1-test-plan.md
**Author:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-02

---

## Confirmed mechanism (no further investigation needed)

Root-cause investigation during `/branch-setup` (this feature's first pass) confirmed the fix in full — see `decisions.md`. This plan implements it directly.

## Tasks

1. **Task 1 — 3 unit tests against unmodified code.** Write `tests/check-acdg-s1-commit-guard.js` covering AC1, AC2-revised, AC3-revised. Run against unmodified code first; record actual pass/fail per the TDD note in the test plan (AC1 and AC3-revised expected to PASS already; AC2-revised expected to FAIL).
2. **Task 2 — Implement the fix.** Single change to `journey.js`'s `handlePostGateConfirm` catch block, exactly as specified in the DoR's Coding Agent Instructions.
3. **Task 3 — 2 integration tests.** Full `handlePostGateConfirm` request-level tests for AC2-revised and AC3-revised.
4. **Task 4 — 2 NFR tests.** Call-order assertion (Performance); manual code-review note (Security, documented not automated).
5. **Task 5 — Full regression + sibling regression.** Full suite, plus explicit re-run of `ep1-s1` through `ep1-s6`'s own test files (same `journey.js` file touched).
