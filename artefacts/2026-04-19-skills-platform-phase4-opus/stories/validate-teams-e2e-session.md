## Story: Validate Teams E2E session with non-technical user

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4-opus/epics/e3-non-technical-participation.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

## User Story

As a **PM/PO or business lead evaluating the Teams integration**,
I want to **run through a complete session — DoR approval, health check, governance output — in a single Teams conversation with a non-technical user**,
So that **I have evidence that the full non-technical participation flow works end-to-end and C7 is maintained throughout (M3)**.

## Benefit Linkage

**Metric moved:** M3 (Teams bot C7 fidelity — 0 violations in test session)
**How:** This story produces the direct measurement evidence for M3. The E2E session transcript is reviewed for C7 violations. If 0 violations are found, M3 is met. If violations are found, the specific failure points are documented for remediation.

## Architecture Constraints

- **C7 (one question at a time):** This E2E validates that C7 holds across all three interaction types (approval, health summary, governance output) in a single continuous session — not just per-feature unit tests
- **M3 measurement protocol:** The test session must produce a reviewable transcript (Teams conversation export or screenshot sequence) that an independent reviewer can audit for C7 violations

## Dependencies

- **Upstream:** All Epic 3 implementation stories (implement-teams-bot-scaffold, implement-teams-dor-approval, implement-teams-pipeline-health, implement-teams-governance-output)
- **Downstream:** None — this is the E2E validation story; results feed into M3 metric evidence

## Acceptance Criteria

**AC1:** Given all Epic 3 features are deployed, When a test session is conducted with a non-technical user (PM/PO or equivalent persona), Then the session covers: (a) a DoR approval for a test story, (b) a pipeline health query for a test feature, and (c) a governance output retrieval for a test story.

**AC2:** Given the test session from AC1 is completed, When the conversation transcript is reviewed, Then the total count of C7 violations across all three interaction types is 0 — every bot message contains at most one question, and every question received a response before the next question was sent.

**AC3:** Given the test session transcript, When the session summary is written, Then it includes: (a) the total number of bot messages sent, (b) the total number of user responses, (c) the C7 violation count (target: 0), (d) any usability observations from the non-technical user, and (e) the computed M3 pass/fail verdict.

**AC4:** Given the non-technical user completes the session, When they are asked "could you do this without engineering help?", Then their response is recorded as qualitative evidence for the M3 metric.

## Out of Scope

- Load testing or multi-user concurrency testing — this E2E validates a single-user session
- Testing on mobile Teams — desktop Teams only for Phase 4
- Automated regression testing of the Teams bot — this is a manual E2E session; automation is a future story
- Fixing C7 violations found — this story documents them; fixes are separate stories

## NFRs

- **Security:** Test session must use a test story/feature, not real production data; no credentials in the test transcript (MC-SEC-02)
- **Performance:** None — the E2E validates correctness, not speed
- **Accessibility:** Test session should note any accessibility issues encountered by the non-technical user

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — this is a pure validation story; scope is defined by the upstream implementation stories

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/stories/validate-teams-e2e-session.md |
| run_timestamp | 2026-04-19T18:54:00Z |

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
| AC coverage | 5 | 4 ACs: session coverage, C7 audit, session summary with metrics, qualitative evidence |
| Scope adherence | 5 | E2E validation only — no load testing, no mobile, no automation |
| Context utilisation | 5 | M3 measurement directly; C7 validated across all interaction types |

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
