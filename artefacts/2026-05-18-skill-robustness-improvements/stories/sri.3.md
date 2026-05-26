## Story: Add measurement-ready gate to DoD Step 6 for infrastructure stories

**Epic reference:** artefacts/2026-05-18-skill-robustness-improvements/epics/sri-phase1-inner-loop-reliability.md
**Discovery reference:** artefacts/2026-05-18-skill-robustness-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-05-18-skill-robustness-improvements/benefit-metric.md

## User Story

As a **team running `/definition-of-done` on an infrastructure or foundational story**,
I want **Step 6 to ask whether measurement is even possible before requesting a metric signal**,
So that **I can record `not-yet-measured` in under 30 seconds and move on — rather than being asked questions that cannot yet be answered**.

## Benefit Linkage

**Metric moved:** M3 — Infrastructure story DoD Step 6 completion time
**How:** Adding "Is measurement possible yet for this story?" as the first Step 6 question, with a `not-yet-measured` + evidence-note path on "no", eliminates the multi-question confusion cycle on infrastructure stories. The metric target is under 30 seconds for Step 6 on an infrastructure story; the current baseline is >2 minutes with no satisfactory outcome.

## Architecture Constraints

- Platform change policy: this change is to `.github/skills/definition-of-done/SKILL.md` — a governed file requiring PR with platform team review before merge.
- No new `measurementReady` field is added to story artefacts or pipeline-state.json schema (operator-question approach is sufficient — schema change deferred out of scope per discovery).
- The normal Step 6 signal-capture flow for stories where measurement IS possible must be unchanged.

## Dependencies

- **Upstream:** None — independent of sri.1 and sri.2.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `/definition-of-done` is processing Step 6 for a story, When Step 6 reaches that story, Then the first question asked is "Is measurement possible yet for this story? (yes / not yet)" — this question appears before any prompt for a metric value, signal quality, or trend.

**AC2:** Given the operator answers "not yet" to the measurement-ready gate question, When the step processes that story, Then the skill records `not-yet-measured` alongside a brief operator-supplied evidence note (e.g. "no user-facing features shipped yet — infrastructure only") and moves on to the next story in Step 6 without asking for a metric signal, trend, or rating.

**AC3:** Given the operator answers "yes" to the measurement-ready gate question for a story, When the step processes that story, Then the skill proceeds with the normal Step 6 signal-capture flow — unchanged from current behaviour — asking for the metric value, signal quality, and any notes.

**AC4:** Given a DoD artefact is written after Step 6 completes, When a story was processed via the `not-yet-measured` path, Then the artefact records the story's Step 6 outcome as `not-yet-measured` with the supplied evidence note — not blank, not "N/A", and not an error state.

**AC5:** Given Step 6 processes a mix of infrastructure stories (not-yet-measured) and user-facing stories (measurable), When the step runs, Then each story is processed independently — an infrastructure story's `not-yet-measured` outcome does not affect the signal-capture flow for adjacent measurable stories.

## Out of Scope

- Automated detection of infrastructure stories via slug patterns, name heuristics, or story metadata fields — operator answers the gate question manually (rejected in discovery as fragile and repo-specific).
- Adding a `measurementReady` field to story artefacts or pipeline-state.json (operator-question approach is sufficient for Phase 1; schema change is a separate scope item).
- Changing any other Step in `/definition-of-done` — only Step 6 is modified.
- Adding a reminder or follow-up mechanism to revisit `not-yet-measured` stories in a future DoD run (Phase 2 candidate — out of scope here).

## NFRs

- **Performance:** Step 6 completes for a `not-yet-measured` story in under 30 seconds (target from M3).
- **Security:** None identified — text-only change.
- **Audit:** The `not-yet-measured` outcome with evidence note is recorded in the DoD artefact — provides a clear audit trail of why measurement was deferred.
- **Accessibility:** None identified.

## Complexity Rating

**Rating:** 1 — Well understood. A single gate question is inserted before the existing Step 6 signal-capture prompts. The "no" path records two fields and moves on. The "yes" path is unchanged. All in a single SKILL.md file.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
