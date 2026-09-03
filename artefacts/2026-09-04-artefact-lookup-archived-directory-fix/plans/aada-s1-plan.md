# Implementation Plan: Feature artefact lookup falls back to the archived directory when the primary path is gone

**Story reference:** artefacts/2026-09-04-artefact-lookup-archived-directory-fix/stories/aada-s1-check-archived-directory-fallback.md
**DoR contract:** artefacts/2026-09-04-artefact-lookup-archived-directory-fix/dor/aada-s1-dor-contract.md
**Worktree:** .worktrees/aada-s1 (branch `feature/aada-s1`)
**Baseline:** 605 files, 1 pre-existing failure (`tests/check-p3.5-validate-trace.js` — confirmed present on master before this branch existed, same known local-environment gap noted in every prior story's DoD this session)

---

## Task 1: Archived-directory fallback (AC1–AC3)

**Sub-steps, in TDD order:**
1. Write `tests/check-aada-s1-archived-directory-fallback.js` (RED) — 3 tests covering AC1–AC3, reusing `check-alrf-s1-artefact-list-repo-root-fallback.js`'s own established `fs.mkdtempSync` real-temp-directory fixture pattern.
2. Fix `listLocalArtefacts` (`src/web-ui/adapters/artefact-list.js`) — check `artefacts/archived/{slug}/` before returning `null`.
3. Confirm GREEN (new tests + `check-alrf-s1-artefact-list-repo-root-fallback.js` + `check-lpmf-s1-artefact-list-merge.js` regression guards).

**Files touched:**
- `src/web-ui/adapters/artefact-list.js`
- `tests/check-aada-s1-archived-directory-fallback.js` (new)

**TDD verification performed:** before committing, the fix was temporarily stashed (`git stash push -u`, reapplied and dropped by SHA per this repo's worktree stash-safety convention) and the new test file re-run against the pre-fix code — confirmed AC2 fails with exactly the expected value (`null` instead of the real archived files), while AC1/AC3's regression guards correctly pass either way.

**Status:** Complete. Committed as `2eac7320` on `feature/aada-s1`.

---

## Verification

- New test file: 8/8 assertions passing.
- `tests/check-alrf-s1-artefact-list-repo-root-fallback.js` (regression guard): 8/8 passing, unmodified.
- `tests/check-lpmf-s1-artefact-list-merge.js` (regression guard): 14/14 passing, unmodified.
- Full suite: 605 files run, 1 failed (the known pre-existing `check-p3.5-validate-trace.js`), 0 new failures.
