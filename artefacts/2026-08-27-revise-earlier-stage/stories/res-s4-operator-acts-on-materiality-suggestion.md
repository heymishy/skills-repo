## Story: Act on a materiality suggestion without auto-triggering downstream changes

**Epic reference:** `epics/materiality-aware-downstream-guidance.md`
**Discovery reference:** `artefacts/2026-08-27-revise-earlier-stage/discovery.md`
**Benefit-metric reference:** `artefacts/2026-08-27-revise-earlier-stage/benefit-metric.md`
**Domain:** [web-ui]

## User Story

As an **Operator (solo product owner + engineer running the outer loop)**,
I want to **choose to flag downstream stages, leave them as-is, or handle it differently after seeing a materiality suggestion**,
So that **I stay in control of blast radius instead of the system silently rippling a change through the rest of the journey**.

## Benefit Linkage

**Metric moved:** Materiality-suggestion acceptance rate; Recurrence of the original blocking pain
**How:** This is the "operator's actual choice" half of the acceptance-rate's paired measurement, and it closes the loop the two operators originally hit — a revision now has a visible, controllable outcome instead of just disappearing.

## Architecture Constraints

None identified beyond the discovery's explicit "no automatic cascade" Out-of-Scope boundary — checked against `.github/architecture-guardrails.md`.

## Dependencies

- **Upstream:** res-s3
- **Downstream:** None — closes the epic

## Acceptance Criteria

**AC1:** Given a materiality suggestion is shown, When the operator chooses "flag downstream stages", Then each downstream stage's step-nav entry displays a visible flag/marker (e.g. "May need review") — no artefact regeneration or content change occurs to those stages.

**AC2:** Given a materiality suggestion is shown, When the operator chooses "leave as-is", Then no flag is applied and no downstream artefact is touched — the choice is recorded but produces no visible system change beyond the log entry.

**AC3:** Given a materiality suggestion is shown, When the operator's chosen action is recorded, Then it is paired in the log with the model's original suggested action from res-s3, in a form that can compute an acceptance rate (matches vs. does not match).

**AC4:** Given the operator has flagged one or more downstream stages, When they later reopen one of the flagged stages via res-s1, Then the flag is visibly cleared/acknowledged once they've viewed it — flags don't persist forever with no resolution path.

## Out of Scope

- Automatic re-running or regenerating any downstream stage's artefact — never in scope per discovery.
- Any new skill or SKILL.md for "handling it differently" — the operator's free-text response in the chat session covers that; no new UI is introduced.

## NFRs

- **Performance:** None identified.
- **Security:** None identified.
- **Accessibility:** Flag markers must not rely on colour alone (icon or text label required) — matches `.github/architecture-guardrails.md`'s mandatory Accessibility constraint.
- **Audit:** Flag-set and flag-cleared events logged with journeyId, stage name, and timestamp.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
