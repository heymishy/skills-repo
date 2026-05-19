## Story: Implement trace report as plain-language summary

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4-opus/epics/e4-readable-governance-second-line-audit.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

## User Story

As an **auditor or risk professional reviewing a feature's traceability**,
I want to **read a trace report that explains in plain language which artefacts link together, which links are broken, and what the risk implications are**,
So that **I can assess the feature's governance compliance without reading the raw JSON trace output (M2)**.

## Benefit Linkage

**Metric moved:** M2 (Consumer confidence — unassisted team member onboarding)
**How:** Trace reports are the primary evidence artefact for compliance review. If they require JSON literacy to read, second-line assurance becomes dependent on engineering — undermining organisational independence. Plain-language traces make compliance auditable by the people who need to audit them.

## Architecture Constraints

- **Format defined by design-readable-governance-format:** The rendering logic must conform to the trace report template defined in the format design story
- **ADR-012 (platform-agnostic):** The plain-language output must be surface-agnostic — renderable as markdown, plain text, or Teams message without modification

## Dependencies

- **Upstream:** design-readable-governance-format — the format template must exist before the rendering logic is built
- **Downstream:** implement-teams-governance-output (Epic 3) surfaces this output in Teams; validate-readable-output-review includes this in its review session

## Acceptance Criteria

**AC1:** Given a completed trace report (JSON output from the existing `scripts/trace-report.js`), When the plain-language renderer processes it, Then it produces a markdown document that: (a) states the feature name and trace date, (b) summarises the chain health (e.g. "15 of 17 links verified, 2 broken"), and (c) lists each finding in plain language.

**AC2:** Given a trace report with broken links, When each broken link is described, Then the description includes: what should be linked (e.g. "Story S3 should link to Test Plan TP3"), what is missing or mismatched, and the risk level (HIGH, MEDIUM, LOW) — without using technical identifiers that require looking up another file.

**AC3:** Given a trace report with all links intact, When the summary is produced, Then it clearly states "all links verified — no findings" with the count of links checked and the date of verification.

## Out of Scope

- Modifying the trace engine itself (`scripts/trace-report.js`) — this story adds a rendering layer on top of existing output
- Interactive trace exploration (click-to-drill-down) — that belongs to the dashboard
- Trace chain remediation — the renderer reports, it does not fix

## NFRs

- **Security:** Plain-language output must not expose internal file system paths or credentials (MC-SEC-02)
- **Performance:** Rendering should complete in under 5 seconds for a typical feature trace
- **Accessibility:** Output must use heading hierarchy and lists rather than tables where possible (MC-A11Y-01)

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — the trace output structure is known; this adds a rendering layer

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/stories/implement-trace-plain-language.md |
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
| AC coverage | 5 | 3 ACs: broken-link rendering, finding description, clean-trace path |
| Scope adherence | 5 | Rendering only — no trace engine changes, no interactive exploration |
| Context utilisation | 5 | Existing trace-report.js acknowledged; format design dependency; ADR-012 portability |

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
