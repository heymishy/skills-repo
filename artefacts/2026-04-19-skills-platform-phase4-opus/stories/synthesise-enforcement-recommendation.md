## Story: Synthesise enforcement mechanism spike verdicts into a single recommendation

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4-opus/epics/e1-governance-extractability-enforcement-selection.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

## User Story

As a **tech lead at work (Craig's context)**,
I want to **see a single, evidence-based recommendation for which enforcement mechanism (or combination) the platform should adopt**,
So that **I can understand the rationale before the mechanism is committed as an ADR, and I can plan my squad's adoption based on a known enforcement architecture (M2)**.

## Benefit Linkage

**Metric moved:** M2 (Consumer confidence — unassisted team member onboarding)
**How:** A clear, evidence-based recommendation gives consumers confidence that the enforcement architecture is deliberate and tested — not chosen by default or by availability of a contributor's PR. This directly supports the "problem feels solved, not worked around" directional indicator.

## Architecture Constraints

- **ADR-004 (context.yml single config source):** The recommendation must identify any new `context.yml` fields needed for mechanism configuration
- **ADR-012 (platform-agnostic):** The recommendation must assess portability across agent surfaces (VS Code + Copilot, Claude Code, and future non-technical surfaces)
- **C11 (no persistent hosted runtime):** If the recommendation includes an orchestration mechanism, the C11 ADR requirement must be called out explicitly

## Dependencies

- **Upstream:** Spike B1 (CLI/MCP verdicts) and Spike B2 (orchestration/schema verdicts) — both must be complete before synthesis can begin
- **Downstream:** record-enforcement-adr depends on this recommendation; all Epic 2, 3, and 4 implementation stories are shaped by the chosen mechanism

## Acceptance Criteria

**AC1:** Given the completed verdicts from Spikes B1 and B2, When the synthesis is performed, Then a single recommendation document is produced that: (a) lists all four mechanisms with their verdict (VIABLE / PARTIAL / NOT VIABLE), (b) identifies the recommended mechanism or combination with rationale, and (c) names any mechanisms explicitly rejected and why.

**AC2:** Given the recommendation from AC1, When the document assesses the recommended mechanism against all five constraints (C1, C4, C5, C7, C11), Then each constraint is addressed: the document states whether the recommended mechanism satisfies, partially satisfies, or conflicts with each constraint, with evidence references to the spike prototypes.

**AC3:** Given the recommendation from AC1, When the document assesses compatibility with the navigation flexibility requirement from the discovery (forward, backward, regroup, light track), Then the assessment includes: whether the mechanism preserves multi-path navigation, and any navigation paths that the mechanism restricts.

**AC4:** Given the recommendation from AC1 includes a combination of mechanisms (e.g. CLI + MCP layered enforcement), When the combination is described, Then the document specifies: which mechanism handles which enforcement property (P1 skill-as-contract, P2 active context injection, P3 per-invocation trace anchoring, P4 interaction mediation from the Phase 4.5 reference document), and how they interact without conflict.

## Out of Scope

- Implementing the recommended mechanism — this story produces a recommendation document, not code
- Recording the recommendation as an ADR — that is a separate story
- Evaluating mechanisms not covered by Spikes B1 and B2 (e.g. GitHub Actions hardening is the fifth candidate but was deprioritised in the spike programme)

## NFRs

- **Security:** Recommendation document must not contain credentials (MC-SEC-02)
- **Performance:** None
- **Accessibility:** None

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — the inputs (spike verdicts) are fixed; the output (recommendation) is a synthesis, not new research

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/stories/synthesise-enforcement-recommendation.md |
| run_timestamp | 2026-04-19T18:50:00Z |

> **Security note:** `model_label` is a descriptive string only (MC-SEC-02).

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 3 |
| constraints_inferred_count | 3 |
| intermediates_prescribed | 1 |
| intermediates_produced | 1 |

**files_referenced:**

- artefacts/2026-04-19-skills-platform-phase4/discovery.md
- artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md
- artefacts/2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md

### Fidelity self-report

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| AC coverage | 5 | 4 ACs covering mechanism comparison, constraint assessment, navigation flexibility, combination specification |
| Scope adherence | 5 | Synthesis only — no implementation, no ADR recording |
| Context utilisation | 5 | Phase 4.5 enforcement properties P1-P4 referenced; all 5 constraints checked |

### Backward references

- target: artefacts/2026-04-19-skills-platform-phase4/discovery.md
  accurate: yes
- target: artefacts/2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md
  accurate: yes

### Operator review

| Field | Value |
|-------|-------|
| context_score | |
| linkage_score | |
| notes | |
| reviewed_by | |
