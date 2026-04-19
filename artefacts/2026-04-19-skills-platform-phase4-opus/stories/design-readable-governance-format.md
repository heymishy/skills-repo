## Story: Design human-readable governance output format

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4-opus/epics/e4-readable-governance-second-line-audit.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

## User Story

As a **business lead or auditor who does not read JSON, YAML, or pipeline-state files**,
I want to **have a defined format for human-readable governance output that converts technical pipeline data into plain-language structured narratives**,
So that **I can understand what the pipeline decided, what evidence it used, and what happens next — without asking an engineer to interpret the output for me (M2)**.

## Benefit Linkage

**Metric moved:** M2 (Consumer confidence — unassisted team member onboarding)
**How:** Consumer confidence extends beyond engineers. If auditors and business leads cannot read pipeline output independently, they remain dependent on engineers for interpretation — which means the platform has not solved the "organisational independence" problem identified in the discovery. A defined readable format is the prerequisite for all rendering stories in this epic.

## Architecture Constraints

- **MC-CORRECT-02 / ADR-003 (schema-first):** The readable output format must be defined as a schema or template before the rendering implementations are built — this is a design story, not an implementation story
- **ADR-012 (platform-agnostic):** The format must be renderable across multiple surfaces — Teams, HTML dashboard, plain text — without surface-specific markup embedded in the data

## Dependencies

- **Upstream:** None — this story can begin immediately (no spike gate); however, it benefits from the trace and gate verdict structures already in the codebase
- **Downstream:** implement-trace-plain-language, implement-gate-verdict-narrative, implement-second-line-audit-export all build against this format definition

## Acceptance Criteria

**AC1:** Given the existing pipeline output structures (trace reports, gate verdicts, review findings), When the human-readable format is defined, Then it includes a template for each output type that specifies: (a) the required sections, (b) the plain-language phrasing rules (no jargon, no bare codes — consistent with the copilot-instructions.md abbreviation expansion rule), and (c) the data fields from pipeline-state.json that map to each section.

**AC2:** Given the format definition from AC1, When a trace report template is instantiated with sample data from a real completed feature, Then the resulting document is comprehensible to a non-technical reader without additional explanation — the reader can identify: what feature was traced, how many links are intact, and what (if anything) is broken.

**AC3:** Given the format definition from AC1, When a gate verdict template is instantiated with sample data, Then the resulting document clearly states: which gate was evaluated, whether it passed or failed, what evidence was used, and what the next step is.

## Out of Scope

- Implementing the rendering logic (code that transforms pipeline data into the format) — that is the subsequent implementation stories
- Surface-specific rendering (Teams, HTML, PDF) — this story defines the format; rendering is per-surface
- Redesigning the underlying pipeline data structures — the format reads from existing structures

## NFRs

- **Security:** Format templates must not expose internal file paths or credentials (MC-SEC-02)
- **Performance:** None — this is a design artefact
- **Accessibility:** Format must be screen-reader friendly — no tables where a list would suffice, no colour-only status indicators (MC-A11Y-01)

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — the pipeline output structures are known; the format is a translation layer

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/stories/design-readable-governance-format.md |
| run_timestamp | 2026-04-19T18:56:00Z |

> **Security note:** `model_label` is a descriptive string only (MC-SEC-02).

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 3 |
| constraints_inferred_count | 2 |
| intermediates_prescribed | 1 |
| intermediates_produced | 1 |

**files_referenced:**

- artefacts/2026-04-19-skills-platform-phase4/discovery.md
- artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

### Fidelity self-report

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| AC coverage | 5 | 3 ACs: format definition with mapping rules, trace report sample, gate verdict sample |
| Scope adherence | 5 | Format design only — no implementation, no surface-specific rendering |
| Context utilisation | 5 | Schema-first constraint, ADR-012, abbreviation expansion rule from copilot-instructions all incorporated |

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
