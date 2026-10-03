# Benefit Metric: Refactoring as a First-Class Inner Loop Practice

**Feature slug:** 2026-09-30-refactoring-and-product-health
**Status:** Active
**Metric owner:** Hamish King — Platform maintainer
**Reviewers:** Operator (solo context — W4 RISK-ACCEPT applies)
**Defined:** 1 October 2026
**Linked discovery:** artefacts/2026-09-30-refactoring-and-product-health/clarify.md

---

## Meta-benefit note

This feature is both a platform improvement and a meta-learning exercise — it tests the hypothesis that structured refactor discipline is producible, measurable, and useful within the skills framework. The five metrics below are product metrics for the platform maintainer. They also generate the data needed to decide whether a `/refactor` skill and a granularity experiment are warranted in the next epic.

---

## Metric 1 — Receipt coverage rate

**What we're measuring:** The percentage of tasks in a given feature that end with either a completed `refactorReceipt` entry or an explicit `status: skipped` + `reason` entry in `tddState` in `pipeline-state.json`.

**Baseline:** 0% — no receipts exist today; all refactor steps are silent and indistinguishable from completed ones.

**Target:** ≥80% of tasks per feature have a receipt or an explicit skip reason.

**Minimum validation signal:** ≥50% coverage on the first three features run under the new protocol. Below this threshold, stop and investigate whether the receipt format is too burdensome before continuing.

**Measurement approach:**
- Who: Platform maintainer (automated via `/improve` skill)
- How: `/improve` reads `refactorReceipt` fields from `pipeline-state.json` at each run; computes per-feature rate
- When: Per feature; rolling average across the last five features reported after the fifth feature
- Reported in: `/improve` summary artefact

---

## Metric 2 — Skipped-without-reason rate

**What we're measuring:** The percentage of tasks that have neither a `refactorReceipt` entry nor a `status: skipped` + `reason` — i.e. silent skips, indistinguishable from tasks where the refactor step was never reached.

**Baseline:** 100% — today every skipped refactor is silent; the `refactorReceipt` field does not exist.

**Target:** 0% silent skips — every task ends with either a receipt or an explicit skip reason.

**Minimum validation signal:** ≤20% silent skips on the first three features. Any result below 100% baseline is meaningful progress; 0% is the steady-state target.

**Measurement approach:**
- Who: Platform maintainer (automated via `/improve` and `/workflow`)
- How: `/improve` flags tasks where `tddState` exists but `refactorReceipt` is absent; `/workflow` surfaces these as live signals during delivery
- When: Per feature; reported in `/improve` summary alongside Metric 1
- Reported in: `/improve` summary artefact; `/workflow` live signal during active delivery

---

## Metric 3 — Design lens findings per feature

**What we're measuring:** The count of distinct findings produced by `/implementation-review` Stage 3 (cross-task duplication, emerging abstractions, receipt coherence, patterns in structural changes) per feature.

**Baseline:** Not yet established — Stage 3 does not exist today. The baseline will be set from the first feature run under the new review stage.

**Target:** At least one design-lens finding per feature across the first five features run under the new protocol.

**Minimum validation signal:** At least one finding on two of the first three features. This confirms Stage 3 is producing signal, not noise.

**Measurement approach:**
- Who: Platform maintainer (tech lead role — same person in solo context)
- How: Stage 3 findings written to the review artefact at review time; count tallied by `/improve` from the review artefact
- When: Per feature
- Reported in: Review artefact; `/improve` summary

**Note on unknown baseline:** Because Stage 3 does not exist today, the first feature run under the new protocol establishes the baseline. The target direction is: findings should exist. Whether one per feature is the right steady-state target will be revisited after five features.

---

## Metric 4 — Refactor-caused test failures

**What we're measuring:** The count of test suite failures caused directly by a refactor step — i.e. the suite was green after the green step, a refactor was applied, and the suite failed after the refactor.

**Baseline:** Not yet established — no current tracking mechanism. The baseline is 0 from the moment tracking begins; any failure is a new incident, not a regression from a prior rate.

**Target:** 0 refactor-caused failures per merged feature.

**Minimum validation signal:** 0 failures on the first three features. The target and the minimum are identical here — a single failure means a refactor broke the baseline, which requires immediate revert. There is no acceptable non-zero rate.

**Measurement approach:**
- Who: CI suite (automated); Platform maintainer reviews any `fail` entry
- How: CI suite result after each refactor step recorded in `pipeline-state.json` (`refactorReceipt.testResult: "pass" | "fail"`); a `fail` entry triggers a mandatory revert before the task can close; `/improve` tallies failures across features
- When: Per task (at refactor step); per feature (rollup at DoD)
- Reported in: `pipeline-state.json` per task; `/improve` summary per feature

---

## Metric 5 — Health model design dimension coverage

**What we're measuring:** Whether the design dimension is present and computing a status in the health roll-up for every feature run under the new protocol. This is a coverage metric at v0 — we are measuring whether the signal exists, not whether it scores well.

**Baseline:** 0% — the design dimension is absent from all features today.

**Target:** 100% of features run under the new protocol have a design dimension status in the health roll-up at DoD.

**Minimum validation signal:** Design dimension present on the first feature run under the protocol. If it is absent on the first feature, the implementation is incomplete.

**Measurement approach:**
- Who: Platform maintainer (automated via `/definition-of-done` and `/improve`)
- How: Health roll-up in `pipeline-state.json` confirmed at each DoD; design dimension status computed from Metrics 1–4 inputs (receipt rate, silent skip rate, refactor-caused failures); `/improve` snapshots the dimension at each run to produce a time series
- When: Per feature at DoD; per `/improve` run
- Reported in: `pipeline-state.json` health roll-up; DoD artefact; `/improve` summary

---

## Metric ownership note

All five metrics have the platform maintainer as owner because this is a framework health initiative — there is no separate product or business owner in this context. W4 RISK-ACCEPT (solo operator, no second reviewer) is acknowledged and applies to this feature.

For Tier 1 product metrics in a multi-stakeholder context, at least one reviewer from outside engineering would be required. That condition does not apply here.

---

## Feedback loop and review cadence

- **Per feature:** receipt coverage rate, silent skip rate, refactor-caused failures, and design dimension coverage all computed at DoD and written to `pipeline-state.json`
- **Per `/improve` run:** rolling summaries across the last five features; design dimension time series updated
- **After five features:** revisit whether ≥80% receipt coverage and ≥1 design lens finding per feature are the right steady-state targets, or whether they need adjustment based on delivery experience
- **Pivot trigger:** receipt coverage below 50% on three consecutive features — investigate format burden and consider simplifying the receipt schema before continuing

---

*Instrumentation block (EXP-010)*

```yaml
experiment_id: EXP-010-fable5-model-sweep
model_label: claude-sonnet-4-6
cost_tier: fast
skill_name: benefit-metric
artefact_path: artefacts/2026-09-30-refactoring-and-product-health/benefit-metric.md
run_timestamp: 2026-10-01T12:30:00Z
fidelity_self_report: "Five metrics derived directly from directional indicators in approved discovery. All baselines either established (Metrics 1, 2, 5) or explicitly flagged as unknown with a plan to establish (Metrics 3, 4). Targets are specific and directional. Minimum validation signals are below full targets. Meta-benefit noted. W4 RISK-ACCEPT applied. No metric is a feature delivery output metric."
```