# Implementation Plan: Backfill rpc-s1's missing accessibility test and jrf-s1's narrower-than-required regression pass (vcb-s1)

**Story:** artefacts/2026-08-18-verification-coverage-backfill/stories/vcb-s1-backfill-rpc-s1-and-jrf-s1-verification-gaps.md
**Test plan:** artefacts/2026-08-18-verification-coverage-backfill/test-plans/vcb-s1-test-plan.md
**DoR:** artefacts/2026-08-18-verification-coverage-backfill/dor/vcb-s1-dor.md

---

## Task 1: Add the missing NFR-Accessibility test to `rpc-s1`'s suite (AC1)

**Files:** `tests/check-rpc-s1-connect-repo.js`

- New `testNfrAccessibility()` asserting `rpc-connect-owner`, `rpc-connect-repo`, `rpc-create-name` each have a real, non-empty `aria-label`.

**Status:** committed

---

## Task 2: Widen `jrf-s1`'s regression coverage to real production call sites (AC2)

**Files:** `tests/check-jrf-s1-new-feature-redirect.js`

- New `IT6` spawns the 9 test files that actually exercise the real `handlePostProductFeature` production handler and asserts all pass.
- Original `IT5` kept unmodified — this widens coverage, it does not replace the existing test.

**Status:** committed

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
