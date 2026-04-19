## Story: Spike D — Validate Teams bot C7 one-question-at-a-time fidelity

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4-opus/epics/e3-non-technical-participation.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

## User Story

As a **PM/PO or business lead who does not use VS Code or GitHub**,
I want to **see a working Teams bot prototype that asks me one question at a time and waits for my answer before proceeding**,
So that **I can evaluate whether this interaction model actually works for my workflow before the team commits to building the full Teams integration (M3, C7)**.

## Benefit Linkage

**Metric moved:** M3 (Teams bot C7 fidelity — 0 violations in test session)
**How:** This spike is the feasibility gate for M3. If the Teams bot prototype violates C7 (asks multiple questions or proceeds without waiting), the entire Epic 3 premise is invalid and must be redesigned or deferred. If the prototype maintains C7 fidelity, Epic 3 can proceed with confidence.

## Architecture Constraints

- **C7 (one question at a time):** The iron constraint for this spike. The Teams bot must present exactly one question per message, wait for the user's response, and only then present the next question. No batching, no multi-question messages, no "click here to skip".
- **C11 (no persistent hosted runtime):** Per the decisions.md entry (2026-04-19, ARCH), the C11 ADR gate applies at consumer shipment, not during spike exploration. The Teams bot prototype may use Azure Bot Service or similar hosted infrastructure for the spike. An ADR will be required before this ships to consumers.
- **External dependency:** An Azure/MS account is a hard prerequisite for this spike (decisions.md entry, 2026-04-19, ASSUMPTION). If unavailable, the spike is DEFER with a clear deferral path.

## Dependencies

- **Upstream:** None — this spike can run in parallel with Spikes A, B1, and B2 if resources allow. However, risk-first ordering places it after the E1 spikes.
- **Downstream:** All Epic 3 implementation stories (implement-teams-bot-scaffold, implement-teams-dor-approval, implement-teams-pipeline-health, implement-teams-governance-output, validate-teams-e2e-session)

## Acceptance Criteria

**AC1:** Given a Microsoft Teams environment (using an Azure/MS account), When a Teams bot prototype is deployed, Then it is reachable as a conversation partner in a Teams chat — the bot responds to a greeting message.

**AC2:** Given the Teams bot prototype is running, When a simulated pipeline interaction is initiated (e.g. a DoR approval question sequence), Then the bot sends exactly one question per message and does not send the next question until the user has responded to the current one.

**AC3:** Given the C7 fidelity test from AC2, When the conversation transcript is reviewed, Then every bot message contains at most one question, and no user message was skipped or timed out — the count of questions equals the count of user responses (0 C7 violations).

**AC4:** Given the bot prototype violates C7 in any test scenario, When the spike verdict is written, Then it documents: (a) the specific violation scenario, (b) whether the violation is a fundamental platform limitation (NOT VIABLE) or a fixable implementation issue (PARTIAL), and (c) what architectural changes would be needed to achieve C7 fidelity.

**AC5:** Given the spike completes, When the verdict is written, Then it is one of: PROCEED (C7 fidelity demonstrated with 0 violations and working prototype), PARTIAL (C7 fidelity achievable but with documented limitations), DEFER (Azure/MS account unavailable or platform limitation discovered — with a clear re-entry path).

## Out of Scope

- Building the full DoR approval flow in Teams — this is a prototype that tests C7 fidelity, not the full approval workflow
- Evaluating Slack, Discord, or other chat platforms — Phase 4 validates Teams only
- Production-grade bot deployment (scaling, monitoring, authentication) — prototype quality only
- Resolving the C11 ADR for the Teams bot — that is a consumer shipment concern, not a spike concern

## NFRs

- **Security:** Bot prototype must not store user credentials; Azure/MS account credentials must not appear in committed artefacts (MC-SEC-02)
- **Performance:** None — prototype need not be optimised
- **Accessibility:** Teams bot messages must be readable by Teams' built-in accessibility features (this is inherent to the Teams platform)

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable — external dependency on Azure/MS account; Teams Bot Framework SDK behaviour for conversational flow is not fully known until prototyped

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/stories/spike-d-teams-c7-fidelity.md |
| run_timestamp | 2026-04-19T18:54:00Z |

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
- artefacts/2026-04-19-skills-platform-phase4/decisions.md

### Fidelity self-report

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| AC coverage | 5 | 5 ACs: bot deployment, C7 fidelity test, transcript verification, violation documentation, verdict |
| Scope adherence | 5 | C7 fidelity validation only — no full approval flow, no other platforms |
| Context utilisation | 5 | C7 and C11 constraints used; decisions.md Azure prerequisite and C11 deferral incorporated; discovery spike exit criteria (working prototype) used |

### Backward references

- target: artefacts/2026-04-19-skills-platform-phase4/discovery.md
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
