## Story: Suggest whether a stage revision is material to downstream stages

**Epic reference:** `epics/materiality-aware-downstream-guidance.md`
**Discovery reference:** `artefacts/2026-08-27-revise-earlier-stage/discovery.md`
**Benefit-metric reference:** `artefacts/2026-08-27-revise-earlier-stage/benefit-metric.md`
**Domain:** [web-ui]

## User Story

As an **Operator (solo product owner + engineer running the outer loop)**,
I want to **see the model's judgment on whether my revision to an earlier stage is material (a scope, constraint, or problem-statement change) or minor (wording/clarity only), right after I make it**,
So that **I can decide whether downstream stages need attention without manually re-reading and comparing every later artefact myself**.

## Benefit Linkage

**Metric moved:** Materiality-suggestion acceptance rate
**How:** This story is literally what the metric measures — the suggestion has to exist and be logged before acceptance can be tracked at all.

## Architecture Constraints

None identified beyond ADR-023 (the suggestion must be generated from the actual overwritten disk content from res-s2, not stale in-memory session state) — checked against `.github/architecture-guardrails.md`.

## Dependencies

- **Upstream:** res-s2 (there must be an overwritten artefact to judge)
- **Downstream:** res-s4 consumes this suggestion

## Acceptance Criteria

**AC1:** Given res-s2's overwrite completes for a reopened stage, When the system compares the new artefact content against the pre-revision content, Then a materiality judgment (material or minor) and a one-sentence rationale are presented to the operator in the chat session.

**AC2:** Given the revision changed the Problem Statement, MVP Scope boundary, or a named Constraint, When the materiality judgment runs, Then it returns "material" — these are the fields discovery's MVP scope names as the signal.

**AC3:** Given the revision only changed wording or phrasing with no scope or constraint impact, When the materiality judgment runs, Then it returns "minor".

**AC4:** Given the materiality suggestion is presented, When the operator's session log is inspected, Then the model's suggested classification is recorded (paired with the operator's later choice from res-s4) — satisfying the benefit-metric's measurement method.

## Out of Scope

- Acting on the suggestion (accepting, overriding) — that's res-s4.
- Any downstream artefact regeneration — never in scope for this feature, per discovery's Out of Scope section.

## NFRs

- **Performance:** Materiality judgment adds at most one additional model turn to the existing chat response — no separate blocking API call.
- **Security:** None identified beyond existing chat-turn handling.
- **Accessibility:** Suggestion text follows existing chat message rendering — no new UI component.
- **Audit:** Suggestion and rationale logged per AC4.

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
