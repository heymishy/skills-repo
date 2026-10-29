## Test Plan: Migrate a bounded batch of hand-rolled journey.js test files to the shared fixture

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s2-journey-js-fixture-retrofit-batch.md
**Epic reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/epics/fixture-divergence-closure.md
**Test plan author:** Copilot
**Date:** 2026-10-30

**Test runner (confirmed from `package.json`):** `npm test` → `node scripts/run-all-tests.js` (plain Node.js `assert` + this repo's `test(name, fn)` convention — no Jest/Mocha). Run individually via `node tests/check-<migrated-file>.js` per file, and `node scripts/check-journey-fixture-usage.js <file>` for the structural check.

**Precedent followed:** `tsir-s1`'s own test plan (single-file proof-of-pattern migration) — this story is the same migration mechanism applied to a 3-5 file batch instead of 1 file.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | 3-5 of 16 remaining hand-rolled files migrated, existing assertions pass unchanged | — | 3-5 | — | — | — | 🟢 |
| AC2 | Each migrated file reports 0 findings from `check-journey-fixture-usage.js` | 3-5 | — | — | — | — | 🟢 |
| AC3 | Full regression suite passes with no new failures | — | 1 | — | — | — | 🟢 |
| AC4 | Hand-rolled count drops from 16 to 11-13 | 1 | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Fixtures — the files being migrated are existing, already-committed test files; no new test data is introduced, only the mechanism each file uses to construct its `mockReq`/`mockRes`.
**PCI/sensitivity in scope:** No.
**Availability:** Available now — depends only on `tests/helpers/journey-fixture.js` (`tsir-s1`, already merged) and `scripts/check-journey-fixture-usage.js` (`tsir-s3`, already merged).
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | The exact batch of 3-5 files chosen at implementation time from the 16 remaining hand-rolled `journey.js`-touching files | Fixtures (existing repo files, migrated in place) | None | Batch selection is an implementation-time decision; this plan's tests apply to whichever files are chosen, verified generically below |
| AC2 | `scripts/check-journey-fixture-usage.js`'s own pass/fail signal per migrated file | Fixtures (existing script, `tsir-s3`) | None | |
| AC3 | Full `node scripts/run-all-tests.js` run | Fixtures (existing suite) | None | |
| AC4 | Pre-migration baseline count (16) and post-migration count, both produced by running `check-journey-fixture-usage.js` against every `journey.js`-touching test file | Fixtures (existing script) | None | Pre-migration baseline must be captured once at implementation start, before any file in the batch is edited |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Each migrated file reports 0 findings from the structural fixture-usage check

- **Verifies:** AC2
- **Precondition:** The chosen batch (3-5 files) has been migrated to import `journeyFixture` from `tests/helpers/journey-fixture.js` in place of its own hand-rolled `mockReq`.
- **Action:** For each migrated file: `node scripts/check-journey-fixture-usage.js <file>`
- **Expected result:** Exit code 0, no findings reported, for every file in the batch.
- **Edge case:** No.

### The hand-rolled-file count drops by exactly the batch size

- **Verifies:** AC4
- **Precondition:** Baseline count of 16 captured before migration (via `check-journey-fixture-usage.js` run against every `journey.js`-touching test file, counting non-zero-exit results).
- **Action:** Re-run the same sweep after migration; count files still reporting a hand-rolled-pattern finding.
- **Expected result:** Post-migration count is `16 - [batch size]`, landing in the range 11-13 for a 3-5 file batch.
- **Edge case:** No.

---

## Integration Tests

### Each migrated file's own existing test assertions pass unchanged

- **Verifies:** AC1
- **Components involved:** `tests/helpers/journey-fixture.js` (existing, `tsir-s1`) ↔ each migrated file (existing, edited)
- **Precondition:** Migrated file's hand-rolled `mockReq`/`mockRes` construction is replaced with `journeyFixture(...)` calls, preserving every per-test override the file's existing assertions depend on.
- **Action:** `node <migrated-file-path>` for each file in the batch.
- **Expected result:** Exit code 0, same pass count as each file's own pre-migration baseline.

### Full regression suite passes with no new failures after the batch migration

- **Verifies:** AC3
- **Components involved:** `scripts/run-all-tests.js` ↔ the full test suite including the migrated batch
- **Precondition:** Batch migration complete; pre-migration full-suite baseline captured.
- **Action:** `node scripts/run-all-tests.js`
- **Expected result:** Exit code 0; total pass/fail counts match the pre-migration baseline exactly (migration changes internals, not outcomes).

---

## NFR Tests

None — confirmed with story owner. The story's NFRs section states "None identified" for Performance and Security ("`tests/` only, no `src/` change"), and Accessibility/Audit are not applicable — no UI, no production code path touched.

---

## Out of Scope for This Test Plan

- Testing the remaining 11-13 files beyond this batch — fast-follow (see discovery.md Out of Scope item 1).
- Verifying each migrated file's pre-existing test *intent* is unchanged (only that assertions still pass) — a test-quality pass is explicitly out of scope per the story.

---

## Test Gaps and Risks

None.
