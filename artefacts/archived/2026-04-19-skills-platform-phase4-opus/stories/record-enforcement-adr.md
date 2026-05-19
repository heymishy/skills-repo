## Story: Record enforcement mechanism selection as a repo-level ADR

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4-opus/epics/e1-governance-extractability-enforcement-selection.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

## User Story

As a **senior individual engineer (Thomas's context)**,
I want to **read a formal ADR that commits the platform to a specific enforcement mechanism with documented rationale and alternatives considered**,
So that **I can understand the enforcement architecture of the platform I am adopting and trust that the decision is deliberate and reversible if needed (M2)**.

## Benefit Linkage

**Metric moved:** M2 (Consumer confidence — unassisted team member onboarding)
**How:** A formal ADR gives consumers a stable reference point for the enforcement architecture. Without it, the mechanism is an undocumented implementation detail that may change without notice — undermining the confidence needed for team onboarding.

## Architecture Constraints

- **ADR format:** Must follow the established ADR format in `.github/architecture-guardrails.md` — Status, Date, Decided by, Context, Decision, Consequences, Revisit trigger
- **ADR-004 (context.yml):** If the chosen mechanism requires new configuration fields, these must be identified in the ADR and added to `context.yml` in the same commit
- **MC-CORRECT-02 (schema-first):** If the mechanism introduces new `pipeline-state.json` fields, the ADR must reference the schema update requirement

## Dependencies

- **Upstream:** synthesise-enforcement-recommendation — the ADR records the recommendation as a binding decision
- **Downstream:** All Epic 2, 3, and 4 implementation stories reference this ADR as an architecture constraint

## Acceptance Criteria

**AC1:** Given the enforcement mechanism recommendation from the synthesis story, When the ADR is written, Then it is added to `.github/architecture-guardrails.md` in the Active Repo-Level ADRs section with a sequential ADR number and the standard format (Status: Active, Date, Decided by, Context, Decision, Consequences, Revisit trigger).

**AC2:** Given the ADR is written, When I review the Consequences section, Then it explicitly states: (a) what is easier as a result of this decision, (b) what is harder or constrained, and (c) what is off the table — and each consequence is traceable to spike evidence, not opinion.

**AC3:** Given the ADR is written, When I review the guardrails-registry YAML block at the end of `architecture-guardrails.md`, Then a new entry exists for this ADR with `id`, `category: adr`, `label`, and `section: Active ADRs`.

## Out of Scope

- Implementing the chosen enforcement mechanism — the ADR commits the decision; implementation is in Epics 2-4
- Resolving the C11 ADR for orchestration mechanisms — that is a separate ADR triggered at consumer shipment, per the decisions.md entry
- Updating existing ADRs — this story adds a new ADR only

## NFRs

- **Security:** ADR must not contain credentials (MC-SEC-02)
- **Performance:** None
- **Accessibility:** None

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable — the ADR records a decision that has already been made; no new research

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/stories/record-enforcement-adr.md |
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
- .github/architecture-guardrails.md

### Fidelity self-report

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| AC coverage | 5 | 3 ACs covering ADR content, consequences quality, registry entry |
| Scope adherence | 5 | ADR recording only — no implementation |
| Context utilisation | 4 | Existing ADR format and guardrails-registry structure used as reference |

### Backward references

- target: .github/architecture-guardrails.md
  accurate: yes

### Operator review

| Field | Value |
|-------|-------|
| context_score | |
| linkage_score | |
| notes | |
| reviewed_by | |
