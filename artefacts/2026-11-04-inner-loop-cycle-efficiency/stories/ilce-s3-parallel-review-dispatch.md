## Story: /subagent-execution runs spec-compliance and code-quality review in parallel, with symmetric discard-and-re-dispatch on either reviewer's fix

**Epic reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/epics/parallel-review-dispatch.md
**Discovery reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/discovery.md
**Benefit-metric reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/benefit-metric.md

## User Story

As an **operator running the inner loop**,
I want **`/subagent-execution` to dispatch spec-compliance review and code-quality review concurrently by default for each task, discarding and re-dispatching whichever reviewer's result was evaluated against pre-fix code whenever the other reviewer required a fix**,
So that **I don't wait through a strictly sequential review pass on the majority of tasks where spec review passes clean**.

## Benefit Linkage

**Metric moved:** Metric 1 — Review-dispatch active time per task
**How:** Removing the unconditional sequential dependency between the two review dispatches directly reduces the active wall-clock time per task for the majority case (spec review passes clean), while the discard-and-re-dispatch step preserves correctness for the minority case.

## Architecture Constraints

- Per the `ASSUMPTION` (resolved) decision logged 2026-11-04 in `decisions.md`: parallel dispatch is safe only with the discard-and-re-dispatch mechanism — pure "run both, keep both results unconditionally" was explicitly rejected as unsafe.
- CLAUDE.md platform change policy: this story edits `skills/subagent-execution/SKILL.md`, ships via PR.

## Dependencies

- **Upstream:** Epic 1 (both stories) should be merged first — this story's own Metric 1 measurement depends on `pipeline-timings.jsonl` existing.
- **Downstream:** None identified.

## Acceptance Criteria

**AC1:** Given a task's implementation is complete, When `/subagent-execution` dispatches review, Then both the spec-compliance reviewer and the code-quality reviewer are dispatched concurrently (in the same message/turn), not sequentially.

**AC2:** Given spec-compliance review passes clean (no fix required), When code-quality review's result is already available, Then both results stand as-is — no re-dispatch occurs, and the task proceeds to the next step using both results.

**AC3:** Given either reviewer (spec-compliance or code-quality) requires a fix, When the fix is applied, Then the *other* reviewer's result (evaluated against the pre-fix code) is discarded, and that other reviewer is re-dispatched against the post-fix code before the task is considered reviewed. This is symmetric by design: a spec-compliance fix invalidates code-quality's pre-fix result exactly as a code-quality fix invalidates spec-compliance's pre-fix result — neither direction is assumed safe to skip.

**AC4:** Given a discard-and-re-dispatch path is taken in either direction, When the task completes, Then only the post-fix result from the re-dispatched reviewer is recorded as that reviewer's outcome — the pre-fix result does not appear anywhere in the task's final record.

**AC5:** Given this story ships, When the first 10 dispatched tasks run through the new parallel path, Then each task's active-minutes-per-task (from `pipeline-timings.jsonl`) is recorded for comparison against the 22.0-minute baseline — this AC verifies the measurement, not a specific outcome number (Metric 1's target is a sustained reduction, not a fixed percentage, per `benefit-metric.md`).

## Out of Scope

- Reducing review depth or skipping either review dispatch by story Complexity Rating — already tested and rejected in the session preceding discovery.
- Any change to what spec-compliance or code-quality review evaluate, or their pass/fail bar.

## NFRs

- **Performance:** No specific latency target beyond the benefit-metric's own target (sustained ≥10% reduction in active-minutes/task) — measured, not assumed.
- **Security:** None identified.
- **Accessibility:** Not applicable.
- **Audit:** AC4's requirement that only the post-fix result is recorded is itself the audit-correctness requirement for this story.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
