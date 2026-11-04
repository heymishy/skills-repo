## Epic: Tasks spend less wall-clock time in review without losing review coverage

**Discovery reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/discovery.md
**Benefit-metric reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

When a task completes implementation in `/subagent-execution`, spec-compliance review and code-quality review run concurrently by default instead of strictly sequentially — and whenever either reviewer requires a fix, the *other* reviewer's result (evaluated against pre-fix code) is discarded and re-dispatched against the post-fix code, so correctness is preserved symmetrically in both directions while the common case (both reviewers pass clean) captures real wall-clock savings.

## Out of Scope

- Reducing review depth or skipping either review dispatch based on story Complexity Rating — already tested and rejected in the session preceding discovery (Complexity-1 stories caught real findings at 44%, higher than Complexity-2's 17%).
- Any change to what spec-compliance or code-quality review check, or their pass/fail bar — this epic changes *when* and *how* they run, not *what* they evaluate (discovery, Out of Scope).
- The timing instrumentation itself — that is Epic 1, and this epic's own metric is measured using Epic 1's output.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| Metric 1 — Review-dispatch active time per task | 22.0 active minutes/task | Sustained ≥10% reduction across the first 10 dispatched tasks measured after shipping | Removes the strict sequential dependency between the two review dispatches for the majority case (spec review passes clean) |

## Stories in This Epic

- [ ] `/subagent-execution` runs spec-compliance and code-quality review in parallel, with discard-and-re-dispatch on spec failure

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Changes the control flow of subagent dispatch in a platform-governed `SKILL.md` — higher behavioral risk than Epic 1's mechanical additions, warrants human review at PR.

## Complexity Rating

**Rating:** 2

<!-- Some ambiguity: the discard-and-re-dispatch mechanism is a new control-flow pattern for this skill, not a mechanical repeat of an existing one. Known unknown: real-world spec-review failure rate once measured (currently estimated from a sample with incomplete Complexity Rating coverage per discovery's Assumptions and Risks). -->

## Scope Stability

**Stability:** Stable

<!-- The mechanism itself (parallel dispatch + discard-and-re-dispatch) was resolved via /clarify before this epic was written — not expected to shift during implementation. -->
