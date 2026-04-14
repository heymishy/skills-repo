# Epic: Cross-Team Trace Registry

**Discovery reference:** artefacts/2026-04-14-skills-platform-phase3/discovery.md
**Benefit-metric reference:** artefacts/2026-04-14-skills-platform-phase3/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

When this epic is complete, the improvement agent can query trace data from multiple squads without a persistent server. Each squad commits `workspace/traces/` JSONL files to their delivery repository. A scheduled CI job aggregates across all registered squads into `platform/traces/` using per-squad directory partitioning. Trace data is no older than 24 hours from the last squad commit. The improvement agent uses the `getTraces(filter)` API to produce cross-squad impact-ranked improvement proposals.

## Out of Scope

- Real-time trace access or streaming — ADR-004 (no persistent server) is preserved. This is a scheduled aggregation model.
- Trace data from non-JSONL formats — OpenTelemetry wire format only in this epic.
- The compliance monitoring report that consumes this aggregated trace data — that is Epic E7, story p3.13.
- The platform-infrastructure repository hosting of `platform/suite.json` — that is Epic E3.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| MM3 — Governance failure reduction | Single-squad only, no cross-team signal | Improvement agent produces cross-squad proposals | Aggregated trace data enables multi-squad failure pattern detection |
| CR1 — T3M1 independent validation | Prerequisite data from individual traces | Cross-team attestation view | Aggregated trace enables audit across all registered squads |

## Stories in This Epic

- [ ] p3.7 — Implement cross-team trace aggregation: per-squad JSONL commit, scheduled CI aggregator, 24h SLA, getTraces() API

## Human Oversight Level

**Oversight:** Medium
**Rationale:** New CI workflow with write access to `platform/traces/`. Must follow ADR-009 (separate trigger and permission scope from the evaluation workflow). Human review required to confirm workflow permission separation.

## Complexity Rating

**Rating:** 2
Aggregation model is well-defined by the discovery. The 24-hour SLA and per-squad partitioning are specified. Main complexity: confirming that all squad registration in `fleet-state.json` provides the repository access needed for the aggregation workflow.

## Scope Stability

**Stability:** Stable
