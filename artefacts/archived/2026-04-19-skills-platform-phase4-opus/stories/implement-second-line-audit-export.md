## Story: Implement second-line audit export

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4-opus/epics/e4-readable-governance-second-line-audit.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

## User Story

As an **auditor or risk professional conducting a second-line assurance review**,
I want to **export a single document per feature that contains the trace summary, all gate verdicts, and the metric signal history — in a format I can file in my audit system**,
So that **I can complete my governance review without requesting multiple files from the engineering team or interpreting pipeline internals (M2)**.

## Benefit Linkage

**Metric moved:** M2 (Consumer confidence — unassisted team member onboarding)
**How:** Second-line independence is a discovery-level requirement. If auditors cannot self-serve their evidence, the platform has not achieved organisational independence — every audit creates an engineering dependency. A self-service audit export directly supports the "problem feels solved" M2 indicator.

## Architecture Constraints

- **Format defined by design-readable-governance-format:** The export assembles multiple plain-language sections into a single document using the templates defined in the format design story
- **ADR-012 (platform-agnostic):** Export format must be markdown (universally readable) with optional PDF rendering — not a proprietary format
- **MC-SEC-02:** Export must not contain API keys, credentials, or internal file system paths

## Dependencies

- **Upstream:** implement-trace-plain-language and implement-gate-verdict-narrative — the export assembles their output into a single document
- **Downstream:** validate-readable-output-review includes the audit export in its review session

## Acceptance Criteria

**AC1:** Given a feature with completed trace and gate verdicts, When the audit export command is run for that feature, Then it produces a single markdown document containing: (a) a feature summary header, (b) the plain-language trace summary, (c) all gate verdicts (DoR, review, DoD) as structured narratives, and (d) the metric signal history from pipeline-state.json.

**AC2:** Given the audit export document from AC1, When the document's table of contents is inspected, Then every section is linked and the document can be navigated by heading — making it suitable for filing in audit management systems.

**AC3:** Given the audit export document from AC1, When a second-line reviewer reads it without additional context, Then they can determine: (a) whether the feature followed the prescribed pipeline sequence, (b) whether any gates were bypassed or had findings, and (c) the current metric signal status — all from the document alone.

**AC4:** Given a feature that is still in progress (not all gates completed), When the audit export is run, Then it produces a partial document that clearly labels which sections are "not yet available" rather than omitting them silently.

## Out of Scope

- PDF rendering — the export produces markdown; PDF conversion is a downstream convenience
- Automated audit filing (submitting to ServiceNow or similar) — export produces the document, filing is manual or a separate integration
- Customisable export templates — Phase 4 ships one format; customisation is Phase 5

## NFRs

- **Security:** Export must strip any credential or token content; internal repo paths must be replaced with relative references (MC-SEC-02)
- **Performance:** Export should complete in under 10 seconds for a typical feature with 5-10 stories
- **Accessibility:** Document must use heading hierarchy and semantic structure (MC-A11Y-01)

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — this assembles output from upstream stories into a single document

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/stories/implement-second-line-audit-export.md |
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
| AC coverage | 5 | 4 ACs: full export content, navigation, self-service readability, partial export handling |
| Scope adherence | 5 | Export only — no PDF, no filing automation, no template customisation |
| Context utilisation | 5 | Second-line independence from discovery; MC-SEC-02; ADR-012; MC-A11Y-01 |

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
