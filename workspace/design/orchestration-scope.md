# Orchestration Scope Definition

**Status:** Design — not implemented
**Date:** 2026-05-12
**Author:** Session 3 design phase

---

## Purpose

This document defines the scope of orchestration problems that emerge when the evaluation programme scales beyond single-repo, single-experiment operation. Two distinct problems are named here: parallel eval runs across squads (EXP-003 context), and constraint propagation tracking (CPF metric). Neither is in scope for implementation in the current session — this document frames them for future design work.

---

## Problem 1: Parallel eval runs across squads

### Context

EXP-001 and EXP-002 are single-repo experiments: one operator, one model pair, one skill target, run sequentially. EXP-003 is the first multi-squad experiment: multiple squads (potentially in different delivery repos) running the same corpus cases with different model configurations, with results aggregated into a fleet-level scorecard.

### The orchestration problem

When multiple squads run the same experiment in parallel, five co-ordination problems emerge:

1. **Run ID collision:** If two squads both create `EXP-003-run-1/`, they overwrite each other's results when scores are aggregated.
2. **Rubric drift:** If one squad is on rubric version 1.1 and another on 1.0, their scores are not comparable. Aggregating them produces a misleading fleet average.
3. **Judge model divergence:** If squads use different judge models (or different API versions of the same model), the scores are not comparable even with the same rubric.
4. **Result aggregation latency:** Squads complete runs at different times. The fleet scorecard must be updatable incrementally, not only when all squads have completed.
5. **Experiment closure:** Who decides when EXP-003 is closed and the results are final? Without a co-ordination authority, experiments can remain open indefinitely.

### Proposed orchestration model (not yet designed)

The scope of the solution is bounded by three constraints:
- No central server (the fleet model is distributed — each squad has their own repo)
- No new external dependencies (existing constraint: zero npm dependencies beyond stdlib)
- Human authority at phase boundaries (no automated experiment closure)

A candidate model (to be designed in a future session):
- Experiment manifests are published to a shared location (the fleet state file or a dedicated `workspace/experiments/` artefact in the skills-upstream repo)
- Each squad writes results to `workspace/experiments/<EXP-ID>/runs/<squad-id>-run-<n>/` — squad ID prevents collision
- The fleet dashboard aggregates by reading all matching run directories (pull model, not push)
- Rubric version and judge model are embedded in each result file and checked at aggregation time; mismatches are flagged but not rejected
- Experiment closure is a human-operated `/improve` invocation that reads the full experiment folder and writes a final scorecard

### What this is not

This is not a workflow orchestration system (no Airflow, no queue, no message broker). It is a file-naming and aggregation convention. The "orchestration" is achieved by directory structure and a read-at-aggregation-time pull model.

---

## Problem 2: Constraint propagation tracking (CPF metric)

### Context

The RBNZ framing document (see `outcomes-rbnz-framing.md`) identifies that the grader scores whether constraints were surfaced at discovery, not whether they were resolved through the delivery pipeline. A discovery artefact can correctly surface data-residency and retention constraints (score: 1.0 on D7) and then lose those constraints at definition phase — they do not appear in any story acceptance criterion, and no technical constraint is written into the architecture guardrails.

### The CPF metric

CPF (Constraint Propagation Fidelity) measures whether a constraint that was named at discovery survives into the delivery artefacts that follow. It is a cross-artefact signal, not a single-artefact score.

Defined as:

```
CPF = (constraints present in delivery artefacts) / (constraints named in discovery artefact)
```

A CPF of 1.0 means every constraint named at discovery was carried forward into at least one of: story acceptance criteria, architecture guardrails, or technical constraints in the DoR. A CPF of 0.0 means no constraints survived.

### The orchestration problem

CPF cannot be measured by the single-artefact grader. It requires:
1. A constraint extraction pass on the discovery artefact (which constraints were named?)
2. A constraint matching pass on the downstream artefacts (do these constraints appear?)
3. A cross-artefact join (which named constraints have a downstream match?)

Step 3 is a multi-artefact co-ordination problem. It requires knowing the full artefact chain for a feature: discovery → stories → DoR → architecture guardrails. This chain is available in `pipeline-state.json` via the `artefact` fields on each story and feature.

### Proposed measurement approach (not yet designed)

Candidate approach for a future session:
- CPF is computed per feature, not per run
- Input: the feature's discovery artefact + all story artefacts + the DoR contract
- The grader runs a constraint extraction pass on the discovery artefact (list of named constraints)
- The grader then runs a constraint presence pass on each downstream artefact, checking for each named constraint
- Results are written to `workspace/experiments/CPF-<feature-slug>/cpf-result.json`
- The fleet dashboard computes the fleet CPF average from all `CPF-*` result files

### Regulatory significance

In a regulated enterprise context, CPF is the metric that matters most for a model risk management audit. A high discovery quality score (0.80 on the grader rubric) combined with a low CPF (0.30) means the delivery pipeline is discarding regulatory constraints after discovery — the constraint surfacing at discovery was performative, not actionable. This is the failure mode that CPG 220 / BS11 audit processes are designed to detect.

CPF is currently un-measurable with the existing tooling. It is the highest-priority metric to implement after the single-artefact grader reaches v1 production status.

---

## Sequencing recommendation

| Phase | Work | Prerequisite |
|---|---|---|
| EXP-002a | Single-artefact grader, CLI sweep, T1–T5 scoring | ✅ Rubric schema designed (this session) |
| EXP-002b | Self-correction loop (3-pass), grader isolation tests | EXP-002a complete |
| EXP-003 | Multi-squad parallel run, fleet aggregation | EXP-002b complete; squad naming convention agreed |
| CPF-001 | Constraint extraction + matching passes | EXP-002a complete; constraint taxonomy defined |

No parallelism between EXP-003 and CPF-001 is recommended — both require rubric infrastructure that is not yet stable. Attempting both simultaneously would produce incomparable results if the rubric changes mid-experiment.
