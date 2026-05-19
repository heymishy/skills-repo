## Story: Implement gate verdict as structured narrative

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4-opus/epics/e4-readable-governance-second-line-audit.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

## User Story

As a **PM/PO or business lead reviewing a governance gate outcome**,
I want to **read a gate verdict (DoR, review, DoD) as a structured narrative that tells me what was checked, what passed, what failed, and what happens next**,
So that **I can understand the governance outcome without reading the raw DoR/DoD artefact fields or asking an engineer to explain it (M2)**.

## Benefit Linkage

**Metric moved:** M2 (Consumer confidence — unassisted team member onboarding)
**How:** Gate verdicts are the primary governance decision points. If non-technical stakeholders cannot read them, they cannot verify that governance is working — which undermines their confidence in the platform. Structured narratives make gates transparent to all participants.

## Architecture Constraints

- **Format defined by design-readable-governance-format:** The rendering logic must conform to the gate verdict template defined in the format design story
- **ADR-012 (platform-agnostic):** Narrative output must be surface-agnostic
- **Abbreviation expansion rule:** All codes (H1-H9, W1-W5, AC1-ACn) must be expanded on first use, per copilot-instructions.md

## Dependencies

- **Upstream:** design-readable-governance-format — the gate verdict template must exist
- **Downstream:** implement-teams-governance-output (Epic 3) surfaces this in Teams; validate-readable-output-review includes this in its review session

## Acceptance Criteria

**AC1:** Given a completed DoR artefact with hard block and warning results, When the narrative renderer processes it, Then it produces a document that: (a) states the story name and verdict (Proceed / Blocked), (b) lists each hard block by name with its result (pass/fail) and a one-sentence explanation, and (c) lists each warning by name with its status (acknowledged/unresolved).

**AC2:** Given a completed review artefact with findings, When the narrative renderer processes it, Then each finding is described with: the category (e.g. "Architecture — Category E"), the severity, what was found, and what action is recommended — using complete sentences, not codes or abbreviations.

**AC3:** Given a completed DoD artefact, When the narrative renderer processes it, Then the document states: which ACs are confirmed satisfied (with brief evidence), which ACs have deviations (with the deviation description), and whether the overall verdict is "Done" or "Done with observations".

## Out of Scope

- Modifying the underlying DoR, review, or DoD skill logic — this story adds a rendering layer
- Interactive gate exploration — narrative is a static document
- Rendering for gate types not yet implemented (e.g. compliance gates) — Phase 4 covers DoR, review, and DoD only

## NFRs

- **Security:** Narrative must not expose internal file paths or credentials (MC-SEC-02)
- **Performance:** Rendering should complete in under 3 seconds per gate verdict
- **Accessibility:** Output must use heading hierarchy; severity indicators must not rely on colour alone (MC-A11Y-01)

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — gate artefact structures are well-defined; this adds a rendering layer

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/stories/implement-gate-verdict-narrative.md |
| run_timestamp | 2026-04-19T18:56:00Z |

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

### Fidelity self-report

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| AC coverage | 5 | 3 ACs: DoR narrative, review narrative, DoD narrative |
| Scope adherence | 5 | Rendering only — no gate logic changes |
| Context utilisation | 5 | Format design dependency; abbreviation expansion rule; ADR-012; MC-A11Y-01 |

### Backward references

- target: artefacts/2026-04-19-skills-platform-phase4/discovery.md
  accurate: yes

### Operator review

| Field | Value |
|-------|-------|
| context_score | |
| linkage_score | |
| notes | |
| reviewed_by | |
