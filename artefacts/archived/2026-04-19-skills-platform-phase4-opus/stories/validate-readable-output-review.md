## Story: Validate readable output with non-engineer reviewer

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4-opus/epics/e4-readable-governance-second-line-audit.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

## User Story

As a **business lead or auditor reviewing governance output**,
I want to **read the trace summary, gate verdicts, and audit export for a completed feature and confirm whether I can understand them without engineering assistance**,
So that **the team has evidence that the readable output format actually works for its intended audience (M2)**.

## Benefit Linkage

**Metric moved:** M2 (Consumer confidence — unassisted team member onboarding)
**How:** This story produces direct measurement evidence for the readability dimension of M2. If a non-engineer can understand the output, the readable governance objective is met. If they cannot, specific failures are documented for remediation.

## Architecture Constraints

- None specific — this is a validation story that tests the output of upstream implementation stories

## Dependencies

- **Upstream:** implement-trace-plain-language, implement-gate-verdict-narrative, implement-second-line-audit-export — all must be complete to produce the output being validated
- **Downstream:** None — this is the validation story; results feed into M2 metric evidence

## Acceptance Criteria

**AC1:** Given a completed feature with trace summary, gate verdicts, and audit export rendered in the readable format, When a non-engineer reviewer (business lead, PM/PO, or auditor persona) reads the trace summary, Then they can answer: "How many links are intact? Are there any broken links? What is the risk?" — verified by asking them these questions and recording their answers.

**AC2:** Given the same completed feature output, When the reviewer reads a gate verdict narrative, Then they can answer: "Did this gate pass or fail? What was the most significant finding? What happens next?" — verified by asking them these questions.

**AC3:** Given the audit export document, When the reviewer reads it end-to-end, Then they can state: "Does this feature appear governance-compliant based on the evidence in this document?" — and their answer is recorded as qualitative M2 evidence.

**AC4:** Given the reviewer has completed the review, When their feedback is collected, Then it is documented as: (a) a comprehension score (1-5 scale) per section, (b) specific passages that were unclear or confusing, and (c) an overall "could you use this without engineering help?" yes/no verdict.

## Out of Scope

- Fixing readability issues found — this story documents them; fixes are separate stories
- Testing with multiple reviewers — Phase 4 validates with a single non-engineer reviewer; broader testing is Phase 5
- Testing the audit export in an actual audit system — Phase 4 validates comprehension, not system integration

## NFRs

- **Security:** Review materials must use test data, not real production data (MC-SEC-02)
- **Performance:** None — this is a manual review session
- **Accessibility:** Review materials should be tested with screen reader if the reviewer uses one

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable — this is a pure validation story

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/stories/validate-readable-output-review.md |
| run_timestamp | 2026-04-19T18:56:00Z |

> **Security note:** `model_label` is a descriptive string only (MC-SEC-02).

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 3 |
| constraints_inferred_count | 0 |
| intermediates_prescribed | 1 |
| intermediates_produced | 1 |

**files_referenced:**

- artefacts/2026-04-19-skills-platform-phase4/discovery.md
- artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

### Fidelity self-report

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| AC coverage | 5 | 4 ACs: trace comprehension, gate comprehension, audit export comprehension, feedback collection |
| Scope adherence | 5 | Validation only — no fixes, no multi-reviewer, no system integration |
| Context utilisation | 4 | M2 measurement directly; non-engineer persona from discovery |

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
