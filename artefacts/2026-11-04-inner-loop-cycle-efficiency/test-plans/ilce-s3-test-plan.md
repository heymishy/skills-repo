## Test Plan: /subagent-execution runs spec-compliance and code-quality review in parallel, with symmetric discard-and-re-dispatch on either reviewer's fix

**Story reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/stories/ilce-s3-parallel-review-dispatch.md
**Epic reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/epics/parallel-review-dispatch.md
**Test plan author:** Copilot
**Date:** 2026-11-04

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Both reviewers dispatched concurrently | — | 1 test | — | — | — | 🟢 |
| AC2 | Both clean → no re-dispatch, both stand | 1 test | — | — | — | — | 🟢 |
| AC3 | Either reviewer's fix discards+re-dispatches the other (symmetric) | 2 tests | — | — | — | — | 🟢 |
| AC4 | Only the post-fix result is recorded as final | 1 test | 1 test | — | — | — | 🟢 |
| AC5 | Active-minutes-per-task is recorded for the first 10 dispatched tasks | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None — all 5 ACs covered. Note: AC5's full validation (comparing against the 22.0-minute baseline across 10 real tasks) can only be confirmed with real post-ship usage data; this test plan verifies the *mechanism* writes the right data, not the eventual outcome number — that is Metric 1's own measurement, tracked in `benefit-metric.md`, not a pre-implementation test gap.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — tests construct synthetic spec-compliance/code-quality result objects

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | N/A — this AC verifies dispatch mechanics, not data | — | None | Covered by an integration-level check of the dispatch call shape |
| AC2 | Synthetic {spec: pass, quality: pass} result pair | Generated in test setup | None | |
| AC3 | Synthetic result pairs with each side failing in turn | Generated in test setup | None | |
| AC4 | Synthetic pre-fix and post-fix result pairs | Generated in test setup | None | |
| AC5 | Synthetic task dispatch records | Generated in test setup | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### decideReviewOutcome returns accept-both when both reviewers pass clean

- **Verifies:** AC2
- **Precondition:** `{specResult: 'pass', qualityResult: 'pass'}`.
- **Action:** Call the decision function with this input.
- **Expected result:** Returns `{action: 'accept-both'}` — no re-dispatch instruction for either side.
- **Edge case:** No.

### decideReviewOutcome returns redispatch-quality when spec requires a fix and quality already passed

- **Verifies:** AC3 (direction 1 — spec-fix invalidates quality's pre-fix result)
- **Precondition:** `{specResult: 'fix-required', qualityResult: 'pass'}`.
- **Action:** Call the decision function.
- **Expected result:** Returns `{action: 'redispatch-quality', discard: 'quality'}` — code-quality's pre-fix result is marked for discard and re-dispatch.
- **Edge case:** No.

### decideReviewOutcome returns redispatch-spec when quality requires a fix and spec already passed

- **Verifies:** AC3 (direction 2 — the symmetric case added at Run 2 review)
- **Precondition:** `{specResult: 'pass', qualityResult: 'fix-required'}`.
- **Action:** Call the decision function.
- **Expected result:** Returns `{action: 'redispatch-spec', discard: 'spec'}` — spec-compliance's pre-fix result is marked for discard and re-dispatch, mirroring the first direction exactly.
- **Edge case:** Yes — this is the case that did not exist before the Run 2 review fix; its absence from the original design was finding `1-M1`.

### The final task record retains only the post-fix result, never the discarded pre-fix one

- **Verifies:** AC4
- **Precondition:** A task that went through the `redispatch-quality` path (from the second test above), with a distinct post-fix quality result supplied.
- **Action:** Build the task's final outcome record from the decision function's output plus the post-fix result.
- **Expected result:** The final record's `qualityResult` field equals the post-fix result exactly; the pre-fix result value does not appear anywhere in the final record (not retained, not nested, not in a history array).
- **Edge case:** Yes — specifically guards against accidentally keeping both results around.

---

## Integration Tests

### Both reviewers are dispatched in the same turn, not sequentially

- **Verifies:** AC1
- **Components involved:** `/subagent-execution`'s dispatch step, the Agent tool call construction.
- **Precondition:** A task has finished implementation and is ready for review.
- **Action:** Inspect the dispatch call(s) issued for review.
- **Expected result:** Both the spec-compliance and code-quality review dispatches appear in the same batch/turn — not as two sequential calls where the second is only issued after the first's result returns.

### A redispatch path produces a final record with only the post-fix result, end to end

- **Verifies:** AC4
- **Components involved:** The decision function, the re-dispatch mechanism, the task's final-state writer.
- **Precondition:** A full simulated run through the `redispatch-spec` path (quality found an issue, spec is re-dispatched post-fix).
- **Action:** Run the full sequence: initial dispatch → decision → discard+re-dispatch → final record write.
- **Expected result:** The final record is internally consistent — it reflects the re-dispatched spec result, not the original pre-fix one, confirmed via the actual write path rather than just the unit-level decision function.

### The first dispatched tasks produce complete active-minutes-per-task data

- **Verifies:** AC5
- **Components involved:** The timing-log append function (from `ilce-s1`), this story's dispatch logic.
- **Precondition:** 3 synthetic task dispatches run through the new parallel-review path.
- **Action:** Read back the resulting `pipeline-timings.jsonl` records for these tasks.
- **Expected result:** Each task's records contain enough information (timestamps for dispatch start and final review completion) to compute an active-minutes-per-task value — confirming the *mechanism* for Metric 1's eventual measurement is in place, not asserting a specific outcome number.

---

## NFR Tests

None — confirmed with story owner. This story's benefit-metric target (sustained ≥10% reduction) is tracked as an ongoing measurement in `benefit-metric.md`, not a pre-implementation NFR threshold test, since it requires real post-ship usage data across 10 tasks to evaluate.

---

## Out of Scope for This Test Plan

- Reducing review depth by Complexity Rating — already rejected with evidence; not retested here.
- Testing spec-compliance or code-quality review's own evaluation logic (what they check) — unchanged by this story.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC5's actual outcome (≥10% reduction) cannot be verified pre-implementation | Requires real usage data across 10 real dispatched tasks post-ship | Tracked as Metric 1 in `benefit-metric.md`'s own feedback loop, not a test-plan gap |
