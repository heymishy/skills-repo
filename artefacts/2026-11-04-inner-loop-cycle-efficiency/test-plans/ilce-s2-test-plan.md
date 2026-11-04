## Test Plan: /branch-complete skips the redundant full-suite rerun when a fresh result exists

**Story reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/stories/ilce-s2-branch-complete-freshness-guard.md
**Epic reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/epics/inner-loop-timing-instrumentation.md
**Test plan author:** Copilot
**Date:** 2026-11-04

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Reuses fresh full-suite result, skips rerun | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Reruns when a commit happened since | 1 test | — | — | — | — | 🟢 |
| AC3 | Reruns when prior run was only partial/targeted | 1 test | — | — | — | — | 🟢 |
| AC4 | Appends skip/ran flag to the timing log | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — tests construct their own `verify-completion` timing records and commit-state markers in setup

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A synthetic fresh full-suite `verify-completion` record, no commits since | Generated in test setup | None | |
| AC2 | Same, plus a synthetic commit timestamp after the record | Generated in test setup | None | |
| AC3 | A synthetic `verify-completion` record marked as targeted/partial scope | Generated in test setup | None | |
| AC4 | Either of the above states | Generated in test setup | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Skip condition reuses the result when no commits exist since the last full-suite run

- **Verifies:** AC1
- **Precondition:** A synthetic `pipeline-timings.jsonl` entry showing `/verify-completion` ran the full suite successfully, with a synthetic "no commits since" marker.
- **Action:** Call the freshness-check function for `/branch-complete`'s Step 1.
- **Expected result:** The function returns `{fresh: true}` and the full test suite is not invoked.
- **Edge case:** No.

### Rerun is forced when a commit happened after the last full-suite run

- **Verifies:** AC2
- **Precondition:** Same synthetic record as above, but with a commit timestamp recorded after the `verify-completion` run.
- **Action:** Call the freshness-check function.
- **Expected result:** The function returns `{fresh: false}` and the full suite is invoked.
- **Edge case:** Yes — the one-commit-after-the-fact boundary case.

### Rerun is forced when the last run only covered a targeted/partial file, not the full suite

- **Verifies:** AC3
- **Precondition:** A synthetic record where `/verify-completion`'s most recent run is marked as scope: partial (a single test file), not full-suite.
- **Action:** Call the freshness-check function.
- **Expected result:** The function returns `{fresh: false}` even though no commit happened since — mirroring `/verify-completion`'s own documented criteria exactly (full-suite coverage is required, not just "no changes").
- **Edge case:** Yes — distinguishes "no code changed" from "the prior run didn't cover enough."

### A skip/ran decision is logged to the timing file

- **Verifies:** AC4
- **Precondition:** Either the skip condition (AC1) or a rerun condition (AC2/AC3).
- **Action:** Run `/branch-complete`'s Step 1 logic end to end against each precondition.
- **Expected result:** A record with `{skipped: true}` is appended for the skip case, and `{skipped: false}` for each rerun case.
- **Edge case:** Yes — confirms both branches log correctly, not just the skip path.

---

## Integration Tests

### branch-complete's Step 1 correctly reads verify-completion's own most recent timing record for the same story

- **Verifies:** AC1
- **Components involved:** The timing-log reader (from `ilce-s1`), `/branch-complete`'s Step 1 freshness check.
- **Precondition:** `.github/pipeline-timings.jsonl` contains records for multiple stories, including one `verify-completion` record for the story under test.
- **Action:** Run the freshness check for that specific story.
- **Expected result:** The check correctly isolates and reads only the record for the matching story slug — not a different story's record, even when both exist in the same file.

---

## NFR Tests

### Skip path completes in well under 1 second

- **NFR addressed:** Performance
- **Measurement method:** Time the freshness-check-and-skip path end to end.
- **Pass threshold:** < 1 second (versus the multi-minute full-suite run it replaces).
- **Tool:** `node scripts/run-all-tests.js`'s own timing helper.

---

## Out of Scope for This Test Plan

- Any change to `/verify-completion`'s own freshness-check implementation — this story reads its output, does not modify it.
- Cross-session freshness reuse — explicitly out of scope per the story (freshness is defined by commit-state and run-scope, not session identity).

---

## Test Gaps and Risks

None identified — all 4 ACs map cleanly to a deterministic, testable mechanism after the Run 1 review revision.
