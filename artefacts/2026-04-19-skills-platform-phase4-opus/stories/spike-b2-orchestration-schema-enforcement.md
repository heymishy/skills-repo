## Story: Spike B2 — Evaluate orchestration framework and structured output schema validation as enforcement mechanisms

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4-opus/epics/e1-governance-extractability-enforcement-selection.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

## User Story

As a **tech lead at work (Craig's context)**,
I want to **see empirical evidence of whether orchestration frameworks and structured output schema validation provide genuine per-invocation enforcement**,
So that **the enforcement mechanism selection covers the full design space identified in the Phase 4.5 reference document, not just the CLI and MCP candidates**.

## Benefit Linkage

**Metric moved:** M2 (Consumer confidence — unassisted team member onboarding)
**How:** Consumer confidence depends on selecting the best enforcement mechanism from the full candidate set. If orchestration or schema validation is superior to CLI/MCP but not evaluated, the platform ships a suboptimal mechanism and consumer trust suffers. This spike completes the evidence set needed for an informed selection.

## Architecture Constraints

- **C11 (no persistent hosted runtime):** Orchestration frameworks (e.g. Azure Foundry) may require a persistent hosted runtime — this constraint is acknowledged. Per the decisions.md entry (2026-04-19, ARCH), the C11 ADR gate applies at consumer shipment, not during spike exploration. This spike may evaluate and prototype orchestration mechanisms freely; the ADR is required before any such mechanism ships to consumers.
- **C4 (human approval gate):** Any enforcement mechanism must preserve human review for SKILL.md/POLICY.md/standards changes
- **C5 (hash-verified skill files):** Schema validation must work with hash-verified content — validation rules cannot require runtime modification of skill files
- **ADR-012 (platform-agnostic):** Orchestration mechanism must be evaluated for portability — not locked to a single vendor

## Dependencies

- **Upstream:** Spike A (governance extractability) — enforcement has no content to enforce if extraction is not feasible
- **Downstream:** synthesise-enforcement-recommendation depends on this spike's verdict alongside Spike B1's verdict

## Acceptance Criteria

**AC1:** Given at least one orchestration framework candidate (identified from the Phase 4.5 reference document's mechanism space), When I prototype a skill invocation where the orchestration framework mediates between the operator's request and the agent's execution, Then the prototype demonstrates whether the framework successfully constrains the agent's execution path (the agent cannot produce output that skips prescribed steps) or fails to constrain it.

**AC2:** Given the structured output schema validation mechanism, When I prototype a skill invocation where the agent's output is validated against a JSON schema before being accepted as a valid skill execution result, Then the prototype demonstrates whether schema validation catches violations (agent output that skips steps or omits required fields is rejected) or misses them (the agent produces schema-conformant output that hides a skill violation — the exact failure mode documented in the discovery).

**AC3:** Given the orchestration prototype from AC1 involves a hosted runtime component, When I document the C11 constraint impact, Then the documentation includes: (a) whether the orchestration mechanism requires persistent hosting or can operate ephemerally, (b) the specific C11 ADR scope that would be triggered if this mechanism ships to consumers, and (c) whether the mechanism can operate in a local-only mode as a fallback.

**AC4:** Given the evidence from AC1, AC2, and AC3, When I write the spike verdict for each mechanism, Then each verdict is one of: VIABLE, PARTIAL, or NOT VIABLE (same scale as Spike B1). Each verdict includes the prototype evidence and documents the C11 impact explicitly.

## Out of Scope

- Evaluating CLI prompt injection or MCP tool boundary — that is Spike B1
- Building a production-grade orchestration or schema validation implementation — spike produces prototype-quality evidence only
- Resolving the C11 ADR — that belongs to the shipment phase, not the spike phase
- Resolving the enforcement mechanism selection — that is the synthesise-enforcement-recommendation story

## NFRs

- **Security:** Prototype code must not embed credentials; spike artefact must not contain API keys (MC-SEC-02). If Azure Foundry is prototyped, no subscription keys in committed artefacts.
- **Performance:** None — prototype need not be optimised
- **Accessibility:** None — no UI component

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable — orchestration mechanisms may introduce C11 complexity that reshapes the recommendation; schema validation may expose the same false-conformance problem the discovery identified

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

---

## Capture Block

### Metadata

| Field | Value |
|-------|-------|
| experiment_id | exp-phase4-sonnet-vs-opus-20260419 |
| model_label | claude-opus-4-6 |
| cost_tier | high |
| skill_name | definition |
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/stories/spike-b2-orchestration-schema-enforcement.md |
| run_timestamp | 2026-04-19T18:50:00Z |

> **Security note:** `model_label` is a descriptive string only (MC-SEC-02).

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 3 |
| constraints_inferred_count | 4 |
| intermediates_prescribed | 1 |
| intermediates_produced | 1 |

**files_referenced:**

- artefacts/2026-04-19-skills-platform-phase4/discovery.md
- artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md
- artefacts/2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md
- artefacts/2026-04-19-skills-platform-phase4/decisions.md

### Fidelity self-report

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| AC coverage | 5 | 4 ACs covering orchestration test, schema validation test, C11 impact documentation, verdict format |
| Scope adherence | 5 | Two mechanisms only; C11 acknowledged per decisions.md without resolving it |
| Context utilisation | 5 | Decisions.md C11 clarification incorporated; Phase 4.5 mechanism space used; discovery false-conformance failure mode referenced |

### Backward references

- target: artefacts/2026-04-19-skills-platform-phase4/discovery.md
  accurate: yes
- target: artefacts/2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md
  accurate: yes
- target: artefacts/2026-04-19-skills-platform-phase4/decisions.md
  accurate: yes

### Operator review

| Field | Value |
|-------|-------|
| context_score | |
| linkage_score | |
| notes | |
| reviewed_by | |
